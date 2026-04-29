import { getAllLogs, getCachedTips, saveCachedTips } from './db';

// Extract per-exercise history from all logs
function buildExercisePayloads(allLogs) {
  const exerciseMap = {}; // { name: [{ date, detail }] }

  for (const log of allLogs) {
    const exercises = Array.isArray(log.exercises) ? log.exercises : [];
    for (const ex of exercises) {
      if (!ex.name || !ex.detail) continue;
      const key = ex.name;
      if (!exerciseMap[key]) exerciseMap[key] = [];
      exerciseMap[key].push({ date: log.date, detail: ex.detail });
    }
  }

  // Build payloads — each exercise is independent
  const payloads = [];
  for (const [name, sessions] of Object.entries(exerciseMap)) {
    sessions.sort((a, b) => a.date.localeCompare(b.date));
    if (sessions.length === 0) continue;

    const latest = sessions[sessions.length - 1];
    const history = sessions.slice(0, -1); // everything except latest

    payloads.push({ name, latest, history });
  }

  return payloads;
}

// Fetch SmartTips from Gemini via Netlify Function
export async function fetchSmartTips() {
  try {
    const allLogs = await getAllLogs();
    const payloads = buildExercisePayloads(allLogs);

    if (payloads.length === 0) return [];

    const res = await fetch('/api/smarttip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exercises: payloads })
    });

    if (!res.ok) {
      console.error('SmartTip API error:', res.status);
      // Fall back to cached tips
      return getCachedTips();
    }

    const data = await res.json();
    const tips = data.tips || [];

    // Cache for offline / quick load
    await saveCachedTips(tips);

    return tips;
  } catch (err) {
    console.error('SmartTip fetch failed:', err);
    // Return cached tips on failure
    return getCachedTips();
  }
}

// Get cached tips without fetching
export async function loadCachedTips() {
  return getCachedTips();
}
