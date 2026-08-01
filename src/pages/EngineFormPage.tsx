import { FormShell } from '@/engine/FormShell'
import type { FormConfig } from '@/engine/types'
import { useParams } from 'react-router'

export default function EngineFormPage({ config, workflowType }: { config: FormConfig; workflowType: string }) {
  const { workspace = 'atabaque' } = useParams()
  return <FormShell config={config} workspaceSlug={workspace} workflowType={workflowType} />
}
