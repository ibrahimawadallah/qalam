import { SURAH_DATA } from "./quran-data";
import type { Surah } from "./quran-types";

export function getSurahInfo(surahNumber: number): Surah | undefined {
  return SURAH_DATA.find((s) => s.number === surahNumber);
}

export function absAyah(surahNumber: number, numberInSurah: number): number {
  return (surahNumber - 1) * 1000 + numberInSurah;
}

export function getStartingAyahNumber(surahNumber: number): number {
  let total = 0;
  for (let i = 0; i < surahNumber - 1; i++) {
    total += SURAH_DATA[i].ayahCount;
  }
  return total + 1;
}