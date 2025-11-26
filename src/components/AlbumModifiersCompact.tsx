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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [cover, setCover] = useState(initialCover ?? 5)
  const [production, setProduction] = useState(initialProduction ?? 5)
  const [mix, setMix] = useState(initialMix ?? 5)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error saving modifiers:', error)
      alert('Failed to save modifiers')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    // Reset to initial values
    setCover(initialCover ?? 5)
    setProduction(initialProduction ?? 5)
    setMix(initialMix ?? 5)
    setIsModalOpen(false)
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

  const hasChanges = 
    cover !== (initialCover ?? 5) ||
    production !== (initialProduction ?? 5) ||
    mix !== (initialMix ?? 5)

  return (
    <>
      {/* Compact Display */}
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-600 font-medium">Quality:</span>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-1 rounded-full ${coverColors.text} ${coverColors.bg}`}>
            🎨 Cover {cover}/10
          </span>
          <span className={`px-2 py-1 rounded-full ${productionColors.text} ${productionColors.bg}`}>
            🎚 Production {production}/10
          </span>
          <span className={`px-2 py-1 rounded-full ${mixColors.text} ${mixColors.bg}`}>
            🎧 Mix {mix}/10
          </span>
        </div>
        {finalBoost !== 0 && (
          <span className="text-xs text-gray-500">
            {finalBoost > 0 ? '+' : ''}{finalBoost.toFixed(0)}% quality boost
          </span>
        )}
        <button
          onClick={() => setIsModalOpen(true)}
          className="ml-auto px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          title="Edit quality modifiers"
        >
          ✏️ Edit
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCancel}>
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4">Edit Album Quality</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  🎨 Cover: {cover}/10
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={cover}
                  onChange={(e) => setCover(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  🎚 Production: {production}/10
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={production}
                  onChange={(e) => setProduction(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  🎧 Mix: {mix}/10
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={mix}
                  onChange={(e) => setMix(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="pt-2 border-t text-sm text-gray-600">
                <div>Average: {((cover + production + mix) / 3).toFixed(1)} (Neutral = 5.0)</div>
                {cover >= 9 && production >= 9 && mix >= 9 && (
                  <div className="text-green-600 font-medium mt-1">
                    ⭐ Bonus +5% for excellent quality!
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSubmitting || !hasChanges}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
