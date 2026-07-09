import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildOutcomeSnapshot } from "../src/outcomeSnapshot";
import type { PilotRunReceiptInput } from "../src/pilotRunReceipt";
import { buildValueBlueprint } from "../src/valueBlueprint";

const publicWorkspace = {
  targetUrl: "https://a2a-marketplace.run.app",
  protopediaUrl: "https://protopedia.net/prototype/a2a-marketplace",
  videoUrl: "https://youtu.be/demo",
  agentTrialEvidence: [
    {
      id: "trial-proof-trial-custom-agent-card-auditor",
      receiptId: "trial-custom-agent-card-auditor",
      agentId: "custom-agent-card-auditor",
      agentName: "Agent Card Auditor",
      skillId: "agent-card.audit",
      status: "accepted" as const,
      score: 100,
      artifactUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/agent-card-audit/receipt.json",
      evidenceSource: "Cloud Run public logs and signed A2A receipt",
      headline: "Trial evidence satisfies the generated A2A receipt",
      summary: "Agent Card Auditor returned an accepted A2A proof receipt.",
      attachedAt: "2026-06-18T00:00:00.000Z"
    }
  ]
};

const acceptedPilotRun: PilotRunReceiptInput = {
  observedManualMinutes: 1680,
  observedAssistedMinutes: 560,
  participants: 4,
  acceptedTasks: 3,
  totalTasks: 3,
  evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/pilot-run/receipt.json",
  reviewerName: "Platform sponsor",
  notes: "Observed run completed with evidence attached."
};

function buildInput(overrides: { weak?: boolean; workspace?: typeof publicWorkspace; pilotRun?: PilotRunReceiptInput } = {}) {
  const projectBrief = overrides.weak
    ? "Short AI demo"
    : `${DEFAULT_PROJECT_BRIEF}\nGlobal platform teams need a buyer-ready pilot path with Cloud Run proof, security approval, and measurable operational value.`;
  const recommendation = overrides.weak
    ? recommendSquad(projectBrief, ["brief-cartographer"], 140)
    : recommendSquad(projectBrief, ["market-broker", "cloud-run-sre", "gemini-strategist", "ux-guildmaster", "security-sentinel"], 260);
  const valueBlueprint = buildValueBlueprint(recommendation, projectBrief);
  const buyerScenario = buildBuyerValueScenario(
    recommendation,
    overrides.weak
      ? {
          teamSize: 2,
          hourlyCostYen: 3500,
          cyclesPerMonth: 1,
          manualHoursPerCycle: 5,
          adoptionRatePercent: 15,
          incidentRiskYenPerMonth: 0
        }
      : {
          teamSize: 8,
          hourlyCostYen: 12000,
          cyclesPerMonth: 5,
          manualHoursPerCycle: 28,
          adoptionRatePercent: 75,
          incidentRiskYenPerMonth: 240000
        }
  );

  return {
    recommendation,
    valueBlueprint,
    buyerScenario,
    workspace: overrides.workspace ?? publicWorkspace,
    pilotRun: overrides.pilotRun ?? acceptedPilotRun
  };
}

describe("outcome snapshot", () => {
  test("marks a closed buyer proof path as publish-ready", () => {
    const snapshot = buildOutcomeSnapshot(buildInput());

    expect(snapshot.readiness).toBe("publish-ready");
    expect(snapshot.outcomeScore).toBe(100);
    expect(snapshot.nextAction).toMatchObject({
      id: "share-proof-packet",
      href: "#buyer-proof-packet"
    });
    expect(snapshot.checks.every((check) => check.status === "complete")).toBe(true);
    expect(snapshot.primaryMetric.value).toContain("¥");
  });

  test("prioritizes public proof when buyer value is already credible", () => {
    const snapshot = buildOutcomeSnapshot(
      buildInput({
        workspace: {
          targetUrl: "",
          protopediaUrl: "",
          videoUrl: "",
          agentTrialEvidence: []
        }
      })
    );

    expect(snapshot.readiness).toBe("needs-proof");
    expect(snapshot.nextAction).toMatchObject({
      id: "fix-deployment-proof",
      href: "#launch-evidence-console",
      priority: "now"
    });
    expect(snapshot.checks.find((check) => check.id === "buyer-value")?.status).toBe("complete");
    expect(snapshot.checks.find((check) => check.id === "deployment-proof")?.status).toBe("blocked");
  });

  test("blocks on buyer value before treating proof as the fix", () => {
    const snapshot = buildOutcomeSnapshot(buildInput({ weak: true }));

    expect(snapshot.readiness).toBe("needs-value");
    expect(snapshot.nextAction).toMatchObject({
      id: "fix-buyer-value",
      href: "#buyer-value-simulator"
    });
    expect(snapshot.nextAction.action).not.toContain("Seal this value claim");
    expect(snapshot.headline).toContain("Buyer value");
  });

  test("does not count localhost as public deployment proof", () => {
    const snapshot = buildOutcomeSnapshot(
      buildInput({
        workspace: {
          ...publicWorkspace,
          targetUrl: "http://localhost:5173"
        }
      })
    );

    expect(snapshot.readiness).toBe("needs-proof");
    expect(snapshot.checks.find((check) => check.id === "deployment-proof")).toMatchObject({
      status: "blocked",
      href: "#launch-evidence-console"
    });
  });

  test("does not count plain HTTP as public deployment proof", () => {
    const snapshot = buildOutcomeSnapshot(
      buildInput({
        workspace: {
          ...publicWorkspace,
          targetUrl: "http://a2a-marketplace.run.app"
        }
      })
    );

    expect(snapshot.readiness).toBe("needs-proof");
    expect(snapshot.checks.find((check) => check.id === "deployment-proof")).toMatchObject({
      status: "blocked"
    });
  });
});
