'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import Link from 'next/link';
import { Play, BookOpen, Search, Heart, Clock, ChevronRight, Shield } from 'lucide-react';
import DrawerNav from '@/components/drawer-nav';

const SITE_URL = 'https://quran.medtechai.net';

const ayahs = [
  {
    arabic: 'إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ',
    english: 'Indeed, this Quran guides to that which is most suitable.',
    surah: 'Al-Isra 17:9',
  },
  {
    arabic: 'وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِّلْمُؤْمِنِينَ',
    english: 'And We send down of the Quran that which is a healing and a mercy for those who believe.',
    surah: 'Al-Isra 17:82',
  },
  {
    arabic: 'اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ',
    english: 'Allah is the light of the heavens and the earth.',
    surah: 'An-Nur 24:35',
  },
  {
    arabic: 'رَبَّنَا تَقَبَّلْ مِنَّا ۖ إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ',
    english: 'Our Lord, accept from us. Indeed, You are the Hearing, the Knowing.',
    surah: 'Al-Baqarah 2:127',
  },
  {
    arabic: 'فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ',
    english: 'So which of the favors of your Lord would you deny?',
    surah: 'Ar-Rahman 55:13',
  },
  {
    arabic: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    english: 'Indeed, with hardship comes ease.',
    surah: 'Ash-Sharh 94:6',
  },
];

const QUICK_LINKS = [
  { href: '/quran', label: 'Listen to Quran', icon: Play, color: 'bg-primary' },
  { href: '/search', label: 'Search Surahs', icon: Search, color: 'bg-secondary' },
  { href: '/azkar', label: 'Daily Azkar', icon: Heart, color: 'bg-terracotta' },
  { href: '/hisn-muslim', label: 'Hisn Muslim', icon: Shield, color: 'bg-primary' },
  { href: '/prayer-times', label: 'Prayer Times', icon: Clock, color: 'bg-secondary' },
];

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeAyah, setActiveAyah] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    QRCode.toCanvas(canvas, SITE_URL, {
      width: 100,
      margin: 1,
      color: {
        dark: '#1B4332',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveAyah(prev => (prev + 1) % ayahs.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <DrawerNav />

      {/* Spacer for hamburger */}
      <div className="h-16" />

      <div className="px-4 py-6 max-w-lg mx-auto">
        {/* Logo + Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <img
            src="/logo.jpg"
            alt="Quran Kareem"
            className="w-16 h-16 rounded-3xl shadow-warm-lg ring-2 ring-primary/15 mx-auto mb-3"
          />
          <h1
            className="text-3xl font-bold text-primary mb-0.5"
            style={{ fontFamily: 'var(--font-arabic), "Scheherazade New", serif' }}
          >
            القرآن الكريم
          </h1>
          <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">The Holy Quran</p>
        </motion.div>

        {/* Bismillah + Ayah card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="warm-card islamic-corner rounded-2xl p-4 mb-6"
        >
          <p
            className="text-sm text-primary/60 text-center mb-3"
            style={{ fontFamily: 'var(--font-arabic), serif' }}
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <div className="divider-ornate w-20 mx-auto mb-3" />
          <motion.p
            key={activeAyah}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-base text-primary text-center mb-1.5"
            style={{ fontFamily: 'var(--font-arabic), "Scheherazade New", serif', direction: 'rtl' }}
          >
            {ayahs[activeAyah].arabic}
          </motion.p>
          <motion.p
            key={`en-${activeAyah}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[11px] text-muted-foreground text-center italic"
          >
            {ayahs[activeAyah].english}
          </motion.p>
          <motion.p
            key={`ref-${activeAyah}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-secondary text-[9px] text-center mt-1 font-medium"
          >
            — {ayahs[activeAyah].surah}
          </motion.p>
        </motion.div>

        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-6"
        >
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Quick Access
          </h2>
          <div className="space-y-2">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="warm-card-hover rounded-2xl p-3.5 flex items-center gap-3 group"
              >
                <div className={`${link.color} w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-warm-sm`}>
                  <link.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{link.label}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </motion.div>

        {/* QR Code */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col items-center"
        >
          <p className="text-muted-foreground text-[9px] uppercase tracking-[0.2em] mb-2 font-medium">
            Scan to Open
          </p>
          <div className="bg-white p-2 rounded-xl shadow-warm ring-1 ring-border">
            <canvas ref={canvasRef} className="block" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
