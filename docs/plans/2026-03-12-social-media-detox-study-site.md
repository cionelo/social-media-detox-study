# Social Media Detox Study Site — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Next.js web app that administers three neuropsychological tests (Rosenberg, Stroop, TMT), auto-assigns participants to groups via Google Sheets lookup, and writes SPSS-ready results to Google Sheets.

**Architecture:** Next.js App Router with server-side API routes handling all Google Sheets communication. Participant-facing pages are public; researcher and settings pages are password-protected. All configurable values (trial counts, participant cap, session mode) are stored in a Config tab in Google Sheets — no hardcoded constraints in the app.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, googleapis, Jest + React Testing Library, deployed on Vercel via GitHub auto-deploy.

---

## Prerequisites (do these manually before starting)

### Google Sheets setup
1. Create a new Google Spreadsheet titled "Social Media Detox Study"
2. Rename Sheet1 to `Prescreening`
3. Add three more tabs: `Results`, `Stroop_Trials`, `Config`
4. In `Config` tab, add these rows (Column A = key, Column B = value):

| A | B |
|---|---|
| session_mode | pre |
| max_participants | 40 |
| stroop_test_trials | 48 |
| stroop_practice_trials | 6 |
| tmt_part_a_count | 25 |
| study_title | Social Media Detox Study |
| researcher_name | Amilia Wise-Sweat |

5. In `Prescreening` tab, add headers in row 1 matching your Google Form columns. The app looks for columns named exactly `participant_id` and `group`. If your Form uses different column names, add these two columns manually and fill them in from the form data.
6. In `Results` tab, add headers in row 1 (exact names, order matters for SPSS):
   `participant_id`, `group`, `session`, `timestamp`, `completed`, `rses_item_1`, `rses_item_2`, `rses_item_3`, `rses_item_4`, `rses_item_5`, `rses_item_6`, `rses_item_7`, `rses_item_8`, `rses_item_9`, `rses_item_10`, `rses_total`, `stroop_con_rt`, `stroop_incon_rt`, `stroop_con_rt_sd`, `stroop_incon_rt_sd`, `stroop_con_acc`, `stroop_incon_acc`, `stroop_interference`, `tmt_a_time`, `tmt_b_time`, `tmt_a_errors`, `tmt_b_errors`, `tmt_b_minus_a`
7. In `Stroop_Trials` tab, add headers: `participant_id`, `session`, `trial_number`, `condition`, `rt_ms`, `correct`
8. Copy the Spreadsheet ID from the URL (the long string between `/d/` and `/edit`)

### Google Service Account setup
1. Go to console.cloud.google.com → New Project → "Social Media Detox Study"
2. Enable "Google Sheets API"
3. IAM & Admin → Service Accounts → Create Service Account → name it "detox-study-sheets"
4. Create a JSON key → download it
5. Share your Google Spreadsheet with the service account email (Editor access)
6. Keep the JSON file open — you'll need `client_email` and `private_key` values

---

## Task 1: Project scaffold + git + GitHub + Vercel

**Files:**
- Create: entire Next.js project in `/Users/ncionelo/Downloads/milly's project/`

**Step 1: Initialize Next.js project**

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
When prompted, select defaults.

**Step 2: Verify it runs**
```bash
cd "milly's project"
npm run dev
```
Expected: Server starts at http://localhost:3000, default Next.js page loads.

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

**Step 5: Add .gitignore entries**

Append to `.gitignore`:
```
.env.local
*.json.key
```

**Step 6: Create .env.local**
```bash
touch .env.local
```

Add to `.env.local`:
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your-spreadsheet-id-here
RESEARCHER_PASSWORD=choose-a-password
```
Fill in real values from your service account JSON and spreadsheet.

**Step 7: Initialize git and push to GitHub**
```bash
git init
git add -A
git commit -m "feat: initial Next.js scaffold"
gh repo create social-media-detox-study --public --push --source=.
```
Expected: GitHub repo created, code pushed.

**Step 8: Connect to Vercel**
```bash
npx vercel
```
Follow prompts: link to GitHub repo, set framework to Next.js, keep default build settings.

Then add environment variables in Vercel dashboard (Settings → Environment Variables) — same 4 keys from `.env.local`.

Expected: Auto-deploy triggers on every push to `main`.

---

## Task 2: Google Sheets library

**Files:**
- Create: `src/lib/sheets.ts`
- Create: `src/lib/types.ts`
- Test: `src/lib/sheets.test.ts`

**Step 1: Write types**

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
  rseItems: number[]          // 10 values
  stroopConRt: number         // seconds
  stroopInconRt: number
  stroopConRtSd: number
  stroopInconRtSd: number
  stroopConAcc: number
  stroopInconAcc: number
  stroopInterference: number
  tmtATime: number            // seconds
  tmtBTime: number
  tmtAErrors: number
  tmtBErrors: number
  tmtBMinusA: number
}
```

**Step 2: Write failing test for config reader**

Create `src/lib/sheets.test.ts`:
```typescript
import { parseConfig } from './sheets'

describe('parseConfig', () => {
  it('parses a key-value array into StudyConfig', () => {
    const rows = [
      ['session_mode', 'pre'],
      ['max_participants', '40'],
      ['stroop_test_trials', '48'],
      ['stroop_practice_trials', '6'],
      ['tmt_part_a_count', '25'],
      ['study_title', 'Test Study'],
      ['researcher_name', 'Test Researcher'],
    ]
    const config = parseConfig(rows)
    expect(config.session_mode).toBe('pre')
    expect(config.max_participants).toBe(40)
    expect(config.stroop_test_trials).toBe(48)
    expect(config.study_title).toBe('Test Study')
  })
})
```

**Step 3: Run test to verify it fails**
```bash
npm test -- sheets.test.ts
```
Expected: FAIL — `parseConfig` not found

**Step 4: Implement sheets.ts**

Create `src/lib/sheets.ts`:
```typescript
import { google } from 'googleapis'
import type { StudyConfig, ParticipantLookup, TestResults, StroopTrial, SessionMode } from './types'

function getSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID!

export function parseConfig(rows: string[][]): StudyConfig {
  const map = Object.fromEntries(rows.map(([k, v]) => [k, v]))
  return {
    session_mode: (map.session_mode ?? 'pre') as SessionMode,
    max_participants: parseInt(map.max_participants ?? '40'),
    stroop_test_trials: parseInt(map.stroop_test_trials ?? '48'),
    stroop_practice_trials: parseInt(map.stroop_practice_trials ?? '6'),
    tmt_part_a_count: parseInt(map.tmt_part_a_count ?? '25'),
    study_title: map.study_title ?? 'Social Media Detox Study',
    researcher_name: map.researcher_name ?? '',
  }
}

export async function getConfig(): Promise<StudyConfig> {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Config!A:B',
  })
  return parseConfig((res.data.values ?? []) as string[][])
}

export async function setConfigValue(key: string, value: string): Promise<void> {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Config!A:A',
  })
  const rows = (res.data.values ?? []) as string[][]
  const rowIndex = rows.findIndex(([k]) => k === key)
  if (rowIndex === -1) throw new Error(`Config key not found: ${key}`)
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `Config!B${rowIndex + 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[value]] },
  })
}

