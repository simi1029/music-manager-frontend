// Utility function types

// For computeAlbumRating function
export interface TrackForRating {
  durationSec: number | null
  ratings: { score: number }[]
}

export interface AlbumModifiers {
  cover?: number
  production?: number
  mix?: number
}

export interface AlbumRating {
  rankValue: number
  rankLabel: string
  finalAlbumRating: number
}
