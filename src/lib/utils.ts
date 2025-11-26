import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the base URL for API calls, handling different environments
 */
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL ?? 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
}

/**
 * Centralized API fetch helper with error handling
 */
export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const base = getBaseUrl()
  const res = await fetch(`${base}${endpoint}`, options)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

/**
 * Extract all tracks from an album's releases
 */
export function extractTracks<T extends { releases: Array<{ tracks: any[] }> }>(
  album: T
): T['releases'][number]['tracks'] {
  return album.releases.flatMap((r) => r.tracks)
}
