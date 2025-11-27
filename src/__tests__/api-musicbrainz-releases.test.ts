import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/(api)/api/musicbrainz/releases/route'
import { NextRequest } from 'next/server'

// Mock next-auth
vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn()
}))

// Mock MusicBrainzClient
const mockGetRelease = vi.fn()
vi.mock('@/lib/musicbrainz', () => {
  class MockMusicBrainzClient {
    getRelease = mockGetRelease
  }
  
  return {
    MusicBrainzClient: MockMusicBrainzClient
  }
})

// Mock schemas
vi.mock('@/lib/schemas/musicbrainz', () => ({
  MBReleaseSchema: {
    parse: vi.fn(data => data)
  }
}))

import { getServerSession } from 'next-auth'
import { MBReleaseSchema } from '@/lib/schemas/musicbrainz'
import { MusicBrainzClient } from '@/lib/musicbrainz'

describe('GET /api/musicbrainz/releases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/musicbrainz/releases?releaseId=123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toEqual({ error: 'Unauthorized' })
  })

  it('should return 400 when releaseId parameter is missing', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
      expires: '2024-12-31'
    })

    const request = new NextRequest('http://localhost:3000/api/musicbrainz/releases')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Release ID is required')
  })

  it('should return 400 when releaseId parameter is empty', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
      expires: '2024-12-31'
    })

    const request = new NextRequest('http://localhost:3000/api/musicbrainz/releases?releaseId=')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Release ID is required')
  })

  it('should fetch release details using the releaseId parameter', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
      expires: '2024-12-31'
    })

    const mockRelease = {
      id: 'release-123',
      title: 'The Rise and Fall of Ziggy Stardust',
      media: [
        {
          tracks: [
            { position: 1, title: 'Five Years', length: 258000 },
            { position: 2, title: 'Soul Love', length: 213000 }
          ]
        }
      ]
    }

    mockGetRelease.mockResolvedValue(mockRelease)

    const request = new NextRequest('http://localhost:3000/api/musicbrainz/releases?releaseId=release-123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(mockGetRelease).toHaveBeenCalledWith('release-123')
    expect(data.id).toBe('release-123')
    expect(data.title).toBe('The Rise and Fall of Ziggy Stardust')
  })

  it('should format tracks correctly from multiple media', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
      expires: '2024-12-31'
    })

    const mockRelease = {
      id: 'release-456',
      title: 'Double Album',
      media: [
        {
          tracks: [
            { position: 1, title: 'Track 1', length: 180000 },
            { position: 2, title: 'Track 2', length: 200000 }
          ]
        },
        {
          tracks: [
            { position: 1, title: 'Track 3', length: 220000 },
            { position: 2, title: 'Track 4', length: 240000 }
          ]
        }
      ]
    }

    mockGetRelease.mockResolvedValue(mockRelease)

    const request = new NextRequest('http://localhost:3000/api/musicbrainz/releases?releaseId=release-456')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.tracks).toHaveLength(4)
    expect(data.tracks[0]).toEqual({
      position: 1,
      title: 'Track 1',
      duration: 180000,
      mediumNumber: 1,
      trackNumber: 1
    })
    expect(data.tracks[2]).toEqual({
      position: 1,
      title: 'Track 3',
      duration: 220000,
      mediumNumber: 2,
      trackNumber: 1
    })
  })

  it('should handle releases with no media', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
      expires: '2024-12-31'
    })

    const mockRelease = {
      id: 'release-789',
      title: 'Empty Release',
      media: []
    }

    mockGetRelease.mockResolvedValue(mockRelease)

    const request = new NextRequest('http://localhost:3000/api/musicbrainz/releases?releaseId=release-789')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.tracks).toEqual([])
  })

  it('should handle releases with undefined media', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
      expires: '2024-12-31'
    })

    const mockRelease = {
      id: 'release-999',
      title: 'No Media Release'
    }

    mockGetRelease.mockResolvedValue(mockRelease)

    const request = new NextRequest('http://localhost:3000/api/musicbrainz/releases?releaseId=release-999')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.tracks).toEqual([])
  })

  it('should handle MusicBrainz API errors', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
      expires: '2024-12-31'
    })

    mockGetRelease.mockRejectedValue(new Error('MusicBrainz error'))

    const request = new NextRequest('http://localhost:3000/api/musicbrainz/releases?releaseId=bad-id')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to fetch release details' })
  })

  it('should validate response with MBReleaseSchema', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
      expires: '2024-12-31'
    })

    const mockRelease = {
      id: 'release-schema',
      title: 'Schema Test',
      media: []
    }

    mockGetRelease.mockResolvedValue(mockRelease)

    const request = new NextRequest('http://localhost:3000/api/musicbrainz/releases?releaseId=release-schema')
    await GET(request)

    expect(vi.mocked(MBReleaseSchema.parse)).toHaveBeenCalledWith(mockRelease)
  })
})
