import { google } from 'googleapis'
import type { StudyConfig, ParticipantLookup, TestResults, StroopTrial, SessionMode } from './types'

function getSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID!

export function parseConfig(rows: string[][]): StudyConfig {
  const map = Object.fromEntries(rows.map(([k, v]) => [k, v]))
  return {
    session_mode: (map.session_mode ?? 'pre') as SessionMode,
    max_participants: parseInt(map.max_participants ?? '40'),
    stroop_test_trials: parseInt(map.stroop_test_trials ?? '48'),
    stroop_practice_trials: parseInt(map.stroop_practice_trials ?? '6'),
    tmt_part_a_count: parseInt(map.tmt_part_a_count ?? '25'),
    study_title: map.study_title ?? 'Social Media Detox Study',
    researcher_name: map.researcher_name ?? '',
  }
}

export async function getConfig(): Promise<StudyConfig> {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Config!A:B',
  })
  return parseConfig((res.data.values ?? []) as string[][])
}

export async function setConfigValue(key: string, value: string): Promise<void> {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Config!A:A',
  })
  const rows = (res.data.values ?? []) as string[][]
  const rowIndex = rows.findIndex(([k]) => k === key)
  if (rowIndex === -1) throw new Error(`Config key not found: ${key}`)
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `Config!B${rowIndex + 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[value]] },
  })
}

export async function lookupParticipant(
  participantId: string,
  session: number
): Promise<ParticipantLookup> {
  const sheets = getSheets()

  const prescreening = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Prescreening!A:Z',
  })
  const psRows = (prescreening.data.values ?? []) as string[][]
  const headers = psRows[0] ?? []
  const idCol = headers.indexOf('participant_id')
  const groupCol = headers.indexOf('group')

  if (idCol === -1 || groupCol === -1) {
    throw new Error('Prescreening sheet missing participant_id or group columns')
  }

  const match = psRows.slice(1).find(row => row[idCol] === participantId)
  if (!match) return { found: false }

  const group = match[groupCol] as 'Heavy' | 'Moderate'

  const results = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Results!A:C',
  })
  const rRows = (results.data.values ?? []) as string[][]
  const alreadySubmitted = rRows.slice(1).some(
    row => row[0] === participantId && row[2] === String(session)
  )

  return { found: true, group, alreadySubmitted }
}

export async function appendResults(results: TestResults): Promise<void> {
  const sheets = getSheets()
  const row = [
    results.participantId,
    results.group,
    results.session,
    new Date().toISOString(),
    results.completed ? 'Yes' : 'No',
    ...results.rseItems,
    results.rseItems.reduce((a, b) => a + b, 0),
    results.stroopConRt,
    results.stroopInconRt,
    results.stroopConRtSd,
    results.stroopInconRtSd,
    results.stroopConAcc,
    results.stroopInconAcc,
    results.stroopInterference,
    results.tmtATime,
    results.tmtBTime,
    results.tmtAErrors,
    results.tmtBErrors,
    results.tmtBMinusA,
  ]
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Results!A1',
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  })
}

export async function appendStroopTrials(trials: StroopTrial[]): Promise<void> {
  const sheets = getSheets()
  const rows = trials.map(t => [
    t.participantId, t.session, t.trialNumber, t.condition, t.rtMs, t.correct,
  ])
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Stroop_Trials!A1',
    valueInputOption: 'RAW',
    requestBody: { values: rows },
  })
}

export async function getAllResults(): Promise<string[][]> {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Results!A:D',
  })
  return (res.data.values ?? []) as string[][]
}
