import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Download, ExternalLink, FileText, Route } from "lucide-react";
import type { BuyerEvidenceTrace, BuyerEvidenceTraceClaim, BuyerEvidenceTraceClaimId, BuyerEvidenceTraceStatus } from "./buyerEvidenceTrace";
import "./BuyerRoleDecisionPackets.css";

type BuyerRoleDecisionPacketId = "economic-buyer" | "technical-evaluator" | "security-procurement" | "sponsor-owner";

type BuyerRoleDecisionDefinition = {
  id: BuyerRoleDecisionPacketId;
  label: string;
  recipient: string;
  question: string;
  claimIds: BuyerEvidenceTraceClaimId[];
  passHeadline: string;
  watchHeadline: string;
  blockHeadline: string;
};

export type BuyerRoleDecisionPacket = {
  id: BuyerRoleDecisionPacketId;
  label: string;
  recipient: string;
  question: string;
  status: BuyerEvidenceTraceStatus;
  headline: string;
  answer: string;
  score: number;
  passCount: number;
  totalCount: number;
  blockerCount: number;
  proofLines: string[];
  nextAction: string;
  sendRule: string;
  links: Array<{ label: string; href: string }>;
};

const ROLE_DEFINITIONS: BuyerRoleDecisionDefinition[] = [
  {
    id: "economic-buyer",
    label: "Economic buyer",
    recipient: "Budget owner / procurement lead",
    question: "Should we fund a bounded pilot?",
    claimIds: ["value-case", "buyer-decision"],
    passHeadline: "Pilot value is ready for budget review",
    watchHeadline: "Value needs sponsor review before funding",
    blockHeadline: "Do not request budget yet"
  },
  {
    id: "technical-evaluator",
    label: "Technical evaluator",
    recipient: "Platform / DevOps lead",
    question: "Can engineering trust the pilot run?",
    claimIds: ["measured-pilot", "work-order", "public-proof"],
    passHeadline: "Technical pilot evidence is inspectable",
    watchHeadline: "Technical review needs one caveat",
    blockHeadline: "Technical review is blocked"
  },
  {
    id: "security-procurement",
    label: "Security and procurement",
    recipient: "Security, legal, and vendor review",
    question: "Are trust controls and proof URLs ready?",
    claimIds: ["operating-gates", "public-proof"],
    passHeadline: "Trust and proof checks are ready",
    watchHeadline: "Trust packet needs reviewer confirmation",
    blockHeadline: "Do not start vendor review yet"
  },
  {
    id: "sponsor-owner",
    label: "Sponsor owner",
    recipient: "Internal sponsor / pilot owner",
    question: "What decision should the sponsor make next?",
    claimIds: ["buyer-decision", "public-proof", "work-order"],
    passHeadline: "Sponsor can approve the next step",
    watchHeadline: "Sponsor should review the watch item",
    blockHeadline: "Sponsor should hold external sharing"
  }
];

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function externalAttrs(href: string) {
  return /^https?:\/\//i.test(href) ? { target: "_blank", rel: "noreferrer" } : {};
}

function statusWeight(status: BuyerEvidenceTraceStatus) {
  if (status === "block") return 0;
  if (status === "watch") return 1;
  return 2;
}

function worstStatus(statuses: BuyerEvidenceTraceStatus[]): BuyerEvidenceTraceStatus {
  if (statuses.includes("block")) return "block";
  if (statuses.includes("watch")) return "watch";
  return "pass";
}

function scoreFor(status: BuyerEvidenceTraceStatus) {
  if (status === "pass") return 100;
  if (status === "watch") return 68;
  return 18;
}

function averageScore(claims: BuyerEvidenceTraceClaim[], fallbackStatus: BuyerEvidenceTraceStatus) {
  if (claims.length === 0) return scoreFor(fallbackStatus);
  return Math.round(claims.reduce((sum, claim) => sum + claim.score, 0) / claims.length);
}

function headlineFor(definition: BuyerRoleDecisionDefinition, status: BuyerEvidenceTraceStatus) {
  if (status === "pass") return definition.passHeadline;
  if (status === "watch") return definition.watchHeadline;
  return definition.blockHeadline;
}

function sendRuleFor(status: BuyerEvidenceTraceStatus) {
  if (status === "pass") return "Send this packet with the public trace and cited artifacts.";
  if (status === "watch") return "Send only as a review request. Mark the watch item as unresolved.";
  return "Do not send externally. Repair the blocker and rerun the trace first.";
}

