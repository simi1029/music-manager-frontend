import { NextResponse } from 'next/server'
import { computeAlbumRating, computeArtistRating } from '@/lib/rating'
import { getArtistsList } from '@/lib/queries/artists'
import { withErrorHandler } from '@/lib/apiHelpers'

export async function GET() {
  return withErrorHandler(async () => {
    // Fetch artists using centralized query
    const artists = await getArtistsList()

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

    return artistsWithStats
  }, 'fetch artists')
}
