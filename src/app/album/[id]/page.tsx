import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { computeAlbumRating } from '@/lib/rating-album'

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
          <div className="text-lg font-medium">{albumRating.rankValue}/10</div>
          <div className="text-sm text-gray-500">{albumRating.rankLabel}</div>
          <div className="text-xs text-gray-400 mt-1">Rating: {Math.round(albumRating.finalAlbumRating)}</div>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-medium">Track list</h2>
        <ol className="mt-2 space-y-2">
          {tracks.map((t: any) => {
            const sec = t.durationSec ?? 0
            return (
              <li key={t.id} className="flex justify-between">
                <div>
                  <div className="font-medium">{t.number}. {t.title}</div>
                  {sec > 0 && (
                    <div className="text-sm text-gray-500">{Math.floor(sec / 60)}:{String(sec % 60).padStart(2,'0')}</div>
                  )}
                </div>
                <div className="text-sm text-gray-500">{(t.ratings && t.ratings.length) ? `${Math.round((t.ratings.reduce((s: number, r: any) => s + (r.score ?? 0), 0) / t.ratings.length) * 10) / 10}/10` : '—'}</div>
              </li>
            )
          })}
        </ol>
      </section>

      <div>
        <Link href="/albums" className="underline">Back to albums</Link>
      </div>
    </main>
  )
}
