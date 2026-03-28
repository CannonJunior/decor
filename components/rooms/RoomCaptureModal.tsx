'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Footprints, Mic, MicOff, Camera, Sparkles, Check, RotateCcw, ChevronRight, Upload, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

// ─── Shared types ─────────────────────────────────────────────────────────────

export type CaptureResult = {
  name?: string;
  type?: string;
  widthFt?: string;
  lengthFt?: string;
  heightFt?: string;
  style?: string;
  notes?: string;
};

// Ollama parse-description response (numbers come from JSON.parse)
type ParsedRoom = {
  name?: string;
  type?: string;
  widthFt?: number | null;
  lengthFt?: number | null;
  heightFt?: number | null;
  style?: string | null;
  notes?: string | null;
  error?: string;
};

type PhotoAnalysis = {
  type?: string;
  style?: string;
  notes?: string;
  colorPalette?: string[];
  error?: string;
};

function numToStr(v: number | null | undefined): string | undefined {
  return v != null ? String(v) : undefined;
}

// ─── Walk & Measure Tab ───────────────────────────────────────────────────────

type WalkPhase = 'idle' | 'width' | 'width_done' | 'length' | 'complete';

// iOS 13+ exposes requestPermission as a static method not in standard TS types
type DeviceMotionEventWithPermission = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

