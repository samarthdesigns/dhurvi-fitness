# Dhruvi's Gym Plan 💪✨

Personal fitness PWA — React + Vite frontend, IndexedDB storage, Gemini-powered SmartTips via Netlify Functions.

## Quick Start

```bash
npm install
npm run dev        # requires netlify CLI: npm i -g netlify-cli
```

Or just Vite (no SmartTips locally):
```bash
npx vite
```

## Deploy to Netlify via GitHub

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Dhruvi's Gym Plan v2"
git remote add origin https://github.com/YOUR_USER/dhruvi-gym.git
git push -u origin main
```

### Step 2: Connect to Netlify
1. Go to [app.netlify.com](https://app.netlify.com)
2. Click **"Add new site" → "Import an existing project"**
3. Select your GitHub repo
4. Netlify auto-detects `netlify.toml` — build command and publish dir are pre-configured
5. Click **Deploy**

### Step 3: Add Gemini API Key (CRITICAL for SmartTips)
1. Get an API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. In Netlify dashboard: **Site settings → Environment variables**
3. Click **"Add a variable"**
4. Key: `GEMINI_API_KEY`
5. Value: your API key (e.g. `AIzaSy...`)
6. Click **Save**
7. **Redeploy** the site (Deploys → Trigger deploy → Deploy site)

> Without this env var, SmartTips will show nothing — the rest of the app works fine.

### Step 4 (optional): Local development with SmartTips
Create a `.env` file in project root (it's gitignored):
```
GEMINI_API_KEY=your_key_here
```
Then run `netlify dev` (requires `npm i -g netlify-cli`).

## Architecture

| Layer | Tech | Notes |
|-------|------|-------|
| Frontend | React 18 + Vite | SPA with client-side routing |
| Storage | IndexedDB (Dexie) | All data lives in your browser |
| SmartTips | Netlify Function → Gemini 2.5 Flash Lite | Serverless, API key stays hidden |
| Styling | CSS custom properties | Auto dark/light by time of day |
| PWA | Service worker + manifest | Installable on mobile |

## Features
- **Log Page:** Calendar, 7-day streak, structured nutrition/cardio/exercise inputs, mood, backup/import (password: `gymgoingdhubu`)
- **Gym Page:** Push/Pull/Legs at 3-day and 5-day tiers, beginner-friendly exercises, Gemini SmartTips (refresh button), YouTube form videos
- **Analytics:** Nutrition charts, exercise progression with PR/DROP badges, cardio tracking — each exercise's data is fully independent
- **Meals:** 7-day 1,450-cal vegetarian plan with macro breakdowns
- **Theme:** Auto dark mode 5pm-7am, light mode 7am-5pm
- **Desktop:** Top tabs, full-width layout. Mobile: bottom nav

## SmartTip Triggers
Tips refresh from Gemini on:
1. First website visit (app load)
2. After saving a log entry
3. Manual refresh button (🔄) on the Gym page

---
*Built with love for Dhruvi 💕*
