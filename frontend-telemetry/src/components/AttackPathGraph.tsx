import { useEffect, useRef } from 'react'
import { Network } from 'lucide-react'

interface Props {
    username: string
    attackPaths?: any[]
}

export default function AttackPathGraph({ username, attackPaths = [] }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        if (!canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Set canvas to match container size
        const rect = canvas.parentElement?.getBoundingClientRect()
        if (rect) {
            canvas.width = rect.width
            canvas.height = rect.height
        }

        // Clear canvas
        ctx.fillStyle = 'transparent'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Generate mock node graph
        const nodes = [
            { id: 'user', label: username, x: canvas.width / 2, y: 40, color: '#00d4ff', type: 'user' },
            { id: 'treasury', label: 'Treasury DB', x: canvas.width / 4, y: 140, color: '#ffaa00', type: 'resource' },
            { id: 'swift', label: 'SWIFT System', x: (canvas.width * 3) / 4, y: 140, color: '#ff6b35', type: 'resource' },
            { id: 'admin', label: 'Admin Escalation', x: canvas.width / 2, y: 240, color: '#ff4444', type: 'escalation' },
        ]

        const edges = [
            { from: 'user', to: 'treasury', label: 'Query' },
            { from: 'user', to: 'swift', label: 'Transfer' },
            { from: 'treasury', to: 'admin', label: 'Privilege Escalation' },
            { from: 'swift', to: 'admin', label: 'Direct Access' },
        ]

        // Draw edges
        ctx.strokeStyle = 'rgba(0,212,255,0.2)'
        ctx.lineWidth = 2
        edges.forEach(edge => {
            const fromNode = nodes.find(n => n.id === edge.from)
            const toNode = nodes.find(n => n.id === edge.to)
            if (fromNode && toNode) {
                ctx.beginPath()
                ctx.moveTo(fromNode.x, fromNode.y)
                ctx.lineTo(toNode.x, toNode.y)
                ctx.stroke()
            }
        })

        // Draw nodes
        nodes.forEach(node => {
            // Node circle
            ctx.fillStyle = node.color + '30'
            ctx.beginPath()
            ctx.arc(node.x, node.y, 24, 0, Math.PI * 2)
            ctx.fill()

            // Node border
            ctx.strokeStyle = node.color
            ctx.lineWidth = 2
            ctx.stroke()

            // Node label
            ctx.fillStyle = '#e2e8f0'
            ctx.font = '12px JetBrains Mono'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(node.label, node.x, node.y + 40)
        })

        // Draw legend
        const legendX = 12
        const legendY = 12
        const legendItems = [
            { label: 'User', color: '#00d4ff' },
            { label: 'Resource', color: '#ffaa00' },
            { label: 'Risk', color: '#ff6b35' },
            { label: 'Critical', color: '#ff4444' },
        ]

        legendItems.forEach((item, idx) => {
            const y = legendY + idx * 18
            ctx.fillStyle = item.color
            ctx.beginPath()
            ctx.arc(legendX + 6, y + 6, 3, 0, Math.PI * 2)
            ctx.fill()

            ctx.fillStyle = '#94a3b8'
            ctx.font = '10px Inter'
            ctx.textAlign = 'left'
            ctx.fillText(item.label, legendX + 14, y + 6)
        })
    }, [username, attackPaths])

    return (
        <div className="w-full h-full flex flex-col">
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Network size={14} />
                Attack Path Graph
            </div>
            <canvas
                ref={canvasRef}
                className="w-full flex-1 border rounded-lg"
                style={{
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid rgba(255,255,255,0.05)',
                }}
            />
        </div>
    )
}
