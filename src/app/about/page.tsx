'use client';

import { Heart, BookOpen, Award } from 'lucide-react';
import SiteNav from "@/components/site-nav";
import SurahReadingModal from '@/components/surah-reading-modal';
import ReciterPanel from '@/components/reciter-panel';
import { useAudioStore } from '@/lib/audio-store';
import { SURAH_DATA } from '@/lib/quran-data';

export default function AboutPage() {
  const { isPlayerVisible } = useAudioStore();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ backgroundColor: '#0a0518' }}>
      <SiteNav />
      {/* Ambient orbs */}
      <div
        className="ambient-orb-slow w-[600px] h-[600px] bg-purple-600/20 -top-40 -left-40"
        style={{ animationDelay: '0s' }}
      />
      <div
        className="ambient-orb w-[500px] h-[500px] bg-amber-500/10 top-1/3 -right-32"
        style={{ animationDelay: '-5s' }}
      />

      <div className="relative z-10 flex-1 max-w-4xl mx-auto px-4 py-16 sm:py-24 w-full">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <img
            src="/logo.jpg"
            alt="المصحف المرتل"
            className="w-20 h-20 rounded-2xl shadow-lg shadow-amber-500/20 mb-4"
          />
          <h1
            className="text-3xl sm:text-4xl font-bold text-center bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent"
            style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
          >
            المصحف المرتل
          </h1>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            The Recited Mushaf — Recitation &amp; Listening
          </p>
        </div>

        {/* Mission / About card */}
        <div className="glass-card rounded-2xl p-6 sm:p-10 mb-6 border border-purple-500/10">
          <div className="flex items-center gap-3 mb-5">
            <Heart className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Our Mission</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-4">
            المصحف المرتل is a dedicated Quran management and recitation application designed to bring the words of the Holy Quran closer to every believer.
            Built under the authority of <strong className="text-amber-400">MedTechAI Arab Organization</strong>,
            the platform offers a complete experience for reading, listening, and exploring each surah with world-renowned reciters — anywhere, anytime.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Whether you are seeking to deepen your spiritual connection through
            <em> تلاوة</em> (recitation) or simply wish to
            <em> استماع</em> (listen) to the beautiful tones of the Quran, المصحف المرتل makes it effortless.
          </p>
        </div>

        {/* Features */}
        <div className="glass-card rounded-2xl p-6 sm:p-10 mb-6 border border-purple-500/10">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 text-center">What You Get</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: <BookOpen className="w-5 h-5 text-amber-400" />,
                title: '114 Surahs',
                desc: 'Complete Quran with full surah data, Arabic & English names.',
              },
              {
                icon: <Heart className="w-5 h-5 text-amber-400" />,
                title: 'World-Renowned Reciters',
                desc: 'Choose from a curated list of beloved Qaris around the world.',
              },
              {
                icon: <Award className="w-5 h-5 text-amber-400" />,
                title: 'Audio Quality Options',
                desc: 'Adjust streaming quality to suit your connection.',
              },
              {
                icon: <BookOpen className="w-5 h-5 text-amber-400" />,
                title: 'Full Reading Mode',
                desc: 'Open any surah in a dedicated reading modal.',
              },
            ].map((f, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-xl bg-[rgba(20,10,40,0.5)] border border-purple-500/5"
              >
                <div className="mt-0.5 shrink-0">{f.icon}</div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{f.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MedTechAI credit */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-purple-500/10">
          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} المصحف المرتل — The Recited Mushaf: Recitation &amp; Listening.
            All rights reserved. &nbsp;|&nbsp; Under the authority of{' '}
            <strong className="text-amber-400">MedTechAI Arab Organization</strong>.
          </p>
        </div>
      </div>

      {/* Fixed components */}
      <SurahReadingModal />
      <ReciterPanel />
      {isPlayerVisible && <div className="h-20" />}
    </div>
  );
}
