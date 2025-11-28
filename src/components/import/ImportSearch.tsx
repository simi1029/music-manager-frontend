'use client'

import { useState } from 'react'
import { Search, Music, User, Hash } from 'lucide-react'

type SearchMode = 'artist' | 'album' | 'barcode'

interface ImportSearchProps {
  onSearch: (searchData: {
    mode: SearchMode
    query: string
    artist?: string
    album?: string
    barcode?: string
  }) => void
  isLoading?: boolean
}

export default function ImportSearch({ onSearch, isLoading = false }: ImportSearchProps) {
  const [searchMode, setSearchMode] = useState<SearchMode>('artist')
  const [artistQuery, setArtistQuery] = useState('')
  const [albumQuery, setAlbumQuery] = useState('')
  const [barcodeQuery, setBarcodeQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (searchMode === 'artist' && !artistQuery.trim()) return
    if (searchMode === 'album' && !albumQuery.trim()) return
    if (searchMode === 'barcode' && !barcodeQuery.trim()) return

    onSearch({
      mode: searchMode,
      query: searchMode === 'artist' ? artistQuery : searchMode === 'album' ? albumQuery : barcodeQuery,
      artist: searchMode === 'artist' ? artistQuery : undefined,
      album: searchMode === 'album' ? albumQuery : undefined,
      barcode: searchMode === 'barcode' ? barcodeQuery : undefined
    })
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Search MusicBrainz</h2>
        <p className="text-sm text-gray-600">
          Find and import albums from the MusicBrainz database
        </p>
      </div>

      {/* Search Mode Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          type="button"
          onClick={() => setSearchMode('artist')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            searchMode === 'artist'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <User className="w-4 h-4" />
          Artist
        </button>
        <button
          type="button"
          onClick={() => setSearchMode('album')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            searchMode === 'album'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Music className="w-4 h-4" />
          Album
        </button>
        <button
          type="button"
          onClick={() => setSearchMode('barcode')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            searchMode === 'barcode'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Hash className="w-4 h-4" />
          Barcode
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {searchMode === 'artist' && (
          <div>
            <label htmlFor="artist" className="block text-sm font-medium text-gray-700 mb-1">
              Artist Name
            </label>
            <input
              type="text"
              id="artist"
              value={artistQuery}
              onChange={(e) => setArtistQuery(e.target.value)}
              placeholder="e.g., David Bowie, The Beatles"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>
        )}

        {searchMode === 'album' && (
          <div>
            <label htmlFor="album" className="block text-sm font-medium text-gray-700 mb-1">
              Album Title
            </label>
            <input
              type="text"
              id="album"
              value={albumQuery}
              onChange={(e) => setAlbumQuery(e.target.value)}
              placeholder="e.g., Dark Side of the Moon"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>
        )}

        {searchMode === 'barcode' && (
          <div>
            <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-1">
              Barcode / Catalog Number
            </label>
            <input
              type="text"
              id="barcode"
              value={barcodeQuery}
              onChange={(e) => setBarcodeQuery(e.target.value)}
              placeholder="e.g., 094639279821"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>
    </div>
  )
}