export async function lookupParticipant(
  participantId: string,
  session: number
): Promise<ParticipantLookup> {
  const sheets = getSheets()

  // Check prescreening sheet
  const prescreening = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Prescreening!A:Z',
  })
  const psRows = (prescreening.data.values ?? []) as string[][]
  const headers = psRows[0] ?? []
  const idCol = headers.indexOf('participant_id')
  const groupCol = headers.indexOf('group')

  if (idCol === -1 || groupCol === -1) {
    throw new Error('Prescreening sheet missing participant_id or group columns')
  }

  const match = psRows.slice(1).find(row => row[idCol] === participantId)
  if (!match) return { found: false }

  const group = match[groupCol] as 'Heavy' | 'Moderate'

  // Check if already submitted this session
  const results = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Results!A:C',
  })
  const rRows = (results.data.values ?? []) as string[][]
  const alreadySubmitted = rRows.slice(1).some(
    row => row[0] === participantId && row[2] === String(session)
  )

  return { found: true, group, alreadySubmitted }
}

export async function appendResults(results: TestResults): Promise<void> {
  const sheets = getSheets()
  const row = [
    results.participantId,
    results.group,
    results.session,
    new Date().toISOString(),
    results.completed ? 'Yes' : 'No',
    ...results.rseItems,
    results.rseItems.reduce((a, b) => a + b, 0),
    results.stroopConRt,
    results.stroopInconRt,
    results.stroopConRtSd,
    results.stroopInconRtSd,
    results.stroopConAcc,
    results.stroopInconAcc,
    results.stroopInterference,
    results.tmtATime,
    results.tmtBTime,
    results.tmtAErrors,
    results.tmtBErrors,
    results.tmtBMinusA,
  ]
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Results!A1',
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  })
}

export async function appendStroopTrials(trials: StroopTrial[]): Promise<void> {
  const sheets = getSheets()
  const rows = trials.map(t => [
    t.participantId, t.session, t.trialNumber, t.condition, t.rtMs, t.correct
  ])
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Stroop_Trials!A1',
    valueInputOption: 'RAW',
    requestBody: { values: rows },
  })
}

export async function getAllResults() {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Results!A:D',
  })
  return (res.data.values ?? []) as string[][]
}
```

**Step 5: Run test to verify it passes**
```bash
npm test -- sheets.test.ts
```
Expected: PASS

**Step 6: Commit**
```bash
git add src/lib/
git commit -m "feat: add Google Sheets lib and types"
```

---

## Task 3: Scoring utilities

**Files:**
- Create: `src/lib/scoring.ts`
- Test: `src/lib/scoring.test.ts`

**Step 1: Write failing tests**

Create `src/lib/scoring.test.ts`:
```typescript
import { scoreRosenberg, calcStroopStats, calcTmtStats } from './scoring'

describe('scoreRosenberg', () => {
  it('scores forward items correctly', () => {
    // Item 1 is forward: SA=3, A=2, D=1, SD=0
    expect(scoreRosenberg([3, 3, 3, 3, 3, 3, 3, 3, 3, 3])).toBe(30)
  })

  it('scores reverse items correctly', () => {
    // All SD (value 3) on reverse items (3,5,8,9,10) should score as 0 each
    // All SA (value 0) on forward items (1,2,4,6,7) should score as 3 each...
    // Let's test a known pattern: all responses = 0 (SA on all)
    // Forward items (1,2,4,6,7): score 3 each = 15
    // Reverse items (3,5,8,9,10): score 0 each = 0
    expect(scoreRosenberg([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])).toBe(15)
  })

  it('returns total as sum of all item scores', () => {
    const items = [0, 0, 3, 0, 3, 0, 0, 3, 3, 3] // all "positive SE" responses
    expect(scoreRosenberg(items)).toBe(30)
  })
})

describe('calcStroopStats', () => {
  it('calculates mean RT in seconds', () => {
    const rts = [500, 600, 700] // ms
    const { mean } = calcStroopStats(rts)
    expect(mean).toBeCloseTo(0.6, 5)
  })

  it('calculates standard deviation', () => {
    const rts = [500, 500, 500]
    const { sd } = calcStroopStats(rts)
    expect(sd).toBe(0)
  })

  it('calculates accuracy from correct array', () => {
    const { accuracy } = calcStroopStats([400, 500], [true, false])
    expect(accuracy).toBe(0.5)
  })
})

describe('calcTmtStats', () => {
  it('calculates B minus A difference', () => {
    const result = calcTmtStats(30.0, 55.0, 0, 2)
    expect(result.bMinusA).toBeCloseTo(25.0, 5)
  })
})
```

**Step 2: Run to verify failure**
```bash
npm test -- scoring.test.ts
```
Expected: FAIL

**Step 3: Implement scoring.ts**

Create `src/lib/scoring.ts`:
```typescript
// Rosenberg item indices that are REVERSE scored (0-indexed: items 3,5,8,9,10 → indices 2,4,7,8,9)
const REVERSE_ITEMS = [2, 4, 7, 8, 9]

export function scoreRosenbergItem(value: number, index: number): number {
  // value: 0=Strongly Agree, 1=Agree, 2=Disagree, 3=Strongly Disagree
  if (REVERSE_ITEMS.includes(index)) {
    return value // reverse items: SA=0, A=1, D=2, SD=3
  }
  return 3 - value // forward items: SA=3, A=2, D=1, SD=0
}

export function scoreRosenberg(responses: number[]): number {
  return responses.reduce((sum, val, i) => sum + scoreRosenbergItem(val, i), 0)
}

export function calcStroopStats(
  rtsMs: number[],
  corrects?: boolean[]
): { mean: number; sd: number; accuracy: number } {
  const n = rtsMs.length
  const meanMs = rtsMs.reduce((a, b) => a + b, 0) / n
  const variance = rtsMs.reduce((sum, rt) => sum + Math.pow(rt - meanMs, 2), 0) / n
  const sd = Math.sqrt(variance) / 1000
  const mean = meanMs / 1000

  const accuracy = corrects
    ? corrects.filter(Boolean).length / corrects.length
    : 1

  return { mean, sd, accuracy }
}

export function calcTmtStats(
  aTimeS: number,
  bTimeS: number,
  aErrors: number,
  bErrors: number
) {
  return {
    aTime: aTimeS,
    bTime: bTimeS,
    aErrors,
    bErrors,
    bMinusA: bTimeS - aTimeS,
  }
}
```

**Step 4: Run tests to verify pass**
```bash
npm test -- scoring.test.ts
```
Expected: PASS

**Step 5: Commit**
```bash
git add src/lib/scoring.ts src/lib/scoring.test.ts
git commit -m "feat: add scoring utilities with tests"
```

---

## Task 4: Branding — Tailwind config + global styles + layout

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Create: `src/components/ui/Card.tsx`
- Create: `src/components/ui/Button.tsx`

**Step 1: Update Tailwind config**

Replace `tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        parchment: '#F5EFE6',
        cream: '#EDE4D3',
        sage: '#8B9E77',
        terracotta: '#C4937A',
        ink: '#3D3530',
        sky: '#B8C9D4',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 2px 12px rgba(61, 53, 48, 0.08)',
        card: '0 4px 20px rgba(61, 53, 48, 0.10)',
      },
    },
  },
  plugins: [],
}

