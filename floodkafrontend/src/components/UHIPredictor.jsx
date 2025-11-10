import React, { useState, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat/dist/leaflet-heat.js';

const UHIPredictor = () => {
  const [ndvi, setNDVI] = useState(0.3);
  const [rainfall, setRainfall] = useState('');
  const [temp, setTemp] = useState('');
  const [result, setResult] = useState('');
  const [map, setMap] = useState(null);
  const [userLat, setUserLat] = useState(0);
  const [userLon, setUserLon] = useState(0);
  const [showPlantation, setShowPlantation] = useState(false);
  
  const ngos = [
    {
      name: "Shubhodaya Charitable Trust",
      address: "No.544/14, 7th Cross, 1st Main Road, Gokula 1st Stage, 2nd Phase, Yeshwanthpur, Bangalore-560022",
      phone: "080-23473373 / 9916265003",
      website: "shubhodayatrust.org",
    },
    {
      name: "Manav Charities Society",
      address: "66, 14th Main, Kammagondanhalli, Jalahalli West, Bangalore-560015",
      phone: "080-23454878 / 9342358091",
      website: "manavcharities.in",
      email: "rajkul_2000@yahoo.com",
    },
    {
      name: "Provision Asia Trust",
      address: "727, 2nd Main, 2nd Cross, Chinnanna Layout, Kaval Byrasandra R.T Nagar Post Bangalore 560032",
      phone: "080-23634312",
      website: "provisionasia.org",
      email: "info@provisionasia.org",
    },
    {
      name: "Assisted Living For Autistic Adults",
      address: "No 9, Omega Avenue, Mathrushree Layout, MARAGONDANAHALLI MAIN ROAD, TC Palya, KR Puram, Bangalore 560036",
      phone: "080-25567762 / 9741418103",
      website: "alfaa.org.in",
      email: "alfaa2010@gmail.com",
    },
    {
      name: "Nava Karnataka Samskruthika",
      address: "NO 284 1ST C MAIN ROAD 8TH BLOCK KORAMANGALA BANGALORE 560095",
      phone: "080-23598704 / 9880168311",
      website: "N/A",
      email: "N/A",
    },
    {
      name: "Diya Foundation",
      address: "#112/147, Chikkatayappa Reddy Layout, Chelkere, Kalyan Nagar, Bangalore 560043 Karnataka",
      phone: "+91 80 25430040",
      website: "diyafoundation-india.org",
      email: "diyafoundation@gmail.com",
    },
    {
      name: "Maria Seva Sangha",
      address: "No. 28, K No. 335, Athithi Layout, S.T. Halli, MSS Layout, Anadapura, Bangalore – 560036",
      phone: "+91 897077 5242",
      website: "mariasevasangha.org",
      email: "mariasevasangha@gmail.com",
    },
  ];

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      setUserLat(lat);
      setUserLon(lon);

      const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=361762fbb8f425e16534d53502737ef3&units=metric`);
      const weather = await weatherRes.json();
      setRainfall(weather.rain?.["1h"] || 0);
      setTemp(weather.main.temp);

      const ndviRes = await fetch(`http://127.0.0.1:5000/get_ndvi?lat=${lat}&lon=${lon}`);
      const ndviData = await ndviRes.json();
      if (ndviData.ndvi !== null) {
        setNDVI(ndviData.ndvi);
      }

      await loadMap(lat, lon);
    });
  }, []);

  const handlePredict = async () => {
    const res = await fetch("http://127.0.0.1:5000/uhi_predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        NDVI: ndvi,
        Rainfall: parseFloat(rainfall),
        Avg_Temp: parseFloat(temp),
      }),
    });

    const data = await res.json();
    setResult(
      `Predicted LST: ${data.predicted_LST}°C\n` +
      `Heat Zone: ${data.is_heat_zone}\n` +
      `Category: ${data.category}`
    );
    setShowPlantation(data.show_plantation);
  };

  const loadMap = async (lat, lon) => {
    const container = L.DomUtil.get('heatmap');
    if (container._leaflet_id) {
      container._leaflet_id = null;
    }

    const newMap = L.map('heatmap').setView([lat, lon], 13);
    setMap(newMap);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 19
    }).addTo(newMap);

    L.marker([lat, lon], {
      icon: L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png", // green pin
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      }),
    }).addTo(newMap).bindPopup("You are here").openPopup();

    try {
      const response = await fetch("/heatmap_data.json");
      const heatData = await response.json();
      L.heatLayer(heatData, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: {
          0.4: 'blue',
          0.6: 'lime',
          0.8: 'orange',
          1.0: 'red',
        },
      }).addTo(newMap);
    } catch (err) {
      console.warn("Heatmap data not loaded:", err);
    }

    setTimeout(() => {
      newMap.invalidateSize();
    }, 500);
  };

  const loadPlantationSpots = async () => {
    if (!map) {
      alert("Map not ready yet!");
      return;
    }

    const res = await fetch(`http://127.0.0.1:5000/get_plantation_spots?lat=${userLat}&lon=${userLon}`);
    const data = await res.json();

    const markers = [];
    data.features.forEach((spot) => {
      const [lon, lat] = spot.geometry.coordinates;
      const marker = L.marker([lat, lon], {
        icon: L.icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/427/427735.png", // 🌳 Tree icon
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        }),
      }).addTo(map).bindPopup(spot.properties.recommendation);
      markers.push(marker);
    });

    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds(), { padding: [30, 30] });
    }
  };

  return (
    
    <div className="container" style={styles.container}>
      
      <div className="form-container" style={styles.formContainer}>
        <h2 style={styles.title}>URBAN HEAT ISLANDS</h2>

        <label>Latitude</label>
        <input
          type="number"
          value={userLat}
          onChange={(e) => setUserLat(parseFloat(e.target.value))}
          style={styles.input}
          step="any"
        />

        <label>Longitude</label>
        <input
          type="number"
          value={userLon}
          onChange={(e) => setUserLon(parseFloat(e.target.value))}
          style={styles.input}
          step="any"
        />

        <label>NDVI</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={ndvi}
          onChange={(e) => setNDVI(parseFloat(e.target.value))}
          style={styles.input}
        />
        <output>{ndvi}</output>

        <label>Rainfall (mm)</label>
        <input
          type="number"
          value={rainfall}
          onChange={(e) => setRainfall(e.target.value)}
          style={styles.input}
        />

        <label>Avg Temperature (°C)</label>
        <input
          type="number"
          value={temp}
          onChange={(e) => setTemp(e.target.value)}
          style={styles.input}
        />

        <button onClick={handlePredict} style={styles.button}>PREDICT</button>

        <div className="result" style={styles.result}>{result}</div>

        {showPlantation && (
          <button onClick={loadPlantationSpots} style={styles.button}>
            SUGGEST PLANTATION SPOTS
          </button>
        )}
         {/* Third Row: NGO Information */}
      {showPlantation && (
        <div style={styles.ngoContainer}>
          <h2>NGOS</h2>
          <p>Here are some NGOs that can help with plantation:</p>
          {ngos.map((ngo, index) => (
            <div key={index} style={styles.ngoCard}>
              <h3>{ngo.name}</h3>
              <p><strong>Address:</strong> {ngo.address}</p>
              <p><strong>Phone:</strong> {ngo.phone}</p>
              <p><strong>Website:</strong> <a href={`http://${ngo.website}`} target="_blank" rel="noopener noreferrer">{ngo.website}</a></p>
              {ngo.email && <p><strong>Email:</strong> <a href={`mailto:${ngo.email}`}>{ngo.email}</a></p>}
            </div>
          ))}
        </div>
      )}
      </div>

      <div id="heatmap" style={styles.map}></div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex', // Ensure both form and map are in a row
    justifyContent: 'space-between', // Distribute space between form and map
    alignItems: 'flex-start',
    background: '#fff',
    padding: '20px',
    borderRadius: '10px',
    maxWidth: '1200px',
    margin: 'auto',
    boxShadow: '0 0 10px #ccc',
    fontFamily: 'sans-serif',
  },
  formContainer: {
    width: '45%', // Form takes up 45% of the width for better balance
    marginRight: '5%',
    marginTop:'3%', // Add some space between the form and map
  },
  map: {
    width: '50%', // Map takes up the remaining 50%
    height: '500px',
    borderRadius: '10px',
    backgroundColor: '#dfe6e9',
    marginTop:'5%',
  },
  title: {
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: '8px',
    marginTop: '8px',
    marginBottom: '12px',
    borderRadius: '6px',
    border: '1px solid #ccc',
  },
  button: {
    marginTop: '20px',
    padding: '12px',
    width: '100%',
    background: '#333',
    color: 'white',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  result: {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  // ngoContainer: {
  //   display: 'flex',
  //   flexWrap: 'wrap',
  //   gap: '20px',
  // },
  ngoCard: {
    background: '#f1f1f1',
    padding: '15px',
    borderRadius: '8px',
    width: '100%',
    marginBottom: '20px',
    marginTop: '20px',
    boxShadow: '0 0 5px rgba(0, 0, 0, 0.1)',
  },
  
};

export default UHIPredictor;