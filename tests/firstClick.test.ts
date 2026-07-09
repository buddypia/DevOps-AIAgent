import { describe, expect, test } from "vitest";
import { buildFirstClickProof, FIRST_CLICK_PROOF_LINKS, FIRST_CLICK_REQUIRED_SIGNAL, FIRST_CLICK_SCORECARDS, FIRST_CLICK_SKILL_ID } from "../src/firstClick";

describe("reviewer first-click proof strip", () => {
  test("keeps the first reviewer path on direct-open GET proof pages", () => {
    expect(FIRST_CLICK_PROOF_LINKS[0]).toMatchObject({
      id: "win-autopilot",
      href: "/win-autopilot",
      tone: "primary"
    });
    expect(FIRST_CLICK_PROOF_LINKS.map((link) => link.href)).toEqual([
      "/win-autopilot",
      "/judge-snapshot",
      "/winner-packet",
      "/objection-arena",
      "/competitive-swot",
      "/competitive-decision-matrix",
      "/mvp-readiness",
      "/deploy-recovery",
      "/autonomy-snapshot",
      "/pilot-value",
      "/recording-script",
      "/architecture-pack",
      "/submission-launch",
      "/submission-assets"
    ]);
    expect(FIRST_CLICK_PROOF_LINKS.every((link) => link.href.startsWith("/") && !link.href.startsWith("/api/"))).toBe(true);
    expect(FIRST_CLICK_PROOF_LINKS.every((link) => link.signal.length > 0 && link.judgeValue.length > 0)).toBe(true);
    expect(FIRST_CLICK_PROOF_LINKS.map((link) => link.label)).toEqual([
      "Win Autopilot",
      "Reviewer Snapshot",
      "Decision Packet",
      "Review Q&A",
      "Competitive SWOT",
      "Decision Matrix",
      "MVP Readiness",
      "Deploy Recovery",
      "Autonomy Snapshot",
      "Pilot Value",
      "Recording Script",
      "Architecture Pack",
      "Public Proof Launch",
      "Publication Assets"
    ]);
    expect(JSON.stringify(FIRST_CLICK_PROOF_LINKS)).not.toMatch(/Judge Snapshot|Winner Packet|Objection Arena|Submission Launch|Submission Assets|Final Submit|最終提出|提出証拠|初見審査員/);
  });

  test("summarizes why the root page is MVP-ready for reviewers", () => {
    expect(FIRST_CLICK_SCORECARDS.map((card) => card.id)).toEqual(["no-post-first", "criteria-covered", "drift-honesty"]);
    expect(FIRST_CLICK_SCORECARDS.find((card) => card.id === "criteria-covered")?.value).toBe("5/5 covered");
    expect(FIRST_CLICK_SCORECARDS.find((card) => card.id === "criteria-covered")?.label).toBe("Reviewer criteria");
    expect(FIRST_CLICK_SCORECARDS.find((card) => card.id === "no-post-first")?.value).toBe("14 GET links");
    expect(FIRST_CLICK_SCORECARDS.find((card) => card.id === "no-post-first")?.proof).toContain("初回レビュー");
    expect(FIRST_CLICK_SCORECARDS.find((card) => card.id === "drift-honesty")?.proof).toContain("Release Drift");
    expect(JSON.stringify(FIRST_CLICK_SCORECARDS)).not.toMatch(/Judge criteria|初回審査|Winner Packet/);
  });

  test("exposes an A2A-verifiable first-click route lock", () => {
    const proof = buildFirstClickProof("https://a2a-agent-marketplace.example.com/");

    expect(proof).toMatchObject({
      skill: FIRST_CLICK_SKILL_ID,
      directOpen: true,
      routeLock: {
        noPostRequired: true,
        proofPathCount: 14,
        firstProofPath: "/win-autopilot",
        requiredAgentCardSignal: FIRST_CLICK_REQUIRED_SIGNAL
      }
    });
    expect(proof.proofLinks.map((link) => link.url)).toEqual([
      "https://a2a-agent-marketplace.example.com/win-autopilot",
      "https://a2a-agent-marketplace.example.com/judge-snapshot",
      "https://a2a-agent-marketplace.example.com/winner-packet",
      "https://a2a-agent-marketplace.example.com/objection-arena",
      "https://a2a-agent-marketplace.example.com/competitive-swot",
      "https://a2a-agent-marketplace.example.com/competitive-decision-matrix",
      "https://a2a-agent-marketplace.example.com/mvp-readiness",
      "https://a2a-agent-marketplace.example.com/deploy-recovery",
      "https://a2a-agent-marketplace.example.com/autonomy-snapshot",
      "https://a2a-agent-marketplace.example.com/pilot-value",
      "https://a2a-agent-marketplace.example.com/recording-script",
      "https://a2a-agent-marketplace.example.com/architecture-pack",
      "https://a2a-agent-marketplace.example.com/submission-launch",
      "https://a2a-agent-marketplace.example.com/submission-assets"
    ]);
  });
});
