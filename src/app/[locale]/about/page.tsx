'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import PageHead from "@/components/page-head";
import Khatam from "@/components/khatam";

const VALUES_KEYS = [
  { titleKey: 'accuracyFirst', descKey: 'accuracyFirstDesc' },
  { titleKey: 'freeAccess', descKey: 'freeAccessDesc' },
  { titleKey: 'builtWithCare', descKey: 'builtWithCareDesc' },
];

export default function AboutPage() {
  const t = useTranslations('about');

  const values = useMemo(
    () => VALUES_KEYS.map(v => ({
      title: t(v.titleKey as any),
      desc: t(v.descKey as any),
    })),
    [t]
  );

  return (
    <div className="min-h-screen">
      <PageHead eyebrow={t('eyebrow')} title={t('title')}>
        {t('description')}
      </PageHead>

      <main className="page-enter">
        <div className="mx-auto max-w-[760px] px-6 pb-8 pt-14">
          <p className="font-serif text-base leading-loose text-[#2C2418]">
            {t('missionParagraph1')}
          </p>
          <p className="mt-5 font-serif text-base leading-loose text-[#2C2418]">
            {t.rich('missionParagraph2', {
              org: (chunks) => <strong className="text-navy">{chunks}</strong>,
            })}
          </p>
        </div>

        <div className="mx-auto grid max-w-[920px] grid-cols-1 gap-[18px] px-6 py-10 sm:grid-cols-3">
          {values.map((value) => (
            <div key={value.title} className="tile-corners warm-card rounded-sm p-7">
              <Khatam className="mb-3.5 h-5 w-5 text-crimson" />
              <h4 className="mb-2 text-lg text-navy">{value.title}</h4>
              <p className="font-ui text-xs leading-relaxed text-muted-foreground">{value.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-navy px-6 py-16 text-center text-cream">
          <Khatam className="mb-4 inline-block h-5 w-5 text-gold" />
          <h3 className="mb-2.5 text-[26px]">{t('questionsOrFeedback')}</h3>
          <p className="mb-6 font-ui text-[13px] text-cream/70">
            {t('reachOut')}
          </p>
          <a
            href="mailto:contact@medtechai.net"
            className="font-ui inline-flex items-center gap-2.5 rounded-sm bg-gold px-[30px] py-3.5 text-[13px] font-semibold tracking-wide text-ink transition-all hover:-translate-y-0.5 hover:bg-gold-bright hover:shadow-[0_10px_30px_rgba(199,161,92,.35)]"
          >
            {t('contactTeam')}
          </a>
        </div>
      </main>
    </div>
  );
}
