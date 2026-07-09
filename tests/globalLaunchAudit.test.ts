import { describe, expect, it } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import type { AgentTrialEvidenceRecord } from "../src/agentTrialEvidence";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import type { BuyerWorkOrderInput } from "../src/buyerWorkOrder";
import { buildGlobalLaunchAudit, renderGlobalLaunchAuditHtml } from "../src/globalLaunchAudit";
import { LAUNCH_ROOM_HANDOFF_RECEIPT_VERIFY_PATH, type LaunchRoom } from "../src/launchRoom";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import type { PilotRunReceiptInput } from "../src/pilotRunReceipt";
import { buildValueBlueprint } from "../src/valueBlueprint";

const selectedAgentIds = ["market-broker", "cloud-run-sre", "test-forge", "security-sentinel", "observability-oracle"];

function acceptedTrialEvidence(agentName: string, score: number): AgentTrialEvidenceRecord {
  return {
    id: `trial-proof-${agentName}`,
    receiptId: `receipt-${agentName}`,
    agentId: `agent-${agentName}`,
    agentName,
    skillId: "global-launch-proof",
    status: "accepted",
    score,
    artifactUrl: `https://evidence.example/${agentName}`,
    evidenceSource: "Recorded A2A trial",
    headline: `${agentName} passed the trial`,
    summary: `${agentName} returned accepted proof.`,
    attachedAt: "2026-06-20T00:00:00.000Z"
  };
}

function valueProofLedger(status: LaunchRoom["valueProofLedger"]["status"]): LaunchRoom["valueProofLedger"] {
  return {
    status,
    headline: status === "ready" ? "Value proof survives downside review" : "Value proof needs review",
    summary: "Fixture value ledger for global launch audit tests.",
    confidenceBand: "700,000 yen - 1,200,000 yen / month",
    breakEvenAdoption: "42%",
    valueAtRisk: "240,000 yen",
    pilotEvidence: {
      status,
      value: "900,000 yen measured / month",
      evidence: "82m saved/run, 90% accepted, reviewer Global ops lead.",
      href: "https://launch.example/pilot-run-receipt"
    },
    cases: [
      { id: "pessimistic", label: "Pessimistic", status, monthlyValue: "700,000 yen", monthlyHoursSaved: "42h", paybackDays: "36 days", adoption: "50% adoption / 48% automation", evidence: "Fixture downside case." },
      { id: "base", label: "Base", status, monthlyValue: "900,000 yen", monthlyHoursSaved: "56h", paybackDays: "24 days", adoption: "75% adoption / 64% automation", evidence: "Fixture base case." },
      { id: "upside", label: "Upside", status, monthlyValue: "1,200,000 yen", monthlyHoursSaved: "72h", paybackDays: "18 days", adoption: "90% adoption / 72% automation", evidence: "Fixture upside case." }
    ],
    guardrails: [
      { id: "break-even-adoption", label: "Break-even adoption", status, value: "42%", evidence: "Fixture adoption floor." },
      { id: "downside-payback", label: "Downside payback", status, value: "36 days", evidence: "Fixture downside payback." },
      { id: "value-at-risk", label: "Value at risk", status, value: "240,000 yen", evidence: "Fixture value at risk." }
    ],
    exportMarkdown: "# Launch room value proof ledger",
    href: "data:text/markdown;charset=utf-8,%23%20Launch%20room%20value%20proof%20ledger"
  };
}

