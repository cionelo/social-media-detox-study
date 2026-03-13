export type Group = 'Heavy' | 'Moderate'
export type SessionMode = 'pre' | 'post'

export interface ParticipantLookup {
  found: boolean
  group?: Group
  alreadySubmitted?: boolean
}

export interface StudyConfig {
  session_mode: SessionMode
  max_participants: number
  stroop_test_trials: number
  stroop_practice_trials: number
  tmt_part_a_count: number
  study_title: string
  researcher_name: string
}

export interface StroopTrial {
  participantId: string
  session: number
  trialNumber: number
  condition: 'congruent' | 'incongruent'
  rtMs: number
  correct: boolean
}

export interface TestResults {
  participantId: string
  group: Group
  session: number
  completed: boolean
  rseItems: number[]
  stroopConRt: number
  stroopInconRt: number
  stroopConRtSd: number
  stroopInconRtSd: number
  stroopConAcc: number
  stroopInconAcc: number
  stroopInterference: number
  tmtATime: number
  tmtBTime: number
  tmtAErrors: number
  tmtBErrors: number
  tmtBMinusA: number
}
