'use client'

import { useCallback } from 'react'
import { TrackRatingCompact } from './TrackRatingCompact'
// import { TrackRating } from './TrackRating' // Old inline version (kept for reference)
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
    <ol className="mt-2 space-y-1">
      {tracks.map((t) => (
        <TrackRatingCompact
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
