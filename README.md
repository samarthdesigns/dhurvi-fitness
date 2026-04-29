# Dhruvi's Gym Plan 💪✨

Personal fitness PWA — React + Vite, IndexedDB + GitHub sync, Gemini SmartTips.

## Quick Start (local, no sync)

```bash
npm install
npx vite
```

## Deploy to Netlify

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Dhruvi's Gym Plan"
git remote add origin https://github.com/YOUR_USER/dhruvi-gym.git
git push -u origin main
```

### 2. Get API Keys

**Gemini** (SmartTips): [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → Create key

**GitHub** (cross-device sync): [github.com/settings/tokens](https://github.com/settings/tokens?type=beta) → Generate new token (Fine-grained)
- Select **Only select repositories** → pick your dhruvi-gym repo
- Under **Permissions → Repository permissions** → set **Contents** to **Read and write**
- Generate → copy the token

### 3. Deploy on Netlify

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**
2. Select your repo — Netlify reads `netlify.toml` automatically
3. **Site configuration → Environment variables** → add these:

| Key | Value | What it does |
|-----|-------|--------------|
| `GEMINI_API_KEY` | `AIza...` | SmartTips AI (server-side only) |
| `GITHUB_TOKEN` | `github_pat_...` | Sync data across devices (server-side only) |
| `GITHUB_REPO` | `youruser/dhruvi-gym` | Which repo to store data in |

4. Deploy!

> All 3 keys stay server-side in Netlify Functions — never sent to the browser.

### 4. Local dev with full features

Create `.env` in project root (gitignored):
```
GEMINI_API_KEY=AIza...
GITHUB_TOKEN=github_pat_...
GITHUB_REPO=youruser/dhruvi-gym
```
```bash
npm i -g netlify-cli
netlify dev
```

## How Cross-Device Sync Works

Your gym data is stored as a single JSON file (`data/gym-data.json`) in your GitHub repo. The app auto-syncs:

1. **On app load** → pulls from GitHub, merges with local data, pushes back
2. **After saving a log** → pushes updated data to GitHub
3. **🔄 button in top bar** → manual sync anytime

Open the app on your phone, log a workout. Open on your laptop later — data is there. No accounts, no databases, just a JSON file in your own repo.

The backup/import feature (password: `gymgoingdhubu`) still works as a safety net before deploying new versions.

## Architecture

```
Browser (any device)
  ├── React SPA
  ├── IndexedDB (instant local)
  └── Netlify Function → GitHub API → data/gym-data.json
                       → Gemini API → SmartTips
```

## SmartTips

Each exercise gets its own Gemini prompt:
- **Has history:** sends that exercise's sessions → specific weight/sets/reps for next session
- **No history:** sends all other exercises to gauge overall level → starting recommendation

Tips refresh on: app load, after saving a log, 🔄 on Gym page.

---
*Built with love for Dhruvi 💕*
