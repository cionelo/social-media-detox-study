'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export interface ParticipantSession {
  id: string
  group: 'Heavy' | 'Moderate'
  session: number
}

export function useParticipantSession(): ParticipantSession | null {
  const router = useRouter()
  const [participant, setParticipant] = useState<ParticipantSession | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('participant')
    if (!stored) { router.replace('/'); return }
    setParticipant(JSON.parse(stored))
  }, [router])

  return participant
}
