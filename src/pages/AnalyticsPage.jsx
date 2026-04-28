import React, { useState, useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart } from 'recharts';
import { generateNutritionInsights, generateExerciseInsights, generateCardioInsights } from '../utils/nlp';

const CALORIE_TARGET = 1450;
const PROTEIN_TARGET = 60;
const FIBER_TARGET = 25;

function parseExercisesFromLog(log) {
  try {
    const parsed = typeof log.exercises === 'string' ? JSON.parse(log.exercises) : log.exercises;
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function parseCardioFromLog(log) {
  try {
    const parsed = typeof log.cardio === 'string' ? JSON.parse(log.cardio) : log.cardio;
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function parseSetsFromDetail(text) {
  if (!text) return [];
  const sets = [];
  const p1 = /(\d+)\s*[x×]\s*(\d+)\s*[@at]*\s*(\d+\.?\d*)\s*(?:kg|lb)?/gi;
  let m;
  while ((m = p1.exec(text)) !== null) {
    const n = parseInt(m[1]), r = parseInt(m[2]), w = parseFloat(m[3]);
    for (let i = 0; i < Math.min(n, 10); i++) sets.push({ reps: r, weight: w });
  }
  if (sets.length > 0) return sets;
  const p2 = /(\d+\.?\d*)\s*(?:kg|lb)\s*[x×]\s*(\d+)/gi;
  while ((m = p2.exec(text)) !== null) sets.push({ reps: parseInt(m[2]), weight: parseFloat(m[1]) });
  if (sets.length > 0) return sets;
  const p3 = /(\d+)\s*(?:reps?|times)/gi;
  while ((m = p3.exec(text)) !== null) sets.push({ reps: parseInt(m[1]), weight: 0 });
  return sets;
}

export default function AnalyticsPage({ allLogs }) {
  const [section, setSection] = useState('nutrition');
  const [metric, setMetric] = useState('calories');
  const [view, setView] = useState('daily');
  const [offset, setOffset] = useState(0);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [selectedCardio, setSelectedCardio] = useState('');

  const logs = useMemo(() => (allLogs || []).sort((a, b) => a.date.localeCompare(b.date)), [allLogs]);

  // All exercise names across logs
  const allExerciseNames = useMemo(() => {
    const names = new Set();
    logs.forEach(l => parseExercisesFromLog(l).forEach(e => { if (e.name) names.add(e.name); }));
    return [...names].sort();
  }, [logs]);

  // All cardio types
  const allCardioTypes = useMemo(() => {
    const types = new Set();
    logs.forEach(l => parseCardioFromLog(l).forEach(c => { if (c.type) types.add(c.type); }));
    return [...types].sort();
  }, [logs]);

  // ============ NUTRITION DATA ============
  const nutritionData = useMemo(() => {
    if (view === 'daily') {
      const windowSize = 7;
      const end = logs.length - (offset * windowSize);
      const start = Math.max(0, end - windowSize);
      return logs.slice(start, end).map(l => ({
        date: new Date(l.date + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: metric === 'calories' ? l.calories : metric === 'protein' ? l.protein : l.fiber,
        raw: l
      })).filter(d => d.value != null);
    } else {
      // Weekly averages
      const weeks = [];
      for (let i = 0; i < logs.length; i += 7) {
        const chunk = logs.slice(i, i + 7);
        const vals = chunk.map(l => metric === 'calories' ? l.calories : metric === 'protein' ? l.protein : l.fiber).filter(v => v != null);
        if (vals.length > 0) {
          weeks.push({
            date: `Week of ${new Date(chunk[0].date + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
            value: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
          });
        }
      }
      const windowSize = 4;
      const end = weeks.length - (offset * windowSize);
      const start = Math.max(0, end - windowSize);
      return weeks.slice(start, end);
    }
  }, [logs, metric, view, offset]);

  const target = metric === 'calories' ? CALORIE_TARGET : metric === 'protein' ? PROTEIN_TARGET : FIBER_TARGET;

  const getBarColor = (val) => {
    if (metric === 'calories') return val > target ? '#ef5350' : '#66bb6a';
    return val >= target ? '#66bb6a' : '#ef5350';
  };

  // ============ EXERCISE DATA ============
  const exerciseData = useMemo(() => {
    if (!selectedExercise) return { sessions: [], volumeData: [], maxWeightData: [] };

    const sessions = [];
    logs.forEach(log => {
      const exercises = parseExercisesFromLog(log);
      const match = exercises.find(e => (e.name || '').toLowerCase() === selectedExercise.toLowerCase());
      if (match && match.detail) {
        const sets = parseSetsFromDetail(match.detail);
        if (sets.length > 0) {
          const vol = sets.reduce((s, set) => s + (set.weight || 1) * set.reps, 0);
          const maxW = Math.max(...sets.map(s => s.weight));
          sessions.push({
            date: new Date(log.date + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            volume: vol,
            maxWeight: maxW,
            sets,
            rawDate: log.date,
            detail: match.detail
          });
        }
      }
    });

    // Add PR/DROP badges
    let allTimeBest = 0;
    sessions.forEach((s, i) => {
      if (s.maxWeight > allTimeBest) {
        allTimeBest = s.maxWeight;
        s.badge = 'PR';
      } else if (i > 0 && s.volume < sessions[i - 1].volume * 0.8) {
        s.badge = 'DROP';
      }
    });

    return { sessions };
  }, [logs, selectedExercise]);

  // ============ CARDIO DATA ============
  const cardioData = useMemo(() => {
    if (!selectedCardio) return [];
    const sessions = [];
    logs.forEach(log => {
      const cardio = parseCardioFromLog(log);
      const match = cardio.find(c => (c.type || '').toLowerCase() === selectedCardio.toLowerCase());
      if (match && match.value) {
        const numMatch = String(match.value).match(/([\d.]+)/);
        const num = numMatch ? parseFloat(numMatch[1]) : 0;
        sessions.push({
          date: new Date(log.date + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: num,
          raw: match.value
        });
      }
    });
    return sessions;
  }, [logs, selectedCardio]);

  // Insights
  const nutritionInsights = useMemo(() => generateNutritionInsights(logs, CALORIE_TARGET), [logs]);
  const exerciseInsights = useMemo(() => selectedExercise ? generateExerciseInsights(selectedExercise, logs) : [], [selectedExercise, logs]);
  const cardioInsightData = useMemo(() => selectedCardio ? generateCardioInsights(selectedCardio, logs) : [], [selectedCardio, logs]);

  const canGoOlder = offset < Math.floor(logs.length / 7);
  const canGoNewer = offset > 0;

  return (
    <div className="page">
      {/* Section Selector */}
      <div className="metric-selector" style={{ marginBottom: 16 }}>
        {['nutrition', 'exercise', 'cardio'].map(s => (
          <button key={s} className={`metric-btn ${section === s ? 'active' : ''}`}
            onClick={() => setSection(s)}>
            {s === 'nutrition' ? '🍎 Nutrition' : s === 'exercise' ? '💪 Exercise' : '🏃‍♀️ Cardio'}
          </button>
        ))}
      </div>

      {/* ============ NUTRITION ============ */}
      {section === 'nutrition' && (
        <>
          <div className="card">
            <div className="card-title">🍎 Nutrition Tracking</div>
            <div className="metric-selector">
              {['calories', 'protein', 'fiber'].map(m => (
                <button key={m} className={`metric-btn ${metric === m ? 'active' : ''}`}
                  onClick={() => { setMetric(m); setOffset(0); }}>
                  {m === 'calories' ? '🔥 Calories' : m === 'protein' ? '🥜 Protein' : '🥬 Fiber'}
                </button>
              ))}
            </div>
            <div className="metric-selector">
              <button className={`metric-btn ${view === 'daily' ? 'active' : ''}`} onClick={() => { setView('daily'); setOffset(0); }}>Daily</button>
              <button className={`metric-btn ${view === 'weekly' ? 'active' : ''}`} onClick={() => { setView('weekly'); setOffset(0); }}>Weekly</button>
            </div>

            <div className="nav-arrows">
              <button onClick={() => canGoOlder && setOffset(offset + 1)} style={{ opacity: canGoOlder ? 1 : 0.3 }}>← Older</button>
              <span>{view === 'daily' ? 'Last 7 entries' : 'Last 4 weeks'}</span>
              <button onClick={() => canGoNewer && setOffset(offset - 1)} style={{ opacity: canGoNewer ? 1 : 0.3 }}>Newer →</button>
            </div>

            {nutritionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={nutritionData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fce4ec" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <ReferenceLine y={target} stroke="#e8477e" strokeDasharray="5 5" label={{ value: `Target: ${target}`, fontSize: 10, fill: '#e8477e' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}
                    fill="#e8477e"
                    label={{ position: 'top', fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <p>No {metric} data yet. Start logging to see charts!</p>
              </div>
            )}

            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
              {metric === 'calories' && '🟢 Green = under target · 🔴 Red = over target'}
              {metric === 'protein' && '🟢 Green = at/above target · 🔴 Red = below target'}
              {metric === 'fiber' && '🟢 Green = at/above target · 🔴 Red = below target'}
            </div>
          </div>

          {/* Nutrition Insights */}
          <div className="card">
            <div className="card-title">🧠 SmartInsights — Nutrition</div>
            {nutritionInsights.map((ins, i) => (
              <div key={i} className={`insight-panel smart-tip ${ins.type}`}>
                {ins.text}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ============ EXERCISE ============ */}
      {section === 'exercise' && (
        <>
          <div className="card">
            <div className="card-title">💪 Exercise Progression</div>
            {allExerciseNames.length > 0 ? (
              <select className="input-field" value={selectedExercise}
                onChange={e => setSelectedExercise(e.target.value)}>
                <option value="">Select an exercise...</option>
                {allExerciseNames.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            ) : (
              <div className="empty-state"><p>Log some exercises first to see progression!</p></div>
            )}
          </div>

          {selectedExercise && exerciseData.sessions.length > 0 && (
            <>
              {/* Volume Chart */}
              <div className="card">
                <div className="card-title">📈 Volume Over Time</div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={exerciseData.sessions} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fce4ec" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="volume" stroke="#e8477e" fill="#fce4ec" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Max Weight Chart */}
              <div className="card">
                <div className="card-title">🏋️ Max Weight Trend</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={exerciseData.sessions} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fce4ec" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="maxWeight" fill="#ce93d8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Session History Table */}
              <div className="card">
                <div className="card-title">📋 Session History</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--pink-light)' }}>
                        <th style={{ textAlign: 'left', padding: '6px 8px' }}>Date</th>
                        <th style={{ textAlign: 'left', padding: '6px 8px' }}>Detail</th>
                        <th style={{ textAlign: 'right', padding: '6px 8px' }}>Volume</th>
                        <th style={{ padding: '6px 8px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...exerciseData.sessions].reverse().slice(0, 10).map((s, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>{s.date}</td>
                          <td style={{ padding: '6px 8px', color: 'var(--text-light)' }}>{s.detail}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>{s.volume}</td>
                          <td style={{ padding: '6px 8px' }}>
                            {s.badge === 'PR' && <span className="stat-badge pr">🏆 PR</span>}
                            {s.badge === 'DROP' && <span className="stat-badge drop">📉 DROP</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Last Session Set Breakdown */}
              {exerciseData.sessions.length > 0 && (
                <div className="card">
                  <div className="card-title">🔍 Last Session Breakdown</div>
                  {exerciseData.sessions[exerciseData.sessions.length - 1].sets.map((s, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, borderBottom: '1px solid var(--border)' }}>
                      <span>Set {i + 1}</span>
                      <span style={{ fontWeight: 600 }}>{s.weight > 0 ? `${s.weight}kg × ${s.reps}` : `${s.reps} reps (bodyweight)`}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Exercise Insights */}
              <div className="card">
                <div className="card-title">🧠 SmartInsights — {selectedExercise}</div>
                {exerciseInsights.map((ins, i) => (
                  <div key={i} className={`insight-panel smart-tip ${ins.type}`}>{ins.text}</div>
                ))}
              </div>
            </>
          )}

          {selectedExercise && exerciseData.sessions.length === 0 && (
            <div className="card empty-state">
              <p>No logged data for {selectedExercise} yet. Log your sets in the format "3x12 @ 5kg" to see charts!</p>
            </div>
          )}
        </>
      )}

      {/* ============ CARDIO ============ */}
      {section === 'cardio' && (
        <>
          <div className="card">
            <div className="card-title">🏃‍♀️ Cardio Tracking</div>
            {allCardioTypes.length > 0 ? (
              <select className="input-field" value={selectedCardio}
                onChange={e => setSelectedCardio(e.target.value)}>
                <option value="">Select a cardio type...</option>
                {allCardioTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            ) : (
              <div className="empty-state"><p>Log some cardio sessions to see charts!</p></div>
            )}
          </div>

          {selectedCardio && cardioData.length > 0 && (
            <>
              <div className="card">
                <div className="card-title">📊 {selectedCardio} Over Time</div>
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={cardioData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fce4ec" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    {selectedCardio.toLowerCase() === 'steps' && (
                      <ReferenceLine y={10000} stroke="#66bb6a" strokeDasharray="5 5"
                        label={{ value: '10k goal', fontSize: 10, fill: '#66bb6a' }} />
                    )}
                    <Bar dataKey="value" fill="#80cbc4" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="value" stroke="#e8477e" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Cardio Insights */}
              <div className="card">
                <div className="card-title">🧠 SmartInsights — {selectedCardio}</div>
                {cardioInsightData.map((ins, i) => (
                  <div key={i} className={`insight-panel smart-tip ${ins.type}`}>{ins.text}</div>
                ))}
              </div>
            </>
          )}

          {selectedCardio && cardioData.length === 0 && (
            <div className="card empty-state">
              <p>No data for {selectedCardio} yet. Log sessions with values like "30 mins" or "5km" to see trends!</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