function WalkTab({ onUse }: { onUse: (r: CaptureResult) => void }) {
  const [phase, setPhase] = useState<WalkPhase>('idle');
  const [steps, setSteps] = useState(0);
  const [strideFt, setStrideFt] = useState(2.5);
  const [widthFt, setWidthFt] = useState(0);
  const [lengthFt, setLengthFt] = useState(0);

  const stepsRef = useRef(0);
  const lastPeakRef = useRef(0);
  const windowRef = useRef<number[]>([]);
  const handlerRef = useRef<((e: DeviceMotionEvent) => void) | null>(null);
  // Keep strideFt in a ref so the motion handler always sees the latest value
  const strideFtRef = useRef(strideFt);
  useEffect(() => { strideFtRef.current = strideFt; }, [strideFt]);

  function startMotion() {
    const handler = (e: DeviceMotionEvent) => {
      const g = e.accelerationIncludingGravity;
      if (!g || g.x == null) return;
      const mag = Math.sqrt((g.x ?? 0) ** 2 + (g.y ?? 0) ** 2 + (g.z ?? 0) ** 2);
      windowRef.current.push(mag);
      if (windowRef.current.length > 5) windowRef.current.shift();
      const avg = windowRef.current.reduce((a, b) => a + b, 0) / windowRef.current.length;
      const now = Date.now();
      if (avg > 12 && now - lastPeakRef.current > 300) {
        stepsRef.current += 1;
        lastPeakRef.current = now;
        setSteps(stepsRef.current);
      }
    };
    handlerRef.current = handler;
    window.addEventListener('devicemotion', handler);
  }

  function stopMotion() {
    if (handlerRef.current) {
      window.removeEventListener('devicemotion', handlerRef.current);
      handlerRef.current = null;
    }
  }

  useEffect(() => () => stopMotion(), []);

  async function startPhase(next: 'width' | 'length') {
    const DMEP = DeviceMotionEvent as DeviceMotionEventWithPermission;
    if (typeof DMEP.requestPermission === 'function') {
      let permission: string;
      try {
        permission = await DMEP.requestPermission();
      } catch {
        toast.error('Motion permission prompt failed.');
        return;
      }
      if (permission !== 'granted') {
        toast.error('Motion access denied — enable in Settings > Safari > Motion & Orientation Access.');
        return;
      }
    }
    stepsRef.current = 0;
    lastPeakRef.current = 0;
    windowRef.current = [];
    setSteps(0);
    setPhase(next);
    startMotion();
  }

  function finishWalk() {
    stopMotion();
    const ft = parseFloat((stepsRef.current * strideFtRef.current).toFixed(1));
    if (phase === 'width') {
      setWidthFt(ft);
      setPhase('width_done');
    } else {
      setLengthFt(ft);
      setPhase('complete');
    }
  }

  const liveFt = parseFloat((steps * strideFt).toFixed(1));

  if (phase === 'width' || phase === 'length') {
    return (
      <div className="space-y-4 text-center">
        <div className="bg-muted rounded-lg p-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            {phase === 'width' ? 'Walking width…' : 'Walking length…'}
          </p>
          <p className="text-5xl font-bold tabular-nums">{liveFt}′</p>
          <p className="text-muted-foreground text-sm mt-1">{steps} step{steps !== 1 ? 's' : ''}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Walk heel-to-toe in a straight line to the opposite wall, then tap Done.
        </p>
        <Button className="w-full" onClick={finishWalk}>
          Done <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    );
  }

  if (phase === 'width_done') {
    return (
      <div className="space-y-4 text-center">
        <div className="bg-muted rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Width measured</p>
          <p className="text-3xl font-bold">{widthFt}′</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Now stand against a perpendicular wall to measure the length.
        </p>
        <Button className="w-full" onClick={() => startPhase('length')}>
          <Footprints className="h-4 w-4 mr-2" /> Measure Length
        </Button>
      </div>
    );
  }

  if (phase === 'complete') {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Room dimensions</p>
          <p className="text-3xl font-bold">{widthFt}′ × {lengthFt}′</p>
          <p className="text-xs text-muted-foreground mt-1">Adjust if needed below</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Width (ft)</Label>
            <Input type="number" step="0.5" value={widthFt}
              onChange={(e) => setWidthFt(parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <Label className="text-xs">Length (ft)</Label>
            <Input type="number" step="0.5" value={lengthFt}
              onChange={(e) => setLengthFt(parseFloat(e.target.value) || 0)} />
          </div>
        </div>
        <Button className="w-full" onClick={() => onUse({ widthFt: String(widthFt), lengthFt: String(lengthFt) })}>
          <Check className="h-4 w-4 mr-2" /> Use These Dimensions
        </Button>
        <Button variant="outline" className="w-full" size="sm" onClick={() => setPhase('idle')}>
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Measure Again
        </Button>
      </div>
    );
  }

  // idle
  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-3 text-sm space-y-1.5">
        <p className="font-medium text-sm">How it works</p>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
          <li>Stand with your back against one wall</li>
          <li>Tap <strong>Measure Width</strong> and walk to the opposite wall</li>
          <li>Tap <strong>Done</strong>, then repeat for the length</li>
        </ol>
      </div>
      <div>
        <Label className="text-xs">Stride length (ft per step)</Label>
        <Input type="number" step="0.1" min="1" max="5" value={strideFt}
          onChange={(e) => setStrideFt(parseFloat(e.target.value) || 2.5)}
          className="mt-1" />
        <p className="text-xs text-muted-foreground mt-1">
          Average is 2.5 ft. To calibrate: walk a known distance (e.g. 10 ft) and adjust until it reads correctly.
        </p>
      </div>
      <Button className="w-full" onClick={() => startPhase('width')}>
        <Footprints className="h-4 w-4 mr-2" /> Measure Width First
      </Button>
    </div>
  );
}

// ─── Describe Tab ─────────────────────────────────────────────────────────────

