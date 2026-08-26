"use client";

import React, { useState, useMemo } from "react";
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('reciterPanel');

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

  const isOpen = showReciterPanel || isReciterPanelOpen;

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
        className="w-full sm:max-w-md overflow-y-auto border-border bg-background"
        style={{
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(139, 115, 85, 0.2) transparent",
        }}
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="text-foreground text-lg">{t('title')}</SheetTitle>
          <SheetDescription className="text-muted-foreground text-sm">
            {t('description')}
          </SheetDescription>
        </SheetHeader>

        {/* Search */}
        <div className="relative mb-5 px-4">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
             placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/30 border-border text-foreground placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:ring-primary/15"
          />
        </div>

        {/* Reciter categories */}
        <div className="space-y-6 px-4">
          {CATEGORY_ORDER.map((category) => {
            const catReciters = groupedReciters[category];
            if (!catReciters || catReciters.length === 0) return null;

            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{CATEGORY_FLAGS[category]}</span>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                     {t(category.toLowerCase())}
                   </h3>
                  <span className="text-xs text-muted-foreground/50">
                    ({catReciters.length})
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {catReciters.map((r) => {
                    const isSelected = currentReciter === r.id;

                    return (
                      <button
                        key={r.id}
                        onClick={() => handleSelectReciter(r)}
                        className={`relative flex items-center gap-3 p-3 rounded-xl text-left transition-all border ${
                          isSelected
                            ? "bg-primary/8 border-primary/25 text-foreground"
                            : "bg-muted/20 border-border text-muted-foreground hover:bg-muted/40 hover:border-border"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <Check className="w-4 h-4 text-primary" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">
                            {r.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className="text-xs text-muted-foreground"
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
                            <span className="text-[11px] text-muted-foreground/60">
                              {r.country}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-4 border-border text-muted-foreground"
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
        <div className="mt-8 px-4 pb-6 border-t border-border pt-6">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z" />
            </svg>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {t('audioQuality')}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground/60 leading-relaxed">
            {t('streamingInfo')} {t('sourceInfo')}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
