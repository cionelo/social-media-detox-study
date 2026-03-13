const REVERSE_ITEMS = [2, 4, 7, 8, 9] // 0-indexed: items 3,5,8,9,10

export function scoreRosenbergItem(value: number, index: number): number {
  // value: 0=Strongly Agree, 1=Agree, 2=Disagree, 3=Strongly Disagree
  if (REVERSE_ITEMS.includes(index)) return value
  return 3 - value
}

export function scoreRosenberg(responses: number[]): number {
  return responses.reduce((sum, val, i) => sum + scoreRosenbergItem(val, i), 0)
}

export function calcStroopStats(
  rtsMs: number[],
  corrects?: boolean[]
): { mean: number; sd: number; accuracy: number } {
  const n = rtsMs.length
  const meanMs = rtsMs.reduce((a, b) => a + b, 0) / n
  const variance = rtsMs.reduce((sum, rt) => sum + Math.pow(rt - meanMs, 2), 0) / n
  return {
    mean: meanMs / 1000,
    sd: Math.sqrt(variance) / 1000,
    accuracy: corrects ? corrects.filter(Boolean).length / corrects.length : 1,
  }
}

export function calcTmtStats(aTimeS: number, bTimeS: number, aErrors: number, bErrors: number) {
  return { aTime: aTimeS, bTime: bTimeS, aErrors, bErrors, bMinusA: bTimeS - aTimeS }
}
