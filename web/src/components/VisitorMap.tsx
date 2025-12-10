import { useEffect, useState } from 'react'

interface VisitorLocation {
  ip: string
  city: string
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

const VISITOR_STORAGE_KEY = 'github_yearbook_visitors'

// Convert lat/lon to SVG coordinates (simple equirectangular projection)
function latLonToXY(lat: number, lon: number, width: number, height: number): [number, number] {
  const x = ((lon + 180) / 360) * width
  const y = ((90 - lat) / 180) * height
  return [x, y]
}

async function getVisitorLocation(): Promise<VisitorLocation | null> {
  try {
    const response = await fetch('https://ipapi.co/json/')
    if (!response.ok) return null
    const data = await response.json()
    return {
      ip: data.ip,
      city: data.city || 'Unknown',
      country: data.country_name || 'Unknown',
      countryCode: data.country_code || '',
      lat: data.latitude || 0,
      lon: data.longitude || 0,
      timestamp: Date.now(),
    }
  } catch {
    return null
  }
}

function loadVisitorStats(): VisitorStats {
  try {
    const stored = localStorage.getItem(VISITOR_STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return { total: 0, unique: 0, locations: [], byCountry: {} }
}

function saveVisitorStats(stats: VisitorStats) {
  try {
    localStorage.setItem(VISITOR_STORAGE_KEY, JSON.stringify(stats))
  } catch { /* ignore */ }
}

async function recordVisitor(): Promise<VisitorStats> {
  const stats = loadVisitorStats()
  const location = await getVisitorLocation()

  if (location) {
    stats.total++
    const existingIndex = stats.locations.findIndex(l => l.ip === location.ip)
    if (existingIndex === -1) {
      stats.unique++
      stats.locations.push(location)
      stats.byCountry[location.country] = (stats.byCountry[location.country] || 0) + 1
    } else {
      stats.locations[existingIndex].timestamp = Date.now()
    }
    if (stats.locations.length > 100) {
      stats.locations = stats.locations.slice(-100)
    }
    saveVisitorStats(stats)
  }
  return stats
}

// Simple world map SVG path (simplified continents)
const WORLD_PATH = `M2,43 L5,42 L8,40 L12,41 L15,43 L18,41 L22,42 L25,40 L28,41 L30,43 L28,45 L25,47 L22,48 L18,47 L15,48 L12,47 L8,48 L5,47 L2,48 Z
M35,30 L40,28 L45,29 L50,27 L55,28 L58,30 L60,33 L58,36 L55,38 L50,39 L45,38 L40,39 L35,37 L33,34 Z
M62,25 L70,22 L80,23 L88,25 L95,28 L98,32 L95,38 L88,42 L80,43 L70,42 L62,40 L58,35 L60,30 Z
M70,45 L75,43 L80,44 L85,46 L88,50 L85,55 L80,58 L75,57 L70,55 L68,50 Z
M15,55 L20,52 L28,53 L35,56 L38,62 L35,70 L28,75 L20,74 L15,70 L12,62 Z
M85,60 L90,58 L95,60 L98,65 L95,72 L90,75 L85,73 L82,68 Z`

export default function VisitorMap() {
  const [stats, setStats] = useState<VisitorStats | null>(null)
  const [currentLocation, setCurrentLocation] = useState<VisitorLocation | null>(null)

  useEffect(() => {
    recordVisitor().then(s => {
      setStats(s)
      getVisitorLocation().then(setCurrentLocation)
    })
  }, [])

  if (!stats) {
    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 text-center text-[#8b949e] text-sm">
        Loading visitor map...
      </div>
    )
  }

  const width = 100
  const height = 60
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
          <span className="text-sm text-[#c9d1d9] font-medium">Visitors</span>
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
      <div className="p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" style={{ maxHeight: '200px' }}>
          {/* Background */}
          <rect width={width} height={height} fill="#0d1117" />

          {/* Grid lines */}
          {[0, 20, 40, 60, 80, 100].map(x => (
            <line key={`v${x}`} x1={x} y1={0} x2={x} y2={height} stroke="#21262d" strokeWidth={0.2} />
          ))}
          {[0, 15, 30, 45, 60].map(y => (
            <line key={`h${y}`} x1={0} y1={y} x2={width} y2={y} stroke="#21262d" strokeWidth={0.2} />
          ))}

          {/* Simplified continents */}
          <path d={WORLD_PATH} fill="#21262d" stroke="#30363d" strokeWidth={0.3} transform="scale(1)" />

          {/* Visitor dots */}
          {stats.locations.map((loc, idx) => {
            const [x, y] = latLonToXY(loc.lat, loc.lon, width, height)
            const isCurrent = loc.ip === currentLocation?.ip
            return (
              <g key={`${loc.ip}-${idx}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={isCurrent ? 1.5 : 1}
                  fill={isCurrent ? '#f97316' : '#3fb950'}
                  opacity={0.9}
                />
                {isCurrent && (
                  <circle cx={x} cy={y} r={2.5} fill="none" stroke="#f97316" strokeWidth={0.3} opacity={0.5}>
                    <animate attributeName="r" from="1.5" to="4" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.8" to="0" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#21262d] flex flex-wrap items-center justify-between gap-2 text-xs">
        {currentLocation && (
          <div className="text-[#8b949e]">
            You: <span className="text-[#f97316]">{currentLocation.city}, {currentLocation.country}</span>
          </div>
        )}
        {topCountries.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[#8b949e]">Top:</span>
            {topCountries.slice(0, 3).map(([country, count]) => (
              <span key={country} className="text-[#8b949e]">
                {country} <span className="text-[#3fb950]">({count})</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
