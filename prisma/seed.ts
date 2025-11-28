// When running the seed with ts-node in ESM mode, `@prisma/client` may be
// published as CommonJS; import the default and extract the PrismaClient to
// avoid the "Named export not found" error.
import { PrismaClient } from '../src/generated/prisma/client'
const prisma = new PrismaClient()

async function main() {
  const artist1 = await prisma.artist.create({
    data: { name: 'Sample Artist 1', sortName: 'Artist 1, Sample', country: 'HU' },
  });
  const artist2 = await prisma.artist.create({
    data: { name: 'Sample Artist 2', sortName: 'Artist 2, Sample', country: 'GB' },
  });
  const rg1 = await prisma.releaseGroup.create({
    data: {
      title: 'Example Album 1',
      primaryType: 'ALBUM',
      year: 2018,
      artists: {
        create: {
          artistId: artist1.id,
          position: 0,
          joinPhrase: '',
        },
      },
    },
  });

  const rg2 = await prisma.releaseGroup.create({
    data: {
      title: 'Example Album 2',
      primaryType: 'ALBUM',
      year: 2025,
      artists: {
        create: {
          artistId: artist2.id,
          position: 0,
          joinPhrase: '',
        },
      },
    },
  });

  const rel = await prisma.release.create({
    data: {
      title: 'Example Album (CD)',
      releaseGroupId: rg1.id,
      date: new Date('2018-01-01'),
      label: 'Demo Label',
    },
  });

  await prisma.track.createMany({
    data: [
      { releaseId: rel.id, number: 1, title: 'Intro', durationSec: 92 },
      { releaseId: rel.id, number: 2, title: 'Main Theme', durationSec: 218 },
      { releaseId: rel.id, number: 3, title: 'Closing Theme', durationSec: 134 },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
