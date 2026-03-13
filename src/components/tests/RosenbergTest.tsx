'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
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
          <div
            className="h-full bg-sage rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
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