export default config
```

**Step 2: Update globals.css**

Replace `src/app/globals.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-parchment text-ink font-mono;
    background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
  }
}

@layer components {
  .page-container {
    @apply min-h-screen flex flex-col items-center justify-center px-4 py-12;
  }
  .page-title {
    @apply text-2xl font-semibold text-ink mb-2 tracking-tight;
  }
  .page-subtitle {
    @apply text-sm text-ink/60 mb-8;
  }
}
```

**Step 3: Update layout.tsx**

Replace `src/app/layout.tsx`:
```typescript
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Social Media Detox Study',
  description: 'Cognitive assessment platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-parchment font-mono antialiased">{children}</body>
    </html>
  )
}
```

**Step 4: Create Card component**

Create `src/components/ui/Card.tsx`:
```typescript
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-cream rounded-2xl shadow-card p-6 ${className}`}>
      {children}
    </div>
  )
}
```

**Step 5: Create Button component**

Create `src/components/ui/Button.tsx`:
```typescript
type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: React.ReactNode
}

const styles: Record<Variant, string> = {
  primary: 'bg-sage text-white hover:bg-sage/90 shadow-soft',
  secondary: 'bg-cream text-ink border border-ink/20 hover:bg-parchment',
  ghost: 'text-ink/70 hover:text-ink hover:bg-cream/60',
}

export function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`px-5 py-2.5 rounded-xl font-mono text-sm font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
```

**Step 6: Verify dev server looks right**
```bash
npm run dev
```
Open http://localhost:3000 — should see parchment background with the default Next.js page restyled.

**Step 7: Commit**
```bash
git add src/ tailwind.config.ts
git commit -m "feat: add branding, theme, and base UI components"
```

---

## Task 5: API routes

**Files:**
- Create: `src/app/api/lookup-id/route.ts`
- Create: `src/app/api/session-mode/route.ts`
- Create: `src/app/api/config/route.ts`
- Create: `src/app/api/submit/route.ts`

**Step 1: Create lookup-id route**

Create `src/app/api/lookup-id/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { lookupParticipant, getConfig } from '@/lib/sheets'

export async function POST(req: NextRequest) {
  const { participantId } = await req.json()
  if (!participantId) {
    return NextResponse.json({ error: 'Missing participantId' }, { status: 400 })
  }
  const config = await getConfig()
  const sessionNum = config.session_mode === 'pre' ? 1 : 2
  const result = await lookupParticipant(participantId, sessionNum)
  return NextResponse.json({ ...result, session: sessionNum, sessionMode: config.session_mode })
}
```

**Step 2: Create session-mode route**

Create `src/app/api/session-mode/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getConfig, setConfigValue } from '@/lib/sheets'

export async function GET() {
  const config = await getConfig()
  return NextResponse.json({ session_mode: config.session_mode })
}

export async function POST(req: NextRequest) {
  const password = req.headers.get('x-researcher-password')
  if (password !== process.env.RESEARCHER_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { mode } = await req.json()
  if (mode !== 'pre' && mode !== 'post') {
    return NextResponse.json({ error: 'mode must be pre or post' }, { status: 400 })
  }
  await setConfigValue('session_mode', mode)
  return NextResponse.json({ ok: true, session_mode: mode })
}
```

**Step 3: Create config route**

Create `src/app/api/config/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getConfig, setConfigValue } from '@/lib/sheets'

export async function GET() {
  const config = await getConfig()
  return NextResponse.json(config)
}

export async function POST(req: NextRequest) {
  const password = req.headers.get('x-researcher-password')
  if (password !== process.env.RESEARCHER_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const updates: Record<string, string> = await req.json()
  await Promise.all(
    Object.entries(updates).map(([key, value]) => setConfigValue(key, String(value)))
  )
  return NextResponse.json({ ok: true })
}
```

**Step 4: Create submit route**

Create `src/app/api/submit/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { appendResults, appendStroopTrials } from '@/lib/sheets'
import { calcStroopStats, calcTmtStats, scoreRosenberg } from '@/lib/scoring'
import type { TestResults } from '@/lib/types'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    participantId, group, session,
    rseResponses,           // number[10]
    stroopConTrials,        // { rtMs, correct }[]
    stroopInconTrials,      // { rtMs, correct }[]
    tmtATimeMs, tmtBTimeMs,
    tmtAErrors, tmtBErrors,
    allStroopTrials,        // StroopTrial[] for raw tab
  } = body

  const conStats = calcStroopStats(
    stroopConTrials.map((t: { rtMs: number }) => t.rtMs),
    stroopConTrials.map((t: { correct: boolean }) => t.correct)
  )
  const inconStats = calcStroopStats(
    stroopInconTrials.map((t: { rtMs: number }) => t.rtMs),
    stroopInconTrials.map((t: { correct: boolean }) => t.correct)
  )
  const tmtStats = calcTmtStats(
    tmtATimeMs / 1000, tmtBTimeMs / 1000, tmtAErrors, tmtBErrors
  )

  const results: TestResults = {
    participantId,
    group,
    session,
    completed: true,
    rseItems: rseResponses.map((v: number, i: number) => {
      const { scoreRosenbergItem } = require('@/lib/scoring')
      return scoreRosenbergItem(v, i)
    }),
    stroopConRt: conStats.mean,
    stroopInconRt: inconStats.mean,
    stroopConRtSd: conStats.sd,
    stroopInconRtSd: inconStats.sd,
    stroopConAcc: conStats.accuracy,
    stroopInconAcc: inconStats.accuracy,
    stroopInterference: inconStats.mean - conStats.mean,
    tmtATime: tmtStats.aTime,
    tmtBTime: tmtStats.bTime,
    tmtAErrors: tmtStats.aErrors,
    tmtBErrors: tmtStats.bErrors,
    tmtBMinusA: tmtStats.bMinusA,
  }

  await appendResults(results)
  await appendStroopTrials(allStroopTrials)

  return NextResponse.json({ ok: true })
}
```

**Step 5: Commit**
```bash
git add src/app/api/
git commit -m "feat: add API routes for lookup, session, config, submit"
```

---

## Task 6: Landing page (participant ID entry)

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/components/ParticipantEntry.tsx`

**Step 1: Create ParticipantEntry component**

