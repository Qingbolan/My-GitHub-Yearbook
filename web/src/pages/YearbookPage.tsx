import { useRef, useState } from 'react'
import { API_BASE } from '../services/api'
import { useLocation } from 'react-router-dom'
import VisitorMap from '../components/VisitorMap'
import { useYearbookLogic } from '../hooks/useYearbookLogic'

// Components
// Components
import { YearbookCard } from '../components/yearbook/YearbookCard'
import { EmbedCode } from '../components/yearbook/EmbedCode'

export default function YearbookPage() {
  const {
    username,
    yearStr,
    start,
    end,
    title,
    isCustomRange,
    isScreenshot,
    embed,
    stats,
    loading,
    error,
    resolvedStart,
    resolvedEnd
  } = useYearbookLogic()

  // Ensure we listen to location changes for hash updates
  const location = useLocation()

  const cardRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState<string | boolean>(false)
  // Local state for view toggle (defaults to all)
  const [viewState, setViewState] = useState<'all' | 'overview' | 'map'>('all')

  // Derive showOverview/showMap from hash/screenshot state OR local state
  const params = new URLSearchParams(location.search)
  const viewParam = params.get('view')

  // Logic:
  // If screenshot=1:
  //    - view=map -> Map only
  //    - view=overview -> Overview only
  //    - view=all or missing -> Both
  // Else (Interactive):
  //    - viewState determines which is shown

  let isShowOverview = false
  let isShowMap = false

  if (isScreenshot) {
    if (viewParam === 'map') {
      isShowMap = true
    } else if (viewParam === 'overview') {
      isShowOverview = true
    } else {
      isShowOverview = true
      isShowMap = true
    }
  } else {
    // Interactive Mode
    isShowOverview = viewState === 'all' || viewState === 'overview'
    isShowMap = viewState === 'all' || viewState === 'map'
  }

  const copyMarkdown = async () => {
    let imageUrl = `${API_BASE}/card/${username}`
    if (start && end) {
      imageUrl += `/${start}/${end}`
    } else {
      imageUrl += `/${yearStr}`
    }

    const queryParams = []
    if (viewState !== 'all') {
      queryParams.push(`view=${viewState}`)
    }
    if (title) {
      queryParams.push(`title=${encodeURIComponent(title)}`)
    }
    if (queryParams.length > 0) {
      imageUrl += `?${queryParams.join('&')}`
    }

    const displayTitle = title || (start && end ? `${start} ~ ${end}` : yearStr)
    const linkUrl = window.location.href
    try {
      await navigator.clipboard.writeText(`[![${username}'s ${displayTitle} GitHub Stats](${imageUrl})](${linkUrl})`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy markdown:', err)
      alert('Failed to copy to clipboard (permission denied).')
    }
  }

  const copyHtml = async () => {
    let imageUrl = `${API_BASE}/card/${username}`
    if (start && end) {
      imageUrl += `/${start}/${end}`
    } else {
      imageUrl += `/${yearStr}`
    }

    const queryParams = []
    if (viewState !== 'all') {
      queryParams.push(`view=${viewState}`)
    }
    if (title) {
      queryParams.push(`title=${encodeURIComponent(title)}`)
    }
    if (queryParams.length > 0) {
      imageUrl += `?${queryParams.join('&')}`
    }

    const displayTitle = title || (start && end ? `${start} ~ ${end}` : yearStr)

    const embedCode = `<a href="${window.location.origin}/yearbook/${username}/${start && end ? `${start}/${end}` : yearStr}">
  <img src="${imageUrl}" alt="${username}'s ${displayTitle} GitHub Yearbook" />
</a>`
    try {
      await navigator.clipboard.writeText(embedCode)
      setCopied('html')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy HTML:', err)
      alert('Failed to copy to clipboard (permission denied).')
    }
  }
  const copyImageToClipboard = async () => {
    const target = document.getElementById('screenshot-target')
    if (!target) return

    try {
      // Dynamic import inside the async function
      const html2canvas = (await import('html2canvas')).default

      // For strict browsers (Safari), we must pass a Promise to ClipboardItem immediately
      // rather than awaiting the blob generation first.
      const clipboardItem = new ClipboardItem({
        'image/png': new Promise(async (resolve, reject) => {
          try {
            const canvas = await html2canvas(target, { backgroundColor: '#0d1117', scale: 2 })
            canvas.toBlob(blob => {
              if (blob) resolve(blob)
              else reject(new Error('Canvas to Blob failed'))
            })
          } catch (e) {
            reject(e)
          }
        })
      })

      await navigator.clipboard.write([clipboardItem])

      setCopied('image')
      setTimeout(() => setCopied(false), 2000)
    } catch (err: any) {
      console.error('Failed to copy image:', err)
      if (err.name === 'NotAllowedError') {
        alert('Browser blocked the copy action. Please use the "PNG" download button instead.')
      } else {
        alert('Failed to copy image to clipboard. Please use the "PNG" download button.')
      }
    }
  }

  const downloadPng = async () => {
    if (!cardRef.current) return
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(cardRef.current, { backgroundColor: '#0d1117', scale: 2 })
    const a = document.createElement('a')
    const rangeStr = start && end ? `${start}-${end}` : yearStr
    a.download = `${username}-${rangeStr}-stats.png`
    a.href = canvas.toDataURL()
    a.click()
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <div className="text-[#8b949e] flex items-center gap-2">
        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" /></svg>
        Loading...
      </div>
    </div>
  )

  if (error || !stats) return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center gap-4">
      <p className="text-[#f85149]">{error || 'No data'}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0d1117] p-4 md:p-6 flex flex-col items-center">
      <div id="screenshot-target" className="w-full max-w-5xl">
        {/* Actions */}
        {!embed && !isScreenshot && (
          <div className="mb-4 flex flex-col sm:flex-row justify-between items-center w-full gap-4">

            {/* Left Controls: Back / Config + View Toggle */}
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button
                onClick={() => window.location.href = '/'}
                className="text-xs text-[#8b949e] hover:text-[#58a6ff] flex items-center gap-1 group transition-colors"
              >
                <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                New Config
              </button>

              {/* View Toggle */}
              <div className="flex bg-[#161b22] border border-[#30363d] rounded-md p-1">
                <button
                  onClick={() => setViewState('all')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${viewState === 'all'
                    ? 'bg-[#30363d] text-white shadow-sm'
                    : 'text-[#8b949e] hover:text-[#c9d1d9]'
                    }`}
                >
                  All
                </button>
                <button
                  onClick={() => setViewState('overview')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${viewState === 'overview'
                    ? 'bg-[#30363d] text-white shadow-sm'
                    : 'text-[#8b949e] hover:text-[#c9d1d9]'
                    }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setViewState('map')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${viewState === 'map'
                    ? 'bg-[#30363d] text-white shadow-sm'
                    : 'text-[#8b949e] hover:text-[#c9d1d9]'
                    }`}
                >
                  Visitor Map
                </button>
              </div>
            </div>

            {/* Right Controls: Exports */}
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button onClick={copyMarkdown} className="px-3 py-1.5 text-xs bg-[#21262d] border border-[#30363d] rounded text-[#c9d1d9] hover:border-[#8b949e] hover:text-white transition-colors flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                {copied === true ? 'Copied!' : 'Copy MD'}
              </button>
              <button onClick={copyHtml} className="px-3 py-1.5 text-xs bg-[#21262d] border border-[#30363d] rounded text-[#c9d1d9] hover:border-[#8b949e] hover:text-white transition-colors flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                {copied === 'html' ? 'Copied!' : 'Embed HTML'}
              </button>
              <button onClick={copyImageToClipboard} className="px-3 py-1.5 text-xs bg-[#21262d] border border-[#30363d] rounded text-[#c9d1d9] hover:border-[#8b949e] hover:text-white transition-colors flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {copied === 'image' ? 'Copied!' : 'Copy Image'}
              </button>
              <button onClick={downloadPng} className="px-3 py-1.5 text-xs bg-[#238636] rounded text-white hover:bg-[#2ea043] transition-colors flex items-center gap-1 shadow-sm">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                PNG
              </button>
            </div>
          </div>
        )}

        {/* Main Card */}
        {isShowOverview && (
          <YearbookCard
            ref={cardRef}
            stats={stats}
            username={username || ''}
            yearStr={yearStr}
            title={title || null}
            isCustomRange={isCustomRange}
            resolvedStart={resolvedStart}
            resolvedEnd={resolvedEnd}
            isScreenshot={isScreenshot}
          />
        )}

        {/* Embed Code */}
        {!embed && !isScreenshot && (
          <EmbedCode username={username || ''} yearStr={yearStr} start={start} end={end} />
        )}

        {/* Visitor Map */}
        {isShowMap && (
          <div className="mb-6">
            <VisitorMap />
          </div>
        )}
      </div>
    </div >
  )
}
