# Dhruvi's Gym Plan 💪✨

A personal fitness PWA built with React + Vite (frontend) and Express + SQLite (backend), deployable to Render.

## Features

### 📅 Log Page (Calendar)
- Compact calendar with 7-day streak strip
- Structured inputs: Calories / Protein / Fiber number fields, dropdown+value cardio rows, dropdown+textarea exercise rows
- "Manage types" modals for cardio and exercises — add or remove types, persisted to SQLite
- Download backup & Import backup (merge strategy) — password protected (`gymgoingdhubu`)
- Mood selector

### 🏋️ Gym Page
- Push/Pull/Legs split at **Minimum** (3 days) and **Good** (5 days) tiers
- Super beginner-friendly exercises — perfect for someone brand new to the gym
- SmartTip engine under every exercise — detects plateaus, drops, overreaching, and suggests next weight/reps
- YouTube form video links for every exercise
- Beginner tips section

### 📊 Analytics Page
- **Nutrition:** Calories, Protein, Fiber charts. Daily and weekly views with history navigation. Color-coded against 1,450 cal target
- **Exercise:** Volume area chart, max weight bar chart, session history with PR/DROP badges, set breakdown
- **Cardio:** Per-type charts with distance/pace for runs, step count with 10k goal line
- SmartInsight panels throughout — deterministic NLP, no external API

### 🥗 Meals Page
- 7-day vegetarian meal plan at 1,450 calories/day
- Indian-inspired meals with full macro breakdowns
- Today's meals auto-expanded
- Practical tips for healthy eating

## Tech Stack
- **Frontend:** React 18, Vite, Recharts, React Router
- **Backend:** Express, better-sqlite3
- **Design:** Custom CSS, Quicksand + Nunito fonts, warm pink/coral theme
- **PWA:** Service worker, manifest, installable on mobile

## Quick Start

```bash
npm install
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:3001

## Deploy to Render

1. Push to GitHub
2. Connect repo to Render
3. Render auto-detects `render.yaml`
4. Add a 1GB persistent disk at `/var/data`
5. Deploy!

## Backup Password
`gymgoingdhubu`

---
*Built with love for Dhruvi 💕*
