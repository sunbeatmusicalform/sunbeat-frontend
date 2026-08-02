import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { FormShell } from '@/engine/FormShell'
import type { FormConfig, FormValues } from '@/engine/types'
import { submitClearance } from '@/forms/clearanceAdapter'
import { submitCompany } from '@/forms/companyAdapter'
import type { UploadedFileRef } from '@/lib/intake-api'

type EditData = Record<string, unknown> & { draft_token?: string; assets_references?: { supporting_files?: UploadedFileRef[] } }

function clearanceValues(data: EditData): Partial<FormValues> {
  const requester = (data.requester_identification ?? {}) as Record<string, unknown>
  const requestType = (data.request_type ?? {}) as Record<string, unknown>
  const project = (data.project_context ?? {}) as Record<string, unknown>
  const scope = (data.clearance_scope ?? {}) as Record<string, unknown>
  const assets = (data.assets_references ?? {}) as Record<string, unknown>
  const audiovisual = requestType.clearance_format === 'audiovisual_product_sync'
  return {
    ...requester, ...requestType, ...project, ...scope,
    tracks: Array.isArray(data.tracks) ? data.tracks : [],
    [audiovisual ? 'reference_links_av' : 'reference_links']: assets.reference_links ?? '',
    [audiovisual ? 'additional_notes_av' : 'additional_notes']: assets.additional_notes ?? '',
    consentTruth: true,
  }
}

function companyValues(data: EditData): Partial<FormValues> {
  const company = (data.company_data ?? {}) as Record<string, unknown>
  const legal = (data.legal_representative ?? {}) as Record<string, unknown>
  const contract = (data.contract_representative ?? {}) as Record<string, unknown>
  const financial = (data.financial_representative ?? {}) as Record<string, unknown>
  const banking = (data.banking_data ?? {}) as Record<string, unknown>
  return {
    ...company, ...banking,
    legalrep_name: legal.name ?? '', legalrep_phone: legal.phone ?? '', legalrep_email: legal.email ?? '',
    contract_same_as_legal: contract.same_as_legal ?? '', contract_name: contract.name ?? '', contract_phone: contract.phone ?? '', contract_email: contract.email ?? '',
    financial_same_as_legal: financial.same_as_legal ?? '', financial_same_as_contract: financial.same_as_contract ?? '', financial_name: financial.name ?? '', financial_phone: financial.phone ?? '', financial_email: financial.email ?? '',
    consentTruth: true,
  }
}

export default function EngineFormPage({ config, workflowType }: { config: FormConfig; workflowType: string }) {
  const { workspace = 'atabaque' } = useParams()
  const [params] = useSearchParams()
  const editToken = params.get('edit_token')
  const draftToken = useRef<string>(crypto.randomUUID())
  const [editData, setEditData] = useState<EditData | null>(null)
  const [loading, setLoading] = useState(Boolean(editToken))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!editToken) return
    void fetch(`/submissions/edit/${encodeURIComponent(editToken)}`).then(async (response) => {
      if (!response.ok) throw new Error(response.status === 403 ? 'Este link ainda não foi autorizado ou foi substituído.' : 'Link de edição inválido.')
      const payload = await response.json() as { data: EditData }
      draftToken.current = payload.data.draft_token || draftToken.current
      setEditData(payload.data)
    }).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false))
  }, [editToken])

  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Carregando submissão autorizada…</div>
  if (error) return <div className="flex min-h-screen items-center justify-center px-6 text-center text-sm font-semibold text-red-700">{error}</div>

  const prefill = editData ? (workflowType === 'rights_clearance' ? clearanceValues(editData) : companyValues(editData)) : undefined
  const onSubmit = (values: FormValues) => {
    if (workflowType === 'rights_clearance') return submitClearance(values, workspace, draftToken.current, editToken, editData?.assets_references?.supporting_files ?? []).then(() => undefined)
    if (workflowType === 'company_registry') return submitCompany(values, workspace, draftToken.current, editToken).then(() => undefined)
    return Promise.resolve()
  }
  return <FormShell key={editToken || 'new'} config={config} workspaceSlug={workspace} workflowType={workflowType} prefill={prefill} initialMode={editToken ? 'edit' : 'new'} onSubmit={onSubmit} />
}
