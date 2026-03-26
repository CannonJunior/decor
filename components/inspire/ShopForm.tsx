'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Room, AnalysisResult, ShopChoices } from './types';

type Props = {
  rooms: Room[];
  analysis: AnalysisResult;
  onSubmit: (choices: ShopChoices) => void;
};

const BUDGETS = [
  { value: 'under_500', label: 'Under $500' },
  { value: '500_2000', label: '$500–$2,000' },
  { value: '2000_5000', label: '$2,000–$5,000' },
  { value: '5000_plus', label: '$5,000+' },
];

export function ShopForm({ rooms, onSubmit }: Props) {
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? '');
  const [budget, setBudget] = useState('500_2000');
  const [existing, setExisting] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roomId) return;
    onSubmit({ roomId, budget, existing });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="shop-room">Which room is this for?</Label>
        <select
          id="shop-room"
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

      <div className="space-y-2">
        <Label>Budget range</Label>
        <div className="grid grid-cols-2 gap-2">
          {BUDGETS.map(({ value, label }) => (
            <label key={value} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors text-sm ${budget === value ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}>
              <input
                type="radio"
                name="budget"
                value={value}
                checked={budget === value}
                onChange={() => setBudget(value)}
                className="accent-primary"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="shop-existing">Do you already own anything similar?</Label>
        <Textarea
          id="shop-existing"
          value={existing}
          onChange={(e) => setExisting(e.target.value)}
          placeholder="e.g. I have a blue velvet sofa already..."
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={!roomId}>
        Generate Shopping Plan →
      </Button>
    </form>
  );
}
