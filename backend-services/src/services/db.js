/**
 * MAO-IR Backend - Cloud Database Service
 * PostgreSQL (Neon/Supabase) for Relational Data
 * MongoDB (Atlas) for Documents (Digital Twins, Audit Logs)
 * Neo4j (Aura) for Attack Path Graph
 */

const { Pool } = require('pg');
const { MongoClient } = require('mongodb');
const neo4j = require('neo4j-driver');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

// ─── Clients ───
let pgPool = null;
let mongoClient = null;
let neo4jDriver = null;

let mongoDb = null;

async function initDB() {
  console.log('[DB] Connecting to Cloud Databases...');

  // 1. PostgreSQL
  try {
    pgPool = new Pool({ connectionString: process.env.PG_URI });
    await pgPool.query('SELECT NOW()');
    console.log('[DB] PostgreSQL connected successfully');
    await initPgSchema();
  } catch (err) {
    console.error('[DB] PostgreSQL connection failed:', err.message);
  }

  // 2. MongoDB
  try {
    const mongoUri = process.env.MONGO_URI;
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    mongoDb = mongoClient.db('mao_ir');
    console.log('[DB] MongoDB connected successfully');
  } catch (err) {
    console.error('[DB] MongoDB connection failed:', err.message);
  }

  // 3. Neo4j
  try {
    neo4jDriver = neo4j.driver(
      process.env.NEO4J_URI,
      neo4j.auth.basic(process.env.NEO4J_USER || 'neo4j', process.env.NEO4J_PASSWORD)
    );
    await neo4jDriver.getServerInfo();
    console.log('[DB] Neo4j connected successfully');
    await initNeo4jSchema();
  } catch (err) {
    console.error('[DB] Neo4j connection failed:', err.message);
  }
}

async function saveAndClose() {
  if (pgPool) await pgPool.end();
  if (mongoClient) await mongoClient.close();
  if (neo4jDriver) await neo4jDriver.close();
  console.log('[DB] All database connections closed.');
}

