/* Adaptador do formulário de pessoas → PeopleRegistryPayload.
   Implementa docs/people-invite-front-mapping.md (backend, PR #37):
   o envelope do POST /people-registry/invites/{token}/records exige
   workspace_slug/profile estruturais + grupos party/contact/address/
   banking/additional_info/meta. Valores vazios são omitidos.
   `consentTruth` é controle de UI e NÃO é enviado. */

import type { FormValues } from '../engine/types'

export interface InviteStructural {
  workspace_slug: string
  profile: string
}

function clean(value: unknown): string | undefined {
  const s = String(value ?? '').trim()
  return s || undefined
}

function pick(values: FormValues, keys: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const k of keys) {
    const v = clean(values[k])
    if (v !== undefined) out[k] = v
  }
  return out
}

export function buildPersonPayload(values: FormValues, structural: InviteStructural) {
  const isPf = values.party_kind !== 'pj'

  const party: Record<string, unknown> = {
    party_kind: isPf ? 'pf' : 'pj',
    display_name: clean(isPf ? values.display_name : values.display_name_pj),
    legal_name: clean(isPf ? values.legal_name : values.legal_name_pj),
    document_id: clean(isPf ? values.document_id : values.document_id_pj),
    roles: Array.isArray(values.roles) ? (values.roles as string[]).filter(Boolean) : [],
  }
  if (isPf) {
    const stage = clean(values.stage_name)
    if (stage) party.stage_name = stage
  } else {
    const trade = clean(values.trade_name)
    if (trade) party.trade_name = trade
  }
  if (!party.document_id) delete party.document_id

  const contact = pick(values, ['email_primary', 'phone_primary', 'website', 'instagram'])
  const address = pick(values, ['country', 'state_region', 'city', 'postal_code', 'address_line_1'])
  const banking = pick(values, [
    'pix_key', 'bank_name', 'bank_agency', 'account_number',
    'account_holder_name', 'account_holder_document_id',
  ])
  const additionalInfo = pick(values, ['manager_name', 'label_name', 'notes_internal', 'roles_other'])

  return {
    workspace_slug: structural.workspace_slug,
    profile: structural.profile,
    workflow_type: 'people_registry',
    party,
    contact,
    address,
    banking,
    additional_info: additionalInfo,
    meta: { form_version: 'people_invite_v1' },
  }
}

export interface ParticipationPayload {
  confirmation_status?: string
  musical_role?: string
  remuneration_type?: string
  participation_percent?: number
  fixed_amount?: number
  notes?: string
}

export function buildInviteEnvelope(
  values: FormValues,
  structural: InviteStructural,
  participation: ParticipationPayload = {},
) {
  return {
    person: buildPersonPayload(values, structural),
    participation,
  }
}
