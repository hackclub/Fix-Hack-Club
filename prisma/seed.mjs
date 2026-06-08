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

  const shopCount = await prisma.shopItem.count();
  if (shopCount === 0) {
    await prisma.shopItem.createMany({
      data: [
        { name: 'FixHC Sticker Pack', description: 'A set of vinyl FixHC stickers.', cost: 50, stock: null },
        { name: 'Hack Club T-Shirt', description: 'Classic Hack Club tee.', cost: 250, stock: 25 },
        { name: 'Custom Repo Shoutout', description: 'We feature your fix in the #pull-quests channel.', cost: 100, stock: null },
      ],
    });
    console.log('Seeded 3 shop item(s).');
  } else {
    console.log(`Shop already has ${shopCount} item(s); skipping shop seed.`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
