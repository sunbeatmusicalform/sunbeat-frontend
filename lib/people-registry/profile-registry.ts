// lib/people-registry/profile-registry.ts
// Registro central de profiles do People Registry
// Para adicionar novo cliente: criar profile em /profiles/ e registrar aqui

import type { PeopleRegistryProfileConfig } from "./types";
import { atabaqueRegistryProfile } from "./profiles/atabaque";

const PEOPLE_REGISTRY_PROFILES: Record<string, PeopleRegistryProfileConfig> = {
  atabaque: atabaqueRegistryProfile,
  // próximos clientes: adicionar aqui seguindo o mesmo padrão
  // exemplo: "novo-cliente": novoclienteRegistryProfile,
};

export function getPeopleRegistryProfile(
  workspaceSlug: string
): PeopleRegistryProfileConfig | null {
  return PEOPLE_REGISTRY_PROFILES[workspaceSlug] ?? null;
}

export function getDefaultPeopleRegistryProfile(): PeopleRegistryProfileConfig {
  return atabaqueRegistryProfile;
}
