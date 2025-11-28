import { PrismaClient } from '../src/generated/prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Clear existing data
  console.log('🧹 Clearing existing data...')
  await prisma.rating.deleteMany()
  await prisma.track.deleteMany()
  await prisma.release.deleteMany()
  await prisma.cover.deleteMany()
  await prisma.releaseGroupGenre.deleteMany()
  await prisma.releaseGroupArtist.deleteMany()
  await prisma.externalRef.deleteMany()
  await prisma.releaseGroup.deleteMany()
  await prisma.artist.deleteMany()
  await prisma.genre.deleteMany()
  await prisma.user.deleteMany()

  // Create test user
  console.log('👤 Creating user...')
  const user = await prisma.user.create({
    data: {
      email: 'admin@local',
      name: 'Admin',
      role: 'admin',
    },
  })

  // Create genres
  console.log('🎵 Creating genres...')
  const rock = await prisma.genre.create({ data: { name: 'Rock' } })
  const electronic = await prisma.genre.create({ data: { name: 'Electronic' } })
  const jazz = await prisma.genre.create({ data: { name: 'Jazz' } })
  const pop = await prisma.genre.create({ data: { name: 'Pop' } })

  // Create artists
  console.log('🎤 Creating artists...')
  const radiohead = await prisma.artist.create({
    data: {
      name: 'Radiohead',
      sortName: 'Radiohead',
      country: 'GB',
      musicbrainzId: 'a74b1b7f-71a5-4011-9441-d0b5e4122711',
    },
  })

  const davidBowie = await prisma.artist.create({
    data: {
      name: 'David Bowie',
      sortName: 'Bowie, David',
      country: 'GB',
      musicbrainzId: '5441c29d-3602-4898-b1a1-b77fa23b8e50',
    },
  })

  const queen = await prisma.artist.create({
    data: {
      name: 'Queen',
      sortName: 'Queen',
      country: 'GB',
      musicbrainzId: '0383dadf-2a4e-4d10-a46a-e9e041da8eb3',
    },
  })

  const daftPunk = await prisma.artist.create({
    data: {
      name: 'Daft Punk',
      sortName: 'Daft Punk',
      country: 'FR',
      musicbrainzId: '056e4f3e-d505-4dad-8ec1-d04f521cbb56',
    },
  })

  const milesDavis = await prisma.artist.create({
    data: {
      name: 'Miles Davis',
      sortName: 'Davis, Miles',
      country: 'US',
      musicbrainzId: '561d854a-6a28-4aa7-8c99-323e6ce46c2a',
    },
  })

  // Create albums with tracks
  console.log('💿 Creating albums...')

  // Radiohead - OK Computer
  const okComputer = await prisma.releaseGroup.create({
    data: {
      title: 'OK Computer',
      primaryType: 'ALBUM',
      year: 1997,
      musicbrainzId: 'ab581532-8f01-3326-bb10-7ce4b96ef618',
      coverValue: 9,
      productionValue: 10,
      mixValue: 9,
      artists: {
        create: { artistId: radiohead.id, position: 0, joinPhrase: '' },
      },
      genres: {
        create: { genreId: rock.id },
      },
    },
  })

  const okComputerRelease = await prisma.release.create({
    data: {
      title: 'OK Computer',
      releaseGroupId: okComputer.id,
      date: new Date('1997-05-21'),
      label: 'Parlophone',
      tracks: {
        create: [
          { number: 1, title: 'Airbag', durationSec: 284 },
          { number: 2, title: 'Paranoid Android', durationSec: 383 },
          { number: 3, title: 'Subterranean Homesick Alien', durationSec: 270 },
          { number: 4, title: 'Exit Music (For a Film)', durationSec: 265 },
          { number: 5, title: 'Let Down', durationSec: 299 },
          { number: 6, title: 'Karma Police', durationSec: 261 },
          { number: 7, title: 'Fitter Happier', durationSec: 117 },
          { number: 8, title: 'Electioneering', durationSec: 230 },
          { number: 9, title: 'Climbing Up the Walls', durationSec: 286 },
          { number: 10, title: 'No Surprises', durationSec: 229 },
          { number: 11, title: 'Lucky', durationSec: 259 },
          { number: 12, title: 'The Tourist', durationSec: 324 },
        ],
      },
    },
  })

  // Daft Punk - Random Access Memories
  const ram = await prisma.releaseGroup.create({
    data: {
      title: 'Random Access Memories',
      primaryType: 'ALBUM',
      year: 2013,
      musicbrainzId: '9208f61a-241a-3959-92b3-73db1f1b6066',
      coverValue: 8,
      productionValue: 10,
      mixValue: 10,
      artists: {
        create: { artistId: daftPunk.id, position: 0, joinPhrase: '' },
      },
      genres: {
        create: { genreId: electronic.id },
      },
    },
  })

  const ramRelease = await prisma.release.create({
    data: {
      title: 'Random Access Memories',
      releaseGroupId: ram.id,
      date: new Date('2013-05-17'),
      label: 'Columbia',
      tracks: {
        create: [
          { number: 1, title: 'Give Life Back to Music', durationSec: 274 },
          { number: 2, title: 'The Game of Love', durationSec: 321 },
          { number: 3, title: 'Giorgio by Moroder', durationSec: 544 },
          { number: 4, title: 'Within', durationSec: 228 },
          { number: 5, title: 'Instant Crush', durationSec: 337 },
          { number: 6, title: 'Lose Yourself to Dance', durationSec: 353 },
          { number: 7, title: 'Touch', durationSec: 498 },
          { number: 8, title: 'Get Lucky', durationSec: 368 },
          { number: 9, title: 'Beyond', durationSec: 290 },
          { number: 10, title: 'Motherboard', durationSec: 341 },
          { number: 11, title: 'Fragments of Time', durationSec: 279 },
          { number: 12, title: 'Doin\' It Right', durationSec: 251 },
          { number: 13, title: 'Contact', durationSec: 381 },
        ],
      },
    },
  })

  // Miles Davis - Kind of Blue
  const kindOfBlue = await prisma.releaseGroup.create({
    data: {
      title: 'Kind of Blue',
      primaryType: 'ALBUM',
      year: 1959,
      musicbrainzId: '7c0f4835-1448-3b96-ac3a-815a1f4bc37d',
      coverValue: 7,
      productionValue: 8,
      mixValue: 7,
      artists: {
        create: { artistId: milesDavis.id, position: 0, joinPhrase: '' },
      },
      genres: {
        create: { genreId: jazz.id },
      },
    },
  })

  const kindOfBlueRelease = await prisma.release.create({
    data: {
      title: 'Kind of Blue',
      releaseGroupId: kindOfBlue.id,
      date: new Date('1959-08-17'),
      label: 'Columbia',
      tracks: {
        create: [
          { number: 1, title: 'So What', durationSec: 562 },
          { number: 2, title: 'Freddie Freeloader', durationSec: 577 },
          { number: 3, title: 'Blue in Green', durationSec: 337 },
          { number: 4, title: 'All Blues', durationSec: 691 },
          { number: 5, title: 'Flamenco Sketches', durationSec: 562 },
        ],
      },
    },
  })

  // David Bowie & Queen - Under Pressure (Single)
  const underPressure = await prisma.releaseGroup.create({
    data: {
      title: 'Under Pressure',
      primaryType: 'SINGLE',
      year: 1981,
      musicbrainzId: 'b3e5e758-9f54-3964-a67b-2c71c8f55f4e',
      artists: {
        create: [
          { artistId: davidBowie.id, position: 0, joinPhrase: ' & ' },
          { artistId: queen.id, position: 1, joinPhrase: '' },
        ],
      },
      genres: {
        create: { genreId: rock.id },
      },
    },
  })

  const underPressureRelease = await prisma.release.create({
    data: {
      title: 'Under Pressure',
      releaseGroupId: underPressure.id,
      date: new Date('1981-10-26'),
      label: 'EMI',
      tracks: {
        create: [
          { number: 1, title: 'Under Pressure', durationSec: 248 },
          { number: 2, title: 'Soul Brother', durationSec: 221 },
        ],
      },
    },
  })

  // David Bowie - The Rise and Fall of Ziggy Stardust
  const ziggyStardust = await prisma.releaseGroup.create({
    data: {
      title: 'The Rise and Fall of Ziggy Stardust and the Spiders from Mars',
      primaryType: 'ALBUM',
      year: 1972,
      musicbrainzId: '934e7267-0dae-3e46-8847-93135d7e2b52',
      coverValue: 9,
      productionValue: 8,
      mixValue: 7,
      artists: {
        create: { artistId: davidBowie.id, position: 0, joinPhrase: '' },
      },
      genres: {
        create: { genreId: rock.id },
      },
    },
  })

  const ziggyStardustRelease = await prisma.release.create({
    data: {
      title: 'The Rise and Fall of Ziggy Stardust and the Spiders from Mars',
      releaseGroupId: ziggyStardust.id,
      date: new Date('1972-06-16'),
      label: 'RCA',
      tracks: {
        create: [
          { number: 1, title: 'Five Years', durationSec: 283 },
          { number: 2, title: 'Soul Love', durationSec: 211 },
          { number: 3, title: 'Moonage Daydream', durationSec: 281 },
          { number: 4, title: 'Starman', durationSec: 256 },
          { number: 5, title: 'It Ain\'t Easy', durationSec: 178 },
          { number: 6, title: 'Lady Stardust', durationSec: 197 },
          { number: 7, title: 'Star', durationSec: 167 },
          { number: 8, title: 'Hang On to Yourself', durationSec: 174 },
          { number: 9, title: 'Ziggy Stardust', durationSec: 193 },
          { number: 10, title: 'Suffragette City', durationSec: 211 },
          { number: 11, title: 'Rock \'n\' Roll Suicide', durationSec: 178 },
        ],
      },
    },
  })

  // Add some sample ratings
  console.log('⭐ Creating sample ratings...')
  const okComputerTracks = await prisma.track.findMany({
    where: { releaseId: okComputerRelease.id },
  })

  await prisma.rating.createMany({
    data: [
      { userId: user.id, targetTrackId: okComputerTracks[1].id, score: 10 }, // Paranoid Android
      { userId: user.id, targetTrackId: okComputerTracks[5].id, score: 10 }, // Karma Police
      { userId: user.id, targetTrackId: okComputerTracks[9].id, score: 7 }, // No Surprises
      { userId: user.id, targetTrackId: okComputerTracks[10].id, score: 7 }, // Lucky
    ],
  })

  const ramTracks = await prisma.track.findMany({
    where: { releaseId: ramRelease.id },
  })

  await prisma.rating.createMany({
    data: [
      { userId: user.id, targetTrackId: ramTracks[7].id, score: 10 }, // Get Lucky
      { userId: user.id, targetTrackId: ramTracks[5].id, score: 7 }, // Lose Yourself to Dance
      { userId: user.id, targetTrackId: ramTracks[4].id, score: 7 }, // Instant Crush
    ],
  })

  console.log('✅ Seed completed successfully!')
  console.log(`
  📊 Summary:
  - 1 user
  - 5 artists
  - 4 genres
  - 5 albums (4 albums, 1 single)
  - 5 releases
  - 44 tracks
  - 7 ratings
  `)
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
