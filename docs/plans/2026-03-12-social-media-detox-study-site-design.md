# Social Media Detox Study — Research Site Design

**Date:** 2026-03-12
**Researcher:** Amilia Wise-Sweat
**Study:** Examining The Cognitive Effects of a One-Week Social Media Detox
**Institution:** Tiffin University — PSY533_90 Research Design & Analysis I

---

## Overview

A live web application that administers three neuropsychological tests to study participants and writes structured, SPSS-ready data to Google Sheets. Built with Next.js, deployed on Vercel, auto-deploying from GitHub on every push to `main`.

---

## Architecture

```
Next.js App (Vercel)
├── /                        Participant landing (ID entry)
├── /test/rosenberg          Rosenberg Self-Esteem Scale
├── /test/stroop             Stroop Test
├── /test/tmt                Trail Making Test
├── /complete                Completion page
├── /researcher              Researcher dashboard (password-protected)
└── /settings                Study settings panel (password-protected)

API Routes (server-side only — credentials never exposed to client)
├── POST /api/lookup-id      Validate participant ID, return group
├── POST /api/submit         Write completed session to Results Sheet
├── GET  /api/session-mode   Read current Pre/Post setting from Config Sheet
├── POST /api/session-mode   Write Pre/Post toggle to Config Sheet
└── GET  /api/config         Read all study settings from Config Sheet

Google Sheets (one spreadsheet, multiple tabs)
├── Prescreening             Read-only — existing Google Form responses
├── Results                  Write — one row per participant per session
├── Stroop_Trials            Write — one row per Stroop trial (raw data)
└── Config                   Read/Write — study settings and session mode
```

All Google API credentials stored in Vercel environment variables. Never in code or exposed to the browser.

---

## Branding & Visual Design

- **Font:** JetBrains Mono (all text)
- **Aesthetic:** Studio Ghibli / lofi — cozy, calm, non-clinical
- **Design language:** Soft rounded corners, gentle card shadows, subtle paper-texture background, no harsh edges or high contrast

### Color Palette

| Role            | Hex       | Description         |
|-----------------|-----------|---------------------|
| Background      | `#F5EFE6` | Warm parchment      |
| Surface / cards | `#EDE4D3` | Soft cream          |
| Primary action  | `#8B9E77` | Muted sage green    |
| Accent          | `#C4937A` | Dusty terracotta    |
| Text            | `#3D3530` | Warm near-black     |
| Soft highlight  | `#B8C9D4` | Muted sky blue      |

---

## Participant Flow

```
Landing Page
  → Enter Participant ID (e.g. AB01012001)
  → Validated against Prescreening Sheet
      - Not found: friendly error, ask to check ID
      - Already submitted this session: warning before proceeding
      - Found: display group (Heavy / Moderate) and current session (Pre / Post)
  → "Begin" button

Test Sequence (locked order, no skipping, no going back)
  1. Rosenberg Self-Esteem Scale   (~5 min)
  2. Stroop Test                   (~10 min, includes practice)
  3. Trail Making Test             (~10 min, Part A then Part B)
  → Data submitted to Google Sheets on completion of all 3 tests

Completion Page
  → Thank you message
  → Confirmation that data was saved
```

Each test has a dedicated instruction screen with a styled "I'm ready" button that starts the timer.

---

## Test Implementations

### 1. Rosenberg Self-Esteem Scale (Rosenberg, 1965)

- 10 items displayed one at a time
- 4-point Likert scale: Strongly Agree / Agree / Disagree / Strongly Disagree
- Scoring:
  - Items 1, 2, 4, 6, 7: SA=3, A=2, D=1, SD=0
  - Items 3, 5, 8, 9, 10 (reverse): SA=0, A=1, D=2, SD=3
- Total score: 0–30 (higher = higher self-esteem)
- Recorded: individual item scores (rses_item_1 … rses_item_10) + total (rses_total)

### 2. Stroop Test (Stroop, 1935)

- Color words: RED, BLUE, GREEN, YELLOW
- Two conditions: congruent (word matches ink) and incongruent (word mismatches ink)
- Trial count: configurable via Settings (default 48 — 24 congruent + 24 incongruent), randomized
- Practice: configurable number of trials with correctness feedback before test begins
- Response: on-screen colored buttons (works on desktop and mobile)
- Timing: `performance.now()` — millisecond precision, starts on stimulus display
- Recorded per trial (Stroop_Trials tab): participant_id, session, trial_number, condition, rt_ms, correct
- Summary columns (Results tab): avg RT per condition, accuracy per condition, RT SD per condition, interference score

