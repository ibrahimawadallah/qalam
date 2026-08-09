'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Home,
  BookOpen,
  Search,
  Heart,
  Clock,
  Shield,
  BookText,
  Calendar,
  Info,
  Headphones,
  Mic,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Home', labelAr: 'الرئيسية', icon: Home },
  { href: '/quran', label: 'Quran', labelAr: 'القرآن', icon: BookOpen },
  { href: '/search', label: 'Search', labelAr: 'بحث', icon: Search },
  { href: '/azkar', label: 'Azkar', labelAr: 'الأذكار', icon: Heart },
  { href: '/prayer-times', label: 'Prayer Times', labelAr: 'أوقات الصلاة', icon: Clock },
  { href: '/hisn-muslim', label: 'Hisn Muslim', labelAr: 'حصن المسلم', icon: Shield },
  { href: '/ruqyah', label: 'Ruqyah', labelAr: 'الرقية الشرعية', icon: Headphones },
  { href: '/hadiths', label: 'Hadiths', labelAr: 'الأحاديث', icon: BookText },
  { href: '/islamic-calendar', label: 'Calendar', labelAr: 'التقويم الهجري', icon: Calendar },
  { href: '/about', label: 'About', labelAr: 'عن الموقع', icon: Info },
];

export default function DrawerNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Hamburger Button - fixed top left */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 w-11 h-11 rounded-2xl bg-card border border-border shadow-warm flex items-center justify-center active:scale-95 touch-manipulation"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-primary" />
      </button>

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-card border-r border-border shadow-warm-lg overflow-y-auto safe-area-top"
          >
            {/* Drawer header */}
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <img
                    src="/logo.jpg"
                    alt="Quran Kareem"
                    className="w-12 h-12 rounded-2xl shadow-warm ring-1 ring-primary/15"
                  />
                  <div>
                    <h2
                      className="text-lg font-bold text-primary"
                      style={{ fontFamily: 'var(--font-arabic), "Scheherazade New", serif' }}
                    >
                      القرآن الكريم
                    </h2>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Quran Kareem</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Ornate divider */}
              <div className="divider-ornate w-full" />
            </div>

            {/* Nav items */}
            <nav className="px-3 pb-6">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition-all touch-manipulation ${
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      active ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'
                    }`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${active ? 'text-primary' : ''}`}>{item.label}</p>
                      <p className="text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--font-arabic), serif' }}>
                        {item.labelAr}
                      </p>
                    </div>
                    {active && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </Link>
                );
              })}
            </nav>

            {/* Drawer footer */}
            <div className="px-6 pb-6">
              <div className="divider-ornate w-full mb-4" />
              <div className="warm-card rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Mic className="w-3 h-3 text-primary" />
                  <p className="text-xs font-medium text-foreground">MedTechAI Arab Org</p>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Free & Open Source — No Ads
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
