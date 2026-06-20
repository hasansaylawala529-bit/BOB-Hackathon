import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import AlertFeed from '../components/AlertFeed'
import UserCard from '../components/UserCard'
import TrustDecayChart from '../components/TrustDecayChart'
import RiskNarrative from '../components/RiskNarrative'
import { useApp } from '../context/AppContext'
import * as api from '../services/api'
import { BarChart3, Users, AlertTriangle, Clock } from 'lucide-react'

export default function Dashboard() {
    const { state, loadUsers } = useApp()
    const navigate = useNavigate()
    const [trustHistory, setTrustHistory] = useState<any[]>([])

    useEffect(() => {
        loadUsers()
    }, [])

    // Load trust history for current user
    useEffect(() => {
        if (state.currentUser) {
            api.getTrustHistory(state.currentUser.id, 30)
                .then(setTrustHistory)
                .catch(err => console.error('Failed to load trust history:', err))
        }
    }, [state.currentUser?.id])

    const currentUserTrustScore = state.trustScores[state.currentUser?.username ?? '']
    const criticalCount = state.alerts.filter(a => a.severity === 'CRITICAL').length
    const investigationCount = state.investigations.length

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
                        {/* KPI Cards */}
                        <div className="grid grid-cols-4 gap-4">
                            {/* Current Trust Score */}
                            {currentUserTrustScore && (
                                <div 
                                    className="p-4 rounded-lg border"
                                    style={{
                                        background: 'var(--bg-card)',
                                        border: `1px solid ${currentUserTrustScore.risk_level === 'LOW' ? 'rgba(0,255,136,0.2)' : currentUserTrustScore.risk_level === 'MEDIUM' ? 'rgba(255,170,0,0.2)' : currentUserTrustScore.risk_level === 'HIGH' ? 'rgba(255,107,53,0.2)' : 'rgba(255,68,68,0.2)'}`,
                                    }}
                                >
                                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }} className="mb-2">YOUR TRUST SCORE</div>
                                    <div style={{ color: 'var(--text-primary)', fontSize: '28px', fontWeight: 800 }} className="font-mono">
                                        {currentUserTrustScore.score}
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }} className="mt-1">
                                        {currentUserTrustScore.risk_level}
                                    </div>
                                </div>
                            )}

                            {/* Total Users */}
                            <div 
                                className="p-4 rounded-lg border flex flex-col justify-between"
                                style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)' }}
                            >
                                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>TOTAL USERS</div>
                                <div style={{ color: 'var(--text-primary)', fontSize: '28px', fontWeight: 800 }} className="font-mono">
                                    {state.users.length}
                                </div>
                                <Users size={14} style={{ color: 'var(--accent-blue)', marginTop: 8 }} />
                            </div>

                            {/* Critical Alerts */}
                            <div 
                                className="p-4 rounded-lg border flex flex-col justify-between"
                                style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,68,68,0.2)' }}
                            >
                                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>CRITICAL ALERTS</div>
                                <div style={{ color: 'var(--accent-red)', fontSize: '28px', fontWeight: 800 }} className="font-mono">
                                    {criticalCount}
                                </div>
                                <AlertTriangle size={14} style={{ color: 'var(--accent-red)', marginTop: 8 }} />
                            </div>

                            {/* Active Investigations */}
                            <div 
                                className="p-4 rounded-lg border flex flex-col justify-between"
                                style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,107,53,0.2)' }}
                            >
                                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>INVESTIGATIONS</div>
                                <div style={{ color: 'var(--accent-orange)', fontSize: '28px', fontWeight: 800 }} className="font-mono">
                                    {investigationCount}
                                </div>
                                <Clock size={14} style={{ color: 'var(--accent-orange)', marginTop: 8 }} />
                            </div>
                        </div>

                        {/* Main Grid */}
                        <div className="grid grid-cols-3 gap-6">
                            {/* Left: Alert Feed + Chart */}
                            <div className="col-span-2 space-y-6">
                                {/* Alert Feed */}
                                <div 
                                    className="p-4 rounded-lg border"
                                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', minHeight: '300px' }}
                                >
                                    <AlertFeed />
                                </div>

                                {/* Trust History */}
                                {currentUserTrustScore && (
                                    <div 
                                        className="p-4 rounded-lg border"
                                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                                    >
                                        <TrustDecayChart 
                                            history={trustHistory} 
                                            color="var(--accent-blue)"
                                            height={220}
                                            username={state.currentUser?.username}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Right: Current User + Risk Narrative */}
                            <div className="space-y-6">
                                {/* Current User Card */}
                                {state.currentUser && (
                                    <div 
                                        className="p-4 rounded-lg border"
                                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                                    >
                                        <UserCard 
                                            user={state.currentUser} 
                                            trustScore={currentUserTrustScore}
                                            compact
                                        />
                                    </div>
                                )}

                                {/* Risk Narrative */}
                                {currentUserTrustScore && (
                                    <div 
                                        className="p-4 rounded-lg border max-h-96 overflow-y-auto"
                                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                                    >
                                        <RiskNarrative trustScore={currentUserTrustScore} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* All Users Grid */}
                        <div>
                            <h2 style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
                                <BarChart3 size={14} style={{ display: 'inline', marginRight: '6px' }} />
                                Identity Profiles
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                {state.users.slice(0, 4).map(user => (
                                    <div key={user.username} onClick={() => navigate(`/users/${user.username}`)}>
                                        <UserCard user={user} trustScore={user.trustScore} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
