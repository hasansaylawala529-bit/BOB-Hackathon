/**
 * MAO-IR Backend - Telemetry Routes
 * POST /api/telemetry/ingest       — Receive batched biometric data from frontend
 * GET  /api/telemetry/baseline/:id — Get user's behavioral baseline
 */

const express = require('express');
const router = express.Router();
const db = require('../services/db');
const { hashBehavior } = require('../services/encryption');
const { logEvent } = require('../services/audit_logger');
const aiBridge = require('../services/ai_bridge');

/**
 * POST /api/telemetry/ingest
 * Receives batched behavioral biometrics from the frontend silent tracker.
 * Stores, forwards to AI for analysis, triggers investigation if anomalous.
 */
router.post('/ingest', async (req, res) => {
  try {
    const { username, session_id, timestamp, device_fingerprint, ip_address, geo_location, behavioral_data } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'username is required' });
    }

    const user = await db.getUser(username);
    if (!user) {
      return res.status(404).json({ error: `User not found: ${username}` });
    }

    // Count samples
    const keystrokeSamples = behavioral_data?.keystroke_events?.length || 0;
    const mouseSamples = behavioral_data?.mouse_events?.length || 0;
    const scrollSamples = behavioral_data?.scroll_events?.length || 0;
    const totalSamples = keystrokeSamples + mouseSamples + scrollSamples;

    if (totalSamples === 0) {
      return res.json({ received: true, samples: 0, message: 'No telemetry data in batch' });
    }

    // Generate encrypted behavioral hash
    const behaviorHash = hashBehavior(behavioral_data);

    // Update session activity timestamp
    if (session_id) {
      const session = await db.getSessionByToken(session_id);
      if (session) await db.updateSessionActivity(session.id);
    }

    // Forward to AI Orchestrator for behavioral analysis
    let anomalyScore = 0;
    let aiResult = null;

    const aiPayload = {
      username,
      behavioral_data: behavioral_data || {},
      device_fingerprint: device_fingerprint || 'unknown',
      ip_address: ip_address || '192.168.1.50',
      geo_location: geo_location || 'Mumbai, India',
      timestamp: timestamp || new Date().toISOString(),
    };

    aiResult = await aiBridge.analyzeBehavioral(aiPayload);
    if (aiResult) {
      anomalyScore = aiResult.anomaly_score || 0;
    }

    // If anomaly detected (score > 50), trigger full investigation
    let investigation = null;
    if (anomalyScore > 50) {
      investigation = await aiBridge.runInvestigation({
        username,
        trigger_event: 'behavioral_anomaly',
        telemetry: behavioral_data,
        context: {
          ip_address: ip_address || '192.168.1.50',
          device_fingerprint: device_fingerprint || 'unknown',
          geo_location: geo_location || 'Mumbai, India',
          timestamp: timestamp || new Date().toISOString(),
        },
        action: {},
      });

      if (investigation && global.broadcast) {
        global.broadcast('ALERT', {
          type: 'BEHAVIORAL_ANOMALY',
          username,
          anomaly_score: anomalyScore,
          investigation,
        });
      }
    }

    // Update behavioral baseline (weighted moving average)
    if (keystrokeSamples > 0 || mouseSamples > 0) {
      await updateBaselineFromTelemetry(user.id, behavioral_data);
    }

    // Log the telemetry ingestion
    await logEvent(username, 'TELEMETRY_INGEST', 'Telemetry Pipeline', anomalyScore, 'MONITOR',
      `Aggregated client biometric telemetry stream for user ${username}.`,
      { keystroke_samples: keystrokeSamples, mouse_samples: mouseSamples, scroll_samples: scrollSamples, anomaly_score: anomalyScore }
    );

    // Broadcast trust update via WebSocket
    if (global.broadcast) {
      const trustScore = await db.getTrustScore(user.id);
      global.broadcast('TRUST_UPDATE', {
        username,
        trust_score: trustScore?.score || 50,
        risk_level: trustScore?.risk_level || 'LOW',
        anomaly_score: anomalyScore,
      });
    }

    res.json({
      received: true,
      samples: totalSamples,
      behavior_hash: behaviorHash,
      anomaly_score: anomalyScore,
      investigation: investigation ? { id: investigation.investigation_id, status: investigation.status } : null,
    });
  } catch (err) {
    console.error('[TELEMETRY] Ingest error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/telemetry/baseline/:username
 */
router.get('/baseline/:username', async (req, res) => {
  try {
    const user = await db.getUser(req.params.username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const baseline = await db.getBaseline(user.id);
    res.json({ baseline });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Update baseline using weighted moving average of new telemetry.
 */
async function updateBaselineFromTelemetry(userId, behavioralData) {
  const current = await db.getBaseline(userId);
  if (!current) return;

  const alpha = 0.1; // Learning rate — new data contributes 10%
  const keystrokes = behavioralData.keystroke_events || [];
  const mouseEvents = behavioralData.mouse_events || [];
  const scrollEvents = behavioralData.scroll_events || [];

  let newDwell = current.keystroke_dwell_mean;
  let newFlight = current.keystroke_flight_mean;
  let newMouse = current.mouse_speed_mean;
  let newScroll = current.scroll_speed_mean;

  if (keystrokes.length > 0) {
    const avgDwell = keystrokes.reduce((s, k) => s + (k.dwell_time_ms || 0), 0) / keystrokes.length;
    const avgFlight = keystrokes.filter(k => k.flight_time_ms).reduce((s, k) => s + k.flight_time_ms, 0) / (keystrokes.filter(k => k.flight_time_ms).length || 1);
    newDwell = alpha * avgDwell + (1 - alpha) * current.keystroke_dwell_mean;
    newFlight = alpha * avgFlight + (1 - alpha) * current.keystroke_flight_mean;
  }

  if (mouseEvents.length > 0) {
    const avgSpeed = mouseEvents.reduce((s, m) => s + (m.velocity || 0), 0) / mouseEvents.length;
    newMouse = alpha * avgSpeed + (1 - alpha) * current.mouse_speed_mean;
  }

  if (scrollEvents.length > 0) {
    const avgScroll = scrollEvents.reduce((s, sc) => s + (sc.speed || 0), 0) / scrollEvents.length;
    newScroll = alpha * avgScroll + (1 - alpha) * current.scroll_speed_mean;
  }

  await db.updateBaseline(userId, {
    keystroke_dwell_mean: Math.round(newDwell * 100) / 100,
    keystroke_flight_mean: Math.round(newFlight * 100) / 100,
    mouse_speed_mean: Math.round(newMouse * 100) / 100,
    scroll_speed_mean: Math.round(newScroll * 100) / 100,
  });
}

module.exports = router;
