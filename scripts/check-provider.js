const { API_BASE, USER_AGENT } = require('../src/provider');

async function main() {
  const apiKey = process.env.OPENSUBTITLES_API_KEY;
  const token = process.env.OPENSUBTITLES_TOKEN;

  if (!apiKey || !token) {
    throw new Error('Set OPENSUBTITLES_API_KEY and OPENSUBTITLES_TOKEN secrets.');
  }

  const response = await fetch(`${API_BASE}/infos/user`, {
    headers: {
      'Api-Key': apiKey,
      Authorization: `Bearer ${token}`,
      'User-Agent': USER_AGENT
    },
    signal: AbortSignal.timeout(20000)
  });

  if (response.status === 401) {
    throw new Error('OpenSubtitles rejected the bearer token (401). Replace the token.');
  }
  if (response.status === 403) {
    throw new Error('OpenSubtitles rejected the API key or account permissions (403).');
  }
  if (!response.ok) {
    throw new Error(`OpenSubtitles credential check failed (HTTP ${response.status}).`);
  }

  console.log('OpenSubtitles credentials are valid.');

  const addonUrl = process.env.ADDON_URL;
  if (!addonUrl) {
    console.log('ADDON_URL is not set; skipped deployed-service checks.');
    return;
  }

  const base = addonUrl.replace(/\/$/, '');
  const health = await fetch(`${base}/health`, {
    signal: AbortSignal.timeout(20000)
  });
  if (!health.ok) throw new Error(`Addon health endpoint failed (HTTP ${health.status}).`);

  const manifestResponse = await fetch(`${base}/manifest.json`, {
    signal: AbortSignal.timeout(20000)
  });
  if (!manifestResponse.ok) {
    throw new Error(`Addon manifest failed (HTTP ${manifestResponse.status}).`);
  }

  const manifest = await manifestResponse.json();
  if (!manifest.resources?.includes('subtitles')) {
    throw new Error('Addon manifest does not declare subtitles.');
  }

  console.log('Deployed addon health and manifest checks passed.');
}

main().catch(error => {
  console.error(`Health check FAILED: ${error.message}`);
  process.exitCode = 1;
});
