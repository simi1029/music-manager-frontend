import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/(api)/api/musicbrainz/search-artists/route'
import { NextRequest } from 'next/server'

// Mock next-auth
vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn()
}))

// Mock MusicBrainzClient
const mockSearchArtists = vi.fn()
vi.mock('@/lib/musicbrainz', () => {
  class MockMusicBrainzClient {
    searchArtists = mockSearchArtists
  }
  
  return {
    MusicBrainzClient: MockMusicBrainzClient
  }
})

// Mock schemas
vi.mock('@/lib/schemas/musicbrainz', () => ({
  MBArtistSearchResponseSchema: {
    parse: vi.fn(data => data)
  }
}))

import { getServerSession } from 'next-auth'
import { MBArtistSearchResponseSchema } from '@/lib/schemas/musicbrainz'
import { MusicBrainzClient } from '@/lib/musicbrainz'

describe('GET /api/musicbrainz/search-artists', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/musicbrainz/search-artists?query=David%20Bowie')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toEqual({ error: 'Unauthorized' })
  })

  it('should return 400 when query parameter is missing', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
      expires: '2024-12-31'
    })

    const request = new NextRequest('http://localhost:3000/api/musicbrainz/search-artists')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Search query is required')
  })

  it('should return 400 when query parameter is empty', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
      expires: '2024-12-31'
    })

    const request = new NextRequest('http://localhost:3000/api/musicbrainz/search-artists?query=')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Search query is required')
  })

  it('should search for artists using the query parameter', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
      expires: '2024-12-31'
    })

    const mockResponse = {
      artists: [
        {
          id: '5441c29d-3602-4898-b1a1-b77fa23b8e50',
          name: 'David Bowie',
          'sort-name': 'Bowie, David',
          type: 'Person',
          disambiguation: '',
          score: 100
        },
        {
          id: 'e1f1e33e-2e4c-4d43-b91b-7064068d3283',
          name: 'David Bowie & Queen',
          'sort-name': 'Bowie, David & Queen',
          type: 'Group',
          disambiguation: '',
          score: 95
        }
      ],
      count: 2,
      offset: 0
    }

    mockSearchArtists.mockResolvedValue(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/musicbrainz/search-artists?query=David%20Bowie')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(mockSearchArtists).toHaveBeenCalledWith('David Bowie', 25)
    expect(data.results).toHaveLength(2)
    expect(data.count).toBe(2)
    expect(data.offset).toBe(0)
  })

  it('should format artist results correctly', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
      expires: '2024-12-31'
    })

    const mockResponse = {
      artists: [
        {
          id: '5441c29d-3602-4898-b1a1-b77fa23b8e50',
          name: 'David Bowie',
          'sort-name': 'Bowie, David',
          type: 'Person',
          disambiguation: 'UK singer',
          score: 100
        }
      ],
      count: 1,
      offset: 0
    }

    mockSearchArtists.mockResolvedValue(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/musicbrainz/search-artists?query=David%20Bowie')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.results[0]).toEqual({
      mbid: '5441c29d-3602-4898-b1a1-b77fa23b8e50',
      name: 'David Bowie',
      sortName: 'Bowie, David',
      type: 'Person',
      disambiguation: 'UK singer',
      score: 100
    })
  })

  it('should handle empty results', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
      expires: '2024-12-31'
    })

    const mockResponse = {
      artists: [],
      count: 0,
      offset: 0
    }

    mockSearchArtists.mockResolvedValue(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/musicbrainz/search-artists?query=NonexistentArtist123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.results).toEqual([])
    expect(data.count).toBe(0)
  })

  it('should handle MusicBrainz API errors', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
      expires: '2024-12-31'
    })

    mockSearchArtists.mockRejectedValue(new Error('MusicBrainz error'))

    const request = new NextRequest('http://localhost:3000/api/musicbrainz/search-artists?query=test')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to search artists' })
  })

  it('should validate response with MBSearchResponseSchema', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
      expires: '2024-12-31'
    })

    const mockResponse = {
      artists: [
        {
          id: '5441c29d-3602-4898-b1a1-b77fa23b8e50',
          name: 'David Bowie',
          'sort-name': 'Bowie, David',
          type: 'Person',
          score: 100
        }
      ],
      count: 1,
      offset: 0
    }

    mockSearchArtists.mockResolvedValue(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/musicbrainz/search-artists?query=David%20Bowie')
    await GET(request)

    expect(vi.mocked(MBArtistSearchResponseSchema.parse)).toHaveBeenCalledWith(mockResponse)
  })
})
