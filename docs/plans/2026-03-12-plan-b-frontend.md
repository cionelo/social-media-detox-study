# Plan B: Frontend & UI

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement branding, all UI components, all 3 tests, researcher dashboard, and settings page.

**Architecture:** React components in `src/components/`. Pages in `src/app/`. API calls use fetch — the actual API routes are built in Plan A. This plan builds the full UI; wiring to live APIs is verified at the end.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, React.

**Prerequisite:** Phase 0 scaffold must be complete and pushed to `main` before starting.

---

## Setup

```bash
cd "/Users/ncionelo/Downloads/milly's project"
git checkout feature/frontend
git pull origin main   # get the scaffold and types
```

---

## Task B-1: Branding & base UI components

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

**Step 6: Verify in browser**
```bash
npm run dev
```
Open http://localhost:3000. Should see parchment background. Stop server.

**Step 7: Commit**
```bash
git add tailwind.config.ts src/app/globals.css src/app/layout.tsx src/components/ui/
git commit -m "feat: branding, Tailwind theme, Card and Button components"
git push
```

---

## Task B-2: Test infrastructure components

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

**Step 2: Create TestShell (session guard)**

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
git commit -m "feat: InstructionScreen and session guard hook"
git push
```

---

## Task B-3: Landing page

**Files:**
- Create: `src/components/ParticipantEntry.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Create ParticipantEntry**

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
      setWarning('You have already completed this session. Continuing will create a duplicate entry.')
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
      <p className="page-subtitle">Enter your participant ID to begin.</p>
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

**Step 2: Update page.tsx**

Replace `src/app/page.tsx`:
```typescript
import { getConfig } from '@/lib/sheets'
import { ParticipantEntry } from '@/components/ParticipantEntry'

export default async function Home() {
  const config = await getConfig()
  return <ParticipantEntry studyTitle={config.study_title} />
}
```

Note: `getConfig` calls Google Sheets — this will fail locally until Plan A's `sheets.ts` is merged in. For now the page builds correctly; it will work end-to-end after merge.

**Step 3: Commit**
```bash
git add src/app/page.tsx src/components/ParticipantEntry.tsx
git commit -m "feat: participant landing page"
git push
```

---

## Task B-4: Rosenberg Self-Esteem Scale

**Files:**
- Create: `src/components/tests/RosenbergTest.tsx`
- Create: `src/app/test/rosenberg/page.tsx`

**Step 1: Create RosenbergTest**

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

  const progress = (current / ITEMS.length) * 100

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

**Step 3: Commit**
```bash
git add src/app/test/rosenberg/ src/components/tests/RosenbergTest.tsx
git commit -m "feat: Rosenberg Self-Esteem Scale"
git push
```

---

## Task B-5: Stroop Test

**Files:**
- Create: `src/components/tests/StroopTest.tsx`
- Create: `src/app/test/stroop/page.tsx`

**Step 1: Create StroopTest**

