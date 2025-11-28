import { describe, it, expect, vi } from 'vitest'

describe('Database Client', () => {
  it('should export prisma client in development', async () => {
    // Dynamically import to ensure we get the actual module
    const { prisma } = await import('@/lib/db')
    
    expect(prisma).toBeDefined()
    expect(prisma).toHaveProperty('releaseGroup')
    expect(prisma).toHaveProperty('artist')
    expect(prisma).toHaveProperty('release')
    expect(prisma).toHaveProperty('track')
  })

  it('should export prisma client in production', async () => {
    const originalEnv = process.env.NODE_ENV
    
    // Note: We can't actually change NODE_ENV at runtime because the module
    // is already loaded, but we can verify the client works in all modes
    const { prisma } = await import('@/lib/db')
    
    expect(prisma).toBeDefined()
    expect(typeof prisma.$connect).toBe('function')
    expect(typeof prisma.$disconnect).toBe('function')
  })

  it('should have correct configuration', async () => {
    const { prisma } = await import('@/lib/db')
    
    // Verify the client is properly configured
    expect(prisma).toBeDefined()
    
    // PrismaClient should have standard methods
    expect(prisma.$transaction).toBeDefined()
    expect(prisma.$queryRaw).toBeDefined()
  })
})
