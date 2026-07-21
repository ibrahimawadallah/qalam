"use client";

import React, { useState, useMemo } from "react";
import { Search, Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAudioStore } from "@/lib/audio-store";
import { RECITERS } from "@/lib/quran-data";
import type { Reciter } from "@/lib/quran-types";

const CATEGORY_FLAGS: Record<string, string> = {
  Popular: "🌟",
  Egyptian: "🇪🇬",
  Saudi: "🇸🇦",
  Other: "🌍",
};

const CATEGORY_ORDER = ["Popular", "Egyptian", "Saudi", "Other"];

export default function ReciterPanel() {
  const {
    showReciterPanel,
    setShowReciterPanel,
    isReciterPanelOpen,
    toggleReciterPanel,
    closeReciterPanel,
    currentReciter,
    setCurrentReciter,
    setReciter,
    isPlaying,
    currentSurah,
  } = useAudioStore();

  const [search, setSearch] = useState("");

  // Panel is open if either state is true (compatibility with both APIs)
  const isOpen = showReciterPanel || isReciterPanelOpen;

  // Filter reciters by search
  const filteredReciters = useMemo(() => {
    if (!search.trim()) return RECITERS;
    const q = search.toLowerCase();
    return RECITERS.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.arabicName.includes(q) ||
        r.country.toLowerCase().includes(q) ||
        r.style.toLowerCase().includes(q)
    );
  }, [search]);

  // Group reciters by category
  const groupedReciters = useMemo(() => {
    const groups: Record<string, Reciter[]> = {};
    for (const cat of CATEGORY_ORDER) {
      groups[cat] = [];
    }
    for (const reciterItem of filteredReciters) {
      if (!groups[reciterItem.category]) {
        groups[reciterItem.category] = [];
      }
      groups[reciterItem.category].push(reciterItem);
    }
    return groups;
  }, [filteredReciters]);

  /** Select a reciter — if playing, force reload audio */
  const handleSelectReciter = (r: Reciter) => {
    setCurrentReciter(r.id);
    setReciter(r);
    closeReciterPanel();
  };

  const handleClose = (open: boolean) => {
    if (!open) closeReciterPanel();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto border-purple-900/30"
        style={{
          background: "rgba(15, 10, 30, 0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(139, 92, 246, 0.3) transparent",
        }}
      >
        {/* Header */}
        <SheetHeader className="mb-4">
          <SheetTitle className="text-white text-lg">Reciters</SheetTitle>
          <SheetDescription className="text-gray-400 text-sm">
            Choose your preferred reciter — full surah streaming
          </SheetDescription>
        </SheetHeader>

        {/* Search */}
        <div className="relative mb-5 px-4">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search reciters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:border-purple-500 focus-visible:ring-purple-500/30"
          />
        </div>

        {/* Reciter categories */}
        <div className="space-y-6 px-4">
          {CATEGORY_ORDER.map((category) => {
            const catReciters = groupedReciters[category];
            if (!catReciters || catReciters.length === 0) return null;

            return (
              <div key={category}>
                {/* Category header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{CATEGORY_FLAGS[category]}</span>
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    {category}
                  </h3>
                  <span className="text-xs text-gray-600">
                    ({catReciters.length})
                  </span>
                </div>

                {/* Reciter grid */}
                <div className="grid grid-cols-1 gap-2">
                  {catReciters.map((r) => {
                    const isSelected = currentReciter === r.id;

                    return (
                      <button
                        key={r.id}
                        onClick={() => handleSelectReciter(r)}
                        className={`relative flex items-center gap-3 p-3 rounded-lg text-left transition-all border ${
                          isSelected
                            ? "bg-amber-500/10 border-amber-500/40 text-white"
                            : "bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/10"
                        }`}
                      >
                        {/* Selected checkmark */}
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <Check className="w-4 h-4 text-amber-400" />
                          </div>
                        )}

                        {/* Reciter info */}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">
                            {r.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className="text-xs text-gray-400"
                              style={{
                                fontFamily:
                                  "'Scheherazade New', 'Traditional Arabic', serif",
                              }}
                              dir="rtl"
                            >
                              {r.arabicName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[11px] text-gray-500">
                              {r.country}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-4 border-purple-500/30 text-purple-300"
                            >
                              {r.style}
                            </Badge>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Audio quality note */}
        <div className="mt-8 px-4 pb-6 border-t border-white/10 pt-6">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z" />
            </svg>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Audio Quality
            </h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Full surah streaming — each surah plays as one complete audio file for seamless, gapless playback.
            Primary source: mp3quran.net with automatic fallback for maximum reliability.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
