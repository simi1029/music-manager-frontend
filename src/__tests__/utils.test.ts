import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cn, getBaseUrl, fetchApi, extractTracks } from '../lib/utils'

describe('cn (className merger)', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    expect(cn('foo', true && 'bar')).toBe('foo bar')
  })

  it('should handle Tailwind conflicts (twMerge)', () => {
    // twMerge deduplicates conflicting Tailwind classes
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    expect(cn('text-red-500', 'text-blue-600')).toBe('text-blue-600')
  })

  it('should handle arrays and objects', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
    expect(cn({ foo: true, bar: false })).toBe('foo')
  })

  it('should handle undefined and null', () => {
    expect(cn('foo', undefined, 'bar', null)).toBe('foo bar')
  })
})

describe('getBaseUrl', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should use NEXT_PUBLIC_BASE_URL if set', () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
    expect(getBaseUrl()).toBe('https://example.com')
  })

  it('should use VERCEL_URL if NEXT_PUBLIC_BASE_URL not set', () => {
    delete process.env.NEXT_PUBLIC_BASE_URL
    process.env.VERCEL_URL = 'my-app.vercel.app'
    expect(getBaseUrl()).toBe('https://my-app.vercel.app')
  })

  it('should default to localhost:3000', () => {
    delete process.env.NEXT_PUBLIC_BASE_URL
    delete process.env.VERCEL_URL
    expect(getBaseUrl()).toBe('http://localhost:3000')
  })

  it('should prioritize NEXT_PUBLIC_BASE_URL over VERCEL_URL', () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://custom.com'
    process.env.VERCEL_URL = 'vercel-app.vercel.app'
    expect(getBaseUrl()).toBe('https://custom.com')
  })
})

describe('fetchApi', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('should fetch and return JSON data', async () => {
    const mockData = { id: 1, name: 'Test' }
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData
    })

    const result = await fetchApi('/api/test')
    
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/test', undefined)
    expect(result).toEqual(mockData)
  })

  it('should pass options to fetch', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({})
    })

    await fetchApi('/api/test', { method: 'POST', body: '{}' })
    
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/test', 
      { method: 'POST', body: '{}' }
    )
  })

  it('should throw error on non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    })

    await expect(fetchApi('/api/missing')).rejects.toThrow(
      'Failed to fetch /api/missing: 404 Not Found'
    )
  })
})

describe('extractTracks', () => {
  it('should extract tracks from single release', () => {
    const album = {
      id: 'album1',
      releases: [
        {
          id: 'release1',
          tracks: [
            { id: 'track1', title: 'Song 1' },
            { id: 'track2', title: 'Song 2' }
          ]
        }
      ]
    }

    const tracks = extractTracks(album)
    expect(tracks).toHaveLength(2)
    expect(tracks[0].id).toBe('track1')
    expect(tracks[1].id).toBe('track2')
  })

  it('should extract tracks from multiple releases', () => {
    const album = {
      id: 'album1',
      releases: [
        {
          id: 'release1',
          tracks: [
            { id: 'track1', title: 'Song 1' },
            { id: 'track2', title: 'Song 2' }
          ]
        },
        {
          id: 'release2',
          tracks: [
            { id: 'track3', title: 'Bonus Track' }
          ]
        }
      ]
    }

    const tracks = extractTracks(album)
    expect(tracks).toHaveLength(3)
    expect(tracks.map(t => t.id)).toEqual(['track1', 'track2', 'track3'])
  })

  it('should handle releases with no tracks', () => {
    const album = {
      id: 'album1',
      releases: [
        {
          id: 'release1',
          tracks: []
        }
      ]
    }

    const tracks = extractTracks(album)
    expect(tracks).toHaveLength(0)
    expect(tracks).toEqual([])
  })

  it('should handle album with no releases', () => {
    const album = {
      id: 'album1',
      releases: []
    }

    const tracks = extractTracks(album)
    expect(tracks).toHaveLength(0)
    expect(tracks).toEqual([])
  })

  it('should preserve track properties', () => {
    const album = {
      id: 'album1',
      releases: [
        {
          id: 'release1',
          tracks: [
            { 
              id: 'track1', 
              title: 'Complex Song',
              number: 1,
              durationSec: 180,
              ratings: [{ score: 9 }]
            }
          ]
        }
      ]
    }

    const tracks = extractTracks(album)
    expect(tracks[0]).toEqual({
      id: 'track1',
      title: 'Complex Song',
      number: 1,
      durationSec: 180,
      ratings: [{ score: 9 }]
    })
  })

  it('should flatten tracks in correct order', () => {
    const album = {
      id: 'album1',
      releases: [
        {
          id: 'release1',
          tracks: [
            { id: 'A1', number: 1 },
            { id: 'A2', number: 2 }
          ]
        },
        {
          id: 'release2',
          tracks: [
            { id: 'B1', number: 1 },
            { id: 'B2', number: 2 }
          ]
        }
      ]
    }

    const tracks = extractTracks(album)
    expect(tracks.map(t => t.id)).toEqual(['A1', 'A2', 'B1', 'B2'])
  })
})
