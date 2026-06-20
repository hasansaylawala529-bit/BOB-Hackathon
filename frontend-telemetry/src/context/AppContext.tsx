import React, {
    createContext, useContext, useReducer, useCallback,
    useEffect, useRef, type ReactNode
} from 'react'
import type {
    User, TrustScore, TrustPassport, Investigation,
    AuditLog, RiskLevel, UserStatus
} from '../types/telemetry.types'
import { wsClient } from '../services/websocket'
import { silentTracker } from '../telemetry/silent-tracker'
import { getDeviceFingerprint } from '../telemetry/fingerprint'
import * as api from '../services/api'

// ===== State Shape =====
interface AlertItem {
    id: string
    type: 'TRUST_UPDATE' | 'ALERT' | 'INVESTIGATION' | 'AUDIT'
    message: string
    severity: RiskLevel
    timestamp: string
    data?: unknown
}

interface AppState {
    currentUser: (User & { session_token?: string }) | null
    users: (User & { trustScore?: TrustScore })[]
    trustScores: Record<string, TrustScore>    // by username
    passports: Record<string, TrustPassport>   // by username
    alerts: AlertItem[]
    investigations: Investigation[]
    latestInvestigation: Investigation | null
    wsConnected: boolean
    loading: boolean
    error: string | null
}

// ===== Actions =====
type Action =
    | { type: 'SET_CURRENT_USER'; payload: (User & { session_token?: string }) | null }
    | { type: 'SET_USERS'; payload: (User & { trustScore?: TrustScore })[] }
    | { type: 'UPDATE_USER_STATUS'; payload: { username: string; status: UserStatus } }
    | { type: 'SET_TRUST_SCORE'; payload: { username: string; score: TrustScore } }
    | { type: 'SET_PASSPORT'; payload: { username: string; passport: TrustPassport } }
    | { type: 'ADD_ALERT'; payload: AlertItem }
    | { type: 'CLEAR_ALERTS' }
    | { type: 'ADD_INVESTIGATION'; payload: Investigation }
    | { type: 'SET_LATEST_INVESTIGATION'; payload: Investigation | null }
    | { type: 'SET_WS_CONNECTED'; payload: boolean }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }

function reducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'SET_CURRENT_USER':
            return { ...state, currentUser: action.payload }
        case 'SET_USERS':
            return { ...state, users: action.payload }
        case 'UPDATE_USER_STATUS':
            return {
                ...state,
                users: state.users.map(u =>
                    u.username === action.payload.username ? { ...u, status: action.payload.status } : u
                ),
                currentUser: state.currentUser?.username === action.payload.username
                    ? { ...state.currentUser, status: action.payload.status }
                    : state.currentUser,
            }
        case 'SET_TRUST_SCORE':
            return {
                ...state,
                trustScores: { ...state.trustScores, [action.payload.username]: action.payload.score },
                users: state.users.map(u =>
                    u.username === action.payload.username ? { ...u, trustScore: action.payload.score } : u
                ),
            }
        case 'SET_PASSPORT':
            return { ...state, passports: { ...state.passports, [action.payload.username]: action.payload.passport } }
        case 'ADD_ALERT':
            return { ...state, alerts: [action.payload, ...state.alerts].slice(0, 100) }
        case 'CLEAR_ALERTS':
            return { ...state, alerts: [] }
        case 'ADD_INVESTIGATION':
            return {
                ...state,
                investigations: [action.payload, ...state.investigations.filter(i => i.id !== action.payload.id)].slice(0, 50),
            }
        case 'SET_LATEST_INVESTIGATION':
            return { ...state, latestInvestigation: action.payload }
        case 'SET_WS_CONNECTED':
            return { ...state, wsConnected: action.payload }
        case 'SET_LOADING':
            return { ...state, loading: action.payload }
        case 'SET_ERROR':
            return { ...state, error: action.payload }
        default:
            return state
    }
}

const initialState: AppState = {
    currentUser: null,
    users: [],
    trustScores: {},
    passports: {},
    alerts: [],
    investigations: [],
    latestInvestigation: null,
    wsConnected: false,
    loading: false,
    error: null,
}

// ===== Context =====
interface AppContextValue {
    state: AppState
    dispatch: React.Dispatch<Action>
    // Actions
    loginUser: (username: string) => Promise<void>
    logoutUser: () => Promise<void>
    loadUsers: () => Promise<void>
    runScenario: (scenario: string) => Promise<Investigation>
    quarantineUser: (username: string, reason: string) => Promise<void>
    restoreUser: (username: string) => Promise<void>
    addAlert: (msg: string, severity: RiskLevel, type?: AlertItem['type']) => void
}

const AppContext = createContext<AppContextValue | null>(null)
const SESSION_STORAGE_KEY = 'mao-ir.current-user'