Create `src/components/tests/StroopTest.tsx`:
```typescript
'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { InstructionScreen } from './InstructionScreen'
import { useParticipantSession } from './TestShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const WORDS = ['RED', 'BLUE', 'GREEN', 'YELLOW'] as const
type Color = typeof WORDS[number]

const COLORS: Record<Color, string> = {
  RED: '#C0392B',
  BLUE: '#2980B9',
  GREEN: '#27AE60',
  YELLOW: '#D4AC0D',
}

interface Trial { word: Color; inkColor: Color; condition: 'congruent' | 'incongruent' }
interface TrialResult { trial: Trial; rtMs: number; correct: boolean; trialNumber: number }

function generateTrials(count: number): Trial[] {
  const trials: Trial[] = []
  const half = count / 2
  for (let i = 0; i < half; i++) {
    const word = WORDS[i % WORDS.length]
    trials.push({ word, inkColor: word, condition: 'congruent' })
  }
  for (let i = 0; i < half; i++) {
    const word = WORDS[i % WORDS.length]
    const others = WORDS.filter(w => w !== word)
    trials.push({ word, inkColor: others[i % others.length], condition: 'incongruent' })
  }
  return trials.sort(() => Math.random() - 0.5)
}

export function StroopTest({ testTrials = 48, practiceTrials = 6 }: {
  testTrials?: number; practiceTrials?: number
}) {
  const router = useRouter()
  const participant = useParticipantSession()
  const [phase, setPhase] = useState<'instructions' | 'practice' | 'awaiting-test' | 'test'>('instructions')
  const [trials, setTrials] = useState<Trial[]>([])
  const [current, setCurrent] = useState(0)
  const [results, setResults] = useState<TrialResult[]>([])
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const startTime = useRef<number>(0)

  const startPhase = useCallback((p: 'practice' | 'test') => {
    setTrials(generateTrials(p === 'practice' ? practiceTrials : testTrials))
    setCurrent(0)
    setResults([])
    setPhase(p)
  }, [practiceTrials, testTrials])

  useEffect(() => {
    if (phase === 'practice' || phase === 'test') {
      startTime.current = performance.now()
    }
  }, [current, phase])

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
        } else {
          setPhase('awaiting-test')
        }
      }, 600)
      return
    }

    const newResults = [...results, result]
    if (current + 1 < trials.length) {
      setResults(newResults)
      setCurrent(c => c + 1)
    } else {
      const conTrials = newResults.filter(r => r.trial.condition === 'congruent')
      const inconTrials = newResults.filter(r => r.trial.condition === 'incongruent')
      const existing = JSON.parse(sessionStorage.getItem('testData') || '{}')
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

  if (!participant) return null

  if (phase === 'instructions') {
    return (
      <InstructionScreen
        title="Stroop Test"
        estimatedTime="10 minutes"
        instructions={[
          "A color word will appear on screen.",
          "Your task: identify the INK COLOR, not the word.",
          "Example: the word RED in blue ink → tap BLUE.",
          "Respond as quickly and accurately as possible.",
          "We'll start with a short practice round.",
        ]}
        onReady={() => startPhase('practice')}
      />
    )
  }

  if (phase === 'awaiting-test') {
    return (
      <InstructionScreen
        title="Practice complete"
        instructions={[
          "Great work! The real test is next.",
          "Same rules — identify the ink color as fast as you can.",
          "No more feedback will be shown.",
        ]}
        onReady={() => startPhase('test')}
      />
    )
  }

  const trial = trials[current]
  const progress = phase === 'test' ? (current / trials.length) * 100 : null

  return (
    <div className="page-container">
      {phase === 'practice' && (
        <p className="text-xs text-ink/50 mb-4">Practice — {current + 1} / {trials.length}</p>
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
          <span className="text-5xl font-bold tracking-widest" style={{ color: COLORS[trial.inkColor] }}>
            {trial.word}
          </span>
        </div>
        {feedback && (
          <p className={`text-sm font-medium mb-4 ${feedback === 'correct' ? 'text-sage' : 'text-terracotta'}`}>
            {feedback === 'correct' ? '✓ Correct' : '✗ Wrong color'}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          {WORDS.map(color => (
            <Button
              key={color}
              variant="secondary"
              onClick={() => handleResponse(color)}
              className="py-3 text-sm"
              style={{ borderColor: COLORS[color] + '60' }}
            >
              <span style={{ color: COLORS[color] }}>■</span> {color}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  )
}
```

**Step 2: Create page**

Create `src/app/test/stroop/page.tsx`:
```typescript
import { getConfig } from '@/lib/sheets'
import { StroopTest } from '@/components/tests/StroopTest'

export default async function Page() {
  const config = await getConfig()
  return <StroopTest testTrials={config.stroop_test_trials} practiceTrials={config.stroop_practice_trials} />
}
```

**Step 3: Commit**
```bash
git add src/app/test/stroop/ src/components/tests/StroopTest.tsx
git commit -m "feat: Stroop Test with practice and configurable trial count"
git push
```

---

## Task B-6: Trail Making Test

**Files:**
- Create: `src/components/tests/TrailMakingTest.tsx`
- Create: `src/app/test/tmt/page.tsx`

**Step 1: Create TrailMakingTest**

