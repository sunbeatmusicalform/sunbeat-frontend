// lib/people-registry/types.ts
// Tipos centrais do People Registry — multi-tenant, profile-driven
// Não misturar com release_intake ou AI Gateway

export type PartyKind = "pf" | "pj";

// ─── Form values (estado interno do formulário) ─────────────────────────────

export type PeopleRegistryFormValues = {
  // Identificação — compartilhado PF e PJ
  party_kind: PartyKind;
  display_name: string;
  legal_name: string;
  document_id: string;
  roles: string[];

  // Identificação — PF
  stage_name: string;

  // Identificação — PJ
  trade_name: string;

  // Contato
  email_primary: string;
  phone_primary: string;
  website: string;
  instagram: string;

  // Endereço
  country: string;
  state_region: string;
  city: string;
  postal_code: string;
  address_line_1: string;

  // Dados bancários
  pix_key: string;
  bank_name: string;
  bank_agency: string;
  account_number: string;
  account_holder_name: string;
  account_holder_document_id: string;

  // Informações adicionais
  manager_name: string;
  label_name: string;
  notes_internal: string;
};

// ─── API payload (o que enviamos para POST /people-registry/records) ─────────

export type PeopleRegistryApiPayload = {
  workspace_slug: string;
  workflow_type: "people_registry";
  profile: string;
  party: {
    party_kind: PartyKind;
    display_name: string;
    legal_name: string;
    stage_name?: string;
    trade_name?: string;
    document_id?: string;
    roles: string[];
  };
  contact: {
    email_primary?: string;
    phone_primary?: string;
    website?: string;
    instagram?: string;
  };
  address: {
    country?: string;
    state_region?: string;
    city?: string;
    postal_code?: string;
    address_line_1?: string;
  };
  banking: {
    pix_key?: string;
    bank_name?: string;
    bank_agency?: string;
    account_number?: string;
    account_holder_name?: string;
    account_holder_document_id?: string;
  };
  additional_info: {
    manager_name?: string;
    label_name?: string;
    notes_internal?: string;
    external_refs?: Record<string, unknown>;
  };
  meta: {
    form_version: string;
    source: string;
    submitted_at: string;
  };
};

// ─── Resultado do submit ──────────────────────────────────────────────────────

export type PeopleRegistryValidationIssue = {
  field: string;
  message: string;
};

export type PeopleRegistrySubmitResult =
  | {
      ok: true;
      status: "created";
      record_id: string;
      created_at: string;
      invite_status?: string;
      invite_message?: string;
    }
  | { ok: false; status: "conflict"; message: string }
  | {
      ok: false;
      status: "invalid";
      issues: PeopleRegistryValidationIssue[];
      message: string;
    }
  | { ok: false; status: "error"; message: string };

// Public read-only lookup response. Keep this shape sanitized.
export type PeopleRegistryLookupConfidence = "exact" | "partial";

export type PeopleRegistryLookupItem = {
  id: string;
  displayName: string;
  roles: string[];
  source: "people_registry";
  confidence: PeopleRegistryLookupConfidence;
};

export type PeopleRegistryLookupResponse = {
  ok: true;
  items: PeopleRegistryLookupItem[];
};

// ─── People invite contextual de Clearance ───────────────────────────────────

export type PeopleRegistryInviteContext = Record<string, unknown> & {
  clearance_case_name?: string;
  clearance_item_name?: string;
  project_title?: string;
  track_title?: string;
  party_name?: string;
  requested_role?: string;
  role?: string;
  email?: string;
  signing_email?: string;
  remuneration?: string;
  remuneration_source?: "gestor" | "label" | string;
  remuneration_type?: string;
  participation_percent?: number | string;
  fixed_amount?: number | string;
  notes?: string;
  visible_sections?: string[];
};

export type PeopleRegistryInvite = {
  token: string;
  status: string;
  workspace_slug: string;
  profile: string;
  airtable_clearance_part_id: string;
  invite_url: string;
  context: PeopleRegistryInviteContext;
  people_registry_record_id?: string | null;
  people_airtable_record_id?: string | null;
  last_error?: string | null;
  expires_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  opened_at?: string | null;
  submitted_at?: string | null;
};

export type PeopleRegistryInviteListResponse = {
  ok: boolean;
  items: PeopleRegistryInvite[];
  total: number;
};

export type PeopleRegistryInviteCreateRequest = {
  workspace_slug: string;
  profile: string;
  airtable_clearance_part_id?: string | null;
  context: PeopleRegistryInviteContext;
  expires_at?: string | null;
  expires_in_days?: number | null;
};

export type PeopleRegistryInviteCreateResponse = {
  ok: boolean;
  status?: string;
  invite?: PeopleRegistryInvite | null;
  error?: { code?: string; message?: string; stage?: string } | null;
};

export type PeopleRegistryInviteEmailResponse = {
  ok: boolean;
  invite?: PeopleRegistryInvite | null;
  provider_message_id?: string | null;
  error?: { code?: string; message?: string; stage?: string } | null;
};

export type PeopleRegistryInviteParticipation = {
  confirmation_status: "confirmado" | "em_negociacao";
  musical_role?: string;
  remuneration_type?: string;
  participation_percent?: number;
  fixed_amount?: number;
  notes?: string;
};

// ─── Profile config (fundação multi-tenant) ──────────────────────────────────

export type RoleOption = {
  value: string;
  label: string;
};

export type PeopleRegistryProfileConfig = {
  workspaceSlug: string;
  workflowType: "people_registry";
  profile: string;
  formTitle: string;
  clientLabel: string;
  formVersion: string;
  availableRoles: RoleOption[];
  showSections: {
    contact: boolean;
    address: boolean;
    banking: boolean;
    additionalInfo: boolean;
  };
  /** URL do logo do workspace — exibido no header do formulário. */
  logoUrl?: string | null;
  /** URL do badge/ícone pequeno — exibido ao lado do clientLabel. */
  badgeUrl?: string | null;
  /** Tokens de tema visual. Se omitido, usa paleta neutra padrão. */
  theme?: {
    formBg: string;
    primary: string;
    primaryHover?: string;
  };
  /**
   * Ponto de extensão para futura integração Airtable por workflow.
   * Quando o sync for implementado, preencher com { baseId, tableId }
   * correspondente ao workflow deste profile.
   * Hoje: null em todos os profiles ativos.
   */
  airtableSyncHook: null | { baseId: string; tableId: string };
};
