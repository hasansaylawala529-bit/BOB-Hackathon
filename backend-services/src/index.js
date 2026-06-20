/**
 * MAO-IR Backend — Main Server Entry Point
 * Express API on port 3001 + WebSocket for real-time push
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// ─── HTTP Server ───
const server = http.createServer(app);

// ─── WebSocket Server ───
const wss = new WebSocketServer({ server });
const wsClients = new Set();

wss.on('connection', (ws) => {
  wsClients.add(ws);
  console.log(`[WS] Client connected (${wsClients.size} total)`);

  ws.on('close', () => {
    wsClients.delete(ws);
    console.log(`[WS] Client disconnected (${wsClients.size} total)`);
  });

  ws.on('error', (err) => {
    console.error('[WS] Error:', err.message);
    wsClients.delete(ws);
  });

  // Send welcome message
  ws.send(JSON.stringify({ type: 'CONNECTED', data: { message: 'MAO-IR WebSocket connected' } }));
});

/**
 * Broadcast a message to all connected WebSocket clients.
 * @param {string} type - TRUST_UPDATE | ALERT | INVESTIGATION | AUDIT
 * @param {object} data - Payload
 */
function broadcast(type, data) {
  const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  wsClients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
}

// Make broadcast globally available for route modules
global.broadcast = broadcast;

// ─── Routes ───
const authRoutes = require('./routes/auth');
const telemetryRoutes = require('./routes/telemetry');
const trustRoutes = require('./routes/trust');
const userRoutes = require('./routes/users');
const auditRoutes = require('./routes/audit');
const orchestratorRoutes = require('./routes/orchestrator');

app.use('/api/auth', authRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/trust', trustRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/orchestrator', orchestratorRoutes);

// ─── Health Check ───
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'MAO-IR Backend Services',
    port: PORT,
    websocket_clients: wsClients.size,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ─── Banking Resources Endpoint ───
const db = require('./services/db');
app.get('/api/resources', async (req, res) => {
  try {
    const resources = await db.getAllBankingResources();
    res.json({ resources });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Error Handler ───
app.use((err, req, res, next) => {
  console.error('[SERVER] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start Server (async — must init DB first) ───
async function start() {
  // Initialize databases (async connections)
  await db.initDB();
  console.log('[DB] Database initialized');

  server.listen(PORT, () => {
    console.log('');
    console.log('  =============================================');
    console.log('    MAO-IR Backend Services');
    console.log('    Multi-Agent Orchestration for Identity Risk');
    console.log('  =============================================');
    console.log(`  HTTP API:    http://localhost:${PORT}`);
    console.log(`  WebSocket:   ws://localhost:${PORT}`);
    console.log(`  Health:      http://localhost:${PORT}/api/health`);
    console.log('  =============================================');
    console.log('');
  });
}

// Graceful shutdown — close DB connections
process.on('SIGINT', async () => {
  console.log('\n[SERVER] Shutting down...');
  await db.saveAndClose();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await db.saveAndClose();
  process.exit(0);
});

start().catch((err) => {
  console.error('[SERVER] Failed to start:', err);
  process.exit(1);
});

module.exports = { app, server, broadcast };
