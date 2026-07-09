import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BadgeCheck, ClipboardCheck, Crosshair, Download, ExternalLink, FileText, Gauge, Route, Send, ShieldCheck, Workflow } from "lucide-react";
import type { HomepageValueLensSnapshot } from "./HomepageValueLens";
import type {
  HomepageOutcomeArtifactAction,
  HomepageOutcomeArtifactSnapshot,
  HomepageOutcomeArtifactStatus,
  HomepageProofEntryAction,
  HomepageProofEntrySnapshot,
  HomepagePublishabilitySnapshot,
  HomepageReviewerHandoffKitSnapshot
} from "./App";
import { downloadJsonFile, downloadTextFile } from "./downloadArtifact";
import {
  buildHomepageOutcomeSpineReceipt,
  type HomepageOutcomeSpineReceipt,
  type HomepageOutcomeSpineReceiptPayload
} from "./homepageOutcomeSpineReceipt";
import HomepageOperatorNextMovePanel from "./HomepageOperatorNextMovePanel";
import HomepagePublicTrustScanPanel from "./HomepagePublicTrustScanPanel";
import HomepageLaunchIntegrityPanel from "./HomepageLaunchIntegrityPanel";
import type { HomepageLaunchIntegrityProofRepairProps } from "./HomepageLaunchIntegrityPanel";
import type { WorkspaceDraft } from "./workspaceDraft";
import "./HomepageOutcomeSpinePanel.css";

type HomepageOutcomeSpineStatus = HomepageOutcomeArtifactStatus;

type HomepageOutcomeSpineAction = HomepageOutcomeArtifactAction | HomepageProofEntryAction;

type HomepageOutcomeSpineStep = {
  id: "workflow" | "value" | "proof" | "packet" | "decision";
  label: string;
  status: HomepageOutcomeSpineStatus;
  title: string;
  evidence: string;
  href: string;
  actionLabel: string;
};

type HomepageLaunchIntegrityProps = {
  workspace: WorkspaceDraft;
  auditHref: string;
  memoHref: string;
  manifestHref: string;
  roomHref: string;
  gateHref: string;
  workflowHref?: string;
  r?: HomepageLaunchIntegrityProofRepairProps;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function routeActionAttrs(action: Pick<HomepageOutcomeSpineAction, "external">) {
  return action.external ? { target: "_blank", rel: "noreferrer" } : {};
}

function statusIcon(status: HomepageOutcomeSpineStatus) {
  if (status === "ready") return <BadgeCheck size={15} />;
  if (status === "attention") return <Gauge size={15} />;
  return <AlertTriangle size={15} />;
}

function stepIcon(id: HomepageOutcomeSpineStep["id"]) {
  if (id === "workflow") return <Workflow size={15} />;
  if (id === "value") return <FileText size={15} />;
  if (id === "proof") return <ShieldCheck size={15} />;
  if (id === "packet") return <ClipboardCheck size={15} />;
  return <Send size={15} />;
}

function overallStatus(statuses: HomepageOutcomeSpineStatus[]): HomepageOutcomeSpineStatus {
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("attention")) return "attention";
  return "ready";
}

function statusLabel(status: HomepageOutcomeSpineStatus) {
  if (status === "ready") return "sendable route";
  if (status === "attention") return "review route";
  return "hold route";
}

