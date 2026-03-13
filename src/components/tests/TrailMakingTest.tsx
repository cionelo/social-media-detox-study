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
  const pad = CIRCLE_R + 10
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

function partALabels(count: number): string[] {
  return Array.from({ length: count }, (_, i) => String(i + 1))
}

function partBLabels(): string[] {
  const labels: string[] = []
  const lets = 'ABCDEFGHIJKLM'.split('')
  for (let i = 0; i < 13; i++) {
    labels.push(String(i + 1))
    labels.push(lets[i])
  }
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

  useEffect(() => { errorsRef.current = errors }, [errors])

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

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || circles.length === 0) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

    // Connections
    ctx.strokeStyle = '#8B9E77'
    ctx.lineWidth = 2.5
    connections.forEach(([from, to]) => {
      ctx.beginPath()
      ctx.moveTo(circles[from].x, circles[from].y)
      ctx.lineTo(circles[to].x, circles[to].y)
      ctx.stroke()
    })

    // Circles
    circles.forEach((c, i) => {
      const done = i < nextIndex
      const isNext = i === nextIndex
      const isShaking = i === shakeIdx

      ctx.beginPath()
      ctx.arc(c.x, c.y, CIRCLE_R, 0, Math.PI * 2)
      ctx.fillStyle = done ? '#8B9E77' : '#EDE4D3'
      ctx.fill()
      ctx.strokeStyle = isShaking ? '#C4937A' : isNext ? '#C4937A' : done ? '#6d8060' : '#3D353030'
      ctx.lineWidth = isNext || isShaking ? 2.5 : 1.5
      ctx.stroke()

      ctx.fillStyle = done ? '#fff' : '#3D3530'
      ctx.font = `600 13px "JetBrains Mono", monospace`
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

    const hit = circles.find(c => Math.hypot(c.x - x, c.y - y) <= CIRCLE_R + 5)
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
          `You will see ${partACount} numbered circles scattered on screen.`,
          "Connect them in order as fast as possible: 1 → 2 → 3 → ...",
          "Click a circle to connect it. The timer starts on your first click.",
          "Wrong clicks count as errors — the timer keeps running.",
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
          "Now you'll see circles with both numbers and letters.",
          "Alternate between them in order: 1 → A → 2 → B → 3 → C → ...",
          "Same rules: click to connect, timer starts on your first click.",
        ]}
        onReady={() => setPhase('b')}
      />
    )
  }

  return (
    <div className="page-container">
      <div className="flex items-center gap-6 mb-4 text-sm text-ink/60 font-mono">
        <span>Part {phase.toUpperCase()}</span>
        <span>
          Next: <strong className="text-ink">{circles[nextIndex]?.label}</strong>
        </span>
        <span>
          Errors: <strong className="text-terracotta">{errors}</strong>
        </span>
      </div>
      <div
        className="bg-cream rounded-2xl shadow-card overflow-hidden w-full"
        style={{ maxWidth: CANVAS_W }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onClick={handleCanvasClick}
          className="w-full cursor-pointer touch-none"
        />
      </div>
    </div>
  )
}
