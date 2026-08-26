"use client";

import { useMemo } from "react";
import { useTranslations } from 'next-intl';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAudioStore } from "@/lib/audio-store";
import { RADIO_STATIONS, getStationsByCategory } from "@/lib/quran-data";
import type { RadioStation, RadioCategory } from "@/lib/quran-types";
import { Radio, Shield, Sun, Moon } from "lucide-react";

const CATEGORY_META: Record<RadioCategory, { labelKey: string; arabicLabel: string; icon: typeof Radio }> = {
  quran: { labelKey: "holyQuranRadio", arabicLabel: "إذاعة القرآن الكريم", icon: Radio },
  ruqyah: { labelKey: "ruqyahAlShariah", arabicLabel: "الرقية الشرعية", icon: Shield },
  hisn_muslim: { labelKey: "hisnMuslim", arabicLabel: "حصن المسلم", icon: Sun },
};

export default function RadioPanel() {
  const { showRadioPanel, toggleRadioPanel, currentRadioId, setRadioMode, isRadioMode } = useAudioStore();

  const t = useTranslations('radioPanel');

  const grouped = useMemo(() => {
    const groups: { category: RadioCategory; stations: RadioStation[] }[] = [];
    for (const cat of ["quran", "ruqyah", "hisn_muslim"] as RadioCategory[]) {
      const stations = getStationsByCategory(cat);
      if (stations.length > 0) groups.push({ category: cat, stations });
    }
    return groups;
  }, []);

  return (
    <Sheet open={showRadioPanel} onOpenChange={(open) => { if (!open) toggleRadioPanel(); }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md border-l border-border overflow-y-auto bg-background"
        style={{ backdropFilter: "blur(24px)" }}
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="text-foreground text-lg flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary" />
             <span>{t('title')}</span>
          </SheetTitle>
           <p className="text-muted-foreground text-xs">{t('arabicSubtitle')}</p>
        </SheetHeader>

        <div className="space-y-5">
          {grouped.map(({ category, stations }) => {
            const meta = CATEGORY_META[category];
            const Icon = meta.icon;
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <Icon className="w-4 h-4 text-primary/70" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {meta.arabicLabel}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50">{t(meta.labelKey)}</span>
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
                        className={`w-full text-left rounded-xl px-3 py-2.5 transition-all active:scale-[0.98] ${
                          isActive
                            ? "bg-primary/10 border border-primary/20 shadow-sm shadow-warm-sm"
                            : "bg-muted/30 border border-transparent hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-sm font-medium ${isActive ? "text-foreground" : "text-foreground/80"}`}>
                                {station.arabicName}
                              </span>
                              {isActive && (
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                                </span>
                              )}
                            </div>
                            {station.reciterArabicName && (
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {station.reciterArabicName} — {station.reciterName}
                              </p>
                            )}
                            <p className="text-[10px] text-muted-foreground/50 mt-0.5 line-clamp-1">
                              {station.description}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="shrink-0 text-[10px] px-2 py-0 border-border text-muted-foreground"
                           >
                             {category === "quran" ? t('holyQuranRadio') : category === "ruqyah" ? t('ruqyahAlShariah') : t('hisnMuslim')}
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
