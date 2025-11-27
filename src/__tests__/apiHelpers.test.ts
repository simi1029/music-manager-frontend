import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import { withErrorHandler, withAuthErrorHandler } from '../lib/apiHelpers'

describe('withErrorHandler', () => {
  it('should return success response when handler succeeds', async () => {
    const mockHandler = vi.fn(async () => ({ data: 'test data' }))
    
    const response = await withErrorHandler(mockHandler, 'test operation')
    const json = await response.json()

    expect(mockHandler).toHaveBeenCalled()
    expect(json).toEqual({ data: 'test data' })
    expect(response.status).toBe(200)
  })

  it('should handle generic errors with 500 status', async () => {
    const mockHandler = vi.fn(async () => {
      throw new Error('Something went wrong')
    })

    const response = await withErrorHandler(mockHandler, 'test operation')
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json).toEqual({ error: 'Failed to test operation' })
  })

  it('should handle Unauthorized error with 401 status', async () => {
    const mockHandler = vi.fn(async () => {
      throw new Error('Unauthorized')
    })

    const response = await withErrorHandler(mockHandler, 'test operation')
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json).toEqual({ error: 'Unauthorized' })
  })

  it('should handle non-Error throws', async () => {
    const mockHandler = vi.fn(async () => {
      throw 'string error'
    })

    const response = await withErrorHandler(mockHandler, 'test operation')
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json).toEqual({ error: 'Failed to test operation' })
  })

  it('should pass through different return types', async () => {
    const arrayHandler = vi.fn(async () => [1, 2, 3])
    const objectHandler = vi.fn(async () => ({ key: 'value' }))
    const stringHandler = vi.fn(async () => 'success')

    const arrayResponse = await withErrorHandler(arrayHandler, 'array op')
    const arrayJson = await arrayResponse.json()
    expect(arrayJson).toEqual([1, 2, 3])

    const objectResponse = await withErrorHandler(objectHandler, 'object op')
    const objectJson = await objectResponse.json()
    expect(objectJson).toEqual({ key: 'value' })

    const stringResponse = await withErrorHandler(stringHandler, 'string op')
    const stringJson = await stringResponse.json()
    expect(stringJson).toBe('success')
  })

  it('should include context in error message', async () => {
    const mockHandler = vi.fn(async () => {
      throw new Error('DB connection failed')
    })

    const response = await withErrorHandler(mockHandler, 'fetch users from database')
    const json = await response.json()

    expect(json.error).toBe('Failed to fetch users from database')
  })
})

describe('withAuthErrorHandler', () => {
  it('should return success response when handler succeeds', async () => {
    const mockHandler = vi.fn(async () => ({ data: 'authenticated data' }))
    
    const response = await withAuthErrorHandler(mockHandler, 'authenticated operation')
    const json = await response.json()

    expect(mockHandler).toHaveBeenCalled()
    expect(json).toEqual({ data: 'authenticated data' })
    expect(response.status).toBe(200)
  })

  it('should handle Unauthorized error with 401 status', async () => {
    const mockHandler = vi.fn(async () => {
      throw new Error('Unauthorized')
    })

    const response = await withAuthErrorHandler(mockHandler, 'authenticated operation')
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json).toEqual({ error: 'Unauthorized' })
  })

  it('should handle generic errors with 500 status', async () => {
    const mockHandler = vi.fn(async () => {
      throw new Error('Database error')
    })

    const response = await withAuthErrorHandler(mockHandler, 'authenticated operation')
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json).toEqual({ error: 'Failed to authenticated operation' })
  })

  it('should handle non-Error throws', async () => {
    const mockHandler = vi.fn(async () => {
      throw 'unexpected error'
    })

    const response = await withAuthErrorHandler(mockHandler, 'authenticated operation')
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json).toEqual({ error: 'Failed to authenticated operation' })
  })

  it('should pass through successful responses', async () => {
    const mockHandler = vi.fn(async () => ({
      id: '123',
      name: 'Test User',
      ratings: [8, 9, 10]
    }))

    const response = await withAuthErrorHandler(mockHandler, 'fetch user ratings')
    const json = await response.json()

    expect(json).toEqual({
      id: '123',
      name: 'Test User',
      ratings: [8, 9, 10]
    })
  })

  it('should differentiate Unauthorized from other errors', async () => {
    const unauthorizedHandler = vi.fn(async () => {
      throw new Error('Unauthorized')
    })
    const otherHandler = vi.fn(async () => {
      throw new Error('Not Found')
    })

    const unauthorizedResponse = await withAuthErrorHandler(unauthorizedHandler, 'test')
    const unauthorizedJson = await unauthorizedResponse.json()
    expect(unauthorizedResponse.status).toBe(401)
    expect(unauthorizedJson.error).toBe('Unauthorized')

    const otherResponse = await withAuthErrorHandler(otherHandler, 'test')
    const otherJson = await otherResponse.json()
    expect(otherResponse.status).toBe(500)
    expect(otherJson.error).toBe('Failed to test')
  })

  it('should handle async errors in handler', async () => {
    const mockHandler = vi.fn(async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
      throw new Error('Async error')
    })

    const response = await withAuthErrorHandler(mockHandler, 'async operation')
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json).toEqual({ error: 'Failed to async operation' })
  })
})
