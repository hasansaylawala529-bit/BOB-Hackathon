import { Brain, AlertTriangle, TrendingUp } from 'lucide-react'
import type { TrustScore, RiskLevel } from '../types/telemetry.types'

const RISK_COLORS: Record<RiskLevel, string> = {
    LOW: '#00ff88', MEDIUM: '#ffaa00', HIGH: '#ff6b35', CRITICAL: '#ff4444',
}

interface Props {
    trustScore: TrustScore
}

export default function RiskNarrative({ trustScore }: Props) {
    const color = RISK_COLORS[trustScore.risk_level]
    const lines = trustScore.narrative?.split('\n').filter(Boolean) ?? []

    const factors = [
        { label: 'Behavioral', value: trustScore.contributing_factors.behavioral_score, key: 'behavioral' },
        { label: 'Contextual', value: trustScore.contributing_factors.contextual_score, key: 'contextual' },
        { label: 'Privilege', value: trustScore.contributing_factors.privilege_score, key: 'privilege' },
        { label: 'Attack Path', value: trustScore.contributing_factors.attack_path_score, key: 'attack' },
        { label: 'Twin Deviation', value: trustScore.contributing_factors.twin_deviation_score, key: 'twin' },
        { label: 'Trust Decay', value: trustScore.contributing_factors.trust_decay_score, key: 'decay' },
    ]

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: `${color}12`, border: `1px solid ${color}30`,
                borderRadius: 10, padding: '10px 14px',
            }}>
                <Brain size={18} color={color} />
                <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color }}>
                        Agentic Risk Narrative · Score {trustScore.score}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Confidence: {Math.round(trustScore.confidence * 100)}% · Action: {trustScore.recommended_action}
                    </div>
                </div>
            </div>

            {/* Narrative text */}
            <div style={{
                background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '12px 14px',
                border: '1px solid rgba(255,255,255,0.05)',
            }}>
                {lines.map((line, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: i < lines.length - 1 ? 8 : 0 }}>
                        {line.startsWith('-') && (
                            <AlertTriangle size={12} color={color} style={{ marginTop: 3, flexShrink: 0 }} />
                        )}
                        <span style={{
                            fontSize: 12, color: line.startsWith('Risk') ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontWeight: line.startsWith('Risk') ? 600 : 400,
                            lineHeight: 1.5,
                            fontFamily: line.startsWith('Risk') ? 'JetBrains Mono, monospace' : 'inherit',
                        }}>
                            {line.replace(/^-\s*/, '')}
                        </span>
                    </div>
                ))}
                {lines.length === 0 && (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No narrative available</span>
                )}
            </div>

            {/* Contributing factors */}
            <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    <TrendingUp size={11} style={{ marginRight: 5 }} />
                    Contributing Factors
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {factors.map(f => {
                        const barColor = f.value <= 30 ? '#00ff88' : f.value <= 60 ? '#ffaa00' : f.value <= 80 ? '#ff6b35' : '#ff4444'
                        return (
                            <div key={f.key} style={{
                                background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '8px 10px',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{f.label}</span>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: barColor, fontFamily: 'JetBrains Mono, monospace' }}>{f.value}</span>
                                </div>
                                <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                                    <div style={{ width: `${f.value}%`, height: '100%', background: barColor, borderRadius: 2, transition: 'width 0.5s ease' }} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
