'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, RefreshCw, ExternalLink, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type InspirationSource = {
  id: string;
  name: string;
  type: string;
  url: string;
  active: number | null;
  lastFetched: number | null;
  createdAt: number;
};

export type InspirationPost = {
  id: string;
  sourceId: string | null;
  externalId: string | null;
  title: string | null;
  description: string | null;
  url: string;
  imageUrl: string | null;
  author: string | null;
  publishedAt: number | null;
  fetchedAt: number;
  tags: string | null;
  liked: number | null;
  styleTag: string | null;
  roomTag: string | null;
};

function timeAgo(ts: number | null) {
  if (!ts) return '';
  const diff = Date.now() / 1000 - ts;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function DiscoverClient({
  initialSources,
  initialPosts,
}: {
  initialSources: InspirationSource[];
  initialPosts: InspirationPost[];
}) {
  const [sources, setSources] = useState<InspirationSource[]>(initialSources);
  const [posts, setPosts] = useState<InspirationPost[]>(initialPosts);
  const [likedOnly, setLikedOnly] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddSource, setShowAddSource] = useState(false);
  const [newSource, setNewSource] = useState({ name: '', type: 'rss', url: '' });
  const [saving, setSaving] = useState(false);

  const displayed = likedOnly ? posts.filter((p) => p.liked) : posts;

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch('/api/inspiration/refresh', { method: 'POST' });
      const result = await res.json() as { added: number };
      const fresh = await fetch('/api/inspiration/posts').then((r) => r.json()) as InspirationPost[];
      setPosts(fresh);
      toast.success(`Feed refreshed — ${result.added} new post${result.added !== 1 ? 's' : ''}`);
    } catch {
      toast.error('Failed to refresh feed');
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLike(post: InspirationPost) {
    const res = await fetch(`/api/inspiration/posts/${post.id}/like`, { method: 'PUT' });
    const result = await res.json() as { liked: number };
    setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, liked: result.liked } : p));
  }

  async function handleAddSource() {
    if (!newSource.name.trim() || !newSource.url.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/inspiration/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSource),
      });
      const source = await res.json() as InspirationSource;
      setSources((prev) => [...prev, source]);
      setShowAddSource(false);
      setNewSource({ name: '', type: 'rss', url: '' });
      toast.success('Source added');
    } catch {
      toast.error('Failed to add source');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Discover</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {posts.length} posts from {sources.length} source{sources.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAddSource(true)}>
            <Plus className="h-4 w-4 mr-1" /> Source
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input type="checkbox" checked={likedOnly}
            onChange={(e) => setLikedOnly(e.target.checked)} className="rounded" />
          <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
          Saved only
        </label>
      </div>

      {displayed.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No posts yet. Click Refresh to fetch inspiration from your sources.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((post) => (
            <div key={post.id} className="border rounded-lg overflow-hidden hover:shadow-sm transition-shadow">
              {post.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.imageUrl} alt={post.title ?? ''} className="w-full h-48 object-cover" />
              )}
              <div className="p-3 space-y-2">
                <h3 className="font-medium text-sm line-clamp-2">{post.title}</h3>
                {post.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{post.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {post.author && <span>{post.author}</span>}
                    {post.publishedAt && <span>{timeAgo(post.publishedAt)}</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleLike(post)}
                      className={`p-1 rounded hover:bg-muted transition-colors ${post.liked ? 'text-rose-500' : 'text-muted-foreground'}`}>
                      <Heart className={`h-4 w-4 ${post.liked ? 'fill-rose-500' : ''}`} />
                    </button>
                    <a href={post.url} target="_blank" rel="noopener noreferrer"
                      className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
                {post.styleTag && (
                  <Badge variant="secondary" className="text-xs">{post.styleTag}</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAddSource} onOpenChange={setShowAddSource}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Inspiration Source</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={newSource.name}
                onChange={(e) => setNewSource((s) => ({ ...s, name: e.target.value }))}
                placeholder="e.g. Apartment Therapy" />
            </div>
            <div>
              <Label>Type</Label>
              <select className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={newSource.type}
                onChange={(e) => setNewSource((s) => ({ ...s, type: e.target.value }))}>
                <option value="rss">RSS Feed</option>
                <option value="reddit_rss">Reddit RSS</option>
                <option value="youtube_atom">YouTube Atom</option>
              </select>
            </div>
            <div>
              <Label>Feed URL</Label>
              <Input value={newSource.url}
                onChange={(e) => setNewSource((s) => ({ ...s, url: e.target.value }))}
                placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSource(false)}>Cancel</Button>
            <Button onClick={handleAddSource} disabled={saving}>
              {saving ? 'Adding...' : 'Add Source'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
