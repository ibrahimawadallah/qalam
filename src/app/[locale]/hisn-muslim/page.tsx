"use client";

import { useTranslations } from 'next-intl';
import PageHead from "@/components/page-head";
import Khatam from "@/components/khatam";
import DuaCard from "@/components/hisn-dua-card";
import { HisnAudioProvider } from "@/components/hisn-audio-context";
import hisnData from "@/lib/hisn-muslim-data.json";
import type { Dua } from "@/lib/hisn-muslim-types";

export const dynamic = "force-dynamic";

export default function HisnMuslimPage() {
  const t = useTranslations('hisnMuslim');
  const totalDuas = hisnData.chapters.reduce((sum, ch) => sum + ch.duas.length, 0);

  return (
    <div className="min-h-screen">
      <PageHead eyebrow={t.rich('eyebrow', { total: totalDuas })} title={t('title')}>
        {t('description')}
      </PageHead>

      <main className="mx-auto max-w-[820px] px-6 py-12 page-enter">
        <HisnAudioProvider>
          <div className="space-y-10">
            {hisnData.chapters.map((chapter) => (
              <section key={chapter.name}>
                <h2 className="mb-5 flex items-center gap-3 text-2xl text-emerald-deep">
                  <Khatam className="h-[18px] w-[18px] shrink-0 text-maroon" />
                  {chapter.name}
                  <span className="font-ui text-xs font-normal tracking-wide text-muted-foreground">
                    {chapter.duas.length}
                  </span>
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
      </main>
    </div>
  );
}
