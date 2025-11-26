import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { computeAlbumRating } from '@/lib/rating'

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
      
      // Calculate average rating across all albums
      let totalRating = 0
      let ratedAlbumCount = 0
      
      for (const group of artist.groups) {
        const tracks = group.releases.flatMap(r => r.tracks)
        const hasRatings = tracks.some(t => t.ratings && t.ratings.length > 0)
        
        if (hasRatings) {
          const albumRating = computeAlbumRating(
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
          totalRating += albumRating.rankValue
          ratedAlbumCount++
        }
      }
      
      const avgRating = ratedAlbumCount > 0 ? totalRating / ratedAlbumCount : 0
      
      return {
        id: artist.id,
        name: artist.name,
        country: artist.country,
        albumCount,
        ratedAlbumCount,
        avgRating: Math.round(avgRating * 10) / 10 // Round to 1 decimal
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
