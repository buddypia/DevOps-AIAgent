import { describe, expect, test } from "vitest";
import { localGeminiRecommendation, recommendSquad } from "../src/agentEngine";
import { buildWinningAutopilot } from "../src/autopilot";
import { buildCompetitiveBattlecard } from "../src/competitiveBattlecard";
import { buildSquadContract } from "../src/contracts";
import { buildDemoRunway } from "../src/demoRunway";
import { buildSubmissionDossier } from "../src/dossier";
import { buildFinalistSimulation } from "../src/finalist";
import { buildImpactCase } from "../src/impact";
import { buildJudgeDrill } from "../src/judgeDrill";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMarketIntelReport } from "../src/marketIntel";
import { buildMissionRun } from "../src/mission";
import { buildMoatStressTest } from "../src/moatStress";
import { buildOpsDrill } from "../src/ops";
import { buildPitchRun } from "../src/pitch";
import { buildPilotEconomics } from "../src/pilotEconomics";
import { buildJudgeProof } from "../src/proof";
import type { CiProof } from "../src/proof";
import { buildProtoPediaPublisher } from "../src/publisher";
import { buildSecurityReview } from "../src/security";
import { SUBMISSION_PROOF } from "../src/submission";
import { buildWinningStrategy } from "../src/strategy";
import { buildUserPilotLab } from "../src/userPilot";

