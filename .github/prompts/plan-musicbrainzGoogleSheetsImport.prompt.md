# MusicBrainz Import Implementation Plan

## Overview

This plan covers the **MusicBrainz Import** feature - Import albums (with tracks and artists) from MusicBrainz API ⚠️ **PARTIALLY COMPLETE**

*Note: Google Sheets import functionality has been moved to a separate plan document: `plan-googleSheetsImport.prompt.md`*

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

## MusicBrainz Import Implementation ✅ PARTIALLY COMPLETE

### Step 1: MusicBrainz API Client Setup ✅ COMPLETE

**File:** `src/lib/musicbrainz.ts` ✅ IMPLEMENTED

**API Documentation:** https://musicbrainz.org/doc/MusicBrainz_API

**Implementation:** Complete MusicBrainz API client with rate limiting (1 req/sec), error handling, and search functions. Includes `searchReleaseGroups()`, `searchArtists()`, and `getRelease()` methods with proper User-Agent headers and timeout handling.

**Missing:** `getReleaseGroupDetails()` function for fetching all releases of an album.

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

**Implementation:** Complete Zod validation schemas for all MusicBrainz API responses including search results, releases, tracks, and artist credits. Includes helper functions for artist credit formatting, year extraction, type mapping, and duration formatting. Uses lenient validation with `.passthrough()` for API flexibility.

**Open Issues:** Multi-artist album handling and null track duration workflow still need decision.

---

### Step 3: Import API Routes ✅ PARTIALLY COMPLETE

**Authentication:** All endpoints require authenticated session (NextAuth) ✅ IMPLEMENTED

#### Route 1: Search Release Groups ✅ COMPLETE
**File:** `src/app/(api)/api/musicbrainz/search/route.ts` ✅ IMPLEMENTED

**Implementation:** Search albums by artist/album name with duplicate detection. Returns formatted results with import status.

---

#### Route 1b: Search Artists ✅ COMPLETE  
**File:** `src/app/(api)/api/musicbrainz/search-artists/route.ts` ✅ IMPLEMENTED

**Implementation:** Search artists by name with disambiguation info. Used for artist-first search workflow.

---

#### Route 2: Get Available Releases (Editions) ⚠️ MODIFIED IMPLEMENTATION
**File:** `src/app/(api)/api/musicbrainz/releases/route.ts` ⚠️ IMPLEMENTED WITH DIFFERENT PARAMS

**Current Implementation:** `GET /api/musicbrainz/releases?releaseId=<RELEASE_MBID>` (single release details)
**Needed:** `GET /api/musicbrainz/release-groups?mbid=<RELEASE_GROUP_MBID>` (all editions for album selection)

**Gap:** Missing route to fetch all releases for a release group. Current route only gets single release details.

---

#### Route 3: Import Album ✅ COMPLETE  
**File:** `src/app/(api)/api/musicbrainz/import/route.ts` ✅ IMPLEMENTED

**Implementation:** Complete import route with duplicate checking, MusicBrainz data fetching, database import, and proper error handling. Returns success/error responses with warnings for tracks missing duration data.

**Decisions Made:**
- ✅ Duplicate checking in search results
- ✅ Separate endpoints for search/releases/import
- ✅ Warnings included for null duration tracks
- ✅ Authentication required on all endpoints
- ✅ Standardized error format across routes

---

### Step 4: Database Import Logic ⚠️ SIMPLIFIED IMPLEMENTATION

**File:** `src/lib/import/musicbrainz.ts` ❌ NOT CREATED - Logic embedded in route

**Current Implementation:** Import logic is directly in `src/app/(api)/api/musicbrainz/import/route.ts`

**Current Schema Status:** ⚠️ SINGLE ARTIST ONLY - Multi-artist albums not supported yet

**Required Schema Changes:** Need `ReleaseGroupArtist` junction table and `Artist.musicbrainzId` field for proper multi-artist support.

---

**Current Import Logic:** Embedded in import route, handles single artists only. Creates albums, artists, tracks, and external references with transaction safety. Includes null duration tracking and duplicate prevention.

**Decisions Made:**

1. ✅ **Multi-Artist Albums:** Flat structure (no primary artist) ✅ **IMPLEMENTED**
   - `ReleaseGroupArtist` junction table with all artists
   - `Artist.musicbrainzId` field for matching
   - **NO** primary artist field - all artists equal
   - All artists stored in `ReleaseGroupArtist` with position/joinPhrase
   - Formatted credit stored in `ReleaseGroup.artistCredit`
   - Artist pages group albums by primaryType (Album/Single/EP/etc)
   - Album cards show all artists with individual links

