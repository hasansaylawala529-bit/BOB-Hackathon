import axios from 'axios'
import type {
    TelemetryPayload, TrustScore, TrustPassport,
    User, UserDetail, AuditLog, Investigation, TrustHistoryEntry
} from '../types/telemetry.types'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
})

function defaultFactors(score: number) {
    return {
        behavioral_score: Math.round(score * 0.9),
        contextual_score: Math.round(score * 0.8),
        privilege_score: Math.round(score * 0.7),
        attack_path_score: Math.round(score * 0.6),
        twin_deviation_score: Math.round(score * 0.85),
        trust_decay_score: Math.round(score * 0.95),
    }
}

function classifyRisk(score: number): TrustScore['risk_level'] {
    if (score <= 30) return 'LOW'
    if (score <= 60) return 'MEDIUM'
    if (score <= 80) return 'HIGH'
    return 'CRITICAL'
}

export function normalizeTrustScore(data: any, fallbackUsername = ''): TrustScore {
    const score = Number(data?.score ?? data?.trust_score ?? data?.trustScore ?? 0)
    return {
        user_id: String(data?.user_id ?? data?.username ?? fallbackUsername),
        score,
        confidence: Number(data?.confidence ?? data?.behavioral_confidence ?? 0.5),
        risk_level: (data?.risk_level ?? data?.riskLevel ?? classifyRisk(score)) as TrustScore['risk_level'],
        timestamp: data?.timestamp ?? data?.issued_at ?? new Date().toISOString(),
        contributing_factors: data?.contributing_factors ?? data?.factors ?? defaultFactors(score),
        narrative: data?.narrative ?? '',
        recommended_action: data?.recommended_action ?? data?.recommendedAction ?? (score <= 30 ? 'ALLOW' : score <= 60 ? 'STEP_UP_AUTH' : score <= 80 ? 'RESTRICT' : 'QUARANTINE'),
    }
}

export function normalizeTrustPassport(data: any): TrustPassport {
    return {
        passport_id: String(data?.passport_id ?? data?.passportId ?? data?.id ?? ''),
        user_id: String(data?.user_id ?? data?.username ?? ''),
        trust_score: Number(data?.trust_score ?? data?.trustScore ?? 0),
        behavioral_confidence: Number(data?.behavioral_confidence ?? data?.confidence ?? 0.5),
        device_trust: (data?.device_trust ?? 'UNKNOWN') as TrustPassport['device_trust'],
        contextual_risk: (data?.contextual_risk ?? 'LOW') as TrustPassport['contextual_risk'],
        verification_level: (data?.verification_level ?? 'BASIC') as TrustPassport['verification_level'],
        risk_level: (data?.risk_level ?? 'LOW') as TrustPassport['risk_level'],
        issued_at: data?.issued_at ?? new Date().toISOString(),
        expires_at: data?.expires_at ?? new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        signature: String(data?.signature ?? ''),
    }
}

export function normalizeUser(user: any): User & { trustScore?: TrustScore } {
    const username = String(user?.username ?? user?.user_id ?? '')
    return {
        id: Number(user?.id ?? 0),
        username,
        role: user?.role ?? 'EMPLOYEE',
        department: String(user?.department ?? 'Unknown'),
        risk_level: user?.risk_level ?? 'LOW',
        status: user?.status ?? 'ACTIVE',
        created_at: user?.created_at ?? new Date().toISOString(),
        trustScore: user?.trustScore
            ? normalizeTrustScore(user.trustScore, username)
            : user?.trust_score !== undefined
                ? normalizeTrustScore({
                    user_id: username,
                    score: user.trust_score,
                    confidence: user.trust_confidence,
                    risk_level: user.risk_level,
                    timestamp: user.timestamp,
                    narrative: user.narrative,
                }, username)
                : undefined,
    }
}

export function normalizeInvestigation(data: any): Investigation {
    const finalTrustSource = data?.final_trust_score ?? {
        user_id: data?.user_id ?? data?.username ?? '',
        score: data?.risk_score !== undefined ? Math.max(0, 100 - Number(data.risk_score)) : 0,
        confidence: data?.confidence ?? 0.5,
        risk_level: data?.risk_level ?? classifyRisk(data?.risk_score ? Number(data.risk_score) : 0),
        timestamp: data?.started_at ?? data?.created_at ?? new Date().toISOString(),
        contributing_factors: data?.contributing_factors ?? defaultFactors(data?.score ?? 0),
        narrative: data?.narrative ?? '',
        recommended_action: data?.recommended_action ?? 'ALLOW',
    }

    const findings = data?.findings ?? {}
    return {
        id: String(data?.id ?? data?.investigation_id ?? data?.investigationId ?? ''),
        user_id: String(data?.user_id ?? data?.username ?? ''),
        trigger_event: String(data?.trigger_event ?? data?.scenario ?? 'manual'),
        status: (data?.status ?? (data?.completed_at ? 'COMPLETED' : 'RUNNING')) as Investigation['status'],
        agents_involved: Array.isArray(data?.agents_involved)
            ? data.agents_involved
            : String(data?.agents_involved ?? '').split(',').filter(Boolean),
        findings,
        final_trust_score: normalizeTrustScore(finalTrustSource, String(data?.user_id ?? data?.username ?? '')),
        response_action: typeof data?.response_action === 'object' && data?.response_action
            ? data.response_action
            : { action: String(data?.response_action ?? finalTrustSource.recommended_action ?? 'ALLOW'), details: {} },
        started_at: data?.started_at ?? data?.created_at ?? new Date().toISOString(),
        completed_at: data?.completed_at ?? data?.ended_at ?? new Date().toISOString(),
    }
}

