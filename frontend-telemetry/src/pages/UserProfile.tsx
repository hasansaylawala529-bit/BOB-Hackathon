import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import UserCard from '../components/UserCard'
import TrustScoreGauge from '../components/TrustScoreGauge'
import TrustDecayChart from '../components/TrustDecayChart'
import RiskNarrative from '../components/RiskNarrative'
import BehavioralBiometrics from '../components/BehavioralBiometrics'
import TrustPassport from '../components/TrustPassport'
import { useApp } from '../context/AppContext'
import * as api from '../services/api'
import { ArrowLeft, Shield } from 'lucide-react'

export default function UserProfile() {
    const { username } = useParams<{ username: string }>()
    const navigate = useNavigate()
    const { state, runScenario, addAlert, dispatch } = useApp()
    const [loading, setLoading] = useState(true)
    const [userDetail, setUserDetail] = useState<any>(null)
    const [trustScore, setTrustScore] = useState<any>(null)
    const [trustHistory, setTrustHistory] = useState<any[]>([])
    const [error, setError] = useState('')

    useEffect(() => {
        if (!username) {
            navigate('/users', { replace: true })
            return
        }

        Promise.all([
            api.getUser(username),
            api.getTrustHistory(username, 50),
        ])
            .then(([detail, history]) => {
                const profile = detail as any
                setUserDetail(profile)
                setTrustScore(profile.trustScore)
                setTrustHistory(profile.trustHistory ?? history)
                if (profile.trustPassport) {
                    dispatch({ type: 'SET_PASSPORT', payload: { username, passport: profile.trustPassport } })
                }
            })
            .catch(err => {
                console.error('Failed to load user:', err)
                const fallbackUser = state.users.find(user => user.username === username) ?? {
                    id: 0,
                    username,
                    role: 'EMPLOYEE',
                    department: 'Demo',
                    risk_level: 'LOW',
                    status: 'ACTIVE',
                    created_at: new Date().toISOString(),
                }
                const fallbackTrustScore = state.trustScores[username] ?? {
                    user_id: username,
                    score: 15,
                    confidence: 0.85,
                    risk_level: 'LOW',
                    timestamp: new Date().toISOString(),
                    contributing_factors: {
                        behavioral_score: 12,
                        contextual_score: 18,
                        privilege_score: 10,
                        attack_path_score: 8,
                        twin_deviation_score: 12,
                        trust_decay_score: 14,
                    },
                    narrative: 'Risk Score = 15\n- Demo fallback profile loaded while backend is offline.',
                    recommended_action: 'ALLOW',
                }
                const fallbackPassport = state.passports[username] ?? {
                    passport_id: `demo-passport-${username}`,
                    user_id: username,
                    trust_score: fallbackTrustScore.score,
                    behavioral_confidence: fallbackTrustScore.confidence,
                    device_trust: 'UNKNOWN',
                    contextual_risk: fallbackTrustScore.risk_level,
                    verification_level: 'BASIC',
                    risk_level: fallbackTrustScore.risk_level,
                    issued_at: new Date().toISOString(),
                    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
                    signature: 'demo-signature',
                }
                setUserDetail({
                    user: fallbackUser,
                    trustScore: fallbackTrustScore,
                    trustPassport: fallbackPassport,
                    digitalTwin: {
                        biometric_baseline: {
                            keystroke_dwell_mean: 110,
                            keystroke_flight_mean: 140,
                            mouse_speed_mean: 220,
                            scroll_speed_mean: 95,
                        },
                    },
                    trustHistory: [
                        { score: 22, risk_level: 'LOW', timestamp: new Date(Date.now() - 25 * 60000).toISOString() },
                        { score: 20, risk_level: 'LOW', timestamp: new Date(Date.now() - 20 * 60000).toISOString() },
                        { score: 18, risk_level: 'LOW', timestamp: new Date(Date.now() - 15 * 60000).toISOString() },
                        { score: 16, risk_level: 'LOW', timestamp: new Date(Date.now() - 10 * 60000).toISOString() },
                        { score: 15, risk_level: 'LOW', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
                    ],
                })
                setTrustScore(fallbackTrustScore)
                setTrustHistory([
                    { score: 22, risk_level: 'LOW', timestamp: new Date(Date.now() - 25 * 60000).toISOString() },
                    { score: 20, risk_level: 'LOW', timestamp: new Date(Date.now() - 20 * 60000).toISOString() },
                    { score: 18, risk_level: 'LOW', timestamp: new Date(Date.now() - 15 * 60000).toISOString() },
                    { score: 16, risk_level: 'LOW', timestamp: new Date(Date.now() - 10 * 60000).toISOString() },
                    { score: 15, risk_level: 'LOW', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
                ])
                dispatch({ type: 'SET_PASSPORT', payload: { username, passport: fallbackPassport } })
                setError('')
            })
            .finally(() => setLoading(false))
    }, [dispatch, navigate, username])

    const handleSimulateInsiderThreat = async () => {
        try {
            const result = await runScenario('insider_threat')
            addAlert(`Investigation triggered: ${result.id}`, 'HIGH', 'INVESTIGATION')
        } catch (err) {
            console.error('Failed to run scenario:', err)
        }
    }

    if (loading) {
        return (
            <div className="flex w-full h-full">
                <div className="w-60 border-r" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
                    <Sidebar />
                </div>
                <div className="flex-1 flex flex-col">
                    <Header />
                    <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                        <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" 
                            style={{ borderColor: 'var(--accent-blue)' }} />
                    </div>
                </div>
            </div>
        )
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
                    <div className="p-6 space-y-6">
                        {/* Back Button */}
                        <button 
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-sm hover:opacity-80 transition"
                            style={{ color: 'var(--accent-blue)' }}
                        >
                            <ArrowLeft size={16} />
                            Back to Dashboard
                        </button>

                        {error && (
                            <div 
                                className="p-4 border rounded-lg"
                                style={{
                                    background: 'rgba(255,68,68,0.08)',
                                    border: '1px solid rgba(255,68,68,0.25)',
                                    color: 'var(--accent-red)',
                                    fontSize: '14px',
                                }}
                            >
                                ⚠️ {error}
                            </div>
                        )}

                        {userDetail && trustScore && (
                            <div className="space-y-6">
                                {/* User Header Card */}
                                <div 
                                    className="p-4 rounded-lg border"
                                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                                >
                                    <UserCard user={userDetail.user} trustScore={trustScore} />
                                </div>

                                {/* Top Row: Trust Score + Passport */}
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Trust Gauge */}
                                    <div 
                                        className="p-6 rounded-lg border"
                                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                                    >
                                        <h3 style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                            Current Trust Score
                                        </h3>
                                        <div className="flex justify-center">
                                            <TrustScoreGauge score={trustScore.score} risk_level={trustScore.risk_level} size={160} />
                                        </div>
                                    </div>

                                    {/* Trust Passport */}
                                    {(state.passports[username || ''] || userDetail?.trustPassport) && (
                                        <div 
                                            className="p-6 rounded-lg border"
                                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                                        >
                                            <TrustPassport passport={state.passports[username || ''] ?? userDetail.trustPassport} />
                                        </div>
                                    )}
                                </div>

                                {/* Middle Row: Risk Narrative + Behavioral */}
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Risk Narrative */}
                                    <div 
                                        className="p-4 rounded-lg border max-h-96 overflow-y-auto"
                                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                                    >
                                        <RiskNarrative trustScore={trustScore} />
                                    </div>

                                    {/* Behavioral Biometrics */}
                                    <div 
                                        className="p-4 rounded-lg border"
                                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                                    >
                                        <BehavioralBiometrics baseline={userDetail.baseline ?? userDetail.digitalTwin?.biometric_baseline ?? userDetail.digitalTwin?.baseline_biometrics} />
                                    </div>
                                </div>

                                {/* Trust History Chart */}
                                <div 
                                    className="p-4 rounded-lg border"
                                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                                >
                                    <TrustDecayChart 
                                        history={trustHistory}
                                        color="var(--accent-blue)"
                                        height={240}
                                        username={username}
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleSimulateInsiderThreat}
                                        className="flex-1 py-3 px-4 rounded-lg border transition font-semibold text-sm"
                                        style={{
                                            background: 'rgba(255,107,53,0.1)',
                                            border: '1px solid rgba(255,107,53,0.3)',
                                            color: 'var(--accent-orange)',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <Shield size={14} style={{ display: 'inline', marginRight: '6px' }} />
                                        Simulate Insider Threat
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
