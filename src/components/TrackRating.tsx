'use client'

import { useState } from 'react'

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
      alert('Failed to save rating')
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
      alert('Failed to delete rating')
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
        {[0, 1, 2, 3, 4, 5, 7, 10].map((score) => (
          <button
            key={score}
            onClick={() => handleRating(score)}
            onMouseEnter={() => setHover(score)}
            onMouseLeave={() => setHover(null)}
            disabled={isSubmitting}
            className={`w-8 h-8 rounded transition-colors ${
              displayRating !== null && score <= displayRating
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            title={`Rate ${score}/10`}
          >
            {score}
          </button>
        ))}
        <button
          onClick={handleDelete}
          disabled={isSubmitting || rating === null}
          className="ml-2 w-8 h-8 rounded transition-colors bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Clear rating"
        >
          ✕
        </button>
      </div>
    </li>
  )
}
