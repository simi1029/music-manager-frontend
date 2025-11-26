import Link from 'next/link'
import { RATING_BG } from '@/lib/rating-colors'
import { quantizeRank } from '@/lib/rating'

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
      <div className="space-y-3">
        {albums.map((r: any) => {
          const quantized = r.albumRankValue > 0 ? quantizeRank(r.albumRankValue) : 0
          const bgClass = quantized > 0 ? RATING_BG[quantized] || 'bg-white' : 'bg-white'
          return (
            <div 
              key={r.id}
              className={`border rounded-lg p-4 transition-all ${bgClass} hover:shadow-md`}
            >
              <Link 
                href={`/album/${r.id}`}
                className="block cursor-pointer"
              >
                <div>
                  <div className="font-medium">{r.title}</div>
                  {r.artistId && (
                    <Link 
                      href={`/artist/${r.artistId}`}
                      className="text-sm text-gray-500 hover:text-gray-700 hover:underline inline-block relative z-10"
                    >
                      {r.artist}
                    </Link>
                  )}
                  <div className="text-sm mt-1">Tracks: {r.tracksCount}</div>
                </div>
              </Link>
            </div>
          )
        })}
      </div>
    </main>
  )
}
