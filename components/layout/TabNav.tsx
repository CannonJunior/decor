'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

const tabs = [
  { href: '/rooms',     label: 'Rooms',     emoji: '🏠' },
  { href: '/catalog',   label: 'Catalog',   emoji: '🛋️' },
  { href: '/wishlist',  label: 'Wishlist',  emoji: '⭐' },
  { href: '/discover',  label: 'Discover',  emoji: '📰' },
  { href: '/style',     label: 'Style',     emoji: '🎨' },
  { href: '/moodboard', label: 'Moodboard', emoji: '🖼️' },
  { href: '/inspire',   label: 'Inspire',   emoji: '✨' },
  { href: '/advisor',   label: 'Advisor',   emoji: '💬' },
];

export function TabNav() {
  const pathname = usePathname();
  const [alertCount, setAlertCount] = useState(0);

  // Fetch alert count for wishlist badge
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/wishlist/alerts', { signal: controller.signal })
      .then((r) => r.json())
      .then((data: { count: number }) => setAlertCount(data.count ?? 0))
      .catch(() => {});
    return () => controller.abort();
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex h-14 items-center gap-1">
          {/* Logo */}
          <Link href="/rooms" className="mr-4 flex items-center gap-2 font-bold text-lg">
            <span>🏠</span>
            <span>nest</span>
          </Link>

          {/* Nav tabs */}
          <nav className="flex items-center gap-0.5 flex-1">
            {tabs.map((tab) => {
              const isActive = pathname.startsWith(tab.href);
              const isWishlist = tab.href === '/wishlist';
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    'relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <span>{tab.emoji}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  {isWishlist && alertCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-white text-[10px] font-bold">
                      {alertCount > 9 ? '9+' : alertCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Settings */}
          <Link
            href="/settings"
            className="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-muted transition-colors"
            title="Settings"
          >
            ⚙️
          </Link>
        </div>
      </div>
    </header>
  );
}
