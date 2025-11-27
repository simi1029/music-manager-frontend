import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  calculateArtistAlbumRating,
  transformArtistWithRatings,
  transformArtistsWithRatings,
  type PrismaArtistWithAlbums,
  type ArtistAlbum
} from '../lib/transformers/artists'
import { computeAlbumRating, computeArtistRating } from '../lib/rating'

// Mock the rating module
vi.mock('../lib/rating', () => ({
  computeAlbumRating: vi.fn((tracks, modifiers) => {
    const hasRatings = tracks.some((t: any) => t.ratings && t.ratings.length > 0)
    if (!hasRatings) {
      return { rankValue: 0, rankLabel: '—', finalAlbumRating: 0, baseRating: 0, qualityBoost: 1 }
    }
    // Return different values based on number of tracks for testing
    const avgScore = tracks.reduce((sum: number, t: any) => {
      const score = t.ratings?.[0]?.score || 0
      return sum + score
    }, 0) / tracks.length
    return { 
      rankValue: Math.floor(avgScore), 
      rankLabel: avgScore >= 7 ? 'Excellent' : 'Good',
      finalAlbumRating: avgScore,
      baseRating: avgScore * 0.95,
      qualityBoost: 1.05
    }
  }),
  computeArtistRating: vi.fn((albumRatings) => {
    const ratedAlbums = albumRatings.filter((a: any) => a.rankValue > 0)
    if (ratedAlbums.length === 0) {
      return { avgFinalRating: 0, rankValue: 0, rankLabel: '—' }
    }
    const avgRating = ratedAlbums.reduce((sum: number, a: any) => sum + a.finalAlbumRating, 0) / ratedAlbums.length
    return {
      avgFinalRating: avgRating,
      rankValue: Math.floor(avgRating),
      rankLabel: avgRating >= 7 ? 'Excellent' : 'Good'
    }
  })
}))

