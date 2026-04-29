import React, { useState } from 'react';
import { useTips } from '../App';

const GYM_PLAN = {
  minimum: {
    label: 'Minimum (3 days)',
    desc: "3 days is all you need to build a habit. You'll be sore at first — totally normal! 💕",
    days: [
      {
        name: 'Day 1 — Push',
        badge: 'Mon',
        exercises: [
          { name: 'Wall Push-ups', sets: '3 × 10', note: 'Stand arm-length from a wall, push back and forth.' },
          { name: 'Dumbbell Shoulder Press', sets: '3 × 10 (2-3 kg)', note: 'Sit on a bench, press light dumbbells overhead.' },
          { name: 'Tricep Kickbacks', sets: '3 × 12 (1-2 kg)', note: 'Lean forward, extend arm back. Start super light!' },
          { name: 'Lateral Raises', sets: '3 × 10 (1-2 kg)', note: 'Raise arms to sides like wings.' },
        ]
      },
      {
        name: 'Day 2 — Pull',
        badge: 'Wed',
        exercises: [
          { name: 'Lat Pulldown', sets: '3 × 10 (light)', note: 'Pull bar to chest. Ask staff if unsure!' },
          { name: 'Seated Cable Row', sets: '3 × 10 (light)', note: 'Sit upright, pull handle to belly.' },
          { name: 'Dumbbell Bicep Curls', sets: '3 × 12 (1-2 kg)', note: 'Curl slowly — control > weight!' },
          { name: 'Resistance Band Pull-apart', sets: '3 × 15', note: 'Hold band in front, pull apart. Great for posture!' },
        ]
      },
      {
        name: 'Day 3 — Legs & Glutes',
        badge: 'Fri',
        exercises: [
          { name: 'Bodyweight Squats', sets: '3 × 12', note: 'Feet shoulder-width, sit back like a chair.' },
          { name: 'Walking Lunges', sets: '3 × 10 each', note: 'Big steps forward. Hold something for balance!' },
          { name: 'Glute Bridges', sets: '3 × 15', note: 'Lie on back, push hips up. Squeeze glutes!' },
          { name: 'Standing Calf Raises', sets: '3 × 15', note: 'Rise on toes on edge of a step.' },
        ]
      }
    ]
  },
  good: {
    label: 'Good (5 days)',
    desc: "Once 3 days feels easy (4-6 weeks), level up! You're getting serious Dhruvi! 🔥",
    days: [
      {
        name: 'Day 1 — Push',
        badge: 'Mon',
        exercises: [
          { name: 'Knee Push-ups', sets: '3 × 10', note: 'Upgraded from wall! Straight line knees to head.' },
          { name: 'Dumbbell Chest Press', sets: '3 × 10 (3-5 kg)', note: 'Lie on bench, press dumbbells up.' },
          { name: 'Dumbbell Shoulder Press', sets: '3 × 10 (2-4 kg)', note: 'Seated or standing, press overhead.' },
          { name: 'Tricep Kickbacks', sets: '3 × 12 (2-3 kg)', note: 'Ready for slightly heavier!' },
          { name: 'Lateral Raises', sets: '3 × 12 (1-2 kg)', note: 'Slow and controlled — no swinging!' },
        ]
      },
      {
        name: 'Day 2 — Pull',
        badge: 'Tue',
        exercises: [
          { name: 'Lat Pulldown', sets: '3 × 12', note: 'Pull to upper chest. Feel your back working.' },
          { name: 'Seated Cable Row', sets: '3 × 12', note: 'Sit tall, pull to belly. Back pulls, not arms.' },
          { name: 'Dumbbell Bicep Curls', sets: '3 × 12 (2-3 kg)', note: 'Alternate arms for focus.' },
          { name: 'Face Pulls', sets: '3 × 15 (light cable)', note: 'Pull rope to face. Amazing for shoulders!' },
          { name: 'Dead Hangs', sets: '3 × 15-20 sec', note: 'Just hang from a bar! Builds grip.' },
        ]
      },
      {
        name: 'Day 3 — Legs & Glutes',
        badge: 'Wed',
        exercises: [
          { name: 'Bodyweight Squats', sets: '3 × 15', note: 'If easy, hold dumbbell at chest (goblet squat).' },
          { name: 'Walking Lunges', sets: '3 × 12 each', note: 'Front knee over ankle, not past toes.' },
          { name: 'Glute Bridges', sets: '3 × 15', note: 'Try single-leg for level up!' },
          { name: 'Leg Press', sets: '3 × 12 (light)', note: 'Machine — push through heels.' },
          { name: 'Standing Calf Raises', sets: '3 × 20', note: 'Slow down for extra burn!' },
        ]
      },
      {
        name: 'Day 4 — Upper Light',
        badge: 'Thu',
        exercises: [
          { name: 'Wall Push-ups', sets: '3 × 15', note: 'Higher reps for endurance.' },
          { name: 'Resistance Band Pull-apart', sets: '3 × 15', note: 'Posture and stability.' },
          { name: 'Dumbbell Bicep Curls', sets: '2 × 15 (light)', note: 'Active recovery day for arms.' },
          { name: 'Cable Tricep Pushdown', sets: '3 × 12 (light)', note: 'Push bar down. Elbows at sides!' },
        ]
      },
      {
        name: 'Day 5 — Lower + Core',
        badge: 'Fri',
        exercises: [
          { name: 'Step-ups', sets: '3 × 10 each', note: 'Use bench or step. Add dumbbells later.' },
          { name: 'Hip Thrusts', sets: '3 × 12', note: 'Back on bench, push hips up. #1 glute exercise!' },
          { name: 'Leg Curls', sets: '3 × 12 (light)', note: 'Targets hamstrings.' },
          { name: 'Plank', sets: '3 × 20-30 sec', note: 'On elbows, body straight. Start with 15 sec!' },
          { name: 'Bird Dogs', sets: '3 × 10 each', note: 'Opposite arm/leg extend. Core stability!' },
          { name: 'Bicycle Crunches', sets: '3 × 15 each', note: 'Slow — twist torso, not just elbows.' },
        ]
      }
    ]
  }
};

