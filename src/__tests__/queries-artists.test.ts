import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getArtistsList, getArtistWithAlbums, getArtistsBasic, artistWithAlbumsInclude, artistDetailInclude } from '../lib/queries/artists'
import { prisma } from '../lib/db'

// Mock Prisma
vi.mock('../lib/db', () => ({
  prisma: {
    artist: {
      findMany: vi.fn(),
      findUnique: vi.fn()
    }
  }
}))

describe('artistWithAlbumsInclude', () => {
  it('should have correct include structure for list view', () => {
    expect(artistWithAlbumsInclude).toHaveProperty('releaseGroupArtists')
    expect(artistWithAlbumsInclude.releaseGroupArtists).toHaveProperty('include')
    expect(artistWithAlbumsInclude.releaseGroupArtists.include).toHaveProperty('releaseGroup')
  })

  it('should include nested tracks and ratings', () => {
    expect(artistWithAlbumsInclude.releaseGroupArtists.include.releaseGroup.include.releases).toHaveProperty('include')
    expect(artistWithAlbumsInclude.releaseGroupArtists.include.releaseGroup.include.releases.include).toHaveProperty('tracks')
    expect(artistWithAlbumsInclude.releaseGroupArtists.include.releaseGroup.include.releases.include.tracks).toHaveProperty('include')
    expect(artistWithAlbumsInclude.releaseGroupArtists.include.releaseGroup.include.releases.include.tracks.include).toHaveProperty('ratings')
    expect(artistWithAlbumsInclude.releaseGroupArtists.include.releaseGroup.include.releases.include.tracks.include.ratings).toBe(true)
  })
})

describe('artistDetailInclude', () => {
  it('should have correct include structure for detail view', () => {
    expect(artistDetailInclude).toHaveProperty('releaseGroupArtists')
    expect(artistDetailInclude.releaseGroupArtists).toHaveProperty('include')
  })

  it('should include covers in detail view', () => {
    expect(artistDetailInclude.releaseGroupArtists.include.releaseGroup.include).toHaveProperty('covers')
    expect(artistDetailInclude.releaseGroupArtists.include.releaseGroup.include.covers).toBe(true)
  })

  it('should include releases with tracks and ratings', () => {
    expect(artistDetailInclude.releaseGroupArtists.include.releaseGroup.include).toHaveProperty('releases')
    expect(artistDetailInclude.releaseGroupArtists.include.releaseGroup.include.releases).toHaveProperty('include')
    expect(artistDetailInclude.releaseGroupArtists.include.releaseGroup.include.releases.include).toHaveProperty('tracks')
    expect(artistDetailInclude.releaseGroupArtists.include.releaseGroup.include.releases.include.tracks).toHaveProperty('include')
    expect(artistDetailInclude.releaseGroupArtists.include.releaseGroup.include.releases.include.tracks.include).toHaveProperty('ratings')
  })
})

describe('getArtistsList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch all artists with ratings data', async () => {
    const mockArtists = [
      {
        id: 'artist1',
        name: 'Artist 1',
        country: 'US',
        releaseGroupArtists: []
      },
      {
        id: 'artist2',
        name: 'Artist 2',
        country: 'UK',
        releaseGroupArtists: []
      }
    ]

    vi.mocked(prisma.artist.findMany).mockResolvedValue(mockArtists as any)

    const result = await getArtistsList()

    expect(prisma.artist.findMany).toHaveBeenCalledWith({
      include: artistWithAlbumsInclude,
      orderBy: { name: 'asc' }
    })
    expect(result).toEqual(mockArtists)
  })

  it('should return empty array when no artists found', async () => {
    vi.mocked(prisma.artist.findMany).mockResolvedValue([])

    const result = await getArtistsList()

    expect(result).toEqual([])
  })

  it('should include all required relations', async () => {
    vi.mocked(prisma.artist.findMany).mockResolvedValue([])

    await getArtistsList()

    expect(prisma.artist.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: artistWithAlbumsInclude
      })
    )
  })

  it('should propagate database errors', async () => {
    vi.mocked(prisma.artist.findMany).mockRejectedValue(
      new Error('Database connection failed')
    )

    await expect(getArtistsList()).rejects.toThrow('Database connection failed')
  })

  it('should return artists with complete nested data', async () => {
    const completeArtists = [
      {
        id: 'artist1',
        name: 'Complete Artist',
        country: 'US',
        imageUrl: 'https://example.com/artist.jpg',
        releaseGroupArtists: [
          {
            releaseGroup: {
              id: 'album1',
              title: 'Album 1',
              releases: [
                {
                  tracks: [
                    {
                      id: 't1',
                      ratings: [{ score: 8 }]
                    }
                  ]
                }
              ]
            }
          }
        ]
      }
    ]

    vi.mocked(prisma.artist.findMany).mockResolvedValue(completeArtists as any)

    const result = await getArtistsList()

    expect(result).toEqual(completeArtists)
    expect(result[0].releaseGroupArtists).toHaveLength(1)
    expect(result[0].releaseGroupArtists[0].releaseGroup.releases).toHaveLength(1)
  })

  it('should handle artists with no albums', async () => {
    const artistsWithNoAlbums = [
      {
        id: 'artist1',
        name: 'New Artist',
        country: 'US',
        releaseGroupArtists: []
      }
    ]

    vi.mocked(prisma.artist.findMany).mockResolvedValue(artistsWithNoAlbums as any)

    const result = await getArtistsList()

    expect(result[0].releaseGroupArtists).toEqual([])
  })
})

