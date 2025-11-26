import { describe, it, expect } from 'vitest'
import { 
  SCALE, 
  LABEL, 
  RATING_COLORS, 
  RATING_BG,
  ARTIST_LABEL,
  quantizeRank, 
  computeAlbumRating,
  computeArtistRating,
  calculateTrackAverage,
  calculateAlbumAverage
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
  // BVA: Test boundaries and representative values
  it('should handle boundary values', () => {
    expect(quantizeRank(0)).toBe(0)    // Min boundary
    expect(quantizeRank(10)).toBe(10)  // Max boundary
    expect(quantizeRank(-5)).toBe(0)   // Below min
    expect(quantizeRank(15)).toBe(10)  // Above max
  })

  it('should round to nearest scale value', () => {
    expect(quantizeRank(0.4)).toBe(0)  // Round down
    expect(quantizeRank(0.6)).toBe(1)  // Round up
    expect(quantizeRank(6)).toBe(7)    // Equidistant case (5-7 gap)
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

  it('should skip tracks without ratings or duration', () => {
    const tracks = [
      { durationSec: 180, ratings: [{ score: 10 }] },
      { durationSec: 120, ratings: [] },
      { durationSec: null, ratings: [{ score: 5 }] }
    ]
    
    const result = computeAlbumRating(tracks, {})
    
    expect(result.baseRating).toBe(30) // Only first track counts
    expect(result.rankValue).toBe(10)
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

  it('should NOT apply bonus when any modifier < 9', () => {
    const tracks = [
      { durationSec: 60, ratings: [{ score: 10 }] }
    ]
    
    const result = computeAlbumRating(tracks, {
      cover: 8, // Boundary: just below threshold
      production: 10,
      mix: 9
    })
    
    // Base boost = 1 + (8+10+9)/100 = 1.27, no 5% bonus
    expect(result.qualityBoost).toBe(1.27)
    expect(result.finalAlbumRating).toBe(12.7)
  })
})

describe('calculateTrackAverage', () => {
  it('should return 0 for track with no ratings', () => {
    expect(calculateTrackAverage({ ratings: [] })).toBe(0)
  })

  it('should calculate average of track ratings', () => {
    expect(calculateTrackAverage({ 
      ratings: [{ score: 8 }, { score: 10 }, { score: 6 }] 
    })).toBe(8)
  })

  it('should handle null scores as 0', () => {
    expect(calculateTrackAverage({ 
      ratings: [{ score: 10 }, { score: null }, { score: 5 }] 
    })).toBe(5)
  })
})

describe('calculateAlbumAverage', () => {
  it('should return 0 for empty tracks array', () => {
    expect(calculateAlbumAverage([])).toBe(0)
  })

  it('should calculate average across tracks', () => {
    const tracks = [
      { ratings: [{ score: 8 }, { score: 10 }] }, // avg: 9
      { ratings: [{ score: 6 }] },                 // avg: 6
      { ratings: [] }                              // avg: 0
    ]
    expect(calculateAlbumAverage(tracks)).toBe(5) // (9+6+0)/3
  })
})

describe('ARTIST_LABEL constant', () => {
  it('should have labels for all scale values', () => {
    expect(ARTIST_LABEL[0]).toBe('Forgettable')
    expect(ARTIST_LABEL[1]).toBe('Mediocre')
    expect(ARTIST_LABEL[2]).toBe('Decent')
    expect(ARTIST_LABEL[3]).toBe('Solid')
    expect(ARTIST_LABEL[4]).toBe('Accomplished')
    expect(ARTIST_LABEL[5]).toBe('Outstanding')
    expect(ARTIST_LABEL[7]).toBe('Iconic')
    expect(ARTIST_LABEL[10]).toBe('Legendary')
  })
})

describe('computeArtistRating', () => {
  it('should return zero values when no albums rated', () => {
    const result = computeArtistRating([])
    
    expect(result.rankValue).toBe(0)
    expect(result.rankLabel).toBe('Forgettable')
    expect(result.avgFinalRating).toBe(0)
  })

  it('should skip albums with rankValue 0 (unrated)', () => {
    const albumRatings = [
      { rankValue: 10, finalAlbumRating: 100 },
      { rankValue: 0, finalAlbumRating: 0 },  // Unrated - should be ignored
      { rankValue: 7, finalAlbumRating: 70 }
    ]
    
    const result = computeArtistRating(albumRatings)
    
    // Average: (10+7)/2 = 8.5 → quantizes to 10
    expect(result.rankValue).toBe(10)
    expect(result.rankLabel).toBe('Legendary')
    // Final rating average: (100+70)/2 = 85
    expect(result.avgFinalRating).toBe(85)
  })

  it('should return 0 when all albums are unrated', () => {
    const albumRatings = [
      { rankValue: 0, finalAlbumRating: 0 },
      { rankValue: 0, finalAlbumRating: 0 },
      { rankValue: 0, finalAlbumRating: 0 }
    ]
    
    const result = computeArtistRating(albumRatings)
    
    expect(result.rankValue).toBe(0)
    expect(result.rankLabel).toBe('Forgettable')
    expect(result.avgFinalRating).toBe(0)
  })

  it('should calculate rating for single rated album', () => {
    const albumRatings = [
      { rankValue: 7, finalAlbumRating: 42.5 } // Excellent album
    ]
    
    const result = computeArtistRating(albumRatings)
    
    expect(result.rankValue).toBe(7)
    expect(result.rankLabel).toBe('Iconic')
    expect(result.avgFinalRating).toBe(43) // Rounded
  })

  it('should average and requantize multiple album ratings', () => {
    const albumRatings = [
      { rankValue: 10, finalAlbumRating: 120 }, // Album 1: Legendary
      { rankValue: 7, finalAlbumRating: 80 },   // Album 2: Excellent
      { rankValue: 5, finalAlbumRating: 60 }    // Album 3: Very good
    ]
    
    const result = computeArtistRating(albumRatings)
    
    // Average: (10+7+5)/3 = 7.33 → quantizes to 7
    expect(result.rankValue).toBe(7)
    expect(result.rankLabel).toBe('Iconic')
    // Final rating average: (120+80+60)/3 = 86.67 → rounds to 87
    expect(result.avgFinalRating).toBe(87)
  })

  it('should handle boundary case - perfect artist', () => {
    const albumRatings = [
      { rankValue: 10, finalAlbumRating: 150 },
      { rankValue: 10, finalAlbumRating: 148 },
      { rankValue: 10, finalAlbumRating: 152 }
    ]
    
    const result = computeArtistRating(albumRatings)
    
    expect(result.rankValue).toBe(10)
    expect(result.rankLabel).toBe('Legendary')
    // Final rating average: (150+148+152)/3 = 150
    expect(result.avgFinalRating).toBe(150)
  })

  it('should quantize average correctly', () => {
    const albumRatings = [
      { rankValue: 5, finalAlbumRating: 50.8 }, // Very good
      { rankValue: 4, finalAlbumRating: 40.2 }  // More than good
    ]
    
    const result = computeArtistRating(albumRatings)
    
    // Average: (5+4)/2 = 4.5 → quantizes to 5
    expect(result.rankValue).toBe(5)
    expect(result.rankLabel).toBe('Outstanding')
    // Final rating average: (50.8+40.2)/2 = 45.5 → rounds to 46
    expect(result.avgFinalRating).toBe(46)
  })
})
