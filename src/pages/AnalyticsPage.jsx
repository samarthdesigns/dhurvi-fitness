import React, { useState, useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart, Line } from 'recharts';

const CAL_TARGET = 1450, PRO_TARGET = 60, FIB_TARGET = 25;

function parseSets(text) {
  if (!text) return [];
  const sets = [];
  let m;
  const p1 = /(\d+)\s*[x×]\s*(\d+)\s*[@at]*\s*(\d+\.?\d*)\s*(?:kg|lb)?/gi;
  while ((m = p1.exec(text)) !== null) {
    for (let i = 0; i < Math.min(parseInt(m[1]), 10); i++) sets.push({ reps: parseInt(m[2]), weight: parseFloat(m[3]) });
  }
  if (sets.length) return sets;
  const p2 = /(\d+\.?\d*)\s*(?:kg|lb)\s*[x×]\s*(\d+)/gi;
  while ((m = p2.exec(text)) !== null) sets.push({ reps: parseInt(m[2]), weight: parseFloat(m[1]) });
  if (sets.length) return sets;
  const p3 = /(\d+)\s*(?:reps?|times)/gi;
  while ((m = p3.exec(text)) !== null) sets.push({ reps: parseInt(m[1]), weight: 0 });
  return sets;
}

export default function AnalyticsPage({ allLogs }) {
  const [section, setSection] = useState('nutrition');
  const [metric, setMetric] = useState('calories');
  const [view, setView] = useState('daily');
  const [offset, setOffset] = useState(0);
  const [selExercise, setSelExercise] = useState('');
  const [selCardio, setSelCardio] = useState('');

  const logs = useMemo(() => (allLogs || []).sort((a, b) => a.date.localeCompare(b.date)), [allLogs]);

  const allExNames = useMemo(() => {
    const s = new Set();
    logs.forEach(l => (Array.isArray(l.exercises) ? l.exercises : []).forEach(e => e.name && s.add(e.name)));
    return [...s].sort();
  }, [logs]);

  const allCardioTypes = useMemo(() => {
    const s = new Set();
    logs.forEach(l => (Array.isArray(l.cardio) ? l.cardio : []).forEach(c => c.type && s.add(c.type)));
    return [...s].sort();
  }, [logs]);

  // Nutrition
  const nutData = useMemo(() => {
    const key = metric === 'calories' ? 'calories' : metric === 'protein' ? 'protein' : 'fiber';
    const filtered = logs.filter(l => l[key] != null);
    if (view === 'daily') {
      const w = 7, end = filtered.length - (offset * w), start = Math.max(0, end - w);
      return filtered.slice(start, end).map(l => ({
        date: new Date(l.date + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: l[key]
      }));
    } else {
      const weeks = [];
      for (let i = 0; i < filtered.length; i += 7) {
        const chunk = filtered.slice(i, i + 7);
        const vals = chunk.map(l => l[key]).filter(v => v != null);
        if (vals.length) weeks.push({
          date: `Wk ${new Date(chunk[0].date + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          value: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
        });
      }
      const w = 4, end = weeks.length - (offset * w), start = Math.max(0, end - w);
      return weeks.slice(start, end);
    }
  }, [logs, metric, view, offset]);

  const target = metric === 'calories' ? CAL_TARGET : metric === 'protein' ? PRO_TARGET : FIB_TARGET;

  // Exercise — INDEPENDENT per exercise
  const exData = useMemo(() => {
    if (!selExercise) return [];
    const sessions = [];
    logs.forEach(log => {
      const exs = Array.isArray(log.exercises) ? log.exercises : [];
      // ONLY look at the selected exercise — completely independent
      const match = exs.find(e => e.name && e.name.toLowerCase() === selExercise.toLowerCase());
      if (match && match.detail) {
        const sets = parseSets(match.detail);
        if (sets.length) {
          const vol = sets.reduce((s, st) => s + (st.weight || 1) * st.reps, 0);
          const maxW = Math.max(...sets.map(s => s.weight));
          sessions.push({
            date: new Date(log.date + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            volume: vol, maxWeight: maxW, sets, detail: match.detail, rawDate: log.date
          });
        }
      }
    });
    let best = 0;
    sessions.forEach((s, i) => {
      if (s.maxWeight > best) { best = s.maxWeight; s.badge = 'PR'; }
      else if (i > 0 && s.volume < sessions[i - 1].volume * 0.8) s.badge = 'DROP';
    });
    return sessions;
  }, [logs, selExercise]);

  // Cardio
  const cardioData = useMemo(() => {
    if (!selCardio) return [];
    const sessions = [];
    logs.forEach(log => {
      const cs = Array.isArray(log.cardio) ? log.cardio : [];
      const match = cs.find(c => c.type && c.type.toLowerCase() === selCardio.toLowerCase());
      if (match && match.value) {
        const numMatch = String(match.value).match(/([\d.]+)/);
        if (numMatch) sessions.push({
          date: new Date(log.date + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: parseFloat(numMatch[1]), raw: match.value
        });
      }
    });
    return sessions;
  }, [logs, selCardio]);

  const canOlder = offset < Math.floor(logs.length / 7);
  const canNewer = offset > 0;

  return (
    <div>
      <div className="metric-selector" style={{ marginBottom: 14 }}>
        {['nutrition', 'exercise', 'cardio'].map(s => (
          <button key={s} className={`metric-btn ${section === s ? 'active' : ''}`} onClick={() => setSection(s)}>
            {s === 'nutrition' ? '🍎 Nutrition' : s === 'exercise' ? '💪 Exercise' : '🏃‍♀️ Cardio'}
          </button>
        ))}
      </div>

      {/* NUTRITION */}
      {section === 'nutrition' && (
        <>
          <div className="card">
            <div className="card-title">🍎 Nutrition</div>
            <div className="metric-selector">
              {['calories', 'protein', 'fiber'].map(m => (
                <button key={m} className={`metric-btn ${metric === m ? 'active' : ''}`}
                  onClick={() => { setMetric(m); setOffset(0); }}>
                  {m === 'calories' ? '🔥 Cal' : m === 'protein' ? '🥜 Pro' : '🥬 Fib'}
                </button>
              ))}
            </div>
            <div className="metric-selector">
              <button className={`metric-btn ${view === 'daily' ? 'active' : ''}`} onClick={() => { setView('daily'); setOffset(0); }}>Daily</button>
              <button className={`metric-btn ${view === 'weekly' ? 'active' : ''}`} onClick={() => { setView('weekly'); setOffset(0); }}>Weekly</button>
            </div>
            <div className="nav-arrows">
              <button onClick={() => canOlder && setOffset(offset + 1)} style={{ opacity: canOlder ? 1 : 0.3 }}>← Older</button>
              <span>{view === 'daily' ? '7 entries' : '4 weeks'}</span>
              <button onClick={() => canNewer && setOffset(offset - 1)} style={{ opacity: canNewer ? 1 : 0.3 }}>Newer →</button>
            </div>
            {nutData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={nutData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <Tooltip />
                  <ReferenceLine y={target} stroke="#e8477e" strokeDasharray="5 5" />
                  <Bar dataKey="value" fill="#e8477e" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">No data yet — start logging!</div>
            )}
          </div>
        </>
      )}

      {/* EXERCISE */}
      {section === 'exercise' && (
        <>
          <div className="card">
            <div className="card-title">💪 Exercise Progression</div>
            {allExNames.length > 0 ? (
              <select className="input-field" value={selExercise} onChange={e => setSelExercise(e.target.value)}>
                <option value="">Select exercise...</option>
                {allExNames.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            ) : <div className="empty-state">Log exercises to see progression!</div>}
          </div>

          {selExercise && exData.length > 0 && (
            <>
              <div className="card">
                <div className="card-title">📈 Volume</div>
                <ResponsiveContainer width="100%" height={170}>
                  <AreaChart data={exData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="volume" stroke="#e8477e" fill="var(--pink-light)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <div className="card-title">📋 Sessions</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)' }}>
                        <th style={{ textAlign: 'left', padding: '5px 6px' }}>Date</th>
                        <th style={{ textAlign: 'left', padding: '5px 6px' }}>Detail</th>
                        <th style={{ textAlign: 'right', padding: '5px 6px' }}>Vol</th>
                        <th style={{ padding: '5px 6px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...exData].reverse().slice(0, 10).map((s, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '5px 6px', whiteSpace: 'nowrap' }}>{s.date}</td>
                          <td style={{ padding: '5px 6px', color: 'var(--text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.detail}</td>
                          <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 600 }}>{s.volume}</td>
                          <td style={{ padding: '5px 6px' }}>
                            {s.badge === 'PR' && <span className="stat-badge pr">🏆 PR</span>}
                            {s.badge === 'DROP' && <span className="stat-badge drop">📉</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          {selExercise && exData.length === 0 && (
            <div className="card empty-state">No data for {selExercise} — log sets like "3x12 @ 5kg"</div>
          )}
        </>
      )}

      {/* CARDIO */}
      {section === 'cardio' && (
        <>
          <div className="card">
            <div className="card-title">🏃‍♀️ Cardio</div>
            {allCardioTypes.length > 0 ? (
              <select className="input-field" value={selCardio} onChange={e => setSelCardio(e.target.value)}>
                <option value="">Select type...</option>
                {allCardioTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            ) : <div className="empty-state">Log cardio to see charts!</div>}
          </div>

          {selCardio && cardioData.length > 0 && (
            <div className="card">
              <div className="card-title">📊 {selCardio}</div>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={cardioData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <Tooltip />
                  {selCardio.toLowerCase() === 'steps' && <ReferenceLine y={10000} stroke="#22c55e" strokeDasharray="5 5" />}
                  <Bar dataKey="value" fill="#80cbc4" radius={[3, 3, 0, 0]} />
                  <Line type="monotone" dataKey="value" stroke="#e8477e" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
          {selCardio && cardioData.length === 0 && (
            <div className="card empty-state">No data for {selCardio} yet</div>
          )}
        </>
      )}
    </div>
  );
}