### 3. Trail Making Test (Reitan, 1958)

- Circles rendered on an HTML canvas, randomly scattered, sized for comfortable clicking/tapping
- **Part A:** 25 numbered circles, connect 1 → 2 → 3 … → 25
- **Part B:** 26 circles (numbers + letters), connect 1 → A → 2 → B … → 13 → M
- Wrong click: error counted, brief shake animation, timer continues running
- Timer starts on first click, stops on final correct connection
- Recorded: Part A time (s), Part B time (s), errors per part, B−A difference score

---

## Data Structure

### Results Tab — one row per participant per session

| Column              | Type    | Notes                                        |
|---------------------|---------|----------------------------------------------|
| `participant_id`    | String  | e.g. AB01012001                              |
| `group`             | String  | Heavy / Moderate — auto-filled from lookup   |
| `session`           | Integer | 1 = Pre-detox, 2 = Post-detox                |
| `timestamp`         | String  | ISO datetime                                 |
| `completed`         | String  | Yes / No                                     |
| `rses_item_1`–`_10` | Integer | Individual item scores (0–3)                 |
| `rses_total`        | Integer | Total self-esteem score (0–30)               |
| `stroop_con_rt`     | Float   | Avg congruent RT (seconds)                   |
| `stroop_incon_rt`   | Float   | Avg incongruent RT (seconds)                 |
| `stroop_con_rt_sd`  | Float   | SD of congruent RT                           |
| `stroop_incon_rt_sd`| Float   | SD of incongruent RT                         |
| `stroop_con_acc`    | Float   | Congruent accuracy (0–1)                     |
| `stroop_incon_acc`  | Float   | Incongruent accuracy (0–1)                   |
| `stroop_interference`| Float  | Incongruent RT − Congruent RT (seconds)      |
| `tmt_a_time`        | Float   | Part A completion time (seconds)             |
| `tmt_b_time`        | Float   | Part B completion time (seconds)             |
| `tmt_a_errors`      | Integer | Errors in Part A                             |
| `tmt_b_errors`      | Integer | Errors in Part B                             |
| `tmt_b_minus_a`     | Float   | B − A difference score (seconds)             |

### Stroop_Trials Tab — one row per trial

| Column           | Notes                         |
|------------------|-------------------------------|
| `participant_id` |                               |
| `session`        | 1 or 2                        |
| `trial_number`   |                               |
| `condition`      | congruent / incongruent       |
| `rt_ms`          | Raw RT in milliseconds        |
| `correct`        | TRUE / FALSE                  |

### Config Tab — key-value settings

| Key                     | Default | Description                            |
|-------------------------|---------|----------------------------------------|
| `session_mode`          | pre     | pre / post — toggled by researcher     |
| `max_participants`      | 40      | Soft cap shown in dashboard            |
| `stroop_test_trials`    | 48      | Total test trials (must be even)       |
| `stroop_practice_trials`| 6       | Practice trials with feedback          |
| `tmt_part_a_count`      | 25      | Number of circles in Part A            |
| `study_title`           | Social Media Detox Study | Displayed on participant pages |
| `researcher_name`       | Amilia Wise-Sweat | Displayed in researcher panel |

No constraints are hardcoded in the application. All configurable values are read from the Config tab at runtime.

---

## Researcher Panel (`/researcher`)

Password-protected (password stored in Vercel env var, not in code).

- Current session mode displayed prominently (PRE-DETOX / POST-DETOX) with one-click toggle
- Participant table: ID, group, Pre complete, Post complete, timestamp
- Completion stats: X of Y participants completed Pre / Post / Both
- Incomplete rows flagged visually

## Settings Page (`/settings`)

Same password as researcher panel. Designed for non-technical users — labeled form fields, no raw Sheet editing required.

- Session mode toggle (Pre / Post)
- Editable fields for all Config tab values (study title, trial counts, participant cap, etc.)
- Save button — writes to Config Sheet immediately
- Clear labels and helper text on every field

---

## Deployment

- **Repository:** GitHub (new repo, initialized from project directory)
- **Hosting:** Vercel — connected to GitHub repo, auto-deploys on every push to `main`
- **Environment variables** (set in Vercel dashboard, never in code):
  - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
  - `GOOGLE_PRIVATE_KEY`
  - `GOOGLE_SHEET_ID`
  - `RESEARCHER_PASSWORD`

---

## Out of Scope (for now)

- Intake / consent form (can be added as a step before the test sequence)
- Email notifications
- Multi-study support
- Participant self-service (e.g. checking their own results)
