# Iconic Brand Diagnostic — Handoff

## What this is
A polished, deployable single-page web app for Gabe Harris / FSCreative. Lead-magnet diagnostic that runs a 15-question quiz across 5 brand dimensions, scores the user, reveals a workbook + lock-in CTA flow.

## Project path
`/home/user/workspace/iconic-diagnostic/`

## Files
- `index.html` — the entire app (HTML + CSS + JS inline, ~1650 lines). Single file by design for deploy simplicity and zero-build reliability.
- `qa-*.png` — visual QA screenshots (landing dark/light, quiz, mobile, result + workbook + lock-in).
- `HANDOFF.md` — this file.

## Deploy
Already deployed. Re-deploy with:
```
deploy_website(project_path="/home/user/workspace/iconic-diagnostic", site_name="Iconic Brand Diagnostic", entry_point="index.html")
```

## Tech choices
- **Static HTML/CSS/JS**, no build, no framework. Inline `<style>` and `<script>` blocks. Loads in one round trip + Google Fonts.
- **No storage APIs.** State lives in a single `state` object in memory. Theme is a `data-theme` attribute on `<html>`, never persisted (per sandbox constraint).
- **No backend.** The capture form simulates unlock by toggling visibility on submit. Validation is light (non-empty name, regex email). Ready to wire to ConvertKit/Klaviyo by replacing the submit handler.

## Flow built (all 5 screens)
1. **Landing** — `#view-landing`. Hero headline "Are you building an *iconic* brand, or just posting content?" + lede + Start CTA + "What we mean by iconic" card with 5 pillars + meta counters + "Who this is for" card.
2. **Quiz** — `#view-quiz`. Progress bar (% + question N of 15), dimension chip, question text, 4-option radio-style answers, back/next nav. Selections persist when navigating back. Next disabled until an answer is picked.
3. **Result** — `#view-result`. Score (e.g. 35/45) in serif italic, category title, blurb, 5-dimension scorecard with animated bars, "First gap to fix" badge on lowest dimension, "Your first move" callout, then capture form, then conditionally revealed workbook + lock-in.
4. **Workbook** — revealed after email capture. 5 sections (one-of-one lane, avatar + AI brain, visual identity, content capture + batch, quality floor checklist). Copy-to-clipboard works (tested) and Markdown download works.
5. **Lock-in** — revealed after capture. Done-with-you 60-day positioning, 6-item program list, Fit/Not-fit grid, three CTAs: Book a 30-minute strategy call, Learn about the brand build, and DM @watch.gabe.

## Scoring logic
- 15 questions × 0-3 points = 0-45 total.
- 5 dimensions × 3 questions × 3 = 0-9 per dimension.
- Categories thresholded on `% total` plus dimension balance:
  - <30%: Invisible Portfolio
  - 30-50%: Invisible (if identity+positioning weak) or Scattered
  - 50-65%: Recognizable but Inconsistent (if identity strong, system weak) else Scattered
  - 65-82%: Premium in Pieces
  - ≥82%: Iconic Brand Candidate
- Lowest-scoring dimension drives both the "first gap to fix" badge and the "first move" copy.

## Design decisions
- **Palette**: dark `#061410` background, card `#091a14`, accent orange `#ee663e`. Light mode warm chalk `#f5f0ea`. Theme variables drive everything.
- **Typography**:
  - Body/headings: `"Helvetica Neue"` with system fallback.
  - Italic serif accents only (the word "iconic", "workbook", "build the system", numbers in stats): `Instrument Serif`, loaded from Google Fonts.
  - Labels, buttons, meta: `Space Mono`, loaded from Google Fonts.
