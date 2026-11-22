const crypto = require('node:crypto');

const API_BASE = 'https://api.opensubtitles.com/api/v1';
const USER_AGENT = 'NuvioForcedEnglishSubtitles/0.1.0';

function isForcedCandidate(item) {
  const attrs = item?.attributes || {};
  const labels = [attrs.release, attrs.comments].filter(Boolean).join(' ');
  return /\b(forced|foreign[ ._-]*parts?|fpo|non[ ._-]*english[ ._-]*parts?)\b/i.test(labels);
}

function makeSubtitleId(fileId, secret) {
  if (!secret || secret.length < 32) {
    throw new Error('SUBTITLE_SIGNING_SECRET must be at least 32 characters.');
  }
  const signature = crypto
    .createHmac('sha256', secret)
    .update(String(fileId))
    .digest('hex')
    .slice(0, 24);

  return `${fileId}.${signature}`;
}

function readSubtitleId(value, secret) {
  const match = /^(\d+)\.([a-f0-9]{24})$/.exec(value || '');
  if (!match || !secret || secret.length < 32) return null;

  const expected = makeSubtitleId(match[1], secret).split('.')[1];
  return crypto.timingSafeEqual(
    Buffer.from(match[2]),
    Buffer.from(expected)
  ) ? match[1] : null;
}

async function searchOpenSubtitles({
  type, id, season, episode, apiKey, token, signingSecret, fetchImpl = fetch
}) {
  if (!apiKey || !token) {
    throw new Error('OpenSubtitles API key and bearer token are required.');
  }

  const imdbId = id.match(/tt\d+/)?.[0];
  if (!imdbId) return [];

  const query = new URLSearchParams({
    imdb_id: imdbId,
    languages: 'en',
    type: type === 'series' ? 'episode' : 'movie'
  });

  if (type === 'series') {
    if (season != null) query.set('season_number', String(season));
    if (episode != null) query.set('episode_number', String(episode));
  }

  const response = await fetchImpl(`${API_BASE}/subtitles?${query}`, {
    headers: {
      'Api-Key': apiKey,
      Authorization: `Bearer ${token}`,
      'User-Agent': USER_AGENT
    },
    signal: AbortSignal.timeout(20000)
  });

  if (!response.ok) {
    throw new Error(`OpenSubtitles search failed (HTTP ${response.status}).`);
  }

  const body = await response.json();
  const seenFileIds = new Set();
  const results = [];

  for (const item of body.data || []) {
    const attrs = item.attributes || {};
    const file = (attrs.files || []).find(candidate => candidate.file_id);

    // English-language results are not necessarily forced subtitles.
    // Require explicit forced/foreign-parts metadata and deduplicate by file ID.
    if (attrs.language !== 'en' || !isForcedCandidate(item) || !file) continue;
    if (seenFileIds.has(String(file.file_id))) continue;
    seenFileIds.add(String(file.file_id));

    results.push({
      id: makeSubtitleId(file.file_id, signingSecret),
      lang: 'eng',
      name: `English forced · ${attrs.release || 'OpenSubtitles'}`,
      fileId: file.file_id
    });
  }

  return results;
}

module.exports = {
  API_BASE,
  USER_AGENT,
  isForcedCandidate,
  makeSubtitleId,
  readSubtitleId,
  searchOpenSubtitles
};
