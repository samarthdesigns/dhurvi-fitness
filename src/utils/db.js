import Dexie from 'dexie';

const db = new Dexie('DhruviGymPlan');

db.version(1).stores({
  logs: 'date',           // primary key = date string (YYYY-MM-DD)
  settings: 'key',        // primary key = setting key
  smarttips: 'exercise'   // primary key = exercise name
});

// ============ LOGS ============

export async function getAllLogs() {
  return db.logs.toArray();
}

export async function getLog(date) {
  return db.logs.get(date) || null;
}

export async function saveLog(data) {
  await db.logs.put(data); // upsert by date
}

export async function deleteLog(date) {
  await db.logs.delete(date);
}

// ============ SETTINGS ============

const DEFAULT_CARDIO = ['Walking', 'Running', 'Cycling', 'Stairs', 'Elliptical', 'Jump Rope', 'Dance'];
const DEFAULT_EXERCISES = [
  'Wall Push-ups', 'Knee Push-ups', 'Dumbbell Shoulder Press', 'Tricep Kickbacks',
  'Lat Pulldown', 'Seated Cable Row', 'Dumbbell Bicep Curls', 'Face Pulls',
  'Bodyweight Squats', 'Walking Lunges', 'Glute Bridges', 'Standing Calf Raises',
  'Leg Press', 'Plank', 'Dead Hangs', 'Step-ups',
  'Dumbbell Chest Press', 'Lateral Raises', 'Cable Tricep Pushdown',
  'Resistance Band Pull-apart', 'Hip Thrusts', 'Leg Curls', 'Leg Extensions',
  'Bird Dogs', 'Superman Hold', 'Bicycle Crunches'
];

export async function getSetting(key) {
  const row = await db.settings.get(key);
  if (row) return row.value;
  // Return defaults and seed them
  if (key === 'cardio_types') {
    await db.settings.put({ key, value: DEFAULT_CARDIO });
    return DEFAULT_CARDIO;
  }
  if (key === 'exercise_types') {
    await db.settings.put({ key, value: DEFAULT_EXERCISES });
    return DEFAULT_EXERCISES;
  }
  return null;
}

export async function saveSetting(key, value) {
  await db.settings.put({ key, value });
}

// ============ SMARTTIPS CACHE ============

export async function getCachedTips() {
  return db.smarttips.toArray();
}

export async function saveCachedTips(tips) {
  // tips = [{ exercise, tip }]
  await db.smarttips.clear();
  if (tips.length > 0) {
    await db.smarttips.bulkPut(tips);
  }
}

// ============ BACKUP / IMPORT ============

const BACKUP_PASSWORD = 'gymgoingdhubu';

export async function exportBackup(password) {
  if (password !== BACKUP_PASSWORD) throw new Error('Wrong password');
  const logs = await db.logs.toArray();
  const settings = await db.settings.toArray();
  const blob = new Blob(
    [JSON.stringify({ version: 2, logs, settings, exportedAt: new Date().toISOString() }, null, 2)],
    { type: 'application/json' }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dhruvi-gym-backup.json';
  a.click();
  URL.revokeObjectURL(url);
}

export async function importBackup(file, password) {
  if (password !== BACKUP_PASSWORD) throw new Error('Wrong password');
  const text = await file.text();
  const data = JSON.parse(text);

  if (!data.logs || !Array.isArray(data.logs)) throw new Error('Invalid backup file');

  // Merge logs (imported data overwrites existing on conflict)
  for (const log of data.logs) {
    await db.logs.put(log);
  }

  // Merge settings
  if (data.settings && Array.isArray(data.settings)) {
    for (const s of data.settings) {
      await db.settings.put(s);
    }
  }

  return data.logs.length;
}

// ============ EXERCISE HISTORY EXTRACTION ============
// Extracts history for ONE specific exercise across all logs — fully independent

export async function getExerciseHistory(exerciseName) {
  const allLogs = await db.logs.toArray();
  const history = [];

  for (const log of allLogs) {
    const exercises = Array.isArray(log.exercises) ? log.exercises : [];
    for (const ex of exercises) {
      if (ex.name && ex.name.toLowerCase() === exerciseName.toLowerCase() && ex.detail) {
        history.push({ date: log.date, detail: ex.detail });
      }
    }
  }

  history.sort((a, b) => a.date.localeCompare(b.date));
  return history;
}

export default db;
