// Netlify Function: Gemini SmartTip generator
// Enhanced: sends exercise-specific history for tips on weight/sets/reps
// If no history: sends other exercises to gauge overall fitness level

export default async (request) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), { status: 405 });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), { status: 500 });
  }

  try {
    const { exercises, allExerciseSummary } = await request.json();
    // exercises = [{ name, history: [{ date, detail }] }]  — one per exercise on the gym page
    // allExerciseSummary = [{ name, sessionCount, lastDetail, lastDate }] — overview of all logged exercises

    if (!exercises || exercises.length === 0) {
      return new Response(JSON.stringify({ tips: [] }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build per-exercise blocks
    let exerciseBlocks = exercises.map((ex, i) => {
      const hasHistory = ex.history && ex.history.length > 0;

      if (hasHistory) {
        // Send this exercise's own history (last 10 sessions)
        const sessions = ex.history.slice(-10);
        const latest = sessions[sessions.length - 1];
        const older = sessions.slice(0, -1);

        const historyLines = older.map(h => `    ${h.date}: ${h.detail}`).join('\n');

        return `${i + 1}. ${ex.name} [HAS HISTORY]
   Latest session (${latest.date}): ${latest.detail}
   Previous sessions (oldest first):
${historyLines || '    (only one session so far)'}

   → Analyze her progression for THIS exercise only. Recommend specific weight (kg), sets, and reps for her NEXT session. If she's ready to increase weight, say by how much. If she should stay, explain why.`;

      } else {
        // No history — send context about her other exercises so Gemini can gauge her level
        const contextBlock = (allExerciseSummary && allExerciseSummary.length > 0)
          ? `   Her other exercise data (to gauge her fitness level):
${allExerciseSummary.map(s => `    - ${s.name}: ${s.sessionCount} sessions, last did "${s.lastDetail}" on ${s.lastDate}`).join('\n')}`
          : `   She has no gym history at all — complete beginner.`;

        return `${i + 1}. ${ex.name} [NO HISTORY — FIRST TIME]
${contextBlock}

   → Based on her overall level (or lack thereof), recommend a starting weight (kg), sets, and reps for this exercise. Be very specific. If it's a bodyweight exercise, just recommend sets and reps.`;
      }
    }).join('\n\n');

    const prompt = `You are a warm, supportive gym coach for Dhruvi, a beginner girl who recently started going to the gym. She's vegetarian, focused on building strength and losing weight at 1450 calories/day. She needs encouragement but also SPECIFIC, ACTIONABLE advice.

Generate a SmartTip for EACH exercise below. Each tip MUST include:
- Specific recommendation: exact weight in kg (or "bodyweight"), exact sets × reps for next session
- Brief reasoning based on her data (or lack of it)
- Warm encouragement — use her name "Dhruvi" occasionally, add an emoji

Rules:
- Each exercise's tip must be based ONLY on that exercise's own history (never mix data between exercises)
- For exercises with [NO HISTORY], use the other exercise summary to gauge if she's a total beginner or has some gym experience, then recommend accordingly
- Keep each tip 2-3 sentences, under 50 words
- Be specific with numbers — "try 3×10 at 4kg" not "increase slightly"
- If she's been consistent at a weight and hitting 12+ reps, suggest a specific increase
- If volume dropped, suggest staying at current weight and focusing on form

Respond with ONLY a valid JSON array, no markdown, no backticks:
[{"exercise":"exact exercise name","tip":"your tip here","nextRx":"3×12 @ 5kg"}]

The "nextRx" field is a short prescription like "3×12 @ 5kg" or "3×15 bodyweight" for quick reference.

Exercises:

${exerciseBlocks}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7
          }
        })
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', geminiRes.status, errText);
      return new Response(JSON.stringify({ error: 'Gemini API error', status: geminiRes.status }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    let tips;
    try {
      tips = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse Gemini response:', cleaned);
      tips = [];
    }

    return new Response(JSON.stringify({ tips }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('SmartTip function error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = {
  path: "/api/smarttip"
};
