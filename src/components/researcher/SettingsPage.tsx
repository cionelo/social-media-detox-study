'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { StudyConfig } from '@/lib/types'

const FIELDS: {
  key: keyof StudyConfig
  label: string
  help: string
  type: 'text' | 'number' | 'select'
}[] = [
  {
    key: 'session_mode',
    label: 'Session Mode',
    help: 'Controls which session participants are currently completing.',
    type: 'select',
  },
  {
    key: 'study_title',
    label: 'Study Title',
    help: 'Shown on the participant landing page.',
    type: 'text',
  },
  {
    key: 'researcher_name',
    label: 'Researcher Name',
    help: 'Shown in the researcher dashboard.',
    type: 'text',
  },
  {
    key: 'max_participants',
    label: 'Target Number of Participants',
    help: 'Used in dashboard stats. Does not block sign-ups.',
    type: 'number',
  },
  {
    key: 'stroop_test_trials',
    label: 'Stroop — Number of Test Trials',
    help: 'Total trials in the real Stroop test. Must be an even number. Default: 48.',
    type: 'number',
  },
  {
    key: 'stroop_practice_trials',
    label: 'Stroop — Number of Practice Trials',
    help: 'Practice trials shown before the real test. Default: 6.',
    type: 'number',
  },
  {
    key: 'tmt_part_a_count',
    label: 'Trail Making Test — Part A Circles',
    help: 'Number of numbered circles in Part A. Default: 25.',
    type: 'number',
  },
]

export function SettingsPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [config, setConfig] = useState<StudyConfig | null>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function login() {
    setError('')
    const res = await fetch('/api/config', {
      headers: { 'x-researcher-password': password },
    })
    if (res.status === 401) { setError('Wrong password'); return }
    setConfig(await res.json())
    setAuthed(true)
  }

  async function save() {
    setSaving(true)
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-researcher-password': password },
      body: JSON.stringify(config),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (!authed) {
    return (
      <div className="page-container">
        <Card className="w-full max-w-sm">
          <h2 className="page-title">Settings</h2>
          <p className="page-subtitle">Enter the researcher password to continue.</p>
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
          <a href="/researcher" className="text-sm text-ink/60 hover:text-ink underline transition-colors">
            ← Dashboard
          </a>
        </div>

        <Card>
          <div className="space-y-6">
            {FIELDS.map(f => (
              <div key={f.key}>
                <label className="block text-sm font-semibold mb-0.5">{f.label}</label>
                <p className="text-xs text-ink/50 mb-2">{f.help}</p>
                {f.type === 'select' ? (
                  <select
                    className="w-full bg-parchment border border-ink/20 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
                    value={String(config![f.key])}
                    onChange={e => setConfig({ ...config!, [f.key]: e.target.value })}
                  >
                    <option value="pre">Pre-Detox (Session 1)</option>
                    <option value="post">Post-Detox (Session 2)</option>
                  </select>
                ) : (
                  <input
                    type={f.type}
                    className="w-full bg-parchment border border-ink/20 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
                    value={String(config![f.key])}
                    onChange={e =>
                      setConfig({
                        ...config!,
                        [f.key]: f.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value,
                      })
                    }
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-3">
            <Button onClick={save} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
            {saved && <span className="text-sm text-sage shrink-0">Saved ✓</span>}
          </div>
        </Card>
      </div>
    </div>
  )
}
