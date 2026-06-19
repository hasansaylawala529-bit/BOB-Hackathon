/**
 * MAO-IR Backend - Audit Logger
 * Writes to MongoDB collection 'audit_logs' via db.js
 * Every trust decision, login, action, and investigation is immutably logged.
 */

const db = require('./db');

/**
 * Generate a unique log ID: log_{timestamp}_{random5chars}
 */
function generateLogId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let random = '';
  for (let i = 0; i < 5; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `log_${Date.now()}_${random}`;
}

/**
 * Log an event to MongoDB.
 * @param {string} username
 * @param {string} action - USER_LOGIN, USER_LOGOUT, TELEMETRY_INGEST, TRUST_RECALCULATED, PRIVILEGED_ACTION, TICKET_CREATE, QUARANTINE, RESTORE, INVESTIGATION_STARTED, INVESTIGATION_COMPLETED, ADMIN_RESTORE
 * @param {string} resource
 * @param {number} riskScore
 * @param {string} decision - ALLOW, MONITOR, STEP_UP, RESTRICT, QUARANTINE, BLOCK
 * @param {string} narrative
 * @param {object} details
 * @returns {object} The log entry metadata
 */
async function logEvent(username, action, resource, riskScore = 0, decision = 'ALLOW', narrative = '', details = {}) {
  const logId = generateLogId();
  
  try {
    await db.insertAuditLog(logId, username, action, resource, riskScore, decision, narrative, details);
  } catch (err) {
    console.error('[AUDIT] Write failed:', err.message);
  }

  return { logId, timestamp: new Date().toISOString() };
}

module.exports = { logEvent };
