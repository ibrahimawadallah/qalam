"use client";

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from "react";
import PageHead from "@/components/page-head";
import Khatam from "@/components/khatam";
import CountryCitySelector from "@/components/country-city-selector";
import QiblaCompass from "@/components/qibla-compass";

type Prayer = "Fajr" | "Sunrise" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";
type PrayerEntries = Record<Prayer, string>;

const PRAYER_LIST: Prayer[] = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

const PRAYER_AR: Record<Prayer, string> = {
  Fajr: "الفجر",
  Sunrise: "الشروق",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
};

function toMinutes(time24: string): number {
  const [h, m] = time24.split(":").map(Number);
  return h * 60 + m;
}

function mapTimings(raw: Record<string, string>): PrayerEntries {
  return {
    Fajr: raw.Fajr,
    Sunrise: raw.Sunrise,
    Dhuhr: raw.Dhuhr,
    Asr: raw.Asr,
    Maghrib: raw.Maghrib,
    Isha: raw.Isha,
  };
}

export default function PrayerTimesPage() {
  const t = useTranslations('prayerTimes');
  const tCommon = useTranslations('common');
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [timings, setTimings] = useState<PrayerEntries | null>(null);
  const [timezone, setTimezone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<string>("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [hijri, setHijri] = useState<{
    date: string;
    day: string;
    month: { en: string; ar: string };
    year: string;
    weekday: { en: string };
  } | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const loadByCity = useCallback(async (country: string, city: string) => {
    if (!country.trim() || !city.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/prayer-times?city=${encodeURIComponent(city.trim())}&country=${encodeURIComponent(country.trim())}`);
      if (!res.ok) throw new Error(t('loadingError'));
      const json = await res.json();
      setTimings(mapTimings(json.data.timings));
      setTimezone(json.data.meta.timezone);
      setDate(json.data.date.readable);
      setHijri(json.data.date.hijri);
      setCoords({ lat: json.data.meta.latitude, lng: json.data.meta.longitude });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setError(t('geolocationNotSupported'));
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`/api/prayer-times?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`);
          if (!res.ok) throw new Error(t('loadingError'));
          const json = await res.json();
          setTimings(mapTimings(json.data.timings));
          setTimezone(json.data.meta.timezone);
          setDate(json.data.date.readable);
          setHijri(json.data.date.hijri);
          setCoords({ lat: json.data.meta.latitude, lng: json.data.meta.longitude });
        } catch (e) {
          setError(e instanceof Error ? e.message : "Unknown error");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
  }, []);

  const nextPrayer = useMemo(() => {
    if (!timings) return null;
    const currentMins = now.getHours() * 60 + now.getMinutes();
    for (const p of PRAYER_LIST) {
      if (p !== "Sunrise" && toMinutes(timings[p]) > currentMins) return p;
    }
    return "Fajr";
  }, [now, timings]);

  const countdown = useMemo(() => {
    if (!timings || !nextPrayer) return "--:--";
    const target = toMinutes(timings[nextPrayer]);
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const dayTarget = target + (target <= currentMins ? 24 * 60 : 0);
    const diff = dayTarget - currentMins;
    if (diff < 0) return "00:00";
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }, [now, timings, nextPrayer]);

  return (
    <div className="min-h-screen">
      <PageHead eyebrow={t('eyebrow')} title={t('title')}>
        {t('description')}
      </PageHead>

      <main className="mx-auto max-w-[920px] px-6 py-12 page-enter">
        {/* Location selector */}
        <div className="rounded-sm border border-gold bg-paper p-4 shadow-[var(--shadow-deep)] sm:p-5">
          <CountryCitySelector
            country={selectedCountry}
            city={selectedCity}
            onCountryChange={setSelectedCountry}
            onCityChange={setSelectedCity}
            onSearch={loadByCity}
            loading={loading}
          />

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => loadByCity(selectedCountry, selectedCity)}
              disabled={loading || !selectedCountry.trim() || !selectedCity.trim()}
              className="flex-1 rounded-sm bg-emerald-deep px-4 py-3 font-ui text-sm font-semibold text-ivory transition-colors hover:bg-emerald-mid disabled:opacity-50"
            >
              {loading ? tCommon('loading') : t('getTimes')}
            </button>
            <button
              onClick={locateMe}
              className="rounded-sm border border-gold px-4 py-3 font-ui text-sm font-semibold text-emerald-deep transition-colors hover:bg-gold/10"
            >
              {t('locateMe')}
            </button>
          </div>

          {error && <p className="mt-2 font-ui text-xs text-destructive">{error}</p>}
        </div>

        {timings && (
          <>
            <div className="mb-4 mt-8 flex flex-wrap items-center justify-between gap-2">
              <p className="eyebrow text-emerald-mid">{t('todayTimes')}</p>
              <span className="font-ui text-xs text-muted-foreground">
                {date} · {timezone}
              </span>
            </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {PRAYER_LIST.map((prayer) => {
                const active = nextPrayer === prayer;
                return (
                  <div
                    key={prayer}
                    className={`tile-corners rounded-sm p-5 text-center transition-all ${
                      active
                        ? "border border-emerald-deep bg-emerald-deep text-ivory"
                        : "warm-card"
                    }`}
                  >
                    <Khatam className={`mx-auto mb-2.5 h-4 w-4 ${active ? "text-gold-bright" : "text-maroon"}`} />
                    <p className="font-display text-[17px] leading-snug">{t('prayer' + prayer)}</p>
                    <p className={`arabic-name mt-0.5 mb-2.5 text-sm ${active ? "text-gold-bright" : "text-muted-foreground"}`} dir="rtl">
                      {PRAYER_AR[prayer]}
                    </p>
                    <p className="font-ui text-lg font-semibold tabular-nums">{timings[prayer]}</p>
                    {active && (
                      <p className="eyebrow mt-1.5 text-[9px] tracking-[0.1em] text-gold-bright">
                        {t('inCountdown')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {nextPrayer && (
              <div className="mt-4 rounded-sm border border-gold/40 bg-paper p-4 text-center">
                <p className="font-ui text-xs text-muted-foreground">
                  {t.rich('nextPrayer', {
                    prayer: () => <span className="font-display text-base text-emerald-deep">{nextPrayer}</span>,
                  })}{' '}
                  — {t.rich('inCountdown', { countdown: () => <span className="font-ui font-bold text-maroon">{countdown}</span> })}
                </p>
              </div>
            )}
          </>
        )}

        {coords && (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="mx-auto w-full max-w-lg">
              <QiblaCompass lat={coords.lat} lng={coords.lng} />
            </div>

            {hijri && (
              <div className="tile-corners warm-card flex flex-col justify-center rounded-sm p-5 sm:p-6">
                <p className="eyebrow text-emerald-mid">{t('hijriDate')}</p>
                <p className="arabic-name mt-2 text-3xl leading-snug text-emerald-deep" dir="rtl">
                  {hijri.day} {hijri.month.ar} {hijri.year}
                </p>
                <p className="font-display mt-1.5 text-xl text-ink">
                  {hijri.weekday.en}, {hijri.date}
                </p>
                <div className="mt-3 flex items-center gap-2 text-muted-foreground">
                  <Khatam className="h-3.5 w-3.5 text-maroon" />
                  <span className="font-ui text-xs">{hijri.month.en} · {hijri.year} AH</span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
