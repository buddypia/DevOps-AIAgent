import { describe, expect, test } from "vitest";
import type { JudgeAcceptanceMatrix } from "../src/acceptanceMatrix";
import type { CompetitiveBattlecard } from "../src/competitiveBattlecard";
import type { JudgeRehearsalRoom } from "../src/judgeRehearsal";
import type { PilotEconomics } from "../src/pilotEconomics";
import type { PrizeStrategyBoard } from "../src/prizeStrategy";
import type { SubmissionCloseoutWorkbench } from "../src/submissionCloseout";
import { SUBMISSION_PROOF } from "../src/submission";
import { buildWinnerProofPacket } from "../src/winnerPacket";

const baseUrl = SUBMISSION_PROOF.deployedUrl;

function fixture(input: { closeoutReady?: boolean; blockedAcceptance?: boolean } = {}) {
  const acceptance = {
    acceptanceScore: input.blockedAcceptance ? 61 : 93,
    verdict: input.blockedAcceptance ? "not-accepted" : input.closeoutReady ? "ready-to-submit" : "accepted-with-external-gaps"
  } as JudgeAcceptanceMatrix;
  const battlecard = {
    battleScore: 91,
    readiness: "judge-ready",
    thesis: "AI能力を買い、検収する市場体験で差別化する。",
    cards: [
      {
        id: "google-adk",
        competitor: "Google ADK",
        score: 90,
        judgeQuestion: "ADKで十分では？",
        shortAnswer: "ADKは作る基盤。この作品は、どのAI能力を買い、検収し、提出証拠へ変えるかを扱う。",
        recordingCue: "ADKとの差分をBattlecardで見せる。"
      }
    ],
    topRisks: [{ id: "google-adk", severity: "medium", risk: "ADKとの差分が薄く見える。", response: "A2A委任と検収面で差別化する。" }]
  } as CompetitiveBattlecard;
  const pilotEconomics = {
    economicsScore: 91,
    verdict: "21日で投資回収できる。",
    unitEconomics: { paybackDays: 21 },
    buyerObjections: [{ id: "existing-tools", objection: "既存ツールでよいのでは？", answer: "証拠検収まで閉じる点が違う。" }]
  } as PilotEconomics;
  const prize = {
    prizeScore: 90,
    winHypothesis: "最初の90秒でAI能力調達と公開検収を証明する。",
    criteria: [
      { id: "agent-centrality", label: "AI agent centrality", currentScore: 91, targetScore: 92, decisiveProof: "A2A payloadが中心。" },
      { id: "approach", label: "Problem approach", currentScore: 88, targetScore: 92, decisiveProof: "BattlecardとSWOTで差別化。" },
      { id: "usability", label: "Usability", currentScore: 86, targetScore: 92, decisiveProof: "Rehearsalが初回導線を固定。" },
      { id: "practicality", label: "Practical value", currentScore: 88, targetScore: 92, decisiveProof: "Pilot Economicsで回収性を示す。" },
      { id: "implementation", label: "Implementation", currentScore: 90, targetScore: 92, decisiveProof: "Release Driftで公開検収。" }
    ]
  } as PrizeStrategyBoard;
  const rehearsal = {
    rehearsalScore: 84,
    segments: [
      { id: "open-command", timeRange: "0-12s", screen: "Judge Command Center", proofUrl: `${baseUrl}/api/judge-command-center`, status: "watch" },
      { id: "competitive-proof", timeRange: "42-58s", screen: "Competitive Battlecard", proofUrl: `${baseUrl}/api/competitive-battlecard`, status: "watch" }
    ],
    questionDeck: [
      { id: "dashboard", question: "単なるダッシュボードでは？", answer: "AIの判断連鎖として実行します。", proofUrl: `${baseUrl}/api/judge-rehearsal`, status: "ready" }
    ]
  } as JudgeRehearsalRoom;
  const closeout = {
    closeoutScore: input.closeoutReady ? 91 : 86,
    readiness: input.closeoutReady ? "ready-to-submit" : "needs-closeout",
    nextAction: { label: input.closeoutReady ? "Submit final three URLs" : "Record and publish demo video" },
    urlStatuses: input.closeoutReady
      ? [
          { id: "protopedia-url", status: "ready" },
          { id: "video-url", status: "ready" }
        ]
      : [
          { id: "protopedia-url", status: "missing" },
          { id: "video-url", status: "missing" }
        ]
  } as SubmissionCloseoutWorkbench;

  return buildWinnerProofPacket({
    baseUrl,
    acceptance,
    battlecard,
    pilotEconomics,
    prize,
    rehearsal,
    closeout
  });
}

describe("winner proof packet", () => {
  test("bundles five judge criteria into one external-gap packet", () => {
    const packet = fixture();

    expect(packet.readiness).toBe("external-gap-packet");
    expect(packet.packetScore).toBeGreaterThanOrEqual(86);
    expect(packet.criteria.map((criterion) => criterion.id)).toEqual(["agent-centrality", "approach", "usability", "practicality", "implementation"]);
    expect(packet.criteria.every((criterion) => criterion.proofUrl.startsWith(baseUrl))).toBe(true);
    expect(packet.judgeQuestions.length).toBeGreaterThanOrEqual(2);
    expect(packet.submissionCopy.missingExternal).toEqual(["protopedia-url", "video-url"]);
    expect(packet.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "winner.packet",
      readiness: "external-gap-packet",
      endpoints: {
        winnerPacket: `${baseUrl}/api/winner-packet`,
        judgeRehearsal: `${baseUrl}/api/judge-rehearsal`
      }
    });
  });

  test("becomes winner-packet-ready once external closeout is ready", () => {
    const packet = fixture({ closeoutReady: true });

    expect(packet.readiness).toBe("winner-packet-ready");
    expect(packet.submissionCopy.missingExternal).toHaveLength(0);
    expect(packet.nextAction).toContain("Record");
  });

  test("blocks when acceptance is not accepted", () => {
    const packet = fixture({ blockedAcceptance: true });

    expect(packet.readiness).toBe("needs-proof");
    expect(packet.nextAction).toContain("Fix");
  });
});
