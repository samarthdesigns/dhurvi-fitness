import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import LogPage from './pages/LogPage';
import GymPage from './pages/GymPage';
import AnalyticsPage from './pages/AnalyticsPage';
import MealsPage from './pages/MealsPage';
import { getAllLogs } from './utils/db';
import { fetchSmartTips, loadCachedTips } from './utils/smarttips';
import { syncWithGitHub } from './utils/sync';

const ALL_GYM_EXERCISES = [
  'Wall Push-ups', 'Knee Push-ups', 'Dumbbell Shoulder Press', 'Tricep Kickbacks',
  'Lateral Raises', 'Lat Pulldown', 'Seated Cable Row', 'Dumbbell Bicep Curls',
  'Resistance Band Pull-apart', 'Bodyweight Squats', 'Walking Lunges',
  'Glute Bridges', 'Standing Calf Raises', 'Dumbbell Chest Press', 'Face Pulls',
  'Dead Hangs', 'Leg Press', 'Cable Tricep Pushdown', 'Step-ups', 'Hip Thrusts',
  'Leg Curls', 'Plank', 'Bird Dogs', 'Bicycle Crunches'
];

function getTheme() {
  const h = new Date().getHours();
  return (h >= 7 && h < 17) ? 'light' : 'dark';
}

// Contexts
const TipsContext = createContext({ tips: [], loading: false, refresh: () => {} });
export const useTips = () => useContext(TipsContext);

const SyncContext = createContext({ syncStatus: '', syncing: false, doSync: () => {} });
export const useSync = () => useContext(SyncContext);

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
  const [syncStatus, setSyncStatus] = useState('');
  const [syncing, setSyncing] = useState(false);

  // Theme
  useEffect(() => {
    const apply = () => document.documentElement.setAttribute('data-theme', getTheme());
    apply();
    const iv = setInterval(apply, 60000);
    return () => clearInterval(iv);
  }, []);

  const refreshLogs = useCallback(async () => {
    const logs = await getAllLogs();
    setAllLogs(logs || []);
  }, []);

  const refreshTips = useCallback(async () => {
    setTipsLoading(true);
    try {
      const fresh = await fetchSmartTips(ALL_GYM_EXERCISES);
      setTips(fresh || []);
    } catch {
      const cached = await loadCachedTips();
      setTips(cached || []);
    }
    setTipsLoading(false);
  }, []);

  // Sync with GitHub
  const doSync = useCallback(async () => {
    setSyncing(true);
    setSyncStatus('Syncing...');
    const result = await syncWithGitHub();
    setSyncStatus(result.message);
    if (result.success) await refreshLogs();
    setSyncing(false);
    setTimeout(() => setSyncStatus(''), 4000);
  }, [refreshLogs]);

  // Initial load: sync from GitHub → load logs → fetch tips
  useEffect(() => {
    (async () => {
      // Load cached tips immediately
      const cached = await loadCachedTips();
      if (cached.length > 0) setTips(cached);

      // Sync from GitHub (pulls remote, merges, pushes back)
      await doSync();

      // Load logs (now includes any merged remote data)
      await refreshLogs();

      // Fetch fresh SmartTips
      refreshTips();
    })();
  }, []);

  // After saving a log: sync + refresh tips
  const onLogSaved = useCallback(async () => {
    await refreshLogs();
    doSync();        // push to GitHub in background
    refreshTips();   // refresh tips in background
  }, [refreshLogs, doSync, refreshTips]);

  const themeIcon = getTheme() === 'dark' ? '🌙' : '☀️';

  return (
    <TipsContext.Provider value={{ tips, loading: tipsLoading, refresh: refreshTips }}>
      <SyncContext.Provider value={{ syncStatus, syncing, doSync }}>
        <div className="app-shell">
          <div className="top-bar">
            <div className="top-bar-inner">
              <span className="app-logo">Dhruvi's Gym Plan</span>
              <div className="top-tabs">
                {NAV.map(n => (
                  <button key={n.path}
                    className={`top-tab ${location.pathname === n.path ? 'active' : ''}`}
                    onClick={() => navigate(n.path)}>
                    {n.icon} {n.label}
                  </button>
                ))}
              </div>
              <button
                className={`sync-btn ${syncing ? 'spinning' : ''}`}
                onClick={doSync}
                disabled={syncing}
                title="Sync with GitHub">
                🔄
              </button>
              <span className="theme-indicator">{themeIcon}</span>
            </div>
          </div>

          {/* Sync status toast */}
          {syncStatus && (
            <div className="sync-toast">
              {syncing && '⏳ '}{syncStatus}
            </div>
          )}

          <div className="content-area">
            <Routes>
              <Route path="/" element={<LogPage allLogs={allLogs} onLogSaved={onLogSaved} />} />
              <Route path="/gym" element={<GymPage allLogs={allLogs} />} />
              <Route path="/analytics" element={<AnalyticsPage allLogs={allLogs} />} />
              <Route path="/meals" element={<MealsPage />} />
            </Routes>
          </div>

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
      </SyncContext.Provider>
    </TipsContext.Provider>
  );
}
