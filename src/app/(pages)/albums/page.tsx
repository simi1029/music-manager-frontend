import Link from 'next/link'
import { RATING_BG, quantizeRank } from '@/lib/rating'
import { AlbumsContent } from '@/components/AlbumsContent'

async function getData() {
  // In server runtime a relative URL can fail to parse. Build an absolute base URL
  // when NEXT_PUBLIC_BASE_URL isn't provided (use VERCEL_URL when available).
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const res = await fetch(`${base}/api/albums`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to fetch albums: ${res.status} ${res.statusText}`)
  return res.json()
}

export default async function AlbumsPage() {
  const albums = await getData()
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Your Albums</h1>
      <AlbumsContent albums={albums} />
    </main>
  )
}
