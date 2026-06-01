import { readFile } from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function toDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function main() {
  const raw = await readFile(new URL('../listings.json', import.meta.url), 'utf8');
  const { listings = [] } = JSON.parse(raw);

  for (const [index, listing] of listings.entries()) {
    const externalId = (listing.id || `LISTING-${index + 1}`).toString();

    const data = {
      title: listing.title || externalId,
      description: listing.description || '',
      requirements: Array.isArray(listing.requirements) ? listing.requirements : [],
      url: listing.url || '',
      githubUrl: listing.github_url || '',
      status: (listing.status || 'active').toString().toLowerCase(),
      priority: index,
      completedAt: toDate(listing.completed_at),
    };

    await prisma.listing.upsert({
      where: { externalId },
      update: data,
      create: { externalId, ...data },
    });
  }

  console.log(`Seeded ${listings.length} listing(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
