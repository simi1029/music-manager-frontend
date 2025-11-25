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

const RatingDelete = z.object({
  trackId: z.string().min(1),
})

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = RatingDelete.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { trackId } = parsed.data
  // Get the admin user
  const user = await prisma.user.findUnique({
    where: { email: 'admin@local' },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  // Delete the rating
  await prisma.rating.delete({
    where: { userId_targetTrackId: { userId: user.id, targetTrackId: trackId } },
  }).catch(() => {
    // Ignore if rating doesn't exist
  })
  return NextResponse.json({ success: true }, { status: 200 })
}
