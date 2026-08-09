"use client";

import { useEffect, useState } from "react";
import DrawerNav from "@/components/drawer-nav";
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
    <div className="min-h-screen bg-background pt-14">
      <main className="mx-auto max-w-screen-xl px-3 py-8">
        <div className="mb-8 text-center page-enter">
          <h1 className="text-3xl font-bold text-primary mb-2">أذكار الصباح والمساء</h1>
          <p className="text-muted-foreground text-sm">Morning and Evening Supplications — authentic azkar with audio</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="audio-bar w-1 bg-primary/40 rounded-full" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}
        {error && <p className="text-center text-destructive text-sm">{error}</p>}

        {!loading && !error && (
          <HisnAudioProvider>
            <div className="space-y-6">
              {chapters.map((chapter) => (
                <section key={chapter.name} className="rounded-2xl border border-border bg-card p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4">{chapter.name}</h2>
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
      <DrawerNav />
    </div>
  );
}