describe('calculateArtistAlbumRating', () => {
  const baseAlbum: ArtistAlbum = {
    id: 'album1',
    title: 'Test Album',
    year: 2023,
    primaryType: 'Album',
    coverValue: 8,
    productionValue: 9,
    mixValue: 7,
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

  it('should calculate rating for album with ratings', () => {
    const result = calculateArtistAlbumRating(baseAlbum)

    expect(result).toHaveProperty('rankValue')
    expect(result).toHaveProperty('finalAlbumRating')
    expect(result.rankValue).toBeGreaterThan(0)
  })

  it('should return 0 values for album without ratings', () => {
    const unratedAlbum: ArtistAlbum = {
      ...baseAlbum,
      releases: [
        {
          tracks: [
            { id: 't1', number: 1, title: 'Track 1', durationSec: 180, ratings: [] }
          ]
        }
      ]
    }

    const result = calculateArtistAlbumRating(unratedAlbum)

    expect(result.rankValue).toBe(0)
    expect(result.finalAlbumRating).toBe(0)
  })

  it('should handle album with empty ratings arrays', () => {
    const emptyRatingsAlbum: ArtistAlbum = {
      ...baseAlbum,
      releases: [
        {
          tracks: [
            { id: 't1', number: 1, title: 'Track 1', durationSec: 180, ratings: [] },
            { id: 't2', number: 2, title: 'Track 2', durationSec: 200, ratings: [] }
          ]
        }
      ]
    }

    const result = calculateArtistAlbumRating(emptyRatingsAlbum)

    expect(result.rankValue).toBe(0)
    expect(result.finalAlbumRating).toBe(0)
  })

  it('should handle album with undefined ratings', () => {
    const undefinedRatingsAlbum: ArtistAlbum = {
      ...baseAlbum,
      releases: [
        {
          tracks: [
            { id: 't1', number: 1, title: 'Track 1', durationSec: 180 } as any
          ]
        }
      ]
    }

    const result = calculateArtistAlbumRating(undefinedRatingsAlbum)

    expect(result.rankValue).toBe(0)
    expect(result.finalAlbumRating).toBe(0)
  })

  it('should flatten tracks from multiple releases', () => {
    const multiReleaseAlbum: ArtistAlbum = {
      ...baseAlbum,
      releases: [
        {
          tracks: [
            { id: 't1', number: 1, title: 'Track 1', durationSec: 180, ratings: [{ score: 8 }] }
          ]
        },
        {
          tracks: [
            { id: 't2', number: 2, title: 'Track 2', durationSec: 200, ratings: [{ score: 9 }] }
          ]
        }
      ]
    }

    const result = calculateArtistAlbumRating(multiReleaseAlbum)

    expect(result.rankValue).toBeGreaterThan(0)
  })

  it('should pass modifiers to computeAlbumRating', () => {
    const albumWithModifiers: ArtistAlbum = {
      ...baseAlbum,
      coverValue: 9,
      productionValue: 10,
      mixValue: 8
    }

    const result = calculateArtistAlbumRating(albumWithModifiers)

    // Mock should still return a value
    expect(result).toBeDefined()
  })

  it('should handle null modifier values', () => {
    const nullModifiersAlbum: ArtistAlbum = {
      ...baseAlbum,
      coverValue: null,
      productionValue: null,
      mixValue: null
    }

    const result = calculateArtistAlbumRating(nullModifiersAlbum)

    expect(result).toBeDefined()
    expect(result.rankValue).toBeGreaterThan(0)
  })
})

describe('transformArtistWithRatings', () => {
  const baseArtist: PrismaArtistWithAlbums = {
    id: 'artist1',
    name: 'Test Artist',
    country: 'US',
    imageUrl: 'https://example.com/artist.jpg',
    groups: [
      {
        id: 'album1',
        title: 'Album 1',
        year: 2023,
        primaryType: 'Album',
        coverValue: 8,
        productionValue: 9,
        mixValue: 7,
        releases: [
          {
            tracks: [
              { id: 't1', number: 1, title: 'Track 1', durationSec: 180, ratings: [{ score: 8 }] },
              { id: 't2', number: 2, title: 'Track 2', durationSec: 200, ratings: [{ score: 9 }] }
            ]
          }
        ],
        covers: []
      },
      {
        id: 'album2',
        title: 'Album 2',
        year: 2024,
        primaryType: 'Album',
        coverValue: 7,
        productionValue: 8,
        mixValue: 8,
        releases: [
          {
            tracks: [
              { id: 't3', number: 1, title: 'Track 3', durationSec: 190, ratings: [{ score: 7 }] }
            ]
          }
        ],
        covers: []
      }
    ]
  }

  it('should transform artist with ratings and statistics', () => {
    const result = transformArtistWithRatings(baseArtist)

    expect(result.id).toBe('artist1')
    expect(result.name).toBe('Test Artist')
    expect(result.country).toBe('US')
    expect(result.imageUrl).toBe('https://example.com/artist.jpg')
    expect(result.albumCount).toBe(2)
    expect(result.ratedAlbumCount).toBe(2)
    expect(result.avgRating).toBeGreaterThan(0)
    expect(result.rankValue).toBeGreaterThan(0)
    expect(result.rankLabel).toBeDefined()
  })

  it('should handle artist with no albums', () => {
    const noAlbumsArtist: PrismaArtistWithAlbums = {
      ...baseArtist,
      groups: []
    }

    const result = transformArtistWithRatings(noAlbumsArtist)

    expect(result.albumCount).toBe(0)
    expect(result.ratedAlbumCount).toBe(0)
    expect(result.avgRating).toBe(0)
    expect(result.rankValue).toBe(0)
  })

  it('should handle artist with unrated albums', () => {
    const unratedArtist: PrismaArtistWithAlbums = {
      ...baseArtist,
      groups: [
        {
          id: 'album1',
          title: 'Album 1',
          year: 2023,
          primaryType: 'Album',
          coverValue: null,
          productionValue: null,
          mixValue: null,
          releases: [
            {
              tracks: [
                { id: 't1', number: 1, title: 'Track 1', durationSec: 180, ratings: [] }
              ]
            }
          ],
          covers: []
        }
      ]
    }

    const result = transformArtistWithRatings(unratedArtist)

    expect(result.albumCount).toBe(1)
    expect(result.ratedAlbumCount).toBe(0)
    expect(result.avgRating).toBe(0)
  })

  it('should handle artist with mix of rated and unrated albums', () => {
    const mixedArtist: PrismaArtistWithAlbums = {
      ...baseArtist,
      groups: [
        {
          id: 'album1',
          title: 'Rated Album',
          year: 2023,
          primaryType: 'Album',
          coverValue: 8,
          productionValue: 9,
          mixValue: 7,
          releases: [
            {
              tracks: [
                { id: 't1', number: 1, title: 'Track 1', durationSec: 180, ratings: [{ score: 8 }] }
              ]
            }
          ],
          covers: []
        },
        {
          id: 'album2',
          title: 'Unrated Album',
          year: 2024,
          primaryType: 'Album',
          coverValue: null,
          productionValue: null,
          mixValue: null,
          releases: [
            {
              tracks: [
                { id: 't2', number: 1, title: 'Track 2', durationSec: 190, ratings: [] }
              ]
            }
          ],
          covers: []
        }
      ]
    }

    const result = transformArtistWithRatings(mixedArtist)

    expect(result.albumCount).toBe(2)
    expect(result.ratedAlbumCount).toBe(1)
  })

  it('should handle null country', () => {
    const noCountryArtist: PrismaArtistWithAlbums = {
      ...baseArtist,
      country: null
    }

    const result = transformArtistWithRatings(noCountryArtist)

    expect(result.country).toBe(null)
  })

  it('should handle undefined imageUrl', () => {
    const noImageArtist: PrismaArtistWithAlbums = {
      ...baseArtist,
      imageUrl: undefined
    }

    const result = transformArtistWithRatings(noImageArtist)

    expect(result.imageUrl).toBe(null)
  })

  it('should handle null imageUrl', () => {
    const noImageArtist: PrismaArtistWithAlbums = {
      ...baseArtist,
      imageUrl: null
    }

    const result = transformArtistWithRatings(noImageArtist)

    expect(result.imageUrl).toBe(null)
  })
})

describe('transformArtistsWithRatings', () => {
  const artist1: PrismaArtistWithAlbums = {
    id: 'artist1',
    name: 'Artist 1',
    country: 'US',
    imageUrl: 'https://example.com/artist1.jpg',
    groups: [
      {
        id: 'album1',
        title: 'Album 1',
        year: 2023,
        primaryType: 'Album',
        coverValue: 8,
        productionValue: 9,
        mixValue: 7,
        releases: [
          {
            tracks: [
              { id: 't1', number: 1, title: 'Track 1', durationSec: 180, ratings: [{ score: 8 }] }
            ]
          }
        ],
        covers: []
      }
    ]
  }

  const artist2: PrismaArtistWithAlbums = {
    id: 'artist2',
    name: 'Artist 2',
    country: 'UK',
    imageUrl: null,
    groups: [
      {
        id: 'album2',
        title: 'Album 2',
        year: 2024,
        primaryType: 'Album',
        coverValue: 7,
        productionValue: 8,
        mixValue: 8,
        releases: [
          {
            tracks: [
              { id: 't2', number: 1, title: 'Track 2', durationSec: 190, ratings: [{ score: 7 }] }
            ]
          }
        ],
        covers: []
      }
    ]
  }

  it('should transform multiple artists', () => {
    const result = transformArtistsWithRatings([artist1, artist2])

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('artist1')
    expect(result[1].id).toBe('artist2')
  })

  it('should handle empty array', () => {
    const result = transformArtistsWithRatings([])

    expect(result).toEqual([])
  })

  it('should transform each artist independently', () => {
    const result = transformArtistsWithRatings([artist1, artist2])

    expect(result[0].name).toBe('Artist 1')
    expect(result[0].albumCount).toBe(1)
    expect(result[1].name).toBe('Artist 2')
    expect(result[1].albumCount).toBe(1)
  })

  it('should preserve artist order', () => {
    const result = transformArtistsWithRatings([artist2, artist1])

    expect(result[0].id).toBe('artist2')
    expect(result[1].id).toBe('artist1')
  })
})

describe('calculateArtistAlbumRating - modifier values', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle albums with null modifiers', () => {
    const album = {
      coverValue: null,
      productionValue: null,
      mixValue: null,
      releases: [
        {
          tracks: [
            { durationSec: 200, ratings: [{ score: 8 }] }
          ]
        }
      ]
    }

    vi.mocked(computeAlbumRating).mockReturnValue({
      rankValue: 8,
      rankLabel: 'Excellent',
      finalAlbumRating: 8.0,
      baseRating: 7.6,
      qualityBoost: 1.05
    })

    const result = calculateArtistAlbumRating(album as any)

    expect(computeAlbumRating).toHaveBeenCalledWith(
      expect.any(Array),
      {
        cover: undefined,
        production: undefined,
        mix: undefined
      }
    )
    expect(result).toEqual({ rankValue: 8, rankLabel: 'Excellent', finalAlbumRating: 8.0, baseRating: 7.6, qualityBoost: 1.05 })
  })

  it('should handle albums with modifier values', () => {
    const album = {
      coverValue: 9,
      productionValue: 8,
      mixValue: 7,
      releases: [
        {
          tracks: [
            { durationSec: 200, ratings: [{ score: 8 }] }
          ]
        }
      ]
    }

    vi.mocked(computeAlbumRating).mockReturnValue({
      rankValue: 8,
      rankLabel: 'Excellent',
      finalAlbumRating: 8.5,
      baseRating: 8.0,
      qualityBoost: 1.06
    })

    const result = calculateArtistAlbumRating(album as any)

    expect(computeAlbumRating).toHaveBeenCalledWith(
      expect.any(Array),
      {
        cover: 9,
        production: 8,
        mix: 7
      }
    )
    expect(result).toEqual({ rankValue: 8, rankLabel: 'Excellent', finalAlbumRating: 8.5, baseRating: 8.0, qualityBoost: 1.06 })
  })

  it('should handle albums with mixed modifier values', () => {
    const album = {
      coverValue: 8,
      productionValue: null,
      mixValue: 7,
      releases: [
        {
          tracks: [
            { durationSec: 200, ratings: [{ score: 8 }] }
          ]
        }
      ]
    }

    vi.mocked(computeAlbumRating).mockReturnValue({
      rankValue: 8,
      rankLabel: 'Excellent',
      finalAlbumRating: 8.2,
      baseRating: 7.8,
      qualityBoost: 1.05
    })

    const result = calculateArtistAlbumRating(album as any)

    expect(computeAlbumRating).toHaveBeenCalledWith(
      expect.any(Array),
      {
        cover: 8,
        production: undefined,
        mix: 7
      }
    )
  })

  it('should handle multiple albums with different modifiers', () => {
    const album1 = {
      coverValue: 9,
      productionValue: 8,
      mixValue: 7,
      releases: [
        {
          tracks: [
            { durationSec: 200, ratings: [{ score: 8 }] }
          ]
        }
      ]
    }

    const album2 = {
      coverValue: null,
      productionValue: null,
      mixValue: null,
      releases: [
        {
          tracks: [
            { durationSec: 180, ratings: [{ score: 7 }] }
          ]
        }
      ]
    }

    vi.mocked(computeAlbumRating)
      .mockReturnValueOnce({ rankValue: 8, rankLabel: 'Excellent', finalAlbumRating: 8.5, baseRating: 8.0, qualityBoost: 1.06 })
      .mockReturnValueOnce({ rankValue: 7, rankLabel: 'Excellent', finalAlbumRating: 7.0, baseRating: 6.7, qualityBoost: 1.04 })

    // Test calling the function with each album individually
    const result1 = calculateArtistAlbumRating(album1 as any)
    const result2 = calculateArtistAlbumRating(album2 as any)

    expect(computeAlbumRating).toHaveBeenCalledTimes(2)
    expect(computeAlbumRating).toHaveBeenNthCalledWith(
      1,
      expect.any(Array),
      { cover: 9, production: 8, mix: 7 }
    )
    expect(computeAlbumRating).toHaveBeenNthCalledWith(
      2,
      expect.any(Array),
      { cover: undefined, production: undefined, mix: undefined }
    )
    expect(result1).toEqual({ rankValue: 8, rankLabel: 'Excellent', finalAlbumRating: 8.5, baseRating: 8.0, qualityBoost: 1.06 })
    expect(result2).toEqual({ rankValue: 7, rankLabel: 'Excellent', finalAlbumRating: 7.0, baseRating: 6.7, qualityBoost: 1.04 })
  })
})
