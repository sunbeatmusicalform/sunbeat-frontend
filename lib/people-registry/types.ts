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
  | { ok: true; status: "created"; record_id: string; created_at: string }
  | { ok: false; status: "conflict"; message: string }
  | {
      ok: false;
      status: "invalid";
      issues: PeopleRegistryValidationIssue[];
      message: string;
    }
  | { ok: false; status: "error"; message: string };

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
  /**
   * Ponto de extensão para futura integração Airtable por workflow.
   * Quando o sync for implementado, preencher com { baseId, tableId }
   * correspondente ao workflow deste profile.
   * Hoje: null em todos os profiles ativos.
   */
  airtableSyncHook: null | { baseId: string; tableId: string };
};
