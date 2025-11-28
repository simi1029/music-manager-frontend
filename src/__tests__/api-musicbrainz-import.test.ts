import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/(api)/api/musicbrainz/import/route'
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
  },
  extractArtists: vi.fn((artistCredit) => [
    { mbid: 'artist-1', name: 'David Bowie', sortName: 'Bowie, David' }
  ]),
  extractYear: vi.fn((date) => date ? parseInt(date.split('-')[0]) : null),
  mapPrimaryType: vi.fn((type) => type?.toUpperCase() || 'ALBUM')
}))

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    externalRef: {
      findFirst: vi.fn()
    },
    artist: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    releaseGroup: {
      findUnique: vi.fn(),
      create: vi.fn()
    }
  }
}))

import { getServerSession } from 'next-auth'
import { MBReleaseSchema, extractArtists, extractYear, mapPrimaryType } from '@/lib/schemas/musicbrainz'
import { MusicBrainzClient } from '@/lib/musicbrainz'
import { prisma } from '@/lib/db'

describe('POST /api/musicbrainz/import', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.artist.findUnique).mockResolvedValue(null)
  })

  it('should return 401 when user is not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/musicbrainz/import', {
      method: 'POST',
      body: JSON.stringify({ releaseId: '123', releaseGroupId: '456' })
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toEqual({ error: 'Unauthorized' })
  })

  it('should return 400 when releaseId is missing', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
      expires: '2024-12-31'
    })

    const request = new NextRequest('http://localhost:3000/api/musicbrainz/import', {
      method: 'POST',
      body: JSON.stringify({ releaseGroupId: '456' })
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('VALIDATION_ERROR')
    expect(data.message).toContain('required')
  })

  it('should return 400 when releaseGroupId is missing', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
      expires: '2024-12-31'
    })

    const request = new NextRequest('http://localhost:3000/api/musicbrainz/import', {
      method: 'POST',
      body: JSON.stringify({ releaseId: '123' })
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('VALIDATION_ERROR')
    expect(data.message).toContain('required')
  })

  it('should return 409 when album already imported', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
      expires: '2024-12-31'
    })

    vi.mocked(prisma.releaseGroup.findUnique).mockResolvedValue({
      id: 'existing-album-1',
      title: 'Test Album',
      primaryType: 'ALBUM',
      year: 2020,
      isClassical: false,
      composer: null,
      work: null,
      movement: null,
      ensemble: null,
      conductor: null,
      soloist: null,
      musicbrainzId: 'rg-456',
      coverValue: null,
      productionValue: null,
      mixValue: null,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const request = new NextRequest('http://localhost:3000/api/musicbrainz/import', {
      method: 'POST',
      body: JSON.stringify({ releaseId: 'rel-123', releaseGroupId: 'rg-456' })
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toBe('DUPLICATE')
    expect(data.existingAlbumId).toBe('existing-album-1')
  })

  it('should successfully import a new album', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
      expires: '2024-12-31'
    })

    vi.mocked(prisma.releaseGroup.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.artist.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.artist.findFirst).mockResolvedValue(null)
    
    vi.mocked(prisma.artist.create).mockResolvedValue({
      id: 'new-artist-1',
      name: 'David Bowie',
      sortName: 'Bowie, David',
      musicbrainzId: null,
      country: null,
      notes: null,
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const mockRelease = {
      id: 'rel-123',
      title: 'Ziggy Stardust',
      date: '1972-06-16',
      'artist-credit': [{ artist: { id: 'artist-1', name: 'David Bowie' }, name: 'David Bowie' }],
      'release-group': { id: 'rg-456', 'primary-type': 'Album' },
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

    vi.mocked(prisma.releaseGroup.create).mockResolvedValue({
      id: 'new-album-1',
      title: 'Ziggy Stardust',
      year: 1972,
      primaryType: 'ALBUM' as any,
      isClassical: false,
      composer: null,
      work: null,
      movement: null,
      ensemble: null,
      conductor: null,
      soloist: null,
      artistId: 'new-artist-1',
      coverValue: null,
      productionValue: null,
      mixValue: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      releases: [
        {
          id: 'release-1',
          title: 'Ziggy Stardust',
          releaseGroupId: 'new-album-1',
          date: new Date('1972-06-16'),
          barcode: null,
          label: null,
          catalogNo: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          tracks: [
            { id: 'track-1', number: 1, title: 'Five Years', durationSec: 258, releaseId: 'release-1', createdAt: new Date(), updatedAt: new Date() },
            { id: 'track-2', number: 2, title: 'Soul Love', durationSec: 213, releaseId: 'release-1', createdAt: new Date(), updatedAt: new Date() }
          ]
        }
      ] as any
    } as any)

    const request = new NextRequest('http://localhost:3000/api/musicbrainz/import', {
      method: 'POST',
      body: JSON.stringify({ releaseId: 'rel-123', releaseGroupId: 'rg-456' })
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(vi.mocked(prisma.artist.create)).toHaveBeenCalled()
  })

  it('should use existing artist if found', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
      expires: '2024-12-31'
    })

    vi.mocked(prisma.releaseGroup.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.artist.findUnique).mockResolvedValue(null)
    
    vi.mocked(prisma.artist.findFirst).mockResolvedValue({
      id: 'existing-artist-1',
      name: 'David Bowie',
      sortName: 'Bowie, David',
      musicbrainzId: null,
      country: null,
      notes: null,
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    vi.mocked(prisma.artist.update).mockResolvedValue({
      id: 'existing-artist-1',
      name: 'David Bowie',
      sortName: 'Bowie, David',
      musicbrainzId: 'artist-1',
      country: null,
      notes: null,
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const mockRelease = {
      id: 'rel-123',
      title: 'Ziggy Stardust',
      date: '1972-06-16',
      'artist-credit': [{ artist: { id: 'artist-1', name: 'David Bowie' }, name: 'David Bowie' }],
      'release-group': { id: 'rg-456', 'primary-type': 'Album' },
      media: [
        {
          tracks: [
            { position: 1, title: 'Five Years', length: 258000 }
          ]
        }
      ]
    }

    mockGetRelease.mockResolvedValue(mockRelease)

    vi.mocked(prisma.releaseGroup.create).mockResolvedValue({
      id: 'new-album-1',
      title: 'Ziggy Stardust',
      year: 1972,
      primaryType: 'ALBUM' as any,
      isClassical: false,
      composer: null,
      work: null,
      movement: null,
      ensemble: null,
      conductor: null,
      soloist: null,
      artistId: 'existing-artist-1',
      coverValue: null,
      productionValue: null,
      mixValue: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      releases: [] as any
    } as any)

    const request = new NextRequest('http://localhost:3000/api/musicbrainz/import', {
      method: 'POST',
      body: JSON.stringify({ releaseId: 'rel-123', releaseGroupId: 'rg-456' })
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(vi.mocked(prisma.artist.create)).not.toHaveBeenCalled()
    expect(vi.mocked(prisma.artist.update)).toHaveBeenCalledWith({
      where: { id: 'existing-artist-1' },
      data: { musicbrainzId: 'artist-1' }
    })
  })

  it('should handle tracks with null duration', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
      expires: '2024-12-31'
    })

    vi.mocked(prisma.releaseGroup.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.artist.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.artist.findFirst).mockResolvedValue({
      id: 'artist-1',
      name: 'David Bowie',
      sortName: 'Bowie, David',
      musicbrainzId: null,
      country: null,
      notes: null,
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const mockRelease = {
      id: 'rel-123',
      title: 'Ziggy Stardust',
      date: '1972-06-16',
      'artist-credit': [{ artist: { id: 'artist-1', name: 'David Bowie' }, name: 'David Bowie' }],
      'release-group': { id: 'rg-456', 'primary-type': 'Album' },
      media: [
        {
          tracks: [
            { position: 1, title: 'Five Years', length: null },
            { position: 2, title: 'Soul Love', length: 213000 }
          ]
        }
      ]
    }

    mockGetRelease.mockResolvedValue(mockRelease)

    vi.mocked(prisma.releaseGroup.create).mockResolvedValue({
      id: 'new-album-1',
      title: 'Ziggy Stardust',
      year: 1972,
      primaryType: 'ALBUM' as any,
      isClassical: false,
      composer: null,
      work: null,
      movement: null,
      ensemble: null,
      conductor: null,
      soloist: null,
      artistId: 'artist-1',
      coverValue: null,
      productionValue: null,
      mixValue: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      releases: [
        {
          id: 'release-1',
          title: 'Ziggy Stardust',
          releaseGroupId: 'new-album-1',
          date: new Date('1972-06-16'),
          barcode: null,
          label: null,
          catalogNo: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          tracks: [
            { id: 'track-1', number: 1, title: 'Five Years', durationSec: null, releaseId: 'release-1', createdAt: new Date(), updatedAt: new Date() },
            { id: 'track-2', number: 2, title: 'Soul Love', durationSec: 213, releaseId: 'release-1', createdAt: new Date(), updatedAt: new Date() }
          ]
        }
      ] as any
    } as any)

    const request = new NextRequest('http://localhost:3000/api/musicbrainz/import', {
      method: 'POST',
      body: JSON.stringify({ releaseId: 'rel-123', releaseGroupId: 'rg-456' })
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.warnings).toBeDefined()
    expect(data.tracksWithNullDuration).toBeDefined()
    expect(data.tracksWithNullDuration.length).toBe(1)
    expect(data.tracksWithNullDuration[0].title).toBe('Five Years')
  })

  it('should convert track duration from milliseconds to seconds', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
      expires: '2024-12-31'
    })

    vi.mocked(prisma.releaseGroup.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.artist.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.artist.findFirst).mockResolvedValue({
      id: 'artist-1',
      name: 'David Bowie',
      sortName: 'Bowie, David',
      musicbrainzId: null,
      country: null,
      notes: null,
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const mockRelease = {
      id: 'rel-123',
      title: 'Ziggy Stardust',
      date: '1972-06-16',
      'artist-credit': [{ artist: { id: 'artist-1', name: 'David Bowie' }, name: 'David Bowie' }],
      'release-group': { id: 'rg-456', 'primary-type': 'Album' },
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

    let capturedTrackData: any[] = []
    vi.mocked(prisma.releaseGroup.create).mockImplementation((options: any) => {
      capturedTrackData = options.data.releases.create.tracks.create
      return Promise.resolve({
        id: 'new-album-1',
        title: 'Ziggy Stardust',
        year: 1972,
        primaryType: 'ALBUM' as any,
        isClassical: false,
        composer: null,
        work: null,
        movement: null,
        ensemble: null,
        conductor: null,
        soloist: null,
        artistId: 'artist-1',
        coverValue: null,
        productionValue: null,
        mixValue: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        releases: [] as any
      }) as any
    })

    const request = new NextRequest('http://localhost:3000/api/musicbrainz/import', {
      method: 'POST',
      body: JSON.stringify({ releaseId: 'rel-123', releaseGroupId: 'rg-456' })
    })
    await POST(request)

    expect(capturedTrackData[0].durationSec).toBe(258)
    expect(capturedTrackData[1].durationSec).toBe(213)
  })

  it('should create ExternalRef with musicbrainzId', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
      expires: '2024-12-31'
    })

    vi.mocked(prisma.releaseGroup.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.artist.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.artist.findFirst).mockResolvedValue({
      id: 'artist-1',
      name: 'David Bowie',
      sortName: 'Bowie, David',
      musicbrainzId: null,
      country: null,
      notes: null,
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const mockRelease = {
      id: 'rel-123',
      title: 'Ziggy Stardust',
      date: '1972-06-16',
      'artist-credit': [{ artist: { id: 'artist-1', name: 'David Bowie' }, name: 'David Bowie' }],
      'release-group': { id: 'rg-456', 'primary-type': 'Album' },
      media: [
        {
          tracks: [
            { position: 1, title: 'Five Years', length: 258000 }
          ]
        }
      ]
    }

    mockGetRelease.mockResolvedValue(mockRelease)

    let capturedExternalRefData: any
    vi.mocked(prisma.releaseGroup.create).mockImplementation((options: any) => {
      capturedExternalRefData = options.data.external.create
      return Promise.resolve({
        id: 'new-album-1',
        title: 'Ziggy Stardust',
        year: 1972,
        primaryType: 'ALBUM' as any,
        isClassical: false,
        composer: null,
        work: null,
        movement: null,
        ensemble: null,
        conductor: null,
        soloist: null,
        artistId: 'artist-1',
        coverValue: null,
        productionValue: null,
        mixValue: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        releases: [] as any
      }) as any
    })

    const request = new NextRequest('http://localhost:3000/api/musicbrainz/import', {
      method: 'POST',
      body: JSON.stringify({ releaseId: 'rel-123', releaseGroupId: 'rg-456' })
    })
    await POST(request)

    expect(capturedExternalRefData.musicbrainzId).toBe('rg-456')
  })

  it('should extract year from release date', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
      expires: '2024-12-31'
    })

    vi.mocked(prisma.releaseGroup.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.artist.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.artist.findFirst).mockResolvedValue({
      id: 'artist-1',
      name: 'David Bowie',
      sortName: 'Bowie, David',
      musicbrainzId: null,
      country: null,
      notes: null,
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const mockRelease = {
      id: 'rel-123',
      title: 'Ziggy Stardust',
      date: '1972-06-16',
      'artist-credit': [{ artist: { id: 'artist-1', name: 'David Bowie' }, name: 'David Bowie' }],
      'release-group': { id: 'rg-456', 'primary-type': 'Album' },
      media: [
        {
          tracks: [
            { position: 1, title: 'Five Years', length: 258000 }
          ]
        }
      ]
    }

    mockGetRelease.mockResolvedValue(mockRelease)

    let capturedYear: number | null = null
    vi.mocked(prisma.releaseGroup.create).mockImplementation((options: any) => {
      capturedYear = options.data.year
      return Promise.resolve({
        id: 'new-album-1',
        title: 'Ziggy Stardust',
        year: 1972,
        primaryType: 'ALBUM' as any,
        isClassical: false,
        composer: null,
        work: null,
        movement: null,
        ensemble: null,
        conductor: null,
        soloist: null,
        artistId: 'artist-1',
        coverValue: null,
        productionValue: null,
        mixValue: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        releases: [] as any
      }) as any
    })

    const request = new NextRequest('http://localhost:3000/api/musicbrainz/import', {
      method: 'POST',
      body: JSON.stringify({ releaseId: 'rel-123', releaseGroupId: 'rg-456' })
    })
    await POST(request)

    expect(capturedYear).toBe(1972)
  })

  it('should return 404 when release not found', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
      expires: '2024-12-31'
    })

    vi.mocked(prisma.releaseGroup.findUnique).mockResolvedValue(null)

    mockGetRelease.mockRejectedValue(new Error('Release not found'))

    const request = new NextRequest('http://localhost:3000/api/musicbrainz/import', {
      method: 'POST',
      body: JSON.stringify({ releaseId: 'invalid-id', releaseGroupId: 'rg-456' })
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('NOT_FOUND')
    expect(data.message).toBe('Album not found in MusicBrainz')
  })

  it('should return 500 for general import errors', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
      expires: '2024-12-31'
    })

    vi.mocked(prisma.externalRef.findFirst).mockResolvedValue(null)

    mockGetRelease.mockRejectedValue(new Error('Network error'))

    const request = new NextRequest('http://localhost:3000/api/musicbrainz/import', {
      method: 'POST',
      body: JSON.stringify({ releaseId: 'rel-123', releaseGroupId: 'rg-456' })
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('IMPORT_ERROR')
    expect(data.message).toBe('Failed to import album')
  })
})

