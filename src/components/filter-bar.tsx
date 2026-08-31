'use client';

import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAudioStore } from '@/lib/audio-store';

export default function FilterBar() {
  const t = useTranslations('filterBar');

  const {
    searchQuery,
    setSearchQuery,
  } = useAudioStore();

  return (
    <div className="relative flex items-center gap-2 sm:gap-3 border border-gold bg-parchment px-3 sm:px-[18px] py-2 sm:py-3.5 shadow-[var(--shadow-deep)] transition-colors focus-within:bg-white">
      <Search className="h-4 w-4 shrink-0 text-crimson" />
      <input
        type="text"
         placeholder={t('placeholder')}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-transparent font-serif text-base text-ink outline-none placeholder:text-muted-foreground"
        aria-label="Search surah by name or number"
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          aria-label="Clear search"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-crimson"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
