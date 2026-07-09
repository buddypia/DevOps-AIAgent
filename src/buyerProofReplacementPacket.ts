import { isBuyerFacingProofUrl } from "./publicProofUrl.js";
import type { BuyerShareGateProofVerificationSummary } from "./buyerShareGate.js";
import type { WorkspaceDraft } from "./workspaceDraft.js";

export type BuyerProofReplacementStatus = "ready" | "attention" | "blocked";
export type BuyerProofReplacementMode = "send" | "verify" | "replace";
export type BuyerProofReplacementSlotId = "targetUrl" | "protopediaUrl" | "videoUrl" | "pilotEvidenceUrl" | "workOrderEvidenceUrl";
export type BuyerProofReplacementState = "own-public" | "unchecked" | "unstable" | "failed" | "missing" | "starter" | "private";
export const BUYER_PROOF_REPLACEMENT_RECEIPT_VERIFY_PATH = "/api/buyer-proof-replacement/receipt/verify";

export type BuyerProofReplacementAction = {
  label: string;
  href: string;
  external: boolean;
};

export type BuyerProofReplacementItem = {
  id: BuyerProofReplacementSlotId;
  label: string;
  owner: string;
  target: string;
  status: BuyerProofReplacementStatus;
  state: BuyerProofReplacementState;
  value: string;
  displayValue: string;
  evidence: string;
  action: string;
  acceptance: string;
  href: string;
};

export type BuyerProofReplacementSendStep = {
  id: "proof-rows" | "live-verification" | "buyer-review";
  label: string;
  status: BuyerProofReplacementStatus;
  detail: string;
};

export type BuyerProofReplacementSendPacket = {
  headline: string;
  detail: string;
  nextAction: string;
  steps: BuyerProofReplacementSendStep[];
};

export type BuyerProofReplacementHandoffAsset = {
  id: "launch-room" | "review-message" | "replay-receipt" | "proof-ledger";
  label: string;
  status: BuyerProofReplacementStatus;
  detail: string;
  href: string;
  action: string;
  external: boolean;
};

export type BuyerProofReplacementBuyerHandoff = {
  subject: string;
  preview: string;
  decisionRequest: string;
  copyText: string;
  assets: BuyerProofReplacementHandoffAsset[];
};

export type BuyerProofReplacementPacket = {
  packetId: string;
  status: BuyerProofReplacementStatus;
  mode: BuyerProofReplacementMode;
  headline: string;
  summary: string;
  readyCount: number;
  attentionCount: number;
  blockedCount: number;
  totalCount: number;
  primaryAction: BuyerProofReplacementAction;
  items: BuyerProofReplacementItem[];
  sendPacket: BuyerProofReplacementSendPacket;
  buyerHandoff: BuyerProofReplacementBuyerHandoff;
  reviewMessage: {
    subject: string;
    lines: string[];
    copyText: string;
  };
  csv: string;
  receipt: BuyerProofReplacementReceipt;
  copyText: string;
  exportMarkdown: string;
};

export type BuyerProofReplacementReceiptPayload = {
  receiptVersion: "buyer-proof-replacement.v1";
  packetId: string;
  status: BuyerProofReplacementStatus;
  mode: BuyerProofReplacementMode;
  headline: string;
  readyCount: number;
  attentionCount: number;
  blockedCount: number;
  totalCount: number;
  primaryActionLabel: string;
  primaryActionHref: string;
  reviewSubject: string;
  rows: Array<Pick<BuyerProofReplacementItem, "id" | "label" | "owner" | "status" | "state" | "value" | "action" | "acceptance" | "href">>;
  csvLedger: {
    filename: "buyer-proof-replacement-ledger.csv";
    rowCount: number;
    csvText: string;
  };
};

export type BuyerProofReplacementReceiptVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type BuyerProofReplacementReceipt = {
  receiptId: string;
  checksumAlgorithm: "fnv1a-64";
  checksum: string;
  verificationApiPath: typeof BUYER_PROOF_REPLACEMENT_RECEIPT_VERIFY_PATH;
  payload: BuyerProofReplacementReceiptPayload;
  payloadJson: string;
  payloadHref: string;
  verificationRequestJson: string;
  verificationRequestHref: string;
  verification: BuyerProofReplacementReceiptVerification;
  copyText: string;
  href: string;
};

