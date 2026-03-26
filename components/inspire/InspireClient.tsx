'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { AnalysisCard } from './AnalysisCard';
import { ModeSelector } from './ModeSelector';
import { ShopForm } from './ShopForm';
import { RearrangeForm } from './RearrangeForm';
import { StyleForm } from './StyleForm';
import { BriefForm } from './BriefForm';
import { UploadStep } from './UploadStep';
import { PlanViewer } from './PlanViewer';
import type {
  WizardState,
  Mode,
  AnalysisResult,
  Room,
  CatalogItem,
  ShopChoices,
  RearrangeChoices,
  StyleChoices,
  BriefChoices,
} from './types';

type Props = {
  rooms: Room[];
  catalogItems: CatalogItem[];
};

export default function InspireClient({ rooms, catalogItems }: Props) {
  const [wizardState, setWizardState] = useState<WizardState>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [mode, setMode] = useState<Mode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visionUnavailable, setVisionUnavailable] = useState(false);
  const [manualDescription, setManualDescription] = useState('');
  const [planText, setPlanText] = useState('');

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelected = useCallback((file: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(url);
  }, [previewUrl]);

  const handleAnalyze = useCallback(async (file: File) => {
    setWizardState('analyzing');
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    let res: Response;
    try {
      res = await fetch('/api/inspire/analyze', { method: 'POST', body: formData });
    } catch {
      const msg = 'Network error — could not reach the server.';
      setError(msg);
      toast.error(msg);
      setWizardState('upload');
      return;
    }

    const data = await res.json().catch(() => null);

    if (!data) {
      const msg = 'Unexpected response from server.';
      setError(msg);
      toast.error(msg);
      setWizardState('upload');
      return;
    }

    // Always set sessionId and imagePath regardless of vision availability
    if (data.sessionId) setSessionId(data.sessionId);
    if (data.imagePath) setImagePath(data.imagePath);

    if (data.error === 'vision_unavailable') {
      setVisionUnavailable(true);
      setAnalysis(null);
      setWizardState('analyzed');
      return;
    }

    if (!res.ok || data.error) {
      const msg = data.error ?? `Server error (${res.status})`;
      setError(msg);
      toast.error(msg);
      setWizardState('upload');
      return;
    }

    setAnalysis(data.analysis as AnalysisResult);
    setWizardState('analyzed');
  }, []);

  const handleUpload = useCallback((file: File) => {
    handleFileSelected(file);
    handleAnalyze(file);
  }, [handleFileSelected, handleAnalyze]);

  const handleModeSelect = useCallback((selectedMode: Mode) => {
    setMode(selectedMode);
    setWizardState('mode-selected');
  }, []);

  const handleFormSubmit = useCallback(
    async (choices: ShopChoices | RearrangeChoices | StyleChoices | BriefChoices) => {
      if (!mode) return;

      setWizardState('generating');
      setPlanText('');

      // Build effective analysis: real analysis OR manual description as a synthetic one
      let effectiveAnalysis: AnalysisResult | Record<string, unknown> | null = analysis;
      if (visionUnavailable && manualDescription) {
        effectiveAnalysis = {
          colors: [],
          mood: 'described by user',
          style: 'described by user',
          materials: [],
          furniture: [],
          lighting: 'unknown',
          essence: manualDescription,
          isRoom: true,
          roomType: null,
        };
      }

      let res: Response;
      try {
        res = await fetch('/api/inspire/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            mode,
            analysis: effectiveAnalysis,
            userChoices: choices,
            rooms,
            catalogItems,
          }),
        });
      } catch {
        const msg = 'Network error — could not reach the server.';
        toast.error(msg);
        setWizardState('mode-selected');
        return;
      }

      if (!res.ok || !res.body) {
        const errData = await res.json().catch(() => null);
        const msg = errData?.error ?? `Server error (${res.status})`;
        toast.error(msg);
        setWizardState('mode-selected');
        return;
      }

      // Read the SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (!raw || raw === '[DONE]') continue;
            try {
              const data = JSON.parse(raw) as { type?: string; delta?: string };
              if (data.type === 'text-delta' && data.delta) {
                accumulated += data.delta;
                setPlanText(accumulated);
              }
            } catch {
              // skip malformed lines
            }
          }
        }

        // Flush any remaining buffer
        if (buffer.startsWith('data: ')) {
          const raw = buffer.slice(6).trim();
          if (raw && raw !== '[DONE]') {
            try {
              const data = JSON.parse(raw) as { type?: string; delta?: string };
              if (data.type === 'text-delta' && data.delta) {
                accumulated += data.delta;
                setPlanText(accumulated);
              }
            } catch {
              // skip
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      setWizardState('complete');
    },
    [mode, analysis, visionUnavailable, manualDescription, sessionId, rooms, catalogItems]
  );

  const handleStartOver = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setWizardState('upload');
    setSelectedFile(null);
    setPreviewUrl(null);
    setSessionId(null);
    setImagePath(null);
    setAnalysis(null);
    setMode(null);
    setError(null);
    setVisionUnavailable(false);
    setManualDescription('');
    setPlanText('');
  }, [previewUrl]);

  // Render based on state
  if (wizardState === 'generating' || wizardState === 'complete') {
    return (
      <div className="px-4 py-2">
        <PlanViewer
          plan={planText}
          isStreaming={wizardState === 'generating'}
          imagePath={imagePath ?? ''}
          mode={mode!}
          onStartOver={handleStartOver}
        />
      </div>
    );
  }

  if (wizardState === 'upload' || wizardState === 'analyzing') {
    return (
      <UploadStep
        onUpload={handleUpload}
        isAnalyzing={wizardState === 'analyzing'}
        selectedFile={selectedFile}
        previewUrl={previewUrl}
      />
    );
  }

  // analyzed or mode-selected
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Vision unavailable warning */}
      {visionUnavailable && (
        <div className="flex gap-3 items-start rounded-xl border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-700 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 flex-1 min-w-0">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
              Vision AI not available
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Pull a vision model in Ollama (e.g.{' '}
              <code className="font-mono bg-yellow-100 dark:bg-yellow-900/50 px-1 rounded text-xs">
                ollama pull llava
              </code>
              ) to enable image analysis. In the meantime, describe your image below and we&apos;ll
              still generate a great plan.
            </p>
            <Textarea
              value={manualDescription}
              onChange={(e) => setManualDescription(e.target.value)}
              placeholder="e.g. A cozy Scandinavian living room with warm wood tones, cream linen sofa, lots of plants and natural light..."
              rows={3}
              className="text-sm"
            />
          </div>
        </div>
      )}

      {/* Analysis card — only show when we have real analysis */}
      {analysis && imagePath && (
        <AnalysisCard
          analysis={analysis}
          imagePath={imagePath}
        />
      )}

      {/* Image preview when no analysis (vision unavailable) */}
      {visionUnavailable && imagePath && (
        <div className="flex justify-center">
          <div className="relative w-40 h-40 rounded-xl overflow-hidden border shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePath.startsWith('/') ? imagePath : `/${imagePath}`}
              alt="Uploaded inspiration"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Mode selector (analyzed state) or form (mode-selected state) */}
      {wizardState === 'analyzed' && (
        <ModeSelector onSelect={handleModeSelect} />
      )}

      {wizardState === 'mode-selected' && mode && (
        <div className="space-y-4">
          {/* Back to mode selection */}
          <button
            onClick={() => setWizardState('analyzed')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            ← Change mode
          </button>

          {/* Form for selected mode */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            {mode === 'shop' && (
              <ShopForm
                rooms={rooms}
                analysis={analysis ?? ({} as AnalysisResult)}
                onSubmit={handleFormSubmit}
              />
            )}
            {mode === 'rearrange' && (
              <RearrangeForm
                rooms={rooms}
                catalogItems={catalogItems}
                analysis={analysis ?? ({} as AnalysisResult)}
                onSubmit={handleFormSubmit}
              />
            )}
            {mode === 'style' && (
              <StyleForm
                rooms={rooms}
                analysis={analysis ?? ({} as AnalysisResult)}
                onSubmit={handleFormSubmit}
              />
            )}
            {mode === 'brief' && (
              <BriefForm
                rooms={rooms}
                analysis={analysis ?? ({} as AnalysisResult)}
                onSubmit={handleFormSubmit}
              />
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
    </div>
  );
}
