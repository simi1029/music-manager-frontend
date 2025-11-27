import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAlbumsList, getAlbumWithRatings, getAlbumsByArtist, albumInclude } from '../lib/queries/albums'
import { prisma } from '../lib/db'

// Mock Prisma
vi.mock('../lib/db', () => ({
  prisma: {
    releaseGroup: {
      findMany: vi.fn(),
      findUnique: vi.fn()
    }
  }
}))

describe('albumInclude', () => {
  it('should have correct include structure', () => {
    expect(albumInclude).toHaveProperty('artist')
    expect(albumInclude).toHaveProperty('releases')
    expect(albumInclude).toHaveProperty('covers')
    expect(albumInclude.artist).toBe(true)
    expect(albumInclude.covers).toBe(true)
  })

  it('should include nested tracks and ratings', () => {
    expect(albumInclude.releases).toHaveProperty('include')
    expect(albumInclude.releases.include).toHaveProperty('tracks')
    expect(albumInclude.releases.include.tracks).toHaveProperty('include')
    expect(albumInclude.releases.include.tracks.include).toHaveProperty('ratings')
    expect(albumInclude.releases.include.tracks.include.ratings).toBe(true)
  })
})

describe('getAlbumsList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch albums with default limit of 50', async () => {
    const mockAlbums = [
      { id: 'album1', title: 'Test Album 1' },
      { id: 'album2', title: 'Test Album 2' }
    ]

    vi.mocked(prisma.releaseGroup.findMany).mockResolvedValue(mockAlbums as any)

    const result = await getAlbumsList()

    expect(prisma.releaseGroup.findMany).toHaveBeenCalledWith({
      include: albumInclude,
      orderBy: { updatedAt: 'desc' },
      take: 50
    })
    expect(result).toEqual(mockAlbums)
  })

  it('should fetch albums with custom limit', async () => {
    const mockAlbums = [
      { id: 'album1', title: 'Test Album 1' }
    ]

    vi.mocked(prisma.releaseGroup.findMany).mockResolvedValue(mockAlbums as any)

    const result = await getAlbumsList({ limit: 10 })

    expect(prisma.releaseGroup.findMany).toHaveBeenCalledWith({
      include: albumInclude,
      orderBy: { updatedAt: 'desc' },
      take: 10
    })
    expect(result).toEqual(mockAlbums)
  })

  it('should order by updatedAt descending', async () => {
    vi.mocked(prisma.releaseGroup.findMany).mockResolvedValue([])

    await getAlbumsList()

    expect(prisma.releaseGroup.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { updatedAt: 'desc' }
      })
    )
  })

  it('should include all required relations', async () => {
    vi.mocked(prisma.releaseGroup.findMany).mockResolvedValue([])

    await getAlbumsList()

    expect(prisma.releaseGroup.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: albumInclude
      })
    )
  })

  it('should return empty array when no albums found', async () => {
    vi.mocked(prisma.releaseGroup.findMany).mockResolvedValue([])

    const result = await getAlbumsList()

    expect(result).toEqual([])
  })

  it('should propagate database errors', async () => {
    vi.mocked(prisma.releaseGroup.findMany).mockRejectedValue(
      new Error('Database connection failed')
    )

    await expect(getAlbumsList()).rejects.toThrow('Database connection failed')
  })

  it('should handle limit of 0', async () => {
    vi.mocked(prisma.releaseGroup.findMany).mockResolvedValue([])

    await getAlbumsList({ limit: 0 })

    expect(prisma.releaseGroup.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 0
      })
    )
  })

  it('should handle large limit values', async () => {
    const mockAlbums = new Array(1000).fill(null).map((_, i) => ({
      id: `album${i}`,
      title: `Album ${i}`
    }))

    vi.mocked(prisma.releaseGroup.findMany).mockResolvedValue(mockAlbums as any)

    const result = await getAlbumsList({ limit: 1000 })

    expect(prisma.releaseGroup.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 1000
      })
    )
    expect(result).toHaveLength(1000)
  })
})