Create `src/components/tests/TrailMakingTest.tsx`:
```typescript
'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { InstructionScreen } from './InstructionScreen'
import { useParticipantSession } from './TestShell'

interface Circle { x: number; y: number; label: string; index: number }

const CIRCLE_R = 26
const CANVAS_W = 640
const CANVAS_H = 420

function generateCircles(labels: string[]): Circle[] {
  const circles: Circle[] = []
  const pad = CIRCLE_R + 8
  let attempts = 0
  for (let i = 0; i < labels.length; i++) {
    let placed = false
    while (!placed && attempts < 3000) {
      attempts++
      const x = pad + Math.random() * (CANVAS_W - pad * 2)
      const y = pad + Math.random() * (CANVAS_H - pad * 2)
      if (circles.every(c => Math.hypot(c.x - x, c.y - y) > CIRCLE_R * 2.8)) {
        circles.push({ x, y, label: labels[i], index: i })
        placed = true
      }
    }
  }
  return circles
}

function partALabels(count: number) {
  return Array.from({ length: count }, (_, i) => String(i + 1))
}

function partBLabels() {
  const labels: string[] = []
  const lets = 'ABCDEFGHIJKLM'.split('')
  for (let i = 0; i < 13; i++) { labels.push(String(i + 1)); labels.push(lets[i]) }
  return labels
}

interface PartResult { timeMs: number; errors: number }

export function TrailMakingTest({ partACount = 25 }: { partACount?: number }) {
  const router = useRouter()
  const participant = useParticipantSession()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<'inst-a' | 'a' | 'inst-b' | 'b'>('inst-a')
  const [circles, setCircles] = useState<Circle[]>([])
  const [nextIndex, setNextIndex] = useState(0)
  const [errors, setErrors] = useState(0)
  const [connections, setConnections] = useState<[number, number][]>([])
  const [shakeIdx, setShakeIdx] = useState<number | null>(null)
  const startTime = useRef<number>(0)
  const partAResult = useRef<PartResult | null>(null)
  const errorsRef = useRef(0)

  useEffect(() => {
    errorsRef.current = errors
  }, [errors])

  useEffect(() => {
    if (phase === 'a') {
      setCircles(generateCircles(partALabels(partACount)))
      setNextIndex(0); setErrors(0); setConnections([]); startTime.current = 0
    }
    if (phase === 'b') {
      setCircles(generateCircles(partBLabels()))
      setNextIndex(0); setErrors(0); setConnections([]); startTime.current = 0
    }
  }, [phase, partACount])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || circles.length === 0) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

    ctx.strokeStyle = '#8B9E77'
    ctx.lineWidth = 2
    connections.forEach(([from, to]) => {
      ctx.beginPath()
      ctx.moveTo(circles[from].x, circles[from].y)
      ctx.lineTo(circles[to].x, circles[to].y)
      ctx.stroke()
    })

    circles.forEach((c, i) => {
      const done = i < nextIndex
      const isNext = i === nextIndex
      ctx.beginPath()
      ctx.arc(c.x, c.y, CIRCLE_R, 0, Math.PI * 2)
      ctx.fillStyle = done ? '#8B9E77' : '#EDE4D3'
      ctx.fill()
      ctx.strokeStyle = i === shakeIdx ? '#C4937A' : isNext ? '#C4937A' : done ? '#8B9E77' : '#3D353040'
      ctx.lineWidth = isNext || i === shakeIdx ? 2.5 : 1.5
      ctx.stroke()
      ctx.fillStyle = done ? '#fff' : '#3D3530'
      ctx.font = '13px JetBrains Mono, monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(c.label, c.x, c.y)
    })
  }, [circles, connections, nextIndex, shakeIdx])

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
      if (nextIndex > 0) setConnections(prev => [...prev, [nextIndex - 1, nextIndex]])
      const newNext = nextIndex + 1
      setNextIndex(newNext)

      if (newNext >= circles.length) {
        const elapsed = performance.now() - startTime.current
        if (phase === 'a') {
          partAResult.current = { timeMs: elapsed, errors: errorsRef.current }
          setPhase('inst-b')
        } else {
          const existing = JSON.parse(sessionStorage.getItem('testData') || '{}')
          sessionStorage.setItem('testData', JSON.stringify({
            ...existing,
            tmtATimeMs: partAResult.current!.timeMs,
            tmtBTimeMs: elapsed,
            tmtAErrors: partAResult.current!.errors,
            tmtBErrors: errorsRef.current,
          }))
          router.push('/complete')
        }
      }
    } else {
      setErrors(e => e + 1)
      setShakeIdx(hit.index)
      setTimeout(() => setShakeIdx(null), 400)
    }
  }

  if (!participant) return null

  if (phase === 'inst-a') {
    return (
      <InstructionScreen
        title="Trail Making Test — Part A"
        estimatedTime="5 minutes"
        instructions={[
          `You will see ${partACount} numbered circles.`,
          "Connect them in order: 1 → 2 → 3 → ... as fast as possible.",
          "Click a circle to connect it. Timer starts on your first click.",
          "Wrong clicks count as errors but the timer keeps running.",
        ]}
        onReady={() => setPhase('a')}
      />
    )
  }

  if (phase === 'inst-b') {
    return (
      <InstructionScreen
        title="Trail Making Test — Part B"
        estimatedTime="5 minutes"
        instructions={[
          "Now alternate between numbers and letters in order.",
          "Sequence: 1 → A → 2 → B → 3 → C → ...",
          "Same rules: click to connect, timer starts on first click.",
        ]}
        onReady={() => setPhase('b')}
      />
    )
  }

  return (
    <div className="page-container">
      <div className="flex items-center gap-6 mb-4 text-sm text-ink/60">
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
git commit -m "feat: Trail Making Test Part A and B"
git push
```

---

## Task B-7: Completion page

