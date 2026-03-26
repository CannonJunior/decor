'use client';

import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import type { AnalysisResult } from './types';

type Props = {
  analysis: AnalysisResult;
  imagePath: string;
};

function ColorSwatch({ color }: { color: string }) {
  // Detect if color is a hex code or a name
  const isHex = /^#[0-9a-fA-F]{3,6}$/.test(color);
  const bg = isHex ? color : undefined;

  return (
    <div className="relative group">
      <div
        className="w-7 h-7 rounded-full border-2 border-white shadow-sm ring-1 ring-black/10 cursor-default"
        style={bg ? { backgroundColor: bg } : { background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
        title={color}
      />
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-10">
        <div className="bg-popover text-popover-foreground text-xs rounded px-2 py-1 whitespace-nowrap shadow-md border">
          {color}
        </div>
      </div>
    </div>
  );
}

export function AnalysisCard({ analysis, imagePath }: Props) {
  return (
    <div className="relative rounded-2xl border bg-card overflow-hidden shadow-md">
      {/* Gradient glow border effect */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.10), rgba(59,130,246,0.10))',
        }}
      />
      <div className="absolute inset-[1px] rounded-[calc(1rem-1px)] bg-card pointer-events-none" />

      <div className="relative p-5 flex gap-5">
        {/* Left: image */}
        <div className="flex-shrink-0">
          <div className="relative w-28 h-28 rounded-xl overflow-hidden border shadow-sm">
            <Image
              src={imagePath.startsWith('/') ? imagePath : `/${imagePath}`}
              alt="Inspiration image"
              fill
              className="object-cover"
              sizes="112px"
            />
          </div>
        </div>

        {/* Right: analysis */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Essence — headline */}
          <p className="text-base italic text-foreground/90 font-medium leading-snug">
            &ldquo;{analysis.essence}&rdquo;
          </p>

          {/* Non-room note */}
          {!analysis.isRoom && (
            <p className="text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-2">
              This isn&apos;t a room photo — we&apos;ll use its mood, colors, and feeling as design inspiration.
            </p>
          )}

          {/* Badges: mood + style */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="capitalize">{analysis.mood}</Badge>
            <Badge variant="outline" className="capitalize">{analysis.style}</Badge>
            {analysis.isRoom && analysis.roomType && (
              <Badge className="capitalize bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700">
                {analysis.roomType.replace(/_/g, ' ')}
              </Badge>
            )}
          </div>

          {/* Color swatches */}
          {analysis.colors.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground mr-1">Palette</span>
              <div className="flex gap-1">
                {analysis.colors.map((c, i) => (
                  <ColorSwatch key={i} color={c} />
                ))}
              </div>
            </div>
          )}

          {/* Materials */}
          {analysis.materials.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs text-muted-foreground">Materials</span>
              {analysis.materials.map((m, i) => (
                <span key={i} className="text-xs bg-muted rounded px-2 py-0.5 capitalize">{m}</span>
              ))}
            </div>
          )}

          {/* Furniture (only for room photos) */}
          {analysis.isRoom && analysis.furniture.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs text-muted-foreground">Furniture</span>
              {analysis.furniture.map((f, i) => (
                <span key={i} className="text-xs bg-muted rounded px-2 py-0.5 capitalize">{f}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