function buildSpineSteps({
  buyer,
  valueLens,
  proofEntry,
  outcomeArtifact,
  reviewerHandoffKit
}: {
  buyer: string;
  valueLens: HomepageValueLensSnapshot;
  proofEntry: HomepageProofEntrySnapshot;
  outcomeArtifact: HomepageOutcomeArtifactSnapshot;
  reviewerHandoffKit: HomepageReviewerHandoffKitSnapshot;
}): HomepageOutcomeSpineStep[] {
  const valueMetric = valueLens.metrics.find((metric) => metric.id === "modeled-value") ?? valueLens.metrics[0];

  return [
    {
      id: "workflow",
      label: "Workflow",
      status: valueLens.status,
      title: valueLens.workflowAction.label,
      evidence: `${buyer} starts from one workflow and a bounded value assumption.`,
      href: valueLens.workflowAction.href,
      actionLabel: valueLens.workflowAction.label
    },
    {
      id: "value",
      label: "Value",
      status: valueLens.status,
      title: valueMetric?.value ?? valueLens.headline,
      evidence: valueLens.readinessCoach.buyerAsk,
      href: valueLens.primaryAction.href,
      actionLabel: valueLens.primaryAction.label
    },
    {
      id: "proof",
      label: "Proof",
      status: proofEntry.nextMove.status,
      title: `${proofEntry.readyCount}/${proofEntry.items.length} proof rails ready`,
      evidence: proofEntry.nextMove.buyerImpact,
      href: proofEntry.nextMove.action.href,
      actionLabel: proofEntry.nextMove.action.label
    },
    {
      id: "packet",
      label: "Packet",
      status: outcomeArtifact.packet.status,
      title: `${outcomeArtifact.packet.readyCount}/${outcomeArtifact.packet.itemCount} packet artifacts ready`,
      evidence: outcomeArtifact.packet.summary,
      href: outcomeArtifact.primaryAction.href,
      actionLabel: outcomeArtifact.primaryAction.label
    },
    {
      id: "decision",
      label: "Decision",
      status: reviewerHandoffKit.status,
      title: reviewerHandoffKit.reviewQuestion,
      evidence: reviewerHandoffKit.sendRule,
      href: reviewerHandoffKit.primaryAction.href,
      actionLabel: reviewerHandoffKit.primaryAction.label
    }
  ];
}

