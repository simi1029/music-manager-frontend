import { BaseAlbum, BaseArtist } from './entities'

/**
 * API request and response types
 * These types extend base entities with API-specific fields
 */

// GET /api/albums response
export interface AlbumListItem extends Pick<BaseAlbum, 'id' | 'title'> {
  artists: BaseArtist[] // Array of all contributing artists
  year: number | null
  primaryType: string
  tracksCount: number
  albumRankValue: number | null
  albumRankLabel: string
  coverUrl: string | null
}

// GET /api/artists response
export interface ArtistListItem extends BaseArtist {
  country: string | null
  albumCount: number
  ratedAlbumCount: number
  avgRating: number
  rankValue: number
  rankLabel: string
  imageUrl: string | null
}

// POST /api/ratings request
export interface CreateRatingRequest {
  trackId: string
  score: number
}

// DELETE /api/ratings request
export interface DeleteRatingRequest {
  trackId: string
}

// POST /api/album-modifiers request
export interface UpdateAlbumModifiersRequest {
  albumId: string
  coverValue: number
  productionValue: number
  mixValue: number
}
