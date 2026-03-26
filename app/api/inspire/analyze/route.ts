import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { inspireSessions } from '@/lib/db/schema';
import { newId } from '@/lib/utils/id';
import { now } from '@/lib/utils/time';
import { saveInspireImage } from '@/lib/utils/upload';
import { eq } from 'drizzle-orm';

const OLLAMA_BASE = (process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434').replace(/\/api\/?$/, '');

const VISION_PROMPT =
  'Analyze this image for interior design purposes. Identify: 1) dominant colors (as hex codes if possible, otherwise color names), 2) overall mood/feeling, 3) design style (e.g. scandinavian, industrial, bohemian, etc), 4) materials visible, 5) furniture pieces visible (if any), 6) lighting quality/type, 7) the essence or soul of this image in one sentence, 8) whether this is a room photo or something else (sunset, nature, art, etc), 9) if it is a room, what type of room. Respond ONLY with a valid JSON object with these exact keys: colors (string array), mood (string), style (string), materials (string array), furniture (string array), lighting (string), essence (string), isRoom (boolean), roomType (string or null)';

async function tryVisionModel(model: string, imageBase64: string): Promise<Record<string, unknown> | null> {
  let res: Response;
  try {
    res = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: VISION_PROMPT, images: [imageBase64] }],
        stream: false,
      }),
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  if (!data) return null;
  const content: string = data.message?.content ?? '';
  // Extract JSON from the response (model may wrap it in markdown)
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const imageFile = formData.get('image') as File | null;
  if (!imageFile || imageFile.size === 0) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 });
  }

  const buffer = Buffer.from(await imageFile.arrayBuffer());
  const id = newId();
  const imagePath = await saveInspireImage(buffer, id);

  db.insert(inspireSessions).values({ id, imagePath, createdAt: now() }).run();

  const imageBase64 = buffer.toString('base64');

  let analysis: Record<string, unknown> | null = null;
  for (const model of ['llava', 'moondream', 'llava:13b']) {
    analysis = await tryVisionModel(model, imageBase64);
    if (analysis) break;
  }

  if (!analysis) {
    return NextResponse.json({ error: 'vision_unavailable', imagePath, sessionId: id });
  }

  db.update(inspireSessions)
    .set({ analysisResult: JSON.stringify(analysis) })
    .where(eq(inspireSessions.id, id))
    .run();

  return NextResponse.json({ sessionId: id, imagePath, analysis });
}
