# Nuvio Forced English Subtitles

A Stremio-protocol subtitle addon that looks up English forced/foreign-parts-only
subtitles in OpenSubtitles. It only returns tracks explicitly labeled by provider
metadata as forced/foreign-parts; it excludes ordinary full-dialogue English
subtitles and deduplicates duplicate file results.

## Important limits

No service can guarantee subtitles for every title or every non-English scene:
provider catalogs are incomplete, and forced-track labels can be wrong or missing.
This project does not use AI to guess from full-dialogue subtitles because that
can show English dialogue when English is spoken. Provider API access and hosting
may have changing costs, limits, and terms.

GitHub Actions can test the project, publish its container image, and check
credentials. GitHub Actions and GitHub Pages do not run the addon as an always-on
web server. The published image needs a separate persistent container host.

## Owner setup

The owner must arrange a host and configure these environment variables there:

- `OPENSUBTITLES_API_KEY`
- `OPENSUBTITLES_TOKEN`
- `SUBTITLE_SIGNING_SECRET` (random value, at least 32 characters)
- `PUBLIC_URL` (externally reachable service base URL)
- Optional `PORT` (defaults to `7000`)

For the daily GitHub Actions health check, add repository Actions secrets named
`OPENSUBTITLES_API_KEY` and `OPENSUBTITLES_TOKEN`. Set repository variable
`ADDON_URL` to the deployed service URL for its health/manifest checks.

The workflow can detect a rejected/expired bearer token, but it cannot rotate
GitHub secrets or recover an account login automatically. The owner must replace
an invalid token. Never commit credentials.

After deploying, install `https://YOUR_HOST/manifest.json` in Nuvio under
Settings > Addons > Add Addon. Users do not need to configure provider credentials.

## Local run

```sh
npm install
npm test
OPENSUBTITLES_API_KEY=... OPENSUBTITLES_TOKEN=... \
SUBTITLE_SIGNING_SECRET='random-secret-at-least-32-characters' \
PUBLIC_URL=http://localhost:7000 npm start
```

Endpoints: `/manifest.json`, `/subtitles/{type}/{id}.json`, and `/health`.
