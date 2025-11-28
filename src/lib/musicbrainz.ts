/**
 * MusicBrainz API Client
 * 
 * Official API Documentation: https://musicbrainz.org/doc/MusicBrainz_API
 * 
 * Rate Limiting: Strictly 1 request per second (enforced by IP blocking)
 * User-Agent: Required header with app name and contact
 */

const MB_API_BASE = 'https://musicbrainz.org/ws/2/'
const USER_AGENT = 'MusicManager/0.1.0 (sim.david90@gmail.com)'
const RATE_LIMIT_MS = 1000 // 1 request per second

/**
 * Custom error class for MusicBrainz API errors
 */
export class MusicBrainzError extends Error {
  constructor(
    public statusCode: number,
    public body: string,
  ) {
    super(`MusicBrainz API error: ${statusCode}`)
    this.name = 'MusicBrainzError'
  }

  /**
   * Get user-friendly error message based on status code
   */
  getUserMessage(): string {
    switch (this.statusCode) {
      case 400:
        return 'Invalid search query. Please try different search terms.'
      case 404:
        return 'Album not found in MusicBrainz database.'
      case 503:
        return 'MusicBrainz service is temporarily unavailable. Please try again later.'
      default:
        return 'An error occurred while connecting to MusicBrainz.'
    }
  }
}

/**
 * MusicBrainz API Client with rate limiting
 */
export class MusicBrainzClient {
  private lastRequestTime = 0

  /**
   * Execute a request to MusicBrainz API with rate limiting
   */
  private async executeRequest<T>(url: string): Promise<T> {
    // Calculate wait time to respect 1 req/sec limit
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    const waitTime = Math.max(0, RATE_LIMIT_MS - timeSinceLastRequest)
    
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    this.lastRequestTime = Date.now()
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new MusicBrainzError(response.status, await response.text())
    }
    
    return response.json()
  }

  /**
   * Search for release groups (albums) by query
   * 
   * @param query - Lucene query string (e.g., 'artist:"Beatles" AND releasegroup:"Abbey Road"')
   * @param limit - Maximum number of results (default: 25)
   */
  async searchReleaseGroups(query: string, limit: number = 25): Promise<any> {
    const params = new URLSearchParams({
      query,
      limit: limit.toString(),
      fmt: 'json',
    })
    
    const url = `${MB_API_BASE}release-group/?${params.toString()}`
    return this.executeRequest(url)
  }

  /**
   * Search for artists by name
   * 
   * @param query - Artist name to search for
   * @param limit - Maximum number of results (default: 10)
   */
  async searchArtists(query: string, limit: number = 10): Promise<any> {
    const params = new URLSearchParams({
      query: `artist:${query}`,
      limit: limit.toString(),
      fmt: 'json',
    })
    
    const url = `${MB_API_BASE}artist/?${params.toString()}`
    return this.executeRequest(url)
  }

  /**
   * Get release group details with artist info
   * 
   * @param mbid - Release group MBID
   */
  async getReleaseGroupDetails(mbid: string): Promise<any> {
    const params = new URLSearchParams({
      inc: 'artists+releases',
      fmt: 'json',
    })
    
    const url = `${MB_API_BASE}release-group/${mbid}?${params.toString()}`
    return this.executeRequest(url)
  }

  /**
   * Get specific release with full track list
   * 
   * @param releaseId - Release MBID
   */
  async getRelease(releaseId: string): Promise<any> {
    const params = new URLSearchParams({
      inc: 'recordings+artist-credits+labels',
      fmt: 'json',
    })
    
    const url = `${MB_API_BASE}release/${releaseId}?${params.toString()}`
    return this.executeRequest(url)
  }

  /**
   * Get artist details including country
   * 
   * @param artistId - Artist MBID
   */
  async getArtist(artistId: string): Promise<any> {
    const params = new URLSearchParams({
      fmt: 'json',
    })
    
    const url = `${MB_API_BASE}artist/${artistId}?${params.toString()}`
    return this.executeRequest(url)
  }
}

/**
 * Helper function to build structured MusicBrainz search query
 * 
 * @param artist - Artist name
 * @param album - Album name
 */
export function buildSearchQuery(artist: string, album: string): string {
  const parts: string[] = []
  
  if (artist.trim()) {
    parts.push(`artist:"${artist.trim()}"`)
  }
  
  if (album.trim()) {
    parts.push(`releasegroup:"${album.trim()}"`)
  }
  
  return parts.join(' AND ')
}
