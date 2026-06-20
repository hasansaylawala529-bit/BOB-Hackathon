import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { TrustHistoryEntry, RiskLevel } from '../types/telemetry.types'

const RISK_COLORS: Record<RiskLevel, string> = {
    LOW: '#00ff88', MEDIUM: '#ffaa00', HIGH: '#ff6b35', CRITICAL: '#ff4444',
}

interface Props {
    history: TrustHistoryEntry[]
    color?: string
    height?: number
    showAxes?: boolean
    username?: string
}

// Generate mock decay data if history is empty
function generateMockHistory(): TrustHistoryEntry[] {
    const now = Date.now()
    const items: TrustHistoryEntry[] = []
    let score = 15
    for (let i = 40; i >= 0; i--) {
        const jitter = (Math.random() - 0.4) * 8
        score = Math.max(0, Math.min(100, score + jitter))
        const risk_level: RiskLevel = score <= 30 ? 'LOW' : score <= 60 ? 'MEDIUM' : score <= 80 ? 'HIGH' : 'CRITICAL'
        items.push({
            score: Math.round(score),
            risk_level,
            timestamp: new Date(now - i * 30000).toISOString(),
        })
    }
    return items
}

export default function TrustDecayChart({ history, color = '#00d4ff', height = 180, showAxes = true, username }: Props) {
    const data = history.length > 0 ? history : generateMockHistory()

    const chartData = data.map(h => ({
        score: h.score,
        risk_level: h.risk_level,
        time: new Date(h.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        color: RISK_COLORS[h.risk_level],
    }))

    return (
        <div>
            {username && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                    Trust Decay — <span style={{ color: 'var(--accent-blue)' }}>{username}</span>
                </div>
            )}
            <ResponsiveContainer width="100%" height={height}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: showAxes ? 0 : -30 }}>
                    {showAxes && (
                        <XAxis
                            dataKey="time"
                            tick={{ fontSize: 10, fill: '#4a5568' }}
                            axisLine={{ stroke: 'rgba(0,212,255,0.1)' }}
                            tickLine={false}
                            interval="preserveStartEnd"
                        />
                    )}
                    {showAxes && (
                        <YAxis
                            domain={[0, 100]}
                            tick={{ fontSize: 10, fill: '#4a5568' }}
                            axisLine={false}
                            tickLine={false}
                            width={28}
                        />
                    )}
                    <Tooltip
                        contentStyle={{ background: '#111736', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: '#94a3b8' }}
                        formatter={(val: number, _name: string, entry: any) => [
                            <span style={{ color: RISK_COLORS[(entry?.payload?.risk_level ?? 'LOW') as RiskLevel] }}>{val} ({entry?.payload?.risk_level ?? 'LOW'})</span>,
                            'Risk Score',
                        ]}
                    />
                    <ReferenceLine y={30} stroke="rgba(0,255,136,0.2)" strokeDasharray="3 3" />
                    <ReferenceLine y={60} stroke="rgba(255,170,0,0.2)" strokeDasharray="3 3" />
                    <ReferenceLine y={80} stroke="rgba(255,68,68,0.2)" strokeDasharray="3 3" />
                    <Line
                        type="monotone"
                        dataKey="score"
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: color, stroke: 'var(--bg-primary)', strokeWidth: 2 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
