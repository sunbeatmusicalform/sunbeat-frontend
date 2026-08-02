import type { FormValues } from '@/engine/types'

function text(values: FormValues, key: string): string {
  return String(values[key] ?? '').trim()
}

function optional(values: FormValues, key: string): string | null {
  return text(values, key) || null
}

function representative(values: FormValues, prefix: string) {
  return {
    name: text(values, `${prefix}_name`),
    phone: text(values, `${prefix}_phone`),
    email: text(values, `${prefix}_email`),
  }
}

export function buildCompanyPayload(values: FormValues, workspaceSlug: string, draftToken: string, editToken?: string | null) {
  const contractSameAsLegal = text(values, 'contract_same_as_legal')
  const financialSameAsLegal = text(values, 'financial_same_as_legal')
  const financialSameAsContract = text(values, 'financial_same_as_contract')

  return {
    draft_token: draftToken,
    workspace_slug: workspaceSlug,
    workflow_type: 'company_registry',
    edit_token: editToken || null,
    company_data: {
      document_type: text(values, 'document_type'),
      document_number: text(values, 'document_number'),
      fantasy_name: text(values, 'fantasy_name'),
      legal_name: text(values, 'legal_name'),
      address: text(values, 'address'),
      city: text(values, 'city'),
      state: text(values, 'state'),
      zip_code: text(values, 'zip_code'),
    },
    legal_representative: representative(values, 'legalrep'),
    contract_representative: {
      same_as_legal: contractSameAsLegal || null,
      same_as_contract: null,
      name: contractSameAsLegal === 'no' ? optional(values, 'contract_name') : null,
      phone: contractSameAsLegal === 'no' ? optional(values, 'contract_phone') : null,
      email: contractSameAsLegal === 'no' ? optional(values, 'contract_email') : null,
    },
    financial_representative: {
      same_as_legal: financialSameAsLegal || null,
      same_as_contract: financialSameAsLegal === 'no' ? financialSameAsContract || null : null,
      name: financialSameAsLegal === 'no' && financialSameAsContract === 'no' ? optional(values, 'financial_name') : null,
      phone: financialSameAsLegal === 'no' && financialSameAsContract === 'no' ? optional(values, 'financial_phone') : null,
      email: financialSameAsLegal === 'no' && financialSameAsContract === 'no' ? optional(values, 'financial_email') : null,
    },
    banking_data: {
      bank_name: text(values, 'bank_name'),
      agency: text(values, 'agency'),
      account: text(values, 'account'),
      account_type: text(values, 'account_type'),
      pix_key: optional(values, 'pix_key'),
    },
    meta: {
      form_version: 'company_registry_v1',
      source: `sunbeat:${workspaceSlug}:company_registry:v1`,
      submitted_at: new Date().toISOString(),
    },
  }
}

export async function submitCompany(values: FormValues, workspaceSlug: string, draftToken: string, editToken?: string | null) {
  const response = await fetch('/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
    body: JSON.stringify(buildCompanyPayload(values, workspaceSlug, draftToken, editToken)),
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { detail?: unknown } | null
    const detail = typeof payload?.detail === 'string' ? payload.detail : 'Não foi possível concluir o cadastro da empresa.'
    throw new Error(detail)
  }
  return response.json()
}