function answerFor(definition: BuyerRoleDecisionDefinition, status: BuyerEvidenceTraceStatus, claims: BuyerEvidenceTraceClaim[], trace: BuyerEvidenceTrace) {
  const strongestProof = claims.find((claim) => claim.status === "pass")?.verification ?? claims[0]?.verification ?? trace.hardTruth;
  if (status === "pass") return `${definition.recipient} can use this packet to answer: ${definition.question} Evidence: ${strongestProof}`;
  if (status === "watch") return `${definition.recipient} can review the packet, but should not treat it as final until the watch item is resolved. Evidence: ${strongestProof}`;
  return `${definition.recipient} should hold the decision. ${trace.hardTruth}`;
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

export function buildBuyerRoleDecisionPackets(trace: BuyerEvidenceTrace): BuyerRoleDecisionPacket[] {
  const claimById = new Map(trace.claims.map((claim) => [claim.id, claim]));

  return ROLE_DEFINITIONS.map((definition) => {
    const claims = definition.claimIds.map((id) => claimById.get(id)).filter((claim): claim is BuyerEvidenceTraceClaim => Boolean(claim));
    const missingCount = definition.claimIds.length - claims.length;
    const status = missingCount > 0 ? "block" : worstStatus(claims.map((claim) => claim.status));
    const firstOpenClaim = [...claims].sort((left, right) => statusWeight(left.status) - statusWeight(right.status)).find((claim) => claim.status !== "pass");
    const proofLines =
      claims.length > 0
        ? claims.map((claim) => `${claim.label}: ${claim.verification}`)
        : ["Required buyer evidence claims are missing from the trace."];

    return {
      id: definition.id,
      label: definition.label,
      recipient: definition.recipient,
      question: definition.question,
      status,
      headline: headlineFor(definition, status),
      answer: answerFor(definition, status, claims, trace),
      score: averageScore(claims, status),
      passCount: claims.filter((claim) => claim.status === "pass").length,
      totalCount: definition.claimIds.length,
      blockerCount: claims.filter((claim) => claim.status !== "pass").length + missingCount,
      proofLines,
      nextAction: firstOpenClaim?.nextAction ?? (missingCount > 0 ? "Repair the missing role evidence before sharing." : "Send this role packet with the public trace."),
      sendRule: sendRuleFor(status),
      links: uniqueLinks(claims)
    };
  });
}

function buildSingleRolePacketMarkdown(packet: BuyerRoleDecisionPacket, trace: BuyerEvidenceTrace, evidenceTraceHref: string) {
  return [
    `# ${packet.label} decision packet`,
    "",
    `Trace readiness: ${trace.readiness}`,
    `Recipient: ${packet.recipient}`,
    `Status: ${packet.status}`,
    `Score: ${packet.score}`,
    `Public trace: ${evidenceTraceHref}`,
    "",
    `Question: ${packet.question}`,
    `Answer: ${packet.answer}`,
    `Send rule: ${packet.sendRule}`,
    `Next action: ${packet.nextAction}`,
    "",
    "## Proof lines",
    ...packet.proofLines.map((line) => `- ${line}`),
    "",
    "## Links",
    ...(packet.links.length > 0 ? packet.links.map((link) => `- ${link.label}: ${link.href}`) : ["- No role-specific links are available."])
  ].join("\n");
}

export function buildBuyerRoleDecisionPacketsMarkdown(trace: BuyerEvidenceTrace, evidenceTraceHref: string) {
  const packets = buildBuyerRoleDecisionPackets(trace);
  return [
    "# Buyer role decision packets",
    "",
    `Trace readiness: ${trace.readiness}`,
    `Trace score: ${trace.score}`,
    `Public trace: ${evidenceTraceHref}`,
    "",
    ...packets.flatMap((packet) => [
      `## ${packet.label}`,
      `Recipient: ${packet.recipient}`,
      `Status: ${packet.status}`,
      `Question: ${packet.question}`,
      `Answer: ${packet.answer}`,
      `Send rule: ${packet.sendRule}`,
      `Next action: ${packet.nextAction}`,
      "Proof:",
      ...packet.proofLines.map((line) => `- ${line}`),
      ""
    ])
  ].join("\n");
}

export default function BuyerRoleDecisionPackets({
  evidenceTrace,
  evidenceTraceHref,
  onCopyText
}: {
  evidenceTrace: BuyerEvidenceTrace;
  evidenceTraceHref: string;
  onCopyText: (text: string) => Promise<boolean>;
}) {
  const packets = useMemo(() => buildBuyerRoleDecisionPackets(evidenceTrace), [evidenceTrace]);
  const [selectedRoleId, setSelectedRoleId] = useState<BuyerRoleDecisionPacketId>(packets[0]?.id ?? "economic-buyer");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const selectedPacket = packets.find((packet) => packet.id === selectedRoleId) ?? packets[0];
  const packetMarkdown = useMemo(() => buildBuyerRoleDecisionPacketsMarkdown(evidenceTrace, evidenceTraceHref), [evidenceTrace, evidenceTraceHref]);
  const packetHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(packetMarkdown)}`;
  const copyLabel = copyStatus === "copied" ? "Copied role packet" : copyStatus === "failed" ? "Copy failed" : "Copy role packet";
  const readyPackets = packets.filter((packet) => packet.status === "pass").length;

  useEffect(() => {
    if (packets.some((packet) => packet.id === selectedRoleId)) return;
    setSelectedRoleId(packets[0]?.id ?? "economic-buyer");
  }, [packets, selectedRoleId]);

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  async function copySelectedPacket() {
    const copied = await onCopyText(buildSingleRolePacketMarkdown(selectedPacket, evidenceTrace, evidenceTraceHref));
    setCopyStatus(copied ? "copied" : "failed");
  }

  return (
    <section className={cx("buyer-role-decision-packets", evidenceTrace.readiness)} aria-label="Buyer role decision packets">
      <div className="buyer-role-decision-head">
        <div className="buyer-role-decision-copy">
          <span>Role decision packet</span>
          <strong>Route the proof packet to each buyer reviewer</strong>
          <p>Each role gets a decision question, send rule, proof lines, links, and the next repair before forwarding.</p>
          <div className="buyer-role-decision-actions" aria-label="Buyer role packet actions">
            <a href={evidenceTraceHref} {...externalAttrs(evidenceTraceHref)}>
              <FileText size={13} />
              Public trace
            </a>
            <button className={cx(copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copySelectedPacket}>
              <ClipboardCheck size={13} />
              {copyLabel}
            </button>
            <a href={packetHref} download="buyer-role-decision-packets.md">
              <Download size={13} />
              Download packets
            </a>
          </div>
        </div>
        <div className="buyer-role-decision-score" aria-label="Buyer role packet score">
          <span>{evidenceTrace.readiness}</span>
          <strong>{readyPackets}/{packets.length}</strong>
          <small>{packets.reduce((sum, packet) => sum + packet.blockerCount, 0)} role blockers open</small>
        </div>
      </div>

      <div className="buyer-role-selector" aria-label="Buyer reviewer roles">
        {packets.map((packet) => (
          <button
            key={packet.id}
            className={cx("buyer-role-card", packet.status, packet.id === selectedPacket.id && "is-selected")}
            type="button"
            aria-pressed={packet.id === selectedPacket.id}
            onClick={() => setSelectedRoleId(packet.id)}
          >
            <span>{packet.status}</span>
            <strong>{packet.label}</strong>
            <p>{packet.passCount}/{packet.totalCount} claims ready. {packet.recipient}</p>
          </button>
        ))}
      </div>

      <div className="buyer-role-decision-body">
        <article className={cx("buyer-role-decision-detail", selectedPacket.status)} aria-label="Selected role decision packet">
          <span>{selectedPacket.label}</span>
          <strong>{selectedPacket.headline}</strong>
          <p>{selectedPacket.question}</p>
          <p>{selectedPacket.answer}</p>
          <p><strong>Send rule:</strong> {selectedPacket.sendRule}</p>
          <p><strong>Next action:</strong> {selectedPacket.nextAction}</p>
        </article>

        <aside className={cx("buyer-role-decision-proof", selectedPacket.status)} aria-label="Selected role proof lines">
          <span>Proof lines</span>
          <strong>{selectedPacket.passCount}/{selectedPacket.totalCount} required claims ready</strong>
          <ul>
            {selectedPacket.proofLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </aside>
      </div>

      <div className="buyer-role-decision-links" aria-label="Selected role evidence links">
        <span>Role links</span>
        <strong>Open the cited evidence before forwarding</strong>
        <div className="buyer-role-decision-link-list">
          {selectedPacket.links.map((link, index) => (
            <a key={`${link.label}-${link.href}`} href={link.href} {...externalAttrs(link.href)}>
              {index === 0 ? <ExternalLink size={12} /> : <Route size={12} />}
              {link.label}
            </a>
          ))}
        </div>
        {selectedPacket.links.length === 0 ? <small>No role-specific links are available.</small> : null}
      </div>
    </section>
  );
}
