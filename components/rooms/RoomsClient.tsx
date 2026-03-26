'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Home, Pencil, Smartphone } from 'lucide-react';
import { RoomCaptureModal, type CaptureResult } from './RoomCaptureModal';

export type Room = {
  id: string;
  name: string;
  type: string | null;
  widthFt: number | null;
  lengthFt: number | null;
  heightFt: number | null;
  style: string | null;
  colorPalette: string | null;
  notes: string | null;
  imagePath: string | null;
  createdAt: number;
};

export type CatalogItem = {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  roomId: string | null;
  imagePath: string | null;
};

const ROOM_TYPES = [
  'living_room','bedroom','dining_room','kitchen','bathroom','office','outdoor','other'
];
const ROOM_TYPE_LABELS: Record<string, string> = {
  living_room: 'Living Room', bedroom: 'Bedroom', dining_room: 'Dining Room',
  kitchen: 'Kitchen', bathroom: 'Bathroom', office: 'Office', outdoor: 'Outdoor', other: 'Other',
};
const ROOM_TYPE_EMOJIS: Record<string, string> = {
  living_room: '🛋️', bedroom: '🛏️', dining_room: '🍽️',
  kitchen: '🍳', bathroom: '🚿', office: '💻', outdoor: '🌿', other: '🏠',
};

export function RoomsClient({ initialRooms, initialItems }: { initialRooms: Room[]; initialItems: CatalogItem[] }) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [items] = useState<CatalogItem[]>(initialItems);
  const [showAdd, setShowAdd] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [saving, setSaving] = useState(false);
  const [showCapture, setShowCapture] = useState(false);
  const emptyForm = { name: '', type: 'living_room', widthFt: '', lengthFt: '', heightFt: '', style: '', notes: '' };
  const [form, setForm] = useState(emptyForm);

  function itemsInRoom(roomId: string) {
    return items.filter((i) => i.roomId === roomId);
  }

  function openAdd() {
    setForm(emptyForm);
    setEditRoom(null);
    setShowAdd(true);
  }

  function handleCapture(data: CaptureResult) {
    setForm((f) => ({
      ...f,
      name:     data.name     ?? f.name,
      type:     data.type     ?? f.type,
      widthFt:  data.widthFt  ?? f.widthFt,
      lengthFt: data.lengthFt ?? f.lengthFt,
      heightFt: data.heightFt ?? f.heightFt,
      style:    data.style    ?? f.style,
      notes:    data.notes    ?? f.notes,
    }));
    setEditRoom(null);
    setShowAdd(true);
  }

  function openEdit(room: Room) {
    setForm({
      name: room.name,
      type: room.type ?? 'other',
      widthFt: room.widthFt?.toString() ?? '',
      lengthFt: room.lengthFt?.toString() ?? '',
      heightFt: room.heightFt?.toString() ?? '',
      style: room.style ?? '',
      notes: room.notes ?? '',
    });
    setEditRoom(room);
    setShowAdd(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        widthFt: form.widthFt ? parseFloat(form.widthFt) : null,
        lengthFt: form.lengthFt ? parseFloat(form.lengthFt) : null,
        heightFt: form.heightFt ? parseFloat(form.heightFt) : null,
        style: form.style.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (editRoom) {
        const res = await fetch(`/api/rooms/${editRoom.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const updated = await res.json() as Room;
        setRooms((prev) => prev.map((r) => r.id === editRoom.id ? updated : r));
        toast.success('Room updated');
      } else {
        const res = await fetch('/api/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const room = await res.json() as Room;
        setRooms((prev) => [room, ...prev]);
        toast.success('Room added');
      }
      setShowAdd(false);
    } catch {
      toast.error('Failed to save room');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/rooms/${id}`, { method: 'DELETE' });
    setRooms((prev) => prev.filter((r) => r.id !== id));
    toast.success('Room removed');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rooms</h1>
          <p className="text-muted-foreground text-sm mt-1">{rooms.length} room{rooms.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowCapture(true)}>
            <Smartphone className="h-4 w-4 mr-1" /> Capture
          </Button>
          <Button onClick={openAdd} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add Room
          </Button>
        </div>
      </div>

      {rooms.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Home className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No rooms yet. Add your first room to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => {
            const roomItems = itemsInRoom(room.id);
            const emoji = ROOM_TYPE_EMOJIS[room.type ?? 'other'] ?? '🏠';
            const typeLabel = ROOM_TYPE_LABELS[room.type ?? 'other'] ?? 'Other';
            return (
              <div key={room.id} className="border rounded-lg p-4 space-y-3 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{emoji}</span>
                    <div>
                      <h3 className="font-semibold">{room.name}</h3>
                      <p className="text-xs text-muted-foreground">{typeLabel}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(room)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(room.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {(room.widthFt || room.lengthFt) && (
                  <p className="text-xs text-muted-foreground">
                    {room.widthFt}′ × {room.lengthFt}′{room.heightFt ? ` × ${room.heightFt}′` : ''}
                  </p>
                )}
                {room.style && (
                  <Badge variant="secondary" className="text-xs">{room.style}</Badge>
                )}
                {room.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{room.notes}</p>
                )}

                {roomItems.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground font-medium mb-1">
                      {roomItems.length} item{roomItems.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {roomItems.slice(0, 4).map((item) => (
                        <Badge key={item.id} variant="outline" className="text-xs">{item.name}</Badge>
                      ))}
                      {roomItems.length > 4 && (
                        <Badge variant="outline" className="text-xs">+{roomItems.length - 4} more</Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <RoomCaptureModal
        open={showCapture}
        onOpenChange={setShowCapture}
        onCapture={handleCapture}
      />

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editRoom ? 'Edit Room' : 'Add Room'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Living Room, Master Bedroom" />
            </div>
            <div>
              <Label>Type</Label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              >
                {ROOM_TYPES.map((t) => (
                  <option key={t} value={t}>{ROOM_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Width (ft)</Label>
                <Input type="number" value={form.widthFt}
                  onChange={(e) => setForm((f) => ({ ...f, widthFt: e.target.value }))} placeholder="e.g. 14" />
              </div>
              <div>
                <Label>Length (ft)</Label>
                <Input type="number" value={form.lengthFt}
                  onChange={(e) => setForm((f) => ({ ...f, lengthFt: e.target.value }))} placeholder="e.g. 18" />
              </div>
              <div>
                <Label>Height (ft)</Label>
                <Input type="number" value={form.heightFt}
                  onChange={(e) => setForm((f) => ({ ...f, heightFt: e.target.value }))} placeholder="e.g. 9" />
              </div>
            </div>
            <div>
              <Label>Style</Label>
              <Input value={form.style} onChange={(e) => setForm((f) => ({ ...f, style: e.target.value }))}
                placeholder="e.g. Scandinavian, Mid-Century Modern" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Any notes about this room..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving...' : editRoom ? 'Save Changes' : 'Add Room'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
