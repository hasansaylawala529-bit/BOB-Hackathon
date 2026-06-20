// Silent Behavioral Telemetry Tracker
// Captures keystroke dynamics, mouse behavior, scroll patterns
// WITHOUT recording actual key content — privacy-preserving by design (DPDP Act compliance)

import type { KeystrokeEvent, MouseEventData, ScrollEventData, TelemetryPayload, BehavioralData } from '../types/telemetry.types'

interface KeytrackEntry {
    dwell_time_ms: number
    flight_time_ms: number
    timestamp: number
    keydownTime: number
}

interface MousetrackEntry extends MouseEventData {
    timestamp: number
    x: number
    y: number
}

class SilentTracker {
    private keystrokeBuffer: KeytrackEntry[] = []
    private mouseBuffer: MousetrackEntry[] = []
    private scrollBuffer: Array<ScrollEventData & { timestamp: number }> = []
    private clickCount = 0
    private pageCount = 0
    private idleStart = Date.now()
    private lastIdleTime = 0

    private flushIntervalId: ReturnType<typeof setInterval> | null = null
    private idleTimeoutId: ReturnType<typeof setTimeout> | null = null

    private lastMouseX = 0
    private lastMouseY = 0
    private lastMouseTime = Date.now()
    private lastMouseVelocity = 0
    private lastScrollY = 0
    private lastScrollTime = Date.now()

    private username: string = ''
    private sessionId: string = ''
    private flushCallback: ((payload: TelemetryPayload) => void) | null = null

    // Bound references for cleanup
    private boundKeydown: (e: KeyboardEvent) => void
    private boundKeyup: (e: KeyboardEvent) => void
    private boundMousemove: (e: MouseEvent) => void
    private boundClick: () => void
    private boundScroll: () => void

    constructor() {
        this.boundKeydown = this.handleKeydown.bind(this)
        this.boundKeyup = this.handleKeyup.bind(this)
        this.boundMousemove = this.handleMousemove.bind(this)
        this.boundClick = this.handleClick.bind(this)
        this.boundScroll = this.handleScroll.bind(this)
    }

    start(username: string, sessionId: string, flushFn: (payload: TelemetryPayload) => void) {
        this.username = username
        this.sessionId = sessionId
        this.flushCallback = flushFn

        document.addEventListener('keydown', this.boundKeydown)
        document.addEventListener('keyup', this.boundKeyup)
        document.addEventListener('mousemove', this.boundMousemove)
        document.addEventListener('click', this.boundClick)
        document.addEventListener('scroll', this.boundScroll, true)

        // Flush every 5 seconds
        this.flushIntervalId = setInterval(() => this.flush(), 5000)
    }

    stop() {
        document.removeEventListener('keydown', this.boundKeydown)
        document.removeEventListener('keyup', this.boundKeyup)
        document.removeEventListener('mousemove', this.boundMousemove)
        document.removeEventListener('click', this.boundClick)
        document.removeEventListener('scroll', this.boundScroll, true)

        if (this.flushIntervalId) clearInterval(this.flushIntervalId)
        if (this.idleTimeoutId) clearTimeout(this.idleTimeoutId)

        this.keystrokeBuffer = []
        this.mouseBuffer = []
        this.scrollBuffer = []
        this.flushCallback = null
    }

    private handleKeydown(_e: KeyboardEvent) {
        const now = Date.now()
        this.resetIdle()

        const prev = this.keystrokeBuffer[this.keystrokeBuffer.length - 1]
        const flight_time_ms = prev ? now - prev.keydownTime : 0

        this.keystrokeBuffer.push({
            dwell_time_ms: 0,
            flight_time_ms,
            timestamp: now,
            keydownTime: now,
        })

        // Keep buffer bounded
        if (this.keystrokeBuffer.length > 200) this.keystrokeBuffer.shift()
    }

    private handleKeyup(_e: KeyboardEvent) {
        const now = Date.now()
        const last = this.keystrokeBuffer[this.keystrokeBuffer.length - 1]
        if (last && last.dwell_time_ms === 0) {
            last.dwell_time_ms = now - last.keydownTime
        }
    }

