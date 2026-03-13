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
  const half = Math.floor(count / 2)
  for (let i = 0; i < half; i++) {
    const word = WORDS[i % WORDS.length]
    trials.push({ word, inkColor: word, condition: 'congruent' })
  }
  for (let i = 0; i < half; i++) {
    const word = WORDS[i % WORDS.length]
    const others = WORDS.filter(w => w !== word) as Color[]
    trials.push({ word, inkColor: others[i % others.length], condition: 'incongruent' })
  }
  return trials.sort(() => Math.random() - 0.5)
}

export function StroopTest({ testTrials = 48, practiceTrials = 6 }: {
  testTrials?: number
  practiceTrials?: number
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
          "Your task: identify the INK COLOR, not the word itself.",
          "Example: the word RED written in blue ink → tap BLUE.",
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
          "Great work! The real test begins next.",
          "Same rules — identify the ink color as fast as you can.",
          "No feedback will be shown during the test.",
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
        <p className="text-xs text-ink/50 mb-4 font-mono">
          Practice — {current + 1} / {trials.length}
        </p>
      )}
      {progress !== null && (
        <div className="w-full max-w-lg mb-4">
          <div className="h-1.5 bg-cream rounded-full overflow-hidden">
            <div
              className="h-full bg-sage rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      <Card className="w-full max-w-lg text-center">
        <div className="py-10">
          <span
            className="text-6xl font-bold tracking-widest select-none"
            style={{ color: COLORS[trial.inkColor] }}
          >
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
              className="py-3.5 text-sm"
              style={{ borderColor: COLORS[color] + '50' }}
            >
              <span className="mr-1.5" style={{ color: COLORS[color] }}>■</span>
              {color}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  )
}
