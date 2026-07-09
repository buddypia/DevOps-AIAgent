import { Activity, ClipboardCheck, Crosshair, Download, ExternalLink, ShieldCheck, Wrench } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  buildProductionHardeningDemoResidueAudit,
  buildProductionHardeningSnapshot,
  type ProductionHardeningAction,
  type ProductionHardeningBuildInput,
  type ProductionHardeningSnapshot,
  type ProductionHardeningStatus
} from "./productionHardening";
import { buyerFacingProofUrlProblem } from "./publicProofUrl";
import type { WorkspaceDraft } from "./workspaceDraft";

type HomepageLaunchIntegrityPanelProps = {
  workspace: WorkspaceDraft;
  workflowIntakeHref: string;
  currentAuditHref: string;
  deliveryMemoHref: string;
  trustManifestHref: string;
  launchRoomHref: string;
  productionHardeningHref: string;
  onCopyText: (text: string) => Promise<boolean>;
  proofRepair?: HomepageLaunchIntegrityProofRepairProps;
};

type HomepageLaunchIntegrityProofField = {
  key: string;
  label: string;
  target?: string;
  placeholder: string;
  href: string;
};

export type HomepageLaunchIntegrityProofRepairProps = {
  f: HomepageLaunchIntegrityProofField[];
  i: Record<string, string>;
  d: Partial<Record<string, string>>;
  s: "idle" | "checking" | "checked" | "failed";
  od: (key: string, value: string) => void;
  oa: (key: string) => void | Promise<void>;
  ov: () => void | Promise<void>;
};

export type HomepageLaunchIntegrityProofRepairTarget =
  | {
      mode: "replace-url";
      status: ProductionHardeningStatus;
      field: HomepageLaunchIntegrityProofField;
      headline: string;
      summary: string;
      problem: string;
      href: string;
      currentValue: string;
      draftValue: string;
      canApply: boolean;
    }
  | {
      mode: "verify-live-proof";
      status: ProductionHardeningStatus;
      headline: string;
      summary: string;
      problem: string;
      href: string;
      canApply: boolean;
    };

type LaunchIntegrityProofRepairBuildInput = {
  hardening: ProductionHardeningSnapshot;
  repair?: HomepageLaunchIntegrityProofRepairProps;
};

export type HomepageLaunchIntegrityRepairProjection = {
  status: ProductionHardeningStatus;
  scoreBefore: number;
  scoreAfter: number;
  readyBefore: number;
  readyAfter: number;
  openBefore: number;
  openAfter: number;
  delta: number;
  headline: string;
  summary: string;
  nextAction: string;
};

export type HomepageLaunchIntegrityProofSlotAuditItem = {
  key: string;
  label: string;
  target: string;
  href: string;
  owner: string;
  status: ProductionHardeningStatus;
  draftStatus: ProductionHardeningStatus;
  currentValue: string;
  currentLabel: string;
  draftValue: string;
  draftLabel: string;
  hasDraft: boolean;
  issue: string;
  draftIssue: string;
  action: string;
  verification: string;
  isActiveRepair: boolean;
};

export type HomepageLaunchIntegrityProofSlotAudit = {
  status: ProductionHardeningStatus;
  readyCount: number;
  totalCount: number;
  blockedCount: number;
  draftReadyCount: number;
  headline: string;
  summary: string;
  items: HomepageLaunchIntegrityProofSlotAuditItem[];
};

type LaunchIntegrityRepairProjectionBuildInput = {
  hardening: ProductionHardeningSnapshot;
  repairTarget: HomepageLaunchIntegrityProofRepairTarget | null;
  input: ProductionHardeningBuildInput;
};

type LaunchIntegrityProofSlotAuditBuildInput = {
  repair?: HomepageLaunchIntegrityProofRepairProps;
  repairTarget?: HomepageLaunchIntegrityProofRepairTarget | null;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function routeActionAttrs(action: Pick<ProductionHardeningAction, "external">) {
  return action.external ? { target: "_blank", rel: "noreferrer" } : {};
}

function isReferenceProofUrl(value: string) {
  if (!value.trim()) return false;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return url.pathname.startsWith("/sample/") || hostname === "sample.example" || hostname.endsWith(".sample.example");
  } catch {
    return /\/sample\//i.test(value);
  }
}

