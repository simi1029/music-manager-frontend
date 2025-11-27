import { BaseAlbum, BaseArtist, BaseTrack, BaseRating, ArtistWithDetails } from './entities'

/**
 * Component prop types
 * These types extend base entities with UI-specific fields and nested structures
 */

// TrackList component
export interface TrackWithRatings extends BaseTrack {
  ratings: { score: number }[]
}

// Album detail page - nested Prisma result
export interface AlbumDetailTrack extends BaseTrack {
  durationMs: number | null
  ratings: BaseRating[]
}

export interface AlbumDetailRelease {
  id: string
  tracks: AlbumDetailTrack[]
}

export interface AlbumDetail extends BaseAlbum {
  artist: BaseArtist | null // Consistent with API types
  releases: AlbumDetailRelease[]
}

// Artist detail page - nested Prisma result
export interface ArtistDetailAlbumTrack extends Pick<BaseTrack, 'id' | 'durationSec'> {
  ratings: BaseRating[]
}

export interface ArtistDetailAlbumRelease {
  tracks: ArtistDetailAlbumTrack[]
}

export interface ArtistDetailAlbum extends BaseAlbum {
  releases: ArtistDetailAlbumRelease[]
  covers: { url: string }[]
}

export interface ArtistDetail extends ArtistWithDetails {
  imageUrl: string | null
  groups: ArtistDetailAlbum[]
}
