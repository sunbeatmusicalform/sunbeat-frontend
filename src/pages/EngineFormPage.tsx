import { FormShell } from '@/engine/FormShell'
import type { FormConfig } from '@/engine/types'
import { useParams } from 'react-router'
import { useRef } from 'react'
import { submitClearance } from '@/forms/clearanceAdapter'
import { submitCompany } from '@/forms/companyAdapter'

export default function EngineFormPage({ config, workflowType }: { config: FormConfig; workflowType: string }) {
  const { workspace = 'atabaque' } = useParams()
  const draftToken = useRef(crypto.randomUUID())
  const onSubmit = (values: import('@/engine/types').FormValues) => {
    if (workflowType === 'rights_clearance') return submitClearance(values, workspace, draftToken.current).then(() => undefined)
    if (workflowType === 'company_registry') return submitCompany(values, workspace, draftToken.current).then(() => undefined)
    return Promise.resolve()
  }
  return <FormShell config={config} workspaceSlug={workspace} workflowType={workflowType} onSubmit={onSubmit} />
}
