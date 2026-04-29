import React, { useState, useEffect, useMemo } from 'react';
import { getLog, saveLog, deleteLog, getSetting, saveSetting, exportBackup, importBackup } from '../utils/db';

const MOODS = ['😊 Great', '🙂 Good', '😐 Okay', '😴 Tired', '😩 Rough'];
const WKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function LogPage({ allLogs, onLogSaved }) {
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [form, setForm] = useState({ calories: '', protein: '', fiber: '', mood: '', notes: '' });
  const [cardioRows, setCardioRows] = useState([]);
  const [exerciseRows, setExerciseRows] = useState([]);
  const [cardioTypes, setCardioTypes] = useState([]);
  const [exerciseTypes, setExerciseTypes] = useState([]);
  const [showCardioMgr, setShowCardioMgr] = useState(false);
  const [showExMgr, setShowExMgr] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [pw, setPw] = useState('');
  const [importFile, setImportFile] = useState(null);
  const [importPw, setImportPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [newType, setNewType] = useState('');

  useEffect(() => {
    getSetting('cardio_types').then(v => v && setCardioTypes(v));
    getSetting('exercise_types').then(v => v && setExerciseTypes(v));
  }, []);

  useEffect(() => {
    getLog(selectedDate).then(log => {
      if (log) {
        setForm({
          calories: log.calories ?? '',
          protein: log.protein ?? '',
          fiber: log.fiber ?? '',
          mood: log.mood ?? '',
          notes: log.notes ?? ''
        });
        setCardioRows(Array.isArray(log.cardio) ? log.cardio : []);
        setExerciseRows(Array.isArray(log.exercises) ? log.exercises : []);
      } else {
        setForm({ calories: '', protein: '', fiber: '', mood: '', notes: '' });
        setCardioRows([]);
        setExerciseRows([]);
      }
    });
  }, [selectedDate]);

  const logDates = useMemo(() => new Set((allLogs || []).map(l => l.date)), [allLogs]);

  const calDays = useMemo(() => {
    const y = calMonth.getFullYear(), m = calMonth.getMonth();
    const first = new Date(y, m, 1).getDay();
    const dim = new Date(y, m + 1, 0).getDate();
    const prevDim = new Date(y, m, 0).getDate();
    const days = [];
    for (let i = first - 1; i >= 0; i--) {
      const d = prevDim - i;
      days.push({ day: d, date: new Date(y, m - 1, d).toISOString().split('T')[0], other: true });
    }
    for (let d = 1; d <= dim; d++) {
      days.push({ day: d, date: new Date(y, m, d).toISOString().split('T')[0], other: false });
    }
    const rem = 7 - (days.length % 7);
    if (rem < 7) for (let d = 1; d <= rem; d++) {
      days.push({ day: d, date: new Date(y, m + 1, d).toISOString().split('T')[0], other: true });
    }
    return days;
  }, [calMonth]);

  const streak = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      days.push({ date: ds, label: WKDAYS[d.getDay()], logged: logDates.has(ds) });
    }
    let count = 0;
    for (let i = days.length - 1; i >= 0; i--) { if (days[i].logged) count++; else break; }
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
        mood: form.mood || null,
        cardio: cardioRows.filter(r => r.type),
        exercises: exerciseRows.filter(r => r.name),
        notes: form.notes || null
      });
      setMsg('Saved! ✨');
      await onLogSaved();
    } catch (e) { setMsg('Error: ' + e.message); }
    setSaving(false);
    setTimeout(() => setMsg(''), 2500);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this log?')) return;
    await deleteLog(selectedDate);
    setForm({ calories: '', protein: '', fiber: '', mood: '', notes: '' });
    setCardioRows([]);
    setExerciseRows([]);
    await onLogSaved();
  };

  const addType = (kind) => {
    if (!newType.trim()) return;
    if (kind === 'cardio') {
      const u = [...cardioTypes, newType.trim()]; setCardioTypes(u); saveSetting('cardio_types', u);
    } else {
      const u = [...exerciseTypes, newType.trim()]; setExerciseTypes(u); saveSetting('exercise_types', u);
    }
    setNewType('');
  };

  const rmType = (kind, idx) => {
    if (kind === 'cardio') {
      const u = cardioTypes.filter((_, i) => i !== idx); setCardioTypes(u); saveSetting('cardio_types', u);
    } else {
      const u = exerciseTypes.filter((_, i) => i !== idx); setExerciseTypes(u); saveSetting('exercise_types', u);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const monthLabel = calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div>
      {/* Streak */}
      <div className="card">
        <div className="streak-count">
          {streak.count > 0 ? `🔥 ${streak.count}-day streak!` : 'Start your streak today!'}
        </div>
        <div className="streak-strip">
          {streak.days.map(d => (
            <div key={d.date} className={`streak-day ${d.logged ? 'logged' : 'not-logged'}`}>
              <span className="s-label">{d.label}</span>
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
          {WKDAYS.map(d => <div key={d} className="cal-header">{d}</div>)}
          {calDays.map((d, i) => (
            <div key={i}
              className={`cal-day ${d.other ? 'other-month' : ''} ${d.date === today ? 'today' : ''} ${d.date === selectedDate ? 'selected' : ''} ${logDates.has(d.date) ? 'has-log' : ''}`}
              onClick={() => !d.other && setSelectedDate(d.date)}>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          <div className="input-group">
            <label>Calories</label>
            <input type="number" className="input-field" placeholder="1450" value={form.calories}
              onChange={e => setForm({ ...form, calories: e.target.value })} />
          </div>
          <div className="input-group">
            <label>Protein (g)</label>
            <input type="number" className="input-field" placeholder="60" value={form.protein}
              onChange={e => setForm({ ...form, protein: e.target.value })} />
          </div>
          <div className="input-group">
            <label>Fiber (g)</label>
            <input type="number" className="input-field" placeholder="25" value={form.fiber}
              onChange={e => setForm({ ...form, fiber: e.target.value })} />
          </div>
        </div>

        {/* Cardio */}
        <div className="input-group">
          <label style={{ display: 'flex', justifyContent: 'space-between' }}>
            Cardio
            <button className="btn btn-sm btn-secondary" onClick={() => setShowCardioMgr(true)}>Manage</button>
          </label>
          {cardioRows.map((r, i) => (
            <div key={i} className="log-row">
              <select className="input-field" value={r.type}
                onChange={e => { const rows = [...cardioRows]; rows[i] = { ...rows[i], type: e.target.value }; setCardioRows(rows); }}>
                <option value="">Select...</option>
                {cardioTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input className="input-field" placeholder="e.g. 30 mins, 3km" value={r.value || ''}
                onChange={e => { const rows = [...cardioRows]; rows[i] = { ...rows[i], value: e.target.value }; setCardioRows(rows); }} />
              <button className="rm-btn" onClick={() => setCardioRows(cardioRows.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          <button className="btn btn-sm btn-secondary" onClick={() => setCardioRows([...cardioRows, { type: cardioTypes[0] || '', value: '' }])}>+ Add cardio</button>
        </div>

        {/* Exercises */}
        <div className="input-group">
          <label style={{ display: 'flex', justifyContent: 'space-between' }}>
            Exercises
            <button className="btn btn-sm btn-secondary" onClick={() => setShowExMgr(true)}>Manage</button>
          </label>
          {exerciseRows.map((r, i) => (
            <div key={i} className="log-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <select className="input-field" value={r.name} style={{ flex: 1 }}
                  onChange={e => { const rows = [...exerciseRows]; rows[i] = { ...rows[i], name: e.target.value }; setExerciseRows(rows); }}>
                  <option value="">Select...</option>
                  {exerciseTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button className="rm-btn" onClick={() => setExerciseRows(exerciseRows.filter((_, j) => j !== i))}>×</button>
              </div>
              <textarea className="input-field" placeholder="e.g. 3x12 @ 5kg" rows={2} value={r.detail || ''}
                onChange={e => { const rows = [...exerciseRows]; rows[i] = { ...rows[i], detail: e.target.value }; setExerciseRows(rows); }} />
            </div>
          ))}
          <button className="btn btn-sm btn-secondary" onClick={() => setExerciseRows([...exerciseRows, { name: exerciseTypes[0] || '', detail: '' }])}>+ Add exercise</button>
        </div>

        {/* Notes */}
        <div className="input-group">
          <label>Notes</label>
          <textarea className="input-field" placeholder="How did you feel? Any wins?" rows={2} value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-primary btn-full" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Log ✨'}
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>🗑</button>
        </div>
        {msg && <div className="msg-toast">{msg}</div>}
      </div>

      {/* Backup */}
      <div className="card">
        <div className="card-title">💾 Backup & Import</div>
        <div className="backup-section">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowBackup(true)}>⬇ Backup</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowBackup(true)}>⬆ Import</button>
        </div>
      </div>

      {/* Backup Modal */}
      {showBackup && (
        <div className="modal-overlay" onClick={() => setShowBackup(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>💾 Backup & Import</h3>
            <div className="input-group">
              <label>Download Backup</label>
              <input className="input-field" type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} />
              <button className="btn btn-primary btn-sm" style={{ marginTop: 6 }}
                onClick={async () => { try { await exportBackup(pw); setShowBackup(false); setPw(''); } catch(e) { setMsg(e.message); } }}>
                Download .json
              </button>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />
            <div className="input-group">
              <label>Import Backup (merge)</label>
              <input type="file" accept=".json" onChange={e => setImportFile(e.target.files[0])} style={{ marginBottom: 6, fontSize: 12 }} />
              <input className="input-field" type="password" placeholder="Password" value={importPw} onChange={e => setImportPw(e.target.value)} />
              <button className="btn btn-primary btn-sm" style={{ marginTop: 6 }}
                onClick={async () => {
                  try {
                    const n = await importBackup(importFile, importPw);
                    setMsg(`Imported ${n} entries!`); setShowBackup(false); setImportPw(''); setImportFile(null);
                    await onLogSaved();
                  } catch(e) { setMsg(e.message); }
                  setTimeout(() => setMsg(''), 3000);
                }}>
                Import & Merge
              </button>
            </div>
            <button className="btn btn-secondary btn-full" style={{ marginTop: 8 }} onClick={() => setShowBackup(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Cardio Manager */}
      {showCardioMgr && (
        <div className="modal-overlay" onClick={() => setShowCardioMgr(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>🏃‍♀️ Cardio Types</h3>
            <div className="manager-list">
              {cardioTypes.map((t, i) => (
                <div key={i} className="manager-item">
                  <span>{t}</span>
                  <button className="btn btn-danger btn-sm" onClick={() => rmType('cardio', i)}>Remove</button>
                </div>
              ))}
            </div>
            <div className="manager-add">
              <input className="input-field" placeholder="New type..." value={newType}
                onChange={e => setNewType(e.target.value)} onKeyDown={e => e.key === 'Enter' && addType('cardio')} />
              <button className="btn btn-primary btn-sm" onClick={() => addType('cardio')}>Add</button>
            </div>
            <button className="btn btn-secondary btn-full" style={{ marginTop: 12 }} onClick={() => setShowCardioMgr(false)}>Done</button>
          </div>
        </div>
      )}

      {/* Exercise Manager */}
      {showExMgr && (
        <div className="modal-overlay" onClick={() => setShowExMgr(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>💪 Exercise Types</h3>
            <div className="manager-list">
              {exerciseTypes.map((t, i) => (
                <div key={i} className="manager-item">
                  <span>{t}</span>
                  <button className="btn btn-danger btn-sm" onClick={() => rmType('exercise', i)}>Remove</button>
                </div>
              ))}
            </div>
            <div className="manager-add">
              <input className="input-field" placeholder="New exercise..." value={newType}
                onChange={e => setNewType(e.target.value)} onKeyDown={e => e.key === 'Enter' && addType('exercise')} />
              <button className="btn btn-primary btn-sm" onClick={() => addType('exercise')}>Add</button>
            </div>
            <button className="btn btn-secondary btn-full" style={{ marginTop: 12 }} onClick={() => setShowExMgr(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