export type BuyerProofReplacementPacketInput = {
  workspace: WorkspaceDraft;
  referenceWorkspace?: WorkspaceDraft;
  proofVerification: BuyerShareGateProofVerificationSummary | null;
  workflowIntakeHref: string;
  currentAuditHref: string;
  launchRoomHref: string;
};

type ProofSlot = {
  id: BuyerProofReplacementSlotId;
  label: string;
  owner: string;
  target: string;
};

const PROOF_SLOTS: ProofSlot[] = [
  { id: "targetUrl", label: "Live product", owner: "Proof owner", target: "A public deployed URL a buyer can open without credentials." },
  { id: "protopediaUrl", label: "ProtoPedia story", owner: "Submission owner", target: "A product story that explains the buyer workflow and proof." },
  { id: "videoUrl", label: "Walkthrough video", owner: "Submission owner", target: "A short walkthrough that shows the buyer-facing flow." },
  { id: "pilotEvidenceUrl", label: "Pilot receipt", owner: "Buyer sponsor", target: "A measured run receipt with reviewer, task acceptance, and outcome." },
  { id: "workOrderEvidenceUrl", label: "Work order proof", owner: "Buyer sponsor", target: "A public work order or issue that bounds the buyer request." }
];

function slotValue(workspace: WorkspaceDraft, id: BuyerProofReplacementSlotId) {
  if (id === "pilotEvidenceUrl") return workspace.pilotRun.evidenceUrl;
  if (id === "workOrderEvidenceUrl") return workspace.buyerWorkOrder.evidenceUrl;
  return workspace[id];
}

function sameAttachedValue(left: string, right: string) {
  const normalizedLeft = left.trim();
  const normalizedRight = right.trim();
  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
}

function isReferenceStarterSlot(id: BuyerProofReplacementSlotId) {
  return id === "targetUrl" || id === "pilotEvidenceUrl" || id === "workOrderEvidenceUrl";
}

function isStarterUrl(value: string) {
  if (!value.trim()) return false;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return url.pathname.startsWith("/sample/") || hostname === "sample.example" || hostname.endsWith(".sample.example");
  } catch {
    return /\/sample\//i.test(value);
  }
}

function worstStatus(statuses: BuyerProofReplacementStatus[]) {
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("attention")) return "attention";
  return "ready";
}

function hrefIsExternal(href: string) {
  return /^https?:\/\//i.test(href);
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(items: BuyerProofReplacementItem[]) {
  return [
    ["slot", "status", "state", "owner", "value", "action", "acceptance"].map(csvEscape).join(","),
    ...items.map((item) => [item.label, item.status, item.state, item.owner, item.value || "missing", item.action, item.acceptance].map(csvEscape).join(","))
  ].join("\n");
}

function fnv1a32(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => canonicalize(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)])
    );
  }
  return value;
}

function canonicalJson(value: unknown) {
  return JSON.stringify(canonicalize(value), null, 2);
}

function stableDigest(value: unknown) {
  const payload = JSON.stringify(canonicalize(value));
  let hash = 0xcbf29ce484222325n;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= BigInt(payload.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, "0");
}

export function buyerProofReplacementReceiptChecksum(payload: BuyerProofReplacementReceiptPayload) {
  return stableDigest(payload);
}

export function verifyBuyerProofReplacementReceipt(receipt: Pick<BuyerProofReplacementReceipt, "checksum" | "payload">): BuyerProofReplacementReceiptVerification {
  const actualChecksum = buyerProofReplacementReceiptChecksum(receipt.payload);
  const expectedChecksum = receipt.checksum.toLowerCase();
  const verified = actualChecksum === expectedChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Replacement packet checksum matches the attached replay payload."
      : "Replacement packet checksum does not match the attached replay payload. Do not accept this forwarded proof packet until the workspace is re-exported."
  };
}