export default function GymPage({ allLogs }) {
  const [tier, setTier] = useState('minimum');
  const { tips, loading, refresh } = useTips();
  const [spinning, setSpinning] = useState(false);
  const plan = GYM_PLAN[tier];

  const getTip = (name) => {
    const match = tips.find(t => t.exercise && t.exercise.toLowerCase() === name.toLowerCase());
    return match || null;
  };

  const handleRefresh = async () => {
    setSpinning(true);
    await refresh();
    setTimeout(() => setSpinning(false), 800);
  };

  return (
    <div>
      <div className="refresh-bar">
        <div className="card-title" style={{ marginBottom: 0 }}>🏋️ Your Gym Plan</div>
        <button className={`refresh-btn ${spinning ? 'spinning' : ''}`}
          onClick={handleRefresh} title="Refresh SmartTips from AI">
          🔄
        </button>
      </div>

      <div className="card">
        <div className="tier-tabs">
          <button className={`tier-tab ${tier === 'minimum' ? 'active' : ''}`}
            onClick={() => setTier('minimum')}>Minimum (3 days)</button>
          <button className={`tier-tab ${tier === 'good' ? 'active' : ''}`}
            onClick={() => setTier('good')}>Good (5 days)</button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{plan.desc}</p>
      </div>

      {plan.days.map((day, di) => (
        <div key={di} className="card">
          <div className="split-day-header">
            <span className="day-badge">{day.badge}</span>
            <h3>{day.name}</h3>
          </div>
          {day.exercises.map((ex, ei) => {
            const tipData = getTip(ex.name);
            return (
              <div key={ei} className="exercise-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="exercise-name">{ex.name}</div>
                    <div className="exercise-detail">{ex.sets}</div>
                  </div>
                  {tipData && tipData.nextRx && (
                    <span className="next-rx">📋 Next: {tipData.nextRx}</span>
                  )}
                </div>
                {ex.note && <div className="exercise-note">💡 {ex.note}</div>}
                <a className="yt-link"
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + ' form guide beginner women')}`}
                  target="_blank" rel="noopener noreferrer">
                  ▶ Watch form video
                </a>
                {loading && !tipData && (
                  <div className="smart-tip loading">🧠 Getting your personalized tip...</div>
                )}
                {tipData && tipData.tip && (
                  <div className="smart-tip">🧠 <strong>SmartTip:</strong> {tipData.tip}</div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <div className="card">
        <div className="card-title">📝 Beginner Tips</div>
        <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          <p><strong>🌟 Week 1-2:</strong> Everything feels weird. Just show up and learn movements.</p>
          <p style={{ marginTop: 6 }}><strong>🌟 Week 3-4:</strong> Soreness decreases. Habits form!</p>
          <p style={{ marginTop: 6 }}><strong>🌟 Month 2-3:</strong> Real changes — energy, sleep, clothes fitting different.</p>
          <p style={{ marginTop: 6 }}><strong>💧</strong> Drink water throughout. <strong>⏱</strong> Rest 60-90 sec between sets. <strong>🙋‍♀️</strong> Ask staff anytime. <strong>🎵</strong> Good music = better workouts!</p>
        </div>
      </div>
    </div>
  );
}
