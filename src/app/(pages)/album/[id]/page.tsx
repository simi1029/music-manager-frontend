import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAlbumWithRatings } from '@/lib/queries/albums'
import { transformAlbumFirstRelease } from '@/lib/transformers/albums'
import { TrackList } from '@/components/tracks'
import { AlbumModifiersCompact, AlbumRatingDisplay } from '@/components/albums'

type Props = { params: { id: string } | Promise<{ id: string }> }

export default async function AlbumPage({ params }: Props) {
  // In Next 13/14 RSC dynamic params may be a Promise in some runtimes;
  // unwrap it to access `id` safely.
  const { id } = await params

  // Fetch album using centralized query
  const a = await getAlbumWithRatings(id)

  if (!a) return notFound()

  // Use transformation layer to get tracks and rating
  const { album, tracks, hasRatings, rating: albumRating } = transformAlbumFirstRelease(a)

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
              <h1 className="text-2xl font-semibold">{album.title}</h1>
              <div className="text-sm text-gray-500">
                {album.artists.map((a, idx) => (
                  <span key={a.artist.id}>
                    {idx > 0 && ' & '}
                    <Link 
                      href={`/artist/${a.artist.id}`}
                      className="hover:text-gray-700 hover:underline"
                    >
                      {a.artist.name}
                    </Link>
                  </span>
                ))}
              </div>
              <div className="text-sm mt-1 text-gray-600">Tracks: {tracks.length}</div>
            </div>
            <AlbumRatingDisplay
              rankValue={albumRating.rankValue}
              rankLabel={albumRating.rankLabel}
              finalAlbumRating={albumRating.finalAlbumRating}
              hasAnyRatings={hasRatings}
            />
          </div>
          
          <AlbumModifiersCompact
            albumId={album.id}
            coverValue={album.coverValue}
            productionValue={album.productionValue}
            mixValue={album.mixValue}
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
