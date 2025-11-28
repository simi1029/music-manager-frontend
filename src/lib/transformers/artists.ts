/**
 * Artist Transformation Layer
 * Centralizes business logic for transforming Prisma artist data into domain objects
 * with calculated ratings and statistics.
 */

import { computeAlbumRating, computeArtistRating, quantizeRank, LABEL } from '@/lib/rating'

/**
 * Track data structure for rating calculations
 */
export interface ArtistAlbumTrack {
  id: string
  number: number
  title: string
  durationSec: number | null
  durationMs?: number | null
  ratings?: { score: number }[]
}

/**
 * Album/ReleaseGroup structure within artist data
 */
export interface ArtistAlbum {
  id: string
  title: string
  year: number | null
  primaryType: string
  coverValue: number | null
  productionValue: number | null
  mixValue: number | null
  releases: {
    tracks: ArtistAlbumTrack[]
  }[]
  covers?: { url: string }[]
}

/**
 * Prisma artist data structure
 */
export interface PrismaArtistWithAlbums {
  id: string
  name: string
  country: string | null
  imageUrl?: string | null
  releaseGroupArtists: Array<{
    releaseGroup: ArtistAlbum
  }>
}

/**
 * Transformed artist with calculated ratings and statistics
 */
export interface ArtistWithRatings {
  id: string
  name: string
  country: string | null
  albumCount: number
  ratedAlbumCount: number
  avgRating: number
  rankValue: number
  rankLabel: string
  imageUrl: string | null
}

/**
 * Calculate album rating for a single album within an artist
 * Handles the hasRatings check and returns proper structure with label
 */
export function calculateArtistAlbumRating(album: ArtistAlbum): {
  rankValue: number
  rankLabel: string
  finalAlbumRating: number
} {
  const tracks = album.releases.flatMap(r => r.tracks)
  const hasRatings = tracks.some(t => t.ratings && t.ratings.length > 0)
  
  if (!hasRatings) {
    return { rankValue: 0, rankLabel: '—', finalAlbumRating: 0 }
  }
  
  const rating = computeAlbumRating(
    tracks.map(t => ({
      durationSec: t.durationSec,
      ratings: t.ratings || []
    })),
    {
      cover: album.coverValue ?? undefined,
      production: album.productionValue ?? undefined,
      mix: album.mixValue ?? undefined
    }
  )
  
  // Add the label based on quantized rank value
  const quantized = quantizeRank(rating.rankValue)
  const rankLabel = LABEL[quantized]
  
  return {
    rankValue: rating.rankValue,
    rankLabel,
    finalAlbumRating: rating.finalAlbumRating
  }
}

/**
 * Transform a Prisma artist with albums into an artist with calculated ratings
 * Centralizes the rating calculation logic for all albums
 */
export function transformArtistWithRatings(artist: PrismaArtistWithAlbums): ArtistWithRatings {
  const albums = artist.releaseGroupArtists.map(rga => rga.releaseGroup)
  const albumCount = albums.length
  
  // Calculate rating for each album
  const albumRatings = albums.map(calculateArtistAlbumRating)
  
  // Compute artist rating (filters out unrated albums automatically)
  const artistRating = computeArtistRating(albumRatings)
  const ratedAlbumCount = albumRatings.filter(a => a.rankValue > 0).length
  
  return {
    id: artist.id,
    name: artist.name,
    country: artist.country,
    albumCount,
    ratedAlbumCount,
    avgRating: artistRating.avgFinalRating,
    rankValue: artistRating.rankValue,
    rankLabel: artistRating.rankLabel,
    imageUrl: artist.imageUrl ?? null
  }
}

/**
 * Batch transform multiple artists with ratings
 * Useful for artist list endpoints
 */
export function transformArtistsWithRatings(artists: PrismaArtistWithAlbums[]): ArtistWithRatings[] {
  return artists.map(transformArtistWithRatings)
}
