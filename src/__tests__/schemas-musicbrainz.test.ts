import { describe, it, expect } from 'vitest'
import {
  MBSearchResponseSchema,
  MBSearchResultSchema,
  MBReleaseGroupSchema,
  MBReleaseSchema,
  MBTrackSchema,
  MBArtistCreditSchema,
  formatArtistCredit,
  extractArtists,
  extractYear,
  mapPrimaryType,
  formatDuration,
} from '@/lib/schemas/musicbrainz'

describe('MusicBrainz Zod Schemas', () => {
  describe('MBArtistCreditSchema', () => {
    it('should validate single artist credit', () => {
      const data = [
        {
          artist: {
            id: 'artist-id-1',
            name: 'The Beatles',
            'sort-name': 'Beatles, The',
          },
          name: 'The Beatles',
        }
      ]

      const result = MBArtistCreditSchema.parse(data)
      expect(result).toEqual(data)
    })

    it('should validate multi-artist credit with join phrases', () => {
      const data = [
        {
          artist: {
            id: 'artist-id-1',
            name: 'David Bowie',
          },
          name: 'David Bowie',
          joinphrase: ' & ',
        },
        {
          artist: {
            id: 'artist-id-2',
            name: 'Queen',
          },
          name: 'Queen',
        }
      ]

      const result = MBArtistCreditSchema.parse(data)
      expect(result).toEqual(data)
    })

    it('should allow optional disambiguation field', () => {
      const data = [
        {
          artist: {
            id: 'artist-id-1',
            name: 'The Beatles',
            disambiguation: 'British rock band',
          },
          name: 'The Beatles',
        }
      ]

      const result = MBArtistCreditSchema.parse(data)
      expect(result[0].artist?.disambiguation).toBe('British rock band')
    })

    it('should passthrough unknown fields', () => {
      const data = [
        {
          artist: {
            id: 'artist-id-1',
            name: 'The Beatles',
            unknownField: 'should be kept',
          },
          name: 'The Beatles',
          anotherUnknown: 'also kept',
        }
      ]

      const result = MBArtistCreditSchema.parse(data)
      expect(result[0]).toHaveProperty('anotherUnknown')
    })
  })

  describe('MBSearchResultSchema', () => {
    it('should validate valid search result', () => {
      const data = {
        id: 'release-group-id',
        title: 'Abbey Road',
        'primary-type': 'Album',
        'first-release-date': '1969-09-26',
        'artist-credit': [
          {
            artist: { id: 'artist-1', name: 'The Beatles' },
            name: 'The Beatles',
          }
        ],
      }

      const result = MBSearchResultSchema.parse(data)
      expect(result.id).toBe('release-group-id')
      expect(result.title).toBe('Abbey Road')
    })

    it('should require primary-type field', () => {
      const data = {
        id: 'release-group-id',
        title: 'Abbey Road',
        'first-release-date': '1969-09-26',
        'artist-credit': [],
      }

      expect(() => MBSearchResultSchema.parse(data)).toThrow()
    })

    it('should allow optional secondary-types', () => {
      const data = {
        id: 'rg-id',
        title: 'Live Album',
        'primary-type': 'Album',
        'first-release-date': '2000',
        'artist-credit': [],
        'secondary-types': ['Live', 'Compilation'],
      }

      const result = MBSearchResultSchema.parse(data)
      expect(result['secondary-types']).toEqual(['Live', 'Compilation'])
    })

    it('should allow optional release-count', () => {
      const data = {
        id: 'rg-id',
        title: 'Album',
        'primary-type': 'Album',
        'first-release-date': '2000',
        'artist-credit': [],
        'release-count': 5,
      }

      const result = MBSearchResultSchema.parse(data)
      expect(result['release-count']).toBe(5)
    })
  })

  describe('MBSearchResponseSchema', () => {
    it('should validate search response', () => {
      const data = {
        'release-groups': [
          {
            id: 'rg-id',
            title: 'Album',
            'primary-type': 'Album',
            'first-release-date': '2000',
            'artist-credit': [],
          }
        ],
        count: 1,
        offset: 0,
      }

      const result = MBSearchResponseSchema.parse(data)
      expect(result['release-groups']).toHaveLength(1)
      expect(result.count).toBe(1)
    })

    it('should allow empty release-groups array', () => {
      const data = {
        'release-groups': [],
        count: 0,
        offset: 0,
      }

      const result = MBSearchResponseSchema.parse(data)
      expect(result['release-groups']).toHaveLength(0)
    })
  })

  describe('MBTrackSchema', () => {
    it('should validate track with duration', () => {
      const data = {
        position: 1,
        title: 'Come Together',
        length: 259000, // 4:19 in milliseconds
      }

      const result = MBTrackSchema.parse(data)
      expect(result.position).toBe(1)
      expect(result.length).toBe(259000)
    })

    it('should allow null length', () => {
      const data = {
        position: 1,
        title: 'Unknown Duration Track',
        length: null,
      }

      const result = MBTrackSchema.parse(data)
      expect(result.length).toBeNull()
    })

    it('should allow optional recording field', () => {
      const data = {
        position: 1,
        title: 'Track Title',
        length: 200000,
        recording: {
          id: 'recording-id',
          title: 'Recording Title',
          length: 200000,
        }
      }

      const result = MBTrackSchema.parse(data)
      expect(result.recording?.id).toBe('recording-id')
    })

    it('should allow track-level artist credits', () => {
      const data = {
        position: 1,
        title: 'Featured Track',
        length: 200000,
        recording: {
          id: 'rec-id',
          title: 'Track',
          length: 200000,
          'artist-credit': [
            {
              artist: { id: 'artist-1', name: 'Main Artist' },
              name: 'Main Artist',
              joinphrase: ' feat. ',
            },
            {
              artist: { id: 'artist-2', name: 'Featured Artist' },
              name: 'Featured Artist',
            }
          ]
        }
      }

      const result = MBTrackSchema.parse(data)
      expect(result.recording?.['artist-credit']).toHaveLength(2)
    })
  })

  describe('MBReleaseSchema', () => {
    it('should validate complete release', () => {
      const data = {
        id: 'release-id',
        title: 'Abbey Road',
        date: '1969-09-26',
        'artist-credit': [],
        media: [
          {
            'track-count': 2,
            tracks: [
              { position: 1, title: 'Track 1', length: 200000 },
              { position: 2, title: 'Track 2', length: 180000 },
            ]
          }
        ]
      }

      const result = MBReleaseSchema.parse(data)
      expect(result.id).toBe('release-id')
      expect(result.media).toHaveLength(1)
      expect(result.media[0].tracks).toHaveLength(2)
    })

    it('should allow nullable barcode', () => {
      const data = {
        id: 'release-id',
        title: 'Album',
        date: '2000',
        'artist-credit': [],
        media: [],
        barcode: null,
      }

      const result = MBReleaseSchema.parse(data)
      expect(result.barcode).toBeNull()
    })

    it('should allow optional label-info', () => {
      const data = {
        id: 'release-id',
        title: 'Album',
        date: '2000',
        'artist-credit': [],
        media: [],
        'label-info': [
          {
            'catalog-number': 'CAT-123',
            label: {
              id: 'label-id',
              name: 'Label Name',
            }
          }
        ]
      }

      const result = MBReleaseSchema.parse(data)
      expect(result['label-info']?.[0]['catalog-number']).toBe('CAT-123')
    })
  })

  describe('MBReleaseGroupSchema', () => {
    it('should validate release group with releases', () => {
      const data = {
        id: 'rg-id',
        title: 'Album Title',
        'primary-type': 'Album',
        'first-release-date': '2000',
        'artist-credit': [],
        releases: [
          {
            id: 'release-1',
            title: 'Album Title',
          }
        ]
      }

      const result = MBReleaseGroupSchema.parse(data)
      expect(result.releases).toHaveLength(1)
    })
  })
})

