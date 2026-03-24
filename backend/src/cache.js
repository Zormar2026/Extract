const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CACHE_DIR = path.join(__dirname, '..', 'data', 'cache');

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function cacheKey(url, depth) {
  return crypto.createHash('md5').update(`${url}:${depth}`).digest('hex');
}

function get(url, depth) {
  ensureCacheDir();
  const key = cacheKey(url, depth);
  const file = path.join(CACHE_DIR, `${key}.json`);
  if (!fs.existsSync(file)) return null;

  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    // Cache for 24 hours
    if (Date.now() - new Date(data.cachedAt).getTime() > 86400000) {
      fs.unlinkSync(file);
      return null;
    }
    return data.result;
  } catch (e) {
    return null;
  }
}

function set(url, depth, result) {
  ensureCacheDir();
  const key = cacheKey(url, depth);
  const file = path.join(CACHE_DIR, `${key}.json`);
  fs.writeFileSync(file, JSON.stringify({ cachedAt: new Date().toISOString(), url, depth, result }), 'utf8');
}

module.exports = { get, set };
