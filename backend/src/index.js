require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { extractFromUrl, adaptAdForProduct, generateMentorMillionaireScript } = require('./extractor');
const { automateContent } = require('./pipeline');
const library = require('./library');

const app = express();
const PORT = process.env.PORT || 8091;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'extract',
    version: '2.0.0',
    features: ['content-type-detection', 'ad-intelligence', 'mm-pipeline', 'library'],
    timestamp: new Date().toISOString()
  });
});

// Main extraction endpoint (upgraded)
app.post('/extract', async (req, res) => {
  const { url, type } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    console.log(`[Extract] Processing: ${url} (type: ${type || 'auto'})`);
    const result = await extractFromUrl(url, type || 'auto');
    console.log(`[Extract] Complete: ${url} → ${result.intelligence?.contentType || 'unknown'}`);
    res.json(result);
  } catch (err) {
    console.error(`[Extract] Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Content automation pipeline endpoint
app.post('/automate', async (req, res) => {
  const { url, type } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    console.log(`[Automate] Starting pipeline: ${url}`);
    const result = await automateContent(url, type || 'auto');
    console.log(`[Automate] Pipeline complete: ${url}`);
    res.json(result);
  } catch (err) {
    console.error(`[Automate] Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Ad adaptation endpoint
app.post('/adapt-ad', async (req, res) => {
  const { extraction, productName } = req.body;

  if (!extraction || !productName) {
    return res.status(400).json({ error: 'extraction and productName are required' });
  }

  try {
    console.log(`[AdAdapt] Adapting for: ${productName}`);
    const result = await adaptAdForProduct(extraction, productName);
    console.log(`[AdAdapt] Complete: ${productName}`);
    res.json(result);
  } catch (err) {
    console.error(`[AdAdapt] Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Generate MM script from existing intelligence
app.post('/mm-script', async (req, res) => {
  const { intelligence } = req.body;

  if (!intelligence) {
    return res.status(400).json({ error: 'intelligence data is required' });
  }

  try {
    const script = await generateMentorMillionaireScript(intelligence);
    res.json({ success: true, mentorMillionaire: script });
  } catch (err) {
    console.error(`[MM-Script] Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Library endpoints
app.get('/library', (req, res) => {
  const { contentType, status } = req.query;
  const items = library.getAll({ contentType, status });
  res.json({ success: true, count: items.length, items });
});

app.get('/library/:id', (req, res) => {
  const item = library.getById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true, item });
});

app.post('/library', (req, res) => {
  const { extraction } = req.body;
  if (!extraction) return res.status(400).json({ error: 'extraction data is required' });

  const entry = library.save(extraction);
  console.log(`[Library] Saved: ${entry.id} (${entry.contentType})`);
  res.json({ success: true, entry });
});

app.patch('/library/:id', (req, res) => {
  const { status, notes } = req.body;
  const updated = library.update(req.params.id, { status, notes });
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true, entry: updated });
});

app.delete('/library/:id', (req, res) => {
  const removed = library.remove(req.params.id);
  if (!removed) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Extract] v2.0 running on port ${PORT}`);
});