describe("submission dossier", () => {
  test("packages copy blocks, proof links, and recording steps for final external submission", () => {
    const baseUrl = "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app";
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
    const strategy = buildWinningStrategy(recommendation);
    const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
    const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
    const battlecard = buildCompetitiveBattlecard({ baseUrl, strategy, marketIntel, moatStress });
    const mission = buildMissionRun(recommendation, strategy);
    const opsDrill = buildOpsDrill(recommendation, strategy);
    const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
    const pitch = buildPitchRun({ baseUrl, recommendation, strategy, mission, opsDrill });
    const judgeDrill = buildJudgeDrill({ baseUrl, recommendation, strategy, mission, opsDrill, pitch });
    const finalist = buildFinalistSimulation({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, judgeDrill, squadContract });
    const publisher = buildProtoPediaPublisher({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist });
    const demoRunway = buildDemoRunway({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist, publisher, battlecard });
    const ci: CiProof = {
      status: "passed",
      conclusion: "success",
      url: SUBMISSION_PROOF.ciWorkflowUrl,
      workflowUrl: SUBMISSION_PROOF.ciWorkflowUrl,
      branch: "main",
      checkedAt: "2026-06-18T00:00:00.000Z",
      evidence: "Latest main CI run completed successfully.",
      runId: 1
    };
    const proof = buildJudgeProof({
      baseUrl,
      recommendation,
      strategy,
      mission,
      opsDrill,
      gemini: localGeminiRecommendation(recommendation, "test"),
      ci
    });
    const securityReview = buildSecurityReview({
      baseUrl,
      recommendation,
      strategy,
      allowlist: { exactIpCount: 126, localDevelopmentCidrCount: 2, rakutenMobileCidrCount: 65 },
      ci,
      geminiSecretConfigured: true
    });
    const impactCase = buildImpactCase({ recommendation, strategy, opsDrill, securityReview });
    const userPilot = buildUserPilotLab({
      recommendation,
      strategy,
      impactCase,
      opsDrill,
      securityReview,
      squadContract
    });
    const pilotEconomics = buildPilotEconomics({
      recommendation,
      strategy,
      impactCase,
      userPilot,
      squadContract,
      opsDrill,
      securityReview
    });
    const autopilot = buildWinningAutopilot({
      baseUrl,
      recommendation,
      strategy,
      mission,
      opsDrill,
      squadContract,
      pitch,
      finalist,
      publisher,
      demoRunway,
      proof
    });
    const dossier = buildSubmissionDossier({
      recommendation,
      strategy,
      mission,
      pitch,
      finalist,
      publisher,
      demoRunway,
      autopilot,
      proof,
      battlecard,
      impactCase,
      pilotEconomics
    });

    expect(dossier.dossierScore).toBeGreaterThanOrEqual(84);
    expect(dossier.readiness).toBe("needs-external-urls");
    expect(dossier.copyBlocks.map((block) => block.id)).toEqual(
      expect.arrayContaining([
        "title",
        "one-liner",
        "problem",
        "users",
        "features",
        "technology",
        "demo-flow",
        "competitive-objections",
        "buyer-value-proof",
        "judge-proof",
        "tags"
      ])
    );
    expect(dossier.links.map((link) => link.id)).toEqual(expect.arrayContaining(["github", "cloud-run", "ci", "architecture", "protopedia", "video"]));
    expect(dossier.links.filter((link) => link.status === "watch").map((link) => link.id)).toEqual(expect.arrayContaining(["protopedia", "video"]));
    expect(dossier.recordingPlan[0]).toContain("Market Intel");
    expect(dossier.recordingPlan[1]).toContain("MVP Audit");
    expect(dossier.recordingPlan[2]).toContain("Win Autopilot");
    expect(dossier.handoffPacket.submitFields.map((field) => field.id)).toEqual(["github-url", "deployed-url", "protopedia-url", "video-url", "findy-tag"]);
    expect(dossier.handoffPacket.submitFields.find((field) => field.id === "findy-tag")).toMatchObject({
      value: "findy_hackathon",
      status: "ready"
    });
    expect(dossier.handoffPacket.protopediaFields.map((field) => field.id)).toEqual(expect.arrayContaining(["problem", "features", "technology", "tags"]));
    expect(dossier.handoffPacket.qualityLock).toMatchObject({
      readiness: "copy-locked",
      requiredTag: "findy_hackathon",
      checks: expect.arrayContaining([
        expect.objectContaining({ id: "judge-criteria", status: "ready" }),
        expect.objectContaining({ id: "competitive-swot", status: "ready" }),
        expect.objectContaining({ id: "external-url-closure", status: "watch" })
      ])
    });
    expect(dossier.handoffPacket.qualityLock.qualityScore).toBeGreaterThanOrEqual(90);
    expect(dossier.handoffPacket.videoChapters.length).toBeGreaterThanOrEqual(8);
    expect(dossier.handoffPacket.competitiveReceipts.find((receipt) => receipt.id === "google-adk")).toMatchObject({
      competitor: expect.stringContaining("ADK"),
      status: expect.stringMatching(/ready|watch/),
      protopediaLine: expect.stringContaining("本作")
    });
    expect(dossier.handoffPacket.buyerValueReceipts.map((receipt) => receipt.id)).toEqual(
      expect.arrayContaining(["practical-impact", "pilot-economics", "buyer-existing-tools", "buyer-roi-assumption"])
    );
    expect(dossier.handoffPacket.buyerValueReceipts.find((receipt) => receipt.id === "pilot-economics")).toMatchObject({
      status: "ready",
      metric: expect.stringContaining("payback"),
      protopediaLine: expect.stringContaining("回収")
    });
    expect(dossier.handoffPacket.architecturePack).toMatchObject({
      readiness: "needs-external-urls",
      diagramUrl: `${baseUrl}/assets/a2a-marketplace-architecture.svg`
    });
    expect(dossier.handoffPacket.architecturePack.requirements.map((requirement) => requirement.id)).toEqual(
      expect.arrayContaining(["cloud-run", "google-ai", "a2a", "protopedia-architecture"])
    );
    expect(dossier.handoffPacket.missingOnly.map((item) => item.id)).toEqual(expect.arrayContaining(["protopedia-url", "video-url"]));
    expect(dossier.markdown).toContain("30秒動画録画順");
    expect(dossier.markdown).toContain("ProtoPedia品質ロック");
    expect(dossier.markdown).toContain("copy-locked");
    expect(dossier.markdown).toContain("競合反論レシート");
    expect(dossier.markdown).toContain("Google ADK");
    expect(dossier.markdown).toContain("実用性・買い手価値レシート");
    expect(dossier.markdown).toContain("回収");
    expect(dossier.markdown).toContain("提出フォームパケット");
    expect(dossier.markdown).toContain("動画チャプター");
    expect(dossier.markdown).toContain("システム構成図パケット");
    expect(dossier.markdown).toContain("needs external URL");
    expect(dossier.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "submission.dossier",
      readiness: "needs-external-urls",
      handoffPacket: {
        submitFields: expect.arrayContaining([expect.objectContaining({ id: "github-url", status: "ready" })]),
        qualityLock: {
          readiness: "copy-locked",
          checks: expect.arrayContaining([expect.objectContaining({ id: "external-url-closure", status: "watch" })])
        },
        videoChapters: expect.arrayContaining([expect.objectContaining({ id: "proof-first" })]),
        competitiveReceipts: expect.arrayContaining([expect.objectContaining({ id: "google-adk" })]),
        buyerValueReceipts: expect.arrayContaining([expect.objectContaining({ id: "pilot-economics" })]),
        architecturePack: {
          readiness: "needs-external-urls",
          diagramUrl: `${baseUrl}/assets/a2a-marketplace-architecture.svg`
        },
        missingOnly: expect.arrayContaining([expect.objectContaining({ id: "protopedia-url" })])
      }
    });
  });
});
