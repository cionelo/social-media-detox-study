# Plan A: Backend & Data Layer

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Google Sheets integration, scoring utilities, and all API routes.

**Architecture:** Server-side lib functions read/write Google Sheets. API routes wrap them with auth checks. No hardcoded constraints — all config values read from the Config sheet tab at runtime.

**Tech Stack:** Next.js API routes (TypeScript), googleapis, Jest.

**Prerequisite:** Phase 0 scaffold must be complete and pushed to `main` before starting.

---

## Setup

```bash
cd "/Users/ncionelo/Downloads/milly's project"
git checkout feature/backend
git pull origin main   # get the scaffold and types
```

---

## Task A-1: Google Sheets library

**Files:**
- Create: `src/lib/sheets.ts`
- Test: `src/lib/sheets.test.ts`

**Step 1: Write failing test for config parser**

Create `src/lib/sheets.test.ts`:
```typescript
import { parseConfig } from './sheets'

describe('parseConfig', () => {
  it('parses key-value rows into StudyConfig', () => {
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

  it('uses defaults for missing keys', () => {
    const config = parseConfig([])
    expect(config.session_mode).toBe('pre')
    expect(config.max_participants).toBe(40)
  })
})
```

**Step 2: Run to verify failure**
```bash
npm test -- sheets.test.ts
```
Expected: FAIL — `parseConfig` not found

**Step 3: Implement sheets.ts**

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
    t.participantId, t.session, t.trialNumber, t.condition, t.rtMs, t.correct,
  ])
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Stroop_Trials!A1',
    valueInputOption: 'RAW',
    requestBody: { values: rows },
  })
}

export async function getAllResults(): Promise<string[][]> {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Results!A:D',
  })
  return (res.data.values ?? []) as string[][]
}
```

**Step 4: Run tests**
```bash
npm test -- sheets.test.ts
```
Expected: PASS

**Step 5: Commit**
```bash
git add src/lib/sheets.ts src/lib/sheets.test.ts
git commit -m "feat: Google Sheets lib with config parser"
git push
```

---

## Task A-2: Scoring utilities

**Files:**
- Create: `src/lib/scoring.ts`
- Test: `src/lib/scoring.test.ts`

**Step 1: Write failing tests**

Create `src/lib/scoring.test.ts`:
```typescript
import { scoreRosenberg, scoreRosenbergItem, calcStroopStats, calcTmtStats } from './scoring'

describe('scoreRosenbergItem', () => {
  it('scores forward items: SA=3, SD=0', () => {
    expect(scoreRosenbergItem(0, 0)).toBe(3) // item 1, SA → 3
    expect(scoreRosenbergItem(3, 0)).toBe(0) // item 1, SD → 0
  })
  it('scores reverse items: SA=0, SD=3', () => {
    expect(scoreRosenbergItem(0, 2)).toBe(0) // item 3 (reverse), SA → 0
    expect(scoreRosenbergItem(3, 2)).toBe(3) // item 3 (reverse), SD → 3
  })
})

describe('scoreRosenberg', () => {
  it('returns 30 for max self-esteem responses', () => {
    // All "positive SE": SA on forward items (0), SD on reverse items (3)
    const responses = [0, 0, 3, 0, 3, 0, 0, 3, 3, 3]
    expect(scoreRosenberg(responses)).toBe(30)
  })
  it('returns 0 for min self-esteem responses', () => {
    const responses = [3, 3, 0, 3, 0, 3, 3, 0, 0, 0]
    expect(scoreRosenberg(responses)).toBe(0)
  })
})

describe('calcStroopStats', () => {
  it('converts ms to seconds for mean', () => {
    const { mean } = calcStroopStats([500, 600, 700])
    expect(mean).toBeCloseTo(0.6, 5)
  })
  it('returns 0 SD for identical RTs', () => {
    const { sd } = calcStroopStats([500, 500, 500])
    expect(sd).toBe(0)
  })
  it('calculates accuracy', () => {
    const { accuracy } = calcStroopStats([400, 500], [true, false])
    expect(accuracy).toBe(0.5)
  })
})