function stateDisplay(state: BuyerProofReplacementState) {
  if (state === "own-public") return "Verified public proof";
  if (state === "unchecked") return "Public, not live-checked";
  if (state === "unstable") return "Needs live review";
  if (state === "failed") return "Live check failed";
  if (state === "missing") return "Missing";
  if (state === "starter") return "Reference proof";
  return "Not externally public";
}

function buildItem(input: {
  slot: ProofSlot;
  workspace: WorkspaceDraft;
  referenceWorkspace?: WorkspaceDraft;
  proofVerification: BuyerShareGateProofVerificationSummary | null;
  workflowIntakeHref: string;
  currentAuditHref: string;
}): BuyerProofReplacementItem {
  const value = slotValue(input.workspace, input.slot.id).trim();
  const referenceValue = input.referenceWorkspace ? slotValue(input.referenceWorkspace, input.slot.id) : "";
  const isReferenceValue = isReferenceStarterSlot(input.slot.id) && sameAttachedValue(value, referenceValue);
  const liveResult = input.proofVerification?.results.find((result) => result.id === input.slot.id);
  const acceptance = `${input.slot.label} is buyer-owned, public HTTPS, not a reference artifact, and passes the latest live proof check.`;

  if (!value) {
    return {
      ...input.slot,
      status: "blocked",
      state: "missing",
      value,
      displayValue: "Missing",
      evidence: `${input.slot.label} has not been attached to this workspace.`,
      action: `Attach a buyer-owned ${input.slot.label.toLowerCase()} URL.`,
      acceptance,
      href: input.workflowIntakeHref
    };
  }
  if (isReferenceValue || isStarterUrl(value)) {
    return {
      ...input.slot,
      status: "blocked",
      state: "starter",
      value,
      displayValue: "Reference proof",
      evidence: `${input.slot.label} still points at reference evidence.`,
      action: `Replace ${input.slot.label.toLowerCase()} with proof produced by this buyer workflow.`,
      acceptance,
      href: input.workflowIntakeHref
    };
  }
  if (!isBuyerFacingProofUrl(value)) {
    return {
      ...input.slot,
      status: "blocked",
      state: "private",
      value,
      displayValue: "Not public",
      evidence: `${input.slot.label} is not a public HTTPS URL.`,
      action: `Publish ${input.slot.label.toLowerCase()} at an HTTPS URL an external reviewer can open.`,
      acceptance,
      href: input.workflowIntakeHref
    };
  }
  if (!liveResult) {
    return {
      ...input.slot,
      status: "attention",
      state: "unchecked",
      value,
      displayValue: "Attached",
      evidence: `${input.slot.label} is public-shaped but has not been checked live in this workspace.`,
      action: "Run live proof verification before sending the buyer packet.",
      acceptance,
      href: input.currentAuditHref
    };
  }
  if (liveResult.status === "pass") {
    return {
      ...input.slot,
      status: "ready",
      state: "own-public",
      value,
      displayValue: "Verified",
      evidence: liveResult.evidence,
      action: "Keep attached and rerun verification after any URL change.",
      acceptance,
      href: input.currentAuditHref
    };
  }

  const status: BuyerProofReplacementStatus = liveResult.status === "watch" ? "attention" : "blocked";
  return {
    ...input.slot,
    status,
    state: liveResult.status === "watch" ? "unstable" : "failed",
    value,
    displayValue: liveResult.status === "watch" ? "Needs review" : "Failed check",
    evidence: liveResult.evidence,
    action: liveResult.action,
    acceptance,
    href: status === "attention" ? input.currentAuditHref : input.workflowIntakeHref
  };
}

