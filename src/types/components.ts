import { Rating } from './domain'

// TrackList component
export interface TrackWithRatings {
  id: string
  number: number
  title: string
  durationSec: number | null
  ratings: { score: number }[]
}

// Album detail page - nested Prisma result
export interface AlbumDetailTrack {
  id: string
  number: number
  title: string
  durationSec: number | null
  durationMs: number | null
  ratings: Rating[]
}

export interface AlbumDetailRelease {
  id: string
  tracks: AlbumDetailTrack[]
}

export interface AlbumDetail {
  id: string
  title: string
  year: number | null
  primaryType: string
  coverValue: number | null
  productionValue: number | null
  mixValue: number | null
  artist: {
    id: string
    name: string
  } | null
  releases: AlbumDetailRelease[]
}

// Artist detail page - nested Prisma result
export interface ArtistDetailAlbumTrack {
  id: string
  durationSec: number | null
  ratings: Rating[]
}

export interface ArtistDetailAlbumRelease {
  tracks: ArtistDetailAlbumTrack[]
}

export interface ArtistDetailAlbum {
  id: string
  title: string
  year: number | null
  primaryType: string
  coverValue: number | null
  productionValue: number | null
  mixValue: number | null
  releases: ArtistDetailAlbumRelease[]
}

export interface ArtistDetail {
  id: string
  name: string
  sortName: string | null
  country: string | null
  notes: string | null
  groups: ArtistDetailAlbum[]
}
