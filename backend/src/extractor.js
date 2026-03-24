const Anthropic = require('@anthropic-ai/sdk');
const { getVideoInfo, getTranscript } = require('./youtube');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function detectPlatformType(url) {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
  if (/tiktok\.com/.test(url)) return 'tiktok';
  if (/instagram\.com/.test(url)) return 'instagram';
  if (/twitter\.com|x\.com/.test(url)) return 'twitter';
  return 'webpage';
}

const CONTENT_TYPES = [
  'tutorial/how-to',
  'trading/investing',
  'recipe/cooking',
  'business/entrepreneurship',
  'advertisement/marketing',
  'workout/fitness',
  'news/opinion',
  'podcast/interview',
  'product-demo',
  'unknown'
];

const CONTENT_TYPE_SCHEMAS = {
  'tutorial/how-to': `{
  "steps": [{"number": 1, "instruction": "...", "command": "optional CLI command"}],
  "toolsNeeded": ["tool1", "tool2"],
  "estimatedTime": "e.g. 30 minutes",
  "difficulty": "beginner/intermediate/advanced",
  "prerequisites": ["prerequisite1"]
}`,
  'trading/investing': `{
  "asset": "BTC, AAPL, etc",
  "entrySignal": "what triggers entry",
  "exitTarget": "price target or condition",
  "stopLoss": "stop loss level or rule",
  "positionSizing": "how much to allocate",
  "timeframe": "scalp/day/swing/position",
  "riskRewardRatio": "e.g. 1:3",
  "conviction": "low/medium/high"
}`,
  'recipe/cooking': `{
  "ingredients": [{"item": "flour", "quantity": "2 cups"}],
  "method": [{"step": 1, "instruction": "..."}],
  "prepTime": "15 min",
  "cookTime": "30 min",
  "servings": 4,
  "difficulty": "easy/medium/hard",
  "cuisine": "Italian, etc"
}`,
  'business/entrepreneurship': `{
  "coreFramework": "the main framework or model presented",
  "keyPrinciples": ["principle1", "principle2"],
  "actionItems": ["actionable step 1"],
  "metricsmentioned": ["revenue: $X", "growth: Y%"],
  "mentorMillionaireReady": true
}`,
  'advertisement/marketing': `{
  "hookAnalysis": {"text": "first 3 seconds verbatim", "technique": "curiosity/shock/question/bold-claim", "effectiveness": 8},
  "painPoint": "the core pain addressed",
  "offerStructure": {"mainOffer": "...", "bonuses": ["..."], "guarantee": "..."},
  "socialProof": ["testimonial types used"],
  "ctaBreakdown": {"text": "CTA verbatim", "urgency": true, "scarcity": true},
  "whyItWorks": {"score": 8, "explanation": "why this ad is effective"},
  "fullTranscript": "complete ad transcript"
}`,
  'workout/fitness': `{
  "exercises": [{"name": "Bench Press", "sets": 4, "reps": "8-10", "restTime": "90s", "muscleGroup": "chest", "difficulty": "intermediate"}],
  "totalDuration": "45 min",
  "equipmentNeeded": ["barbell", "bench"],
  "workoutType": "strength/cardio/HIIT/flexibility"
}`,
  'news/opinion': `{
  "keyFacts": ["fact1", "fact2"],
  "peopleMentioned": [{"name": "...", "role": "..."}],
  "whatItMeans": "analysis of implications",
  "actionImplications": ["what to do about it"]
}`,
  'podcast/interview': `{
  "top5Insights": ["insight1", "insight2", "insight3", "insight4", "insight5"],
  "bestQuotes": ["quote1", "quote2"],
  "actionItems": ["action1", "action2"],
  "guestCredentials": "who the guest is and why they matter"
}`,
  'product-demo': `{
  "featuresShown": ["feature1", "feature2"],
  "problemsSolved": ["problem1", "problem2"],
  "pricingMentioned": "pricing details or 'not mentioned'",
  "competitorComparison": "how it stacks up or 'none mentioned'"
}`
};

