import { describe, expect, test } from "vitest";
import { buildFirstClickProof, FIRST_CLICK_PROOF_LINKS, FIRST_CLICK_REQUIRED_SIGNAL, FIRST_CLICK_SCORECARDS, FIRST_CLICK_SKILL_ID } from "../src/firstClick";

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
      "/objection-arena",
      "/competitive-swot",
      "/mvp-readiness",
      "/autonomy-snapshot",
      "/pilot-value",
      "/recording-script",
      "/architecture-pack",
      "/submission-launch",
      "/submission-assets"
    ]);
    expect(FIRST_CLICK_PROOF_LINKS.every((link) => link.href.startsWith("/") && !link.href.startsWith("/api/"))).toBe(true);
    expect(FIRST_CLICK_PROOF_LINKS.every((link) => link.signal.length > 0 && link.judgeValue.length > 0)).toBe(true);
  });

  test("summarizes why the root page is MVP-ready for judges", () => {
    expect(FIRST_CLICK_SCORECARDS.map((card) => card.id)).toEqual(["no-post-first", "criteria-covered", "drift-honesty"]);
    expect(FIRST_CLICK_SCORECARDS.find((card) => card.id === "criteria-covered")?.value).toBe("5/5 covered");
    expect(FIRST_CLICK_SCORECARDS.find((card) => card.id === "no-post-first")?.value).toBe("11 GET links");
    expect(FIRST_CLICK_SCORECARDS.find((card) => card.id === "drift-honesty")?.proof).toContain("Release Drift");
  });

  test("exposes an A2A-verifiable first-click route lock", () => {
    const proof = buildFirstClickProof("https://a2a-agent-marketplace.example.com/");

    expect(proof).toMatchObject({
      skill: FIRST_CLICK_SKILL_ID,
      directOpen: true,
      routeLock: {
        noPostRequired: true,
        proofPathCount: 11,
        firstProofPath: "/judge-snapshot",
        requiredAgentCardSignal: FIRST_CLICK_REQUIRED_SIGNAL
      }
    });
    expect(proof.proofLinks.map((link) => link.url)).toEqual([
      "https://a2a-agent-marketplace.example.com/judge-snapshot",
      "https://a2a-agent-marketplace.example.com/winner-packet",
      "https://a2a-agent-marketplace.example.com/objection-arena",
      "https://a2a-agent-marketplace.example.com/competitive-swot",
      "https://a2a-agent-marketplace.example.com/mvp-readiness",
      "https://a2a-agent-marketplace.example.com/autonomy-snapshot",
      "https://a2a-agent-marketplace.example.com/pilot-value",
      "https://a2a-agent-marketplace.example.com/recording-script",
      "https://a2a-agent-marketplace.example.com/architecture-pack",
      "https://a2a-agent-marketplace.example.com/submission-launch",
      "https://a2a-agent-marketplace.example.com/submission-assets"
    ]);
  });
});
