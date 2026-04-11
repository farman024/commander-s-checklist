# ⚡ The Commander's Checklist

> *"Discipline is doing what needs to be done, even when you don't want to."*

A high-stakes daily accountability PWA for traders and builders. Built with a terminal/black-site aesthetic — because discipline deserves a war room, not a wellness app.

**Live Demo → [farman024.github.io/commander-s-checklist](https://farman024.github.io/commander-s-checklist/)**

---

## Features

### 🎯 Daily Audit
- Track whether you protected your energy today
- Flag if the Alter Ego won (critical failure state)
- Log your 1% improvement for tomorrow

### 🔥 Discipline Streak
- Prominent days counter — `001`, `002`, `003`...
- Green day → streak increments + MISSION ACCOMPLISHED screen
- Red day → streak resets to zero + shutdown quote

### ⚠️ Breach Detection
- Missed a day? The system locks and demands an incident report
- **Forgot/Unwell** → Integrity Maintained → streak restored
- **Broke the Rule** → System Failure → streak reset to zero

### 📊 Stats Dashboard
- Total days filed, green days, red days
- Win rate (color coded by performance)
- Current streak + all-time longest streak
- 35-day discipline heatmap

### 📅 History Log
- Scroll through all past 1% improvement entries
- Each entry color coded green or red
- Reverse chronological order

### 🎖️ Commander Identity
- First-time setup: enter your Name + Codename
- Personalized throughout the entire app
- Stored locally — asks only once

### 🔊 Sensory Feedback
- Web Audio API success beep on green day completion
- 2-second green pulse animation on mission accomplished
- CRT scanline overlay + glitch header animation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML + React 18 (CDN) |
| Styling | Inline styles + CSS animations |
| Font | JetBrains Mono (Google Fonts) |
| Storage | localStorage (Supabase-ready) |
| Audio | Web Audio API |
| Deployment | Netlify |
| PWA | manifest.json + Service Worker |

---

## PWA Installation

On Android (Chrome/Brave):
1. Open the live URL
2. Tap ⋮ → **Add to Home Screen**
3. Opens fullscreen — no browser bar

---

## Data Structure

All data stored locally under `cdr_state`:

```json
{
  "name": "Farman",
  "codename": "Falcon",
  "streak": 12,
  "lastSubmitDate": "2026-04-11",
  "logs": [
    {
      "date": "2026-04-11",
      "energy": true,
      "alterEgo": false,
      "improvement": "Wake up 30 mins earlier tomorrow."
    }
  ]
}
```

> Supabase integration is scaffolded and ready — swap `MockDB` functions to connect.

---

## Local Development

No build step required. Just open `index.html` in any browser.

```bash
git clone https://github.com/farman024/commanders-checklist
cd commanders-checklist
open index.html
```

---

## Roadmap

- [ ] Supabase cross-device sync
- [ ] Daily push notification reminders
- [ ] Weekly email summary
- [ ] Streak milestones (Day 7, 30, 100)
- [ ] Export logs as CSV

---

## Built By

**Farman J** — AI Generalist · Builder · Trader

> Building tools that reflect values, not just function.

- 🌐 [Portfolio](https://farman024.github.io/Farman-J)
- 🐦 [@Farman__24__](https://twitter.com/Farman__24__)

---

*Part of the **Falcon's Hunt** ecosystem — 11 live projects built from a smartphone.*
