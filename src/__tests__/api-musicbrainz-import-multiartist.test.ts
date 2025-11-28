/**
 * Tests for MusicBrainz Import with Multi-Artist Support
 * 
 * Tests cover:
 * - Multi-artist album import
 * - Artist matching by MusicBrainz ID
 * - Artist credit formatting
 * - Junction table creation
 * - Collaboration display
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/(api)/api/musicbrainz/import/route'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'

// Mock dependencies
vi.mock('next-auth')
vi.mock('@/lib/db', () => ({
  prisma: {
    externalRef: {
      findFirst: vi.fn(),
    },
    artist: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    releaseGroup: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
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

describe('MusicBrainz Import - Multi-Artist Support', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock authenticated session
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
      expires: '2024-12-31',
    })
  })

  it('should import multi-artist album with proper artist credit', async () => {
    const mockRequest = {
      json: async () => ({
        releaseId: 'release-123',
        releaseGroupId: 'rg-123',
      }),
    } as any

    // Mock no existing import
    vi.mocked(prisma.releaseGroup.findUnique).mockResolvedValue(null)

    // Mock MusicBrainz response with multi-artist data
    mockGetRelease.mockResolvedValue({
      id: 'release-123',
      title: 'Under Pressure',
      'artist-credit': [
        {
          artist: {
            id: 'mbid-bowie',
            name: 'David Bowie',
            'sort-name': 'Bowie, David',
          },
          name: 'David Bowie',
          joinphrase: ' & ',
        },
        {
          artist: {
            id: 'mbid-queen',
            name: 'Queen',
            'sort-name': 'Queen',
          },
          name: 'Queen',
          joinphrase: '',
        },
      ],
      'release-group': {
        id: 'rg-123',
        'primary-type': 'Single',
      },
      date: '1981',
      media: [
        {
          'track-count': 1,
          tracks: [
            {
              title: 'Under Pressure',
              position: 1,
              length: 248000,
            },
          ],
        },
      ],
    })

    // Mock artist lookups - neither exist yet
    vi.mocked(prisma.artist.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.artist.findFirst).mockResolvedValue(null)

    // Mock artist creation
    vi.mocked(prisma.artist.create)
      .mockResolvedValueOnce({
        id: 'artist-bowie',
        name: 'David Bowie',
        sortName: 'Bowie, David',
        musicbrainzId: 'mbid-bowie',
        country: null,
        notes: null,
        imageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .mockResolvedValueOnce({
        id: 'artist-queen',
        name: 'Queen',
        sortName: 'Queen',
        musicbrainzId: 'mbid-queen',
        country: null,
        notes: null,
        imageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

    // Mock release group creation
    vi.mocked(prisma.releaseGroup.create).mockResolvedValue({
      id: 'rg-1',
      title: 'Under Pressure',
      year: 1981,
      primaryType: 'SINGLE',
      artistId: 'artist-bowie',
      artistCredit: 'David Bowie & Queen',
      isClassical: false,
      composer: null,
      work: null,
      movement: null,
      ensemble: null,
      conductor: null,
      soloist: null,
      coverValue: null,
      productionValue: null,
      mixValue: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      releases: [
        {
          id: 'release-1',
          title: 'Under Pressure',
          releaseGroupId: 'rg-1',
          date: null,
          label: null,
          barcode: null,
          catalogNo: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          tracks: [
            {
              id: 'track-1',
              number: 1,
              title: 'Under Pressure',
              durationSec: 248,
              releaseId: 'release-1',
              createdAt: new Date(),
            },
          ],
        },
      ],
    } as any)

    const response = await POST(mockRequest)
    const data = await response.json()

    // Verify both artists were created
    expect(prisma.artist.create).toHaveBeenCalledTimes(2)
    expect(prisma.artist.create).toHaveBeenCalledWith({
      data: {
        name: 'David Bowie',
        sortName: 'Bowie, David',
        musicbrainzId: 'mbid-bowie',
        country: null,
      },
    })
    expect(prisma.artist.create).toHaveBeenCalledWith({
      data: {
        name: 'Queen',
        sortName: 'Queen',
        musicbrainzId: 'mbid-queen',
        country: null,
      },
    })

    // Verify release group created with multi-artist data
    expect(prisma.releaseGroup.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          artists: {
            create: [
              {
                artistId: 'artist-bowie',
                position: 0,
                joinPhrase: ' & ',
              },
              {
                artistId: 'artist-queen',
                position: 1,
                joinPhrase: null,
              },
            ],
          },
        }),
      })
    )

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should match artists by MusicBrainz ID', async () => {
    const mockRequest = {
      json: async () => ({
        releaseId: 'release-456',
        releaseGroupId: 'rg-456',
      }),
    } as any

    vi.mocked(prisma.releaseGroup.findUnique).mockResolvedValue(null)

    mockGetRelease.mockResolvedValue({
      id: 'release-456',
      title: 'Test Album',
      'artist-credit': [
        {
          artist: {
            id: 'mbid-existing',
            name: 'Existing Artist',
            'sort-name': 'Artist, Existing',
          },
          name: 'Existing Artist',
          joinphrase: '',
        },
      ],
      'release-group': {
        id: 'rg-456',
        'primary-type': 'Album',
      },
      date: '2024',
      media: [{ 'track-count': 1, tracks: [{ title: 'Track 1', position: 1, length: 180000 }] }],
    })

    // Mock artist found by MBID
    vi.mocked(prisma.artist.findUnique).mockResolvedValue({
      id: 'artist-existing',
      name: 'Existing Artist',
      sortName: 'Artist, Existing',
      musicbrainzId: 'mbid-existing',
      country: null,
      notes: null,
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.mocked(prisma.releaseGroup.create).mockResolvedValue({
      id: 'rg-2',
      releases: [{ tracks: [] }],
    } as any)

    await POST(mockRequest)

    // Should match by MBID
    expect(prisma.artist.findUnique).toHaveBeenCalledWith({
      where: { musicbrainzId: 'mbid-existing' },
    })

    // Should NOT create new artist
    expect(prisma.artist.create).not.toHaveBeenCalled()
  })

  it('should update existing artist with MusicBrainz ID if missing', async () => {
    const mockRequest = {
      json: async () => ({
        releaseId: 'release-789',
        releaseGroupId: 'rg-789',
      }),
    } as any

    vi.mocked(prisma.releaseGroup.findUnique).mockResolvedValue(null)

    mockGetRelease.mockResolvedValue({
      id: 'release-789',
      title: 'Test Album',
      'artist-credit': [
        {
          artist: {
            id: 'mbid-new',
            name: 'Test Artist',
            'sort-name': 'Artist, Test',
          },
          name: 'Test Artist',
          joinphrase: '',
        },
      ],
      'release-group': {
        id: 'rg-789',
        'primary-type': 'Album',
      },
      date: '2024',
      media: [{ 'track-count': 1, tracks: [{ title: 'Track 1', position: 1, length: 180000 }] }],
    })

    // Not found by MBID
    vi.mocked(prisma.artist.findUnique).mockResolvedValue(null)

    // Found by name but missing MBID
    vi.mocked(prisma.artist.findFirst).mockResolvedValue({
      id: 'artist-test',
      name: 'Test Artist',
      sortName: 'Artist, Test',
      musicbrainzId: null,
      country: null,
      notes: null,
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Mock update
    vi.mocked(prisma.artist.update).mockResolvedValue({
      id: 'artist-test',
      name: 'Test Artist',
      sortName: 'Artist, Test',
      musicbrainzId: 'mbid-new',
      country: null,
      notes: null,
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.mocked(prisma.releaseGroup.create).mockResolvedValue({
      id: 'rg-3',
      releases: [{ tracks: [] }],
    } as any)

    await POST(mockRequest)

    // Should update artist with MBID
    expect(prisma.artist.update).toHaveBeenCalledWith({
      where: { id: 'artist-test' },
      data: { musicbrainzId: 'mbid-new' },
    })

    // Should NOT create new artist
    expect(prisma.artist.create).not.toHaveBeenCalled()
  })

  it('should handle artist credit with multiple join phrases', async () => {
    const mockRequest = {
      json: async () => ({
        releaseId: 'release-multi',
        releaseGroupId: 'rg-multi',
      }),
    } as any

    vi.mocked(prisma.releaseGroup.findUnique).mockResolvedValue(null)

    mockGetRelease.mockResolvedValue({
      id: 'release-multi',
      title: 'Collaboration Album',
      'artist-credit': [
        {
          artist: { id: 'a1', name: 'Artist One', 'sort-name': 'One, Artist' },
          name: 'Artist One',
          joinphrase: ' feat. ',
        },
        {
          artist: { id: 'a2', name: 'Artist Two', 'sort-name': 'Two, Artist' },
          name: 'Artist Two',
          joinphrase: ' & ',
        },
        {
          artist: { id: 'a3', name: 'Artist Three', 'sort-name': 'Three, Artist' },
          name: 'Artist Three',
          joinphrase: '',
        },
      ],
      'release-group': {
        id: 'rg-multi',
        'primary-type': 'Album',
      },
      date: '2024',
      media: [{ 'track-count': 1, tracks: [{ title: 'Track 1', position: 1, length: 180000 }] }],
    })

    vi.mocked(prisma.artist.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.artist.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.artist.create)
      .mockResolvedValueOnce({ id: 'a1', name: 'Artist One', musicbrainzId: 'a1' } as any)
      .mockResolvedValueOnce({ id: 'a2', name: 'Artist Two', musicbrainzId: 'a2' } as any)
      .mockResolvedValueOnce({ id: 'a3', name: 'Artist Three', musicbrainzId: 'a3' } as any)

    vi.mocked(prisma.releaseGroup.create).mockResolvedValue({
      id: 'rg-4',
      releases: [{ tracks: [] }],
    } as any)

    await POST(mockRequest)

    // Verify artist credit formatted correctly
    expect(prisma.releaseGroup.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          artists: {
            create: [
              { artistId: 'a1', position: 0, joinPhrase: ' feat. ' },
              { artistId: 'a2', position: 1, joinPhrase: ' & ' },
              { artistId: 'a3', position: 2, joinPhrase: null },
            ],
          },
        }),
      })
    )
  })
})
