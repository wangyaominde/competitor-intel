# Competitor Scout

[中文](./README.md) · **[English](./README.en.md)**

> Turn “who’s eating my market, where I’m losing, and how to win next” into a local workflow you can run again and again.

[![Demo](https://img.shields.io/badge/Live_Demo-Try_it-5b8cff?style=flat-square)](https://wangyaominde.github.io/competitor-scout/)
[![Download](https://img.shields.io/badge/Download-macOS_/_Windows-111827?style=flat-square)](https://github.com/wangyaominde/competitor-scout/releases/tag/latest)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE)

---

## What it is

**Competitor Scout** is a **local desktop app**. You describe your product; it helps you:

1. **Find** — discover and organize likely competitors  
2. **Rank** — sort by threat, not a messy dump of names  
3. **Compare** — align specs, price, and channels line by line  
4. **Win** — draft a beat roadmap, with optional scheduled watches  

API keys and your competitor library stay on **your machine**. They are **not** in this repo and **not** baked into the installer.

---

## Try it first

| | |
|---|---|
| **Two-minute tour** | [Live Demo](https://wangyaominde.github.io/competitor-scout/) (sample data — **no LLM setup, no API key**) |
| **Full power** | [Download desktop](https://github.com/wangyaominde/competitor-scout/releases/tag/latest) (bring your own LLM for real scans) |

If macOS says the app is “damaged,” it’s usually Gatekeeper quarantine—not a broken build:

```bash
xattr -cr /Applications/CompetitorScout.app
open /Applications/CompetitorScout.app
```

| Your machine | Grab this |
|--------------|-----------|
| Mac (Apple silicon) | `CompetitorScout-*-mac-arm64.dmg` |
| Mac (Intel) | `CompetitorScout-*-mac-x64.dmg` |
| Windows | `CompetitorScout-*-win-x64.exe` |

---

## What you can do

**Turn gut feel into a list**  
Run a scan, review candidates in a pending queue, keep real rivals, dismiss the rest.

**See who hurts most**  
Threat scores blend category fit, features, channels, and price pressure—with reasons. Browse in 3D space, cards, or a high-dimensional table.

**Compare parameters, not slogans**  
“We have it / they don’t / they’re stronger” lands on concrete spec rows. The compare table is for analysis and **does not rewrite threat scores**—scoring and analysis stay separate.

**Let AI sketch how to win**  
From your product and high-threat rivals: phased roadmap, positioning, pricing and channel moves, gaps, and actions for this week.

**Watch in the background when you’re ready**  
Turn on Loop for scheduled scans; get notified when something high-threat shows up.

---

## Typical flow (desktop)

1. Connect an OpenAI-compatible model (DeepSeek, Qwen, MiniMax, Kimi, Ollama, …)  
2. Fill in **My Products**—who you are, what you sell, at what price  
3. Run Smart Scan → confirm in the competitor library  
4. Open param compare or the beat roadmap when needed; enable Loop if you want patrols  

The live demo **hides** LLM settings on purpose so nobody thinks the website needs a key.

---

## Run from source (optional)

With Node.js installed:

```bash
git clone https://github.com/wangyaominde/competitor-scout.git
cd competitor-scout
npm install
npm start
```

If Electron fails to download in mainland China, set a mirror first:

```bash
export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/   # macOS / Linux
npm install
```

---

## Privacy

- This repository ships **no** API keys and **no** private competitor data  
- Desktop data lives in the OS user data directory (e.g. Application Support on macOS)  
- Code is open to audit; CI blocks common secret leaks  

---

## License

[MIT](./LICENSE) — use it, fork it, ship it.

Ideas or bugs? Open an [Issue](https://github.com/wangyaominde/competitor-scout/issues).
