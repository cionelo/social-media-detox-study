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

  try {
    await appendResults(results)
    await appendStroopTrials(allStroopTrials)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[submit] error:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
