'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { quantizeRank, RATING_COLORS, RATING_BG } from '@/lib/rating'

type AlbumModifiersCompactProps = {
  albumId: string
  coverValue: number | null
  productionValue: number | null
  mixValue: number | null
}

export function AlbumModifiersCompact({
  albumId,
  coverValue: initialCover,
  productionValue: initialProduction,
  mixValue: initialMix,
}: AlbumModifiersCompactProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)
  const [cover, setCover] = useState(initialCover ?? 5)
  const [production, setProduction] = useState(initialProduction ?? 5)
  const [mix, setMix] = useState(initialMix ?? 5)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const hasChanges = 
    cover !== (initialCover ?? 5) ||
    production !== (initialProduction ?? 5) ||
    mix !== (initialMix ?? 5)

  // Calculate quality boost
  const coverBoost = cover - 5
  const productionBoost = production - 5
  const mixBoost = mix - 5
  const totalBoost = coverBoost + productionBoost + mixBoost
  const bonusMultiplier = (cover >= 9 && production >= 9 && mix >= 9) ? 1.05 : 1.0
  const finalBoost = totalBoost * bonusMultiplier

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/album-modifiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          albumId,
          coverValue: cover,
          productionValue: production,
          mixValue: mix,
        }),
      })
      if (!res.ok) throw new Error('Failed to save modifiers')
      router.refresh()
      setIsExpanded(false)
    } catch (error) {
      console.error('Error saving modifiers:', error)
      alert('Failed to save modifiers')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setCover(initialCover ?? 5)
    setProduction(initialProduction ?? 5)
    setMix(initialMix ?? 5)
    setIsExpanded(false)
  }

  const getColorForValue = (value: number) => {
    const quantized = quantizeRank(value)
    return {
      text: RATING_COLORS[quantized] || "text-gray-500",
      bg: RATING_BG[quantized] || "bg-gray-100"
    }
  }

  const coverColors = getColorForValue(cover)
  const productionColors = getColorForValue(production)
  const mixColors = getColorForValue(mix)

  const renderButtons = (value: number, setValue: (val: number) => void, colors: { text: string; bg: string }) => {
    return (
      <div className="flex gap-0.5">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
          const isSelected = value === num
          return (
            <button
              key={num}
              onClick={() => setValue(num)}
              className={`w-7 h-7 text-xs font-medium rounded transition-all ${
                isSelected
                  ? `${colors.text} ${colors.bg} shadow-sm scale-110`
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              }`}
              title={`${num}/10`}
            >
              {num}
            </button>
          )
        })}
      </div>
    )
  }

  if (!isExpanded) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <button
            onClick={() => setIsExpanded(true)}
            className={`px-2 py-1 rounded-full ${coverColors.text} ${coverColors.bg} hover:opacity-80 transition-opacity cursor-pointer`}
          >
            🎨 Cover {cover}/10
          </button>
          <button
            onClick={() => setIsExpanded(true)}
            className={`px-2 py-1 rounded-full ${productionColors.text} ${productionColors.bg} hover:opacity-80 transition-opacity cursor-pointer`}
          >
            🎚 Production {production}/10
          </button>
          <button
            onClick={() => setIsExpanded(true)}
            className={`px-2 py-1 rounded-full ${mixColors.text} ${mixColors.bg} hover:opacity-80 transition-opacity cursor-pointer`}
          >
            🎧 Mix {mix}/10
          </button>
        </div>
        {finalBoost !== 0 && (
          <div className="text-xs text-gray-500">
            {finalBoost > 0 ? '+' : ''}{finalBoost.toFixed(0)}% quality boost
            {cover >= 9 && production >= 9 && mix >= 9 && (
              <span className="text-green-600 font-medium ml-2">⭐ +5% bonus!</span>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600 w-20">🎨 Cover</span>
          {renderButtons(cover, setCover, coverColors)}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600 w-20">🎚 Production</span>
          {renderButtons(production, setProduction, productionColors)}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600 w-20">🎧 Mix</span>
          {renderButtons(mix, setMix, mixColors)}
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs">
        {finalBoost !== 0 ? (
          <div className="text-gray-500">
            {finalBoost > 0 ? '+' : ''}{finalBoost.toFixed(0)}% quality boost
            {cover >= 9 && production >= 9 && mix >= 9 && (
              <span className="text-green-600 font-medium ml-2">⭐ +5% bonus!</span>
            )}
          </div>
        ) : (
          <div></div>
        )}
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-xs font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting || !hasChanges}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors text-xs font-medium"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
