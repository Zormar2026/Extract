const Anthropic = require('@anthropic-ai/sdk');
const { getVideoInfo, getTranscript } = require('./youtube');
const cache = require('./cache');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function detectPlatformType(url) {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
  if (/tiktok\.com/.test(url)) return 'tiktok';
  if (/instagram\.com/.test(url)) return 'instagram';
  if (/twitter\.com|x\.com/.test(url)) return 'twitter';
  return 'webpage';
}

const CONTENT_TYPES = [
  'tutorial/how-to', 'trading/investing', 'recipe/cooking',
  'business/entrepreneurship', 'advertisement/marketing', 'workout/fitness',
  'news/opinion', 'podcast/interview', 'product-demo', 'unknown'
];

async function extractFromUrl(url, type = 'auto', depth = 'deep') {
  // Check cache
  const cached = cache.get(url, depth);
  if (cached) {
    console.log(`[Extract] Cache hit: ${url}`);
    return { ...cached, fromCache: true };
  }

  const platformType = type === 'auto' ? detectPlatformType(url) : type;
  let sourceData = {};

  if (platformType === 'youtube') {
    sourceData = await processYouTube(url);
  } else {
    sourceData = { url, type: platformType, note: 'Non-YouTube extraction uses URL metadata' };
  }

  // Extract with retry logic
  let intelligence = await extractWithRetry(sourceData, depth);

  // Auto-generate MM script for business/entrepreneurship/trading content
  let mentorMillionaire = null;
  if (['business/entrepreneurship', 'trading/investing'].includes(intelligence.contentType)) {
    mentorMillionaire = await generateMentorMillionaireScript(intelligence);
  }

  // Auto-adapt ads for all Zormar products
  let adAdaptations = null;
  if (intelligence.contentType === 'advertisement/marketing' && depth === 'deep') {
    adAdaptations = await autoAdaptAllProducts(intelligence);
  }

  const result = {
    success: true,
    source: { url, type: platformType, ...sourceData },
    intelligence,
    mentorMillionaire,
    adAdaptations,
    depth,
    extractedAt: new Date().toISOString()
  };

  // Cache result
  cache.set(url, depth, result);

  return result;
}

async function processYouTube(url) {
  const info = await getVideoInfo(url);
  const transcript = await getTranscript(url);
  return {
    title: info.title,
    author: info.author,
    duration: info.duration,
    views: info.views,
    description: info.description,
    transcript
  };
}

async function extractWithRetry(sourceData, depth, attempt = 1) {
  const intelligence = await extractIntelligence(sourceData, depth);

  // Quality check
  const score = assessQuality(intelligence);
  intelligence._qualityScore = score;

  if (score < 7 && attempt < 3) {
    console.log(`[Extract] Quality ${score}/10 on attempt ${attempt}, retrying with more detail...`);
    return extractWithRetry(sourceData, depth, attempt + 1);
  }

  return intelligence;
}

function assessQuality(intel) {
  if (intel.raw) return 2;
  let score = 5;

  if (intel.summary && intel.summary.length > 50) score += 1;
  if (intel.keyInsights?.length >= 3) score += 1;
  if (intel.typeSpecific && Object.keys(intel.typeSpecific).length >= 3) score += 1;
  if (intel.transcript && intel.transcript.length > 100) score += 0.5;
  if (intel.contentFormatBreakdown) score += 0.5;
  if (intel.viralPotential) score += 0.5;
  if (intel.emotionalTriggers?.length > 0) score += 0.5;

  return Math.min(10, Math.round(score));
}

async function extractIntelligence(sourceData, depth) {
  const prompt = buildDeepPrompt(sourceData, depth);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16384,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].text;

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) {}

  return { raw: text };
}

