/**
 * MAO-IR Backend - Auth Routes
 * POST /api/auth/login   — Authenticate user, create session, issue Trust Passport
 * POST /api/auth/logout  — End session
 * GET  /api/auth/session/:token — Get session info
 */

const express = require('express');
const router = express.Router();
const db = require('../services/db');
const { generateSessionToken } = require('../services/encryption');
const { issueTrustPassport } = require('../services/trust_passport');
const { logEvent } = require('../services/audit_logger');

/**
 * POST /api/auth/login
 * For hackathon demo: any password works. Focus is on post-auth continuous trust.
 */
router.post('/login', async (req, res) => {
  try {
    const { username, ip_address, device_fingerprint, geo_location } = req.body;

    if (!username) {
      return res.status(400).json({ success: false, error: 'Username is required' });
    }

    const user = await db.getUser(username);
    if (!user) {
      return res.status(404).json({ success: false, error: `User not found: ${username}` });
    }

    if (user.status === 'LOCKED') {
      return res.status(403).json({ success: false, error: 'Account is locked. Contact administrator.' });
    }

    // Expire any previous active sessions
    await db.expireUserSessions(user.id);

    // Create new session
    const sessionToken = generateSessionToken();
    const ip = ip_address || req.ip || '192.168.1.50';
    const device = device_fingerprint || 'unknown';
    const geo = geo_location || 'Mumbai, India';

    await db.createSession(user.id, sessionToken, ip, device, geo);
    const session = await db.getSessionByToken(sessionToken);

    // If user was quarantined, keep quarantined status
    if (user.status === 'QUARANTINED') {
      await db.updateSessionStatus(session.id, 'QUARANTINED');
    }

    // Issue Trust Passport
    const trustPassport = await issueTrustPassport(username);

    // Log the login
    await logEvent(username, 'USER_LOGIN', 'Auth Server', 0, 'ALLOW',
      `User ${username} successfully authenticated. Initial Trust Passport issued.`,
      { ip, location: geo, device_fingerprint: device }
    );

    // Broadcast via WebSocket (if available)
    if (global.broadcast) {
      global.broadcast('TRUST_UPDATE', {
        username,
        trust_score: trustPassport.trust_score,
        risk_level: trustPassport.risk_level,
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        department: user.department,
        status: user.status,
        risk_level: user.risk_level,
      },
      session: {
        id: session.id,
        token: sessionToken,
        ip_address: ip,
        geo_location: geo,
        status: session.status,
      },
      trustPassport,
    });
  } catch (err) {
    console.error('[AUTH] Login error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', async (req, res) => {
  try {
    const { session_id, username } = req.body;

    if (session_id) {
      await db.updateSessionStatus(session_id, 'EXPIRED');
    }

    await logEvent(username || 'unknown', 'USER_LOGOUT', 'Auth Server', 0, 'ALLOW',
      `User session ended.`
    );

    res.json({ success: true });
  } catch (err) {
    console.error('[AUTH] Logout error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/auth/session/:token
 */
router.get('/session/:token', async (req, res) => {
  try {
    const session = await db.getSessionByToken(req.params.token);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const user = await db.getUserById(session.user_id);
    const passport = await db.getLatestPassport(session.user_id);

    res.json({ session, user, trustPassport: passport });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
