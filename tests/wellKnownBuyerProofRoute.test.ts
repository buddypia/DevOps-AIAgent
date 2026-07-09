import { spawn, type ChildProcessByStdio } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { Readable } from "node:stream";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import {
  QUICK_BUYER_DECISION_REPLY_RECORD_RECEIPT_VERSION,
  quickBuyerDecisionReplyRecordChecksum,
  type QuickBuyerDecisionReplyRecordPayload
} from "../src/quickBuyerDecisionReplyRecordReceipt";
import { buildProofBackedSampleWorkspaceDraft } from "../src/sampleWorkspace";
import { SUBMISSION_PROOF } from "../src/submission";
import { workspaceArtifactSearchParams } from "../src/workspacePublicLinks";
import { buildWorkspaceDraft, decodeWorkspaceShareParam, encodeWorkspaceShareParam } from "../src/workspaceDraft";

type ServerProcess = ChildProcessByStdio<null, Readable, Readable>;

type ManifestArtifact = {
  id: string;
  href: string;
};

type BuyerProofManifestResponse = {
  artifacts: ManifestArtifact[];
  receipts: Array<{
    id: string;
    status: string;
    digest: string;
    verifier: string;
  }>;
  verificationBrief: {
    machineManifestHref: string;
    primaryArtifactHref: string;
    instructions: string[];
  };
  publicationGate: {
    decision: "publish" | "repair" | "hold";
    firstAction: string;
    firstActionHref: string;
    blockedCount: number;
    checks: Array<{
      id: string;
      status: string;
      href: string;
    }>;
  };
  verification: {
    digest: string;
    verificationApiPath: string;
    payload: {
      buyerEvidenceBoardReceiptChecksum?: string;
      commercialOfferReceiptChecksum?: string;
      buyerPilotContractId?: string;
      buyerPilotContractReceiptChecksum?: string;
      artifacts: ManifestArtifact[];
    };
  };
};

function routeReplyRecordVerificationRequestJson() {
  const payload: QuickBuyerDecisionReplyRecordPayload = {
    receiptVersion: QUICK_BUYER_DECISION_REPLY_RECORD_RECEIPT_VERSION,
    status: "ready",
    decision: "continue",
    label: "Continue recorded",
    headline: "Platform sponsor approved the first buyer pilot",
    buyer: "Platform release lead",
    confidence: 94,
    buyerReply: "Approved. Continue with the bounded pilot after live proof verification.",
    matchedSignals: ["approved", "continue"],
    nextOwner: "Pilot operator",
    nextAction: "Open the launch room and start the day 0 kickoff.",
    proof: "Buyer reply explicitly approves the bounded pilot.",
    onePagerReceiptId: "quick-buyer-one-pager-ready-12345678",
    onePagerChecksum: "fnv1a32:12345678",
    activation: {
      mode: "pilot-start",
      status: "ready",
      label: "Pilot start work order",
      recommendedReply: "continue",
      sourceReceiptId: "quick-rollout-ready-abcdef12",
      sourceChecksum: "fnv1a32:abcdef12",
      primaryHref: "#quick-rollout-command-board",
      primaryLabel: "Owner brief",
      items: [
        {
          id: "kickoff",
          label: "Day 0 owner kickoff",
          status: "ready",
          owner: "Pilot operator",
          command: "Confirm owners, scope, stop rule, and live proof route.",
          evidence: "Launch room and buyer one-pager",
          href: "#quick-rollout-command-board"
        }
      ]
    }
  };

  return JSON.stringify(
    {
      checksum: quickBuyerDecisionReplyRecordChecksum(payload),
      payload
    },
    null,
    2
  );
}

function tsxBin() {
  return path.resolve(process.cwd(), "node_modules", ".bin", process.platform === "win32" ? "tsx.cmd" : "tsx");
}

function waitForServer(child: ServerProcess, port: number) {
  return new Promise<void>((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve();
    };
    const timer = setTimeout(() => {
      finish(new Error(`server did not start on ${port}\nstdout:\n${stdout}\nstderr:\n${stderr}`));
    }, 15000);

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
      if (stdout.includes(`http://127.0.0.1:${port}`)) finish();
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.once("exit", (code) => {
      finish(new Error(`server exited before ready with code ${code}\nstdout:\n${stdout}\nstderr:\n${stderr}`));
    });
  });
}

