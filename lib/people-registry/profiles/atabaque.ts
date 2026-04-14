// lib/people-registry/profiles/atabaque.ts
// Profile operacional da Atabaque — primeiro case real do People Registry
//
// GUARDRAIL: este arquivo define o perfil da Atabaque para people_registry.
// NÃO altera release_intake, NÃO toca no fluxo legado da Atabaque.
// Quando novos clientes forem adicionados, criar um arquivo equivalente em /profiles/

import type { PeopleRegistryProfileConfig } from "../types";

export const atabaqueRegistryProfile: PeopleRegistryProfileConfig = {
  workspaceSlug: "atabaque",
  workflowType: "people_registry",
  profile: "atabaque_people_v1",
  formTitle: "Cadastro de Pessoas",
  clientLabel: "Atabaque",
  formVersion: "draft_v1",

  availableRoles: [
    { value: "artista", label: "Artista" },
    { value: "produtor", label: "Produtor(a)" },
    { value: "compositor", label: "Compositor(a)" },
    { value: "letrista", label: "Letrista" },
    { value: "interprete", label: "Intérprete" },
    { value: "socio", label: "Sócio(a)" },
    { value: "assessor", label: "Assessor(a)" },
    { value: "gravadora", label: "Gravadora" },
    { value: "distribuidora", label: "Distribuidora" },
    { value: "editora", label: "Editora" },
    { value: "contato", label: "Contato" },
  ],

  showSections: {
    contact: true,
    address: true,
    banking: true,
    additionalInfo: true,
  },

  // TODO: Airtable sync — quando o sync for ativado, preencher com:
  // { baseId: "<AIRTABLE_BASE_ID>", tableId: "<AIRTABLE_TABLE_ID>" }
  // O trigger deve ser disparado por workflow_type = "people_registry" e profile = "atabaque_people_v1"
  // Referência: app/services/airtable.py já tem a infraestrutura base
  airtableSyncHook: null,
};
