# MusicBrainz & Google Sheets Import Implementation Plan

## Overview

This plan covers two major import features:
1. **MusicBrainz Import** - Import albums (with tracks and artists) from MusicBrainz API ⚠️ **PARTIALLY COMPLETE**
2. **Google Sheets Import** (Future Phase) - Batch import user ratings for existing albums ❌ **NOT STARTED**

---

## 🚨 CURRENT STATUS: BASIC MUSICBRAINZ IMPORT WORKING

### ✅ What's Working (MVP Complete)
- **Basic Search & Import**: Users can search MusicBrainz and import albums
- **API Integration**: All core MusicBrainz API calls implemented 
- **Database Import**: Albums, artists, tracks, and external references are created
- **UI Components**: Basic search form and results display
- **Duplicate Prevention**: Albums won't be imported twice
- **Authentication**: All endpoints properly secured

### ⚠️ Current Limitations (vs Full Plan)
1. **No Release Selection**: Always imports first release (no CD/Vinyl/region choice)
2. **Single Artists Only**: Multi-artist albums import only primary artist
3. **No Track Preview**: No modal to review tracks before import 
4. **Basic Search**: No advanced "Artist-first" search mode
5. **No Edition Picker**: No UI to choose between different editions

### 🔴 Critical Missing Features for Production
1. **Release Selection Modal** - Users should choose CD vs Vinyl vs Digital editions
2. **Multi-Artist Support** - Database schema needs many-to-many artist relationships  
3. **Track Preview** - Show track list and duration warnings before import

---

---

## Part 1: MusicBrainz Import (Phase 2 & 3) ✅ PARTIALLY COMPLETE

### Step 1: MusicBrainz API Client Setup ✅ COMPLETE

**File:** `src/lib/musicbrainz.ts` ✅ IMPLEMENTED

**API Documentation:** https://musicbrainz.org/doc/MusicBrainz_API

**Core Configuration:** ✅ COMPLETE
```typescript
const MB_API_BASE = 'https://musicbrainz.org/ws/2/'
const USER_AGENT = 'MusicManager/0.1.0 (sim.david90@gmail.com)'
const RATE_LIMIT_MS = 1000 // STRICT: 1 request per second (enforced by MusicBrainz)
```

**Core Functions:** ✅ IMPLEMENTED
```typescript
// ✅ IMPLEMENTED - Search for release groups (albums) by query
searchReleaseGroups(query: string, limit?: number): Promise<MBSearchResult[]>

// ✅ IMPLEMENTED - Search for artists by name 
searchArtists(query: string, limit?: number): Promise<MBArtistSearchResult[]>

// ❌ NOT IMPLEMENTED - Get release group details with artist info
getReleaseGroupDetails(mbid: string): Promise<MBReleaseGroup>

// ✅ IMPLEMENTED - Get specific release with full track list
getRelease(releaseId: string): Promise<MBRelease>
```

**Rate Limiting Implementation:**
```typescript
class MusicBrainzClient {
  private lastRequestTime = 0
  private requestQueue: Array<() => Promise<any>> = []
  
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
}
```

**Error Handling:**
```typescript
class MusicBrainzError extends Error {
  constructor(
    public statusCode: number,
    public body: string,
  ) {
    super(`MusicBrainz API error: ${statusCode}`)
  }
}

// Error codes mapping for user-friendly messages
function getErrorMessage(error: MusicBrainzError): string {
  switch (error.statusCode) {
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
```

