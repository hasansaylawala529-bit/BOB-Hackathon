import { AlertTriangle, Info, Zap, Activity } from 'lucide-react'
import type { RiskLevel } from '../types/telemetry.types'
import { useApp } from '../context/AppContext'

const ICONS = {
    CRITICAL: <Zap size={13} color="#ff4444" />,
    HIGH: <AlertTriangle size={13} color="#ff6b35" />,
    MEDIUM: <Info size={13} color="#ffaa00" />,
    LOW: <Activity size={13} color="#00ff88" />,
}

const BG: Record<RiskLevel, string> = {
    CRITICAL: 'rgba(255,68,68,0.08)',
    HIGH: 'rgba(255,107,53,0.08)',
    MEDIUM: 'rgba(255,170,0,0.06)',
    LOW: 'rgba(0,255,136,0.05)',
}
const BORDER: Record<RiskLevel, string> = {
    CRITICAL: 'rgba(255,68,68,0.25)',
    HIGH: 'rgba(255,107,53,0.25)',
    MEDIUM: 'rgba(255,170,0,0.2)',
    LOW: 'rgba(0,255,136,0.15)',
}

export default function AlertFeed() {
    const { state, dispatch } = useApp()
    const alerts = state.alerts.slice(0, 30)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Alert Feed
                    {alerts.length > 0 && (
                        <span style={{
                            marginLeft: 8, fontSize: 11, background: 'rgba(255,68,68,0.15)',
                            border: '1px solid rgba(255,68,68,0.3)', color: '#ff4444',
                            borderRadius: 10, padding: '1px 7px',
                        }}>{alerts.length}</span>
                    )}
                </h3>
                {alerts.length > 0 && (
                    <button
                        style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                        onClick={() => dispatch({ type: 'CLEAR_ALERTS' })}
                    >
                        Clear
                    </button>
                )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {alerts.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: 24 }}>
                        <Activity size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
                        No alerts — system nominal
                    </div>
                ) : (
                    alerts.map(alert => (
                        <div
                            key={alert.id}
                            className="animate-slide-in-right"
                            style={{
                                background: BG[alert.severity],
                                border: `1px solid ${BORDER[alert.severity]}`,
                                borderRadius: 8, padding: '8px 12px',
                                display: 'flex', alignItems: 'flex-start', gap: 8,
                            }}
                        >
                            <div style={{ marginTop: 2, flexShrink: 0 }}>{ICONS[alert.severity]}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4, wordBreak: 'break-word' }}>
                                    {alert.message}
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                                    {new Date(alert.timestamp).toLocaleTimeString('en-IN')}
                                    {' · '}
                                    <span style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{alert.type}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