function replacementProblemFor(value: string) {
  return buyerFacingProofUrlProblem(value) || (isReferenceProofUrl(value) ? "Replace reference /sample/ proof with a buyer-owned public artifact URL." : "");
}

function proofSlotOwnerFor(key: string) {
  if (key === "targetUrl") return "DevOps owner";
  if (key === "protopediaUrl" || key === "videoUrl") return "Submission owner";
  if (key === "pilotEvidenceUrl") return "Buyer sponsor";
  if (key === "workOrderEvidenceUrl") return "Scope owner";
  return "Proof owner";
}

function proofSlotVerificationFor(key: string) {
  if (key === "targetUrl") return "Open the deployed product from an external network, then run Verify live links.";
  if (key === "protopediaUrl") return "Open the published ProtoPedia story and confirm it names this product.";
  if (key === "videoUrl") return "Open the walkthrough in a private window and confirm it is public or unlisted.";
  if (key === "pilotEvidenceUrl") return "Open the measured pilot receipt and confirm reviewer, tasks, and accepted result.";
  if (key === "workOrderEvidenceUrl") return "Open the work-order proof and confirm scope, owner, and target user.";
  return "Open the proof URL and rerun live verification.";
}

function proofUrlLabel(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "Missing URL";
  try {
    const url = new URL(trimmed);
    const path = url.pathname === "/" ? "" : url.pathname;
    const label = `${url.hostname}${path}`;
    return label.length > 64 ? `${label.slice(0, 61)}...` : label;
  } catch {
    return trimmed.length > 64 ? `${trimmed.slice(0, 61)}...` : trimmed;
  }
}

function proofSlotStatusFor(value: string): ProductionHardeningStatus {
  return replacementProblemFor(value) ? "blocked" : "ready";
}

function proofRepairButtonLabel(mode: HomepageLaunchIntegrityProofRepairTarget["mode"], status: HomepageLaunchIntegrityProofRepairProps["s"]) {
  if (status === "checking") return "Checking";
  if (mode === "verify-live-proof") return status === "failed" ? "Retry live check" : "Verify now";
  return status === "checked" ? "Apply & recheck" : "Apply & verify";
}

function proofRepairStatusLine(status: HomepageLaunchIntegrityProofRepairProps["s"]) {
  if (status === "checking") return "Live verification is running against the current public proof links.";
  if (status === "checked") return "Latest verification is attached; rerun after any proof URL changes.";
  if (status === "failed") return "Live verification failed. Replace the blocker and retry from here.";
  return "Saving a replacement will immediately trigger live proof verification.";
}

function iconFor(status: ProductionHardeningStatus) {
  if (status === "ready") return <ShieldCheck size={14} />;
  if (status === "attention") return <Wrench size={14} />;
  return <Crosshair size={14} />;
}

function buildHardeningInput({
  workspace,
  workflowIntakeHref,
  currentAuditHref,
  deliveryMemoHref,
  trustManifestHref,
  launchRoomHref
}: Omit<HomepageLaunchIntegrityPanelProps, "productionHardeningHref" | "onCopyText" | "proofRepair">): ProductionHardeningBuildInput {
  return {
    workspace,
    workflowIntakeHref,
    currentAuditHref,
    deliveryMemoHref,
    trustManifestHref,
    launchRoomHref
  };
}

