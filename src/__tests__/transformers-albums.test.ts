import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  hasAlbumRatings,
  transformAlbumWithRating,
  transformAlbumFirstRelease,
  getAlbumTracksWithRatingCheck,
  type PrismaAlbumWithReleases
} from '../lib/transformers/albums'
import { computeAlbumRating } from '../lib/rating'

// Mock the rating module
vi.mock('../lib/rating', () => ({
  computeAlbumRating: vi.fn((tracks, modifiers) => {
    // Simple mock implementation for testing
    const hasRatings = tracks.some((t: any) => t.ratings && t.ratings.length > 0)
    if (!hasRatings) {
      return { rankValue: null, rankLabel: '—', finalAlbumRating: 0, baseRating: 0, qualityBoost: 1 }
    }
    return { rankValue: 7, rankLabel: 'Excellent', finalAlbumRating: 7.5, baseRating: 7.0, qualityBoost: 1.07 }
  })
}))

describe('hasAlbumRatings', () => {
  it('should return true when tracks have ratings', () => {
    const tracks = [
      { id: '1', number: 1, title: 'Track 1', durationSec: 180, ratings: [{ score: 8 }] }
    ]
    expect(hasAlbumRatings(tracks)).toBe(true)
  })

  it('should return false when no tracks have ratings', () => {
    const tracks = [
      { id: '1', number: 1, title: 'Track 1', durationSec: 180, ratings: [] }
    ]
    expect(hasAlbumRatings(tracks)).toBe(false)
  })

  it('should return false when tracks have undefined ratings', () => {
    const tracks = [
      { id: '1', number: 1, title: 'Track 1', durationSec: 180 }
    ]
    expect(hasAlbumRatings(tracks)).toBe(false)
  })

  it('should return true if at least one track has ratings', () => {
    const tracks = [
      { id: '1', number: 1, title: 'Track 1', durationSec: 180, ratings: [] },
      { id: '2', number: 2, title: 'Track 2', durationSec: 200, ratings: [{ score: 9 }] },
      { id: '3', number: 3, title: 'Track 3', durationSec: 150, ratings: [] }
    ]
    expect(hasAlbumRatings(tracks)).toBe(true)
  })

  it('should handle empty tracks array', () => {
    expect(hasAlbumRatings([])).toBe(false)
  })
})

describe('transformAlbumWithRating', () => {
  const baseAlbum: PrismaAlbumWithReleases = {
    id: 'album1',
    title: 'Test Album',
    year: 2023,
    primaryType: 'Album',
    coverValue: 8,
    productionValue: 9,
    mixValue: 7,
    artist: { id: 'artist1', name: 'Test Artist' },
    releases: [
      {
        tracks: [
          { id: 't1', number: 1, title: 'Track 1', durationSec: 180, ratings: [{ score: 8 }] },
          { id: 't2', number: 2, title: 'Track 2', durationSec: 200, ratings: [{ score: 9 }] }
        ]
      }
    ],
    covers: [{ url: 'https://example.com/cover.jpg' }]
  }

  it('should transform album with ratings', () => {
    const result = transformAlbumWithRating(baseAlbum)

    expect(result.id).toBe('album1')
    expect(result.title).toBe('Test Album')
    expect(result.year).toBe(2023)
    expect(result.tracks).toHaveLength(2)
    expect(result.hasRatings).toBe(true)
    expect(result.rating.rankValue).toBe(7)
    expect(result.rating.rankLabel).toBe('Excellent')
    expect(result.coverUrl).toBe('https://example.com/cover.jpg')
  })

  it('should handle album without ratings', () => {
    const unratedAlbum: PrismaAlbumWithReleases = {
      ...baseAlbum,
      releases: [
        {
          tracks: [
            { id: 't1', number: 1, title: 'Track 1', durationSec: 180, ratings: [] }
          ]
        }
      ]
    }

    const result = transformAlbumWithRating(unratedAlbum)

    expect(result.hasRatings).toBe(false)
    expect(result.rating.rankValue).toBe(null)
    expect(result.rating.rankLabel).toBe('—')
    expect(result.rating.finalAlbumRating).toBe(0)
  })

  it('should handle album without cover', () => {
    const noCoverAlbum: PrismaAlbumWithReleases = {
      ...baseAlbum,
      covers: []
    }

    const result = transformAlbumWithRating(noCoverAlbum)

    expect(result.coverUrl).toBe(null)
  })

  it('should handle album with undefined covers', () => {
    const noCoverAlbum: PrismaAlbumWithReleases = {
      ...baseAlbum,
      covers: undefined
    }

    const result = transformAlbumWithRating(noCoverAlbum)

    expect(result.coverUrl).toBe(null)
  })

  it('should use tracks from first release only', () => {
    const multiReleaseAlbum: PrismaAlbumWithReleases = {
      ...baseAlbum,
      releases: [
        {
          tracks: [
            { id: 't1', number: 1, title: 'Track 1', durationSec: 180, ratings: [{ score: 8 }] },
            { id: 't2', number: 2, title: 'Track 2', durationSec: 200, ratings: [{ score: 9 }] }
          ]
        },
        {
          tracks: [
            { id: 't3', number: 1, title: 'Track 3', durationSec: 190, ratings: [{ score: 7 }] }
          ]
        }
      ]
    }

    const result = transformAlbumWithRating(multiReleaseAlbum)

    // Should only include tracks from first release
    expect(result.tracks).toHaveLength(2)
    expect(result.tracks[0].id).toBe('t1')
    expect(result.tracks[1].id).toBe('t2')
    // Should NOT include t3 from second release
    expect(result.tracks.find(t => t.id === 't3')).toBeUndefined()
  })

  it('should handle null modifier values', () => {
    const nullModifiersAlbum: PrismaAlbumWithReleases = {
      ...baseAlbum,
      coverValue: null,
      productionValue: null,
      mixValue: null
    }

    const result = transformAlbumWithRating(nullModifiersAlbum)

    expect(result.coverValue).toBe(null)
    expect(result.productionValue).toBe(null)
    expect(result.mixValue).toBe(null)
  })

  it('should extract first cover URL when multiple covers exist', () => {
    const multiCoverAlbum: PrismaAlbumWithReleases = {
      ...baseAlbum,
      covers: [
        { url: 'https://example.com/cover1.jpg' },
        { url: 'https://example.com/cover2.jpg' }
      ]
    }

    const result = transformAlbumWithRating(multiCoverAlbum)

    expect(result.coverUrl).toBe('https://example.com/cover1.jpg')
  })

  it('should handle album with no releases', () => {
    const noReleasesAlbum: PrismaAlbumWithReleases = {
      ...baseAlbum,
      releases: []
    }

    const result = transformAlbumWithRating(noReleasesAlbum)

    expect(result.tracks).toEqual([])
    expect(result.hasRatings).toBe(false)
    expect(result.rating.rankValue).toBe(null)
  })
})

