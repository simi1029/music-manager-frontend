import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const RatingCreate = z.object({
  trackId: z.string().min(1),
  score: z.number().int().min(0).max(10),
  review: z.string().max(5000).optional(),
})
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = RatingCreate.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { trackId, score, review } = parsed.data
  // You are the only user for now → use a fixed userId 'admin'
  const user = await prisma.user.upsert({
    where: { email: 'admin@local' },
    create: { email: 'admin@local', name: 'Admin', role: 'admin' },
    update: {},
  })
  const rating = await prisma.rating.upsert({
    where: { userId_targetTrackId: { userId: user.id, targetTrackId: trackId } },
    update: { score, review },
    create: { userId: user.id, targetTrackId: trackId, score, review },
  })
  return NextResponse.json(rating, { status: 201 })
}
