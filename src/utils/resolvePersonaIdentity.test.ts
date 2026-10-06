import { describe, expect, it } from 'vitest';
import type { ExpertPersona } from '../types';
import { resolvePersonaIdentity } from './resolvePersonaIdentity';

const persona: ExpertPersona = {
  id: 'teacher-id',
  slug: 'teacher-slug',
  name: 'Study Teacher',
  initials: 'ST',
  role: 'Study mentor',
  badge: 'Learning',
  specialties: [],
  domains: [],
  system_prompt: '',
  variant: 'global',
  avatar_color: 'var(--tint-bio-text)',
  group_name: 'Science',
};

describe('resolvePersonaIdentity', () => {
  it('resolves a message persona from the other variant', () => {
    expect(resolvePersonaIdentity(
      { personaId: 'teacher-slug', personaVariant: 'pk' },
      'pk',
      { 'teacher-id': persona },
      {},
    )).toEqual({
      name: 'Study Teacher',
      initials: 'ST',
      avatarColor: 'var(--tint-bio-text)',
      groupName: 'Science',
    });
  });

  it('uses stored identity and a safe default when the persona is no longer available', () => {
    expect(resolvePersonaIdentity(
      { personaId: 'removed-teacher', personaName: 'Saved teacher', personaInitials: 'SV' },
      'global',
      {},
      {},
    )).toEqual({
      name: 'Saved teacher',
      initials: 'SV',
      avatarColor: 'var(--accent)',
      groupName: '',
    });
  });
});
