'use client'

import Link from 'next/link'
import Image from 'next/image'
import { memo, useMemo } from 'react'
import { RATING_BG, RATING_TEXT_COLORS, quantizeRank } from '@/lib/rating'
import { RatingBadge } from './RatingBadge'

export interface AlbumCardProps {
  // Required data
  album: {
    id: string
    title: string
    coverUrl?: string | null
    tracksCount?: number
    rating?: number | null // 0-10 scale
    rankValue?: number | null // Quantized rank value (null = unrated)
    rankLabel?: string // Textual rank label
  }

  // Optional context-specific data
  artist?: {
    id: string
    name: string
  }
  artists?: Array<{ // New: support multiple artists
    id: string
    name: string
  }>

  year?: number | null
  primaryType?: string

  // Display configuration
  coverSize?: 'sm' | 'md' | 'lg' // 64px, 80px, 120px
  
  // Conditional rendering
  showArtist?: boolean
  showYear?: boolean
  showType?: boolean
  showTrackCount?: boolean
  showRating?: boolean
  showRatingAsLabel?: boolean // Show textual label ("Excellent") instead of numeric (7/10)

  // Behavior customization
  onClick?: (albumId: string) => void // Override default navigation
  clickable?: boolean // Default: true

  // Style overrides
  className?: string
}

export const AlbumCard = memo(function AlbumCard({
  album,
  artist,
  artists,
  year,
  primaryType,
  coverSize = 'md',
  showArtist = true,
  showYear = true,
  showType = false,
  showTrackCount = true,
  showRating = true,
  showRatingAsLabel = false,
  onClick,
  clickable = true,
  className = '',
}: AlbumCardProps) {
  // Determine which artists to display (prefer artists array, fallback to single artist)
  const displayArtists = useMemo(() => {
    if (artists && artists.length > 0) return artists
    if (artist) return [artist]
    return []
  }, [artists, artist])

  const artistNames = useMemo(() => 
    displayArtists.map(a => a.name).join(' & '),
    [displayArtists]
  )

  // Primary type color scheme - designed to work on all rating background colors
  const primaryTypeStyle = useMemo(() => {
    const styles: Record<string, { bg: string; text: string; border: string }> = {
      'ALBUM': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
      'SINGLE': { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-300' },
      'EP': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
      'COMPILATION': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
      'LIVE': { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300' },
      'SOUNDTRACK': { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800', border: 'border-fuchsia-300' },
      'OTHER': { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' },
    }
    return styles[primaryType || 'OTHER'] || styles['OTHER']
  }, [primaryType])

  // Calculate rating-based styling
  const { quantized, bgClass, textColor, artistLinkColor, metadataColor } = useMemo(() => {
    const quantized = album.rankValue ?? null
    // null = unrated (no color), 0 = rated as Poor (red color), >0 = other ratings
    const bgClass = quantized !== null ? RATING_BG[quantized] || 'bg-white' : 'bg-white'
    const textColor = quantized !== null ? RATING_TEXT_COLORS[quantized] || 'text-gray-900' : 'text-gray-900'
    // Artist link and metadata use slightly lighter shade for hierarchy
    const artistLinkColor = quantized !== null ? RATING_TEXT_COLORS[quantized]?.replace('-900', '-700') || 'text-gray-500' : 'text-gray-500'
    const metadataColor = quantized !== null ? RATING_TEXT_COLORS[quantized]?.replace('-900', '-700') || 'text-gray-600' : 'text-gray-600'
    return { quantized, bgClass, textColor, artistLinkColor, metadataColor }
  }, [album.rankValue])

  // Determine cover size in pixels
  const coverPx = useMemo(() => {
    switch (coverSize) {
      case 'sm': return 64
      case 'md': return 80
      case 'lg': return 120
      default: return 80
    }
  }, [coverSize])

  // Handle card click
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!clickable) return
    
    // Only navigate if clicking on the card itself, not on interactive elements
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.album-content')) {
      if (onClick) {
        onClick(album.id)
      } else {
        window.location.href = `/album/${album.id}`
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!clickable) return
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (onClick) {
        onClick(album.id)
      } else {
        window.location.href = `/album/${album.id}`
      }
    }
  }

  const baseClassName = `border rounded-lg p-4 transition-all ${bgClass} hover:shadow-md ${
    clickable ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500' : ''
  } ${className}`

  return (
    <div
      className={baseClassName}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={clickable ? 0 : undefined}
      role="article"
      aria-label={`Album: ${album.title}${artistNames ? ` by ${artistNames}` : ''}`}
    >
      <div className="album-content flex gap-4">
        {/* Album Cover */}
        <div className="flex-shrink-0">
          {album.coverUrl ? (
            <Image
              src={album.coverUrl}
              alt={`${album.title} album cover`}
              width={coverPx}
              height={coverPx}
              className="rounded object-cover"
              loading="lazy"
            />
          ) : (
            <div
              className="bg-gradient-to-br from-gray-200 to-gray-300 rounded flex items-center justify-center"
              style={{ width: coverPx, height: coverPx }}
            >
              <svg
                className="text-gray-400"
                style={{ width: coverPx / 2.5, height: coverPx / 2.5 }}
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
          )}
        </div>

        {/* Album Info */}
        <div className="flex-1 min-w-0 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className={`font-medium truncate ${textColor}`}>{album.title}</div>
            
            {/* Artist Links */}
            {showArtist && displayArtists.length > 0 && (
              <div className="text-sm">
                {displayArtists.map((a, idx) => (
                  <span key={a.id}>
                    <Link
                      href={`/artist/${a.id}`}
                      className={`${artistLinkColor} hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {a.name}
                    </Link>
                    {idx < displayArtists.length - 1 && <span className={artistLinkColor}> & </span>}
                  </span>
                ))}
              </div>
            )}
            
            {/* Metadata Line */}
            <div className={`text-sm mt-1 ${metadataColor} flex items-center gap-1.5`}>
              {showYear && year && <span>{year}</span>}
              {showYear && year && showType && primaryType && <span> · </span>}
              {showType && primaryType && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${primaryTypeStyle.bg} ${primaryTypeStyle.text} ${primaryTypeStyle.border} border`}>
                  {primaryType}
                </span>
              )}
              {((showYear && year) || (showType && primaryType)) && showTrackCount && album.tracksCount !== undefined && <span> · </span>}
              {showTrackCount && album.tracksCount !== undefined && (
                <span className="flex items-center gap-1">
                  <svg
                    className="inline-block"
                    style={{ width: 14, height: 14 }}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                  {album.tracksCount}
                </span>
              )}
            </div>
          </div>

          {/* Rating */}
          {showRating && quantized !== null && (
            <div className="text-right ml-4 flex-shrink-0">
              <RatingBadge
                rankValue={album.rankValue}
                rankLabel={album.rankLabel}
                variant="album"
                display={showRatingAsLabel ? 'label' : 'numeric'}
                size="md"
                showBackground={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
