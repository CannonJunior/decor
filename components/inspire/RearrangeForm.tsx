'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { Room, CatalogItem, AnalysisResult, RearrangeChoices } from './types';

type Props = {
  rooms: Room[];
  catalogItems: CatalogItem[];
  analysis: AnalysisResult;
  onSubmit: (choices: RearrangeChoices) => void;
};

const PRIORITIES = [
  { value: 'match_layout', label: 'Match the photo\'s layout exactly' },
  { value: 'capture_vibe', label: 'Just capture the vibe and feeling' },
  { value: 'maximize_space', label: 'Maximize the space' },
];

export function RearrangeForm({ rooms, catalogItems, onSubmit }: Props) {
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? '');
  const [priority, setPriority] = useState('capture_vibe');

  const roomItems = catalogItems.filter((i) => i.roomId === roomId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roomId) return;
    onSubmit({ roomId, priority });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="rearrange-room">Which room?</Label>
        <select
          id="rearrange-room"
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

        {/* Items in selected room */}
        {roomId && (
          <div className="mt-2">
            {roomItems.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {roomItems.map((item) => (
                  <Badge key={item.id} variant="secondary" className="text-xs capitalize">
                    {item.name}
                    {item.category && item.category !== 'other' && (
                      <span className="ml-1 text-muted-foreground">· {item.category}</span>
                    )}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No items catalogued for this room yet.</p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>What&apos;s your priority?</Label>
        <div className="space-y-2">
          {PRIORITIES.map(({ value, label }) => (
            <label key={value} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors text-sm ${priority === value ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}>
              <input
                type="radio"
                name="priority"
                value={value}
                checked={priority === value}
                onChange={() => setPriority(value)}
                className="accent-primary"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={!roomId}>
        Generate Rearrangement Plan →
      </Button>
    </form>
  );
}
