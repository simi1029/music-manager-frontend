import Link from 'next/link'
import { RATING_BG, quantizeRank } from '@/lib/rating'
import { AlbumsContent } from '@/components/albums'
import { getBaseUrl } from '@/lib/utils'
import type { AlbumListItem } from '@/types/api'

async function getData(): Promise<AlbumListItem[]> {
  const base = getBaseUrl()
  const res = await fetch(`${base}/api/albums`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to fetch albums: ${res.status} ${res.statusText}`)
  return res.json()
}

export default async function AlbumsPage() {
  const albums = await getData()
  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Your Albums</h1>
      <AlbumsContent albums={albums} />
    </main>
  )
}
