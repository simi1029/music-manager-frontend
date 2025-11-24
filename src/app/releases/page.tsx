import Link from 'next/link'

async function getData() {
  // In server runtime a relative URL can fail to parse. Build an absolute base URL
  // when NEXT_PUBLIC_BASE_URL isn't provided (use VERCEL_URL when available).
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const res = await fetch(`${base}/api/releases`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to fetch releases: ${res.status} ${res.statusText}`)
  return res.json()
}

export default async function ReleasesPage() {
  const releases = await getData()
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Your Albums</h1>
      <div className="space-y-3">
        {releases.map((r: any) => (
          <div key={r.id} className="border rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{r.title}</div>
              <div className="text-sm text-gray-500">{r.artist}</div>
              <div className="text-sm mt-1">Tracks: {r.tracksCount}</div>
            </div>
            <Link href={`/release/${r.id}`} className="underline">Open</Link>
          </div>
        ))}
      </div>
    </main>
  )
}
