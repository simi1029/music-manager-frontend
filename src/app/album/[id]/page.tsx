import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { computeAlbumRating } from '@/lib/rating-album'
import { TrackList } from '@/components/TrackList'

type Props = { params: { id: string } | Promise<{ id: string }> }

export default async function AlbumPage({ params }: Props) {
  // In Next 13/14 RSC dynamic params may be a Promise in some runtimes;
  // unwrap it to access `id` safely.
  const { id } = await params

  const a = await prisma.releaseGroup.findUnique({
    where: { id },
    include: {
      artist: true,
      releases: { include: { tracks: { include: { ratings: true } } } },
    },
  })

  if (!a) return notFound()

  // For now, always use the first release (edition)
  const tracks = a.releases[0]?.tracks ?? []
  
  const hasAnyRatings = tracks.some((t: any) => t.ratings && t.ratings.length > 0)
  
  const albumRating = computeAlbumRating(
    tracks.map((t: any) => ({
      durationSec: t.durationSec,
      ratings: t.ratings || []
    })),
    {
      cover: a.coverValue ?? undefined,
      production: a.productionValue ?? undefined,
      mix: a.mixValue ?? undefined
    }
  )

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{a.title}</h1>
          <div className="text-sm text-gray-500">{a.artist?.name ?? 'Unknown'}</div>
          <div className="text-sm mt-1">Tracks: {tracks.length}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-medium">{hasAnyRatings ? `${albumRating.rankValue}/10` : '-/10'}</div>
          <div className="text-sm text-gray-500">{hasAnyRatings ? albumRating.rankLabel : '—'}</div>
          <div className="text-xs text-gray-400 mt-1">Rating: {Math.round(albumRating.finalAlbumRating)}</div>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-medium">Track list</h2>
        <TrackList tracks={tracks} />
      </section>

      <div>
        <Link href="/albums" className="underline">Back to albums</Link>
      </div>
    </main>
  )
}
