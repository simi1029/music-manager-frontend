import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { quantizeRank, LABEL } from '@/lib/rating'

type Props = { params: { id: string } | Promise<{ id: string }> }

export default async function ReleasePage({ params }: Props) {
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

  const tracks = a.releases.flatMap((r: any) => r.tracks)
  const trackAverages = tracks.map((t: any) => {
    if (!t.ratings || t.ratings.length === 0) return 0
    const sum = t.ratings.reduce((s: number, r: any) => s + (r.score ?? 0), 0)
    return sum / t.ratings.length
  })

  const avgRank = trackAverages.length
    ? trackAverages.reduce((s: number, v: number) => s + v, 0) / trackAverages.length
    : 0

  const albumRankValue = Math.round(avgRank * 10) / 10
  const albumRankLabel = avgRank > 0 ? LABEL[quantizeRank(avgRank)] : '—'

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{a.title}</h1>
          <div className="text-sm text-gray-500">{a.artist?.name ?? 'Unknown'}</div>
          <div className="text-sm mt-1">Tracks: {tracks.length}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-medium">{albumRankValue}/10</div>
          <div className="text-sm text-gray-500">{albumRankLabel}</div>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-medium">Track list</h2>
        <ol className="mt-2 space-y-2">
          {tracks.map((t: any) => {
            // `durationSec` field may not exist in generated types until Prisma client is regenerated.
            const sec = ((t as any).durationSec ?? Math.floor(((t as any).durationMs ?? 0) / 1000)) as number
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
        <Link href="/releases" className="underline">Back to releases</Link>
      </div>
    </main>
  )
}
