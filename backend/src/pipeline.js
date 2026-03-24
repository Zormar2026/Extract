const Anthropic = require('@anthropic-ai/sdk');
const https = require('https');
const { extractFromUrl } = require('./extractor');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const PICTORY_API_KEY = process.env.PICTORY_API_KEY || '';
const LATE_API_KEY = process.env.LATE_API_KEY || '';

const LATE_ACCOUNTS = {
  instagram: process.env.LATE_INSTAGRAM_ID || '6985754d93a320156c434258',
  tiktok: process.env.LATE_TIKTOK_ID || '6985758193a320156c43425a',
  youtube: process.env.LATE_YOUTUBE_ID || '6985759b93a320156c43425f'
};

function httpRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('Request timeout')); });
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function writeScript(intelligence) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `You are the scriptwriter for "Mentor Millionaire", a premium content brand that delivers high-value insights in a cinematic, authoritative tone.

Based on the following intelligence extracted from a video, write a 60-90 second voiceover script.

INTELLIGENCE:
${JSON.stringify(intelligence, null, 2)}

RULES:
- Start with a powerful hook (first 3 seconds must grab attention)
- Use short, punchy sentences
- Tone: authoritative, motivational, slightly provocative
- End with a call to action: "Follow Mentor Millionaire for more."
- No emojis, no hashtags — this is premium content
- Include natural pauses marked with [PAUSE]

Return ONLY the script text, nothing else.`
    }]
  });

  return response.content[0].text;
}

async function generateVoiceover(script) {
  if (!ELEVENLABS_API_KEY) {
    return { success: false, error: 'ElevenLabs API key not configured', script };
  }

  try {
    const voiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam - deep authoritative voice
    const body = JSON.stringify({
      text: script.replace(/\[PAUSE\]/g, '...'),
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.6,
        similarity_boost: 0.85
      }
    });

    const result = await httpRequest({
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${voiceId}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
        'Accept': 'application/json'
      }
    }, body);

    return {
      success: result.status === 200,
      status: result.status,
      audioGenerated: result.status === 200,
      data: result.data
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function createPictoryVideo(script, intelligence) {
  if (!PICTORY_API_KEY) {
    return { success: false, error: 'Pictory API key not configured', script };
  }

  try {
    const body = JSON.stringify({
      script: script.replace(/\[PAUSE\]/g, ''),
      title: intelligence.summary ? intelligence.summary.substring(0, 60) : 'Mentor Millionaire',
      style: 'cinematic'
    });

    const result = await httpRequest({
      hostname: 'api.pictory.ai',
      path: '/v1/video',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PICTORY_API_KEY}`
      }
    }, body);

    return { success: result.status < 300, status: result.status, data: result.data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function postToLate(content) {
  if (!LATE_API_KEY) {
    return { success: false, error: 'Late API key not configured' };
  }

  const results = {};

  for (const [platform, accountId] of Object.entries(LATE_ACCOUNTS)) {
    try {
      const body = JSON.stringify({
        accountId,
        content: {
          text: content.caption,
          mediaUrl: content.videoUrl || null
        },
        scheduledFor: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
      });

      const result = await httpRequest({
        hostname: 'api.late.so',
        path: '/v1/posts',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LATE_API_KEY}`
        }
      }, body);

      results[platform] = { success: result.status < 300, status: result.status, data: result.data };
    } catch (err) {
      results[platform] = { success: false, error: err.message };
    }
  }

  return results;
}

async function automateContent(url, type = 'auto') {
  const steps = {};

  // Step 1: Extract intelligence
  console.log('[Pipeline] Step 1: Extracting intelligence...');
  const extraction = await extractFromUrl(url, type);
  steps.extraction = { success: true, intelligence: extraction.intelligence };

  // Step 2: Write script
  console.log('[Pipeline] Step 2: Writing Mentor Millionaire script...');
  const script = await writeScript(extraction.intelligence);
  steps.script = { success: true, script };

  // Step 3: Generate voiceover
  console.log('[Pipeline] Step 3: Generating ElevenLabs voiceover...');
  const voiceover = await generateVoiceover(script);
  steps.voiceover = voiceover;

  // Step 4: Create video with Pictory
  console.log('[Pipeline] Step 4: Creating Pictory video...');
  const video = await createPictoryVideo(script, extraction.intelligence);
  steps.video = video;

  // Step 5: Post to social via Late
  console.log('[Pipeline] Step 5: Posting to social platforms via Late...');
  const caption = extraction.intelligence.scriptHook || extraction.intelligence.summary || 'New insight from Mentor Millionaire';
  const socialPost = await postToLate({
    caption: `${caption}\n\nFollow @mentormillionaire for more.`,
    videoUrl: video.data?.url || null
  });
  steps.socialPosting = socialPost;

  return {
    success: true,
    url,
    pipeline: steps,
    completedAt: new Date().toISOString()
  };
}

module.exports = { automateContent, writeScript, generateVoiceover, createPictoryVideo, postToLate };
