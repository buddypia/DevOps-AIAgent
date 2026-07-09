import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import HeroWorkflowIntakeConsole, { buildHeroWorkflowAppliedHandoff, buildHeroWorkflowApplyPreview, buildHeroWorkflowIntakeSnapshot } from "../src/HeroWorkflowIntakeConsole";
import { WORKFLOW_INTAKE_STARTERS } from "../src/workflowIntakePreview";

describe("HeroWorkflowIntakeConsole", () => {
  test("keeps the first-screen starter honest until real public proof is attached", () => {
    expect(WORKFLOW_INTAKE_STARTERS.map((starter) => starter.note).join("\n")).not.toContain("proof.example.com");
    const snapshot = buildHeroWorkflowIntakeSnapshot(WORKFLOW_INTAKE_STARTERS[0].note);

    expect(snapshot.readiness).toMatchObject({
      decision: "needs-proof",
      score: 93,
      headline: "Useful workflow, proof still needs closure"
    });
    expect(snapshot.sourceLine).toBe("7/9 source facts traced");
    expect(snapshot.nextRepair).toBe("Attach public HTTPS proof links reviewers can open.");
    expect(snapshot.draft.detectedSignals).toEqual(
      expect.arrayContaining(["workflow request", "target buyer", "success metric", "baseline", "ROI assumptions", "measured minutes", "accepted tasks"])
    );
    expect(snapshot.draft.detectedSignals).not.toContain("public evidence URL");
    expect(snapshot.focusRows.map((row) => row.id)).toEqual(["buyer", "value", "pilot", "proof"]);
    expect(snapshot.focusRows.find((row) => row.id === "buyer")).toMatchObject({ value: "Platform release lead", status: "ready" });
    expect(snapshot.focusRows.find((row) => row.id === "pilot")).toMatchObject({ value: "480m manual, 140m assisted, 5/5 tasks accepted", status: "ready" });
    expect(snapshot.focusRows.find((row) => row.id === "proof")).toMatchObject({ value: "Missing public proof URL", status: "missing" });
    expect(snapshot.artifactChain.map((item) => item.id)).toEqual(["buyer-room", "proof-gate", "pilot-terms", "receipt-brief"]);
    expect(snapshot.artifactChain.find((item) => item.id === "buyer-room")).toMatchObject({
      status: "watch",
      value: expect.stringContaining("Platform release lead"),
      source: expect.stringContaining("Buyer: Platform release lead")
    });
    expect(snapshot.artifactChain.find((item) => item.id === "proof-gate")).toMatchObject({
      status: "blocked",
      value: "Do not send externally yet",
      source: "No public proof source line yet.",
      action: "Attach a real HTTPS proof URL before external sharing."
    });
    expect(snapshot.artifactChain.find((item) => item.id === "pilot-terms")).toMatchObject({
      status: "watch",
      value: "¥295,000/month, 21.3h saved / ¥147,000 pilot cap",
      action: "Use this cap until the buyer accepts measured value."
    });
    expect(snapshot.artifactChain.find((item) => item.id === "receipt-brief")).toMatchObject({
      status: "watch",
      value: "2 repair lines ready to paste",
      source: "7/9 source facts traced"
    });
    expect(snapshot.sendGate).toMatchObject({
      status: "blocked",
      headline: "Do not send externally yet",
      valueEstimate: {
        monthlyValueYen: 295000,
        monthlyHoursSaved: 21.3,
        pilotBudgetCeilingYen: 147000,
        valueLine: "¥295,000/month, 21.3h saved",
        budgetLine: "¥147,000 pilot cap",
        proofLine: "7/9 source facts traced"
      }
    });
    expect(snapshot.sendGate.authenticity).toMatchObject({
      status: "blocked",
      headline: "Proof authenticity needs repair",
      summary: "No public proof URL attached yet.",
      realProofUrlCount: 0,
      demoProofUrlCount: 0
    });
    expect(snapshot.sendGate.actions[0]).toMatchObject({
      label: "Public proof",
      status: "blocked",
      action: "Attach a real HTTPS proof URL before external sharing."
    });
    expect(snapshot.sendGate.actions[1]).toMatchObject({
      label: "A2A trial receipt",
      status: "blocked"
    });
    expect(snapshot.sendGate.repairLines).toEqual([
      expect.objectContaining({
        label: "Public proof",
        status: "blocked",
        line: [
          "Evidence: artifact=<https public work-order, pilot-run, or receipt URL reviewers can open>.",
          "Receipt: id=<receipt id>, verifier=<https public verifier URL or /receipt-verifier>, openedBy=<buyer reviewer role>."
        ].join("\n")
      }),
      expect.objectContaining({
        label: "A2A trial receipt",
        status: "blocked",
        line: "Accepted A2A trial receipt: agent=<agent name>, skill=<skill id>, status accepted, score <score>/100, artifact <https public receipt URL>."
      })
    ]);
    expect(snapshot.sendGate.repairText).toContain("Repair lines to complete before external sharing:");
    expect(snapshot.sendGate.exportMarkdown).toContain("Proof authenticity: No public proof URL attached yet.");
    expect(snapshot.sendGate.exportMarkdown).toContain("Next action: Attach a real HTTPS proof URL before external sharing.");
    expect(snapshot.sendGate.exportMarkdown).toContain("## Repair lines");
    expect(snapshot.decisionBrief).toMatchObject({
      status: "blocked",
      decision: "hold",
      buyerQuestion: expect.stringContaining("Should Platform release lead approve a bounded pilot"),
      answer: expect.stringContaining("No. Hold external sharing until Public proof"),
      nextAsk: "Insert the repair lines, attach real public proof, then analyze again before applying to the workspace.",
      redline: "Do not call this globally publishable or buyer-ready until public proof, measured value, and data boundary are all reviewable."
    });
    expect(snapshot.decisionBrief.evidence.map((item) => item.id)).toEqual(["scope", "value", "proof", "trust"]);
    expect(snapshot.decisionBrief.evidence.find((item) => item.id === "scope")).toMatchObject({
      status: "ready",
      answer: expect.stringContaining("Platform release lead")
    });
    expect(snapshot.decisionBrief.evidence.find((item) => item.id === "value")).toMatchObject({
      status: "ready",
      answer: "¥295,000/month, 21.3h saved; ¥147,000 pilot cap."
    });
    expect(snapshot.decisionBrief.evidence.find((item) => item.id === "proof")).toMatchObject({
      status: "blocked",
      answer: "No public proof URL attached yet.",
      source: "No public proof source line yet."
    });
    expect(snapshot.decisionBrief.exportMarkdown).toContain("# Buyer decision brief");
    expect(snapshot.decisionBrief.exportMarkdown).toContain("Decision: Hold");
    expect(snapshot.decisionBrief.exportMarkdown).toContain("Redline: Do not call this globally publishable");

    const placeholderOnly = buildHeroWorkflowIntakeSnapshot(`${WORKFLOW_INTAKE_STARTERS[0].note}\n\n${snapshot.sendGate.repairText}`);
    expect(placeholderOnly.draft.detectedSignals).not.toContain("accepted A2A trial receipt");
    expect(placeholderOnly.sendGate.status).toBe("blocked");
    expect(placeholderOnly.sendGate.authenticity.checks).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: "Placeholder source line", status: "blocked" })])
    );

    const demoProof = buildHeroWorkflowIntakeSnapshot(`${WORKFLOW_INTAKE_STARTERS[0].note}\nEvidence: https://proof.example.com/release-ready`);
    expect(demoProof.sendGate.authenticity).toMatchObject({
      status: "blocked",
      headline: "Demo proof blocks publishing",
      summary: "1 example.com proof URL must be replaced before external send.",
      realProofUrlCount: 0,
      demoProofUrlCount: 1
    });
    expect(demoProof.sendGate.actions[0]).toMatchObject({
      label: "Demo proof URL",
      status: "blocked",
      action: "Replace the example.com proof URL with a real public artifact URL reviewers can open."
    });

    const realProofAndReceipt = buildHeroWorkflowIntakeSnapshot(
      `${WORKFLOW_INTAKE_STARTERS[0].note}
Evidence: https://proof.opsbridge.ai/release-ready
Accepted A2A trial receipt: agent=Cloud Run SRE, skill=cloudrun.release-proof, status accepted, score 92/100, artifact https://proof.opsbridge.ai/a2a-trial.json`
    );
    expect(realProofAndReceipt.sourceLine).toBe("9/9 source facts traced");
    expect(realProofAndReceipt.sendGate.authenticity).toMatchObject({
      status: "ready",
      realProofUrlCount: 2,
      demoProofUrlCount: 0,
      summary: "2 real public proof URLs attached."
    });
    expect(realProofAndReceipt.sendGate).toMatchObject({
      status: "ready",
      headline: "Ready for external buyer review"
    });
    expect(realProofAndReceipt.sendGate.actions[0]).toMatchObject({
      label: "Buyer review",
      status: "ready"
    });
    expect(realProofAndReceipt.sendGate.repairLines).toEqual([]);
    expect(realProofAndReceipt.decisionBrief).toMatchObject({
      status: "ready",
      decision: "send",
      answer: expect.stringContaining("Yes. Send a bounded pilot request"),
      nextAsk: "Ask the buyer to choose continue, revise, or stop in the decision cockpit.",
      redline: "Do not claim expansion, renewal, or production rollout until the buyer accepts the measured pilot receipt."
    });
    expect(realProofAndReceipt.decisionBrief.evidence.find((item) => item.id === "proof")).toMatchObject({
      status: "ready",
      answer: "2 real public proof URLs attached."
    });
  });

  test("summarizes applied workflow proof slots instead of hiding the workspace handoff", () => {
    const missingProofSnapshot = buildHeroWorkflowIntakeSnapshot(WORKFLOW_INTAKE_STARTERS[0].note);
    const missingProof = buildHeroWorkflowAppliedHandoff(missingProofSnapshot);
    const missingProofPreview = buildHeroWorkflowApplyPreview(missingProofSnapshot);

    expect(missingProof).toMatchObject({
      status: "blocked",
      headline: "Workspace applied, proof still missing",
      readyCount: 0,
      repairCount: 0,
      missingCount: 5,
      nextAction: "Attach Deployed URL before live verification."
    });
    expect(missingProof.summary).toBe("8 workflow signals applied. 0/5 public proof slots ready; 5 proof items remain.");
    expect(missingProof.proofSlots.map((slot) => slot.id)).toEqual(["targetUrl", "protopediaUrl", "videoUrl", "pilotEvidenceUrl", "workOrderEvidenceUrl"]);
    expect(missingProof.proofSlots.find((slot) => slot.id === "targetUrl")).toMatchObject({
      label: "Deployed URL",
      status: "missing",
      value: "Missing"
    });
    expect(missingProofPreview).toMatchObject({
      status: "blocked",
      headline: "Apply creates the workspace, proof still blocks send",
      signalLine: "8 workflow signals",
      proofLine: "0/5 proof slots ready, 5 to repair",
      nextAction: "Attach Deployed URL before live verification."
    });
    expect(missingProofPreview.summary).toBe("8 extracted workflow signals will update buyer scope, value model, pilot run, and proof fields.");

    const partialProofSnapshot = buildHeroWorkflowIntakeSnapshot(`${WORKFLOW_INTAKE_STARTERS[0].note}\nEvidence: https://proof.opsbridge.ai/release-ready`);
    const partialProof = buildHeroWorkflowAppliedHandoff(partialProofSnapshot);
    const partialProofPreview = buildHeroWorkflowApplyPreview(partialProofSnapshot);
    expect(partialProof).toMatchObject({
      status: "watch",
      headline: "Workspace applied with proof repair list",
      readyCount: 1,
      repairCount: 0,
      missingCount: 4
    });
    expect(partialProof.proofSlots.find((slot) => slot.id === "workOrderEvidenceUrl")).toMatchObject({
      status: "ready",
      value: "https://proof.opsbridge.ai/release-ready"
    });
    expect(partialProofPreview).toMatchObject({
      status: "watch",
      headline: "Apply creates the workspace and repair list",
      proofLine: "1/5 proof slots ready, 4 to repair"
    });

    const completeProofSnapshot = buildHeroWorkflowIntakeSnapshot(`${WORKFLOW_INTAKE_STARTERS[0].note}
Deployed URL: https://release.opsbridge.ai
ProtoPedia: https://protopedia.net/prototype/release-ready
Walkthrough video: https://youtu.be/release-ready-demo
Pilot receipt: https://release.opsbridge.ai/pilot-receipt.json
Work order proof: https://release.opsbridge.ai/work-order.md
Accepted A2A trial receipt: agent=Cloud Run SRE, skill=cloudrun.release-proof, status accepted, score 92/100, artifact https://release.opsbridge.ai/a2a-trial.json`);
    const completeProof = buildHeroWorkflowAppliedHandoff(completeProofSnapshot);
    const completeProofPreview = buildHeroWorkflowApplyPreview(completeProofSnapshot);
    expect(completeProof).toMatchObject({
      status: "ready",
      headline: "Workspace applied with complete public proof",
      readyCount: 5,
      repairCount: 0,
      missingCount: 0,
      nextAction: "Live proof verification starts on apply; inspect results before sending the buyer room."
    });
    expect(completeProof.summary).toContain("5/5 public proof slots ready; 0 proof items remain.");
    expect(completeProofPreview).toMatchObject({
      status: "ready",
      headline: "Apply creates a buyer-ready workspace",
      proofLine: "5/5 proof slots ready for live verification"
    });
  });

  test("keeps weak notes visibly blocked before applying them to the workspace", () => {
    const snapshot = buildHeroWorkflowIntakeSnapshot("Target user: Finance ops lead\nWorkflow: reconcile month-end exceptions with restricted customer data.");

    expect(snapshot.readiness.decision).toBe("do-not-share");
    expect(snapshot.draft.warnings).toContain("Public evidence URL is still missing.");
    expect(snapshot.draft.warnings).toContain("Measured manual/assisted minutes were not both explicit.");
    expect(snapshot.focusRows.find((row) => row.id === "proof")).toMatchObject({ status: "missing" });
    expect(snapshot.focusRows.find((row) => row.id === "pilot")).toMatchObject({ status: "missing" });
    expect(snapshot.nextRepair).toBe("Describe the manual or scattered current state.");
    expect(snapshot.sendGate).toMatchObject({
      status: "blocked",
      headline: "Do not send externally yet"
    });
    expect(snapshot.sendGate.summary).toContain("External sharing waits on Data boundary.");
    expect(snapshot.sendGate.authenticity.summary).toBe("No public proof URL attached yet.");
    expect(snapshot.sendGate.actions[0]).toMatchObject({
      label: "Data boundary",
      status: "blocked",
      action: "Redact restricted inputs or keep the packet internal until a public-safe version exists."
    });
    expect(snapshot.sendGate.repairLines.map((item) => item.label)).toEqual(["Data boundary", "Public proof", "Current baseline"]);
    expect(snapshot.sendGate.repairText).toContain("Data: public-safe redacted evidence. Restricted inputs removed before external sharing.");
    expect(snapshot.sendGate.repairText).toContain("Evidence: artifact=<https public work-order, pilot-run, or receipt URL reviewers can open>.");
    expect(snapshot.sendGate.repairText).toContain("Receipt: id=<receipt id>, verifier=<https public verifier URL or /receipt-verifier>, openedBy=<buyer reviewer role>.");
    expect(snapshot.sendGate.repairText).toContain("Baseline: <manual current state, scattered systems, owner gaps, and approval delay>.");
    expect(snapshot.decisionBrief).toMatchObject({
      status: "blocked",
      decision: "hold",
      answer: expect.stringContaining("No. Hold external sharing until Data boundary")
    });
    expect(snapshot.decisionBrief.evidence.find((item) => item.id === "trust")).toMatchObject({
      status: "blocked",
      answer: "restricted data boundary selected."
    });
  });

  test("renders a first-screen workflow console with analysis and apply controls", () => {
    const source = readFileSync(new URL("../src/HeroWorkflowIntakeConsole.tsx", import.meta.url), "utf8");
    const html = renderToStaticMarkup(createElement(HeroWorkflowIntakeConsole, { onApplyDraft: () => undefined }));

    expect(html).toContain('aria-label="Live workflow intake console"');
    expect(html).toContain("Live workflow intake");
    expect(html).toContain("Useful workflow, proof still needs closure");
    expect(html).toContain("7/9 source facts traced");
    expect(html).toContain("Buyer value path");
    expect(html).toContain("Next proof task");
    expect(html).toContain("Buyer decision brief");
    expect(html).toContain("Should Platform release lead approve a bounded pilot");
    expect(html).toContain("No. Hold external sharing until Public proof is repaired and the proof can be opened by a reviewer.");
    expect(html).toContain('aria-label="Recommended buyer decision"');
    expect(html).toContain("Hold");
    expect(html).toContain("Buyer scope");
    expect(html).toContain("Value case");
    expect(html).toContain("Trust boundary");
    expect(html).toContain("Next ask");
    expect(html).toContain("Redline");
    expect(html).toContain('aria-label="Generated source-to-artifact chain"');
    expect(html).toContain("Buyer room");
    expect(html).toContain("Proof gate");
    expect(html).toContain("Pilot terms");
    expect(html).toContain("Receipt brief");
    expect(html).toContain("Apply outcome");
    expect(html).toContain("Apply creates the workspace, proof still blocks send");
    expect(html).toContain("8 extracted workflow signals will update buyer scope, value model, pilot run, and proof fields.");
    expect(html).toContain("Workspace update");
    expect(html).toContain("8 workflow signals");
    expect(html).toContain("Proof readiness");
    expect(html).toContain("0/5 proof slots ready, 5 to repair");
    expect(html).toContain("Next move");
    expect(html).toContain("2 repair lines ready to paste");
    expect(html).toContain("Inspect extraction and repair lines");
    expect(html).toContain("4 extracted facts, 2 gate actions, 2 repair lines");
    expect(html).toContain("Workflow note");
    expect(html).toContain("Analyze");
    expect(html).toContain("Apply to workspace");
    expect(html).toContain("Copy brief");
    expect(html).toContain("Insert repair lines");
    expect(html).toContain('href="#quick-workflow-intake"');
    expect(html).toContain("Platform release lead");
    expect(html).toContain("480m manual, 140m assisted, 5/5 tasks accepted");
    expect(html).toContain("Missing public proof URL");
    expect(html).toContain("External send gate");
    expect(html).toContain("Do not send externally yet");
    expect(html).toContain("¥295,000/month, 21.3h saved");
    expect(html).toContain("Proof quality");
    expect(html).toContain("No public proof URL attached yet.");
    expect(html).toContain("Public proof");
    expect(html).toContain("Paste-ready repair lines");
    expect(html).toContain("Evidence: artifact=&lt;https public work-order, pilot-run, or receipt URL reviewers can open&gt;.");
    expect(html).toContain("Receipt: id=&lt;receipt id&gt;, verifier=&lt;https public verifier URL or /receipt-verifier&gt;, openedBy=&lt;buyer reviewer role&gt;.");
    expect(html).toContain("Accepted A2A trial receipt:");
    expect(html).toContain("artifact &lt;https public receipt URL&gt;");
    // Interactive core (decision line -> note/actions) stays above the collapsed detail drawer;
    // value path / evidence / artifact chain / apply preview now live inside the "judgment + artifacts" disclosure.
    expect(html.indexOf("Buyer decision brief")).toBeLessThan(html.indexOf("Workflow note"));
    expect(html.indexOf("Workflow note")).toBeLessThan(html.indexOf("判断の根拠と成果物を表示"));
    expect(html.indexOf("判断の根拠と成果物を表示")).toBeLessThan(html.indexOf("Buyer value path"));
    expect(html.indexOf("Buyer value path")).toBeLessThan(html.indexOf("Generated source-to-artifact chain"));
    expect(html.indexOf("Generated source-to-artifact chain")).toBeLessThan(html.indexOf("Apply outcome"));
    expect(html.indexOf("Inspect extraction and repair lines")).toBeLessThan(html.indexOf("External send gate"));
    expect(html).not.toContain("proof.example.com");

    expect(source).toContain('buyerDecisionCockpitHref = "/buyer-decision-cockpit"');
    expect(source).toContain('launchEvidenceHref = "/launch-evidence"');
    expect(source).toContain('buyerEvidenceBoardHref = "/buyer-evidence-board"');
    expect(source).toContain('aria-label="Applied buyer output links"');
    expect(source).toContain("Open buyer cockpit");
    expect(source).toContain("Launch evidence");
    expect(source).toContain("Evidence board");
    expect(source).toContain("href={buyerDecisionCockpitHref}");
    expect(source).toContain("href={launchEvidenceHref}");
    expect(source).toContain("href={buyerEvidenceBoardHref}");
    expect(source.indexOf('aria-label="Applied buyer output links"')).toBeLessThan(source.indexOf('aria-label="Applied public proof slots"'));
  });

  test("keeps the phone starter carousel from exposing empty-looking clipped cards", () => {
    const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
    const mobileCarouselStart = styles.indexOf(".hero-workflow-intake-starters {\n    display: flex;");
    const mobileCarouselEnd = styles.indexOf(".hero-workflow-intake-actions a:last-child", mobileCarouselStart);
    const mobileCarouselSource = styles.slice(mobileCarouselStart, mobileCarouselEnd);

    expect(mobileCarouselStart).toBeGreaterThan(-1);
    expect(mobileCarouselEnd).toBeGreaterThan(mobileCarouselStart);
    expect(mobileCarouselSource).toContain("overflow-x: auto");
    expect(mobileCarouselSource).toContain("flex: 0 0 min(172px, 54vw)");
    expect(styles).toContain(".hero-workflow-applied-output-links");
    expect(styles).toContain(".hero-workflow-apply-preview");
    expect(styles).toContain(".hero-buyer-decision-brief");
    expect(styles).toContain(".hero-buyer-decision-evidence");
    expect(styles).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
    expect(styles).toContain(".hero-workflow-applied-output-links a:first-child");
  });
});
