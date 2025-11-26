import { NextResponse } from 'next/server'
import { quantizeRank, LABEL, calculateAlbumAverage } from '@/lib/rating'
import { extractTracks } from '@/lib/utils'
import { getAlbumsList } from '@/lib/queries/albums'
import type { AlbumListItem } from '@/types/api'

export async function GET() {
  // Fetch albums using centralized query
  const albums = await getAlbumsList()

  const shaped: AlbumListItem[] = albums.map((a) => {
    const tracks = extractTracks(a)
    const hasRatings = tracks.some(t => t.ratings && t.ratings.length > 0)
    const avgRank = hasRatings ? calculateAlbumAverage(tracks) : null
    const quantized = avgRank !== null ? quantizeRank(avgRank) : null
    // Get the first cover URL if available
    const coverUrl = a.covers && a.covers.length > 0 ? a.covers[0].url : null
    
    return {
      id: a.id,
      title: a.title,
      artist: a.artist?.name ?? 'Unknown',
      artistId: a.artist?.id,
      tracksCount: tracks.length,
      albumRankValue: quantized,
      albumRankLabel: quantized !== null ? LABEL[quantized] : '—',
      coverUrl,
    }
  })

  return NextResponse.json(shaped)
}
