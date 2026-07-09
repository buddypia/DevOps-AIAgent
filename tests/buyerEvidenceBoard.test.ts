import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { summarizeAgentTrialEvidence, type AgentTrialEvidenceRecord } from "../src/agentTrialEvidence";
import BuyerEvidenceBoardPanel from "../src/BuyerEvidenceBoardPanel";
import {
  BUYER_EVIDENCE_BOARD_RECEIPT_VERIFY_PATH,
  buildBuyerEvidenceBoard,
  renderBuyerEvidenceBoardHtml,
  verifyBuyerEvidenceBoardReceipt
} from "../src/buyerEvidenceBoard";
import type { BuyerPilotCommand } from "../src/buyerPilotCommand";
import type { BuyerShareGateProofVerificationSummary } from "../src/buyerShareGate";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import type { BuyerWorkOrderInput } from "../src/buyerWorkOrder";
import { recommendSquad } from "../src/agentEngine";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { verifyBuyerEvidenceBoardReceiptRequest } from "../server/buyerEvidenceBoardReceiptVerifier";

const hrefs = {
  workflowIntake: "#quick-workflow-intake",
  valueReport: "/buyer-value?workspace=share",
  measuredRun: "/buyer-delivery-memo?workspace=share",
  proofAudit: "/buyer-proof-audit?workspace=share",
  trustManifest: "/buyer-trust-manifest?workspace=share",
  launchRoom: "/launch-room?workspace=share",
  publicPage: "/buyer-evidence-board?workspace=share"
};

const projectBrief = `${DEFAULT_PROJECT_BRIEF}\nA platform team wants a buyer-ready release proof room for Cloud Run operations.`;

const recommendation = recommendSquad(projectBrief, ["market-broker", "cloud-run-sre", "security-sentinel", "test-forge"], 240);

const buyerScenario = buildBuyerValueScenario(recommendation, {
  teamSize: 8,
  hourlyCostYen: 12000,
  cyclesPerMonth: 5,
  manualHoursPerCycle: 28,
  adoptionRatePercent: 75,
  incidentRiskYenPerMonth: 240000
});

const buyerWorkOrder: BuyerWorkOrderInput = {
  targetUser: "Platform release lead",
  request: "Turn one Cloud Run release-readiness review into a buyer proof packet.",
  successMetric: "Approve only when measured time saved and public proof are visible.",
  currentBaseline: "Release proof is copied from tickets, CI logs, and rollout checks by hand.",
  dataSensitivity: "public",
  evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/work-order"
};

const agentTrialEvidence: AgentTrialEvidenceRecord[] = [
  {
    id: "trial-proof-cloud-run-sre",
    receiptId: "trial-cloud-run-sre",
    agentId: "cloud-run-sre",
    agentName: "Cloud Run SRE",
    skillId: "cloud-run.release-proof",
    status: "accepted",
    score: 94,
    artifactUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/agent-card",
    evidenceSource: "Public Agent Card and release proof receipt",
    headline: "Cloud Run release proof accepted",
    summary: "Cloud Run SRE returned an accepted trial receipt.",
    attachedAt: "2026-06-20T00:00:00.000Z"
  }
];

const proofVerification: BuyerShareGateProofVerificationSummary = {
  checkedAt: "2026-06-20T01:00:00.000Z",
  verifiedCount: 5,
  totalCount: 5,
  score: 100,
  results: [
    { id: "targetUrl", label: "Live product", status: "pass", httpStatus: 200, evidence: "HTTP 200.", action: "Keep reachable." },
    { id: "pilotEvidenceUrl", label: "Pilot receipt", status: "pass", httpStatus: 200, evidence: "HTTP 200.", action: "Keep reachable." },
    { id: "workOrderEvidenceUrl", label: "Work order proof", status: "pass", httpStatus: 200, evidence: "HTTP 200.", action: "Keep reachable." },
    { id: "protopediaUrl", label: "ProtoPedia", status: "pass", httpStatus: 200, evidence: "HTTP 200.", action: "Keep reachable." },
    { id: "videoUrl", label: "Walkthrough", status: "pass", httpStatus: 200, evidence: "HTTP 200.", action: "Keep reachable." }
  ]
};

const command: BuyerPilotCommand = {
  readiness: "buyer-ready",
  launchScore: 94,
  headline: "Share the launch room with a buyer",
  targetBuyer: "Platform release lead",
  primaryMetric: "¥1,027,000 modeled value",
  proofClosure: "6/6 artifacts sealed",
  pathLabel: "Ready for external review",
  nextGap: {
    label: "Launch room",
    owner: "Pilot owner",
    action: "Open the launch room.",
    href: "/launch-room?workspace=share",
    editHref: "#launch-room"
  },
  gapQueue: [],
  steps: []
};

