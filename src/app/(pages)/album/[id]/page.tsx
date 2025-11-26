import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { computeAlbumRating } from '@/lib/rating'
import { TrackList } from '@/components/TrackList'
import { AlbumModifiersCompact } from '@/components/AlbumModifiersCompact'
import { AlbumRatingDisplay } from '@/components/AlbumRatingDisplay'

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
      <div className="flex gap-6 min-h-[192px]">
        {/* Album Cover Placeholder */}
        <div className="flex-shrink-0">
          <div className="w-48 h-48 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg shadow-md flex items-center justify-center">
            <svg 
              className="w-20 h-20 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>
        </div>

        {/* Album Info */}
        <div className="flex-1 space-y-4 h-48 overflow-visible">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{a.title}</h1>
              <Link 
                href={`/artist/${a.artist?.id}`}
                className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
              >
                {a.artist?.name ?? 'Unknown'}
              </Link>
              <div className="text-sm mt-1 text-gray-600">Tracks: {tracks.length}</div>
            </div>
            <AlbumRatingDisplay
              rankValue={albumRating.rankValue}
              rankLabel={albumRating.rankLabel}
              finalAlbumRating={albumRating.finalAlbumRating}
              hasAnyRatings={hasAnyRatings}
            />
          </div>
          
          <AlbumModifiersCompact
            albumId={a.id}
            coverValue={a.coverValue}
            productionValue={a.productionValue}
            mixValue={a.mixValue}
          />
        </div>
      </div>

      <section>
        <h2 className="text-lg font-medium">Track list</h2>
        <TrackList tracks={tracks} />
      </section>
    </main>
  )
}
