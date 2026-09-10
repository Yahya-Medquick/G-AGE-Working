import { describe, it, expect } from "vitest";
import { sanitizeInput, evaluateContentQuality } from "../src/utils/security";

describe("Security & Input Sanitization Suite", () => {
  it("should strip HTML tags and script elements from input", () => {
    const malicious = "<script>alert('xss')</script>Hello<b>World</b>";
    const result = sanitizeInput(malicious);
    expect(result).toBe("HelloWorld");
    expect(result).not.toContain("<script>");
  });

  it("should remove javascript: protocol prefixes", () => {
    const payload = "javascript:alert(1)";
    const result = sanitizeInput(payload);
    expect(result).toBe("alert(1)");
    expect(result).not.toContain("javascript:");
  });

  it("should enforce maximum length limit", () => {
    const longInput = "a".repeat(300);
    const result = sanitizeInput(longInput, 100);
    expect(result.length).toBe(100);
  });

  it("should handle null bytes and control characters gracefully", () => {
    const nullByteInput = "test\0payload\u0007";
    const result = sanitizeInput(nullByteInput);
    expect(result).toBe("testpayload");
  });
});

describe("Content Quality & Anti-Spam Suite", () => {
  it("should penalize spam keywords", () => {
    const evalResult = evaluateContentQuality("Win Free Tokens", "Click here now for casino bonuses", "http://spam.site");
    expect(evalResult.isSpam).toBe(true);
    expect(evalResult.qualityScore).toBeLessThan(50);
  });

  it("should boost high authority domains", () => {
    const evalResult = evaluateContentQuality("Quantum Computing Foundations", "Comprehensive analysis of qubit coherence times and error mitigation.", "https://arxiv.org/abs/2401.0001");
    expect(evalResult.isSpam).toBe(false);
    expect(evalResult.qualityScore).toBeGreaterThanOrEqual(90);
  });
});
