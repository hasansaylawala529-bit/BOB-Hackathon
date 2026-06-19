/**
 * MAO-IR Backend - AI Orchestrator Bridge
 * HTTP client to communicate with the Python FastAPI AI Orchestrator (port 8000).
 * All methods are fault-tolerant — return null on failure so backend doesn't crash.
 */

const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.AI_ORCHESTRATOR_URL || 'http://localhost:8000';
const TIMEOUT = 30000; // 30s timeout for AI processing

const client = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

async function safeCall(method, url, data = null) {
  try {
    const response = data ? await client[method](url, data) : await client[method](url);
    return response.data;
  } catch (err) {
    console.error(`[AI_BRIDGE] ${method.toUpperCase()} ${url} failed:`, err.message);
    return null;
  }
}

// ─── Individual Agent Endpoints ───
const analyzeBehavioral = (payload) =>
  safeCall('post', '/api/analyze/behavioral', payload);

const analyzeContextual = (contextData) =>
  safeCall('post', '/api/analyze/contextual', contextData);

const auditPrivilege = (actionData) =>
  safeCall('post', '/api/analyze/privilege', actionData);

const analyzeAttackPath = (userData) =>
  safeCall('post', '/api/analyze/attack-path', userData);

const calculateTrustScore = (allAgentResults) =>
  safeCall('post', '/api/analyze/trust-score', allAgentResults);

// ─── Full Investigation ───
const runInvestigation = (investigationPayload) =>
  safeCall('post', '/api/investigate', investigationPayload);

// ─── Engines ───
const getDigitalTwinPrediction = (username) =>
  safeCall('post', '/api/digital-twin/predict', { username });

const calculateTrustDecay = (username, lastVerified) =>
  safeCall('post', '/api/trust/decay', { username, last_verified: lastVerified });

// ─── Health Check ───
const healthCheck = () => safeCall('get', '/api/health');

module.exports = {
  analyzeBehavioral,
  analyzeContextual,
  auditPrivilege,
  analyzeAttackPath,
  calculateTrustScore,
  runInvestigation,
  getDigitalTwinPrediction,
  calculateTrustDecay,
  healthCheck,
};