    private handleMousemove(e: MouseEvent) {
        const now = Date.now()
        const dt = now - this.lastMouseTime

        if (dt < 50) return // Throttle to ~20 samples/sec

        const dx = e.clientX - this.lastMouseX
        const dy = e.clientY - this.lastMouseY
        const dist = Math.sqrt(dx * dx + dy * dy)
        const velocity = dt > 0 ? dist / dt * 1000 : 0
        const acceleration = dt > 0 ? Math.abs(velocity - this.lastMouseVelocity) / dt * 1000 : 0

        // Simple curvature approx: ratio of straight vs actual path
        const path_curvature = dist > 0 ? Math.min(Math.abs(dy / dist), 1) : 0

        this.mouseBuffer.push({
            velocity: Math.round(velocity),
            acceleration: Math.round(acceleration),
            path_curvature: Math.round(path_curvature * 100) / 100,
            timestamp: now,
            x: e.clientX,
            y: e.clientY,
        })

        if (this.mouseBuffer.length > 200) this.mouseBuffer.shift()

        this.lastMouseX = e.clientX
        this.lastMouseY = e.clientY
        this.lastMouseTime = now
        this.lastMouseVelocity = velocity
        this.resetIdle()
    }

    private handleClick() {
        this.clickCount++
        this.resetIdle()
    }

    private handleScroll() {
        const now = Date.now()
        const currentY = window.scrollY
        const dy = currentY - this.lastScrollY
        const dt = now - this.lastScrollTime

        const speed = dt > 0 ? Math.abs(dy) / dt * 1000 : 0
        const direction = dy >= 0 ? 'DOWN' : 'UP'

        this.scrollBuffer.push({
            speed: Math.round(speed),
            direction,
            duration_ms: dt,
            timestamp: now,
        })

        if (this.scrollBuffer.length > 100) this.scrollBuffer.shift()

        this.lastScrollY = currentY
        this.lastScrollTime = now
        this.resetIdle()
    }

    private resetIdle() {
        this.lastIdleTime = Date.now() - this.idleStart
        this.idleStart = Date.now()
        if (this.idleTimeoutId) clearTimeout(this.idleTimeoutId)
        this.idleTimeoutId = setTimeout(() => {
            // User went idle — idle period will be captured in next flush
        }, 30000)
    }

    private flush() {
        if (!this.flushCallback || !this.username) return
        if (
            this.keystrokeBuffer.length === 0 &&
            this.mouseBuffer.length === 0 &&
            this.scrollBuffer.length === 0
        ) return

        const keystroke_events: KeystrokeEvent[] = this.keystrokeBuffer.map(k => ({
            dwell_time_ms: k.dwell_time_ms,
            flight_time_ms: k.flight_time_ms,
        }))

        const mouse_events: MouseEventData[] = this.mouseBuffer.map(m => ({
            velocity: m.velocity,
            acceleration: m.acceleration,
            path_curvature: m.path_curvature,
        }))

        const scroll_events = this.scrollBuffer.map(s => ({
            speed: s.speed,
            direction: s.direction as 'UP' | 'DOWN',
            duration_ms: s.duration_ms,
        }))

        const now = Date.now()
        const elapsed_min = Math.max((now - this.idleStart) / 60000, 0.01)

        const behavioral_data: BehavioralData = {
            keystroke_events,
            mouse_events,
            scroll_events,
            session_velocity: {
                clicks_per_minute: Math.round(this.clickCount / elapsed_min),
                pages_per_minute: Math.round(this.pageCount / elapsed_min),
                idle_time_ms: this.lastIdleTime,
            },
        }

        const payload: TelemetryPayload = {
            username: this.username,
            session_id: this.sessionId,
            timestamp: new Date().toISOString(),
            behavioral_data,
        }

        this.flushCallback(payload)

        // Clear buffers
        this.keystrokeBuffer = []
        this.mouseBuffer = []
        this.scrollBuffer = []
        this.clickCount = 0
        this.pageCount = 0
        this.lastIdleTime = 0
        this.idleStart = Date.now()
    }

    /** Call when the user navigates to a new page */
    trackNavigation() {
        this.pageCount++
    }

    /** Get a snapshot of current raw buffers (for live visualization) */
    getSnapshot() {
        return {
            keystrokeCount: this.keystrokeBuffer.length,
            mouseCount: this.mouseBuffer.length,
            scrollCount: this.scrollBuffer.length,
            latestMouse: this.mouseBuffer[this.mouseBuffer.length - 1] ?? null,
            latestKeystroke: this.keystrokeBuffer[this.keystrokeBuffer.length - 1] ?? null,
            clickCount: this.clickCount,
        }
    }
}

// Singleton instance
export const silentTracker = new SilentTracker()
