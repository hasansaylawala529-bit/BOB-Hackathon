import { useNavigate } from 'react-router-dom'
import type { User, TrustScore, RiskLevel } from '../types/telemetry.types'
import TrustScoreGauge from './TrustScoreGauge'

const ROLE_COLORS: Record<string, string> = {
    ADMIN: 'var(--accent-red)',
    PRIVILEGED: 'var(--accent-amber)',
    EMPLOYEE: 'var(--accent-blue)',
    VENDOR: 'var(--accent-purple)',
}

const STATUS_COLORS: Record<string, string> = {
    ACTIVE: 'var(--accent-green)',
    QUARANTINED: 'var(--accent-red)',
    LOCKED: 'var(--accent-amber)',
}

interface Props {
    user: User
    trustScore?: TrustScore
    compact?: boolean
}

function getRiskLevel(score?: TrustScore): RiskLevel {
    return score?.risk_level ?? 'LOW'
}

export default function UserCard({ user, trustScore, compact = false }: Props) {
    const navigate = useNavigate()
    const riskLevel = getRiskLevel(trustScore)
    const score = trustScore?.score ?? 0

    const getBorderColor = (level: RiskLevel) => {
        const map: Record<RiskLevel, string> = {
            LOW: 'rgba(0,255,136,0.15)',
            MEDIUM: 'rgba(255,170,0,0.2)',
            HIGH: 'rgba(255,107,53,0.25)',
            CRITICAL: 'rgba(255,68,68,0.35)',
        }
        return map[level]
    }

    return (
        <div
            className="card"
            onClick={() => navigate(`/users/${user.username}`)}
            style={{
                cursor: 'pointer', border: `1px solid ${getBorderColor(riskLevel)}`,
                borderRadius: 12, padding: compact ? '12px 14px' : '16px 18px',
                transition: 'all 0.2s ease',
                background: user.status === 'QUARANTINED' ? 'rgba(255,68,68,0.06)' : 'var(--bg-card)',
            }}
        >
            {compact ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <TrustScoreGauge score={score} risk_level={riskLevel} size={60} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{user.username}</div>
                        <div style={{ fontSize: 11, color: ROLE_COLORS[user.role] ?? 'var(--text-secondary)', fontWeight: 500, marginBottom: 2 }}>{user.role}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.department}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: STATUS_COLORS[user.status] ?? 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                            {user.status}
                        </div>
                    </div>
                </div>
            ) : (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{user.username}</div>
                            <span style={{
                                display: 'inline-block',
                                fontSize: 10, fontWeight: 600,
                                background: `${ROLE_COLORS[user.role]}20`,
                                border: `1px solid ${ROLE_COLORS[user.role]}50`,
                                color: ROLE_COLORS[user.role],
                                borderRadius: 4, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: 0.5,
                            }}>{user.role}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 11, color: STATUS_COLORS[user.status], fontWeight: 600, textTransform: 'uppercase' }}>
                                {user.status}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{user.department}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <TrustScoreGauge score={score} risk_level={riskLevel} size={120} />
                    </div>
                    {trustScore?.narrative && (
                        <div style={{
                            marginTop: 12, fontSize: 11, color: 'var(--text-muted)',
                            background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '8px 10px',
                            lineHeight: 1.5, maxHeight: 60, overflow: 'hidden',
                        }}>
                            {trustScore.narrative.split('\n')[0]}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
