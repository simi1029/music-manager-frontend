import { NextResponse } from 'next/server'
import { quantizeRank, LABEL } from '@/lib/rating'
import { getAlbumsList } from '@/lib/queries/albums'
import { withErrorHandler } from '@/lib/apiHelpers'
import { transformAlbumWithRating } from '@/lib/transformers/albums'
import type { AlbumListItem } from '@/types/api'

export async function GET() {
  return withErrorHandler(async () => {
    // Fetch albums using centralized query
    const albums = await getAlbumsList()

    const shaped: AlbumListItem[] = albums.map((a) => {
      // Use transformation layer to calculate rating
      const transformed = transformAlbumWithRating(a)
      const quantized = transformed.rating.rankValue !== null ? quantizeRank(transformed.rating.rankValue) : null
      
      return {
        id: a.id,
        title: a.title,
        artist: {
          id: a.artist?.id ?? '',
          name: a.artist?.name ?? 'Unknown',
        },
        tracksCount: transformed.tracks.length,
        albumRankValue: quantized,
        albumRankLabel: quantized !== null ? LABEL[quantized] : '—',
        coverUrl: transformed.coverUrl,
      }
    })

    return shaped
  }, 'fetch albums')
}
