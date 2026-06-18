import { describe, expect, test } from "vitest";
import { FIRST_CLICK_PROOF_LINKS, FIRST_CLICK_SCORECARDS } from "../src/firstClick";

describe("judge first-click proof strip", () => {
  test("keeps the first judge path on direct-open GET proof pages", () => {
    expect(FIRST_CLICK_PROOF_LINKS[0]).toMatchObject({
      id: "judge-snapshot",
      href: "/judge-snapshot",
      tone: "primary"
    });
    expect(FIRST_CLICK_PROOF_LINKS.map((link) => link.href)).toEqual([
      "/judge-snapshot",
      "/winner-packet",
      "/competitive-swot",
      "/mvp-readiness",
      "/autonomy-snapshot",
      "/pilot-value",
      "/recording-script",
      "/submission-assets"
    ]);
    expect(FIRST_CLICK_PROOF_LINKS.every((link) => link.href.startsWith("/") && !link.href.startsWith("/api/"))).toBe(true);
    expect(FIRST_CLICK_PROOF_LINKS.every((link) => link.signal.length > 0 && link.judgeValue.length > 0)).toBe(true);
  });

  test("summarizes why the root page is MVP-ready for judges", () => {
    expect(FIRST_CLICK_SCORECARDS.map((card) => card.id)).toEqual(["no-post-first", "criteria-covered", "drift-honesty"]);
    expect(FIRST_CLICK_SCORECARDS.find((card) => card.id === "criteria-covered")?.value).toBe("5/5 covered");
    expect(FIRST_CLICK_SCORECARDS.find((card) => card.id === "drift-honesty")?.proof).toContain("Release Drift");
  });
});
