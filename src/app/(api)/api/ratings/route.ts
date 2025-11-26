import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { withAuthErrorHandler } from '@/lib/apiHelpers'
import { z } from 'zod'

const RatingCreate = z.object({
  trackId: z.string().min(1),
  score: z.number().int().min(0).max(10),
  review: z.string().max(5000).optional(),
})

export async function POST(req: Request) {
  return withAuthErrorHandler(async () => {
    const user = await requireAuth()
    
    const body = await req.json().catch(() => null)
    const parsed = RatingCreate.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const { trackId, score, review } = parsed.data
    
    const rating = await prisma.rating.upsert({
      where: { userId_targetTrackId: { userId: user.id, targetTrackId: trackId } },
      update: { score, review },
      create: { userId: user.id, targetTrackId: trackId, score, review },
    })
    return rating
  }, 'create rating')
}

const RatingDelete = z.object({
  trackId: z.string().min(1),
})

export async function DELETE(req: Request) {
  return withAuthErrorHandler(async () => {
    const user = await requireAuth()
    
    const body = await req.json().catch(() => null)
    const parsed = RatingDelete.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const { trackId } = parsed.data
    
    // Delete the rating
    await prisma.rating.delete({
      where: { userId_targetTrackId: { userId: user.id, targetTrackId: trackId } },
    }).catch(() => {
      // Ignore if rating doesn't exist
    })
    return { success: true }
  }, 'delete rating')
}
