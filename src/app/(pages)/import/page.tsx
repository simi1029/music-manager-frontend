'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ImportSearch from '@/components/import/ImportSearch'
import SearchResults from '@/components/import/SearchResults'
import { createComponentLogger } from '@/lib/logger'

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

const logger = createComponentLogger('import-page')

export default function ImportPage() {
  const router = useRouter()
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importingId, setImportingId] = useState<string>()
  const [error, setError] = useState<string>()
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (searchData: {
    mode: 'artist' | 'album' | 'barcode'
    query: string
    artist?: string
    album?: string
    barcode?: string
  }) => {
    setIsLoading(true)
    setError(undefined)
    setHasSearched(true)

    try {
      let searchParams = new URLSearchParams()
      
      if (searchData.mode === 'artist') {
        searchParams.set('artist', searchData.query)
      } else if (searchData.mode === 'album') {
        searchParams.set('album', searchData.query)
      } else if (searchData.mode === 'barcode') {
        // For barcode search, we'll search by album title for now
        // In the future, you might want to add barcode-specific search
        searchParams.set('album', searchData.query)
      }

      const response = await fetch(`/api/musicbrainz/search?${searchParams}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Search failed')
      }

      setSearchResults(data.results || [])
    } catch (err) {
      logger.error({ err, searchData }, 'Search failed')
      setError(err instanceof Error ? err.message : 'Search failed')
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async (releaseGroupId: string, title: string) => {
    setIsImporting(true)
    setImportingId(releaseGroupId)
    setError(undefined)

    try {
      // First, get the releases for this release group
      const releaseGroupResponse = await fetch(`/api/musicbrainz/release-groups?releaseGroupId=${releaseGroupId}`)
      if (!releaseGroupResponse.ok) {
        throw new Error('Failed to get release group details')
      }

      const releaseGroupData = await releaseGroupResponse.json()
      
      if (!releaseGroupData.releases || releaseGroupData.releases.length === 0) {
        throw new Error('No releases found for this album')
      }

      // For now, pick the first release (in a full implementation, show a modal to let user choose)
      const firstRelease = releaseGroupData.releases[0]

      const importResponse = await fetch('/api/musicbrainz/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          releaseId: firstRelease.id,
          releaseGroupId: releaseGroupId
        })
      })

      const importData = await importResponse.json()

      if (!importResponse.ok) {
        if (importData.error === 'DUPLICATE') {
          // Update the search results to mark as imported
        setSearchResults(prev => 
          prev.map(result => 
            result.mbid === releaseGroupId 
              ? { ...result, alreadyImported: true, existingAlbumId: importData.existingAlbumId }
              : result
          )
        )
        return
      }
      throw new Error(importData.message || 'Import failed')
    }

    // Success - update the search results and optionally redirect
    setSearchResults(prev => 
      prev.map(result => 
        result.mbid === releaseGroupId 
          ? { ...result, alreadyImported: true, existingAlbumId: importData.albumId }
          : result
      )
    )      // Show success message or redirect to album
      // For now, we'll just update the UI
      
    } catch (err) {
      logger.error({ err, releaseGroupId, albumTitle: title }, 'Import failed')
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setIsImporting(false)
      setImportingId(undefined)
    }
  }

  const handleViewExisting = (albumId: string) => {
    router.push(`/album/${albumId}`)
  }

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Albums</h1>
        <p className="text-lg text-gray-600">
          Search and import albums from MusicBrainz database
        </p>
      </div>

      <ImportSearch onSearch={handleSearch} isLoading={isLoading} />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {hasSearched && (
        <SearchResults
          results={searchResults}
          onImport={handleImport}
          onViewExisting={handleViewExisting}
          isImporting={isImporting}
          importingId={importingId}
        />
      )}
    </main>
  )
}
