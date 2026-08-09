'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAudioStore } from '@/lib/audio-store';

export default function FilterBar() {
  const {
    searchQuery,
    setSearchQuery,
  } = useAudioStore();

  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search surah by name, number, or meaning..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-11 pr-10 h-12 text-sm bg-card border-border rounded-2xl shadow-warm-sm"
      />
      {searchQuery && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSearchQuery('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
