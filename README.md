# NuvSubs — forced English subtitles for Nuvio

NuvSubs is a Nuvio subtitle addon that searches OpenSubtitles for English tracks explicitly labeled **forced** or **foreign parts**. It aims to show subtitles for non-English dialogue while avoiding ordinary full-dialogue English tracks.

> **Important:** No subtitle addon can promise a forced track exists for every title, or that a provider's labels are always correct. NuvSubs deliberately prefers no result over returning an ordinary English subtitle that could appear during English dialogue.

## Easiest setup: deploy your own free service on Render

You do **not** need to install Node.js, use a command line, or manage a server. Render builds and runs the addon from this repository and redeploys it when updates are published to `main`.

### Before you start

You will need:

1. A GitHub account.
2. An OpenSubtitles account and an OpenSubtitles API key and bearer token. NuvSubs uses these to search for and download subtitles. Create/access API credentials through [OpenSubtitles](https://www.opensubtitles.com/consumers) and keep them private.
3. A Render account. Render may ask you to connect GitHub and authorize access to this repository.

OpenSubtitles controls its own account eligibility, API access, rate limits, and terms. NuvSubs cannot create or supply these credentials for you. **Do not post your credentials in an issue, commit them to GitHub, or share them with addon users.**

### Deploy

1. Click the button below and sign in to Render. If asked, connect your GitHub account and allow Render to access `iHagosss/NuvSubs`.

   [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2FiHagosss%2FNuvSubs)

2. Render will read this repository's `render.yaml` and ask you to provide `OPENSUBTITLES_API_KEY` and `OPENSUBTITLES_TOKEN`. Paste them into the corresponding fields in Render. The subtitle signing secret is generated automatically; leave it alone.
3. Choose **Apply** / **Deploy Blueprint** to start deployment. Wait until the service is marked **Live**. The first build can take a few minutes.
4. In Render, open your `nuvsubs` web service and copy its public URL (it ends in `onrender.com`). Open `https://YOUR-SERVICE-URL/health` in a browser; a working service responds with `{"ok":true,...}`.
5. In Nuvio, open **Settings → Addons → Add Addon** and enter `https://YOUR-SERVICE-URL/manifest.json`, replacing `YOUR-SERVICE-URL` with your actual Render hostname. Save/install the addon.

The URL must end in `/manifest.json`. Do not include `/health` when adding the addon.

### Free-hosting notes

- Render's free web service may **spin down when idle**. The first addon request after a quiet period can take longer while it starts. This is a limitation of the free hosting plan, not a Nuvio setting.
- The service is hosted under your Render account. It is not owner-independent hosting; Render and OpenSubtitles still provide the infrastructure and service.
- Render automatically redeploys the service when changes are pushed to this repository's `main` branch. This updates the addon software, but it does not refresh expired OpenSubtitles credentials or guarantee provider availability.
- The addon uses your OpenSubtitles credentials for requests made by users of your deployed service. Only share the addon URL with people you trust, and review OpenSubtitles' terms and usage limits. You can rotate credentials in Render's environment settings and redeploy if needed.
- Render's free plan and policies can change. Check Render's current plan details before deploying.

## Troubleshooting

- **Deploy button says the service cannot be created:** Make sure you are signed in to Render and it has access to this public repository. You can also create a new **Blueprint** in the Render dashboard and select `iHagosss/NuvSubs`.
- **The deployment is live but `/health` fails:** Check the latest deploy's logs in Render. Confirm the service is listening and the deployment completed successfully.
- **Nuvio cannot add the addon:** Use the exact public Render URL followed by `/manifest.json`, and ensure the service status is **Live**. Open the manifest URL in a browser to check it responds.
- **Addon installs but returns no subtitles:** Check that both OpenSubtitles credentials are correct and still valid in Render's environment settings. Confirm the title has an English track explicitly marked forced/foreign-parts; regular English subtitles are intentionally filtered out.
- **Credential changes:** Update `OPENSUBTITLES_API_KEY` or `OPENSUBTITLES_TOKEN` under the service's **Environment** settings in Render, then save/redeploy. Never put secrets in this repository.

## Local development

Requires Node.js 20 or later.

```sh
npm install
npm test
OPENSUBTITLES_API_KEY=... OPENSUBTITLES_TOKEN=... \
SUBTITLE_SIGNING_SECRET='random-secret-at-least-32-characters' \
PUBLIC_URL=http://localhost:7000 npm start
```

Endpoints: `/manifest.json`, `/subtitles/{type}/{id}.json`, `/health`, and the subtitle file URLs returned by the addon.
