import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { MusicBrainzClient } from '@/lib/musicbrainz'
import { MBReleaseSchema, extractArtists, extractYear, mapPrimaryType } from '@/lib/schemas/musicbrainz'
import { prisma } from '@/lib/db'
import { PrimaryType } from '@/generated/prisma/enums'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { releaseId, releaseGroupId } = body

    if (!releaseId || !releaseGroupId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Release ID and Release Group ID are required'
        },
        { status: 400 }
      )
    }

    // Check if already imported
    const existingRef = await prisma.externalRef.findFirst({
      where: {
        musicbrainzId: releaseGroupId,
      },
      include: {
        releaseGroup: true,
      },
    })

    if (existingRef) {
      return NextResponse.json(
        {
          success: false,
          error: 'DUPLICATE',
          message: 'This album is already in your collection',
          existingAlbumId: existingRef.releaseGroupId,
        },
        { status: 409 }
      )
    }

    // Fetch release details from MusicBrainz
    const mbClient = new MusicBrainzClient()
    const releaseData = await mbClient.getRelease(releaseId)

    // Validate response
    const release = MBReleaseSchema.parse(releaseData)

    // Extract artists
    const artists = extractArtists(release['artist-credit'])
    
    // Get or create artists
    const artistRecords = await Promise.all(
      artists.map(async (artist) => {
        // Check if artist exists by name
        let artistRecord = await prisma.artist.findFirst({
          where: {
            name: artist.name,
          },
        })

        if (!artistRecord) {
          // Create new artist
          artistRecord = await prisma.artist.create({
            data: {
              name: artist.name,
              sortName: artist.sortName,
            },
          })
        }

        return artistRecord
      })
    )

    // Extract album info
    const albumTitle = release.title
    const year = extractYear(release.date)
    const albumType: PrimaryType = release['release-group']?.['primary-type'] 
      ? mapPrimaryType(release['release-group']['primary-type'])
      : PrimaryType.ALBUM

    // Flatten all tracks from all media
    const allTracks = release.media?.flatMap((medium, mediumIndex) => 
      medium.tracks?.map((track, trackIndex) => {
        const positionStr = String(track.position || (trackIndex + 1))
        return {
          number: mediumIndex * 100 + parseInt(positionStr),
          title: track.title,
          durationSec: track.length ? Math.round(track.length / 1000) : null,
          position: track.position,
          mediumNumber: mediumIndex + 1,
        }
      }) || []
    ) || []

    // Check for tracks with null duration
    const tracksWithNullDuration = allTracks.filter(t => t.durationSec === null)
    const warnings: string[] = []
    if (tracksWithNullDuration.length > 0) {
      warnings.push(`${tracksWithNullDuration.length} track(s) missing duration data`)
    }

    // Create ReleaseGroup (album) with Release and tracks
    const releaseGroup = await prisma.releaseGroup.create({
      data: {
        title: albumTitle,
        year,
        primaryType: albumType,
        artistId: artistRecords[0].id, // Use first artist as primary
        external: {
          create: {
            musicbrainzId: releaseGroupId,
          },
        },
        releases: {
          create: {
            title: release.title,
            tracks: {
              create: allTracks.map(track => ({
                number: track.number,
                title: track.title,
                durationSec: track.durationSec,
              })),
            },
          },
        },
      },
      include: {
        releases: {
          include: {
            tracks: {
              select: {
                id: true,
                number: true,
                title: true,
                durationSec: true,
              },
            },
          },
        },
      },
    })

    const firstRelease = releaseGroup.releases[0]
    const tracks = firstRelease?.tracks || []

    return NextResponse.json({
      success: true,
      albumId: releaseGroup.id,
      message: 'Album imported successfully',
      warnings,
      tracksWithNullDuration: tracksWithNullDuration.map(t => {
        const createdTrack = tracks.find(ct => ct.title === t.title && ct.number === t.number)
        return {
          id: createdTrack?.id || '',
          number: t.number,
          title: t.title,
        }
      }),
    })

  } catch (error) {
    console.error('MusicBrainz import error:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          {
            success: false,
            error: 'NOT_FOUND',
            message: 'Album not found in MusicBrainz',
          },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'IMPORT_ERROR',
        message: 'Failed to import album',
      },
      { status: 500 }
    )
  }
}
