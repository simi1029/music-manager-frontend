// Import the generated Prisma client directly (generator output is configured to src/generated/prisma)
// The project generates the client into `src/generated/prisma`, so import from there
import { PrismaClient } from '../generated/prisma/client'

const globalForPrisma = global as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['warn', 'error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
