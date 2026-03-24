require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { extractFromUrl } = require('./extractor');
const { automateContent } = require('./pipeline');

const app = express();
const PORT = process.env.PORT || 8091;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'extract',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Main extraction endpoint
app.post('/extract', async (req, res) => {
  const { url, type } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    console.log(`[Extract] Processing: ${url} (type: ${type || 'auto'})`);
    const result = await extractFromUrl(url, type || 'auto');
    console.log(`[Extract] Complete: ${url}`);
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Extract] Server running on port ${PORT}`);
});
