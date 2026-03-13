import { scoreRosenberg, scoreRosenbergItem, calcStroopStats, calcTmtStats } from './scoring'

describe('scoreRosenbergItem', () => {
  it('scores forward items: SA=3, SD=0', () => {
    expect(scoreRosenbergItem(0, 0)).toBe(3) // item 1, SA → 3
    expect(scoreRosenbergItem(3, 0)).toBe(0) // item 1, SD → 0
  })
  it('scores reverse items: SA=0, SD=3', () => {
    expect(scoreRosenbergItem(0, 2)).toBe(0) // item 3 (reverse), SA → 0
    expect(scoreRosenbergItem(3, 2)).toBe(3) // item 3 (reverse), SD → 3
  })
})

describe('scoreRosenberg', () => {
  it('returns 30 for max self-esteem responses', () => {
    // All "positive SE": SA on forward items (0), SD on reverse items (3)
    const responses = [0, 0, 3, 0, 3, 0, 0, 3, 3, 3]
    expect(scoreRosenberg(responses)).toBe(30)
  })
  it('returns 0 for min self-esteem responses', () => {
    const responses = [3, 3, 0, 3, 0, 3, 3, 0, 0, 0]
    expect(scoreRosenberg(responses)).toBe(0)
  })
})

describe('calcStroopStats', () => {
  it('converts ms to seconds for mean', () => {
    const { mean } = calcStroopStats([500, 600, 700])
    expect(mean).toBeCloseTo(0.6, 5)
  })
  it('returns 0 SD for identical RTs', () => {
    const { sd } = calcStroopStats([500, 500, 500])
    expect(sd).toBe(0)
  })
  it('calculates accuracy', () => {
    const { accuracy } = calcStroopStats([400, 500], [true, false])
    expect(accuracy).toBe(0.5)
  })
})

describe('calcTmtStats', () => {
  it('calculates B minus A', () => {
    const result = calcTmtStats(30.0, 55.0, 0, 2)
    expect(result.bMinusA).toBeCloseTo(25.0, 5)
  })
})