export function buildLaunchIntegrityProofRepairTarget({
  hardening,
  repair
}: LaunchIntegrityProofRepairBuildInput): HomepageLaunchIntegrityProofRepairTarget | null {
  if (!repair) return null;
  const publicProofCheck = hardening.checks.find((check) => check.id === "public-proof-urls");
  const firstBlockedField = repair.f.find((field) => replacementProblemFor(repair.i[field.key] ?? ""));

  if (firstBlockedField) {
    const currentValue = repair.i[firstBlockedField.key] ?? "";
    const draftValue = repair.d[firstBlockedField.key] ?? currentValue;
    return {
      mode: "replace-url",
      status: publicProofCheck?.status ?? "blocked",
      field: firstBlockedField,
      headline: `Fix ${firstBlockedField.label} now`,
      summary: `${firstBlockedField.target ?? firstBlockedField.label} is blocking the global launch gate.`,
      problem: replacementProblemFor(currentValue) || "Replace this proof link with a buyer-owned public HTTPS URL.",
      href: firstBlockedField.href || publicProofCheck?.href || "#launch-evidence-console",
      currentValue,
      draftValue,
      canApply: repair.s !== "checking" && draftValue.trim().length > 0 && draftValue !== currentValue
    };
  }

  const liveCheck = hardening.checks.find((check) => check.id === "live-verification" && check.status !== "ready");
  if (!liveCheck) return null;
  return {
    mode: "verify-live-proof",
    status: liveCheck.status,
    headline: "Run fresh live proof check",
    summary: liveCheck.action,
    problem: liveCheck.evidence,
    href: liveCheck.href,
    canApply: repair.s !== "checking"
  };
}

export function buildLaunchIntegrityProofSlotAudit({
  repair,
  repairTarget
}: LaunchIntegrityProofSlotAuditBuildInput): HomepageLaunchIntegrityProofSlotAudit | null {
  if (!repair) return null;
  const items = repair.f.map((field) => {
    const currentValue = repair.i[field.key] ?? "";
    const draftValue = repair.d[field.key] ?? currentValue;
    const issue = replacementProblemFor(currentValue);
    const draftIssue = replacementProblemFor(draftValue);
    const hasDraft = draftValue.trim().length > 0 && draftValue !== currentValue;
    const activeRepair = repairTarget?.mode === "replace-url" && repairTarget.field.key === field.key;

    return {
      key: field.key,
      label: field.label,
      target: field.target ?? field.label,
      href: field.href,
      owner: proofSlotOwnerFor(field.key),
      status: proofSlotStatusFor(currentValue),
      draftStatus: hasDraft ? proofSlotStatusFor(draftValue) : proofSlotStatusFor(currentValue),
      currentValue,
      currentLabel: proofUrlLabel(currentValue),
      draftValue,
      draftLabel: proofUrlLabel(draftValue),
      hasDraft,
      issue,
      draftIssue,
      action: issue
        ? `Replace ${field.label} with ${field.placeholder.replace(/[<>]/g, "")}.`
        : hasDraft
          ? "Apply the draft, then rerun live verification."
          : "Keep this proof public and rerun live verification after any URL change.",
      verification: proofSlotVerificationFor(field.key),
      isActiveRepair: activeRepair
    };
  });
  const readyCount = items.filter((item) => item.status === "ready").length;
  const draftReadyCount = items.filter((item) => item.draftStatus === "ready").length;
  const blockedCount = items.length - readyCount;
  const draftLift = Math.max(0, draftReadyCount - readyCount);

  return {
    status: blockedCount === 0 ? "ready" : "blocked",
    readyCount,
    totalCount: items.length,
    blockedCount,
    draftReadyCount,
    headline: blockedCount === 0 ? "All public proof slots are buyer-facing" : `${blockedCount}/${items.length} proof slots block public launch`,
    summary:
      draftLift > 0
        ? `${draftLift} blocked proof slot${draftLift === 1 ? "" : "s"} would become ready after the current draft${draftLift === 1 ? "" : "s"}. Apply and run Verify live links before sharing.`
        : blockedCount > 0
          ? "Each blocked slot needs a buyer-owned public HTTPS artifact before this can pass external review."
          : "Every proof slot has a public buyer-facing URL; keep the live check fresh inside the publication window.",
    items
  };
}

function proofRepairedWorkspace(workspace: WorkspaceDraft, key: string, value: string): WorkspaceDraft {
  if (key === "targetUrl") return { ...workspace, targetUrl: value };
  if (key === "protopediaUrl") return { ...workspace, protopediaUrl: value };
  if (key === "videoUrl") return { ...workspace, videoUrl: value };
  if (key === "pilotEvidenceUrl") {
    return {
      ...workspace,
      proofVerification: null,
      pilotRun: {
        ...workspace.pilotRun,
        evidenceUrl: value
      }
    };
  }
  if (key === "workOrderEvidenceUrl") {
    return {
      ...workspace,
      proofVerification: null,
      buyerWorkOrder: {
        ...workspace.buyerWorkOrder,
        evidenceUrl: value
      }
    };
  }
  return workspace;
}

