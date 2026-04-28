import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, MapPin, Search, Trophy, ExternalLink, Navigation2, XCircle } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import RoutingMachine from './RoutingMachine';

const API_URL = 'http://localhost:8000/api/places';

const createIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});

function App() {
  const [places, setPlaces] = useState([]);
  const [search, setSearch] = useState('');

  // Stan dla routingu
  const [isRoutingMode, setIsRoutingMode] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);

  useEffect(() => { fetchPlaces(); }, []);

  const fetchPlaces = async () => {
    try {
      const res = await axios.get(API_URL);
      setPlaces(res.data);
    } catch (err) {
      console.error("Błąd pobierania danych:", err);
    }
  };

  const toggleVisit = async (id) => {
    await axios.put(`${API_URL}/${id}`);
    fetchPlaces();
  };

  const handleMarkerClick = (p) => {
    if (isRoutingMode) {
      if (!startPoint) {
        setStartPoint([p.lat, p.lng]);
      } else if (!endPoint) {
        setEndPoint([p.lat, p.lng]);
      } else {
        setStartPoint([p.lat, p.lng]);
        setEndPoint(null);
      }
    }
  };

  const getGoogleMapsUrl = (lat, lng) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  const filteredPlaces = places.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const visited = places.filter(p => p.is_visited).length;
  const progress = (visited / places.length) * 100;

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <header>
          <h2>Odkrywca Polski</h2>
        </header>

        {/* Sekcja Statystyk */}
        <div className="stats-card">
          <div className="stats-info">
            <span>Postęp odkryć </span>
            <strong>{visited} / {places.length}</strong>
          </div>
          <div className="progress-bar-bg">
            <motion.div
              className="progress-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Panel Routingu */}
        <div className={`routing-panel ${isRoutingMode ? 'active' : ''}`}>
          <button className="btn-mode-toggle" onClick={() => {
            setIsRoutingMode(!isRoutingMode);
            setStartPoint(null);
            setEndPoint(null);
          }}>
            <Navigation2 size={18} />
            {isRoutingMode ? "Wyłącz nawigację" : "Wyznacz trasę"}
          </button>

          {isRoutingMode && (
            <div className="route-hints">
              {!startPoint && <p>👉 Kliknij w miejsce startu</p>}
              {startPoint && !endPoint && <p>👉 Kliknij w cel podróży</p>}
              {startPoint && endPoint && <button className="btn-reset" onClick={() => {setStartPoint(null); setEndPoint(null)}}>Wyczyść</button>}
            </div>
          )}
        </div>

        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Szukaj miejsca..."
            value={search}
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
              >
                <div className="place-content" onClick={() => toggleVisit(p.id)}>
                  <div className="place-text">
                    <h4>{p.name}</h4>
                    <p className="coords-small">{p.lat.toFixed(4)}, {p.lng.toFixed(4)}</p>
                  </div>
                  {p.is_visited ? <CheckCircle color="#4CAF50" /> : <MapPin color="#ccc" />}
                </div>

                <a
                  href={getGoogleMapsUrl(p.lat, p.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="external-link-btn"
                  title="Otwórz w Google Maps"
                >
                  <ExternalLink size={16} />
                </a>
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
              eventHandlers={{
                click: () => handleMarkerClick(p)
              }}
            >
              <Popup className="custom-popup">
                <div className="popup-inner">
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                  <div className="popup-coords-box">
                    <code>{p.lat}, {p.lng}</code>
                  </div>
                  <div className="popup-actions">
                    <button className="btn-toggle" onClick={() => toggleVisit(p.id)}>
                      {p.is_visited ? "Oznacz jako nieodwiedzone" : "Odwiedziłem!"}
                    </button>
                    <a href={getGoogleMapsUrl(p.lat, p.lng)} target="_blank" rel="noopener noreferrer" className="btn-gmaps">
                      Google Maps
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Wyświetlanie trasy */}
          {isRoutingMode && startPoint && endPoint && (
            <RoutingMachine start={startPoint} end={endPoint} />
          )}
        </MapContainer>
      </main>
    </div>
  );
}

export default App;