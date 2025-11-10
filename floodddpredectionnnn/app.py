from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
import rasterio
from datetime import datetime, timedelta
import requests
import json

with open("zone_bounds.json") as f:
    zone_bounds = json.load(f)

app = Flask(__name__)
CORS(app)

# -----------------------------------
# 🌧️ FLOOD PREDICTION SETUP
# -----------------------------------
model_bundle = joblib.load("flood_prediction_model_retrained.pkl")
OPENWEATHER_API_KEY = "3bbb7b3c02698b55cbd8a66d69e01f51"

@app.route('/')
def home():
    return render_template("index.html")

def get_zone_from_lat_lon(lat, lon):
    for zone_info in zone_bounds:
        if (zone_info["Lat_min"] <= lat <= zone_info["Lat_max"] and
            zone_info["Lon_min"] <= lon <= zone_info["Lon_max"]):
            return zone_info["Zone"]
    return None  # Or a default zone if no match found

@app.route('/predict', methods=['POST'])
@app.route('/predict', methods=['POST'])
def predict_flood():
    data = request.get_json()

    lat = data.get("Latitude")
    lon = data.get("Longitude")

    # Validate latitude and longitude presence
    if lat is None or lon is None:
        return jsonify({"error": "Latitude and Longitude required"}), 400

    # Auto-assign zone if missing or invalid
    zone = data.get("Zone")
    if zone is None or zone not in model_bundle['zone_rf_models']:
        zone_auto = get_zone_from_lat_lon(lat, lon)
        if zone_auto is None:
            return jsonify({"error": "Location out of zone bounds"}), 400
        zone = zone_auto

    raw_input = np.array([data[col] for col in model_bundle['raw_cols']]).reshape(1, -1)
    eng_input = np.array([data[col] for col in model_bundle['engineered_cols']]).reshape(1, -1)

    raw_scaled = model_bundle['scaler'].transform(raw_input)
    combined_input = np.hstack([raw_scaled, eng_input])

    pred_gb = model_bundle['model_gb'].predict_proba(eng_input)[0][1]
    pred_lr = model_bundle['model_lr'].predict_proba(raw_scaled)[0][1]
    pred_rf = model_bundle['zone_rf_models'][zone].predict_proba(combined_input)[0][1]

    final_prob = np.mean([pred_gb, pred_lr, pred_rf])
    final_pred = int(final_prob >= 0.5)

    try:
        res = requests.get(
            f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"
        )
        weather = res.json()
        base_temp = weather['main']['temp']
        base_rain = weather.get('rain', {}).get('1h', 0)
    except:
        base_temp, base_rain = 30.0, 1.0

    weather_history = []
    for i in range(5):
        date = (datetime.utcnow() - timedelta(days=4 - i)).strftime("%Y-%m-%d")
        variation_temp = round(base_temp + np.random.uniform(-1.5, 1.5), 1)
        variation_rain = round(max(0, base_rain + np.random.uniform(-0.5, 1.5)), 2)
        weather_history.append({
            "date": date,
            "temperature": variation_temp,
            "rain": variation_rain
        })

    return jsonify({
        "flood_probability": round(float(final_prob), 4),
        "prediction": final_pred,
        "weather_history": weather_history
    })

#------------------------------------
# @app.route("/get_astar_route", methods=["POST"])
# def get_astar_route():
#     from geopy.distance import geodesic
#     import networkx as nx
#     import osmnx as ox
#     import json
#
#     user = request.get_json()
#     source = (user['lat'], user['lon'])
#
#     with open("safe_zones.json") as f:
#         zones = json.load(f)
#
#     def distance(p1, p2):
#         return geodesic(p1, p2).meters
#
#     best_zone = min(zones, key=lambda z: distance(source, (z['lat'], z['lon'])))
#     dest = (best_zone['lat'], best_zone['lon'])
#
#     midpoint = ((source[0] + dest[0]) / 2, (source[1] + dest[1]) / 2)
#     G = ox.graph_from_point(midpoint, dist=5000, network_type='walk')
#     orig_node = ox.distance.nearest_nodes(G, source[1], source[0])
#     dest_node = ox.distance.nearest_nodes(G, dest[1], dest[0])
#
#     def heuristic(u, v):
#         u_point = (G.nodes[u]['y'], G.nodes[u]['x'])
#         v_point = (G.nodes[v]['y'], G.nodes[v]['x'])
#         return geodesic(u_point, v_point).meters
#
#     try:
#         route = nx.astar_path(G, orig_node, dest_node, heuristic=heuristic, weight='length')
#         route_coords = [(G.nodes[n]['y'], G.nodes[n]['x']) for n in route]
#         return jsonify({
#             "safe_zone": [dest[0], dest[1]],
#             "route_coords": route_coords
#         })
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
import os

from flask import Flask, request, render_template, jsonify
import os
from datetime import datetime

