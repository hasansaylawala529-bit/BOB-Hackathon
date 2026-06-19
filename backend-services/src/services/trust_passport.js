/**
 * MAO-IR Backend - Trust Passport Service
 * Issues and verifies cryptographically signed Trust Passports.
 */

const { v4: uuidv4 } = require('uuid');
const { signData, verifySignature } = require('./encryption');
const db = require('./db');

/**
 * Issue a new Trust Passport for a user.
 * Contains trust score, behavioral confidence, device trust, and contextual risk.
 * Signed with RSA-SHA256 and expires in 15 minutes.
 */
async function issueTrustPassport(username) {
  const user = await db.getUser(username);
  if (!user) throw new Error(`User not found: ${username}`);

  const trustScore = await db.getTrustScore(user.id);
  const session = await db.getActiveSession(user.id);

  const riskLevel = classifyRisk(trustScore?.score || 50);

  const passport = {
    passport_id: uuidv4(),
    user_id: username,
    trust_score: trustScore?.score || 50,
    behavioral_confidence: trustScore?.confidence || 0.5,
    device_trust: session?.device_fingerprint ? 'TRUSTED' : 'UNKNOWN',
    contextual_risk: riskLevel === 'LOW' ? 'LOW' : riskLevel === 'MEDIUM' ? 'MEDIUM' : 'HIGH',
    verification_level: 'BASIC',
    risk_level: riskLevel,
    issued_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
  };

  // Sign the passport data (excluding the signature field itself)
  passport.signature = signData(passport);

  // Store in DB
  await db.insertTrustPassport(user.id, passport);

  return passport;
}

/**
 * Verify a Trust Passport's authenticity and expiry.
 */
function verifyPassport(passport) {
  if (!passport || !passport.signature) {
    return { valid: false, reason: 'Missing passport or signature' };
  }

  // Check expiry
  if (new Date(passport.expires_at) < new Date()) {
    return { valid: false, reason: 'Passport expired' };
  }

  // Verify RSA signature
  const { signature, ...dataWithoutSig } = passport;
  const isValid = verifySignature(dataWithoutSig, signature);

  if (!isValid) {
    return { valid: false, reason: 'Invalid signature - passport may be tampered' };
  }

  return { valid: true, reason: 'Passport verified successfully' };
}

/**
 * Classify risk level from score.
 */
function classifyRisk(score) {
  if (score <= 30) return 'LOW';
  if (score <= 60) return 'MEDIUM';
  if (score <= 80) return 'HIGH';
  return 'CRITICAL';
}

module.exports = {
  issueTrustPassport,
  verifyPassport,
  classifyRisk,
};
