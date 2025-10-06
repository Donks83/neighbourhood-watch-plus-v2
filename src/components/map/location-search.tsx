'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Search, MapPin, Navigation, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { geocodeAddress } from '@/lib/geocoding'
import { cn } from '@/lib/utils'
import type { Location } from '@/types'

interface SearchResult {
  id: string
  address: string
  location: Location
  type: 'geocoded' | 'history' | 'favorite'
}

interface LocationSearchProps {
  onLocationSelect: (location: Location, address: string) => void
  placeholder?: string
  className?: string
  showHistory?: boolean
  maxResults?: number
  searchOnEnter?: boolean // If true, only search when Enter is pressed
  debounceMs?: number // Custom debounce delay (default 750ms)
}

export default function LocationSearch({
  onLocationSelect,
  placeholder = "Search for a location...",
  className = "",
  showHistory = true,
  maxResults = 5,
  searchOnEnter = false, // Default to auto-search
  debounceMs = 750 // Default 0.75 second delay (750ms)
}: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [error, setError] = useState<string | null>(null)
  const [pendingSearch, setPendingSearch] = useState(false) // Show when search is pending
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // Load search history from localStorage
  const getSearchHistory = useCallback((): SearchResult[] => {
    if (typeof window === 'undefined') return []
    
    try {
      const history = localStorage.getItem('nw-location-search-history')
      return history ? JSON.parse(history) : []
    } catch {
      return []
    }
  }, [])

  // Save to search history
  const saveToHistory = useCallback((result: SearchResult) => {
    if (typeof window === 'undefined') return
    
    try {
      const history = getSearchHistory()
      const newHistory = [
        { ...result, type: 'history' as const },
        ...history.filter(item => item.address !== result.address)
      ].slice(0, maxResults)
      
      localStorage.setItem('nw-location-search-history', JSON.stringify(newHistory))
    } catch (error) {
      console.warn('Could not save search history:', error)
    }
  }, [getSearchHistory, maxResults])

  // Perform geocoding search with multiple results
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults(showHistory ? getSearchHistory() : [])
      return
    }

    // Keep focus on the input during search
    const shouldRefocus = document.activeElement === searchInputRef.current
    
    setIsSearching(true)
    setError(null)
    
    try {
      // Import the enhanced geocoding function
      const { searchLocations } = await import('@/lib/geocoding')
      
      // Search for multiple results
      const results = await searchLocations(query.trim(), maxResults)
      
      if (results && results.length > 0) {
        const searchResults: SearchResult[] = results.map((result, index) => ({
          id: `geocoded-${Date.now()}-${index}`,
          address: result.address,
          location: result.location,
          type: 'geocoded' as const
        }))
        
        setSearchResults(searchResults)
      } else {
        setError('No results found for this location')
        setSearchResults(showHistory ? getSearchHistory() : [])
      }
    } catch (error: any) {
      console.error('Geocoding error:', error)
      setError('Search failed. Please try again.')
      setSearchResults(showHistory ? getSearchHistory() : [])
    } finally {
      setIsSearching(false)
      
      // Restore focus if it was on the input before search
      if (shouldRefocus && searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }
  }, [getSearchHistory, showHistory, maxResults])

  // Debounced search
  const handleSearchInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    setSelectedIndex(-1)
    setIsOpen(true) // Keep dropdown open when typing
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
      setPendingSearch(false)
    }
    
    // Only set up auto-search if there's actual content
    if (query.trim()) {
      setPendingSearch(true) // Show pending indicator
      
      // Set new timeout for debounced search with configurable delay
      searchTimeoutRef.current = setTimeout(() => {
        setPendingSearch(false)
        performSearch(query)
      }, debounceMs)
    } else {
      setPendingSearch(false)
      // Clear results immediately when input is empty
      setSearchResults(showHistory ? getSearchHistory() : [])
    }
  }, [performSearch, debounceMs, showHistory, getSearchHistory])

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    setIsOpen(true)
    // Only show history if we don't already have search results
    if (!searchQuery.trim() && showHistory && searchResults.length === 0) {
      setSearchResults(getSearchHistory())
    }
  }, [searchQuery, showHistory, getSearchHistory, searchResults.length])

  // Handle input blur (with delay to allow for clicks)
  const handleInputBlur = useCallback(() => {
    // Use a longer delay to prevent premature closing
    setTimeout(() => {
      // Only close if the search input is not focused
      if (document.activeElement !== searchInputRef.current) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }, 300)
  }, [])

  // Handle result selection
  const handleResultSelect = useCallback((result: SearchResult) => {
    setSearchQuery(result.address)
    setIsOpen(false)
    setSelectedIndex(-1)
    saveToHistory(result)
    onLocationSelect(result.location, result.address)
  }, [onLocationSelect, saveToHistory])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || searchResults.length === 0) return
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        )
        break
      
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      
      case 'Enter':
        e.preventDefault()
        
        // If we have a query but no results yet, perform immediate search
        if (searchQuery.trim() && (searchResults.length === 0 || pendingSearch)) {
          // Cancel any pending search
          if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
            setPendingSearch(false)
          }
          // Perform immediate search
          if (!isSearching) {
            performSearch(searchQuery.trim())
          }
        } else if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          // Select from existing results
          handleResultSelect(searchResults[selectedIndex])
        } else if (searchResults.length > 0) {
          // Select first result if available
          handleResultSelect(searchResults[0])
        }
        break
      
      case 'Escape':
        // Cancel pending search
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current)
          setPendingSearch(false)
        }
        setIsOpen(false)
        setSelectedIndex(-1)
        searchInputRef.current?.blur()
        break
    }
  }, [isOpen, searchResults, selectedIndex, handleResultSelect, searchQuery, isSearching, performSearch, pendingSearch])

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchResults(showHistory ? getSearchHistory() : [])
    setSelectedIndex(-1)
    setError(null)
    searchInputRef.current?.focus()
  }, [showHistory, getSearchHistory])

  // Get current location
  const handleCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      return
    }

    setIsSearching(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        
        try {
          // Reverse geocode to get address
          const { reverseGeocode } = await import('@/lib/geocoding')
          const address = await reverseGeocode(location)
          
          const displayAddress = address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
          setSearchQuery(displayAddress)
          onLocationSelect(location, displayAddress)
          
          // Save to history
          saveToHistory({
            id: `current-${Date.now()}`,
            address: displayAddress,
            location,
            type: 'geocoded'
          })
        } catch (error) {
          console.warn('Could not reverse geocode current location:', error)
          const displayAddress = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
          setSearchQuery(displayAddress)
          onLocationSelect(location, displayAddress)
        } finally {
          setIsSearching(false)
        }
      },
      (error) => {
        console.error('Geolocation error:', error)
        setError('Could not get your current location')
        setIsSearching(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }, [onLocationSelect, saveToHistory])

  // Initialize with search history
  useEffect(() => {
    if (showHistory && !searchQuery.trim()) {
      setSearchResults(getSearchHistory())
    }
  }, [showHistory, searchQuery, getSearchHistory])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
        setPendingSearch(false)
      }
    }
  }, [])

  return (
    <div className={cn("relative w-full max-w-md", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className={cn(
          "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4",
          pendingSearch ? "text-blue-500 animate-pulse" : "text-gray-400"
        )} 
          title={pendingSearch ? "Searching soon..." : "Search for locations"}
        />
        <Input
          ref={searchInputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleSearchInput}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-20"
          disabled={false} // Never disable the input to maintain focus
          title="Press Enter to search immediately or wait for auto-search"
        />
        
        {/* Action Buttons */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="w-6 h-6"
              onClick={handleClearSearch}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="w-6 h-6"
            onClick={handleCurrentLocation}
            disabled={isSearching}
            title="Use current location"
          >
            {isSearching ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Navigation className="w-3 h-3" />
            )}
          </Button>
        </div>
      
      {/* Search hint for new users */}
      {searchQuery && !isSearching && searchResults.length === 0 && !pendingSearch && !error && (
        <div className="absolute top-full left-0 mt-1 text-xs text-gray-500 dark:text-gray-400">
          Press Enter to search now or wait for auto-search
        </div>
      )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (searchResults.length > 0 || error || isSearching) && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto"
          onMouseDown={(e) => e.preventDefault()} // Prevent blur when clicking in dropdown
        >
          {/* Loading State */}
          {isSearching && (
            <div className="p-3 text-center text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
              Searching for location...
            </div>
          )}

          {/* Error State */}
          {error && !isSearching && (
            <div className="p-3 text-center text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Search Results */}
          {!isSearching && !error && searchResults.length > 0 && (
            <>
              {searchResults.some(r => r.type === 'history') && (
                <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                  Recent Searches
                </div>
              )}
              
              {searchResults.map((result, index) => (
                <button
                  key={result.id}
                  type="button"
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors",
                    index === selectedIndex && "bg-blue-50 dark:bg-blue-900/20"
                  )}
                  onClick={() => handleResultSelect(result)}
                >
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="flex-1 truncate">{result.address}</span>
                  {result.type === 'history' && (
                    <span className="text-xs text-gray-400">Recent</span>
                  )}
                </button>
              ))}
            </>
          )}

          {/* No Results */}
          {!isSearching && !error && searchResults.length === 0 && searchQuery.trim() && (
            <div className="p-3 text-center text-sm text-gray-500">
              No locations found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
