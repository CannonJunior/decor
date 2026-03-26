import { NextRequest } from 'next/server';
import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { db } from '@/lib/db/client';
import { rooms, catalogItems, wishlistItems } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

// Normalize: strip trailing /api so we can always append /api/chat ourselves
const OLLAMA_BASE = (process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434').replace(/\/api\/?$/, '');

function buildSystemPrompt(mode: string): string {
  const allRooms = db.select().from(rooms).orderBy(desc(rooms.createdAt)).all();
  const ownedItems = db.select().from(catalogItems).orderBy(desc(catalogItems.createdAt)).limit(30).all();
  const wishlist = db.select().from(wishlistItems)
    .where(eq(wishlistItems.acquired, 0))
    .orderBy(desc(wishlistItems.createdAt))
    .limit(20).all();

  const roomsList = allRooms
    .map((r) => `- ${r.name} (${r.type ?? 'room'})${r.style ? ` — style: ${r.style}` : ''}${r.widthFt ? ` — ${r.widthFt}ft × ${r.lengthFt}ft` : ''}`)
    .join('\n');

  const catalogList = ownedItems
    .map((i) => `- ${i.name}${i.brand ? ` by ${i.brand}` : ''} (${i.category ?? 'item'}${i.style ? `, ${i.style}` : ''})`)
    .join('\n');

  const wishlistList = wishlist
    .map((w) => `- ${w.name}${w.brand ? ` by ${w.brand}` : ''} — ${w.priority} priority${w.currentPrice ? `, $${w.currentPrice}` : ''}${w.targetPrice ? ` (target: $${w.targetPrice})` : ''}`)
    .join('\n');

  return `You are a professional interior design advisor called the Design Advisor. You have access to the user's home data.

ROOMS:
${roomsList || 'No rooms added yet'}

OWNED FURNITURE & DECOR:
${catalogList || 'No items catalogued yet'}

WISHLIST (items they want to buy):
${wishlistList || 'No items on wishlist'}

MODE: ${mode === 'deep' ? 'DEEP — provide comprehensive, detailed design advice, full room layouts, style guides, and step-by-step recommendations.' : 'QUICK — give concise, actionable design advice.'}

You can advise on: furniture arrangement, color palettes, style mixing, budget optimization, purchasing priorities, and how to achieve specific design aesthetics. Reference the user's existing furniture and wishlist when relevant.`;
}

type UIMessageLike = {
  role: string;
  content?: string;
  parts?: Array<{ type: string; text?: string }>;
};

function extractText(parts: Array<{ type: string; text?: string }> | undefined): string {
  if (!parts) return '';
  return parts.filter((p) => p.type === 'text').map((p) => p.text ?? '').join('');
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const uiMessages: UIMessageLike[] = body.messages ?? [];
  const mode = (body.mode as string) ?? 'quick';
  const modelName = process.env.OLLAMA_CHAT_MODEL ?? 'qwen2.5:7b';

  const systemPrompt = buildSystemPrompt(mode);

  const ollamaMessages = [
    { role: 'system', content: systemPrompt },
    ...uiMessages.map((m) => ({
      role: m.role,
      content: m.parts ? extractText(m.parts) : (m.content ?? ''),
    })),
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
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const lines = decoder.decode(value, { stream: true }).split('\n').filter(Boolean);
            for (const line of lines) {
              try {
                const json = JSON.parse(line);
                if (json.message?.content) {
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
      },
      onError: (err) => `Error: ${String(err)}`,
    }),
  });
}
