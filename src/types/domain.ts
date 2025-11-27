import { BaseAlbum, BaseArtist, BaseTrack, BaseRating, ArtistWithDetails, TrackWithDuration } from './entities'

/**
 * Domain-specific types for business logic
 * Most basic types moved to entities.ts
 * These types are used for domain logic and calculations
 */

// Re-export base types for backward compatibility
export type Artist = ArtistWithDetails
export type Album = BaseAlbum & { artistId: string }
export type Track = TrackWithDuration & { releaseId: string }
export type Rating = BaseRating
