import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { quantizeRank, RATING_BG, calculateAlbumAverage } from '@/lib/rating'
import { extractTracks } from '@/lib/utils'
import type { ArtistDetail } from '@/types/components'

type Props = { params: { id: string } | Promise<{ id: string }> }

export default async function ArtistPage({ params }: Props) {
  const { id } = await params

  const artist = await prisma.artist.findUnique({
    where: { id },
    include: {
      groups: {
        include: {
          releases: { include: { tracks: { include: { ratings: true } } } },
        },
        orderBy: { year: 'desc' },
      },
    },
  }) as ArtistDetail | null

  if (!artist) return notFound()

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{artist.name}</h1>
        {artist.sortName && (
          <div className="text-sm text-gray-500">Sort: {artist.sortName}</div>
        )}
        {artist.country && (
          <div className="text-sm text-gray-500">Country: {artist.country}</div>
        )}
        {artist.notes && (
          <div className="mt-2 text-sm text-gray-600">{artist.notes}</div>
        )}
      </div>

      <section>
        <h2 className="text-lg font-medium mb-3">Albums ({artist.groups.length})</h2>
        <div className="space-y-3">
          {artist.groups.map((album) => {
            const tracks = extractTracks(album)
            const avgRank = calculateAlbumAverage(tracks)
            
            const rankValue = quantizeRank(avgRank)
            const bgClass = avgRank > 0 ? RATING_BG[rankValue] || 'bg-white' : 'bg-white'

            return (
              <Link
                key={album.id}
                href={`/album/${album.id}`}
                className={`border rounded-lg p-4 flex items-center justify-between transition-all cursor-pointer block ${bgClass} hover:shadow-md`}
              >
                <div>
                  <div className="font-medium">{album.title}</div>
                  <div className="text-sm text-gray-500">
                    {album.year ?? 'Unknown year'} · {album.primaryType}
                  </div>
                  <div className="text-sm mt-1">Tracks: {tracks.length}</div>
                </div>
                {avgRank > 0 && (
                  <div className="text-right">
                    <div className="text-lg font-medium">{Math.round(avgRank * 10) / 10}/10</div>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </section>
    </main>
  )
}
