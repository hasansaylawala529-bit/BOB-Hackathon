import { Bell, Zap, Shield } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useLocation } from 'react-router-dom'

const PAGE_TITLES: Record<string, string> = {
    '/dashboard': 'SOC Command Center',
    '/users': 'Identity Profiles',
    '/investigation': 'Autonomous Investigations',
    '/audit': 'Audit Log',
}

export default function Header() {
    const { state } = useApp()
    const location = useLocation()
    const title = PAGE_TITLES[location.pathname] ?? 'MAO-IR Platform'

    const criticalCount = state.alerts.filter(a => a.severity === 'CRITICAL').length
    const highCount = state.alerts.filter(a => a.severity === 'HIGH').length

    return (
        <header style={{
            height: 60,
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 24px',
            position: 'sticky', top: 0, zIndex: 40,
        }}>
            {/* Page Title */}
            <div>
                <h1 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{title}</h1>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Bank of Baroda · Multi-Agent Orchestration for Identity Risk
                </div>
            </div>

            {/* Right side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Alert badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {criticalCount > 0 && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            background: 'rgba(255,68,68,0.12)', border: '1px solid rgba(255,68,68,0.3)',
                            borderRadius: 20, padding: '3px 10px',
                        }}>
                            <Zap size={11} color="var(--accent-red)" className="animate-pulse-glow" />
                            <span style={{ fontSize: 11, color: 'var(--accent-red)', fontWeight: 600 }}>{criticalCount} CRITICAL</span>
                        </div>
                    )}
                    {highCount > 0 && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.3)',
                            borderRadius: 20, padding: '3px 10px',
                        }}>
                            <Bell size={11} color="var(--accent-orange)" />
                            <span style={{ fontSize: 11, color: 'var(--accent-orange)', fontWeight: 600 }}>{highCount} HIGH</span>
                        </div>
                    )}
                </div>

                {/* CARTA badge */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)',
                    borderRadius: 20, padding: '4px 12px',
                }}>
                    <Shield size={12} color="var(--accent-blue)" />
                    <span style={{ fontSize: 11, color: 'var(--accent-blue)', fontWeight: 500 }}>Zero Trust · CARTA</span>
                </div>

                {/* Time */}
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
            </div>
        </header>
    )
}
