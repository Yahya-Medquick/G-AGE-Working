import type { ExpertPersona } from '../types';

type PersonaVariant = 'global' | 'pk';

interface PersonaMessageIdentity {
  personaId?: string;
  personaName?: string;
  personaInitials?: string;
  personaVariant?: PersonaVariant;
}

export interface ResolvedPersonaIdentity {
  name: string;
  initials: string;
  avatarColor: string;
  groupName: string;
}

function findPersona(personas: Record<string, ExpertPersona>, id?: string) {
  if (!id) return undefined;
  return personas[id] || Object.values(personas).find((persona) => persona.id === id || persona.slug === id);
}

export function resolvePersonaIdentity(
  message: PersonaMessageIdentity,
  sessionVariant: PersonaVariant,
  globalPersonas: Record<string, ExpertPersona>,
  pkPersonas: Record<string, ExpertPersona>,
): ResolvedPersonaIdentity {
  const variant = message.personaVariant || sessionVariant;
  const persona = variant === 'pk'
    ? findPersona(pkPersonas, message.personaId) || findPersona(globalPersonas, message.personaId)
    : findPersona(globalPersonas, message.personaId) || findPersona(pkPersonas, message.personaId);

  return {
    name: message.personaName?.trim() || persona?.name || 'G-AGE AI',
    initials: message.personaInitials?.trim() || persona?.initials || 'GA',
    avatarColor: persona?.avatar_color || 'var(--accent)',
    groupName: persona?.group_name || '',
  };
}