function buildReviewMessage(input: { workspace: WorkspaceDraft; packetId: string; status: BuyerProofReplacementStatus; mode: BuyerProofReplacementMode; items: BuyerProofReplacementItem[] }) {
  const targetUser = input.workspace.buyerWorkOrder.targetUser.trim() || "buyer reviewer";
  const openItems = input.items.filter((item) => item.status !== "ready");
  const subject =
    input.mode === "send"
      ? `Buyer proof packet ready: ${targetUser}`
      : input.mode === "verify"
        ? `Buyer proof packet needs live verification: ${targetUser}`
        : `Proof replacement packet has ${openItems.length} open rows: ${targetUser}`;
  const lines = [
    `Packet ${input.packetId} is ${input.status}.`,
    input.mode === "send"
      ? "Please review the launch room and decide continue, revise, or stop."
      : input.mode === "verify"
        ? "The proof URLs are public-shaped; run live verification before external sharing."
        : "Do not send externally until blocked proof rows are replaced and attention rows are verified.",
    "Proof rows:",
    ...input.items.map((item) => `- ${item.label}: ${stateDisplay(item.state)}. ${item.action}`)
  ];

  return {
    subject,
    lines,
    copyText: [`Subject: ${subject}`, "", ...lines].join("\n")
  };
}

function buildSendPacket(input: { mode: BuyerProofReplacementMode; items: BuyerProofReplacementItem[]; primaryAction: BuyerProofReplacementAction }) {
  const blockedCount = input.items.filter((item) => item.status === "blocked").length;
  const attentionCount = input.items.filter((item) => item.status === "attention").length;
  const readyCount = input.items.filter((item) => item.status === "ready").length;
  const totalCount = input.items.length;
  const proofRowsStatus: BuyerProofReplacementStatus = blockedCount > 0 ? "blocked" : "ready";
  const liveVerificationStatus: BuyerProofReplacementStatus = input.mode === "send" ? "ready" : input.mode === "verify" ? "attention" : "blocked";
  const buyerReviewStatus: BuyerProofReplacementStatus = input.mode === "send" ? "ready" : "blocked";

  return {
    headline:
      input.mode === "send"
        ? "Buyer send packet is ready"
        : input.mode === "verify"
          ? "Buyer send packet needs live proof"
          : "Buyer send packet is blocked",
    detail:
      input.mode === "send"
        ? "Send the launch room with verified proof rows, replay receipt, and a clear continue/revise/stop request."
        : input.mode === "verify"
          ? "All proof rows are public-shaped. Run live verification before asking the buyer to decide."
          : `${blockedCount + attentionCount} proof row${blockedCount + attentionCount === 1 ? "" : "s"} must close before buyer review.`,
    nextAction: input.primaryAction.label,
    steps: [
      {
        id: "proof-rows" as const,
        label: "Proof rows",
        status: proofRowsStatus,
        detail:
          blockedCount > 0
            ? `${blockedCount} proof row${blockedCount === 1 ? "" : "s"} still need buyer-owned replacement.`
            : `${totalCount} buyer-owned proof row${totalCount === 1 ? "" : "s"} are attached.`
      },
      {
        id: "live-verification" as const,
        label: "Live verification",
        status: liveVerificationStatus,
        detail:
          input.mode === "send"
            ? `${readyCount}/${totalCount} proof row${totalCount === 1 ? "" : "s"} passed live checks.`
            : input.mode === "verify"
              ? "Run live verification from this packet to make it sendable."
              : "Live verification unlocks after blocked proof rows are replaced."
      },
      {
        id: "buyer-review" as const,
        label: "Buyer review",
        status: buyerReviewStatus,
        detail:
          input.mode === "send"
            ? "Open the launch room and ask for continue, revise, or stop."
            : input.mode === "verify"
              ? "Hold the buyer request until live verification passes."
              : "Hold external sharing until replacement and verification are done."
      }
    ]
  };
}

type BuyerProofReplacementPacketBase = Omit<BuyerProofReplacementPacket, "receipt" | "buyerHandoff" | "copyText" | "exportMarkdown">;

