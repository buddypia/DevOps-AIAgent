import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ClipboardCheck, Download, ExternalLink, FileText, ShieldCheck } from "lucide-react";
import type { BuyerEvidenceTrace, BuyerEvidenceTraceClaim, BuyerEvidenceTraceClaimId, BuyerEvidenceTraceStatus } from "./buyerEvidenceTrace";
import "./BuyerObjectionRehearsal.css";

type BuyerObjectionId = "demo-risk" | "value-proof" | "public-proof" | "security-procurement" | "decision-owner";

type BuyerObjectionDefinition = {
  id: BuyerObjectionId;
  label: string;
  stakeholder: string;
  objection: string;
  claimIds: BuyerEvidenceTraceClaimId[];
  passAnswer: string;
  watchAnswer: string;
  blockAnswer: string;
  ifChallenged: string;
};

export type BuyerObjectionBrief = {
  id: BuyerObjectionId;
  label: string;
  stakeholder: string;
  objection: string;
  status: BuyerEvidenceTraceStatus;
  answer: string;
  score: number;
  evidenceLines: string[];
  repairAction: string;
  ifChallenged: string;
  links: Array<{ label: string; href: string }>;
};

const OBJECTIONS: BuyerObjectionDefinition[] = [
  {
    id: "demo-risk",
    label: "Demo risk",
    stakeholder: "Executive sponsor",
    objection: "This still looks like a demo. Why should we trust it?",
    claimIds: ["public-proof", "work-order", "buyer-decision"],
    passAnswer: "The room can be trusted because public proof, work scope, and the share decision all trace to artifacts.",
    watchAnswer: "Treat the room as sponsor review material until the watch item is cleared.",
    blockAnswer: "Do not present this as a product-ready room while the public proof or decision claim is blocked.",
    ifChallenged: "Open the public trace first, then show the work order and share decision before discussing features."
  },
  {
    id: "value-proof",
    label: "Value proof",
    stakeholder: "Finance",
    objection: "Where is the measured value, not just the story?",
    claimIds: ["value-case", "measured-pilot"],
    passAnswer: "The value answer is defensible because modeled value and a measured buyer-like run are both present.",
    watchAnswer: "Use the value story only as a forecast until the watch item is owner-reviewed.",
    blockAnswer: "Do not ask Finance to accept the value case until the missing value or measured-run proof is repaired.",
    ifChallenged: "Start with the measured run, then open the value artifact and name the confidence line."
  },
  {
    id: "public-proof",
    label: "Public proof",
    stakeholder: "External reviewer",
    objection: "Can I open the proof myself right now?",
    claimIds: ["public-proof"],
    passAnswer: "Yes. The cited public proof is reachable and can be inspected without a private sales call.",
    watchAnswer: "Open the proof during review and mark the packet as pending until the warning is cleared.",
    blockAnswer: "No. External review should wait until the proof URL is public and verified.",
    ifChallenged: "Do not narrate around a broken URL. Repair the link, rerun verification, then send the packet."
  },
  {
    id: "security-procurement",
    label: "Security review",
    stakeholder: "Security and procurement",
    objection: "What stops this from becoming an unmanaged integration?",
    claimIds: ["operating-gates", "public-proof"],
    passAnswer: "Trust controls and public proof are both available, so security can review the operating boundary.",
    watchAnswer: "Route this as a security review request with the unresolved item clearly labeled.",
    blockAnswer: "Do not start vendor review until the trust or public-proof blocker is closed.",
    ifChallenged: "Name the control owner, show the trust artifact, and keep expansion blocked until the proof link is reachable."
  },
  {
    id: "decision-owner",
    label: "Decision owner",
    stakeholder: "Pilot owner",
    objection: "Who decides the next step and what must happen first?",
    claimIds: ["buyer-decision", "work-order"],
    passAnswer: "The next decision and scoped work are visible enough for the pilot owner to act.",
    watchAnswer: "The pilot owner can review the next step, but should record the watch item before committing.",
    blockAnswer: "The pilot owner should hold the next step until the decision or work-order proof is repaired.",
    ifChallenged: "Read the next action aloud and assign the owner before any new buyer commitment is made."
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

function objectionAnswer(definition: BuyerObjectionDefinition, status: BuyerEvidenceTraceStatus) {
  if (status === "pass") return definition.passAnswer;
  if (status === "watch") return definition.watchAnswer;
  return definition.blockAnswer;
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

function averageClaimScore(claims: BuyerEvidenceTraceClaim[], status: BuyerEvidenceTraceStatus) {
  if (claims.length === 0) return statusScore(status);
  return Math.round(claims.reduce((sum, claim) => sum + claim.score, 0) / claims.length);
}

export function buildBuyerObjectionRehearsal(trace: BuyerEvidenceTrace): BuyerObjectionBrief[] {
  const claimById = new Map(trace.claims.map((claim) => [claim.id, claim]));

  return OBJECTIONS.map((definition) => {
    const claims = definition.claimIds.map((id) => claimById.get(id)).filter((claim): claim is BuyerEvidenceTraceClaim => Boolean(claim));
    const missingCount = definition.claimIds.length - claims.length;
    const status = worstStatus(claims, missingCount);
    const firstOpenClaim = claims.find((claim) => claim.status !== "pass");

    return {
      id: definition.id,
      label: definition.label,
      stakeholder: definition.stakeholder,
      objection: definition.objection,
      status,
      answer: objectionAnswer(definition, status),
      score: averageClaimScore(claims, status),
      evidenceLines:
        claims.length > 0
          ? claims.map((claim) => `${claim.label}: ${claim.verification}`)
          : ["Required buyer evidence is missing from the trace."],
      repairAction: firstOpenClaim?.nextAction ?? (missingCount > 0 ? "Attach the missing claim before rehearsing this objection." : "Keep this answer attached to the buyer packet."),
      ifChallenged: definition.ifChallenged,
      links: uniqueLinks(claims)
    };
  });
}

function buildSingleObjectionMarkdown(objection: BuyerObjectionBrief, trace: BuyerEvidenceTrace, evidenceTraceHref: string) {
  return [
    `# ${objection.label} objection rehearsal`,
    "",
    `Trace readiness: ${trace.readiness}`,
    `Stakeholder: ${objection.stakeholder}`,
    `Status: ${objection.status}`,
    `Score: ${objection.score}`,
    `Public trace: ${evidenceTraceHref}`,
    "",
    `Objection: ${objection.objection}`,
    `Answer: ${objection.answer}`,
    `If challenged: ${objection.ifChallenged}`,
    `Repair action: ${objection.repairAction}`,
    "",
    "## Evidence",
    ...objection.evidenceLines.map((line) => `- ${line}`),
    "",
    "## Links",
    ...(objection.links.length > 0 ? objection.links.map((link) => `- ${link.label}: ${link.href}`) : ["- No evidence links are available."])
  ].join("\n");
}

export function buildBuyerObjectionRehearsalMarkdown(trace: BuyerEvidenceTrace, evidenceTraceHref: string) {
  const objections = buildBuyerObjectionRehearsal(trace);
  return [
    "# Buyer objection rehearsal",
    "",
    `Trace readiness: ${trace.readiness}`,
    `Trace score: ${trace.score}`,
    `Public trace: ${evidenceTraceHref}`,
    "",
    ...objections.flatMap((objection) => [
      `## ${objection.label}`,
      `Stakeholder: ${objection.stakeholder}`,
      `Status: ${objection.status}`,
      `Objection: ${objection.objection}`,
      `Answer: ${objection.answer}`,
      `If challenged: ${objection.ifChallenged}`,
      `Repair action: ${objection.repairAction}`,
      "Evidence:",
      ...objection.evidenceLines.map((line) => `- ${line}`),
      ""
    ])
  ].join("\n");
}

export default function BuyerObjectionRehearsal({
  evidenceTrace,
  evidenceTraceHref,
  onCopyText
}: {
  evidenceTrace: BuyerEvidenceTrace;
  evidenceTraceHref: string;
  onCopyText: (text: string) => Promise<boolean>;
}) {
  const objections = useMemo(() => buildBuyerObjectionRehearsal(evidenceTrace), [evidenceTrace]);
  const [selectedId, setSelectedId] = useState<BuyerObjectionId>(objections[0]?.id ?? "demo-risk");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const selected = objections.find((objection) => objection.id === selectedId) ?? objections[0];
  const exportMarkdown = useMemo(() => buildBuyerObjectionRehearsalMarkdown(evidenceTrace, evidenceTraceHref), [evidenceTrace, evidenceTraceHref]);
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`;
  const readyCount = objections.filter((objection) => objection.status === "pass").length;
  const openCount = objections.length - readyCount;
  const copyLabel = copyStatus === "copied" ? "Copied objection" : copyStatus === "failed" ? "Copy failed" : "Copy objection";

  useEffect(() => {
    if (objections.some((objection) => objection.id === selectedId)) return;
    setSelectedId(objections[0]?.id ?? "demo-risk");
  }, [objections, selectedId]);

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  async function copySelected() {
    const copied = await onCopyText(buildSingleObjectionMarkdown(selected, evidenceTrace, evidenceTraceHref));
    setCopyStatus(copied ? "copied" : "failed");
  }

  return (
    <section className={cx("buyer-objection-rehearsal", evidenceTrace.readiness)} aria-label="Buyer objection rehearsal">
      <div className="buyer-objection-head">
        <div className="buyer-objection-copy">
          <span>Objection rehearsal</span>
          <strong>Pressure-test the buyer story before it leaves the room</strong>
          <p>Each objection is answered only when the cited claims, evidence lines, and repair action are visible.</p>
          <div className="buyer-objection-actions" aria-label="Buyer objection rehearsal actions">
            <a href={evidenceTraceHref} {...externalAttrs(evidenceTraceHref)}>
              <FileText size={13} />
              Public trace
            </a>
            <button className={cx(copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copySelected}>
              <ClipboardCheck size={13} />
              {copyLabel}
            </button>
            <a href={exportHref} download="buyer-objection-rehearsal.md">
              <Download size={13} />
              Download rehearsal
            </a>
          </div>
        </div>
        <div className="buyer-objection-score" aria-label="Buyer objection rehearsal score">
          <span>{evidenceTrace.readiness}</span>
          <strong>{readyCount}/{objections.length}</strong>
          <small>{openCount} objection{openCount === 1 ? "" : "s"} still need proof</small>
        </div>
      </div>

      <div className="buyer-objection-list" aria-label="Buyer objections">
        {objections.map((objection) => (
          <button
            key={objection.id}
            className={cx("buyer-objection-card", objection.status, objection.id === selected.id && "is-selected")}
            type="button"
            aria-pressed={objection.id === selected.id}
            onClick={() => setSelectedId(objection.id)}
          >
            <span>{objection.status}</span>
            <strong>{objection.label}</strong>
            <p>{objection.stakeholder}</p>
          </button>
        ))}
      </div>

      <div className="buyer-objection-detail">
        <article className={cx("buyer-objection-answer", selected.status)} aria-label="Selected objection answer">
          <span>{selected.stakeholder}</span>
          <strong>{selected.objection}</strong>
          <p>{selected.answer}</p>
          <p><strong>If challenged:</strong> {selected.ifChallenged}</p>
          <p><strong>Repair action:</strong> {selected.repairAction}</p>
        </article>

        <aside className={cx("buyer-objection-evidence", selected.status)} aria-label="Selected objection evidence">
          <span>{selected.status === "pass" ? "Ready answer" : "Open objection"}</span>
          <strong>{selected.score}/100 evidence strength</strong>
          <ul>
            {selected.evidenceLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </aside>
      </div>

      <div className="buyer-objection-links" aria-label="Selected objection evidence links">
        <span>Evidence links</span>
        <strong>Open these before answering live</strong>
        <div className="buyer-objection-link-list">
          {selected.links.map((link, index) => (
            <a key={`${link.label}-${link.href}`} href={link.href} {...externalAttrs(link.href)}>
              {index === 0 ? <ExternalLink size={12} /> : selected.status === "pass" ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
              {link.label}
            </a>
          ))}
        </div>
        {selected.links.length === 0 ? <small>No evidence links are available.</small> : null}
      </div>
    </section>
  );
}
