import { NextResponse } from 'next/server';
import { RECITERS } from '@/lib/quran-data';

export async function GET() {
  return NextResponse.json(RECITERS);
}
