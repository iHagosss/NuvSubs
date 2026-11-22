const express = require('express');
const { addonBuilder, getRouter } = require('stremio-addon-sdk');
const {
  API_BASE,
  USER_AGENT,
  readSubtitleId,
  searchOpenSubtitles
} = require('./provider');

const apiKey = process.env.OPENSUBTITLES_API_KEY;
const token = process.env.OPENSUBTITLES_TOKEN;
const signingSecret = process.env.SUBTITLE_SIGNING_SECRET;
const port = Number(process.env.PORT || 7000);
const publicUrl = (
  process.env.PUBLIC_URL || `http://127.0.0.1:${port}`
).replace(/\/$/, '');

if (!signingSecret || signingSecret.length < 32) {
  console.error('Set SUBTITLE_SIGNING_SECRET to a random value of at least 32 characters.');
  process.exit(1);
}

const addon = new addonBuilder({
  id: 'community.nuvio.forced-english-subtitles',
  version: '0.1.0',
  name: 'Forced English Subtitles',
  description: 'Finds explicitly labeled English forced/foreign-parts subtitles.',
  resources: ['subtitles'],
  types: ['movie', 'series'],
  catalogs: [],
  idPrefixes: ['tt']
});

addon.defineSubtitlesHandler(async ({ type, id }) => {
  try {
    const episode = /tt\d+:(\d+):(\d+)/.exec(id);
    const entries = await searchOpenSubtitles({
      type,
      id,
      season: episode ? Number(episode[1]) : undefined,
      episode: episode ? Number(episode[2]) : undefined,
      apiKey,
      token,
      signingSecret
    });

    return {
      subtitles: entries.map(({ id: subtitleId, name, lang }) => ({
        id: subtitleId,
        lang,
        name,
        url: `${publicUrl}/file/${encodeURIComponent(subtitleId)}.srt`
      }))
    };
  } catch (error) {
    console.error('Subtitle lookup failed:', error.message);
    return { subtitles: [] };
  }
});

const app = express();

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'nuvio-forced-english-subtitles' });
});

app.get('/file/:signedId.srt', async (req, res) => {
  const fileId = readSubtitleId(req.params.signedId, signingSecret);
  if (!fileId || !apiKey || !token) return res.sendStatus(404);

  try {
    const downloadResponse = await fetch(`${API_BASE}/download`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        Authorization: `Bearer ${token}`,
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ file_id: Number(fileId) }),
      signal: AbortSignal.timeout(20000)
    });

    if (!downloadResponse.ok) return res.sendStatus(502);
    const download = await downloadResponse.json();
    if (!download.link) return res.sendStatus(404);

    const subtitleResponse = await fetch(download.link, {
      signal: AbortSignal.timeout(20000)
    });
    if (!subtitleResponse.ok) return res.sendStatus(502);

    const text = await subtitleResponse.text();
    if (text.length > 5000000) return res.sendStatus(413);

    res.type('application/x-subrip')
      .set('Cache-Control', 'public, max-age=3600')
      .send(text);
  } catch (error) {
    console.error('Subtitle download failed:', error.message);
    res.sendStatus(502);
  }
});

app.use(getRouter(addon.getInterface()));

app.listen(port, '0.0.0.0', () => {
  console.log(`Subtitle addon listening on port ${port}`);
});
