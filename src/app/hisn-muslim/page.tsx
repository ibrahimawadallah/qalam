"use client";

import SiteNav from "@/components/site-nav";
import DuaCard from "@/components/hisn-dua-card";
import { HisnAudioProvider } from "@/components/hisn-audio-context";
import hisnData from "@/lib/hisn-muslim-data.json";
import type { Dua } from "@/lib/hisn-muslim-types";

export const dynamic = "force-dynamic";

export default function HisnMuslimPage() {
  const totalDuas = hisnData.chapters.reduce((sum, ch) => sum + ch.duas.length, 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a0518" }}>
      <SiteNav />
      <main className="mx-auto max-w-screen-xl px-3 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-amber-200 mb-2">حصن المسلم</h1>
          <p className="text-amber-300/60 text-sm">Fortress of the Muslim — authentic duas and adhkar with individual audio recitation</p>
          <p className="text-amber-300/40 text-xs mt-1">{totalDuas} duas</p>
        </div>
        <HisnAudioProvider>
          <div className="space-y-6">
            {hisnData.chapters.map((chapter) => (
              <section key={chapter.name} className="rounded-2xl border border-amber-500/10 bg-amber-500/5 p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-amber-100 mb-4">{chapter.name}</h2>
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
