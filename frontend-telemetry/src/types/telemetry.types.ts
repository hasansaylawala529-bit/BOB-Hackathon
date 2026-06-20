// ===== Shared Data Contracts (matches backend + AI orchestrator contracts) =====

export type UserRole = 'ADMIN' | 'PRIVILEGED' | 'EMPLOYEE' | 'VENDOR'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type UserStatus = 'ACTIVE' | 'QUARANTINED' | 'LOCKED'
export type TrustAction = 'ALLOW' | 'STEP_UP_AUTH' | 'RESTRICT' | 'QUARANTINE'
export type DeviceTrust = 'TRUSTED' | 'UNKNOWN' | 'SUSPICIOUS'
export type VerificationLevel = 'BASIC' | 'MFA' | 'BIOMETRIC' | 'MANAGER_APPROVED'

export interface User {
    id: number
    username: string
    role: UserRole
    department: string
    risk_level: RiskLevel
    status: UserStatus
    created_at: string
}

export interface KeystrokeEvent {
    dwell_time_ms: number
    flight_time_ms: number
    timestamp?: number
}

export interface MouseEventData {
    velocity: number
    acceleration: number
    path_curvature: number
    timestamp?: number
}

export interface ScrollEventData {
    speed: number
    direction: 'UP' | 'DOWN'
    duration_ms: number
    timestamp?: number
}

export interface SessionVelocity {
    clicks_per_minute: number
    pages_per_minute: number
    idle_time_ms: number
}

export interface BehavioralData {
    keystroke_events: KeystrokeEvent[]
    mouse_events: MouseEventData[]
    scroll_events: ScrollEventData[]
    session_velocity?: SessionVelocity
}

export interface TelemetryPayload {
    username: string
    session_id: string
    timestamp: string
    device_fingerprint?: string
    ip_address?: string
    geo_location?: string
    behavioral_data: BehavioralData
}

export interface TrustContributingFactors {
    behavioral_score: number
    contextual_score: number
    privilege_score: number
    attack_path_score: number
    twin_deviation_score: number
    trust_decay_score: number
}

export interface TrustScore {
    user_id: string
    score: number
    confidence: number
    risk_level: RiskLevel
    timestamp: string
    contributing_factors: TrustContributingFactors
    narrative: string
    recommended_action: TrustAction
}

export interface TrustPassport {
    passport_id: string
    user_id: string
    trust_score: number
    behavioral_confidence: number
    device_trust: DeviceTrust
    contextual_risk: RiskLevel
    verification_level: VerificationLevel
    risk_level: RiskLevel
    issued_at: string
    expires_at: string
    signature: string
}

export interface AgentFindings {
    behavioral_analysis: {
        anomaly_score: number
        confidence: number
        deviations: Array<{ metric: string; expected: number; actual: number; z_score: number; severity: string }>
    }
    contextual_analysis: {
        context_risk_score: number
        risk_factors: Array<{ factor: string; value: string; risk: number; description: string }>
    }
    privilege_audit: {
        privilege_risk_score: number
        violations: Array<{ type: string; description: string; severity: string }>
        banking_impact: number
    }
    attack_path: {
        escalation_paths: Array<{ from: string; to: string; via: string; risk: number }>
        lateral_movement_risk: number
        blast_radius: number
    }
    twin_deviation: {
        deviation_score: number
        expected_vs_actual: Record<string, unknown>
    }
    trust_decay: {
        current_trust: number
        decay_rate: number
        time_since_verification_min: number
    }
}

export interface Investigation {
    id: string
    user_id: string
    trigger_event: string
    status: 'RUNNING' | 'COMPLETED' | 'ESCALATED'
    agents_involved: string[]
    findings: AgentFindings
    final_trust_score: TrustScore
    response_action: { action: string; details: Record<string, unknown> }
    started_at: string
    completed_at: string
}

export interface AuditLog {
    id: string
    timestamp: string
    username: string
    action: string
    resource: string
    riskScore: number
    decision: string
    narrative: string
    details: Record<string, unknown>
}

export interface BiometricBaseline {
    keystroke_dwell_mean: number
    keystroke_flight_mean: number
    mouse_speed_mean: number
    scroll_speed_mean: number
}

export interface DigitalTwinProfile {
    username: string
    role: UserRole
    expected_hours: number[]
    expected_resources: string[]
    typical_db_queries: string[]
    work_patterns: { avg_session_duration_min: number; avg_queries_per_session: number }
    biometric_baseline: BiometricBaseline
}

export interface UserDetail extends User {
    trustScore?: TrustScore
    digitalTwin?: DigitalTwinProfile
    sessions?: UserSession[]
    recentActions?: PrivilegedAction[]
}

export interface UserSession {
    id: number
    session_token: string
    ip_address: string
    device_fingerprint: string
    geo_location: string
    login_at: string
    last_activity: string
    status: 'ACTIVE' | 'EXPIRED' | 'QUARANTINED'
}

export interface PrivilegedAction {
    id: number
    action_type: string
    resource: string
    query_text: string
    risk_impact: number
    decision: string
    timestamp: string
}

export interface TrustHistoryEntry {
    score: number
    timestamp: string
    risk_level: RiskLevel
}

// WebSocket message types
export type WSMessageType = 'TRUST_UPDATE' | 'ALERT' | 'INVESTIGATION' | 'AUDIT'

export interface WSMessage {
    type: WSMessageType
    data: TrustScore | Investigation | AuditLog | { message: string; severity: RiskLevel }
}
