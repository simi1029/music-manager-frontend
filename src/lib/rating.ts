import type { TrackForRating, AlbumModifiers, AlbumRating } from '@/types/utils'

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────
export const SCALE = [0,1,2,3,4,5,7,10] as const
export type ScaleValue = typeof SCALE[number]

export const LABEL: Record<ScaleValue, string> = {
  0:'Poor',1:'Fair',2:'Quite good',3:'Good',4:'More than good',5:'Very good',7:'Excellent',10:'Masterpiece'
}

export const RATING_COLORS: Record<number, string> = {
  0: "text-red-500",
  1: "text-orange-500",
  2: "text-amber-500",
  3: "text-yellow-500",
  4: "text-lime-500",
  5: "text-green-500",
  7: "text-sky-500",
  10: "text-violet-500"
}

export const RATING_BG: Record<number, string> = {
  0: "bg-red-100",
  1: "bg-orange-100",
  2: "bg-amber-100",
  3: "bg-yellow-100",
  4: "bg-lime-100",
  5: "bg-green-100",
  7: "bg-sky-100",
  10: "bg-violet-100"
}

// Text colors for readability on each rating background
export const RATING_TEXT_COLORS: Record<number, string> = {
  0: "text-red-900",      // Dark red on red-100
  1: "text-orange-900",   // Dark orange on orange-100
  2: "text-amber-900",    // Dark amber on amber-100
  3: "text-yellow-900",   // Dark yellow on yellow-100
  4: "text-lime-900",     // Dark lime on lime-100
  5: "text-green-900",    // Dark green on green-100
  7: "text-sky-900",      // Dark sky on sky-100
  10: "text-violet-900"   // Dark violet on violet-100
}

// ─────────────────────────────────────────────────────────
// Pure rating utilities
// ─────────────────────────────────────────────────────────
export function quantizeRank(mean: number): ScaleValue {
  // separate declarations so the type annotation applies only to `best`
  let best: ScaleValue = SCALE[0] as ScaleValue
  let bestDiff = Infinity
  for (const s of SCALE) {
    const d = Math.abs(mean - s)
    if (d < bestDiff || (d === bestDiff && s > best)) {
      best = s as ScaleValue
      bestDiff = d
    }
  }
  return best
}

// ─────────────────────────────────────────────────────────
// Track and Album Average Calculations
// ─────────────────────────────────────────────────────────

/**
 * Calculate average rating from a single track's ratings
 */
export function calculateTrackAverage(track: { 
  ratings: Array<{ score: number | null }> 
}): number {
  if (!track.ratings || track.ratings.length === 0) return 0
  const sum = track.ratings.reduce((s, r) => s + (r.score ?? 0), 0)
  return sum / track.ratings.length
}

/**
 * Calculate album average rating from multiple tracks
 */
export function calculateAlbumAverage(tracks: Array<{ 
  ratings: Array<{ score: number | null }> 
}>): number {
  const trackAverages = tracks.map(calculateTrackAverage)
  return trackAverages.length 
    ? trackAverages.reduce((s, v) => s + v, 0) / trackAverages.length 
    : 0
}

// ─────────────────────────────────────────────────────────
// Album rating calculation
// ─────────────────────────────────────────────────────────
export function computeAlbumRating(
  tracks: TrackForRating[], 
  quality: AlbumModifiers
): AlbumRating & { baseRating: number; qualityBoost: number } {

  let totalRatingValue = 0
  let totalRankValue = 0
  let countRated = 0

  for (const t of tracks) {
    const score = t.ratings[0]?.score ?? null
    if (score != null && t.durationSec != null) {
      totalRatingValue += (t.durationSec / 60) * score
      totalRankValue += score
      countRated++
    }
  }

  const meanRank = countRated > 0 ? totalRankValue / countRated : 0
  const rankValue = quantizeRank(meanRank)
  const rankLabel = LABEL[rankValue]

  const cover = quality.cover ?? 0
  const production = quality.production ?? 0
  const mix = quality.mix ?? 0

  let qualityBoost = 1 + (cover + production + mix) / 100
  
  // Add 5% bonus if all modifiers are >= 9
  if (cover >= 9 && production >= 9 && mix >= 9) {
    qualityBoost *= 1.05
  }

  const finalAlbumRating = totalRatingValue * qualityBoost

  return {
    rankValue,
    rankLabel,
    finalAlbumRating,
    baseRating: totalRatingValue,
    qualityBoost,
  }
}
