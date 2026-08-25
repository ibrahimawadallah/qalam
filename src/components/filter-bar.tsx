'use client';

import { Search, X } from 'lucide-react';
import { useAudioStore } from '@/lib/audio-store';

export default function FilterBar() {
  const {
    searchQuery,
    setSearchQuery,
  } = useAudioStore();

  return (
    <div className="relative flex items-center gap-3 border border-gold bg-paper px-[18px] py-3.5 shadow-[var(--shadow-deep)] transition-colors focus-within:bg-white">
      <Search className="h-4 w-4 shrink-0 text-maroon" />
      <input
        type="text"
        placeholder="Try &lsquo;Kahf&rsquo;, &lsquo;الرحمن&rsquo;, or &lsquo;36&rsquo;…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-transparent font-serif text-base text-ink outline-none placeholder:text-muted-foreground"
        aria-label="Search surah by name or number"
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          aria-label="Clear search"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-maroon"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
