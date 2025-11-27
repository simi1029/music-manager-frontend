import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MusicBrainzClient, MusicBrainzError, buildSearchQuery } from '@/lib/musicbrainz'

// Mock fetch globally
global.fetch = vi.fn()

describe('MusicBrainzClient', () => {
  let client: MusicBrainzClient
  
  beforeEach(() => {
    client = new MusicBrainzClient()
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Rate Limiting', () => {
    it('should enforce 1 request per second rate limit', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ 'release-groups': [], count: 0, offset: 0 })
      }
      
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response)

      const startTime = Date.now()
      
      // First request should be immediate
      await client.searchReleaseGroups('test')
      const firstRequestTime = Date.now() - startTime
      expect(firstRequestTime).toBeLessThan(100)

      // Second request should wait ~1000ms
      const promise = client.searchReleaseGroups('test2')
      await vi.advanceTimersByTimeAsync(1000)
      await promise
      
      const secondRequestTime = Date.now() - startTime
      expect(secondRequestTime).toBeGreaterThanOrEqual(1000)
    })

    it('should not wait if more than 1 second has passed', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ 'release-groups': [], count: 0, offset: 0 })
      }
      
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response)

      // First request
      await client.searchReleaseGroups('test1')
      
      // Advance time by 2 seconds
      await vi.advanceTimersByTimeAsync(2000)
      
      // Second request should be immediate (no wait needed)
      const startTime = Date.now()
      await client.searchReleaseGroups('test2')
      const requestTime = Date.now() - startTime
      
      expect(requestTime).toBeLessThan(100)
    })
  })

  describe('searchReleaseGroups', () => {
    it('should build correct MusicBrainz search URL', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ 'release-groups': [], count: 0, offset: 0 })
      }
      
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response)

      await client.searchReleaseGroups('artist:"Beatles" AND releasegroup:"Abbey Road"', 25)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://musicbrainz.org/ws/2/release-group'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'MusicManager/0.1.0 (sim.david90@gmail.com)',
            'Accept': 'application/json'
          })
        })
      )
    })

    it('should return parsed search results', async () => {
      const mockData = {
        'release-groups': [
          {
            id: 'test-mbid-123',
            title: 'Abbey Road',
            'primary-type': 'Album',
            'first-release-date': '1969-09-26',
            'artist-credit': [{ artist: { id: 'artist-1', name: 'The Beatles' }, name: 'The Beatles' }]
          }
        ],
        count: 1,
        offset: 0
      }
      
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockData
      } as Response)

      const result = await client.searchReleaseGroups('Beatles')
      
      expect(result).toEqual(mockData)
    })

    it('should use default limit of 25 when not specified', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ 'release-groups': [], count: 0, offset: 0 })
      }
      
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response)

      await client.searchReleaseGroups('test query')

      const callUrl = vi.mocked(fetch).mock.calls[0][0] as string
      expect(callUrl).toContain('limit=25')
    })

    it('should include fmt=json parameter', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ 'release-groups': [], count: 0, offset: 0 })
      }
      
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response)

      await client.searchReleaseGroups('test')

      const callUrl = vi.mocked(fetch).mock.calls[0][0] as string
      expect(callUrl).toContain('fmt=json')
    })
  })

  describe('searchArtists', () => {
    it('should search for artists and return results', async () => {
      const mockData = {
        artists: [
          {
            id: 'artist-mbid-1',
            name: 'The Beatles',
            disambiguation: 'British rock band',
            country: 'GB'
          }
        ],
        count: 1,
        offset: 0
      }
      
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockData
      } as Response)

      const result = await client.searchArtists('Beatles', 10)
      
      expect(result).toEqual(mockData)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/artist/?query='),
        expect.any(Object)
      )
    })
  })

  describe('Error Handling', () => {
    it('should throw MusicBrainzError on 404', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => 'Not found'
      } as Response)

      await expect(client.searchReleaseGroups('nonexistent'))
        .rejects
        .toThrow(MusicBrainzError)
    })

    it('should throw MusicBrainzError on 503', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => 'Service unavailable'
      } as Response)

      await expect(client.searchReleaseGroups('test'))
        .rejects
        .toThrow(MusicBrainzError)
    })

    it('should throw MusicBrainzError on 400', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'Bad request'
      } as Response)

      await expect(client.searchReleaseGroups('test'))
        .rejects
        .toThrow(MusicBrainzError)
    })

    it('should provide user-friendly error messages', () => {
      const error404 = new MusicBrainzError(404, 'Not found')
      const error503 = new MusicBrainzError(503, 'Service unavailable')
      const error400 = new MusicBrainzError(400, 'Bad request')
      const error500 = new MusicBrainzError(500, 'Internal server error')

      expect(error404.getUserMessage()).toContain('not found')
      expect(error503.getUserMessage()).toContain('temporarily unavailable')
      expect(error400.getUserMessage()).toContain('Invalid search')
      expect(error500.getUserMessage()).toContain('error occurred')
    })

    it('should set error name to MusicBrainzError', () => {
      const error = new MusicBrainzError(404, 'Not found')
      expect(error.name).toBe('MusicBrainzError')
    })

    it('should include status code and body in error', () => {
      const error = new MusicBrainzError(404, 'Not found')
      expect(error.statusCode).toBe(404)
      expect(error.body).toBe('Not found')
    })
  })

  describe('getReleaseGroupDetails', () => {
    it('should fetch release group details with correct includes', async () => {
      const mockData = {
        id: 'rg-mbid-123',
        title: 'Abbey Road',
        'primary-type': 'Album',
        'first-release-date': '1969-09-26',
        'artist-credit': [],
        releases: []
      }
      
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockData
      } as Response)

      const result = await client.getReleaseGroupDetails('rg-mbid-123')

      expect(result).toEqual(mockData)
      const callUrl = vi.mocked(fetch).mock.calls[0][0] as string
      expect(callUrl).toContain('release-group/rg-mbid-123')
      expect(callUrl).toContain('inc=artists%2Breleases')
    })
  })

  describe('getRelease', () => {
    it('should fetch release details with correct includes', async () => {
      const mockData = {
        id: 'release-mbid-456',
        title: 'Abbey Road',
        date: '1969-09-26',
        media: []
      }
      
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockData
      } as Response)

      const result = await client.getRelease('release-mbid-456')

      expect(result).toEqual(mockData)
      const callUrl = vi.mocked(fetch).mock.calls[0][0] as string
      expect(callUrl).toContain('release/release-mbid-456')
      expect(callUrl).toContain('inc=recordings%2Bartist-credits%2Blabels')
    })
  })

  describe('buildSearchQuery', () => {
    it('should build structured query from artist and album', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ 'release-groups': [], count: 0, offset: 0 })
      }
      
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response)

      await client.searchReleaseGroups('artist:"Beatles" AND releasegroup:"Abbey Road"')

      const callUrl = vi.mocked(fetch).mock.calls[0][0] as string
      // URLSearchParams encodes : as %3A and " as %22
      expect(callUrl).toContain('artist%3A%22Beatles%22')
      expect(callUrl).toContain('releasegroup%3A%22Abbey')
    })
  })
})

describe('buildSearchQuery helper', () => {
  it('should build query with both artist and album', () => {
    const query = buildSearchQuery('The Beatles', 'Abbey Road')
    expect(query).toBe('artist:"The Beatles" AND releasegroup:"Abbey Road"')
  })

  it('should build query with only artist', () => {
    const query = buildSearchQuery('The Beatles', '')
    expect(query).toBe('artist:"The Beatles"')
  })

  it('should build query with only album', () => {
    const query = buildSearchQuery('', 'Abbey Road')
    expect(query).toBe('releasegroup:"Abbey Road"')
  })

  it('should handle whitespace-only strings', () => {
    const query = buildSearchQuery('  ', '   ')
    expect(query).toBe('')
  })

  it('should trim input strings', () => {
    const query = buildSearchQuery('  Beatles  ', '  Abbey Road  ')
    expect(query).toBe('artist:"Beatles" AND releasegroup:"Abbey Road"')
  })

  it('should return empty string when both are empty', () => {
    const query = buildSearchQuery('', '')
    expect(query).toBe('')
  })
})
