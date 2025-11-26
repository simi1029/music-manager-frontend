import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { quantizeRank, LABEL } from '@/lib/rating'

export async function GET() {
  // basic list: latest ReleaseGroups with artist + counts
  const albums = await prisma.releaseGroup.findMany({
    include: {
      artist: true,
      // include tracks and their ratings so we can compute album-level averages
      releases: { include: { tracks: { include: { ratings: true } } } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  })

  const shaped = (albums as any[]).map((a: any) => {
    const tracks = a.releases.flatMap((r: any) => r.tracks)
    // compute per-track average from ratings, then album average across tracks
    const trackAverages = tracks.map((t: any) => {
      if (!t.ratings || t.ratings.length === 0) return 0
      const sum = t.ratings.reduce((s: number, r: any) => s + (r.score ?? 0), 0)
      return sum / t.ratings.length
    })

    const avgRank = trackAverages.length
      ? trackAverages.reduce((s: number, v: number) => s + v, 0) / trackAverages.length
      : 0
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
    }
  })

  return NextResponse.json(shaped)
}
