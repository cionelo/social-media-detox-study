import { getConfig } from '@/lib/sheets'
import { ParticipantEntry } from '@/components/ParticipantEntry'

export default async function Home() {
  const config = await getConfig()
  return <ParticipantEntry studyTitle={config.study_title} />
}
