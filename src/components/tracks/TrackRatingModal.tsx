'use client'

import { useState, memo, useCallback } from 'react'
import { RATING_COLORS, RATING_BG } from '@/lib/rating'
import { useToast } from '@/components/ui/toast'
import { createComponentLogger } from '@/lib/logger'

type TrackRatingModalProps = {
  trackId: string
  trackTitle: string
  currentScore?: number
  onClose: () => void
  onRatingChange?: () => void
}

export const TrackRatingModal = memo(function TrackRatingModal({
  trackId,
  trackTitle,
  currentScore,
  onClose,
  onRatingChange
}: TrackRatingModalProps) {
  const [rating, setRating] = useState<number | null>(currentScore ?? null)
  const [hover, setHover] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showToast } = useToast()

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
        const logger = createComponentLogger('track-rating-modal')
        logger.error({ status: res.status, error: errorData, trackId, score }, 'Rating API request failed')
        throw new Error(`Failed to save rating: ${res.status} ${errorData.error || ''}`)
      }
      
      setRating(score)
      onRatingChange?.()
      showToast('Rating saved', 'success')
      
      // Close modal after short delay
      setTimeout(() => {
        onClose()
      }, 300)
    } catch (error) {
      const logger = createComponentLogger('track-rating-modal')
      logger.error({ err: error, trackId, score }, 'Failed to save track rating')
      showToast('Failed to save rating', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }, [trackId, onRatingChange, onClose, showToast])

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
      
      // Close modal after short delay
      setTimeout(() => {
        onClose()
      }, 300)
    } catch (error) {
      const logger = createComponentLogger('track-rating-modal')
      logger.error({ err: error, trackId }, 'Failed to delete track rating')
      showToast('Failed to delete rating', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }, [trackId, onRatingChange, onClose, showToast])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [onClose])

  const displayRating = hover ?? rating

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Rate Track</h3>
            <p className="text-sm text-gray-600 mt-1">{trackTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Current Rating Display */}
          {displayRating !== null && (
            <div className="text-center">
              <div className={`inline-block text-4xl font-bold ${RATING_COLORS[displayRating]}`}>
                {displayRating}
              </div>
              <div className="text-sm text-gray-500 mt-1">out of 10</div>
            </div>
          )}

          {/* Rating Buttons */}
          <div className="grid grid-cols-4 gap-2">
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
                  className={`h-12 rounded-lg font-semibold text-lg transition-all ${
                    isSelected
                      ? `${colorClass} ${bgClass} ring-2 ring-offset-2 ${colorClass.replace('text-', 'ring-')}`
                      : isHovering
                      ? `${colorClass} ${bgClass} opacity-70`
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  title={`Rate ${score}/10`}
                >
                  {score}
                </button>
              )
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleDelete}
              disabled={isSubmitting || rating === null}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Clear Rating
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})
