'use client'

import { TrackRating } from './TrackRating'
import { useRouter } from 'next/navigation'

type Track = {
  id: string
  number: number
  title: string
  durationSec: number | null
  ratings: { score: number }[]
}

type TrackListProps = {
  tracks: Track[]
}

export function TrackList({ tracks }: TrackListProps) {
  const router = useRouter()

  const handleRatingChange = () => {
    // Refresh the page data to update album-level rating
    router.refresh()
  }

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
