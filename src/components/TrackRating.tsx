'use client'

import { useState } from 'react'
import { RATING_COLORS, RATING_BG } from '@/lib/rating'
import { useToast } from '@/components/ui/toast'

type TrackRatingProps = {
  trackId: string
  trackNumber: number
  trackTitle: string
  currentScore?: number
  durationSec: number
  onRatingChange?: () => void
}

export function TrackRating({ 
  trackId, 
  trackNumber, 
  trackTitle, 
  currentScore, 
  durationSec,
  onRatingChange 
}: TrackRatingProps) {
  const [rating, setRating] = useState<number | null>(currentScore ?? null)
  const [hover, setHover] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showToast } = useToast()

  const handleRating = async (score: number) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId, score }),
      })
      if (!res.ok) throw new Error('Failed to save rating')
      setRating(score)
      onRatingChange?.()
    } catch (error) {
      console.error('Error saving rating:', error)
      showToast('Failed to save rating', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
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
    } catch (error) {
      console.error('Error deleting rating:', error)
      showToast('Failed to delete rating', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayRating = hover ?? rating

  const minutes = Math.floor(durationSec / 60)
  const seconds = durationSec % 60

  return (
    <li className="flex justify-between items-center gap-4">
      <div className="flex-1">
        <div className="font-medium">{trackNumber}. {trackTitle}</div>
        {durationSec > 0 && (
          <div className="text-sm text-gray-500">
            {minutes}:{String(seconds).padStart(2, '0')}
          </div>
        )}
      </div>
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
              className={`w-8 h-8 rounded transition-all ${
                isSelected
                  ? `${colorClass} ${bgClass} shadow-sm scale-105`
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
        <button
          onClick={handleDelete}
          disabled={isSubmitting || rating === null}
          className="ml-2 w-8 h-8 rounded-full transition-colors border border-gray-300 text-gray-400 hover:border-red-500 hover:text-red-500 hover:bg-red-50 focus:border-red-500 focus:text-red-500 focus:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-400 disabled:hover:bg-transparent"
          title="Clear rating"
        >
          ✕
        </button>
      </div>
    </li>
  )
}
