import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCurrentUser, requireAuth } from '../lib/auth'
import { getServerSession } from 'next-auth/next'
import { prisma } from '../lib/db'

// Mock next-auth
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn()
}))

// Mock authOptions from the route
vi.mock('../app/api/auth/[...nextauth]/route', () => ({
  authOptions: {
    providers: [],
    callbacks: {}
  }
}))

// Mock Prisma
vi.mock('../lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn()
    }
  }
}))

describe('getCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return user when session exists', async () => {
    const mockSession = {
      user: {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User'
      }
    }

    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date()
    }

    vi.mocked(getServerSession).mockResolvedValue(mockSession as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

    const result = await getCurrentUser()

    expect(getServerSession).toHaveBeenCalled()
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user123' }
    })
    expect(result).toEqual(mockUser)
  })

  it('should return null when session is null', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)

    const result = await getCurrentUser()

    expect(result).toBe(null)
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  it('should return null when session has no user', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: null } as any)

    const result = await getCurrentUser()

    expect(result).toBe(null)
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  it('should return null when session.user has no id', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' }
    } as any)

    const result = await getCurrentUser()

    expect(result).toBe(null)
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  it('should return null when user not found in database', async () => {
    const mockSession = {
      user: {
        id: 'nonexistent-user',
        email: 'test@example.com'
      }
    }

    vi.mocked(getServerSession).mockResolvedValue(mockSession as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const result = await getCurrentUser()

    expect(result).toBe(null)
  })

  it('should handle database errors gracefully', async () => {
    const mockSession = {
      user: {
        id: 'user123',
        email: 'test@example.com'
      }
    }

    vi.mocked(getServerSession).mockResolvedValue(mockSession as any)
    vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error('Database error'))

    await expect(getCurrentUser()).rejects.toThrow('Database error')
  })
})

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return user when authenticated', async () => {
    const mockSession = {
      user: {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User'
      }
    }

    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date()
    }

    vi.mocked(getServerSession).mockResolvedValue(mockSession as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

    const result = await requireAuth()

    expect(result).toEqual(mockUser)
  })

  it('should throw Unauthorized error when no session', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)

    await expect(requireAuth()).rejects.toThrow('Unauthorized')
  })

  it('should throw Unauthorized error when session has no user', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: null } as any)

    await expect(requireAuth()).rejects.toThrow('Unauthorized')
  })

  it('should throw Unauthorized error when session.user has no id', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' }
    } as any)

    await expect(requireAuth()).rejects.toThrow('Unauthorized')
  })

  it('should throw Unauthorized error when user not found in database', async () => {
    const mockSession = {
      user: {
        id: 'nonexistent-user',
        email: 'test@example.com'
      }
    }

    vi.mocked(getServerSession).mockResolvedValue(mockSession as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    await expect(requireAuth()).rejects.toThrow('Unauthorized')
  })

  it('should propagate database errors', async () => {
    const mockSession = {
      user: {
        id: 'user123',
        email: 'test@example.com'
      }
    }

    vi.mocked(getServerSession).mockResolvedValue(mockSession as any)
    vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error('Database connection failed'))

    await expect(requireAuth()).rejects.toThrow('Database connection failed')
  })

  it('should return same user on subsequent calls with same session', async () => {
    const mockSession = {
      user: {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User'
      }
    }

    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date()
    }

    vi.mocked(getServerSession).mockResolvedValue(mockSession as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

    const result1 = await requireAuth()
    const result2 = await requireAuth()

    expect(result1).toEqual(mockUser)
    expect(result2).toEqual(mockUser)
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(2)
  })
})
