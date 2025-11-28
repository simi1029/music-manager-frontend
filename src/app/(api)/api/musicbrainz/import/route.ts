import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { MusicBrainzClient } from '@/lib/musicbrainz'
import { MBReleaseSchema, extractArtists, extractYear, mapPrimaryType } from '@/lib/schemas/musicbrainz'
import { prisma } from '@/lib/db'
import { PrimaryType } from '@/generated/prisma/enums'
import { createComponentLogger } from '@/lib/logger'

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

    // Check if already imported by MusicBrainz release-group ID
    const existingReleaseGroup = await prisma.releaseGroup.findUnique({
      where: { musicbrainzId: releaseGroupId }
    })

    if (existingReleaseGroup) {
      return NextResponse.json(
        {
          success: false,
          error: 'DUPLICATE',
          message: 'This album is already in your collection',
          existingAlbumId: existingReleaseGroup.id,
        },
        { status: 409 }
      )
    }

    // Fetch release details from MusicBrainz
    const mbClient = new MusicBrainzClient()
    const releaseData = await mbClient.getRelease(releaseId)

    // Validate response
    const release = MBReleaseSchema.parse(releaseData)

    // Extract artists from artist-credit with join phrases
    const artistCredits = release['artist-credit'] || []
    
    // Get or create artists with MusicBrainz ID matching
    const artistRecordsWithJoin = await Promise.all(
      artistCredits.map(async (ac) => {
        const artist = ac.artist
        if (!artist) {
          throw new Error('Artist data missing in artist-credit')
        }

        let artistRecord = null

        // 1. Try matching by MusicBrainz ID first (most accurate)
        if (artist.id) {
          artistRecord = await prisma.artist.findUnique({
            where: { musicbrainzId: artist.id }
          })
        }

        // 2. Fallback to name matching (case-insensitive)
        if (!artistRecord) {
          artistRecord = await prisma.artist.findFirst({
            where: {
              name: { equals: artist.name, mode: 'insensitive' }
            }
          })

          // If found by name but missing MBID, update it
          if (artistRecord && !artistRecord.musicbrainzId && artist.id) {
            artistRecord = await prisma.artist.update({
              where: { id: artistRecord.id },
              data: { musicbrainzId: artist.id }
            })
          }
        }

        // 3. Create new artist if not found
        if (!artistRecord) {
          artistRecord = await prisma.artist.create({
            data: {
              name: artist.name,
              sortName: artist['sort-name'] || null,
              musicbrainzId: artist.id || null,
            }
          })
        }

        return {
          artist: artistRecord,
          joinPhrase: ac.joinphrase || ''
        }
      })
    )

    // Extract just the artist records for backward compatibility
    const artistRecords = artistRecordsWithJoin.map(ar => ar.artist)

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

    // Create ReleaseGroup (album) with Release, tracks, and multi-artist support
    const releaseGroup = await prisma.releaseGroup.create({
      data: {
        title: albumTitle,
        year,
        primaryType: albumType,
        musicbrainzId: releaseGroupId, // Store MusicBrainz ID for duplicate prevention
        artists: {
          create: artistRecordsWithJoin.map((ar, position) => ({
            artistId: ar.artist.id,
            position,
            joinPhrase: ar.joinPhrase || null
          }))
        },
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
        const createdTrack = tracks.find((ct: { id: string; title: string; number: number; durationSec: number | null }) => ct.title === t.title && ct.number === t.number)
        return {
          id: createdTrack?.id || '',
          number: t.number,
          title: t.title,
        }
      }),
    })

  } catch (error) {
    const logger = createComponentLogger('musicbrainz-import')
    const body = await request.json().catch(() => ({}))
    const session = await getServerSession(authOptions).catch(() => null)
    logger.error({ 
      err: error,
      releaseId: body?.releaseId,
      releaseGroupId: body?.releaseGroupId,
      userId: session?.user?.id
    }, 'MusicBrainz import failed')
    
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
