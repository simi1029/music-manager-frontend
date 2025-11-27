import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { MusicBrainzClient } from '@/lib/musicbrainz'
import { MBArtistSearchResponseSchema } from '@/lib/schemas/musicbrainz'
import { z } from 'zod'

const QuerySchema = z.object({
  query: z.string().min(1, 'Search query is required')
})

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParam = searchParams.get('query')
    
    if (!queryParam || queryParam.trim() === '') {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    // Search MusicBrainz for artists
    const mbClient = new MusicBrainzClient()
    const response = await mbClient.searchArtists(queryParam, 25)

    // Validate response
    const validatedResponse = MBArtistSearchResponseSchema.parse(response)

    // Format results
    const results = validatedResponse.artists?.map(artist => ({
      mbid: artist.id,
      name: artist.name,
      sortName: artist['sort-name'],
      type: artist.type,
      disambiguation: artist.disambiguation,
      score: artist.score
    })) || []

    return NextResponse.json({
      results,
      count: validatedResponse.count || 0,
      offset: validatedResponse.offset || 0
    })

  } catch (error) {
    console.error('MusicBrainz artist search error:', error)
    return NextResponse.json(
      { error: 'Failed to search artists' },
      { status: 500 }
    )
  }
}
