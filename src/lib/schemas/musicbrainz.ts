/**
 * Zod Schemas for MusicBrainz API Response Validation
 * 
 * These schemas validate data from MusicBrainz API and transform it for our database.
 * Using lenient validation with .passthrough() to tolerate API changes.
 */

import { z } from 'zod'

// Artist Credit Item
// MusicBrainz uses complex artist-credit arrays for collaborations
// Example: [{artist: {...}, name: "David Bowie"}, {joinphrase: " & "}, {artist: {...}, name: "Queen"}]
const MBArtistCreditItemSchema = z.object({
  artist: z.object({
    id: z.string(),              // Artist MBID
    name: z.string(),
    'sort-name': z.string().optional(),
    disambiguation: z.string().optional(),
  }).optional(),  // Optional because joinphrase items don't have artist
  name: z.string(),              // Display name (may differ from artist.name)
  joinphrase: z.string().optional(),  // " & ", " feat. ", etc.
}).passthrough()

// Array of artist credits
export const MBArtistCreditSchema = z.array(MBArtistCreditItemSchema)

// Artist Search Result
export const MBArtistSearchResultSchema = z.object({
  id: z.string(),                    // Artist MBID
  name: z.string(),                  // Artist name
  'sort-name': z.string().optional(),
  type: z.string().optional(),       // Person, Group, etc.
  disambiguation: z.string().optional(),
  score: z.number().optional(),      // Search relevance score
}).passthrough()

// Artist Search Response
export const MBArtistSearchResponseSchema = z.object({
  artists: z.array(MBArtistSearchResultSchema),
  count: z.number(),
  offset: z.number(),
}).passthrough()

// Search Result Item
export const MBSearchResultSchema = z.object({
  id: z.string(),                          // Release Group MBID (required)
  title: z.string(),                       // Album title (required)
  'primary-type': z.string(),              // REQUIRED: Album, Single, EP, etc.
  'first-release-date': z.string(),        // REQUIRED: "1969-09-26" or "1969"
  'artist-credit': MBArtistCreditSchema,   // REQUIRED: Artist info
  'secondary-types': z.array(z.string()).optional(),  // Compilation, Live, etc.
  disambiguation: z.string().optional(),
  'release-count': z.number().optional(),
}).passthrough()

// Search Response
export const MBSearchResponseSchema = z.object({
  'release-groups': z.array(MBSearchResultSchema),
  count: z.number(),
  offset: z.number(),
}).passthrough()

// Release info within Release Group
const MBReleaseInfoSchema = z.object({
  id: z.string(),                    // Release MBID
  title: z.string(),
  status: z.string().optional(),     // Official, Promotion, Bootleg
  date: z.string().optional(),       // More specific than first-release-date
  country: z.string().optional(),    // US, GB, JP, etc.
  barcode: z.string().optional(),
  'track-count': z.number().optional(),
  media: z.array(z.object({
    format: z.string().optional(),   // CD, Vinyl, Digital
    'track-count': z.number().optional(),
  })).optional(),
}).passthrough()

// Release Group Details (album-level)
export const MBReleaseGroupSchema = z.object({
  id: z.string(),                          // MBID (required)
  title: z.string(),                       // Album title (required)
  'primary-type': z.string(),              // REQUIRED: Album, Single, EP
  'first-release-date': z.string(),        // REQUIRED: Year info
  'artist-credit': MBArtistCreditSchema,   // REQUIRED: Artist info
  'secondary-types': z.array(z.string()).optional(),
  disambiguation: z.string().optional(),
  releases: z.array(MBReleaseInfoSchema).optional(),  // Available editions
}).passthrough()

// Track/Recording within a Release
export const MBTrackSchema = z.object({
  id: z.string().optional(),         // Track ID (not always present)
  number: z.string().optional(),     // Track number as string ("1", "A1", etc.)
  position: z.number(),              // Numeric position (required)
  title: z.string(),                 // Track title (required)
  length: z.number().nullable(),     // REQUIRED: Duration in milliseconds, or null
  recording: z.object({
    id: z.string(),                  // Recording MBID
    title: z.string(),
    length: z.number().nullable(),   // Can differ from track length
    'artist-credit': MBArtistCreditSchema.optional(),  // Track-level artist (for features/collabs)
  }).optional(),
}).passthrough()

