// Device Fingerprint — generates a stable per-device identifier
// Uses available browser signals, hashed to produce a privacy-preserving token
// Falls back to a UUID stored in sessionStorage if APIs are unavailable

export async function getDeviceFingerprint(): Promise<string> {
    try {
        const signals = [
            navigator.userAgent,
            navigator.language,
            navigator.hardwareConcurrency?.toString() ?? '',
            navigator.platform ?? '',
            screen.width + 'x' + screen.height,
            screen.colorDepth?.toString() ?? '',
            Intl.DateTimeFormat().resolvedOptions().timeZone,
            navigator.maxTouchPoints?.toString() ?? '',
        ]
        const raw = signals.join('|')

        // Use SubtleCrypto for SHA-256 if available
        if (window.crypto && window.crypto.subtle) {
            const encoder = new TextEncoder()
            const data = encoder.encode(raw)
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', data)
            const hashArray = Array.from(new Uint8Array(hashBuffer))
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        }

        // Fallback: simple djb2 hash
        let hash = 5381
        for (let i = 0; i < raw.length; i++) {
            hash = ((hash << 5) + hash) ^ raw.charCodeAt(i)
            hash = hash & hash // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16)
    } catch {
        // Last resort — session-scoped random ID
        const cached = sessionStorage.getItem('mao_ir_fp')
        if (cached) return cached
        const fp = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)
        sessionStorage.setItem('mao_ir_fp', fp)
        return fp
    }
}
