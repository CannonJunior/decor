'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, ExternalLink, ImageIcon } from 'lucide-react';
import type { Room } from '@/components/rooms/RoomsClient';

export type CatalogItem = {
  id: string;
  name: string;
  brand: string | null;
  retailer: string | null;
  category: string | null;
  style: string | null;
  primaryColor: string | null;
  material: string | null;
  condition: string | null;
  purchasePrice: number | null;
  purchaseDate: number | null;
  sourceUrl: string | null;
  notes: string | null;
  imagePath: string | null;
  roomId: string | null;
  createdAt: number;
};

const CATEGORIES = ['sofa','chair','table','desk','bed','storage','lighting','rug','art','decor','plant','other'];
const STYLES = ['mid_century','scandinavian','industrial','bohemian','contemporary','traditional','coastal','farmhouse','eclectic','other'];
const MATERIALS = ['wood','metal','fabric','glass','ceramic','leather','rattan','concrete','other'];
const CONDITIONS = ['excellent','good','fair','poor'];

const STYLE_LABELS: Record<string, string> = {
  mid_century: 'Mid-Century', scandinavian: 'Scandinavian', industrial: 'Industrial',
  bohemian: 'Bohemian', contemporary: 'Contemporary', traditional: 'Traditional',
  coastal: 'Coastal', farmhouse: 'Farmhouse', eclectic: 'Eclectic', other: 'Other',
};

const CATEGORY_EMOJIS: Record<string, string> = {
  sofa: '🛋️', chair: '🪑', table: '🪵', desk: '💻', bed: '🛏️',
  storage: '📦', lighting: '💡', rug: '🟫', art: '🖼️', decor: '✨', plant: '🌿', other: '✦',
};

function formatPrice(p: number | null) {
  if (p == null) return null;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(p);
}

