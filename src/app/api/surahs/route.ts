import { NextResponse } from 'next/server';
import { SURAH_DATA } from '@/lib/quran-data';

export async function GET() {
  return NextResponse.json(SURAH_DATA);
}
