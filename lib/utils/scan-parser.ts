/**
 * Parses floor plan scan files exported from iPhone apps into structured room data.
 *
 * Supported formats (tried in order):
 *   1. Apple RoomPlan JSON — exported by any app built on Apple's RoomPlan framework
 *      (Magicplan, Mappedin Scan, roomplanapp.com, etc.). Contains `walls[]` with
 *      `dimensions` (meters) and a column-major 4×4 `transform` matrix.
 *
 *   2. Magicplan / RoomScan XML — exported via the iOS share sheet. Both apps use
 *      `<room>` elements with dimensional attributes or child elements.
 *
 *   3. Ollama fallback — sends the raw text content to the local LLM and asks it
 *      to extract whatever room data it can find.
 */

const OLLAMA_BASE = (process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434').replace(/\/api\/?$/, '');
const MODEL = process.env.OLLAMA_CHAT_MODEL ?? 'qwen2.5:7b';

export type ParsedScan = {
  name?: string;
  type?: string;
  widthFt?: string;
  lengthFt?: string;
  heightFt?: string;
  style?: string;
  notes?: string;
  source: 'roomplan-json' | 'xml' | 'ollama-fallback';
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function metersToFeet(m: number): string {
  return (Math.round(m * 3.281 * 10) / 10).toString();
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

// ─── 1. Apple RoomPlan JSON ───────────────────────────────────────────────────

type RoomPlanWall = {
  dimensions: [number, number, number]; // width, height (ceiling), depth
  transform: number[];                  // column-major 4×4
  confidence?: { high?: unknown; medium?: unknown; low?: unknown };
};

type RoomPlanObject = {
  category: unknown;
  dimensions: [number, number, number];
  transform: number[];
};

type RoomPlanJSON = {
  walls?: RoomPlanWall[];
  objects?: RoomPlanObject[];
};

function isRoomPlanJSON(data: unknown): data is RoomPlanJSON {
  return (
    typeof data === 'object' &&
    data !== null &&
    'walls' in data &&
    Array.isArray((data as RoomPlanJSON).walls)
  );
}

/**
 * Compute the 2D bounding box of all walls in the XZ plane (Y is up in ARKit).
 * Each wall's column-major transform:
 *   columns[0] = wall's local X-axis (along wall length)
 *   columns[3] = wall centroid position
 * Half-width endpoints: centroid ± (width/2) * localXAxis
 */
function parseRoomPlanJSON(data: RoomPlanJSON): ParsedScan {
  const walls = (data.walls ?? []).filter(
    (w) => Array.isArray(w.dimensions) && Array.isArray(w.transform) && w.transform.length === 16
  );

  if (walls.length === 0) throw new Error('No valid walls in RoomPlan JSON');

  let minX = Infinity, maxX = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (const wall of walls) {
    const t = wall.transform;
    // Column-major layout: t[12], t[13], t[14] = translation (x, y, z)
    const px = t[12], pz = t[14];
    const halfW = wall.dimensions[0] / 2;
    // Column 0 (local X axis): t[0], t[1], t[2]
    const dx = t[0], dz = t[2];
    const x1 = px - halfW * dx, z1 = pz - halfW * dz;
    const x2 = px + halfW * dx, z2 = pz + halfW * dz;
    minX = Math.min(minX, x1, x2);
    maxX = Math.max(maxX, x1, x2);
    minZ = Math.min(minZ, z1, z2);
    maxZ = Math.max(maxZ, z1, z2);
  }

  const widthM  = clamp(maxX - minX, 0.5, 100);
  const lengthM = clamp(maxZ - minZ, 0.5, 100);

  // Use the median wall height to avoid outliers from partial walls
  const heights = walls.map((w) => w.dimensions[1]).filter((h) => h > 0.5 && h < 10).sort((a, b) => a - b);
  const heightM = heights[Math.floor(heights.length / 2)] ?? 0;

  // Detect room type from furniture (objects array)
  const objects = data.objects ?? [];
  const categories = new Set(objects.map((o) => JSON.stringify(o.category)));
  let type: string | undefined;
  if (categories.has('{"bed":{}}') || categories.has('"bed"'))       type = 'bedroom';
  else if (categories.has('{"sofa":{}}') || categories.has('"sofa"')) type = 'living_room';
  else if (categories.has('{"toilet":{}}'))                            type = 'bathroom';
  else if (categories.has('{"oven":{}}') || categories.has('{"refrigerator":{}}')) type = 'kitchen';

  return {
    widthFt:  metersToFeet(widthM),
    lengthFt: metersToFeet(lengthM),
    heightFt: heightM > 0 ? metersToFeet(heightM) : undefined,
    type,
    source: 'roomplan-json',
  };
}

// ─── 2. Magicplan / RoomScan XML ─────────────────────────────────────────────

/**
 * Both Magicplan and RoomScan export XML with room geometry.
 * This parser uses a series of heuristic pattern matches rather than
 * a rigid schema, since neither app publishes their XML DTD openly.
 *
 * Magicplan: uses `<room>` elements with polygon point lists in metres.
 * RoomScan:  uses `<Room>` elements with Width/Length/Height attributes or children.
 * Many RoomPlan wrappers: export a root `<CapturedRoom>` or `<Structure>` element.
 */
function parseXML(text: string): ParsedScan {
  // Normalise tag case for easier matching
  const xml = text;

  // ── Try attribute-based formats ──────────────────────────────────────────
  // e.g. <Room Name="Bedroom" Width="4.5" Length="5.2" Height="2.7" ...>
  const attrPattern = /<[Rr]oom[^>]*?(?:[Ww]idth|width)[="'\s]+([0-9.]+)[^>]*>/;
  const attrMatch = attrPattern.exec(xml);
  if (attrMatch) {
    const getAttr = (attr: string) => {
      const re = new RegExp(`${attr}["'\\s=]+([0-9.]+)`, 'i');
      return parseFloat(re.exec(xml)?.[1] ?? '0');
    };
    const nameMatch = /[Nn]ame["'\s=]+"([^"']+)"/.exec(xml);
    const widthM  = getAttr('width');
    const lengthM = getAttr('length') || getAttr('depth');
    const heightM = getAttr('height');

    if (widthM > 0 && lengthM > 0) {
      return {
        name:    nameMatch?.[1],
        widthFt:  metersToFeet(widthM),
        lengthFt: metersToFeet(lengthM),
        heightFt: heightM > 0 ? metersToFeet(heightM) : undefined,
        source: 'xml',
      };
    }
  }

  // ── Try Magicplan point-list format ──────────────────────────────────────
  // Magicplan XML contains polygon vertices for each room.
  // e.g. <point x="0.00" y="0.00"/>  <point x="4.50" y="0.00"/>  etc.
  // Bounding box of points gives room dimensions.
  const pointPattern = /<point[^>]+x="([0-9.-]+)"[^>]+y="([0-9.-]+)"/g;
  const xs: number[] = [], ys: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = pointPattern.exec(xml)) !== null) {
    xs.push(parseFloat(m[1]));
    ys.push(parseFloat(m[2]));
  }

  if (xs.length >= 3) {
    const widthM  = clamp(Math.max(...xs) - Math.min(...xs), 0.5, 100);
    const lengthM = clamp(Math.max(...ys) - Math.min(...ys), 0.5, 100);

    // Try to get room name from parent <room name="..."> element
    const roomNameMatch = /<[Rr]oom[^>]+[Nn]ame="([^"]+)"/.exec(xml);
    // Try to get height from a separate attribute
    const heightMatch = /[Hh]eight["'\s=]+"?([0-9.]+)/.exec(xml);
    const heightM = heightMatch ? parseFloat(heightMatch[1]) : 0;

    return {
      name:     roomNameMatch?.[1],
      widthFt:  metersToFeet(widthM),
      lengthFt: metersToFeet(lengthM),
      heightFt: heightM > 0 ? metersToFeet(heightM) : undefined,
      source: 'xml',
    };
  }

  // ── Try area-based estimate ───────────────────────────────────────────────
  // Some XML formats only provide area; estimate a square room as a last resort.
  const areaMatch = /[Aa]rea["'\s=]+"?([0-9.]+)/.exec(xml);
  if (areaMatch) {
    const areaM2 = parseFloat(areaMatch[1]);
    const side = Math.sqrt(areaM2);
    return {
      widthFt:  metersToFeet(side),
      lengthFt: metersToFeet(side),
      notes: `Estimated from area ${areaM2.toFixed(1)} m² — actual shape may differ`,
      source: 'xml',
    };
  }

  throw new Error('Could not extract dimensions from XML');
}

// ─── 3. Ollama fallback ───────────────────────────────────────────────────────

const EXTRACT_SYSTEM = `You are a room data extractor. The user will provide raw text from a floor plan or room scan file.
Extract any room data you can find and return ONLY valid JSON (no markdown, no explanation):
{
  "name": string|null,
  "type": "living_room"|"bedroom"|"dining_room"|"kitchen"|"bathroom"|"office"|"outdoor"|"other"|null,
  "widthFt": number|null,
  "lengthFt": number|null,
  "heightFt": number|null,
  "notes": string|null
}
Dimensions may be in metres — convert to feet (1 m = 3.281 ft), round to 1 decimal.
If a value is absent, use null.`;

async function ollamaFallback(text: string): Promise<ParsedScan> {
  // Truncate to avoid token overflow; first 4000 chars usually contain the key data
  const snippet = text.slice(0, 4000);
  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: EXTRACT_SYSTEM },
        { role: 'user',   content: snippet },
      ],
      stream: false,
      think: false,
      format: 'json',
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) throw new Error(`Ollama unavailable (${res.status})`);
  const data = await res.json() as { message?: { content?: string } };
  const raw = (data.message?.content ?? '').replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  const parsed = JSON.parse(raw) as {
    name?: string | null;
    type?: string | null;
    widthFt?: number | null;
    lengthFt?: number | null;
    heightFt?: number | null;
    notes?: string | null;
  };

  return {
    name:     parsed.name     ?? undefined,
    type:     parsed.type     ?? undefined,
    widthFt:  parsed.widthFt  != null ? String(parsed.widthFt)  : undefined,
    lengthFt: parsed.lengthFt != null ? String(parsed.lengthFt) : undefined,
    heightFt: parsed.heightFt != null ? String(parsed.heightFt) : undefined,
    notes:    parsed.notes    ?? undefined,
    source: 'ollama-fallback',
  };
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function parseScanFile(filename: string, buffer: Buffer): Promise<ParsedScan> {
  const text = buffer.toString('utf-8');
  const ext  = filename.split('.').pop()?.toLowerCase() ?? '';

  // 1. Try RoomPlan JSON (any .json file, or files that look like RoomPlan data)
  if (ext === 'json' || text.trimStart().startsWith('{')) {
    try {
      const data = JSON.parse(text) as unknown;
      if (isRoomPlanJSON(data)) {
        return parseRoomPlanJSON(data);
      }
    } catch {
      // not valid JSON — continue
    }
  }

  // 2. Try XML (Magicplan, RoomScan, generic floor plan XML)
  if (ext === 'xml' || text.trimStart().startsWith('<')) {
    try {
      return parseXML(text);
    } catch {
      // XML parse found nothing useful — fall through to Ollama
    }
  }

  // 3. Ollama fallback — works on any text-based format including DXF, CSV, etc.
  return ollamaFallback(text);
}
