'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useMemo } from 'react'
import { quantizeRank, RATING_COLORS, RATING_BG } from '@/lib/rating'
import type { ArtistListItem } from '@/types/api'

export function ArtistsContent({ artists }: { artists: ArtistListItem[] }) {
  return (
    <div className="space-y-3">
      {artists.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No artists in your collection yet.</p>
          <p className="text-sm mt-2">Import some albums to get started!</p>
        </div>
      ) : (
        artists.map((artist) => <ArtistCard key={artist.id} artist={artist} />)
      )}
    </div>
  )
}

function ArtistCard({ artist }: { artist: ArtistListItem }) {
  const { quantized, bgClass, textColor } = useMemo(() => {
    const quantized = artist.avgRating > 0 ? quantizeRank(artist.avgRating) : 0
    const bgClass = quantized > 0 ? RATING_BG[quantized] || 'bg-white' : 'bg-white'
    const textColor = quantized > 0 ? RATING_COLORS[quantized] || 'text-gray-500' : 'text-gray-400'
    return { quantized, bgClass, textColor }
  }, [artist.avgRating])

  return (
    <Link
      href={`/artist/${artist.id}`}
      className={`border rounded-lg p-4 block transition-all ${bgClass} hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:outline-none`}
    >
      <div className="flex gap-4">
        {/* Artist Image */}
        <div className="flex-shrink-0">
          {artist.imageUrl ? (
            <Image
              src={artist.imageUrl}
              alt={`${artist.name} photo`}
              width={80}
              height={80}
              className="rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
              <svg 
                className="w-10 h-10 text-gray-400" 
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
        <div className="flex-1 flex items-start justify-between min-w-0">
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
    </Link>
  )
}
