import { Shield, CheckCircle, Clock } from 'lucide-react'
import type { TrustPassport } from '../types/telemetry.types'

interface Props {
    passport: TrustPassport
}

export default function TrustPassportCard({ passport }: Props) {
    const getRiskColor = (level: string) => {
        switch (level) {
            case 'LOW': return 'var(--accent-green)'
            case 'MEDIUM': return 'var(--accent-amber)'
            case 'HIGH': return 'var(--accent-orange)'
            case 'CRITICAL': return 'var(--accent-red)'
            default: return 'var(--text-secondary)'
        }
    }

    return (
        <div 
            className="p-4 rounded-lg border relative overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(0,136,255,0.06) 100%)',
                border: '1px solid rgba(0,212,255,0.2)',
            }}
        >
            {/* Decorative corner */}
            <div 
                className="absolute top-0 right-0 w-24 h-24 rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(0,212,255,0.1), transparent)',
                    transform: 'translate(12px, -12px)',
                }}
            />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                    <Shield size={16} color="var(--accent-blue)" />
                    <h3 style={{ color: 'var(--accent-blue)', fontSize: '13px', fontWeight: 700 }}>
                        Trust Passport
                    </h3>
                </div>

                {/* ID */}
                <div className="mb-4">
                    <p style={{ color: 'var(--text-muted)', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Passport ID
                    </p>
                    <p 
                        style={{ 
                            color: 'var(--text-primary)', 
                            fontSize: '11px', 
                            fontFamily: 'JetBrains Mono',
                            wordBreak: 'break-all',
                        }}
                    >
                        {passport.passport_id.slice(0, 32)}...
                    </p>
                </div>

                {/* User ID */}
                <div className="mb-4">
                    <p style={{ color: 'var(--text-muted)', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        User ID
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>
                        {passport.user_id}
                    </p>
                </div>

                {/* Trust Score */}
                <div className="mb-4">
                    <p style={{ color: 'var(--text-muted)', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Trust Score
                    </p>
                    <p style={{ color: getRiskColor(passport.risk_level), fontSize: '18px', fontWeight: 800, fontFamily: 'JetBrains Mono' }}>
                        {passport.trust_score}
                    </p>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 mb-4">
                    <CheckCircle size={12} color={getRiskColor(passport.risk_level)} />
                    <span style={{ color: getRiskColor(passport.risk_level), fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {passport.risk_level}
                    </span>
                </div>

                {/* Issued/Expires */}
                <div className="text-xs space-y-2 border-t pt-3" style={{ borderColor: 'rgba(0,212,255,0.1)', color: 'var(--text-muted)' }}>
                    <div className="flex items-center gap-2">
                        <Clock size={11} />
                        <span>
                            Issued: {new Date(passport.issued_at).toLocaleDateString('en-IN')}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock size={11} />
                        <span>
                            Expires: {new Date(passport.expires_at).toLocaleDateString('en-IN')}
                        </span>
                    </div>
                </div>

                {/* Signature Indicator */}
                <div 
                    className="mt-3 p-2 rounded text-xs text-center"
                    style={{
                        background: 'rgba(0,255,136,0.08)',
                        border: '1px solid rgba(0,255,136,0.2)',
                        color: 'var(--accent-green)',
                    }}
                >
                    ✓ RSA-SHA256 Signed
                </div>
            </div>
        </div>
    )
}