async function extractFromUrl(url, type = 'auto') {
  const platformType = type === 'auto' ? detectPlatformType(url) : type;

  let sourceData = {};

  if (platformType === 'youtube') {
    sourceData = await processYouTube(url);
  } else {
    sourceData = { url, type: platformType, note: 'Non-YouTube extraction uses URL metadata' };
  }

  const intelligence = await extractIntelligence(sourceData);

  // Auto-generate MM script for business/entrepreneurship/trading content
  let mentorMillionaire = null;
  if (['business/entrepreneurship', 'trading/investing'].includes(intelligence.contentType)) {
    mentorMillionaire = await generateMentorMillionaireScript(intelligence);
  }

  return {
    success: true,
    source: {
      url,
      type: platformType,
      ...sourceData
    },
    intelligence,
    mentorMillionaire,
    extractedAt: new Date().toISOString()
  };
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
    transcript: transcript
  };
}

async function extractIntelligence(sourceData) {
  const prompt = buildExtractionPrompt(sourceData);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].text;

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    // Fall through to raw text
  }

  return { raw: text };
}

function buildExtractionPrompt(sourceData) {
  const dataStr = JSON.stringify(sourceData, null, 2);

  const typeSchemas = Object.entries(CONTENT_TYPE_SCHEMAS)
    .map(([type, schema]) => `If contentType is "${type}", also include "typeSpecific": ${schema}`)
    .join('\n\n');

  return `You are an elite intelligence extraction engine. Analyze the following video/content data and extract structured intelligence.

STEP 1: Detect the content type. Choose EXACTLY ONE from:
${CONTENT_TYPES.map(t => `- "${t}"`).join('\n')}

STEP 2: Extract base intelligence fields.

STEP 3: Extract type-specific fields based on detected content type.

SOURCE DATA:
${dataStr}

Return a JSON object with these BASE fields:
{
  "contentType": "one of the types listed above",
  "summary": "2-3 sentence summary of the content",
  "keyTopics": ["topic1", "topic2", ...],
  "keyInsights": ["insight1", "insight2", ...],
  "quotes": ["notable quote 1", "notable quote 2", ...],
  "sentiment": "positive/negative/neutral/mixed",
  "targetAudience": "who this content is for",
  "actionItems": ["actionable takeaway 1", ...],
  "monetizationAngles": ["how this content could be repurposed", ...],
  "scriptHook": "A compelling 1-sentence hook for repurposing this content",
  "typeSpecific": { ... type-specific fields ... }
}

TYPE-SPECIFIC SCHEMAS:
${typeSchemas}

If contentType is "unknown", set typeSpecific to null.

Return ONLY the JSON object, no other text.`;
}

async function generateMentorMillionaireScript(intelligence) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `You are the content engine for "Mentor Millionaire", a premium short-form content brand.

Based on this intelligence, generate a complete content package:

INTELLIGENCE:
${JSON.stringify(intelligence, null, 2)}

Return a JSON object:
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
    'LedgerAI': 'AI-powered accounting and financial intelligence platform for businesses',
    'Tavolo': 'Premium restaurant management and reservation platform',
    'Extract': 'Video intelligence extraction platform that turns any video into structured data',
    'Toolbelt': 'All-in-one developer productivity toolkit',
    'Mentor Millionaire': 'Premium business education and wealth-building content brand'
  };

  const productDesc = productDescriptions[productName] || `Product called "${productName}"`;

  const adIntel = extraction.intelligence?.typeSpecific || extraction.intelligence;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `You are an elite ad copywriter. You've analyzed a successful advertisement and need to adapt its exact style, structure, and persuasion techniques for a different product.

ORIGINAL AD ANALYSIS:
${JSON.stringify(adIntel, null, 2)}

TARGET PRODUCT: ${productName}
PRODUCT DESCRIPTION: ${productDesc}

Create an adapted ad script that:
1. Uses the SAME hook technique (${adIntel?.hookAnalysis?.technique || 'attention-grabbing'})
2. Mirrors the SAME emotional arc
3. Applies the SAME CTA structure
4. Matches the tone and pacing

Return a JSON object:
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

module.exports = { extractFromUrl, adaptAdForProduct, generateMentorMillionaireScript, CONTENT_TYPES };
