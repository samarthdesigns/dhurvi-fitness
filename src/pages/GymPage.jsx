import React, { useState } from 'react';
import { generateSmartTip } from '../utils/nlp';

const GYM_PLAN = {
  minimum: {
    label: 'Minimum (3 days/week)',
    description: "Perfect for getting started! 3 days is all you need to build a habit. You'll be sore at first — that's totally normal and means your body is adapting! 💕",
    days: [
      {
        name: 'Day 1 — Push (Chest, Shoulders, Triceps)',
        badge: 'Mon',
        exercises: [
          { name: 'Wall Push-ups', sets: '3 × 10', note: 'Stand arm-length from a wall, push back and forth. Great for building up to regular push-ups!' },
          { name: 'Dumbbell Shoulder Press', sets: '3 × 10 (2-3 kg)', note: 'Sit on a bench, press light dumbbells overhead. Keep your core tight!' },
          { name: 'Tricep Kickbacks', sets: '3 × 12 (1-2 kg)', note: 'Lean forward slightly, extend arm back. Start super light — it burns more than you\'d think!' },
          { name: 'Lateral Raises', sets: '3 × 10 (1-2 kg)', note: 'Raise arms to your sides like wings. Tiny weight, big burn — that\'s normal!' },
        ]
      },
      {
        name: 'Day 2 — Pull (Back, Biceps)',
        badge: 'Wed',
        exercises: [
          { name: 'Lat Pulldown', sets: '3 × 10 (light)', note: 'Use the machine — pull the bar to your chest. Ask staff to show you if unsure, no shame in that!' },
          { name: 'Seated Cable Row', sets: '3 × 10 (light)', note: 'Sit upright, pull the handle to your belly. Squeeze your shoulder blades together.' },
          { name: 'Dumbbell Bicep Curls', sets: '3 × 12 (1-2 kg)', note: 'Start with light weights. Curl slowly — control matters more than weight!' },
          { name: 'Resistance Band Pull-apart', sets: '3 × 15', note: 'Hold a band in front of you, pull it apart. Great for posture!' },
        ]
      },
      {
        name: 'Day 3 — Legs & Glutes',
        badge: 'Fri',
        exercises: [
          { name: 'Bodyweight Squats', sets: '3 × 12', note: 'Feet shoulder-width, sit back like sitting in a chair. Keep your chest up!' },
          { name: 'Walking Lunges', sets: '3 × 10 each leg', note: 'Take big steps forward, lower your back knee. Hold onto something if you need balance!' },
          { name: 'Glute Bridges', sets: '3 × 15', note: 'Lie on your back, push your hips up. Squeeze your glutes at the top — great for building a strong booty!' },
          { name: 'Standing Calf Raises', sets: '3 × 15', note: 'Stand on the edge of a step, rise up on your toes. Simple but effective!' },
        ]
      }
    ]
  },
  good: {
    label: 'Good (5 days/week)',
    description: "Once 3 days feels comfortable (usually after 4-6 weeks), level up to 5 days! This adds upper body and lower body + core days. You're getting serious Dhruvi! 🔥",
    days: [
      {
        name: 'Day 1 — Push (Chest, Shoulders, Triceps)',
        badge: 'Mon',
        exercises: [
          { name: 'Knee Push-ups', sets: '3 × 10', note: 'Upgraded from wall push-ups! Keep your body in a straight line from knees to head.' },
          { name: 'Dumbbell Chest Press', sets: '3 × 10 (3-5 kg)', note: 'Lie on a bench, press dumbbells up. Start light and focus on the movement.' },
          { name: 'Dumbbell Shoulder Press', sets: '3 × 10 (2-4 kg)', note: 'Seated or standing, press overhead. You should feel this in your shoulders!' },
          { name: 'Tricep Kickbacks', sets: '3 × 12 (2-3 kg)', note: 'By now you might be ready for slightly heavier weights!' },
          { name: 'Lateral Raises', sets: '3 × 12 (1-2 kg)', note: 'Slow and controlled — no swinging!' },
        ]
      },
      {
        name: 'Day 2 — Pull (Back, Biceps)',
        badge: 'Tue',
        exercises: [
          { name: 'Lat Pulldown', sets: '3 × 12 (light-medium)', note: 'Pull the bar to your upper chest. Feel your back doing the work.' },
          { name: 'Seated Cable Row', sets: '3 × 12 (light-medium)', note: 'Sit tall, pull to belly. Your back should be doing the pulling, not your arms.' },
          { name: 'Dumbbell Bicep Curls', sets: '3 × 12 (2-3 kg)', note: 'Alternate arms if it helps you focus on form.' },
          { name: 'Face Pulls', sets: '3 × 15 (light cable)', note: 'Pull the rope to your face at eye level. Amazing for shoulder health!' },
          { name: 'Dead Hangs', sets: '3 × 15-20 sec', note: 'Just hang from a bar! Builds grip strength and stretches your spine. Start with 10 seconds if needed.' },
        ]
      },
      {
        name: 'Day 3 — Legs & Glutes',
        badge: 'Wed',
        exercises: [
          { name: 'Bodyweight Squats', sets: '3 × 15', note: 'More reps now! If these feel easy, hold a 3-5 kg dumbbell at your chest (goblet squat).' },
          { name: 'Walking Lunges', sets: '3 × 12 each leg', note: 'Keep your front knee over your ankle, not past your toes.' },
          { name: 'Glute Bridges', sets: '3 × 15', note: 'Ready to level up? Try single-leg glute bridges!' },
          { name: 'Leg Press', sets: '3 × 12 (light)', note: 'Use the machine with very light weight. Push through your heels.' },
          { name: 'Standing Calf Raises', sets: '3 × 20', note: 'Slow on the way down for extra burn!' },
        ]
      },
      {
        name: 'Day 4 — Upper Body Light',
        badge: 'Thu',
        exercises: [
          { name: 'Wall Push-ups', sets: '3 × 15', note: 'Higher reps for endurance. Focus on slow, controlled movement.' },
          { name: 'Resistance Band Pull-apart', sets: '3 × 15', note: 'Great for posture and shoulder stability.' },
          { name: 'Dumbbell Bicep Curls', sets: '2 × 15 (light)', note: 'Light weight, higher reps today — it\'s an active recovery day for arms.' },
          { name: 'Cable Tricep Pushdown', sets: '3 × 12 (light)', note: 'Use the cable machine, push the bar or rope down. Elbows stay at your sides!' },
          { name: 'Lateral Raises', sets: '2 × 12 (1 kg)', note: 'Super light today — just keeping the muscles engaged.' },
        ]
      },
      {
        name: 'Day 5 — Lower Body + Core',
        badge: 'Fri',
        exercises: [
          { name: 'Step-ups', sets: '3 × 10 each leg', note: 'Use a bench or step. Step up, step down. Add dumbbells later when you\'re ready.' },
          { name: 'Hip Thrusts', sets: '3 × 12', note: 'Back on a bench, push hips up. The #1 glute exercise! Start bodyweight, add weight later.' },
          { name: 'Leg Curls', sets: '3 × 12 (light)', note: 'Machine exercise — targets your hamstrings (back of thighs).' },
          { name: 'Plank', sets: '3 × 20-30 sec', note: 'On your elbows, body straight like a board. Start with 15 seconds if needed!' },
          { name: 'Bird Dogs', sets: '3 × 10 each side', note: 'On hands and knees, extend opposite arm and leg. Builds core stability!' },
          { name: 'Bicycle Crunches', sets: '3 × 15 each side', note: 'Slow and controlled — twist your torso, don\'t just move your elbows.' },
        ]
      }
    ]
  }
};

