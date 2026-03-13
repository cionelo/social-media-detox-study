'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface DashboardData {
  rows: string[][]
  config: Record<string, unknown>
}

export function ResearcherDashboard() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<DashboardData | null>(null)
  const [mode, setMode] = useState<'pre' | 'post'>('pre')
  const [toggling, setToggling] = useState(false)
  const [toggleMsg, setToggleMsg] = useState('')

  async function login() {
    setError('')
    const res = await fetch('/api/researcher/results', {
      headers: { 'x-researcher-password': password },
    })
    if (res.status === 401) { setError('Wrong password'); return }
    const d: DashboardData = await res.json()
    setData(d)
    setMode((d.config.session_mode as 'pre' | 'post') ?? 'pre')
    setAuthed(true)
  }

  async function toggleMode() {
    setToggling(true)
    setToggleMsg('')
    const newMode: 'pre' | 'post' = mode === 'pre' ? 'post' : 'pre'
    const res = await fetch('/api/session-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-researcher-password': password },
      body: JSON.stringify({ mode: newMode }),
    })
    if (res.ok) {
      setMode(newMode)
      setToggleMsg(`Switched to ${newMode === 'pre' ? 'Pre-Detox' : 'Post-Detox'}`)
      setTimeout(() => setToggleMsg(''), 3000)
    }
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

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">Researcher Dashboard</h1>
          <a href="/settings" className="text-sm text-ink/60 hover:text-ink underline transition-colors">
            Settings →
          </a>
        </div>

        {/* Session toggle */}
        <Card className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs text-ink/50 mb-1 uppercase tracking-wider">Current session</p>
              <p className={`text-3xl font-bold tracking-wide ${mode === 'pre' ? 'text-sage' : 'text-terracotta'}`}>
                {mode === 'pre' ? 'PRE-DETOX' : 'POST-DETOX'}
              </p>
              {toggleMsg && <p className="text-xs text-sage mt-1">{toggleMsg} ✓</p>}
            </div>
            <Button onClick={toggleMode} disabled={toggling} variant="secondary" className="shrink-0">
              {toggling ? 'Switching...' : `Switch to ${mode === 'pre' ? 'Post' : 'Pre'}-Detox`}
            </Button>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Pre-Detox complete', value: preCount, of: maxParticipants },
            { label: 'Post-Detox complete', value: postCount, of: maxParticipants },
            { label: 'Target participants', value: maxParticipants, of: null },
          ].map(s => (
            <Card key={s.label} className="text-center">
              <p className="text-3xl font-bold text-sage">{s.value}</p>
              {s.of && <p className="text-xs text-ink/40 mt-0.5">of {s.of}</p>}
              <p className="text-xs text-ink/60 mt-1">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Incomplete flag */}
        {incomplete.length > 0 && (
          <Card className="mb-6 border border-terracotta/30 bg-terracotta/5">
            <p className="text-sm font-medium text-terracotta mb-2">
              ⚠ Incomplete submissions ({incomplete.length})
            </p>
            {incomplete.map((r, i) => (
              <p key={i} className="text-xs text-ink/70 font-mono">
                {r[0]} — {r[2] === '1' ? 'Pre-Detox' : 'Post-Detox'} session
              </p>
            ))}
          </Card>
        )}

        {/* Submissions table */}
        <Card>
          <h3 className="text-sm font-medium mb-3">All Submissions ({rows.length})</h3>
          {rows.length === 0 ? (
            <p className="text-sm text-ink/50">No submissions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-ink/10">
                    {['Participant ID', 'Group', 'Session', 'Completed', 'Timestamp'].map(h => (
                      <th key={h} className="text-left py-2 pr-4 text-ink/50 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b border-ink/5 hover:bg-parchment/60 transition-colors">
                      <td className="py-2 pr-4 font-medium">{r[0]}</td>
                      <td className="py-2 pr-4">{r[1]}</td>
                      <td className="py-2 pr-4">{r[2] === '1' ? 'Pre-Detox' : 'Post-Detox'}</td>
                      <td className={`py-2 pr-4 font-medium ${r[4] === 'No' ? 'text-terracotta' : 'text-sage'}`}>
                        {r[4]}
                      </td>
                      <td className="py-2 text-ink/50">{r[3]?.slice(0, 16).replace('T', ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
