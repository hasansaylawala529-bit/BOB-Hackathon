/**
 * MAO-IR Backend - Audit Routes
 * GET /api/audit/logs                — Paginated audit logs
 * GET /api/audit/logs/:username      — Audit logs for specific user
 * GET /api/audit/investigations      — All investigations
 * GET /api/audit/investigations/:id  — Single investigation detail
 */

const express = require('express');
const router = express.Router();
const db = require('../services/db');

/**
 * GET /api/audit/logs
 * Query params: ?page=1&limit=50&username=&action=
 */
router.get('/logs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const filters = {};

    if (req.query.username) filters.username = req.query.username;
    if (req.query.action) filters.action = req.query.action;

    const result = await db.getAuditLogs(page, limit, filters);

    // MongoDB returns raw objects, no need to JSON.parse details_json 
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/audit/logs/:username
 */
router.get('/logs/:username', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await db.getAuditLogsByUser(req.params.username, limit);

    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/audit/investigations
 */
router.get('/investigations', async (req, res) => {
  try {
    const investigations = await db.getAllInvestigations();

    const enriched = investigations.map(inv => ({
      ...inv,
      findings: inv.findings_json ? JSON.parse(inv.findings_json) : {},
      agents_involved: inv.agents_involved ? inv.agents_involved.split(',') : [],
    }));

    res.json({ investigations: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/audit/investigations/:id
 */
router.get('/investigations/:id', async (req, res) => {
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

module.exports = router;
