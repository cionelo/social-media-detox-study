import { parseConfig } from './sheets'

describe('parseConfig', () => {
  it('parses key-value rows into StudyConfig', () => {
    const rows = [
      ['session_mode', 'pre'],
      ['max_participants', '40'],
      ['stroop_test_trials', '48'],
      ['stroop_practice_trials', '6'],
      ['tmt_part_a_count', '25'],
      ['study_title', 'Test Study'],
      ['researcher_name', 'Test Researcher'],
    ]
    const config = parseConfig(rows)
    expect(config.session_mode).toBe('pre')
    expect(config.max_participants).toBe(40)
    expect(config.stroop_test_trials).toBe(48)
    expect(config.study_title).toBe('Test Study')
  })

  it('uses defaults for missing keys', () => {
    const config = parseConfig([])
    expect(config.session_mode).toBe('pre')
    expect(config.max_participants).toBe(40)
  })
})
