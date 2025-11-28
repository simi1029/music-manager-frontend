# Google Sheets Import Implementation Plan

## Overview

Allow users to batch import their ratings for existing albums from a Google Sheet or CSV file.

**Important:** This feature assumes albums already exist in the database. It only imports user ratings (album ratings, track ratings, quality modifiers, etc.). Users must first import albums via MusicBrainz or other means.

**Status:** ❌ **NOT STARTED**

---

## Expected Sheet Format

| Artist | Album | Album Rating | Track 1 | Track 2 | Track 3 | ... |
|--------|-------|--------------|---------|---------|---------|-----|
| The Beatles | Abbey Road | 5 | 5 | 4 | 5 | ... |
| Pink Floyd | Dark Side | 4.5 | 5 | 5 | 4 | ... |

Or simplified:

| Artist | Album | Rating |
|--------|-------|--------|
| The Beatles | Abbey Road | 5 |
| Pink Floyd | Dark Side | 4.5 |

---

## Approach Options

### Option A: CSV Upload (Simpler)
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

### Option B: Google Sheets API (More Features)
1. User authenticates with Google OAuth
2. User selects their ratings spreadsheet
3. Read Sheet data via API
4. Auto-match artist/album to database
5. Show unmatched entries for review
6. Import ratings for matched albums

**Pros:**
- Real-time Sheet access
- No manual file export
- Better UX for regular use

**Cons:**
- OAuth setup required
- API quotas and rate limits
- More complex implementation

---

## Matching Logic

### Algorithm:
1. Extract artist name + album name from Sheet row
2. Fuzzy match against existing database albums
   - Normalize text: lowercase, remove "The", trim whitespace
   - Match on artist name variations
   - Match on album title
3. Show confidence score for each match
4. Allow user to confirm/reject matches
5. Import ratings only for confirmed matches

### Unmatched Entries:
- Show list of rows that couldn't be matched
- Allow manual album selection
- Suggest importing album via MusicBrainz first

---

## Design Decisions

### 1. Import Scope:
   - Album ratings only, or also track ratings?
   - Quality modifiers (live, remaster, compilation flags)?
   - **Recommendation:** Start with album ratings, add track ratings later

### 2. Matching Confidence:
   - Auto-import high confidence (>90%) matches?
   - Or always require user confirmation?
   - **Recommendation:** Always show preview, require confirmation

### 3. Priority:
   - Before or after MusicBrainz import?
   - **Recommendation:** After MusicBrainz (need albums in DB first)

### 4. Authentication:
   - CSV upload (no auth) or Google Sheets API (OAuth)?
   - **Recommendation:** Start with CSV, add Sheets if users request it

### 5. Conflict Resolution:
   - What if album already has rating?
   - Overwrite, skip, or ask user?
   - **Recommendation:** Ask user (show existing vs new rating)

### 6. Template:
   - Provide downloadable CSV template?
   - **Recommendation:** Yes, with example data and field descriptions

### 7. Validation:
   - Client-side preview with error highlighting?
   - **Recommendation:** Yes, show errors before import attempt

### 8. Duplicate Handling:
   - Skip duplicates or ask user?
   - **Recommendation:** Show preview with duplicate warnings, let user decide

---

## Implementation Plan (CSV Version)

### Phase 1: CSV Upload & Preview (8 hours)
- File upload component with drag & drop
- CSV parsing and validation
- Preview table with error highlighting
- Album matching algorithm

### Phase 2: Batch Import Processing (8 hours)
- Progress tracking for large imports
- Skip/retry failed items
- Conflict resolution (existing vs new ratings)
- Import summary report

### Phase 3: Enhanced Features (Optional)
- Google Sheets API integration with OAuth
- Real-time sync capability
- Advanced matching algorithms
- Import history tracking

---

## Implementation Steps

### Step 1: File Upload Component
- Drag & drop CSV upload interface
- File validation (size, format)
- Error handling for invalid files

### Step 2: CSV Parsing (use `papaparse` library)
- Parse CSV client-side
- Validate data structure
- Handle different column formats

### Step 3: Data Validation and Preview Table
- Show parsed data in table format
- Highlight validation errors
- Match preview with confidence scores

### Step 4: Bulk Import API Endpoint
- Create `/api/ratings/bulk-import` endpoint
- Transaction safety for batch operations
- Progress tracking and error handling

### Step 5: Progress Tracking and Error Reporting
- Real-time import progress
- Error details for failed items
- Import summary with statistics

**Estimated Total Effort:** 2-3 days

---

## Success Criteria

### Google Sheets Ratings Import
- ✅ Can import ratings for 50+ albums from CSV in < 30 seconds
- ✅ Fuzzy matching finds >90% of albums automatically
- ✅ Unmatched entries clearly shown with suggestions
- ✅ Existing ratings are preserved (or user chooses to overwrite)
- ✅ Match confidence scores help user make decisions
- ✅ Progress indicator shows import status
- ✅ Errors don't stop entire batch (skip and continue)

---

## Technical Architecture

### Frontend Components
- `CSVUpload` - File upload with drag & drop
- `ImportPreview` - Data preview table with validation
- `MatchingReview` - Manual matching interface
- `ImportProgress` - Real-time progress tracking
- `ImportSummary` - Results and error reporting

### Backend API
- `POST /api/ratings/bulk-import` - Main import endpoint
- Album matching service with fuzzy logic
- Batch processing with transaction safety
- Progress tracking via WebSocket or polling

### Database Considerations
- Efficient bulk insert operations
- Conflict resolution strategies
- Import audit trail
- Performance optimization for large datasets

---

## Future Enhancements

### Google Sheets Integration
- OAuth2 authentication with Google
- Direct Sheet reading via Google Sheets API
- Real-time sync capabilities
- Collaborative editing support

### Advanced Matching
- Machine learning-based album matching
- User feedback to improve matching accuracy
- Custom matching rules configuration
- Integration with external music databases

### Import History
- Track all import operations
- Rollback capabilities
- Import comparison and merging
- Scheduled imports for regular updates