2. ✅ **Artist Matching:** Three-tier matching strategy ✅ **IMPLEMENTED**
   - **First**: Match by MusicBrainz ID (most accurate)
   - **Second**: Fallback to case-insensitive name matching
   - **Third**: Create new artist if not found
   - **Update**: Backfill MBID on existing artists when found
   - Prevents duplicate artists while maintaining data accuracy

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

7. ⚠️ **Re-import/Refresh:** NOT YET IMPLEMENTED
   - **Current**: Duplicate check blocks re-import (409 error)
   - **Needed**: Add `?refresh=true` parameter to update existing albums
   - **Needed**: Delete old junction records and recreate relationships
   - **Use Case**: MusicBrainz corrects artist credits or album metadata

8. ⚠️ **Artist Data Sync:** PARTIAL IMPLEMENTATION
   - **Current**: Only MBID is updated on existing artists
   - **Missing**: Name and sortName sync from MusicBrainz
   - **Needed**: Update artist names when MusicBrainz data changes
   - **Use Case**: Artist renames (e.g., "Prince" → "The Artist Formerly Known As Prince")

9. ⚠️ **artistCredit Staleness:** KNOWN LIMITATION
   - **Current**: Set once at import time, never updated
   - **Issue**: Manual artist name changes don't update artistCredit field
   - **Options**:
     - **Option A**: Compute dynamically (slower queries, always accurate)
     - **Option B**: Periodic background sync job
     - **Option C**: Trigger rebuild on artist name update (best)
   - **Recommendation**: Implement Option C with background job fallback

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

**Implementation:** Basic import page layout with title and search component integration.

---

#### Component 2: Import Search (Main Client Component) ⚠️ SIMPLIFIED
**File:** `src/components/import/ImportSearch.tsx` ⚠️ BASIC IMPLEMENTATION

**Current Implementation:** Simple search form with Artist/Album/Barcode modes
**Missing Features:**
- Combined "Artist - Album" parsing 
- Artist-first search mode with artist selector
- Advanced search query building
- Debounced search
- **Primary Type Filter** - When searching by artist, add dropdown to filter by Album/Single/EP/etc

**Current Implementation:** Simple 3-mode search (Artist/Album/Barcode) with basic results display. Auto-imports first release without user selection.

**Missing Critical Features:**
- Release selection modal integration
- Track preview modal integration  
- Artist-first search mode with disambiguation
- Combined "Artist - Album" parsing
- Debounced search with proper loading states
- **Primary Type Filter** - Filter search results by album type (Albums only, Singles only, etc.)

---

#### Component 2b: Artist Selector ❌ NOT IMPLEMENTED
**File:** `src/components/import/ArtistSelector.tsx` ❌ MISSING

**Needed:** Component to display artist search results with disambiguation info for artist-first search mode.

---

#### Component 3: Search Form ✅ INTEGRATED
**File:** `src/components/import/SearchForm.tsx` ❌ NOT SEPARATE - Integrated into ImportSearch.tsx

**Status:** Basic form implemented within main search component.

---

#### Component 4: Search Results Grid ✅ COMPLETE  
**File:** `src/components/import/SearchResults.tsx` ✅ IMPLEMENTED

**Implementation:** Complete grid layout with loading states, error handling, and album cards with import status badges.

---

#### Component 5: Search Result Card ✅ INTEGRATED
**File:** `src/components/import/SearchResultCard.tsx` ❌ NOT SEPARATE - Integrated into SearchResults.tsx

**Status:** Album cards implemented within results component.

---

#### Component 6: Search Result Skeleton ❌ NOT IMPLEMENTED
**File:** `src/components/import/SearchResultSkeleton.tsx` ❌ MISSING

**Needed:** Loading skeleton for search results grid.

---

#### Component 7: Release Selection Modal ❌ NOT IMPLEMENTED
**File:** `src/components/import/ReleaseSelectionModal.tsx` ❌ MISSING - **HIGH PRIORITY**

**Needed:** Critical modal to let users choose between CD/Vinyl/Digital editions before import. Currently auto-selects first release.

---

#### Component 8: Import Preview Modal ❌ NOT IMPLEMENTED
**File:** `src/components/import/ImportPreviewModal.tsx` ❌ MISSING

