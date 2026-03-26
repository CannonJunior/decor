'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, ExternalLink, CheckCircle2, Circle, Bell, BellOff, RefreshCw, TrendingDown } from 'lucide-react';
import { PriceSparkline } from './PriceSparkline';
import type { Room } from '@/components/rooms/RoomsClient';

export type WishlistItem = {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  style: string | null;
  priority: string | null;
  retailerUrl: string | null;
  imageUrl: string | null;
  notes: string | null;
  currentPrice: number | null;
  targetPrice: number | null;
  priceLastChecked: number | null;
  priceAlertEnabled: number | null;
  priceAlertTriggered: number | null;
  scrapeStatus: string | null;
  acquired: number | null;
  acquiredPrice: number | null;
  sortOrder: number | null;
  roomId: string | null;
  createdAt: number;
};

export type PriceHistoryEntry = {
  id: string;
  wishlistItemId: string;
  price: number;
  currency: string | null;
  checkedAt: number;
  source: string | null;
};

const CATEGORIES = ['sofa','chair','table','desk','bed','storage','lighting','rug','art','decor','plant','appliance','other'];

const PRIORITY_STYLES: Record<string, { badge: string; dot: string; label: string }> = {
  high:   { badge: 'bg-rose-100 text-rose-800 border-rose-200',   dot: 'bg-rose-500',   label: 'High' },
  medium: { badge: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500',  label: 'Medium' },
  low:    { badge: 'bg-sky-100 text-sky-800 border-sky-200',       dot: 'bg-sky-500',    label: 'Low' },
};

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

function formatPrice(p: number | null, currency = 'USD') {
  if (p == null) return null;
  const cur = currency === 'GBP' ? 'GBP' : currency === 'EUR' ? 'EUR' : 'USD';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(p);
}

function formatDate(ts: number | null) {
  if (!ts) return null;
  return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function WishlistClient({
  initialItems,
  initialHistory,
  initialRooms,
}: {
  initialItems: WishlistItem[];
  initialHistory: PriceHistoryEntry[];
  initialRooms: Room[];
}) {
  const [items, setItems] = useState<WishlistItem[]>(initialItems);
  const [history, setHistory] = useState<PriceHistoryEntry[]>(initialHistory);
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [hideAcquired, setHideAcquired] = useState(false);
  const [alertsOnly, setAlertsOnly] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [manualPriceItem, setManualPriceItem] = useState<WishlistItem | null>(null);
  const [manualPrice, setManualPrice] = useState('');
  const emptyForm = {
    name: '', brand: '', category: 'other', priority: 'medium',
    retailerUrl: '', imageUrl: '', targetPrice: '', notes: '', roomId: '',
    priceAlertEnabled: true,
  };
  const [form, setForm] = useState(emptyForm);

  const historyByItem = useMemo(() => {
    const map = new Map<string, PriceHistoryEntry[]>();
    for (const h of history) {
      const arr = map.get(h.wishlistItemId) ?? [];
      arr.push(h);
      map.set(h.wishlistItemId, arr);
    }
    return map;
  }, [history]);

  function historyForItem(id: string) {
    return historyByItem.get(id) ?? [];
  }

  const activeItems = useMemo(() => items.filter((item) => {
    if (hideAcquired && item.acquired) return false;
    if (filterPriority !== 'all' && item.priority !== filterPriority) return false;
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    if (alertsOnly && !item.priceAlertTriggered) return false;
    return true;
  }).sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority ?? 'low'] ?? 2;
    const pb = PRIORITY_ORDER[b.priority ?? 'low'] ?? 2;
    if (pa !== pb) return pa - pb;
    return a.name.localeCompare(b.name);
  }), [items, hideAcquired, filterPriority, filterCategory, alertsOnly]);

  const alertCount = items.filter((i) => i.priceAlertTriggered && !i.acquired).length;
  const acquiredCount = items.filter((i) => i.acquired).length;
  const totalEstimated = items
    .filter((i) => !i.acquired && i.currentPrice != null)
    .reduce((s, i) => s + (i.currentPrice ?? 0), 0);

  async function handleAdd() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          brand: form.brand.trim() || null,
          category: form.category,
          priority: form.priority,
          retailerUrl: form.retailerUrl.trim() || null,
          imageUrl: form.imageUrl.trim() || null,
          targetPrice: form.targetPrice ? parseFloat(form.targetPrice) : null,
          notes: form.notes.trim() || null,
          roomId: form.roomId || null,
          priceAlertEnabled: form.priceAlertEnabled ? 1 : 0,
        }),
      });
      const item = await res.json() as WishlistItem;
      setItems((prev) => [...prev, item]);
      setShowAdd(false);
      setForm(emptyForm);
      if (item.priceAlertTriggered) {
        toast.success('🏷️ Price drop alert! Item already at or below target price.');
      } else if (item.retailerUrl && item.scrapeStatus === 'ok') {
        toast.success(`Added — current price: ${formatPrice(item.currentPrice)}`);
      } else {
        toast.success('Added to wishlist');
      }
    } catch {
      toast.error('Failed to add item');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAcquired(item: WishlistItem) {
    const newAcquired = item.acquired ? 0 : 1;
    const res = await fetch(`/api/wishlist/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acquired: newAcquired, priceAlertTriggered: newAcquired ? 0 : item.priceAlertTriggered }),
    });
    const updated = await res.json() as WishlistItem;
    setItems((prev) => prev.map((i) => i.id === item.id ? updated : i));
    toast.success(newAcquired ? 'Marked as acquired! 🎉' : 'Marked as wanted');
  }

  async function handleToggleAlert(item: WishlistItem) {
    const newEnabled = item.priceAlertEnabled ? 0 : 1;
    const res = await fetch(`/api/wishlist/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceAlertEnabled: newEnabled }),
    });
    const updated = await res.json() as WishlistItem;
    setItems((prev) => prev.map((i) => i.id === item.id ? updated : i));
    toast.success(newEnabled ? 'Price alert enabled' : 'Price alert disabled');
  }

  async function handleDelete(id: string) {
    await fetch(`/api/wishlist/${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((i) => i.id !== id));
    setHistory((prev) => prev.filter((h) => h.wishlistItemId !== id));
    toast.success('Removed from wishlist');
  }

  async function handleCheckPrices() {
    setChecking(true);
    try {
      const res = await fetch('/api/wishlist/check-prices', { method: 'POST' });
      const result = await res.json() as { checked: number; updated: number; alertsTriggered: number; errors: string[] };
      // Refresh items
      const fresh = await fetch('/api/wishlist').then((r) => r.json()) as WishlistItem[];
      setItems(fresh);
      const msg = `Checked ${result.checked} item${result.checked !== 1 ? 's' : ''}, updated ${result.updated}${result.alertsTriggered > 0 ? `, 🏷️ ${result.alertsTriggered} alert${result.alertsTriggered !== 1 ? 's' : ''} triggered!` : ''}`;
      toast.success(msg);
    } catch {
      toast.error('Price check failed');
    } finally {
      setChecking(false);
    }
  }

  async function handleManualPrice() {
    if (!manualPriceItem || !manualPrice) return;
    const price = parseFloat(manualPrice);
    if (isNaN(price)) return;
    const res = await fetch(`/api/wishlist/${manualPriceItem.id}/price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price }),
    });
    const updated = await res.json() as WishlistItem;
    setItems((prev) => prev.map((i) => i.id === manualPriceItem.id ? updated : i));
    setHistory((prev) => [...prev, {
      id: Date.now().toString(),
      wishlistItemId: manualPriceItem.id,
      price,
      currency: 'USD',
      checkedAt: Math.floor(Date.now() / 1000),
      source: 'manual',
    }]);
    setManualPriceItem(null);
    setManualPrice('');
    if (updated.priceAlertTriggered) {
      toast.success('🏷️ Price drop alert triggered!');
    } else {
      toast.success('Price recorded');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Wishlist
            {alertCount > 0 && (
              <Badge className="bg-green-500 text-white text-xs">
                🏷️ {alertCount} deal{alertCount !== 1 ? 's' : ''}!
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {items.length - acquiredCount} wanted · {acquiredCount} acquired
            {totalEstimated > 0 && ` · ${formatPrice(totalEstimated)} estimated`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCheckPrices} disabled={checking}>
            <RefreshCw className={`h-4 w-4 mr-1 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking...' : 'Check Prices'}
          </Button>
          <Button size="sm" onClick={() => { setForm(emptyForm); setShowAdd(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Item
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <select className="border rounded-md px-3 py-2 text-sm bg-background"
          value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="all">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select className="border rounded-md px-3 py-2 text-sm bg-background"
          value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input type="checkbox" checked={hideAcquired}
            onChange={(e) => setHideAcquired(e.target.checked)} className="rounded" />
          Hide acquired
        </label>
        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input type="checkbox" checked={alertsOnly}
            onChange={(e) => setAlertsOnly(e.target.checked)} className="rounded" />
          <span className="text-green-600 font-medium">Alerts only</span>
        </label>
      </div>

      {/* Items */}
      {activeItems.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No items. Add something to your wishlist to track prices.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeItems.map((item) => {
            const ps = PRIORITY_STYLES[item.priority ?? 'medium'] ?? PRIORITY_STYLES.medium;
            const isAlert = item.priceAlertTriggered === 1 && !item.acquired;
            const itemHistory = historyForItem(item.id);
            const savings = item.targetPrice && item.currentPrice
              ? item.currentPrice - item.targetPrice : null;

            return (
              <div key={item.id}
                className={`border rounded-lg p-4 transition-all ${isAlert ? 'border-green-400 bg-green-50/50' : item.acquired ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3">
                  {/* Priority dot + acquired toggle */}
                  <button onClick={() => handleToggleAcquired(item)} className="mt-1 shrink-0">
                    {item.acquired
                      ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                      : <Circle className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                    }
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`font-medium text-sm ${item.acquired ? 'line-through text-muted-foreground' : ''}`}>
                            {item.name}
                          </h3>
                          {isAlert && (
                            <Badge className="bg-green-500 text-white text-xs animate-pulse">
                              🏷️ Price Drop!
                            </Badge>
                          )}
                        </div>
                        {item.brand && <p className="text-xs text-muted-foreground">{item.brand}</p>}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleToggleAlert(item)}
                          title={item.priceAlertEnabled ? 'Disable alert' : 'Enable alert'}
                          className="p-1 rounded hover:bg-muted transition-colors"
                        >
                          {item.priceAlertEnabled
                            ? <Bell className="h-4 w-4 text-amber-500" />
                            : <BellOff className="h-4 w-4 text-muted-foreground" />
                          }
                        </button>
                        {item.retailerUrl && (
                          <a href={item.retailerUrl} target="_blank" rel="noopener noreferrer"
                            className="p-1 rounded hover:bg-muted transition-colors">
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </a>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Price info */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {item.currentPrice != null && (
                        <div className="flex items-center gap-1">
                          <span className={`text-sm font-semibold ${isAlert ? 'text-green-700' : ''}`}>
                            {formatPrice(item.currentPrice)}
                          </span>
                          {item.priceLastChecked && (
                            <span className="text-xs text-muted-foreground">
                              · {formatDate(item.priceLastChecked)}
                            </span>
                          )}
                        </div>
                      )}
                      {item.targetPrice != null && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <TrendingDown className="h-3 w-3" />
                          <span>Target: {formatPrice(item.targetPrice)}</span>
                          {isAlert && savings !== null && savings < 0 && (
                            <span className="text-green-600 font-medium ml-1">
                              ({formatPrice(Math.abs(savings))} below target!)
                            </span>
                          )}
                        </div>
                      )}
                      {item.scrapeStatus === 'failed' && !item.acquired && (
                        <span className="text-xs text-muted-foreground italic">
                          (Price check unavailable —
                          <button className="underline ml-1"
                            onClick={() => { setManualPriceItem(item); setManualPrice(''); }}>
                            enter manually
                          </button>)
                        </span>
                      )}
                      {item.currentPrice == null && !item.acquired && item.retailerUrl && (
                        <button className="text-xs text-muted-foreground underline"
                          onClick={() => { setManualPriceItem(item); setManualPrice(''); }}>
                          Record price
                        </button>
                      )}
                    </div>

                    {/* Price sparkline */}
                    {itemHistory.length >= 2 && (
                      <div className="flex items-center gap-2">
                        <PriceSparkline history={itemHistory} targetPrice={item.targetPrice} />
                        <span className="text-xs text-muted-foreground">{itemHistory.length} data points</span>
                      </div>
                    )}

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className={`text-xs ${ps.badge}`}>{ps.label}</Badge>
                      {item.category && item.category !== 'other' && (
                        <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                      )}
                      {item.roomId && initialRooms.find((r) => r.id === item.roomId) && (
                        <Badge variant="outline" className="text-xs">
                          📍 {initialRooms.find((r) => r.id === item.roomId)?.name}
                        </Badge>
                      )}
                    </div>

                    {item.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add item dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add to Wishlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. IKEA POÄNG Armchair" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Brand</Label>
                <Input value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                  placeholder="e.g. IKEA" />
              </div>
              <div>
                <Label>Category</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label>Priority</Label>
              <select className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <Label>Retailer URL</Label>
              <Input value={form.retailerUrl} onChange={(e) => setForm((f) => ({ ...f, retailerUrl: e.target.value }))}
                placeholder="https://www.ikea.com/us/en/p/..." />
              <p className="text-xs text-muted-foreground mt-1">
                Paste the product page URL to enable automatic price monitoring
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Target Price ($)</Label>
                <Input type="number" value={form.targetPrice}
                  onChange={(e) => setForm((f) => ({ ...f, targetPrice: e.target.value }))}
                  placeholder="Alert when price ≤ this" />
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
              <Label>Image URL</Label>
              <Input value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://..." />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2} placeholder="Any notes..." />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.priceAlertEnabled}
                onChange={(e) => setForm((f) => ({ ...f, priceAlertEnabled: e.target.checked }))}
                className="rounded" />
              <Bell className="h-4 w-4 text-amber-500" />
              Enable price monitoring & alerts
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving...' : 'Add to Wishlist'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual price entry dialog */}
      <Dialog open={!!manualPriceItem} onOpenChange={(open) => { if (!open) setManualPriceItem(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Price</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Enter the current price you see for <strong>{manualPriceItem?.name}</strong>
          </p>
          <div>
            <Label>Price ($)</Label>
            <Input type="number" value={manualPrice}
              onChange={(e) => setManualPrice(e.target.value)}
              placeholder="e.g. 299" autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualPriceItem(null)}>Cancel</Button>
            <Button onClick={handleManualPrice} disabled={!manualPrice}>Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
