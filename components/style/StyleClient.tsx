'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type StyleEntry = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  characteristics: string | null;
  colorPalette: string | null;
  materials: string | null;
  imageUrl: string | null;
  origin: string | null;
  era: string | null;
  tags: string | null;
  createdAt: number;
  updatedAt: number;
};

function parseJson<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

export function StyleClient({
  initialEntries,
}: {
  initialEntries: StyleEntry[];
  initialRelationships: unknown[];
}) {
  const [entries] = useState<StyleEntry[]>(initialEntries);
  const [filterType, setFilterType] = useState<'all' | 'design_style' | 'material'>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<StyleEntry | null>(null);

  const filtered = entries.filter((e) => {
    if (filterType !== 'all' && e.type !== filterType) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const styles = filtered.filter((e) => e.type === 'design_style');
  const materials = filtered.filter((e) => e.type === 'material');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Style Wiki</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {entries.filter((e) => e.type === 'design_style').length} design styles ·{' '}
          {entries.filter((e) => e.type === 'material').length} materials
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Input className="w-48" placeholder="Search..." value={search}
          onChange={(e) => setSearch(e.target.value)} />
        <div className="flex rounded-md border overflow-hidden">
          {(['all', 'design_style', 'material'] as const).map((t) => (
            <button key={t}
              className={`px-3 py-1.5 text-sm transition-colors ${filterType === t ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              onClick={() => setFilterType(t)}>
              {t === 'all' ? 'All' : t === 'design_style' ? 'Styles' : 'Materials'}
            </button>
          ))}
        </div>
      </div>

      {/* Design Styles */}
      {(filterType === 'all' || filterType === 'design_style') && styles.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Design Styles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {styles.map((entry) => {
              const colors = parseJson<string[]>(entry.colorPalette, []);
              const chars = parseJson<string[]>(entry.characteristics, []);
              return (
                <button key={entry.id} onClick={() => setSelected(entry)}
                  className="border rounded-lg p-4 text-left hover:shadow-sm transition-shadow space-y-3">
                  {/* Color palette swatches */}
                  {colors.length > 0 && (
                    <div className="flex gap-1">
                      {colors.slice(0, 6).map((color, i) => (
                        <div key={i} className="h-4 w-6 rounded" style={{ backgroundColor: color }} title={color} />
                      ))}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">{entry.name}</h3>
                    {entry.era && <p className="text-xs text-muted-foreground">{entry.era}</p>}
                    {entry.origin && <p className="text-xs text-muted-foreground">{entry.origin}</p>}
                  </div>
                  {entry.description && (
                    <p className="text-xs text-muted-foreground line-clamp-3">{entry.description}</p>
                  )}
                  {chars.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {chars.slice(0, 3).map((c, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{c}</Badge>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Materials */}
      {(filterType === 'all' || filterType === 'material') && materials.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Materials</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {materials.map((entry) => {
              const colors = parseJson<string[]>(entry.colorPalette, []);
              return (
                <button key={entry.id} onClick={() => setSelected(entry)}
                  className="border rounded-lg p-3 text-left hover:shadow-sm transition-shadow space-y-2">
                  {colors.length > 0 && (
                    <div className="flex gap-0.5">
                      {colors.slice(0, 5).map((color, i) => (
                        <div key={i} className="h-3 flex-1 rounded-sm" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  )}
                  <h3 className="font-medium text-sm">{entry.name}</h3>
                  {entry.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{entry.description}</p>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p>No entries found.</p>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelected(null)}>
          <div className="bg-background border rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">{selected.name}</h2>
                {selected.era && <p className="text-sm text-muted-foreground">{selected.era}</p>}
                {selected.origin && <p className="text-sm text-muted-foreground">{selected.origin}</p>}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>✕</Button>
            </div>

            {/* Color palette */}
            {parseJson<string[]>(selected.colorPalette, []).length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">TYPICAL COLORS</p>
                <div className="flex gap-2">
                  {parseJson<string[]>(selected.colorPalette, []).map((color, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className="h-8 w-8 rounded-full border" style={{ backgroundColor: color }} />
                      <span className="text-xs text-muted-foreground">{color}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected.description && (
              <p className="text-sm">{selected.description}</p>
            )}

            {/* Characteristics */}
            {parseJson<string[]>(selected.characteristics, []).length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">KEY CHARACTERISTICS</p>
                <div className="flex flex-wrap gap-1.5">
                  {parseJson<string[]>(selected.characteristics, []).map((c, i) => (
                    <Badge key={i} variant="secondary">{c}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Materials */}
            {parseJson<string[]>(selected.materials, []).length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">TYPICAL MATERIALS</p>
                <div className="flex flex-wrap gap-1.5">
                  {parseJson<string[]>(selected.materials, []).map((m, i) => (
                    <Badge key={i} variant="outline">{m}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {parseJson<string[]>(selected.tags, []).length > 0 && (
              <div className="flex flex-wrap gap-1">
                {parseJson<string[]>(selected.tags, []).map((t, i) => (
                  <span key={i} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">#{t}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
