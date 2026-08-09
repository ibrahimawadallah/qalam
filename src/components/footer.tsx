'use client';

import Image from 'next/image';
import { Heart, BookOpen, Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Top section */}
        <div className="flex flex-col items-center text-center mb-6">
          {/* Brand with mushaf logo */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg overflow-hidden ring-1 ring-primary/20">
              <Image
                src="/logo.jpg"
                alt="Quran Kareem"
                width={28}
                height={28}
                className="w-full h-full object-cover"
              />
            </div>
            <span
              className="text-base font-bold text-primary"
              style={{ fontFamily: 'var(--font-arabic), "Scheherazade New", serif' }}
            >
              Quran Kareem
            </span>
          </div>

          {/* Quranic verse */}
          <div className="divider-ornate w-24 mx-auto mb-3" />
          <p className="arabic-name text-lg text-primary basmala-glow mb-1" style={{ direction: 'rtl' }}>
            إِنَّا نَحْنُ نَزَّلْنَا ٱلذِّكْرَ وَإِنَّا لَهُۥ لَحَـٰفِظُونَ
          </p>
          <p className="text-xs text-muted-foreground italic max-w-md mb-3">
            &ldquo;Indeed, it is We who sent down the Quran and indeed, We will be its guardian.&rdquo; — Surah Al-Hijr 15:9
          </p>
          <div className="divider-ornate w-24 mx-auto" />
        </div>

        {/* MedTechAI Authority */}
        <div className="flex items-center justify-center gap-2 mb-6 px-4 py-3 rounded-xl warm-card max-w-lg mx-auto">
          <Shield className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            Under the Authority of <span className="font-semibold text-primary">MedTechAI Arab Organization</span> — A registered organization dedicated to leveraging technology for the service of Islam and the Muslim Ummah.
          </p>
        </div>

        {/* Links row */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <a
            href="#"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Quran
          </a>
          <a
            href="#"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Heart className="w-4 h-4" />
            About
          </a>
        </div>

        {/* Divider */}
        <div className="divider-line mb-4" />
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Quran Kareem — Full Surah Audio & Translations App. Under the authority of MedTechAI Arab Organization.
        </p>
      </div>
    </footer>
  );
}
