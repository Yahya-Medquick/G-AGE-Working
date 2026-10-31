import type { ChatSession } from '../types/chat';

export function isOpenerOnlySession(session: ChatSession | null | undefined): boolean {
  return session?.messages.length === 1 && session.messages[0].role === 'assistant';
}