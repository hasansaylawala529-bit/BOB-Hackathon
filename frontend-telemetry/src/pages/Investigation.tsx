import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useApp } from '../context/AppContext'
import * as api from '../services/api'
import { Zap, CheckCircle } from 'lucide-react'

export default function Investigation() {
    const { state } = useApp()
    const [investigations, setInvestigations] = useState<any[]>([])
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.getInvestigations()
            .then(data => {
                setInvestigations(data)
                if (data.length > 0) setSelectedId(data[0].id)
            })
            .catch(err => {
                console.error('Failed to load investigations:', err)
                const demoUser = state.currentUser?.username ?? 'john_priv'
                const demoInvestigations = [
                    {
                        id: 'inv-demo-001',
                        user_id: demoUser,
                        trigger_event: 'privileged_action:DB_QUERY',
                        status: 'COMPLETED',
                        agents_involved: ['behavioral_profiler', 'contextualizer', 'privilege_auditor'],
                        findings: {
                            behavioral_analysis: { anomaly_score: 12, confidence: 0.82 },
                            privilege_audit: { privilege_risk_score: 18, violations: [] },
                        },
                        final_trust_score: {
                            user_id: demoUser,
                            score: 15,
                            confidence: 0.82,
                            risk_level: 'LOW',
                            timestamp: new Date().toISOString(),
                            contributing_factors: {
                                behavioral_score: 12,
                                contextual_score: 18,
                                privilege_score: 18,
                                attack_path_score: 8,
                                twin_deviation_score: 12,
                                trust_decay_score: 14,
                            },
                            narrative: 'Risk Score = 15\n- Demo fallback investigation loaded while backend is offline.',
                            recommended_action: 'ALLOW',
                        },
                        response_action: { action: 'ALLOW', details: {} },
                        started_at: new Date(Date.now() - 15 * 60000).toISOString(),
                        completed_at: new Date(Date.now() - 10 * 60000).toISOString(),
                    },
                ]
                setInvestigations(demoInvestigations)
                setSelectedId(demoInvestigations[0].id)
            })
            .finally(() => setLoading(false))
    }, [])

    const selected = investigations.find(i => (i.id ?? i.investigation_id) === selectedId)

    const flattenFindings = (findings: any): string[] => {
        if (!findings) return []
        if (Array.isArray(findings)) return findings.map(item => typeof item === 'string' ? item : JSON.stringify(item))
        if (typeof findings === 'string') return [findings]
        if (typeof findings !== 'object') return [String(findings)]

        return Object.entries(findings).flatMap(([section, value]) => {
            if (Array.isArray(value)) {
                return value.map(item => typeof item === 'string' ? `${section}: ${item}` : `${section}: ${JSON.stringify(item)}`)
            }

            if (value && typeof value === 'object') {
                return [`${section}: ${Object.entries(value).map(([key, entryValue]) => `${key}=${typeof entryValue === 'string' ? entryValue : JSON.stringify(entryValue)}`).join(', ')}`]
            }

            return [`${section}: ${String(value)}`]
        })
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'var(--accent-green)'
            case 'IN_PROGRESS': return 'var(--accent-amber)'
            case 'FAILED': return 'var(--accent-red)'
            default: return 'var(--text-secondary)'
        }
    }

    const getRiskLevelColor = (level: string) => {
        switch (level) {
            case 'LOW': return 'var(--accent-green)'
            case 'MEDIUM': return 'var(--accent-amber)'
            case 'HIGH': return 'var(--accent-orange)'
            case 'CRITICAL': return 'var(--accent-red)'
            default: return 'var(--text-secondary)'
        }
    }

    return (
        <div className="flex w-full h-full">
            {/* Sidebar */}
            <div className="w-60 border-r" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
                <Sidebar />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <Header />

                {/* Content */}
                <div className="flex-1 overflow-auto" style={{ background: 'var(--bg-primary)' }}>
                    <div className="p-6">
                        {loading ? (
                            <div className="flex items-center justify-center h-96">
                                <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" 
                                    style={{ borderColor: 'var(--accent-blue)' }} />
                            </div>
                        ) : investigations.length === 0 ? (
                            <div 
                                className="h-96 flex flex-col items-center justify-center rounded-lg border"
                                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                            >
                                <Zap size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.3 }} />
                                <p style={{ color: 'var(--text-muted)' }}>No investigations yet</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-6">
                                {/* Investigation List */}
                                <div 
                                    className="p-4 rounded-lg border space-y-2 h-96 overflow-y-auto"
                                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                                >
                                    <h3 style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>
                                        Autonomous Investigations
                                    </h3>
                                    {investigations.map(inv => (
                                        <button
                                            key={inv.id ?? inv.investigation_id}
                                            onClick={() => setSelectedId(inv.id ?? inv.investigation_id)}
                                            className="w-full text-left p-3 rounded-lg border transition"
                                            style={{
                                                background: selectedId === (inv.id ?? inv.investigation_id) ? 'rgba(0,212,255,0.1)' : 'transparent',
                                                border: selectedId === (inv.id ?? inv.investigation_id) ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.05)',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                                {inv.user_id}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                                                {inv.trigger_event}
                                            </div>
                                            <div 
                                                className="text-xs px-2 py-1 rounded inline-block"
                                                style={{
                                                    background: `${getStatusColor(inv.status)}20`,
                                                    color: getStatusColor(inv.status),
                                                }}
                                            >
                                                {inv.status}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Investigation Details */}
                                {selected && (
                                    <div className="col-span-2 space-y-4">
                                        {/* Header */}
                                        <div 
                                            className="p-4 rounded-lg border"
                                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <h2 style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 700 }}>
                                                        Investigation {(selected.id ?? selected.investigation_id).slice(0, 8)}
                                                    </h2>
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
                                                        User: {selected.user_id}
                                                    </p>
                                                </div>
                                                <div 
                                                    className="px-3 py-1 rounded-lg text-sm font-semibold"
                                                    style={{
                                                        background: `${getStatusColor(selected.status)}20`,
                                                        color: getStatusColor(selected.status),
                                                    }}
                                                >
                                                    {selected.status}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 mt-4">
                                                <div>
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '11px' }}>RISK LEVEL</p>
                                                    <p style={{ color: getRiskLevelColor(selected.risk_level ?? selected.final_trust_score?.risk_level ?? 'MEDIUM'), fontSize: '14px', fontWeight: 700, marginTop: '4px' }}>
                                                        {selected.risk_level ?? selected.final_trust_score?.risk_level ?? 'MEDIUM'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '11px' }}>CONFIDENCE</p>
                                                    <p style={{ color: 'var(--accent-blue)', fontSize: '14px', fontWeight: 700, marginTop: '4px' }}>
                                                        {Math.round((selected.confidence ?? selected.final_trust_score?.confidence ?? 0.5) * 100)}%
                                                    </p>
                                                </div>
                                                <div>
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '11px' }}>TRIGGER</p>
                                                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                                                        {selected.trigger_event}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Findings */}
                                        <div 
                                            className="p-4 rounded-lg border"
                                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                                        >
                                            <h3 style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>
                                                Agentic Findings
                                            </h3>
                                            <div className="space-y-3">
                                                {flattenFindings(selected.findings).map((finding: string, i: number) => (
                                                    <div key={i} className="flex gap-3">
                                                        <CheckCircle size={14} style={{ color: 'var(--accent-green)', flexShrink: 0, marginTop: '2px' }} />
                                                        <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                                                            {finding}
                                                        </p>
                                                    </div>
                                                ))}
                                                {flattenFindings(selected.findings).length === 0 && (
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No findings recorded</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Timeline */}
                                        <div 
                                            className="p-4 rounded-lg border"
                                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                                        >
                                            <h3 style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>
                                                Timeline
                                            </h3>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span style={{ color: 'var(--text-secondary)' }}>Started:</span>
                                                    <span style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>
                                                        {new Date(selected.started_at ?? selected.created_at ?? Date.now()).toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                                {(selected.completed_at || selected.completedAt) && (
                                                    <div className="flex justify-between">
                                                        <span style={{ color: 'var(--text-secondary)' }}>Completed:</span>
                                                        <span style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>
                                                            {new Date(selected.completed_at ?? selected.completedAt).toLocaleString('en-IN')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
