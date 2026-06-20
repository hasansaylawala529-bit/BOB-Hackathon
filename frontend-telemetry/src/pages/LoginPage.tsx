import { useState } from 'react'
import { LogIn, Lock } from 'lucide-react'
import { useApp } from '../context/AppContext'

const DEMO_USERS = [
    { username: 'rajesh_dba', role: 'PRIVILEGED', department: 'IT Infrastructure', gradientStart: '#fbbf2433', gradientEnd: '#d97706cc', accentColor: '#f59e0b' },
    { username: 'ameya_admin', role: 'ADMIN', department: 'Cybersecurity', gradientStart: '#ef444433', gradientEnd: '#dc262666', accentColor: '#ef4444' },
    { username: 'tcs_vendor_01', role: 'VENDOR', department: 'External IT', gradientStart: '#c084fc33', gradientEnd: '#a855f7cc', accentColor: '#d8b4fe' },
    { username: 'priya_teller', role: 'EMPLOYEE', department: 'Retail Banking', gradientStart: '#3b82f633', gradientEnd: '#1d4ed8cc', accentColor: '#60a5fa' },
]

export default function LoginPage() {
    const { loginUser, state } = useApp()
    const [selectedUser, setSelectedUser] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogin = async (username: string) => {
        setLoading(true)
        setError('')
        setSelectedUser(username)
        try {
            await loginUser(username)
        } catch (err) {
            setError(`Failed to login as ${username}`)
            setSelectedUser('')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
            <div className="w-full max-w-6xl">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center animate-pulse-glow"
                            style={{
                                background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,136,255,0.3))',
                                border: '1px solid var(--accent-blue)',
                            }}
                        >
                            <Lock size={24} color="var(--accent-blue)" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black" style={{ color: 'var(--accent-blue)', letterSpacing: '2px' }}>MAO-IR</h1>
                            <p className="text-xs text-muted" style={{ letterSpacing: '0.5px' }}>IDENTITY TRUST PLATFORM</p>
                        </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                        Multi-Agent Orchestration for Identity Risk
                    </p>
                    <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-2">
                        Bank of Baroda · Agentic Zero-Trust Authentication
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div 
                        className="mb-8 p-4 border rounded-lg flex items-center gap-3"
                        style={{
                            background: 'rgba(255,68,68,0.08)',
                            border: '1px solid rgba(255,68,68,0.25)',
                        }}
                    >
                        <div style={{ color: 'var(--accent-red)' }}>⚠️</div>
                        <span style={{ color: 'var(--accent-red)', fontSize: '14px' }}>{error}</span>
                    </div>
                )}

                {/* User Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {DEMO_USERS.map(user => (
                        <button
                            key={user.username}
                            onClick={() => handleLogin(user.username)}
                            disabled={loading}
                            className="group relative p-6 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background: `linear-gradient(135deg, ${user.gradientStart} 0%, ${user.gradientEnd} 100%)`,
                                border: selectedUser === user.username ? '1px solid var(--accent-blue)' : '1px solid rgba(255,255,255,0.08)',
                            }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="text-left flex-1">
                                    <h3 style={{ color: 'var(--text-primary)' }} className="text-lg font-bold mb-1">
                                        {user.username}
                                    </h3>
                                    <p style={{ color: 'var(--text-secondary)' }} className="text-sm font-semibold">
                                        {user.role}
                                    </p>
                                </div>
                                <div 
                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{
                                        background: 'rgba(255,255,255,0.08)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                    }}
                                >
                                    {loading && selectedUser === user.username ? (
                                        <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <LogIn size={16} style={{ color: 'var(--text-secondary)' }} />
                                    )}
                                </div>
                            </div>

                            <p style={{ color: 'var(--text-muted)' }} className="text-xs">
                                {user.department}
                            </p>

                            {/* Hover effect line */}
                            <div 
                                className="absolute bottom-0 left-0 h-0.5 rounded-full transition-all duration-300 group-hover:w-full"
                                style={{
                                    width: selectedUser === user.username ? '100%' : '0',
                                    background: 'linear-gradient(90deg, transparent, var(--accent-blue), transparent)',
                                }}
                            />
                        </button>
                    ))}
                </div>

                {/* Info Footer */}
                <div 
                    className="p-4 rounded-lg text-center text-xs"
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        color: 'var(--text-muted)',
                    }}
                >
                    ✓ Demo Mode — All credentials accepted
                    <br />
                    🔒 Passwords are NOT required for this hackathon demo
                    <br />
                    🚀 Post-authentication continuous trust assessment begins immediately
                </div>

                {state.loading && !selectedUser && (
                    <div className="mt-8 text-center">
                        <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto" 
                            style={{ borderColor: 'var(--accent-blue)' }} />
                    </div>
                )}
            </div>
        </div>
    )
}
