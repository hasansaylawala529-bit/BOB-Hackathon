import type { RiskLevel } from '../types/telemetry.types'

interface Props {
    score: number
    risk_level: RiskLevel
    size?: number
    label?: string
}

const RISK_COLORS: Record<RiskLevel, string> = {
    LOW: '#00ff88',
    MEDIUM: '#ffaa00',
    HIGH: '#ff6b35',
    CRITICAL: '#ff4444',
}

export default function TrustScoreGauge({ score, risk_level, size = 140, label }: Props) {
    const color = RISK_COLORS[risk_level]
    const strokeWidth = size * 0.075
    const radius = (size - strokeWidth * 2) / 2
    const cx = size / 2
    const cy = size / 2

    // Arc from -225deg to +45deg (270deg sweep)
    const startAngle = -225
    const sweepAngle = 270
    const clampedScore = Math.max(0, Math.min(100, score))
    const angle = startAngle + (sweepAngle * clampedScore) / 100

    const toRad = (deg: number) => (deg * Math.PI) / 180
    const arcX = (deg: number) => cx + radius * Math.cos(toRad(deg))
    const arcY = (deg: number) => cy + radius * Math.sin(toRad(deg))

    // Background arc
    const bgStart = { x: arcX(startAngle), y: arcY(startAngle) }
    const bgEnd = { x: arcX(startAngle + sweepAngle), y: arcY(startAngle + sweepAngle) }
    const bgPath = `M ${bgStart.x} ${bgStart.y} A ${radius} ${radius} 0 1 1 ${bgEnd.x} ${bgEnd.y}`

    // Score arc
    const scoreStart = { x: arcX(startAngle), y: arcY(startAngle) }
    const scoreEnd = { x: arcX(angle), y: arcY(angle) }
    const largeArc = (sweepAngle * clampedScore) / 100 > 180 ? 1 : 0
    const scorePath = clampedScore > 0
        ? `M ${scoreStart.x} ${scoreStart.y} A ${radius} ${radius} 0 ${largeArc} 1 ${scoreEnd.x} ${scoreEnd.y}`
        : ''

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ position: 'relative', width: size, height: size }}>
                <svg width={size} height={size} style={{ filter: `drop-shadow(0 0 8px ${color}44)` }}>
                    {/* Outer ring decorative */}
                    <circle cx={cx} cy={cy} r={radius + strokeWidth + 4} fill="none" stroke="rgba(0,212,255,0.05)" strokeWidth={1} />

                    {/* Background arc */}
                    <path d={bgPath} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} strokeLinecap="round" />

                    {/* Score arc */}
                    {scorePath && (
                        <path
                            d={scorePath}
                            fill="none"
                            stroke={color}
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.4s ease' }}
                        />
                    )}

                    {/* Tick marks */}
                    {[0, 25, 50, 75, 100].map(tick => {
                        const tickAngle = startAngle + (sweepAngle * tick) / 100
                        const tickR1 = radius - strokeWidth / 2 - 4
                        const tickR2 = radius - strokeWidth / 2 - 10
                        return (
                            <line
                                key={tick}
                                x1={cx + tickR1 * Math.cos(toRad(tickAngle))}
                                y1={cy + tickR1 * Math.sin(toRad(tickAngle))}
                                x2={cx + tickR2 * Math.cos(toRad(tickAngle))}
                                y2={cy + tickR2 * Math.sin(toRad(tickAngle))}
                                stroke="rgba(255,255,255,0.2)"
                                strokeWidth={1.5}
                                strokeLinecap="round"
                            />
                        )
                    })}
                </svg>

                {/* Center text */}
                <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -48%)',
                    textAlign: 'center', lineHeight: 1,
                }}>
                    <div style={{ fontSize: size * 0.22, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
                        {clampedScore}
                    </div>
                    <div style={{ fontSize: size * 0.09, color: 'var(--text-muted)', marginTop: 2 }}>Risk Score</div>
                    <div style={{
                        fontSize: size * 0.09, fontWeight: 700, color,
                        textTransform: 'uppercase', letterSpacing: 1, marginTop: 3,
                    }}>
                        {risk_level}
                    </div>
                </div>
            </div>
            {label && <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>}
        </div>
    )
}
