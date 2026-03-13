import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Props {
  title: string
  instructions: string[]
  onReady: () => void
  estimatedTime?: string
}

export function InstructionScreen({ title, instructions, onReady, estimatedTime }: Props) {
  return (
    <div className="page-container">
      <Card className="w-full max-w-lg">
        <h2 className="text-xl font-semibold mb-1">{title}</h2>
        {estimatedTime && <p className="text-xs text-ink/50 mb-4">~{estimatedTime}</p>}
        <ul className="space-y-2 mb-6">
          {instructions.map((line, i) => (
            <li key={i} className="text-sm text-ink/80 flex gap-2">
              <span className="text-sage mt-0.5">→</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <Button onClick={onReady} className="w-full">I'm ready →</Button>
      </Card>
    </div>
  )
}
