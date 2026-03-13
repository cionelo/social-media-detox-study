export const dynamic = 'force-dynamic'

import { getConfig } from '@/lib/sheets'
import { TrailMakingTest } from '@/components/tests/TrailMakingTest'

export default async function Page() {
  const config = await getConfig()
  return <TrailMakingTest partACount={config.tmt_part_a_count} />
}
