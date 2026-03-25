const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const LIBRARY_PATH = path.join(__dirname, '..', 'data', 'library.json');

function ensureDataDir() {
  const dir = path.dirname(LIBRARY_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(LIBRARY_PATH)) {
    fs.writeFileSync(LIBRARY_PATH, '[]', 'utf8');
  }
}

function readLibrary() {
  ensureDataDir();
  try {
    const data = fs.readFileSync(LIBRARY_PATH, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function writeLibrary(items) {
  ensureDataDir();
  fs.writeFileSync(LIBRARY_PATH, JSON.stringify(items, null, 2), 'utf8');
}

function getAll(filters = {}) {
  let items = readLibrary();

  if (filters.contentType) {
    items = items.filter(i => i.contentType === filters.contentType);
  }
  if (filters.status) {
    items = items.filter(i => i.status === filters.status);
  }

  // Most recent first
  items.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

  return items;
}

function getById(id) {
  const items = readLibrary();
  return items.find(i => i.id === id) || null;
}

function save(extraction) {
  const items = readLibrary();

  const entry = {
    id: uuidv4(),
    url: extraction.source?.url || extraction.url || '',
    contentType: extraction.intelligence?.contentType || 'unknown',
    title: extraction.source?.title || '',
    intelligence: extraction.intelligence,
    source: extraction.source || null,
    depth: extraction.depth || 'deep',
    mentorMillionaire: extraction.mentorMillionaire || null,
    adAdaptations: extraction.adAdaptations || null,
    status: 'saved',
    notes: '',
    savedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  items.push(entry);
  writeLibrary(items);
  return entry;
}

function update(id, updates) {
  const items = readLibrary();
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return null;

  if (updates.status) items[idx].status = updates.status;
  if (updates.notes !== undefined) items[idx].notes = updates.notes;
  items[idx].updatedAt = new Date().toISOString();

  writeLibrary(items);
  return items[idx];
}

function remove(id) {
  const items = readLibrary();
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return false;

  items.splice(idx, 1);
  writeLibrary(items);
  return true;
}

module.exports = { getAll, getById, save, update, remove };
