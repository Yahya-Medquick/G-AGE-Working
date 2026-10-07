export interface AccountStorage {
  readonly length: number;
  key(index: number): string | null;
  removeItem(key: string): void;
}

export function clearAccountLocalData(userId: string, storage: AccountStorage): void {
  const accountKeys = new Set([
    'bifrost_session_token',
    'bifrost_guest_mode',
    'bifrost_notes',
    'bifrost_mode',
    'gage_has_seen_onboarding',
    'has_seen_onboarding',
    'gage_language',
    'gage_response_language',
    'gage_app_language',
    'gage_app_language_follows_response',
    'gage_class_level',
    'gage_recent_personas',
    'gage_specs_prefs',
    `gage_class_prompt_dismissed:${userId}`,
    `bifrost_chat_sessions_v2_user_${userId}`,
    `bifrost_active_session_id_v2_user_${userId}`,
  ]);
  const userDataPrefixes = [`bifrost_expert_chat_${userId}_`];

  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index);
    if (key && (accountKeys.has(key) || userDataPrefixes.some((prefix) => key.startsWith(prefix)))) {
      storage.removeItem(key);
    }
  }
}
