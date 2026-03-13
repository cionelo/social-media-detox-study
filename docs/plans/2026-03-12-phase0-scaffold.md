# Phase 0: Project Scaffold (Run This First)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create the Next.js project, push to GitHub, connect Vercel, create shared types, and branch for parallel work.

**Run this entire plan before starting Plan A or Plan B.** It takes ~15 minutes.

---

## Prerequisites (manual — do these before running this plan)

### Google Sheets setup
1. Create a new Google Spreadsheet titled **"Social Media Detox Study"**
2. Rename Sheet1 to `Prescreening`
3. Add three more tabs: `Results`, `Stroop_Trials`, `Config`
4. In `Config` tab — Column A = key, Column B = value:

| A | B |
|---|---|
| session_mode | pre |
| max_participants | 40 |
| stroop_test_trials | 48 |
| stroop_practice_trials | 6 |
| tmt_part_a_count | 25 |
| study_title | Social Media Detox Study |
| researcher_name | Amilia Wise-Sweat |

5. In `Prescreening` tab — row 1 headers must include exactly `participant_id` and `group`
6. In `Results` tab — row 1 headers (exact order):
   `participant_id`, `group`, `session`, `timestamp`, `completed`, `rses_item_1`, `rses_item_2`, `rses_item_3`, `rses_item_4`, `rses_item_5`, `rses_item_6`, `rses_item_7`, `rses_item_8`, `rses_item_9`, `rses_item_10`, `rses_total`, `stroop_con_rt`, `stroop_incon_rt`, `stroop_con_rt_sd`, `stroop_incon_rt_sd`, `stroop_con_acc`, `stroop_incon_acc`, `stroop_interference`, `tmt_a_time`, `tmt_b_time`, `tmt_a_errors`, `tmt_b_errors`, `tmt_b_minus_a`
7. In `Stroop_Trials` tab — row 1 headers: `participant_id`, `session`, `trial_number`, `condition`, `rt_ms`, `correct`
8. Copy the Spreadsheet ID from the URL (long string between `/d/` and `/edit`)

### Google Service Account
1. console.cloud.google.com → New Project → "Social Media Detox Study"
2. Enable **Google Sheets API**
3. IAM & Admin → Service Accounts → Create → name: `detox-study-sheets`
4. Create JSON key → download it
5. Share your spreadsheet with the service account email (Editor access)

---

## Task 0-1: Initialize Next.js project

**Step 1: Create the project**

Run from `/Users/ncionelo/Downloads/`:
```bash
npx create-next-app@latest "milly's project" \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-eslint
```

**Step 2: Verify it starts**
```bash
cd "milly's project"
npm run dev
```
Expected: http://localhost:3000 loads. Stop the server (Ctrl+C).

**Step 3: Install dependencies**
```bash
npm install googleapis
npm install --save-dev @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom @types/jest ts-jest
```

**Step 4: Configure Jest**

Create `jest.config.ts`:
```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
}

export default createJestConfig(config)
```

Create `jest.setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

Add to `package.json` scripts:
```json
"test": "jest",
"test:watch": "jest --watch"
```

**Step 5: Create .env.local**
```bash
touch .env.local
```

Add to `.env.local` (fill in real values from service account JSON):
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your-spreadsheet-id-here
RESEARCHER_PASSWORD=choose-a-strong-password
```

Append to `.gitignore`:
```
.env.local
*.json.key
```

**Step 6: Create shared types file**

Create `src/lib/types.ts`:
```typescript
export type Group = 'Heavy' | 'Moderate'
export type SessionMode = 'pre' | 'post'

export interface ParticipantLookup {
  found: boolean
  group?: Group
  alreadySubmitted?: boolean
}

export interface StudyConfig {
  session_mode: SessionMode
  max_participants: number
  stroop_test_trials: number
  stroop_practice_trials: number
  tmt_part_a_count: number
  study_title: string
  researcher_name: string
}

export interface StroopTrial {
  participantId: string
  session: number
  trialNumber: number
  condition: 'congruent' | 'incongruent'
  rtMs: number
  correct: boolean
}

export interface TestResults {
  participantId: string
  group: Group
  session: number
  completed: boolean
  rseItems: number[]
  stroopConRt: number
  stroopInconRt: number
  stroopConRtSd: number
  stroopInconRtSd: number
  stroopConAcc: number
  stroopInconAcc: number
  stroopInterference: number
  tmtATime: number
  tmtBTime: number
  tmtAErrors: number
  tmtBErrors: number
  tmtBMinusA: number
}
```

**Step 7: Commit and push to GitHub**
```bash
git init
git add -A
git commit -m "feat: scaffold + shared types"
gh repo create social-media-detox-study --public --push --source=.
```
Expected: GitHub repo created, code pushed.

**Step 8: Connect Vercel**
```bash
npx vercel
```
Follow prompts: link to GitHub repo, Next.js framework, default build settings.

Add the 4 environment variables from `.env.local` in Vercel dashboard → Settings → Environment Variables.

**Step 9: Create parallel branches**
```bash
git checkout -b feature/backend
git push -u origin feature/backend
git checkout main
git checkout -b feature/frontend
git push -u origin feature/frontend
git checkout main
```

---

## Hand off to parallel sessions

Both branches now exist. Open two terminal windows or two Claude Code sessions:

- **Session A** → check out `feature/backend` → run `docs/plans/2026-03-12-plan-a-backend.md`
- **Session B** → check out `feature/frontend` → run `docs/plans/2026-03-12-plan-b-frontend.md`

They touch entirely different files and will not conflict.

When both are done: merge both branches into `main`, push, Vercel auto-deploys.

```bash
# After both sessions complete:
git checkout main
git merge feature/backend
git merge feature/frontend
git push
```
