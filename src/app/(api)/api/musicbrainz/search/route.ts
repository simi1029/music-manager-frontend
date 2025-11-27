import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { MusicBrainzClient, buildSearchQuery } from '@/lib/musicbrainz'
import { MBSearchResponseSchema, formatArtistCredit, extractYear } from '@/lib/schemas/musicbrainz'
import { prisma } from '@/lib/db'

/**
 * GET /api/musicbrainz/search
 * 
 * Search for release groups (albums) on MusicBrainz
 * 
 * Query params:
 * - artist: Artist name (optional)
 * - album: Album name (optional)
 * - artistMbid: Artist MBID for exact match (optional)
 * 
 * At least one of artist or album must be provided
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Extract and validate query params
    const { searchParams } = new URL(request.url)
    const artist = searchParams.get('artist') || ''
    const album = searchParams.get('album') || ''
    const artistMbid = searchParams.get('artistMbid') || null
    
    if (!artist && !album) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Provide artist or album name' },
        { status: 400 }
      )
    }

    // 3. Build MusicBrainz query
    let mbQuery: string
    
    if (artistMbid) {
      // Exact artist match using MBID
      mbQuery = `arid:${artistMbid}`
      if (album) {
        mbQuery += ` AND releasegroup:"${album}"`
      }
    } else {
      // Regular text search
      mbQuery = buildSearchQuery(artist, album)
    }
    
    // 4. Call MusicBrainz API
    const mbClient = new MusicBrainzClient()
    const searchResults = await mbClient.searchReleaseGroups(mbQuery, 25)
    
    // 5. Validate response with Zod
    const validated = MBSearchResponseSchema.parse(searchResults)
    
    // 6. Check which results already imported (batch query)
    const mbids = validated['release-groups'].map(rg => rg.id)
    const existingRefs = await prisma.externalRef.findMany({
      where: { musicbrainzId: { in: mbids } },
      select: { musicbrainzId: true, releaseGroupId: true }
    })
    
    const existingMap = new Map(
      existingRefs.map(ref => [ref.musicbrainzId, ref.releaseGroupId])
    )
    
    // 7. Format and return results
    const results = validated['release-groups'].map(rg => ({
      mbid: rg.id,
      title: rg.title,
      artist: formatArtistCredit(rg['artist-credit']),
      year: extractYear(rg['first-release-date']),
      type: rg['primary-type'],
      releaseCount: rg['release-count'] || 0,
      alreadyImported: existingMap.has(rg.id),
      existingAlbumId: existingMap.get(rg.id) || null,
    }))
    
    return NextResponse.json({ results })
  } catch (error) {
    console.error('MusicBrainz search error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to search MusicBrainz' },
      { status: 500 }
    )
  }
}