**Files:**
- Create: `src/components/CompletionPage.tsx`
- Create: `src/app/complete/page.tsx`

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
        if (d.ok) { sessionStorage.removeItem('testData'); setStatus('success') }
        else setStatus('error')
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
              Thank you for participating. Your responses have been recorded.
              You may now close this tab.
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
git commit -m "feat: completion page with submission status"
git push
```

---

## Task B-8: Researcher dashboard

**Files:**
- Create: `src/components/researcher/ResearcherDashboard.tsx`
- Create: `src/app/researcher/page.tsx`

**Step 1: Create ResearcherDashboard**

Create `src/components/researcher/ResearcherDashboard.tsx`:
```typescript
'use client'
import { useState } from 'react'
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
  const maxParticipants = Number(data?.config?.max_participants ?? 40)
  const incomplete = rows.filter(r => r[4] === 'No')

  return (
    <div className="min-h-screen bg-parchment p-6 font-mono">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">Researcher Dashboard</h1>
          <a href="/settings" className="text-sm text-ink/60 hover:text-ink underline">Settings →</a>
        </div>

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

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Pre complete', value: preCount },
            { label: 'Post complete', value: postCount },
            { label: 'Target', value: maxParticipants },
          ].map(s => (
            <Card key={s.label} className="text-center">
              <p className="text-3xl font-bold text-sage">{s.value}</p>
              <p className="text-xs text-ink/60 mt-1">{s.label}</p>
            </Card>
          ))}
        </div>

        {incomplete.length > 0 && (
          <Card className="mb-6 border border-terracotta/30 bg-terracotta/5">
            <p className="text-sm font-medium text-terracotta mb-2">⚠ Incomplete ({incomplete.length})</p>
            {incomplete.map((r, i) => (
              <p key={i} className="text-xs text-ink/70">{r[0]} — session {r[2] === '1' ? 'Pre' : 'Post'}</p>
            ))}
          </Card>
        )}

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

**Step 2: Create page**

Create `src/app/researcher/page.tsx`:
```typescript
import { ResearcherDashboard } from '@/components/researcher/ResearcherDashboard'
export default function Page() { return <ResearcherDashboard /> }
```

**Step 3: Commit**
```bash
git add src/app/researcher/ src/components/researcher/ResearcherDashboard.tsx
git commit -m "feat: researcher dashboard"
git push
```

---

## Task B-9: Settings page

**Files:**
- Create: `src/components/researcher/SettingsPage.tsx`
- Create: `src/app/settings/page.tsx`

**Step 1: Create SettingsPage**

Create `src/components/researcher/SettingsPage.tsx`:
```typescript
'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { StudyConfig } from '@/lib/types'

const FIELDS: { key: keyof StudyConfig; label: string; help: string; type: 'text' | 'number' | 'select' }[] = [
  { key: 'session_mode', label: 'Session Mode', help: 'pre = Pre-Detox  |  post = Post-Detox', type: 'select' },
  { key: 'study_title', label: 'Study Title', help: 'Displayed on the participant landing page', type: 'text' },
  { key: 'researcher_name', label: 'Researcher Name', help: 'Displayed in the dashboard', type: 'text' },
  { key: 'max_participants', label: 'Target Participants', help: 'Soft cap shown in dashboard stats', type: 'number' },
  { key: 'stroop_test_trials', label: 'Stroop — Test Trials', help: 'Total test trials (must be even, default 48)', type: 'number' },
  { key: 'stroop_practice_trials', label: 'Stroop — Practice Trials', help: 'Practice trials with feedback (default 6)', type: 'number' },
  { key: 'tmt_part_a_count', label: 'TMT — Part A Circles', help: 'Number of numbered circles (default 25)', type: 'number' },
]

export function SettingsPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [config, setConfig] = useState<StudyConfig | null>(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function login() {
    const res = await fetch('/api/config', { headers: { 'x-researcher-password': password } })
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

  return (
    <div className="min-h-screen bg-parchment p-6 font-mono">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">Study Settings</h1>
          <a href="/researcher" className="text-sm text-ink/60 hover:text-ink underline">← Dashboard</a>
        </div>
        <Card>
          <div className="space-y-5">
            {FIELDS.map(f => (
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
                      [f.key]: f.type === 'number' ? parseInt(e.target.value) : e.target.value,
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

**Step 3: Commit and push**
```bash
git add src/app/settings/ src/components/researcher/SettingsPage.tsx
git commit -m "feat: settings page for researcher"
git push
```

---

## Plan B complete

All frontend components are pushed to `feature/frontend`.

**Next step:** Once Plan A is also done, merge both branches and deploy:
```bash
git checkout main
git merge feature/backend
git merge feature/frontend
git push
```

Then do a full end-to-end walkthrough:
1. Open the Vercel deployment URL
2. Enter a test participant ID → confirm group + session display
3. Complete all 3 tests
4. Verify data in Google Sheets (Results tab + Stroop_Trials tab)
5. Open `/researcher` → toggle session mode
6. Open `/settings` → change a value → verify Config tab updates
