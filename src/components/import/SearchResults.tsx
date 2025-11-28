'use client'

import { useState } from 'react'
import { Calendar, User, Music, CheckCircle, Download } from 'lucide-react'

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
  onImport: (mbid: string, title: string) => void
  onViewExisting: (albumId: string) => void
  isImporting?: boolean
  importingId?: string
}

export default function SearchResults({ 
  results, 
  onImport, 
  onViewExisting, 
  isImporting = false, 
  importingId 
}: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">No results found</p>
        <p className="text-gray-600">Try adjusting your search terms or using a different search mode</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Search Results ({results.length})
        </h3>
      </div>

      <div className="grid gap-4">
        {results.map((result) => (
          <div
            key={result.mbid}
            className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-lg font-medium text-gray-900 truncate">
                    {result.title}
                  </h4>
                  {result.alreadyImported && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      Imported
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{result.artist}</span>
                  </div>
                  {result.year && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{result.year}</span>
                    </div>
                  )}
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    {result.type}
                  </span>
                </div>

                <div className="text-xs text-gray-500">
                  {result.releaseCount} release{result.releaseCount !== 1 ? 's' : ''} available
                </div>
              </div>

              <div className="ml-4 flex items-center gap-2">
                {result.alreadyImported ? (
                  <button
                    onClick={() => onViewExisting(result.existingAlbumId!)}
                    className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    View Album
                  </button>
                ) : (
                  <button
                    onClick={() => onImport(result.mbid, result.title)}
                    disabled={isImporting}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isImporting && importingId === result.mbid ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Import
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}