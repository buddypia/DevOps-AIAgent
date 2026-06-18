import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildSquadContract } from "../src/contracts";
import { buildImpactCase } from "../src/impact";
import { buildLiveEvidenceRun, type LiveEvidenceProbe } from "../src/liveEvidence";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMissionRun } from "../src/mission";
import { buildObservabilityOracle, OBSERVABILITY_ORACLE_REQUIRED_SIGNAL, OBSERVABILITY_ORACLE_SKILL_ID, renderObservabilityOracleHtml } from "../src/observabilityOracle";
import { buildOpsDrill } from "../src/ops";
import { buildPilotEconomics } from "../src/pilotEconomics";
import type { CiProof } from "../src/proof";
import { buildSecurityReview } from "../src/security";
import { SUBMISSION_PROOF } from "../src/submission";
import { buildWinningStrategy } from "../src/strategy";
import { buildUserPilotLab } from "../src/userPilot";

const allowlist = {
  exactIpCount: 126,
  localDevelopmentCidrCount: 2,
  rakutenMobileCidrCount: 65
};

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

const passedProbe = (id: string): LiveEvidenceProbe => ({
  id,
  label: id,
  status: "passed",
  score: 100,
  url: `${SUBMISSION_PROOF.deployedUrl}/${id}`,
  evidence: `${id} passed`,
  latencyMs: 42,
  required: true
});

function fixture(options: { degradedOps?: boolean; missingLiveProof?: boolean } = {}) {
  const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre", "observability-oracle"], 140);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "運用観測を買い手価値へ変換する。");
  const opsDrill = buildOpsDrill(
    recommendation,
    strategy,
    options.degradedOps
      ? { healthOk: false, latencyP95Ms: 1800, errorRatePercent: 10, budgetBurnPercent: 98 }
      : { healthOk: true, fallbackActive: false, latencyP95Ms: 320, errorRatePercent: 0, budgetBurnPercent: 52, submissionUrlsReady: true }
  );
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const securityReview = buildSecurityReview({
    baseUrl: SUBMISSION_PROOF.deployedUrl,
    recommendation,
    strategy,
    allowlist,
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
  const probes = ["health", "agent-card", "squad-optimizer", "a2a", "ci"].map(passedProbe);
  const liveEvidence = buildLiveEvidenceRun({
    baseUrl: SUBMISSION_PROOF.deployedUrl,
    generatedAt: "2026-06-18T00:00:00.000Z",
    probes: options.missingLiveProof ? [{ ...passedProbe("health"), status: "missing", score: 0, evidence: "HTTP 500" }, ...probes.slice(1)] : probes
  });

  return buildObservabilityOracle({
    baseUrl: SUBMISSION_PROOF.deployedUrl,
    recommendation,
    strategy,
    liveEvidence,
    opsDrill,
    pilotEconomics
  });
}

describe("observability oracle", () => {
  test("turns live operations evidence into buyer-facing proof", () => {
    const oracle = fixture();

    expect(oracle.readiness).toBe("operator-ready");
    expect(oracle.oracleScore).toBeGreaterThanOrEqual(88);
    expect(oracle.receipts.map((receipt) => receipt.id)).toEqual(
      expect.arrayContaining(["public-proof", "runtime-decision", "buyer-slo", "rebuy-loop"])
    );
    expect(oracle.decisions.find((decision) => decision.id === "serve-or-rollback")?.decision).toContain("Keep serving");
    expect(oracle.loop.map((step) => step.phase)).toEqual(["observe", "decide", "monetize", "rebuy", "seal"]);
    expect(oracle.a2aPayload).toMatchObject({
      method: "message/send",
      skill: OBSERVABILITY_ORACLE_SKILL_ID,
      readiness: "operator-ready",
      endpoints: {
        observabilityOraclePage: `${SUBMISSION_PROOF.deployedUrl}/observability-oracle`
      }
    });
    expect(OBSERVABILITY_ORACLE_REQUIRED_SIGNAL).toBe("observability.oracle:tag:observability-oracle-lock");

    const html = renderObservabilityOracleHtml({
      ...oracle,
      headline: "<script>alert('ops')</script>"
    });
    expect(html).toContain("Observability Oracle Proof");
    expect(html).toContain("Operate Loop");
    expect(html).toContain("&lt;script&gt;alert(&#39;ops&#39;)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert('ops')</script>");
  });

  test("requires recovery when live proof or runtime signals fail", () => {
    const oracle = fixture({ degradedOps: true, missingLiveProof: true });

    expect(oracle.readiness).toBe("rollback-required");
    expect(oracle.receipts.find((receipt) => receipt.id === "public-proof")?.status).toBe("blocked");
    expect(oracle.receipts.find((receipt) => receipt.id === "runtime-decision")?.status).toBe("blocked");
    expect(oracle.decisions.find((decision) => decision.id === "serve-or-rollback")?.decision).toContain("Rollback");
  });
});
