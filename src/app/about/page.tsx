'use client';

import Link from 'next/link';
import PageHead from '@/components/page-head';
import Khatam from '@/components/khatam';

const VALUES = [
  {
    title: 'Accuracy first',
    desc: 'Every text, translation, and tafsir source is attributed and checked against trusted scholarly editions.',
  },
  {
    title: 'Free access',
    desc: 'The Quran, its translations, and its supplications remain free to read and to listen to, always.',
  },
  {
    title: 'Built with care',
    desc: 'Typography, audio quality, and reading comfort are treated as acts of service, not afterthoughts.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <PageHead eyebrow="Our mission" title="About Quran Kareem">
        A premium Quran streaming application, built under the authority of MedTechAI Arab
        Organization.
      </PageHead>

      <main className="page-enter">
        <div className="mx-auto max-w-[760px] px-6 pb-8 pt-14">
          <p className="font-serif text-base leading-loose text-[#2C2418]">
            Quran Kareem exists to make the recitation, reading, and study of the Holy Quran
            available to anyone, anywhere, without friction — gapless audio from world-renowned
            Qaris, verse-by-verse translation in several languages, and classical tafsir
            alongside the text itself.
          </p>
          <p className="mt-5 font-serif text-base leading-loose text-[#2C2418]">
            The application is maintained by{' '}
            <strong className="text-emerald-deep">MedTechAI Arab Organization</strong>, a
            registered organization dedicated to leveraging technology for the service of Islam
            and the Muslim Ummah. Alongside the Quran, the organization maintains the Daily
            Azkar, Hisn al-Muslim, Prayer Times, Ruqyah, Hadiths, and Islamic Calendar tools
            found throughout this app.
          </p>
        </div>

        <div className="mx-auto grid max-w-[920px] grid-cols-1 gap-[18px] px-6 py-10 sm:grid-cols-3">
          {VALUES.map((value) => (
            <div key={value.title} className="tile-corners warm-card rounded-sm p-7">
              <Khatam className="mb-3.5 h-5 w-5 text-maroon" />
              <h4 className="mb-2 text-lg text-emerald-deep">{value.title}</h4>
              <p className="font-ui text-xs leading-relaxed text-muted-foreground">{value.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-emerald-deep px-6 py-16 text-center text-ivory">
          <Khatam className="mb-4 inline-block h-5 w-5 text-gold" />
          <h3 className="mb-2.5 text-[26px]">Questions or feedback?</h3>
          <p className="mb-6 font-ui text-[13px] text-ivory-dim">
            Reach the MedTechAI Arab Organization team any time.
          </p>
          <a
            href="mailto:contact@medtechai.net"
            className="font-ui inline-flex items-center gap-2.5 rounded-sm bg-gold px-[30px] py-3.5 text-[13px] font-semibold tracking-wide text-ink transition-all hover:-translate-y-0.5 hover:bg-gold-bright hover:shadow-[0_10px_30px_rgba(199,161,92,.35)]"
          >
            Contact the team
          </a>
        </div>
      </main>
    </div>
  );
}
