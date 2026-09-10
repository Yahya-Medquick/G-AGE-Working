// Input Sanitization Logic
export function sanitizeInput(input: unknown, maxLength = 250): string {
  if (typeof input !== "string") return "";
  let clean = input
    .replace(/\0/g, "")
    .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim();
  if (clean.length > maxLength) {
    clean = clean.substring(0, maxLength);
  }
  return clean;
}

// Content Quality Engine
export function evaluateContentQuality(title: string, snippet: string, url: string): { qualityScore: number; isSpam: boolean; isDuplicate: boolean; flags: string[] } {
  let score = 82;
  const flags: string[] = [];
  const text = (title + " " + snippet).toLowerCase();
  
  const spamKeywords = ["casino", "crypto giveaway", "free tokens", "buy followers", "pills online", "slot machine", "click here now"];
  const isSpam = spamKeywords.some(k => text.includes(k));
  if (isSpam) {
    score -= 60;
    flags.push("Spam keyword detected");
  }

  if (url.includes(".edu") || url.includes(".gov") || url.includes("wikipedia.org") || url.includes("openalex.org") || url.includes("github.com") || url.includes("arxiv.org")) {
    score += 12;
    flags.push("High authority domain");
  }

  if (snippet.length > 90) score += 5;

  return {
    qualityScore: Math.min(100, Math.max(15, score)),
    isSpam,
    isDuplicate: false,
    flags
  };
}
