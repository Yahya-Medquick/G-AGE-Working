import { describe, it, expect } from "vitest";
import { invalidateCache, fetchCategoryData } from "../src/services/api";

describe("Client Cache Invalidation Suite", () => {
  it("should clear all caches when called without arguments", () => {
    expect(() => invalidateCache()).not.toThrow();
  });

  it("should invalidate specific topics and categories correctly", () => {
    expect(() => invalidateCache("gravity", "overview")).not.toThrow();
    expect(() => invalidateCache("quantum", undefined)).not.toThrow();
  });
});