function openIssueCount(snapshot: ProductionHardeningSnapshot) {
  return snapshot.recoveryKit.issues.filter((issue) => issue.status !== "ready").length;
}

export function buildLaunchIntegrityRepairProjection({
  hardening,
  repairTarget,
  input
}: LaunchIntegrityRepairProjectionBuildInput): HomepageLaunchIntegrityRepairProjection | null {
  if (!repairTarget || repairTarget.mode !== "replace-url" || !repairTarget.draftValue.trim() || repairTarget.draftValue === repairTarget.currentValue) return null;
  const repairedWorkspace = {
    ...proofRepairedWorkspace(input.workspace, repairTarget.field.key, repairTarget.draftValue),
    proofVerification: null
  };
  const projected = buildProductionHardeningSnapshot({ ...input, workspace: repairedWorkspace });
  const nextIssue = projected.recoveryKit.issues.find((issue) => issue.status !== "ready");
  const currentIssue = hardening.recoveryKit.issues.find((issue) => issue.status !== "ready");
  const openBefore = openIssueCount(hardening);
  const openAfter = openIssueCount(projected);
  const delta = projected.score - hardening.score;
  const blockerAdvanced = Boolean(nextIssue && currentIssue && nextIssue.action !== currentIssue.action);

  return {
    status: projected.status,
    scoreBefore: hardening.score,
    scoreAfter: projected.score,
    readyBefore: hardening.readyCount,
    readyAfter: projected.readyCount,
    openBefore,
    openAfter,
    delta,
    headline:
      delta > 0
        ? `+${delta} launch score after this repair`
        : blockerAdvanced
          ? "First proof blocker advances after this repair"
        : openAfter < openBefore
          ? `${openBefore - openAfter} blocker closed after this repair`
          : "This repair still needs the next proof check",
    summary:
      openAfter === 0
        ? "No open release ticket remains after this replacement, but the live proof check must be rerun before sharing."
        : `${projected.readyCount}/${projected.checkTotal} launch checks would be ready. Next blocker: ${nextIssue?.title ?? projected.firstAction.label}.`,
    nextAction: nextIssue
      ? `${nextIssue.owner}: ${nextIssue.action}`
      : "Run Verify live links, then reopen this gate before external sharing."
  };
}

