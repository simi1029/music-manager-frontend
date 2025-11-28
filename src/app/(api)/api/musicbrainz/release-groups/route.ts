import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { MusicBrainzClient } from '@/lib/musicbrainz'
import { MBReleaseGroupSchema } from '@/lib/schemas/musicbrainz'
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
    const releaseGroupId = searchParams.get('releaseGroupId')
    
    if (!releaseGroupId || releaseGroupId.trim() === '') {
      return NextResponse.json(
        { error: 'Release Group ID is required' },
        { status: 400 }
      )
    }

    // Get release group details with releases from MusicBrainz
    const mbClient = new MusicBrainzClient()
    const response = await mbClient.getReleaseGroupDetails(releaseGroupId)

    // Validate response
    const validatedReleaseGroup = MBReleaseGroupSchema.parse(response)

    // Format releases for selection
    const releases = validatedReleaseGroup.releases?.map(release => ({
      id: release.id,
      title: release.title,
      status: release.status,
      country: release.country,
      date: release.date,
      barcode: release.barcode,
      format: release.format
    })) || []

    return NextResponse.json({
      id: validatedReleaseGroup.id,
      title: validatedReleaseGroup.title,
      primaryType: validatedReleaseGroup['primary-type'],
      firstReleaseDate: validatedReleaseGroup['first-release-date'],
      releases
    })

  } catch (error) {
    const logger = createComponentLogger('musicbrainz-release-groups')
    const releaseGroupId = request.nextUrl.searchParams.get('releaseGroupId')
    logger.error({ err: error, releaseGroupId }, 'Release group fetch failed')
    return NextResponse.json(
      { error: 'Failed to fetch release group details' },
      { status: 500 }
    )
  }
}