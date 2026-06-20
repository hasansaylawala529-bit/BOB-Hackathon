import { NavLink, useNavigate } from 'react-router-dom'
import { Shield, LayoutDashboard, Users, Search, FileText, LogOut, Activity } from 'lucide-react'
import { useApp } from '../context/AppContext'

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'SOC Dashboard' },
    { to: '/users', icon: Users, label: 'Identity Profiles' },
    { to: '/investigation', icon: Search, label: 'Investigations' },
    { to: '/audit', icon: FileText, label: 'Audit Log' },
]

export default function Sidebar() {
    const { state, logoutUser } = useApp()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await logoutUser()
        navigate('/')
    }

    return (
        <aside className="sidebar">
            {/* Branding */}
            <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <div className="animate-pulse-glow" style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,136,255,0.3))',
                        border: '1px solid var(--accent-blue)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Shield size={18} color="var(--accent-blue)" />
                    </div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-blue)', letterSpacing: 1 }}>MAO-IR</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 0.5 }}>Identity Trust Platform</div>
                    </div>
                </div>
            </div>

            {/* Current User Badge */}
            {state.currentUser && (
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'rgba(0,212,255,0.03)' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
                        Active Session
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="status-dot active" />
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{state.currentUser.username}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{state.currentUser.role}</div>
                        </div>
                    </div>
                    {/* Live telemetry indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                        <Activity size={10} color="var(--accent-green)" className="animate-pulse-glow" />
                        <span style={{ fontSize: 10, color: 'var(--accent-green)' }}>Telemetry Active</span>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav style={{ padding: '12px 8px', flex: 1 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, padding: '0 8px', marginBottom: 8 }}>
                    Navigation
                </div>
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px', borderRadius: 8, textDecoration: 'none',
                            marginBottom: 2, transition: 'all 0.15s ease',
                            background: isActive ? 'rgba(0,212,255,0.1)' : 'transparent',
                            border: isActive ? '1px solid rgba(0,212,255,0.2)' : '1px solid transparent',
                            color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                        })}
                    >
                        <Icon size={16} />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* WS Status + Logout */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <span className={`status-dot ${state.wsConnected ? 'active' : 'offline'}`} />
                    <span style={{ fontSize: 11, color: state.wsConnected ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                        {state.wsConnected ? 'WebSocket Live' : 'WS Offline'}
                    </span>
                </div>
                {state.currentUser && (
                    <button className="btn-danger" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={handleLogout}>
                        <LogOut size={13} />
                        Logout
                    </button>
                )}
            </div>
        </aside>
    )
}
