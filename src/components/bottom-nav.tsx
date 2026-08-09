'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Search, Heart, Clock } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/quran', label: 'Quran', icon: BookOpen },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/azkar', label: 'Azkar', icon: Heart },
  { href: '/prayer-times', label: 'Prayer', icon: Clock },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all touch-manipulation min-w-[56px] ${
                active
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${
                active ? 'bg-primary/10' : ''
              }`}>
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.5} />
              </div>
              <span className={`text-[10px] font-medium ${active ? 'text-primary' : ''}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
