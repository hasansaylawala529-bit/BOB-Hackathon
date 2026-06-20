import type { WSMessage, WSMessageType } from '../types/telemetry.types'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3001'

type Handler = (data: WSMessage['data']) => void

class WSClient {
    private ws: WebSocket | null = null
    private handlers = new Map<WSMessageType, Handler[]>()
    private reconnectDelay = 2000
    private maxReconnectDelay = 30000
    private reconnectAttempts = 0
    private shouldReconnect = true
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null
    private connectionStatusCallback: ((connected: boolean) => void) | null = null

    connect() {
        this.shouldReconnect = true
        this._connect()
    }

    private _connect() {
        try {
            this.ws = new WebSocket(WS_URL)

            this.ws.onopen = () => {
                this.reconnectAttempts = 0
                this.reconnectDelay = 2000
                this.connectionStatusCallback?.(true)
                console.log('[MAO-IR WS] Connected to', WS_URL)
            }

            this.ws.onmessage = (event: MessageEvent) => {
                try {
                    const msg: WSMessage = JSON.parse(event.data as string)
                    const handlers = this.handlers.get(msg.type)
                    handlers?.forEach(h => h(msg.data))
                } catch {
                    // ignore malformed messages
                }
            }

            this.ws.onclose = () => {
                this.connectionStatusCallback?.(false)
                if (this.shouldReconnect) {
                    this.reconnectAttempts++
                    const delay = Math.min(
                        this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1),
                        this.maxReconnectDelay
                    )
                    console.log(`[MAO-IR WS] Disconnected. Reconnecting in ${Math.round(delay / 1000)}s...`)
                    this.reconnectTimer = setTimeout(() => this._connect(), delay)
                }
            }

            this.ws.onerror = () => {
                // onclose will handle reconnect
            }
        } catch {
            // WebSocket not available — silently degrade
        }
    }

    disconnect() {
        this.shouldReconnect = false
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
        this.ws?.close()
        this.ws = null
    }

    on(type: WSMessageType, handler: Handler) {
        if (!this.handlers.has(type)) this.handlers.set(type, [])
        this.handlers.get(type)!.push(handler)
    }

    off(type: WSMessageType, handler: Handler) {
        const list = this.handlers.get(type) ?? []
        const idx = list.indexOf(handler)
        if (idx !== -1) list.splice(idx, 1)
    }

    onConnectionStatus(cb: (connected: boolean) => void) {
        this.connectionStatusCallback = cb
    }

    get isConnected() {
        return this.ws?.readyState === WebSocket.OPEN
    }
}

export const wsClient = new WSClient()