function buildReceiptMarkdown(receipt: Omit<BuyerProofReplacementReceipt, "copyText" | "href">) {
  return [
    "# Buyer proof replacement receipt",
    "",
    `Receipt: ${receipt.receiptId}`,
    `Checksum: ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    `Packet: ${receipt.payload.packetId}`,
    `Mode: ${receipt.payload.mode}`,
    `Rows: ${receipt.payload.readyCount}/${receipt.payload.totalCount} ready, ${receipt.payload.blockedCount} blocked, ${receipt.payload.attentionCount} attention`,
    "",
    "## Replay payload",
    "```json",
    receipt.payloadJson,
    "```",
    "",
    "## Verification",
    `- Status: ${receipt.verification.status}`,
    `- Expected checksum: ${receipt.verification.expectedChecksum}`,
    `- Actual checksum: ${receipt.verification.actualChecksum}`,
    `- Instruction: ${receipt.verification.instruction}`,
    "",
    "## API verification",
    `POST ${receipt.verificationApiPath}`,
    "",
    "Request body:",
    "```json",
    receipt.verificationRequestJson,
    "```",
    "",
    "Replay rule: Recompute fnv1a-64 over the replacement replay payload before accepting a forwarded proof packet."
  ].join("\n");
}

export function buildBuyerProofReplacementReceipt(packet: BuyerProofReplacementPacketBase): BuyerProofReplacementReceipt {
  const payload: BuyerProofReplacementReceiptPayload = {
    receiptVersion: "buyer-proof-replacement.v1",
    packetId: packet.packetId,
    status: packet.status,
    mode: packet.mode,
    headline: packet.headline,
    readyCount: packet.readyCount,
    attentionCount: packet.attentionCount,
    blockedCount: packet.blockedCount,
    totalCount: packet.totalCount,
    primaryActionLabel: packet.primaryAction.label,
    primaryActionHref: packet.primaryAction.href,
    reviewSubject: packet.reviewMessage.subject,
    rows: packet.items.map((item) => ({
      id: item.id,
      label: item.label,
      owner: item.owner,
      status: item.status,
      state: item.state,
      value: item.value,
      action: item.action,
      acceptance: item.acceptance,
      href: item.href
    })),
    csvLedger: {
      filename: "buyer-proof-replacement-ledger.csv",
      rowCount: packet.items.length,
      csvText: packet.csv
    }
  };
  const checksum = buyerProofReplacementReceiptChecksum(payload);
  const payloadJson = canonicalJson(payload);
  const verificationRequestJson = canonicalJson({ checksum, payload });
  const verification = verifyBuyerProofReplacementReceipt({ checksum, payload });
  const partial: Omit<BuyerProofReplacementReceipt, "copyText" | "href"> = {
    receiptId: `buyer-proof-replacement-${payload.mode}-${checksum.slice(0, 12)}`,
    checksumAlgorithm: "fnv1a-64",
    checksum,
    verificationApiPath: BUYER_PROOF_REPLACEMENT_RECEIPT_VERIFY_PATH,
    payload,
    payloadJson,
    payloadHref: `data:application/json;charset=utf-8,${encodeURIComponent(payloadJson)}`,
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verification
  };
  const copyText = buildReceiptMarkdown(partial);

  return {
    ...partial,
    copyText,
    href: `data:text/markdown;charset=utf-8,${encodeURIComponent(copyText)}`
  };
}

