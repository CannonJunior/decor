import { NextRequest, NextResponse } from 'next/server';
import { parseScanFile } from '@/lib/utils/scan-parser';

/**
 * POST /api/rooms/scan/upload
 *
 * Accepts a floor plan file exported from any iPhone scanning app and returns
 * structured room data suitable for pre-filling the Add Room form.
 *
 * Supported file types:
 *   - Apple RoomPlan JSON  (.json) — any app built on Apple's RoomPlan framework
 *     (Magicplan on Pro iPhones, Mappedin Scan, roomplanapp.com, etc.)
 *   - Magicplan XML (.xml)         — exported via Magicplan share sheet
 *   - RoomScan Pro XML (.xml)      — exported via RoomScan Pro share sheet
 *   - Any other text format        — parsed via local Ollama LLM as fallback
 *
 * Intended for use with the iOS Shortcuts bridge:
 *   1. User installs the "Send to Nest" Shortcut on their iPhone
 *   2. User scans their room with Magicplan / RoomScan Pro / any RoomPlan app
 *   3. User taps Share → "Send to Nest" Shortcut
 *   4. Shortcut POSTs the exported file to this endpoint
 *   5. Web app receives the structured data and pre-fills the room form
 */
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB — scan files are tiny; reject accidental large uploads
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await parseScanFile(file.name, buffer);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: `Could not parse file: ${err}` },
      { status: 422 }
    );
  }
}
