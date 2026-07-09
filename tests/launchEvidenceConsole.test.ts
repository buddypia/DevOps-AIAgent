import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import LaunchEvidenceConsole from "../src/LaunchEvidenceConsole";
import { recommendSquad } from "../src/agentEngine";
import type { BuyerPilotProofIntake } from "../src/buyerPilotProofIntake";
import type { BuyerShareGateProofVerificationSummary } from "../src/buyerShareGate";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { PUBLIC_PROOF_INPUT_PLACEHOLDERS } from "../src/publicProofUrl";

const proofFields: Array<{
  key: keyof BuyerPilotProofIntake;
  label: string;
  target: string;
  placeholder: string;
  href: string;
}> = [
  { key: "targetUrl", label: "Deployed URL", target: "Cloud Run proof", placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.targetUrl, href: "#launch-evidence-console" },
  { key: "protopediaUrl", label: "ProtoPedia URL", target: "Public story proof", placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.protopediaUrl, href: "#launch-evidence-console" },
  { key: "videoUrl", label: "Walkthrough video", target: "Usage proof", placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.videoUrl, href: "#launch-evidence-console" },
  { key: "pilotEvidenceUrl", label: "Pilot receipt", target: "Measured run proof", placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.pilotEvidenceUrl, href: "#pilot-run-receipt" },
  { key: "workOrderEvidenceUrl", label: "Work order proof", target: "Scope proof", placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.workOrderEvidenceUrl, href: "#buyer-work-order-studio" }
];

const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "cloud-run-sre", "gemini-strategist"], 180);

function renderConsole({
  proofIntake,
  proofVerification = null,
  proofVerifyStatus = "idle",
  proofVerifyError = ""
}: {
  proofIntake: BuyerPilotProofIntake;
  proofVerification?: BuyerShareGateProofVerificationSummary | null;
  proofVerifyStatus?: "idle" | "checking" | "checked" | "failed";
  proofVerifyError?: string;
}) {
  return renderToStaticMarkup(
    createElement(LaunchEvidenceConsole, {
      recommendation,
      projectBrief: DEFAULT_PROJECT_BRIEF,
      proofFields,
      proofIntake,
      proofVerification,
      proofVerifyStatus,
      proofVerifyError,
      agentTrialEvidence: [],
      onProofIntakeChange: vi.fn(),
      onVerifyProofLinks: vi.fn(),
      publicReportHref: "/launch-evidence?workspace=share"
    })
  );
}

describe("LaunchEvidenceConsole", () => {
  test("surfaces all public proof artifacts before the launch check runs", () => {
    const html = renderConsole({
      proofIntake: {
        targetUrl: "https://release.opsbridge.ai",
        protopediaUrl: "https://protopedia.net/prototype/opsbridge",
        videoUrl: "",
        pilotEvidenceUrl: "https://docs.google.com/document/d/pilot-receipt",
        workOrderEvidenceUrl: ""
      }
    });

    expect(html).toContain("Buyer proof health");
    expect(html).toContain("3/5 proof links attached");
    expect(html).toContain("2 missing");
    expect(html).toContain("Deployed URL");
    expect(html).toContain("ProtoPedia URL");
    expect(html).toContain("Walkthrough video");
    expect(html).toContain("Pilot receipt");
    expect(html).toContain("Work order proof");
    expect(html).toContain("Attached, not live-checked");
    expect(html).toContain("Verify proof links");
    expect(html).toContain("Run launch check");
  });

  test("shows live proof verification results inside the launch evidence desk", () => {
    const html = renderConsole({
      proofVerifyStatus: "checked",
      proofVerification: {
        checkedAt: "2026-06-27T09:00:00.000Z",
        verifiedCount: 3,
        totalCount: 5,
        score: 60,
        results: [
          { id: "targetUrl", label: "Deployed URL", status: "pass", httpStatus: 200, evidence: "Public URL responded.", action: "Keep this link attached." },
          { id: "protopediaUrl", label: "ProtoPedia URL", status: "pass", httpStatus: 200, evidence: "Story URL responded.", action: "Keep this public story attached." },
          { id: "videoUrl", label: "Walkthrough video", status: "block", httpStatus: 404, evidence: "Video URL did not respond.", action: "Publish a public walkthrough video." },
          { id: "pilotEvidenceUrl", label: "Pilot receipt", status: "pass", httpStatus: 200, evidence: "Pilot receipt responded.", action: "Keep this measured run proof attached." },
          { id: "workOrderEvidenceUrl", label: "Work order proof", status: "block", httpStatus: 403, evidence: "Work order proof is private.", action: "Make the artifact publicly readable." }
        ]
      },
      proofIntake: {
        targetUrl: "https://release.opsbridge.ai",
        protopediaUrl: "https://protopedia.net/prototype/opsbridge",
        videoUrl: "https://youtu.be/opsbridge",
        pilotEvidenceUrl: "https://docs.google.com/document/d/pilot-receipt",
        workOrderEvidenceUrl: "https://github.com/buddypia/opsbridge/issues/42"
      }
    });

    expect(html).toContain("3/5 live links verified");
    expect(html).toContain("60/100 reachability");
    expect(html).toContain("2 live gaps");
    expect(html).toContain("pass 200");
    expect(html).toContain("block 403");
    expect(html).toContain("Make the artifact publicly readable.");
    expect(html).toContain("Proof checked");
  });
});
