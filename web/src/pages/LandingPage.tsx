import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveToken, getToken, deleteToken, type TokenInfo } from '../services/api'

const currentYear = new Date().getFullYear()

const getPastDate = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

const today = new Date().toISOString().split('T')[0]

const PRESETS = [
  { label: 'Past Year', start: getPastDate(365), end: today },
  { label: 'Past Month', start: getPastDate(30), end: today },
  { label: 'Past Week', start: getPastDate(7), end: today },
  { label: String(currentYear), start: `${currentYear}-01-01`, end: today },
  { label: String(currentYear - 1), start: `${currentYear - 1}-01-01`, end: `${currentYear - 1}-12-31` },
]

export default function LandingPage() {
  const [username, setUsername] = useState('')
  const [start, setStart] = useState(PRESETS[0].start)
  const [end, setEnd] = useState(PRESETS[0].end)
  const [selected, setSelected] = useState(PRESETS[0].label)
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [tokenInput, setTokenInput] = useState('')
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  // Load token info when username changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (username.trim()) {
        getToken(username.trim()).then(setTokenInfo).catch(() => setTokenInfo(null))
      } else {
        setTokenInfo(null)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [username])

  // Also check localStorage token
  const localToken = localStorage.getItem('github_token')
  const hasToken = tokenInfo?.exists || !!localToken

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return
    navigate(`/yearbook/${username.trim()}/${start}/${end}?title=${encodeURIComponent(selected)}`)
  }

  const handleSaveToken = async () => {
    if (!username.trim() || !tokenInput.trim()) return
    setSaving(true)
    try {
      await saveToken(username.trim(), tokenInput.trim())
      // Also save to localStorage for immediate use
      localStorage.setItem('github_token', tokenInput.trim())
      setTokenInfo(await getToken(username.trim()))
      setTokenInput('')
      setShowTokenModal(false)
    } catch (error) {
      console.error('Failed to save token:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteToken = async () => {
    if (!username.trim()) return
    try {
      await deleteToken(username.trim())
      localStorage.removeItem('github_token')
      setTokenInfo({ exists: false })
    } catch (error) {
      console.error('Failed to delete token:', error)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <svg className="w-16 h-16 mx-auto text-white mb-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <h1 className="text-2xl font-bold text-white mb-2">GitHub Yearbook</h1>
          <p className="text-[#8b949e]">Visualise your year in code</p>
        </div>

        {/* Main Card */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg shadow-xl overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">

            {/* Username Input */}
            <div>
              <label className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider block mb-2">
                GitHub Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. torvalds"
                  className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-md text-white placeholder-[#484f58] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] focus:outline-none transition-all"
                  autoFocus
                />
                {/* Status Indicator */}
                {username && (
                  <div className="absolute right-3 top-3.5">
                    {tokenInfo !== null ? (
                      hasToken ? (
                        <span className="flex items-center text-[10px] text-[#3fb950] font-medium bg-[#3fb950]/10 px-2 py-0.5 rounded-full border border-[#3fb950]/20">
                          Include Private
                        </span>
                      ) : (
                        <span className="flex items-center text-[10px] text-[#8b949e] font-medium bg-[#8b949e]/10 px-2 py-0.5 rounded-full border border-[#8b949e]/20">
                          Public Only
                        </span>
                      )
                    ) : (
                      <div className="w-4 h-4 border-2 border-[#30363d] border-t-[#58a6ff] rounded-full animate-spin"></div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Configuration Toggle */}
            <div className="border-t border-[#30363d] pt-4">
              <button
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                className="flex items-center text-xs text-[#8b949e] hover:text-[#58a6ff] transition-colors w-full justify-between group"
              >
                <span>Configuration</span>
                <svg
                  className={`w-4 h-4 transform transition-transform ${showConfig ? 'rotate-180' : ''} text-[#8b949e] group-hover:text-[#58a6ff]`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Collapsible Config Area */}
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showConfig ? 'max-h-48 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider block mb-2">Time Period</label>
                    <div className="grid grid-cols-3 gap-2">
                      {PRESETS.slice(0, 3).map(p => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => { setStart(p.start); setEnd(p.end); setSelected(p.label) }}
                          className={`py-2 text-xs rounded border transition-all ${selected === p.label
                            ? 'bg-[#238636] border-[#238636] text-white shadow-sm'
                            : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:border-[#8b949e] hover:text-white'
                            }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {PRESETS.slice(3).map(p => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => { setStart(p.start); setEnd(p.end); setSelected(p.label) }}
                          className={`py-2 text-xs rounded border transition-all ${selected === p.label
                            ? 'bg-[#238636] border-[#238636] text-white shadow-sm'
                            : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:border-[#8b949e] hover:text-white'
                            }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!username.trim()}
              className="w-full py-3 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-md shadow-lg transition-all transform active:scale-[0.99]"
            >
              Preview Yearbook
            </button>

            {/* Token Management Link */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowTokenModal(true)}
                className="text-xs text-[#58a6ff] hover:underline hover:text-[#79c0ff] transition-colors"
              >
                {hasToken ? 'Manage Access Token' : 'Add Access Token for Private Repos'}
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* Token Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl p-6 w-full max-w-sm transform transition-all scale-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Access Token Settings</h2>
              <button
                onClick={() => setShowTokenModal(false)}
                className="text-[#8b949e] hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {tokenInfo?.exists ? (
              <div className="space-y-4">
                <div className="p-4 bg-[#0d1117] rounded-lg border border-[#30363d]">
                  <div className="text-xs text-[#8b949e] uppercase tracking-wider mb-2">Active Token</div>
                  <div className="text-sm text-white font-mono break-all">{tokenInfo.masked_token}</div>
                  {tokenInfo.token_type && (
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-[10px] bg-[#1f6feb]/10 text-[#58a6ff] border border-[#1f6feb]/20 px-1.5 py-0.5 rounded uppercase">{tokenInfo.token_type}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleDeleteToken}
                  className="w-full py-2.5 bg-[#da3633] hover:bg-[#b62324] text-white text-sm font-medium rounded-md transition-colors border border-transparent"
                >
                  Remove Token
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#8b949e] block mb-1.5">Personal Access Token</label>
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={e => setTokenInput(e.target.value)}
                    placeholder="ghp_..."
                    className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-md text-sm text-white placeholder-[#484f58] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] focus:outline-none"
                  />
                </div>
                <div className="text-xs text-[#8b949e] leading-relaxed">
                  Required scopes: <code className="bg-[#21262d] px-1 py-0.5 rounded border border-[#30363d] text-[#c9d1d9]">repo</code>, <code className="bg-[#21262d] px-1 py-0.5 rounded border border-[#30363d] text-[#c9d1d9]">read:org</code>
                </div>
                <button
                  onClick={handleSaveToken}
                  disabled={!tokenInput.trim() || !username.trim() || saving}
                  className="w-full py-2.5 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white text-sm font-semibold rounded-md transition-colors shadow-sm"
                >
                  {saving ? 'Verifying & Saving...' : 'Save Token'}
                </button>
                {!username.trim() && (
                  <div className="text-xs text-[#f85149] flex items-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor"><path d="M4.47.22A.75.75 0 0 1 5 0h6a.75.75 0 0 1 .53.22l4.25 4.25c.141.14.22.331.22.53v6a.75.75 0 0 1-.22.53l-4.25 4.25A.75.75 0 0 1 11 16H5a.75.75 0 0 1-.53-.22L.22 11.53A.75.75 0 0 1 0 11V5a.75.75 0 0 1 .22-.53L4.47.22Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5H5.31ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" /></svg>
                    Please enter a username first
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-[#30363d] text-center">
              <a
                href="https://github.com/settings/tokens/new?scopes=repo,read:org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#58a6ff] hover:text-[#79c0ff] hover:underline inline-flex items-center gap-1"
              >
                Create new token on GitHub
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
