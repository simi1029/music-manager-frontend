'use client'

import { AlbumCard } from './AlbumCard'
import type { AlbumListItem } from '@/types/api'

export function AlbumsContent({ albums }: { albums: AlbumListItem[] }) {
  return (
    <div className="space-y-3">
      {albums.map((album) => (
        <AlbumCard
          key={album.id}
          album={{
            id: album.id,
            title: album.title,
            coverUrl: album.coverUrl,
            tracksCount: album.tracksCount,
            rankValue: album.albumRankValue,
            rankLabel: album.albumRankLabel,
          }}
          artist={album.artist}
          coverSize="md"
          showArtist={true}
          showTrackCount={true}
          showRating={true}
          showRatingAsLabel={true}
        />
      ))}
    </div>
  )
}