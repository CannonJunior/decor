import { NextRequest, NextResponse } from 'next/server';

const OLLAMA_BASE = (process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434').replace(/\/api\/?$/, '');
const VISION_MODEL = process.env.OLLAMA_VISION_MODEL ?? 'llava';

const PROMPT = `Analyze this room photo. Return ONLY valid JSON with no markdown fences:
{
  "type": "living_room"|"bedroom"|"dining_room"|"kitchen"|"bathroom"|"office"|"outdoor"|"other",
  "style": "mid_century"|"scandinavian"|"industrial"|"bohemian"|"contemporary"|"traditional"|"coastal"|"farmhouse"|"eclectic"|"art_deco"|"bauhaus"|"japandi"|"wabi_sabi"|"maximalist"|null,
  "notes": string (1-2 sentences describing the aesthetic you observe, or null),
  "colorPalette": string[] (2-5 dominant hex color codes you observe in walls, floor, or large furniture)
}`;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const image = formData.get('image') as File | null;
  if (!image || image.size === 0) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 });
  }

  const buffer = Buffer.from(await image.arrayBuffer());
  const base64 = buffer.toString('base64');

  let res: Response;
  try {
    res = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [{
          role: 'user',
          content: PROMPT,
          images: [base64],
        }],
        stream: false,
        format: 'json',
      }),
      signal: AbortSignal.timeout(60000),
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Vision model "${VISION_MODEL}" unreachable. Is Ollama running? (${err})` },
      { status: 502 }
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      {
        error: `Vision model "${VISION_MODEL}" not available. Install with: ollama pull ${VISION_MODEL}`,
      },
      { status: 502 }
    );
  }

  const data = await res.json() as { message?: { content?: string } };
  const raw = data.message?.content ?? '';

  try {
    const clean = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(clean);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: 'Model returned non-JSON response', raw }, { status: 500 });
  }
}