function buildOutcomeSpineMarkdown({
  valueLens,
  proofEntry,
  outcomeArtifact,
  publishability,
  reviewerHandoffKit,
  status,
  steps,
  receipt
}: {
  valueLens: HomepageValueLensSnapshot;
  proofEntry: HomepageProofEntrySnapshot;
  outcomeArtifact: HomepageOutcomeArtifactSnapshot;
  publishability: HomepagePublishabilitySnapshot;
  reviewerHandoffKit: HomepageReviewerHandoffKitSnapshot;
  status: HomepageOutcomeSpineStatus;
  steps: HomepageOutcomeSpineStep[];
  receipt: HomepageOutcomeSpineReceipt;
}) {
  return [
    "# First buyer decision route",
    "",
    `Status: ${status}`,
    `Buyer: ${reviewerHandoffKit.buyer}`,
    `Value claim: ${valueLens.valueClaim}`,
    `Proof score: ${proofEntry.proofScore}/100`,
    `Proof rails: ${proofEntry.readyCount}/${proofEntry.items.length}`,
    `Packet artifacts: ${outcomeArtifact.packet.readyCount}/${outcomeArtifact.packet.itemCount}`,
    `Public release decision: ${publishability.decision}`,
    `Reviewer decision: ${reviewerHandoffKit.decision}`,
    `Receipt: ${receipt.receiptId}`,
    `Checksum: ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    `API verification: POST ${receipt.verificationApiPath}`,
    "",
    "## Current route",
    proofEntry.nextMove.headline,
    proofEntry.nextMove.command,
    "",
    "## Send rule",
    reviewerHandoffKit.sendRule,
    "",
    "## Steps",
    ...steps.map((step) => `- [${step.status}] ${step.label}: ${step.title}. ${step.evidence} Action: ${step.actionLabel} (${step.href})`)
  ].join("\n");
}

function buildOutcomeSpineReceiptPayload({
  buyer,
  spineStatus,
  proofEntry,
  outcomeArtifact,
  publishability,
  reviewerHandoffKit,
  steps
}: {
  buyer: string;
  spineStatus: HomepageOutcomeSpineStatus;
  proofEntry: HomepageProofEntrySnapshot;
  outcomeArtifact: HomepageOutcomeArtifactSnapshot;
  publishability: HomepagePublishabilitySnapshot;
  reviewerHandoffKit: HomepageReviewerHandoffKitSnapshot;
  steps: HomepageOutcomeSpineStep[];
}): HomepageOutcomeSpineReceiptPayload {
  return {
    receiptVersion: "homepage-outcome-spine.v1",
    source: "homepage-outcome-spine",
    buyer,
    status: spineStatus,
    proofScore: proofEntry.proofScore,
    proofReadyCount: proofEntry.readyCount,
    proofItemCount: proofEntry.items.length,
    packetReadyCount: outcomeArtifact.packet.readyCount,
    packetItemCount: outcomeArtifact.packet.itemCount,
    publishabilityDecision: publishability.decision,
    reviewerDecision: reviewerHandoffKit.decision,
    primaryAction: {
      label: reviewerHandoffKit.primaryAction.label,
      href: reviewerHandoffKit.primaryAction.href
    },
    sendRule: reviewerHandoffKit.sendRule,
    currentRoute: `${proofEntry.nextMove.headline} ${proofEntry.nextMove.command}`,
    steps
  };
}

function routeReceiptVerifierHref(receipt: HomepageOutcomeSpineReceipt) {
  const params = new URLSearchParams({
    request: receipt.verificationRequestJson,
    verify: "1"
  });
  return `/receipt-verifier?${params.toString()}`;
}

export default function HomepageOutcomeSpinePanel({
  valueLens,
  proofEntry,
  outcomeArtifact,
  publishability,
  reviewerHandoffKit,
  launchIntegrity,
  onCopyText
}: {
  valueLens: HomepageValueLensSnapshot;
  proofEntry: HomepageProofEntrySnapshot;
  outcomeArtifact: HomepageOutcomeArtifactSnapshot;
  publishability: HomepagePublishabilitySnapshot;
  reviewerHandoffKit: HomepageReviewerHandoffKitSnapshot;
  launchIntegrity: HomepageLaunchIntegrityProps;
  onCopyText: (text: string) => Promise<boolean>;
}) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const buyer = reviewerHandoffKit.buyer || outcomeArtifact.buyer || valueLens.buyer || proofEntry.buyer;
  const showProofAction =
    reviewerHandoffKit.primaryAction.label !== proofEntry.nextMove.action.label ||
    reviewerHandoffKit.primaryAction.href !== proofEntry.nextMove.action.href;
  const steps = useMemo(
    () => buildSpineSteps({ buyer, valueLens, proofEntry, outcomeArtifact, reviewerHandoffKit }),
    [buyer, outcomeArtifact, proofEntry, reviewerHandoffKit, valueLens]
  );
  const spineStatus = overallStatus([valueLens.status, proofEntry.status, outcomeArtifact.status, publishability.status, reviewerHandoffKit.status]);
  const receipt = useMemo(
    () =>
      buildHomepageOutcomeSpineReceipt(
        buildOutcomeSpineReceiptPayload({
          buyer,
          spineStatus,
          proofEntry,
          outcomeArtifact,
          publishability,
          reviewerHandoffKit,
          steps
        })
      ),
    [buyer, outcomeArtifact, proofEntry, publishability, reviewerHandoffKit, spineStatus, steps]
  );
  const receiptVerifierHref = routeReceiptVerifierHref(receipt);
  const exportMarkdown = useMemo(
    () =>
      buildOutcomeSpineMarkdown({
        valueLens,
        proofEntry,
        outcomeArtifact,
        publishability,
        reviewerHandoffKit,
        status: spineStatus,
        steps,
        receipt
      }),
    [outcomeArtifact, proofEntry, publishability, receipt, reviewerHandoffKit, spineStatus, steps, valueLens]
  );

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  async function copyRoute() {
    const copied = await onCopyText(exportMarkdown);
    setCopyStatus(copied ? "copied" : "failed");
  }

  function storeReceiptRequest() {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(`receipt-verifier-request:${receipt.receiptId}`, receipt.verificationRequestJson);
  }

  return (
    <>
      <HomepageOperatorNextMovePanel
        proofEntry={proofEntry}
        publishability={publishability}
        outcomeArtifact={outcomeArtifact}
        reviewerHandoffKit={reviewerHandoffKit}
        onCopyText={onCopyText}
      />
      <HomepagePublicTrustScanPanel
        valueLens={valueLens}
        proofEntry={proofEntry}
        outcomeArtifact={outcomeArtifact}
        publishability={publishability}
        reviewerHandoffKit={reviewerHandoffKit}
        onCopyText={onCopyText}
      />
      <HomepageLaunchIntegrityPanel
        workspace={launchIntegrity.workspace}
        workflowIntakeHref={launchIntegrity.workflowHref ?? "#quick-workflow-intake"}
        currentAuditHref={launchIntegrity.auditHref}
        deliveryMemoHref={launchIntegrity.memoHref}
        trustManifestHref={launchIntegrity.manifestHref}
        launchRoomHref={launchIntegrity.roomHref}
        productionHardeningHref={launchIntegrity.gateHref}
        onCopyText={onCopyText}
        proofRepair={launchIntegrity.r}
      />
      <section className={cx("homepage-outcome-spine", `is-${spineStatus}`)} aria-labelledby="homepage-outcome-spine-title">
      <div className="homepage-outcome-spine-main">
        <span>
          <Route size={15} />
          Workflow-to-decision route
        </span>
        <h2 id="homepage-outcome-spine-title">First buyer decision route</h2>
        <p>
          {buyer} can move from workflow intake to value proof, public proof, buyer packet, and reviewer decision without a private walkthrough.
        </p>
        <div className="homepage-outcome-spine-actions" aria-label="First buyer decision route actions">
          <a className="homepage-outcome-spine-primary" href={reviewerHandoffKit.primaryAction.href} {...routeActionAttrs(reviewerHandoffKit.primaryAction)}>
            {reviewerHandoffKit.status === "ready" ? <ExternalLink size={14} /> : <Crosshair size={14} />}
            {reviewerHandoffKit.primaryAction.label}
          </a>
          {showProofAction ? (
            <a className="homepage-outcome-spine-link" href={proofEntry.nextMove.action.href} {...routeActionAttrs(proofEntry.nextMove.action)}>
              <ShieldCheck size={14} />
              {proofEntry.nextMove.action.label}
            </a>
          ) : null}
          <button className={cx("homepage-outcome-spine-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copyRoute}>
            <ClipboardCheck size={14} />
            {copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Failed" : "Copy route"}
          </button>
          <button type="button" className="homepage-outcome-spine-link" data-download-filename="first-buyer-decision-route.md" onClick={() => downloadTextFile("first-buyer-decision-route.md", exportMarkdown)}>
            <Download size={14} />
            Export route
          </button>
        </div>
      </div>

      <aside className="homepage-outcome-spine-score" aria-label="First buyer route readiness">
        <span>
          {statusIcon(spineStatus)}
          {statusLabel(spineStatus)}
        </span>
        <strong>{proofEntry.proofScore}</strong>
        <small>
          {proofEntry.readyCount}/{proofEntry.items.length} proof rails · {outcomeArtifact.packet.readyCount}/{outcomeArtifact.packet.itemCount} packet artifacts · {publishability.decision}
        </small>
        <div className="homepage-outcome-spine-receipt" aria-label="First buyer route receipt">
          <code>{receipt.checksumAlgorithm}:{receipt.checksum}</code>
          <button type="button" data-download-filename={`${receipt.receiptId}.json`} onClick={() => downloadJsonFile(`${receipt.receiptId}.json`, receipt)}>
            <Download size={13} />
            Route receipt
          </button>
          <a href={receiptVerifierHref} onClick={storeReceiptRequest}>
            <ShieldCheck size={13} />
            Verify route
          </a>
          <small>POST {receipt.verificationApiPath}</small>
        </div>
      </aside>

      <div className="homepage-outcome-spine-brief" aria-label="Buyer route summary">
        <article>
          <span>Buyer</span>
          <strong>{buyer}</strong>
          <p>{valueLens.readinessCoach.buyerAsk}</p>
        </article>
        <article>
          <span>Current hold</span>
          <strong>{proofEntry.nextMove.headline}</strong>
          <p>{proofEntry.nextMove.owner}: {proofEntry.nextMove.command}</p>
        </article>
        <article>
          <span>Send rule</span>
          <strong>{reviewerHandoffKit.decision}</strong>
          <p>{reviewerHandoffKit.sendRule}</p>
        </article>
      </div>

      <ol className="homepage-outcome-spine-steps" aria-label="Workflow to buyer decision steps">
        {steps.map((step) => (
          <li key={step.id} className={step.status}>
            <a href={step.href}>
              <span>
                {stepIcon(step.id)}
                {step.label}
              </span>
              <strong>{step.title}</strong>
              <p>{step.evidence}</p>
              <small>{step.actionLabel}</small>
            </a>
          </li>
        ))}
      </ol>
      </section>
    </>
  );
}
