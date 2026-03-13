export const dynamic = 'force-dynamic'

import { getConfig } from '@/lib/sheets'
import { StroopTest } from '@/components/tests/StroopTest'

export default async function Page() {
  const config = await getConfig()
  return (
    <StroopTest
      testTrials={config.stroop_test_trials}
      practiceTrials={config.stroop_practice_trials}
    />
  )
}
