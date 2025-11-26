import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { computeAlbumRating, computeArtistRating } from '@/lib/rating'

export async function GET() {
  try {
    const artists = await prisma.artist.findMany({
      include: {
        groups: {
          include: {
            releases: {
              include: {
                tracks: {
                  include: {
                    ratings: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    const artistsWithStats = artists.map(artist => {
      const albumCount = artist.groups.length
      
      // Calculate rating for each album
      const albumRatings = artist.groups.map(group => {
        const tracks = group.releases.flatMap(r => r.tracks)
        const hasRatings = tracks.some(t => t.ratings && t.ratings.length > 0)
        
        if (!hasRatings) {
          return { rankValue: 0, finalAlbumRating: 0 }
        }
        
        return computeAlbumRating(
          tracks.map(t => ({
            durationSec: t.durationSec,
            ratings: t.ratings || []
          })),
          {
            cover: group.coverValue ?? undefined,
            production: group.productionValue ?? undefined,
            mix: group.mixValue ?? undefined
          }
        )
      })
      
      // Compute artist rating (filters out unrated albums automatically)
      const artistRating = computeArtistRating(albumRatings)
      const ratedAlbumCount = albumRatings.filter(a => a.rankValue > 0).length
      
      return {
        id: artist.id,
        name: artist.name,
        country: artist.country,
        albumCount,
        ratedAlbumCount,
        avgRating: artistRating.avgFinalRating,
        rankValue: artistRating.rankValue,
        rankLabel: artistRating.rankLabel,
        imageUrl: artist.imageUrl
      }
    })

    return NextResponse.json(artistsWithStats)
  } catch (error) {
    console.error('Error fetching artists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch artists' },
      { status: 500 }
    )
  }
}
