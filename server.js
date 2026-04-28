import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = process.env.DB_PATH || join(__dirname, 'data', 'gym.db');
const PASSWORD = 'gymgoingdhubu';

// Ensure data directory exists
const dataDir = dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Initialize database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE NOT NULL,
    calories REAL,
    protein REAL,
    fiber REAL,
    mood TEXT,
    cardio TEXT,
    exercises TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Seed default settings if not present
const defaultCardio = JSON.stringify(['Walking', 'Running', 'Cycling', 'Stairs', 'Elliptical', 'Jump Rope', 'Dance']);
const defaultExercises = JSON.stringify([
  'Wall Push-ups', 'Knee Push-ups', 'Dumbbell Shoulder Press', 'Tricep Kickbacks',
  'Lat Pulldown', 'Seated Cable Row', 'Dumbbell Bicep Curls', 'Face Pulls',
  'Bodyweight Squats', 'Walking Lunges', 'Glute Bridges', 'Standing Calf Raises',
  'Leg Press', 'Plank', 'Dead Hangs', 'Step-ups',
  'Dumbbell Chest Press', 'Lateral Raises', 'Cable Tricep Pushdown',
  'Resistance Band Pull-apart', 'Hip Thrusts', 'Leg Curls', 'Leg Extensions',
  'Bird Dogs', 'Superman Hold', 'Bicycle Crunches'
]);

const existingCardio = db.prepare('SELECT value FROM settings WHERE key = ?').get('cardio_types');
if (!existingCardio) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('cardio_types', defaultCardio);
}
const existingExercises = db.prepare('SELECT value FROM settings WHERE key = ?').get('exercise_types');
if (!existingExercises) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('exercise_types', defaultExercises);
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static files in production
const distPath = join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// ============ API ROUTES ============

// Get all logs
app.get('/api/logs', (req, res) => {
  const logs = db.prepare('SELECT * FROM logs ORDER BY date DESC').all();
  res.json(logs);
});

// Get log by date
app.get('/api/logs/:date', (req, res) => {
  const log = db.prepare('SELECT * FROM logs WHERE date = ?').get(req.params.date);
  res.json(log || null);
});

// Save/update log
app.post('/api/logs', (req, res) => {
  const { date, calories, protein, fiber, mood, cardio, exercises, notes } = req.body;
  const stmt = db.prepare(`
    INSERT INTO logs (date, calories, protein, fiber, mood, cardio, exercises, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET
      calories = excluded.calories,
      protein = excluded.protein,
      fiber = excluded.fiber,
      mood = excluded.mood,
      cardio = excluded.cardio,
      exercises = excluded.exercises,
      notes = excluded.notes
  `);
  stmt.run(date, calories, protein, fiber, mood,
    typeof cardio === 'string' ? cardio : JSON.stringify(cardio),
    typeof exercises === 'string' ? exercises : JSON.stringify(exercises),
    notes);
  res.json({ success: true });
});

// Delete log
app.delete('/api/logs/:date', (req, res) => {
  db.prepare('DELETE FROM logs WHERE date = ?').run(req.params.date);
  res.json({ success: true });
});

// Get settings
app.get('/api/settings/:key', (req, res) => {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(req.params.key);
  res.json(row ? JSON.parse(row.value) : null);
});

// Save settings
app.post('/api/settings/:key', (req, res) => {
  const { value } = req.body;
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(req.params.key, JSON.stringify(value));
  res.json({ success: true });
});

// Download backup (password protected)
app.get('/api/backup', (req, res) => {
  const pw = req.query.password;
  if (pw !== PASSWORD) return res.status(403).json({ error: 'Wrong password' });
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename="dhruvi-gym-backup.db"');
  const buffer = fs.readFileSync(DB_PATH);
  res.send(buffer);
});

// Import backup (merge strategy, password protected)
const upload = multer({ storage: multer.memoryStorage() });
app.post('/api/import', upload.single('file'), (req, res) => {
  const pw = req.body.password;
  if (pw !== PASSWORD) return res.status(403).json({ error: 'Wrong password' });
  if (!req.file) return res.status(400).json({ error: 'No file' });

  try {
    const tempPath = join(dataDir, 'temp_import.db');
    fs.writeFileSync(tempPath, req.file.buffer);
    const importDb = new Database(tempPath);

    // Check if logs table exists in imported db
    const tableCheck = importDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='logs'").get();
    if (!tableCheck) {
      importDb.close();
      fs.unlinkSync(tempPath);
      return res.status(400).json({ error: 'Invalid backup file' });
    }

    const rows = importDb.prepare('SELECT * FROM logs').all();
    const insertStmt = db.prepare(`
      INSERT INTO logs (date, calories, protein, fiber, mood, cardio, exercises, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        calories = excluded.calories,
        protein = excluded.protein,
        fiber = excluded.fiber,
        mood = excluded.mood,
        cardio = excluded.cardio,
        exercises = excluded.exercises,
        notes = excluded.notes
    `);

    const mergeMany = db.transaction((rows) => {
      for (const r of rows) {
        insertStmt.run(r.date, r.calories, r.protein, r.fiber, r.mood, r.cardio, r.exercises, r.notes);
      }
    });
    mergeMany(rows);

    // Also merge settings
    const settingsCheck = importDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='settings'").get();
    if (settingsCheck) {
      const settings = importDb.prepare('SELECT * FROM settings').all();
      const settingsStmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
      for (const s of settings) {
        settingsStmt.run(s.key, s.value);
      }
    }

    importDb.close();
    fs.unlinkSync(tempPath);
    res.json({ success: true, imported: rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  if (fs.existsSync(join(distPath, 'index.html'))) {
    res.sendFile(join(distPath, 'index.html'));
  } else {
    res.status(404).send('Not found — run npm run build first');
  }
});

app.listen(PORT, () => {
  console.log(`🏋️ Dhruvi's Gym Plan server running on port ${PORT}`);
});
