import { NextRequest, NextResponse } from 'next/server'
import { getAllResults, getConfig } from '@/lib/sheets'

export async function GET(req: NextRequest) {
  if (req.headers.get('x-researcher-password') !== process.env.RESEARCHER_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const [rows, config] = await Promise.all([getAllResults(), getConfig()])
  return NextResponse.json({ rows: rows.slice(1), config })
}
