'use client';

import { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Save, ImageIcon } from 'lucide-react';
import type { CatalogItem } from '@/components/catalog/CatalogClient';

// Konva loaded client-side only (uses browser APIs)
const Stage = dynamic(() => import('react-konva').then((m) => m.Stage), { ssr: false });
const Layer = dynamic(() => import('react-konva').then((m) => m.Layer), { ssr: false });
const Image = dynamic(() => import('react-konva').then((m) => m.Image), { ssr: false });
const Rect = dynamic(() => import('react-konva').then((m) => m.Rect), { ssr: false });
const Text = dynamic(() => import('react-konva').then((m) => m.Text), { ssr: false });
const Transformer = dynamic(() => import('react-konva').then((m) => m.Transformer), { ssr: false });

export type Moodboard = {
  id: string;
  name: string;
  description: string | null;
  imagePath: string | null;
  canvasData: string | null;
  style: string | null;
  colorPalette: string | null;
  tags: string | null;
  createdAt: number;
};

const CANVAS_W = 800;
const CANVAS_H = 500;

export function MoodboardClient({
  initialBoards,
  initialItems,
}: {
  initialBoards: Moodboard[];
  initialItems: CatalogItem[];
}) {
  const [boards, setBoards] = useState<Moodboard[]>(initialBoards);
  const [activeBoard, setActiveBoard] = useState<Moodboard | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [annotations, setAnnotations] = useState<Array<{ id: string; x: number; y: number; label: string; color: string }>>([]);

  const onDrop = useCallback((accepted: File[]) => {
    if (!accepted[0] || !activeBoard) return;
    const formData = new FormData();
    formData.append('image', accepted[0]);
    formData.append('name', activeBoard.name);
    // Load for preview
    const img = new window.Image();
    img.src = URL.createObjectURL(accepted[0]);
    img.onload = () => setBgImage(img);
  }, [activeBoard]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1, noClick: !!bgImage,
  });

  async function handleCreate() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', newName.trim());
      const res = await fetch('/api/moodboard', { method: 'POST', body: fd });
      const board = await res.json() as Moodboard;
      setBoards((prev) => [board, ...prev]);
      setActiveBoard(board);
      setShowCreate(false);
      setNewName('');
      toast.success('Moodboard created');
    } catch {
      toast.error('Failed to create moodboard');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveCanvas() {
    if (!activeBoard) return;
    const canvasData = JSON.stringify(annotations);
    await fetch(`/api/moodboard/${activeBoard.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canvasData }),
    });
    toast.success('Moodboard saved');
  }

  async function handleDelete(id: string) {
    await fetch(`/api/moodboard/${id}`, { method: 'DELETE' });
    setBoards((prev) => prev.filter((b) => b.id !== id));
    if (activeBoard?.id === id) setActiveBoard(null);
    toast.success('Moodboard deleted');
  }

  function addItem(item: CatalogItem) {
    setAnnotations((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        x: 100 + Math.random() * 400,
        y: 100 + Math.random() * 200,
        label: item.name,
        color: '#4f46e5',
      },
    ]);
  }

  function removeAnnotation(id: string) {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  }

  if (activeBoard) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setActiveBoard(null)}>← Back</Button>
            <h2 className="text-xl font-bold">{activeBoard.name}</h2>
          </div>
          <Button size="sm" onClick={handleSaveCanvas}>
            <Save className="h-4 w-4 mr-1" /> Save
          </Button>
        </div>

        <div className="grid grid-cols-[1fr,200px] gap-4">
          {/* Canvas */}
          <div {...getRootProps()}
            className="border-2 border-dashed rounded-lg overflow-hidden cursor-pointer"
            style={{ width: CANVAS_W, height: CANVAS_H, position: 'relative' }}>
            <input {...getInputProps()} />
            {!bgImage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="h-12 w-12 opacity-30" />
                <p className="text-sm mt-2">Drop a room photo as background</p>
              </div>
            )}
            <Stage width={CANVAS_W} height={CANVAS_H}>
              <Layer>
                {bgImage && <Image image={bgImage} width={CANVAS_W} height={CANVAS_H} />}
                {annotations.map((ann) => (
                  <Rect key={ann.id}
                    x={ann.x} y={ann.y} width={120} height={40}
                    fill={ann.color} opacity={0.8} cornerRadius={4}
                    draggable
                    onDragEnd={(e) => {
                      setAnnotations((prev) => prev.map((a) =>
                        a.id === ann.id ? { ...a, x: e.target.x(), y: e.target.y() } : a
                      ));
                    }}
                  />
                ))}
                {annotations.map((ann) => (
                  <Text key={`t-${ann.id}`}
                    x={ann.x + 6} y={ann.y + 12}
                    text={ann.label} fontSize={11} fill="white"
                    width={108} ellipsis listening={false}
                  />
                ))}
              </Layer>
            </Stage>
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Add from Catalog</p>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {initialItems.map((item) => (
                <button key={item.id}
                  onClick={() => addItem(item)}
                  className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted transition-colors truncate border">
                  {item.name}
                </button>
              ))}
              {initialItems.length === 0 && (
                <p className="text-xs text-muted-foreground">Add items to catalog first</p>
              )}
            </div>

            <p className="text-sm font-medium mt-4">Labels ({annotations.length})</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {annotations.map((ann) => (
                <div key={ann.id} className="flex items-center justify-between text-xs border rounded px-2 py-1">
                  <span className="truncate">{ann.label}</span>
                  <button onClick={() => removeAnnotation(ann.id)} className="text-destructive ml-1">✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Moodboard</h1>
          <p className="text-muted-foreground text-sm mt-1">{boards.length} board{boards.length !== 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Board
        </Button>
      </div>

      {boards.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No moodboards yet. Create one to visualize your design ideas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <div key={board.id} className="border rounded-lg overflow-hidden hover:shadow-sm transition-shadow cursor-pointer"
              onClick={() => setActiveBoard(board)}>
              {board.imagePath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/${board.imagePath}`} alt={board.name} className="w-full h-32 object-cover" />
              ) : (
                <div className="w-full h-32 bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground text-4xl">🖼️</span>
                </div>
              )}
              <div className="p-3 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-sm">{board.name}</h3>
                  {board.style && <Badge variant="secondary" className="text-xs mt-1">{board.style}</Badge>}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                  onClick={(e) => { e.stopPropagation(); handleDelete(board.id); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Moodboard</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Name</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Living Room Refresh" autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !newName.trim()}>
              {saving ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
