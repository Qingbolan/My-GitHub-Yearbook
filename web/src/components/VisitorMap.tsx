import { useEffect, useState, useRef, memo } from 'react'
import { useParams } from 'react-router-dom'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup
} from 'react-simple-maps'
import { logVisit, getVisitStats, getCurrentLocation, type VisitStats, type GeoLocation } from '../services/api'
import { getFingerprint } from '../utils/fingerprint'

// World map TopoJSON URL (Natural Earth 110m)
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// Memoized map background to prevent re-renders
const MapBackground = memo(function MapBackground() {
  return (
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
              hover: { outline: 'none', fill: '#30363d' },
              pressed: { outline: 'none' },
            }}
          />
        ))
      }
    </Geographies>
  )
})

export default function VisitorMap() {
  const { username, start } = useParams<{ username: string; start: string }>()
  const [stats, setStats] = useState<VisitStats | null>(null)
  const [currentLocation, setCurrentLocation] = useState<GeoLocation | null>(null)
  const [loading, setLoading] = useState(true)
  const hasInitialized = useRef(false)

  const year = start ? parseInt(start.slice(0, 4)) : new Date().getFullYear()

  useEffect(() => {
    if (!username || hasInitialized.current) return
    hasInitialized.current = true

    const init = async () => {
      try {
        // Get fingerprint and location in parallel
        const [fingerprint, location] = await Promise.all([
          getFingerprint(),
          getCurrentLocation()
        ])
        setCurrentLocation(location)

        // Log visit to backend with fingerprint for deduplication
        await logVisit({
          target_username: username,
          target_year: year,
          visitor_country: location?.country,
          visitor_city: location?.city,
          visitor_lat: location?.lat,
          visitor_lng: location?.lon,
          visitor_fingerprint: fingerprint,
          referer: document.referrer || undefined,
        })

        // Fetch visit stats from backend
        const visitStats = await getVisitStats(username, year)
        setStats(visitStats)
      } catch (error) {
        console.error('Failed to load visitor stats:', error)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [username, year])

  if (loading) {
    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 text-center text-[#8b949e] text-sm">
        Loading visitor map...
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const topCountries = stats.by_country.slice(0, 5)

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
            <span className="text-[#58a6ff] font-medium">{stats.map_data.length}</span> locations
          </span>
        </div>
      </div>

      {/* Map */}
      <div className="p-2" style={{ height: '220px' }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 120,
            center: [0, 30],
          }}
          style={{
            width: '100%',
            height: '100%',
          }}
        >
          <ZoomableGroup>
            <MapBackground />

            {/* Visitor markers */}
            {stats.map_data.map((loc, idx) => {
              const isCurrent = currentLocation &&
                Math.abs(loc.lat - currentLocation.lat) < 0.5 &&
                Math.abs(loc.lng - currentLocation.lon) < 0.5

              return (
                <Marker key={`${loc.lat}-${loc.lng}-${idx}`} coordinates={[loc.lng, loc.lat]}>
                  {/* Pulse animation for current location */}
                  {isCurrent && (
                    <circle
                      r={8}
                      fill="none"
                      stroke="#f97316"
                      strokeWidth={1}
                      opacity={0.5}
                    >
                      <animate
                        attributeName="r"
                        from="4"
                        to="12"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        from="0.8"
                        to="0"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                  {/* Main dot */}
                  <circle
                    r={isCurrent ? 5 : 3}
                    fill={isCurrent ? '#f97316' : '#3fb950'}
                    opacity={0.9}
                    stroke={isCurrent ? '#f97316' : '#3fb950'}
                    strokeWidth={1}
                    strokeOpacity={0.3}
                  />
                </Marker>
              )
            })}
          </ZoomableGroup>
        </ComposableMap>
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
            {topCountries.slice(0, 3).map(({ country, count }) => (
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
