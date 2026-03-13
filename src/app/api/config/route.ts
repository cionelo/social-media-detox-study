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
