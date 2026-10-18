import { ConceptMapData } from '../types/conceptMap';
import { getAuthHeaders } from './api';
import { sanitizeConceptMapData, generateFallbackOutline } from '../utils/graphLayout';

// In-memory cache keyed by messageId
const conceptMapMemoryCache = new Map<string, ConceptMapData>();

// Client-side rate limiter: max 5 requests per minute
const requestTimestamps: number[] = [];
const MAX_REQUESTS_PER_MINUTE = 5;
const WINDOW_MS = 60 * 1000;

export function checkClientRateLimit(): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  // Filter out timestamps older than 60s
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

export function getCachedConceptMap(messageId: string): ConceptMapData | undefined {
  return conceptMapMemoryCache.get(messageId);
}

export function hasCachedConceptMap(messageId: string): boolean {
  return conceptMapMemoryCache.has(messageId);
}

export function setCachedConceptMap(messageId: string, data: ConceptMapData): void {
  conceptMapMemoryCache.set(messageId, data);
}

export async function requestConceptMap(messageId: string, answerText: string): Promise<ConceptMapData> {
  // Check memory cache first
  const cached = getCachedConceptMap(messageId);
  if (cached) {
    return cached;
  }

  // Check rate limit
  const rateLimit = checkClientRateLimit();
  if (!rateLimit.allowed) {
    throw new Error(
      `Rate limit exceeded: You can generate up to 5 maps per minute. Please wait ${rateLimit.waitSeconds}s and try again.`
    );
  }

  // Truncate to about 3000 chars as specified
  const truncatedText = answerText.slice(0, 3000);

  recordClientRequest();

  try {
    const response = await fetch('/api/concept-map', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        messageId,
        text: truncatedText,
      }),
    });

    if (response.status === 429) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Rate limit exceeded: Please wait a moment before generating another map.');
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${response.status}`);
    }

    const payload = await response.json();
    if (!payload || !payload.data) {
      throw new Error('Invalid response format received from server.');
    }

    const sanitized = sanitizeConceptMapData(payload.data);
    setCachedConceptMap(messageId, sanitized);
    return sanitized;
  } catch (error: any) {
    // If generation fails, generate fallback outline so user gets structured view instead of an error crash
    const isRateLimitError = error?.message?.includes('Rate limit');
    if (isRateLimitError) {
      throw error;
    }

    console.warn('[ConceptMap] Failed to generate structured graph, building fallback outline:', error);
    const fallbackOutline = generateFallbackOutline(answerText);
    const fallbackData: ConceptMapData = {
      type: 'mindmap',
      title: 'Answer Overview (Structured Outline)',
      nodes: [
        { id: 'root', label: 'Key Concepts & Takeaways', parent: null },
        ...fallbackOutline.slice(0, 6).map((item, idx) => ({
          id: `item-${idx + 1}`,
          label: item.slice(0, 35),
          parent: 'root',
        })),
      ],
      edges: fallbackOutline.slice(0, 6).map((_, idx) => ({
        from: 'root',
        to: `item-${idx + 1}`,
      })),
      fallbackOutline,
    };

    setCachedConceptMap(messageId, fallbackData);
    return fallbackData;
  }
}
