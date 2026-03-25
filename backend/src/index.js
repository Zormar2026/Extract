require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { extractFromUrl, adaptAdForProduct, generateMentorMillionaireScript } = require('./extractor');
const { automateContent } = require('./pipeline');
const library = require('./library');
const projects = require('./projects');
const billing = require('./billing');

// Optional Stripe — gracefully degrade if not installed or not configured
let stripe = null;
try {
  const Stripe = require('stripe');
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.log('[Billing] Stripe initialized');
  }
} catch (e) {
  console.log('[Billing] Stripe not available — billing features disabled');
}

const app = express();
const PORT = process.env.PORT || 8091;

function getClientIp(req) {
  return req.headers['cf-connecting-ip']
    || (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || req.socket.remoteAddress
    || '0.0.0.0';
}

app.use(cors());

// Stripe webhook needs raw body — must be before JSON parser
app.post('/billing/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Billing not configured' });

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`[Billing] Webhook signature failed: ${err.message}`);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const ip = event.data?.object?.metadata?.client_ip;

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const tier = session.metadata?.tier || 'pro';
      if (ip) {
        billing.setSubscription(ip, tier, {
          customerId: session.customer,
          subscriptionId: session.subscription
        });
        console.log(`[Billing] Subscription activated: ${tier} for ${ip}`);
      }
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      if (sub.status !== 'active' && ip) {
        billing.cancelSubscription(ip);
        console.log(`[Billing] Subscription cancelled for ${ip}`);
      }
      break;
    }
    case 'customer.subscription.deleted': {
      if (ip) {
        billing.cancelSubscription(ip);
        console.log(`[Billing] Subscription deleted for ${ip}`);
      }
      break;
    }
  }

  res.json({ received: true });
});

app.use(express.json({ limit: '50mb' }));

// Web interface
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'web.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'extract',
    version: '5.0.0',
    features: ['opus-deep-extraction', 'depth-modes', 'content-type-detection', 'ad-intelligence', 'auto-ad-adapt', 'mm-pipeline', 'library', 'cache', 'quality-retry', 'section-share', 'implement-tab', 'stripe-billing'],
    stripeConfigured: !!stripe,
    timestamp: new Date().toISOString()
  });
});

// ── Subscription & Billing ──────────────────────────────────
app.get('/subscription', (req, res) => {
  const ip = getClientIp(req);
  const sub = billing.getSubscription(ip);
  const count = billing.getExtractionCount(ip);
  res.json({
    tier: sub.tier || 'free',
    active: sub.active || false,
    used: count,
    limit: 3,
    stripeConfigured: !!stripe
  });
});

app.post('/subscribe', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Billing not configured yet — coming soon!' });

  const { tier } = req.body;
  const ip = getClientIp(req);

  const priceId = tier === 'business'
    ? process.env.STRIPE_BUSINESS_PRICE_ID
    : process.env.STRIPE_PRO_PRICE_ID;

  if (!priceId) return res.status(500).json({ error: 'Price ID not configured' });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: tier === 'pro' ? 14 : 0,
        metadata: { client_ip: ip, tier }
      },
      metadata: { client_ip: ip, tier },
      success_url: `${req.headers.origin || 'http://37.27.89.250:8091'}/?billing=success`,
      cancel_url: `${req.headers.origin || 'http://37.27.89.250:8091'}/?billing=cancel`
    });

    res.json({ success: true, url: session.url });
  } catch (err) {
    console.error(`[Billing] Checkout error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// ── Main Extraction ─────────────────────────────────────────
app.post('/extract', async (req, res) => {
  const { url, type, depth } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const ip = getClientIp(req);
  const extractionDepth = depth || 'deep';

  // Check extraction limits
  const access = billing.canExtract(ip);
  if (!access.allowed) {
    return res.status(403).json({
      error: 'free_limit_reached',
      message: 'You have used all 3 free extractions. Upgrade to Pro for unlimited.',
      used: access.used, limit: access.limit
    });
  }

  // Check depth permissions
  if (!billing.canUseDepth(ip, extractionDepth)) {
    return res.status(403).json({
      error: 'depth_restricted',
      message: 'Free tier is limited to Quick mode. Upgrade to Pro for Standard and Deep.',
      tier: 'free'
    });
  }

  try {
    console.log(`[Extract] Processing: ${url} (type: ${type || 'auto'}, depth: ${extractionDepth})`);
    const result = await extractFromUrl(url, type || 'auto', extractionDepth);
    console.log(`[Extract] Complete: ${url} → ${result.intelligence?.contentType || 'unknown'} (quality: ${result.intelligence?._qualityScore}/10)`);

    // Increment extraction counter
    const newCount = billing.incrementExtraction(ip);
    result.tier = { tier: access.tier, used: newCount, limit: 3 };

    res.json(result);
  } catch (err) {
    console.error(`[Extract] Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// ── Content Automation Pipeline ─────────────────────────────
app.post('/automate', async (req, res) => {
  const { url, type } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

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

// ── Ad Adaptation ───────────────────────────────────────────
app.post('/adapt-ad', async (req, res) => {
  const { extraction, productName } = req.body;
  if (!extraction || !productName) return res.status(400).json({ error: 'extraction and productName are required' });

  try {
    console.log(`[AdAdapt] Adapting for: ${productName}`);
    const result = await adaptAdForProduct(extraction, productName);
    res.json(result);
  } catch (err) {
    console.error(`[AdAdapt] Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// ── MM Script ───────────────────────────────────────────────
app.post('/mm-script', async (req, res) => {
  const { intelligence } = req.body;
  if (!intelligence) return res.status(400).json({ error: 'intelligence data is required' });

  try {
    const script = await generateMentorMillionaireScript(intelligence);
    res.json({ success: true, mentorMillionaire: script });
  } catch (err) {
    console.error(`[MM-Script] Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// ── Library CRUD ────────────────────────────────────────────
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

// ── Projects CRUD ───────────────────────────────────────────
app.get('/projects', (req, res) => {
  const items = projects.getAll();
  res.json({ success: true, count: items.length, items });
});

app.get('/projects/:id', (req, res) => {
  const item = projects.getById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true, project: item });
});

app.post('/projects', (req, res) => {
  const { extraction } = req.body;
  if (!extraction) return res.status(400).json({ error: 'extraction data is required' });
  const project = projects.create(extraction);
  console.log(`[Projects] Created: ${project.id} (${project.tasks.length} tasks)`);
  res.json({ success: true, project });
});

app.put('/projects/:id', (req, res) => {
  const { status, notes } = req.body;
  const updated = projects.update(req.params.id, { status, notes });
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true, project: updated });
});

app.delete('/projects/:id', (req, res) => {
  const removed = projects.remove(req.params.id);
  if (!removed) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

app.put('/projects/:id/tasks/:taskId', (req, res) => {
  const updated = projects.toggleTask(req.params.id, req.params.taskId);
  if (!updated) return res.status(404).json({ error: 'Project or task not found' });
  res.json({ success: true, project: updated });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Extract] v5.0 Deep Intelligence Engine (Opus) + Implement + Billing running on port ${PORT}`);
});
