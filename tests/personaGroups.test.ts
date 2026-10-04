import { describe, expect, it, vi } from "vitest";
import {
  ACTIVE_PERSONA_GROUPS_SQL,
  extractSuggestedGroup,
  fetchActivePersonaGroups,
} from "../src/data/personaGroups";

describe("group-level persona suggestions", () => {
  const groups = ["Biology & Life Sciences", "English Board Exam Prep"];

  it("accepts a valid group name case-insensitively and strips the marker", () => {
    const result = extractSuggestedGroup(
      "I can still explain the basics.\n[[SUGGEST_GROUP:biology & life sciences]]",
      groups,
      "English Board Exam Prep",
    );

    expect(result).toEqual({
      reply: "I can still explain the basics.",
      rawMarker: "biology & life sciences",
      suggestedGroup: "Biology & Life Sciences",
    });
  });

  it("rejects an unknown group and strips its marker", () => {
    const result = extractSuggestedGroup(
      "Answer text.\n[[SUGGEST_GROUP:Unlisted Specialists]]",
      groups,
      "English Board Exam Prep",
    );

    expect(result).toEqual({
      reply: "Answer text.",
      rawMarker: "Unlisted Specialists",
    });
  });

  it("rejects the active persona's own group", () => {
    const result = extractSuggestedGroup(
      "Answer text.\n[[SUGGEST_GROUP:English Board Exam Prep]]",
      groups,
      "english board exam prep",
    );

    expect(result).toEqual({
      reply: "Answer text.",
      rawMarker: "English Board Exam Prep",
    });
  });

  it("returns no suggestion when model output has no marker", () => {
    expect(extractSuggestedGroup("A direct answer.", groups, "English Board Exam Prep")).toEqual({
      reply: "A direct answer.",
    });
  });

  it("loads groups from the active expert_personas query for the requested variant", async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [{ group_name: "Biology & Life Sciences" }, { group_name: "English Board Exam Prep" }],
    });

    const activeGroups = await fetchActivePersonaGroups("pk", query);

    expect(query).toHaveBeenCalledWith(ACTIVE_PERSONA_GROUPS_SQL, ["pk"]);
    expect(ACTIVE_PERSONA_GROUPS_SQL).toContain("FROM expert_personas");
    expect(ACTIVE_PERSONA_GROUPS_SQL).toContain("WHERE is_active = true");
    expect(ACTIVE_PERSONA_GROUPS_SQL).toContain("COALESCE(variant, 'global') = $1");
    expect(activeGroups).toEqual(["Biology & Life Sciences", "English Board Exam Prep"]);
  });
});
