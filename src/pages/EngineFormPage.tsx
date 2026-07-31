import { FormShell } from '@/engine/FormShell'
import type { FormConfig } from '@/engine/types'

export default function EngineFormPage({ config }: { config: FormConfig }) {
  return <FormShell config={config} />
}
