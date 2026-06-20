import { Zap, CheckCircle, AlertCircle } from 'lucide-react'

const WORKFLOW_STAGES = [
    {
        stage: 'Behavioral Profiler',
        status: 'completed',
        icon: CheckCircle,
        description: 'Keystroke + mouse dynamics analyzed',
    },
    {
        stage: 'Contextualizer',
        status: 'completed',
        icon: CheckCircle,
        description: 'Device, geo, time context extracted',
    },
    {
        stage: 'Privilege Auditor',
        status: 'in_progress',
        icon: Zap,
        description: 'PAM + resource access audit',
    },
    {
        stage: 'Attack Path Agent',
        status: 'pending',
        icon: AlertCircle,
        description: 'Identity graph vulnerability scan',
    },
    {
        stage: 'Trust Scorer',
        status: 'pending',
        icon: AlertCircle,
        description: 'Aggregated risk decision',
    },
]

export default function AgentWorkflow() {
    return (
        <div className="w-full">
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                LangGraph Agent Pipeline
            </div>

            <div className="space-y-3">
                {WORKFLOW_STAGES.map((stage, idx) => {
                    const Icon = stage.icon
                    const statusColor = stage.status === 'completed' ? 'var(--accent-green)' : stage.status === 'in_progress' ? 'var(--accent-amber)' : 'var(--text-muted)'
                    const stageBg = stage.status === 'completed' ? 'rgba(0,255,136,0.08)' : stage.status === 'in_progress' ? 'rgba(255,170,0,0.08)' : 'rgba(255,255,255,0.02)'
                    const stageBorder = stage.status === 'completed' ? 'rgba(0,255,136,0.2)' : stage.status === 'in_progress' ? 'rgba(255,170,0,0.2)' : 'rgba(255,255,255,0.08)'

                    return (
                        <div key={idx} className="flex gap-3 items-start">
                            {/* Connector line */}
                            {idx < WORKFLOW_STAGES.length - 1 && (
                                <div
                                    style={{
                                        width: '2px',
                                        height: '24px',
                                        background: stage.status === 'completed' ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)',
                                        marginLeft: '12px',
                                        marginTop: '-4px',
                                    }}
                                />
                            )}

                            {/* Stage box */}
                            <div
                                className="flex-1 p-3 rounded-lg border transition"
                                style={{
                                    background: stageBg,
                                    border: `1px solid ${stageBorder}`,
                                    marginLeft: idx === 0 ? '0' : '0',
                                }}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Icon size={14} color={statusColor} />
                                    <span style={{ color: statusColor, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {stage.stage}
                                    </span>
                                    <span 
                                        style={{
                                            fontSize: '10px',
                                            color: statusColor,
                                            textTransform: 'capitalize',
                                            opacity: 0.7,
                                            marginLeft: 'auto',
                                        }}
                                    >
                                        {stage.status}
                                    </span>
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '20px' }}>
                                    {stage.description}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Summary */}
            <div 
                className="mt-4 p-3 rounded-lg border"
                style={{
                    background: 'rgba(255,170,0,0.08)',
                    border: '1px solid rgba(255,170,0,0.2)',
                }}
            >
                <p style={{ color: 'var(--accent-amber)', fontSize: '12px', fontWeight: 600 }}>
                    ⚡ Pipeline in progress — 2 agents active, 3 awaiting
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>
                    ETA: 4.2s — High confidence verdict expected
                </p>
            </div>
        </div>
    )
}
