'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { quantizeRank, RATING_COLORS, RATING_BG } from '@/lib/rating'
import type { ArtistListItem } from '@/types/api'

export function ArtistsContent({ artists }: { artists: ArtistListItem[] }) {
  const router = useRouter()
  
  return (
    <div className="space-y-3">
      {artists.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No artists in your collection yet.</p>
          <p className="text-sm mt-2">Import some albums to get started!</p>
        </div>
      ) : (
        artists.map((artist) => {
          const quantized = artist.avgRating > 0 ? quantizeRank(artist.avgRating) : 0
          const bgClass = quantized > 0 ? RATING_BG[quantized] || 'bg-white' : 'bg-white'
          const textColor = quantized > 0 ? RATING_COLORS[quantized] || 'text-gray-500' : 'text-gray-400'
          
          return (
            <div
              key={artist.id}
              className={`border rounded-lg p-4 transition-all ${bgClass} hover:shadow-md cursor-pointer`}
              onClick={() => router.push(`/artist/${artist.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-lg">{artist.name}</div>
                  <div className="flex gap-3 mt-1 text-sm text-gray-600">
                    {artist.country && <span>🌍 {artist.country}</span>}
                    <span>💿 {artist.albumCount} album{artist.albumCount !== 1 ? 's' : ''}</span>
                    {artist.ratedAlbumCount > 0 && (
                      <span>
                        ⭐ {artist.ratedAlbumCount} rated
                      </span>
                    )}
                  </div>
                </div>
                {artist.avgRating > 0 && (
                  <div className="text-right ml-4">
                    <div className={`text-lg font-medium ${textColor}`}>
                      {artist.avgRating.toFixed(1)}/10
                    </div>
                    <div className="text-xs text-gray-500">avg rating</div>
                  </div>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