function buildBuyerHandoff(packet: BuyerProofReplacementPacketBase & { receipt: BuyerProofReplacementReceipt }): BuyerProofReplacementBuyerHandoff {
  const targetBuyer = packet.receipt.payload.reviewSubject.replace(/^Buyer proof packet (?:ready|needs live verification):\s*/i, "").replace(/^Proof replacement packet has \d+ open rows:\s*/i, "");
  const sendable = packet.mode === "send";
  const assetStatus: BuyerProofReplacementStatus = packet.mode === "send" ? "ready" : packet.mode === "verify" ? "attention" : "blocked";
  const verificationLine = sendable
    ? `${packet.readyCount}/${packet.totalCount} proof links passed live checks.`
    : packet.mode === "verify"
      ? `${packet.attentionCount} proof links still need live verification.`
      : `${packet.blockedCount} proof links still need replacement.`;
  const subject = sendable ? `Buyer launch room ready: ${targetBuyer}` : `Hold buyer launch room: ${targetBuyer}`;
  const decisionRequest = sendable
    ? "Please review the launch room and reply with continue, revise, or stop."
    : "Keep this packet internal until replacement rows close and live verification passes.";
  const preview = sendable
    ? `Launch room, verified proof rows, replay receipt, and proof ledger are ready for ${targetBuyer}.`
    : `${packet.blockedCount + packet.attentionCount} proof row${packet.blockedCount + packet.attentionCount === 1 ? "" : "s"} still block buyer sharing.`;
  const assets: BuyerProofReplacementHandoffAsset[] = [
    {
      id: "launch-room",
      label: "Launch room",
      status: assetStatus,
      detail: sendable ? "Buyer can open the launch room from the handoff." : "Do not share the launch room externally from this packet yet.",
      href: packet.primaryAction.href,
      action: sendable ? "Open launch room" : packet.primaryAction.label,
      external: packet.primaryAction.external
    },
    {
      id: "review-message",
      label: "Review message",
      status: assetStatus,
      detail: packet.reviewMessage.lines[1],
      href: packet.primaryAction.href,
      action: sendable ? "Copy buyer handoff" : "Copy internal hold note",
      external: packet.primaryAction.external
    },
    {
      id: "replay-receipt",
      label: "Replay receipt",
      status: assetStatus,
      detail: `${packet.receipt.checksumAlgorithm}:${packet.receipt.checksum}`,
      href: packet.receipt.href,
      action: "Download receipt",
      external: false
    },
    {
      id: "proof-ledger",
      label: "Proof ledger",
      status: assetStatus,
      detail: `${packet.totalCount} rows, ${packet.readyCount} ready, ${packet.blockedCount} blocked, ${packet.attentionCount} attention.`,
      href: `data:text/csv;charset=utf-8,${encodeURIComponent(packet.csv)}`,
      action: "Export CSV",
      external: false
    }
  ];
  const copyText = [
    `Subject: ${subject}`,
    "",
    preview,
    "",
    `Launch room: ${sendable ? packet.primaryAction.href : "not ready for external sharing"}`,
    `Decision request: ${decisionRequest}`,
    `Proof verification: ${verificationLine}`,
    `Replay receipt: ${packet.receipt.receiptId}`,
    `Checksum: ${packet.receipt.checksumAlgorithm}:${packet.receipt.checksum}`,
    `Verification API: POST ${packet.receipt.verificationApiPath}`,
    "",
    "Delivery assets:",
    ...assets.map((asset) => `- [${asset.status}] ${asset.label}: ${asset.detail} ${asset.action}: ${asset.href}`),
    "",
    sendable
      ? "Guardrail: if any proof URL changes, rerun live verification and re-export this handoff before forwarding."
      : "Guardrail: do not forward this packet to the buyer until the send packet says ready."
  ].join("\n");

  return {
    subject,
    preview,
    decisionRequest,
    copyText,
    assets
  };
}

function buildMarkdown(packet: BuyerProofReplacementPacketBase & { receipt: BuyerProofReplacementReceipt; buyerHandoff: BuyerProofReplacementBuyerHandoff }) {
  return [
    "# Buyer proof replacement packet",
    "",
    `Packet: ${packet.packetId}`,
    `Status: ${packet.status}`,
    `Mode: ${packet.mode}`,
    `Primary action: ${packet.primaryAction.label} (${packet.primaryAction.href})`,
    `Proof rows: ${packet.readyCount}/${packet.totalCount} ready`,
    "",
    packet.summary,
    "",
    "## Replacement table",
    ...packet.items.map((item) => `- [${item.status}] ${item.label}: ${item.displayValue}. Owner: ${item.owner}. Next: ${item.action} Acceptance: ${item.acceptance}`),
    "",
    "## Buyer review message",
    packet.reviewMessage.copyText,
    "",
    "## Send packet",
    packet.sendPacket.headline,
    packet.sendPacket.detail,
    `Next action: ${packet.sendPacket.nextAction}`,
    ...packet.sendPacket.steps.map((step) => `- [${step.status}] ${step.label}: ${step.detail}`),
    "",
    "## Buyer handoff",
    `Subject: ${packet.buyerHandoff.subject}`,
    packet.buyerHandoff.preview,
    `Decision request: ${packet.buyerHandoff.decisionRequest}`,
    ...packet.buyerHandoff.assets.map((asset) => `- [${asset.status}] ${asset.label}: ${asset.detail} ${asset.action}: ${asset.href}`),
    "",
    "## Verification receipt",
    `Receipt: ${packet.receipt.receiptId}`,
    `Checksum: ${packet.receipt.checksumAlgorithm}:${packet.receipt.checksum}`,
    `API verification: POST ${packet.receipt.verificationApiPath}`,
    "",
    "## CSV ledger",
    "```csv",
    packet.csv,
    "```"
  ].join("\n");
}