Create `src/components/ParticipantEntry.tsx`:
```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function ParticipantEntry({ studyTitle }: { studyTitle: string }) {
  const router = useRouter()
  const [id, setId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [warning, setWarning] = useState('')
  const [lookupResult, setLookupResult] = useState<{
    group: string; session: number; sessionMode: string
  } | null>(null)

  async function handleLookup() {
    setError(''); setWarning(''); setLoading(true)
    const res = await fetch('/api/lookup-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: id.trim().toUpperCase() }),
    })
    const data = await res.json()
    setLoading(false)
    if (!data.found) {
      setError('ID not found. Please check your ID from the prescreening email.')
      return
    }
    if (data.alreadySubmitted) {
      setWarning('You have already completed this session. Continuing will submit a duplicate. Are you sure?')
    }
    setLookupResult(data)
  }

  function handleBegin() {
    sessionStorage.setItem('participant', JSON.stringify({
      id: id.trim().toUpperCase(),
      group: lookupResult!.group,
      session: lookupResult!.session,
    }))
    router.push('/test/rosenberg')
  }

  return (
    <div className="page-container">
      <h1 className="page-title">{studyTitle}</h1>
      <p className="page-subtitle">Please enter your participant ID to begin.</p>
      <Card className="w-full max-w-md">
        <label className="block text-sm font-medium mb-2">Participant ID</label>
        <input
          className="w-full bg-parchment border border-ink/20 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sage/50 mb-4"
          placeholder="e.g. AB01012001"
          value={id}
          onChange={e => setId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !lookupResult && handleLookup()}
          maxLength={12}
        />
        {error && <p className="text-terracotta text-sm mb-3">{error}</p>}
        {warning && (
          <div className="bg-terracotta/10 border border-terracotta/30 rounded-xl p-3 mb-3">
            <p className="text-sm text-terracotta">{warning}</p>
          </div>
        )}
        {lookupResult && (
          <div className="bg-sage/10 border border-sage/30 rounded-xl p-3 mb-4">
            <p className="text-sm"><span className="font-medium">Group:</span> {lookupResult.group} user</p>
            <p className="text-sm"><span className="font-medium">Session:</span> {lookupResult.sessionMode === 'pre' ? 'Pre-Detox' : 'Post-Detox'}</p>
          </div>
        )}
        {!lookupResult ? (
          <Button onClick={handleLookup} disabled={loading || id.length < 8} className="w-full">
            {loading ? 'Looking up...' : 'Look up ID'}
          </Button>
        ) : (
          <Button onClick={handleBegin} className="w-full">Begin Assessment →</Button>
        )}
      </Card>
    </div>
  )
}
```

**Step 2: Create landing page**

Replace `src/app/page.tsx`:
```typescript
import { getConfig } from '@/lib/sheets'
import { ParticipantEntry } from '@/components/ParticipantEntry'

export default async function Home() {
  const config = await getConfig()
  return <ParticipantEntry studyTitle={config.study_title} />
}
```

**Step 3: Verify in browser**
```bash
npm run dev
```
Open http://localhost:3000. You should see the parchment-background landing page with the ID entry card.

**Step 4: Commit**
```bash
git add src/app/page.tsx src/components/ParticipantEntry.tsx
git commit -m "feat: add participant landing page with ID lookup"
```

---

## Task 7: Test wrapper + InstructionScreen component

**Files:**
- Create: `src/components/tests/InstructionScreen.tsx`
- Create: `src/components/tests/TestShell.tsx`

**Step 1: Create InstructionScreen**

Create `src/components/tests/InstructionScreen.tsx`:
```typescript
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Props {
  title: string
  instructions: string[]
  onReady: () => void
  estimatedTime?: string
}

export function InstructionScreen({ title, instructions, onReady, estimatedTime }: Props) {
  return (
    <div className="page-container">
      <Card className="w-full max-w-lg">
        <h2 className="text-xl font-semibold mb-1">{title}</h2>
        {estimatedTime && <p className="text-xs text-ink/50 mb-4">~{estimatedTime}</p>}
        <ul className="space-y-2 mb-6">
          {instructions.map((line, i) => (
            <li key={i} className="text-sm text-ink/80 flex gap-2">
              <span className="text-sage mt-0.5">→</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <Button onClick={onReady} className="w-full">I'm ready →</Button>
      </Card>
    </div>
  )
}
```

**Step 2: Create TestShell (guards participant session)**

Create `src/components/tests/TestShell.tsx`:
```typescript
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export interface ParticipantSession {
  id: string
  group: 'Heavy' | 'Moderate'
  session: number
}

export function useParticipantSession(): ParticipantSession | null {
  const router = useRouter()
  const [participant, setParticipant] = useState<ParticipantSession | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('participant')
    if (!stored) { router.replace('/'); return }
    setParticipant(JSON.parse(stored))
  }, [router])

  return participant
}
```

**Step 3: Commit**
```bash
git add src/components/tests/
git commit -m "feat: add instruction screen and session guard"
```

---

## Task 8: Rosenberg Self-Esteem Scale

**Files:**
- Create: `src/app/test/rosenberg/page.tsx`
- Create: `src/components/tests/RosenbergTest.tsx`

**Step 1: Create RosenbergTest component**

Create `src/components/tests/RosenbergTest.tsx`:
```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { InstructionScreen } from './InstructionScreen'
import { useParticipantSession } from './TestShell'

const ITEMS = [
  "I feel that I am a person of worth, at least on an equal plane with others.",
  "I feel that I have a number of good qualities.",
  "All in all, I am inclined to feel that I am a failure.",
  "I am able to do things as well as most other people.",
  "I feel I do not have much to be proud of.",
  "I take a positive attitude toward myself.",
  "On the whole, I am satisfied with myself.",
  "I wish I could have more respect for myself.",
  "I certainly feel useless at times.",
  "At times I think I am no good at all.",
]

const OPTIONS = ['Strongly Agree', 'Agree', 'Disagree', 'Strongly Disagree']

export function RosenbergTest() {
  const router = useRouter()
  const participant = useParticipantSession()
  const [started, setStarted] = useState(false)
  const [current, setCurrent] = useState(0)
  const [responses, setResponses] = useState<number[]>([])

  if (!participant) return null

  if (!started) {
    return (
      <InstructionScreen
        title="Self-Esteem Questionnaire"
        estimatedTime="5 minutes"
        instructions={[
          "You will see 10 statements about yourself.",
          "For each one, select how much you agree or disagree.",
          "There are no right or wrong answers.",
          "Answer based on how you feel right now.",
        ]}
        onReady={() => setStarted(true)}
      />
    )
  }

  function handleSelect(value: number) {
    const newResponses = [...responses, value]
    if (current < ITEMS.length - 1) {
      setResponses(newResponses)
      setCurrent(current + 1)
    } else {
      const existing = JSON.parse(sessionStorage.getItem('testData') || '{}')
      sessionStorage.setItem('testData', JSON.stringify({
        ...existing,
        rseResponses: newResponses,
      }))
      router.push('/test/stroop')
    }
  }

  const progress = ((current) / ITEMS.length) * 100

  return (
    <div className="page-container">
      <div className="w-full max-w-lg mb-4">
        <div className="flex justify-between text-xs text-ink/50 mb-1">
          <span>Question {current + 1} of {ITEMS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-cream rounded-full overflow-hidden">
          <div className="h-full bg-sage rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <Card className="w-full max-w-lg">
        <p className="text-base font-medium mb-6 leading-relaxed">{ITEMS[current]}</p>
        <div className="space-y-2">
          {OPTIONS.map((label, i) => (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className="w-full text-left px-4 py-3 rounded-xl border border-ink/15 hover:border-sage hover:bg-sage/5 transition-all duration-100 text-sm font-mono"
            >
              {label}
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
```

