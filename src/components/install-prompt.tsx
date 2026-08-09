'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setIsVisible(false);
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-28 sm:bottom-24 left-3 right-3 sm:left-auto sm:right-4 sm:w-80 z-40 animate-slide-up">
      <div className="bg-card border border-border rounded-2xl shadow-2xl shadow-black/30 p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-warm flex-shrink-0">
            <svg className="w-5 h-5 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
          
          <div className="flex-1 min-w-0 pr-8">
            <h3 className="text-foreground font-semibold text-sm mb-1">Install Quran Kareem App</h3>
            
            {isIOS ? (
              <p className="text-muted-foreground text-xs leading-relaxed">
                Tap <span className="text-primary">Share</span> then <span className="text-primary">Add to Home Screen</span>
              </p>
            ) : (
              <p className="text-muted-foreground text-xs leading-relaxed">
                Install Quran Kareem for a better experience with quick access from your home screen
              </p>
            )}
            
            <div className="flex gap-2 mt-3">
              {!isIOS && (
                <button
                  onClick={handleInstall}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors active:scale-95 min-h-[44px] touch-manipulation"
                >
                  Install
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="flex-1 bg-muted hover:bg-muted/80 text-foreground text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors active:scale-95 min-h-[44px] touch-manipulation"
              >
                {isIOS ? 'Close' : 'Later'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