describe('transformAlbumFirstRelease', () => {
  const baseAlbum: PrismaAlbumWithReleases = {
    id: 'album1',
    title: 'Test Album',
    year: 2023,
    primaryType: 'Album',
    coverValue: 8,
    productionValue: 9,
    mixValue: 7,
    artist: { id: 'artist1', name: 'Test Artist' },
    releases: [
      {
        tracks: [
          { id: 't1', number: 1, title: 'Track 1', durationSec: 180, ratings: [{ score: 8 }] },
          { id: 't2', number: 2, title: 'Track 2', durationSec: 200, ratings: [{ score: 9 }] }
        ]
      },
      {
        tracks: [
          { id: 't3', number: 1, title: 'Track 3', durationSec: 190, ratings: [{ score: 7 }] }
        ]
      }
    ],
    covers: [{ url: 'https://example.com/cover.jpg' }]
  }

  it('should use only first release tracks', () => {
    const result = transformAlbumFirstRelease(baseAlbum)

    expect(result.tracks).toHaveLength(2)
    expect(result.tracks[0].id).toBe('t1')
    expect(result.tracks[1].id).toBe('t2')
    expect(result.album).toBe(baseAlbum)
  })

  it('should normalize ratings to always be an array', () => {
    const albumWithUndefinedRatings: PrismaAlbumWithReleases = {
      ...baseAlbum,
      releases: [
        {
          tracks: [
            { id: 't1', number: 1, title: 'Track 1', durationSec: 180 } as any
          ]
        }
      ]
    }

    const result = transformAlbumFirstRelease(albumWithUndefinedRatings)

    expect(result.tracks[0].ratings).toEqual([])
  })

  it('should handle album with no releases', () => {
    const noReleasesAlbum: PrismaAlbumWithReleases = {
      ...baseAlbum,
      releases: []
    }

    const result = transformAlbumFirstRelease(noReleasesAlbum)

    expect(result.tracks).toEqual([])
    expect(result.hasRatings).toBe(false)
  })

  it('should calculate hasRatings correctly', () => {
    const result = transformAlbumFirstRelease(baseAlbum)

    expect(result.hasRatings).toBe(true)
  })

  it('should calculate rating using computeAlbumRating', () => {
    const result = transformAlbumFirstRelease(baseAlbum)

    expect(result.rating).toBeDefined()
    expect(result.rating.rankValue).toBe(7)
    expect(result.rating.rankLabel).toBe('Excellent')
    expect(result.rating.finalAlbumRating).toBe(7.5)
  })

  it('should preserve empty ratings arrays', () => {
    const emptyRatingsAlbum: PrismaAlbumWithReleases = {
      ...baseAlbum,
      releases: [
        {
          tracks: [
            { id: 't1', number: 1, title: 'Track 1', durationSec: 180, ratings: [] }
          ]
        }
      ]
    }

    const result = transformAlbumFirstRelease(emptyRatingsAlbum)

    expect(result.tracks[0].ratings).toEqual([])
  })
})