describe('calcTmtStats', () => {
  it('calculates B minus A', () => {
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
const REVERSE_ITEMS = [2, 4, 7, 8, 9] // 0-indexed: items 3,5,8,9,10

export function scoreRosenbergItem(value: number, index: number): number {
  // value: 0=Strongly Agree, 1=Agree, 2=Disagree, 3=Strongly Disagree
  if (REVERSE_ITEMS.includes(index)) return value
  return 3 - value
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
  return {
    mean: meanMs / 1000,
    sd: Math.sqrt(variance) / 1000,
    accuracy: corrects ? corrects.filter(Boolean).length / corrects.length : 1,
  }
}

export function calcTmtStats(aTimeS: number, bTimeS: number, aErrors: number, bErrors: number) {
  return { aTime: aTimeS, bTime: bTimeS, aErrors, bErrors, bMinusA: bTimeS - aTimeS }
}
```

**Step 4: Run tests**
```bash
npm test -- scoring.test.ts
```
Expected: PASS

**Step 5: Commit**
```bash
git add src/lib/scoring.ts src/lib/scoring.test.ts
git commit -m "feat: scoring utilities with tests"
git push
```

---

## Task A-3: API routes

**Files:**
- Create: `src/app/api/lookup-id/route.ts`
- Create: `src/app/api/session-mode/route.ts`
- Create: `src/app/api/config/route.ts`
- Create: `src/app/api/submit/route.ts`
- Create: `src/app/api/researcher/results/route.ts`

**Step 1: lookup-id route**

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

**Step 2: session-mode route**

Create `src/app/api/session-mode/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getConfig, setConfigValue } from '@/lib/sheets'

export async function GET() {
  const config = await getConfig()
  return NextResponse.json({ session_mode: config.session_mode })
}

export async function POST(req: NextRequest) {
  if (req.headers.get('x-researcher-password') !== process.env.RESEARCHER_PASSWORD) {
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

**Step 3: config route**

Create `src/app/api/config/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getConfig, setConfigValue } from '@/lib/sheets'

export async function GET() {
  const config = await getConfig()
  return NextResponse.json(config)
}

export async function POST(req: NextRequest) {
  if (req.headers.get('x-researcher-password') !== process.env.RESEARCHER_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const updates: Record<string, string> = await req.json()
  await Promise.all(Object.entries(updates).map(([k, v]) => setConfigValue(k, String(v))))
  return NextResponse.json({ ok: true })
}
```

**Step 4: submit route**

Create `src/app/api/submit/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { appendResults, appendStroopTrials } from '@/lib/sheets'
import { calcStroopStats, calcTmtStats, scoreRosenbergItem } from '@/lib/scoring'
import type { TestResults } from '@/lib/types'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    participantId, group, session,
    rseResponses,
    stroopConTrials,
    stroopInconTrials,
    tmtATimeMs, tmtBTimeMs,
    tmtAErrors, tmtBErrors,
    allStroopTrials,
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
    rseItems: rseResponses.map((v: number, i: number) => scoreRosenbergItem(v, i)),
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

**Step 5: researcher results route**

Create `src/app/api/researcher/results/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAllResults, getConfig } from '@/lib/sheets'

export async function GET(req: NextRequest) {
  if (req.headers.get('x-researcher-password') !== process.env.RESEARCHER_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const [rows, config] = await Promise.all([getAllResults(), getConfig()])
  return NextResponse.json({ rows: rows.slice(1), config })
}
```

**Step 6: Run all tests**
```bash
npm test
```
Expected: All PASS

**Step 7: Commit and push**
```bash
git add src/app/api/ src/lib/
git commit -m "feat: all API routes complete"
git push
```

---

## Plan A complete

Notify the other session (Plan B) that API routes are pushed to `feature/backend`.
They can `git pull origin feature/backend` if they need the route types, but they should not need to — Plan B only imports from `@/lib/types` (already on `main`).

When Plan B is also done, merge both into `main`:
```bash
git checkout main
git merge feature/backend
git merge feature/frontend
git push
```