@app.route("/generate_route_html", methods=["POST"])
def generate_route_html():
    from geopy.distance import geodesic
    import osmnx as ox
    import networkx as nx
    import folium
    import json

    data = request.get_json()
    user_lat = float(data["lat"])
    user_lon = float(data["lon"])
    source_point = (user_lat, user_lon)

    with open("safe_zones.json") as f:
        safe_zones = json.load(f)

    def dist(p1, p2):
        return geodesic(p1, p2).meters

    nearest = min(safe_zones, key=lambda z: dist(source_point, (z["lat"], z["lon"])))
    dest_point = (nearest["lat"], nearest["lon"])

    midpoint = ((source_point[0] + dest_point[0]) / 2, (source_point[1] + dest_point[1]) / 2)

    ox.settings.timeout = 30
    G = ox.graph_from_point(midpoint, dist=1500, network_type='walk')
    orig_node = ox.distance.nearest_nodes(G, source_point[1], source_point[0])
    dest_node = ox.distance.nearest_nodes(G, dest_point[1], dest_point[0])

    def heuristic(u, v):
        u_point = (G.nodes[u]['y'], G.nodes[u]['x'])
        v_point = (G.nodes[v]['y'], G.nodes[v]['x'])
        return geodesic(u_point, v_point).meters

    route = nx.astar_path(G, orig_node, dest_node, heuristic=heuristic, weight='length')
    route_coords = [(G.nodes[n]['y'], G.nodes[n]['x']) for n in route]

    # Save with unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"astar_route_map_{timestamp}.html"
    filepath = os.path.join("templates", filename)

    os.makedirs("templates", exist_ok=True)
    m = folium.Map(location=midpoint, zoom_start=14)
    folium.Marker(source_point, tooltip="Start", icon=folium.Icon(color='green')).add_to(m)
    folium.Marker(dest_point, tooltip="Safe Zone", icon=folium.Icon(color='red')).add_to(m)
    folium.PolyLine(route_coords, color="blue", weight=5, opacity=0.8).add_to(m)
    m.save(filepath)

    return jsonify({"status": "ok", "html": f"/astar_route_map/{filename}"})


@app.route('/astar_route_map/<filename>')
def show_astar_route(filename):
    return render_template(filename)


# -----------------------------------
# 🌡️ UHI PREDICTION SETUP
# -----------------------------------
uhi_model = joblib.load("UHI_RandomForest_Model.pkl")
ts_data = pd.read_csv("UHI_Timeseries_ByLocation.csv")
raster = rasterio.open("impheat/NDVI_LST_Bangalore.tif")
ndvi_band = raster.count if raster.count % 2 == 0 else raster.count - 1

@app.route("/get_ndvi", methods=["GET"])
def get_ndvi():
    try:
        lat = float(request.args.get("lat"))
        lon = float(request.args.get("lon"))
        row, col = raster.index(lon, lat)
        value = raster.read(ndvi_band)[row, col]
        return jsonify({"ndvi": round(float(value), 4)})
    except:
        return jsonify({"ndvi": None})

@app.route("/uhi_predict", methods=["POST"])
def predict_uhi():
    data = request.get_json()
    try:
        ndvi = float(data["NDVI"])
        rainfall = float(data["Rainfall"])
        temp = float(data["Avg_Temp"])
    except:
        return jsonify({"error": "Missing or invalid input"}), 400

    input_array = np.array([[ndvi, rainfall, temp]])
    predicted_lst = float(uhi_model.predict(input_array)[0])

    # Determine category and heat zone status
    if predicted_lst < 28:
        category = " Cool Zone"
        is_heat_zone = "No"
        show_plantation = False
    elif predicted_lst < 32:
        category = " Moderate Heat"
        is_heat_zone = "No"
        show_plantation = False
    elif predicted_lst < 35:
        category = " Heat Stress"
        is_heat_zone = "Yes"
        show_plantation = True
    else:
        category = " Severe Hotspot"
        is_heat_zone = "Yes"
        show_plantation = True

    return jsonify({
        "predicted_LST": round(predicted_lst, 2),
        "is_heat_zone": is_heat_zone,
        "category": category,
        "show_plantation": show_plantation
    })

@app.route("/timeseries", methods=["GET"])
def timeseries():
    try:
        lat = round(float(request.args.get("lat")), 4)
        lon = round(float(request.args.get("lon")), 4)
        subset = ts_data[(ts_data["LatKey"] == lat) & (ts_data["LonKey"] == lon)]
        subset = subset.sort_values(by=["Year", "Month"]).tail(12)
        result = {
            "labels": [f"{int(y)}-{int(m):02}" for y, m in zip(subset["Year"], subset["Month"])],
            "ndvi": subset["NDVI"].tolist(),
            "lst": subset["LST"].tolist()
        }
        return jsonify(result)
    except:
        return jsonify({"error": "Invalid coordinates"}), 400

@app.route("/get_plantation_spots")
def get_plantation_spots():
    from shapely.geometry import box, mapping
    from rasterio.mask import mask
    import rasterio
    import numpy as np
    from flask import request, jsonify

    lon = float(request.args.get("lon"))
    lat = float(request.args.get("lat"))
    delta = 0.005  # ≈ 500m in degrees

    # Create a bounding box around the user
    minx, miny = lon - delta, lat - delta
    maxx, maxy = lon + delta, lat + delta
    bbox = box(minx, miny, maxx, maxy)
    geojson_geom = [mapping(bbox)]

    with rasterio.open("impheat/NDVI_LST_Bangalore.tif") as src:
        ndvi_band = 1  # Assuming Band 1 is NDVI
        ndvi_data, transform = mask(src, geojson_geom, crop=True)

        # Find pixels where NDVI < 0.2
        low_ndvi_coords = np.where(ndvi_data[ndvi_band - 1] < 0.2)

        # Correctly get lon, lat (DO NOT REVERSE)
        coords = [
            rasterio.transform.xy(transform, row, col, offset='center')
            for row, col in zip(*low_ndvi_coords)
        ]

    # Return first 50 as plantation suggestions
    return jsonify({
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [lon, lat]},
                "properties": {"recommendation": " Plant trees here (Low vegetation)"}
            } for lon, lat in coords[:50]
        ]
    })

if __name__ == "__main__":
    app.run(debug=True)