- **Grain overlay**: inline SVG fractalNoise, fixed full-viewport, low-opacity, `mix-blend-mode: overlay` (dark) / `multiply` (light). Adds the FSCreative tactile feel without imagery.
- **Subtle orange ambient glow** behind landing (radial gradient, low opacity), no gradients on cards.
- **Header**: Cloudinary FSCreative icon URL the user specified, FSCreative™ + "Iconic Brand Diagnostic" sub-label, theme toggle pill with sun/moon icon swap. Sticky with backdrop blur.
- **Pill buttons** (border-radius 999px), card radius 14px, no SaaS shadows beyond a subtle elevation.
- **Em dashes** removed from all prose copy per Gabe's voice guide. Numbered section labels ("01 — One-of-one lane") keep the em dash as a structural separator since they read as labels, not sentences.
- **Voice**: short, direct, occasional "actually" tone, no hype, no AI-cliché "not X, it's Y" stacking. Examples: "Iconic isn't a vibe. It's a set of standards." / "Done-with-you. Gabe builds and defines the foundation alongside you, then hands you the controls."

## Offer framing (confirmed)
Lock-in section explicitly frames the 60-day program as **done-with-you**, not done-for-you:
- "Brand foundation and positioning built with you, anchored to your actual offer."
- "Handoff so you can run the system without depending on motivation."
- "Direct access to Gabe across the full 60 days, not a course you watch alone."

Fit/not-fit explicitly excludes "people still figuring out what they sell" and "buyers who want it fully done-for-them with no involvement."

## QA performed (Playwright)
- Landing renders (dark + light).
- Start → Q1 renders with question text and 4 answers (initially had duplicate `id` attributes that broke rendering; fixed by collapsing to single ids).
- All 15 questions answerable end-to-end (tested three score sweeps: 0/45, 19/45, 35/45, 45/45 — all categorize correctly).
- Back button preserves prior selection (verified DOM state).
- Capture form validates and reveals workbook + lock-in.
- Copy-to-clipboard tested with permission granted; produces a 2.3KB Markdown workbook scoped to the user's result.
- Download as Markdown tested via Blob + anchor.
- Theme toggle swaps dark/light cleanly with icon swap.
- Mobile (375px viewport): landing and quiz both readable and well-spaced. Pillars and program-list collapse to single column on small screens.
- No console errors during full run.

## Known limitations
- **CTAs are live**:
  - Booking: `https://calendly.com/golocalgroup/watchgabe?month=2026-05`
  - Learn more: `https://fscreative.live/`
  - DM: `https://www.instagram.com/watch.gabe/`
- **Analytics hooks are present**. The app pushes `diagnostic_workbook_unlocked` and `diagnostic_cta_click` events to `window.dataLayer`, `gtag()` if present, and `fbq()` if present. Add GA4/GTM/Meta Pixel snippets in `<head>` to activate.
- **Capture form doesn't send email yet.** It creates a full `window.FSC_DIAGNOSTIC_PAYLOAD` object containing name, email, total score, result category, first gap, first move, dimension scorecard, and the full Markdown workbook. Wire this payload to ConvertKit/Klaviyo through a backend endpoint, webhook, or hosted form integration.
- **No deep links to result.** Restart resets state in memory only.
- **Icon URL is the one the user provided** (Cloudinary `Artwork5_...`). Rendered as-is; if a different lockup mark is preferred, swap the `<img class="lockup-icon" src=...>` URL.
- **No external backend or persistence.** Per task constraint.

## To wire ConvertKit / Klaviyo later
In `index.html`, find:
```js
$("#captureForm").addEventListener("submit", (e) => {
  e.preventDefault();
  ...
  state.captured = true;
  ...
});
```
For the quickest first version, create/choose the form or list in ConvertKit/Klaviyo, then replace the body to post the captured email and custom fields to your endpoint. Do not expose private API keys directly in this static page.

Current payload available in the submit handler:
```js
const payload = diagnosticPayload(name, email);
```

Payload includes:
- `name`
- `email`
- `total_score`
- `total_max`
- `category`
- `first_gap`
- `first_move`
- `scorecard`
- `workbook_markdown`

If using a backend/proxy endpoint, replace the body with:
```js
e.preventDefault();
const name = $("#nameInput").value.trim();
const email = $("#emailInput").value.trim();
// validation...
const payload = diagnosticPayload(name, email);
await fetch("https://YOUR-ENDPOINT-HERE/diagnostic-submit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
});
// then run existing reveal code
```
