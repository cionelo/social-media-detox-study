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
