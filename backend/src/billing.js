const fs = require('fs');
const path = require('path');

const SUBS_PATH = path.join(__dirname, '..', 'data', 'subscriptions.json');
const COUNT_PATH = path.join(__dirname, '..', 'data', 'extractions_count.json');

function ensureFile(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '{}', 'utf8');
}

function readJSON(filePath) {
  ensureFile(filePath);
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch (e) { return {}; }
}

function writeJSON(filePath, data) {
  ensureFile(filePath);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// --- Extraction Counter ---
function getExtractionCount(ip) {
  const counts = readJSON(COUNT_PATH);
  return counts[ip] || 0;
}

function incrementExtraction(ip) {
  const counts = readJSON(COUNT_PATH);
  counts[ip] = (counts[ip] || 0) + 1;
  writeJSON(COUNT_PATH, counts);
  return counts[ip];
}

// --- Subscriptions ---
function getSubscription(ip) {
  const subs = readJSON(SUBS_PATH);
  const sub = subs[ip];
  if (!sub) return { tier: 'free', active: false };

  // Check expiry
  if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) {
    return { tier: 'free', active: false, expired: true };
  }

  return sub;
}

function setSubscription(ip, tier, stripeData = {}) {
  const subs = readJSON(SUBS_PATH);
  subs[ip] = {
    tier,
    active: true,
    stripeCustomerId: stripeData.customerId || null,
    stripeSubscriptionId: stripeData.subscriptionId || null,
    startedAt: new Date().toISOString(),
    expiresAt: stripeData.expiresAt || null,
    updatedAt: new Date().toISOString()
  };
  writeJSON(SUBS_PATH, subs);
  return subs[ip];
}

function cancelSubscription(ip) {
  const subs = readJSON(SUBS_PATH);
  if (subs[ip]) {
    subs[ip].active = false;
    subs[ip].tier = 'free';
    subs[ip].cancelledAt = new Date().toISOString();
    writeJSON(SUBS_PATH, subs);
  }
  return subs[ip] || null;
}

// --- Tier Permission Checks ---
function canExtract(ip) {
  const sub = getSubscription(ip);
  if (sub.tier === 'pro' || sub.tier === 'business') return { allowed: true, tier: sub.tier };
  const count = getExtractionCount(ip);
  return { allowed: count < 3, tier: 'free', used: count, limit: 3 };
}

function canUseDepth(ip, depth) {
  const sub = getSubscription(ip);
  if (sub.tier === 'pro' || sub.tier === 'business') return true;
  return depth === 'quick';
}

function canAccessFeature(ip, feature) {
  const sub = getSubscription(ip);
  if (feature === 'library' || feature === 'implement') {
    return sub.tier === 'pro' || sub.tier === 'business';
  }
  if (feature === 'ad_intelligence' || feature === 'custom_profiles') {
    return sub.tier === 'business';
  }
  return true;
}

module.exports = {
  getExtractionCount, incrementExtraction,
  getSubscription, setSubscription, cancelSubscription,
  canExtract, canUseDepth, canAccessFeature
};
