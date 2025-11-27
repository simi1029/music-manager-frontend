import { NextResponse } from 'next/server'
import { getArtistsList } from '@/lib/queries/artists'
import { withErrorHandler } from '@/lib/apiHelpers'
import { transformArtistsWithRatings } from '@/lib/transformers/artists'

export async function GET() {
  return withErrorHandler(async () => {
    // Fetch artists using centralized query
    const artists = await getArtistsList()

    // Use transformation layer to calculate ratings and statistics
    const artistsWithStats = transformArtistsWithRatings(artists)

    return artistsWithStats
  }, 'fetch artists')
}
