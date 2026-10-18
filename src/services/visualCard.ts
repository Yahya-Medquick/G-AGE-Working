import { VisualStudyCard } from '../types/visualCard';
import { getAuthHeaders } from './api';

// In-memory cache keyed by messageId
const visualCardMemoryCache = new Map<string, VisualStudyCard>();

// Client-side rate limiter: max 5 requests per minute
const requestTimestamps: number[] = [];
const MAX_REQUESTS_PER_MINUTE = 5;
const WINDOW_MS = 60 * 1000;

export function checkClientRateLimit(): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  while (requestTimestamps.length > 0 && now - requestTimestamps[0] > WINDOW_MS) {
    requestTimestamps.shift();
  }

  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    const oldest = requestTimestamps[0];
    const waitSeconds = Math.ceil((WINDOW_MS - (now - oldest)) / 1000);
    return { allowed: false, waitSeconds: Math.max(1, waitSeconds) };
  }

  return { allowed: true };
}

export function recordClientRequest(): void {
  requestTimestamps.push(Date.now());
}

export function getCachedVisualCard(messageId: string): VisualStudyCard | undefined {
  return visualCardMemoryCache.get(messageId);
}

export function hasCachedVisualCard(messageId: string): boolean {
  return visualCardMemoryCache.has(messageId);
}

export function setCachedVisualCard(messageId: string, card: VisualStudyCard): void {
  visualCardMemoryCache.set(messageId, card);
}

// Invalidate cache if that message is regenerated or edited
export function invalidateVisualCard(messageId: string): void {
  visualCardMemoryCache.delete(messageId);
}

/**
 * VISIBILITY RULE: The Visualize button appears ONLY when the message was generated in Concept mode
 * and is long enough (>= 30 words). It never appears for any other mode (Chat, Quiz, Notes, etc.).
 */
export function shouldShowVisualizeButton(
  messageMode: string | undefined,
  content: string
): boolean {
  if (messageMode !== 'concept') return false;
  if (!content) return false;
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  return wordCount >= 30;
}

export async function requestVisualCard(messageId: string, answerText: string, mode?: string): Promise<VisualStudyCard> {
  // Reopening uses the in-memory cache by message ID, instantly, with no new API call
  const cached = getCachedVisualCard(messageId);
  if (cached) {
    return cached;
  }

  // Check rate limit
  const rateLimit = checkClientRateLimit();
  if (!rateLimit.allowed) {
    throw new Error(
      `Rate limit exceeded: You can generate up to 5 visual study cards per minute. Please wait ${rateLimit.waitSeconds}s and try again.`
    );
  }

  // Enforce 3000-character limit
  const truncatedText = answerText.slice(0, 3000);

  recordClientRequest();

  const response = await fetch('/api/visual-card', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      messageId,
      text: truncatedText,
      mode: mode || 'concept',
    }),
  });

  if (response.status === 429) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Rate limit reached: Maximum 5 requests per minute. Please wait a moment.');
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with status ${response.status}`);
  }

  const payload = await response.json();
  if (!payload || !payload.data) {
    throw new Error('Invalid response structure received from server.');
  }

  const card: VisualStudyCard = payload.data;
  setCachedVisualCard(messageId, card);
  return card;
}
