import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import LogPage from './pages/LogPage';
import GymPage from './pages/GymPage';
import AnalyticsPage from './pages/AnalyticsPage';
import MealsPage from './pages/MealsPage';
import { fetchLogs } from './utils/api';

const NAV = [
  { path: '/', label: 'Log', icon: '📅' },
  { path: '/gym', label: 'Gym', icon: '🏋️' },
  { path: '/analytics', label: 'Analytics', icon: '📊' },
  { path: '/meals', label: 'Meals', icon: '🥗' },
];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [allLogs, setAllLogs] = useState([]);

  const refreshLogs = async () => {
    try {
      const logs = await fetchLogs();
      setAllLogs(logs || []);
    } catch {}
  };

  useEffect(() => { refreshLogs(); }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Dhruvi's Gym Plan 💪✨</h1>
        <p>Your fitness journey starts here, one day at a time</p>
      </header>

      <Routes>
        <Route path="/" element={<LogPage allLogs={allLogs} onRefresh={refreshLogs} />} />
        <Route path="/gym" element={<GymPage allLogs={allLogs} />} />
        <Route path="/analytics" element={<AnalyticsPage allLogs={allLogs} />} />
        <Route path="/meals" element={<MealsPage />} />
      </Routes>

      <nav className="bottom-nav">
        {NAV.map(n => (
          <button
            key={n.path}
            className={`nav-item ${location.pathname === n.path ? 'active' : ''}`}
            onClick={() => navigate(n.path)}
          >
            <span style={{ fontSize: 20 }}>{n.icon}</span>
            {n.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