export function CatalogClient({ initialItems, initialRooms }: { initialItems: CatalogItem[]; initialRooms: Room[] }) {
  const [items, setItems] = useState<CatalogItem[]>(initialItems);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStyle, setFilterStyle] = useState('all');
  const [filterRoom, setFilterRoom] = useState('all');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const emptyForm = {
    name: '', brand: '', retailer: '', category: 'sofa', style: 'contemporary',
    primaryColor: '', material: 'wood', condition: 'good',
    purchasePrice: '', sourceUrl: '', notes: '', roomId: '',
  };
  const [form, setForm] = useState(emptyForm);

  const onDrop = useCallback((accepted: File[]) => {
    if (!accepted[0]) return;
    setImageFile(accepted[0]);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(accepted[0]);
    });
  }, []);

  // Revoke object URL when dialog closes or component unmounts
  useEffect(() => {
    if (!showAdd && imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
      setImageFile(null);
    }
  }, [showAdd]); // eslint-disable-line react-hooks/exhaustive-deps

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1,
  });

  const filtered = useMemo(() => items.filter((item) => {
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    if (filterStyle !== 'all' && item.style !== filterStyle) return false;
    if (filterRoom !== 'all' && item.roomId !== filterRoom) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [items, filterCategory, filterStyle, filterRoom, search]);

  function openAdd() {
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview(null);
    setShowAdd(true);
  }

  async function handleAdd() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      if (form.brand.trim()) fd.append('brand', form.brand.trim());
      if (form.retailer.trim()) fd.append('retailer', form.retailer.trim());
      fd.append('category', form.category);
      fd.append('style', form.style);
      if (form.primaryColor.trim()) fd.append('primaryColor', form.primaryColor.trim());
      fd.append('material', form.material);
      fd.append('condition', form.condition);
      if (form.purchasePrice) fd.append('purchasePrice', form.purchasePrice);
      if (form.sourceUrl.trim()) fd.append('sourceUrl', form.sourceUrl.trim());
      if (form.notes.trim()) fd.append('notes', form.notes.trim());
      if (form.roomId) fd.append('roomId', form.roomId);
      if (imageFile) fd.append('image', imageFile);

      const res = await fetch('/api/catalog', { method: 'POST', body: fd });
      const item = await res.json() as CatalogItem;
      setItems((prev) => [item, ...prev]);
      setShowAdd(false);
      toast.success('Item added to catalog');
    } catch {
      toast.error('Failed to add item');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/catalog/${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success('Item removed');
  }

  function getRoomName(roomId: string | null) {
    if (!roomId) return null;
    return initialRooms.find((r) => r.id === roomId)?.name ?? null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Catalog</h1>
          <p className="text-muted-foreground text-sm mt-1">{items.length} item{items.length !== 1 ? 's' : ''} owned</p>
        </div>
        <Button onClick={openAdd} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Item
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Input className="w-48" placeholder="Search..." value={search}
          onChange={(e) => setSearch(e.target.value)} />
        <select className="border rounded-md px-3 py-2 text-sm bg-background"
          value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="border rounded-md px-3 py-2 text-sm bg-background"
          value={filterStyle} onChange={(e) => setFilterStyle(e.target.value)}>
          <option value="all">All styles</option>
          {STYLES.map((s) => <option key={s} value={s}>{STYLE_LABELS[s]}</option>)}
        </select>
        <select className="border rounded-md px-3 py-2 text-sm bg-background"
          value={filterRoom} onChange={(e) => setFilterRoom(e.target.value)}>
          <option value="all">All rooms</option>
          {initialRooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No items found. Add your furniture and decor to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="border rounded-lg overflow-hidden hover:shadow-sm transition-shadow">
              {item.imagePath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/${item.imagePath}`} alt={item.name}
                  className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-muted flex items-center justify-center">
                  <span className="text-4xl">{CATEGORY_EMOJIS[item.category ?? 'other'] ?? '✦'}</span>
                </div>
              )}
              <div className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm truncate">{item.name}</h3>
                    {item.brand && <p className="text-xs text-muted-foreground">{item.brand}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {item.sourceUrl && (
                      <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    )}
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                  {item.style && item.style !== 'other' && (
                    <Badge variant="outline" className="text-xs">{STYLE_LABELS[item.style] ?? item.style}</Badge>
                  )}
                </div>
                {item.purchasePrice != null && (
                  <p className="text-xs font-medium text-green-700">{formatPrice(item.purchasePrice)}</p>
                )}
                {getRoomName(item.roomId) && (
                  <p className="text-xs text-muted-foreground">📍 {getRoomName(item.roomId)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add to Catalog</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Image upload */}
            <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'}`}>
              <input {...getInputProps()} />
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="preview" className="h-24 mx-auto object-cover rounded" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <ImageIcon className="h-8 w-8 opacity-50" />
                  <span className="text-xs">Drop image or click to upload</span>
                </div>
              )}
            </div>
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. IKEA SÖDERHAMN Sofa" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Brand</Label>
                <Input value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                  placeholder="e.g. IKEA" />
              </div>
              <div>
                <Label>Retailer</Label>
                <Input value={form.retailer} onChange={(e) => setForm((f) => ({ ...f, retailer: e.target.value }))}
                  placeholder="e.g. IKEA" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Category</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label>Style</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={form.style} onChange={(e) => setForm((f) => ({ ...f, style: e.target.value }))}>
                  {STYLES.map((s) => <option key={s} value={s}>{STYLE_LABELS[s]}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Material</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={form.material} onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))}>
                  {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <Label>Condition</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={form.condition} onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}>
                  {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Purchase Price ($)</Label>
                <Input type="number" value={form.purchasePrice}
                  onChange={(e) => setForm((f) => ({ ...f, purchasePrice: e.target.value }))}
                  placeholder="e.g. 599" />
              </div>
              <div>
                <Label>Room</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={form.roomId} onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}>
                  <option value="">No room</option>
                  {initialRooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label>Source URL</Label>
              <Input value={form.sourceUrl} onChange={(e) => setForm((f) => ({ ...f, sourceUrl: e.target.value }))}
                placeholder="https://..." />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2} placeholder="Any notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving...' : 'Add to Catalog'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
