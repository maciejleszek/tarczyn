import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, MapPin, Search, Trophy } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

const API_URL = 'http://localhost:8000/api/places';

// Customowe ikony markerów
const createIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});

function App() {
  const [places, setPlaces] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchPlaces(); }, []);

  const fetchPlaces = async () => {
    const res = await axios.get(API_URL);
    setPlaces(res.data);
  };

  const toggleVisit = async (id) => {
    await axios.put(`${API_URL}/${id}`);
    fetchPlaces();
  };

  const filteredPlaces = places.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const visited = places.filter(p => p.is_visited).length;
  const progress = (visited / places.length) * 100;

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <header>
          <h2>Odkrywca Polski</h2>
        </header>

        <div className="stats-card">
          <div className="stats-info">
            <span>Twój postęp </span>
            <strong>{visited} / {places.length}</strong>
          </div>
          <div className="progress-bar-bg">
            <motion.div
              className="progress-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
          {progress === 100 && <p className="congrats">🏆 Gratulacje! Jesteś ekspertem!</p>}
        </div>

        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Szukaj miejsca z kapsla..."
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="place-list">
          <AnimatePresence>
            {filteredPlaces.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`place-item ${p.is_visited ? 'visited' : ''}`}
                onClick={() => toggleVisit(p.id)}
              >
                <div className="place-text">
                  <h4>{p.name}</h4>
                  <p>{p.description.substring(0, 40)}...</p>
                </div>
                {p.is_visited ? <CheckCircle color="#4CAF50" /> : <MapPin color="#ccc" />}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </aside>

      <main className="map-container">
        <MapContainer center={[52.0, 19.0]} zoom={6} zoomControl={false}>
          <ZoomControl position="bottomright" />
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          {places.map(p => (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={createIcon(p.is_visited ? 'green' : 'blue')}
            >
              <Popup className="custom-popup">
                <h3>{p.name}</h3>
                <p>{p.description}</p>
                <button className="btn-toggle" onClick={() => toggleVisit(p.id)}>
                  {p.is_visited ? "Oznacz jako do odwiedzenia" : "Odwiedziłem to!"}
                </button>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </main>
    </div>
  );
}

export default App;