import { useEffect, useState } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from 'react-simple-maps'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface VisitorLocation {
  ip: string
  city: string
  region: string
  country: string
  countryCode: string
  lat: number
  lon: number
  timestamp: number
}

interface VisitorStats {
  total: number
  unique: number
  locations: VisitorLocation[]
  byCountry: Record<string, number>
}

// Local storage key for visitor data
const VISITOR_STORAGE_KEY = 'github_yearbook_visitors'

// Get visitor's location using free IP API
async function getVisitorLocation(): Promise<VisitorLocation | null> {
  try {
    const response = await fetch('https://ipapi.co/json/')
    if (!response.ok) return null

    const data = await response.json()
    return {
      ip: data.ip,
      city: data.city || 'Unknown',
      region: data.region || '',
      country: data.country_name || 'Unknown',
      countryCode: data.country_code || '',
      lat: data.latitude || 0,
      lon: data.longitude || 0,
      timestamp: Date.now(),
    }
  } catch (e) {
    console.error('Failed to get visitor location:', e)
    return null
  }
}

// Load visitor stats from localStorage
function loadVisitorStats(): VisitorStats {
  try {
    const stored = localStorage.getItem(VISITOR_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load visitor stats:', e)
  }
  return { total: 0, unique: 0, locations: [], byCountry: {} }
}

// Save visitor stats to localStorage
function saveVisitorStats(stats: VisitorStats) {
  try {
    localStorage.setItem(VISITOR_STORAGE_KEY, JSON.stringify(stats))
  } catch (e) {
    console.error('Failed to save visitor stats:', e)
  }
}

// Record a new visitor
async function recordVisitor(): Promise<VisitorStats> {
  const stats = loadVisitorStats()
  const location = await getVisitorLocation()

  if (location) {
    stats.total++

    // Check if this IP is already recorded
    const existingIndex = stats.locations.findIndex(l => l.ip === location.ip)
    if (existingIndex === -1) {
      stats.unique++
      stats.locations.push(location)
      stats.byCountry[location.country] = (stats.byCountry[location.country] || 0) + 1
    } else {
      // Update timestamp for existing visitor
      stats.locations[existingIndex].timestamp = Date.now()
    }

    // Keep only last 100 unique visitors for performance
    if (stats.locations.length > 100) {
      stats.locations = stats.locations.slice(-100)
    }

    saveVisitorStats(stats)
  }

  return stats
}

export default function VisitorMap() {
  const [stats, setStats] = useState<VisitorStats | null>(null)
  const [currentLocation, setCurrentLocation] = useState<VisitorLocation | null>(null)

  useEffect(() => {
    // Record visitor and get stats
    recordVisitor().then(s => {
      setStats(s)
      // Find current visitor's location
      getVisitorLocation().then(loc => setCurrentLocation(loc))
    })
  }, [])

  if (!stats) {
    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 text-center text-[#8b949e]">
        Loading visitor map...
      </div>
    )
  }

  // Get top countries
  const topCountries = Object.entries(stats.byCountry)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className="bg-[#0d1117] border border-[#30363d] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#21262d] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#8b949e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-[#c9d1d9] font-medium">Visitor Map</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-[#8b949e]">
            <span className="text-[#3fb950] font-medium">{stats.total}</span> visits
          </span>
          <span className="text-[#8b949e]">
            <span className="text-[#58a6ff] font-medium">{stats.unique}</span> unique
          </span>
        </div>
      </div>

      {/* Map */}
      <div className="relative">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 120,
            center: [0, 30],
          }}
          style={{
            width: '100%',
            height: 'auto',
          }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#21262d"
                  stroke="#30363d"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { fill: '#30363d', outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Visitor markers */}
          {stats.locations.map((loc, idx) => (
            <Marker key={`${loc.ip}-${idx}`} coordinates={[loc.lon, loc.lat]}>
              <circle
                r={4}
                fill={loc.ip === currentLocation?.ip ? '#f97316' : '#3fb950'}
                fillOpacity={0.8}
                stroke="#fff"
                strokeWidth={1}
              />
            </Marker>
          ))}

          {/* Current visitor marker (highlighted) */}
          {currentLocation && (
            <Marker coordinates={[currentLocation.lon, currentLocation.lat]}>
              <circle
                r={6}
                fill="#f97316"
                fillOpacity={0.9}
                stroke="#fff"
                strokeWidth={2}
              >
                <animate
                  attributeName="r"
                  from="6"
                  to="10"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="fill-opacity"
                  from="0.9"
                  to="0.3"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </circle>
            </Marker>
          )}
        </ComposableMap>
      </div>

      {/* Footer with stats */}
      <div className="px-4 py-3 border-t border-[#21262d] flex items-center justify-between">
        {/* Current visitor location */}
        {currentLocation && (
          <div className="text-xs text-[#8b949e]">
            You: <span className="text-[#f97316]">{currentLocation.city}, {currentLocation.country}</span>
          </div>
        )}

        {/* Top countries */}
        {topCountries.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#8b949e]">Top:</span>
            {topCountries.map(([country, count]) => (
              <span key={country} className="text-[#8b949e]">
                <span className="text-[#c9d1d9]">{country}</span>
                <span className="text-[#3fb950] ml-1">({count})</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
