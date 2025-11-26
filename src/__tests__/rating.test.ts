import { describe, it, expect } from 'vitest'
import { 
  SCALE, 
  LABEL, 
  RATING_COLORS, 
  RATING_BG, 
  quantizeRank, 
  computeAlbumRating 
} from '../lib/rating'

describe('rating constants', () => {
  it('should have correct SCALE values', () => {
    expect(SCALE).toEqual([0, 1, 2, 3, 4, 5, 7, 10])
  })

  it('should have labels for all scale values', () => {
    for (const value of SCALE) {
      expect(LABEL[value]).toBeDefined()
      expect(typeof LABEL[value]).toBe('string')
    }
  })

  it('should have colors for all scale values', () => {
    for (const value of SCALE) {
      expect(RATING_COLORS[value]).toBeDefined()
      expect(RATING_COLORS[value]).toMatch(/^text-/)
      expect(RATING_BG[value]).toBeDefined()
      expect(RATING_BG[value]).toMatch(/^bg-/)
    }
  })
})

describe('quantizeRank', () => {
  it('should return exact scale values unchanged', () => {
    expect(quantizeRank(0)).toBe(0)
    expect(quantizeRank(1)).toBe(1)
    expect(quantizeRank(5)).toBe(5)
    expect(quantizeRank(10)).toBe(10)
  })

  it('should round to nearest scale value', () => {
    expect(quantizeRank(0.4)).toBe(0)
    expect(quantizeRank(0.6)).toBe(1)
    expect(quantizeRank(3.4)).toBe(3)
    expect(quantizeRank(3.6)).toBe(4)
    expect(quantizeRank(6)).toBe(7) // 6 is equidistant from 5 and 7, prefers higher
    expect(quantizeRank(8.4)).toBe(7)
    expect(quantizeRank(8.6)).toBe(10)
  })

  it('should handle edge cases', () => {
    expect(quantizeRank(-5)).toBe(0)
    expect(quantizeRank(15)).toBe(10)
  })
})

describe('computeAlbumRating', () => {
  it('should return zero values when no tracks rated', () => {
    const result = computeAlbumRating([], {})
    
    expect(result.rankValue).toBe(0)
    expect(result.rankLabel).toBe('Poor')
    expect(result.finalAlbumRating).toBe(0)
    expect(result.baseRating).toBe(0)
    expect(result.qualityBoost).toBe(1)
  })

  it('should calculate rating for single track', () => {
    const tracks = [
      { durationSec: 180, ratings: [{ score: 8 }] } // 3 minutes * 8 = 24
    ]
    
    const result = computeAlbumRating(tracks, {})
    
    expect(result.baseRating).toBe(24)
    expect(result.rankValue).toBe(7) // 8 quantizes to 7
    expect(result.rankLabel).toBe('Excellent')
    expect(result.finalAlbumRating).toBe(24)
    expect(result.qualityBoost).toBe(1)
  })

  it('should calculate weighted average by duration', () => {
    const tracks = [
      { durationSec: 180, ratings: [{ score: 10 }] }, // 3 min * 10 = 30
      { durationSec: 120, ratings: [{ score: 5 }] }   // 2 min * 5 = 10
    ]
    
    const result = computeAlbumRating(tracks, {})
    
    expect(result.baseRating).toBe(40)
    expect(result.rankValue).toBe(7) // mean (10+5)/2 = 7.5 → quantizes to 7
  })

  it('should skip tracks without ratings', () => {
    const tracks = [
      { durationSec: 180, ratings: [{ score: 10 }] },
      { durationSec: 120, ratings: [] },
      { durationSec: null, ratings: [{ score: 5 }] }
    ]
    
    const result = computeAlbumRating(tracks, {})
    
    expect(result.baseRating).toBe(30) // Only first track counts
    expect(result.rankValue).toBe(10)
  })

  it('should apply quality modifiers', () => {
    const tracks = [
      { durationSec: 60, ratings: [{ score: 10 }] } // 1 min * 10 = 10
    ]
    
    const result = computeAlbumRating(tracks, {
      cover: 6,
      production: 7,
      mix: 8
    })
    
    // Quality boost = 1 + (6+7+8)/100 = 1.21
    expect(result.qualityBoost).toBe(1.21)
    expect(result.finalAlbumRating).toBe(12.1)
  })

  it('should apply 5% bonus when all modifiers >= 9', () => {
    const tracks = [
      { durationSec: 60, ratings: [{ score: 10 }] } // 1 min * 10 = 10
    ]
    
    const result = computeAlbumRating(tracks, {
      cover: 9,
      production: 10,
      mix: 9
    })
    
    // Base boost = 1 + (9+10+9)/100 = 1.28
    // With 5% bonus = 1.28 * 1.05 = 1.344
    expect(result.qualityBoost).toBeCloseTo(1.344, 5)
    expect(result.finalAlbumRating).toBeCloseTo(13.44, 5)
  })

  it('should NOT apply 5% bonus if any modifier < 9', () => {
    const tracks = [
      { durationSec: 60, ratings: [{ score: 10 }] }
    ]
    
    const result = computeAlbumRating(tracks, {
      cover: 8,
      production: 10,
      mix: 9
    })
    
    // Base boost = 1 + (8+10+9)/100 = 1.27
    // No 5% bonus
    expect(result.qualityBoost).toBe(1.27)
    expect(result.finalAlbumRating).toBe(12.7)
  })

  it('should handle missing quality values as 0', () => {
    const tracks = [
      { durationSec: 60, ratings: [{ score: 10 }] }
    ]
    
    const result = computeAlbumRating(tracks, {
      cover: 5
      // production and mix missing
    })
    
    // Quality boost = 1 + (5+0+0)/100 = 1.05
    expect(result.qualityBoost).toBe(1.05)
    expect(result.finalAlbumRating).toBe(10.5)
  })
})
