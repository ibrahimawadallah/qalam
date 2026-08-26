'use client';

import { Suspense } from "react";
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import QuranSearchClient from "./client";

export const dynamic = "force-dynamic";

export default function SearchPage() {
  const t = useTranslations('search');
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">{t('loadingSearch')}</div>}>
      <QuranSearchClient />
    </Suspense>
  );
}