export default function HomepageLaunchIntegrityPanel({
  workspace,
  workflowIntakeHref,
  currentAuditHref,
  deliveryMemoHref,
  trustManifestHref,
  launchRoomHref,
  productionHardeningHref,
  onCopyText,
  proofRepair
}: HomepageLaunchIntegrityPanelProps) {
  const hardening = useMemo(
    () =>
      buildProductionHardeningSnapshot(
        buildHardeningInput({
          workspace,
          workflowIntakeHref,
          currentAuditHref,
          deliveryMemoHref,
          trustManifestHref,
          launchRoomHref
        })
      ),
    [currentAuditHref, deliveryMemoHref, launchRoomHref, trustManifestHref, workflowIntakeHref, workspace]
  );
  const residue = useMemo(() => buildProductionHardeningDemoResidueAudit(hardening), [hardening]);
  const repairTarget = useMemo(() => buildLaunchIntegrityProofRepairTarget({ hardening, repair: proofRepair }), [hardening, proofRepair]);
  const proofSlotAudit = useMemo(() => buildLaunchIntegrityProofSlotAudit({ repair: proofRepair, repairTarget }), [proofRepair, repairTarget]);
  const repairProjection = useMemo(
    () =>
      buildLaunchIntegrityRepairProjection({
        hardening,
        repairTarget,
        input: buildHardeningInput({
          workspace,
          workflowIntakeHref,
          currentAuditHref,
          deliveryMemoHref,
          trustManifestHref,
          launchRoomHref
        })
      }),
    [currentAuditHref, deliveryMemoHref, hardening, launchRoomHref, repairTarget, trustManifestHref, workflowIntakeHref, workspace]
  );
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const topIssue = hardening.recoveryKit.issues[0];
  const firstResidue = residue.items.find((item) => item.status !== "ready") ?? residue.items[0];
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(hardening.exportMarkdown)}`;
  const recoveryCsvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(hardening.recoveryKit.csvText)}`;
  const recoveryJsonHref = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(hardening.recoveryKit, null, 2))}`;
  const copyLabel = copyStatus === "copied" ? "Copied issue" : copyStatus === "failed" ? "Copy failed" : "Copy top issue";

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  async function copyTopIssue() {
    const copied = await onCopyText(topIssue?.issueBody ?? hardening.recoveryKit.copyText);
    setCopyStatus(copied ? "copied" : "failed");
  }

  async function applyLaunchRepair(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!proofRepair || !repairTarget || !repairTarget.canApply) return;
    if (repairTarget.mode === "replace-url") {
      await proofRepair.oa(repairTarget.field.key);
      return;
    }
    await proofRepair.ov();
  }

  return (
    <section className={cx("homepage-launch-integrity", `is-${hardening.status}`)} aria-label="Launch integrity triage">
      <div className="homepage-launch-integrity-main">
        <span>
          {iconFor(hardening.status)}
          Launch integrity triage
        </span>
        <h2>{hardening.headline}</h2>
        <p>{hardening.summary}</p>
        <div className="homepage-launch-integrity-actions" aria-label="Launch integrity actions">
          <a className="homepage-launch-integrity-primary" href={hardening.firstAction.href} {...routeActionAttrs(hardening.firstAction)}>
            {iconFor(hardening.status)}
            {hardening.firstAction.label}
          </a>
          <button className={cx("homepage-launch-integrity-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copyTopIssue}>
            <ClipboardCheck size={14} />
            {copyLabel}
          </button>
          <a className="homepage-launch-integrity-link" href={productionHardeningHref} target="_blank" rel="noreferrer">
            <ExternalLink size={14} />
            Production gate
          </a>
          <a className="homepage-launch-integrity-link" href={exportHref} download="launch-integrity-triage.md">
            <Download size={14} />
            Export triage
          </a>
          <a className="homepage-launch-integrity-link" href={recoveryCsvHref} download="global-release-recovery-kit.csv">
            <Download size={14} />
            Recovery CSV
          </a>
          <a className="homepage-launch-integrity-link" href={recoveryJsonHref} download="global-release-recovery-kit.json">
            <Download size={14} />
            Recovery JSON
          </a>
        </div>
      </div>
      {proofRepair && repairTarget ? (
        <form className={cx("homepage-launch-integrity-repair", repairTarget.status)} aria-label="Launch integrity repair control" onSubmit={applyLaunchRepair}>
          <div className="homepage-launch-integrity-repair-copy">
            <span>{repairTarget.mode === "replace-url" ? "Fix first blocker" : "Fresh proof check"}</span>
            <strong>{repairTarget.headline}</strong>
            <p>{repairTarget.summary}</p>
            <small aria-live="polite">{proofRepairStatusLine(proofRepair.s)}</small>
          </div>
          {repairTarget.mode === "replace-url" ? (
            <label className="homepage-launch-integrity-repair-field">
              <span>Paste replacement URL</span>
              <input
                type="url"
                value={repairTarget.draftValue}
                placeholder={repairTarget.field.placeholder}
                aria-label={`Replacement URL for ${repairTarget.field.label}`}
                onChange={(event) => proofRepair.od(repairTarget.field.key, event.target.value)}
              />
              <small>{repairTarget.problem}</small>
            </label>
          ) : (
            <div className="homepage-launch-integrity-repair-field is-verify-only">
              <span>Current blocker</span>
              <strong>{repairTarget.problem}</strong>
              <small>{repairTarget.summary}</small>
            </div>
          )}
          <div className="homepage-launch-integrity-repair-actions">
            <a href={repairTarget.href}>
              <ExternalLink size={14} />
              Open source
            </a>
            <button type="submit" disabled={!repairTarget.canApply}>
              {proofRepair.s === "checking" ? <Activity size={14} /> : <ShieldCheck size={14} />}
              {proofRepairButtonLabel(repairTarget.mode, proofRepair.s)}
            </button>
          </div>
          {repairProjection ? (
            <div className={cx("homepage-launch-integrity-repair-impact", repairProjection.status)} aria-label="Projected launch gate after repair">
              <span>Repair impact</span>
              <strong>
                {repairProjection.scoreBefore} -&gt; {repairProjection.scoreAfter}
              </strong>
              <p>{repairProjection.headline}</p>
              <div aria-label="Projected launch repair stats">
                <b>{repairProjection.readyBefore} -&gt; {repairProjection.readyAfter}</b>
                <small>ready checks</small>
                <b>{repairProjection.openBefore} -&gt; {repairProjection.openAfter}</b>
                <small>open tickets</small>
              </div>
              <em>{repairProjection.summary}</em>
              <small>{repairProjection.nextAction}</small>
            </div>
          ) : null}
        </form>
      ) : null}
      {proofSlotAudit ? (
        <div className={cx("homepage-launch-integrity-proof-slots", proofSlotAudit.status)} aria-label="Public proof slot audit">
          <div className="homepage-launch-integrity-proof-slots-summary">
            <span>Public proof slot audit</span>
            <strong>
              {proofSlotAudit.readyCount}/{proofSlotAudit.totalCount} externally usable
            </strong>
            <p>{proofSlotAudit.summary}</p>
          </div>
          <div className="homepage-launch-integrity-proof-slot-list">
            {proofSlotAudit.items.map((item) => (
              <a key={item.key} className={cx("homepage-launch-integrity-proof-slot", item.status, item.hasDraft && "has-draft", item.isActiveRepair && "is-active")} href={item.href}>
                <span>
                  {item.status === "ready" ? <ShieldCheck size={13} /> : <Crosshair size={13} />}
                  {item.label}
                </span>
                <strong>{item.currentLabel}</strong>
                <p>{item.issue || `${item.target} is public and buyer-facing.`}</p>
                {item.hasDraft ? (
                  <small>
                    Draft: {item.draftStatus === "ready" ? `${item.draftLabel} would pass URL hygiene.` : item.draftIssue}
                  </small>
                ) : (
                  <small>
                    {item.owner}: {item.verification}
                  </small>
                )}
              </a>
            ))}
          </div>
        </div>
      ) : null}
      <aside className="homepage-launch-integrity-score" aria-label="Launch integrity score">
        <span>{hardening.status}</span>
        <strong>{hardening.score}</strong>
        <small>
          {hardening.readyCount}/{hardening.checkTotal} launch checks · {residue.readyCount}/{residue.totalCount} residue checks
        </small>
      </aside>
      <article className={cx("homepage-launch-integrity-issue", topIssue?.status)} aria-label="First launch recovery issue">
        <span>{topIssue ? `${topIssue.priority} / ${topIssue.owner}` : "Monitor"}</span>
        <strong>{topIssue?.issueTitle ?? hardening.recoveryKit.headline}</strong>
        <p>{topIssue?.acceptance ?? hardening.recoveryKit.summary}</p>
        <small>{hardening.recoveryKit.releaseRule}</small>
      </article>
      <article className={cx("homepage-launch-integrity-residue", residue.status)} aria-label="Reference residue audit">
        <span>Reference residue</span>
        <strong>{residue.headline}</strong>
        <p>{firstResidue ? `${firstResidue.owner}: ${firstResidue.action}` : residue.summary}</p>
        <small>{residue.summary}</small>
      </article>
      <div className="homepage-launch-integrity-rule" aria-label="No-launch rule">
        <span>No-launch rule</span>
        <strong>{hardening.noLaunchRules[0]}</strong>
      </div>
      <div className="homepage-launch-integrity-queue" aria-label="Launch integrity owner queue">
        {hardening.recoveryKit.issues.slice(0, 4).map((issue) => (
          <a key={issue.id} className={issue.status} href={issue.href}>
            <span>{issue.priority}</span>
            <strong>{issue.title}</strong>
            <small>
              {issue.owner} verifies: {issue.verification}
            </small>
          </a>
        ))}
      </div>
    </section>
  );
}
