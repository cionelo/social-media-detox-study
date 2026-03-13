'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function ParticipantEntry({ studyTitle }: { studyTitle: string }) {
  const router = useRouter()
  const [id, setId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [warning, setWarning] = useState('')
  const [lookupResult, setLookupResult] = useState<{
    group: string; session: number; sessionMode: string
  } | null>(null)

  async function handleLookup() {
    setError(''); setWarning(''); setLoading(true)
    const res = await fetch('/api/lookup-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: id.trim().toUpperCase() }),
    })
    const data = await res.json()
    setLoading(false)
    if (!data.found) {
      setError('ID not found. Please check your ID from the prescreening email.')
      return
    }
    if (data.alreadySubmitted) {
      setWarning('You have already completed this session. Continuing will create a duplicate entry.')
    }
    setLookupResult(data)
  }

  function handleBegin() {
    sessionStorage.setItem('participant', JSON.stringify({
      id: id.trim().toUpperCase(),
      group: lookupResult!.group,
      session: lookupResult!.session,
    }))
    router.push('/test/rosenberg')
  }

  return (
    <div className="page-container">
      <h1 className="page-title">{studyTitle}</h1>
      <p className="page-subtitle">Enter your participant ID to begin.</p>
      <Card className="w-full max-w-md">
        <label className="block text-sm font-medium mb-2">Participant ID</label>
        <input
          className="w-full bg-parchment border border-ink/20 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sage/50 mb-4"
          placeholder="e.g. AB01012001"
          value={id}
          onChange={e => setId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !lookupResult && handleLookup()}
          maxLength={12}
        />
        {error && <p className="text-terracotta text-sm mb-3">{error}</p>}
        {warning && (
          <div className="bg-terracotta/10 border border-terracotta/30 rounded-xl p-3 mb-3">
            <p className="text-sm text-terracotta">{warning}</p>
          </div>
        )}
        {lookupResult && (
          <div className="bg-sage/10 border border-sage/30 rounded-xl p-3 mb-4">
            <p className="text-sm"><span className="font-medium">Group:</span> {lookupResult.group} user</p>
            <p className="text-sm"><span className="font-medium">Session:</span> {lookupResult.sessionMode === 'pre' ? 'Pre-Detox' : 'Post-Detox'}</p>
          </div>
        )}
        {!lookupResult ? (
          <Button onClick={handleLookup} disabled={loading || id.length < 8} className="w-full">
            {loading ? 'Looking up...' : 'Look up ID'}
          </Button>
        ) : (
          <Button onClick={handleBegin} className="w-full">Begin Assessment →</Button>
        )}
      </Card>
    </div>
  )
}
