'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { Room, AnalysisResult, StyleChoices } from './types';

type Props = {
  rooms: Room[];
  analysis: AnalysisResult;
  onSubmit: (choices: StyleChoices) => void;
};

const CHANGE_OPTIONS = [
  { value: 'color_palette', label: 'Color palette' },
  { value: 'furniture_style', label: 'Furniture style' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'textiles_accessories', label: 'Textiles & accessories' },
  { value: 'everything', label: 'Everything' },
];

function boldnessLabel(v: number): string {
  if (v <= 3) return 'Subtle refresh';
  if (v <= 6) return 'Moderate change';
  if (v <= 9) return 'Bold transformation';
  return 'Dramatic reinvention';
}

export function StyleForm({ rooms, onSubmit }: Props) {
  const [scope, setScope] = useState<'room' | 'home'>('room');
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? '');
  const [changes, setChanges] = useState<string[]>(['color_palette', 'textiles_accessories']);
  const [boldness, setBoldness] = useState(5);

  function toggleChange(value: string) {
    if (value === 'everything') {
      setChanges(['everything']);
      return;
    }
    setChanges((prev) => {
      const without = prev.filter((c) => c !== 'everything');
      return without.includes(value) ? without.filter((c) => c !== value) : [...without, value];
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      scope,
      roomId: scope === 'room' ? roomId : undefined,
      changes,
      boldness,
    });
  }

  const valid = changes.length > 0 && (scope === 'home' || roomId);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label>Apply this inspiration to:</Label>
        <div className="flex gap-2">
          {(['room', 'home'] as const).map((s) => (
            <label key={s} className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors text-sm ${scope === s ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}>
              <input
                type="radio"
                name="scope"
                value={s}
                checked={scope === s}
                onChange={() => setScope(s)}
                className="accent-primary"
              />
              {s === 'room' ? 'One specific room' : 'My whole home'}
            </label>
          ))}
        </div>
      </div>

      {scope === 'room' && (
        <div className="space-y-2">
          <Label htmlFor="style-room">Which room?</Label>
          <select
            id="style-room"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            required
          >
            {rooms.length === 0 && <option value="">No rooms added yet</option>}
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <Label>What to change:</Label>
        <div className="space-y-2">
          {CHANGE_OPTIONS.map(({ value, label }) => (
            <label key={value} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors text-sm ${changes.includes(value) ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}>
              <input
                type="checkbox"
                checked={changes.includes(value)}
                onChange={() => toggleChange(value)}
                className="accent-primary"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>How bold should the transformation be?</Label>
          <span className="text-sm font-medium text-primary">{boldnessLabel(boldness)}</span>
        </div>
        <div className="px-1">
          <input
            type="range"
            min={1}
            max={10}
            value={boldness}
            onChange={(e) => setBoldness(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Subtle refresh</span>
            <span>Complete transformation</span>
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={!valid}>
        Generate Style Plan →
      </Button>
    </form>
  );
}
