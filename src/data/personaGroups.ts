export type PersonaVariant = "global" | "pk";

export interface PersonaGroupRow {
  group_name?: unknown;
}

export const ACTIVE_PERSONA_GROUPS_SQL = `
  SELECT DISTINCT group_name
  FROM expert_personas
  WHERE is_active = true
    AND COALESCE(variant, 'global') = $1
    AND group_name IS NOT NULL
    AND BTRIM(group_name) <> ''
  ORDER BY group_name ASC
`;

export async function fetchActivePersonaGroups(
  variant: PersonaVariant,
  query: (sql: string, values: string[]) => Promise<{ rows: PersonaGroupRow[] }>,
): Promise<string[]> {
  const result = await query(ACTIVE_PERSONA_GROUPS_SQL, [variant]);
  return result.rows
    .map((row) => typeof row.group_name === "string" ? row.group_name.trim() : "")
    .filter(Boolean);
}

export function extractSuggestedGroup(
  reply: string,
  groups: readonly string[],
  activePersonaGroup: string,
): { reply: string; rawMarker?: string; suggestedGroup?: string } {
  const markerPattern = /\[\[SUGGEST_GROUP:([^\]]*)\]\]/g;
  const markers = [...reply.matchAll(markerPattern)];
  const rawMarker = markers[0]?.[1]?.trim();
  const cleanedReply = reply.replace(markerPattern, "").trim();
  if (!rawMarker) return { reply: cleanedReply };

  const normalizedMarker = rawMarker.toLowerCase();
  const activeGroup = activePersonaGroup.trim().toLowerCase();
  const suggestedGroup = groups.find((group) => group.toLowerCase() === normalizedMarker);
  if (!suggestedGroup || suggestedGroup.toLowerCase() === activeGroup) {
    return { reply: cleanedReply, rawMarker };
  }
  return { reply: cleanedReply, rawMarker, suggestedGroup };
}
