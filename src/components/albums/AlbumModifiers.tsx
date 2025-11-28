'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createComponentLogger } from '@/lib/logger'

type AlbumModifiersProps = {
  albumId: string
  coverValue: number | null
  productionValue: number | null
  mixValue: number | null
}

export function AlbumModifiers({
  albumId,
  coverValue: initialCover,
  productionValue: initialProduction,
  mixValue: initialMix,
}: AlbumModifiersProps) {
  const router = useRouter()
  const [cover, setCover] = useState(initialCover ?? 5)
  const [production, setProduction] = useState(initialProduction ?? 5)
  const [mix, setMix] = useState(initialMix ?? 5)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    } catch (error) {
      const logger = createComponentLogger('album-modifiers')
      logger.error({ 
        err: error, 
        albumId, 
        modifiers: { cover, production, mix }
      }, 'Failed to save album modifiers')
      alert('Failed to save modifiers')
    } finally {
      setIsSubmitting(false)
    }
  }

  const average = ((cover + production + mix) / 3).toFixed(1)
  const hasChanges = 
    cover !== (initialCover ?? 5) ||
    production !== (initialProduction ?? 5) ||
    mix !== (initialMix ?? 5)

  return (
    <section className="border rounded-lg p-4 bg-gray-50">
      <h2 className="text-lg font-medium mb-3">Album Quality Modifiers</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Cover: {cover}/10
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
            Production: {production}/10
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
            Mix: {mix}/10
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
        <div className="pt-2 border-t">
          <div className="text-sm text-gray-600">
            Average: {average} (Neutral = 5.0)
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSubmitting || !hasChanges}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Saving...' : hasChanges ? 'Save Modifiers' : 'No Changes'}
        </button>
      </div>
    </section>
  )
}
