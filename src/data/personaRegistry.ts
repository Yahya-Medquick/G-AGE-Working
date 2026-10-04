import { EXPERTS, EXPERTS_PK } from "./experts";
import type { ExpertPersona } from "../types";

export type PersonaVariant = "global" | "pk";

export interface RegistryPersona {
  id?: string;
  slug: string;
  name: string;
  role: string;
  group_name: string;
  specialties: string[];
  domains: string[];
  description: string;
  variant: PersonaVariant;
  is_default: boolean;
  is_active: true;
  system_prompt?: string;
  initials?: string;
  affiliation?: string | null;
  badge?: string;
  avatar_color?: string;
  personality?: string | null;
  opener_template?: string | null;
  display_order?: number;
}

export interface PersonaRegistry {
  personas: RegistryPersona[];
  groups: Record<string, RegistryPersona[]>;
}

function getFallbackRows(): ExpertPersona[] {
  return [
    ...Object.values(EXPERTS).map((persona) => ({ ...persona, variant: "global" as const })),
    ...Object.values(EXPERTS_PK).map((persona) => ({ ...persona, variant: "pk" as const })),
  ];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && !!item.trim()) : [];
}

function normalizePersona(row: Partial<ExpertPersona> & Record<string, unknown>): RegistryPersona | null {
  if (row.is_active === false) return null;
  const slug = asString(row.slug) || asString(row.id);
  const name = asString(row.name);
  const group_name = asString(row.group_name) || asString(row.badge);
  if (!slug || !name || !group_name) return null;

  const variant = row.variant === "pk" ? "pk" : "global";
  return {
    id: asString(row.id) || slug,
    slug,
    name,
    role: asString(row.role),
    group_name,
    specialties: asStringArray(row.specialties),
    domains: asStringArray(row.domains),
    description: asString(row.description),
    variant,
    is_default: row.is_default === true,
    is_active: true,
    system_prompt: asString(row.system_prompt) || undefined,
    initials: asString(row.initials) || undefined,
    affiliation: typeof row.affiliation === "string" ? row.affiliation : null,
    badge: asString(row.badge) || group_name,
    avatar_color: asString(row.avatar_color) || undefined,
    personality: typeof row.personality === "string" ? row.personality : null,
    opener_template: typeof row.opener_template === "string" ? row.opener_template : null,
    display_order: typeof row.display_order === "number" ? row.display_order : undefined,
  };
}

export function buildPersonaRegistry(rows: readonly (Partial<ExpertPersona> & Record<string, unknown>)[]): PersonaRegistry {
  const personas = rows
    .map(normalizePersona)
    .filter((persona): persona is RegistryPersona => persona !== null);
  const groups: Record<string, RegistryPersona[]> = {};
  for (const persona of personas) {
    (groups[persona.group_name] ||= []).push(persona);
  }
  return { personas, groups };
}

export function createFallbackPersonaRegistry(): PersonaRegistry {
  return buildPersonaRegistry(getFallbackRows() as (Partial<ExpertPersona> & Record<string, unknown>)[]);
}
