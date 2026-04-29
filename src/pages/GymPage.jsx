import React, { useState } from 'react';
import { useTips } from '../App';

const GYM_PLAN = {
  minimum: {
    label: 'Minimum (3 days)',
    desc: "3 days is all you need to build a habit. You'll be sore at first — that's totally normal! 💕",
    days: [
      {
        name: 'Day 1 — Push',
        badge: 'Mon',
        exercises: [
          { name: 'Wall Push-ups', sets: '3 × 10', note: 'Stand arm-length from a wall, push back and forth. Great starting point!' },
          { name: 'Dumbbell Shoulder Press', sets: '3 × 10 (2-3 kg)', note: 'Sit on a bench, press light dumbbells overhead. Keep core tight!' },
          { name: 'Tricep Kickbacks', sets: '3 × 12 (1-2 kg)', note: 'Lean forward, extend arm back. Start super light!' },
          { name: 'Lateral Raises', sets: '3 × 10 (1-2 kg)', note: 'Raise arms to sides like wings. Tiny weight, big burn!' },
        ]
      },
      {
        name: 'Day 2 — Pull',
        badge: 'Wed',
        exercises: [
          { name: 'Lat Pulldown', sets: '3 × 10 (light)', note: 'Pull the bar to your chest. Ask staff to show you if unsure!' },
          { name: 'Seated Cable Row', sets: '3 × 10 (light)', note: 'Sit upright, pull handle to belly. Squeeze shoulder blades together.' },
          { name: 'Dumbbell Bicep Curls', sets: '3 × 12 (1-2 kg)', note: 'Curl slowly — control matters more than weight!' },
          { name: 'Resistance Band Pull-apart', sets: '3 × 15', note: 'Hold band in front, pull apart. Great for posture!' },
        ]
      },
      {
        name: 'Day 3 — Legs & Glutes',
        badge: 'Fri',
        exercises: [
          { name: 'Bodyweight Squats', sets: '3 × 12', note: 'Feet shoulder-width, sit back like a chair. Keep chest up!' },
          { name: 'Walking Lunges', sets: '3 × 10 each', note: 'Big steps forward, lower back knee. Hold something for balance!' },
          { name: 'Glute Bridges', sets: '3 × 15', note: 'Lie on back, push hips up. Squeeze glutes at top!' },
          { name: 'Standing Calf Raises', sets: '3 × 15', note: 'Rise up on toes on edge of a step. Simple but effective!' },
        ]
      }
    ]
  },
  good: {
    label: 'Good (5 days)',
    desc: "Once 3 days feels easy (usually 4-6 weeks in), level up! You're getting serious Dhruvi! 🔥",
    days: [
      {
        name: 'Day 1 — Push',
        badge: 'Mon',
        exercises: [
          { name: 'Knee Push-ups', sets: '3 × 10', note: 'Upgraded from wall! Keep body straight from knees to head.' },
          { name: 'Dumbbell Chest Press', sets: '3 × 10 (3-5 kg)', note: 'Lie on bench, press dumbbells up. Start light, focus on form.' },
          { name: 'Dumbbell Shoulder Press', sets: '3 × 10 (2-4 kg)', note: 'Seated or standing — feel it in your shoulders!' },
          { name: 'Tricep Kickbacks', sets: '3 × 12 (2-3 kg)', note: 'Ready for slightly heavier now!' },
          { name: 'Lateral Raises', sets: '3 × 12 (1-2 kg)', note: 'Slow and controlled — no swinging!' },
        ]
      },
      {
        name: 'Day 2 — Pull',
        badge: 'Tue',
        exercises: [
          { name: 'Lat Pulldown', sets: '3 × 12', note: 'Pull to upper chest. Feel your back doing the work.' },
          { name: 'Seated Cable Row', sets: '3 × 12', note: 'Sit tall, pull to belly. Back pulls, not arms.' },
          { name: 'Dumbbell Bicep Curls', sets: '3 × 12 (2-3 kg)', note: 'Alternate arms for better focus.' },
          { name: 'Face Pulls', sets: '3 × 15 (light cable)', note: 'Pull rope to face at eye level. Amazing for shoulders!' },
          { name: 'Dead Hangs', sets: '3 × 15-20 sec', note: 'Just hang from a bar! Builds grip, stretches spine.' },
        ]
      },
      {
        name: 'Day 3 — Legs & Glutes',
        badge: 'Wed',
        exercises: [
          { name: 'Bodyweight Squats', sets: '3 × 15', note: 'If easy, hold a dumbbell at chest (goblet squat).' },
          { name: 'Walking Lunges', sets: '3 × 12 each', note: 'Front knee over ankle, not past toes.' },
          { name: 'Glute Bridges', sets: '3 × 15', note: 'Try single-leg version to level up!' },
          { name: 'Leg Press', sets: '3 × 12 (light)', note: 'Machine exercise — push through your heels.' },
          { name: 'Standing Calf Raises', sets: '3 × 20', note: 'Slow on the way down for extra burn!' },
        ]
      },
      {
        name: 'Day 4 — Upper Light',
        badge: 'Thu',
        exercises: [
          { name: 'Wall Push-ups', sets: '3 × 15', note: 'Higher reps for endurance today.' },
          { name: 'Resistance Band Pull-apart', sets: '3 × 15', note: 'Posture and shoulder stability.' },
          { name: 'Dumbbell Bicep Curls', sets: '2 × 15 (light)', note: 'Light weight, higher reps — active recovery.' },
          { name: 'Cable Tricep Pushdown', sets: '3 × 12 (light)', note: 'Push bar/rope down. Elbows at sides!' },
        ]
      },
      {
        name: 'Day 5 — Lower + Core',
        badge: 'Fri',
        exercises: [
          { name: 'Step-ups', sets: '3 × 10 each', note: 'Use a bench or step. Add dumbbells later.' },
          { name: 'Hip Thrusts', sets: '3 × 12', note: 'Back on bench, push hips up. #1 glute exercise!' },
          { name: 'Leg Curls', sets: '3 × 12 (light)', note: 'Targets hamstrings (back of thighs).' },
          { name: 'Plank', sets: '3 × 20-30 sec', note: 'On elbows, body straight. Start with 15 sec if needed!' },
          { name: 'Bird Dogs', sets: '3 × 10 each', note: 'Hands and knees, extend opposite arm/leg. Core stability!' },
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

  const getTipForExercise = (name) => {
    const match = tips.find(t => t.exercise && t.exercise.toLowerCase() === name.toLowerCase());
    return match ? match.tip : null;
  };

  const handleRefresh = async () => {
    setSpinning(true);
    await refresh();
    setTimeout(() => setSpinning(false), 800);
  };

  return (
    <div>
      {/* Refresh bar */}
      <div className="refresh-bar">
        <div className="card-title" style={{ marginBottom: 0 }}>🏋️ Your Gym Plan</div>
        <button className={`refresh-btn ${spinning ? 'spinning' : ''}`} onClick={handleRefresh} title="Refresh SmartTips">
          🔄
        </button>
      </div>

      <div className="card">
        <div className="tier-tabs">
          <button className={`tier-tab ${tier === 'minimum' ? 'active' : ''}`} onClick={() => setTier('minimum')}>
            Minimum (3 days)
          </button>
          <button className={`tier-tab ${tier === 'good' ? 'active' : ''}`} onClick={() => setTier('good')}>
            Good (5 days)
          </button>
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
            const tip = getTipForExercise(ex.name);
            return (
              <div key={ei} className="exercise-item">
                <div className="exercise-name">{ex.name}</div>
                <div className="exercise-detail">{ex.sets}</div>
                {ex.note && <div className="exercise-note">💡 {ex.note}</div>}
                <a className="yt-link"
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + ' form guide beginner women')}`}
                  target="_blank" rel="noopener noreferrer">
                  ▶ Watch form video
                </a>
                {loading && !tip && (
                  <div className="smart-tip loading">🧠 Loading SmartTip...</div>
                )}
                {tip && (
                  <div className="smart-tip">🧠 <strong>SmartTip:</strong> {tip}</div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <div className="card">
        <div className="card-title">📝 Beginner Tips for Dhruvi</div>
        <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          <p><strong>🌟 Week 1-2:</strong> Everything will feel weird. Just focus on showing up and learning movements.</p>
          <p style={{ marginTop: 6 }}><strong>🌟 Week 3-4:</strong> Soreness decreases. Habits start forming!</p>
          <p style={{ marginTop: 6 }}><strong>🌟 Month 2-3:</strong> Real changes — more energy, better sleep, clothes fitting differently.</p>
          <p style={{ marginTop: 6 }}><strong>💧</strong> Drink water throughout. <strong>⏱</strong> Rest 60-90 sec between sets. <strong>🙋‍♀️</strong> Ask staff for help anytime. <strong>🎵</strong> Good music = better workouts!</p>
        </div>
      </div>
    </div>
  );
}
