'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { RATING_BG, quantizeRank } from '@/lib/rating'
import type { AlbumListItem } from '@/types/api'

export function AlbumsContent({ albums }: { albums: AlbumListItem[] }) {
  return (
    <div className="space-y-3">
      {albums.map((r) => <AlbumCard key={r.id} album={r} />)}
    </div>
  )
}

function AlbumCard({ album }: { album: AlbumListItem }) {
  const { quantized, bgClass } = useMemo(() => {
    const quantized = album.albumRankValue > 0 ? quantizeRank(album.albumRankValue) : 0
    const bgClass = quantized > 0 ? RATING_BG[quantized] || 'bg-white' : 'bg-white'
    return { quantized, bgClass }
  }, [album.albumRankValue])

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only navigate if clicking on the card itself, not on interactive elements
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.album-content')) {
      window.location.href = `/album/${album.id}`
    }
  }

  return (
    <div 
      className={`border rounded-lg p-4 transition-all ${bgClass} hover:shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500`}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          window.location.href = `/album/${album.id}`
        }
      }}
      tabIndex={0}
      role="article"
      aria-label={`Album: ${album.title} by ${album.artist}`}
    >
      <div className="album-content">
        <div className="font-medium">{album.title}</div>
        {album.artistId && (
          <Link
            href={`/artist/${album.artistId}`}
            className="text-sm text-gray-500 hover:text-gray-700 hover:underline inline-block focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            onClick={(e) => e.stopPropagation()}
          >
            {album.artist}
          </Link>
        )}
        <div className="text-sm mt-1">Tracks: {album.tracksCount}</div>
      </div>
    </div>
  )
}