// Media (CD/Vinyl disc)
const MBMediaSchema = z.object({
  format: z.string().optional(),     // CD, Vinyl, Digital Media
  'format-id': z.string().optional(),
  position: z.number().optional(),   // Disc number
  'track-count': z.number(),
  title: z.string().optional(),      // Disc title (rare)
  tracks: z.array(MBTrackSchema),    // Track list (required)
}).passthrough()

// Label Info
const MBLabelInfoSchema = z.object({
  'catalog-number': z.string().optional(),
  label: z.object({
    id: z.string(),
    name: z.string(),
  }).optional(),
}).passthrough()

// Release (specific edition with full track list)
export const MBReleaseSchema = z.object({
  id: z.string(),                          // Release MBID (required)
  title: z.string(),                       // Release title (required)
  date: z.string(),                        // REQUIRED: Release date
  status: z.string().optional(),           // Official, Promotion, Bootleg
  country: z.string().optional(),
  barcode: z.string().optional().nullable(),
  'artist-credit': MBArtistCreditSchema,   // Release-level artist credit
  'label-info': z.array(MBLabelInfoSchema).optional(),
  media: z.array(MBMediaSchema),           // REQUIRED: Track list
  'release-group': z.object({
    id: z.string(),
    'primary-type': z.string().optional(),
  }).optional(),
}).passthrough()

// TypeScript types derived from schemas
export type MBArtistSearchResponse = z.infer<typeof MBArtistSearchResponseSchema>
export type MBArtistSearchResult = z.infer<typeof MBArtistSearchResultSchema>
export type MBSearchResponse = z.infer<typeof MBSearchResponseSchema>
export type MBSearchResult = z.infer<typeof MBSearchResultSchema>
export type MBReleaseGroup = z.infer<typeof MBReleaseGroupSchema>
export type MBRelease = z.infer<typeof MBReleaseSchema>
export type MBReleaseInfo = z.infer<typeof MBReleaseInfoSchema>
export type MBTrack = z.infer<typeof MBTrackSchema>
export type MBArtistCredit = z.infer<typeof MBArtistCreditSchema>

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract artist name(s) from MusicBrainz artist-credit array
 * Handles collaborations: "David Bowie & Queen" or "David Bowie feat. Queen"
 */
export function formatArtistCredit(artistCredit: MBArtistCredit): string {
  return artistCredit
    .map(item => item.name + (item.joinphrase || ''))
    .join('')
    .trim()
}

/**
 * Extract all unique artists from artist-credit for relationship creation
 * Returns: [{ mbid: string, name: string, sortName: string }]
 */
export function extractArtists(artistCredit: MBArtistCredit) {
  return artistCredit
    .filter(item => item.artist)  // Skip joinphrase items
    .map(item => ({
      mbid: item.artist!.id,
      name: item.artist!.name,
      sortName: item.artist!['sort-name'] || item.artist!.name,
    }))
}

/**
 * Extract year from MusicBrainz date string
 * "1969-09-26" -> 1969
 * "1969" -> 1969
 * "1969-09" -> 1969
 */
export function extractYear(dateString: string | undefined): number | null {
  if (!dateString) return null
  const match = dateString.match(/^(\d{4})/)
  return match ? parseInt(match[1], 10) : null
}

/**
 * Map MusicBrainz primary-type to our PrimaryType enum
 */
export function mapPrimaryType(mbType: string): 'ALBUM' | 'SINGLE' | 'EP' | 'COMPILATION' | 'LIVE' | 'SOUNDTRACK' | 'OTHER' {
  const typeMap: Record<string, 'ALBUM' | 'SINGLE' | 'EP' | 'COMPILATION' | 'LIVE' | 'SOUNDTRACK' | 'OTHER'> = {
    'Album': 'ALBUM',
    'Single': 'SINGLE',
    'EP': 'EP',
    'Compilation': 'COMPILATION',
    'Live': 'LIVE',
    'Soundtrack': 'SOUNDTRACK',
    'Broadcast': 'OTHER',
    'Other': 'OTHER',
  }
  return typeMap[mbType] || 'OTHER'
}

/**
 * Format duration from milliseconds to mm:ss
 */
export function formatDuration(ms: number | null): string {
  if (ms === null) return '—'
  const seconds = Math.round(ms / 1000)
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