**Needed:** Optional modal to preview track list and warn about null durations before confirming import.

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
**Status:** ✅ COMPLETE - **IMPLEMENTED & TESTED**
- ✅ Added `ReleaseGroupArtist` junction table with position and joinPhrase
- ✅ Added `Artist.musicbrainzId` and `Artist.country` fields
- ✅ Added `ReleaseGroup.artistCredit` for formatted display string
- ✅ Updated import logic with three-tier artist matching
- ✅ Added `Artist.notes` and `Artist.imageUrl` fields for future enhancements
- ✅ All 323 tests passing with 96.47% coverage (improved from 309 tests)
- ✅ Test coverage: 96.47% statements, 86.5% branch coverage
- ✅ Tested with multi-artist albums (David Bowie & Queen, etc.)
- ✅ Artist country feature fully integrated with getArtist() API calls

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
- **Primary Type Filter** - Dropdown to filter by Album/Single/EP when searching by artist

#### B2. Better Import Flow (4 hours) 
- Progress indicators during import
- Better success/error messages
- Toast notifications with "View Album" action
- Import history/recent imports

### Phase C: Data Refresh & Sync Features 🟡 MEDIUM PRIORITY

#### C1. Re-import/Refresh Mechanism (4 hours)
**Status:** ❌ NOT IMPLEMENTED
- Add `?refresh=true` query parameter to import endpoint
- Delete existing junction records before re-creating
- Update album metadata from MusicBrainz
- **Use Case**: MusicBrainz corrects artist credits after initial import

#### C2. Artist Data Synchronization (4 hours)
**Status:** ⚠️ PARTIAL - Only MBID updates
- Sync artist name and sortName on every import
- Detect changes in MusicBrainz artist data
- Update local artist records to match MusicBrainz
- **Use Case**: Artist name changes (Prince, TAFKAP, etc.)

#### C3. artistCredit Rebuild System (6 hours)
**Status:** ❌ NOT IMPLEMENTED
- Implement trigger to rebuild artistCredit on artist name changes
- Add background job for periodic sync validation
- Ensure artistCredit stays in sync with artist names
- **Prevents**: Stale display strings after manual artist edits

### Phase D: Future Enhancements 🟢 LOW PRIORITY

#### D1. Album Art Integration (4 hours)
- Cover Art Archive integration
- Automatic album art fetching during import
- Fallback image handling

#### D2. Enhanced Search Features (6 hours)
- Barcode scanning support
- Advanced filtering options
- Search history and favorites

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

### Phase 4: Advanced Features (Future)
1. Album art and metadata enhancement
2. Advanced search and filtering
3. Bulk operations and management tools
4. Integration with other music services
5. Performance optimizations
6. Mobile-responsive improvements

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
10. **Edition Picker:** UI for selecting specific release edition?
11. **Fuzzy Matching:** Better artist deduplication algorithm?
12. **Mobile Experience:** Touch-optimized import workflow?
13. **Performance:** Caching strategies for search results?

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
- ✅ **Multi-Artist Support** - ~~Single artist limitation~~ **FIXED - Full multi-artist implementation complete**
- ❌ **No Track Preview** - Users don't see what they're importing
- ❌ **Auto-First Release** - May import wrong edition (e.g., remaster instead of original)

### ⚠️ Data Sync Limitations (Should Fix)
- ⚠️ **No Re-import** - Can't update albums after MusicBrainz corrections
- ⚠️ **Partial Artist Sync** - Only MBID updates, not name/sortName changes
- ⚠️ **Stale artistCredit** - Manual artist edits don't update display strings

### 🎯 Success Criteria (Full Implementation)

#### MusicBrainz Import (Production Ready)
- ✅ Can search and find albums accurately
- ✅ Import completes in < 5 seconds per album
- ✅ Duplicates are detected and prevented  
- ✅ Track data is accurate (title, duration, order)
- ✅ **IMPLEMENTED** - Multi-artist albums properly handled with junction table
- ✅ **IMPLEMENTED** - Artist matching by MusicBrainz ID with fallback
- ✅ **IMPLEMENTED** - Artist credit formatting ("David Bowie & Queen")
- ❌ **NEEDED** - Users can select specific release edition
- ❌ **NEEDED** - Track preview before import
- ⚠️ **PARTIAL** - Re-import/refresh functionality for data updates
- ⚠️ **PARTIAL** - Full artist data sync (name, sortName)
- ✅ Error messages are clear and actionable



---

## Next Steps

1. **Implement Phase A** (Critical Production Features)
   - Release Selection Modal
   - Multi-Artist Database Schema
   - Track Preview Modal

2. **Test with real data** (import various album types)
3. **User testing** (gather feedback on UX flow)
4. **Implement Phase B** (Enhanced UX Features)
5. **Performance optimization** (search speed, import efficiency)
6. **Plan integrations** (album art, other music services)
