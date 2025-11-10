// FloodPrediction.jsx
import React, { useState, useEffect } from 'react';
import '../styles/FloodPrediction.css';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import zoneBounds from '../data/zone_bounds.json'; 

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Function to find zone from lat/lon
const getZoneFromLatLon = (lat, lon) => {
  for (const zoneInfo of zoneBounds) {
    if (
      lat >= zoneInfo.Lat_min && lat <= zoneInfo.Lat_max &&
      lon >= zoneInfo.Lon_min && lon <= zoneInfo.Lon_max
    ) {
      return zoneInfo.Zone;
    }
  }
  return ''; // fallback if no zone matches
};

const FloodPrediction = () => {
  const navigate = useNavigate();


  const [formData, setFormData] = useState({
    Latitude: '', Longitude: '', Altitude: '',
    Rainfall_Intensity: '', Temperature: '', Humidity: '',
    Atmospheric_Pressure: '', River_Level: '',
    Drainage_Capacity: '', Drainage_System_Condition: '',
    Population_Density: '', Urbanization_Level: '',
    threshold: '', Rain_Exceeds_Threshold: '', HighRain_LowDrainage: '',
    HighRain_HighRiver: '', HighRain_LowAltitude: '', HighRain_BadDrainSys: '',
    LowPressure_StormRisk: '', HighHumidity_PoorDrain: '',
    HighPop_LowDrain: '', HighUrban_HeavyRain: '', LowAlt_HighUrban: '',
    Zone: ''
  });


  const [location, setLocation] = useState(null);
  const [safeLocation, setSafeLocation] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [result, setResult] = useState('');
  const [weatherHistory, setWeatherHistory] = useState([]);
  const [floodDetected, setFloodDetected] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);


  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation([latitude, longitude]);
        setFormData((prev) => ({
          ...prev,
          Latitude: latitude,
          Longitude: longitude
        }));
      },
      (err) => {
        alert("Location access is required for flood prediction.");
        console.error(err);
      }
    );
  }, []);

 // Updated useEffect to autofill Zone based on lat/lon
 useEffect(() => {
  if (!location) return;
  const [lat, lon] = location;

  const zone = getZoneFromLatLon(lat, lon);

  setFormData(prev => ({
    ...prev,
    Latitude: lat,
    Longitude: lon,
    Zone: zone
  }));
}, [location]);


  useEffect(() => {
    if (!location) return;
    const [lat, lon] = location;


    const fetchWeather = async () => {
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=3bbb7b3c02698b55cbd8a66d69e01f51&units=metric`);
      const data = await res.json();
      if (data && data.main) {
        setFormData(prev => ({
          ...prev,
          Temperature: data.main.temp,
          Humidity: data.main.humidity,
          Atmospheric_Pressure: data.main.pressure,
          Rainfall_Intensity: data.rain?.['1h'] || data.rain?.['3h'] || 0
        }));
      }
    };


    const fetchAltitude = async () => {
      const res = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`);
      const data = await res.json();
      if (data?.results?.length > 0) {
        setFormData(prev => ({
          ...prev,
          Altitude: data.results[0].elevation
        }));
      }
    };


    fetchWeather();
    fetchAltitude();
  }, [location]);


  useEffect(() => {
    const {
      Rainfall_Intensity, Altitude, River_Level,
      Drainage_Capacity, Drainage_System_Condition,
      Atmospheric_Pressure, Humidity,
      Urbanization_Level, Population_Density, threshold
    } = formData;


    const thresh = parseFloat(threshold) || 115;


    setFormData(prev => ({
      ...prev,
      Rain_Exceeds_Threshold: +(Rainfall_Intensity > thresh),
      HighRain_LowAltitude: +(Rainfall_Intensity > 100 && Altitude < 900),
      HighRain_HighRiver: +(Rainfall_Intensity > 100 && River_Level > 6),
      HighRain_LowDrainage: +(Rainfall_Intensity > 100 && Drainage_Capacity < 35),
      HighRain_BadDrainSys: +(Rainfall_Intensity > 100 && Drainage_System_Condition <= 4),
      LowPressure_StormRisk: +(Atmospheric_Pressure < 920),
      HighHumidity_PoorDrain: +(Humidity > 80 && Drainage_Capacity < 40),
      HighUrban_HeavyRain: +(Urbanization_Level > 7 && Rainfall_Intensity > 100),
      LowAlt_HighUrban: +(Altitude < 900 && Urbanization_Level > 7),
      HighPop_LowDrain: +(Population_Density > 20000 && Drainage_Capacity < 40)
    }));
  }, [formData]);


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: parseFloat(e.target.value) });
  };


  const fetchSafeRoute = async () => {
    const routeWindow = window.open("", "_blank");
    routeWindow.document.write("<h2 style='text-align:center;'>🧭 Generating route... Please wait.</h2>");
 
    try {
      const res = await fetch('http://127.0.0.1:5000/generate_route_html', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: location[0], lon: location[1] })
      });
 
      const data = await res.json();
      const routeUrl = `http://127.0.0.1:5000${data.html}`;
 
      let attempts = 0;
      const poll = setInterval(async () => {
        try {
          const check = await fetch(routeUrl, { method: "GET" });
          if (check.ok) {
            clearInterval(poll);
            routeWindow.location.href = routeUrl;
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
 
        if (++attempts >= 30) {
          clearInterval(poll);
          routeWindow.document.body.innerHTML = "<h3 style='text-align:center;'>❌ Route generation failed or timed out.</h3>";
        }
      }, 2000);
 
    } catch (err) {
      routeWindow.document.body.innerHTML = "<h3 style='text-align:center;'>❌ Failed to generate route.</h3>";
      console.error(err);
    }
  };
 
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSafeLocation(null);
    setRouteCoords([]);
    try {
      const res = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });


      const data = await res.json();
      setResult(`Flood Probability: ${data.flood_probability}\nPrediction: ${data.prediction === 1 ? "Flood" : "No Flood"}`);
      setWeatherHistory(data.weather_history || []);
      setFloodDetected(data.prediction === 1);
    } catch (error) {
      console.error("Prediction error:", error);
      setResult("Could not predict. Try again.");
    }
  };


  return (
    <div className="flood-container">
      <h2>Flood Prediction</h2>
      <form className="flood-form" onSubmit={handleSubmit}>
  {Object.entries(formData).map(([key, value]) => (
    <div className="form-group" key={key}>
      <label>{key.replaceAll('_', ' ')}</label>
      <input
        type="number"
        name={key}
        value={value}
        onChange={handleChange}
        required
        step="any"
      />
    </div>
  ))}
  <button type="submit">Predict</button>
</form>


      {location && (
  <MapContainer center={location} zoom={13} className="leaflet-container">
    <TileLayer
      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      attribution="Tiles &copy; Esri"
      maxZoom={19}
    />
    <Marker position={location}><Popup>You are here</Popup></Marker>
    {safeLocation && <Marker position={safeLocation}><Popup>✅ Safe Zone</Popup></Marker>}
    {routeCoords.length > 0 && (
      <Polyline positions={routeCoords} pathOptions={{ color: 'red', weight: 5 }} />
    )}
    {weatherHistory.map((entry, idx) => (
      <Circle
        key={idx}
        center={location}
        radius={entry.rain * 200}
        pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.3 + Math.min(entry.rain / 50, 0.5) }}
      />
    ))}
  </MapContainer>
)}


      <div className="result">{result}</div>


      {weatherHistory.length > 0 && (
        <>
          <div style={{ marginTop: "30px" }}>
            <h3>Weather Trends (Past 5 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weatherHistory}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="temperature" stroke="#ff7300" />
                <Line type="monotone" dataKey="rain" stroke="#007bff" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {loadingRoute && (
      <p style={{ marginTop: "20px", color: "#555", fontWeight: "bold", textAlign: "center" }}>
        🚧 Generating safe route... This may take a minute.
      </p>
    )}
          {floodDetected && (
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <button
                onClick={fetchSafeRoute}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e60000',
                  color: 'white',
                  fontWeight: 'bold',
                  borderRadius: '6px'
                }}
              >
                🚨 Route to Safe Area
              </button>
            </div>
          )}


{!floodDetected && (
  <div style={{ textAlign: "center", marginTop: "20px" }}>
    <button
      onClick={() => {
  console.log("Navigating to /heat-island");
  navigate('/heat-island');
}}


      style={{
        padding: '10px 20px',
        backgroundColor: '#ff9900',
        color: 'white',
        fontWeight: 'bold',
        borderRadius: '6px'
      }}
    >
      No flood? Explore other risks 🌡️
    </button>
  </div>
)}


        </>
      )}
    </div>
  );
};


export default FloodPrediction;