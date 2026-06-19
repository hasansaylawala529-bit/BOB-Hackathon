/**
 * MAO-IR Backend - Encryption Service
 * AES-256 encryption, HMAC-SHA256 hashing, RSA signing for Trust Passports.
 */

const crypto = require('crypto');
const CryptoJS = require('crypto-js');
require('dotenv').config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'mao-ir-aes256-key-bank-of-baroda-2026';

// ─── AES-256 Encryption/Decryption ───
function encrypt(plaintext) {
  return CryptoJS.AES.encrypt(plaintext, ENCRYPTION_KEY).toString();
}

function decrypt(ciphertext) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// ─── HMAC-SHA256 Behavioral Fingerprinting ───
function hashBehavior(behavioralData) {
  const dataStr = JSON.stringify(behavioralData);
  return CryptoJS.HmacSHA256(dataStr, ENCRYPTION_KEY).toString();
}

// ─── RSA Key Pair (generated in-memory) ───
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

function signData(data) {
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(typeof data === 'string' ? data : JSON.stringify(data));
  return signer.sign(privateKey, 'base64');
}

function verifySignature(data, signature) {
  try {
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(typeof data === 'string' ? data : JSON.stringify(data));
    return verifier.verify(publicKey, signature, 'base64');
  } catch {
    return false;
  }
}

// ─── JWT-like token generation ───
function generateSessionToken() {
  return crypto.randomUUID();
}

module.exports = {
  encrypt,
  decrypt,
  hashBehavior,
  signData,
  verifySignature,
  publicKey,
  generateSessionToken,
};
