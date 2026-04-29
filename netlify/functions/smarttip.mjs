// Netlify Function: Gemini SmartTip generator
// Receives exercise data, returns personalized tips via Gemini 2.5 Flash Lite

export default async (request) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), { status: 405 });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), { status: 500 });
  }

  try {
    const { exercises } = await request.json();
    // exercises = [{ name, latest: { detail, date }, history: [{ detail, date }] }]

    if (!exercises || exercises.length === 0) {
      return new Response(JSON.stringify({ tips: [] }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build the prompt — each exercise is independent
    let exerciseBlocks = exercises.map((ex, i) => {
      const historyLines = (ex.history || [])
        .slice(-8) // last 8 sessions max
        .map(h => `    ${h.date}: ${h.detail}`)
        .join('\n');

      return `${i + 1}. ${ex.name}
   Latest session (${ex.latest.date}): ${ex.latest.detail}
   Previous sessions:
${historyLines || '    (none — first session)'}`;
    }).join('\n\n');

    const prompt = `You are a warm, supportive fitness coach for Dhruvi, a beginner girl who just started going to the gym. She knows very little about fitness and needs encouragement.

Generate a short SmartTip (1-2 sentences) for EACH exercise below. Each tip must be based ONLY on that exercise's own data — never reference other exercises.

Guidelines for tips:
- If it's her first session: Welcome her warmly, suggest focusing on form
- If she improved (more reps or weight): Celebrate the progress enthusiastically  
- If volume dropped: Be gentle, remind her rest days matter
- If she's been at the same weight 3+ sessions: Suggest a small increase
- If there was a big weight jump: Caution about form
- Always be specific (mention actual weights/reps from her data)
- Use her name "Dhruvi" occasionally
- Add an emoji or two naturally
- Keep each tip under 40 words

Respond with ONLY a valid JSON array, no markdown, no backticks:
[{"exercise":"exact exercise name","tip":"your tip here"}]

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
            maxOutputTokens: 1024,
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

    // Extract text from Gemini response
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

    // Clean potential markdown fences
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