// ─── Schema Initialization ───
async function initPgSchema() {
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      department TEXT,
      role TEXT,
      status TEXT DEFAULT 'ACTIVE',
      risk_level TEXT DEFAULT 'LOW',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS user_sessions (
      id SERIAL PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      session_token TEXT UNIQUE NOT NULL,
      ip_address TEXT,
      device_fingerprint TEXT,
      geo_location TEXT,
      login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'ACTIVE'
    );
    CREATE TABLE IF NOT EXISTS trust_scores (
      id SERIAL PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      session_id INTEGER,
      score INTEGER NOT NULL,
      confidence REAL NOT NULL,
      risk_level TEXT NOT NULL,
      factors_json TEXT,
      narrative TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS trust_history (
      id SERIAL PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      score INTEGER NOT NULL,
      decay_rate REAL DEFAULT 0.0,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS trust_passports (
      id SERIAL PRIMARY KEY,
      passport_id TEXT UNIQUE NOT NULL,
      user_id TEXT REFERENCES users(id),
      trust_score INTEGER NOT NULL,
      behavioral_confidence REAL NOT NULL,
      device_trust TEXT NOT NULL,
      contextual_risk TEXT NOT NULL,
      verification_level TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      signature TEXT NOT NULL,
      issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL
    );
    CREATE TABLE IF NOT EXISTS privileged_actions (
      id SERIAL PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      session_id INTEGER,
      action_type TEXT NOT NULL,
      resource TEXT NOT NULL,
      query_text TEXT,
      risk_impact INTEGER DEFAULT 0,
      decision TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS behavioral_baselines (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      keystroke_dwell_mean REAL DEFAULT 0,
      keystroke_flight_mean REAL DEFAULT 0,
      mouse_speed_mean REAL DEFAULT 0,
      scroll_speed_mean REAL DEFAULT 0,
      sample_count INTEGER DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS access_tickets (
      ticket_id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      resource TEXT NOT NULL,
      status TEXT NOT NULL,
      valid_until TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS banking_resources (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      sensitivity_level TEXT NOT NULL,
      impact_score INTEGER DEFAULT 50
    );
    CREATE TABLE IF NOT EXISTS investigations (
      investigation_id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      trigger_event TEXT NOT NULL,
      status TEXT DEFAULT 'IN_PROGRESS',
      agents_involved TEXT,
      findings_json TEXT,
      risk_before INTEGER,
      risk_after INTEGER,
      response_action TEXT,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP
    );
  `;
  await pgPool.query(schema);

  // Seed Users if empty
  const res = await pgPool.query('SELECT COUNT(*) FROM users');
  if (parseInt(res.rows[0].count) === 0) {
    await pgPool.query(`
      INSERT INTO users (id, username, department, role) VALUES 
      ('usr_1', 'rajesh_dba', 'IT Infrastructure', 'PRIVILEGED'),
      ('usr_2', 'ameya_admin', 'Cybersecurity', 'ADMIN'),
      ('usr_3', 'tcs_vendor_01', 'External IT', 'VENDOR'),
      ('usr_4', 'priya_teller', 'Retail Banking', 'EMPLOYEE'),
      ('usr_5', 'vikram_audit', 'Compliance', 'AUDITOR')
    `);
    
    await pgPool.query(`
      INSERT INTO behavioral_baselines (user_id, keystroke_dwell_mean, keystroke_flight_mean, mouse_speed_mean, scroll_speed_mean, sample_count) VALUES 
      ('usr_1', 85, 105, 260, 110, 500),
      ('usr_2', 80, 95, 280, 120, 1000),
      ('usr_3', 140, 190, 140, 75, 150),
      ('usr_4', 95, 115, 210, 95, 800),
      ('usr_5', 110, 130, 180, 85, 300)
    `);

    await pgPool.query(`
      INSERT INTO banking_resources (name, type, sensitivity_level, impact_score) VALUES 
      ('Core Banking System (Finacle)', 'CORE_SYSTEM', 'CRITICAL', 100),
      ('SWIFT Payment Gateway', 'PAYMENT_GATEWAY', 'CRITICAL', 95),
      ('Customer KYC Repository', 'DATABASE', 'HIGH', 80),
      ('Retail Loan Origination', 'APPLICATION', 'MEDIUM', 50),
      ('HR Leave Management', 'PORTAL', 'LOW', 20)
    `);
  }
}

async function initNeo4jSchema() {
  const session = neo4jDriver.session();
  try {
    await session.run(`
      MERGE (u1:User {username: 'rajesh_dba', role: 'PRIVILEGED'})
      MERGE (u2:User {username: 'ameya_admin', role: 'ADMIN'})
      MERGE (u3:User {username: 'tcs_vendor_01', role: 'VENDOR'})
      MERGE (u4:User {username: 'priya_teller', role: 'EMPLOYEE'})
      MERGE (u5:User {username: 'vikram_audit', role: 'AUDITOR'})
      
      MERGE (r1:Resource {name: 'Core Banking System (Finacle)', impact: 100})
      MERGE (r2:Resource {name: 'SWIFT Payment Gateway', impact: 95})
      MERGE (r3:Resource {name: 'Customer KYC Repository', impact: 80})
      MERGE (r4:Resource {name: 'Retail Loan Origination', impact: 50})
      MERGE (r5:Resource {name: 'HR Leave Management', impact: 20})

      MERGE (u1)-[:HAS_ACCESS]->(r1)
      MERGE (u1)-[:HAS_ACCESS]->(r2)
      MERGE (u1)-[:HAS_ACCESS]->(r3)

      MERGE (u2)-[:HAS_ACCESS]->(r1)
      MERGE (u2)-[:HAS_ACCESS]->(r2)
      MERGE (u2)-[:HAS_ACCESS]->(r3)
      MERGE (u2)-[:HAS_ACCESS]->(r4)
      MERGE (u2)-[:HAS_ACCESS]->(r5)

      MERGE (u3)-[:HAS_ACCESS]->(r4)
      MERGE (u4)-[:HAS_ACCESS]->(r3)
      MERGE (u4)-[:HAS_ACCESS]->(r4)
      MERGE (u5)-[:HAS_ACCESS]->(r3)
    `);
  } finally {
    await session.close();
  }
}

// ─── Query Helpers ───
async function queryOne(sql, params = []) {
  if (!pgPool) return null;
  const res = await pgPool.query(sql, params);
  return res.rows[0];
}

async function queryAll(sql, params = []) {
  if (!pgPool) return [];
  const res = await pgPool.query(sql, params);
  return res.rows;
}

async function run(sql, params = []) {
  if (!pgPool) return { changes: 0 };
  const res = await pgPool.query(sql, params);
  return { changes: res.rowCount };
}

// ─── User Queries ───
const getUser = (username) => queryOne('SELECT * FROM users WHERE username = $1', [username]);
const getUserById = (id) => queryOne('SELECT * FROM users WHERE id = $1', [id]);
const getAllUsers = () => queryAll('SELECT * FROM users');
const updateUserStatus = (username, status) => run('UPDATE users SET status = $1 WHERE username = $2', [status, username]);
const updateUserRiskLevel = (username, riskLevel) => run('UPDATE users SET risk_level = $1 WHERE username = $2', [riskLevel, username]);

// ─── Session Queries ───
const createSession = (userId, token, ip, device, geo) =>
  run(
    'INSERT INTO user_sessions (user_id, session_token, ip_address, device_fingerprint, geo_location) VALUES ($1, $2, $3, $4, $5)',
    [userId, token, ip, device, geo]
  );
const getSessionByToken = (token) => queryOne('SELECT * FROM user_sessions WHERE session_token = $1', [token]);
const getUserSessions = (userId) => queryAll('SELECT * FROM user_sessions WHERE user_id = $1 ORDER BY login_at DESC', [userId]);
const getActiveSession = (userId) => queryOne("SELECT * FROM user_sessions WHERE user_id = $1 AND status = 'ACTIVE' ORDER BY login_at DESC LIMIT 1", [userId]);
const updateSessionStatus = (sessionId, status) => run('UPDATE user_sessions SET status = $1 WHERE id = $2', [status, sessionId]);
const expireUserSessions = (userId) => run("UPDATE user_sessions SET status = 'EXPIRED' WHERE user_id = $1 AND status = 'ACTIVE'", [userId]);
const updateSessionActivity = (sessionId) => run("UPDATE user_sessions SET last_activity = CURRENT_TIMESTAMP WHERE id = $1", [sessionId]);

// ─── Behavioral Baseline Queries ───
const getBaseline = (userId) => queryOne('SELECT * FROM behavioral_baselines WHERE user_id = $1', [userId]);
const updateBaseline = (userId, data) =>
  run(
    "UPDATE behavioral_baselines SET keystroke_dwell_mean = $1, keystroke_flight_mean = $2, mouse_speed_mean = $3, scroll_speed_mean = $4, sample_count = sample_count + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $5",
    [data.keystroke_dwell_mean, data.keystroke_flight_mean, data.mouse_speed_mean, data.scroll_speed_mean, userId]
  );

// ─── Trust Score Queries ───
const getTrustScore = (userId) => queryOne('SELECT * FROM trust_scores WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 1', [userId]);
const insertTrustScore = (userId, sessionId, score, confidence, riskLevel, factors, narrative) =>
  run(
    'INSERT INTO trust_scores (user_id, session_id, score, confidence, risk_level, factors_json, narrative) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [userId, sessionId, score, confidence, riskLevel, JSON.stringify(factors), narrative]
  );
const getTrustHistory = (userId, limit = 50) => queryAll('SELECT * FROM trust_history WHERE user_id = $1 ORDER BY timestamp DESC LIMIT $2', [userId, limit]);
const insertTrustHistory = (userId, score, decayRate) => run('INSERT INTO trust_history (user_id, score, decay_rate) VALUES ($1, $2, $3)', [userId, score, decayRate]);

// ─── Trust Passport Queries ───
const insertTrustPassport = (userId, data) =>
  run(
    'INSERT INTO trust_passports (passport_id, user_id, trust_score, behavioral_confidence, device_trust, contextual_risk, verification_level, risk_level, signature, expires_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
    [data.passport_id, userId, data.trust_score, data.behavioral_confidence, data.device_trust, data.contextual_risk, data.verification_level, data.risk_level, data.signature, data.expires_at]
  );
const getLatestPassport = (userId) => queryOne('SELECT * FROM trust_passports WHERE user_id = $1 ORDER BY issued_at DESC LIMIT 1', [userId]);

// ─── Privileged Actions ───
const insertPrivilegedAction = (userId, sessionId, actionType, resource, query, impact, decision) =>
  run(
    'INSERT INTO privileged_actions (user_id, session_id, action_type, resource, query_text, risk_impact, decision) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [userId, sessionId, actionType, resource, query, impact, decision]
  );
const getRecentActions = (userId, limit = 20) => queryAll('SELECT * FROM privileged_actions WHERE user_id = $1 ORDER BY timestamp DESC LIMIT $2', [userId, limit]);

// ─── Access Tickets & Resources ───
const getAccessTicket = (userId, resource) => queryOne("SELECT * FROM access_tickets WHERE user_id = $1 AND resource = $2 AND status = 'APPROVED'", [userId, resource]);
const getAllTickets = (userId) => queryAll('SELECT * FROM access_tickets WHERE user_id = $1', [userId]);
const getBankingResource = (name) => queryOne('SELECT * FROM banking_resources WHERE name = $1', [name]);
const getAllBankingResources = () => queryAll('SELECT * FROM banking_resources');

// ─── Investigations ───
const insertInvestigation = (data) =>
  run(
    'INSERT INTO investigations (investigation_id, user_id, trigger_event, agents_involved, findings_json, risk_before, risk_after, response_action) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    [data.investigation_id, data.user_id, data.trigger_event, data.agents_involved, JSON.stringify(data.findings), data.risk_before, data.risk_after, data.response_action]
  );
const updateInvestigation = (investigationId, data) =>
  run(
    "UPDATE investigations SET status = $1, findings_json = $2, risk_after = $3, response_action = $4, completed_at = CURRENT_TIMESTAMP WHERE investigation_id = $5",
    [data.status, JSON.stringify(data.findings), data.risk_after, data.response_action, investigationId]
  );
const getInvestigation = (investigationId) => queryOne('SELECT * FROM investigations WHERE investigation_id = $1', [investigationId]);
const getAllInvestigations = () => queryAll('SELECT * FROM investigations ORDER BY started_at DESC');

// ─── MongoDB (Digital Twins & Audit Logs) ───
const insertAuditLog = async (logId, username, action, resource, riskScore, decision, narrative, details) => {
  if (!mongoDb) return;
  const col = mongoDb.collection('audit_logs');
  await col.insertOne({
    log_id: logId,
    username,
    action,
    resource,
    risk_score: riskScore,
    decision,
    narrative,
    details,
    timestamp: new Date()
  });
};

const getAuditLogs = async (page = 1, limit = 50, filters = {}) => {
  if (!mongoDb) return { logs: [], total: 0, page, limit };
  const col = mongoDb.collection('audit_logs');
  const query = {};
  if (filters.username) query.username = filters.username;
  if (filters.action) query.action = filters.action;

  const total = await col.countDocuments(query);
  const logs = await col.find(query).sort({ timestamp: -1 }).skip((page - 1) * limit).limit(limit).toArray();
  return { logs, total, page, limit };
};

const getAuditLogsByUser = async (username, limit = 50) => {
  if (!mongoDb) return [];
  const col = mongoDb.collection('audit_logs');
  return await col.find({ username }).sort({ timestamp: -1 }).limit(limit).toArray();
};

const getDigitalTwin = async (username) => {
  if (!mongoDb) return null;
  return await mongoDb.collection('digital_twins').findOne({ username });
};

// ─── Neo4j Graph Queries ───
const calculateBlastRadius = async (username, resourceName) => {
  if (!neo4jDriver) return 50;
  const session = neo4jDriver.session();
  try {
    // Basic blast radius algorithm via Cypher
    const result = await session.run(`
      MATCH (u:User {username: $username})-[:HAS_ACCESS]->(r:Resource {name: $resourceName})
      RETURN r.impact AS impact
    `, { username, resourceName });
    
    if (result.records.length > 0) {
      return result.records[0].get('impact').toNumber();
    }
    return 30; // default if no direct graph access
  } catch (err) {
    console.error('[DB] Neo4j error:', err);
    return 50;
  } finally {
    await session.close();
  }
};

module.exports = {
  initDB, saveAndClose,
  getUser, getUserById, getAllUsers, updateUserStatus, updateUserRiskLevel,
  createSession, getSessionByToken, getUserSessions, getActiveSession, updateSessionStatus, expireUserSessions, updateSessionActivity,
  getBaseline, updateBaseline,
  getTrustScore, insertTrustScore, getTrustHistory, insertTrustHistory,
  insertTrustPassport, getLatestPassport,
  insertPrivilegedAction, getRecentActions,
  getAccessTicket, getAllTickets,
  getBankingResource, getAllBankingResources,
  insertInvestigation, updateInvestigation, getInvestigation, getAllInvestigations,
  insertAuditLog, getAuditLogs, getAuditLogsByUser,
  getDigitalTwin,
  calculateBlastRadius
};
