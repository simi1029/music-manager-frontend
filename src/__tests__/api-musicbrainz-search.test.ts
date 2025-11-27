import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/(api)/api/musicbrainz/search/route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn()
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {}
}))

const mockSearchReleaseGroups = vi.fn()
vi.mock('@/lib/musicbrainz', () => {
  class MockMusicBrainzClient {
    searchReleaseGroups = mockSearchReleaseGroups
  }
  
  return {
    MusicBrainzClient: MockMusicBrainzClient,
    buildSearchQuery: vi.fn((artist, album) => {
      const parts = []
      if (artist) parts.push(`artist:"${artist}"`)
      if (album) parts.push(`releasegroup:"${album}"`)
      return parts.join(' AND ')
    })
  }
})

vi.mock('@/lib/schemas/musicbrainz', () => ({
  MBSearchResponseSchema: {
    parse: vi.fn((data) => data)
  },
  formatArtistCredit: vi.fn((credit) => 'The Beatles'),
  extractYear: vi.fn((date) => 1969)
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    externalRef: {
      findMany: vi.fn()
    }
  }
}))

import { getServerSession } from 'next-auth/next'
import { MusicBrainzClient, buildSearchQuery } from '@/lib/musicbrainz'
import { MBSearchResponseSchema } from '@/lib/schemas/musicbrainz'
import { prisma } from '@/lib/db'

describe('GET /api/musicbrainz/search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/musicbrainz/search?artist=Beatles')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 when no search params provided', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' }
    } as any)

    const request = new NextRequest('http://localhost/api/musicbrainz/search')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('VALIDATION_ERROR')
  })

  it('should search using artist and album params', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' }
    } as any)

    const mockMBData = {
      'release-groups': [
        {
          id: 'rg-1',
          title: 'Abbey Road',
          'primary-type': 'Album',
          'first-release-date': '1969-09-26',
          'artist-credit': [],
          'release-count': 50
        }
      ],
      count: 1,
      offset: 0
    }

    mockSearchReleaseGroups.mockResolvedValue(mockMBData)
    vi.mocked(MBSearchResponseSchema.parse).mockReturnValue(mockMBData)
    vi.mocked(prisma.externalRef.findMany).mockResolvedValue([])

    const request = new NextRequest('http://localhost/api/musicbrainz/search?artist=Beatles&album=Abbey+Road')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.results).toHaveLength(1)
    expect(mockSearchReleaseGroups).toHaveBeenCalled()
  })

  it('should use artistMbid for exact artist match when provided', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' }
    } as any)

    const mockMBData = {
      'release-groups': [],
      count: 0,
      offset: 0
    }

    mockSearchReleaseGroups.mockResolvedValue(mockMBData)
    vi.mocked(MBSearchResponseSchema.parse).mockReturnValue(mockMBData)
    vi.mocked(prisma.externalRef.findMany).mockResolvedValue([])

    const request = new NextRequest('http://localhost/api/musicbrainz/search?artistMbid=artist-mbid-123&album=Album')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockSearchReleaseGroups).toHaveBeenCalledWith(
      expect.stringContaining('arid:artist-mbid-123'),
      25
    )
  })

  it('should check for already imported albums', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' }
    } as any)

    const mockMBData = {
      'release-groups': [
        {
          id: 'rg-1',
          title: 'Album 1',
          'primary-type': 'Album',
          'first-release-date': '2000',
          'artist-credit': [],
        },
        {
          id: 'rg-2',
          title: 'Album 2',
          'primary-type': 'Album',
          'first-release-date': '2001',
          'artist-credit': [],
        }
      ],
      count: 1,
      offset: 0
    }

    mockSearchReleaseGroups.mockResolvedValue(mockMBData)
    vi.mocked(MBSearchResponseSchema.parse).mockReturnValue(mockMBData)
    vi.mocked(prisma.externalRef.findMany).mockResolvedValue([
      {
        id: 'ref-1',
        musicbrainzId: 'rg-1',
        releaseGroupId: 'album-1',
        discogsId: null,
        spotifyUrl: null,
        bandcampUrl: null
      }
    ])

    const request = new NextRequest('http://localhost/api/musicbrainz/search?artist=Test')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.results[0].alreadyImported).toBe(true)
    expect(data.results[0].existingAlbumId).toBe('album-1')
    expect(data.results[1].alreadyImported).toBe(false)
    expect(data.results[1].existingAlbumId).toBeNull()
  })

  it('should format results correctly', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' }
    } as any)

    const mockMBData = {
      'release-groups': [
        {
          id: 'rg-1',
          title: 'Abbey Road',
          'primary-type': 'Album',
          'first-release-date': '1969-09-26',
          'artist-credit': [{ name: 'The Beatles' }],
          'release-count': 50
        }
      ],
      count: 1,
      offset: 0
    }

    mockSearchReleaseGroups.mockResolvedValue(mockMBData)
    vi.mocked(MBSearchResponseSchema.parse).mockReturnValue(mockMBData)
    vi.mocked(prisma.externalRef.findMany).mockResolvedValue([])

    const request = new NextRequest('http://localhost/api/musicbrainz/search?album=Abbey')
    const response = await GET(request)
    const data = await response.json()

    expect(data.results[0]).toMatchObject({
      mbid: 'rg-1',
      title: 'Abbey Road',
      artist: 'The Beatles',
      year: 1969,
      type: 'Album',
      releaseCount: 50,
      alreadyImported: false,
      existingAlbumId: null
    })
  })

  it('should handle MusicBrainz API errors', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' }
    } as any)

    mockSearchReleaseGroups.mockRejectedValue(new Error('MusicBrainz error'))

    const request = new NextRequest('http://localhost/api/musicbrainz/search?artist=Test')
    const response = await GET(request)

    expect(response.status).toBe(500)
  })
})
