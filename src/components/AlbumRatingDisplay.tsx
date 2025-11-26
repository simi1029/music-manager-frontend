import { RATING_COLORS, RATING_BG } from '@/lib/rating-colors'

type AlbumRatingDisplayProps = {
  rankValue: number
  rankLabel: string
  finalAlbumRating: number
  hasAnyRatings: boolean
}

export function AlbumRatingDisplay({
  rankValue,
  rankLabel,
  finalAlbumRating,
  hasAnyRatings,
}: AlbumRatingDisplayProps) {
  const colorClass = RATING_COLORS[rankValue] || "text-gray-500"
  const bgClass = RATING_BG[rankValue] || "bg-gray-100"

  return (
    <div className="text-right">
      <div className={`text-lg font-medium ${hasAnyRatings ? colorClass : 'text-gray-400'}`}>
        {hasAnyRatings ? `${rankValue}/10` : '-/10'}
      </div>
      <div className={`text-sm px-3 py-1 rounded-full inline-block ${hasAnyRatings ? `${colorClass} ${bgClass}` : 'text-gray-500'}`}>
        {hasAnyRatings ? rankLabel : '—'}
      </div>
      {hasAnyRatings && (
        <div className="text-xs text-gray-400 mt-1">
          Rating: {Math.round(finalAlbumRating)}
        </div>
      )}
    </div>
  )
}
