import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import UserCard from '../components/UserCard'
import { useApp } from '../context/AppContext'

export default function Users() {
    const { state, loadUsers } = useApp()
    const navigate = useNavigate()
    const [query, setQuery] = useState('')

    useEffect(() => {
        if (state.users.length === 0) {
            loadUsers().catch(() => { })
        }
    }, [loadUsers, state.users.length])

    const filteredUsers = useMemo(() => {
        const needle = query.trim().toLowerCase()
        if (!needle) return state.users
        return state.users.filter(user =>
            [user.username, user.role, user.department, user.status, user.risk_level]
                .some(value => String(value).toLowerCase().includes(needle))
        )
    }, [query, state.users])

    const activeCount = state.users.filter(user => user.status === 'ACTIVE').length
    const quarantinedCount = state.users.filter(user => user.status === 'QUARANTINED').length
    const criticalCount = state.users.filter(user => (user.trustScore?.risk_level ?? user.risk_level) === 'CRITICAL').length

    return (
        <div className="flex w-full h-full">
            <div className="w-60 border-r" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
                <Sidebar />
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />

                <div className="flex-1 overflow-auto" style={{ background: 'var(--bg-primary)' }}>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="p-4 rounded-lg border" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>TOTAL PROFILES</div>
                                <div style={{ color: 'var(--text-primary)', fontSize: '28px', fontWeight: 800 }} className="font-mono">{state.users.length}</div>
                            </div>
                            <div className="p-4 rounded-lg border" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>ACTIVE</div>
                                <div style={{ color: 'var(--accent-green)', fontSize: '28px', fontWeight: 800 }} className="font-mono">{activeCount}</div>
                            </div>
                            <div className="p-4 rounded-lg border" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>QUARANTINED</div>
                                <div style={{ color: 'var(--accent-red)', fontSize: '28px', fontWeight: 800 }} className="font-mono">{quarantinedCount}</div>
                            </div>
                            <div className="p-4 rounded-lg border" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>CRITICAL RISK</div>
                                <div style={{ color: 'var(--accent-orange)', fontSize: '28px', fontWeight: 800 }} className="font-mono">{criticalCount}</div>
                            </div>
                        </div>

                        <div className="p-4 rounded-lg border" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                            <label htmlFor="user-search" style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                                Search users
                            </label>
                            <input
                                id="user-search"
                                value={query}
                                onChange={event => setQuery(event.target.value)}
                                placeholder="username, role, department, status"
                                className="w-full px-3 py-2 rounded text-sm"
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    color: 'var(--text-primary)',
                                }}
                            />
                        </div>

                        {filteredUsers.length === 0 ? (
                            <div className="h-72 flex items-center justify-center rounded-lg border" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                                <p style={{ color: 'var(--text-muted)' }}>No matching profiles found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {filteredUsers.map(user => (
                                    <div key={user.username} onClick={() => navigate(`/users/${user.username}`)}>
                                        <UserCard user={user} trustScore={user.trustScore} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}