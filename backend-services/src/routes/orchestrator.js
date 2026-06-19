/**
 * MAO-IR Backend - Orchestrator Routes
 * POST /api/orchestrator/investigate — Trigger full autonomous investigation
 * GET  /api/orchestrator/status/:id  — Investigation status
 * POST /api/orchestrator/simulate    — Run preset attack scenario for demo
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../services/db');
const { logEvent } = require('../services/audit_logger');
const { classifyRisk } = require('../services/trust_passport');
const aiBridge = require('../services/ai_bridge');

/**
 * POST /api/orchestrator/investigate
 * Triggers the full LangGraph investigation pipeline.
 */
router.post('/investigate', async (req, res) => {
  try {
    const { username, trigger_event, context, action } = req.body;
    if (!username) return res.status(400).json({ error: 'username is required' });

    const user = await db.getUser(username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const investigationId = `inv_${Date.now()}_${uuidv4().slice(0, 8)}`;

    await logEvent(username, 'INVESTIGATION_STARTED', trigger_event || 'manual', 0, 'MONITOR',
      `Autonomous investigation started for ${username}. Trigger: ${trigger_event || 'manual'}`,
      { investigation_id: investigationId });

    // Call AI Orchestrator
    const result = await aiBridge.runInvestigation({
      username,
      trigger_event: trigger_event || 'manual',
      telemetry: req.body.telemetry || {},
      context: context || {},
      action: action || {},
    });

    let finalResult;

    if (result) {
      finalResult = result;
      finalResult.investigation_id = investigationId;
    } else {
      // Fallback — AI not available, run local assessment
      finalResult = await runLocalInvestigation(user, trigger_event, context, action);
      finalResult.investigation_id = investigationId;
    }

    // Store investigation
    await db.insertInvestigation({
      investigation_id: investigationId,
      user_id: user.id,
      trigger_event: trigger_event || 'manual',
      agents_involved: (finalResult.agents_involved || []).join(','),
      findings: finalResult.findings || {},
      risk_before: (await db.getTrustScore(user.id))?.score || 50,
      risk_after: finalResult.final_trust_score?.score || 0,
      response_action: finalResult.response_action?.action || 'MONITOR',
    });

    // Update trust
    const riskScore = finalResult.final_trust_score?.score || 0;
    const trustScore = 100 - riskScore;
    await db.insertTrustScore(user.id, null, trustScore, finalResult.final_trust_score?.confidence || 0.5,
      classifyRisk(riskScore), finalResult.final_trust_score?.contributing_factors || {},
      finalResult.final_trust_score?.narrative || '');
    await db.insertTrustHistory(user.id, trustScore, 0);

    // Auto-quarantine if critical
    if (riskScore > 80) {
      await db.updateUserStatus(username, 'QUARANTINED');
      await db.updateUserRiskLevel(username, 'CRITICAL');
    } else if (riskScore > 60) {
      await db.updateUserRiskLevel(username, 'HIGH');
    }

    await logEvent(username, 'INVESTIGATION_COMPLETED', trigger_event || 'manual', riskScore,
      finalResult.response_action?.action || 'MONITOR',
      finalResult.final_trust_score?.narrative || 'Investigation completed.',
      { investigation_id: investigationId, risk_score: riskScore });

    // Broadcast
    if (global.broadcast) {
      global.broadcast('INVESTIGATION', { investigation_id: investigationId, username, ...finalResult });
      global.broadcast('TRUST_UPDATE', { username, trust_score: trustScore, risk_level: classifyRisk(riskScore) });
    }

    res.json(finalResult);
  } catch (err) {
    console.error('[ORCHESTRATOR] Investigation error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/orchestrator/status/:id
 */
router.get('/status/:id', async (req, res) => {
  try {
    const inv = await db.getInvestigation(req.params.id);
    if (!inv) return res.status(404).json({ error: 'Investigation not found' });

    res.json({
      ...inv,
      findings: inv.findings_json ? JSON.parse(inv.findings_json) : {},
      agents_involved: inv.agents_involved ? inv.agents_involved.split(',') : [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/orchestrator/simulate
 */
router.post('/simulate', async (req, res) => {
  try {
    const { scenario } = req.body;
    if (!scenario) return res.status(400).json({ error: 'scenario is required' });

    const scenarioData = getScenarioData(scenario);
    if (!scenarioData) return res.status(400).json({ error: `Unknown scenario: ${scenario}` });

    const user = await db.getUser(scenarioData.username);
    if (!user) return res.status(404).json({ error: `User not found: ${scenarioData.username}` });

    if (user.status !== 'ACTIVE') {
      await db.updateUserStatus(scenarioData.username, 'ACTIVE');
      await db.updateUserRiskLevel(scenarioData.username, 'LOW');
    }

    const investigationId = `sim_${Date.now()}_${scenario}`;

    let result = await aiBridge.runInvestigation({
      username: scenarioData.username,
      trigger_event: scenarioData.trigger,
      telemetry: scenarioData.telemetry,
      context: scenarioData.context,
      action: scenarioData.action,
    });

    if (!result) {
      result = await runLocalInvestigation(user, scenarioData.trigger, scenarioData.context, scenarioData.action);
    }

    result.investigation_id = investigationId;
    result.scenario = scenario;

    const riskScore = result.final_trust_score?.score || 0;
    await db.insertInvestigation({
      investigation_id: investigationId,
      user_id: user.id,
      trigger_event: scenarioData.trigger,
      agents_involved: (result.agents_involved || []).join(','),
      findings: result.findings || {},
      risk_before: (await db.getTrustScore(user.id))?.score || 50,
      risk_after: riskScore,
      response_action: result.response_action?.action || 'MONITOR',
    });

    const trustScore = 100 - riskScore;
    await db.insertTrustScore(user.id, null, trustScore, result.final_trust_score?.confidence || 0.5,
      classifyRisk(riskScore), result.final_trust_score?.contributing_factors || {},
      result.final_trust_score?.narrative || '');
    await db.insertTrustHistory(user.id, trustScore, 0);

    if (riskScore > 80) {
      await db.updateUserStatus(scenarioData.username, 'QUARANTINED');
      await db.updateUserRiskLevel(scenarioData.username, 'CRITICAL');
    } else if (riskScore > 60) {
      await db.updateUserRiskLevel(scenarioData.username, 'HIGH');
    }

    await logEvent(scenarioData.username, 'INVESTIGATION_COMPLETED', `simulation:${scenario}`, riskScore,
      result.response_action?.action || 'MONITOR',
      result.final_trust_score?.narrative || `Simulation completed: ${scenario}`,
      { investigation_id: investigationId, scenario });

    if (global.broadcast) {
      global.broadcast('INVESTIGATION', { investigation_id: investigationId, username: scenarioData.username, scenario, ...result });
      global.broadcast('TRUST_UPDATE', { username: scenarioData.username, trust_score: trustScore, risk_level: classifyRisk(riskScore) });
      if (riskScore > 50) {
        global.broadcast('ALERT', { type: `SIMULATION_${scenario.toUpperCase()}`, username: scenarioData.username, risk_score: riskScore });
      }
    }

    res.json(result);
  } catch (err) {
    console.error('[ORCHESTRATOR] Simulate error:', err);
    res.status(500).json({ error: err.message });
  }
});

function getScenarioData(scenario) {
  const scenarios = {
    normal_access: {
      username: 'priya_teller',
      trigger: 'routine_access',
      context: { ip_address: '192.168.1.50', device_fingerprint: 'known_device_priya_001', geo_location: 'Mumbai, India', timestamp: new Date().toISOString() },
      telemetry: { keystroke_events: [{ dwell_time_ms: 98, flight_time_ms: 118 }], mouse_events: [{ velocity: 195, acceleration: 8, path_curvature: 0.3 }], scroll_events: [{ speed: 88, direction: 'DOWN' }] },
      action: { action_type: 'DB_QUERY', resource: 'Retail Loan Origination', query_text: 'SELECT * FROM loans WHERE status = active', has_ticket: true, role: 'EMPLOYEE', impact_score: 50 },
    },
    insider_threat: {
      username: 'rajesh_dba',
      trigger: 'suspicious_access_pattern',
      context: { ip_address: '192.168.1.50', device_fingerprint: 'known_device_rajesh_001', geo_location: 'Mumbai, India', timestamp: new Date(new Date().setHours(2, 30, 0)).toISOString() },
      telemetry: { keystroke_events: [{ dwell_time_ms: 150, flight_time_ms: 200 }], mouse_events: [{ velocity: 500, acceleration: 25, path_curvature: 1.5 }], scroll_events: [{ speed: 40, direction: 'DOWN' }] },
      action: { action_type: 'DB_QUERY', resource: 'SWIFT Payment Gateway', query_text: 'SELECT * FROM swift_transactions WHERE amount > 1000000', has_ticket: false, role: 'PRIVILEGED', impact_score: 95 },
    },
    compromised_vendor: {
      username: 'tcs_vendor_01',
      trigger: 'anomalous_login',
      context: { ip_address: '45.33.32.156', device_fingerprint: 'unknown_device_xyz', geo_location: 'Lagos, Nigeria', timestamp: new Date().toISOString() },
      telemetry: { keystroke_events: [{ dwell_time_ms: 50, flight_time_ms: 60 }], mouse_events: [{ velocity: 800, acceleration: 50, path_curvature: 0.1 }], scroll_events: [{ speed: 200, direction: 'DOWN' }] },
      action: { action_type: 'DB_QUERY', resource: 'Retail Loan Origination', query_text: 'DROP TABLE loans', has_ticket: false, role: 'VENDOR', impact_score: 50 },
    },
    privilege_escalation: {
      username: 'ameya_admin',
      trigger: 'privilege_escalation_attempt',
      context: { ip_address: '192.168.1.50', device_fingerprint: 'known_device_ameya_001', geo_location: 'Mumbai, India', timestamp: new Date().toISOString() },
      telemetry: { keystroke_events: [{ dwell_time_ms: 85, flight_time_ms: 100 }], mouse_events: [{ velocity: 300, acceleration: 10, path_curvature: 0.5 }], scroll_events: [{ speed: 115, direction: 'DOWN' }] },
      action: { action_type: 'DB_QUERY', resource: 'Core Banking System (Finacle)', query_text: 'GRANT ALL PRIVILEGES ON core_db TO tcs_vendor_01', has_ticket: false, role: 'ADMIN', impact_score: 100 },
    },
  };
  return scenarios[scenario] || null;
}

async function runLocalInvestigation(user, triggerEvent, context, action) {
  const findings = {};
  let totalRisk = 0;
  const agentsInvolved = [];

  agentsInvolved.push('behavioral_profiler');
  let behavioralScore = 10; 
  findings.behavioral_analysis = { anomaly_score: behavioralScore, confidence: 0.8, deviations: [] };
  totalRisk += behavioralScore * 0.25;

  agentsInvolved.push('contextualizer');
  let contextScore = 0;
  const contextRiskFactors = [];
  if (context) {
    if (context.ip_address && !context.ip_address.startsWith('192.168')) { contextScore += 40; contextRiskFactors.push({ factor: 'ip_address', value: context.ip_address, risk: 40, description: 'External/unknown IP address' }); }
    if (context.geo_location && !context.geo_location.includes('Mumbai')) { contextScore += 30; contextRiskFactors.push({ factor: 'geo_location', value: context.geo_location, risk: 30, description: 'Login from unexpected location' }); }
    if (context.device_fingerprint && context.device_fingerprint.includes('unknown')) { contextScore += 30; contextRiskFactors.push({ factor: 'device', value: context.device_fingerprint, risk: 30, description: 'Unknown/new device detected' }); }
    if (context.timestamp) { const hour = new Date(context.timestamp).getHours(); if (hour < 6 || hour > 22) { contextScore += 30; contextRiskFactors.push({ factor: 'time', value: `${hour}:00`, risk: 30, description: 'Activity outside normal business hours' }); } }
  }
  contextScore = Math.min(100, contextScore);
  findings.contextual_analysis = { context_risk_score: contextScore, risk_factors: contextRiskFactors };
  totalRisk += contextScore * 0.20;

  agentsInvolved.push('privilege_auditor');
  let privilegeScore = 0;
  const violations = [];
  if (action) {
    const query = (action.query_text || '').toUpperCase();
    if (query.includes('DROP') || query.includes('TRUNCATE')) { privilegeScore += 80; violations.push({ type: 'destructive_query', description: `Destructive query: ${action.query_text}`, severity: 'CRITICAL' }); }
    if (query.includes('GRANT') || query.includes('REVOKE')) { privilegeScore += 70; violations.push({ type: 'privilege_escalation', description: `Privilege modification: ${action.query_text}`, severity: 'CRITICAL' }); }
    if (query.includes('DELETE')) { privilegeScore += 50; violations.push({ type: 'data_deletion', description: `Data deletion attempt`, severity: 'HIGH' }); }
    const rolePerms = { ADMIN: ['Core Banking System (Finacle)', 'SWIFT Payment Gateway', 'Customer KYC Repository', 'Retail Loan Origination', 'HR Leave Management'], PRIVILEGED: ['Core Banking System (Finacle)', 'SWIFT Payment Gateway', 'Customer KYC Repository'], EMPLOYEE: ['Customer KYC Repository', 'Retail Loan Origination'], VENDOR: ['Retail Loan Origination'] };
    if (action.resource && !(rolePerms[user.role] || []).includes(action.resource)) { privilegeScore += 40; violations.push({ type: 'unauthorized_access', description: `${user.role} accessing ${action.resource} without permission`, severity: 'HIGH' }); }
    if (!action.has_ticket && (action.impact_score || 0) >= 75) { privilegeScore += 25; violations.push({ type: 'no_ticket', description: `No approved access ticket for ${action.resource}`, severity: 'MEDIUM' }); }
  }
  privilegeScore = Math.min(100, privilegeScore);
  findings.privilege_audit = { privilege_risk_score: privilegeScore, violations, banking_impact: action?.impact_score || 0 };
  totalRisk += privilegeScore * 0.25;

  agentsInvolved.push('attack_path');
  // Query Real Neo4j for blast radius
  const blastRadius = action?.resource ? await db.calculateBlastRadius(user.username, action.resource) : 30;
  
  findings.attack_path = {
    escalation_paths: privilegeScore > 60 ? [{ from: user.username, to: action?.resource, via: user.role, risk: privilegeScore }] : [],
    lateral_movement_risk: privilegeScore > 40 ? 60 : 20,
    blast_radius: blastRadius,
  };
  totalRisk += blastRadius * 0.10;

  agentsInvolved.push('digital_twin');
  let twinDeviation = contextScore > 40 || privilegeScore > 40 ? 60 : 10;
  findings.twin_deviation = { deviation_score: twinDeviation, expected_vs_actual: {} };
  totalRisk += twinDeviation * 0.10;

  agentsInvolved.push('trust_decay');
  findings.trust_decay = { current_trust: 70, decay_rate: 0.005, time_since_verification_min: 30 };
  totalRisk += 15 * 0.10;

  totalRisk = Math.min(100, Math.round(totalRisk));

  const narrativeParts = [`Risk Score: ${totalRisk}.`];
  if (contextRiskFactors.length > 0) contextRiskFactors.forEach(f => narrativeParts.push(f.description + '.'));
  violations.forEach(v => narrativeParts.push(v.description + '.'));
  if (twinDeviation > 40) narrativeParts.push('Digital Twin detected significant behavioral deviation.');
  if (blastRadius > 60) narrativeParts.push(`Identity graph (Neo4j) indicates high blast radius (${blastRadius}).`);

  let responseAction;
  if (totalRisk <= 30) responseAction = { action: 'ALLOW', enforcement: ['Continue monitoring'], notify: [] };
  else if (totalRisk <= 60) responseAction = { action: 'STEP_UP_AUTH', enforcement: ['Require MFA', 'Session monitoring'], notify: ['user'] };
  else if (totalRisk <= 80) responseAction = { action: 'RESTRICT', enforcement: ['Read-only access', 'Block exports', 'Manager approval'], notify: ['user', 'manager'] };
  else responseAction = { action: 'QUARANTINE', enforcement: ['Session quarantine', 'Account lock', 'Evidence capture', 'SOC notification'], notify: ['user', 'manager', 'soc_team', 'ciso'] };

  return {
    status: 'COMPLETED',
    agents_involved: agentsInvolved,
    findings,
    final_trust_score: {
      score: totalRisk,
      confidence: 0.75,
      risk_level: classifyRisk(totalRisk),
      contributing_factors: { behavioral_score: findings.behavioral_analysis.anomaly_score, contextual_score: findings.contextual_analysis.context_risk_score, privilege_score: findings.privilege_audit.privilege_risk_score, attack_path_score: blastRadius, twin_deviation_score: twinDeviation, trust_decay_score: 15 },
      narrative: narrativeParts.join(' '),
      recommended_action: responseAction.action,
    },
    response_action: responseAction,
  };
}

module.exports = router;
