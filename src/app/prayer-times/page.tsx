"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SiteNav from "@/components/site-nav";
import CountryCitySelector from "@/components/country-city-selector";
import QiblaCompass from "@/components/qibla-compass";

type Prayer = "Fajr" | "Sunrise" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";
type PrayerEntries = Record<Prayer, string>;

const PRAYER_LIST: Prayer[] = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

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
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [timings, setTimings] = useState<PrayerEntries | null>(null);
  const [timezone, setTimezone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<string>("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
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
      if (!res.ok) throw new Error("Failed to load prayer times");
      const json = await res.json();
      setTimings(mapTimings(json.data.timings));
      setTimezone(json.data.meta.timezone);
      setDate(json.data.date.readable);
      setCoords({ lat: json.data.meta.latitude, lng: json.data.meta.longitude });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`/api/prayer-times?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`);
          if (!res.ok) throw new Error("Failed to load prayer times");
          const json = await res.json();
          setTimings(mapTimings(json.data.timings));
          setTimezone(json.data.meta.timezone);
          setDate(json.data.date.readable);
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
      if (toMinutes(timings[p]) > currentMins) return p;
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
    <div className="min-h-screen" style={{ backgroundColor: "#0a0518" }}>
      <SiteNav />
      <main className="mx-auto max-w-screen-xl px-3 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-200 mb-2">Prayer Times</h1>
          <p className="text-blue-300/60 text-sm">Accurate prayer times with automatic geolocation and countdown</p>
        </div>

        <div className="mx-auto max-w-lg rounded-2xl border border-blue-500/10 bg-blue-500/5 p-4">
          <CountryCitySelector
            country={selectedCountry}
            city={selectedCity}
            onCountryChange={setSelectedCountry}
            onCityChange={setSelectedCity}
            onSearch={loadByCity}
            loading={loading}
          />

          <div className="mt-2 flex gap-2">
            <button
              onClick={() => loadByCity(selectedCountry, selectedCity)}
              disabled={loading || !selectedCountry.trim() || !selectedCity.trim()}
              className="flex-1 rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-[#050a14] hover:bg-blue-400 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Get Times"}
            </button>
            <button
              onClick={locateMe}
              className="rounded-lg border border-blue-500/20 px-3 py-2 text-sm text-blue-300 hover:bg-blue-500/10"
            >
              📍 Locate
            </button>
          </div>

          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

          {timings && (
            <div className="mt-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs text-blue-300/50">{date}</span>
                <span className="text-xs text-blue-300/50">{timezone}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PRAYER_LIST.map((prayer) => {
                  const active = nextPrayer === prayer;
                  return (
                    <div
                      key={prayer}
                      className={`rounded-xl border p-3 text-center ${
                        active ? "border-blue-500/40 bg-blue-500/15 shadow-lg shadow-blue-500/10" : "border-blue-500/10 bg-blue-500/5"
                      }`}
                    >
                      <p className="text-xs text-blue-300/60 mb-1">{prayer.toUpperCase()}</p>
                      <p className={`text-lg font-bold ${active ? "text-blue-100" : "text-blue-200/70"}`}>{timings[prayer]}</p>
                      {active && (
                        <p className="mt-1 text-[11px] text-blue-300">In {countdown}</p>
                      )}
                    </div>
                  );
                })}
              </div>
              {nextPrayer && (
                <div className="mt-3 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-center">
                  <p className="text-xs text-blue-300/60">
                    Next prayer: <span className="font-semibold text-blue-200">{nextPrayer}</span> — in{" "}
                    <span className="font-bold text-blue-100">{countdown}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {coords && (
          <div className="mx-auto max-w-lg mt-6">
            <QiblaCompass lat={coords.lat} lng={coords.lng} />
          </div>
        )}
      </main>
    </div>
  );
}