export function buildBuyerProofReplacementPacket(input: BuyerProofReplacementPacketInput): BuyerProofReplacementPacket {
  const items = PROOF_SLOTS.map((slot) =>
    buildItem({
      slot,
      workspace: input.workspace,
      referenceWorkspace: input.referenceWorkspace,
      proofVerification: input.proofVerification,
      workflowIntakeHref: input.workflowIntakeHref,
      currentAuditHref: input.currentAuditHref
    })
  );
  const status = worstStatus(items.map((item) => item.status));
  const readyCount = items.filter((item) => item.status === "ready").length;
  const attentionCount = items.filter((item) => item.status === "attention").length;
  const blockedCount = items.filter((item) => item.status === "blocked").length;
  const mode: BuyerProofReplacementMode = blockedCount > 0 ? "replace" : attentionCount > 0 ? "verify" : "send";
  const firstOpen = items.find((item) => item.status === "blocked") ?? items.find((item) => item.status === "attention");
  const primaryAction = firstOpen
    ? {
        label: `${firstOpen.status === "blocked" ? "Replace" : "Verify"} ${firstOpen.label}`,
        href: firstOpen.href,
        external: hrefIsExternal(firstOpen.href)
      }
    : {
        label: "Open launch room",
        href: input.launchRoomHref,
        external: hrefIsExternal(input.launchRoomHref)
      };
  const fingerprintSource = JSON.stringify(items.map((item) => [item.id, item.status, item.state, item.value]));
  const packetId = `proof-replacement-${fnv1a32(fingerprintSource)}`;
  const csv = toCsv(items);
  const partial: BuyerProofReplacementPacketBase = {
    packetId,
    status,
    mode,
    headline:
      mode === "send"
        ? "Buyer proof packet is ready to send"
        : mode === "verify"
          ? "Proof URLs are attached; verify them live"
          : "Replace proof rows before buyer sharing",
    summary:
      mode === "send"
        ? "All five proof rows are buyer-owned public URLs with passing live checks, so the packet can move into launch-room review."
        : mode === "verify"
          ? `${attentionCount} proof row${attentionCount === 1 ? "" : "s"} need live verification before the packet is safe to send.`
          : `${blockedCount + attentionCount} proof row${blockedCount + attentionCount === 1 ? "" : "s"} are still open: ${blockedCount} replacement and ${attentionCount} verification.`,
    readyCount,
    attentionCount,
    blockedCount,
    totalCount: items.length,
    primaryAction,
    items,
    sendPacket: buildSendPacket({ mode, items, primaryAction }),
    reviewMessage: buildReviewMessage({ workspace: input.workspace, packetId, status, mode, items }),
    csv
  };
  const receipt = buildBuyerProofReplacementReceipt(partial);
  const buyerHandoff = buildBuyerHandoff({ ...partial, receipt });
  const exportMarkdown = buildMarkdown({ ...partial, receipt, buyerHandoff });

  return {
    ...partial,
    receipt,
    buyerHandoff,
    copyText: exportMarkdown,
    exportMarkdown
  };
}
