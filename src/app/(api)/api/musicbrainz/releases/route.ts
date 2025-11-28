import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { MusicBrainzClient } from '@/lib/musicbrainz'
import { MBReleaseSchema } from '@/lib/schemas/musicbrainz'
import { createComponentLogger } from '@/lib/logger'

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
    const releaseId = searchParams.get('releaseId')
    
    if (!releaseId || releaseId.trim() === '') {
      return NextResponse.json(
        { error: 'Release ID is required' },
        { status: 400 }
      )
    }

    // Get release details from MusicBrainz
    const mbClient = new MusicBrainzClient()
    const response = await mbClient.getRelease(releaseId)

    // Validate response
    const validatedRelease = MBReleaseSchema.parse(response)

    // Format tracks
    const tracks = validatedRelease.media?.flatMap((medium, mediumIndex) => 
      medium.tracks?.map(track => ({
        position: track.position,
        title: track.title,
        duration: track.length,
        mediumNumber: mediumIndex + 1,
        trackNumber: track.position
      })) || []
    ) || []

    return NextResponse.json({
      id: validatedRelease.id,
      title: validatedRelease.title,
      tracks
    })

  } catch (error) {
    const logger = createComponentLogger('musicbrainz-releases')
    const releaseId = request.nextUrl.searchParams.get('releaseId')
    logger.error({ err: error, releaseId }, 'Release fetch failed')
    return NextResponse.json(
      { error: 'Failed to fetch release details' },
      { status: 500 }
    )
  }
}
