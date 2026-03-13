'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'

export function CompletionPage() {
  const [status, setStatus] = useState<'submitting' | 'success' | 'error'>('submitting')

  useEffect(() => {
    const participant = JSON.parse(sessionStorage.getItem('participant') || 'null')
    const testData = JSON.parse(sessionStorage.getItem('testData') || 'null')

    if (!participant || !testData) {
      setStatus('error')
      return
    }

    fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantId: participant.id,
        group: participant.group,
        session: participant.session,
        ...testData,
      }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          sessionStorage.removeItem('testData')
          setStatus('success')
        } else {
          setStatus('error')
        }
      })
      .catch(() => setStatus('error'))
  }, [])

  return (
    <div className="page-container">
      <Card className="w-full max-w-md text-center py-10">
        {status === 'submitting' && (
          <>
            <div className="text-4xl mb-4">⏳</div>
            <h2 className="text-lg font-medium">Saving your results...</h2>
            <p className="text-sm text-ink/60 mt-2">Please don't close this tab.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-4xl mb-4 text-sage">✓</div>
            <h2 className="text-xl font-semibold text-sage">All done!</h2>
            <p className="text-sm text-ink/60 mt-3 leading-relaxed max-w-xs mx-auto">
              Thank you for participating. Your responses have been recorded successfully.
              You may now close this tab.
            </p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-4xl mb-4">⚠</div>
            <h2 className="text-lg font-medium text-terracotta">Something went wrong</h2>
            <p className="text-sm text-ink/60 mt-2 max-w-xs mx-auto">
              Please contact the researcher. Your data may not have been saved.
            </p>
          </>
        )}
      </Card>
    </div>
  )
}