function buildBoard(patch: Partial<Parameters<typeof buildBuyerEvidenceBoard>[0]> = {}) {
  return buildBuyerEvidenceBoard({
    projectBrief,
    buyerScenario,
    pilotRun: {
      observedManualMinutes: 1680,
      observedAssistedMinutes: 420,
      participants: 4,
      acceptedTasks: 4,
      totalTasks: 4,
      evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/pilot-receipt",
      reviewerName: "Platform sponsor",
      notes: "Observed run accepted."
    },
    buyerWorkOrder,
    agentTrialEvidence,
    command,
    proofVerification,
    issuedAt: "2026-06-20T00:00:00.000Z",
    hrefs,
    ...patch
  });
}

describe("buyer evidence board", () => {
  test("builds a sendable board with a replayable receipt and memo", () => {
    const board = buildBoard();

    expect(board.status).toBe("sendable");
    expect(board.readyCount).toBe(board.itemCount);
    expect(board.score).toBe(100);
    expect(board.firstBlocker).toBeNull();
    expect(board.items.map((item) => item.id)).toEqual(["scope", "value", "measured-run", "live-proof", "agent-trust", "decision-route"]);
    expect(board.items.every((item) => item.status === "ready")).toBe(true);
    expect(board.receipt.receiptId).toMatch(/^buyer-evidence-board-sendable-[a-f0-9]{12}$/);
    expect(board.receipt.verificationApiPath).toBe(BUYER_EVIDENCE_BOARD_RECEIPT_VERIFY_PATH);
    expect(board.receipt.verification.status).toBe("verified");
    expect(verifyBuyerEvidenceBoardReceipt(board.receipt).status).toBe("verified");
    expect(board.reviewerBrief).toMatchObject({
      title: "Buyer review brief for Platform release lead",
      recommendedDecision: "send"
    });
    expect(board.reviewerBrief.questions.map((question) => question.id)).toEqual(["workflow-approval", "value-proof", "public-proof", "agent-trust"]);
    expect(board.reviewerBrief.questions.find((question) => question.id === "public-proof")).toMatchObject({
      status: "ready",
      question: "Can a reviewer open the proof without a private walkthrough?"
    });
    expect(board.reviewerBrief.copyText).toContain("Decision: send");
    expect(board.receipt.payload).toMatchObject({
      manifestVersion: "buyer-evidence-board.v1",
      status: "sendable",
      buyer: "Platform release lead",
      readyCount: 6,
      itemCount: 6,
      firstBlocker: "none",
      reviewerBrief: {
        recommendedDecision: "send",
        questions: expect.arrayContaining([
          expect.objectContaining({
            id: "public-proof",
            status: "ready"
          })
        ])
      }
    });
    expect(board.memoMarkdown).toContain(`Receipt: ${board.receipt.receiptId}`);
    expect(board.memoMarkdown).toContain(`Checksum: fnv1a-64:${board.receipt.checksum}`);
    expect(board.memoMarkdown).toContain("## Reviewer brief");
    expect(board.memoMarkdown).toContain("Question: Can a reviewer open the proof without a private walkthrough?");
    expect(summarizeAgentTrialEvidence(agentTrialEvidence).status).toBe("ready");
  });

  test("rejects tampered receipt replay payloads", () => {
    const board = buildBoard();
    const replayRequest = JSON.parse(board.receipt.verificationRequestJson) as {
      checksum: string;
      payload: typeof board.receipt.payload;
    };

    expect(verifyBuyerEvidenceBoardReceiptRequest(replayRequest)).toMatchObject({
      statusCode: 200,
      body: {
        skill: "buyer-evidence-board.receipt.verify",
        verification: { status: "verified" },
        receipt: { status: "sendable", score: 100 }
      }
    });

    expect(
      verifyBuyerEvidenceBoardReceiptRequest({
        checksum: replayRequest.checksum,
        payload: {
          ...replayRequest.payload,
          score: 72
        }
      })
    ).toMatchObject({
      statusCode: 422,
      body: {
        verification: { status: "mismatch" }
      }
    });

    expect(verifyBuyerEvidenceBoardReceiptRequest({ checksum: "not-a-checksum", payload: replayRequest.payload })).toMatchObject({
      statusCode: 400,
      body: { error: "invalid_request" }
    });
  });

  test("renders a standalone buyer evidence board page with export links and receipt details", () => {
    const board = buildBoard();
    const html = renderBuyerEvidenceBoardHtml(board, {
      appUrl: "/?workspace=share",
      launchRoomUrl: "/launch-room?workspace=share",
      proofAuditUrl: "/buyer-proof-audit?workspace=share",
      jsonUrl: "/api/buyer-evidence-board?workspace=share",
      markdownUrl: "/buyer-evidence-board.md?workspace=share"
    });

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Buyer evidence board is sendable");
    expect(html).toContain("Platform release lead");
    expect(html).toContain("/api/buyer-evidence-board?workspace=share");
    expect(html).toContain("/buyer-evidence-board.md?workspace=share");
    expect(html).toContain(board.receipt.receiptId);
    expect(html).toContain(`fnv1a-64:${board.receipt.checksum}`);
    expect(html).toContain("Download receipt JSON");
    expect(html).toContain(BUYER_EVIDENCE_BOARD_RECEIPT_VERIFY_PATH);
    expect(html).toContain('id="buyer-evidence-board-receipt-verify-request"');
    expect(html).toContain("Verify receipt");
    expect(html).toContain("Reviewer decision brief");
    expect(html).toContain("Can a reviewer open the proof without a private walkthrough?");
  });

  test("blocks external sharing when scope, live proof, and agent trust are missing", () => {
    const board = buildBoard({
      buyerWorkOrder: {
        targetUser: "",
        request: "",
        successMetric: "",
        currentBaseline: "",
        dataSensitivity: "internal",
        evidenceUrl: ""
      },
      agentTrialEvidence: [],
      proofVerification: null,
      command: {
        ...command,
        readiness: "needs-proof",
        launchScore: 61,
        headline: "Close proof gaps before sharing",
        nextGap: {
          ...command.nextGap,
          label: "Live proof",
          owner: "Cloud Run SRE",
          action: "Run live proof verification."
        }
      }
    });

    expect(board.status).toBe("blocked");
    expect(board.firstBlocker).toMatchObject({
      id: "scope",
      label: "Buyer scope"
    });
    expect(board.items.find((item) => item.id === "live-proof")).toMatchObject({
      status: "blocked",
      value: "not checked"
    });
    expect(board.items.find((item) => item.id === "agent-trust")).toMatchObject({
      status: "blocked",
      value: "not accepted"
    });
    expect(board.decisionRule).toContain("Buyer scope blocks external sharing");
    expect(board.reviewerBrief).toMatchObject({
      recommendedDecision: "hold",
      noSendRule: expect.stringContaining("Buyer scope blocks external sharing")
    });
    expect(board.reviewerBrief.questions.find((question) => question.id === "workflow-approval")).toMatchObject({
      status: "blocked",
      nextAction: "Attach a public work-order proof URL."
    });
    expect(board.receipt.receiptId).toMatch(/^buyer-evidence-board-blocked-[a-f0-9]{12}$/);
    expect(board.receipt.payload.firstBlocker).toBe("Buyer scope");
    expect(board.receipt.payload.reviewerBrief.recommendedDecision).toBe("hold");
    expect(board.memoMarkdown).toContain("# Do not send this buyer room yet");
  });

  test("renders memo and receipt exports in the panel", () => {
    const html = renderToStaticMarkup(
      createElement(BuyerEvidenceBoardPanel, {
        projectBrief,
        buyerScenario,
        pilotRun: {
          observedManualMinutes: 1680,
          observedAssistedMinutes: 420,
          participants: 4,
          acceptedTasks: 4,
          totalTasks: 4,
          evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/pilot-receipt",
          reviewerName: "Platform sponsor",
          notes: "Observed run accepted."
        },
        buyerWorkOrder,
        agentTrialEvidence,
        command,
        proofVerification,
        issuedAt: "2026-06-20T00:00:00.000Z",
        hrefs,
        onCopyText: async () => true
      })
    );

    expect(html).toContain("Buyer evidence board is sendable");
    expect(html).toContain("buyer-evidence-board.md");
    expect(html).toContain("Public page");
    expect(html).toContain("Receipt");
    expect(html).toContain("Reviewer decision brief");
    expect(html).toContain("Copy brief");
    expect(html).toContain("What buyer value is backed by proof?");
    expect(html).toContain("buyer-evidence-board-sendable-");
    expect(html).toContain("6/6 lanes ready");
  });
});
