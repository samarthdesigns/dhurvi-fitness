// ============ SMART TIP ENGINE ============
// Analyzes exercise history and suggests next weight/reps

export function generateSmartTip(exerciseName, allLogs) {
  const history = [];

  for (const log of allLogs) {
    let exercises = [];
    try {
      const parsed = typeof log.exercises === 'string' ? JSON.parse(log.exercises) : log.exercises;
      if (Array.isArray(parsed)) exercises = parsed;
    } catch { continue; }

    for (const ex of exercises) {
      if ((ex.name || '').toLowerCase() === exerciseName.toLowerCase() && ex.detail) {
        const sets = parseSets(ex.detail);
        if (sets.length > 0) {
          history.push({ date: log.date, sets, raw: ex.detail });
        }
      }
    }
  }

  if (history.length === 0) {
    return { type: 'start', message: `First time doing ${exerciseName}? Start light — focus on form over weight. You got this! 💪` };
  }

  history.sort((a, b) => a.date.localeCompare(b.date));

  const latest = history[history.length - 1];
  const latestVol = totalVolume(latest.sets);
  const latestMaxW = Math.max(...latest.sets.map(s => s.weight));

  if (history.length === 1) {
    return {
      type: 'early',
      message: `Nice start! You did ${latest.sets.length} set(s) last time. Try to keep the same weight and aim for 1 more rep per set next time.`
    };
  }

  const prev = history[history.length - 2];
  const prevVol = totalVolume(prev.sets);
  const prevMaxW = Math.max(...prev.sets.map(s => s.weight));

  // Detect drops
  if (latestVol < prevVol * 0.8) {
    return {
      type: 'drop',
      message: `Volume dropped from last session. That's okay — recovery matters! Stick with ${latestMaxW}kg and aim for consistent reps before going heavier.`
    };
  }

  // Detect plateau (3+ sessions at same weight)
  if (history.length >= 3) {
    const last3Weights = history.slice(-3).map(h => Math.max(...h.sets.map(s => s.weight)));
    if (last3Weights.every(w => w === last3Weights[0])) {
      const bump = last3Weights[0] <= 5 ? 0.5 : last3Weights[0] <= 15 ? 1 : 2;
      return {
        type: 'plateau',
        message: `You've been at ${last3Weights[0]}kg for 3 sessions — plateau detected! Try ${last3Weights[0] + bump}kg for your first set, even if you do fewer reps. Progress isn't always linear!`
      };
    }
  }

  // Detect overreaching (weight jumped too much)
  if (latestMaxW > prevMaxW * 1.25 && latestMaxW - prevMaxW > 2) {
    return {
      type: 'overreach',
      message: `Big weight jump detected (${prevMaxW}→${latestMaxW}kg)! Make sure your form is solid. If the last reps felt shaky, dial back to ${prevMaxW + 1}kg and build up gradually.`
    };
  }

  // Ready to progress
  const allRepsHigh = latest.sets.every(s => s.reps >= 12);
  if (allRepsHigh) {
    const bump = latestMaxW <= 5 ? 0.5 : latestMaxW <= 15 ? 1 : 2;
    return {
      type: 'progress',
      message: `You're hitting 12+ reps on all sets — time to level up! Try ${latestMaxW + bump}kg next session and aim for 8-10 reps. You've earned this! 🎉`
    };
  }

  // General encouragement
  const volChange = ((latestVol - prevVol) / prevVol * 100).toFixed(0);
  if (latestVol > prevVol) {
    return {
      type: 'improving',
      message: `Volume up ${volChange}% from last session — great progress! Keep ${latestMaxW}kg and focus on controlled reps with good form.`
    };
  }

  return {
    type: 'steady',
    message: `Consistent work at ${latestMaxW}kg. Aim for one more rep per set next time — small wins add up! Keep going Dhruvi 💕`
  };
}

