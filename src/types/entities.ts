/**
 * Base entity types - Single source of truth
 * These types represent core domain entities shared across the application.
 * All other type files (api.ts, components.ts) should extend these base types.
 */

export interface BaseAlbum {
  id: string
  title: string
  year: number | null
  primaryType: string
  artistCredit: string | null
  coverValue: number | null
  productionValue: number | null
  mixValue: number | null
}

export interface BaseArtist {
  id: string
  name: string
  musicbrainzId?: string | null
}

export interface BaseTrack {
  id: string
  number: number
  title: string
  durationSec: number | null
}

export interface BaseRating {
  id: string
  score: number
  trackId: string
  userId: string
}

export interface BaseRelease {
  id: string
  title: string
  barcode: string | null
}

// Extended base types with common combinations
export interface ArtistWithDetails extends BaseArtist {
  sortName: string | null
  country: string | null
  notes: string | null
}

export interface TrackWithDuration extends BaseTrack {
  durationMs: number | null
}

// Multi-artist support
export interface ArtistCredit {
  position: number
  joinPhrase: string | null
  artist: BaseArtist
}

export interface AlbumWithArtists extends BaseAlbum {
  artist: BaseArtist
  artists: ArtistCredit[]
}
