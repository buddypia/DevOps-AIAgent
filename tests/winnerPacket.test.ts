import { describe, expect, test } from "vitest";
import type { JudgeAcceptanceMatrix } from "../src/acceptanceMatrix";
import type { CompetitiveBattlecard } from "../src/competitiveBattlecard";
import type { JudgeRehearsalRoom } from "../src/judgeRehearsal";
import type { PilotEconomics } from "../src/pilotEconomics";
import type { PrizeStrategyBoard } from "../src/prizeStrategy";
import { buildReleaseDriftGuard, type ReleaseDriftProbe } from "../src/releaseDrift";
import type { SubmissionCloseoutWorkbench } from "../src/submissionCloseout";
import { SUBMISSION_PROOF } from "../src/submission";
import { buildWinnerProofPacket } from "../src/winnerPacket";

const baseUrl = SUBMISSION_PROOF.deployedUrl;

function passedProbe(id: string): ReleaseDriftProbe {
  return {
    id,
    label: id,
    status: "passed",
    score: 100,
    url: `${baseUrl}/${id}`,
    evidence: `${id} passed.`,
    required: true
  };
}

function releaseDriftFixture(mode: "current" | "drift" = "current") {
  return buildReleaseDriftGuard({
    currentBaseUrl: "http://localhost:8080",
    targetBaseUrl: baseUrl,
    expectedSkillIds: ["winner.packet", "release.drift", "judge.rehearsal", "win.gap.radar"],
    observedSkillIds: ["winner.packet", "release.drift", "judge.rehearsal", "win.gap.radar"],
    requiredSkillIds: ["winner.packet", "release.drift", "judge.rehearsal", "win.gap.radar"],
    requiredAgentCardSignals: ["judge.rehearsal:tag:recording-lock", "win.gap.radar:tag:feature-freeze-lock"],
    observedAgentCardSignals: mode === "current" ? ["judge.rehearsal:tag:recording-lock", "win.gap.radar:tag:feature-freeze-lock"] : [],
    generatedAt: "2026-06-18T00:00:00.000Z",
    probes: [
      passedProbe("target-health"),
      {
        ...passedProbe("agent-card-skill-surface"),
        status: mode === "current" ? "passed" : "watch",
        score: mode === "current" ? 100 : 58,
        evidence: mode === "current" ? "Target Agent Card exposes required winner signals." : "Target Agent Card misses required winner signals."
      },
      passedProbe("acceptance-endpoint"),
      passedProbe("a2a-artifact"),
      passedProbe("ci-main")
    ]
  });
}

function fixture(input: { closeoutReady?: boolean; blockedAcceptance?: boolean; releaseMode?: "current" | "drift" | "none" } = {}) {
  const releaseDrift = input.releaseMode === "none" ? undefined : releaseDriftFixture(input.releaseMode ?? "current");
  const acceptance = {
    acceptanceScore: input.blockedAcceptance || input.releaseMode === "drift" ? 61 : 93,
    verdict: input.blockedAcceptance || input.releaseMode === "drift" ? "not-accepted" : input.closeoutReady ? "ready-to-submit" : "accepted-with-external-gaps"
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
    closeout,
    releaseDrift
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
    expect(packet.releaseLock).toMatchObject({
      readiness: "release-current",
      status: "ready",
      verdict: "release-current"
    });
    expect(packet.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "winner.packet",
      readiness: "external-gap-packet",
      releaseLock: {
        readiness: "release-current",
        verdict: "release-current"
      },
      endpoints: {
        winnerPacket: `${baseUrl}/api/winner-packet`,
        judgeRehearsal: `${baseUrl}/api/judge-rehearsal`,
        releaseDrift: `${baseUrl}/api/release-drift`
      }
    });
  });

  test("becomes winner-packet-ready once external closeout is ready", () => {
    const packet = fixture({ closeoutReady: true });

    expect(packet.readiness).toBe("winner-packet-ready");
    expect(packet.submissionCopy.missingExternal).toHaveLength(0);
    expect(packet.releaseLock.status).toBe("ready");
    expect(packet.nextAction).toContain("Record");
  });

  test("blocks when acceptance is not accepted", () => {
    const packet = fixture({ blockedAcceptance: true });

    expect(packet.readiness).toBe("needs-proof");
    expect(packet.nextAction).toContain("Fix");
  });

  test("blocks the winner packet when the public Cloud Run revision is stale", () => {
    const packet = fixture({ closeoutReady: true, releaseMode: "drift" });

    expect(packet.readiness).toBe("needs-proof");
    expect(packet.releaseLock).toMatchObject({
      readiness: "release-drift-watch",
      status: "blocked",
      verdict: "deploy-drift",
      missingAgentCardSignals: ["judge.rehearsal:tag:recording-lock", "win.gap.radar:tag:feature-freeze-lock"]
    });
    expect(packet.nextAction).toContain("Cloud Run");
    expect(packet.a2aPayload).toMatchObject({
      releaseLock: {
        status: "blocked",
        verdict: "deploy-drift"
      }
    });
  });
});