describe('getAlbumTracksWithRatingCheck', () => {
  it('should extract tracks and check for ratings', () => {
    const album = {
      releases: [
        {
          tracks: [
            { id: 't1', number: 1, title: 'Track 1', durationSec: 180, ratings: [{ score: 8 }] }
          ]
        }
      ]
    }

    const result = getAlbumTracksWithRatingCheck(album)

    expect(result.tracks).toHaveLength(1)
    expect(result.hasRatings).toBe(true)
  })

  it('should flatten tracks from multiple releases', () => {
    const album = {
      releases: [
        {
          tracks: [
            { id: 't1', number: 1, title: 'Track 1', durationSec: 180, ratings: [] }
          ]
        },
        {
          tracks: [
            { id: 't2', number: 2, title: 'Track 2', durationSec: 200, ratings: [] }
          ]
        }
      ]
    }

    const result = getAlbumTracksWithRatingCheck(album)

    expect(result.tracks).toHaveLength(2)
    expect(result.hasRatings).toBe(false)
  })

  it('should handle empty releases', () => {
    const album = {
      releases: []
    }

    const result = getAlbumTracksWithRatingCheck(album)

    expect(result.tracks).toEqual([])
    expect(result.hasRatings).toBe(false)
  })
})

describe('transformAlbumFirstRelease - modifier values', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle album with null modifier values', () => {
    const album = {
      id: 'album1',
      title: 'No Modifiers Album',
      year: 2023,
      primaryType: 'Album',
      coverValue: null,
      productionValue: null,
      mixValue: null,
      artist: {
        id: 'artist1',
        name: 'Test Artist'
      },
      releases: [
        {
          year: 2023,
          covers: [],
          tracks: [
            {
              id: 't1',
              durationSec: 200,
              ratings: [{ score: 8 }]
            }
          ]
        }
      ],
      covers: []
    }

    vi.mocked(computeAlbumRating).mockReturnValue({
      rankValue: 8,
      rankLabel: 'B+',
      finalAlbumRating: 8.0,
      baseRating: 7.5,
      qualityBoost: 1.07
    })

    const result = transformAlbumFirstRelease(album as any)

    expect(computeAlbumRating).toHaveBeenCalledWith(
      expect.any(Array),
      {
        cover: undefined,
        production: undefined,
        mix: undefined
      }
    )
    expect(result.rating).toEqual({
      rankValue: 8,
      rankLabel: 'B+',
      finalAlbumRating: 8.0,
      baseRating: 7.5,
      qualityBoost: 1.07
    })
  })

  it('should handle album with set modifier values', () => {
    const album = {
      id: 'album1',
      title: 'With Modifiers Album',
      year: 2023,
      primaryType: 'Album',
      coverValue: 8,
      productionValue: 9,
      mixValue: 7,
      artist: {
        id: 'artist1',
        name: 'Test Artist'
      },
      releases: [
        {
          year: 2023,
          covers: [],
          tracks: [
            {
              id: 't1',
              durationSec: 200,
              ratings: [{ score: 8 }]
            }
          ]
        }
      ],
      covers: []
    }

    vi.mocked(computeAlbumRating).mockReturnValue({
      rankValue: 8,
      rankLabel: 'B+',
      finalAlbumRating: 8.5,
      baseRating: 8.0,
      qualityBoost: 1.06
    })

    const result = transformAlbumFirstRelease(album as any)

    expect(computeAlbumRating).toHaveBeenCalledWith(
      expect.any(Array),
      {
        cover: 8,
        production: 9,
        mix: 7
      }
    )
    expect(result.rating).toEqual({
      rankValue: 8,
      rankLabel: 'B+',
      finalAlbumRating: 8.5,
      baseRating: 8.0,
      qualityBoost: 1.06
    })
  })

  it('should handle album with mixed modifier values', () => {
    const album = {
      id: 'album1',
      title: 'Mixed Modifiers Album',
      year: 2023,
      primaryType: 'Album',
      coverValue: 8,
      productionValue: null,
      mixValue: 7,
      artist: {
        id: 'artist1',
        name: 'Test Artist'
      },
      releases: [
        {
          year: 2023,
          covers: [],
          tracks: [
            {
              id: 't1',
              durationSec: 200,
              ratings: [{ score: 8 }]
            }
          ]
        }
      ],
      covers: []
    }

    vi.mocked(computeAlbumRating).mockReturnValue({
      rankValue: 8,
      rankLabel: 'B+',
      finalAlbumRating: 8.2,
      baseRating: 7.8,
      qualityBoost: 1.05
    })

    const result = transformAlbumFirstRelease(album as any)

    expect(computeAlbumRating).toHaveBeenCalledWith(
      expect.any(Array),
      {
        cover: 8,
        production: undefined,
        mix: 7
      }
    )
  })
})
