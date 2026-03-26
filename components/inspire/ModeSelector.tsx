'use client';

import type { Mode } from './types';

type Props = {
  onSelect: (mode: Mode) => void;
};

const MODES: { mode: Mode; emoji: string; title: string; description: string }[] = [
  {
    mode: 'shop',
    emoji: '🛍️',
    title: 'Shop the Look',
    description: 'Find and buy the pieces that make this aesthetic real.',
  },
  {
    mode: 'rearrange',
    emoji: '🔄',
    title: 'Rearrange My Space',
    description: 'Move what you already own to capture this energy.',
  },
  {
    mode: 'style',
    emoji: '🎨',
    title: 'Style Inspiration',
    description: 'Extract the palette, mood, and feeling and apply it to your home.',
  },
  {
    mode: 'brief',
    emoji: '📋',
    title: 'Creative Brief',
    description: 'Get a full designer-grade project plan and shopping list.',
  },
];

export function ModeSelector({ onSelect }: Props) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">What would you like to do with this inspiration?</h2>
      <div className="grid grid-cols-2 gap-3">
        {MODES.map(({ mode, emoji, title, description }) => (
          <button
            key={mode}
            onClick={() => onSelect(mode)}
            className="group flex flex-col items-start gap-2 rounded-xl border bg-card p-4 text-left shadow-sm transition-all duration-150 hover:scale-[1.02] hover:shadow-md hover:border-primary/40 active:scale-[0.99]"
          >
            <span className="text-3xl">{emoji}</span>
            <div>
              <p className="font-semibold text-sm leading-tight">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
