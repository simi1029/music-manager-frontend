/**
 * Album Transformation Layer
 * Centralizes business logic for transforming Prisma album data into domain objects
 * with calculated ratings and derived properties.
 */

import { computeAlbumRating } from '@/lib/rating'
import { extractTracks } from '@/lib/utils'

/**
 * Track data structure expected from Prisma queries
 */
export interface PrismaTrackWithRatings {
  id: string
  number: number
  title: string
  durationSec: number | null
  durationMs?: number | null
  ratings?: { score: number }[]
}

/**
 * Album modifiers for rating calculation
 */
export interface AlbumModifiers {
  cover?: number
  production?: number
  mix?: number
}

/**
 * Album data structure from Prisma with nested releases
 */
export interface PrismaAlbumWithReleases {
  id: string
  title: string
  year: number | null
  primaryType: string
  coverValue: number | null
  productionValue: number | null
  mixValue: number | null
  artists: {
    artist: {
      id: string
      name: string
    }
  }[]
  releases: {
    tracks: PrismaTrackWithRatings[]
  }[]
  covers?: { url: string }[]
}

/**
 * Transformed album with calculated rating
 */
export interface AlbumWithRating {
  id: string
  title: string
  year: number | null
  primaryType: string
  coverValue: number | null
  productionValue: number | null
  mixValue: number | null
  tracks: PrismaTrackWithRatings[]
  hasRatings: boolean
  rating: {
    rankValue: number | null
    rankLabel: string
    finalAlbumRating: number
  }
  coverUrl: string | null
}

/**
 * Check if an album has any track ratings
 */
export function hasAlbumRatings(tracks: PrismaTrackWithRatings[]): boolean {
  return tracks.some(t => t.ratings && t.ratings.length > 0)
}

/**
 * Transform a Prisma album with releases into an album with calculated rating
 * Uses only the first release (assumes single release per album)
 */
export function transformAlbumWithRating(album: PrismaAlbumWithReleases): AlbumWithRating {
  // Get tracks from first release only (single release assumption)
  const rawTracks = album.releases[0]?.tracks ?? []
  
  // Normalize tracks to ensure ratings is always an array
  const tracks = rawTracks.map(t => ({
    ...t,
    ratings: t.ratings || []
  }))
  
  // Check if album has any ratings
  const hasRatings = hasAlbumRatings(tracks)
  
  // Calculate album rating (returns null values if no ratings)
  const rating = hasRatings 
    ? computeAlbumRating(
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
    : { rankValue: null, rankLabel: '—', finalAlbumRating: 0 }
  
  // Get cover URL if available
  const coverUrl = album.covers && album.covers.length > 0 ? album.covers[0].url : null
  
  return {
    id: album.id,
    title: album.title,
    year: album.year,
    primaryType: album.primaryType,
    coverValue: album.coverValue,
    productionValue: album.productionValue,
    mixValue: album.mixValue,
    tracks,
    hasRatings,
    rating,
    coverUrl
  }
}

/**
 * Transform album for the first release only (used in album detail page)
 * Returns tracks from first release and calculated rating
 */
export function transformAlbumFirstRelease(album: PrismaAlbumWithReleases) {
  // Get tracks from first release only
  const rawTracks = album.releases[0]?.tracks ?? []
  
  // Normalize tracks to ensure ratings is always an array
  const tracks = rawTracks.map(t => ({
    ...t,
    ratings: t.ratings || []
  }))
  
  // Check if album has any ratings
  const hasRatings = hasAlbumRatings(tracks)
  
  // Calculate album rating
  const rating = computeAlbumRating(
    tracks.map(t => ({
      durationSec: t.durationSec,
      ratings: t.ratings
    })),
    {
      cover: album.coverValue ?? undefined,
      production: album.productionValue ?? undefined,
      mix: album.mixValue ?? undefined
    }
  )
  
  return {
    album,
    tracks,
    hasRatings,
    rating
  }
}

/**
 * Lightweight transform for extracting tracks and checking ratings
 * Used when you just need to know if an album has ratings
 */
export function getAlbumTracksWithRatingCheck(album: { releases: { tracks: PrismaTrackWithRatings[] }[] }) {
  const tracks = album.releases.flatMap(r => r.tracks)
  const hasRatings = hasAlbumRatings(tracks)
  
  return { tracks, hasRatings }
}
