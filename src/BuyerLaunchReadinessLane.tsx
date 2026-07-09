import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Download, ExternalLink, FileText, Route, ShieldCheck } from "lucide-react";
import type { BuyerEvidenceTrace, BuyerEvidenceTraceClaim, BuyerEvidenceTraceClaimId, BuyerEvidenceTraceStatus } from "./buyerEvidenceTrace";
import "./BuyerLaunchReadinessLane.css";

type BuyerLaunchReadinessStageId = "value-evidence" | "measured-run" | "public-proof" | "operating-scope" | "decision-record";

type BuyerLaunchStageDefinition = {
  id: BuyerLaunchReadinessStageId;
  label: string;
  owner: string;
  outcome: string;
  claimIds: BuyerEvidenceTraceClaimId[];
  passUnlock: string;
  watchUnlock: string;
  blockUnlock: string;
};

export type BuyerLaunchReadinessStage = {
  id: BuyerLaunchReadinessStageId;
  label: string;
  owner: string;
  outcome: string;
  status: BuyerEvidenceTraceStatus;
  score: number;
  unlock: string;
  proofLines: string[];
  nextAction: string;
  links: Array<{ label: string; href: string }>;
};

const STAGES: BuyerLaunchStageDefinition[] = [
  {
    id: "value-evidence",
    label: "Value evidence",
    owner: "Value owner",
    outcome: "The buyer can explain why the pilot matters.",
    claimIds: ["value-case"],
    passUnlock: "Use the value case in buyer-facing material.",
    watchUnlock: "Review the value case before using it externally.",
    blockUnlock: "Repair the value case before any launch claim."
  },
  {
    id: "measured-run",
    label: "Measured run",
    owner: "Pilot owner",
    outcome: "The buyer can see a measured run instead of a promise.",
    claimIds: ["measured-pilot"],
    passUnlock: "Attach the measured run to the launch room.",
    watchUnlock: "Owner-review the measured run before buyer delivery.",
    blockUnlock: "Do not claim measured value until the run is repaired."
  },
  {
    id: "public-proof",
    label: "Public proof",
    owner: "Proof owner",
    outcome: "An outside reviewer can open the evidence.",
    claimIds: ["public-proof"],
    passUnlock: "Open external review with the public trace.",
    watchUnlock: "Run reviewer verification before sharing.",
    blockUnlock: "Hold external sharing until public proof is reachable."
  },
  {
    id: "operating-scope",
    label: "Scope and controls",
    owner: "Operating owner",
    outcome: "The buyer can inspect work scope, trust controls, and stop rules.",
    claimIds: ["work-order", "operating-gates"],
    passUnlock: "Route the room to technical and procurement review.",
    watchUnlock: "Ask the operating owner to clear the warning first.",
    blockUnlock: "Do not route procurement until scope and controls are repaired."
  },
  {
    id: "decision-record",
    label: "Decision record",
    owner: "Sponsor owner",
    outcome: "The sponsor can decide continue, revise, or stop.",
    claimIds: ["buyer-decision"],
    passUnlock: "Record the sponsor decision and send the follow-up ledger.",
    watchUnlock: "Send to sponsor review with the warning named.",
    blockUnlock: "Hold the decision path until the blocker is repaired."
  }
];

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function externalAttrs(href: string) {
  return /^https?:\/\//i.test(href) ? { target: "_blank", rel: "noreferrer" } : {};
}

function statusScore(status: BuyerEvidenceTraceStatus) {
  if (status === "pass") return 100;
  if (status === "watch") return 68;
  return 18;
}

function worstStatus(claims: BuyerEvidenceTraceClaim[], missingCount: number): BuyerEvidenceTraceStatus {
  if (missingCount > 0 || claims.some((claim) => claim.status === "block")) return "block";
  if (claims.some((claim) => claim.status === "watch")) return "watch";
  return "pass";
}

function unlockFor(definition: BuyerLaunchStageDefinition, status: BuyerEvidenceTraceStatus) {
  if (status === "pass") return definition.passUnlock;
  if (status === "watch") return definition.watchUnlock;
  return definition.blockUnlock;
}

