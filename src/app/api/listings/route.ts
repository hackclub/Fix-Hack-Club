import { NextResponse } from 'next/server';
import { getListings } from '@/lib/listings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const listings = await getListings();
    return NextResponse.json({ listings });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load listings', message: (error as Error).message, listings: [] },
      { status: 500 },
    );
  }
}
