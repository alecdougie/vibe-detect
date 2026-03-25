```
+-----[ VIBE-DETECT v1.0.3 ]-----+
      VIBE CODE DETECTOR
   INTERNET SLOP ENGINE ACTIVE
```

# VIBE-DETECT

A Chrome extension that scans websites for signs of AI-generated code, design patterns, and content. It doesn't judge — it just detects.

Whether a site was hand-crafted, AI-assisted, or pure vibes, VIBE-DETECT surfaces the signals and gives you a score from 0 to 100.

Built by **H4N_SOLO**.

---

## What It Does

VIBE-DETECT runs a heuristic analysis on any website you visit, checking for over 50 individual signals across 7 categories:

- **Tech Stack** — Frameworks, UI libraries, BaaS providers, AI builder meta tags
- **Source Code** — Console logs, TODO comments, API key exposure, class conflicts
- **Content** — Lorem ipsum, placeholder text, AI filler phrases, default titles
- **Design** — Default themes, 3-column card grids, gradient heroes, Lucide icons
- **Security** — Missing alt text, inaccessible buttons, missing form labels
- **Infrastructure** — Free-tier hosting, missing OG tags, missing favicons
- **Runtime** — Unoptimized images, dead links, no lazy loading

Results are displayed in a retro CRT terminal interface with sound effects.

---

## Install Manually on Chrome

1. **Download or clone** this repository
   ```
   git clone https://github.com/alecdougie/vibe-detect.git
   ```

2. Open Chrome and navigate to:
   ```
   chrome://extensions
   ```

3. Enable **Developer mode** (toggle in the top-right corner)

4. Click **"Load unpacked"**

5. Select the `vibe-detect` folder you downloaded

6. The extension icon will appear in your toolbar — click it on any website to scan

To update, pull the latest changes and click the refresh icon on the extension card in `chrome://extensions`.

---

## How the Scoring Works

### Score Range

| Score | Verdict |
|-------|---------|
| 0–19 | **HUMAN CRAFTED** — Minimal AI signals detected |
| 20–44 | **AI ASSISTED** — Some AI tooling signals present |
| 45–69 | **MOSTLY VIBED** — Significant AI generation detected |
| 70–100 | **PURE VIBES** — Overwhelming AI generation signals |

### Category Caps

Each category has a maximum contribution to prevent any single area from dominating the score:

| Category | Tag | Cap |
|----------|-----|-----|
| Tech Stack | `[TECH]` | 25 |
| Source Code | `[SRCE]` | 20 |
| Content | `[CNTN]` | 15 |
| Design | `[DSGN]` | 15 |
| Security | `[SECU]` | 10 |
| Infrastructure | `[INFR]` | 10 |
| Runtime | `[RNTM]` | 5 |

### Modifiers

**Stack Multiplier (x1.15)** — Applied when React/Next.js + shadcn/Tailwind + Vercel are all detected together. This combination is the most common AI-generated stack.

**Clean Signal Bonuses** — Sites earn negative points for good practices like custom fonts, proper accessibility, semantic HTML, real content, and optimized performance.

### Final Score

```
score = (sum of capped categories × multiplier) − clean bonuses
```

Clamped to 0–100.

---

## Privacy & Data Usage

VIBE-DETECT respects your privacy:

- **No data is sent anywhere.** All analysis happens locally in your browser.
- **No external API calls.** The extension does not communicate with any server.
- **No tracking or analytics.** Zero telemetry, zero cookies, zero third-party scripts.
- **No browsing history access.** The extension only analyzes the active tab when you click scan.
- **Local storage only.** Scan results are cached in Chrome's local extension storage (keyed by tab ID) so the popup can display them. This data never leaves your machine.

### Permissions Explained

| Permission | Why |
|------------|-----|
| `activeTab` | To access the current tab's page content for analysis when you initiate a scan |
| `scripting` | To inject the detection script into the active tab |
| `storage` | To cache scan results locally and remember your mute preference |

---

## Features

- Retro CRT terminal interface with sound effects
- User-initiated scanning (no auto-scan)
- Export Report as JSON (copied to clipboard)
- Share Report as a shareable PNG image card
- Full scoring breakdown in "How It Works" page
- Mute toggle for sound effects
- Show/hide undetected signals

---

## Project Structure

```
vibe-detect/
├── manifest.json    # Chrome extension manifest (v3)
├── popup.html       # Extension popup UI + CSS
├── popup.js         # UI logic, rendering, export features
├── detector.js      # Heuristic analysis engine (injected into pages)
├── background.js    # Service worker — relays results to popup
├── sounds.js        # Sound effect engine
└── icons/           # Extension icons (16, 48, 128)
```

---

*This thing was vibe coded, mistakes probable.*