function readStoredUser() {
    try {
        const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

function inferRiskLevel(score: number): RiskLevel {
    if (score <= 30) return 'LOW'
    if (score <= 60) return 'MEDIUM'
    if (score <= 80) return 'HIGH'
    return 'CRITICAL'
}

function normalizeWsTrustUpdate(data: any): TrustScore {
    const score = Number(data?.score ?? data?.trust_score ?? 0)
    return api.normalizeTrustScore({
        user_id: data?.user_id ?? data?.username,
        score,
        confidence: data?.confidence ?? 0.5,
        risk_level: data?.risk_level ?? inferRiskLevel(score),
        timestamp: data?.timestamp,
        contributing_factors: data?.contributing_factors,
        narrative: data?.narrative,
        recommended_action: data?.recommended_action,
    }, String(data?.user_id ?? data?.username ?? ''))
}

export function AppProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, { ...initialState, currentUser: readStoredUser() })
    const deviceFpRef = useRef<string>('')

    // ===== WS Setup =====
    useEffect(() => {
        wsClient.onConnectionStatus(connected => dispatch({ type: 'SET_WS_CONNECTED', payload: connected }))

        wsClient.on('TRUST_UPDATE', data => {
            const score = normalizeWsTrustUpdate(data)
            dispatch({ type: 'SET_TRUST_SCORE', payload: { username: score.user_id, score } })
            if (score.risk_level !== 'LOW') {
                addAlertInternal(`Trust score updated for ${score.user_id}: ${score.score} (${score.risk_level})`, score.risk_level, 'TRUST_UPDATE')
            }
        })

        wsClient.on('ALERT', data => {
            const alert = data as { message: string; severity: RiskLevel }
            addAlertInternal(alert.message, alert.severity, 'ALERT')
        })

        wsClient.on('INVESTIGATION', data => {
            const inv = api.normalizeInvestigation(data)
            dispatch({ type: 'ADD_INVESTIGATION', payload: inv })
            dispatch({ type: 'SET_LATEST_INVESTIGATION', payload: inv })
            addAlertInternal(`Investigation completed for ${inv.user_id}: ${inv.final_trust_score?.risk_level}`, inv.final_trust_score?.risk_level ?? 'HIGH', 'INVESTIGATION')
        })

        wsClient.on('AUDIT', data => {
            const log = data as AuditLog
            if (log.riskScore > 50) {
                const sev: RiskLevel = log.riskScore > 80 ? 'CRITICAL' : log.riskScore > 60 ? 'HIGH' : 'MEDIUM'
                addAlertInternal(`${log.username} — ${log.action} on ${log.resource}`, sev, 'AUDIT')
            }
        })

        wsClient.connect()
        return () => wsClient.disconnect()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ===== Get device fingerprint =====
    useEffect(() => {
        getDeviceFingerprint().then(fp => { deviceFpRef.current = fp })
    }, [])

    useEffect(() => {
        if (!state.currentUser) return
        try {
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state.currentUser))
        } catch {
            // Ignore storage failures in restricted environments.
        }
    }, [state.currentUser])

    // Internal alert helper (without stale closure issue)
    const addAlertInternal = useCallback((msg: string, severity: RiskLevel, type: AlertItem['type'] = 'ALERT') => {
        dispatch({
            type: 'ADD_ALERT',
            payload: {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                type,
                message: msg,
                severity,
                timestamp: new Date().toISOString(),
            }
        })
    }, [])

    const addAlert = useCallback((msg: string, severity: RiskLevel, type: AlertItem['type'] = 'ALERT') => {
        addAlertInternal(msg, severity, type)
    }, [addAlertInternal])

    const loginUser = useCallback(async (username: string) => {
        dispatch({ type: 'SET_LOADING', payload: true })
        dispatch({ type: 'SET_ERROR', payload: null })
        try {
            const result = await api.login(username, deviceFpRef.current || undefined)
            dispatch({ type: 'SET_CURRENT_USER', payload: { ...result.user, session_token: result.session.session_token } })
            dispatch({ type: 'SET_PASSPORT', payload: { username, passport: result.trustPassport } })

            // Start silent telemetry — use the actual session TOKEN (not the numeric row id)
            silentTracker.start(username, result.session.session_token, payload => {
                api.ingestTelemetry({
                    ...payload,
                    device_fingerprint: deviceFpRef.current || undefined,
                }).catch(() => {/* silent fail */ })
            })

            addAlertInternal(`${username} logged in successfully`, 'LOW', 'AUDIT')
        } catch (err) {
            // Backend may not be running — allow demo mode
            const mockUser: User & { session_token: string } = {
                id: 0,
                username,
                // Infer role from actual DB username patterns
                role: username.includes('admin') ? 'ADMIN'
                    : username.includes('dba') || username.includes('priv') ? 'PRIVILEGED'
                    : username.includes('vendor') ? 'VENDOR'
                    : 'EMPLOYEE',
                department: 'Demo',
                risk_level: 'LOW',
                status: 'ACTIVE',
                created_at: new Date().toISOString(),
                session_token: `demo-${Date.now()}`,
            }
            dispatch({ type: 'SET_CURRENT_USER', payload: mockUser })
            console.warn('[MAO-IR] Backend offline — running in demo mode', err)
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false })
        }
    }, [addAlertInternal])

    const logoutUser = useCallback(async () => {
        if (state.currentUser?.session_token) {
            await api.logout(state.currentUser.session_token).catch(() => { })
        }
        silentTracker.stop()
        dispatch({ type: 'SET_CURRENT_USER', payload: null })
    }, [state.currentUser])

    const loadUsers = useCallback(async () => {
        try {
            const users = await api.getUsers()
            dispatch({ type: 'SET_USERS', payload: users })
            users.forEach(u => {
                if (u.trustScore) {
                    dispatch({ type: 'SET_TRUST_SCORE', payload: { username: u.username, score: u.trustScore } })
                }
            })
        } catch {
            // Demo fallback users
            // Demo fallback users — MUST match actual DB seed in backend-services/src/services/db.js
            const demoUsers: (User & { trustScore?: TrustScore })[] = [
                { id: 1, username: 'rajesh_dba', role: 'PRIVILEGED', department: 'IT Infrastructure', risk_level: 'LOW', status: 'ACTIVE', created_at: new Date().toISOString(), trustScore: makeMockScore('rajesh_dba', 15, 'LOW') },
                { id: 2, username: 'ameya_admin', role: 'ADMIN', department: 'Cybersecurity', risk_level: 'LOW', status: 'ACTIVE', created_at: new Date().toISOString(), trustScore: makeMockScore('ameya_admin', 10, 'LOW') },
                { id: 3, username: 'tcs_vendor_01', role: 'VENDOR', department: 'External IT', risk_level: 'MEDIUM', status: 'ACTIVE', created_at: new Date().toISOString(), trustScore: makeMockScore('tcs_vendor_01', 30, 'MEDIUM') },
                { id: 4, username: 'priya_teller', role: 'EMPLOYEE', department: 'Retail Banking', risk_level: 'LOW', status: 'ACTIVE', created_at: new Date().toISOString(), trustScore: makeMockScore('priya_teller', 12, 'LOW') },
            ]
            dispatch({ type: 'SET_USERS', payload: demoUsers })
            demoUsers.forEach(u => {
                if (u.trustScore) dispatch({ type: 'SET_TRUST_SCORE', payload: { username: u.username, score: u.trustScore } })
            })
        }
    }, [])

    const runScenario = useCallback(async (scenario: string): Promise<Investigation> => {
        const result = await api.runSimulation(scenario)
        dispatch({ type: 'ADD_INVESTIGATION', payload: result })
        dispatch({ type: 'SET_LATEST_INVESTIGATION', payload: result })
        if (result.final_trust_score) {
            dispatch({ type: 'SET_TRUST_SCORE', payload: { username: result.user_id, score: result.final_trust_score } })
        }
        addAlertInternal(`Scenario "${scenario}" triggered investigation`, result.final_trust_score?.risk_level ?? 'HIGH', 'INVESTIGATION')
        return result
    }, [addAlertInternal])

    const quarantineUser = useCallback(async (username: string, reason: string) => {
        await api.quarantineUser(username, reason)
        dispatch({ type: 'UPDATE_USER_STATUS', payload: { username, status: 'QUARANTINED' } })
        addAlertInternal(`${username} quarantined: ${reason}`, 'CRITICAL', 'ALERT')
    }, [addAlertInternal])

    const restoreUser = useCallback(async (username: string) => {
        const result = await api.restoreUser(username)
        dispatch({ type: 'UPDATE_USER_STATUS', payload: { username, status: 'ACTIVE' } })
        if (result.newTrustScore) {
            dispatch({ type: 'SET_TRUST_SCORE', payload: { username, score: result.newTrustScore } })
        }
        addAlertInternal(`${username} restored to active status`, 'LOW', 'AUDIT')
    }, [addAlertInternal])

    return (
        <AppContext.Provider value={{ state, dispatch, loginUser, logoutUser, loadUsers, runScenario, quarantineUser, restoreUser, addAlert }}>
            {children}
        </AppContext.Provider>
    )
}

export function useApp() {
    const ctx = useContext(AppContext)
    if (!ctx) throw new Error('useApp must be used within AppProvider')
    return ctx
}

// ===== Helpers =====
function makeMockScore(username: string, score: number, risk_level: RiskLevel): TrustScore {
    return {
        user_id: username,
        score,
        confidence: 0.85,
        risk_level,
        timestamp: new Date().toISOString(),
        contributing_factors: {
            behavioral_score: Math.round(score * 0.9),
            contextual_score: Math.round(score * 0.8),
            privilege_score: Math.round(score * 1.1),
            attack_path_score: Math.round(score * 0.7),
            twin_deviation_score: Math.round(score * 0.85),
            trust_decay_score: Math.round(score * 0.95),
        },
        narrative: `Risk Score = ${score}\nReason:\n- User behavioral pattern matches baseline.\n- No suspicious access detected.`,
        recommended_action: score <= 30 ? 'ALLOW' : score <= 60 ? 'STEP_UP_AUTH' : score <= 80 ? 'RESTRICT' : 'QUARANTINE',
    }
}