describe('getArtistWithAlbums', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch artist by id with all albums and ratings', async () => {
    const mockArtist = {
      id: 'artist123',
      name: 'Test Artist',
      country: 'US',
      imageUrl: 'https://example.com/artist.jpg',
      releaseGroupArtists: [
        {
          releaseGroup: {
            id: 'album1',
            title: 'Album 1',
            covers: [{ url: 'https://example.com/cover.jpg' }],
            releases: [
              {
                tracks: [
                  { id: 't1', title: 'Track 1', ratings: [{ score: 8 }] }
                ]
              }
            ]
          }
        }
      ]
    }

    vi.mocked(prisma.artist.findUnique).mockResolvedValue(mockArtist as any)

    const result = await getArtistWithAlbums('artist123')

    expect(prisma.artist.findUnique).toHaveBeenCalledWith({
      where: { id: 'artist123' },
      include: artistDetailInclude
    })
    expect(result).toEqual(mockArtist)
  })

  it('should return null when artist not found', async () => {
    vi.mocked(prisma.artist.findUnique).mockResolvedValue(null)

    const result = await getArtistWithAlbums('nonexistent')

    expect(result).toBe(null)
  })

  it('should include covers in artist detail', async () => {
    vi.mocked(prisma.artist.findUnique).mockResolvedValue({
      id: 'artist1',
      name: 'Test',
      releaseGroupArtists: []
    } as any)

    await getArtistWithAlbums('artist1')

    expect(prisma.artist.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        include: artistDetailInclude
      })
    )
  })

  it('should propagate database errors', async () => {
    vi.mocked(prisma.artist.findUnique).mockRejectedValue(
      new Error('Database error')
    )

    await expect(getArtistWithAlbums('artist1')).rejects.toThrow('Database error')
  })

  it('should handle empty string id', async () => {
    vi.mocked(prisma.artist.findUnique).mockResolvedValue(null)

    const result = await getArtistWithAlbums('')

    expect(prisma.artist.findUnique).toHaveBeenCalledWith({
      where: { id: '' },
      include: artistDetailInclude
    })
    expect(result).toBe(null)
  })

  it('should return artist with complete data structure', async () => {
    const completeArtist = {
      id: 'artist1',
      name: 'Complete Artist',
      sortName: 'Artist, Complete',
      country: 'US',
      notes: 'Test notes',
      imageUrl: 'https://example.com/artist.jpg',
      releaseGroupArtists: [
        {
          releaseGroup: {
            id: 'album1',
            title: 'Album 1',
            year: 2023,
            primaryType: 'Album',
            coverValue: 8,
            productionValue: 9,
            mixValue: 7,
            covers: [
              { url: 'https://example.com/cover1.jpg' },
              { url: 'https://example.com/cover2.jpg' }
            ],
            releases: [
              {
                id: 'release1',
                tracks: [
                  {
                    id: 't1',
                    number: 1,
                    title: 'Track 1',
                    durationSec: 180,
                    ratings: [
                      { id: 'r1', score: 8, userId: 'u1', trackId: 't1' }
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    }

    vi.mocked(prisma.artist.findUnique).mockResolvedValue(completeArtist as any)

    const result = await getArtistWithAlbums('artist1')

    expect(result).toEqual(completeArtist)
    expect(result?.releaseGroupArtists).toHaveLength(1)
    expect(result?.releaseGroupArtists[0].releaseGroup.covers).toHaveLength(2)
    expect(result?.releaseGroupArtists[0].releaseGroup.releases).toHaveLength(1)
    expect(result?.releaseGroupArtists[0].releaseGroup.releases[0].tracks).toHaveLength(1)
    expect(result?.releaseGroupArtists[0].releaseGroup.releases[0].tracks[0].ratings).toHaveLength(1)
  })

  it('should handle artist with no albums', async () => {
    const artistWithNoAlbums = {
      id: 'artist1',
      name: 'New Artist',
      country: 'US',
      releaseGroupArtists: []
    }

    vi.mocked(prisma.artist.findUnique).mockResolvedValue(artistWithNoAlbums as any)

    const result = await getArtistWithAlbums('artist1')

    expect(result?.releaseGroupArtists).toEqual([])
  })

  it('should handle artist with null optional fields', async () => {
    const artistWithNulls = {
      id: 'artist1',
      name: 'Minimal Artist',
      sortName: null,
      country: null,
      notes: null,
      imageUrl: null,
      releaseGroupArtists: []
    }

    vi.mocked(prisma.artist.findUnique).mockResolvedValue(artistWithNulls as any)

    const result = await getArtistWithAlbums('artist1')

    expect(result?.sortName).toBe(null)
    expect(result?.country).toBe(null)
    expect(result?.notes).toBe(null)
    expect(result?.imageUrl).toBe(null)
  })
})

describe('getArtistsBasic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch artists with basic fields only', async () => {
    const mockArtists = [
      {
        id: 'artist1',
        name: 'Artist One',
        sortName: 'One, Artist',
        country: 'US',
        imageUrl: 'https://example.com/artist1.jpg'
      },
      {
        id: 'artist2',
        name: 'Artist Two',
        sortName: 'Two, Artist',
        country: 'UK',
        imageUrl: null
      }
    ]

    vi.mocked(prisma.artist.findMany).mockResolvedValue(mockArtists as any)

    const result = await getArtistsBasic()

    expect(prisma.artist.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        name: true,
        sortName: true,
        country: true,
        imageUrl: true
      },
      orderBy: { name: 'asc' }
    })
    expect(result).toEqual(mockArtists)
  })

  it('should not include groups/albums in result', async () => {
    vi.mocked(prisma.artist.findMany).mockResolvedValue([
      {
        id: 'artist1',
        name: 'Test Artist',
        sortName: 'Artist, Test',
        country: 'US',
        imageUrl: null
      }
    ] as any)

    const result = await getArtistsBasic()

    expect(result[0]).not.toHaveProperty('releaseGroupArtists')
    expect(prisma.artist.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.not.objectContaining({
          releaseGroupArtists: expect.anything()
        })
      })
    )
  })

  it('should return empty array when no artists', async () => {
    vi.mocked(prisma.artist.findMany).mockResolvedValue([])

    const result = await getArtistsBasic()

    expect(result).toEqual([])
  })

  it('should order by name ascending', async () => {
    vi.mocked(prisma.artist.findMany).mockResolvedValue([])

    await getArtistsBasic()

    expect(prisma.artist.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: 'asc' }
      })
    )
  })

  it('should propagate database errors', async () => {
    vi.mocked(prisma.artist.findMany).mockRejectedValue(
      new Error('Database connection failed')
    )

    await expect(getArtistsBasic()).rejects.toThrow('Database connection failed')
  })

  it('should handle artists with null optional fields', async () => {
    const artistsWithNulls = [
      {
        id: 'artist1',
        name: 'Required Name',
        sortName: null,
        country: null,
        imageUrl: null
      }
    ]

    vi.mocked(prisma.artist.findMany).mockResolvedValue(artistsWithNulls as any)

    const result = await getArtistsBasic()

    expect(result[0].sortName).toBe(null)
    expect(result[0].country).toBe(null)
    expect(result[0].imageUrl).toBe(null)
  })
})
