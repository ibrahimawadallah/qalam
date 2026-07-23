'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';

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

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeAyah, setActiveAyah] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    QRCode.toCanvas(canvas, SITE_URL, {
      width: 200,
      margin: 2,
      color: {
        dark: '#1a0a2e',
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
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#0a0518' }}>
      {/* Animated background orbs */}
      <div className="ambient-orb-slow w-[600px] h-[600px] bg-purple-600/15 -top-40 -left-40 absolute" />
      <div className="ambient-orb w-[500px] h-[500px] bg-amber-500/8 top-1/4 -right-32 absolute" style={{ animationDelay: '-5s' }} />
      <div className="ambient-orb-slow w-[400px] h-[400px] bg-emerald-500/10 bottom-0 left-1/3 absolute" style={{ animationDelay: '-10s' }} />

      {/* Islamic geometric pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L80 40L40 80L0 40z' fill='none' stroke='%23d4a843' stroke-width='0.5'/%3E%3Cpath d='M40 10L70 40L40 70L10 40z' fill='none' stroke='%23d4a843' stroke-width='0.3'/%3E%3C/svg%3E")`,
        backgroundSize: '80px 80px',
      }} />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Bismillah */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="text-center mb-6"
        >
          <p className="text-amber-400/80 text-lg sm:text-xl" style={{ fontFamily: 'var(--font-arabic), serif' }}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
        </motion.div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-4"
        >
          <img
            src="/logo.jpg"
            alt="المصحف المرتل"
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl shadow-lg shadow-amber-500/20"
          />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-3xl sm:text-5xl font-bold text-center mb-2"
          style={{
            fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif',
            background: 'linear-gradient(135deg, #f5d785 0%, #d4a843 50%, #b8922e 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          المصحف المرتل
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-purple-300/70 text-sm sm:text-base text-center mb-10 max-w-md"
        >
          The Recited Mushaf — Recitation &amp; Listening
        </motion.p>

        {/* Rotating Ayah */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="max-w-xl mx-auto text-center mb-10 px-4"
        >
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-purple-500/10 min-h-[160px] flex flex-col items-center justify-center">
            <motion.p
              key={activeAyah}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6 }}
              className="text-2xl sm:text-3xl leading-relaxed mb-4 text-amber-200"
              style={{ fontFamily: 'var(--font-arabic), "Scheherazade New", serif', direction: 'rtl' }}
            >
              {ayahs[activeAyah].arabic}
            </motion.p>
            <motion.p
              key={`en-${activeAyah}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-purple-200/70 text-sm sm:text-base italic"
            >
              {ayahs[activeAyah].english}
            </motion.p>
            <motion.p
              key={`ref-${activeAyah}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="text-amber-400/50 text-xs mt-2"
            >
              — {ayahs[activeAyah].surah}
            </motion.p>
          </div>
        </motion.div>

        {/* QR Code */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="flex flex-col items-center mb-10"
        >
          <p className="text-purple-300/60 text-xs uppercase tracking-widest mb-4">
            Scan to Open
          </p>
          <div className="bg-white p-4 rounded-2xl shadow-lg shadow-purple-500/10 border border-purple-500/10">
            <canvas ref={canvasRef} className="block" />
          </div>
          <a
            href={SITE_URL}
            className="mt-3 text-amber-400/70 text-xs hover:text-amber-300 transition-colors"
          >
            {SITE_URL}
          </a>
        </motion.div>

        {/* CTA Button */}
        <motion.a
          href="/quran"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm sm:text-base transition-all"
          style={{
            background: 'linear-gradient(135deg, #d4a843 0%, #b8922e 100%)',
            color: '#0a0518',
            boxShadow: '0 4px 24px rgba(212, 168, 67, 0.3)',
          }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
          </svg>
          Start Listening
        </motion.a>
      </div>
    </div>
  );
}