function launchRoom(status: LaunchRoom["readiness"], artifactStatus: "ready" | "attention" | "blocked"): LaunchRoom {
  const artifacts = [
    "buyer-value",
    "work-order-brief",
    "buyer-proof-packet",
    "sponsor-review",
    "pilot-run-receipt",
    "adoption-plan",
    "trust-center",
    "commercial-offer"
  ].map((id) => ({
    id,
    label: id,
    href: `https://launch.example/${id}`,
    status: artifactStatus,
    owner: "Launch owner",
    summary: `${id} summary`,
    proof: `${id} proof`
  }));

  return {
    id: `launch-room-${status}`,
    readiness: status,
    launchScore: status === "buyer-ready" ? 96 : 58,
    headline: "Launch room",
    hardTruth: "Launch room truth",
    targetBuyer: "Global ops lead",
    projectBrief: DEFAULT_PROJECT_BRIEF,
    primaryMetric: {
      id: "modeled-monthly-value",
      label: "Modeled monthly buyer value",
      value: "1,000,000 yen",
      status: artifactStatus,
      evidence: "Buyer value evidence"
    },
    metrics: [
      {
        id: "public-proof",
        label: "Public proof closure",
        value: artifactStatus === "ready" ? "8/8" : "3/8",
        status: artifactStatus,
        evidence: "Public proof evidence"
      }
    ],
    nextAction: {
      label: "Next proof",
      owner: "Launch owner",
      action: "Close the next proof gap.",
      href: "#launch-evidence-console"
    },
    artifacts,
    closurePlan: [],
    agents: [],
    proofHealth: {
      readiness: artifactStatus === "ready" ? "evidence-current" : artifactStatus === "attention" ? "evidence-watch" : "evidence-blocked",
      status: artifactStatus,
      score: artifactStatus === "ready" ? 100 : artifactStatus === "attention" ? 72 : 24,
      checkedAt: "2026-06-20T01:00:00.000Z",
      verifiedCount: artifactStatus === "ready" ? 5 : 3,
      totalCount: 5,
      blockedCount: artifactStatus === "blocked" ? 1 : 0,
      watchCount: artifactStatus === "attention" ? 1 : 0,
      summary: "Live proof health summary",
      instruction: "Keep proof health current."
    },
    valueProofLedger: valueProofLedger(artifactStatus),
    buyerDecision: {
      verdict: artifactStatus === "ready" ? "send" : artifactStatus === "attention" ? "pilot-review" : "hold",
      status: artifactStatus,
      headline: artifactStatus === "ready" ? "Send this to a buyer pilot" : artifactStatus === "attention" ? "Keep this in sponsor review" : "Hold buyer sharing",
      instruction: "Buyer decision summary",
      buyerQuestion: "What should the buyer decide?",
      checks: []
    },
    handoffPacket: {
      status: artifactStatus,
      sendInstruction: "Buyer handoff summary",
      subject: "Launch room handoff",
      preview: "Buyer handoff preview",
      emailBody: ["Hi Global ops lead team,", "Please review the launch room."],
      agenda: [],
      acceptanceChecks: [],
      recommendedReply: artifactStatus === "ready" ? "approve" : artifactStatus === "attention" ? "revise" : "hold",
      replyRoutes: [],
      decisionReceipt: {
        receiptId: `launch-handoff-${artifactStatus}`,
        checksumAlgorithm: "fnv1a-64",
        checksum: "0000000000000000",
        verificationApiPath: LAUNCH_ROOM_HANDOFF_RECEIPT_VERIFY_PATH,
        selectedReply: artifactStatus === "ready" ? "approve" : artifactStatus === "attention" ? "revise" : "hold",
        status: artifactStatus,
        launchDecision: artifactStatus === "ready" ? "send" : artifactStatus === "attention" ? "pilot-review" : "hold",
        targetBuyer: "Global ops lead",
        owner: "Global ops lead",
        subject: "Launch room handoff",
        record: "Record the launch-room reply.",
        nextAction: "Keep the launch-room evidence current.",
        evidence: "What should the buyer decide?",
        replayFields: [],
        replayPayload: {
          launchRoomId: "launch-room-fixture",
          launchDecision: artifactStatus === "ready" ? "send" : artifactStatus === "attention" ? "pilot-review" : "hold",
          targetBuyer: "Global ops lead",
          selectedReply: artifactStatus === "ready" ? "approve" : artifactStatus === "attention" ? "revise" : "hold",
          routeStatus: artifactStatus,
          record: "Record the launch-room reply.",
          nextAction: "Keep the launch-room evidence current.",
          evidence: "What should the buyer decide?",
          proofHealth: {
            readiness: "evidence-current",
            score: 100,
            verifiedCount: 5,
            totalCount: 5,
            checkedAt: "2026-06-20T01:00:00.000Z"
          },
          primaryMetric: {
            label: "Buyer value",
            value: "1,000,000 yen / month",
            evidence: "Fixture metric"
          }
        },
        replayPayloadJson: "{}",
        payloadHref: "data:application/json;charset=utf-8,%7B%7D",
        verification: {
          status: "verified",
          expectedChecksum: "0000000000000000",
          actualChecksum: "0000000000000000",
          instruction: "Receipt checksum matches the attached replay payload."
        },
        copyText: "# Launch room handoff decision receipt",
        href: "data:text/markdown;charset=utf-8,%23%20Launch%20room%20handoff%20decision%20receipt"
      }
    },
    buyerCoverSheet: {
      status: artifactStatus === "ready" ? "sendable" : artifactStatus === "attention" ? "review-needed" : "hold",
      headline: artifactStatus === "ready" ? "Buyer can decide from this page" : "Keep launch room under review",
      buyerPromise: "Global ops lead gets value, proof, operating gates, and reply routing.",
      primaryAsk: "Use the launch room to decide approve, revise, or hold.",
      doNotSendIf: "Do not send if live proof regresses.",
      reviewTime: "25 min",
      signals: [],
      copyText: "# Buyer cover sheet",
      href: "data:text/markdown;charset=utf-8,%23%20Buyer%20cover%20sheet"
    },
    stakeholderBriefs: [],
    buyerActivityTrail: {
      status: artifactStatus,
      headline: artifactStatus === "ready" ? "Buyer follow-up is ready to track across stakeholders" : "Buyer follow-up needs review",
      summary: "Fixture buyer activity trail.",
      nextOwner: "Launch owner",
      nextAction: "Keep the launch-room evidence current.",
      events: [],
      copyText: "# Buyer activity trail",
      href: "data:text/markdown;charset=utf-8,%23%20Buyer%20activity%20trail",
      crmNote: "# Buyer follow-up CRM note",
      crmNoteHref: "data:text/markdown;charset=utf-8,%23%20Buyer%20follow-up%20CRM%20note",
      slackUpdate: "Buyer follow-up fixture",
      slackUpdateHref: "data:text/plain;charset=utf-8,Buyer%20follow-up%20fixture",
      taskCsv: "eventId,label,status,actor,signal,nextAction,evidence,href",
      taskCsvHref: "data:text/csv;charset=utf-8,eventId%2Clabel%2Cstatus%2Cactor%2Csignal%2CnextAction%2Cevidence%2Chref",
      followUpReceipt: {
        receiptId: `launch-follow-up-${artifactStatus}`,
        checksumAlgorithm: "fnv1a-64",
        checksum: "0000000000000000",
        verificationApiPath: "/api/launch-room/follow-up-receipt/verify",
        status: artifactStatus,
        targetBuyer: "Global ops lead",
        owner: "Launch owner",
        summary: "Fixture buyer follow-up receipt.",
        replayFields: [],
        replayPayload: {
          launchRoomId: "launch-room-fixture",
          targetBuyer: "Global ops lead",
          trailStatus: artifactStatus,
          headline: artifactStatus === "ready" ? "Buyer follow-up is ready to track across stakeholders" : "Buyer follow-up needs review",
          summary: "Fixture buyer follow-up receipt.",
          nextOwner: "Launch owner",
          nextAction: "Keep the launch-room evidence current.",
          events: [],
          exports: {
            crmNote: "# Buyer follow-up CRM note",
            slackUpdate: "Buyer follow-up fixture",
            taskCsv: "eventId,label,status,actor,signal,nextAction,evidence,href"
          }
        },
        replayPayloadJson: "{}",
        payloadHref: "data:application/json;charset=utf-8,%7B%7D",
        verification: {
          status: "verified",
          expectedChecksum: "0000000000000000",
          actualChecksum: "0000000000000000",
          instruction: "Follow-up receipt checksum matches the attached records."
        },
        copyText: "# Buyer follow-up receipt",
        href: "data:text/markdown;charset=utf-8,%23%20Buyer%20follow-up%20receipt"
      }
    },
    exportMarkdown: "# Launch room"
  };
}

