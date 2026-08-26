"use client";

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from "react";
import PageHead from "@/components/page-head";
import Khatam from "@/components/khatam";
import { ChevronLeft, ChevronRight } from "lucide-react";

type CalendarDay = {
  date: {
    readable: string;
    gregorian: {
      date: string;
      day: string;
      month: { number: number; en: string };
      year: string;
      weekday: { en: string };
    };
    hijri: {
      date: string;
      day: string;
      month: { number: number; en: string; ar: string };
      year: string;
      weekday: { en: string };
    };
  };
};

type CalendarResponse = {
  code: number;
  status: string;
  data: CalendarDay[];
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function IslamicCalendarPage() {
  const t = useTranslations('calendar');
  const tCommon = useTranslations('common');
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [data, setData] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCalendar = useCallback(async (month: number, year: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/islamic-calendar?month=${month}&year=${year}`);
      if (!res.ok) throw new Error(t('loadingError'));
      const json = (await res.json()) as CalendarResponse;
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCalendar(month, year);
  }, [month, year, loadCalendar]);

  const days = useMemo(() => {
    const grid: (CalendarDay | null)[][] = [];
    let currentRow: (CalendarDay | null)[] = [];

    data.forEach((day) => {
      const weekday = day.date.gregorian.weekday.en;
      const dayIndex = WEEKDAYS.indexOf(weekday);

      if (currentRow.length === 0 && dayIndex > 0) {
        const emptySlots: (CalendarDay | null)[] = Array.from({ length: dayIndex }, () => null);
        currentRow = emptySlots.concat([day]);
      } else {
        currentRow.push(day);
      }

      if (currentRow.length === 7) {
        grid.push(currentRow);
        currentRow = [];
      }
    });

    if (currentRow.length > 0) {
      grid.push(currentRow);
    }

    return grid;
  }, [data]);

  const monthName = data[0]?.date.gregorian.month.en ?? "Loading...";
  const displayYear = data[0]?.date.gregorian.year ?? year;

  return (
    <div className="min-h-screen">
      <PageHead eyebrow={t('eyebrow')} title={t('title')}>
        {t('description')}
      </PageHead>

      <main className="mx-auto max-w-[820px] px-6 py-12 page-enter">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => {
              const newMonth = month - 1;
              if (newMonth < 1) {
                setMonth(12);
                setYear(year - 1);
              } else {
                setMonth(newMonth);
              }
            }}
            disabled={loading}
            className="flex items-center gap-1 rounded-sm border border-border px-3.5 py-2.5 font-ui text-sm text-muted-foreground hover:border-gold hover:bg-muted disabled:opacity-50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {tCommon('previous')}
          </button>

          <div className="text-center">
            <h2 className="text-[26px] leading-tight text-emerald-deep">
              {monthName} {displayYear}
            </h2>
            <div className="mt-1 flex justify-center gap-2.5">
              {WEEKDAYS.map((d) => (
                <span key={d} className="w-6 font-ui text-[10px] uppercase tracking-wide text-muted-foreground">{d}</span>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              const newMonth = month + 1;
              if (newMonth > 12) {
                setMonth(1);
                setYear(year + 1);
              } else {
                setMonth(newMonth);
              }
            }}
            disabled={loading}
            className="flex items-center gap-1 rounded-sm border border-border px-3.5 py-2.5 font-ui text-sm text-muted-foreground hover:border-gold hover:bg-muted disabled:opacity-50 transition-colors"
          >
            {tCommon('next')}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="audio-bar w-1 bg-gold/60 rounded-full" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}
        {error && <p className="text-center font-ui text-sm text-destructive">{error}</p>}

        {!loading && !error && (
          <div className="warm-card rounded-sm p-3 sm:p-4">
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {days.map((row, rowIdx) =>
                row.map((day, colIdx) => {
                  if (!day) {
                    return <div key={`empty-${rowIdx}-${colIdx}`} className="min-h-[60px] sm:min-h-[80px]" />;
                  }

                  const isFriday = day.date.gregorian.weekday.en === "Fri";
                  const hijriDay = day.date.hijri.day;
                  const gregDay = day.date.gregorian.day;

                  return (
                    <div
                      key={day.date.readable}
                      className={`flex min-h-[60px] flex-col rounded-sm border p-1.5 sm:min-h-[80px] sm:p-2 ${
                        isFriday
                          ? "border-gold/50 bg-gold/10"
                          : "border-emerald-deep/10 bg-paper"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-display text-base font-semibold leading-none text-emerald-deep sm:text-lg">{hijriDay}</p>
                          <p className="arabic-name mt-0.5 text-right text-[10px] text-muted-foreground sm:text-xs" dir="rtl">{day.date.hijri.month.ar}</p>
                        </div>
                        <div className="text-left">
                          <p className="font-ui text-xs text-muted-foreground sm:text-sm">{gregDay}</p>
                          <p className="font-ui text-[9px] uppercase tracking-wide text-muted-foreground/70 sm:text-[10px]">{day.date.gregorian.month.en.slice(0, 3)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {!loading && !error && data.length > 0 && (
          <div className="tile-corners mt-8 rounded-sm border border-gold/30 bg-paper p-6 shadow-[var(--shadow-deep)]">
            <h3 className="mb-4 flex items-center gap-2.5 text-xl text-emerald-deep">
              <Khatam className="h-4 w-4 text-maroon" />
              {t('todayDate')}
            </h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p className="eyebrow mb-1.5 text-maroon">{t('hijriLabel')}</p>
                <p className="font-display text-lg text-ink">
                  {data[0]?.date.hijri.day} {data[0]?.date.hijri.month.en} {data[0]?.date.hijri.year}
                </p>
                <p className="arabic-name mt-0.5 text-sm text-muted-foreground" dir="rtl">{data[0]?.date.hijri.month.ar}</p>
              </div>
              <div>
                <p className="eyebrow mb-1.5 text-maroon">{t('gregorianLabel')}</p>
                <p className="font-display text-lg text-ink">
                  {data[0]?.date.gregorian.day} {data[0]?.date.gregorian.month.en} {data[0]?.date.gregorian.year}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
