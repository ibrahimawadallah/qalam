"use client";

import { useTranslations } from 'next-intl';
import { useEffect, useState } from "react";
import PageHead from "@/components/page-head";
import Khatam from "@/components/khatam";
import DuaCard from "@/components/hisn-dua-card";
import { HisnAudioProvider } from "@/components/hisn-audio-context";
import type { Dua } from "@/lib/hisn-muslim-types";

export const dynamic = "force-dynamic";

export default function AzkarPage() {
  const t = useTranslations('azkar');
  const tCommon = useTranslations('common');
  const [chapters, setChapters] = useState<{ name: string; duas: Dua[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/azkar");
        if (!res.ok) throw new Error(t('loadingError'));
        const json = await res.json();
        if (cancelled) return;
        setChapters(json.chapters ?? []);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : tCommon('unknownError'));
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
    <div className="min-h-screen">
      <PageHead eyebrow={t('eyebrow')} title={t('title')}>
        {t('description')}
      </PageHead>

      <main className="mx-auto max-w-[820px] px-6 py-12 page-enter">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="audio-bar w-1 bg-gold/60 rounded-full" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}
        {error && <p className="text-center font-ui text-sm text-destructive">{error}</p>}

        {!loading && !error && (
          <HisnAudioProvider>
            <div className="space-y-10">
              {chapters.map((chapter) => (
                <section key={chapter.name}>
                  <h2 className="mb-5 flex items-center gap-3 text-2xl text-navy">
                    <Khatam className="h-[18px] w-[18px] shrink-0 text-crimson" />
                    {chapter.name}
                  </h2>
                  <div className="space-y-4">
                    {chapter.duas.map((dua: Dua) => (
                      <DuaCard key={dua.id} dua={dua} />
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