function baseInputs() {
  const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, selectedAgentIds, 260);
  const valueBlueprint = buildValueBlueprint(recommendation, DEFAULT_PROJECT_BRIEF, "https://launch.example");
  const buyerScenario = buildBuyerValueScenario(recommendation, {
    teamSize: 12,
    hourlyCostYen: 12000,
    cyclesPerMonth: 6,
    manualHoursPerCycle: 32,
    adoptionRatePercent: 88,
    incidentRiskYenPerMonth: 900000
  });
  const pilotRun: PilotRunReceiptInput = {
    observedManualMinutes: 1680,
    observedAssistedMinutes: 420,
    participants: 6,
    acceptedTasks: 10,
    totalTasks: 10,
    evidenceUrl: "https://evidence.example/pilot-run",
    reviewerName: "Global ops reviewer",
    notes: "Accepted measured pilot run."
  };
  const buyerWorkOrder: BuyerWorkOrderInput = {
    request: "Turn one production-readiness workflow into a measurable buyer pilot.",
    targetUser: "Global operations lead",
    successMetric: "Accepted tasks and minutes saved per production readiness run",
    currentBaseline: "Manual release readiness review",
    dataSensitivity: "public",
    evidenceUrl: "https://evidence.example/work-order"
  };

  return {
    projectBrief: DEFAULT_PROJECT_BRIEF,
    recommendation,
    valueBlueprint,
    buyerScenario,
    pilotRun,
    buyerWorkOrder,
    workspace: {
      targetUrl: "https://service.example/app",
      protopediaUrl: "https://protopedia.net/prototype/global-launch",
      videoUrl: "https://video.example/walkthrough",
      agentTrialEvidence: [acceptedTrialEvidence("Cloud Run SRE", 94), acceptedTrialEvidence("Security Sentinel", 91)]
    },
    launchRoom: launchRoom("buyer-ready", "ready")
  };
}

