import { FormShell } from '@/engine/FormShell'
import type { FormConfig } from '@/engine/types'
import { useParams } from 'react-router'
import { useRef } from 'react'
import { submitClearance } from '@/forms/clearanceAdapter'

export default function EngineFormPage({ config, workflowType }: { config: FormConfig; workflowType: string }) {
  const { workspace = 'atabaque' } = useParams()
  const draftToken = useRef(crypto.randomUUID())
  const onSubmit = workflowType === 'rights_clearance'
    ? (values: import('@/engine/types').FormValues) => submitClearance(values, workspace, draftToken.current).then(() => undefined)
    : undefined
  return <FormShell config={config} workspaceSlug={workspace} workflowType={workflowType} onSubmit={onSubmit} />
}
