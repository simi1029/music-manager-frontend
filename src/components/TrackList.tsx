'use client'

import { useCallback } from 'react'
import { TrackRating } from './TrackRating'
import { useRouter } from 'next/navigation'
import type { TrackWithRatings } from '@/types/components'

type TrackListProps = {
  tracks: TrackWithRatings[]
}

export function TrackList({ tracks }: TrackListProps) {
  const router = useRouter()

  const handleRatingChange = useCallback(() => {
    // Refresh the page data to update album-level rating
    router.refresh()
  }, [router])

  return (
    <ol className="mt-2 space-y-2">
      {tracks.map((t) => (
        <TrackRating
          key={t.id}
          trackId={t.id}
          trackNumber={t.number}
          trackTitle={t.title}
          currentScore={t.ratings[0]?.score}
          durationSec={t.durationSec ?? 0}
          onRatingChange={handleRatingChange}
        />
      ))}
    </ol>
  )
}
