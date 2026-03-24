const Anthropic = require('@anthropic-ai/sdk');
const { getVideoInfo, getTranscript } = require('./youtube');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function detectType(url) {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
  if (/tiktok\.com/.test(url)) return 'tiktok';
  if (/instagram\.com/.test(url)) return 'instagram';
  if (/twitter\.com|x\.com/.test(url)) return 'twitter';
  return 'webpage';
}

async function extractFromUrl(url, type = 'auto') {
  const detectedType = type === 'auto' ? detectType(url) : type;

  let sourceData = {};

  if (detectedType === 'youtube') {
    sourceData = await processYouTube(url);
  } else {
    sourceData = { url, type: detectedType, note: 'Non-YouTube extraction uses URL metadata' };
  }

  const intelligence = await extractIntelligence(sourceData);

  return {
    success: true,
    source: {
      url,
      type: detectedType,
      ...sourceData
    },
    intelligence,
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
    max_tokens: 4096,
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

  return `You are an intelligence extraction engine. Analyze the following video/content data and extract structured intelligence.

SOURCE DATA:
${dataStr}

Return a JSON object with these fields:
{
  "summary": "2-3 sentence summary of the content",
  "keyTopics": ["topic1", "topic2", ...],
  "keyInsights": ["insight1", "insight2", ...],
  "quotes": ["notable quote 1", "notable quote 2", ...],
  "sentiment": "positive/negative/neutral/mixed",
  "targetAudience": "who this content is for",
  "contentType": "educational/entertainment/news/opinion/tutorial/etc",
  "actionItems": ["actionable takeaway 1", ...],
  "monetizationAngles": ["how this content could be repurposed", ...],
  "scriptHook": "A compelling 1-sentence hook for repurposing this content"
}

Return ONLY the JSON object, no other text.`;
}

module.exports = { extractFromUrl };
