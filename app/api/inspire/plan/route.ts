import { NextRequest } from 'next/server';
import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { db } from '@/lib/db/client';
import { inspireSessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { AnalysisResult, Room, CatalogItem } from '@/components/inspire/types';

const OLLAMA_BASE = (process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434').replace(/\/api\/?$/, '');

type PlanRequestBody = {
  sessionId: string;
  mode: 'shop' | 'rearrange' | 'style' | 'brief';
  analysis: AnalysisResult;
  userChoices: Record<string, unknown>;
  rooms: Room[];
  catalogItems: CatalogItem[];
};

function buildSystemPrompt(body: PlanRequestBody): string {
  const { mode, analysis, userChoices, rooms, catalogItems } = body;

  const analysisStr = `colors: ${analysis.colors.join(', ')}; mood: ${analysis.mood}; style: ${analysis.style}; materials: ${analysis.materials.join(', ')}; furniture: ${analysis.furniture.join(', ')}; lighting: ${analysis.lighting}; essence: "${analysis.essence}"`;

  const catalogStr = catalogItems.length
    ? catalogItems.map((i) => `${i.name} (${i.category ?? 'item'}${i.style ? `, ${i.style}` : ''})`).join(', ')
    : 'none catalogued';

  if (mode === 'shop') {
    const roomId = userChoices.roomId as string;
    const room = rooms.find((r) => r.id === roomId);
    const roomName = room ? room.name : 'your space';
    const budget = userChoices.budget as string;
    const existing = userChoices.existing as string;

    return `You are an expert interior designer and personal shopper. The user has uploaded an image with this analysis: ${analysisStr}. They want to shop for items to recreate this look in their ${roomName}. Their budget is ${budget}.${existing ? ` They already own: ${existing}.` : ''}

Their existing catalog includes: ${catalogStr}.

Generate:
1) A prioritized shopping list of specific items with estimated prices, descriptions, and search terms to find them online.
2) Which items from their existing catalog could work and how to style them.
3) Tips for finding these items on a budget.

Format with clear sections and markdown. Be specific with product types, dimensions, and materials.`;
  }

  if (mode === 'rearrange') {
    const roomId = userChoices.roomId as string;
    const room = rooms.find((r) => r.id === roomId);
    const roomName = room ? room.name : 'your space';
    const dimensions = room?.widthFt ? `${room.widthFt}ft × ${room.lengthFt}ft` : 'unknown dimensions';
    const priority = userChoices.priority as string;
    const roomItems = catalogItems.filter((i) => i.roomId === roomId);
    const furnitureStr = roomItems.length
      ? roomItems.map((i) => `${i.name} (${i.category ?? 'item'})`).join(', ')
      : 'no items catalogued for this room';

    return `You are an expert interior designer specializing in space planning. Image analysis: ${analysisStr}. Room: ${roomName}, ${dimensions}. Existing furniture in this room: ${furnitureStr}. Priority: ${priority}.

Generate:
1) A step-by-step rearrangement plan describing exactly where each piece should move.
2) Why this arrangement captures the inspiration image's layout and vibe.
3) Any pieces that should be stored or removed to achieve the look.
4) Quick wins they can do in under an hour.

Be specific with placement directions (e.g. "move the sofa to face the window on the north wall").`;
  }

  if (mode === 'style') {
    const scope = userChoices.scope as string;
    const roomId = userChoices.roomId as string | undefined;
    const targetRooms = scope === 'room' && roomId
      ? rooms.filter((r) => r.id === roomId).map((r) => r.name).join(', ')
      : rooms.map((r) => r.name).join(', ') || 'all rooms';
    const changes = (userChoices.changes as string[]).join(', ') || 'everything';
    const boldness = userChoices.boldness as number;
    const boldLabel = boldness <= 3 ? 'Subtle' : boldness <= 6 ? 'Moderate' : boldness <= 9 ? 'Bold' : 'Dramatic reinvention';

    return `You are an expert interior stylist. Image analysis: ${analysisStr}. Essence: "${analysis.essence}". Applying to: ${targetRooms}. Elements to change: ${changes}. Transformation level: ${boldness}/10 (${boldLabel}).

Generate:
1) Specific paint color recommendations (with paint brand names and codes where possible).
2) Textile and accessory changes (throw pillows, rugs, curtains, etc.).
3) Lighting adjustments (bulb warmth, fixture types, lampshades).
4) Plants and organic elements to incorporate.
5) A "do this weekend" quick-start list — the highest-impact, lowest-effort changes first.

Calibrate the boldness of your suggestions to the ${boldLabel} transformation level.`;
  }

  // brief
  const roomIds = (userChoices.roomIds as string[]) ?? [];
  const targetRooms = roomIds.length
    ? rooms.filter((r) => roomIds.includes(r.id)).map((r) => r.name).join(', ')
    : rooms.map((r) => r.name).join(', ') || 'all rooms';
  const timeline = userChoices.timeline as string;
  const diy = userChoices.diy as string;
  const budget = userChoices.budget as string;

  return `You are a senior interior designer creating a full project brief. Image analysis: ${analysisStr}. Rooms: ${targetRooms}. Timeline: ${timeline}. DIY comfort: ${diy}. Budget: $${budget}.

Generate a comprehensive brief including:
1) Executive summary of the design vision (2-3 sentences).
2) Color palette — primary, secondary, and accent colors with names and hex codes.
3) Material palette — key textures and materials to incorporate.
4) Room-by-room transformation plan with specific changes for each room.
5) Prioritized shopping list with estimated costs that add up within the budget.
6) Timeline breakdown — what to tackle first, second, and last.
7) DIY vs professional tasks — clearly marked based on their comfort level.
8) Final tips for staying on-vision throughout the project.

Format with clear sections, use markdown headers and bullet points.`;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as PlanRequestBody;
  const { sessionId, mode } = body;
  const modelName = process.env.OLLAMA_CHAT_MODEL ?? 'qwen2.5:7b';

  const systemPrompt = buildSystemPrompt(body);

  const ollamaMessages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Create my ${mode === 'shop' ? 'shopping' : mode === 'rearrange' ? 'rearrangement' : mode === 'style' ? 'style' : 'design'} plan based on this inspiration image.` },
  ];

  let ollamaRes: Response;
  try {
    ollamaRes = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        messages: ollamaMessages,
        stream: true,
        think: false,
        options: { num_ctx: 8192 },
      }),
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Cannot reach Ollama — is it running? (${err})` }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!ollamaRes.ok || !ollamaRes.body) {
    const errorText = await ollamaRes.text().catch(() => '');
    return new Response(
      JSON.stringify({ error: `Ollama error ${ollamaRes.status}: ${errorText || `is ${modelName} installed?`}` }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const responseBody = ollamaRes.body;
  const textId = 'text-0';
  const decoder = new TextDecoder();

  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: async ({ writer }) => {
        writer.write({ type: 'text-start', id: textId });
        const reader = responseBody.getReader();
        let accumulated = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const lines = decoder.decode(value, { stream: true }).split('\n').filter(Boolean);
            for (const line of lines) {
              try {
                const json = JSON.parse(line);
                if (json.message?.content) {
                  accumulated += json.message.content;
                  writer.write({ type: 'text-delta', id: textId, delta: json.message.content });
                }
              } catch {
                // skip malformed lines
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
        writer.write({ type: 'text-end', id: textId });

        // Persist the plan to DB after streaming completes
        if (sessionId && accumulated) {
          try {
            db.update(inspireSessions)
              .set({
                mode,
                userChoices: JSON.stringify(body.userChoices),
                planResult: accumulated,
                roomIds: JSON.stringify(
                  body.mode === 'brief'
                    ? (body.userChoices.roomIds ?? [])
                    : body.userChoices.roomId
                    ? [body.userChoices.roomId]
                    : []
                ),
              })
              .where(eq(inspireSessions.id, sessionId))
              .run();
          } catch {
            // non-fatal — streaming already succeeded
          }
        }
      },
      onError: (err) => `Error: ${String(err)}`,
    }),
  });
}
