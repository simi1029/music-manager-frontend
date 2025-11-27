'use client'

import { memo, useMemo } from 'react'
import { 
  quantizeRank, 
  LABEL, 
  ARTIST_LABEL, 
  RATING_BG, 
  RATING_TEXT_COLORS,
  type ScaleValue 
} from '@/lib/rating'

export interface RatingBadgeProps {
  // Input data (provide one of these)
  value?: number | null          // Raw rating value 0-10 (will be quantized)
  rankValue?: number | null      // Pre-quantized rank value (0,1,2,3,4,5,7,10)
  rankLabel?: string             // Pre-calculated label text
  
  // Display configuration
  variant?: 'album' | 'artist' | 'track'  // Determines which label set to use
  display?: 'numeric' | 'label' | 'both'  // How to display the rating
  size?: 'sm' | 'md' | 'lg'               // Size of the badge
  
  // Style options
  showBackground?: boolean       // Show colored background
  className?: string             // Additional CSS classes
}

export const RatingBadge = memo(function RatingBadge({
  value,
  rankValue,
  rankLabel,
  variant = 'album',
  display = 'numeric',
  size = 'md',
  showBackground = false,
  className = '',
}: RatingBadgeProps) {
  // Calculate quantized rank if needed
  const quantized = useMemo(() => {
    if (rankValue !== undefined && rankValue !== null) {
      return rankValue as ScaleValue
    }
    if (value !== undefined && value !== null) {
      return quantizeRank(value)
    }
    return null
  }, [value, rankValue])

  // Determine label text
  const labelText = useMemo(() => {
    if (rankLabel) return rankLabel
    if (quantized === null) return '—'
    
    // Use appropriate label set based on variant
    if (variant === 'artist') {
      return ARTIST_LABEL[quantized]
    }
    return LABEL[quantized]
  }, [rankLabel, quantized, variant])

  // Calculate styling
  const { bgClass, textColor, sizeClass } = useMemo(() => {
    const bgClass = showBackground && quantized !== null 
      ? RATING_BG[quantized] || 'bg-gray-100' 
      : ''
    
    const textColor = quantized !== null 
      ? RATING_TEXT_COLORS[quantized] || 'text-gray-900'
      : 'text-gray-500'
    
    const sizeClass = size === 'sm' 
      ? 'text-sm' 
      : size === 'lg' 
      ? 'text-xl font-bold' 
      : 'text-lg font-medium'
    
    return { bgClass, textColor, sizeClass }
  }, [quantized, showBackground, size])

  // If no rating data, show placeholder
  if (quantized === null && !rankLabel) {
    return (
      <div className={`${sizeClass} text-gray-400 ${className}`}>
        —
      </div>
    )
  }

  // Render based on display mode
  const baseClass = `${sizeClass} ${textColor} ${bgClass ? `${bgClass} px-2 py-1 rounded` : ''} ${className}`

  if (display === 'numeric') {
    return (
      <div className={baseClass}>
        {quantized !== null ? `${quantized}/10` : '—'}
      </div>
    )
  }

  if (display === 'label') {
    return (
      <div className={baseClass}>
        {labelText}
      </div>
    )
  }

  // display === 'both'
  return (
    <div className={`flex flex-col items-end ${className}`}>
      <div className={`${sizeClass} font-bold ${textColor}`}>
        {quantized !== null ? `${quantized}/10` : '—'}
      </div>
      <div className={`text-xs ${textColor}`}>
        {labelText}
      </div>
    </div>
  )
})
