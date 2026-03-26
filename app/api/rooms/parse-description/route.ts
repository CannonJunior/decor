import { NextRequest, NextResponse } from 'next/server';

const OLLAMA_BASE = (process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434').replace(/\/api\/?$/, '');
const MODEL = process.env.OLLAMA_CHAT_MODEL ?? 'qwen2.5:7b';

const SYSTEM = `You are a room data parser. Extract structured room data from the user's description.
Return ONLY valid JSON with this exact shape — no markdown fences, no explanation:
{
  "name": string,
  "type": "living_room"|"bedroom"|"dining_room"|"kitchen"|"bathroom"|"office"|"outdoor"|"other",
  "widthFt": number|null,
  "lengthFt": number|null,
  "heightFt": number|null,
  "style": "mid_century"|"scandinavian"|"industrial"|"bohemian"|"contemporary"|"traditional"|"coastal"|"farmhouse"|"eclectic"|"art_deco"|"bauhaus"|"japandi"|"wabi_sabi"|"maximalist"|null,
  "notes": string|null
}
Rules:
- Convert meters to feet (1 m = 3.281 ft), round to 1 decimal place.
- If a field is not mentioned, use null.
- "name" should be a short human label like "Living Room" or "Master Bedroom".
- Only return JSON.`;

export async function POST(req: NextRequest) {
  const body = await req.json() as { text?: string };
  const text = body.text?.trim();
  if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 });

  let res: Response;
  try {
    res = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: text },
        ],
        stream: false,
        think: false,
        format: 'json',
      }),
      signal: AbortSignal.timeout(30000),
    });
  } catch (err) {
    return NextResponse.json({ error: `Ollama unavailable: ${err}` }, { status: 502 });
  }

  if (!res.ok) {
    return NextResponse.json({ error: `Ollama error ${res.status}` }, { status: 502 });
  }

  const data = await res.json() as { message?: { content?: string } };
  const raw = data.message?.content ?? '';

  try {
    // Strip any accidental markdown fences
    const clean = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(clean);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: 'Model returned non-JSON response', raw }, { status: 500 });
  }
}