describe("public buyer proof routes", () => {
  const port = 18080 + Math.floor(Math.random() * 1000);
  let server: ServerProcess | undefined;

  beforeAll(async () => {
    const child = spawn(tsxBin(), ["server/index.ts"], {
      cwd: process.cwd(),
      env: { ...process.env, HOST: "127.0.0.1", PORT: String(port) },
      stdio: ["ignore", "pipe", "pipe"]
    });
    server = child;
    await waitForServer(child, port);
  }, 20000);

  afterAll(async () => {
    if (!server || server.killed) return;
    await new Promise<void>((resolve) => {
      server?.once("exit", () => resolve());
      server?.kill("SIGTERM");
      setTimeout(resolve, 1000);
    });
  });

  test("advertises crawler and social discovery for public proof surfaces", async () => {
    const html = readFileSync(path.resolve(process.cwd(), "index.html"), "utf8");

    expect(html).toContain('<meta name="robots" content="index,follow" />');
    expect(html).toContain('<link rel="canonical" href="https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app/" />');
    expect(html).toContain('<meta property="og:type" content="website" />');
    expect(html).toContain('<meta property="og:image" content="https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app/assets/agent-marketplace-hero.webp" />');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(html).toContain('<script type="application/ld+json">');
    expect(html).toContain('<link rel="alternate" type="application/json" title="Agent Card" href="/.well-known/agent-card.json" />');
    expect(html).toContain('<link rel="alternate" type="application/json" title="Buyer Proof Manifest" href="/.well-known/buyer-proof.json" />');

    const baseUrl = `http://127.0.0.1:${port}`;
    const robotsResponse = await fetch(`${baseUrl}/robots.txt`);
    expect(robotsResponse.status).toBe(200);
    expect(robotsResponse.headers.get("content-type")).toContain("text/plain");
    const robots = await robotsResponse.text();
    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Allow: /");
    expect(robots).toContain(`Sitemap: ${baseUrl}/sitemap.xml`);
    expect(robots).toContain(`# Agent Card: ${baseUrl}/.well-known/agent-card.json`);
    expect(robots).toContain(`# Buyer proof manifest: ${baseUrl}/.well-known/buyer-proof.json`);

    const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`);
    expect(sitemapResponse.status).toBe(200);
    expect(sitemapResponse.headers.get("content-type")).toContain("application/xml");
    const sitemap = await sitemapResponse.text();
    expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    for (const pathName of [
      "/",
      "/launch-room",
      "/buyer-evidence-board",
      "/buyer-proof-room",
      "/buyer-pilot-contract",
      "/global-publishability",
      "/global-proof-dossier",
      "/buyer-trust-manifest",
      "/receipt-verifier",
      "/.well-known/agent-card.json"
    ]) {
      expect(sitemap).toContain(`<loc>${baseUrl}${pathName}</loc>`);
    }
  });

  test("advertises buyer proof verifier and decision receipt endpoints in the Agent Card", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/.well-known/agent-card.json`);
    expect(response.status).toBe(200);
    const card = (await response.json()) as {
      provider: {
        organization: string;
        url: string;
      };
      metadata: {
        proof: Record<string, string>;
      };
      skills: Array<{ id: string; name?: string; description?: string; tags?: string[]; examples?: string[] }>;
    };

    expect(card.provider).toMatchObject({
      organization: "A2A Agent Marketplace",
      url: `http://127.0.0.1:${port}`
    });
    expect(card.provider.organization).not.toMatch(/hackathon/i);

    expect(card.metadata.proof).toMatchObject({
      buyerProofRoomEndpoint: `http://127.0.0.1:${port}/buyer-proof-room`,
      buyerProofRoomJsonEndpoint: `http://127.0.0.1:${port}/api/buyer-proof-room`,
      buyerProofRoomMarkdownEndpoint: `http://127.0.0.1:${port}/buyer-proof-room.md`,
      buyerProofVerifierEndpoint: `http://127.0.0.1:${port}/buyer-proof-verifier`,
      buyerProofVerifierJsonEndpoint: `http://127.0.0.1:${port}/api/buyer-proof-verifier`,
      receiptVerifierEndpoint: `http://127.0.0.1:${port}/receipt-verifier`,
      receiptVerifierJsonEndpoint: `http://127.0.0.1:${port}/api/receipt-verifier`,
      buyerEvidenceBoardEndpoint: `http://127.0.0.1:${port}/buyer-evidence-board`,
      buyerEvidenceBoardJsonEndpoint: `http://127.0.0.1:${port}/api/buyer-evidence-board`,
      buyerEvidenceBoardMarkdownEndpoint: `http://127.0.0.1:${port}/buyer-evidence-board.md`,
      buyerEvidenceBoardReceiptVerifyEndpoint: `http://127.0.0.1:${port}/api/buyer-evidence-board/receipt/verify`,
      buyerDecisionReceiptEndpoint: `http://127.0.0.1:${port}/buyer-decision-receipt`,
      buyerDecisionReceiptJsonEndpoint: `http://127.0.0.1:${port}/api/buyer-decision-receipt`,
      buyerDecisionReceiptMarkdownEndpoint: `http://127.0.0.1:${port}/buyer-decision-receipt.md`,
      buyerDecisionReceiptVerifyEndpoint: `http://127.0.0.1:${port}/api/buyer-decision-receipt/verify`,
      buyerReviewKitEndpoint: `http://127.0.0.1:${port}/buyer-review-kit`,
      buyerReviewKitJsonEndpoint: `http://127.0.0.1:${port}/api/buyer-review-kit`,
      buyerReviewKitMarkdownEndpoint: `http://127.0.0.1:${port}/buyer-review-kit.md`,
      buyerAcceptancePathEndpoint: `http://127.0.0.1:${port}/buyer-acceptance-path`,
      buyerAcceptancePathJsonEndpoint: `http://127.0.0.1:${port}/api/buyer-acceptance-path`,
      buyerAcceptancePathMarkdownEndpoint: `http://127.0.0.1:${port}/buyer-acceptance-path.md`,
      buyerAcceptancePathReceiptVerifyEndpoint: `http://127.0.0.1:${port}/api/buyer-acceptance-path/receipt/verify`,
      buyerPilotContractEndpoint: `http://127.0.0.1:${port}/buyer-pilot-contract`,
      buyerPilotContractJsonEndpoint: `http://127.0.0.1:${port}/api/buyer-pilot-contract`,
      buyerPilotContractMarkdownEndpoint: `http://127.0.0.1:${port}/buyer-pilot-contract.md`,
      buyerPilotContractReceiptVerifyEndpoint: `http://127.0.0.1:${port}/api/buyer-pilot-contract/receipt/verify`,
      globalPublishabilityEndpoint: `http://127.0.0.1:${port}/global-publishability`,
      globalPublishabilityJsonEndpoint: `http://127.0.0.1:${port}/api/global-publishability`,
      globalPublishabilityMarkdownEndpoint: `http://127.0.0.1:${port}/global-publishability.md`,
      submissionAssetsEndpoint: `http://127.0.0.1:${port}/submission-assets`,
      submissionAssetsJsonEndpoint: `http://127.0.0.1:${port}/api/submission-assets`,
      workflowIntakeExtractEndpoint: `http://127.0.0.1:${port}/api/workflow-intake/extract`,
      workflowIntakeExtractVerifyEndpoint: `http://127.0.0.1:${port}/api/workflow-intake/extract/verify`
    });
    expect(card.skills.map((skill) => skill.id)).toEqual(
      expect.arrayContaining([
        "buyer.proof-verifier",
        "buyer.proof-room",
        "receipt.verifier",
        "buyer.decision-receipt",
        "buyer.review-kit",
        "buyer.acceptance-path",
        "buyer.pilot-contract",
        "global.publishability",
        "workflow.intake.extract",
        "workflow.intake.extract.verify"
      ])
    );

    const skillsById = new Map(card.skills.map((skill) => [skill.id, skill]));
    const expectSkill = (id: string, expected: { name: string; tags: string[] }) => {
      const skill = skillsById.get(id);
      expect(skill).toBeTruthy();
      expect(skill?.name).toBe(expected.name);
      expect(skill?.tags).toEqual(expect.arrayContaining(expected.tags));
      return [skill?.name, skill?.description, ...(skill?.tags ?? []), ...(skill?.examples ?? [])]
        .filter(Boolean)
        .join("\n");
    };

    const publishedAgentCardUrl = `${SUBMISSION_PROOF.deployedUrl}/.well-known/agent-card.json`;
    const agentCardDiscoverText = expectSkill("agent-card.discover", {
      name: "Import a public Agent Card",
      tags: ["agent-card", "marketplace", "discovery", "ssrf-guard"]
    });
    const agentCardDiligenceText = expectSkill("agent-card.diligence", {
      name: "Publish an Agent Card diligence report",
      tags: ["agent-card", "diligence", "buyer-value", "live-proof", "get-proof"]
    });
    expect(agentCardDiscoverText).toContain(`${publishedAgentCardUrl} を候補として取り込んで`);
    expect(agentCardDiligenceText).toContain(`${publishedAgentCardUrl} の採用可否を買い手向けに監査して`);
    expect(JSON.stringify(card)).not.toContain("https://example.com/.well-known/agent-card.json");

    const publicSkillText = [
      expectSkill("judge.snapshot", {
        name: "Open the public reviewer proof snapshot",
        tags: ["reviewer-snapshot", "get-proof", "first-click", "proof"]
      }),
      expectSkill("judge.first-click", {
        name: "Route the reviewer first click",
        tags: ["first-click", "reviewer-snapshot", "publication-launch", "get-proof"]
      }),
      expectSkill("judge.first-click-smoke", {
        name: "Smoke-test first-click proof pages",
        tags: ["first-click", "smoke-test", "get-proof"]
      }),
      expectSkill("acceptance.matrix", {
        name: "Build the reviewer acceptance matrix",
        tags: ["acceptance", "review-score", "publication", "get-proof"]
      }),
      expectSkill("judge.brief", {
        name: "Build the one-page reviewer brief",
        tags: ["reviewer-brief", "publication"]
      }),
      expectSkill("winner.packet", {
        name: "Package reviewer proof for decision criteria",
        tags: ["reviewer-packet", "winner-release-lock", "get-proof"]
      }),
      expectSkill("winner.sufficiency", {
        name: "Decide if the project is adoption-sufficient",
        tags: ["adoption-sufficiency", "publication", "get-proof"]
      }),
      expectSkill("judge.objection-arena", {
        name: "Answer final reviewer objections",
        tags: ["reviewer-qa", "objection-lock", "get-proof"]
      }),
      expectSkill("judge.tour", {
        name: "Build the 90-second reviewer walkthrough",
        tags: ["reviewer-tour", "publication"]
      }),
      expectSkill("demo.runway", {
        name: "Run the 30-second reviewer proof runway",
        tags: ["reviewer-runway", "reviewer-experience", "publication"]
      }),
      expectSkill("demo.concierge", {
        name: "Guide first-click reviewer concierge",
        tags: ["reviewer-concierge", "reviewer-experience"]
      }),
      expectSkill("security.review", {
        name: "Review public security boundaries",
        tags: ["security", "trust-boundary", "cloud-run"]
      })
    ].join("\n");

    expect(publicSkillText).toContain("外部レビュー担当者");
    expect(publicSkillText).not.toMatch(/public judge proof snapshot|judge first click|judge acceptance matrix|one-page judge brief|30-second judge demo runway|first-click demo concierge|public demo security boundaries/i);
    expect(publicSkillText).not.toMatch(/審査員|審査導線|審査証拠|審査5項目|審査向け/);
    expect(publicSkillText).not.toMatch(/\bdemo\b|\bsubmission\b/i);
  });

  test("serves a receipt-backed buyer pilot contract route", async () => {
    const baseUrl = `http://127.0.0.1:${port}`;
    const params = workspaceArtifactSearchParams(buildProofBackedSampleWorkspaceDraft("2026-06-20T00:00:00.000Z", baseUrl));
    const query = params.toString();

    const jsonResponse = await fetch(`${baseUrl}/api/buyer-pilot-contract?${query}`);
    expect(jsonResponse.status).toBe(200);
    const contract = (await jsonResponse.json()) as {
      readiness: string;
      receipt: {
        receiptId: string;
        verificationApiPath: string;
        verificationRequestJson: string;
        payload: {
          receiptVersion: string;
          commercialOfferReceiptChecksum: string;
        };
      };
      attachments: Array<{ id: string; href: string }>;
    };

    expect(contract.receipt.receiptId).toMatch(/^buyer-pilot-contract-/);
    expect(contract.receipt.payload).toMatchObject({
      receiptVersion: "buyer-pilot-contract.v1"
    });
    expect(contract.receipt.payload.commercialOfferReceiptChecksum).toMatch(/^[a-f0-9]{16}$/);
    expect(contract.attachments.find((attachment) => attachment.id === "commercial-offer")?.href).toContain("/commercial-offer?");

    const verifyResponse = await fetch(`${baseUrl}${contract.receipt.verificationApiPath}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: contract.receipt.verificationRequestJson
    });
    expect(verifyResponse.status).toBe(200);
    const verified = (await verifyResponse.json()) as { verification: { status: string } };
    expect(verified.verification.status).toBe("verified");

    const htmlResponse = await fetch(`${baseUrl}/buyer-pilot-contract?${query}`);
    expect(htmlResponse.status).toBe(200);
    const html = await htmlResponse.text();
    expect(html).toContain("Buyer Pilot Contract");
    expect(html).toContain("Replayable contract receipt");
    expect(html).toContain(contract.receipt.receiptId);

    const markdownResponse = await fetch(`${baseUrl}/buyer-pilot-contract.md?${query}`);
    expect(markdownResponse.status).toBe(200);
    const markdown = await markdownResponse.text();
    expect(markdown).toContain("## Contract milestones");
    expect(markdown).toContain("Receipt checksum: fnv1a-64:");
  });

  test("serves a self-verifying buyer proof room route", async () => {
    const baseUrl = `http://127.0.0.1:${port}`;
    const params = workspaceArtifactSearchParams(buildProofBackedSampleWorkspaceDraft("2026-06-20T00:00:00.000Z", baseUrl));
    const query = params.toString();

    const jsonResponse = await fetch(`${baseUrl}/api/buyer-proof-room?${query}`);
    expect(jsonResponse.status).toBe(200);
    const room = (await jsonResponse.json()) as {
      readiness: string;
      headline: string;
      metrics: Array<{ label: string; value: string }>;
      reviewerDecisions: Array<{ id: string; href: string }>;
      actions: Array<{ id: string; href: string }>;
      decisionHandoff: {
        recommendedDecision: string;
        primaryActionHref: string;
        steps: Array<{ id: string; href: string }>;
      };
      ownerPacket: {
        status: string;
        currentOwner: string;
        currentCommand: string;
        sendRule: string;
        escalationRule: string;
        items: Array<{ id: string; owner: string; href: string; proofToAttach: string; doneSignal: string }>;
        href: string;
      };
      repairPlan: {
        status: string;
        firstAction: string;
        firstActionHref: string;
        blockedCount: number;
        watchCount: number;
        stepCount: number;
        steps: Array<{ id: string; label: string; href: string; doneSignal: string }>;
      };
      evidenceLanes: Array<{ id: string; href: string }>;
      receipts: Array<{ id: string; digest: string }>;
      links: {
        trustManifestUrl: string;
        trustManifestJsonUrl: string;
        proofVerifierUrl: string;
        pilotContractUrl: string;
        receiptVerifierUrl: string;
        decisionReceiptUrl: string;
        reviewKitUrl: string;
        acceptancePathUrl: string;
        heroImageUrl: string;
      };
      verificationRequestJson: string;
    };

    expect(room.headline).toMatch(/buyer proof room/i);
    expect(room.metrics.map((metric) => metric.label)).toEqual(["Room", "Manifest", "Verifier", "Contract", "Receipts"]);
    expect(room.reviewerDecisions.map((decision) => decision.id)).toEqual(["trust", "approval", "first-action", "verification"]);
    expect(room.actions.map((action) => action.id)).toEqual(["first-action", "verify-proof", "open-contract", "receipt-desk"]);
    expect(["continue", "revise", "stop"]).toContain(room.decisionHandoff.recommendedDecision);
    expect(room.decisionHandoff.primaryActionHref).toContain("/buyer-review-kit?");
    expect(room.decisionHandoff.primaryActionHref).toContain(`decision=${room.decisionHandoff.recommendedDecision}`);
    expect(room.decisionHandoff.steps.map((step) => step.id)).toEqual(["review-kit", "decision-receipt", "acceptance-path"]);
    expect(room.decisionHandoff.steps.find((step) => step.id === "review-kit")?.href).toContain("/buyer-review-kit?");
    expect(room.decisionHandoff.steps.find((step) => step.id === "decision-receipt")?.href).toContain("/buyer-decision-receipt?");
    expect(room.decisionHandoff.steps.find((step) => step.id === "acceptance-path")?.href).toContain("/buyer-acceptance-path?");
    expect(room.decisionHandoff.steps.every((step) => step.href.includes(`decision=${room.decisionHandoff.recommendedDecision}`))).toBe(true);
    expect(room.ownerPacket.status).toBe(room.repairPlan.status);
    expect(room.ownerPacket.currentOwner).toBeTruthy();
    expect(room.ownerPacket.currentCommand).toBeTruthy();
    expect(room.ownerPacket.sendRule).toContain("Do not send");
    expect(room.ownerPacket.escalationRule).toContain("decision receipt");
    expect(room.ownerPacket.items.length).toBeGreaterThan(0);
    expect(room.ownerPacket.items[0]).toMatchObject({
      href: expect.stringContaining("?"),
      proofToAttach: expect.stringContaining("."),
      doneSignal: expect.stringContaining("pass")
    });
    expect(room.ownerPacket.href).toContain("data:text/markdown");
    expect(room.repairPlan.status).toBe("blocked");
    expect(room.repairPlan.stepCount).toBeGreaterThan(0);
    expect(room.repairPlan.blockedCount).toBeGreaterThan(0);
    expect(room.repairPlan.firstActionHref).toContain("?");
    expect(room.repairPlan.steps[0]).toMatchObject({
      href: expect.stringContaining("?"),
      doneSignal: expect.stringContaining("returns pass")
    });
    expect(room.evidenceLanes.map((lane) => lane.id)).toContain("buyer-pilot-contract");
    expect(room.receipts.map((receipt) => receipt.id)).toContain("buyer-pilot-contract");
    expect(room.links.trustManifestUrl).toContain("/buyer-proof-room/manifest?");
    expect(room.links.trustManifestJsonUrl).toContain("/api/buyer-proof-room/manifest?");
    expect(room.links.proofVerifierUrl).toContain("/buyer-proof-room/verifier?");
    expect(room.links.pilotContractUrl).toContain("/buyer-pilot-contract?");
    expect(room.links.receiptVerifierUrl).toContain("/receipt-verifier?");
    expect(room.links.decisionReceiptUrl).toContain("/buyer-decision-receipt?");
    expect(room.links.reviewKitUrl).toContain("/buyer-review-kit?");
    expect(room.links.acceptancePathUrl).toContain("/buyer-acceptance-path?");
    expect(room.links.heroImageUrl).toContain("/assets/agent-marketplace-hero.webp");
    expect(JSON.parse(room.verificationRequestJson)).toHaveProperty("manifest");

    const verifierResponse = await fetch(`${baseUrl}/api/buyer-proof-verifier`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: room.verificationRequestJson
    });
    expect(verifierResponse.status).toBe(200);
    expect((await verifierResponse.json()) as { report: { actualDigest: string } }).toMatchObject({
      report: {
        actualDigest: expect.stringMatching(/^[a-f0-9]{16}$/)
      }
    });

    const htmlResponse = await fetch(`${baseUrl}/buyer-proof-room?${query}`);
    expect(htmlResponse.status).toBe(200);
    const html = await htmlResponse.text();
    expect(html).toContain("Buyer Proof Room");
    expect(html).toContain("Verify this room");
    expect(html).toContain("Decision handoff");
    expect(html).toContain("Open handoff step");
    expect(html).toContain("/buyer-review-kit?");
    expect(html).toContain("/buyer-decision-receipt?");
    expect(html).toContain("/buyer-acceptance-path?");
    expect(html).toContain("Owner packet");
    expect(html).toContain("Download owner packet");
    expect(html).toContain("download=\"buyer-proof-room-owner-packet.md\"");
    expect(html).toContain("Repair plan");
    expect(html).toContain("Done signal:");
    expect(html).toContain("Open repair target");
    expect(html).toContain("data-verify-room");
    expect(html).toContain("buyer-proof-room-verification-config");
    expect(html).toContain("/api/buyer-proof-room/manifest?");
    expect(html).not.toContain("buyer-proof-room-verification-request");
    expect(html).toContain("/assets/agent-marketplace-hero.webp");
    expect(html).toContain("buyer-pilot-contract");
    expect(html).not.toContain("—");
    expect(html).not.toContain("–");

    const markdownResponse = await fetch(`${baseUrl}/buyer-proof-room.md?${query}`);
    expect(markdownResponse.status).toBe(200);
    const markdown = await markdownResponse.text();
    expect(markdown).toContain("## Reviewer decisions");
    expect(markdown).toContain("## Decision handoff");
    expect(markdown).toContain("## Owner packet");
    expect(markdown).toContain("Current owner:");
    expect(markdown).toContain("Proof to attach:");
    expect(markdown).toContain(`Recommended decision: ${room.decisionHandoff.recommendedDecision}`);
    expect(markdown).toContain("## Repair plan");
    expect(markdown).toContain("Done signal:");
    expect(markdown).toContain("## Evidence lanes");
    expect(markdown).toContain("buyer-pilot-contract");
  });

  test("serves a lightweight canonical buyer proof room without encoded sample links", async () => {
    const baseUrl = `http://127.0.0.1:${port}`;

    const jsonResponse = await fetch(`${baseUrl}/api/buyer-proof-room`);
    expect(jsonResponse.status).toBe(200);
    const room = (await jsonResponse.json()) as {
      links: {
        roomUrl: string;
        jsonUrl: string;
        markdownUrl: string;
        trustManifestUrl: string;
        trustManifestJsonUrl: string;
        proofVerifierUrl: string;
        pilotContractUrl: string;
        receiptVerifierUrl: string;
        reviewKitUrl: string;
      };
      decisionHandoff: {
        recommendedDecision: string;
        primaryActionHref: string;
      };
      verificationRequestJson: string;
    };

    expect(room.links.roomUrl).toBe(`${baseUrl}/buyer-proof-room`);
    expect(room.links.jsonUrl).toBe(`${baseUrl}/api/buyer-proof-room`);
    expect(room.links.markdownUrl).toBe(`${baseUrl}/buyer-proof-room.md`);
    expect(room.links.trustManifestUrl).toBe(`${baseUrl}/buyer-proof-room/manifest`);
    expect(room.links.trustManifestJsonUrl).toBe(`${baseUrl}/api/buyer-proof-room/manifest`);
    expect(room.links.proofVerifierUrl).toBe(`${baseUrl}/buyer-proof-room/verifier`);
    expect(room.links.pilotContractUrl).toBe(`${baseUrl}/buyer-pilot-contract`);
    expect(room.links.receiptVerifierUrl).toBe(`${baseUrl}/receipt-verifier`);
    expect(room.links.reviewKitUrl).toBe(`${baseUrl}/buyer-review-kit`);
    expect(room.decisionHandoff.primaryActionHref).toBe(`${baseUrl}/buyer-review-kit?decision=${room.decisionHandoff.recommendedDecision}`);
    const roomVerificationRequest = JSON.parse(room.verificationRequestJson) as {
      manifest: {
        generatedAt: string;
        verification: {
          digest: string;
        };
      };
    };
    expect(roomVerificationRequest).toHaveProperty("manifest");
    const snapshotManifestUrl = new URL(room.links.trustManifestJsonUrl);
    snapshotManifestUrl.searchParams.set("roomGeneratedAt", roomVerificationRequest.manifest.generatedAt);
    const snapshotVerifierUrl = new URL(room.links.proofVerifierUrl);
    snapshotVerifierUrl.searchParams.set("roomGeneratedAt", roomVerificationRequest.manifest.generatedAt);

    const manifestResponse = await fetch(snapshotManifestUrl);
    expect(manifestResponse.status).toBe(200);
    const manifest = (await manifestResponse.json()) as { verification: { digest: string } };
    expect(manifest.verification.digest).toBe(roomVerificationRequest.manifest.verification.digest);
    expect(manifest).toMatchObject({
      verification: {
        digest: expect.stringMatching(/^[a-f0-9]{16}$/)
      }
    });

    const verifierResponse = await fetch(snapshotVerifierUrl);
    expect(verifierResponse.status).toBe(200);
    const verifierHtml = await verifierResponse.text();
    expect(verifierHtml).toContain("Buyer Proof Verifier");
    expect(verifierHtml).toContain("/api/buyer-proof-room/manifest");
    expect(verifierHtml).toContain("roomGeneratedAt=");

    const htmlResponse = await fetch(`${baseUrl}/buyer-proof-room`);
    expect(htmlResponse.status).toBe(200);
    const html = await htmlResponse.text();
    const configScript = html.match(/id="buyer-proof-room-verification-config">([^<]*)<\/script>/)?.[1] ?? "";
    const topNavigation = html.match(/<nav aria-label="Proof room navigation">([\s\S]*?)<\/nav>/)?.[1] ?? "";

    expect(html.length).toBeLessThan(260_000);
    expect(html).toContain("buyer-proof-room-verification-config");
    expect(html).not.toContain("buyer-proof-room-verification-request");
    expect(configScript.length).toBeLessThan(500);
    expect(configScript).toContain("/api/buyer-proof-room/manifest");
    expect(configScript).toContain("roomGeneratedAt");
    expect(topNavigation).not.toContain("workOrder=");
    expect(topNavigation).not.toContain("customAgents=");
  });

  test("prefills the receipt verifier from a verification request URL", async () => {
    const requestJson = JSON.stringify(
      {
        checksum: "12345678",
        payload: {
          receiptVersion: "quick-buyer-decision-reply-record.v1",
          decision: "revise"
        }
      },
      null,
      2
    );

    const response = await fetch(`http://127.0.0.1:${port}/receipt-verifier?request=${encodeURIComponent(requestJson)}&verify=1`);
    expect(response.status).toBe(200);
    const html = await response.text();

    expect(html).toContain("Verification request loaded from the URL. Running verifier...");
    expect(html).toContain("const autoVerify = true");
    expect(html).toContain("quick-buyer-decision-reply-record.v1");
    expect(html).toContain(`href="http://127.0.0.1:${port}/buyer-trust-manifest"`);
    expect(html).not.toContain("/buyer-trust-manifest?request=");
  });

  test("publishes sample manifest artifacts with proof-backed query URLs", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/.well-known/buyer-proof.json`);
    expect(response.status).toBe(200);
    const manifest = (await response.json()) as BuyerProofManifestResponse;
    const artifactById = (id: string) => manifest.artifacts.find((artifact) => artifact.id === id);

    for (const id of ["work-order", "delivery-memo", "proof-packet", "buyer-pilot-contract", "decision-follow-up", "live-proof-audit"]) {
      const artifact = artifactById(id);
      expect(artifact?.href).toContain("?brief=");
      const url = new URL(artifact?.href ?? "");
      expect(url.searchParams.get("targetUrl")).toMatch(/^https:\/\//);
      expect(url.searchParams.get("pilotEvidenceUrl")).toMatch(/\/sample\/pilot-run-receipt$/);
      expect(url.searchParams.get("workOrderEvidenceUrl")).toMatch(/\/sample\/work-order-brief$/);
      expect(url.searchParams.has("workspace")).toBe(false);
    }

    const evidenceBoard = artifactById("buyer-evidence-board");
    expect(evidenceBoard?.href).toContain("/buyer-evidence-board?workspace=lz1.");
    expect(new URL(evidenceBoard?.href ?? "").searchParams.get("workspace")).toMatch(/^lz1\./);
    expect(artifactById("delivery-memo")?.href).toContain("/buyer-delivery-memo?");
    expect(artifactById("decision-follow-up")?.href).toContain("/buyer-decision-follow-up?");
    expect(artifactById("live-proof-audit")?.href).toContain("/buyer-proof-audit?");
    const evidenceBoardReceipt = manifest.receipts.find((receipt) => receipt.id === "buyer-evidence-board");
    const commercialOfferReceipt = manifest.receipts.find((receipt) => receipt.id === "commercial-offer");
    const buyerPilotContractReceipt = manifest.receipts.find((receipt) => receipt.id === "buyer-pilot-contract");
    expect(evidenceBoardReceipt).toMatchObject({
      status: expect.stringMatching(/pass|watch|block/),
      verifier: "POST /api/buyer-evidence-board/receipt/verify"
    });
    expect(commercialOfferReceipt).toMatchObject({
      status: expect.stringMatching(/pass|watch|block/),
      verifier: "POST /api/commercial-offer/receipt/verify"
    });
    expect(buyerPilotContractReceipt).toMatchObject({
      status: expect.stringMatching(/pass|watch|block/),
      verifier: "POST /api/buyer-pilot-contract/receipt/verify"
    });
    expect(manifest.verification.payload.buyerEvidenceBoardReceiptChecksum).toBe(evidenceBoardReceipt?.digest);
    expect(manifest.verification.payload.commercialOfferReceiptChecksum).toBe(commercialOfferReceipt?.digest);
    expect(manifest.verification.payload.buyerPilotContractReceiptChecksum).toBe(buyerPilotContractReceipt?.digest);
    expect(manifest.verification.payload.buyerPilotContractId).toMatch(/^buyer-pilot-contract-/);
    expect(manifest.publicationGate).toMatchObject({
      decision: "hold",
      blockedCount: 6
    });
    expect(manifest.publicationGate.firstActionHref).toContain("?");
    expect(manifest.publicationGate.checks.find((check) => check.id === "delivery-memo")?.href).toBe(artifactById("delivery-memo")?.href);
    expect(manifest.publicationGate.checks.find((check) => check.id === "buyer-evidence-board")?.href).toBe(evidenceBoard?.href);
    expect(manifest.publicationGate.checks.find((check) => check.id === "buyer-pilot-contract")?.href).toBe(artifactById("buyer-pilot-contract")?.href);
    expect(manifest.publicationGate.checks.find((check) => check.id === "decision-follow-up")?.href).toBe(artifactById("decision-follow-up")?.href);
    expect(manifest.verification.payload.artifacts.find((artifact) => artifact.id === "delivery-memo")?.href).toBe(artifactById("delivery-memo")?.href);
    expect(manifest.verification.payload.artifacts.find((artifact) => artifact.id === "buyer-evidence-board")?.href).toBe(evidenceBoard?.href);
    expect(manifest.verification.payload.artifacts.find((artifact) => artifact.id === "buyer-pilot-contract")?.href).toBe(artifactById("buyer-pilot-contract")?.href);
    expect(manifest.verification.payload.artifacts.find((artifact) => artifact.id === "decision-follow-up")?.href).toBe(artifactById("decision-follow-up")?.href);
    expect(manifest.verificationBrief.machineManifestHref).toContain("/.well-known/buyer-proof.json");
    expect(manifest.verificationBrief.primaryArtifactHref).toBe(manifest.publicationGate.firstActionHref);
    expect(manifest.verificationBrief.instructions.join("\n")).toContain("verification.payload");
    expect(manifest.verification.verificationApiPath).toBe("/api/buyer-trust-manifest/receipt/verify");

    const verifyResponse = await fetch(`http://127.0.0.1:${port}${manifest.verification.verificationApiPath}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        digest: manifest.verification.digest,
        payload: manifest.verification.payload
      })
    });
    expect(verifyResponse.status).toBe(200);
    expect((await verifyResponse.json()) as { skill: string; verification: { status: string } }).toMatchObject({
      skill: "buyer-trust-manifest.receipt.verify",
      verification: {
        status: "verified"
      }
    });

    const proofVerifierResponse = await fetch(`http://127.0.0.1:${port}/api/buyer-proof-verifier`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manifest })
    });
    expect(proofVerifierResponse.status).toBe(200);
    const proofVerifierBody = (await proofVerifierResponse.json()) as { skill: string; report: { actualDigest: string; checks: Array<{ id: string; status: string }> } };
    expect(proofVerifierBody).toMatchObject({
      skill: "buyer-proof-verifier.report",
      report: {
        actualDigest: manifest.verification.digest
      }
    });
    expect(proofVerifierBody.report.checks.find((check) => check.id === "manifest-digest")).toMatchObject({
      status: "pass"
    });

    const decisionReceiptResponse = await fetch(
      `http://127.0.0.1:${port}/api/buyer-decision-receipt?decision=revise&reviewerName=External%20reviewer`
    );
    expect(decisionReceiptResponse.status).toBe(200);
    const decisionReceipt = (await decisionReceiptResponse.json()) as {
      choice: string;
      readiness: string;
      checksum: string;
      payload: unknown;
      verificationApiPath: string;
    };
    expect(decisionReceipt).toMatchObject({
      choice: "revise",
      readiness: expect.any(String),
      verificationApiPath: "/api/buyer-decision-receipt/verify"
    });
    const decisionVerifyResponse = await fetch(`http://127.0.0.1:${port}${decisionReceipt.verificationApiPath}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checksum: decisionReceipt.checksum,
        payload: decisionReceipt.payload
      })
    });
    expect(decisionVerifyResponse.status).toBe(200);
    expect((await decisionVerifyResponse.json()) as { skill: string; verification: { status: string } }).toMatchObject({
      skill: "buyer-decision-receipt.verify",
      verification: {
        status: "verified"
      }
    });

    const reviewKitResponse = await fetch(`http://127.0.0.1:${port}/api/buyer-review-kit?decision=revise&reviewerName=External%20reviewer`);
    expect(reviewKitResponse.status).toBe(200);
    const reviewKit = (await reviewKitResponse.json()) as {
      decisionChoice: string;
      steps: Array<{ id: string; href: string }>;
    };
    expect(reviewKit.decisionChoice).toBe("revise");
    expect(reviewKit.steps.map((step) => step.id)).toEqual(["verify-manifest", "inspect-proof", "record-decision", "assign-follow-up"]);
    expect(reviewKit.steps.find((step) => step.id === "record-decision")?.href).toContain("/buyer-decision-receipt?decision=revise");

    const reviewKitHtmlResponse = await fetch(`http://127.0.0.1:${port}/buyer-review-kit?decision=revise&reviewerName=External%20reviewer`);
    expect(reviewKitHtmlResponse.status).toBe(200);
    const reviewKitHtml = await reviewKitHtmlResponse.text();
    expect(reviewKitHtml).toContain("Buyer Review Kit");
    expect(reviewKitHtml).toContain("Decision receipt");
    expect(reviewKitHtml).toContain("/buyer-decision-receipt?decision=revise");
    expect(reviewKitHtml).toContain("/buyer-acceptance-path?decision=revise");

    const reviewKitMarkdownResponse = await fetch(`http://127.0.0.1:${port}/buyer-review-kit.md?decision=revise&reviewerName=External%20reviewer`);
    expect(reviewKitMarkdownResponse.status).toBe(200);
    expect(await reviewKitMarkdownResponse.text()).toContain("## Review protocol");

    const replyRecordRequest = routeReplyRecordVerificationRequestJson();
    const replyReviewKitParams = workspaceArtifactSearchParams(buildProofBackedSampleWorkspaceDraft("2026-06-20T00:00:00.000Z", `http://127.0.0.1:${port}`));
    replyReviewKitParams.set("decision", "continue");
    replyReviewKitParams.set("replyRecordRequest", replyRecordRequest);
    const replyReviewKitQuery = replyReviewKitParams.toString();
    const replyReviewKitResponse = await fetch(`http://127.0.0.1:${port}/api/buyer-review-kit?${replyReviewKitQuery}`);
    expect(replyReviewKitResponse.status).toBe(200);
    const replyReviewKit = (await replyReviewKitResponse.json()) as {
      readyCount: number;
      primaryAction: { id: string };
      steps: Array<{ id: string; status: string; href: string; evidence: string }>;
    };
    expect(replyReviewKit.readyCount).toBeGreaterThanOrEqual(1);
    expect(replyReviewKit.steps.map((step) => step.id)).toEqual([
      "verify-manifest",
      "inspect-proof",
      "record-decision",
      "assign-follow-up",
      "verify-reply-record"
    ]);
    expect(replyReviewKit.steps.find((step) => step.id === "verify-reply-record")).toMatchObject({
      status: "ready",
      href: expect.stringContaining("/receipt-verifier?request="),
      evidence: expect.stringContaining("Platform release lead")
    });
    expect(replyReviewKit.steps.find((step) => step.id === "record-decision")?.href).toContain("/buyer-decision-receipt?");
    expect(replyReviewKit.steps.find((step) => step.id === "record-decision")?.href).toContain("decision=continue");
    expect(replyReviewKit.steps.find((step) => step.id === "record-decision")?.href).not.toContain("replyRecordRequest");

    const replyReviewKitHtmlResponse = await fetch(`http://127.0.0.1:${port}/buyer-review-kit?${replyReviewKitQuery}`);
    expect(replyReviewKitHtmlResponse.status).toBe(200);
    const replyReviewKitHtml = await replyReviewKitHtmlResponse.text();
    expect(replyReviewKitHtml).toContain("Reply receipt");
    expect(replyReviewKitHtml).toContain("Verify buyer reply");
    const trustManifestHref = replyReviewKitHtml.match(/href="([^"]*\/buyer-trust-manifest[^"]*)"/)?.[1] ?? "";
    expect(trustManifestHref).toContain("decision=continue");
    expect(trustManifestHref).not.toContain("replyRecordRequest");

    const replyReviewKitMarkdownResponse = await fetch(`http://127.0.0.1:${port}/buyer-review-kit.md?${replyReviewKitQuery}`);
    expect(replyReviewKitMarkdownResponse.status).toBe(200);
    expect(await replyReviewKitMarkdownResponse.text()).toContain("Verify buyer reply");

    const replyAcceptancePathResponse = await fetch(`http://127.0.0.1:${port}/api/buyer-acceptance-path?${replyReviewKitQuery}`);
    expect(replyAcceptancePathResponse.status).toBe(200);
    const replyAcceptancePath = (await replyAcceptancePathResponse.json()) as {
      stages: Array<{ id: string; status: string; href: string; evidence: string }>;
      ownerCommitments: Array<{ role: string; owner: string; artifact: string }>;
      receipt: {
        checksum: string;
        verificationApiPath: string;
        payload: {
          receiptVersion: string;
          pathId: string;
          replyRecord?: { decision: string; checksum: string };
          stages: Array<{ id: string }>;
        };
        verification: { status: string };
      };
    };
    expect(replyAcceptancePath.stages.map((stage) => stage.id)).toEqual([
      "external-review",
      "buyer-reply",
      "procurement-case",
      "commercial-approval",
      "adoption-operation",
      "owner-follow-up"
    ]);
    expect(replyAcceptancePath.stages.find((stage) => stage.id === "buyer-reply")).toMatchObject({
      status: "accepted",
      href: expect.stringContaining("/receipt-verifier?request="),
      evidence: expect.stringContaining("Platform release lead")
    });
    expect(replyAcceptancePath.stages.find((stage) => stage.id === "external-review")?.href).toContain("replyRecordRequest=");
    expect(replyAcceptancePath.stages.find((stage) => stage.id === "procurement-case")?.href).not.toContain("replyRecordRequest");
    expect(replyAcceptancePath.ownerCommitments[0]).toMatchObject({
      role: "Buyer reply",
      owner: "Platform release lead",
      artifact: expect.stringContaining("/receipt-verifier?request=")
    });
    expect(replyAcceptancePath.receipt).toMatchObject({
      verificationApiPath: "/api/buyer-acceptance-path/receipt/verify",
      verification: {
        status: "verified"
      },
      payload: {
        receiptVersion: "buyer-acceptance-path.v1",
        replyRecord: {
          decision: "continue",
          checksum: expect.any(String)
        }
      }
    });
    expect(replyAcceptancePath.receipt.payload.stages.map((stage) => stage.id)).toEqual([
      "external-review",
      "buyer-reply",
      "procurement-case",
      "commercial-approval",
      "adoption-operation",
      "owner-follow-up"
    ]);

    const replyAcceptancePathReceiptResponse = await fetch(`http://127.0.0.1:${port}${replyAcceptancePath.receipt.verificationApiPath}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checksum: replyAcceptancePath.receipt.checksum,
        payload: replyAcceptancePath.receipt.payload
      })
    });
    expect(replyAcceptancePathReceiptResponse.status).toBe(200);
    expect((await replyAcceptancePathReceiptResponse.json()) as { skill: string; verification: { status: string }; receipt: { replyDecision: string } }).toMatchObject({
      skill: "buyer-acceptance-path.receipt.verify",
      verification: {
        status: "verified"
      },
      receipt: {
        replyDecision: "continue"
      }
    });

    const replyAcceptancePathHtmlResponse = await fetch(`http://127.0.0.1:${port}/buyer-acceptance-path?${replyReviewKitQuery}`);
    expect(replyAcceptancePathHtmlResponse.status).toBe(200);
    const replyAcceptancePathHtml = await replyAcceptancePathHtmlResponse.text();
    expect(replyAcceptancePathHtml).toContain("Reply receipt");
    expect(replyAcceptancePathHtml).toContain("Receipt JSON");
    expect(replyAcceptancePathHtml).toContain("Verify path");
    expect(replyAcceptancePathHtml).toContain("Buyer reply");
    const procurementHref = replyAcceptancePathHtml.match(/href="([^"]*\/procurement-decision[^"]*)"/)?.[1] ?? "";
    expect(procurementHref).toContain("decision=continue");
    expect(procurementHref).not.toContain("replyRecordRequest");

    const replyAcceptancePathMarkdownResponse = await fetch(`http://127.0.0.1:${port}/buyer-acceptance-path.md?${replyReviewKitQuery}`);
    expect(replyAcceptancePathMarkdownResponse.status).toBe(200);
    expect(await replyAcceptancePathMarkdownResponse.text()).toContain("Buyer reply");

    const acceptancePathResponse = await fetch(`http://127.0.0.1:${port}/api/buyer-acceptance-path?decision=revise&reviewerName=External%20reviewer`);
    expect(acceptancePathResponse.status).toBe(200);
    const acceptancePath = (await acceptancePathResponse.json()) as {
      decision: string;
      stages: Array<{ id: string; href: string }>;
      receipt: {
        checksum: string;
        verificationApiPath: string;
        verification: { status: string };
        payload: { pathId: string };
      };
    };
    expect(acceptancePath.decision).toMatch(/approve-pilot|sponsor-review|do-not-send/);
    expect(acceptancePath.stages.map((stage) => stage.id)).toEqual(["external-review", "procurement-case", "commercial-approval", "adoption-operation", "owner-follow-up"]);
    expect(acceptancePath.stages.find((stage) => stage.id === "external-review")?.href).toContain("/buyer-review-kit?decision=revise");
    expect(acceptancePath.receipt).toMatchObject({
      verificationApiPath: "/api/buyer-acceptance-path/receipt/verify",
      verification: {
        status: "verified"
      }
    });

    const acceptancePathRequestJson = JSON.stringify({
      checksum: acceptancePath.receipt.checksum,
      payload: acceptancePath.receipt.payload
    });
    const launchRoomWithAcceptanceResponse = await fetch(
      `http://127.0.0.1:${port}/api/launch-room?acceptancePathRequest=${encodeURIComponent(acceptancePathRequestJson)}`
    );
    expect(launchRoomWithAcceptanceResponse.status).toBe(200);
    const launchRoomWithAcceptance = (await launchRoomWithAcceptanceResponse.json()) as {
      acceptancePath?: { verified: boolean; pathId: string; status: string; receiptType: string };
      artifacts: Array<{ id: string; href: string }>;
      buyerDecision: { checks: Array<{ id: string; status: string }> };
      handoffPacket: {
        acceptanceChecks: Array<{ id: string; status: string }>;
        decisionReceipt: {
          replayFields: string[];
          replayPayload: { acceptancePath?: { pathId: string; checksum: string; verified: boolean } };
        };
      };
    };
    expect(launchRoomWithAcceptance.acceptancePath).toMatchObject({
      verified: true,
      status: "verified",
      receiptType: "buyer-acceptance-path.v1",
      pathId: acceptancePath.receipt.payload.pathId
    });
    expect(launchRoomWithAcceptance.artifacts.find((artifact) => artifact.id === "acceptance-path")?.href).toContain("/receipt-verifier?request=");
    expect(launchRoomWithAcceptance.buyerDecision.checks.find((check) => check.id === "acceptance-path")).toMatchObject({
      status: "blocked"
    });
    expect(launchRoomWithAcceptance.handoffPacket.acceptanceChecks.find((check) => check.id === "acceptance-path")).toMatchObject({
      status: "blocked"
    });
    expect(launchRoomWithAcceptance.handoffPacket.decisionReceipt.replayFields).toContain("acceptancePath");
    expect(launchRoomWithAcceptance.handoffPacket.decisionReceipt.replayPayload.acceptancePath).toMatchObject({
      pathId: acceptancePath.receipt.payload.pathId,
      checksum: acceptancePath.receipt.checksum,
      verified: true
    });

    const launchRoomAcceptanceHtmlResponse = await fetch(
      `http://127.0.0.1:${port}/launch-room?acceptancePathRequest=${encodeURIComponent(acceptancePathRequestJson)}`
    );
    expect(launchRoomAcceptanceHtmlResponse.status).toBe(200);
    const launchRoomAcceptanceHtml = await launchRoomAcceptanceHtmlResponse.text();
    expect(launchRoomAcceptanceHtml).toContain("Buyer acceptance path");
    expect(launchRoomAcceptanceHtml).toContain("Acceptance path");
    expect(launchRoomAcceptanceHtml).toContain("acceptancePathRequest=");
    const launchRoomJsonHref = launchRoomAcceptanceHtml.match(/href="([^"]*\/api\/launch-room[^"]*)"/)?.[1] ?? "";
    const launchRoomMarkdownHref = launchRoomAcceptanceHtml.match(/href="([^"]*\/launch-room\.md[^"]*)"/)?.[1] ?? "";
    const launchRoomShareGateHref = launchRoomAcceptanceHtml.match(/href="([^"]*\/buyer-share-gate[^"]*)"/)?.[1] ?? "";
    expect(launchRoomJsonHref).toContain("acceptancePathRequest=");
    expect(launchRoomMarkdownHref).toContain("acceptancePathRequest=");
    expect(launchRoomShareGateHref).not.toContain("acceptancePathRequest=");

    const launchRoomAcceptanceMarkdownResponse = await fetch(
      `http://127.0.0.1:${port}/launch-room.md?acceptancePathRequest=${encodeURIComponent(acceptancePathRequestJson)}`
    );
    expect(launchRoomAcceptanceMarkdownResponse.status).toBe(200);
    const launchRoomAcceptanceMarkdown = await launchRoomAcceptanceMarkdownResponse.text();
    expect(launchRoomAcceptanceMarkdown).toContain("## Acceptance path attachment");
    expect(launchRoomAcceptanceMarkdown).toContain(acceptancePath.receipt.payload.pathId);

    const acceptancePathHtmlResponse = await fetch(`http://127.0.0.1:${port}/buyer-acceptance-path?decision=revise&reviewerName=External%20reviewer`);
    expect(acceptancePathHtmlResponse.status).toBe(200);
    const acceptancePathHtml = await acceptancePathHtmlResponse.text();
    expect(acceptancePathHtml).toContain("Buyer Acceptance Path");
    expect(acceptancePathHtml).toContain("Acceptance path");
    expect(acceptancePathHtml).toContain("Verify path");
    expect(acceptancePathHtml).toContain("/commercial-offer?decision=revise");

    const acceptancePathMarkdownResponse = await fetch(`http://127.0.0.1:${port}/buyer-acceptance-path.md?decision=revise&reviewerName=External%20reviewer`);
    expect(acceptancePathMarkdownResponse.status).toBe(200);
    const acceptancePathMarkdown = await acceptancePathMarkdownResponse.text();
    expect(acceptancePathMarkdown).toContain("## Acceptance stages");
    expect(acceptancePathMarkdown).toContain("POST /api/buyer-acceptance-path/receipt/verify");

    const publishabilityResponse = await fetch(`http://127.0.0.1:${port}/api/global-publishability`);
    expect(publishabilityResponse.status).toBe(200);
    const publishability = (await publishabilityResponse.json()) as {
      id: string;
      decision: string;
      targetBuyer: string;
      gates: Array<{ id: string; status: string }>;
      valueRoute: Array<{ id: string; status: string }>;
      reviewerBrief: {
        recommendedDecision: string;
        proofChecks: Array<{ id: string; status: string }>;
      };
      handoffMemo: {
        audience: string;
        subject: string;
        noSendWarning?: string;
      };
      launchPacket: {
        status: string;
        currentOwner: string;
        currentCommand: string;
        publishRule: string;
        items: Array<{ id: string; href: string; proofToAttach: string; doneSignal: string }>;
        href: string;
      };
      repairTickets: Array<{
        id: string;
        sourceItemId: string;
        title: string;
        owner: string;
        receiptGuard: string;
        acceptanceCriteria: string[];
      }>;
      repairRunbook: {
        mode: string;
        externalShareLocked: boolean;
        stepCount: number;
        nowCount: number;
        steps: Array<{ ticketId: string; proofSlot: string; shareGate: string; proofRequirements: Array<{ id: string; label: string }> }>;
        href: string;
        csvHref: string;
      };
      receipt: {
        checksum: string;
        verificationApiPath: string;
        payload: Record<string, unknown>;
        verification: { status: string };
      };
      primaryAction: { label: string; href: string };
    };
    expect(publishability.targetBuyer).toBe("Platform / DevOps Lead");
    expect(publishability.decision).toBe("do-not-publish");
    expect(publishability.gates.map((gate) => gate.id)).toEqual(["value-story", "live-reachability", "proof-substance", "ops-trust", "buyer-decision-path"]);
    expect(publishability.valueRoute.map((step) => step.id)).toEqual(["buyer-value", "measured-proof", "public-proof", "buyer-decision"]);
    expect(publishability.reviewerBrief.recommendedDecision).toBe("hold-public-launch");
    expect(publishability.reviewerBrief.proofChecks.map((check) => check.id)).toEqual(["buyer-value", "measured-proof", "public-proof", "buyer-decision"]);
    expect(publishability.handoffMemo).toMatchObject({
      audience: "launch-owner",
      subject: "Do not send: Public proof opens globally"
    });
    expect(publishability.handoffMemo.noSendWarning).toContain("Do not send this memo to a buyer");
    expect(publishability.launchPacket).toMatchObject({
      status: "block",
      currentOwner: "Launch owner",
      currentCommand: "Hold if the deployed product, story, demo, or receipt cannot be reached publicly."
    });
    expect(publishability.launchPacket.publishRule).toContain("Do not publish");
    expect(publishability.launchPacket.items[0]).toMatchObject({
      id: "launch-live-reachability",
      href: expect.stringContaining("/launch-evidence"),
      proofToAttach: expect.stringContaining("HTTPS product URL"),
      doneSignal: expect.stringContaining("returns pass")
    });
    expect(publishability.launchPacket.items[0].href).not.toContain("workspace=");
    expect(publishability.repairTickets[0]).toMatchObject({
      sourceItemId: "launch-live-reachability",
      title: "Public proof opens globally",
      owner: "Launch owner",
      receiptGuard: expect.stringContaining("Do not close this ticket")
    });
    expect(publishability.repairTickets[0].acceptanceCriteria).toContain("A reviewer can open the attached proof without private context or a separate walkthrough.");
    expect(publishability.repairRunbook).toMatchObject({
      mode: "repair-required",
      externalShareLocked: true,
      stepCount: publishability.repairTickets.length
    });
    expect(publishability.repairRunbook.nowCount).toBeGreaterThan(0);
    expect(publishability.repairRunbook.steps[0]).toMatchObject({
      ticketId: publishability.repairTickets[0].id,
      proofSlot: expect.stringContaining("HTTPS product URL"),
      proofRequirements: [
        expect.objectContaining({ id: "targetUrl", label: "Live product" }),
        expect.objectContaining({ id: "protopediaUrl", label: "ProtoPedia story" }),
        expect.objectContaining({ id: "videoUrl", label: "Walkthrough video" })
      ],
      shareGate: expect.stringContaining("No external send")
    });
    expect(publishability.repairRunbook.href).toContain("data:text/markdown");
    expect(publishability.repairRunbook.csvHref).toContain("data:text/csv");
    expect(publishability.launchPacket.href).toContain("data:text/markdown");
    expect(publishability.receipt.payload).toHaveProperty("launchPacket");
    expect(publishability.receipt.payload).toHaveProperty("repairTickets");
    expect(publishability.receipt.payload).toHaveProperty("repairRunbook");
    expect(publishability.receipt).toMatchObject({
      verificationApiPath: "/api/global-publishability/receipt/verify",
      verification: { status: "verified" }
    });
    expect(publishability.gates.find((gate) => gate.id === "live-reachability")?.status).toBe("block");
    expect(publishability.valueRoute.find((step) => step.id === "public-proof")?.status).toBe("block");
    expect(publishability.reviewerBrief.proofChecks.find((check) => check.id === "public-proof")?.status).toBe("block");
    expect(publishability.primaryAction.label).toContain("Fix");

    const publishabilityHtmlResponse = await fetch(`http://127.0.0.1:${port}/global-publishability`);
    expect(publishabilityHtmlResponse.status).toBe(200);
    const publishabilityHtml = await publishabilityHtmlResponse.text();
    expect(publishabilityHtml).toContain("Global Publishability Report");
    expect(publishabilityHtml).toContain("Publishability receipt");
    expect(publishabilityHtml).toContain("/api/global-publishability/receipt/verify");
    expect(publishabilityHtml).toContain("Verify receipt");
    expect(publishabilityHtml).toContain("Receipt not checked in this browser yet.");
    expect(publishabilityHtml).toContain("Buyer handoff memo");
    expect(publishabilityHtml).toContain("Do not send: Public proof opens globally");
    expect(publishabilityHtml).toContain("Global launch packet");
    expect(publishabilityHtml).toContain("Owner repair tickets");
    expect(publishabilityHtml).toContain("Evidence contract");
    expect(publishabilityHtml).toContain("Download ticket");
    expect(publishabilityHtml).toContain("Owner repair runbook");
    expect(publishabilityHtml).toContain("Download runbook");
    expect(publishabilityHtml).toContain("Download CSV");
    expect(publishabilityHtml).toContain("Repair proof check");
    expect(publishabilityHtml).toContain("data-repair-check-form");
    expect(publishabilityHtml).toContain("global-publishability-repair-requirements");
    expect(publishabilityHtml).toContain("data-proof-requirement");
    expect(publishabilityHtml).toContain("/api/global-publishability/repair-check");
    expect(publishabilityHtml).toContain("data-repair-check-receipt-download");
    expect(publishabilityHtml).toContain("data-repair-check-verifier");
    expect(publishabilityHtml).toContain("/receipt-verifier?request=");
    expect(publishabilityHtml).toContain("Download launch packet");
    expect(publishabilityHtml).toContain("download=\"global-publishability-launch-packet.md\"");
    expect(publishabilityHtml).toContain("Proof to attach:");
    expect(publishabilityHtml).toContain("Done signal:");
    expect(publishabilityHtml).toContain("Reviewer decision brief");
    expect(publishabilityHtml).toContain("Stop rule");
    expect(publishabilityHtml).toContain("Buyer value route");
    expect(publishabilityHtml).toContain("/global-proof-dossier");
    expect(publishabilityHtml).toContain("/api/global-publishability");
    expect(publishabilityHtml).not.toContain("/global-proof-dossier?workspace=");
    expect(publishabilityHtml).not.toContain("/api/global-publishability?workspace=");

    const publishabilityMarkdownResponse = await fetch(`http://127.0.0.1:${port}/global-publishability.md`);
    expect(publishabilityMarkdownResponse.status).toBe(200);
    const publishabilityMarkdown = await publishabilityMarkdownResponse.text();
    expect(publishabilityMarkdown).toContain("## Publishability receipt");
    expect(publishabilityMarkdown).toContain("## Handoff memo");
    expect(publishabilityMarkdown).toContain("## Launch packet");
    expect(publishabilityMarkdown).toContain("## Repair tickets");
    expect(publishabilityMarkdown).toContain("## Owner repair runbook");
    expect(publishabilityMarkdown).toContain("Proof to attach:");
    expect(publishabilityMarkdown).toContain("Done signal:");
    expect(publishabilityMarkdown).toContain("Receipt guard:");
    expect(publishabilityMarkdown).toContain("## Reviewer decision brief");
    expect(publishabilityMarkdown).toContain("## Buyer value route");
    expect(publishabilityMarkdown).toContain("## Publishability gates");

    const publishabilityReceiptResponse = await fetch(`http://127.0.0.1:${port}/api/global-publishability/receipt/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        checksum: publishability.receipt.checksum,
        payload: publishability.receipt.payload
      })
    });
    expect(publishabilityReceiptResponse.status).toBe(200);
    const receiptVerification = (await publishabilityReceiptResponse.json()) as {
      skill: string;
      verification: { status: string };
      receipt: { decision: string; blockedGates: number; repairTicketCount: number; firstRepairTicket: string };
    };
    expect(publishability.repairTickets.length).toBeGreaterThan(0);
    expect(receiptVerification).toMatchObject({
      skill: "global-publishability.receipt.verify",
      verification: { status: "verified" },
      receipt: {
        decision: publishability.decision,
        repairTicketCount: publishability.repairTickets.length,
        firstRepairTicket: publishability.repairTickets[0].title
      }
    });
    expect(receiptVerification.receipt.blockedGates).toBeGreaterThan(0);

    const repairCheckResponse = await fetch(`http://127.0.0.1:${port}/api/global-publishability/repair-check`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        verificationRequest: {
          checksum: publishability.receipt.checksum,
          payload: publishability.receipt.payload
        },
        stepId: publishability.repairRunbook.steps[0].ticketId,
        proofUrls: [{ id: "targetUrl", label: "Live product", value: "https://example.com/demo" }]
      })
    });
    expect(repairCheckResponse.status).toBe(200);
    const repairCheck = (await repairCheckResponse.json()) as {
      skill: string;
      status: string;
      decision: string;
      missingProofCount: number;
      step: { ticketId: string };
      checksum: string;
      receipt: {
        checksum: string;
        verificationApiPath: string;
        verificationRequestJson: string;
        payload: {
          receiptVersion: string;
          reportId: string;
          sourceReceiptChecksum: string;
        };
      };
      href: string;
    };
    expect(repairCheck).toMatchObject({
      skill: "global-publishability.repair-check",
      status: "blocked",
      decision: "no-send",
      step: { ticketId: publishability.repairRunbook.steps[0].ticketId }
    });
    expect(repairCheck.missingProofCount).toBeGreaterThan(0);
    expect(repairCheck.href).toContain("data:text/markdown");
    expect(repairCheck.checksum).toBe(repairCheck.receipt.checksum);
    expect(repairCheck.receipt).toMatchObject({
      verificationApiPath: "/api/global-publishability/repair-check/receipt/verify",
      payload: {
        receiptVersion: "global-publishability-repair-check.v1",
        reportId: publishability.id,
        sourceReceiptChecksum: publishability.receipt.checksum
      }
    });

    const repairCheckReceiptResponse = await fetch(`http://127.0.0.1:${port}${repairCheck.receipt.verificationApiPath}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: repairCheck.receipt.verificationRequestJson
    });
    expect(repairCheckReceiptResponse.status).toBe(200);
    const repairCheckReceiptVerification = await repairCheckReceiptResponse.json();
    expect(repairCheckReceiptVerification).toMatchObject({
      skill: "global-publishability-repair-check.receipt.verify",
      verification: {
        status: "verified",
        expectedChecksum: repairCheck.receipt.checksum,
        actualChecksum: repairCheck.receipt.checksum
      },
      receipt: {
        reportId: publishability.id,
        status: "blocked",
        decision: "no-send"
      }
    });
  }, 30000);

  test("opens compressed workspace launch-room URLs with workspace-specific room state", async () => {
    const baseUrl = `http://127.0.0.1:${port}`;
    const sample = buildProofBackedSampleWorkspaceDraft("2026-06-20T00:00:00.000Z", baseUrl);
    const workspace = buildWorkspaceDraft({
      ...sample,
      projectBrief: "Launch a global buyer proof room for compressed workspace URL handoff.",
      buyerWorkOrder: {
        ...sample.buyerWorkOrder,
        request: "Route a global launch-room review to revenue operations with live proof and a bounded pilot decision.",
        targetUser: "Global revenue ops lead"
      }
    });
    const workspaceParam = encodeWorkspaceShareParam(workspace);

    expect(workspaceParam).toMatch(/^lz1\./);

    const jsonResponse = await fetch(`${baseUrl}/api/launch-room?workspace=${encodeURIComponent(workspaceParam)}`);
    expect(jsonResponse.status).toBe(200);
    const room = (await jsonResponse.json()) as {
      targetBuyer: string;
      projectBrief: string;
      artifacts: Array<{ id: string; href: string; owner: string; summary: string }>;
    };

    expect(room.projectBrief).toContain("compressed workspace URL handoff");
    expect(room.artifacts.find((artifact) => artifact.id === "work-order-brief")?.summary).toContain("revenue operations");
    expect(room.artifacts.find((artifact) => artifact.id === "delivery-memo")?.owner).toBe("Global revenue ops lead");
    expect(room.artifacts.find((artifact) => artifact.id === "workspace")?.href).toContain("workspace=lz1.");

    const htmlResponse = await fetch(`${baseUrl}/launch-room?workspace=${encodeURIComponent(workspaceParam)}`);
    expect(htmlResponse.status).toBe(200);
    const html = await htmlResponse.text();

    expect(html).toContain("Global revenue ops lead");
    expect(html).toContain("compressed workspace URL handoff");
    expect(html).toContain("/buyer-share-gate?workspace=lz1.");
    expect(html).toContain("/api/launch-room?workspace=lz1.");

    const valueHtmlResponse = await fetch(`${baseUrl}/buyer-value?workspace=${encodeURIComponent(workspaceParam)}`);
    expect(valueHtmlResponse.status).toBe(200);
    const valueHtml = await valueHtmlResponse.text();
    expect(valueHtml).toContain("Buyer Value Report");
    expect(valueHtml).toContain("/api/buyer-value?workspace=lz1.");

    const workOrderHtmlResponse = await fetch(`${baseUrl}/work-order-brief?workspace=${encodeURIComponent(workspaceParam)}`);
    expect(workOrderHtmlResponse.status).toBe(200);
    const workOrderHtml = await workOrderHtmlResponse.text();
    expect(workOrderHtml).toContain("revenue operations");
    expect(workOrderHtml).toContain("Global revenue ops lead");

    const boardJsonResponse = await fetch(`${baseUrl}/api/buyer-evidence-board?workspace=${encodeURIComponent(workspaceParam)}`);
    expect(boardJsonResponse.status).toBe(200);
    const board = (await boardJsonResponse.json()) as {
      buyer: string;
      headline: string;
      memoMarkdown: string;
      receipt: {
        receiptId: string;
        checksum: string;
        verificationApiPath: string;
        verificationRequestJson: string;
        payload: unknown;
      };
    };
    expect(board.buyer).toBe("Global revenue ops lead");
    expect(board.memoMarkdown).toContain("compressed workspace URL handoff");
    expect(board.receipt.receiptId).toMatch(/^buyer-evidence-board-/);
    expect(board.receipt.verificationApiPath).toBe("/api/buyer-evidence-board/receipt/verify");

    const verifyResponse = await fetch(`${baseUrl}${board.receipt.verificationApiPath}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: board.receipt.verificationRequestJson
    });
    expect(verifyResponse.status).toBe(200);
    expect((await verifyResponse.json()) as { skill: string; verification: { status: string } }).toMatchObject({
      skill: "buyer-evidence-board.receipt.verify",
      verification: { status: "verified" }
    });

    const boardHtmlResponse = await fetch(`${baseUrl}/buyer-evidence-board?workspace=${encodeURIComponent(workspaceParam)}`);
    expect(boardHtmlResponse.status).toBe(200);
    const boardHtml = await boardHtmlResponse.text();
    expect(boardHtml).toContain("Buyer evidence board");
    expect(boardHtml).toContain("Global revenue ops lead");
    expect(boardHtml).toContain("/api/buyer-evidence-board?workspace=lz1.");
    expect(boardHtml).toContain("/api/buyer-evidence-board/receipt/verify");
    expect(boardHtml).toContain('id="buyer-evidence-board-receipt-verify-request"');
    expect(boardHtml).toContain("Download receipt JSON");

    const boardMarkdownResponse = await fetch(`${baseUrl}/buyer-evidence-board.md?workspace=${encodeURIComponent(workspaceParam)}`);
    expect(boardMarkdownResponse.status).toBe(200);
    const boardMarkdown = await boardMarkdownResponse.text();
    expect(boardMarkdown).toContain("Global revenue ops lead");
    expect(boardMarkdown).toContain("Receipt: buyer-evidence-board-");
  });

  test("preserves verified Quick audit context across launch-room JSON and Markdown links", async () => {
    const baseUrl = `http://127.0.0.1:${port}`;
    const workspace = buildProofBackedSampleWorkspaceDraft("2026-06-23T00:00:00.000Z", "https://launch.example", {
      protopediaUrl: "https://protopedia.net/project/verified-launch-room",
      videoUrl: "https://youtu.be/verified-launch-room"
    });
    const checkedAt = new Date().toISOString();
    const workspaceParam = encodeWorkspaceShareParam(workspace);
    const params = new URLSearchParams({
      workspace: workspaceParam,
      quickPacket: "verified",
      quickAuditReceipt: "workflow-live-proof-verified-d5780cf0",
      quickAuditChecksum: "fnv1a32:d5780cf0",
      quickAuditStatus: "verified",
      quickAuditCheckedAt: checkedAt,
      quickAuditScore: "100",
      quickAuditVerified: "5/5"
    });

    const htmlResponse = await fetch(`${baseUrl}/launch-room?${params.toString()}`);
    expect(htmlResponse.status).toBe(200);
    const html = await htmlResponse.text();

    expect(html).toContain('aria-label="Verified Quick intake audit"');
    expect(html).toContain("workflow-live-proof-verified-d5780cf0");
    expect(html).toContain("quickAuditReceipt=workflow-live-proof-verified-d5780cf0");
    expect(html).toContain("quickAuditVerified=5%2F5");

    const jsonHref = html.match(/href="([^"]*\/api\/launch-room[^"]*)"/)?.[1]?.replace(/&amp;/g, "&");
    const markdownHref = html.match(/href="([^"]*\/launch-room\.md[^"]*)"/)?.[1]?.replace(/&amp;/g, "&");
    expect(jsonHref).toContain("quickAuditReceipt=workflow-live-proof-verified-d5780cf0");
    expect(markdownHref).toContain("quickAuditReceipt=workflow-live-proof-verified-d5780cf0");

    const jsonResponse = await fetch(jsonHref ?? "");
    expect(jsonResponse.status).toBe(200);
    const room = (await jsonResponse.json()) as {
      quickAuditReceipt?: { receiptId: string; checksum: string; checkedAt: string; verifiedCount: number; totalCount: number };
      proofHealth: { status: string; readiness: string; checkedAt: string; verifiedCount: number; totalCount: number };
    };

    expect(room.quickAuditReceipt).toMatchObject({
      receiptId: "workflow-live-proof-verified-d5780cf0",
      checksum: "fnv1a32:d5780cf0",
      checkedAt,
      verifiedCount: 5,
      totalCount: 5
    });
    expect(room.proofHealth).toMatchObject({
      status: "ready",
      readiness: "evidence-current",
      checkedAt,
      verifiedCount: 5,
      totalCount: 5
    });

    const markdownResponse = await fetch(markdownHref ?? "");
    expect(markdownResponse.status).toBe(200);
    const markdown = await markdownResponse.text();
    expect(markdown).toContain("## Quick intake audit receipt");
    expect(markdown).toContain("Receipt: workflow-live-proof-verified-d5780cf0");
    expect(markdown).toContain("Verified links: 5/5");
  });

  test("opens the default public manifest with proof-backed sample artifact URLs", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/buyer-trust-manifest`);
    expect(response.status).toBe(200);
    const manifest = (await response.json()) as BuyerProofManifestResponse;
    const artifactById = (id: string) => manifest.artifacts.find((artifact) => artifact.id === id);
    const deliveryMemo = artifactById("delivery-memo");
    const evidenceBoard = artifactById("buyer-evidence-board");
    const pilotContract = artifactById("buyer-pilot-contract");
    const decisionFollowUp = artifactById("decision-follow-up");

    expect(deliveryMemo?.href).toContain("/buyer-delivery-memo?");
    expect(evidenceBoard?.href).toContain("/buyer-evidence-board?workspace=lz1.");
    expect(pilotContract?.href).toContain("/buyer-pilot-contract?");
    expect(decisionFollowUp?.href).toContain("/buyer-decision-follow-up?");
    const deliveryMemoUrl = new URL(deliveryMemo?.href ?? "");
    expect(deliveryMemoUrl.searchParams.get("targetUrl")).toMatch(/^https:\/\//);
    expect(deliveryMemoUrl.searchParams.get("pilotEvidenceUrl")).toMatch(/\/sample\/pilot-run-receipt$/);
    expect(deliveryMemoUrl.searchParams.get("workOrderEvidenceUrl")).toMatch(/\/sample\/work-order-brief$/);
    expect(manifest.publicationGate.firstActionHref).toContain("?brief=");

    const htmlResponse = await fetch(`http://127.0.0.1:${port}/buyer-trust-manifest`);
    expect(htmlResponse.status).toBe(200);
    const html = await htmlResponse.text();
    expect(html).toContain("Publication gate");
    expect(html).toContain("/buyer-delivery-memo?brief=");
    expect(html).toContain("/buyer-evidence-board?workspace=lz1.");
    expect(html).toContain("/buyer-pilot-contract?brief=");
    expect(html).toContain("/buyer-decision-follow-up?brief=");
    expect(html).toContain("Verify manifest");
    expect(html).toContain("/api/buyer-trust-manifest/receipt/verify");

    const verifierResponse = await fetch(`http://127.0.0.1:${port}/buyer-proof-verifier`);
    expect(verifierResponse.status).toBe(200);
    const verifierHtml = await verifierResponse.text();
    expect(verifierHtml).toContain("Buyer Proof Verifier");
    expect(verifierHtml).toContain("data-verify-proof");
    expect(verifierHtml).toContain("/api/buyer-proof-verifier");
    expect(verifierHtml).toContain("Decision receipt");

    const decisionReceiptHtmlResponse = await fetch(`http://127.0.0.1:${port}/buyer-decision-receipt?decision=revise&reviewerName=External%20reviewer`);
    expect(decisionReceiptHtmlResponse.status).toBe(200);
    const decisionReceiptHtml = await decisionReceiptHtmlResponse.text();
    expect(decisionReceiptHtml).toContain("Buyer Decision Receipt");
    expect(decisionReceiptHtml).toContain("Verify receipt");
    expect(decisionReceiptHtml).toContain("/api/buyer-decision-receipt/verify");
  });

  test("serves sample story and walkthrough proof artifacts", async () => {
    const story = await fetch(`http://127.0.0.1:${port}/sample/protopedia-story`);
    expect(story.status).toBe(200);
    expect(await story.text()).toContain("ProtoPedia-ready story proof");

    const walkthrough = await fetch(`http://127.0.0.1:${port}/sample/walkthrough-video`);
    expect(walkthrough.status).toBe(200);
    expect(await walkthrough.text()).toContain("Sample Buyer Walkthrough");

    const storyJson = await fetch(`http://127.0.0.1:${port}/api/sample/protopedia-story`);
    expect(storyJson.status).toBe(200);
    expect((await storyJson.json()) as { title: string; proofLinks: string[] }).toMatchObject({
      title: "Buyer Pilot Contract Builder"
    });
  });

  test("preserves explicit manifest query parameters instead of replacing them with the sample", async () => {
    const params = new URLSearchParams({
      brief: "Custom buyer workflow",
      workOrder: "Custom operator handoff"
    });
    const response = await fetch(`http://127.0.0.1:${port}/api/buyer-trust-manifest?${params.toString()}`);
    expect(response.status).toBe(200);
    const manifest = (await response.json()) as BuyerProofManifestResponse;
    const deliveryMemo = manifest.artifacts.find((artifact) => artifact.id === "delivery-memo");
    const evidenceBoard = manifest.artifacts.find((artifact) => artifact.id === "buyer-evidence-board");
    const decisionFollowUp = manifest.artifacts.find((artifact) => artifact.id === "decision-follow-up");
    const deliveryMemoUrl = new URL(deliveryMemo?.href ?? "");
    const evidenceBoardUrl = new URL(evidenceBoard?.href ?? "");
    const decisionFollowUpUrl = new URL(decisionFollowUp?.href ?? "");

    expect(deliveryMemoUrl.searchParams.get("brief")).toBe("Custom buyer workflow");
    expect(deliveryMemoUrl.searchParams.get("workOrder")).toBe("Custom operator handoff");
    expect(decisionFollowUpUrl.searchParams.get("brief")).toBe("Custom buyer workflow");
    expect(decisionFollowUpUrl.searchParams.get("workOrder")).toBe("Custom operator handoff");
    expect(evidenceBoardUrl.searchParams.get("workspace")).toMatch(/^lz1\./);
    expect(evidenceBoardUrl.searchParams.has("brief")).toBe(false);
    const evidenceWorkspace = decodeWorkspaceShareParam(evidenceBoardUrl.searchParams.get("workspace"));
    expect(evidenceWorkspace.projectBrief).toBe("Custom buyer workflow");
    expect(evidenceWorkspace.buyerWorkOrder.request).toBe("Custom operator handoff");
    expect(deliveryMemoUrl.searchParams.has("targetUrl")).toBe(false);
    expect(deliveryMemoUrl.searchParams.has("pilotEvidenceUrl")).toBe(false);
    expect(deliveryMemoUrl.searchParams.has("workOrderEvidenceUrl")).toBe(false);

    const boardApiUrl = new URL(`http://127.0.0.1:${port}/api/buyer-evidence-board`);
    boardApiUrl.searchParams.set("workspace", evidenceBoardUrl.searchParams.get("workspace") ?? "");
    const boardResponse = await fetch(boardApiUrl);
    expect(boardResponse.status).toBe(200);
    const board = (await boardResponse.json()) as { memoMarkdown: string };
    expect(board.memoMarkdown).toContain("Custom buyer workflow");
  });
});
