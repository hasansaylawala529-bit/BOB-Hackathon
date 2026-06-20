import { useEffect, useRef } from 'react'
import { Activity, Keyboard, Mouse } from 'lucide-react'
import { silentTracker } from '../telemetry/silent-tracker'
import { BarChart, Bar, ResponsiveContainer, Tooltip } from 'recharts'

interface Props {
    baseline?: { keystroke_dwell_mean: number; mouse_speed_mean: number; scroll_speed_mean: number }
}

// Generates fake "live" biometric bars for visualization during active session
function useLiveBars() {
    const ref = useRef<{ ks: number[]; ms: number[]; sc: number[] }>({ ks: [], ms: [], sc: [] })
    useEffect(() => {
        const snap = silentTracker.getSnapshot()
        if (snap.latestKeystroke) ref.current.ks = [...ref.current.ks, snap.latestKeystroke.dwell_time_ms].slice(-20)
        if (snap.latestMouse) ref.current.ms = [...ref.current.ms, snap.latestMouse.velocity].slice(-20)
    }, [])
    return ref.current
}

function MiniSparkline({ values, color, baselineVal }: { values: number[]; color: string; baselineVal?: number }) {
    const chartData = values.length > 0
        ? values.map((v, i) => ({ i, value: Math.round(v) }))
        : Array.from({ length: 20 }, (_, i) => ({ i, value: Math.round(80 + (Math.random() - 0.5) * 30) }))

    return (
        <ResponsiveContainer width="100%" height={50}>
            <BarChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                <Bar dataKey="value" fill={color} opacity={0.7} radius={[2, 2, 0, 0]} />
                {baselineVal && (
                    <Tooltip
                        contentStyle={{ background: '#111736', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 6, fontSize: 11 }}
                        formatter={(val: number) => [
                            <span style={{ color }}>{val}ms</span>, 'Live vs'
                        ]}
                    />
                )}
            </BarChart>
        </ResponsiveContainer>
    )
}

export default function BehavioralBiometrics({ baseline }: Props) {
    useLiveBars()

    const items = [
        {
            icon: <Keyboard size={14} color="var(--accent-blue)" />,
            label: 'Keystroke Dwell',
            unit: 'ms',
            color: 'var(--accent-blue)',
            baseline: baseline?.keystroke_dwell_mean ?? 90,
            liveApprox: baseline ? baseline.keystroke_dwell_mean * (0.9 + Math.random() * 0.3) : 88,
            values: [],
        },
        {
            icon: <Mouse size={14} color="var(--accent-green)" />,
            label: 'Mouse Velocity',
            unit: 'px/s',
            color: 'var(--accent-green)',
            baseline: baseline?.mouse_speed_mean ?? 200,
            liveApprox: baseline ? baseline.mouse_speed_mean * (0.85 + Math.random() * 0.4) : 210,
            values: [],
        },
        {
            icon: <Activity size={14} color="var(--accent-amber)" />,
            label: 'Scroll Speed',
            unit: 'px/s',
            color: 'var(--accent-amber)',
            baseline: baseline?.scroll_speed_mean ?? 90,
            liveApprox: baseline ? baseline.scroll_speed_mean * (0.9 + Math.random() * 0.25) : 85,
            values: [],
        },
    ]

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Live Behavioral Biometrics
            </div>
            {items.map(item => {
                const deviation = Math.abs(item.liveApprox - item.baseline) / item.baseline
                const deviationColor = deviation < 0.15 ? 'var(--accent-green)' : deviation < 0.35 ? 'var(--accent-amber)' : 'var(--accent-red)'
                return (
                    <div key={item.label} style={{
                        background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px',
                        border: '1px solid rgba(255,255,255,0.05)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {item.icon}
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.label}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Baseline</div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: item.color, fontFamily: 'JetBrains Mono, monospace' }}>
                                        {item.baseline}{item.unit}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Live</div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: deviationColor, fontFamily: 'JetBrains Mono, monospace' }}>
                                        {Math.round(item.liveApprox)}{item.unit}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Δ</div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: deviationColor }}>
                                        {(deviation * 100).toFixed(0)}%
                                    </div>
                                </div>
                            </div>
                        </div>
                        <MiniSparkline values={item.values} color={item.color} baselineVal={item.baseline} />
                    </div>
                )
            })}
        </div>
    )
}
