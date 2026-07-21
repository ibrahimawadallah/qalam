"use client";

import { useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAudioStore } from "@/lib/audio-store";
import { RADIO_STATIONS, getStationsByCategory } from "@/lib/quran-data";
import type { RadioStation, RadioCategory } from "@/lib/quran-types";
import { Radio, Shield, Sun, Moon } from "lucide-react";

const CATEGORY_META: Record<RadioCategory, { label: string; arabicLabel: string; icon: typeof Radio }> = {
  quran: { label: "Holy Quran Radio", arabicLabel: "إذاعة القرآن الكريم", icon: Radio },
  ruqyah: { label: "Ruqyah al-Shariah", arabicLabel: "الرقية الشرعية", icon: Shield },
  adhkar: { label: "Adhkar", arabicLabel: "الأذكار", icon: Sun },
};

export default function RadioPanel() {
  const { showRadioPanel, toggleRadioPanel, currentRadioId, setRadioMode, isRadioMode } = useAudioStore();

  const grouped = useMemo(() => {
    const groups: { category: RadioCategory; stations: RadioStation[] }[] = [];
    for (const cat of ["quran", "ruqyah", "adhkar"] as RadioCategory[]) {
      const stations = getStationsByCategory(cat);
      if (stations.length > 0) groups.push({ category: cat, stations });
    }
    return groups;
  }, []);

  return (
    <Sheet open={showRadioPanel} onOpenChange={(open) => { if (!open) toggleRadioPanel(); }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md border-l border-emerald-500/20 overflow-y-auto"
        style={{ background: "rgba(5, 18, 10, 0.98)", backdropFilter: "blur(20px)" }}
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="text-emerald-200 text-lg flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400" />
            <span>Radio &amp; Audio Services</span>
          </SheetTitle>
          <p className="text-emerald-300/50 text-xs">إذاعة ورقية وأذكار</p>
        </SheetHeader>

        <div className="space-y-5">
          {grouped.map(({ category, stations }) => {
            const meta = CATEGORY_META[category];
            const Icon = meta.icon;
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <Icon className="w-4 h-4 text-emerald-400/80" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300/70">
                    {meta.arabicLabel}
                  </span>
                  <span className="text-[10px] text-emerald-400/40">{meta.label}</span>
                </div>
                <div className="space-y-1">
                  {stations.map((station) => {
                    const isActive = isRadioMode && currentRadioId === station.id;
                    return (
                      <button
                        key={station.id}
                        onClick={() => {
                          setRadioMode(station);
                          toggleRadioPanel();
                        }}
                        className={`w-full text-left rounded-lg px-3 py-2.5 transition-all active:scale-[0.98] ${
                          isActive
                            ? "bg-emerald-500/15 border border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                            : "bg-emerald-500/5 border border-transparent hover:bg-emerald-500/10"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-sm font-medium ${isActive ? "text-emerald-200" : "text-emerald-100/80"}`}>
                                {station.arabicName}
                              </span>
                              {isActive && (
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                                </span>
                              )}
                            </div>
                            {station.reciterArabicName && (
                              <p className="text-[11px] text-emerald-300/50 mt-0.5">
                                {station.reciterArabicName} — {station.reciterName}
                              </p>
                            )}
                            <p className="text-[10px] text-emerald-300/40 mt-0.5 line-clamp-1">
                              {station.description}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`shrink-0 text-[10px] px-2 py-0 ${
                              category === "quran"
                                ? "border-amber-500/20 text-amber-400/60"
                                : category === "ruqyah"
                                ? "border-red-500/20 text-red-400/60"
                                : "border-blue-500/20 text-blue-400/60"
                            }`}
                          >
                            {category === "quran" ? "Quran" : category === "ruqyah" ? "Ruqyah" : "Adhkar"}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
