import { getAllLogs, getCachedTips, saveCachedTips } from './db';

// Build per-exercise history + overall summary for context
function buildPayloads(allLogs, gymExerciseNames) {
  // Collect ALL logged exercise data
  const exerciseMap = {}; // { name: [{ date, detail }] }

  for (const log of allLogs) {
    const exercises = Array.isArray(log.exercises) ? log.exercises : [];
    for (const ex of exercises) {
      if (!ex.name || !ex.detail) continue;
      if (!exerciseMap[ex.name]) exerciseMap[ex.name] = [];
      exerciseMap[ex.name].push({ date: log.date, detail: ex.detail });
    }
  }

  // Sort each exercise's history chronologically
  for (const name of Object.keys(exerciseMap)) {
    exerciseMap[name].sort((a, b) => a.date.localeCompare(b.date));
  }

  // Build summary of ALL logged exercises (for context when an exercise has no history)
  const allExerciseSummary = Object.entries(exerciseMap).map(([name, sessions]) => ({
    name,
    sessionCount: sessions.length,
    lastDetail: sessions[sessions.length - 1].detail,
    lastDate: sessions[sessions.length - 1].date
  }));

  // Build per-exercise payloads for EACH exercise on the gym page
  const exercises = gymExerciseNames.map(name => {
    const history = exerciseMap[name] || [];
    return { name, history };
  });

  return { exercises, allExerciseSummary };
}

// Fetch SmartTips from Gemini via Netlify Function
export async function fetchSmartTips(gymExerciseNames) {
  try {
    const allLogs = await getAllLogs();
    const { exercises, allExerciseSummary } = buildPayloads(allLogs, gymExerciseNames);

    // Only send exercises that are on the current gym plan
    if (exercises.length === 0) return [];

    const res = await fetch('/api/smarttip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exercises, allExerciseSummary })
    });

    if (!res.ok) {
      console.error('SmartTip API error:', res.status);
      return getCachedTips();
    }

    const data = await res.json();
    const tips = data.tips || [];

    await saveCachedTips(tips);
    return tips;
  } catch (err) {
    console.error('SmartTip fetch failed:', err);
    return getCachedTips();
  }
}

export async function loadCachedTips() {
  return getCachedTips();
}