function buildDeepPrompt(sourceData, depth) {
  const data = JSON.stringify(sourceData, null, 2);

  return `You are an ELITE intelligence extraction engine. Extract DEEP, ACTIONABLE intelligence. Leave NOTHING out.

SOURCE DATA:
${data}

STEP 1: Detect content type. Choose EXACTLY ONE:
${CONTENT_TYPES.map(t => `- "${t}"`).join('\n')}

STEP 2: Extract ALL base fields (required for every content type).

STEP 3: Extract DEEP type-specific fields.

Return a JSON object with this structure:

{
  "contentType": "one from the list above",
  "transcript": "Full verbatim transcript — every word spoken. If not available from captions, note that.",
  "summary": "3-4 sentence comprehensive summary",
  "keyTopics": ["topic1", "topic2", ...],
  "keyInsights": ["insight1", "insight2", ... at least 5],
  "quotes": ["exact notable quotes from the content"],
  "sentiment": "positive/negative/neutral/mixed",
  "targetAudience": "specific description of who this content is for",
  "actionItems": ["specific actionable takeaway 1", ...],
  "monetizationAngles": ["repurposing angle 1", ...],
  "scriptHook": "compelling 1-sentence hook for repurposing",

  "speakerAnalysis": {
    "tone": "confident/uncertain/aggressive/calm/enthusiastic/etc",
    "deliveryStyle": "fast-paced/methodical/conversational/lecture/etc",
    "credibilityScore": 1-10,
    "credibilityReason": "why this score"
  },
  "emotionalTriggers": ["fear of missing out", "desire for status", "curiosity", ...],
  "viralPotential": {
    "score": 1-10,
    "explanation": "why this score",
    "whatMakesItShareable": "the specific element"
  },
  "contentFormatBreakdown": {
    "hookLength": "first X seconds",
    "hookType": "question/shock/story/stat/curiosity",
    "bodyStructure": "how the main content is organized",
    "endingType": "CTA/cliff-hanger/summary/question",
    "totalPacing": "fast/medium/slow"
  },

  "typeSpecific": { TYPE-SPECIFIC FIELDS BELOW }
}

=== TYPE-SPECIFIC SCHEMAS ===

IF "tutorial/how-to":
{
  "steps": [{"number": 1, "instruction": "detailed instruction", "timestamp": "0:30", "command": "exact command if any", "tip": "pro tip if mentioned"}],
  "toolsNeeded": [{"name": "tool", "url": "if mentioned", "free": true/false}],
  "softwareNeeded": ["software1", "software2"],
  "prerequisites": ["what you need to know/have before starting"],
  "commonMistakes": ["mistake to avoid 1", ...],
  "estimatedCost": "$0 - free / $50 for tools / etc",
  "difficultyLevel": 1-10,
  "estimatedTime": "30 minutes",
  "whatToBuyOrDownload": ["item1", "item2"],
  "expectedOutcome": "what you'll have when done"
}

IF "trading/investing":
{
  "asset": "exact ticker or pair (BTC/USD, AAPL, etc)",
  "assetClass": "crypto/stocks/forex/options/commodities",
  "entrySignal": "exact condition that triggers entry",
  "entryPrice": "exact price or 'market' if not specified",
  "exitTarget": "exact target with percentage gain",
  "stopLoss": "exact stop level with percentage risk",
  "positionSizing": "percentage of portfolio or dollar amount",
  "riskRewardRatio": "calculated R:R like 1:3",
  "timeframe": "scalp (minutes) / day (hours) / swing (days) / position (weeks+)",
  "confluenceFactors": ["indicator 1 agrees", "indicator 2 agrees", ...],
  "marketConditionsRequired": "what market state is needed for this to work",
  "backtestPerformance": "any mentioned win rate or historical performance",
  "conviction": "low/medium/high with reason"
}

IF "recipe/cooking":
{
  "ingredients": [{"item": "flour", "quantity": "2 cups", "substitution": "almond flour for GF"}],
  "method": [{"step": 1, "instruction": "...", "time": "5 min", "temperature": "350F if applicable"}],
  "prepTime": "15 min",
  "cookTime": "30 min",
  "totalTime": "45 min",
  "servings": 4,
  "difficulty": "easy/medium/hard",
  "cuisine": "Italian",
  "dietaryInfo": ["vegetarian", "gluten-free", "dairy-free", etc],
  "caloriesPerServing": "estimated 450 cal",
  "equipmentNeeded": [{"item": "oven", "alternative": "air fryer"}],
  "storageInstructions": "how to store leftovers",
  "winePairing": "suggested pairing if relevant",
  "chefTips": ["pro tip 1", "pro tip 2"],
  "skillsRequired": ["knife skills", "sauce making"]
}

IF "business/entrepreneurship":
{
  "businessModel": "exact model explained in detail",
  "revenueStreams": ["stream 1", "stream 2"],
  "startupCosts": "mentioned costs or estimate",
  "timeToProfit": "mentioned timeline or estimate",
  "implementationPlan": [{"step": 1, "action": "...", "timeline": "week 1"}],
  "toolsAndResources": [{"name": "tool", "purpose": "what it's for", "url": "if mentioned"}],
  "caseStudies": ["example 1 — what happened", "example 2"],
  "objectionsAddressed": ["objection 1 — how they answered it"],
  "oneBigInsight": "the single most valuable sentence from this content",
  "applyToYourBusiness": "generic template: Here's how to apply this to any business...",
  "keyPrinciples": ["principle 1", "principle 2"],
  "metricsmentioned": ["revenue: $X", "growth: Y%"],
  "mentorMillionaireReady": true
}

IF "advertisement/marketing":
{
  "first3Seconds": {
    "wordByWord": "exact words spoken in first 3 seconds",
    "hookType": "question/shock/story/curiosity/pain/bold-claim",
    "visualDescription": "what's shown on screen"
  },
  "painPointScore": 1-10,
  "painPointAnalysis": "the specific pain addressed and how well",
  "desireTriggered": "what desire/aspiration is activated",
  "productSold": "exact product or service name",
  "priceMentioned": "price or 'not mentioned'",
  "offerStructure": {
    "mainOffer": "the core offer",
    "bonuses": ["bonus 1", "bonus 2"],
    "guarantee": "money-back guarantee details or 'none'",
    "riskReversal": "how they reduce perceived risk"
  },
  "urgencyTactics": ["tactic 1", "tactic 2"],
  "scarcityTactics": ["tactic 1", "tactic 2"],
  "socialProof": {
    "type": "testimonials/numbers/authority/celebrity/before-after",
    "strength": 1-10,
    "examples": ["specific proof used"]
  },
  "ctaExactWording": "the exact call to action words",
  "platformOptimization": "TikTok/Instagram/YouTube/Facebook — which platform is this optimized for and why",
  "productionQuality": 1-10,
  "overallEffectiveness": 1-10,
  "whyItWorks3Reasons": ["reason 1", "reason 2", "reason 3"],
  "whatCouldBeImproved": ["improvement 1", "improvement 2"],
  "fullTranscript": "complete verbatim ad transcript"
}

IF "workout/fitness":
{
  "exercises": [{
    "name": "Bench Press",
    "order": 1,
    "sets": 4,
    "reps": "8-10",
    "restTime": "90s",
    "muscleGroup": "chest",
    "formCues": ["retract scapula", "touch chest"],
    "weightBeginner": "bar only (45lb)",
    "weightIntermediate": "135lb",
    "weightAdvanced": "225lb+",
    "modification": "dumbbell press for shoulder issues"
  }],
  "workoutType": "strength/cardio/HIIT/flexibility",
  "totalDuration": "45 min",
  "equipmentNeeded": ["barbell", "bench"],
  "warmUp": "described warm up or 'not included'",
  "coolDown": "described cool down or 'not included'",
  "caloriesBurned": "estimated 300-500 cal",
  "musclesWorked": ["chest", "triceps", "shoulders"]
}

IF "news/opinion":
{
  "who": "people involved",
  "what": "what happened",
  "when": "when it happened",
  "where": "where it happened",
  "why": "why it matters",
  "allPeople": [{"name": "...", "role": "...", "stance": "..."}],
  "allOrganizations": ["org1", "org2"],
  "economicImpact": "financial implications discussed",
  "politicalImplications": "political angle if any",
  "predictionsMode": ["what happens next according to source"],
  "counterargumentsNotAddressed": ["blind spot 1", "blind spot 2"],
  "biasAssessment": {"direction": "left/right/center/corporate/none", "strength": 1-10},
  "howThisAffectsYou": "personal impact analysis",
  "actionYouShouldTake": "what to do based on this news"
}

IF "podcast/interview":
{
  "guestFullName": "full name",
  "guestCredentials": "why they matter — credentials, achievements",
  "top10Insights": ["insight 1", ... "insight 10"],
  "mostControversialStatement": "the most provocative thing said",
  "bestStoryTold": "summary of the best anecdote/story",
  "actionableAdviceCount": 5,
  "actionableAdvice": ["advice 1", "advice 2", ...],
  "resourcesRecommended": ["resource 1", "resource 2"],
  "booksmentioned": ["book 1", "book 2"],
  "bestQuoteForSocial": "the single most shareable quote",
  "bestQuotes": ["quote 1", "quote 2", "quote 3"],
  "episodeSummary3Sentences": "three sentence summary",
  "whoNeedsToHearThis": "type of person who would benefit most"
}

IF "product-demo":
{
  "productName": "exact product name",
  "featuresShown": [{"feature": "...", "benefit": "why it matters"}],
  "problemsSolved": ["problem 1", "problem 2"],
  "pricingMentioned": "pricing details",
  "competitorComparison": "how it stacks up",
  "targetUser": "who this product is for",
  "uniqueSellingPoint": "the one thing that sets it apart",
  "limitations": ["limitation noticed 1"]
}

IF "unknown", set typeSpecific to null.

CRITICAL RULES:
- Extract EVERY detail. Deeper is better.
- All scores must include reasoning.
- Quotes must be EXACT words from the transcript, not paraphrased.
- If information is not available, use null — never make up data.
- Return ONLY the JSON object, no other text.`;
}

