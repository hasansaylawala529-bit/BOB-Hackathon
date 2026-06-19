/**
 * MAO-IR Backend - User Management Routes
 * GET  /api/users                  — All users with trust status
 * GET  /api/users/:username        — Single user profile + digital twin
 * POST /api/users/:username/action — Simulate privileged action (triggers investigation)
 * POST /api/users/:username/quarantine — Quarantine user session
 * POST /api/users/:username/restore    — Restore quarantined user
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../services/db');
const { logEvent } = require('../services/audit_logger');
const { issueTrustPassport, classifyRisk } = require('../services/trust_passport');
const aiBridge = require('../services/ai_bridge');

/**
 * GET /api/users — All users with latest trust scores
 */
router.get('/', async (req, res) => {
  try {
    const users = await db.getAllUsers();
    
    const enriched = await Promise.all(users.map(async (user) => {
      const trustScore = await db.getTrustScore(user.id);
      const session = await db.getActiveSession(user.id);
      return {
        ...user,
        trust_score: trustScore?.score || 50,
        trust_confidence: trustScore?.confidence || 0.5,
        risk_level: trustScore?.risk_level || user.risk_level,
        narrative: trustScore?.narrative || '',
        has_active_session: !!session,
        last_activity: session?.last_activity || null,
      };
    }));
    
    res.json({ users: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/users/:username — Full user profile
 */
router.get('/:username', async (req, res) => {
  try {
    const user = await db.getUser(req.params.username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const trustScore = await db.getTrustScore(user.id);
    const baseline = await db.getBaseline(user.id);
    const sessions = await db.getUserSessions(user.id);
    const recentActions = await db.getRecentActions(user.id, 10);
    const tickets = await db.getAllTickets(user.id);
    const trustHistory = await db.getTrustHistory(user.id, 30);
    const passport = await db.getLatestPassport(user.id);
    const digitalTwin = await db.getDigitalTwin(req.params.username);

    res.json({
      user,
      trustScore: trustScore ? {
        score: trustScore.score,
        confidence: trustScore.confidence,
        risk_level: trustScore.risk_level,
        narrative: trustScore.narrative,
        factors: trustScore.factors_json ? JSON.parse(trustScore.factors_json) : {},
        timestamp: trustScore.timestamp,
      } : null,
      baseline,
      digitalTwin,
      sessions: sessions.slice(0, 5),
      recentActions,
      tickets,
      trustHistory,
      trustPassport: passport,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/users/:username/action
 * Simulate a privileged action. Triggers privilege audit → full investigation if risky.
 */
router.post('/:username/action', async (req, res) => {
  try {
    const { action_type, resource, query_text } = req.body;
    const username = req.params.username;

    const user = await db.getUser(username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.status === 'LOCKED') {
      return res.status(403).json({ decision: 'BLOCK', reason: 'Account is locked' });
    }

    const session = await db.getActiveSession(user.id);
    const bankingResource = await db.getBankingResource(resource);
    const impactScore = bankingResource?.impact_score || 50;
    const ticket = await db.getAccessTicket(user.id, resource);
    const hasTicket = !!ticket;

    // Call AI Orchestrator for full investigation
    const investigation = await aiBridge.runInvestigation({
      username,
      trigger_event: `privileged_action:${action_type}`,
      telemetry: {},
      context: {
        ip_address: session?.ip_address || '192.168.1.50',
        device_fingerprint: session?.device_fingerprint || 'unknown',
        geo_location: session?.geo_location || 'Mumbai, India',
        timestamp: new Date().toISOString(),
      },
      action: {
        action_type: action_type || 'DB_QUERY',
        resource: resource || 'Unknown',
        query_text: query_text || '',
        has_ticket: hasTicket,
        role: user.role,
        impact_score: impactScore,
      },
    });

    // Determine decision from investigation or fallback
    let riskScore = 0;
    let decision = 'ALLOW';
    let narrative = '';
    let responseAction = null;

    if (investigation && investigation.final_trust_score) {
      riskScore = investigation.final_trust_score.score || 0;
      decision = investigation.response_action?.action || determineDecision(riskScore);
      narrative = investigation.final_trust_score.narrative || '';
      responseAction = investigation.response_action;
    } else {
      // Fallback: local risk assessment
      riskScore = calculateLocalRisk(user, action_type, resource, query_text, hasTicket, impactScore);
      decision = determineDecision(riskScore);
      narrative = generateLocalNarrative(user, action_type, resource, query_text, riskScore, hasTicket);
    }

    // Store the privileged action
    await db.insertPrivilegedAction(user.id, session?.id || null, action_type || 'DB_QUERY', resource, query_text, impactScore, decision);

    // Store investigation if we got one
    if (investigation) {
      await db.insertInvestigation({
        investigation_id: investigation.investigation_id || `inv_${Date.now()}`,
        user_id: user.id,
        trigger_event: `privileged_action:${action_type}`,
        agents_involved: (investigation.agents_involved || []).join(','),
        findings: investigation.findings || {},
        risk_before: (await db.getTrustScore(user.id))?.score || 50,
        risk_after: riskScore,
        response_action: decision,
      });
    }

    // Update trust score
    await db.insertTrustScore(user.id, session?.id || null, 100 - riskScore, investigation?.final_trust_score?.confidence || 0.5,
      classifyRisk(riskScore), investigation?.final_trust_score?.contributing_factors || {}, narrative);
    await db.insertTrustHistory(user.id, 100 - riskScore, 0);

    // Auto-quarantine on critical risk
    if (riskScore > 80) {
      await db.updateUserStatus(username, 'QUARANTINED');
      await db.updateUserRiskLevel(username, 'CRITICAL');
      if (session) await db.updateSessionStatus(session.id, 'QUARANTINED');

      await logEvent(username, 'QUARANTINE', resource, riskScore, 'QUARANTINE',
        `Auto-quarantined: ${narrative}`, { action_type, query_text, decision });
    }

    // Log the action
    await logEvent(username, 'PRIVILEGED_ACTION', resource, riskScore, decision,
      narrative, { action_type, query_text, impact_score: impactScore, has_ticket: hasTicket });

    // Broadcast
    if (global.broadcast) {
      global.broadcast('TRUST_UPDATE', { username, trust_score: 100 - riskScore, risk_level: classifyRisk(riskScore) });
      if (riskScore > 50) {
        global.broadcast('ALERT', { type: 'PRIVILEGED_ACTION', username, risk_score: riskScore, decision, narrative });
      }
    }

    res.json({
      decision,
      risk_score: riskScore,
      trust_score: 100 - riskScore,
      risk_level: classifyRisk(riskScore),
      narrative,
      response_action: responseAction,
      investigation: investigation ? { id: investigation.investigation_id, status: investigation.status } : null,
    });
  } catch (err) {
    console.error('[USERS] Action error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/users/:username/quarantine
 */
router.post('/:username/quarantine', async (req, res) => {
  try {
    const { reason } = req.body;
    const username = req.params.username;
    const user = await db.getUser(username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await db.updateUserStatus(username, 'QUARANTINED');
    await db.updateUserRiskLevel(username, 'CRITICAL');
    await db.expireUserSessions(user.id);

    await db.insertTrustScore(user.id, null, 0, 1.0, 'CRITICAL', {}, `User quarantined: ${reason || 'Manual quarantine'}`);
    await db.insertTrustHistory(user.id, 0, 0);

    await logEvent(username, 'QUARANTINE', 'User Admin Console', 100, 'QUARANTINE',
      `User ${username} quarantined. Reason: ${reason || 'Manual quarantine'}`, { reason });

    if (global.broadcast) {
      global.broadcast('ALERT', { type: 'QUARANTINE', username, reason });
      global.broadcast('TRUST_UPDATE', { username, trust_score: 0, risk_level: 'CRITICAL' });
    }

    res.json({ success: true, status: 'QUARANTINED' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/users/:username/restore
 */
router.post('/:username/restore', async (req, res) => {
  try {
    const username = req.params.username;
    const user = await db.getUser(username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await db.updateUserStatus(username, 'ACTIVE');
    await db.updateUserRiskLevel(username, 'LOW');

    await db.insertTrustScore(user.id, null, 60, 0.5, 'MEDIUM', {}, 'User restored by administrator. Trust rebuilding.');
    await db.insertTrustHistory(user.id, 60, 0);

    const passport = await issueTrustPassport(username);

    await logEvent(username, 'ADMIN_RESTORE', 'User Admin Console', 0, 'ALLOW',
      `Administrator manually RESTORED user ${username}.`);

    if (global.broadcast) {
      global.broadcast('TRUST_UPDATE', { username, trust_score: 60, risk_level: 'MEDIUM' });
    }

    res.json({ success: true, status: 'ACTIVE', newTrustScore: 60, trustPassport: passport });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Local Fallback Risk Calculation ───
function calculateLocalRisk(user, actionType, resource, queryText, hasTicket, impactScore) {
  let risk = 0;
  const query = (queryText || '').toUpperCase();
  if (query.includes('DROP') || query.includes('TRUNCATE')) risk += 80;
  else if (query.includes('GRANT') || query.includes('REVOKE')) risk += 70;
  else if (query.includes('DELETE')) risk += 50;
  else if (query.includes('UPDATE') || query.includes('INSERT')) risk += 20;
  else risk += 5;

  const rolePermissions = {
    ADMIN: ['Core Banking System (Finacle)', 'SWIFT Payment Gateway', 'Customer KYC Repository', 'Retail Loan Origination', 'HR Leave Management'],
    PRIVILEGED: ['Core Banking System (Finacle)', 'SWIFT Payment Gateway', 'Customer KYC Repository'],
    EMPLOYEE: ['Customer KYC Repository', 'Retail Loan Origination'],
    VENDOR: ['Retail Loan Origination'],
  };
  const permitted = rolePermissions[user.role] || [];
  if (!permitted.includes(resource)) risk += 40;
  if (impactScore >= 75 && !hasTicket) risk += 25;

  const hour = new Date().getHours();
  if (hour < 6 || hour > 22) risk += 20;

  risk = Math.min(100, Math.round(risk * (impactScore / 100)));
  return risk;
}

function determineDecision(riskScore) {
  if (riskScore <= 30) return 'ALLOW';
  if (riskScore <= 60) return 'STEP_UP_AUTH';
  if (riskScore <= 80) return 'RESTRICT';
  return 'QUARANTINE';
}

function generateLocalNarrative(user, actionType, resource, queryText, riskScore, hasTicket) {
  const parts = [`Risk Score: ${riskScore}.`];
  const query = (queryText || '').toUpperCase();
  if (query.includes('DROP') || query.includes('TRUNCATE')) parts.push(`Destructive query detected (${queryText}).`);
  if (query.includes('GRANT') || query.includes('REVOKE')) parts.push(`Privilege escalation attempt detected (${queryText}).`);

  const rolePermissions = {
    ADMIN: ['Core Banking System (Finacle)', 'SWIFT Payment Gateway', 'Customer KYC Repository', 'Retail Loan Origination', 'HR Leave Management'],
    PRIVILEGED: ['Core Banking System (Finacle)', 'SWIFT Payment Gateway', 'Customer KYC Repository'],
    EMPLOYEE: ['Customer KYC Repository', 'Retail Loan Origination'],
    VENDOR: ['Retail Loan Origination'],
  };
  if (!(rolePermissions[user.role] || []).includes(resource)) parts.push(`User role ${user.role} does not have permission to access ${resource}.`);
  if (!hasTicket && resource !== 'Retail Loan Origination') parts.push(`No approved access ticket found for ${resource}.`);

  const hour = new Date().getHours();
  if (hour < 6 || hour > 22) parts.push(`Activity detected outside normal business hours (${hour}:00).`);

  return parts.join(' ');
}

module.exports = router;
