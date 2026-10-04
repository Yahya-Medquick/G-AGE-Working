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

export interface PersonaSuggestion {
  slug: string;
  name: string;
  group_name: string;
  score: number;
}

export interface PersonaSuggestionContext {
  variant?: PersonaVariant;
  mode?: string;
  language?: string;
}

const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "can", "could", "do", "does",
  "for", "from", "how", "i", "in", "is", "it", "me", "my", "of", "on", "or",
  "please", "should", "tell", "that", "the", "their", "this", "to", "was",
  "what", "when", "where", "which", "who", "why", "with", "would", "you",
  "your", "explain", "about", "give", "help", "need", "want", "know",
]);

const ROMAN_URDU_ALIASES: Record<string, string[]> = {
  adalat: ["court", "law", "legal"],
  adaalat: ["court", "law", "legal"],
  haq: ["rights", "law", "legal"],
  huqooq: ["rights", "law", "legal"],
  kanun: ["law", "legal"],
  kanoon: ["law", "legal"],
  qanoon: ["law", "legal"],
  qanooni: ["law", "legal"],
  muqadma: ["litigation", "law", "legal"],
  wakeel: ["lawyer", "law", "legal"],
  quwwat: ["force", "physics"],
  quwat: ["force", "physics"],
  zarraat: ["particles", "physics"],
  zarra: ["particle", "physics"],
  zarray: ["particles", "physics"],
};

const TOKEN_PATTERN = /[\p{L}\p{N}]+/gu;

function tokens(value: string): Set<string> {
  return new Set(
    (value.toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "").match(TOKEN_PATTERN) || [])
      .filter((token) => token.length > 1 && !STOPWORDS.has(token)),
  );
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

function getQueryTokens(query: string, language?: string): Set<string> {
  const queryTokens = tokens(query);
  for (const token of [...queryTokens]) {
    if (language === "roman-urdu" || ROMAN_URDU_ALIASES[token]) {
      for (const alias of ROMAN_URDU_ALIASES[token] || []) queryTokens.add(alias);
    }
  }
  return queryTokens;
}

function scorePersona(queryTokens: Set<string>, persona: RegistryPersona, mode: string): number {
  const fields: Array<[string, number]> = [
    [persona.domains.join(" "), 3],
    [persona.specialties.join(" "), 2.5],
    [`${persona.name} ${persona.role}`, 1.5],
    [persona.description, 0.5],
  ];
  let score = 0;
  for (const [field, weight] of fields) {
    const fieldTokens = tokens(field);
    let overlap = 0;
    for (const token of queryTokens) {
      if (fieldTokens.has(token)) overlap++;
    }
    score += overlap * weight;
  }

  const modeTokens = tokens(mode);
  if (modeTokens.size > 0) {
    const expertiseTokens = tokens(`${persona.domains.join(" ")} ${persona.specialties.join(" ")}`);
    for (const token of modeTokens) {
      if (queryTokens.has(token) && expertiseTokens.has(token)) score += 0.25;
    }
  }
  return score;
}

export function scorePersonaSuggestions(
  query: string,
  registry: PersonaRegistry,
  context: PersonaSuggestionContext = {},
): PersonaSuggestion[] {
  const variant = context.variant === "pk" ? "pk" : "global";
  const candidates = registry.personas.filter((persona) => persona.variant === variant);
  const defaultPersona = candidates.find((persona) => persona.is_default)
    || candidates.find((persona) => persona.slug === "hamza")
    || candidates[0];
  if (!defaultPersona) return [];

  const queryTokens = getQueryTokens(query, context.language);
  const ranked = candidates
    .map((persona, index) => ({ persona, score: scorePersona(queryTokens, persona, context.mode || ""), index }))
    .filter(({ score }) => score >= 2)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, 3);

  if (ranked.length > 0) {
    return ranked.map(({ persona, score }) => ({
      slug: persona.slug,
      name: persona.name,
      group_name: persona.group_name,
      score: Number(score.toFixed(2)),
    }));
  }
  return [{ slug: defaultPersona.slug, name: defaultPersona.name, group_name: defaultPersona.group_name, score: 0 }];
}

export function isRegisteredPersonaSlug(
  slug: string,
  registry: PersonaRegistry,
  variant: PersonaVariant = "global",
): boolean {
  return registry.personas.some((persona) => persona.variant === variant && persona.slug === slug);
}
