import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useApp } from '../context/AppContext'
import * as api from '../services/api'
import { Search, Filter } from 'lucide-react'

export default function AuditLog() {
    const { state } = useApp()
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [filterAction, setFilterAction] = useState('')
    const [filterUsername, setFilterUsername] = useState('')

    const LOGS_PER_PAGE = 25

    useEffect(() => {
        setLoading(true)
        api.getAuditLogs({
            page,
            limit: LOGS_PER_PAGE,
            action: filterAction || undefined,
            username: filterUsername || undefined,
        })
            .then(data => {
                setLogs(data.logs)
                setTotal(data.total)
            })
            .catch(err => {
                console.error('Failed to load audit logs:', err)
                const demoLogs = [
                    {
                        id: 'audit-demo-001',
                        timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
                        username: state.currentUser?.username ?? 'john_priv',
                        action: 'USER_LOGIN',
                        resource: 'Auth Server',
                        riskScore: 0,
                        decision: 'ALLOW',
                        narrative: 'Demo login captured while backend is offline.',
                        details: {},
                    },
                    {
                        id: 'audit-demo-002',
                        timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
                        username: state.currentUser?.username ?? 'john_priv',
                        action: 'PRIVILEGED_ACTION',
                        resource: 'SWIFT Payment Gateway',
                        riskScore: 15,
                        decision: 'ALLOW',
                        narrative: 'Demo privileged action recorded while backend is offline.',
                        details: {},
                    },
                ]
                setLogs(demoLogs)
                setTotal(demoLogs.length)
            })
            .finally(() => setLoading(false))
    }, [page, filterAction, filterUsername])

    const getActionColor = (action: string) => {
        if (action.includes('USER_LOGIN')) return 'var(--accent-green)'
        if (action.includes('PRIVILEGED_ACTION')) return 'var(--accent-orange)'
        if (action.includes('QUARANTINE')) return 'var(--accent-red)'
        if (action.includes('AUDIT')) return 'var(--accent-blue)'
        return 'var(--text-secondary)'
    }

    const totalPages = Math.ceil(total / LOGS_PER_PAGE)

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
                        {/* Filters */}
                        <div 
                            className="p-4 rounded-lg border mb-6 grid grid-cols-3 gap-4"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                        >
                            <div>
                                <label style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                                    <Filter size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                    Filter by Action
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., USER_LOGIN"
                                    value={filterAction}
                                    onChange={e => {
                                        setFilterAction(e.target.value)
                                        setPage(1)
                                    }}
                                    className="w-full px-3 py-2 rounded text-sm"
                                    style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        color: 'var(--text-primary)',
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                                    <Search size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                    Filter by Username
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., john_priv"
                                    value={filterUsername}
                                    onChange={e => {
                                        setFilterUsername(e.target.value)
                                        setPage(1)
                                    }}
                                    className="w-full px-3 py-2 rounded text-sm"
                                    style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        color: 'var(--text-primary)',
                                    }}
                                />
                            </div>

                            <div className="flex items-end">
                                <button
                                    onClick={() => {
                                        setFilterAction('')
                                        setFilterUsername('')
                                        setPage(1)
                                    }}
                                    className="w-full py-2 px-3 rounded text-sm transition"
                                    style={{
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'var(--text-secondary)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div 
                            className="rounded-lg border overflow-hidden"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                        >
                            {loading ? (
                                <div className="h-96 flex items-center justify-center">
                                    <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" 
                                        style={{ borderColor: 'var(--accent-blue)' }} />
                                </div>
                            ) : logs.length === 0 ? (
                                <div className="h-96 flex items-center justify-center">
                                    <p style={{ color: 'var(--text-muted)' }}>No audit logs found</p>
                                </div>
                            ) : (
                                <>
                                    {/* Table Header */}
                                    <div 
                                        className="grid grid-cols-5 gap-4 p-4 border-b"
                                        style={{
                                            borderColor: 'var(--border)',
                                            background: 'rgba(255,255,255,0.02)',
                                        }}
                                    >
                                        <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>TIMESTAMP</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>USERNAME</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>ACTION</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>RESOURCE</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>RISK SCORE</div>
                                    </div>

                                    {/* Table Rows */}
                                    <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                        {logs.map((log, idx) => (
                                            <div key={idx} className="grid grid-cols-5 gap-4 p-4 hover:bg-opacity-50 transition" style={{ background: 'rgba(255,255,255,0.01)' }}>
                                                <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontFamily: 'JetBrains Mono' }}>
                                                    {new Date(log.timestamp).toLocaleTimeString('en-IN')}
                                                </div>
                                                <div style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 500 }}>
                                                    {log.username}
                                                </div>
                                                <div 
                                                    style={{
                                                        color: getActionColor(log.action),
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px',
                                                    }}
                                                >
                                                    {log.action}
                                                </div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                                                    {log.resource || '—'}
                                                </div>
                                                <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
                                                    {log.risk_score || '—'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    <div 
                                        className="flex items-center justify-between p-4 border-t"
                                        style={{ borderColor: 'var(--border)' }}
                                    >
                                        <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                                            Page {page} of {totalPages} · Total: {total} entries
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setPage(Math.max(1, page - 1))}
                                                disabled={page === 1}
                                                className="px-3 py-1 rounded text-sm transition disabled:opacity-50"
                                                style={{
                                                    background: 'rgba(255,255,255,0.06)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    color: 'var(--text-secondary)',
                                                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                                                }}
                                            >
                                                Previous
                                            </button>
                                            <button
                                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                                disabled={page === totalPages}
                                                className="px-3 py-1 rounded text-sm transition disabled:opacity-50"
                                                style={{
                                                    background: 'rgba(255,255,255,0.06)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    color: 'var(--text-secondary)',
                                                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                                                }}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
