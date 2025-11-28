import { prisma } from '@/lib/db'

// ─────────────────────────────────────────────────────────
// Reusable Include Objects (Single Source of Truth)
// ─────────────────────────────────────────────────────────

/**
 * Include for artist detail pages with all album rating data
 * Fetches artist with all albums via junction table
 * Organized by primaryType for display sections
 */
export const artistDetailInclude = {
  releaseGroupArtists: {
    include: {
      releaseGroup: {
        include: {
          artists: {
            include: {
              artist: true
            },
            orderBy: { position: 'asc' as const }
          },
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
        }
      }
    },
    orderBy: { releaseGroup: { year: 'desc' as const } }
  }
} as const

/**
 * Include for artist list with nested album data for rating calculations
 * Includes all albums via junction table
 */
export const artistWithAlbumsInclude = {
  releaseGroupArtists: {
    include: {
      releaseGroup: {
        include: {
          releases: {
            include: {
              tracks: {
                include: {
                  ratings: true
                }
              }
            }
          }
        }
      }
    }
  }
} as const

// ─────────────────────────────────────────────────────────
// Query Functions
// ─────────────────────────────────────────────────────────

/**
 * Fetch a single artist by ID with all albums and rating data
 * Albums are ordered by year descending (newest first)
 * 
 * @param id - Artist ID
 * @returns Artist with all albums, releases, tracks, ratings, and covers, or null if not found
 */
export async function getArtistWithAlbums(id: string) {
  return prisma.artist.findUnique({
    where: { id },
    include: artistDetailInclude,
  })
}

/**
 * Fetch all artists with their albums and rating data
 * Used for artist list page with rating calculations
 * Ordered by name ascending (alphabetical)
 * 
 * @returns Array of all artists with nested album data
 */
export async function getArtistsList() {
  return prisma.artist.findMany({
    include: artistWithAlbumsInclude,
    orderBy: { name: 'asc' }
  })
}

/**
 * Fetch artists with basic info only (no albums)
 * Useful for dropdowns or lightweight lists
 * 
 * @returns Array of artists with basic fields
 */
export async function getArtistsBasic() {
  return prisma.artist.findMany({
    select: {
      id: true,
      name: true,
      sortName: true,
      country: true,
      imageUrl: true,
    },
    orderBy: { name: 'asc' }
  })
}