**Step 2: Create page**

Create `src/app/test/rosenberg/page.tsx`:
```typescript
import { RosenbergTest } from '@/components/tests/RosenbergTest'
export default function Page() { return <RosenbergTest /> }
```

**Step 3: Verify in browser**
Navigate to http://localhost:3000 → enter a valid ID → should land on Rosenberg instructions, then question flow.

**Step 4: Commit**
```bash
git add src/app/test/rosenberg/ src/components/tests/RosenbergTest.tsx
git commit -m "feat: add Rosenberg Self-Esteem Scale"
```

---

## Task 9: Stroop Test

**Files:**
- Create: `src/components/tests/StroopTest.tsx`
- Create: `src/app/test/stroop/page.tsx`

**Step 1: Create StroopTest component**

Create `src/components/tests/StroopTest.tsx`:
```typescript
'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { InstructionScreen } from './InstructionScreen'
import { useParticipantSession } from './TestShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const WORDS = ['RED', 'BLUE', 'GREEN', 'YELLOW']
const COLORS = {
  RED: '#C0392B',
  BLUE: '#2980B9',
  GREEN: '#27AE60',
  YELLOW: '#D4AC0D',
}

type Color = keyof typeof COLORS

interface Trial {
  word: Color
  inkColor: Color
  condition: 'congruent' | 'incongruent'
}

interface TrialResult {
  trial: Trial
  rtMs: number
  correct: boolean
  trialNumber: number
}

function generateTrials(count: number, practice = false): Trial[] {
  const trials: Trial[] = []
  const half = count / 2
  // Congruent
  for (let i = 0; i < half; i++) {
    const word = WORDS[i % WORDS.length] as Color
    trials.push({ word, inkColor: word, condition: 'congruent' })
  }
  // Incongruent
  for (let i = 0; i < half; i++) {
    const word = WORDS[i % WORDS.length] as Color
    const otherColors = WORDS.filter(w => w !== word) as Color[]
    const inkColor = otherColors[i % otherColors.length]
    trials.push({ word, inkColor, condition: 'incongruent' })
  }
  // Shuffle
  return trials.sort(() => Math.random() - 0.5)
}

export function StroopTest({ testTrials = 48, practiceTrials = 6 }: {
  testTrials?: number; practiceTrials?: number
}) {
  const router = useRouter()
  const participant = useParticipantSession()
  const [phase, setPhase] = useState<'instructions' | 'practice' | 'test' | 'done'>('instructions')
  const [trials, setTrials] = useState<Trial[]>([])
  const [current, setCurrent] = useState(0)
  const [results, setResults] = useState<TrialResult[]>([])
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const startTime = useRef<number>(0)

  const startPhase = useCallback((p: 'practice' | 'test') => {
    const count = p === 'practice' ? practiceTrials : testTrials
    setTrials(generateTrials(count))
    setCurrent(0)
    setResults([])
    setPhase(p)
  }, [practiceTrials, testTrials])

  function handleResponse(color: Color) {
    const rt = performance.now() - startTime.current
    const trial = trials[current]
    const correct = color === trial.inkColor
    const result: TrialResult = { trial, rtMs: rt, correct, trialNumber: current + 1 }

    if (phase === 'practice') {
      setFeedback(correct ? 'correct' : 'wrong')
      setTimeout(() => {
        setFeedback(null)
        if (current + 1 < trials.length) {
          setCurrent(c => c + 1)
          startTime.current = performance.now()
        } else {
          setPhase('instructions') // show test instructions
        }
      }, 600)
      return
    }

    const newResults = [...results, result]
    if (current + 1 < trials.length) {
      setResults(newResults)
      setCurrent(c => c + 1)
      startTime.current = performance.now()
    } else {
      // Save and move on
      const existing = JSON.parse(sessionStorage.getItem('testData') || '{}')
      const conTrials = newResults.filter(r => r.trial.condition === 'congruent')
      const inconTrials = newResults.filter(r => r.trial.condition === 'incongruent')
      sessionStorage.setItem('testData', JSON.stringify({
        ...existing,
        stroopConTrials: conTrials.map(r => ({ rtMs: r.rtMs, correct: r.correct })),
        stroopInconTrials: inconTrials.map(r => ({ rtMs: r.rtMs, correct: r.correct })),
        allStroopTrials: newResults.map(r => ({
          participantId: participant!.id,
          session: participant!.session,
          trialNumber: r.trialNumber,
          condition: r.trial.condition,
          rtMs: r.rtMs,
          correct: r.correct,
        })),
      }))
      router.push('/test/tmt')
    }
  }

  useEffect(() => {
    if (phase === 'practice' || phase === 'test') {
      startTime.current = performance.now()
    }
  }, [current, phase])

  if (!participant) return null

  if (phase === 'instructions') {
    const isPracticeComplete = false // always show instructions first
    return (
      <InstructionScreen
        title="Stroop Test"
        estimatedTime="10 minutes"
        instructions={[
          "A color word will appear on screen.",
          "Your task: identify the INK COLOR, not the word.",
          "Example: the word RED written in blue → tap BLUE.",
          "Respond as quickly and accurately as possible.",
          "We'll start with a short practice round.",
        ]}
        onReady={() => startPhase('practice')}
      />
    )
  }

  if (phase === 'done') return null

  const trial = trials[current]
  const progress = phase === 'test' ? (current / trials.length) * 100 : null

  return (
    <div className="page-container">
      {phase === 'practice' && (
        <div className="mb-4 text-xs text-ink/50 font-mono">
          Practice — {current + 1} / {trials.length}
        </div>
      )}
      {progress !== null && (
        <div className="w-full max-w-lg mb-4">
          <div className="h-1.5 bg-cream rounded-full overflow-hidden">
            <div className="h-full bg-sage rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      <Card className="w-full max-w-lg text-center">
        <div className="py-8">
          <span
            className="text-5xl font-bold tracking-widest"
            style={{ color: COLORS[trial.inkColor] }}
          >
            {trial.word}
          </span>
        </div>
        {feedback && (
          <div className={`text-sm font-medium mb-4 ${feedback === 'correct' ? 'text-sage' : 'text-terracotta'}`}>
            {feedback === 'correct' ? '✓ Correct' : '✗ Try again'}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {WORDS.map(color => (
            <Button
              key={color}
              variant="secondary"
              onClick={() => handleResponse(color as Color)}
              className="py-3 text-sm"
              style={{ borderColor: COLORS[color as Color] + '60' }}
            >
              <span style={{ color: COLORS[color as Color] }}>■</span> {color}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  )
}
```

**Step 2: Create page (reads config for trial counts)**

