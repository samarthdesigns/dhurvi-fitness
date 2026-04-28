import React, { useState, useEffect, useMemo } from 'react';
import { fetchLog, saveLog, deleteLog, getSetting, saveSetting, downloadBackup, importBackup } from '../utils/api';

const MOODS = ['😊 Great', '🙂 Good', '😐 Okay', '😴 Tired', '😩 Rough'];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function LogPage({ allLogs, onRefresh }) {
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [form, setForm] = useState({ calories: '', protein: '', fiber: '', mood: '', notes: '' });
  const [cardioRows, setCardioRows] = useState([]);
  const [exerciseRows, setExerciseRows] = useState([]);
  const [cardioTypes, setCardioTypes] = useState([]);
  const [exerciseTypes, setExerciseTypes] = useState([]);
  const [showCardioManager, setShowCardioManager] = useState(false);
  const [showExerciseManager, setShowExerciseManager] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupPw, setBackupPw] = useState('');
  const [importFile, setImportFile] = useState(null);
  const [importPw, setImportPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [newType, setNewType] = useState('');

  // Load settings
  useEffect(() => {
    getSetting('cardio_types').then(v => { if (v) setCardioTypes(v); });
    getSetting('exercise_types').then(v => { if (v) setExerciseTypes(v); });
  }, []);

  // Load log for selected date
  useEffect(() => {
    fetchLog(selectedDate).then(log => {
      if (log) {
        setForm({
          calories: log.calories ?? '',
          protein: log.protein ?? '',
          fiber: log.fiber ?? '',
          mood: log.mood ?? '',
          notes: log.notes ?? ''
        });
        try {
          const c = typeof log.cardio === 'string' ? JSON.parse(log.cardio) : log.cardio;
          setCardioRows(Array.isArray(c) ? c : []);
        } catch { setCardioRows([]); }
        try {
          const e = typeof log.exercises === 'string' ? JSON.parse(log.exercises) : log.exercises;
          setExerciseRows(Array.isArray(e) ? e : []);
        } catch { setExerciseRows([]); }
      } else {
        setForm({ calories: '', protein: '', fiber: '', mood: '', notes: '' });
        setCardioRows([]);
        setExerciseRows([]);
      }
    });
  }, [selectedDate]);

  // Calendar data
  const logDates = useMemo(() => new Set((allLogs || []).map(l => l.date)), [allLogs]);

  const calendarDays = useMemo(() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const days = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrev - i;
      const date = new Date(year, month - 1, d);
      days.push({ day: d, date: date.toISOString().split('T')[0], otherMonth: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      days.push({ day: d, date: date.toISOString().split('T')[0], otherMonth: false });
    }
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const date = new Date(year, month + 1, d);
        days.push({ day: d, date: date.toISOString().split('T')[0], otherMonth: true });
      }
    }
    return days;
  }, [calMonth]);

  // Streak
  const streak = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      days.push({ date: ds, label: WEEKDAYS[d.getDay()], logged: logDates.has(ds) });
    }
    let count = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].logged) count++;
      else break;
    }
    return { days, count };
  }, [logDates]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveLog({
        date: selectedDate,
        calories: form.calories ? Number(form.calories) : null,
        protein: form.protein ? Number(form.protein) : null,
        fiber: form.fiber ? Number(form.fiber) : null,
        mood: form.mood,
        cardio: JSON.stringify(cardioRows.filter(r => r.type)),
        exercises: JSON.stringify(exerciseRows.filter(r => r.name)),
        notes: form.notes
      });
      setMessage('Saved! ✨');
      onRefresh();
    } catch { setMessage('Error saving'); }
    setSaving(false);
    setTimeout(() => setMessage(''), 2000);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this log?')) return;
    await deleteLog(selectedDate);
    setForm({ calories: '', protein: '', fiber: '', mood: '', notes: '' });
    setCardioRows([]);
    setExerciseRows([]);
    onRefresh();
  };

  const addCardioRow = () => setCardioRows([...cardioRows, { type: cardioTypes[0] || '', value: '' }]);
  const addExerciseRow = () => setExerciseRows([...exerciseRows, { name: exerciseTypes[0] || '', detail: '' }]);

  const handleBackupDownload = () => {
    if (!backupPw) return;
    downloadBackup(backupPw);
    setShowBackupModal(false);
    setBackupPw('');
  };

  const handleImport = async () => {
    if (!importFile || !importPw) return;
    try {
      const res = await importBackup(importFile, importPw);
      if (res.error) { setMessage(res.error); }
      else { setMessage(`Imported ${res.imported} entries!`); onRefresh(); }
    } catch { setMessage('Import failed'); }
    setShowBackupModal(false);
    setImportPw('');
    setImportFile(null);
    setTimeout(() => setMessage(''), 3000);
  };

  const addType = (kind) => {
    if (!newType.trim()) return;
    if (kind === 'cardio') {
      const updated = [...cardioTypes, newType.trim()];
      setCardioTypes(updated);
      saveSetting('cardio_types', updated);
    } else {
      const updated = [...exerciseTypes, newType.trim()];
      setExerciseTypes(updated);
      saveSetting('exercise_types', updated);
    }
    setNewType('');
  };

  const removeType = (kind, idx) => {
    if (kind === 'cardio') {
      const updated = cardioTypes.filter((_, i) => i !== idx);
      setCardioTypes(updated);
      saveSetting('cardio_types', updated);
    } else {
      const updated = exerciseTypes.filter((_, i) => i !== idx);
      setExerciseTypes(updated);
      saveSetting('exercise_types', updated);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const monthLabel = calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="page">
      {/* Streak Strip */}
      <div className="card">
        <div className="streak-count">
          {streak.count > 0 ? `🔥 ${streak.count}-day streak!` : 'Start your streak today!'}
        </div>
        <div className="streak-strip">
          {streak.days.map(d => (
            <div key={d.date} className={`streak-day ${d.logged ? 'logged' : 'not-logged'}`}>
              <span className="streak-label">{d.label}</span>
              {d.logged ? '✓' : '·'}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="card">
        <div className="cal-nav">
          <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1))}>‹</button>
          <h3>{monthLabel}</h3>
          <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1))}>›</button>
        </div>
        <div className="calendar-grid">
          {WEEKDAYS.map(d => <div key={d} className="cal-header">{d}</div>)}
          {calendarDays.map((d, i) => (
            <div
              key={i}
              className={`cal-day ${d.otherMonth ? 'other-month' : ''} ${d.date === today ? 'today' : ''} ${d.date === selectedDate ? 'selected' : ''} ${logDates.has(d.date) ? 'has-log' : ''}`}
              onClick={() => !d.otherMonth && setSelectedDate(d.date)}
            >
              {d.day}
            </div>
          ))}
        </div>
      </div>

      {/* Log Form */}
      <div className="card">
        <div className="card-title">
          📝 {selectedDate === today ? "Today's Log" : `Log for ${new Date(selectedDate + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
        </div>

        {/* Mood */}
        <div className="input-group">
          <label>How are you feeling?</label>
          <div className="mood-selector">
            {MOODS.map(m => (
              <button key={m} className={`mood-btn ${form.mood === m ? 'active' : ''}`}
                onClick={() => setForm({ ...form, mood: m })}>{m}</button>
            ))}
          </div>
        </div>

        {/* Nutrition */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div className="input-group">
            <label>Calories</label>
            <input type="number" className="input-field" placeholder="1450"
              value={form.calories} onChange={e => setForm({ ...form, calories: e.target.value })} />
          </div>
          <div className="input-group">
            <label>Protein (g)</label>
            <input type="number" className="input-field" placeholder="60"
              value={form.protein} onChange={e => setForm({ ...form, protein: e.target.value })} />
          </div>
          <div className="input-group">
            <label>Fiber (g)</label>
            <input type="number" className="input-field" placeholder="25"
              value={form.fiber} onChange={e => setForm({ ...form, fiber: e.target.value })} />
          </div>
        </div>

        {/* Cardio */}
        <div className="input-group">
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Cardio
            <button className="btn btn-sm btn-secondary" onClick={() => setShowCardioManager(true)}>Manage types</button>
          </label>
          {cardioRows.map((r, i) => (
            <div key={i} className="log-row">
              <select className="input-field" value={r.type}
                onChange={e => { const rows = [...cardioRows]; rows[i].type = e.target.value; setCardioRows(rows); }}>
                {cardioTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input className="input-field" placeholder="e.g. 30 mins, 3km"
                value={r.value}
                onChange={e => { const rows = [...cardioRows]; rows[i].value = e.target.value; setCardioRows(rows); }} />
              <button className="remove-btn" onClick={() => setCardioRows(cardioRows.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          <button className="btn btn-sm btn-secondary" onClick={addCardioRow}>+ Add cardio</button>
        </div>

        {/* Exercises */}
        <div className="input-group">
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Exercises
            <button className="btn btn-sm btn-secondary" onClick={() => setShowExerciseManager(true)}>Manage types</button>
          </label>
          {exerciseRows.map((r, i) => (
            <div key={i} className="log-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select className="input-field" value={r.name} style={{ flex: 1 }}
                  onChange={e => { const rows = [...exerciseRows]; rows[i].name = e.target.value; setExerciseRows(rows); }}>
                  {exerciseTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button className="remove-btn" onClick={() => setExerciseRows(exerciseRows.filter((_, j) => j !== i))}>×</button>
              </div>
              <textarea className="input-field" placeholder="e.g. 3x12 @ 5kg" rows={2}
                value={r.detail}
                onChange={e => { const rows = [...exerciseRows]; rows[i].detail = e.target.value; setExerciseRows(rows); }} />
            </div>
          ))}
          <button className="btn btn-sm btn-secondary" onClick={addExerciseRow}>+ Add exercise</button>
        </div>

        {/* Notes */}
        <div className="input-group">
          <label>Notes</label>
          <textarea className="input-field" placeholder="How did you feel? Any wins?" rows={2}
            value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-full" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Log ✨'}
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>🗑</button>
        </div>
        {message && <p style={{ textAlign: 'center', marginTop: 8, fontWeight: 600, color: 'var(--pink-dark)' }}>{message}</p>}
      </div>

      {/* Backup/Import */}
      <div className="card">
        <div className="card-title">💾 Backup & Import</div>
        <div className="backup-section">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowBackupModal(true)}>⬇ Download Backup</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowBackupModal(true)}>⬆ Import Backup</button>
        </div>
      </div>

      {/* Backup Modal */}
      {showBackupModal && (
        <div className="modal-overlay" onClick={() => setShowBackupModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>💾 Backup & Import</h3>

            <div className="input-group">
              <label>Download Backup</label>
              <input className="input-field" type="password" placeholder="Enter password"
                value={backupPw} onChange={e => setBackupPw(e.target.value)} />
              <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={handleBackupDownload}>Download .db file</button>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />

            <div className="input-group">
              <label>Import Backup (merge)</label>
              <input type="file" accept=".db" onChange={e => setImportFile(e.target.files[0])} style={{ marginBottom: 8 }} />
              <input className="input-field" type="password" placeholder="Enter password"
                value={importPw} onChange={e => setImportPw(e.target.value)} />
              <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={handleImport}>Import & Merge</button>
            </div>

            <button className="btn btn-secondary btn-full" style={{ marginTop: 8 }} onClick={() => setShowBackupModal(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Cardio Manager Modal */}
      {showCardioManager && (
        <div className="modal-overlay" onClick={() => setShowCardioManager(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>🏃‍♀️ Manage Cardio Types</h3>
            <div className="manager-list">
              {cardioTypes.map((t, i) => (
                <div key={i} className="manager-item">
                  <span>{t}</span>
                  <button className="btn btn-danger btn-sm" onClick={() => removeType('cardio', i)}>Remove</button>
                </div>
              ))}
            </div>
            <div className="manager-add">
              <input className="input-field" placeholder="New type..." value={newType}
                onChange={e => setNewType(e.target.value)} onKeyDown={e => e.key === 'Enter' && addType('cardio')} />
              <button className="btn btn-primary btn-sm" onClick={() => addType('cardio')}>Add</button>
            </div>
            <button className="btn btn-secondary btn-full" style={{ marginTop: 16 }} onClick={() => setShowCardioManager(false)}>Done</button>
          </div>
        </div>
      )}

      {/* Exercise Manager Modal */}
      {showExerciseManager && (
        <div className="modal-overlay" onClick={() => setShowExerciseManager(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>💪 Manage Exercise Types</h3>
            <div className="manager-list">
              {exerciseTypes.map((t, i) => (
                <div key={i} className="manager-item">
                  <span>{t}</span>
                  <button className="btn btn-danger btn-sm" onClick={() => removeType('exercise', i)}>Remove</button>
                </div>
              ))}
            </div>
            <div className="manager-add">
              <input className="input-field" placeholder="New exercise..." value={newType}
                onChange={e => setNewType(e.target.value)} onKeyDown={e => e.key === 'Enter' && addType('exercise')} />
              <button className="btn btn-primary btn-sm" onClick={() => addType('exercise')}>Add</button>
            </div>
            <button className="btn btn-secondary btn-full" style={{ marginTop: 16 }} onClick={() => setShowExerciseManager(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
