'use client'

import { useState, memo, useCallback } from 'react'
import { RATING_COLORS, RATING_BG } from '@/lib/rating'
import { useToast } from '@/components/ui/toast'
import { createComponentLogger } from '@/lib/logger'

type TrackRatingCompactProps = {
  trackId: string
  trackNumber: number
  trackTitle: string
  currentScore?: number
  durationSec: number
  onRatingChange?: () => void
}

export const TrackRatingCompact = memo(function TrackRatingCompact({ 
  trackId, 
  trackNumber, 
  trackTitle, 
  currentScore, 
  durationSec,
  onRatingChange 
}: TrackRatingCompactProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [rating, setRating] = useState<number | null>(currentScore ?? null)
  const [hover, setHover] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showToast } = useToast()

  const minutes = Math.floor(durationSec / 60)
  const seconds = durationSec % 60

  const handleRating = useCallback(async (score: number) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId, score }),
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        const logger = createComponentLogger('track-rating-compact')
        logger.error({ status: res.status, error: errorData, trackId, score }, 'Rating API request failed')
        throw new Error(`Failed to save rating: ${res.status} ${errorData.error || ''}`)
      }
      
      setRating(score)
      onRatingChange?.()
      showToast('Rating saved', 'success')
      setIsExpanded(false)
    } catch (error) {
      const logger = createComponentLogger('track-rating-compact')
      logger.error({ err: error, trackId, score }, 'Failed to save track rating')
      showToast('Failed to save rating', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }, [trackId, onRatingChange, showToast])

  const handleDelete = useCallback(async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/ratings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId }),
      })
      if (!res.ok) throw new Error('Failed to delete rating')
      setRating(null)
      onRatingChange?.()
      showToast('Rating removed', 'success')
      setIsExpanded(false)
    } catch (error) {
      const logger = createComponentLogger('track-rating-compact')
      logger.error({ err: error, trackId }, 'Failed to delete track rating')
      showToast('Failed to delete rating', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }, [trackId, onRatingChange, showToast])

  const ratingColorClass = rating !== null ? RATING_COLORS[rating] || 'text-gray-600' : 'text-gray-400'
  const ratingBgClass = rating !== null ? RATING_BG[rating] || 'bg-gray-100' : 'bg-gray-100'
  const displayRating = hover ?? rating

  if (isExpanded) {
    return (
      <li className="flex justify-between items-center gap-4 hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded transition-colors bg-blue-50 border-l-2 border-blue-500">
        {/* Left side: Track info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{trackNumber}. {trackTitle}</div>
          {durationSec > 0 && (
            <div className="text-sm text-gray-500">
              {minutes}:{String(seconds).padStart(2, '0')}
            </div>
          )}
        </div>

        {/* Right side: Inline rating buttons */}
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3, 4, 5, 7, 10].map((score) => {
            const isHovering = hover !== null && score <= hover
            const isSelected = rating === score
            const colorClass = RATING_COLORS[score] || 'text-gray-600'
            const bgClass = RATING_BG[score] || 'bg-gray-100'
            
            return (
              <button
                key={score}
                onClick={() => handleRating(score)}
                onMouseEnter={() => setHover(score)}
                onMouseLeave={() => setHover(null)}
                disabled={isSubmitting}
                className={`w-7 h-7 rounded text-sm font-medium transition-all ${
                  isSelected
                    ? `${colorClass} ${bgClass} ring-1 ring-offset-1 ${colorClass.replace('text-', 'ring-')}`
                    : isHovering
                    ? `${colorClass} ${bgClass} opacity-70`
                    : 'bg-white text-gray-400 hover:bg-gray-100 hover:text-gray-600 border border-gray-300'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                title={`Rate ${score}/10`}
              >
                {score}
              </button>
            )
          })}
          <button
            onClick={handleDelete}
            disabled={isSubmitting || rating === null}
            className="ml-1 w-7 h-7 rounded transition-colors border border-gray-300 text-gray-400 hover:border-red-500 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            title="Clear rating"
          >
            ✕
          </button>
          <button
            onClick={() => setIsExpanded(false)}
            className="ml-1 w-7 h-7 rounded transition-colors border border-gray-300 text-gray-500 hover:bg-gray-100 text-sm"
            title="Close"
          >
            ✓
          </button>
        </div>
      </li>
    )
  }

  return (
    <li className="flex justify-between items-center gap-4 hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded transition-colors">
      {/* Left side: Track info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{trackNumber}. {trackTitle}</div>
        {durationSec > 0 && (
          <div className="text-sm text-gray-500">
            {minutes}:{String(seconds).padStart(2, '0')}
          </div>
        )}
      </div>

      {/* Right side: Rating badge (clickable) */}
      <button
        onClick={() => setIsExpanded(true)}
        className={`px-3 py-1.5 rounded-lg font-semibold text-sm transition-all hover:ring-2 hover:ring-offset-1 ${
          rating !== null
            ? `${ratingColorClass} ${ratingBgClass} hover:${ratingColorClass.replace('text-', 'ring-')}`
            : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
        }`}
        title={rating !== null ? `Rating: ${rating}/10 (click to change)` : 'Click to rate'}
      >
        {rating !== null ? rating : 'n/a'}
      </button>
    </li>
  )
})