function parseSets(text) {
  if (!text) return [];
  const sets = [];
  // Pattern: "3x10 @ 5kg" or "10kg x 12" or "3 sets 10 reps 5kg" etc.
  const patterns = [
    /(\d+)\s*[x×]\s*(\d+)\s*[@at]*\s*(\d+\.?\d*)\s*(?:kg|lb)?/gi,
    /(\d+\.?\d*)\s*(?:kg|lb)\s*[x×]\s*(\d+)/gi,
    /set[s]?\s*[:=]?\s*(\d+)[,\s]*rep[s]?\s*[:=]?\s*(\d+)[,\s]*(?:weight|w)\s*[:=]?\s*(\d+\.?\d*)/gi,
  ];

  let match;
  // Try first pattern: SxR @ Wkg
  const p1 = /(\d+)\s*[x×]\s*(\d+)\s*[@at]*\s*(\d+\.?\d*)\s*(?:kg|lb)?/gi;
  while ((match = p1.exec(text)) !== null) {
    const numSets = parseInt(match[1]);
    const reps = parseInt(match[2]);
    const weight = parseFloat(match[3]);
    for (let i = 0; i < Math.min(numSets, 10); i++) {
      sets.push({ reps, weight });
    }
  }
  if (sets.length > 0) return sets;

  // Try: Wkg x R
  const p2 = /(\d+\.?\d*)\s*(?:kg|lb)\s*[x×]\s*(\d+)/gi;
  while ((match = p2.exec(text)) !== null) {
    sets.push({ reps: parseInt(match[2]), weight: parseFloat(match[1]) });
  }
  if (sets.length > 0) return sets;

  // Simple: just reps (bodyweight)
  const p3 = /(\d+)\s*(?:reps?|times)/gi;
  while ((match = p3.exec(text)) !== null) {
    sets.push({ reps: parseInt(match[1]), weight: 0 });
  }

  return sets;
}

function totalVolume(sets) {
  return sets.reduce((sum, s) => sum + (s.weight || 1) * s.reps, 0);
}

// ============ SMART INSIGHT ENGINE ============
// Generates insights from all logs for analytics panels

export function generateNutritionInsights(logs, target = 1450) {
  const insights = [];
  const recentLogs = logs
    .filter(l => l.calories != null)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14);

  if (recentLogs.length === 0) return [{ type: 'info', text: 'Start logging your meals to see nutrition insights here!' }];

  const avgCal = recentLogs.reduce((s, l) => s + (l.calories || 0), 0) / recentLogs.length;
  const avgProtein = recentLogs.filter(l => l.protein).reduce((s, l) => s + l.protein, 0) / (recentLogs.filter(l => l.protein).length || 1);
  const avgFiber = recentLogs.filter(l => l.fiber).reduce((s, l) => s + l.fiber, 0) / (recentLogs.filter(l => l.fiber).length || 1);

  if (avgCal > target * 1.1) {
    insights.push({ type: 'warn', text: `Your 2-week calorie average is ${Math.round(avgCal)} — a bit over your ${target} target. Small swaps like switching snacks to fruits can help!` });
  } else if (avgCal < target * 0.85) {
    insights.push({ type: 'warn', text: `Averaging ${Math.round(avgCal)} calories — that's quite low! Undereating can slow your metabolism. Try adding a nutritious snack.` });
  } else {
    insights.push({ type: 'good', text: `Calorie average is ${Math.round(avgCal)} — right on track with your ${target} target! Consistency is key 🌟` });
  }

  if (avgProtein > 0) {
    if (avgProtein < 50) {
      insights.push({ type: 'warn', text: `Protein averaging ${Math.round(avgProtein)}g — try to hit 55-65g for muscle recovery. Add paneer, dal, or Greek yogurt!` });
    } else {
      insights.push({ type: 'good', text: `Protein at ${Math.round(avgProtein)}g average — solid for recovery and strength building!` });
    }
  }

  if (avgFiber > 0) {
    if (avgFiber < 20) {
      insights.push({ type: 'info', text: `Fiber at ${Math.round(avgFiber)}g — adding more veggies, fruits and whole grains can help you feel fuller longer.` });
    }
  }

  // Consistency check
  const last7Days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().split('T')[0]);
  }
  const loggedDays = recentLogs.filter(l => last7Days.includes(l.date)).length;
  if (loggedDays >= 6) {
    insights.push({ type: 'good', text: `${loggedDays}/7 days logged this week — amazing consistency Dhruvi! 📝` });
  } else if (loggedDays <= 3) {
    insights.push({ type: 'info', text: `Only ${loggedDays} days logged this week — try to log daily, even on rest days. It builds awareness!` });
  }

  return insights;
}