**Search Query Construction:**
```typescript
// Parse "artist album" format into structured MusicBrainz query
// Example: "Beatles Abbey Road" -> 'artist:"Beatles" AND releasegroup:"Abbey Road"'
function buildSearchQuery(artistQuery: string, albumQuery: string): string {
  const parts: string[] = []
  
  if (artistQuery.trim()) {
    parts.push(`artist:"${artistQuery.trim()}"`)
  }
  
  if (albumQuery.trim()) {
    parts.push(`releasegroup:"${albumQuery.trim()}"`)
  }
  
**Decisions Made:**
1. ✅ **User-Agent:** `MusicManager/0.1.0 (sim.david90@gmail.com)`
   
2. ✅ **Rate Limiting:** Simple timestamp-based approach
   - Track last request time
   - Wait before next request if needed
   - No parallel requests allowed
   - **Upgrade path:** Add queue if needed for bulk imports later
   
3. ✅ **Search Strategy:** Structured query builder (Option B)
   - Parse user input to detect "Artist - Album" format
   - Build MusicBrainz Lucene query: `artist:"X" AND releasegroup:"Y"`
   - Better search accuracy than free-form queries
   
4. ✅ **Release Selection:** User chooses from list
   - Show all available editions/releases for an album
   - Let user pick specific edition (CD vs Vinyl, region, remaster, etc.)
   - Display: format, country, label, barcode, track count
   
5. ✅ **Error Handling:** No automatic retry
   - Show clear error messages to user
   - Let user manually retry if needed
   - Map error codes to friendly messages
   
6. ✅ **Response Format:** JSON via `Accept` header
   - Easier to work with than XML
   - Better TypeScript support
   
7. ✅ **Timeout:** 10 seconds per request
   - Reasonable for MusicBrainz API
   - Can adjust if needed
1. ✅ **User-Agent:** `MusicManager/0.1.0 (https://github.com/simi1029/music-manager-frontend)`
   - Can update contact info later if needed
   
2. ✅ **Rate Limiting:** Simple timestamp-based approach
   - Track last request time
   - Wait before next request if needed
   - No parallel requests allowed
   - **Upgrade path:** Add queue if needed for bulk imports later
   
3. ✅ **Retry Logic:** 3 retries with exponential backoff (2s, 4s, 8s)
   - Only retry on 503 (Service Unavailable)
   - Other errors (400, 404) fail immediately
   
4. ✅ **Response Format:** JSON via `Accept` header
   - Easier to work with than XML
   - Better TypeScript support
   
5. ✅ **Timeout:** 10 seconds per request
   - Reasonable for MusicBrainz API
   - Can adjust if needed

---

### Step 2: Zod Schemas for Validation ✅ COMPLETE

**File:** `src/lib/schemas/musicbrainz.ts` ✅ IMPLEMENTED

**Validation Strategy:** ✅ COMPLETE - Lenient with required core fields
- Allow unknown fields (`.passthrough()`) ✅ IMPLEMENTED
- Require critical fields for import success ✅ IMPLEMENTED  
- Optional fields default to null/undefined ✅ IMPLEMENTED
- Transform data in import logic, not schemas ✅ IMPLEMENTED

**Schemas Needed:**

```typescript
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
const MBArtistCreditSchema = z.array(MBArtistCreditItemSchema)

// Search Result Item
const MBSearchResultSchema = z.object({
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
const MBSearchResponseSchema = z.object({
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
const MBReleaseGroupSchema = z.object({
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
const MBTrackSchema = z.object({
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
const MBReleaseSchema = z.object({
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

// Export all schemas
export {
  MBSearchResponseSchema,
  MBSearchResultSchema,
  MBReleaseGroupSchema,
  MBReleaseSchema,
  MBReleaseInfoSchema,
  MBTrackSchema,
  MBArtistCreditSchema,
  MBArtistCreditItemSchema,
}

// TypeScript types derived from schemas
export type MBSearchResponse = z.infer<typeof MBSearchResponseSchema>
export type MBSearchResult = z.infer<typeof MBSearchResultSchema>
export type MBReleaseGroup = z.infer<typeof MBReleaseGroupSchema>
export type MBRelease = z.infer<typeof MBReleaseSchema>
export type MBReleaseInfo = z.infer<typeof MBReleaseInfoSchema>
export type MBTrack = z.infer<typeof MBTrackSchema>
export type MBArtistCredit = z.infer<typeof MBArtistCreditSchema>
```

**Helper Functions:**

```typescript
// Extract artist name(s) from MusicBrainz artist-credit array
// Handles collaborations: "David Bowie & Queen" or "David Bowie feat. Queen"
export function formatArtistCredit(artistCredit: MBArtistCredit): string {
  return artistCredit
    .map(item => item.name + (item.joinphrase || ''))
    .join('')
    .trim()
}

// Extract all unique artists from artist-credit for relationship creation
// Returns: [{ mbid: string, name: string, sortName: string }]
export function extractArtists(artistCredit: MBArtistCredit) {
  return artistCredit
    .filter(item => item.artist)  // Skip joinphrase items
    .map(item => ({
      mbid: item.artist!.id,
      name: item.artist!.name,
      sortName: item.artist!['sort-name'] || item.artist!.name,
    }))
}

// Extract year from MusicBrainz date string
// "1969-09-26" -> 1969
// "1969" -> 1969
// "1969-09" -> 1969
export function extractYear(dateString: string | undefined): number | null {
  if (!dateString) return null
  const match = dateString.match(/^(\d{4})/)
  return match ? parseInt(match[1], 10) : null
}

// Map MusicBrainz primary-type to our PrimaryType enum
export function mapPrimaryType(mbType: string): PrimaryType {
  const typeMap: Record<string, PrimaryType> = {
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

// Format duration from milliseconds to mm:ss
export function formatDuration(ms: number | null): string {
  if (!ms) return '—'
  const seconds = Math.round(ms / 1000)
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
```

**Decisions Made:**

1. ✅ **Validation:** Lenient with `.passthrough()`
   - Tolerates MusicBrainz API changes
   - Allows optional fields to be missing
   
2. ✅ **Required Fields:**
   - **Release Group:** `id`, `title`, `primary-type`, `first-release-date`, `artist-credit`
   - **Release:** `id`, `title`, `date`, `media` (track list)
   - **Track:** `position`, `title`, `length` (required, but can be null)
   
3. ✅ **Artist Credits:** Full structure (Option A)
   - Parse complete artist-credit array
   - Support collaborations properly
   - Extract all artists for database relationships
   - **Future decision needed:** How to handle multi-artist albums in database
   
4. ✅ **Primary Type Mapping:** Direct mapping with fallback to `OTHER`
   - MusicBrainz → Schema enum
   - Unmapped types → `OTHER`
   
5. ✅ **Track Duration:** 
   - Schema validates as `z.number().nullable()`
   - **null tracks flagged for manual entry**
   - Conversion to seconds happens in import logic

**Open Issues to Resolve:**

1. **Multi-Artist Albums:**
   - Should "David Bowie & Queen - Under Pressure" appear in both artists' discographies?
   - Create separate `Artist` records for each, or single combined artist?
   - Track-level artist credits for individual collaborations?
   - **Decision needed before Step 4 (Database Import Logic)**

2. **Null Track Durations:**
   - How should user enter missing durations?
   - Option A: Edit album after import (manual track duration entry)
   - Option B: Block import, show warning, let user cancel
   - Option C: Import with null, show warning toast
   - **Recommendation:** Option C (import anyway, show which tracks need duration)

3. **Release Selection UI:**
   - Show list of all releases for chosen release-group
   - Display: country, date, format (CD/Vinyl), barcode, label, track count
   - Let user pick which edition to import
   - **To be designed in Step 5 (UI)**

---

### Step 3: Import API Routes ✅ PARTIALLY COMPLETE

**Authentication:** All endpoints require authenticated session (NextAuth) ✅ IMPLEMENTED

#### Route 1: Search Release Groups ✅ COMPLETE
**File:** `src/app/(api)/api/musicbrainz/search/route.ts` ✅ IMPLEMENTED

```typescript
// GET /api/musicbrainz/search?artist=Beatles&album=Abbey+Road
// Optional: &artistMbid=<MBID> for exact artist match
export async function GET(request: Request) {
  // 1. Check authentication
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Extract and validate query params
  const { searchParams } = new URL(request.url)
  const artist = searchParams.get('artist') || ''
  const album = searchParams.get('album') || ''
  const artistMbid = searchParams.get('artistMbid') || null
  
  if (!artist && !album) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Provide artist or album name' },
      { status: 400 }
    )
  }

  // 3. Build MusicBrainz query
  let mbQuery: string
  
  if (artistMbid) {
    // Exact artist match using MBID
    mbQuery = `arid:${artistMbid}`
    if (album) {
      mbQuery += ` AND releasegroup:"${album}"`
    }
  } else {
    // Regular text search
    mbQuery = buildSearchQuery(artist, album)
  }
  
  // 4. Call MusicBrainz API
  const mbClient = new MusicBrainzClient()
  const searchResults = await mbClient.searchReleaseGroups(mbQuery, 25)
  
  // 5. Validate response with Zod
  const validated = MBSearchResponseSchema.parse(searchResults)
  
  // 6. Check which results already imported (batch query)
  const mbids = validated['release-groups'].map(rg => rg.id)
  const existingRefs = await prisma.externalRef.findMany({
    where: { musicbrainzId: { in: mbids } },
    select: { musicbrainzId: true, releaseGroupId: true }
  })
  
  const existingMap = new Map(
    existingRefs.map(ref => [ref.musicbrainzId, ref.releaseGroupId])
  )
  
  // 7. Format and return results
  const results = validated['release-groups'].map(rg => ({
    mbid: rg.id,
    title: rg.title,
    artist: formatArtistCredit(rg['artist-credit']),
    year: extractYear(rg['first-release-date']),
    type: rg['primary-type'],
    releaseCount: rg['release-count'] || 0,
    alreadyImported: existingMap.has(rg.id),
    existingAlbumId: existingMap.get(rg.id) || null,
  }))
  
  return NextResponse.json({ results })
}
```

---

#### Route 1b: Search Artists ✅ COMPLETE  
**File:** `src/app/(api)/api/musicbrainz/search-artists/route.ts` ✅ IMPLEMENTED

```typescript
// GET /api/musicbrainz/search-artists?artist=Beatles
export async function GET(request: Request) {
  // 1. Check authentication
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Extract and validate query params
  const { searchParams } = new URL(request.url)
  const artist = searchParams.get('artist') || ''
  
  if (!artist || artist.length < 2) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Provide artist name (minimum 2 characters)' },
      { status: 400 }
    )
  }

  // 3. Call MusicBrainz artist search
  const mbClient = new MusicBrainzClient()
  const searchResults = await mbClient.searchArtists(artist, 10)
  
  // 4. Validate response with Zod
  const validated = MBArtistSearchResponseSchema.parse(searchResults)
  
  // 5. Format and return results
  const results = validated.artists.map(artist => ({
    mbid: artist.id,
    name: artist.name,
    disambiguation: artist.disambiguation || undefined,
    country: artist.country || undefined,
  }))
  
  return NextResponse.json({ results })
}
```

**Returns:**
```typescript
{
  results: [
    {
      mbid: string,
      name: string,
      disambiguation?: string,  // "British rock band", "US rapper"
      country?: string,         // "GB", "US"
    }
  ]
}
```

**Returns:**
```typescript
{
  results: [
    {
      mbid: string,
      title: string,
      artist: string,           // Formatted artist credit
      year: number | null,
      type: string,             // "Album", "Single", "EP"
      releaseCount: number,
      alreadyImported: boolean, // Checked against database
      existingAlbumId: string | null,
    }
  ]
}
```

**Error Responses:**
```typescript
// 401 Unauthorized
{ error: 'Unauthorized' }

// 400 Bad Request
{ error: 'VALIDATION_ERROR', message: 'Provide artist or album name' }

// 503 MusicBrainz unavailable
{ error: 'MB_API_ERROR', message: 'MusicBrainz service temporarily unavailable' }
```

---

#### Route 2: Get Available Releases (Editions) ⚠️ MODIFIED IMPLEMENTATION
**File:** `src/app/(api)/api/musicbrainz/releases/route.ts` ⚠️ IMPLEMENTED WITH DIFFERENT PARAMS

**Current Implementation:** `GET /api/musicbrainz/releases?releaseId=<RELEASE_MBID>` (single release)
**Planned:** `GET /api/musicbrainz/releases?mbid=<RELEASE_GROUP_MBID>` (all releases for album)

```typescript
// ⚠️ CURRENT - Get single release details
// GET /api/musicbrainz/releases?releaseId=<RELEASE_MBID>
export async function GET(request: Request) {
  // 1. Check authentication
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Extract release group MBID
  const { searchParams } = new URL(request.url)
  const mbid = searchParams.get('mbid')
  
  if (!mbid) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Release group MBID required' },
      { status: 400 }
    )
  }

  // 3. Fetch release group details from MusicBrainz
  const mbClient = new MusicBrainzClient()
  const releaseGroup = await mbClient.getReleaseGroupDetails(mbid)
  
  // 4. Validate with Zod
  const validated = MBReleaseGroupSchema.parse(releaseGroup)
  
  // 5. Format release list for user selection
  const releases = (validated.releases || []).map(rel => ({
    id: rel.id,
    title: rel.title,
    date: rel.date || validated['first-release-date'],
    country: rel.country || 'Unknown',
    status: rel.status || 'Unknown',
    barcode: rel.barcode || '—',
    format: rel.media?.[0]?.format || 'Unknown',
    trackCount: rel.media?.reduce((sum, m) => sum + (m['track-count'] || 0), 0) || rel['track-count'] || 0,
  }))
  
  // 6. Return album info + releases
  return NextResponse.json({
    album: {
      mbid: validated.id,
      title: validated.title,
      artist: formatArtistCredit(validated['artist-credit']),
      year: extractYear(validated['first-release-date']),
      type: validated['primary-type'],
    },
    releases,
  })
}
```

**Returns:**
```typescript
{
  album: {
    mbid: string,
    title: string,
    artist: string,
    year: number | null,
    type: string,
  },
  releases: [
    {
      id: string,              // Release MBID
      title: string,
      date: string,            // "1969-09-26" or "1969"
      country: string,         // "US", "GB", "JP"
      status: string,          // "Official", "Promotion"
      barcode: string,
      format: string,          // "CD", "Vinyl", "Digital"
      trackCount: number,
    }
  ]
}
```

---

#### Route 3: Import Album ✅ COMPLETE  
**File:** `src/app/(api)/api/musicbrainz/import/route.ts` ✅ IMPLEMENTED

```typescript
// ✅ IMPLEMENTED - POST /api/musicbrainz/import
// Body: { releaseId: string, releaseGroupId: string }
export async function POST(request: Request) {
  // 1. Check authentication
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse request body
  const body = await request.json()
  const { releaseGroupMbid, releaseMbid } = body
  
  if (!releaseGroupMbid || !releaseMbid) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Release group and release MBIDs required' },
      { status: 400 }
    )
  }

  // 3. Check for duplicate import
  const existingRef = await prisma.externalRef.findUnique({
    where: { musicbrainzId: releaseGroupMbid },
    include: { releaseGroup: true }
  })
  
  if (existingRef) {
    return NextResponse.json({
      success: false,
      error: 'DUPLICATE',
      message: 'This album is already in your collection',
      existingAlbumId: existingRef.releaseGroupId,
    }, { status: 409 })
  }

  // 4. Fetch data from MusicBrainz
  const mbClient = new MusicBrainzClient()
  const [releaseGroup, release] = await Promise.all([
    mbClient.getReleaseGroupDetails(releaseGroupMbid),
    mbClient.getRelease(releaseMbid),
  ])
  
  // 5. Validate with Zod
  const validatedRG = MBReleaseGroupSchema.parse(releaseGroup)
  const validatedRelease = MBReleaseSchema.parse(release)

  // 6. Import to database (see Step 4 for full implementation)
  const result = await importFromMusicBrainz(
    validatedRG,
    validatedRelease,
    session.user.id
  )

  // 7. Check for tracks with null duration
  const tracksWithNullDuration = result.tracksWithNullDuration || []
  const warnings: string[] = []
  
  if (tracksWithNullDuration.length > 0) {
    warnings.push(
      `${tracksWithNullDuration.length} track(s) are missing duration data. You can edit them manually.`
    )
  }

  // 8. Return success response
  return NextResponse.json({
    success: true,
    albumId: result.albumId,
    message: 'Album imported successfully',
    warnings,
    tracksWithNullDuration: tracksWithNullDuration.map(t => ({
      id: t.id,
      number: t.number,
      title: t.title,
    })),
  })
}
```

**Success Response:**
```typescript
{
  success: true,
  albumId: string,
  message: "Album imported successfully",
  warnings: string[],  // e.g., ["3 tracks missing duration data"]
  tracksWithNullDuration: [
    {
      id: string,
      number: number,
      title: string,
    }
  ]
}
```

**Error Responses:**
```typescript
// 401 Unauthorized
{ error: 'Unauthorized' }

// 409 Duplicate
{
  success: false,
  error: 'DUPLICATE',
  message: 'This album is already in your collection',
  existingAlbumId: string,
}

// 404 Not Found
{
  success: false,
  error: 'NOT_FOUND',
  message: 'Album not found in MusicBrainz',
}

// 400 Validation Error
{
  success: false,
  error: 'VALIDATION_ERROR',
  message: 'Invalid data from MusicBrainz',
  details: {...}  // Zod validation errors
}
```

---

**Decisions Made:**

1. ✅ **Duplicate Checking:** Check in search (Option A)
   - Batch query all search result MBIDs at once
   - Mark `alreadyImported: true` in results
   - Show existing album ID for "View in Collection" link

2. ✅ **Release Selection:** Separate endpoint
   - `/search` → Returns list of albums
   - `/releases` → Returns editions for chosen album
   - `/import` → Imports specific edition
   - Clear separation of concerns

3. ✅ **Import Response:** Include warnings
   - Success response includes warnings array
   - Lists tracks with null duration
   - User can navigate to album and edit tracks manually

4. ✅ **Authentication:** Required on all endpoints
   - Prevents abuse of MusicBrainz API
   - Ties imports to user accounts
   - Uses existing NextAuth session

5. ✅ **Error Format:** Standardized across all routes
   - Consistent error codes
   - User-friendly messages
   - Optional details field for debugging

---

### Step 4: Database Import Logic ⚠️ SIMPLIFIED IMPLEMENTATION

**File:** `src/lib/import/musicbrainz.ts` ❌ NOT CREATED - Logic embedded in route

**Current Implementation:** Import logic is directly in `src/app/(api)/api/musicbrainz/import/route.ts`

**Schema Changes Required:** ❌ NOT IMPLEMENTED

**Current Schema Status:** ⚠️ SINGLE ARTIST ONLY - Multi-artist albums not supported yet

The current database schema only supports single artists per album. Multi-artist relationships are not implemented:

```prisma
// In prisma/schema.prisma

model Artist {
  id               String                  @id @default(cuid())
  name             String
  sortName         String?
  country          String?
  notes            String?
  imageUrl         String?
  musicbrainzId    String?                 @unique // NEW: Store MB artist ID
  groups           ReleaseGroup[]          // albums where this is PRIMARY artist
  collaborations   ReleaseGroupArtist[]    // NEW: all albums this artist appears on
  createdAt        DateTime                @default(now())
  updatedAt        DateTime                @updatedAt

  @@index([name])
  @@index([sortName])
}

model ReleaseGroup {
  id              String                  @id @default(cuid())
  title           String
  primaryType     PrimaryType
  year            Int?
  // Classical fields (at album/work level)
  isClassical     Boolean                 @default(false)
  composer        String?
  work            String?
  movement        String?
  ensemble        String?
  conductor       String?
  soloist         String?
  // Relations
  artistId        String
  artist          Artist                  @relation(fields: [artistId], references: [id])  // Primary artist
  artists         ReleaseGroupArtist[]    // NEW: All artists (for collaborations)
  artistCredit    String?                 // NEW: Formatted credit "David Bowie & Queen"
  releases        Release[]
  genres          ReleaseGroupGenre[]
  covers          Cover[]
  external        ExternalRef[]
  // Album-level quality inputs
  coverValue      Int?
  productionValue Int?
  mixValue        Int?
  createdAt       DateTime                @default(now())
  updatedAt       DateTime                @updatedAt

  @@unique([artistId, title, year])
  @@index([title])
  @@index([year])
}

// NEW: Junction table for many-to-many artist relationships
model ReleaseGroupArtist {
  releaseGroupId String
  artistId       String
  position       Int            // Order in artist credit (0-based)
  joinPhrase     String?        // " & ", " feat. ", etc.
  
  releaseGroup   ReleaseGroup   @relation(fields: [releaseGroupId], references: [id], onDelete: Cascade)
  artist         Artist         @relation(fields: [artistId], references: [id], onDelete: Cascade)
  
  @@id([releaseGroupId, artistId])
  @@index([artistId])
}

// Also update ExternalRef to support artist MBIDs
model ExternalRef {
  id             String       @id @default(cuid())
  releaseGroupId String
  musicbrainzId  String?      @unique   // Release Group MBID
  discogsId      String?      @unique
  spotifyUrl     String?
  bandcampUrl    String?
  releaseGroup   ReleaseGroup @relation(fields: [releaseGroupId], references: [id])
}
```

**Migration Command:**
```bash
npx prisma migrate dev --name add-multi-artist-support
```

---

**Import Function Implementation:**

```typescript
import { prisma } from '@/lib/db'
import { 
  MBReleaseGroup, 
  MBRelease, 
  extractArtists, 
  formatArtistCredit,
  extractYear,
  mapPrimaryType,
} from '@/lib/schemas/musicbrainz'

interface ImportResult {
  albumId: string
  tracksWithNullDuration: Array<{
    id: string
    number: number
    title: string
  }>
}

/**
 * Find or create artist by MusicBrainz ID or name
 * Uses fuzzy matching to handle variations like "The Beatles" vs "Beatles"
 */
async function findOrCreateArtist(
  tx: any,  // Prisma transaction client
  mbArtist: { mbid: string; name: string; sortName: string }
): Promise<string> {
  // First try: Match by MusicBrainz ID
  if (mbArtist.mbid) {
    const existing = await tx.artist.findUnique({
      where: { musicbrainzId: mbArtist.mbid }
    })
    if (existing) return existing.id
  }

  // Second try: Fuzzy name matching
  // Handle variations: "The Beatles" vs "Beatles"
  const nameVariations = [
    mbArtist.name,
    mbArtist.name.replace(/^The\s+/i, ''),  // "The Beatles" -> "Beatles"
    `The ${mbArtist.name}`,                  // "Beatles" -> "The Beatles"
  ].filter((v, i, arr) => arr.indexOf(v) === i)  // Remove duplicates

  const existing = await tx.artist.findFirst({
    where: {
      name: {
        in: nameVariations,
        mode: 'insensitive'
      }
    }
  })

  if (existing) {
    // Update with MusicBrainz ID if missing
    if (!existing.musicbrainzId && mbArtist.mbid) {
      await tx.artist.update({
        where: { id: existing.id },
        data: { musicbrainzId: mbArtist.mbid }
      })
    }
    return existing.id
  }

  // Create new artist
  const newArtist = await tx.artist.create({
    data: {
      name: mbArtist.name,
      sortName: mbArtist.sortName,
      musicbrainzId: mbArtist.mbid,
    }
  })

  return newArtist.id
}

/**
 * Main import function
 * Creates Artist(s), ReleaseGroup, Release, Tracks, and ExternalRef
 */
export async function importFromMusicBrainz(
  releaseGroup: MBReleaseGroup,
  release: MBRelease,
  userId: string,
): Promise<ImportResult> {
  
  return await prisma.$transaction(async (tx) => {
    // 1. Extract all artists from artist-credit
    const mbArtists = extractArtists(releaseGroup['artist-credit'])
    const artistCredit = formatArtistCredit(releaseGroup['artist-credit'])
    
    // 2. Find or create all artists
    const artistIds: string[] = []
    for (const mbArtist of mbArtists) {
      const artistId = await findOrCreateArtist(tx, mbArtist)
      artistIds.push(artistId)
    }
    
    // Primary artist is the first one
    const primaryArtistId = artistIds[0]
    
    // 3. Create ReleaseGroup (album)
    const year = extractYear(releaseGroup['first-release-date'])
    
    const albumData = {
      artistId: primaryArtistId,
      title: releaseGroup.title,
      primaryType: mapPrimaryType(releaseGroup['primary-type']),
      year,
      artistCredit,  // Store formatted credit: "David Bowie & Queen"
      // Quality modifiers left null (user input)
      coverValue: null,
      productionValue: null,
      mixValue: null,
    }
    
    const album = await tx.releaseGroup.create({
      data: albumData
    })
    
    // 4. Create many-to-many artist relationships
    const artistCredits = releaseGroup['artist-credit']
    let position = 0
    
    for (let i = 0; i < artistCredits.length; i++) {
      const credit = artistCredits[i]
      
      // Skip joinphrase items (they don't have artist objects)
      if (!credit.artist) continue
      
      const artistId = artistIds[position]
      const joinPhrase = credit.joinphrase || null
      
      await tx.releaseGroupArtist.create({
        data: {
          releaseGroupId: album.id,
          artistId,
          position,
          joinPhrase,
        }
      })
      
      position++
    }
    
    // 5. Create Release (specific edition)
    const releaseDate = release.date ? new Date(release.date) : null
    
    const createdRelease = await tx.release.create({
      data: {
        releaseGroupId: album.id,
        title: release.title,
        date: releaseDate,
        barcode: release.barcode || null,
        label: release['label-info']?.[0]?.label?.name || null,
        catalogNo: release['label-info']?.[0]?.[('catalog-number')] || null,
      }
    })
    
    // 6. Create Tracks
    const tracksWithNullDuration: Array<{
      id: string
      number: number
      title: string
    }> = []
    
    // Flatten all tracks from all media (CDs/discs)
    const allTracks = release.media.flatMap(media => 
      media.tracks.map(track => ({
        ...track,
        // Use track.position as the number (already numeric)
        trackNumber: track.position,
      }))
    )
    
    for (const track of allTracks) {
      const durationSec = track.length 
        ? Math.round(track.length / 1000) 
        : null
      
      const createdTrack = await tx.track.create({
        data: {
          releaseId: createdRelease.id,
          number: track.trackNumber,
          title: track.title,
          durationSec,
        }
      })
      
      // Flag tracks with null duration
      if (durationSec === null) {
        tracksWithNullDuration.push({
          id: createdTrack.id,
          number: track.trackNumber,
          title: track.title,
        })
      }
    }
    
    // 7. Store ExternalRef (MusicBrainz ID)
    await tx.externalRef.create({
      data: {
        releaseGroupId: album.id,
        musicbrainzId: releaseGroup.id,  // Release Group MBID
      }
    })
    
    return {
      albumId: album.id,
      tracksWithNullDuration,
    }
  })
}
```

**Helper Functions for Artist Page:**

```typescript
// Get all albums for an artist (including collaborations)
export async function getArtistAlbums(artistId: string) {
  // Get albums where this artist is primary
  const primaryAlbums = await prisma.releaseGroup.findMany({
    where: { artistId },
    include: { artists: { include: { artist: true } } }
  })
  
  // Get albums where this artist collaborates
  const collaborations = await prisma.releaseGroupArtist.findMany({
    where: { 
      artistId,
      releaseGroup: {
        artistId: { not: artistId }  // Exclude primary albums (already fetched)
      }
    },
    include: {
      releaseGroup: {
        include: { 
          artist: true,  // Primary artist
          artists: { include: { artist: true } }  // All artists
        }
      }
    }
  })
  
  return {
    primaryAlbums,
    collaborations: collaborations.map(c => c.releaseGroup),
  }
}
```

**Decisions Made:**

1. ✅ **Multi-Artist Albums:** Proper many-to-many implementation
   - `ReleaseGroupArtist` junction table
   - `Artist.musicbrainzId` field for matching
   - Primary artist in `ReleaseGroup.artistId`
   - All artists in `ReleaseGroupArtist` with position/joinPhrase
   - Formatted credit stored in `ReleaseGroup.artistCredit`
   - Collaborations will appear on artist pages

2. ✅ **Artist Matching:** Fuzzy matching (Option B)
   - First: Match by MusicBrainz ID
   - Second: Check name variations ("The Beatles" vs "Beatles")
   - Case-insensitive matching
   - Update existing artists with MBID if missing

3. ✅ **Transaction Safety:** Wrapped in `prisma.$transaction()`
   - Atomic operation - all or nothing
   - Prevents partial imports on error
   - Rollback if any step fails

4. ✅ **Null Duration Handling:** Flagging approach
   - Import tracks with `durationSec: null`
   - Return list of affected tracks
   - Show warnings in UI
   - **Future:** Add track edit UI to manually enter durations

5. ✅ **Quality Modifiers:** Leave null
   - User rates albums manually later
   - Don't auto-set or infer from MB data

6. ✅ **Classical Fields:** Skip for MVP
   - Don't parse composer/work relationships
   - Leave `isClassical: false` by default
   - Can add in future enhancement

**Migration Steps:**

1. Add new models/fields to `schema.prisma`
2. Run `npx prisma migrate dev --name add-multi-artist-support`
3. Update queries in artist pages to include collaborations
4. Test with multi-artist albums

---

### Step 5: Import UI (Phase 3) ⚠️ BASIC IMPLEMENTATION

**Current User Flow:** ⚠️ SIMPLIFIED
1. ✅ Navigate to `/import` page - IMPLEMENTED  
2. ✅ Enter search query (Artist/Album/Barcode modes) - IMPLEMENTED
3. ✅ See search results with "Already Imported" badges - IMPLEMENTED
4. ❌ Click album → **MISSING**: Modal shows available releases/editions  
5. ❌ Select release → **MISSING**: Optional preview with track list
6. ⚠️ **CURRENT**: Auto-selects first release and imports directly
7. ✅ Success feedback - IMPLEMENTED

**Missing Components:**
- Release selection modal
- Track preview modal  
- Release edition picker UI
- Artist selector for artist-first search mode

---

#### Component 1: Import Page ✅ COMPLETE
**File:** `src/app/(pages)/import/page.tsx` ✅ IMPLEMENTED

```tsx
import { ImportSearchClient } from '@/components/import/ImportSearch'

export default function ImportPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Import Albums</h1>
        <p className="text-gray-600">
          Search for albums in the MusicBrainz database and add them to your collection.
        </p>
      </div>
      
      <ImportSearchClient />
    </div>
  )
}
```

---

#### Component 2: Import Search (Main Client Component) ⚠️ SIMPLIFIED
**File:** `src/components/import/ImportSearch.tsx` ⚠️ BASIC IMPLEMENTATION

**Current Implementation:** Simple search form with Artist/Album/Barcode modes
**Missing Features:**
- Combined "Artist - Album" parsing 
- Artist-first search mode with artist selector
- Advanced search query building
- Debounced search

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { SearchForm } from './SearchForm'
import { ArtistSelector } from './ArtistSelector'
import { SearchResults } from './SearchResults'
import { ReleaseSelectionModal } from './ReleaseSelectionModal'
import { ImportPreviewModal } from './ImportPreviewModal'

interface SearchResult {
  mbid: string
  title: string
  artist: string
  year: number | null
  type: string
  releaseCount: number
  alreadyImported: boolean
  existingAlbumId: string | null
}

interface Artist {
  mbid: string
  name: string
  disambiguation?: string
  country?: string
}

interface SelectedAlbum {
  mbid: string
  title: string
  artist: string
  year: number | null
  type: string
}

type SearchMode = 'combined' | 'artist-first' | 'album-only'

export function ImportSearch() {
  const [searchMode, setSearchMode] = useState<SearchMode>('combined')
  const [query, setQuery] = useState('')
  const [artistResults, setArtistResults] = useState<Artist[]>([])
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)
  const [albumResults, setAlbumResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [selectedAlbum, setSelectedAlbum] = useState<SelectedAlbum | null>(null)
  const [previewRelease, setPreviewRelease] = useState<{ mbid: string; releaseMbid: string } | null>(null)
  
  const debouncedQuery = useDebounce(query, 300)

  // Auto-search when query changes (debounced)
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setArtistResults([])
      setAlbumResults([])
      return
    }

    if (searchMode === 'artist-first' && !selectedArtist) {
      searchArtists(debouncedQuery)
    } else {
      searchAlbums(debouncedQuery)
    }
  }, [debouncedQuery, searchMode, selectedArtist])

  // When artist is selected in artist-first mode, search albums
  useEffect(() => {
    if (searchMode === 'artist-first' && selectedArtist && query.length > 0) {
      searchAlbums(query)
    }
  }, [selectedArtist])

  async function searchArtists(searchQuery: string) {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ artist: searchQuery })
      const response = await fetch(`/api/musicbrainz/search-artists?${params}`)
      
      if (!response.ok) {
        throw new Error('Artist search failed')
      }
      
      const data = await response.json()
      setArtistResults(data.results || [])
    } catch (err) {
      setError('Failed to search artists. Please try again.')
      setArtistResults([])
    } finally {
      setLoading(false)
    }
  }

  async function searchAlbums(searchQuery: string) {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      
      if (searchMode === 'artist-first' && selectedArtist) {
        // Search albums by specific artist
        params.append('artist', selectedArtist.name)
        params.append('artistMbid', selectedArtist.mbid)
        params.append('album', searchQuery)
      } else if (searchMode === 'album-only') {
        // Search only by album name
        params.append('album', searchQuery)
      } else {
        // Combined mode: parse "Artist - Album" format
        const { artist, album } = parseSearchInput(searchQuery)
        if (artist) params.append('artist', artist)
        if (album) params.append('album', album)
      }
      
      const response = await fetch(`/api/musicbrainz/search?${params}`)
      
      if (!response.ok) {
        throw new Error('Album search failed')
      }
      
      const data = await response.json()
      setAlbumResults(data.results || [])
    } catch (err) {
      setError('Failed to search albums. Please try again.')
      setAlbumResults([])
    } finally {
      setLoading(false)
    }
  }

  function handleSearchModeChange(mode: SearchMode) {
    setSearchMode(mode)
    setQuery('')
    setSelectedArtist(null)
    setArtistResults([])
    setAlbumResults([])
    setError(null)
  }

  function handleArtistSelect(artist: Artist) {
    setSelectedArtist(artist)
    setArtistResults([]) // Clear artist results
    setQuery('') // Clear query to let user search albums
  }

  function handleArtistDeselect() {
    setSelectedArtist(null)
    setAlbumResults([])
    setQuery('')
  }

  function handleAlbumClick(result: SearchResult) {
    if (result.alreadyImported) {
      // Navigate to existing album
      window.location.href = `/album/${result.existingAlbumId}`
      return
    }

    // Open release selection modal
    setSelectedAlbum({
      mbid: result.mbid,
      title: result.title,
      artist: result.artist,
      year: result.year,
      type: result.type,
    })
  }

  function handleReleaseSelect(releaseMbid: string, showPreview: boolean) {
    if (!selectedAlbum) return

    if (showPreview) {
      // Open preview modal
      setPreviewRelease({
        mbid: selectedAlbum.mbid,
        releaseMbid,
      })
      setSelectedAlbum(null) // Close release modal
    } else {
      // Quick import without preview
      performImport(selectedAlbum.mbid, releaseMbid)
      setSelectedAlbum(null)
    }
  }

  function handleConfirmImport(releaseGroupMbid: string, releaseMbid: string) {
    performImport(releaseGroupMbid, releaseMbid)
    setPreviewRelease(null)
  }

  async function performImport(releaseGroupMbid: string, releaseMbid: string) {
    try {
      const response = await fetch('/api/musicbrainz/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ releaseGroupMbid, releaseMbid }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Import failed')
      }

      // Show success toast with action to view album
      toast.success(data.message, {
        action: {
          label: 'View Album',
          onClick: () => {
            window.location.href = `/album/${data.albumId}`
          }
        }
      })

      // Show warnings if any
      if (data.warnings && data.warnings.length > 0) {
        data.warnings.forEach((warning: string) => {
          toast.warning(warning)
        })
      }

      // Refresh album results to update "already imported" status
      if (debouncedQuery) {
        searchAlbums(debouncedQuery)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed')
    }
  }

  return (
    <>
      {/* Search Mode Selector */}
      <div className="mb-6 flex gap-2 border-b">
        <button
          onClick={() => handleSearchModeChange('combined')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            searchMode === 'combined'
              ? 'border-blue-500 text-blue-600 font-medium'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Quick Search
        </button>
        <button
          onClick={() => handleSearchModeChange('artist-first')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            searchMode === 'artist-first'
              ? 'border-blue-500 text-blue-600 font-medium'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Artist → Album
        </button>
        <button
          onClick={() => handleSearchModeChange('album-only')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            searchMode === 'album-only'
              ? 'border-blue-500 text-blue-600 font-medium'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Album Only
        </button>
      </div>

      {/* Artist Selection (artist-first mode) */}
      {searchMode === 'artist-first' && selectedArtist && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Selected Artist:</p>
            <p className="font-semibold">{selectedArtist.name}</p>
            {selectedArtist.disambiguation && (
              <p className="text-sm text-gray-500">{selectedArtist.disambiguation}</p>
            )}
          </div>
          <button
            onClick={handleArtistDeselect}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-white"
          >
            Change Artist
          </button>
        </div>
      )}

      {/* Search Form */}
      <SearchForm
        mode={searchMode}
        query={query}
        hasSelectedArtist={selectedArtist !== null}
        onQueryChange={setQuery}
        onSubmit={() => {
          if (searchMode === 'artist-first' && !selectedArtist) {
            searchArtists(query)
          } else {
            searchAlbums(query)
          }
        }}
      />

      {/* Artist Results (artist-first mode, before artist selected) */}
      {searchMode === 'artist-first' && !selectedArtist && artistResults.length > 0 && (
        <ArtistSelector
          artists={artistResults}
          onSelect={handleArtistSelect}
        />
      )}

      {/* Album Results */}
      {(searchMode !== 'artist-first' || selectedArtist) && (
        <SearchResults
          results={albumResults}
          loading={loading}
          error={error}
          onAlbumClick={handleAlbumClick}
        />
      )}

      {selectedAlbum && (
        <ReleaseSelectionModal
          album={selectedAlbum}
          onSelect={handleReleaseSelect}
          onClose={() => setSelectedAlbum(null)}
        />
      )}

      {previewRelease && (
        <ImportPreviewModal
          releaseGroupMbid={previewRelease.mbid}
          releaseMbid={previewRelease.releaseMbid}
          onConfirm={handleConfirmImport}
          onCancel={() => setPreviewRelease(null)}
        />
      )}
    </>
  )
}

// Helper to parse "Artist - Album" format
function parseSearchInput(input: string): { artist: string; album: string } {
  const separators = [' - ', ' – ', ' / ']
  
  for (const sep of separators) {
    if (input.includes(sep)) {
      const [artist, album] = input.split(sep, 2)
      return { artist: artist.trim(), album: album.trim() }
    }
  }
  
  // No separator found, treat entire input as album name
  return { artist: '', album: input.trim() }
}
```

---

#### Component 2b: Artist Selector ❌ NOT IMPLEMENTED
**File:** `src/components/import/ArtistSelector.tsx` ❌ MISSING

```tsx
'use client'

interface Artist {
  mbid: string
  name: string
  disambiguation?: string
  country?: string
}

interface ArtistSelectorProps {
  artists: Artist[]
  onSelect: (artist: Artist) => void
}

export function ArtistSelector({ artists, onSelect }: ArtistSelectorProps) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-3">Select Artist</h3>
      <div className="space-y-2">
        {artists.map((artist) => (
          <button
            key={artist.mbid}
            onClick={() => onSelect(artist)}
            className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-colors"
          >
            <div className="font-semibold">{artist.name}</div>
            {(artist.disambiguation || artist.country) && (
              <div className="text-sm text-gray-600">
                {artist.disambiguation && <span>{artist.disambiguation}</span>}
                {artist.disambiguation && artist.country && <span> • </span>}
                {artist.country && <span>{artist.country}</span>}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
```

---

#### Component 3: Search Form ✅ INTEGRATED
**File:** `src/components/import/SearchForm.tsx` ❌ NOT SEPARATE - Integrated into ImportSearch.tsx

```tsx
'use client'

type SearchMode = 'combined' | 'artist-first' | 'album-only'

interface SearchFormProps {
  mode: SearchMode
  query: string
  hasSelectedArtist: boolean
  onQueryChange: (query: string) => void
  onSubmit: () => void
}

export function SearchForm({ mode, query, hasSelectedArtist, onQueryChange, onSubmit }: SearchFormProps) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit()
  }

  function getPlaceholder(): string {
    if (mode === 'artist-first') {
      return hasSelectedArtist 
        ? 'Search for album name...'
        : 'Search for artist name...'
    }
    if (mode === 'album-only') {
      return 'Search for album name...'
    }
    return 'Search "Artist - Album" or just album name...'
  }

  function getHintText(): string {
    if (mode === 'artist-first' && !hasSelectedArtist) {
      return 'First, select an artist from the results below'
    }
    if (mode === 'artist-first' && hasSelectedArtist) {
      return 'Now search for albums by this artist'
    }
    if (mode === 'album-only') {
      return 'Search by album name only (may return results from multiple artists)'
    }
    return 'Tip: Use "Artist - Album" format for best results (e.g., "The Beatles - Abbey Road")'
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={getPlaceholder()}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        <button
          type="submit"
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Search
        </button>
      </div>
      <p className="mt-2 text-sm text-gray-500">
        {getHintText()}
      </p>
    </form>
  )
}
```

---

#### Component 4: Search Results Grid ✅ COMPLETE  
**File:** `src/components/import/SearchResults.tsx` ✅ IMPLEMENTED

```tsx
'use client'

import { SearchResultCard } from './SearchResultCard'
import { SearchResultSkeleton } from './SearchResultSkeleton'

interface SearchResult {
  mbid: string
  title: string
  artist: string
  year: number | null
  type: string
  releaseCount: number
  alreadyImported: boolean
  existingAlbumId: string | null
}

interface SearchResultsProps {
  results: SearchResult[]
  loading: boolean
  error: string | null
  onAlbumClick: (result: SearchResult) => void
}

export function SearchResults({ results, loading, error, onAlbumClick }: SearchResultsProps) {
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <SearchResultSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No results found. Try searching for an album.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {results.map((result) => (
        <SearchResultCard
          key={result.mbid}
          result={result}
          onClick={() => onAlbumClick(result)}
        />
      ))}
    </div>
  )
}
```

---

#### Component 5: Search Result Card ✅ INTEGRATED
**File:** `src/components/import/SearchResultCard.tsx` ❌ NOT SEPARATE - Integrated into SearchResults.tsx

```tsx
'use client'

interface SearchResult {
  mbid: string
  title: string
  artist: string
  year: number | null
  type: string
  releaseCount: number
  alreadyImported: boolean
  existingAlbumId: string | null
}

interface SearchResultCardProps {
  result: SearchResult
  onClick: () => void
}

export function SearchResultCard({ result, onClick }: SearchResultCardProps) {
  return (
    <div
      onClick={onClick}
      className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
    >
      {/* Album art placeholder (Phase 5: fetch from Cover Art Archive) */}
      <div className="w-full aspect-square bg-gray-200 rounded mb-3 flex items-center justify-center">
        <span className="text-gray-400 text-4xl">♪</span>
      </div>
      
      <h3 className="font-semibold text-lg mb-1 line-clamp-2">{result.title}</h3>
      <p className="text-sm text-gray-600 mb-2">{result.artist}</p>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        {result.year && <span>{result.year}</span>}
        <span>•</span>
        <span>{result.type}</span>
        {result.releaseCount > 1 && (
          <>
            <span>•</span>
            <span>{result.releaseCount} editions</span>
          </>
        )}
      </div>
      
      {result.alreadyImported ? (
        <button
          className="w-full py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
        >
          View in Collection
        </button>
      ) : (
        <button
          className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Import
        </button>
      )}
    </div>
  )
}
```

---

#### Component 6: Search Result Skeleton ❌ NOT IMPLEMENTED
**File:** `src/components/import/SearchResultSkeleton.tsx` ❌ MISSING

```tsx
export function SearchResultSkeleton() {
  return (
    <div className="border rounded-lg p-4 animate-pulse">
      <div className="w-full aspect-square bg-gray-200 rounded mb-3" />
      <div className="h-6 bg-gray-200 rounded mb-2" />
      <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
      <div className="h-10 bg-gray-200 rounded" />
    </div>
  )
}
```

---

#### Component 7: Release Selection Modal ❌ NOT IMPLEMENTED
**File:** `src/components/import/ReleaseSelectionModal.tsx` ❌ MISSING - **HIGH PRIORITY**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'

interface Release {
  id: string
  title: string
  date: string
  country: string
  status: string
  barcode: string
  format: string
  trackCount: number
}

interface ReleaseSelectionModalProps {
  album: {
    mbid: string
    title: string
    artist: string
    year: number | null
    type: string
  }
  onSelect: (releaseMbid: string, showPreview: boolean) => void
  onClose: () => void
}

export function ReleaseSelectionModal({ album, onSelect, onClose }: ReleaseSelectionModalProps) {
  const [releases, setReleases] = useState<Release[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRelease, setSelectedRelease] = useState<string | null>(null)

  useEffect(() => {
    fetchReleases()
  }, [album.mbid])

  async function fetchReleases() {
    try {
      const response = await fetch(`/api/musicbrainz/releases?mbid=${album.mbid}`)
      const data = await response.json()
      setReleases(data.releases || [])
    } catch (err) {
      console.error('Failed to fetch releases:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleQuickImport() {
    if (selectedRelease) {
      onSelect(selectedRelease, false)
    }
  }

  function handlePreviewImport() {
    if (selectedRelease) {
      onSelect(selectedRelease, true)
    }
  }

  return (
    <Modal onClose={onClose} title={`Select Edition - ${album.title}`}>
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {album.artist} • {album.year} • {album.type}
        </p>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading editions...</div>
      ) : (
        <>
          <div className="max-h-96 overflow-y-auto mb-4">
            {releases.map((release) => (
              <label
                key={release.id}
                className="flex items-start gap-3 p-3 border rounded-lg mb-2 cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name="release"
                  value={release.id}
                  checked={selectedRelease === release.id}
                  onChange={() => setSelectedRelease(release.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium">{release.format}, {release.country}, {release.date}</div>
                  <div className="text-sm text-gray-600">
                    {release.status} • {release.trackCount} tracks
                  </div>
                  {release.barcode !== '—' && (
                    <div className="text-xs text-gray-500">Barcode: {release.barcode}</div>
                  )}
                </div>
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePreviewImport}
              disabled={!selectedRelease}
              className="flex-1 py-2 border border-blue-500 text-blue-500 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Preview Tracks
            </button>
            <button
              onClick={handleQuickImport}
              disabled={!selectedRelease}
              className="flex-1 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Quick Import
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}
```

---

#### Component 8: Import Preview Modal ❌ NOT IMPLEMENTED
**File:** `src/components/import/ImportPreviewModal.tsx` ❌ MISSING

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'

interface Track {
  number: number
  title: string
  duration: string  // Formatted "3:45" or "—"
  hasNullDuration: boolean
}

interface ImportPreviewModalProps {
  releaseGroupMbid: string
  releaseMbid: string
  onConfirm: (releaseGroupMbid: string, releaseMbid: string) => void
  onCancel: () => void
}

export function ImportPreviewModal({ releaseGroupMbid, releaseMbid, onConfirm, onCancel }: ImportPreviewModalProps) {
  const [tracks, setTracks] = useState<Track[]>([])
  const [albumInfo, setAlbumInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [nullDurationCount, setNullDurationCount] = useState(0)

  useEffect(() => {
    fetchPreview()
  }, [releaseMbid])

  async function fetchPreview() {
    try {
      // Fetch release details from MusicBrainz API
      const response = await fetch(`/api/musicbrainz/preview?releaseMbid=${releaseMbid}`)
      const data = await response.json()
      
      setAlbumInfo(data.album)
      setTracks(data.tracks)
      setNullDurationCount(data.tracks.filter((t: Track) => t.hasNullDuration).length)
    } catch (err) {
      console.error('Failed to fetch preview:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onCancel} title="Preview & Import">
      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading track list...</div>
      ) : (
        <>
          {albumInfo && (
            <div className="mb-4">
              <h3 className="text-xl font-bold">{albumInfo.title}</h3>
              <p className="text-gray-600">{albumInfo.artist}</p>
            </div>
          )}

          {nullDurationCount > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                ⚠️ Warning: {nullDurationCount} track(s) are missing duration data. 
                You can edit them manually after import.
              </p>
            </div>
          )}

          <div className="mb-4 max-h-96 overflow-y-auto">
            <h4 className="font-semibold mb-2">Tracks ({tracks.length})</h4>
            <ol className="space-y-1">
              {tracks.map((track) => (
                <li
                  key={track.number}
                  className={`flex justify-between text-sm ${
                    track.hasNullDuration ? 'text-yellow-600' : ''
                  }`}
                >
                  <span>
                    {track.number}. {track.title}
                  </span>
                  <span className="text-gray-500">{track.duration}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(releaseGroupMbid, releaseMbid)}
              className="flex-1 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Confirm Import
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}
```

---

**Decisions Made:**

1. ✅ **Search Layout:** Three search modes with tabs
   - **Quick Search (combined):** Single field with "Artist - Album" parsing
   - **Artist → Album:** Two-step search (select artist first, then search albums)
   - **Album Only:** Search by album name only
   - Dynamic placeholder and hint text based on mode

2. ✅ **Artist-First Mode:**
   - Search artists first (shows list of artists with disambiguation)
   - Select artist → Shows selected artist badge
   - Search albums → Filtered by selected artist using MBID
   - More accurate results for common artist names
   - Better for exploring artist discography

3. ✅ **Release Selection:** Modal
   - Opens on album click
   - Shows all available editions
   - Radio selection for picking edition
   - Two action buttons: "Preview Tracks" and "Quick Import"

4. ✅ **Track Preview:** Optional
   - "Quick Import" skips preview
   - "Preview Tracks" shows full track list
   - Highlights tracks with null duration
   - Shows warning about missing durations

5. ✅ **Null Duration:** Just warn
   - Yellow warning box in preview
   - Lists count of affected tracks
   - Allows import to proceed
   - User can edit tracks manually later

6. ✅ **Import Success:** Toast with action
   - Success toast appears
   - "View Album" button in toast
   - Stays on import page for bulk imports
   - Search results refresh to update "already imported" status

7. ✅ **Loading States:** Skeleton screens
   - 6 skeleton cards during search
   - Better perceived performance
   - Consistent with modern UX patterns

**Additional Components Needed:**

- `Modal` component (reusable)
- `useDebounce` hook (300ms delay)
- `ArtistSelector` component (NEW)
- Toast system integration (already have)
- Preview API endpoint (`/api/musicbrainz/preview`)
- Artist search API endpoint (`/api/musicbrainz/search-artists`) (NEW)
- Artist search schema in Zod (NEW)

**Mobile Optimizations:**

- Single column grid on mobile (via Tailwind `md:` breakpoints)
- Full-screen modals on small screens
- Touch-friendly tap targets (py-2, py-3)
- Scrollable track lists

---

## Part 2: Google Sheets Import (Future Phase)

### Overview
Allow users to batch import their ratings for existing albums from a Google Sheet or CSV file.

**Important:** This feature assumes albums already exist in the database. It only imports user ratings (album ratings, track ratings, quality modifiers, etc.). Users must first import albums via MusicBrainz or other means.

### Expected Sheet Format

| Artist | Album | Album Rating | Track 1 | Track 2 | Track 3 | ... |
|--------|-------|--------------|---------|---------|---------|-----|
| The Beatles | Abbey Road | 5 | 5 | 4 | 5 | ... |
| Pink Floyd | Dark Side | 4.5 | 5 | 5 | 4 | ... |

Or simplified:

| Artist | Album | Rating |
|--------|-------|--------|
| The Beatles | Abbey Road | 5 |
| Pink Floyd | Dark Side | 4.5 |

### Approach Options

#### Option A: CSV Upload (Simpler)
1. User uploads CSV file
2. Parse CSV client-side
3. Match artist/album to existing database entries
4. Validate ratings (0-5 scale)
5. Preview matched albums and ratings
6. Bulk import ratings via API

**Pros:**
- No OAuth complexity
- Works offline
- Simple implementation
- User maintains their own spreadsheet

**Cons:**
- No real-time collaboration
- Manual file export from Google Sheets
- Requires manual artist/album matching

#### Option B: Google Sheets API (More Features)
1. User authenticates with Google OAuth
2. User selects their ratings spreadsheet
3. Read Sheet data via API
4. Auto-match artist/album to database
5. Show unmatched entries for review
6. Import ratings for matched albums
5. Bulk import

**Pros:**
- Real-time collaboration
- Auto-sync capability
- Familiar tool for users

**Pros:**
- Real-time Sheet access
- No manual file export
- Better UX for regular use

**Cons:**
- OAuth setup required
- API quotas and rate limits
- More complex implementation

### Matching Logic

**Algorithm:**
1. Extract artist name + album name from Sheet row
2. Fuzzy match against existing database albums
   - Normalize text: lowercase, remove "The", trim whitespace
   - Match on artist name variations
   - Match on album title
3. Show confidence score for each match
4. Allow user to confirm/reject matches
5. Import ratings only for confirmed matches

**Unmatched Entries:**
- Show list of rows that couldn't be matched
- Allow manual album selection
- Suggest importing album via MusicBrainz first

### Questions to Decide:

1. **Import Scope:**
   - Album ratings only, or also track ratings?
   - Quality modifiers (live, remaster, compilation flags)?
   - **Recommendation:** Start with album ratings, add track ratings later

2. **Matching Confidence:**
   - Auto-import high confidence (>90%) matches?
   - Or always require user confirmation?
   - **Recommendation:** Always show preview, require confirmation

3. **Priority:**
   - Before or after MusicBrainz import?
   - **Recommendation:** After MusicBrainz (need albums in DB first)

4. **Authentication:**
   - CSV upload (no auth) or Google Sheets API (OAuth)?
   - **Recommendation:** Start with CSV, add Sheets if users request it

5. **Conflict Resolution:**
   - What if album already has rating?
   - Overwrite, skip, or ask user?
   - **Recommendation:** Ask user (show existing vs new rating)
4. **Template:**
   - Provide downloadable CSV template?
   - **Recommendation:** Yes, with example data and field descriptions
5. **Validation:**
   - Client-side preview with error highlighting?
   - **Recommendation:** Yes, show errors before import attempt
6. **Duplicate Handling:**
   - Skip duplicates or ask user?
   - **Recommendation:** Show preview with duplicate warnings, let user decide

### Implementation Plan (CSV Version)

**Step 1:** File upload component
**Step 2:** CSV parsing (use `papaparse` library)
**Step 3:** Data validation and preview table
**Step 4:** Bulk import API endpoint
**Step 5:** Progress tracking and error reporting

**Estimated Effort:** 2-3 days

---

## 🚀 NEXT PHASE: COMPLETE MUSICBRAINZ IMPORT (PRIORITY ORDER)

### Phase A: Critical Production Features (Week 1) 🔴 HIGH PRIORITY

#### A1. Release Selection Modal (8 hours)
**Status:** ❌ MISSING - **CRITICAL FOR UX**
- Create `ReleaseSelectionModal.tsx` component  
- Update `/api/musicbrainz/release-groups` to return all releases for album
- Show different editions: CD, Vinyl, Digital, different regions
- Let user pick before import instead of auto-selecting first

#### A2. Multi-Artist Database Schema (4 hours)  
**Status:** ❌ MISSING - **CRITICAL FOR DATA ACCURACY**
- Add `ReleaseGroupArtist` junction table to schema
- Add `Artist.musicbrainzId` field for better matching
- Update import logic to handle collaborations properly
- Test with albums like "David Bowie & Queen - Under Pressure"

#### A3. Track Preview Modal (4 hours)
**Status:** ❌ MISSING - **IMPORTANT FOR TRANSPARENCY** 
- Create `ImportPreviewModal.tsx` component
- Show full track list before import
- Highlight tracks with missing durations  
- Let user cancel if track list looks wrong

### Phase B: Enhanced UX Features (Week 2) 🟡 MEDIUM PRIORITY

#### B1. Advanced Search Modes (6 hours)
- Artist-first search with artist disambiguation
- Combined "Artist - Album" parsing
- Debounced search with loading states
- Search result skeletons

#### B2. Better Import Flow (4 hours) 
- Progress indicators during import
- Better success/error messages
- Toast notifications with "View Album" action
- Import history/recent imports

### Phase C: Google Sheets Integration (Future) 🟢 LOW PRIORITY

#### C1. CSV Upload & Preview (8 hours)
- File upload component with drag & drop
- CSV parsing and validation
- Preview table with error highlighting
- Album matching algorithm

#### C2. Batch Import Processing (8 hours)
- Progress tracking for large imports
- Skip/retry failed items
- Conflict resolution (existing vs new ratings)
- Import summary report

---

## Recommended Implementation Order

### ✅ Phase 1: MusicBrainz MVP (COMPLETE)
1. ✅ API client with rate limiting
2. ✅ Zod schemas  
3. ✅ Search API route
4. ✅ Import API route
5. ✅ Basic database import logic

### ✅ Phase 2: Basic MusicBrainz UI (COMPLETE)
1. ✅ Import page with search
2. ✅ Search results grid
3. ⚠️ **SIMPLIFIED** - Auto-imports first release
4. ✅ Success/error handling
5. ❌ **MISSING** - Quick access button on albums page

### 🚨 Phase 3: Production-Ready Import (CURRENT PRIORITY)
1. ❌ Release selection modal
2. ❌ Multi-artist database schema 
3. ❌ Track preview modal
4. ❌ Advanced search modes
5. ❌ Enhanced import flow

### Phase 4: Google Sheets Ratings Import (Future)
1. CSV upload component
2. Fuzzy album matching algorithm
3. Match preview with confidence scores  
4. Batch ratings import API
5. Conflict resolution UI (existing vs new ratings)
6. Unmatched entries report
7. (Optional) Google Sheets API integration with OAuth

---

## Open Questions Summary

### High Priority (Must Decide Before Starting)
1. **User-Agent:** App name and contact email for MusicBrainz
2. **Release Selection:** Auto-select first release or let user choose?
3. **Artist Matching:** Auto-create or require confirmation?
4. **Preview Modal:** Required or optional before import?

### Medium Priority (Can Decide During Implementation)
5. **Rate Limiting:** Simple delays or request queue?
6. **Validation Strictness:** Fail on missing data or allow nulls?
7. **Duplicate Check in Search:** Worth the performance cost?
8. **Classical Fields:** Map composer/work data during import?

### Low Priority (Future Enhancements)
9. **Album Art:** When to add Cover Art Archive integration?
10. **Google Sheets Scope:** Album ratings only, or also track ratings and modifiers?
11. **Edition Picker:** UI for selecting specific release edition?
12. **Fuzzy Matching:** Better artist deduplication algorithm?
13. **Rating Conflicts:** Overwrite, skip, or ask when album already has rating?

---

## 📋 COMPLETION CHECKLIST

### ✅ MusicBrainz Import (Current Status)
- ✅ Can search and find albums accurately
- ✅ Import completes in < 5 seconds per album  
- ✅ Duplicates are detected and prevented
- ✅ Track data is accurate (title, duration, order)
- ⚠️ **PARTIAL** - Artists are properly matched/created (single artist only)
- ✅ Error messages are clear and actionable

### 🚨 Critical Gaps (Must Fix)
- ❌ **No Release Selection** - Users can't choose CD vs Vinyl vs Digital
- ❌ **Single Artist Limitation** - Collaborations break or lose secondary artists  
- ❌ **No Track Preview** - Users don't see what they're importing
- ❌ **Auto-First Release** - May import wrong edition (e.g., remaster instead of original)

### 🎯 Success Criteria (Full Implementation)

#### MusicBrainz Import (Production Ready)
- ✅ Can search and find albums accurately
- ✅ Import completes in < 5 seconds per album
- ✅ Duplicates are detected and prevented  
- ✅ Track data is accurate (title, duration, order)
- ❌ **NEEDED** - Multi-artist albums properly handled
- ❌ **NEEDED** - Users can select specific release edition
- ❌ **NEEDED** - Track preview before import
- ✅ Error messages are clear and actionable

### Google Sheets Ratings Import
- ✅ Can import ratings for 50+ albums from CSV in < 30 seconds
- ✅ Fuzzy matching finds >90% of albums automatically
- ✅ Unmatched entries clearly shown with suggestions
- ✅ Existing ratings are preserved (or user chooses to overwrite)
- ✅ Match confidence scores help user make decisions
- ✅ Progress indicator shows import status
- ✅ Errors don't stop entire batch (skip and continue)

---

## Next Steps

1. **Decide on open questions** (especially high priority ones)
2. **Set up development environment** (MusicBrainz API access)
3. **Implement Phase 1** (API client + schemas + routes)
4. **Test with real data** (import a few albums manually)
5. **Implement Phase 2** (UI components)
6. **User testing** (gather feedback on UX flow)
7. **Plan Phase 3** (Google Sheets) based on actual usage patterns