async function generateMentorMillionaireScript(intelligence) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `You are the content engine for "Mentor Millionaire", a premium short-form content brand.

INTELLIGENCE:
${JSON.stringify(intelligence, null, 2)}

Generate a complete content package. Return JSON:
{
  "hook": "Pattern-interrupt opening, max 10 words, first 2 seconds",
  "body": "The insight explained simply in 3-5 punchy sentences. Authoritative tone.",
  "cta": "Follow for more" or "Link in bio" style ending,
  "visualNotes": ["what to show on screen for each section"],
  "hashtags": ["relevant", "hashtags", "max 8"],
  "script": "Full 60-second voiceover script combining hook + body + cta with [PAUSE] markers",
  "estimatedDuration": "55-65 seconds"
}

Return ONLY the JSON object.`
    }]
  });

  try {
    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) {}
  return { script: response.content[0].text };
}

async function adaptAdForProduct(extraction, productName) {
  const productDescriptions = {
    'LedgerAI': 'AI-powered accounting and financial intelligence platform for businesses. Automates bookkeeping, tax prep, and financial forecasting.',
    'Tavolo': 'Premium restaurant management and reservation platform. Handles bookings, table management, and guest experience.',
    'Extract': 'Video intelligence extraction platform that turns any video into structured, actionable data and content.',
    'Toolbelt': 'All-in-one developer productivity toolkit. Code review, deployment, monitoring in one place.',
    'Mentor Millionaire': 'Premium business education and wealth-building content brand. Short-form video with high-value insights.'
  };

  const productDesc = productDescriptions[productName] || `Product called "${productName}"`;
  const adIntel = extraction.intelligence?.typeSpecific || extraction.intelligence;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `You are an elite ad copywriter. Adapt this successful ad for a different product.

ORIGINAL AD ANALYSIS:
${JSON.stringify(adIntel, null, 2)}

TARGET PRODUCT: ${productName}
DESCRIPTION: ${productDesc}

Rules:
1. Use the SAME hook technique (${adIntel?.first3Seconds?.hookType || adIntel?.hookAnalysis?.technique || 'attention-grabbing'})
2. Mirror the SAME emotional arc
3. Apply the SAME CTA structure
4. Match the tone and pacing

Return JSON:
{
  "productName": "${productName}",
  "hook": "adapted opening hook — first 3 seconds",
  "painPoint": "the pain point for this product's audience",
  "body": "main ad body — 30-45 seconds",
  "socialProof": "suggested social proof to include",
  "offer": "the offer structure adapted for this product",
  "cta": "call to action",
  "fullScript": "complete 60-second ad script ready for voiceover",
  "whyItWillWork": "explanation of why this adaptation works",
  "visualDirection": ["shot 1 description", "shot 2 description", ...]
}

Return ONLY the JSON object.`
    }]
  });

  try {
    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return { success: true, adaptation: JSON.parse(jsonMatch[0]) };
  } catch (e) {}
  return { success: true, adaptation: { fullScript: response.content[0].text } };
}

async function autoAdaptAllProducts(intelligence) {
  const products = ['LedgerAI', 'Tavolo', 'Extract', 'Toolbelt', 'Mentor Millionaire'];
  const adaptations = {};

  // Adapt for each product in parallel
  const results = await Promise.allSettled(
    products.map(async (product) => {
      const result = await adaptAdForProduct({ intelligence }, product);
      return { product, result };
    })
  );

  for (const r of results) {
    if (r.status === 'fulfilled') {
      adaptations[r.value.product] = r.value.result.adaptation;
    }
  }

  return adaptations;
}

module.exports = { extractFromUrl, adaptAdForProduct, generateMentorMillionaireScript, CONTENT_TYPES };
