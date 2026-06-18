import { describe, expect, test } from "vitest";
import { buildObjectionArena, renderObjectionArenaHtml } from "../src/objectionArena";
import type { WinnerProofPacket } from "../src/winnerPacket";

function packet(input: { releaseReady?: boolean; blockedCriterion?: boolean } = {}): WinnerProofPacket {
  const releaseReady = input.releaseReady ?? true;
  return {
    id: "winner-packet-fixture",
    packetScore: releaseReady ? 94 : 80,
    readiness: releaseReady ? "winner-packet-ready" : "needs-proof",
    headline: "winner fixture",
    hardTruth: "fixture",
    nextAction: releaseReady ? "Record the proof." : "Redeploy latest main.",
    criteria: [
      {
        id: "agent-centrality",
        label: "AI agent centrality",
        status: input.blockedCriterion ? "blocked" : "ready",
        score: input.blockedCriterion ? 62 : 95,
        target: 92,
        judgeLine: "Agent Card and A2A artifacts prove the agent is central.",
        proofUrl: "https://example.com/.well-known/agent-card.json",
        show: "Open Agent Card.",
        objection: "これは単なるダッシュボードでは？",
        answer: "探索、契約、委任、検収をAIの判断連鎖として返します。",
        recordingCue: "Open the A2A payload."
      },
      {
        id: "approach",
        label: "Problem approach",
        status: "ready",
        score: 94,
        target: 92,
        judgeLine: "Competitive Battlecard proves the approach.",
        proofUrl: "https://example.com/api/competitive-battlecard",
        show: "Open battlecard.",
        objection: "ADKやLangGraphで十分では？",
        answer: "既存基盤ではなく、AI能力の調達と検収体験に焦点を当てています。",
        recordingCue: "Open SWOT receipt."
      }
    ],
    judgeQuestions: [
      {
        id: "roi",
        question: "ROIが机上では？",
        answer: "Pilot Economicsでpayback daysを見せます。",
        proofUrl: "https://example.com/api/pilot-economics",
        status: "ready"
      },
      {
        id: "too-many-features",
        question: "初見で迷うのでは？",
        answer: "Judge First-ClickとWinner Packetに証拠順を固定しています。",
        proofUrl: "https://example.com/winner-packet",
        status: "watch"
      }
    ],
    recordingOrder: [],
    releaseLock: {
      id: "release-lock",
      readiness: releaseReady ? "release-current" : "release-drift-watch",
      status: releaseReady ? "ready" : "blocked",
      score: releaseReady ? 100 : 35,
      verdict: releaseReady ? "release-current" : "deploy-drift",
      targetBaseUrl: "https://example.com",
      proof: releaseReady ? "release-current; all skills visible." : "deploy-drift; missing first-click surface.",
      nextAction: releaseReady ? "Keep proof." : "Redeploy latest main.",
      missingSkills: releaseReady ? [] : ["judge.objection-arena"],
      missingAgentCardSignals: [],
      evidenceUrl: "https://example.com/api/release-drift"
    },
    submissionCopy: {
      oneLine: "fixture",
      winnerThesis: "fixture",
      proofOrder: [],
      missingExternal: [],
      tags: ["findy_hackathon"]
    },
    a2aPayload: {
      endpoints: {
        winnerPacket: "https://example.com/api/winner-packet",
        objectionArena: "https://example.com/api/objection-arena"
      }
    }
  };
}

describe("objection arena", () => {
  test("turns winner proof into final Q&A lanes with proof URLs", () => {
    const arena = buildObjectionArena(packet());

    expect(arena.readiness).toBe("qa-watch");
    expect(arena.lock).toMatchObject({
      totalCount: 5,
      answeredCount: 5,
      blockedCount: 0,
      releaseReady: true
    });
    expect(arena.lanes.map((lane) => lane.objection)).toEqual(
      expect.arrayContaining(["ADKやLangGraphで十分では？", "ROIが机上では？", "提出URLは本当に最新実装ですか？"])
    );
    expect(arena.a2aPayload).toMatchObject({
      skill: "judge.objection-arena",
      endpoints: {
        winnerPacket: "https://example.com/api/winner-packet"
      }
    });
  });

  test("does not call Q&A ready when release or criteria proof is blocked", () => {
    const arena = buildObjectionArena(packet({ releaseReady: false, blockedCriterion: true }));

    expect(arena.readiness).toBe("needs-proof");
    expect(arena.lock.blockedCount).toBe(2);
    expect(arena.closingLine).toBe("Redeploy latest main.");
  });

  test("renders a direct-open judge page", () => {
    const html = renderObjectionArenaHtml(buildObjectionArena(packet()));

    expect(html).toContain("Objection Arena");
    expect(html).toContain("ADKやLangGraphで十分では？");
    expect(html).toContain("https://example.com/api/competitive-battlecard");
  });
});
