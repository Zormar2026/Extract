const https = require('https');
const { URL } = require('url');

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

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ raw: data });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Request timeout')); });
    req.end();
  });
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const req = https.request(options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchText(res.headers.location).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Request timeout')); });
    req.end();
  });
}

async function getVideoInfo(url) {
  const videoId = extractVideoId(url);

  try {
    // Use oembed API for basic info
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const oembed = await fetchJson(oembedUrl);

    // Scrape the watch page for more details
    const pageHtml = await fetchText(`https://www.youtube.com/watch?v=${videoId}`);

    let description = '';
    let views = '';
    let duration = '';

    // Extract description from meta tags
    const descMatch = pageHtml.match(/<meta\s+name="description"\s+content="([^"]*?)"/i);
    if (descMatch) description = descMatch[1];

    // Extract view count from page
    const viewMatch = pageHtml.match(/"viewCount":"(\d+)"/);
    if (viewMatch) views = parseInt(viewMatch[1]).toLocaleString();

    // Extract duration
    const durMatch = pageHtml.match(/"lengthSeconds":"(\d+)"/);
    if (durMatch) {
      const secs = parseInt(durMatch[1]);
      const mins = Math.floor(secs / 60);
      const remainSecs = secs % 60;
      duration = `${mins}:${remainSecs.toString().padStart(2, '0')}`;
    }

    return {
      title: oembed.title || 'Unknown',
      author: oembed.author_name || 'Unknown',
      duration,
      views,
      description,
      videoId
    };
  } catch (err) {
    console.warn(`[YouTube] Info fetch fallback: ${err.message}`);
    return {
      title: 'Unknown',
      author: 'Unknown',
      duration: '',
      views: '',
      description: '',
      videoId
    };
  }
}

async function getTranscript(url) {
  const videoId = extractVideoId(url);

  try {
    // Fetch the watch page to get caption track info
    const pageHtml = await fetchText(`https://www.youtube.com/watch?v=${videoId}`);

    // Extract captions URL from the page's player response
    const captionMatch = pageHtml.match(/"captionTracks":\s*(\[[\s\S]*?\])/);
    if (!captionMatch) {
      return '[No captions available for this video]';
    }

    let captionTracks;
    try {
      captionTracks = JSON.parse(captionMatch[1]);
    } catch (e) {
      return '[Could not parse caption data]';
    }

    // Prefer English captions
    let track = captionTracks.find(t => t.languageCode === 'en');
    if (!track) track = captionTracks[0];
    if (!track || !track.baseUrl) {
      return '[No suitable caption track found]';
    }

    // Fetch the captions XML
    const captionXml = await fetchText(track.baseUrl);

    // Parse XML to extract text
    const textSegments = [];
    const regex = /<text[^>]*>([\s\S]*?)<\/text>/g;
    let match;
    while ((match = regex.exec(captionXml)) !== null) {
      let text = match[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n/g, ' ')
        .trim();
      if (text) textSegments.push(text);
    }

    if (textSegments.length === 0) {
      return '[Captions found but empty]';
    }

    return textSegments.join(' ');
  } catch (err) {
    console.warn(`[YouTube] Transcript fetch error: ${err.message}`);
    return `[Transcript unavailable: ${err.message}]`;
  }
}

module.exports = { getVideoInfo, getTranscript, extractVideoId };