Create `src/app/test/stroop/page.tsx`:
```typescript
import { getConfig } from '@/lib/sheets'
import { StroopTest } from '@/components/tests/StroopTest'

export default async function Page() {
  const config = await getConfig()
  return (
    <StroopTest
      testTrials={config.stroop_test_trials}
      practiceTrials={config.stroop_practice_trials}
    />
  )
}
```

**Step 3: Commit**
```bash
git add src/app/test/stroop/ src/components/tests/StroopTest.tsx
git commit -m "feat: add Stroop Test with practice trials and configurable trial count"
```

---

## Task 10: Trail Making Test

**Files:**
- Create: `src/components/tests/TrailMakingTest.tsx`
- Create: `src/app/test/tmt/page.tsx`

**Step 1: Create TrailMakingTest component**

Create `src/components/tests/TrailMakingTest.tsx`:
```typescript
'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { InstructionScreen } from './InstructionScreen'
import { useParticipantSession } from './TestShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Circle { x: number; y: number; label: string; index: number }

function generateCircles(count: number, width: number, height: number, labels: string[]): Circle[] {
  const circles: Circle[] = []
  const r = 26
  const pad = r + 8
  let attempts = 0
  for (let i = 0; i < count; i++) {
    let placed = false
    while (!placed && attempts < 2000) {
      attempts++
      const x = pad + Math.random() * (width - pad * 2)
      const y = pad + Math.random() * (height - pad * 2)
      const ok = circles.every(c => Math.hypot(c.x - x, c.y - y) > r * 2.8)
      if (ok) { circles.push({ x, y, label: labels[i], index: i }); placed = true }
    }
  }
  return circles
}

function partALabels(count: number) {
  return Array.from({ length: count }, (_, i) => String(i + 1))
}

function partBLabels() {
  const nums = Array.from({ length: 13 }, (_, i) => String(i + 1))
  const lets = 'ABCDEFGHIJKLM'.split('')
  const result: string[] = []
  for (let i = 0; i < 13; i++) { result.push(nums[i]); result.push(lets[i]) }
  return result // 26 items alternating
}

type TMTPart = 'A' | 'B'

interface PartResult { timeMs: number; errors: number }

export function TrailMakingTest({ partACount = 25 }: { partACount?: number }) {
  const router = useRouter()
  const participant = useParticipantSession()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<'instructions-a' | 'a' | 'instructions-b' | 'b' | 'done'>('instructions-a')
  const [circles, setCircles] = useState<Circle[]>([])
  const [nextIndex, setNextIndex] = useState(0)
  const [errors, setErrors] = useState(0)
  const [connections, setConnections] = useState<[number, number][]>([]) // [fromIndex, toIndex]
  const [shakeCircle, setShakeCircle] = useState<number | null>(null)
  const startTime = useRef<number>(0)
  const partAResult = useRef<PartResult | null>(null)

  const CIRCLE_R = 26
  const CANVAS_W = 640
  const CANVAS_H = 420

  function initPart(part: TMTPart) {
    const labels = part === 'A' ? partALabels(partACount) : partBLabels()
    const c = generateCircles(labels.length, CANVAS_W, CANVAS_H, labels)
    setCircles(c)
    setNextIndex(0)
    setErrors(0)
    setConnections([])
    setShakeCircle(null)
    startTime.current = 0
  }

  useEffect(() => {
    if (phase === 'a') initPart('A')
    if (phase === 'b') initPart('B')
  }, [phase])

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || circles.length === 0) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

    // Draw connections
    ctx.strokeStyle = '#8B9E77'
    ctx.lineWidth = 2
    connections.forEach(([from, to]) => {
      ctx.beginPath()
      ctx.moveTo(circles[from].x, circles[from].y)
      ctx.lineTo(circles[to].x, circles[to].y)
      ctx.stroke()
    })

    // Draw circles
    circles.forEach((c, i) => {
      const done = i < nextIndex
      const isNext = i === nextIndex
      const isShaking = i === shakeCircle

      ctx.beginPath()
      ctx.arc(c.x, c.y, CIRCLE_R, 0, Math.PI * 2)
      ctx.fillStyle = done ? '#8B9E77' : isNext ? '#EDE4D3' : '#F5EFE6'
      ctx.fill()
      ctx.strokeStyle = done ? '#8B9E77' : isNext ? '#C4937A' : '#3D353040'
      ctx.lineWidth = isNext ? 2.5 : 1.5
      if (isShaking) ctx.strokeStyle = '#C4937A'
      ctx.stroke()

      ctx.fillStyle = done ? '#fff' : '#3D3530'
      ctx.font = `${CIRCLE_R > 22 ? 13 : 11}px JetBrains Mono, monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(c.label, c.x, c.y)
    })
  }, [circles, connections, nextIndex, shakeCircle])

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_W / rect.width
    const scaleY = CANVAS_H / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    const hit = circles.find(c => Math.hypot(c.x - x, c.y - y) <= CIRCLE_R + 4)
    if (!hit) return

    if (startTime.current === 0) startTime.current = performance.now()

    if (hit.index === nextIndex) {
      if (nextIndex > 0) {
        setConnections(prev => [...prev, [nextIndex - 1, nextIndex]])
      }
      const newNext = nextIndex + 1
      setNextIndex(newNext)

      if (newNext >= circles.length) {
        const elapsed = performance.now() - startTime.current
        const currentErrors = errors // capture current value
        if (phase === 'a') {
          partAResult.current = { timeMs: elapsed, errors: currentErrors }
          setPhase('instructions-b')
        } else {
          const bResult = { timeMs: elapsed, errors: currentErrors }
          const existing = JSON.parse(sessionStorage.getItem('testData') || '{}')
          sessionStorage.setItem('testData', JSON.stringify({
            ...existing,
            tmtATimeMs: partAResult.current!.timeMs,
            tmtBTimeMs: bResult.timeMs,
            tmtAErrors: partAResult.current!.errors,
            tmtBErrors: bResult.errors,
          }))
          setPhase('done')
          router.push('/complete')
        }
      }
    } else {
      setErrors(e => e + 1)
      setShakeCircle(hit.index)
      setTimeout(() => setShakeCircle(null), 400)
    }
  }

  if (!participant) return null

  if (phase === 'instructions-a') {
    return (
      <InstructionScreen
        title="Trail Making Test — Part A"
        estimatedTime="5 minutes"
        instructions={[
          `You will see ${partACount} numbered circles on screen.`,
          "Connect them in order: 1 → 2 → 3 → ... as fast as possible.",
          "Click a circle to connect it. The timer starts on your first click.",
          "Wrong clicks count as errors but don't stop the timer.",
        ]}
        onReady={() => setPhase('a')}
      />
    )
  }

  if (phase === 'instructions-b') {
    return (
      <InstructionScreen
        title="Trail Making Test — Part B"
        estimatedTime="5 minutes"
        instructions={[
          "Now you will see circles with both numbers and letters.",
          "Alternate between them in order: 1 → A → 2 → B → 3 → C ...",
          "Same rules: click to connect, timer starts on first click.",
        ]}
        onReady={() => setPhase('b')}
      />
    )
  }

  return (
    <div className="page-container">
      <div className="flex items-center gap-4 mb-4 text-sm text-ink/60">
        <span>Part {phase.toUpperCase()}</span>
        <span>Next: <strong className="text-ink">{circles[nextIndex]?.label}</strong></span>
        <span>Errors: <strong className="text-terracotta">{errors}</strong></span>
      </div>
      <div className="bg-cream rounded-2xl shadow-card overflow-hidden" style={{ maxWidth: CANVAS_W }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onClick={handleCanvasClick}
          className="w-full cursor-pointer"
        />
      </div>
    </div>
  )
}
```

**Step 2: Create page**

Create `src/app/test/tmt/page.tsx`:
```typescript
import { getConfig } from '@/lib/sheets'
import { TrailMakingTest } from '@/components/tests/TrailMakingTest'

