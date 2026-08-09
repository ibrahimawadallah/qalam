'use client';

import { Heart, BookOpen, Award } from 'lucide-react';
import DrawerNav from "@/components/drawer-nav";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background pt-14">
      {/* Ambient orbs */}
      <div
        className="ambient-glow-slow w-[600px] h-[600px] bg-primary/5 -top-40 -left-40"
        style={{ animationDelay: '0s' }}
      />
      <div
        className="ambient-glow w-[500px] h-[500px] bg-accent/5 top-1/3 -right-32"
        style={{ animationDelay: '-5s' }}
      />

      <div className="relative z-10 flex-1 max-w-4xl mx-auto px-4 py-16 sm:py-24 w-full">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <img
            src="/logo.jpg"
            alt="المصحف المرتل"
            className="w-20 h-20 rounded-2xl shadow-lg shadow-warm mb-4"
          />
          <h1
            className="text-3xl sm:text-4xl font-bold text-center bg-gradient-to-r from-primary/80 via-primary to-primary/90 bg-clip-text text-transparent"
            style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
          >
            المصحف المرتل
          </h1>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            The Recited Mushaf — Recitation &amp; Listening
          </p>
        </div>

        {/* Mission / About card */}
        <div className="warm-card rounded-2xl p-6 sm:p-10 mb-6 border border-border">
          <div className="flex items-center gap-3 mb-5">
            <Heart className="w-5 h-5 text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Our Mission</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-4">
            المصحف المرتل is a dedicated Quran management and recitation application designed to bring the words of the Holy Quran closer to every believer.
            Built under the authority of <strong className="text-primary">MedTechAI Arab Organization</strong>,
            the platform offers a complete experience for reading, listening, and exploring each surah with world-renowned reciters — anywhere, anytime.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Whether you are seeking to deepen your spiritual connection through
            <em> تلاوة</em> (recitation) or simply wish to
            <em> استماع</em> (listen) to the beautiful tones of the Quran, المصحف المرتل makes it effortless.
          </p>
        </div>

        {/* Features */}
        <div className="warm-card rounded-2xl p-6 sm:p-10 mb-6 border border-border">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 text-center">What You Get</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: <BookOpen className="w-5 h-5 text-primary" />,
                title: '114 Surahs',
                desc: 'Complete Quran with full surah data, Arabic & English names.',
              },
              {
                icon: <Heart className="w-5 h-5 text-primary" />,
                title: 'World-Renowned Reciters',
                desc: 'Choose from a curated list of beloved Qaris around the world.',
              },
              {
                icon: <Award className="w-5 h-5 text-primary" />,
                title: 'Audio Quality Options',
                desc: 'Adjust streaming quality to suit your connection.',
              },
              {
                icon: <BookOpen className="w-5 h-5 text-primary" />,
                title: 'Full Reading Mode',
                desc: 'Open any surah in a dedicated reading modal.',
              },
            ].map((f, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-xl bg-card/50 border border-border"
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
        <div className="warm-card rounded-2xl p-6 sm:p-8 border border-border">
          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} المصحف المرتل — The Recited Mushaf: Recitation &amp; Listening.
            All rights reserved. &nbsp;|&nbsp; Under the authority of{' '}
            <strong className="text-primary">MedTechAI Arab Organization</strong>.
          </p>
        </div>
      </div>
      <DrawerNav />
    </div>
  );
}