export default function GymPage({ allLogs }) {
  const [tier, setTier] = useState('minimum');
  const plan = GYM_PLAN[tier];

  return (
    <div className="page">
      <div className="card">
        <div className="card-title">🏋️ Your Gym Plan</div>
        <div className="tier-tabs">
          <button className={`tier-tab ${tier === 'minimum' ? 'active' : ''}`} onClick={() => setTier('minimum')}>
            Minimum (3 days)
          </button>
          <button className={`tier-tab ${tier === 'good' ? 'active' : ''}`} onClick={() => setTier('good')}>
            Good (5 days)
          </button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-light)', lineHeight: 1.5, marginBottom: 16 }}>
          {plan.description}
        </p>
      </div>

      {plan.days.map((day, di) => (
        <div key={di} className="card split-day">
          <div className="split-day-header">
            <span className="day-badge">{day.badge}</span>
            <h3>{day.name}</h3>
          </div>
          {day.exercises.map((ex, ei) => {
            const tip = generateSmartTip(ex.name, allLogs || []);
            return (
              <div key={ei} className="exercise-item">
                <div className="exercise-name">{ex.name}</div>
                <div className="exercise-detail">{ex.sets}</div>
                {ex.note && <div className="exercise-note">💡 {ex.note}</div>}
                <a className="yt-link" href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + ' form guide beginner women')}`}
                  target="_blank" rel="noopener noreferrer">
                  ▶ Watch form video
                </a>
                {allLogs && allLogs.length > 0 && tip && (
                  <div className={`smart-tip ${tip.type}`}>
                    🧠 <strong>SmartTip:</strong> {tip.message}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <div className="card">
        <div className="card-title">📝 Beginner Tips for Dhruvi</div>
        <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>
          <p><strong>🌟 Week 1-2:</strong> Everything will feel weird and hard. That's 100% normal! Just focus on showing up and learning the movements.</p>
          <p style={{ marginTop: 8 }}><strong>🌟 Week 3-4:</strong> You'll start feeling more comfortable with the exercises. Soreness decreases. This is when habits form!</p>
          <p style={{ marginTop: 8 }}><strong>🌟 Month 2-3:</strong> Now you'll notice real changes — more energy, better sleep, clothes fitting differently. This is where it gets exciting!</p>
          <p style={{ marginTop: 8 }}><strong>💧 Hydration:</strong> Drink water throughout your workout. Keep a bottle with you!</p>
          <p style={{ marginTop: 8 }}><strong>⏱ Rest:</strong> Rest 60-90 seconds between sets. Use this time to breathe and check your phone if you want 😄</p>
          <p style={{ marginTop: 8 }}><strong>🙋‍♀️ Ask for help:</strong> Gym staff are there to help! If you don't know how to use a machine, just ask. Everyone started as a beginner.</p>
          <p style={{ marginTop: 8 }}><strong>🎵 Music:</strong> Make a playlist that hypes you up. Good music = better workouts!</p>
        </div>
      </div>
    </div>
  );
}