export function generateExerciseInsights(exerciseName, allLogs) {
  const history = [];
  for (const log of allLogs) {
    let exercises = [];
    try {
      const parsed = typeof log.exercises === 'string' ? JSON.parse(log.exercises) : log.exercises;
      if (Array.isArray(parsed)) exercises = parsed;
    } catch { continue; }

    for (const ex of exercises) {
      if ((ex.name || '').toLowerCase() === exerciseName.toLowerCase() && ex.detail) {
        const sets = parseSets(ex.detail);
        if (sets.length > 0) {
          history.push({ date: log.date, sets });
        }
      }
    }
  }

  if (history.length < 2) return [{ type: 'info', text: 'Log more sessions to see exercise progression insights!' }];

  history.sort((a, b) => a.date.localeCompare(b.date));

  const insights = [];
  const vols = history.map(h => totalVolume(h.sets));
  const maxWeights = history.map(h => Math.max(...h.sets.map(s => s.weight)));

  // PR detection
  const allTimeMaxW = Math.max(...maxWeights);
  if (maxWeights[maxWeights.length - 1] === allTimeMaxW && history.length > 2) {
    insights.push({ type: 'good', text: `🏆 PR! ${allTimeMaxW}kg is your all-time best on ${exerciseName}!` });
  }

  // Volume trend
  if (vols.length >= 3) {
    const recent = vols.slice(-3);
    const increasing = recent[2] > recent[0];
    if (increasing) {
      insights.push({ type: 'good', text: `Volume trending up over last 3 sessions — your strength is building! Keep it up!` });
    }
  }

  // Total sessions
  insights.push({ type: 'info', text: `${history.length} total sessions logged for ${exerciseName}. Consistency matters most!` });

  return insights;
}

export function generateCardioInsights(cardioType, allLogs) {
  const sessions = [];
  for (const log of allLogs) {
    let cardio = [];
    try {
      const parsed = typeof log.cardio === 'string' ? JSON.parse(log.cardio) : log.cardio;
      if (Array.isArray(parsed)) cardio = parsed;
    } catch { continue; }

    for (const c of cardio) {
      if ((c.type || '').toLowerCase() === cardioType.toLowerCase() && c.value) {
        sessions.push({ date: log.date, value: c.value });
      }
    }
  }

  if (sessions.length < 2) return [{ type: 'info', text: `Log more ${cardioType} sessions to unlock cardio insights!` }];

  sessions.sort((a, b) => a.date.localeCompare(b.date));
  const insights = [];

  // Parse numeric values
  const nums = sessions.map(s => {
    const match = String(s.value).match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  }).filter(n => n > 0);

  if (nums.length >= 2) {
    const first = nums.slice(0, Math.ceil(nums.length / 2));
    const second = nums.slice(Math.ceil(nums.length / 2));
    const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
    const avgSecond = second.reduce((a, b) => a + b, 0) / second.length;

    if (avgSecond > avgFirst) {
      insights.push({ type: 'good', text: `Your ${cardioType} performance is improving — earlier average ${avgFirst.toFixed(1)} vs recent ${avgSecond.toFixed(1)}. Keep pushing! 🏃‍♀️` });
    }
  }

  insights.push({ type: 'info', text: `${sessions.length} ${cardioType} sessions logged total. Every step counts!` });

  return insights;
}
