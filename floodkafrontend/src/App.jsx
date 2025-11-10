import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './components/HomePage';
import FloodPrediction from './components/FloodPrediction';
import UHIPredictor from './components/UHIPredictor';
import RouteFinder from './components/RouteFinder'; // ✅ NEW IMPORT

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/flood-prediction" element={<FloodPrediction />} />
        <Route path="/heat-island" element={<UHIPredictor />} />
        <Route path="/safe-route" element={<RouteFinder />} /> {/* ✅ NEW ROUTE */}
      </Routes>
    </Router>
  );
}

export default App;
