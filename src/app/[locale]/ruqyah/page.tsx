'use client';

import { useTranslations } from 'next-intl';
import PageHead from "@/components/page-head";
import ReciterCard from "@/components/ruqyah-card";
import { getStationsByCategory } from "@/lib/quran-data";

export const dynamic = "force-dynamic";

export default function RuqyahPage() {
  const t = useTranslations('ruqyah');
  const stations = getStationsByCategory("ruqyah");

  return (
    <div className="min-h-screen">
      <PageHead eyebrow={t('eyebrow')} title={t('title')}>
        {t('description')}
      </PageHead>
      <main className="mx-auto max-w-[1080px] px-6 py-12 page-enter">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stations.map((station) => (
            <ReciterCard key={station.id} station={station} />
          ))}
        </div>
      </main>
    </div>
  );
}