export default async function Page() {
  const config = await getConfig()
  return <TrailMakingTest partACount={config.tmt_part_a_count} />
}
```

**Step 3: Commit**
```bash
git add src/app/test/tmt/ src/components/tests/TrailMakingTest.tsx
git commit -m "feat: add Trail Making Test Part A and B with canvas"
```

---

## Task 11: Completion page + data submission

**Files:**
- Create: `src/app/complete/page.tsx`
- Create: `src/components/CompletionPage.tsx`

**Step 1: Create CompletionPage**

Create `src/components/CompletionPage.tsx`:
```typescript
'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'

export function CompletionPage() {
  const [status, setStatus] = useState<'submitting' | 'success' | 'error'>('submitting')

  useEffect(() => {
    const participant = JSON.parse(sessionStorage.getItem('participant') || 'null')
    const testData = JSON.parse(sessionStorage.getItem('testData') || 'null')
    if (!participant || !testData) { setStatus('error'); return }

    fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...participant, participantId: participant.id, ...testData }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          sessionStorage.removeItem('testData')
          setStatus('success')
        } else setStatus('error')
      })
      .catch(() => setStatus('error'))
  }, [])

  return (
    <div className="page-container">
      <Card className="w-full max-w-md text-center">
        {status === 'submitting' && (
          <>
            <div className="text-3xl mb-4">⏳</div>
            <h2 className="text-lg font-medium">Saving your results...</h2>
            <p className="text-sm text-ink/60 mt-2">Please don't close this tab.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-3xl mb-4">✓</div>
            <h2 className="text-lg font-semibold text-sage">All done!</h2>
            <p className="text-sm text-ink/60 mt-2 leading-relaxed">
              Thank you for participating. Your responses have been recorded successfully.
              You may close this tab.
            </p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-3xl mb-4">⚠</div>
            <h2 className="text-lg font-medium text-terracotta">Something went wrong</h2>
            <p className="text-sm text-ink/60 mt-2">
              Please contact the researcher. Your data may not have been saved.
            </p>
          </>
        )}
      </Card>
    </div>
  )
}
```

**Step 2: Create page**

Create `src/app/complete/page.tsx`:
```typescript
import { CompletionPage } from '@/components/CompletionPage'
export default function Page() { return <CompletionPage /> }
```

**Step 3: Commit**
```bash
git add src/app/complete/ src/components/CompletionPage.tsx
git commit -m "feat: add completion page with data submission"
```

---

## Task 12: Researcher dashboard

**Files:**
- Create: `src/app/researcher/page.tsx`
- Create: `src/components/researcher/ResearcherDashboard.tsx`
- Create: `src/app/api/researcher/results/route.ts`

**Step 1: Create results API route**

Create `src/app/api/researcher/results/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAllResults, getConfig } from '@/lib/sheets'

