import { describe, expect, it } from "vitest";
import {
  buildPersonaRegistry,
  getPersonaSuggestionCard,
  isRegisteredPersonaSlug,
  scorePersonaSuggestions,
  scorePersonaSuggestionsWithDiagnostics,
} from "../src/data/personaRegistry";

const registry = buildPersonaRegistry([
  {
    slug: "hamza",
    name: "Hamza Tariq",
    role: "Academic Mentor",
    group_name: "General & Bilingual",
    specialties: ["Study guidance"],
    domains: ["general", "study"],
    description: "A general academic mentor.",
    variant: "global",
    is_default: true,
    is_active: true,
  },
  {
    slug: "aris",
    name: "Dr. Aris Thorne",
    role: "Quantum Physics Researcher",
    group_name: "Quantum Physics & Computing",
    specialties: ["Quantum mechanics", "Particle physics"],
    domains: ["physics", "quantum mechanics", "quantum computing"],
    description: "Researches quantum systems and physics.",
    variant: "global",
    is_default: false,
    is_active: true,
  },
  {
    slug: "sarah",
    name: "Sarah Okonkwo",
    role: "Technology Lawyer",
    group_name: "Law & Legal Research",
    specialties: ["Contract law", "Intellectual property"],
    domains: ["law", "legal research", "contracts", "litigation"],
    description: "Provides legal research and technology law expertise.",
    variant: "global",
    is_default: false,
    is_active: true,
  },
  {
    slug: "tashfeen",
    name: "Barrister Tashfeen Khalid",
    role: "Pakistani Corporate Lawyer",
    group_name: "Law & Legal Research",
    specialties: ["Pakistani corporate law", "Startup law"],
    domains: ["law", "legal", "corporate law", "contracts"],
    description: "Provides Pakistani legal advice.",
    variant: "pk",
    is_default: true,
    is_active: true,
  },
]);

describe("persona registry scorer", () => {
  it("suggests a Quantum Physics persona for a physics query", () => {
    const suggestions = scorePersonaSuggestions("Explain quantum physics and particles", registry);
    expect(suggestions[0]?.slug).toBe("aris");
    expect(suggestions[0]?.group_name).toBe("Quantum Physics & Computing");
  });

  it("suggests Law & Legal Research for a law query", () => {
    const suggestions = scorePersonaSuggestions("I need legal research about contract law", registry);
    expect(suggestions[0]?.slug).toBe("sarah");
    expect(suggestions[0]?.group_name).toBe("Law & Legal Research");
  });

  it("returns the default persona for gibberish", () => {
    const suggestions = scorePersonaSuggestions("blorpt zingle flarm", registry);
    expect(suggestions).toEqual([
      { slug: "hamza", name: "Hamza Tariq", group_name: "General & Bilingual", score: 0, variant: "global" },
    ]);
  });

  it("suggests a Biology & Life Sciences persona for photosynthesis", () => {
    const biologyRegistry = buildPersonaRegistry([
      {
        slug: "prof-zeeshan-english",
        name: "Prof. Zeeshan",
        role: "English Board Exam Prep",
        group_name: "English Board Exam Prep",
        specialties: ["English grammar", "Board exam preparation"],
        domains: ["english", "board exams"],
        description: "Prepares students for English board examinations.",
        variant: "global",
        is_default: false,
        is_active: true,
      },
      {
        slug: "mei-ling",
        name: "Dr. Mei-Ling Zhou",
        role: "Molecular Biologist",
        group_name: "Biology & Life Sciences",
        specialties: ["Molecular biology"],
        domains: ["biology"],
        description: "Explains life sciences.",
        variant: "global",
        is_default: false,
        is_active: true,
      },
    ]);

    const result = scorePersonaSuggestionsWithDiagnostics("define photosynthesis", biologyRegistry, {
      variant: "global",
      mode: "concept",
      language: "english",
    });

    expect(result.suggestions[0]).toMatchObject({
      slug: "mei-ling",
      group_name: "Biology & Life Sciences",
      variant: "global",
    });
    expect(result.suggestions[0].score).toBeGreaterThanOrEqual(result.threshold);
    expect(result.usedFallback).toBe(false);
  });

  it("does not show the active persona as a suggestion card", () => {
    expect(getPersonaSuggestionCard([
      { slug: "prof-zeeshan-english", name: "Prof. Zeeshan", group_name: "English", score: 3 },
      { slug: "mei-ling", name: "Dr. Mei-Ling Zhou", group_name: "Biology & Life Sciences", score: 3 },
    ], "prof-zeeshan-english")).toBeNull();
  });

  it("tries the other variant when the active variant has no threshold match", () => {
    const pkBiologyRegistry = buildPersonaRegistry([
      {
        slug: "prof-zeeshan-english",
        name: "Prof. Zeeshan",
        role: "English Board Exam Prep",
        group_name: "English Board Exam Prep",
        specialties: ["English grammar"],
        domains: ["english"],
        description: "English board examination preparation.",
        variant: "global",
        is_default: true,
        is_active: true,
      },
      {
        slug: "kiran-razaq",
        name: "Dr. Kiran Razzaq",
        role: "Biotechnologist",
        group_name: "Biology & Life Sciences",
        specialties: ["Molecular biology"],
        domains: ["biology"],
        description: "Explains life sciences.",
        variant: "pk",
        is_default: false,
        is_active: true,
      },
    ]);

    const result = scorePersonaSuggestionsWithDiagnostics("define photosynthesis", pkBiologyRegistry, {
      variant: "global",
      language: "english",
    });

    expect(result.variantUsed).toBe("pk");
    expect(result.suggestions[0]?.slug).toBe("kiran-razaq");
    expect(result.attempts.map(({ variant, matched }) => ({ variant, matched }))).toEqual([
      { variant: "global", matched: false },
      { variant: "pk", matched: true },
    ]);
  });

  it("does not show a fallback result as a suggestion card", () => {
    const fallback = scorePersonaSuggestions("blorpt zingle flarm", registry);
    expect(getPersonaSuggestionCard(fallback, "prof-zeeshan-english")).toBeNull();
  });

  it("rejects a slug outside the registry", () => {
    expect(isRegisteredPersonaSlug("invented-specialist", registry)).toBe(false);
    expect(isRegisteredPersonaSlug("aris", registry)).toBe(true);
  });

  it("respects the Pakistani variant and Roman Urdu legal terms", () => {
    const suggestions = scorePersonaSuggestions("qanooni contract advice", registry, {
      variant: "pk",
      language: "roman-urdu",
    });
    expect(suggestions[0]?.slug).toBe("tashfeen");
    expect(suggestions[0]?.group_name).toBe("Law & Legal Research");
  });
});
