"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DrawerNav from "@/components/drawer-nav";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

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
      if (!res.ok) throw new Error("Failed to load calendar");
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
    <div className="min-h-screen bg-background pt-14">
      <main className="mx-auto max-w-screen-xl px-3 py-8">
        <div className="mb-8 text-center page-enter">
          <h1 className="text-3xl font-bold text-primary mb-2">Islamic Calendar</h1>
          <p className="text-muted-foreground text-sm">Hijri calendar with corresponding Gregorian dates</p>
        </div>

        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between mb-6">
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
              className="flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground">
                {monthName} {displayYear}
              </h2>
              <div className="flex justify-center gap-3 mt-1">
                {WEEKDAYS.map((d) => (
                  <span key={d} className="text-[10px] text-muted-foreground w-6">{d}</span>
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
              className="flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted disabled:opacity-50 transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="audio-bar w-1 bg-primary/40 rounded-full" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          )}
          {error && <p className="text-center text-destructive text-sm">{error}</p>}

          {!loading && !error && (
            <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
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
                        className={`min-h-[60px] sm:min-h-[80px] rounded-xl border p-1.5 sm:p-2 flex flex-col ${
                          isFriday
                            ? "border-primary/20 bg-primary/5"
                            : "border-border bg-muted/20"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="text-right">
                            <p className="text-base sm:text-lg font-bold text-foreground leading-none">{hijriDay}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{day.date.hijri.month.ar}</p>
                          </div>
                          <div className="text-left">
                            <p className="text-xs sm:text-sm text-foreground/70">{gregDay}</p>
                            <p className="text-[10px] text-muted-foreground">{day.date.gregorian.month.en}</p>
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
            <div className="mt-8 rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Today&apos;s Date</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Hijri</p>
                  <p className="text-lg text-foreground font-semibold">
                    {data[0]?.date.hijri.day} {data[0]?.date.hijri.month.en} {data[0]?.date.hijri.year}
                  </p>
                  <p className="text-xs text-muted-foreground">{data[0]?.date.hijri.month.ar}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Gregorian</p>
                  <p className="text-lg text-foreground font-semibold">
                    {data[0]?.date.gregorian.day} {data[0]?.date.gregorian.month.en} {data[0]?.date.gregorian.year}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <DrawerNav />
    </div>
  );
}
