'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { RATING_BG, quantizeRank } from '@/lib/rating'
import type { AlbumListItem } from '@/types/api'

export function AlbumsContent({ albums }: { albums: AlbumListItem[] }) {
  const router = useRouter()
  
  return (
    <div className="space-y-3">
      {albums.map((r) => {
        const quantized = r.albumRankValue > 0 ? quantizeRank(r.albumRankValue) : 0
        const bgClass = quantized > 0 ? RATING_BG[quantized] || 'bg-white' : 'bg-white'
        return (
          <div 
            key={r.id}
            className={`border rounded-lg p-4 transition-all ${bgClass} hover:shadow-md cursor-pointer`}
            onClick={() => router.push(`/album/${r.id}`)}
          >
            <div>
              <div className="font-medium">{r.title}</div>
              {r.artistId && (
                <Link 
                  href={`/artist/${r.artistId}`}
                  className="text-sm text-gray-500 hover:text-gray-700 hover:underline inline-block"
                  onClick={(e) => e.stopPropagation()}
                >
                  {r.artist}
                </Link>
              )}
              <div className="text-sm mt-1">Tracks: {r.tracksCount}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