export async function GET(req: NextRequest) {
  const password = req.headers.get('x-researcher-password')
  if (password !== process.env.RESEARCHER_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const [rows, config] = await Promise.all([getAllResults(), getConfig()])
  return NextResponse.json({ rows: rows.slice(1), config }) // skip header row
}
```

**Step 2: Create ResearcherDashboard**

Create `src/components/researcher/ResearcherDashboard.tsx`:
```typescript
'use client'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function ResearcherDashboard() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<{ rows: string[][]; config: Record<string, unknown> } | null>(null)
  const [mode, setMode] = useState<'pre' | 'post'>('pre')
  const [toggling, setToggling] = useState(false)

  async function login() {
    const res = await fetch('/api/researcher/results', {
      headers: { 'x-researcher-password': password },
    })
    if (res.status === 401) { setError('Wrong password'); return }
    const d = await res.json()
    setData(d)
    setMode((d.config.session_mode as 'pre' | 'post') ?? 'pre')
    setAuthed(true)
  }

  async function toggleMode() {
    setToggling(true)
    const newMode = mode === 'pre' ? 'post' : 'pre'
    await fetch('/api/session-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-researcher-password': password },
      body: JSON.stringify({ mode: newMode }),
    })
    setMode(newMode)
    setToggling(false)
  }

  if (!authed) {
    return (
      <div className="page-container">
        <Card className="w-full max-w-sm">
          <h2 className="page-title">Researcher Login</h2>
          <input
            type="password"
            placeholder="Password"
            className="w-full bg-parchment border border-ink/20 rounded-xl px-4 py-2.5 font-mono text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-sage/50"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
          />
          {error && <p className="text-terracotta text-sm mb-3">{error}</p>}
          <Button onClick={login} className="w-full">Enter</Button>
        </Card>
      </div>
    )
  }

  const rows = data?.rows ?? []
  const preCount = rows.filter(r => r[2] === '1').length
  const postCount = rows.filter(r => r[2] === '2').length
  const bothCount = rows.filter(r => {
    const id = r[0]
    return rows.filter(x => x[0] === id).length >= 2
  }).length / 2
  const incomplete = rows.filter(r => r[4] === 'No')

  return (
    <div className="min-h-screen bg-parchment p-6 font-mono">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">Researcher Dashboard</h1>
          <a href="/settings" className="text-sm text-ink/60 hover:text-ink underline">Settings →</a>
        </div>

        {/* Session toggle */}
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-ink/50 mb-1">Current session</p>
              <p className={`text-2xl font-bold tracking-wide ${mode === 'pre' ? 'text-sage' : 'text-terracotta'}`}>
                {mode === 'pre' ? 'PRE-DETOX' : 'POST-DETOX'}
              </p>
            </div>
            <Button onClick={toggleMode} disabled={toggling} variant="secondary">
              Switch to {mode === 'pre' ? 'Post' : 'Pre'}-Detox
            </Button>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Pre complete', value: preCount },
            { label: 'Post complete', value: postCount },
            { label: 'Both sessions', value: Math.floor(bothCount) },
          ].map(s => (
            <Card key={s.label} className="text-center">
              <p className="text-3xl font-bold text-sage">{s.value}</p>
              <p className="text-xs text-ink/60 mt-1">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Incomplete flag */}
        {incomplete.length > 0 && (
          <Card className="mb-6 border border-terracotta/30 bg-terracotta/5">
            <p className="text-sm font-medium text-terracotta mb-2">⚠ Incomplete submissions ({incomplete.length})</p>
            {incomplete.map((r, i) => (
              <p key={i} className="text-xs text-ink/70">{r[0]} — session {r[2] === '1' ? 'Pre' : 'Post'}</p>
            ))}
          </Card>
        )}

        {/* Participant table */}
        <Card>
          <h3 className="text-sm font-medium mb-3">All Submissions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-ink/10">
                  {['ID', 'Group', 'Session', 'Completed', 'Timestamp'].map(h => (
                    <th key={h} className="text-left py-2 pr-4 text-ink/50 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-ink/5 hover:bg-parchment/50">
                    <td className="py-2 pr-4 font-medium">{r[0]}</td>
                    <td className="py-2 pr-4">{r[1]}</td>
                    <td className="py-2 pr-4">{r[2] === '1' ? 'Pre' : 'Post'}</td>
                    <td className={`py-2 pr-4 ${r[4] === 'No' ? 'text-terracotta' : 'text-sage'}`}>{r[4]}</td>
                    <td className="py-2 text-ink/50">{r[3]?.slice(0, 16)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
```

**Step 3: Create page**

Create `src/app/researcher/page.tsx`:
```typescript
import { ResearcherDashboard } from '@/components/researcher/ResearcherDashboard'
export default function Page() { return <ResearcherDashboard /> }
```

**Step 4: Commit**
```bash
git add src/app/researcher/ src/components/researcher/ src/app/api/researcher/
git commit -m "feat: add researcher dashboard with session toggle and participant table"
```

---

## Task 13: Settings page

**Files:**
- Create: `src/app/settings/page.tsx`
- Create: `src/components/researcher/SettingsPage.tsx`

**Step 1: Create SettingsPage**

Create `src/components/researcher/SettingsPage.tsx`:
```typescript
'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { StudyConfig } from '@/lib/types'

const FIELD_META: { key: keyof StudyConfig; label: string; help: string; type: 'text' | 'number' | 'select' }[] = [
  { key: 'session_mode', label: 'Session Mode', help: 'pre = Pre-Detox, post = Post-Detox', type: 'select' },
  { key: 'study_title', label: 'Study Title', help: 'Shown on the participant landing page', type: 'text' },
  { key: 'researcher_name', label: 'Researcher Name', help: 'Shown in the dashboard header', type: 'text' },
  { key: 'max_participants', label: 'Max Participants', help: 'Soft cap shown in dashboard stats', type: 'number' },
  { key: 'stroop_test_trials', label: 'Stroop Test Trials', help: 'Total trials (must be even, default 48)', type: 'number' },
  { key: 'stroop_practice_trials', label: 'Stroop Practice Trials', help: 'Practice trials with feedback (default 6)', type: 'number' },
  { key: 'tmt_part_a_count', label: 'TMT Part A — Number of Circles', help: 'Circles in Part A (default 25)', type: 'number' },
]

export function SettingsPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [config, setConfig] = useState<StudyConfig | null>(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function login() {
    const res = await fetch('/api/config', {
      headers: { 'x-researcher-password': password },
    })
    if (res.status === 401) { setError('Wrong password'); return }
    setConfig(await res.json())
    setAuthed(true)
  }

  async function save() {
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-researcher-password': password },
      body: JSON.stringify(config),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!authed) {
    return (
      <div className="page-container">
        <Card className="w-full max-w-sm">
          <h2 className="page-title">Settings</h2>
          <input type="password" placeholder="Password"
            className="w-full bg-parchment border border-ink/20 rounded-xl px-4 py-2.5 font-mono text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-sage/50"
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()} />
          {error && <p className="text-terracotta text-sm mb-3">{error}</p>}
          <Button onClick={login} className="w-full">Enter</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-parchment p-6 font-mono">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">Study Settings</h1>
          <a href="/researcher" className="text-sm text-ink/60 hover:text-ink underline">← Dashboard</a>
        </div>
        <Card>
          <div className="space-y-5">
            {FIELD_META.map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium mb-1">{f.label}</label>
                <p className="text-xs text-ink/50 mb-1.5">{f.help}</p>
                {f.type === 'select' ? (
                  <select
                    className="w-full bg-parchment border border-ink/20 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
                    value={String(config![f.key])}
                    onChange={e => setConfig({ ...config!, [f.key]: e.target.value })}
                  >
                    <option value="pre">pre — Pre-Detox</option>
                    <option value="post">post — Post-Detox</option>
                  </select>
                ) : (
                  <input
                    type={f.type}
                    className="w-full bg-parchment border border-ink/20 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
                    value={String(config![f.key])}
                    onChange={e => setConfig({
                      ...config!,
                      [f.key]: f.type === 'number' ? parseInt(e.target.value) : e.target.value
                    })}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-3">
            <Button onClick={save} className="w-full">Save Settings</Button>
            {saved && <span className="text-sm text-sage">Saved ✓</span>}
          </div>
        </Card>
      </div>
    </div>
  )
}
```

**Step 2: Create page**

Create `src/app/settings/page.tsx`:
```typescript
import { SettingsPage } from '@/components/researcher/SettingsPage'
export default function Page() { return <SettingsPage /> }
```

**Step 3: Commit**
```bash
git add src/app/settings/ src/components/researcher/SettingsPage.tsx
git commit -m "feat: add settings page for non-technical researcher access"
```

---

## Task 14: Fix submit route (clean up require() call) + run all tests

**Step 1: Fix the require() in submit route**

The submit route has a `require()` inside a function — replace with a direct import.

Edit `src/app/api/submit/route.ts`, replace the `rseItems` calculation:
```typescript
import { calcStroopStats, calcTmtStats, scoreRosenbergItem } from '@/lib/scoring'

// In the POST handler, replace the rseItems line:
rseItems: rseResponses.map((v: number, i: number) => scoreRosenbergItem(v, i)),
```

**Step 2: Run all tests**
```bash
npm test
```
Expected: All tests PASS

**Step 3: Run dev server and do a full walkthrough**
```bash
npm run dev
```
Walk through the full participant flow end-to-end:
- Landing page → enter a test ID → see group + session
- Complete Rosenberg → Stroop (practice + test) → TMT (Part A + Part B)
- Verify data appears in Google Sheets Results and Stroop_Trials tabs
- Visit /researcher → check dashboard
- Visit /settings → change a value → verify Config tab updates

**Step 4: Push to GitHub (triggers Vercel deploy)**
```bash
git add src/app/api/submit/route.ts
git commit -m "fix: use direct import in submit route"
git push
```
Expected: Vercel dashboard shows deployment in progress → live URL available.

---

## Task 15: Final verification

**Step 1: Test the live Vercel URL**
- Open the Vercel deployment URL
- Complete a full test session
- Verify data in Google Sheets

**Step 2: Share URLs with associate researcher**
- Participant URL: `https://your-vercel-url.vercel.app`
- Researcher dashboard: `https://your-vercel-url.vercel.app/researcher`
- Settings: `https://your-vercel-url.vercel.app/settings`

**Step 3: Tag release**
```bash
git tag v1.0.0
git push --tags
```
