/**
 * Pino Logger Configuration
 * 
 * Development: Pretty formatted console output with colors
 * Production: Structured JSON logs for parsing and monitoring
 */

import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
  ...(process.env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss.l',
        ignore: 'pid,hostname'
      }
    }
  })
})

/**
 * Create a child logger with component context
 * 
 * @param component - Component name for log context
 * @returns Child logger with component field
 */
export const createComponentLogger = (component: string) => {
  return logger.child({ component })
}

/**
 * Create a child logger with user context
 * 
 * @param userId - User ID for log context
 * @returns Child logger with userId field
 */
export const createUserLogger = (userId: string) => {
  return logger.child({ userId })
}