function averageScore(claims: BuyerEvidenceTraceClaim[], status: BuyerEvidenceTraceStatus) {
  if (claims.length === 0) return statusScore(status);
  return Math.round(claims.reduce((sum, claim) => sum + claim.score, 0) / claims.length);
}

function uniqueLinks(claims: BuyerEvidenceTraceClaim[]) {
  const seen = new Set<string>();
  return claims
    .flatMap((claim) => [
      { label: claim.artifact.label, href: claim.artifact.href },
      { label: claim.source.label, href: claim.source.href }
    ])
    .filter((link) => {
      const key = `${link.label}|${link.href}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5);
}

export function buildBuyerLaunchReadinessLane(trace: BuyerEvidenceTrace): BuyerLaunchReadinessStage[] {
  const claimById = new Map(trace.claims.map((claim) => [claim.id, claim]));

  return STAGES.map((definition) => {
    const claims = definition.claimIds.map((id) => claimById.get(id)).filter((claim): claim is BuyerEvidenceTraceClaim => Boolean(claim));
    const missingCount = definition.claimIds.length - claims.length;
    const status = worstStatus(claims, missingCount);
    const firstOpenClaim = claims.find((claim) => claim.status !== "pass");

    return {
      id: definition.id,
      label: definition.label,
      owner: definition.owner,
      outcome: definition.outcome,
      status,
      score: averageScore(claims, status),
      unlock: unlockFor(definition, status),
      proofLines:
        claims.length > 0
          ? claims.map((claim) => `${claim.label}: ${claim.verification}`)
          : ["Required launch evidence is missing from the trace."],
      nextAction: firstOpenClaim?.nextAction ?? (missingCount > 0 ? "Attach the missing launch evidence." : definition.passUnlock),
      links: uniqueLinks(claims)
    };
  });
}

function buildSingleStageMarkdown(stage: BuyerLaunchReadinessStage, trace: BuyerEvidenceTrace, evidenceTraceHref: string) {
  return [
    `# ${stage.label} launch readiness`,
    "",
    `Trace readiness: ${trace.readiness}`,
    `Stage status: ${stage.status}`,
    `Stage score: ${stage.score}`,
    `Owner: ${stage.owner}`,
    `Public trace: ${evidenceTraceHref}`,
    "",
    `Outcome: ${stage.outcome}`,
    `Unlock: ${stage.unlock}`,
    `Next action: ${stage.nextAction}`,
    "",
    "## Proof lines",
    ...stage.proofLines.map((line) => `- ${line}`),
    "",
    "## Links",
    ...(stage.links.length > 0 ? stage.links.map((link) => `- ${link.label}: ${link.href}`) : ["- No stage links are available."])
  ].join("\n");
}

export function buildBuyerLaunchReadinessLaneMarkdown(trace: BuyerEvidenceTrace, evidenceTraceHref: string) {
  const stages = buildBuyerLaunchReadinessLane(trace);
  return [
    "# Buyer launch readiness lane",
    "",
    `Trace readiness: ${trace.readiness}`,
    `Trace score: ${trace.score}`,
    `Public trace: ${evidenceTraceHref}`,
    "",
    ...stages.flatMap((stage) => [
      `## ${stage.label}`,
      `Owner: ${stage.owner}`,
      `Status: ${stage.status}`,
      `Score: ${stage.score}`,
      `Outcome: ${stage.outcome}`,
      `Unlock: ${stage.unlock}`,
      `Next action: ${stage.nextAction}`,
      "Proof:",
      ...stage.proofLines.map((line) => `- ${line}`),
      ""
    ])
  ].join("\n");
}

export default function BuyerLaunchReadinessLane({
  evidenceTrace,
  evidenceTraceHref,
  onCopyText
}: {
  evidenceTrace: BuyerEvidenceTrace;
  evidenceTraceHref: string;
  onCopyText: (text: string) => Promise<boolean>;
}) {
  const stages = useMemo(() => buildBuyerLaunchReadinessLane(evidenceTrace), [evidenceTrace]);
  const [selectedStageId, setSelectedStageId] = useState<BuyerLaunchReadinessStageId>(stages[0]?.id ?? "value-evidence");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const selectedStage = stages.find((stage) => stage.id === selectedStageId) ?? stages[0];
  const exportMarkdown = useMemo(() => buildBuyerLaunchReadinessLaneMarkdown(evidenceTrace, evidenceTraceHref), [evidenceTrace, evidenceTraceHref]);
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`;
  const readyStages = stages.filter((stage) => stage.status === "pass").length;
  const openStages = stages.length - readyStages;
  const copyLabel = copyStatus === "copied" ? "Copied lane" : copyStatus === "failed" ? "Copy failed" : "Copy lane";

  useEffect(() => {
    if (stages.some((stage) => stage.id === selectedStageId)) return;
    setSelectedStageId(stages[0]?.id ?? "value-evidence");
  }, [selectedStageId, stages]);

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  async function copySelectedStage() {
    const copied = await onCopyText(buildSingleStageMarkdown(selectedStage, evidenceTrace, evidenceTraceHref));
    setCopyStatus(copied ? "copied" : "failed");
  }

  return (
    <section className={cx("buyer-launch-readiness-lane", evidenceTrace.readiness)} aria-label="Buyer launch readiness lane">
      <div className="buyer-launch-readiness-head">
        <div className="buyer-launch-readiness-copy">
          <span>Launch readiness lane</span>
          <strong>Show the shortest path from draft room to external review</strong>
          <p>Five gates turn the proof workbench into a buyer-visible launch path with a named owner and next unlock.</p>
          <div className="buyer-launch-readiness-actions" aria-label="Buyer launch readiness actions">
            <a href={evidenceTraceHref} {...externalAttrs(evidenceTraceHref)}>
              <FileText size={13} />
              Public trace
            </a>
            <button className={cx(copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copySelectedStage}>
              <ClipboardCheck size={13} />
              {copyLabel}
            </button>
            <a href={exportHref} download="buyer-launch-readiness-lane.md">
              <Download size={13} />
              Download lane
            </a>
          </div>
        </div>
        <div className="buyer-launch-readiness-score" aria-label="Buyer launch readiness score">
          <span>{evidenceTrace.readiness}</span>
          <strong>{readyStages}/{stages.length}</strong>
          <small>{openStages} launch gate{openStages === 1 ? "" : "s"} still open</small>
        </div>
      </div>

      <div className="buyer-launch-stage-list" aria-label="Buyer launch readiness stages">
        {stages.map((stage) => (
          <button
            key={stage.id}
            className={cx("buyer-launch-stage-card", stage.status, stage.id === selectedStage.id && "is-selected")}
            type="button"
            aria-pressed={stage.id === selectedStage.id}
            onClick={() => setSelectedStageId(stage.id)}
          >
            <span>{stage.status}</span>
            <strong>{stage.label}</strong>
            <p>{stage.owner}</p>
          </button>
        ))}
      </div>

      <div className="buyer-launch-stage-body">
        <article className={cx("buyer-launch-stage-detail", selectedStage.status)} aria-label="Selected launch readiness stage">
          <span>{selectedStage.label}</span>
          <strong>{selectedStage.outcome}</strong>
          <p><strong>Unlock:</strong> {selectedStage.unlock}</p>
          <p><strong>Next action:</strong> {selectedStage.nextAction}</p>
          <p><strong>Owner:</strong> {selectedStage.owner}</p>
        </article>

        <aside className={cx("buyer-launch-stage-proof", selectedStage.status)} aria-label="Selected launch readiness proof">
          <span>{selectedStage.status === "pass" ? "Gate ready" : "Gate open"}</span>
          <strong>{selectedStage.score}/100 evidence strength</strong>
          <ul>
            {selectedStage.proofLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </aside>
      </div>

      <div className="buyer-launch-stage-links" aria-label="Selected launch readiness links">
        <span>Stage links</span>
        <strong>Open the evidence before moving the gate</strong>
        <div className="buyer-launch-stage-link-list">
          {selectedStage.links.map((link, index) => (
            <a key={`${link.label}-${link.href}`} href={link.href} {...externalAttrs(link.href)}>
              {index === 0 ? <ExternalLink size={12} /> : selectedStage.status === "pass" ? <ShieldCheck size={12} /> : <Route size={12} />}
              {link.label}
            </a>
          ))}
        </div>
        {selectedStage.links.length === 0 ? <small>No stage links are available.</small> : null}
      </div>
    </section>
  );
}
