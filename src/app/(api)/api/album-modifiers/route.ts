import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { withAuthErrorHandler } from '@/lib/apiHelpers'
import { z } from 'zod'

const ModifiersUpdate = z.object({
  albumId: z.string().min(1),
  coverValue: z.number().int().min(0).max(10),
  productionValue: z.number().int().min(0).max(10),
  mixValue: z.number().int().min(0).max(10),
})

export async function POST(req: Request) {
  return withAuthErrorHandler(async () => {
    // Require authentication before allowing modifications
    await requireAuth()
    
    const body = await req.json().catch(() => null)
    const parsed = ModifiersUpdate.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    
    const { albumId, coverValue, productionValue, mixValue } = parsed.data
    
    const updated = await prisma.releaseGroup.update({
      where: { id: albumId },
      data: {
        coverValue,
        productionValue,
        mixValue,
      },
    })
    
    return updated
  }, 'update album modifiers')
}
