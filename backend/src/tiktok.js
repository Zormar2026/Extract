const { execFile } = require('child_process');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

/**
 * Extract TikTok video info and transcript using yt-dlp with oEmbed fallback
 */
async function getTikTokData(url) {
  console.log(`[TikTok] Extracting: ${url}`);

  // Try yt-dlp first (gets metadata + subtitles)
  try {
    const data = await extractWithYtdlp(url);
    if (data && data.title) {
      console.log(`[TikTok] yt-dlp success: "${data.title}" by @${data.author}`);
      return data;
    }
  } catch (err) {
    console.warn(`[TikTok] yt-dlp failed: ${err.message}`);
  }

  // Fallback: TikTok oEmbed API
  try {
    const data = await extractWithOembed(url);
    console.log(`[TikTok] oEmbed fallback: "${data.title}" by @${data.author}`);
    return data;
  } catch (err) {
    console.warn(`[TikTok] oEmbed fallback failed: ${err.message}`);
  }

  return { url, title: 'Unknown TikTok', author: 'Unknown', transcript: '[Could not extract TikTok content]' };
}

function extractWithYtdlp(url) {
  // Try with extractor-args first, then without
  return tryYtdlp(url, true).catch(() => tryYtdlp(url, false));
}

function runYtdlp(args, timeout = 45000) {
  return new Promise((resolve, reject) => {
    execFile('yt-dlp', args, { timeout, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve(stdout);
    });
  });
}

async function tryYtdlp(url, useExtractorArgs) {
  const tmpDir = os.tmpdir();
  const tmpId = Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  const tmpBase = path.join(tmpDir, `tiktok_${tmpId}`);

  const extraArgs = useExtractorArgs
    ? ['--extractor-args', 'tiktok:api_hostname=api22-normal-c-useast2a.tiktokv.com']
    : [];

  // Step 1: Get metadata JSON
  const jsonArgs = ['--dump-json', '--no-download', '--no-warnings', ...extraArgs, url];
  const stdout = await runYtdlp(jsonArgs);

  let meta;
  try {
    meta = JSON.parse(stdout);
  } catch (e) {
    throw new Error('Failed to parse yt-dlp JSON');
  }

  // Step 2: Download subtitles separately (don't fail if unavailable)
  let transcript = '';
  try {
    const subArgs = [
      '--write-subs', '--write-auto-subs',
      '--sub-langs', 'en.*,en,eng.*,eng',
      '--skip-download', '--no-warnings',
      ...extraArgs,
      '-o', tmpBase,
      url
    ];
    await runYtdlp(subArgs, 30000);

    const subFiles = fs.readdirSync(tmpDir).filter(f => f.startsWith(`tiktok_${tmpId}`) && f.endsWith('.vtt'));
    if (subFiles.length > 0) {
      const vttContent = fs.readFileSync(path.join(tmpDir, subFiles[0]), 'utf8');
      transcript = parseVTT(vttContent);
      console.log(`[TikTok] Subtitles extracted: ${transcript.length} chars`);
    }
  } catch (e) {
    console.log(`[TikTok] No subtitles available: ${e.message?.slice(0, 80)}`);
  }

  cleanup(tmpBase);

  const duration = meta.duration ? formatDuration(meta.duration) : '';

  return {
    title: meta.title || meta.fulltitle || 'TikTok Video',
    author: meta.uploader || meta.channel || 'Unknown',
    authorUrl: meta.uploader_url || '',
    duration,
    durationSeconds: meta.duration || 0,
    views: meta.view_count || 0,
    likes: meta.like_count || 0,
    comments: meta.comment_count || 0,
    shares: meta.repost_count || 0,
    saves: meta.save_count || 0,
    description: meta.description || '',
    transcript: transcript || '[No captions available — AI will analyze from metadata and description]',
    thumbnail: meta.thumbnail || '',
    uploadDate: meta.upload_date || '',
    videoId: meta.id || ''
  };
}

function extractWithOembed(url) {
  return new Promise((resolve, reject) => {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;

    https.get(oembedUrl, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const oembed = JSON.parse(data);
          resolve({
            title: oembed.title || 'TikTok Video',
            author: oembed.author_name || 'Unknown',
            authorUrl: oembed.author_url || '',
            duration: '',
            durationSeconds: 0,
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0,
            saves: 0,
            description: oembed.title || '',
            transcript: '[No transcript available via oEmbed — AI will analyze from title and metadata]',
            thumbnail: oembed.thumbnail_url || '',
            uploadDate: '',
            videoId: ''
          });
        } catch (e) {
          reject(new Error('Failed to parse oEmbed response'));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Parse WebVTT subtitle file into plain text transcript
 */
function parseVTT(vttContent) {
  const lines = vttContent.split('\n');
  const textLines = [];
  let prevLine = '';

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip header, timestamps, empty lines
    if (!trimmed || trimmed === 'WEBVTT' || /^\d{2}:\d{2}/.test(trimmed) || /^NOTE/.test(trimmed)) continue;
    // Skip numeric cue identifiers
    if (/^\d+$/.test(trimmed)) continue;
    // Deduplicate consecutive identical lines
    if (trimmed !== prevLine) {
      textLines.push(trimmed);
      prevLine = trimmed;
    }
  }

  return textLines.join(' ').replace(/\s+/g, ' ').trim();
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function cleanup(tmpBase) {
  try {
    const dir = path.dirname(tmpBase);
    const base = path.basename(tmpBase);
    const files = fs.readdirSync(dir).filter(f => f.startsWith(base.replace(dir + '/', '')));
    files.forEach(f => {
      try { fs.unlinkSync(path.join(dir, f)); } catch (e) {}
    });
  } catch (e) {}
}

module.exports = { getTikTokData };
