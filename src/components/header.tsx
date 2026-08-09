import { BookOpen, Info, X, Menu } from 'lucide-react';
import { useAudioStore } from '@/lib/audio-store';
import { useState, useEffect, useRef } from 'react';

export default function Header() {
  const { toggleReciterPanel } = useAudioStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-40 warm-sticky">
         <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between">
           {/* Brand */}
           <div className="flex items-center gap-2.5 min-w-0">
             <img
               src="/logo.jpg"
               alt="Quran Kareem Logo"
               className="w-7 h-7 rounded-lg object-cover ring-1 ring-primary/20 flex-shrink-0"
               loading="eager"
             />
             <span
               className="text-sm sm:text-base font-bold text-primary truncate"
               style={{
                 fontFamily: 'var(--font-arabic), "Scheherazade New", serif',
               }}
             >
               Quran Kareem
             </span>
           </div>

           {/* Desktop nav */}
           <nav className="hidden sm:flex items-center gap-0.5">
             <button
               onClick={() =>
                 window.scrollTo({ top: 0, behavior: "smooth" })
               }
               className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-primary hover:bg-primary/8 transition-all whitespace-nowrap"
             >
               <BookOpen className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Quran</span>
             </button>
             <button
               onClick={() => setShowAbout(true)}
               className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-primary hover:bg-primary/8 transition-all whitespace-nowrap"
             >
               <Info className="w-4 h-4 flex-shrink-0" />
               <span className="hidden sm:inline">About</span>
             </button>
             <button
               onClick={toggleReciterPanel}
               className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-primary hover:bg-primary/8 transition-all whitespace-nowrap"
             >
               <svg
                 className="w-4 h-4 flex-shrink-0"
                 fill="currentColor"
                 viewBox="0 0 24 24"
               >
                 <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                 <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
               </svg>
               <span className="hidden sm:inline">Reciters</span>
             </button>
           </nav>

           {/* Mobile menu button */}
           <button
             onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
             className="sm:hidden p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted active:scale-95 touch-manipulation"
             aria-label="Toggle menu"
           >
             {mobileMenuOpen ? (
               <X className="w-5 h-5" />
             ) : (
               <Menu className="w-5 h-5" />
             )}
           </button>
         </div>

         {/* Mobile menu backdrop */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-30 bg-black/30 sm:hidden" onClick={() => setMobileMenuOpen(false)} />
          )}

          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div ref={menuRef} className="sm:hidden relative z-40 border-t border-border bg-background/98 backdrop-blur-2xl px-3 py-2 space-y-0.5 animate-in slide-in-from-top-2 duration-200">
             <button
               onClick={() => {
                 window.scrollTo({ top: 0, behavior: "smooth" });
                 setMobileMenuOpen(false);
               }}
               className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-primary hover:bg-primary/8 transition-all touch-manipulation min-h-[44px]"
             >
               <BookOpen className="w-4 h-4 flex-shrink-0" />
               <span className="truncate">Quran</span>
             </button>
             <button
               onClick={() => {
                 setShowAbout(true);
                 setMobileMenuOpen(false);
               }}
               className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-primary hover:bg-primary/8 transition-all touch-manipulation min-h-[44px]"
             >
               <Info className="w-4 h-4 flex-shrink-0" />
               <span className="truncate">About</span>
             </button>
             <button
               onClick={() => {
                 toggleReciterPanel();
                 setMobileMenuOpen(false);
               }}
               className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-primary hover:bg-primary/8 transition-all touch-manipulation min-h-[44px]"
             >
               <svg
                 className="w-4 h-4 flex-shrink-0"
                 fill="currentColor"
                 viewBox="0 0 24 24"
               >
                 <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                 <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
               </svg>
               <span className="truncate">Reciters</span>
             </button>
           </div>
         )}
        </header>
  );
}
