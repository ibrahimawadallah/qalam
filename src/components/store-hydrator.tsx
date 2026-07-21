'use client';

import { useEffect } from 'react';
import { hydrateStore } from '@/lib/audio-store';

export default function StoreHydrator() {
  useEffect(() => {
    hydrateStore();
  }, []);
  return null;
}
