import Dexie from 'dexie';

const db = new Dexie('DhruviGymPlan');

db.version(1).stores({
  logs: 'date',
  settings: 'key',
  smarttips: 'exercise'
});

// ============ LOGS ============

export async function getAllLogs() {
  return db.logs.toArray();
}

export async function getLog(date) {
  return (await db.logs.get(date)) || null;
}

export async function saveLog(data) {
  await db.logs.put(data);
}

export async function deleteLog(date) {
  await db.logs.delete(date);
}

// ============ SETTINGS ============

const DEFAULTS = {
  cardio_types: ['Walking', 'Running', 'Cycling', 'Stairs', 'Elliptical', 'Jump Rope', 'Dance'],
  exercise_types: [
    'Wall Push-ups', 'Knee Push-ups', 'Dumbbell Shoulder Press', 'Tricep Kickbacks',
    'Lat Pulldown', 'Seated Cable Row', 'Dumbbell Bicep Curls', 'Face Pulls',
    'Bodyweight Squats', 'Walking Lunges', 'Glute Bridges', 'Standing Calf Raises',
    'Leg Press', 'Plank', 'Dead Hangs', 'Step-ups',
    'Dumbbell Chest Press', 'Lateral Raises', 'Cable Tricep Pushdown',
    'Resistance Band Pull-apart', 'Hip Thrusts', 'Leg Curls', 'Leg Extensions',
    'Bird Dogs', 'Superman Hold', 'Bicycle Crunches'
  ]
};

export async function getSetting(key) {
  const row = await db.settings.get(key);
  if (row) return row.value;
  if (DEFAULTS[key]) {
    await db.settings.put({ key, value: DEFAULTS[key] });
    return DEFAULTS[key];
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
  await db.smarttips.clear();
  if (tips.length > 0) await db.smarttips.bulkPut(tips);
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
  for (const log of data.logs) await db.logs.put(log);
  if (data.settings && Array.isArray(data.settings)) {
    for (const s of data.settings) await db.settings.put(s);
  }
  return data.logs.length;
}

export default db;