function DescribeTab({ onUse }: { onUse: (r: CaptureResult) => void }) {
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedRoom | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg']
        .find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setTranscribing(true);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        const fd = new FormData();
        fd.append('audio', blob, 'recording.m4a');
        try {
          const res = await fetch('/api/rooms/transcribe', { method: 'POST', body: fd });
          const data = await res.json() as { text?: string; error?: string };
          if (data.text) {
            setText(data.text);
            toast.success('Transcribed — tap Parse to extract room data.');
          } else {
            toast.error(data.error ?? 'Transcription failed. Type your description instead.');
          }
        } finally {
          setTranscribing(false);
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      toast.error('Microphone access denied.');
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  async function handleParse() {
    if (!text.trim()) return;
    setParsing(true);
    setParsed(null);
    try {
      const res = await fetch('/api/rooms/parse-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json() as ParsedRoom;
      if (data.error) throw new Error(data.error);
      setParsed(data);
    } catch (err) {
      toast.error(`Could not parse: ${err}`);
    } finally {
      setParsing(false);
    }
  }

  function applyParsed() {
    if (!parsed) return;
    onUse({
      name: parsed.name ?? undefined,
      type: parsed.type ?? undefined,
      widthFt: numToStr(parsed.widthFt),
      lengthFt: numToStr(parsed.lengthFt),
      heightFt: numToStr(parsed.heightFt),
      style: parsed.style ?? undefined,
      notes: parsed.notes ?? undefined,
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Speak or type a natural description — AI will extract name, size, and style.
      </p>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'e.g. "Master bedroom, roughly 14 by 16 feet, 9-foot ceilings, Scandinavian style, light wood floors and white walls"'}
        rows={4}
        disabled={recording || transcribing}
      />

      {/* Voice recording */}
      <Button
        variant="outline"
        className={`w-full ${recording ? 'border-red-500 text-red-600' : ''}`}
        onClick={recording ? stopRecording : startRecording}
        disabled={transcribing}
      >
        {recording
          ? <><MicOff className="h-4 w-4 mr-2" /> Stop Recording</>
          : transcribing
          ? <><Mic className="h-4 w-4 mr-2 animate-pulse" /> Transcribing…</>
          : <><Mic className="h-4 w-4 mr-2" /> Record with Mic</>
        }
      </Button>
      <p className="text-xs text-muted-foreground -mt-1">
        Voice requires Whisper: <code className="text-xs bg-muted px-1 rounded">ollama pull whisper</code>
      </p>

      {/* Parse */}
      <Button className="w-full" onClick={handleParse} disabled={!text.trim() || parsing || recording}>
        <Sparkles className="h-4 w-4 mr-2" />
        {parsing ? 'Parsing…' : 'Parse with AI'}
      </Button>

      {/* Result preview */}
      {parsed && (
        <div className="rounded-lg border bg-muted/50 p-3 text-sm space-y-1">
          {parsed.name && <p><span className="text-muted-foreground text-xs">Name</span><br />{parsed.name}</p>}
          {parsed.type && <p><span className="text-muted-foreground text-xs">Type</span><br />{parsed.type.replace(/_/g, ' ')}</p>}
          {(parsed.widthFt != null || parsed.lengthFt != null) && (
            <p><span className="text-muted-foreground text-xs">Size</span><br />
              {parsed.widthFt ?? '?'}′ × {parsed.lengthFt ?? '?'}′{parsed.heightFt ? ` × ${parsed.heightFt}′` : ''}
            </p>
          )}
          {parsed.style && <p><span className="text-muted-foreground text-xs">Style</span><br />{parsed.style.replace(/_/g, ' ')}</p>}
          {parsed.notes && <p><span className="text-muted-foreground text-xs">Notes</span><br />{parsed.notes}</p>}
          <Button className="w-full mt-2" onClick={applyParsed}>
            <Check className="h-4 w-4 mr-2" /> Use This Data
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Photo Tab ────────────────────────────────────────────────────────────────

function PhotoTab({ onUse }: { onUse: (r: CaptureResult) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PhotoAnalysis | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(f); });
  }

  async function handleAnalyze() {
    if (!file) return;
    setAnalyzing(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/rooms/analyze-photo', { method: 'POST', body: fd });
      const data = await res.json() as PhotoAnalysis;
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      toast.error(`${err}`);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Take a photo of your room — AI will identify the type and style.
      </p>

      {/* Hidden file input with iOS camera capture */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore — capture is valid HTML but missing from React's types for older TS
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <Button variant="outline" className="w-full" onClick={() => inputRef.current?.click()}>
        <Camera className="h-4 w-4 mr-2" />
        {file ? 'Retake Photo' : 'Take / Select Photo'}
      </Button>

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Room preview" className="w-full rounded-lg object-cover max-h-44" />
      )}

      {file && !result && (
        <Button className="w-full" onClick={handleAnalyze} disabled={analyzing}>
          <Sparkles className="h-4 w-4 mr-2" />
          {analyzing ? 'Analyzing…' : 'Analyze with AI'}
        </Button>
      )}

      {result && (
        <div className="rounded-lg border bg-muted/50 p-3 text-sm space-y-1.5">
          {result.type && (
            <p><span className="text-muted-foreground text-xs">Room type</span><br />{result.type.replace(/_/g, ' ')}</p>
          )}
          {result.style && (
            <p><span className="text-muted-foreground text-xs">Style</span><br />{result.style.replace(/_/g, ' ')}</p>
          )}
          {result.notes && (
            <p><span className="text-muted-foreground text-xs">Notes</span><br />{result.notes}</p>
          )}
          {result.colorPalette && result.colorPalette.length > 0 && (
            <div>
              <p className="text-muted-foreground text-xs mb-1">Dominant colors</p>
              <div className="flex gap-1.5">
                {result.colorPalette.map((hex) => (
                  <span
                    key={hex}
                    className="w-7 h-7 rounded-md border shadow-sm flex-shrink-0"
                    style={{ backgroundColor: hex }}
                    title={hex}
                  />
                ))}
              </div>
            </div>
          )}
          <Button className="w-full mt-2" onClick={() => onUse({
            type: result.type,
            style: result.style,
            notes: result.notes,
          })}>
            <Check className="h-4 w-4 mr-2" /> Use This Data
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Requires a vision model:{' '}
        <code className="text-xs bg-muted px-1 rounded">ollama pull llava</code>
      </p>
    </div>
  );
}

// ─── Import Scan Tab ──────────────────────────────────────────────────────────

type ParsedScan = {
  name?: string;
  type?: string;
  widthFt?: string;
  lengthFt?: string;
  heightFt?: string;
  style?: string;
  notes?: string;
  source?: string;
  error?: string;
};

const RECOMMENDED_APPS = [
  {
    name: 'Magicplan',
    url: 'https://apps.apple.com/app/magicplan/id427424432',
    lidar: true,
    free: true,
    export: 'Share → Export → XML',
    note: 'Uses LiDAR on Pro iPhones; camera AR on all others. Free tier supports XML export.',
  },
  {
    name: 'RoomScan Pro',
    url: 'https://apps.apple.com/app/roomscan-pro-floor-plan-app/id673673224',
    lidar: true,
    free: false,
    export: 'Share → XML or JSON',
    note: 'Uses LiDAR + Apple RoomPlan. Exports RoomPlan JSON directly.',
  },
  {
    name: 'Polycam',
    url: 'https://apps.apple.com/app/polycam-lidar-3d-scanner/id1532482376',
    lidar: true,
    free: false,
    export: 'Share → Export → Floor Plan → DXF or PDF',
    note: 'LiDAR required for floor plan mode. Floor plans on paid plan.',
  },
];

function ImportTab({ onUse, serverUrl }: { onUse: (r: CaptureResult) => void; serverUrl: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ParsedScan | null>(null);
  const [showApps, setShowApps] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(f: File) {
    setFile(f);
    setResult(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', f);
      const res = await fetch('/api/rooms/scan/upload', { method: 'POST', body: fd });
      const data = await res.json() as ParsedScan;
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      toast.error(`${err}`);
    } finally {
      setUploading(false);
    }
  }

  const sourceLabel: Record<string, string> = {
    'roomplan-json':   'Apple RoomPlan JSON',
    'xml':             'Floor Plan XML',
    'ollama-fallback': 'AI-extracted',
  };

  return (
    <div className="space-y-4">
      {/* How it works */}
      <div className="rounded-lg border p-3 text-xs space-y-2">
        <p className="font-medium text-sm">LiDAR scan → import</p>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
          <li>Scan your room with a supported iPhone app</li>
          <li>Export the scan file (XML or JSON)</li>
          <li>
            <span className="font-medium">iOS Shortcut</span> — share from the app directly to Nest, <span className="font-medium">or</span>
          </li>
          <li>
            <span className="font-medium">Manual</span> — save to Files, then upload below
          </li>
        </ol>
      </div>

      {/* iOS Shortcut setup */}
      <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
        <p className="text-xs font-medium">Set up iOS Shortcut (one-time)</p>
        <p className="text-xs text-muted-foreground">
          Install the <strong>Send to Nest</strong> Shortcut. It will appear in every app&apos;s
          share sheet — just share your scan file to it.
        </p>
        <div className="bg-muted rounded p-2 text-xs font-mono break-all select-all">
          {serverUrl}/api/rooms/scan/upload
        </div>
        <p className="text-xs text-muted-foreground">
          Create a Shortcut: <strong>Receive File → Get Contents of URL</strong> (POST, form field <code>file</code>, value: Shortcut Input). Paste the URL above.
        </p>
      </div>

      {/* File upload */}
      <div>
        <input
          ref={inputRef}
          type="file"
          accept=".json,.xml,.dxf,.txt,.ifc"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
          className="hidden"
        />
        <Button
          variant="outline"
          className="w-full"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? 'Parsing…' : file ? `Re-upload (${file.name})` : 'Upload Scan File'}
        </Button>
        <p className="text-xs text-muted-foreground mt-1 text-center">
          Accepts .json (RoomPlan), .xml (Magicplan/RoomScan), .dxf
        </p>
      </div>

      {/* Result */}
      {result && (
        <div className="rounded-lg border bg-muted/50 p-3 text-sm space-y-1.5">
          {result.source && (
            <p className="text-xs text-muted-foreground mb-2">
              Parsed via {sourceLabel[result.source] ?? result.source}
            </p>
          )}
          {result.name     && <p><span className="text-muted-foreground text-xs">Name</span><br />{result.name}</p>}
          {result.type     && <p><span className="text-muted-foreground text-xs">Type</span><br />{result.type.replace(/_/g, ' ')}</p>}
          {(result.widthFt || result.lengthFt) && (
            <p><span className="text-muted-foreground text-xs">Dimensions</span><br />
              {result.widthFt ?? '?'}′ × {result.lengthFt ?? '?'}′{result.heightFt ? ` × ${result.heightFt}′ ceiling` : ''}
            </p>
          )}
          {result.style    && <p><span className="text-muted-foreground text-xs">Style</span><br />{result.style.replace(/_/g, ' ')}</p>}
          {result.notes    && <p><span className="text-muted-foreground text-xs">Notes</span><br />{result.notes}</p>}
          <Button className="w-full mt-2" onClick={() => onUse(result as CaptureResult)}>
            <Check className="h-4 w-4 mr-2" /> Use This Data
          </Button>
        </div>
      )}

      {/* App recommendations (collapsed by default) */}
      <button
        className="text-xs text-muted-foreground w-full text-left flex items-center gap-1"
        onClick={() => setShowApps((s) => !s)}
      >
        <ExternalLink className="h-3 w-3" />
        {showApps ? 'Hide' : 'Show'} recommended scanning apps
      </button>
      {showApps && (
        <div className="space-y-2">
          {RECOMMENDED_APPS.map((app) => (
            <div key={app.name} className="rounded-lg border p-2.5 text-xs space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="font-medium">{app.name}</span>
                <div className="flex gap-1">
                  {app.lidar && <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded px-1">LiDAR</span>}
                  {app.free  && <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded px-1">Free</span>}
                </div>
              </div>
              <p className="text-muted-foreground">{app.note}</p>
              <p className="text-muted-foreground">Export: <span className="font-medium">{app.export}</span></p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

type CaptureTab = 'walk' | 'describe' | 'photo' | 'import';

const TABS: { id: CaptureTab; label: string }[] = [
  { id: 'import',   label: '📡 LiDAR' },
  { id: 'walk',     label: '📐 Walk' },
  { id: 'describe', label: '🗣️ Describe' },
  { id: 'photo',    label: '📸 Photo' },
];

export function RoomCaptureModal({
  open,
  onOpenChange,
  onCapture,
  serverUrl = typeof window !== 'undefined' ? window.location.origin : '',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (data: CaptureResult) => void;
  serverUrl?: string;
}) {
  const [tab, setTab] = useState<CaptureTab>('import');

  function handleUse(data: CaptureResult) {
    onCapture(data);
    onOpenChange(false);
    toast.success('Pre-filled from capture — review and save.');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Capture Room Data</DialogTitle>
        </DialogHeader>

        <div className="flex rounded-md border overflow-hidden text-xs font-medium mb-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              className={`flex-1 py-2 transition-colors ${tab === id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto max-h-[60vh]">
          {tab === 'import'   && <ImportTab   onUse={handleUse} serverUrl={serverUrl} />}
          {tab === 'walk'     && <WalkTab     onUse={handleUse} />}
          {tab === 'describe' && <DescribeTab onUse={handleUse} />}
          {tab === 'photo'    && <PhotoTab    onUse={handleUse} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
