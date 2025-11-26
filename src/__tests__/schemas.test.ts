import { describe, it, expect } from 'vitest'
import { RatingCreate, ReleasesQuery } from '../lib/schemas'
import { ZodError } from 'zod'

describe('RatingCreate schema', () => {
  describe('valid data', () => {
    it('should accept valid rating with all fields', () => {
      const validData = {
        trackId: 'track123',
        score: 8,
        review: 'Great song!'
      }

      const result = RatingCreate.parse(validData)
      expect(result).toEqual(validData)
    })

    it('should accept valid rating without optional review', () => {
      const validData = {
        trackId: 'track456',
        score: 5
      }

      const result = RatingCreate.parse(validData)
      expect(result).toEqual(validData)
    })

    it('should accept minimum score (0)', () => {
      const result = RatingCreate.parse({
        trackId: 'track789',
        score: 0
      })
      expect(result.score).toBe(0)
    })

    it('should accept maximum score (10)', () => {
      const result = RatingCreate.parse({
        trackId: 'track789',
        score: 10
      })
      expect(result.score).toBe(10)
    })

    it('should accept empty string review', () => {
      const result = RatingCreate.parse({
        trackId: 'track123',
        score: 7,
        review: ''
      })
      expect(result.review).toBe('')
    })

    it('should accept long review (up to 5000 chars)', () => {
      const longReview = 'a'.repeat(5000)
      const result = RatingCreate.parse({
        trackId: 'track123',
        score: 7,
        review: longReview
      })
      expect(result.review).toBe(longReview)
    })
  })

  describe('invalid data - trackId', () => {
    it('should reject empty trackId', () => {
      expect(() => 
        RatingCreate.parse({
          trackId: '',
          score: 5
        })
      ).toThrow(ZodError)
    })

    it('should reject missing trackId', () => {
      expect(() => 
        RatingCreate.parse({
          score: 5
        })
      ).toThrow(ZodError)
    })

    it('should reject null trackId', () => {
      expect(() => 
        RatingCreate.parse({
          trackId: null,
          score: 5
        })
      ).toThrow(ZodError)
    })

    it('should reject non-string trackId', () => {
      expect(() => 
        RatingCreate.parse({
          trackId: 123,
          score: 5
        })
      ).toThrow(ZodError)
    })
  })

  describe('invalid data - score', () => {
    it('should reject score below 0', () => {
      expect(() => 
        RatingCreate.parse({
          trackId: 'track123',
          score: -1
        })
      ).toThrow(ZodError)
    })

    it('should reject score above 10', () => {
      expect(() => 
        RatingCreate.parse({
          trackId: 'track123',
          score: 11
        })
      ).toThrow(ZodError)
    })

    it('should reject decimal score', () => {
      expect(() => 
        RatingCreate.parse({
          trackId: 'track123',
          score: 7.5
        })
      ).toThrow(ZodError)
    })

    it('should reject missing score', () => {
      expect(() => 
        RatingCreate.parse({
          trackId: 'track123'
        })
      ).toThrow(ZodError)
    })

    it('should reject string score', () => {
      expect(() => 
        RatingCreate.parse({
          trackId: 'track123',
          score: '8'
        })
      ).toThrow(ZodError)
    })

    it('should reject null score', () => {
      expect(() => 
        RatingCreate.parse({
          trackId: 'track123',
          score: null
        })
      ).toThrow(ZodError)
    })
  })

  describe('invalid data - review', () => {
    it('should reject review longer than 5000 chars', () => {
      const tooLongReview = 'a'.repeat(5001)
      
      expect(() => 
        RatingCreate.parse({
          trackId: 'track123',
          score: 7,
          review: tooLongReview
        })
      ).toThrow(ZodError)
    })

    it('should reject non-string review', () => {
      expect(() => 
        RatingCreate.parse({
          trackId: 'track123',
          score: 7,
          review: 123
        })
      ).toThrow(ZodError)
    })
  })

  describe('safeParse for error inspection', () => {
    it('should provide detailed error messages', () => {
      const result = RatingCreate.safeParse({
        trackId: '',
        score: -5
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toHaveLength(2)
        expect(result.error.issues[0].path).toContain('trackId')
        expect(result.error.issues[1].path).toContain('score')
      }
    })

    it('should return parsed data on success', () => {
      const result = RatingCreate.safeParse({
        trackId: 'track123',
        score: 8
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.trackId).toBe('track123')
        expect(result.data.score).toBe(8)
      }
    })
  })
})

describe('ReleasesQuery schema', () => {
  describe('valid data', () => {
    it('should accept empty query (all fields optional)', () => {
      const result = ReleasesQuery.parse({})
      expect(result).toEqual({})
    })

    it('should accept artist only', () => {
      const result = ReleasesQuery.parse({
        artist: 'The Beatles'
      })
      expect(result).toEqual({ artist: 'The Beatles' })
    })

    it('should accept year only', () => {
      const result = ReleasesQuery.parse({
        year: 1969
      })
      expect(result).toEqual({ year: 1969 })
    })

    it('should accept sort only', () => {
      const result = ReleasesQuery.parse({
        sort: 'rating'
      })
      expect(result).toEqual({ sort: 'rating' })
    })

    it('should accept all fields together', () => {
      const result = ReleasesQuery.parse({
        artist: 'Pink Floyd',
        year: 1973,
        sort: 'year'
      })
      expect(result).toEqual({
        artist: 'Pink Floyd',
        year: 1973,
        sort: 'year'
      })
    })

    it('should accept all valid sort values', () => {
      expect(ReleasesQuery.parse({ sort: 'artist' }).sort).toBe('artist')
      expect(ReleasesQuery.parse({ sort: 'year' }).sort).toBe('year')
      expect(ReleasesQuery.parse({ sort: 'rating' }).sort).toBe('rating')
    })
  })

  describe('year coercion', () => {
    it('should coerce string year to number', () => {
      const result = ReleasesQuery.parse({
        year: '1969'
      })
      expect(result.year).toBe(1969)
      expect(typeof result.year).toBe('number')
    })

    it('should handle numeric string year', () => {
      const result = ReleasesQuery.parse({
        year: '2023'
      })
      expect(result.year).toBe(2023)
    })

    it('should accept number year directly', () => {
      const result = ReleasesQuery.parse({
        year: 2000
      })
      expect(result.year).toBe(2000)
    })
  })

  describe('invalid data - artist', () => {
    it('should reject non-string artist', () => {
      expect(() => 
        ReleasesQuery.parse({
          artist: 123
        })
      ).toThrow(ZodError)
    })

    it('should reject null artist', () => {
      expect(() => 
        ReleasesQuery.parse({
          artist: null
        })
      ).toThrow(ZodError)
    })

    it('should accept empty string artist', () => {
      // Note: Empty string is technically valid
      const result = ReleasesQuery.parse({
        artist: ''
      })
      expect(result.artist).toBe('')
    })
  })

  describe('invalid data - year', () => {
    it('should reject decimal year', () => {
      expect(() => 
        ReleasesQuery.parse({
          year: 1969.5
        })
      ).toThrow(ZodError)
    })

    it('should reject non-numeric string year', () => {
      expect(() => 
        ReleasesQuery.parse({
          year: 'abc'
        })
      ).toThrow(ZodError)
    })

    // Note: z.coerce.number() is very aggressive and will coerce booleans/arrays
    // true -> 1, false -> 0, [2023] -> NaN (which fails int() check)
    // In production, validate input types before coercion if needed
  })

  describe('invalid data - sort', () => {
    it('should reject invalid sort value', () => {
      expect(() => 
        ReleasesQuery.parse({
          sort: 'title'
        })
      ).toThrow(ZodError)
    })

    it('should reject empty string sort', () => {
      expect(() => 
        ReleasesQuery.parse({
          sort: ''
        })
      ).toThrow(ZodError)
    })

    it('should reject number sort', () => {
      expect(() => 
        ReleasesQuery.parse({
          sort: 123
        })
      ).toThrow(ZodError)
    })

    it('should reject case-variant sort values', () => {
      expect(() => 
        ReleasesQuery.parse({
          sort: 'ARTIST'
        })
      ).toThrow(ZodError)
      
      expect(() => 
        ReleasesQuery.parse({
          sort: 'Rating'
        })
      ).toThrow(ZodError)
    })
  })

  describe('extra fields handling', () => {
    it('should strip unknown fields by default', () => {
      const result = ReleasesQuery.parse({
        artist: 'Led Zeppelin',
        unknownField: 'should be removed'
      })
      
      expect(result).toEqual({ artist: 'Led Zeppelin' })
      expect('unknownField' in result).toBe(false)
    })
  })
})
