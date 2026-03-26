'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Room, AnalysisResult, BriefChoices } from './types';

type Props = {
  rooms: Room[];
  analysis: AnalysisResult;
  onSubmit: (choices: BriefChoices) => void;
};

const TIMELINES = [
  { value: 'this_weekend', label: 'This weekend' },
  { value: 'within_a_month', label: 'Within a month' },
  { value: '3_6_months', label: '3–6 months' },
  { value: 'no_rush', label: 'No rush, just planning' },
];

const DIY_LEVELS = [
  { value: 'professionals', label: "I'll hire professionals" },
  { value: 'mix', label: 'Mix of DIY and hired help' },
  { value: 'fully_diy', label: 'Fully DIY' },
];

export function BriefForm({ rooms, onSubmit }: Props) {
  const [roomIds, setRoomIds] = useState<string[]>(rooms.map((r) => r.id));
  const [timeline, setTimeline] = useState('within_a_month');
  const [diy, setDiy] = useState('mix');
  const [budget, setBudget] = useState('');

  function toggleRoom(id: string) {
    setRoomIds((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ roomIds, timeline, diy, budget });
  }

  const valid = roomIds.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label>Which rooms?</Label>
        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
          {rooms.length === 0 && (
            <p className="text-xs text-muted-foreground">No rooms added yet.</p>
          )}
          {rooms.map((r) => (
            <label key={r.id} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors text-sm ${roomIds.includes(r.id) ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}>
              <input
                type="checkbox"
                checked={roomIds.includes(r.id)}
                onChange={() => toggleRoom(r.id)}
                className="accent-primary"
              />
              {r.name}
              {r.type && r.type !== 'other' && (
                <span className="ml-auto text-xs text-muted-foreground capitalize">{r.type.replace(/_/g, ' ')}</span>
              )}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="brief-timeline">Timeline:</Label>
        <select
          id="brief-timeline"
          value={timeline}
          onChange={(e) => setTimeline(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {TIMELINES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>DIY comfort level:</Label>
        <div className="space-y-2">
          {DIY_LEVELS.map(({ value, label }) => (
            <label key={value} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors text-sm ${diy === value ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}>
              <input
                type="radio"
                name="diy"
                value={value}
                checked={diy === value}
                onChange={() => setDiy(value)}
                className="accent-primary"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="brief-budget">Maximum budget:</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
          <Input
            id="brief-budget"
            type="number"
            min={0}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="e.g. 3000"
            className="pl-7"
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={!valid}>
        Generate Full Design Brief →
      </Button>
    </form>
  );
}
