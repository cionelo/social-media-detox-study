# Social Media Detox Study

built w/ love for my girlfriend &lt;3

Research site for Amilia Wise-Sweat's PSY533 study at Tiffin University — administers three neuropsychological tests and writes the results straight to Google Sheets so they're ready for SPSS.

**Live:** https://social-media-detox-study.vercel.app

---

## How it works

Participants go to the homepage, type in their participant ID (e.g. AB01012001), and the site looks them up in the prescreening Google Sheet to confirm their group (Heavy/Moderate user) and which session they're on (Pre or Post detox). Then they go through three tests back to back:

1. Rosenberg Self-Esteem Scale — 10-item questionnaire, ~5 min
2. Stroop Test — ink color identification task with practice round, ~10 min
3. Trail Making Test — connect-the-dots tasks (Part A: numbers, Part B: alternating numbers and letters), ~10 min

When they finish, everything saves automatically. One row per participant per session in the Results tab. Raw Stroop trial data goes to Stroop_Trials for outlier cleaning before analysis.

The researcher controls Pre/Post mode from `/researcher`. Trial counts, participant cap, study title — all adjustable from `/settings` without touching code or redeploying.

---

## Setup

```bash
npm install
npm run dev
```

Four environment variables required in `.env.local`:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SHEET_ID=
RESEARCHER_PASSWORD=
```

Full Google Cloud setup (service account, Sheets API, spreadsheet structure) is in `docs/plans/2026-03-12-phase0-scaffold.md`.

---

## Tests

```bash
npm test
```

Covers Rosenberg item scoring, Stroop RT stats (mean, SD, accuracy, interference score), TMT difference score, and the config parser.

---

## Structure

```
src/
  app/
    api/          Google Sheets read/write, auth checks
    test/         Rosenberg, Stroop, TMT pages
    researcher/   Dashboard (session toggle, submission table)
    settings/     Study config panel
  components/
    tests/        Test logic — timing, canvas drawing, scoring
    researcher/   Dashboard and settings UI
    ui/           Card, Button
  lib/
    sheets.ts     Google Sheets client
    scoring.ts    Rosenberg, Stroop, TMT scoring functions
    types.ts      Shared types
docs/
  plans/          Design doc, implementation plans, phase breakdown
  RESEARCHER-GUIDE.md  Plain-English guide for the associate researcher
```

---

## Deployment

Auto-deploys to Vercel on push to `main`. Environment variables live in the Vercel dashboard — do not commit `.env.local` or the service account JSON.
