'use client';

import SiteNav from "@/components/site-nav";
import SurahList from '@/components/surah-list';
import FilterBar from '@/components/filter-bar';
import HeroSection from '@/components/hero-section';

export default function QuranPage() {
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
      <div
        className="ambient-orb-slow w-[400px] h-[400px] bg-purple-600/15 bottom-20 left-1/4"
        style={{ animationDelay: '-12s' }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Hero Section with reciter/quality controls */}
        <HeroSection />

        {/* Filter Bar */}
        <FilterBar />

        {/* Surah List */}
        <main className="flex-1 w-full">
          <SurahList />
        </main>
      </div>
    </div>
  );
}
