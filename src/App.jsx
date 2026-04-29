import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import LogPage from './pages/LogPage';
import GymPage from './pages/GymPage';
import AnalyticsPage from './pages/AnalyticsPage';
import MealsPage from './pages/MealsPage';
import { getAllLogs } from './utils/db';
import { fetchSmartTips, loadCachedTips } from './utils/smarttips';

// ============ THEME ============
function getTheme() {
  const h = new Date().getHours();
  return (h >= 7 && h < 17) ? 'light' : 'dark';
}

// ============ SMARTTIPS CONTEXT ============
const TipsContext = createContext({ tips: [], loading: false, refresh: () => {} });
export const useTips = () => useContext(TipsContext);

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
  const [tips, setTips] = useState([]);
  const [tipsLoading, setTipsLoading] = useState(false);

  // Theme: auto switch based on time
  useEffect(() => {
    const apply = () => document.documentElement.setAttribute('data-theme', getTheme());
    apply();
    const interval = setInterval(apply, 60000); // check every minute
    return () => clearInterval(interval);
  }, []);

  // Load all logs
  const refreshLogs = useCallback(async () => {
    try {
      const logs = await getAllLogs();
      setAllLogs(logs || []);
    } catch (e) { console.error(e); }
  }, []);

  // Load SmartTips (cached first, then fresh)
  const refreshTips = useCallback(async () => {
    setTipsLoading(true);
    try {
      const fresh = await fetchSmartTips();
      setTips(fresh || []);
    } catch {
      const cached = await loadCachedTips();
      setTips(cached || []);
    }
    setTipsLoading(false);
  }, []);

  // Initial load: logs + cached tips, then fetch fresh tips
  useEffect(() => {
    (async () => {
      await refreshLogs();
      const cached = await loadCachedTips();
      if (cached.length > 0) setTips(cached);
      refreshTips();
    })();
  }, []);

  // After saving a log: refresh both
  const onLogSaved = useCallback(async () => {
    await refreshLogs();
    refreshTips();
  }, [refreshLogs, refreshTips]);

  const themeIcon = getTheme() === 'dark' ? '🌙' : '☀️';

  return (
    <TipsContext.Provider value={{ tips, loading: tipsLoading, refresh: refreshTips }}>
      <div className="app-shell">
        {/* Top Bar */}
        <div className="top-bar">
          <div className="top-bar-inner">
            <span className="app-logo">Dhruvi's Gym Plan</span>

            {/* Desktop tabs */}
            <div className="top-tabs">
              {NAV.map(n => (
                <button key={n.path}
                  className={`top-tab ${location.pathname === n.path ? 'active' : ''}`}
                  onClick={() => navigate(n.path)}>
                  {n.icon} {n.label}
                </button>
              ))}
            </div>

            <span className="theme-indicator">{themeIcon}</span>
          </div>
        </div>

        {/* Page Content */}
        <div className="content-area">
          <Routes>
            <Route path="/" element={<LogPage allLogs={allLogs} onLogSaved={onLogSaved} />} />
            <Route path="/gym" element={<GymPage allLogs={allLogs} />} />
            <Route path="/analytics" element={<AnalyticsPage allLogs={allLogs} />} />
            <Route path="/meals" element={<MealsPage />} />
          </Routes>
        </div>

        {/* Bottom Nav (mobile only, hidden on desktop via CSS) */}
        <nav className="bottom-nav">
          {NAV.map(n => (
            <button key={n.path}
              className={`nav-item ${location.pathname === n.path ? 'active' : ''}`}
              onClick={() => navigate(n.path)}>
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>
      </div>
    </TipsContext.Provider>
  );
}
