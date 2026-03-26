import { NextRequest, NextResponse } from 'next/server';

// Ollama Whisper transcription endpoint (requires: ollama pull whisper)
const OLLAMA_BASE = (process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434').replace(/\/api\/?$/, '');

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audio = formData.get('audio') as File | null;
  if (!audio || audio.size === 0) {
    return NextResponse.json({ error: 'No audio provided' }, { status: 400 });
  }

  // Forward to Ollama's OpenAI-compatible audio transcription endpoint
  const fd = new FormData();
  fd.append('file', audio, audio.name || 'recording.m4a');
  fd.append('model', 'whisper');

  let res: Response;
  try {
    res = await fetch(`${OLLAMA_BASE}/api/audio/transcriptions`, {
      method: 'POST',
      body: fd,
      signal: AbortSignal.timeout(60000),
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Whisper not available. Install with: ollama pull whisper (${err})` },
      { status: 502 }
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: `Whisper transcription failed (${res.status}). Is the whisper model installed?` },
      { status: 502 }
    );
  }

  const data = await res.json() as { text?: string };
  if (!data.text) {
    return NextResponse.json({ error: 'Empty transcription' }, { status: 500 });
  }

  return NextResponse.json({ text: data.text });
}
