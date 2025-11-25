import { SCALE, quantizeRank, LABEL } from './rating'

export function computeAlbumRating(tracks: {
  durationSec: number | null
  ratings: { score: number }[]
}[], quality: { cover?: number; production?: number; mix?: number }) {

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

  const qualityBoost = 1 + (cover + production + mix) / 100

  const finalAlbumRating = totalRatingValue * qualityBoost

  return {
    rankValue,
    rankLabel,
    finalAlbumRating,
    baseRating: totalRatingValue,
    qualityBoost,
  }
}
