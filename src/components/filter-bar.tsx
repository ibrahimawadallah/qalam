'use client';

import { Search, LayoutGrid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAudioStore } from '@/lib/audio-store';

type RevelationFilter = 'All' | 'Meccan' | 'Medinan';

export default function FilterBar() {
  const {
    searchQuery,
    setSearchQuery,
    revelationFilter,
    setRevelationFilter,
    viewMode,
    setViewMode,
    meccanCount,
    medinanCount,
  } = useAudioStore();

  const filters: { label: string; value: RevelationFilter; count: number }[] = [
    { label: 'All', value: 'All', count: 114 },
    { label: 'Meccan', value: 'Meccan', count: meccanCount },
    { label: 'Medinan', value: 'Medinan', count: medinanCount },
  ];

  return (
    <div className="glass-sticky sticky top-0 z-30 py-2 sm:py-3 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto flex items-center gap-2 sm:gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search surah..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 sm:pl-10 h-9 sm:h-10 text-sm bg-[rgba(20,10,40,0.6)] border-purple-500/20 text-foreground placeholder:text-muted-foreground focus:border-amber-500/40 focus:ring-amber-500/20"
          />
        </div>

        {/* Filter buttons — compact on mobile */}
        <div className="flex items-center gap-1 shrink-0">
          {filters.map((filter) => (
            <Button
              key={filter.value}
              variant={revelationFilter === filter.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRevelationFilter(filter.value)}
              className={
                revelationFilter === filter.value
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30 gap-1 h-9 sm:h-9 text-xs sm:text-sm px-1.5 sm:px-3 touch-manipulation active:scale-95'
                  : 'border-purple-500/20 bg-transparent text-muted-foreground hover:bg-purple-500/10 hover:text-purple-200 gap-1 h-9 sm:h-9 text-xs sm:text-sm px-1.5 sm:px-3 touch-manipulation active:scale-95'
              }
            >
              <span className="hidden sm:inline">{filter.label}</span>
              <span className="sm:hidden">{filter.label.charAt(0)}</span>
              <Badge
                variant="secondary"
                className={`px-1 sm:px-1.5 py-0 text-[9px] sm:text-[10px] ${
                  revelationFilter === filter.value
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-purple-500/10 text-muted-foreground'
                }`}
              >
                {filter.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-0.5 sm:gap-1 border border-purple-500/20 rounded-lg p-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className={`h-9 w-9 sm:h-8 sm:w-8 rounded-md touch-manipulation active:scale-95 ${
              viewMode === 'list'
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-muted-foreground hover:text-purple-200'
            }`}
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4 sm:w-4 sm:h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-9 w-9 sm:h-8 sm:w-8 rounded-md touch-manipulation active:scale-95 ${
              viewMode === 'grid'
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-muted-foreground hover:text-purple-200'
            }`}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="w-4 h-4 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
