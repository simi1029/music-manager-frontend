import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getArtistWithAlbums } from '@/lib/queries/artists'
import { calculateArtistAlbumRating } from '@/lib/transformers/artists'
import { AlbumCard } from '@/components/albums'
import { PrimaryType } from '@/generated/prisma/enums'

type Props = { params: { id: string } | Promise<{ id: string }> }

// Helper to organize albums by primary type
function groupAlbumsByType(artist: NonNullable<Awaited<ReturnType<typeof getArtistWithAlbums>>>) {
  const albumsByType: Record<PrimaryType, typeof artist.releaseGroupArtists> = {
    [PrimaryType.ALBUM]: [],
    [PrimaryType.SINGLE]: [],
    [PrimaryType.EP]: [],
    [PrimaryType.COMPILATION]: [],
    [PrimaryType.LIVE]: [],
    [PrimaryType.SOUNDTRACK]: [],
    [PrimaryType.OTHER]: [],
  }

  artist.releaseGroupArtists.forEach(rga => {
    const type = rga.releaseGroup.primaryType
    albumsByType[type].push(rga)
  })

  return albumsByType
}

export default async function ArtistPage({ params }: Props) {
  const { id } = await params

  // Fetch artist using centralized query
  const artist = await getArtistWithAlbums(id)

  if (!artist) return notFound()

  // Group albums by type
  const albumsByType = groupAlbumsByType(artist)
  const typeSections: { type: PrimaryType; label: string }[] = [
    { type: PrimaryType.ALBUM, label: 'Albums' },
    { type: PrimaryType.SINGLE, label: 'Singles' },
    { type: PrimaryType.EP, label: 'EPs' },
    { type: PrimaryType.LIVE, label: 'Live Albums' },
    { type: PrimaryType.COMPILATION, label: 'Compilations' },
    { type: PrimaryType.SOUNDTRACK, label: 'Soundtracks' },
    { type: PrimaryType.OTHER, label: 'Other' },
  ]

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex gap-6">
        {/* Artist Image */}
        <div className="flex-shrink-0">
          {artist.imageUrl ? (
            <Image
              src={artist.imageUrl}
              alt={`${artist.name} photo`}
              width={160}
              height={160}
              className="rounded-full object-cover shadow-lg"
              priority
            />
          ) : (
            <div className="w-40 h-40 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center shadow-lg">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          )}
        </div>
        
        {/* Artist Info */}
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{artist.name}</h1>
          {artist.country && (
            <div className="text-sm text-gray-500">🌍 {artist.country}</div>
          )}
          {artist.notes && (
            <div className="mt-2 text-sm text-gray-600">{artist.notes}</div>
          )}
        </div>
      </div>

      {/* Albums grouped by type */}
      {typeSections.map(({ type, label }) => {
        const albums = albumsByType[type]
        if (albums.length === 0) return null

        return (
          <section key={type} className="mt-8 first:mt-6">
            <h2 className="text-lg font-medium mb-3">
              {label} ({albums.length})
            </h2>
            <div className="space-y-3">
              {albums.map((rga) => {
                const album = rga.releaseGroup
                const albumRating = calculateArtistAlbumRating(album)
                const tracks = album.releases.flatMap(r => r.tracks)
                const coverUrl = album.covers && album.covers.length > 0 ? album.covers[0].url : null

                // Get all artists for this album
                const artists = album.artists
                  .sort((a, b) => a.position - b.position)
                  .map(a => a.artist)

                // Only show artist links for collaborations (albums with multiple artists)
                const isCollaboration = artists.length > 1

                return (
                  <AlbumCard
                    key={album.id}
                    album={{
                      id: album.id,
                      title: album.title,
                      coverUrl,
                      tracksCount: tracks.length,
                      rankValue: albumRating.rankValue > 0 ? albumRating.rankValue : null,
                      rankLabel: albumRating.rankLabel,
                    }}
                    artists={isCollaboration ? artists : undefined} // Only show artists for collaborations
                    year={album.year}
                    primaryType={album.primaryType}
                    coverSize="sm"
                    showArtist={isCollaboration}
                    showYear={true}
                    showType={true}
                    showTrackCount={true}
                    showRating={true}
                    showRatingAsLabel={true}
                  />
                )
              })}
            </div>
          </section>
        )
      })}
    </main>
  )
}
