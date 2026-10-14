import type { ChatSession } from '../types/chat';

type ChatSpecs = NonNullable<ChatSession['specs']>;

export function mergeChatSpecs(current: ChatSpecs | undefined, updates: ChatSpecs): ChatSpecs {
  const merged: ChatSpecs = { ...current, ...updates };

  if (current?.concept || updates.concept) {
    merged.concept = { ...current?.concept, ...updates.concept };
  }
  if (current?.exam || updates.exam) {
    merged.exam = { ...current?.exam, ...updates.exam };
  }
  if (current?.research || updates.research) {
    merged.research = { ...current?.research, ...updates.research };
  }

  return merged;
}
