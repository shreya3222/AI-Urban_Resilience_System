import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const RouteFinder = () => {
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [routeCoords, setRouteCoords] = useState([]);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lon })
    });
    const data = await res.json();
    setRouteCoords(data.route);
    setStart(data.start);
    setEnd(data.end);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          placeholder="Latitude"
          required
        />
        <input
          type="text"
          value={lon}
          onChange={(e) => setLon(e.target.value)}
          placeholder="Longitude"
          required
        />
        <button type="submit">Find Safe Route</button>
      </form>

      <MapContainer center={[12.9716, 77.5946]} zoom={13} style={{ height: '600px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {start && <Marker position={start}><Popup>You are here</Popup></Marker>}
        {end && <Marker position={end}><Popup>Safe Zone</Popup></Marker>}
        {routeCoords.length > 0 && <Polyline positions={routeCoords} color="blue" />}
      </MapContainer>
    </div>
  );
};

export default RouteFinder;
