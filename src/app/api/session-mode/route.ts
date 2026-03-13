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
