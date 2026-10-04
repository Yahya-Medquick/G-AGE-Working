import { describe, expect, it } from "vitest";
import { buildPersonaRegistry } from "../src/data/personaRegistry";

describe("persona registry", () => {
  it("excludes inactive personas and groups active personas by group name", () => {
    const registry = buildPersonaRegistry([
      {
        slug: "english",
        name: "Prof. Zeeshan",
        role: "English Tutor",
        group_name: "English Board Exam Prep",
        specialties: [],
        domains: [],
        description: "",
        variant: "global",
        is_default: false,
        is_active: true,
      },
      {
        slug: "inactive",
        name: "Inactive Persona",
        role: "Inactive",
        group_name: "Hidden Group",
        specialties: [],
        domains: [],
        description: "",
        variant: "global",
        is_default: false,
        is_active: false,
      },
    ]);

    expect(registry.personas.map(({ slug }) => slug)).toEqual(["english"]);
    expect(Object.keys(registry.groups)).toEqual(["English Board Exam Prep"]);
  });
});