describe('getAlbumsByArtist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch albums by artist ID ordered by year desc', async () => {
    const mockAlbums = [
      {
        id: 'album1',
        title: 'Album 2023',
        year: 2023,
        artistId: 'artist1',
        releases: []
      },
      {
        id: 'album2',
        title: 'Album 2021',
        year: 2021,
        artistId: 'artist1',
        releases: []
      }
    ]

    vi.mocked(prisma.releaseGroup.findMany).mockResolvedValue(mockAlbums as any)

    const result = await getAlbumsByArtist('artist1')

    expect(prisma.releaseGroup.findMany).toHaveBeenCalledWith({
      where: { artistId: 'artist1' },
      include: albumInclude,
      orderBy: { year: 'desc' }
    })
    expect(result).toEqual(mockAlbums)
  })

  it('should return empty array when artist has no albums', async () => {
    vi.mocked(prisma.releaseGroup.findMany).mockResolvedValue([])

    const result = await getAlbumsByArtist('artist-no-albums')

    expect(result).toEqual([])
  })

  it('should propagate database errors', async () => {
    vi.mocked(prisma.releaseGroup.findMany).mockRejectedValue(
      new Error('Database connection failed')
    )

    await expect(getAlbumsByArtist('artist1')).rejects.toThrow('Database connection failed')
  })

  it('should handle empty string artist ID', async () => {
    vi.mocked(prisma.releaseGroup.findMany).mockResolvedValue([])

    const result = await getAlbumsByArtist('')

    expect(prisma.releaseGroup.findMany).toHaveBeenCalledWith({
      where: { artistId: '' },
      include: albumInclude,
      orderBy: { year: 'desc' }
    })
    expect(result).toEqual([])
  })

  it('should include all required relations', async () => {
    vi.mocked(prisma.releaseGroup.findMany).mockResolvedValue([])

    await getAlbumsByArtist('artist1')

    expect(prisma.releaseGroup.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: albumInclude
      })
    )
  })
})

describe('getAlbumWithRatings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch album by id with all ratings', async () => {
    const mockAlbum = {
      id: 'album123',
      title: 'Test Album',
      artist: { id: 'artist1', name: 'Test Artist' },
      releases: [
        {
          tracks: [
            { id: 't1', title: 'Track 1', ratings: [] }
          ]
        }
      ],
      covers: []
    }

    vi.mocked(prisma.releaseGroup.findUnique).mockResolvedValue(mockAlbum as any)

    const result = await getAlbumWithRatings('album123')

    expect(prisma.releaseGroup.findUnique).toHaveBeenCalledWith({
      where: { id: 'album123' },
      include: albumInclude
    })
    expect(result).toEqual(mockAlbum)
  })

  it('should return null when album not found', async () => {
    vi.mocked(prisma.releaseGroup.findUnique).mockResolvedValue(null)

    const result = await getAlbumWithRatings('nonexistent')

    expect(result).toBe(null)
  })

  it('should include all nested relations', async () => {
    vi.mocked(prisma.releaseGroup.findUnique).mockResolvedValue({
      id: 'album1',
      title: 'Test'
    } as any)

    await getAlbumWithRatings('album1')

    expect(prisma.releaseGroup.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        include: albumInclude
      })
    )
  })

  it('should propagate database errors', async () => {
    vi.mocked(prisma.releaseGroup.findUnique).mockRejectedValue(
      new Error('Database error')
    )

    await expect(getAlbumWithRatings('album1')).rejects.toThrow('Database error')
  })

  it('should handle empty string id', async () => {
    vi.mocked(prisma.releaseGroup.findUnique).mockResolvedValue(null)

    const result = await getAlbumWithRatings('')

    expect(prisma.releaseGroup.findUnique).toHaveBeenCalledWith({
      where: { id: '' },
      include: albumInclude
    })
    expect(result).toBe(null)
  })

  it('should return album with complete data structure', async () => {
    const completeAlbum = {
      id: 'album1',
      title: 'Complete Album',
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
      ],
      covers: [
        { url: 'https://example.com/cover.jpg' }
      ]
    }

    vi.mocked(prisma.releaseGroup.findUnique).mockResolvedValue(completeAlbum as any)

    const result = await getAlbumWithRatings('album1')

    expect(result).toEqual(completeAlbum)
    expect(result?.artist).toBeDefined()
    expect(result?.releases).toHaveLength(1)
    expect(result?.releases[0].tracks).toHaveLength(1)
    expect(result?.releases[0].tracks[0].ratings).toHaveLength(1)
    expect(result?.covers).toHaveLength(1)
  })
})