function normalizeAuditLog(log: any): AuditLog {
    return {
        id: String(log?.id ?? log?.log_id ?? ''),
        timestamp: log?.timestamp ?? new Date().toISOString(),
        username: String(log?.username ?? ''),
        action: String(log?.action ?? ''),
        resource: String(log?.resource ?? ''),
        riskScore: Number(log?.riskScore ?? log?.risk_score ?? 0),
        decision: String(log?.decision ?? 'ALLOW'),
        narrative: String(log?.narrative ?? ''),
        details: log?.details ?? {},
    }
}

// ===== Auth =====
export const login = (username: string, deviceFingerprint?: string) =>
    api.post<{ success: boolean; user: User; session: { id: string; session_token: string }; trustPassport: TrustPassport }>(
        '/api/auth/login',
        { username, device_fingerprint: deviceFingerprint, geo_location: 'Mumbai, India' }
    ).then(r => ({
        ...r.data,
        user: normalizeUser(r.data.user),
        session: {
            ...r.data.session,
            session_token: r.data.session.session_token ?? (r.data.session as any).token ?? r.data.session.id,
        },
        trustPassport: normalizeTrustPassport(r.data.trustPassport),
    }))

export const logout = (session_id: string) =>
    api.post('/api/auth/logout', { session_id }).then(r => r.data)

// ===== Users =====
export const getUsers = () =>
    api.get<{ users: (User & { trustScore?: TrustScore })[] }>('/api/users').then(r => r.data.users.map(normalizeUser))

export const getUser = (username: string) =>
    api.get<{ user: UserDetail; trustScore: TrustScore; digitalTwin: unknown; sessions: unknown[]; recentActions: unknown[] }>(
        `/api/users/${username}`
    ).then(r => ({
        ...r.data,
        user: normalizeUser(r.data.user),
        trustScore: r.data.trustScore ? normalizeTrustScore(r.data.trustScore, username) : undefined,
    }))

export const simulateAction = (username: string, action: { action_type: string; resource: string; query_text?: string }) =>
    api.post<{ decision: string; trustScore: TrustScore; investigation?: Investigation }>(
        `/api/users/${username}/action`, action
    ).then(r => r.data)

export const quarantineUser = (username: string, reason: string) =>
    api.post(`/api/users/${username}/quarantine`, { reason }).then(r => r.data)

export const restoreUser = (username: string) =>
    api.post<{ success: boolean; newTrustScore: TrustScore }>(`/api/users/${username}/restore`).then(r => r.data)

// ===== Telemetry =====
export const ingestTelemetry = (payload: TelemetryPayload) =>
    api.post<{ received: boolean; samples: number }>('/api/telemetry/ingest', payload).then(r => r.data)

// ===== Trust =====
export const getTrustScore = (userId: string | number) =>
    api.get<any>(`/api/trust/score/${userId}`).then(r => normalizeTrustScore(r.data, String(userId)))

export const getTrustHistory = (userId: string | number, limit = 50) =>
    api.get<{ history: TrustHistoryEntry[] }>(`/api/trust/history/${userId}?limit=${limit}`).then(r => r.data.history)

export const getTrustPassport = (userId: string | number) =>
    api.get<any>(`/api/trust/passport/${userId}`).then(r => normalizeTrustPassport(r.data))

export const recalculateTrust = (username: string, trigger?: string) =>
    api.post<TrustScore>('/api/trust/recalculate', { username, trigger }).then(r => r.data)

// ===== Audit =====
export const getAuditLogs = (params?: { page?: number; limit?: number; action?: string; username?: string }) =>
    api.get<{ logs: AuditLog[]; total: number; page: number }>('/api/audit/logs', { params }).then(r => ({
        ...r.data,
        logs: (r.data.logs ?? []).map(normalizeAuditLog),
    }))

export const getInvestigations = () =>
    api.get<{ investigations: Investigation[] }>('/api/audit/investigations').then(r => r.data.investigations.map(normalizeInvestigation))

export const getInvestigation = (id: string) =>
    api.get<any>(`/api/audit/investigations/${id}`).then(r => normalizeInvestigation(r.data))

// ===== Orchestrator =====
export const runSimulation = (scenario: string) =>
    api.post<any>('/api/orchestrator/simulate', { scenario }).then(r => normalizeInvestigation(r.data))

export const triggerInvestigation = (username: string, trigger_event: string, context?: Record<string, unknown>) =>
    api.post<any>('/api/orchestrator/investigate', { username, trigger_event, context }).then(r => normalizeInvestigation(r.data))

export default api
