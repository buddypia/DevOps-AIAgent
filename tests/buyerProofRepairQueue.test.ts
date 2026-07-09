import { describe, expect, test } from "vitest";
import {
  applyBuyerProofRepairPatchToWorkspace,
  buildBuyerProofRepairProjection,
  buildBuyerProofRepairQueue,
  hasBuyerProofRepairPatch,
  mergeBuyerProofRepairPatches
} from "../src/buyerProofRepairQueue";
import { buildProofBackedSampleWorkspaceDraft } from "../src/sampleWorkspace";
import { defaultWorkspaceDraft } from "../src/workspaceDraft";

describe("buyer proof repair queue", () => {
  const submissionProof = {
    protopediaUrl: "https://protopedia.net/prototype/release-ready",
    videoUrl: "https://youtu.be/releaseReady12345"
  };

  test("turns an empty workspace into actionable proof repairs", () => {
    const now = "2026-06-23T00:00:00.000Z";
    const current = defaultWorkspaceDraft(now);
    const sample = buildProofBackedSampleWorkspaceDraft(now, "https://sample.example", submissionProof);
    const queue = buildBuyerProofRepairQueue({ current, sample });

    expect(queue.status).toBe("blocked");
    expect(queue.readyCount).toBe(0);
    expect(queue.blockedCount).toBe(6);
    expect(queue.recoverableDecisionLift).toBe(106);
    expect(queue.highestImpactItem).toMatchObject({
      id: "measured-run",
      label: "Measured pilot receipt",
      decisionLift: 25
    });
    expect(queue.firstAction).toBe("Attach one observed run, named reviewer, acceptance count, and receipt URL.");
    expect(queue.exportMarkdown).toContain("Buyer proof repair queue");
    expect(queue.exportMarkdown).toContain("Recoverable decision lift: 106");
    expect(queue.exportMarkdown).toContain("+25 Measured pilot receipt");
    expect(queue.exportMarkdown).toContain("Gate: Measured value.");
    expect(queue.items.map((item) => item.id)).toEqual(["public-product", "work-order", "measured-run", "a2a-trial", "walkthrough", "protopedia"]);
    expect(queue.items.map((item) => [item.id, item.decisionLift, item.buyerGate])).toEqual([
      ["public-product", 24, "Public inspection"],
      ["work-order", 22, "Real workflow"],
      ["measured-run", 25, "Measured value"],
      ["a2a-trial", 20, "Agent autonomy"],
      ["walkthrough", 8, "Reviewer comprehension"],
      ["protopedia", 7, "Submission story"]
    ]);
    expect(queue.items.find((item) => item.id === "public-product")?.patch).toMatchObject({
      proofIntake: { targetUrl: "https://sample.example" }
    });
    expect(queue.items.find((item) => item.id === "work-order")?.patch).toMatchObject({
      proofIntake: { workOrderEvidenceUrl: "https://sample.example/sample/work-order-brief" }
    });
    expect(queue.items.find((item) => item.id === "measured-run")?.patch).toMatchObject({
      proofIntake: { pilotEvidenceUrl: "https://sample.example/sample/pilot-run-receipt" }
    });
    expect(queue.items.find((item) => item.id === "a2a-trial")?.patch?.agentTrialEvidence).toHaveLength(2);

    const projection = buildBuyerProofRepairProjection({ current, sample, queue });
    expect(projection).toMatchObject({
      status: "attention",
      appliedFixCount: 6,
      currentBlockedCount: 6,
      projectedBlockedCount: 0,
      currentOpenCount: 6,
      projectedOpenCount: 4,
      currentReferenceCount: 0,
      projectedReferenceCount: 4,
      closedByAvailableFixes: 2,
      decisionLiftRecovered: 45,
      remainingDecisionLift: 61,
      headline: "Available fixes create a rehearsal room, not final buyer proof"
    });
    expect(projection.summary).toContain("Applying 6 available fixes removes 6 blockers");
    expect(projection.shareInstruction).toContain("Keep the room internal");
    expect(projection.nextActionAfterApply).toBe("Replace the reference measured run with one observed buyer run and its receipt URL.");
    expect(projection.requiredReplacements.map((item) => item.id)).toEqual(["measured-run", "public-product", "work-order", "a2a-trial"]);
    expect(projection.requiredReplacements.map((item) => item.afterOwnership)).toEqual(["reference", "reference", "reference", "reference"]);
    expect(projection.requiredReplacements.map((item) => item.remainingDecisionLift)).toEqual([17, 16, 15, 13]);
    expect(projection.publicShareLock).toMatchObject({
      status: "locked",
      headline: "External sharing locked by reference proof",
      buyerOwnedCount: 2,
      totalCount: 6,
      referenceCount: 4,
      missingCount: 0,
      blockerCount: 0,
      nextTask: {
        id: "measured-run",
        label: "Measured pilot receipt",
        owner: "Pilot reviewer"
      }
    });
    expect(projection.publicShareLock.summary).toBe("2/6 proof gates are buyer-owned. 4 reference proof items and 0 missing proof items remain.");
    expect(projection.publicShareLock.instruction).toContain("Keep the room internal");
    expect(projection.publicShareLock.blockingGates.map((gate) => gate.id)).toEqual(["measured-run", "public-product", "work-order", "a2a-trial"]);
    expect(projection.publicShareLock.blockingGates[0]).toMatchObject({
      id: "measured-run",
      label: "Measured pilot receipt",
      owner: "Pilot reviewer",
      proofState: "reference",
      proofStatus: "attention",
      decisionLiftAtStake: 17,
      inputHref: "#pilot-run-receipt",
      inputLabel: "Open receipt",
      reason: "Reference proof is still attached.",
      replacementTarget: "Paste the buyer-observed pilot receipt URL, reviewer, and accepted task count."
    });
    expect(projection.workOrderPacket.workOrders.map((order) => [order.id, order.priority, order.owner, order.decisionLiftAtStake])).toEqual([
      ["measured-run", "now", "Pilot reviewer", 17],
      ["public-product", "now", "Launch owner", 16],
      ["work-order", "now", "Product owner", 15],
      ["a2a-trial", "now", "Agent operator", 13]
    ]);
    expect(projection.workOrderPacket).toMatchObject({
      filename: "buyer-proof-replacement-work-orders.md",
      csvFilename: "buyer-proof-replacement-work-orders.csv",
      nowCount: 4,
      nextCount: 0,
      firstTask: {
        id: "measured-run",
        label: "Measured pilot receipt",
        inputHref: "#pilot-run-receipt",
        inputLabel: "Open receipt"
      }
    });
    expect(projection.workOrderPacket.workOrders[0]).toMatchObject({
      proofState: "reference",
      proofStatus: "attention",
      shareGate: "Internal only: reference proof must be replaced before buyer sharing.",
      inputHref: "#pilot-run-receipt",
      inputLabel: "Open receipt",
      proofSlot: "Pilot receipt URL",
      doneSignal: "Buyer-observed run, reviewer, accepted task count, and receipt URL are attached."
    });
    expect(projection.workOrderPacket.href).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(projection.workOrderPacket.csvHref).toMatch(/^data:text\/csv;charset=utf-8,/);
    expect(projection.workOrderPacket.markdown).toContain("# Buyer-owned proof replacement work orders");
    expect(projection.workOrderPacket.markdown).toContain("Share rule: Keep the room internal");
    expect(projection.workOrderPacket.markdown).toContain("### Measured pilot receipt");
    expect(projection.workOrderPacket.markdown).toContain("Proof state: reference/attention");
    expect(projection.workOrderPacket.markdown).toContain("Share gate: Internal only: reference proof must be replaced before buyer sharing.");
    expect(projection.workOrderPacket.markdown).toContain("Input: Open receipt (#pilot-run-receipt)");
    expect(projection.workOrderPacket.markdown).toContain("Proof slot: Pilot receipt URL");
    expect(projection.workOrderPacket.markdown).toContain("Acceptance: The receipt shows time saved, named reviewer, public evidence URL, and accepted task output.");
    expect(projection.workOrderPacket.markdown).toContain("Done signal: Buyer-observed run, reviewer, accepted task count, and receipt URL are attached.");
    expect(projection.workOrderPacket.csvText).toContain("workOrderId,label,priority,owner,decisionLiftAtStake,proofState,proofStatus,shareGate,inputHref,inputLabel,proofSlot,target,action,acceptanceCriteria,doneSignal,risk");
    expect(projection.workOrderPacket.csvText).toContain(
      "measured-run,Measured pilot receipt,now,Pilot reviewer,17,reference,attention,Internal only: reference proof must be replaced before buyer sharing.,#pilot-run-receipt,Open receipt,Pilot receipt URL"
    );
    expect(projection.operatorBrief).toMatchObject({
      status: "locked",
      headline: "Operator brief: Measured pilot receipt is the first no-send task",
      firstOwner: "Pilot reviewer",
      firstAction: "Paste the buyer-observed pilot receipt URL, reviewer, and accepted task count.",
      firstInputHref: "#pilot-run-receipt",
      firstInputLabel: "Open receipt",
      filename: "buyer-proof-operator-brief.md"
    });
    expect(projection.operatorBrief.shareRule).toContain("Keep the room internal");
    expect(projection.operatorBrief.shareRule).toContain("61 decision-lift points remain at stake.");
    expect(projection.operatorBrief.acceptanceChecklist).toContain("Run live verification after the proof slot is replaced.");
    expect(projection.operatorBrief.topTasks.map((task) => [task.id, task.priority, task.owner])).toEqual([
      ["measured-run", "now", "Pilot reviewer"],
      ["public-product", "now", "Launch owner"],
      ["work-order", "now", "Product owner"]
    ]);
    expect(projection.operatorBrief.message).toContain("Pilot reviewer: Measured pilot receipt is first.");
    expect(projection.operatorBrief.message).toContain("Share rule:");
    expect(projection.operatorBrief.href).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(projection.operatorBrief.markdown).toContain("# Buyer proof operator brief");
    expect(projection.operatorBrief.markdown).toContain("Owner: Pilot reviewer");
    expect(projection.operatorBrief.markdown).toContain("Input: Open receipt (#pilot-run-receipt)");
    expect(projection.operatorBrief.markdown).toContain("## Acceptance checklist");
    expect(projection.operatorBrief.markdown).toContain("## Share message");
    expect(projection.requiredReplacements.find((item) => item.id === "public-product")).toMatchObject({
      afterStatus: "attention",
      actionAfterApply: "Replace the reference URL with the deployed product URL you control before external review.",
      replacementTarget: "Paste the deployed product URL into Live product.",
      acceptanceCriteria: "A clean browser can open the HTTPS product URL, and it is not a reference or sample path.",
      remainingRisk: expect.stringContaining("Reference proof can mislead the buyer")
    });
    expect(projection.requiredReplacements.find((item) => item.id === "measured-run")).toMatchObject({
      replacementTarget: "Paste the buyer-observed pilot receipt URL, reviewer, and accepted task count.",
      acceptanceCriteria: "The receipt shows time saved, named reviewer, public evidence URL, and accepted task output."
    });
    expect(projection.items.find((item) => item.id === "measured-run")).toMatchObject({
      beforeStatus: "blocked",
      afterStatus: "attention",
      beforeOwnership: "missing",
      afterOwnership: "reference",
      decisionLiftRecovered: 8
    });
  });

  test("does not pretend missing external submission URLs can be auto-repaired", () => {
    const now = "2026-06-23T00:00:00.000Z";
    const current = defaultWorkspaceDraft(now);
    const starter = buildProofBackedSampleWorkspaceDraft(now, "https://sample.example");
    const queue = buildBuyerProofRepairQueue({ current, sample: starter });

    expect(queue.status).toBe("blocked");
    expect(queue.items.find((item) => item.id === "walkthrough")).toMatchObject({
      status: "attention",
      buttonLabel: "Add your video",
      patch: undefined
    });
    expect(queue.items.find((item) => item.id === "protopedia")).toMatchObject({
      status: "attention",
      buttonLabel: "Add story URL",
      patch: undefined
    });

    const merged = mergeBuyerProofRepairPatches(queue.items);
    expect(merged.proofIntake).toMatchObject({
      targetUrl: "https://sample.example",
      pilotEvidenceUrl: "https://sample.example/sample/pilot-run-receipt",
      workOrderEvidenceUrl: "https://sample.example/sample/work-order-brief"
    });
    expect(merged.proofIntake).not.toHaveProperty("videoUrl");
    expect(merged.proofIntake).not.toHaveProperty("protopediaUrl");
    expect(merged.agentTrialEvidence).toHaveLength(2);
    expect(hasBuyerProofRepairPatch(merged)).toBe(true);

    const projection = buildBuyerProofRepairProjection({ current, sample: starter, queue });
    expect(projection).toMatchObject({
      status: "attention",
      appliedFixCount: 4,
      currentBlockedCount: 4,
      projectedBlockedCount: 0,
      currentOpenCount: 6,
      projectedOpenCount: 6,
      projectedReferenceCount: 4,
      closedByAvailableFixes: 0,
      decisionLiftRecovered: 30,
      remainingDecisionLift: 69
    });
    expect(projection.summary).toContain("Applying 4 available fixes removes 4 blockers");
    expect(projection.shareInstruction).toContain("reference item");
    expect(projection.requiredReplacements.map((item) => item.id)).toEqual(["measured-run", "public-product", "work-order", "a2a-trial", "walkthrough", "protopedia"]);
    expect(projection.publicShareLock).toMatchObject({
      status: "locked",
      headline: "External sharing locked by reference proof",
      buyerOwnedCount: 0,
      totalCount: 6,
      referenceCount: 4,
      missingCount: 2,
      blockerCount: 0
    });
    expect(projection.publicShareLock.summary).toBe("0/6 proof gates are buyer-owned. 4 reference proof items and 2 missing proof items remain.");
    expect(projection.publicShareLock.blockingGates.map((gate) => gate.id)).toEqual(["measured-run", "public-product", "work-order", "a2a-trial", "walkthrough", "protopedia"]);
    expect(projection.publicShareLock.blockingGates.find((gate) => gate.id === "walkthrough")).toMatchObject({
      proofState: "missing",
      proofStatus: "attention",
      inputHref: "#launch-evidence-console",
      inputLabel: "Open video URL",
      reason: "Buyer-owned proof is missing.",
      replacementTarget: "Paste a public or unlisted walkthrough URL."
    });
    expect(projection.publicShareLock.blockingGates.find((gate) => gate.id === "protopedia")).toMatchObject({
      proofState: "missing",
      inputHref: "#launch-evidence-console",
      inputLabel: "Open story URL",
      replacementTarget: "Paste the published ProtoPedia story URL."
    });
    expect(projection.workOrderPacket.workOrders.map((order) => [order.id, order.priority])).toEqual([
      ["measured-run", "now"],
      ["public-product", "now"],
      ["work-order", "now"],
      ["a2a-trial", "now"],
      ["walkthrough", "next"],
      ["protopedia", "next"]
    ]);
    expect(projection.workOrderPacket).toMatchObject({
      nowCount: 4,
      nextCount: 2
    });
    expect(projection.workOrderPacket.workOrders.find((order) => order.id === "walkthrough")).toMatchObject({
      proofState: "missing",
      proofStatus: "attention",
      shareGate: "No-send: attach buyer-owned evidence before external review.",
      inputHref: "#launch-evidence-console",
      inputLabel: "Open video URL",
      proofSlot: "Walkthrough video URL"
    });
    expect(projection.operatorBrief).toMatchObject({
      status: "locked",
      firstOwner: "Pilot reviewer",
      firstInputHref: "#pilot-run-receipt",
      firstInputLabel: "Open receipt"
    });
    expect(projection.operatorBrief.shareRule).toContain("69 decision-lift points remain at stake.");
    expect(projection.operatorBrief.topTasks).toHaveLength(3);
    expect(projection.workOrderPacket.csvText).toContain(
      "walkthrough,Walkthrough video,next,Story owner,4,missing,attention,No-send: attach buyer-owned evidence before external review.,#launch-evidence-console,Open video URL,Walkthrough video URL"
    );
    expect(projection.requiredReplacements.find((item) => item.id === "walkthrough")).toMatchObject({
      afterStatus: "attention",
      afterOwnership: "missing",
      remainingDecisionLift: 4,
      actionAfterApply: "Attach a public or unlisted walkthrough URL.",
      replacementTarget: "Paste a public or unlisted walkthrough URL.",
      acceptanceCriteria: "The video shows the buyer workflow from request to proof without private explanation."
    });
  });

  test("keeps starter proof open as reference proof instead of closing it", () => {
    const now = "2026-06-23T00:00:00.000Z";
    const sample = buildProofBackedSampleWorkspaceDraft(now, "https://sample.example", submissionProof);
    const queue = buildBuyerProofRepairQueue({ current: sample, sample });

    expect(queue.status).toBe("attention");
    expect(queue.readyCount).toBe(2);
    expect(queue.referenceCount).toBe(4);
    expect(queue.openCount).toBe(4);
    expect(queue.blockedCount).toBe(0);
    expect(queue.recoverableDecisionLift).toBe(61);
    expect(queue.highestImpactItem).toMatchObject({
      id: "measured-run",
      label: "Measured pilot receipt",
      decisionLift: 17
    });
    expect(queue.firstAction).toBe("Replace the reference measured run with one observed buyer run and its receipt URL.");
    expect(queue.items.every((item) => item.patch === undefined)).toBe(true);
    expect(queue.summary).toContain("4 reference proof items need buyer-owned replacement");
    expect(queue.summary).toContain("61 decision-lift points are recoverable");
    expect(queue.items.filter((item) => item.ownership === "reference").map((item) => item.id)).toEqual([
      "public-product",
      "work-order",
      "measured-run",
      "a2a-trial"
    ]);
    expect(queue.items.find((item) => item.id === "walkthrough")).toMatchObject({
      status: "ready",
      ownership: "buyer-owned"
    });
    expect(queue.items.find((item) => item.id === "protopedia")).toMatchObject({
      status: "ready",
      ownership: "buyer-owned"
    });
  });

  test("reports buyer-owned proof as closed when it differs from the starter reference", () => {
    const now = "2026-06-23T00:00:00.000Z";
    const sample = buildProofBackedSampleWorkspaceDraft(now, "https://sample.example", submissionProof);
    const current = buildProofBackedSampleWorkspaceDraft(now, "https://buyer.example", submissionProof);
    current.agentTrialEvidence = current.agentTrialEvidence.map((record) => ({
      ...record,
      id: record.id.replace("sample-", "buyer-"),
      evidenceSource: record.evidenceSource.replace("Sample", "Buyer")
    }));
    const queue = buildBuyerProofRepairQueue({ current, sample });

    expect(queue.status).toBe("ready");
    expect(queue.readyCount).toBe(queue.totalCount);
    expect(queue.openCount).toBe(0);
    expect(queue.referenceCount).toBe(0);
    expect(queue.recoverableDecisionLift).toBe(0);
    expect(queue.highestImpactItem).toBeNull();
    expect(queue.items.every((item) => item.ownership === "buyer-owned")).toBe(true);
    expect(queue.items.every((item) => item.decisionLift === 0)).toBe(true);
    expect(queue.items.every((item) => item.patch === undefined)).toBe(true);
    expect(queue.summary).toContain("product, work-order, measured-run, A2A, walkthrough, and submission proof");

    const projection = buildBuyerProofRepairProjection({ current, sample, queue });
    expect(projection).toMatchObject({
      status: "ready",
      headline: "No automatic proof repair is needed",
      appliedFixCount: 0,
      decisionLiftRecovered: 0,
      remainingDecisionLift: 0,
      projectedOpenCount: 0,
      projectedReferenceCount: 0
    });
    expect(projection.publicShareLock).toMatchObject({
      status: "ready",
      headline: "Buyer-owned proof cleared for external sharing",
      buyerOwnedCount: 6,
      totalCount: 6,
      referenceCount: 0,
      missingCount: 0,
      blockerCount: 0,
      nextTask: null
    });
    expect(projection.publicShareLock.summary).toBe("6/6 proof gates are buyer-owned. No reference or missing proof remains in the projected workspace.");
    expect(projection.publicShareLock.blockingGates).toHaveLength(0);
    expect(projection.requiredReplacements).toHaveLength(0);
    expect(projection.workOrderPacket.workOrders).toHaveLength(0);
    expect(projection.workOrderPacket.nowCount).toBe(0);
    expect(projection.workOrderPacket.nextCount).toBe(0);
    expect(projection.workOrderPacket.firstTask).toBeNull();
    expect(projection.workOrderPacket.markdown).toContain("No replacement work orders remain.");
    expect(projection.operatorBrief).toMatchObject({
      status: "send-ready",
      headline: "Operator brief: final verification can start",
      firstOwner: "Launch owner",
      firstInputHref: "#buyer-share-gate",
      firstInputLabel: "Open share gate",
      shareRule: "Run live verification once more, then the buyer room can move to external review."
    });
    expect(projection.operatorBrief.acceptanceChecklist).toEqual([
      "Run live verification once more.",
      "Confirm every proof gate is buyer-owned.",
      "Attach the current manifest digest before sharing."
    ]);
    expect(projection.operatorBrief.topTasks).toHaveLength(0);
    expect(projection.operatorBrief.markdown).toContain("No open operator tasks remain.");
  });

  test("applies available repair patches without mutating the current workspace", () => {
    const now = "2026-06-23T00:00:00.000Z";
    const current = defaultWorkspaceDraft(now);
    const sample = buildProofBackedSampleWorkspaceDraft(now, "https://sample.example", submissionProof);
    const queue = buildBuyerProofRepairQueue({ current, sample });
    const patch = mergeBuyerProofRepairPatches(queue.items);
    const projected = applyBuyerProofRepairPatchToWorkspace(current, patch);

    expect(current.targetUrl).toBe("");
    expect(current.agentTrialEvidence).toHaveLength(0);
    expect(projected.targetUrl).toBe("https://sample.example");
    expect(projected.buyerWorkOrder.evidenceUrl).toBe("https://sample.example/sample/work-order-brief");
    expect(projected.pilotRun.evidenceUrl).toBe("https://sample.example/sample/pilot-run-receipt");
    expect(projected.videoUrl).toBe(submissionProof.videoUrl);
    expect(projected.protopediaUrl).toBe(submissionProof.protopediaUrl);
    expect(projected.agentTrialEvidence).toHaveLength(2);
    expect(projected.proofVerification).toBeNull();
  });
});
