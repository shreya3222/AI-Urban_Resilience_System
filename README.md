# 🌦️ AI-Driven Flood & Urban Heat Island Prediction System

### 🚀 Full Stack ML + Geospatial Application
This project integrates **Flask (Python)** and **Vite + React (Frontend)** to predict **flood risks**, **urban heat zones**, and recommend **plantation spots** based on NDVI data.  
It combines machine learning, satellite raster data, and real-time weather APIs to support **urban resilience and climate-smart planning**.

---

## 🧠 Features

### 🌧️ Flood Prediction Module
- Predicts flood probability using retrained ML ensemble (`GradientBoost`, `LogisticRegression`, `RandomForest`).
- Auto-detects user zone using latitude/longitude bounds.
- Integrates **OpenWeather API** to fetch live temperature and rainfall.
- Generates past 5-day weather variations for visualization.

### 🌡️ Urban Heat Island (UHI) Module
- Predicts **Land Surface Temperature (LST)** based on **NDVI, rainfall, and average temperature**.
- Classifies areas into:
  - 🌿 *Cool Zone*
  - 🟡 *Moderate Heat*
  - 🔴 *Heat Stress*
  - 🔥 *Severe Hotspot*
- Generates NDVI time-series graphs (past 12 months).
- Suggests low-vegetation areas (NDVI < 0.2) for **tree plantation**.
- Provides safe-zone routing (A* pathfinding using OSM data).

---

## 🧩 Tech Stack

| Layer | Technologies |
|-------|---------------|
| **Frontend** | React + Vite + Tailwind CSS |
| **Backend** | Flask + Flask-CORS |
| **ML Models** | Scikit-learn (Joblib serialized models) |
| **GIS Processing** | Rasterio, Shapely, Folium, OSMnx, NetworkX |
| **APIs** | OpenWeatherMap API |
| **Data** | `NDVI_LST_Bangalore.tif`, `UHI_Timeseries_ByLocation.csv`, `safe_zones.json`, `zone_bounds.json` |

---

## ⚙️ Installation & Setup

### 🐍 Backend Setup (Flask)
1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/ai-flood-uhi-system.git
   cd ai-flood-uhi-system/backend
