'use client';

import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import type { Mode } from './types';

const MODE_LABELS: Record<Mode, string> = {
  shop: 'Shop the Look',
  rearrange: 'Rearrange My Space',
  style: 'Style Inspiration',
  brief: 'Creative Brief',
};

const MODE_EMOJI: Record<Mode, string> = {
  shop: '🛍️',
  rearrange: '🔄',
  style: '🎨',
  brief: '📋',
};

type Props = {
  plan: string;
  isStreaming: boolean;
  imagePath: string;
  mode: Mode;
  onStartOver: () => void;
};

export function PlanViewer({ plan, isStreaming, imagePath, mode, onStartOver }: Props) {
  const imageUrl = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b mb-6 -mx-4 px-4 py-3 flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-lg overflow-hidden border flex-shrink-0 shadow-sm">
          <Image
            src={imageUrl}
            alt="Inspiration"
            fill
            className="object-cover"
            sizes="40px"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base">{MODE_EMOJI[mode]}</span>
            <span className="font-semibold text-sm truncate">{MODE_LABELS[mode]}</span>
            {isStreaming ? (
              <Badge variant="secondary" className="text-xs animate-pulse">Generating...</Badge>
            ) : (
              <Badge className="text-xs bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Plan complete
              </Badge>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onStartOver} className="flex-shrink-0 gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" />
          Start Over
        </Button>
      </div>

      {/* Plan content */}
      <div className="prose prose-sm dark:prose-invert max-w-none pb-16">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{plan}</ReactMarkdown>
        {isStreaming && (
          <span
            className="inline-block w-[2px] h-[1em] bg-foreground align-middle ml-0.5"
            style={{ animation: 'blink 1s step-end infinite' }}
          />
        )}
      </div>

      {/* Bottom complete CTA */}
      {!isStreaming && plan && (
        <div className="border-t pt-6 pb-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Your plan is ready</span>
          </div>
          <Button onClick={onStartOver} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Start with a new image
          </Button>
        </div>
      )}

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
