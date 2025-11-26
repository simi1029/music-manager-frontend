import { NextResponse } from 'next/server'

/**
 * Unified error handler for API routes
 * Provides consistent error responses and logging across all endpoints
 * 
 * @param handler - Async function that performs the API logic
 * @param context - Description of what the handler does (for logging)
 * @returns NextResponse with either success data or error message
 * 
 * @example
 * export async function GET() {
 *   return withErrorHandler(async () => {
 *     const data = await fetchData()
 *     return data
 *   }, 'fetch albums')
 * }
 */
export async function withErrorHandler<T>(
  handler: () => Promise<T>,
  context: string
): Promise<NextResponse> {
  try {
    const result = await handler()
    return NextResponse.json(result)
  } catch (error) {
    // Log error with context for debugging
    console.error(`[API Error] Failed to ${context}:`, error)
    
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }
    
    // Handle generic errors
    return NextResponse.json(
      { error: `Failed to ${context}` },
      { status: 500 }
    )
  }
}

/**
 * Error handler for authenticated API routes
 * Automatically handles auth errors with proper status codes
 * 
 * @param handler - Async function that performs the authenticated API logic
 * @param context - Description of what the handler does (for logging)
 * @returns NextResponse with either success data or error message
 * 
 * @example
 * export async function POST(req: Request) {
 *   return withAuthErrorHandler(async () => {
 *     await requireAuth()
 *     const data = await updateData()
 *     return data
 *   }, 'update album modifiers')
 * }
 */
export async function withAuthErrorHandler<T>(
  handler: () => Promise<T>,
  context: string
): Promise<NextResponse> {
  return withErrorHandler(handler, context)
}
