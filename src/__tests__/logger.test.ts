import { describe, it, expect } from 'vitest'
import { logger, createComponentLogger, createUserLogger } from '@/lib/logger'

describe('Logger', () => {

  describe('createComponentLogger', () => {
    it('should create a child logger with component context', () => {
      const componentLogger = createComponentLogger('test-component')
      
      expect(componentLogger).toBeDefined()
      // Verify the logger has the component in its bindings
      expect(componentLogger.bindings()).toHaveProperty('component', 'test-component')
    })

    it('should create different loggers for different components', () => {
      const logger1 = createComponentLogger('component-1')
      const logger2 = createComponentLogger('component-2')
      
      expect(logger1.bindings().component).toBe('component-1')
      expect(logger2.bindings().component).toBe('component-2')
    })
  })

  describe('createUserLogger', () => {
    it('should create a child logger with user context', () => {
      const userLogger = createUserLogger('user-123')
      
      expect(userLogger).toBeDefined()
      expect(userLogger.bindings()).toHaveProperty('userId', 'user-123')
    })

    it('should create different loggers for different users', () => {
      const logger1 = createUserLogger('user-1')
      const logger2 = createUserLogger('user-2')
      
      expect(logger1.bindings().userId).toBe('user-1')
      expect(logger2.bindings().userId).toBe('user-2')
    })
  })

  describe('base logger', () => {
    it('should be defined and have log level', () => {
      expect(logger).toBeDefined()
      expect(logger.level).toBeDefined()
    })

    it('should be able to create child loggers', () => {
      const child = logger.child({ test: 'value' })
      expect(child).toBeDefined()
      expect(child.bindings()).toHaveProperty('test', 'value')
    })
  })
})
