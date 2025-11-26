// API request and response types

// GET /api/albums response
export interface AlbumListItem {
  id: string
  title: string
  artist: string
  artistId: string | null
  tracksCount: number
  albumRankValue: number
  albumRankLabel: string
  coverUrl: string | null
}

// GET /api/artists response
export interface ArtistListItem {
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
