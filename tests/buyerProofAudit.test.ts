import { describe, expect, test } from "vitest";
import { buildBuyerProofAudit, buyerWorkspaceProofAuditLinks, renderBuyerProofAuditHtml, runBuyerProofAudit, sampleBuyerProofAuditLinks } from "../server/buyerProofAudit";
import type { PublicProofLinkVerificationSummary } from "../server/proofLinkVerifier";

const PUBLIC_RECORDS = [{ address: "93.184.216.34" }];

describe("buyer proof audit", () => {
  test("builds sample proof links for the public buyer artifacts", () => {
    const links = sampleBuyerProofAuditLinks("https://proof.opsbridge.ai/");

    expect(links).toHaveLength(7);
    expect(links.map((link) => link.id)).toEqual([
      "product-surface",
      "healthz",
      "agent-card",
      "buyer-brief",
      "work-order",
      "pilot-receipt",
      "procurement-decision"
    ]);
    expect(links.every((link) => link.critical)).toBe(true);
    expect(links.find((link) => link.id === "procurement-decision")?.value).toBe("https://proof.opsbridge.ai/sample/procurement-decision");
  });

  test("builds current workspace proof links without falling back to sample artifacts", () => {
    const links = buyerWorkspaceProofAuditLinks({
      targetUrl: "https://launch.opsbridge.ai",
      protopediaUrl: "https://protopedia.net/prototype/current",
      videoUrl: "https://youtu.be/current",
      pilotEvidenceUrl: "https://proof.opsbridge.ai/pilot",
      workOrderEvidenceUrl: "https://proof.opsbridge.ai/work-order",
      appUrl: "https://app.opsbridge.ai"
    });

    expect(links.map((link) => link.id)).toEqual(["targetUrl", "protopediaUrl", "videoUrl", "pilotEvidenceUrl", "workOrderEvidenceUrl"]);
    expect(links.every((link) => link.critical)).toBe(true);
    expect(links.map((link) => link.value).join(" ")).not.toContain("/sample/");
    expect(links.find((link) => link.id === "pilotEvidenceUrl")?.category).toBe("pilot-proof");
  });

  test("uses app repair anchors for missing workspace proof links", () => {
    const links = buyerWorkspaceProofAuditLinks({
      targetUrl: "",
      protopediaUrl: "",
      videoUrl: "",
      pilotEvidenceUrl: "",
      workOrderEvidenceUrl: "",
      appUrl: "https://app.opsbridge.ai"
    });

    expect(links.find((link) => link.id === "targetUrl")?.href).toBe("https://app.opsbridge.ai#launch-evidence-console");
    expect(links.find((link) => link.id === "pilotEvidenceUrl")?.href).toBe("https://app.opsbridge.ai#pilot-run-receipt");
    expect(links.find((link) => link.id === "workOrderEvidenceUrl")?.href).toBe("https://app.opsbridge.ai#buyer-work-order-studio");
  });

  test("turns live proof verification into a ready buyer audit", () => {
    const specs = sampleBuyerProofAuditLinks("https://proof.opsbridge.ai");
    const summary: PublicProofLinkVerificationSummary = {
      checkedAt: "2026-06-20T00:00:00.000Z",
      verifiedCount: specs.length,
      totalCount: specs.length,
      score: 100,
      results: specs.map((spec) => ({
        id: spec.id,
        label: spec.label,
        url: spec.value,
        status: "pass",
        httpStatus: 200,
        finalUrl: spec.value,
        contentType: "text/html",
        evidence: "Public URL responded with HTTP 200.",
        action: "Keep this link attached to the launch room."
      }))
    };

    const audit = buildBuyerProofAudit(specs, summary);

    expect(audit.verdict).toBe("ready-to-share");
    expect(audit.score).toBe(100);
    expect(audit.criticalPassed).toBe(7);
    expect(audit.actions).toEqual([]);
    expect(audit.repairQueue).toEqual([]);
    expect(audit.exportMarkdown).toContain("# Public proof is live enough to share");
    expect(audit.exportMarkdown).toContain("Procurement decision");
    expect(audit.exportMarkdown).toContain("No repair queue open");
  });

  test("surfaces blocked critical proof as repair actions", () => {
    const specs = sampleBuyerProofAuditLinks("https://proof.opsbridge.ai");
    const summary: PublicProofLinkVerificationSummary = {
      checkedAt: "2026-06-20T00:00:00.000Z",
      verifiedCount: specs.length - 2,
      totalCount: specs.length,
      score: 72,
      results: specs.map((spec) => ({
        id: spec.id,
        label: spec.label,
        url: spec.value,
        status: spec.id === "agent-card" || spec.id === "pilot-receipt" ? "block" : "pass",
        httpStatus: spec.id === "agent-card" || spec.id === "pilot-receipt" ? 403 : 200,
        finalUrl: spec.value,
        evidence: spec.id === "agent-card" || spec.id === "pilot-receipt" ? "Public URL responded with HTTP 403." : "Public URL responded with HTTP 200.",
        action: spec.id === "agent-card" || spec.id === "pilot-receipt" ? "Make the artifact publicly readable." : "Keep this link attached."
      }))
    };

    const audit = buildBuyerProofAudit(specs, summary);

    expect(audit.verdict).toBe("blocked");
    expect(audit.blockCount).toBe(2);
    expect(audit.criticalPassed).toBe(5);
    expect(audit.actions.map((action) => action.label)).toEqual(["Repair Agent Card", "Repair Pilot receipt"]);
    expect(audit.repairQueue.map((item) => [item.priority, item.owner, item.label, item.severity])).toEqual([
      [1, "Platform owner", "Agent Card", "blocking"],
      [2, "Pilot owner", "Pilot receipt", "blocking"]
    ]);
    expect(audit.repairQueue[0]?.reviewerImpact).toContain("critical proof chain");
    expect(audit.repairQueue[0]?.recheck).toContain("returns pass");
    expect(audit.exportMarkdown).toContain("## Repair queue");
    expect(audit.exportMarkdown).toContain("Platform owner: Agent Card");

    const html = renderBuyerProofAuditHtml(audit, {
      jsonUrl: "https://proof.opsbridge.ai/api/sample/buyer-proof-audit",
      markdownUrl: "https://proof.opsbridge.ai/sample/buyer-proof-audit.md",
      appUrl: "https://proof.opsbridge.ai"
    });

    expect(html).toContain("Repair queue");
    expect(html).toContain("Rerun JSON audit");
    expect(html).toContain("External reviewers cannot complete the critical proof chain");
  });

  test("runs the verifier and renders an escaped public audit page", async () => {
    const specs = [
      {
        id: "product-surface",
        label: "<script>alert(1)</script>",
        value: "https://proof.opsbridge.ai",
        href: "https://proof.opsbridge.ai",
        category: "product" as const,
        critical: true
      }
    ];
    const audit = await runBuyerProofAudit(specs, {
      now: new Date("2026-06-20T00:00:00.000Z"),
      resolveHost: async () => PUBLIC_RECORDS,
      fetchImpl: async () => new Response("", { status: 200, headers: { "content-type": "text/html" } })
    });
    const html = renderBuyerProofAuditHtml(audit, {
      jsonUrl: "https://proof.opsbridge.ai/api/sample/buyer-proof-audit",
      markdownUrl: "https://proof.opsbridge.ai/sample/buyer-proof-audit.md",
      manifestUrl: "https://proof.opsbridge.ai/buyer-trust-manifest",
      appUrl: "https://proof.opsbridge.ai"
    });

    expect(audit.verdict).toBe("ready-to-share");
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Buyer Proof Audit");
    expect(html).toContain("Critical proof");
    expect(html).toContain("JSON");
    expect(html).toContain("Markdown");
    expect(html).toContain("Trust manifest");
    expect(html).toContain("Repair queue");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
