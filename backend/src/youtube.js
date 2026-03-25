const https = require('https');
const { URL } = require('url');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  throw new Error('Could not extract YouTube video ID from URL');
}

function fetchUrl(url, json = false) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    };
    const req = https.request(options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUrl(res.headers.location, json).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (json) {
          try { resolve(JSON.parse(data)); } catch (e) { resolve({ raw: data }); }
        } else {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Request timeout')); });
    req.end();
  });
}

function runCmd(cmd, args, timeout = 45000) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve(stdout);
    });
  });
}

// Soft version — doesn't reject on non-zero exit (for subtitle downloads where partial success is OK)
function runCmdSoft(cmd, args, timeout = 45000) {
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      resolve(stdout || '');
    });
  });
}

// ──────────────────────────────────────────────────────────────
// VIDEO INFO
// ──────────────────────────────────────────────────────────────

async function getVideoInfo(url) {
  const videoId = extractVideoId(url);

  // Try yt-dlp first
  try {
    const stdout = await runCmd('yt-dlp', [
      '--dump-json', '--no-download', '--no-warnings', url
    ], 30000);
    const meta = JSON.parse(stdout);
    const secs = meta.duration || 0;
    return {
      title: meta.title || meta.fulltitle || 'Unknown',
      author: meta.uploader || meta.channel || 'Unknown',
      duration: secs ? `${Math.floor(secs/60)}:${(secs%60).toString().padStart(2,'0')}` : '',
      views: meta.view_count ? meta.view_count.toLocaleString() : '',
      description: meta.description || '',
      videoId
    };
  } catch (err) {
    console.warn(`[YouTube] yt-dlp info failed: ${err.message?.slice(0, 60)}`);
  }

  // Fallback: oEmbed + page scraping
  try {
    const oembed = await fetchUrl(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, true);
    let description = '', views = '', duration = '';

    try {
      const page = await fetchUrl(`https://www.youtube.com/watch?v=${videoId}`);
      const descMatch = page.match(/<meta\s+name="description"\s+content="([^"]*?)"/i);
      if (descMatch) description = descMatch[1];
      const viewMatch = page.match(/"viewCount":"(\d+)"/);
      if (viewMatch) views = parseInt(viewMatch[1]).toLocaleString();
      const durMatch = page.match(/"lengthSeconds":"(\d+)"/);
      if (durMatch) {
        const s = parseInt(durMatch[1]);
        duration = `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;
      }
      // Try to get description from ytInitialData if meta tag is short
      if (description.length < 100) {
        const longDescMatch = page.match(/"attributedDescriptionBodyText":\{"content":"((?:[^"\\]|\\.)*)"/);
        if (longDescMatch) description = longDescMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      }
    } catch (e) {}

    return {
      title: oembed.title || 'Unknown',
      author: oembed.author_name || 'Unknown',
      duration,
      views,
      description,
      videoId
    };
  } catch (err) {
    console.warn(`[YouTube] oEmbed fallback failed: ${err.message}`);
    return { title: 'Unknown', author: 'Unknown', duration: '', views: '', description: '', videoId };
  }
}

// ──────────────────────────────────────────────────────────────
// TRANSCRIPT
// ──────────────────────────────────────────────────────────────

async function getTranscript(url) {
  const videoId = extractVideoId(url);

  // Layer 1: yt-dlp subtitle download
  const ytdlpResult = await tryYtdlpSubtitles(url, videoId);
  if (ytdlpResult) return ytdlpResult;

  // Layer 2: Python youtube-transcript-api
  const pyResult = await tryPythonTranscript(videoId);
  if (pyResult) return pyResult;

  // Layer 3: Page scraping for caption tracks (legacy, works when not bot-blocked)
  const scrapeResult = await tryPageScrape(videoId);
  if (scrapeResult) return scrapeResult;

  return '[No transcript available — video has no captions]';
}

async function tryYtdlpSubtitles(url, videoId) {
  const tmpDir = os.tmpdir();
  const tmpId = `yt_${videoId}_${Date.now()}`;
  const tmpBase = path.join(tmpDir, tmpId);

  try {
    // Use soft runner — yt-dlp may exit non-zero if some sub variants 429
    await runCmdSoft('yt-dlp', [
      '--write-subs', '--write-auto-subs',
      '--sub-langs', 'en.*,en,eng.*,eng',
      '--skip-download', '--no-warnings',
      '-o', tmpBase,
      url
    ], 30000);

    const subFiles = fs.readdirSync(tmpDir)
      .filter(f => f.startsWith(tmpId) && f.endsWith('.vtt'))
      .sort((a, b) => {
        const rank = f => f.includes('.en-orig.') ? 0 : f.includes('.en.') ? 1 : f.includes('.en-en.') ? 2 : 3;
        return rank(a) - rank(b);
      });

    if (subFiles.length > 0) {
      const vttContent = fs.readFileSync(path.join(tmpDir, subFiles[0]), 'utf8');
      const transcript = parseVTT(vttContent);
      cleanup(tmpDir, tmpId);
      if (transcript && transcript.length > 20) {
        console.log(`[YouTube] Transcript via yt-dlp: ${transcript.length} chars`);
        return transcript;
      }
    }
  } catch (e) {
    console.warn(`[YouTube] yt-dlp subs failed: ${e.message?.slice(0, 60)}`);
  }

  cleanup(tmpDir, tmpId);
  return null;
}

async function tryPythonTranscript(videoId) {
  try {
    const script = `
import json, sys
try:
    from youtube_transcript_api import YouTubeTranscriptApi
    api = YouTubeTranscriptApi()
    transcript = api.fetch('${videoId}')
    text = ' '.join(t.text for t in transcript)
    print(json.dumps({'ok': True, 'text': text}))
except Exception as e:
    print(json.dumps({'ok': False, 'error': str(e)[:200]}))
`;
    const stdout = await runCmd('python3', ['-c', script], 15000);
    const result = JSON.parse(stdout.trim());
    if (result.ok && result.text && result.text.length > 20) {
      console.log(`[YouTube] Transcript via python API: ${result.text.length} chars`);
      return result.text;
    }
  } catch (e) {
    // Python not available or package not installed — skip silently
  }
  return null;
}

async function tryPageScrape(videoId) {
  try {
    const page = await fetchUrl(`https://www.youtube.com/watch?v=${videoId}`);

    // Try to find captionTracks in playerResponse
    const captionMatch = page.match(/"captionTracks":\s*(\[[\s\S]*?\])/);
    if (!captionMatch) return null;

    let tracks;
    try { tracks = JSON.parse(captionMatch[1]); } catch (e) { return null; }

    let track = tracks.find(t => t.languageCode === 'en');
    if (!track) track = tracks[0];
    if (!track || !track.baseUrl) return null;

    const captionXml = await fetchUrl(track.baseUrl);
    const textSegments = [];
    const regex = /<text[^>]*>([\s\S]*?)<\/text>/g;
    let match;
    while ((match = regex.exec(captionXml)) !== null) {
      let text = match[1]
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\n/g, ' ').trim();
      if (text) textSegments.push(text);
    }

    if (textSegments.length > 0) {
      const transcript = textSegments.join(' ');
      console.log(`[YouTube] Transcript via page scrape: ${transcript.length} chars`);
      return transcript;
    }
  } catch (e) {
    // Silently fail — other layers may work
  }
  return null;
}

// ──────────────────────────────────────────────────────────────
// VTT PARSER
// ──────────────────────────────────────────────────────────────

function parseVTT(vttContent) {
  const lines = vttContent.split('\n');
  const seen = new Set();
  const textLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed === 'WEBVTT') continue;
    if (/^Kind:|^Language:/.test(trimmed)) continue;
    if (/^\d{2}:\d{2}/.test(trimmed)) continue;
    if (/^NOTE/.test(trimmed)) continue;
    if (/^\d+$/.test(trimmed)) continue;

    let clean = trimmed
      .replace(/<\d{2}:\d{2}[\d:.]*>/g, '')
      .replace(/<\/?c>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ').trim();

    if (!clean || clean === '[Music]' || clean === '[Applause]') continue;

    if (!seen.has(clean)) {
      seen.add(clean);
      textLines.push(clean);
    }
  }

  return textLines.join(' ').replace(/\s+/g, ' ').trim();
}

function cleanup(dir, prefix) {
  try {
    fs.readdirSync(dir).filter(f => f.startsWith(prefix)).forEach(f => {
      try { fs.unlinkSync(path.join(dir, f)); } catch (e) {}
    });
  } catch (e) {}
}

module.exports = { getVideoInfo, getTranscript, extractVideoId };
