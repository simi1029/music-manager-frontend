import { prisma } from '@/lib/db'

// ─────────────────────────────────────────────────────────
// Reusable Include Objects (Single Source of Truth)
// ─────────────────────────────────────────────────────────

/**
 * Standard include for albums with all rating data
 * Used across list views and detail pages
 */
export const albumInclude = {
  artist: true,
  releases: { 
    include: { 
      tracks: { 
        include: { 
          ratings: true 
        } 
      } 
    } 
  },
  covers: true,
} as const

// ─────────────────────────────────────────────────────────
// Query Functions
// ─────────────────────────────────────────────────────────

/**
 * Fetch paginated list of albums with ratings
 * Ordered by most recently updated
 * 
 * @param options - Query options
 * @param options.limit - Maximum number of albums to return (default: 50)
 * @returns Array of albums with artist, releases, tracks, ratings, and covers
 */
export async function getAlbumsList(options?: { limit?: number }) {
  return prisma.releaseGroup.findMany({
    include: albumInclude,
    orderBy: { updatedAt: 'desc' },
    take: options?.limit ?? 50,
  })
}

/**
 * Fetch a single album by ID with all rating data
 * 
 * @param id - Album (ReleaseGroup) ID
 * @returns Album with all includes, or null if not found
 */
export async function getAlbumWithRatings(id: string) {
  return prisma.releaseGroup.findUnique({
    where: { id },
    include: albumInclude,
  })
}

/**
 * Fetch albums by artist ID with ratings
 * Ordered by year descending (newest first)
 * 
 * @param artistId - Artist ID
 * @returns Array of albums by the artist
 */
export async function getAlbumsByArtist(artistId: string) {
  return prisma.releaseGroup.findMany({
    where: { artistId },
    include: albumInclude,
    orderBy: { year: 'desc' },
  })
}