describe("global launch audit", () => {
  it("marks a fully evidenced launch as global-ready with a portable audit", () => {
    const audit = buildGlobalLaunchAudit(baseInputs());

    expect(audit.readiness).toBe("global-ready");
    expect(audit.score).toBeGreaterThanOrEqual(86);
    expect(audit.dimensions.every((dimension) => dimension.status !== "block")).toBe(true);
    expect(audit.dimensions.find((dimension) => dimension.id === "production-ops")).toMatchObject({ status: "watch" });
    expect(audit.actions[0]).toMatchObject({
      id: "send-launch-room",
      priority: "now"
    });
    expect(audit.liftPlan).toMatchObject({
      targetScore: 86,
      scoreGap: 0,
      projectedScoreAfterFirstFix: audit.score
    });
    expect(audit.liftPlan.actions[0]).toMatchObject({
      id: "route-global-traffic",
      dimensionId: "global-routing",
      scoreLift: 0,
      projectedScore: audit.score
    });
    expect(audit.proofLinks.map((link) => link.id)).toEqual(["targetUrl", "protopediaUrl", "videoUrl", "pilotEvidenceUrl", "workOrderEvidenceUrl"]);
    expect(audit.proofLinks.find((link) => link.id === "videoUrl")).toMatchObject({ label: "Walkthrough video", status: "pass" });
    expect(audit.exportMarkdown).toContain("## Launch narrative");
    expect(audit.exportMarkdown).toContain("## Release lift plan");
    expect(audit.exportMarkdown).toContain("Route global traffic to the launch room");
    expect(audit.exportMarkdown).toContain("Global launch score");
    expect(audit.exportMarkdown).not.toMatch(/demo/i);
  });

  it("blocks public launch when live proof and measured outcome are missing", () => {
    const inputs = baseInputs();
    const audit = buildGlobalLaunchAudit({
      ...inputs,
      pilotRun: {
        ...inputs.pilotRun,
        observedManualMinutes: 90,
        observedAssistedMinutes: 90,
        acceptedTasks: 1,
        totalTasks: 4,
        evidenceUrl: "",
        reviewerName: ""
      },
      buyerWorkOrder: {
        ...inputs.buyerWorkOrder,
        evidenceUrl: "",
        dataSensitivity: "restricted"
      },
      workspace: {
        targetUrl: "",
        protopediaUrl: "",
        videoUrl: "",
        agentTrialEvidence: []
      },
      launchRoom: launchRoom("needs-proof", "blocked")
    });

    expect(audit.readiness).toBe("not-ready");
    expect(audit.dimensions.find((dimension) => dimension.id === "live-surface")).toMatchObject({ status: "block" });
    expect(audit.dimensions.find((dimension) => dimension.id === "measured-outcome")).toMatchObject({ status: "block" });
    expect(audit.actions[0]?.href).toBe("#launch-evidence-console");
    expect(audit.liftPlan.scoreGap).toBeGreaterThan(0);
    expect(audit.liftPlan.projectedScoreAfterFirstFix).toBeGreaterThan(audit.score);
    expect(audit.liftPlan.actions[0]).toMatchObject({
      priority: "now",
      dimensionId: "live-surface",
      label: "Public product surface"
    });
    expect(audit.liftPlan.actions[0]?.proofRequired).toContain("HTTPS product URL");
    expect(audit.liftPlan.actions[0]?.decisionImpact).toContain("global visitor");
    expect(audit.exportMarkdown).toContain("Projected after first fix");
    expect(audit.exportMarkdown).toContain("Public product surface");
    expect(audit.hardTruth).toContain("blocks the global launch story");
  });

  it("does not count plain HTTP proof URLs as global launch evidence", () => {
    const inputs = baseInputs();
    const audit = buildGlobalLaunchAudit({
      ...inputs,
      workspace: {
        ...inputs.workspace,
        targetUrl: "http://service.example/app"
      }
    });

    expect(audit.proofLinks.find((link) => link.id === "targetUrl")).toMatchObject({ status: "block" });
    expect(audit.dimensions.find((dimension) => dimension.id === "live-surface")).toMatchObject({ status: "block" });
    expect(audit.readiness).not.toBe("global-ready");
  });

  it("renders a shareable escaped public audit page with artifact links", () => {
    const audit = buildGlobalLaunchAudit(baseInputs());
    const html = renderGlobalLaunchAuditHtml(
      {
        ...audit,
        headline: 'Global <script>alert("headline")</script>',
        hardTruth: 'Risk <script>alert("truth")</script>',
        launchNarrative: 'Narrative <script>alert("narrative")</script>'
      },
      {
        launchRoomUrl: "https://launch.example/launch-room?workspace=share",
        jsonUrl: "https://launch.example/api/global-launch-audit?workspace=share",
        markdownUrl: "https://launch.example/global-launch-audit.md?workspace=share",
        appUrl: "https://launch.example/?workspace=share"
      }
    );

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Global Launch Audit");
    expect(html).toContain("https://launch.example/launch-room?workspace=share");
    expect(html).toContain("https://launch.example/api/global-launch-audit?workspace=share");
    expect(html).toContain("https://launch.example/?workspace=share#buyer-share-gate");
    expect(html).toContain("Audit dimensions");
    expect(html).toContain("Release lift plan");
    expect(html).toContain("Route global traffic to the launch room");
    expect(html).toContain("&lt;script&gt;alert(&quot;headline&quot;)&lt;/script&gt;");
    expect(html).toContain("Narrative &lt;script&gt;alert(&quot;narrative&quot;)&lt;/script&gt;");
    expect(html).not.toContain('<script>alert("headline")</script>');
    expect(html).not.toContain('<script>alert("truth")</script>');
  });
});
