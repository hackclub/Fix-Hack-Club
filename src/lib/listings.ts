import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Listing } from '@prisma/client';
import { prisma } from './db';
import type { ListingDTO } from './types';

function serialize(listing: Listing): ListingDTO {
  return {
    id: listing.externalId || listing.id,
    title: listing.title,
    description: listing.description || '',
    requirements: Array.isArray(listing.requirements) ? listing.requirements : [],
    url: listing.url || '',
    github_url: listing.githubUrl || '',
    status: (listing.status || 'active').toLowerCase(),
    completed_at: listing.completedAt ? listing.completedAt.toISOString() : null,
  };
}

async function fallbackListings(): Promise<ListingDTO[]> {
  try {
    const raw = await readFile(path.join(process.cwd(), 'listings.json'), 'utf8');
    const data = JSON.parse(raw) as { listings?: ListingDTO[] };
    return data.listings ?? [];
  } catch {
    return [];
  }
}

export async function getListings(): Promise<ListingDTO[]> {
  try {
    const listings = await prisma.listing.findMany({
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    });

    if (!listings.length) {
      return fallbackListings();
    }

    return listings.map(serialize);
  } catch {
    return fallbackListings();
  }
}
