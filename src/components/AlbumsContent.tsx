'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { RATING_BG } from '@/lib/rating-colors'
import { quantizeRank } from '@/lib/rating'

export function AlbumsContent({ albums }: { albums: any[] }) {
  const router = useRouter()
  
  return (
    <div className="space-y-3">
      {albums.map((r: any) => {
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
