"use client";

import { useEffect, useState } from "react";
import SiteNav from "@/components/site-nav";
import DuaCard from "@/components/hisn-dua-card";
import { HisnAudioProvider } from "@/components/hisn-audio-context";
import type { Dua } from "@/lib/hisn-muslim-types";

export const dynamic = "force-dynamic";

export default function AzkarPage() {
  const [chapters, setChapters] = useState<{ name: string; duas: Dua[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/azkar");
        if (!res.ok) throw new Error("Failed to load azkar");
        const json = await res.json();
        if (cancelled) return;
        setChapters(json.chapters ?? []);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a0518" }}>
      <SiteNav />
      <main className="mx-auto max-w-screen-xl px-3 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-amber-200 mb-2">أذكار الصباح والمساء</h1>
          <p className="text-amber-300/60 text-sm">Morning and Evening Supplications — authentic azkar with audio</p>
        </div>

        {loading && <p className="text-center text-amber-300/60">Loading azkar...</p>}
        {error && <p className="text-center text-red-400">{error}</p>}

        {!loading && !error && (
          <HisnAudioProvider>
            <div className="space-y-6">
              {chapters.map((chapter) => (
                <section key={chapter.name} className="rounded-2xl border border-amber-500/10 bg-amber-500/5 p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-amber-100 mb-4">{chapter.name}</h2>
                  <div className="space-y-4">
                    {chapter.duas.map((dua: Dua) => (
                      <div key={dua.id}>
                        <DuaCard dua={dua} />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </HisnAudioProvider>
        )}
      </main>
    </div>
  );
}
