/**
 * MAO-IR Backend - Trust Routes
 * GET  /api/trust/score/:userId       — Current trust score
 * GET  /api/trust/passport/:userId    — Current Trust Passport (signed)
 * GET  /api/trust/history/:userId     — Trust score history for decay chart
 * POST /api/trust/recalculate         — Force trust recalculation via AI orchestrator
 */

const express = require('express');
const router = express.Router();
const db = require('../services/db');
const { issueTrustPassport, classifyRisk } = require('../services/trust_passport');
const { logEvent } = require('../services/audit_logger');
const aiBridge = require('../services/ai_bridge');

/**
 * GET /api/trust/score/:username
 */
router.get('/score/:username', async (req, res) => {
  try {
    const user = await db.getUser(req.params.username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const trustScore = await db.getTrustScore(user.id);
    if (!trustScore) {
      return res.json({ score: 50, confidence: 0.5, risk_level: 'MEDIUM', narrative: 'No trust data available.' });
    }

    res.json({
      user_id: user.username,
      score: trustScore.score,
      confidence: trustScore.confidence,
      risk_level: trustScore.risk_level,
      narrative: trustScore.narrative,
      factors: trustScore.factors_json ? JSON.parse(trustScore.factors_json) : {},
      timestamp: trustScore.timestamp,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/trust/passport/:username
 */
router.get('/passport/:username', async (req, res) => {
  try {
    const user = await db.getUser(req.params.username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let passport = await db.getLatestPassport(user.id);

    // If no passport or expired, issue a new one
    if (!passport || new Date(passport.expires_at) < new Date()) {
      passport = await issueTrustPassport(req.params.username);
    }

    res.json(passport);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/trust/history/:username
 */
router.get('/history/:username', async (req, res) => {
  try {
    const user = await db.getUser(req.params.username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const limit = parseInt(req.query.limit) || 50;
    const history = await db.getTrustHistory(user.id, limit);

    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/trust/recalculate
 * Triggers a full trust recalculation via the AI Orchestrator.
 */
router.post('/recalculate', async (req, res) => {
  try {
    const { username, trigger } = req.body;
    if (!username) return res.status(400).json({ error: 'username is required' });

    const user = await db.getUser(username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get current context
    const session = await db.getActiveSession(user.id);
    const baseline = await db.getBaseline(user.id);
    const currentScore = await db.getTrustScore(user.id);

    // Call AI Orchestrator for full investigation
    const investigation = await aiBridge.runInvestigation({
      username,
      trigger_event: trigger || 'manual_recalculation',
      telemetry: {},
      context: {
        ip_address: session?.ip_address || '192.168.1.50',
        device_fingerprint: session?.device_fingerprint || 'unknown',
        geo_location: session?.geo_location || 'Mumbai, India',
        timestamp: new Date().toISOString(),
      },
      action: {},
    });

    let newScore = currentScore?.score || 50;
    let newRiskLevel = classifyRisk(newScore);
    let narrative = currentScore?.narrative || 'Trust recalculated.';

    if (investigation) {
      newScore = investigation.final_trust_score?.score || newScore;
      newRiskLevel = investigation.final_trust_score?.risk_level || newRiskLevel;
      narrative = investigation.final_trust_score?.narrative || narrative;

      // Store new trust score
      await db.insertTrustScore(user.id, session?.id || null, newScore, investigation.final_trust_score?.confidence || 0.5, newRiskLevel,
        investigation.final_trust_score?.contributing_factors || {}, narrative);

      // Store in trust history
      await db.insertTrustHistory(user.id, newScore, 0);
    }

    // Log the recalculation
    await logEvent(username, 'TRUST_RECALCULATED', 'Trust Engine', newScore, classifyRisk(newScore) === 'LOW' ? 'ALLOW' : 'MONITOR',
      `Trust score recalculated: ${newScore} (${newRiskLevel}).`, { trigger, previous_score: currentScore?.score });

    // Broadcast update
    if (global.broadcast) {
      global.broadcast('TRUST_UPDATE', { username, trust_score: newScore, risk_level: newRiskLevel });
    }

    res.json({
      user_id: username,
      score: newScore,
      risk_level: newRiskLevel,
      narrative,
      investigation: investigation || null,
    });
  } catch (err) {
    console.error('[TRUST] Recalculate error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
