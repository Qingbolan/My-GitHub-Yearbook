// Browser fingerprint generator for visitor deduplication
// This creates a hash based on browser characteristics to identify unique visitors

export async function generateFingerprint(): Promise<string> {
  const components: string[] = []

  // Screen info
  components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`)

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone)

  // Language
  components.push(navigator.language)

  // Platform
  components.push(navigator.platform)

  // Hardware concurrency
  components.push(String(navigator.hardwareConcurrency || 0))

  // Device memory (if available)
  const nav = navigator as Navigator & { deviceMemory?: number }
  if (nav.deviceMemory) {
    components.push(String(nav.deviceMemory))
  }

  // Canvas fingerprint
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      canvas.width = 200
      canvas.height = 50
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillStyle = '#f60'
      ctx.fillRect(0, 0, 100, 50)
      ctx.fillStyle = '#069'
      ctx.fillText('Browser fingerprint', 2, 15)
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
      ctx.fillText('Browser fingerprint', 4, 17)
      components.push(canvas.toDataURL().slice(-50))
    }
  } catch {
    // Canvas fingerprinting not available
  }

  // WebGL info
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (gl && gl instanceof WebGLRenderingContext) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      if (debugInfo) {
        components.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '')
        components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '')
      }
    }
  } catch {
    // WebGL not available
  }

  // Generate hash from components
  const data = components.join('|')
  const hash = await sha256(data)
  return hash
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Cache the fingerprint to avoid recalculating
let cachedFingerprint: string | null = null

export async function getFingerprint(): Promise<string> {
  if (!cachedFingerprint) {
    cachedFingerprint = await generateFingerprint()
  }
  return cachedFingerprint
}