describe('Helper Functions', () => {
  describe('formatArtistCredit', () => {
    it('should format single artist', () => {
      const credit = [
        {
          artist: { id: '1', name: 'The Beatles' },
          name: 'The Beatles',
        }
      ]

      expect(formatArtistCredit(credit)).toBe('The Beatles')
    })

    it('should format multiple artists with join phrases', () => {
      const credit = [
        {
          artist: { id: '1', name: 'David Bowie' },
          name: 'David Bowie',
          joinphrase: ' & ',
        },
        {
          artist: { id: '2', name: 'Queen' },
          name: 'Queen',
        }
      ]

      expect(formatArtistCredit(credit)).toBe('David Bowie & Queen')
    })

    it('should handle featuring credits', () => {
      const credit = [
        {
          artist: { id: '1', name: 'Main Artist' },
          name: 'Main Artist',
          joinphrase: ' feat. ',
        },
        {
          artist: { id: '2', name: 'Featured Artist' },
          name: 'Featured Artist',
        }
      ]

      expect(formatArtistCredit(credit)).toBe('Main Artist feat. Featured Artist')
    })

    it('should trim trailing whitespace', () => {
      const credit = [
        {
          artist: { id: '1', name: 'Artist' },
          name: 'Artist',
        }
      ]

      expect(formatArtistCredit(credit)).toBe('Artist')
    })
  })

  describe('extractArtists', () => {
    it('should extract single artist', () => {
      const credit = [
        {
          artist: {
            id: 'artist-1',
            name: 'The Beatles',
            'sort-name': 'Beatles, The',
          },
          name: 'The Beatles',
        }
      ]

      const artists = extractArtists(credit)
      expect(artists).toHaveLength(1)
      expect(artists[0]).toEqual({
        mbid: 'artist-1',
        name: 'The Beatles',
        sortName: 'Beatles, The',
      })
    })

    it('should extract multiple artists', () => {
      const credit = [
        {
          artist: {
            id: 'artist-1',
            name: 'David Bowie',
            'sort-name': 'Bowie, David',
          },
          name: 'David Bowie',
          joinphrase: ' & ',
        },
        {
          artist: {
            id: 'artist-2',
            name: 'Queen',
          },
          name: 'Queen',
        }
      ]

      const artists = extractArtists(credit)
      expect(artists).toHaveLength(2)
      expect(artists[0].mbid).toBe('artist-1')
      expect(artists[1].mbid).toBe('artist-2')
    })

    it('should use name as sortName when sort-name is missing', () => {
      const credit = [
        {
          artist: {
            id: 'artist-1',
            name: 'Queen',
          },
          name: 'Queen',
        }
      ]

      const artists = extractArtists(credit)
      expect(artists[0].sortName).toBe('Queen')
    })

    it('should skip items without artist object', () => {
      const credit = [
        {
          artist: {
            id: 'artist-1',
            name: 'Artist',
          },
          name: 'Artist',
          joinphrase: ' & ',
        },
        {
          // This is a joinphrase-only item
          name: 'Something',
        }
      ]

      const artists = extractArtists(credit)
      expect(artists).toHaveLength(1)
    })
  })

  describe('extractYear', () => {
    it('should extract year from full date', () => {
      expect(extractYear('1969-09-26')).toBe(1969)
    })

    it('should extract year from year-only string', () => {
      expect(extractYear('1969')).toBe(1969)
    })

    it('should extract year from year-month string', () => {
      expect(extractYear('1969-09')).toBe(1969)
    })

    it('should return null for undefined', () => {
      expect(extractYear(undefined)).toBeNull()
    })

    it('should return null for empty string', () => {
      expect(extractYear('')).toBeNull()
    })

    it('should return null for invalid date format', () => {
      expect(extractYear('invalid')).toBeNull()
    })
  })

  describe('mapPrimaryType', () => {
    it('should map Album type', () => {
      expect(mapPrimaryType('Album')).toBe('ALBUM')
    })

    it('should map Single type', () => {
      expect(mapPrimaryType('Single')).toBe('SINGLE')
    })

    it('should map EP type', () => {
      expect(mapPrimaryType('EP')).toBe('EP')
    })

    it('should map Compilation type', () => {
      expect(mapPrimaryType('Compilation')).toBe('COMPILATION')
    })

    it('should map Live type', () => {
      expect(mapPrimaryType('Live')).toBe('LIVE')
    })

    it('should map Soundtrack type', () => {
      expect(mapPrimaryType('Soundtrack')).toBe('SOUNDTRACK')
    })

    it('should map Broadcast to OTHER', () => {
      expect(mapPrimaryType('Broadcast')).toBe('OTHER')
    })

    it('should map Other type', () => {
      expect(mapPrimaryType('Other')).toBe('OTHER')
    })

    it('should map unknown types to OTHER', () => {
      expect(mapPrimaryType('UnknownType')).toBe('OTHER')
    })
  })

  describe('formatDuration', () => {
    it('should format milliseconds to mm:ss', () => {
      expect(formatDuration(259000)).toBe('4:19')
    })

    it('should pad seconds with zero', () => {
      expect(formatDuration(125000)).toBe('2:05')
    })

    it('should handle zero duration', () => {
      expect(formatDuration(0)).toBe('0:00')
    })

    it('should return em dash for null', () => {
      expect(formatDuration(null)).toBe('—')
    })

    it('should round seconds', () => {
      expect(formatDuration(259999)).toBe('4:20') // 259.999 seconds -> 260 -> 4:20
    })

    it('should handle long durations', () => {
      expect(formatDuration(3600000)).toBe('60:00') // 1 hour
    })
  })
})
