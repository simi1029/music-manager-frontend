// Basic database entities

export interface Artist {
  id: string
  name: string
  sortName: string | null
  country: string | null
  notes: string | null
}

export interface Album {
  id: string
  title: string
  year: number | null
  primaryType: string
  coverValue: number | null
  productionValue: number | null
  mixValue: number | null
  artistId: string
}

export interface Track {
  id: string
  number: number
  title: string
  durationSec: number | null
  durationMs: number | null
  releaseId: string
}

export interface Rating {
  id: string
  score: number
  trackId: string
  userId: string
}
