import { ArtistsContent } from '@/components/ArtistsContent'
import { getBaseUrl } from '@/lib/utils'
import type { ArtistListItem } from '@/types/api'

async function getData(): Promise<ArtistListItem[]> {
  const base = getBaseUrl()
  const res = await fetch(`${base}/api/artists`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to fetch artists: ${res.status} ${res.statusText}`)
  return res.json()
}

export default async function ArtistsPage() {
  const artists = await getData()
  
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Artists</h1>
        <div className="text-sm text-gray-500">
          {artists.length} artist{artists.length !== 1 ? 's' : ''}
        </div>
      </div>
      <ArtistsContent artists={artists} />
    </main>
  )
}
