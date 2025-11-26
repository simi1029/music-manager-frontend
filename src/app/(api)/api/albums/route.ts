import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { quantizeRank, LABEL, calculateAlbumAverage } from '@/lib/rating'
import { extractTracks } from '@/lib/utils'
import type { AlbumListItem } from '@/types/api'

export async function GET() {
  // basic list: latest ReleaseGroups with artist + counts
  const albums = await prisma.releaseGroup.findMany({
    include: {
      artist: true,
      // include tracks and their ratings so we can compute album-level averages
      releases: { include: { tracks: { include: { ratings: true } } } },
      covers: true, // Include covers to get album artwork
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  })

  const shaped: AlbumListItem[] = albums.map((a) => {
    const tracks = extractTracks(a)
    const avgRank = calculateAlbumAverage(tracks)
    // Get the first cover URL if available
    const coverUrl = a.covers && a.covers.length > 0 ? a.covers[0].url : null
    
    return {
      id: a.id,
      title: a.title,
      artist: a.artist?.name ?? 'Unknown',
      artistId: a.artist?.id,
      tracksCount: tracks.length,
      // placeholders until we wire computed views:
      // keep a 1-decimal numeric value for UI, and a human-friendly label
      albumRankValue: Math.round(avgRank * 10) / 10,
      albumRankLabel: avgRank > 0 ? LABEL[quantizeRank(avgRank)] : '—',
      coverUrl,
    }
  })

  return NextResponse.json(shaped)
}
