import type { QuickExternalReviewDecisionReceiptReplacementCloseout } from "./quickExternalReviewDecisionReceipt.js";
import type { QuickBuyerEvidencePackSharePayload, QuickBuyerRoomPreviewStatus } from "./quickBuyerEvidenceShare";

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function quickBuyerEvidenceReceiptReplacementCloseoutFromPayload(value: unknown): QuickExternalReviewDecisionReceiptReplacementCloseout | null {
  if (!isPlainRecord(value) || !Array.isArray(value.items)) return null;
  const itemIsValid = (item: unknown): item is QuickExternalReviewDecisionReceiptReplacementCloseout["items"][number] =>
    isPlainRecord(item) &&
    typeof item.id === "string" &&
    typeof item.label === "string" &&
    (item.status === "ready" || item.status === "watch" || item.status === "blocked") &&
    typeof item.replacementHref === "string" &&
    typeof item.evidence === "string";
  if (!value.items.every(itemIsValid)) return null;
  const items = value.items;
  const readyCount = items.filter((item) => item.status === "ready").length;
  const watchCount = items.filter((item) => item.status === "watch").length;
  const missingCount = items.filter((item) => !item.replacementHref).length;
  const blockedCount = items.filter((item) => item.status === "blocked" && item.replacementHref).length;
  const canReopen = items.length === 0 || (readyCount === items.length && watchCount === 0 && blockedCount === 0 && missingCount === 0);
  const firstOpenItem = items.find((item) => item.status === "blocked") ?? items.find((item) => item.status === "watch") ?? null;
  const expectedStatus: QuickBuyerRoomPreviewStatus = canReopen ? "ready" : blockedCount > 0 || missingCount > 0 ? "blocked" : "watch";
  if (
    value.status !== expectedStatus ||
    value.slotTotal !== items.length ||
    value.readyCount !== readyCount ||
    value.watchCount !== watchCount ||
    value.blockedCount !== blockedCount ||
    value.missingCount !== missingCount ||
    value.canReopen !== canReopen ||
    value.firstOpenItemId !== (firstOpenItem?.id ?? "") ||
    typeof value.headline !== "string" ||
    typeof value.summary !== "string" ||
    typeof value.checkedAt !== "string"
  ) {
    return null;
  }
  return value as QuickExternalReviewDecisionReceiptReplacementCloseout;
}

export function quickBuyerEvidencePayloadWithReceiptReplacementCloseout(
  payload: QuickBuyerEvidencePackSharePayload,
  closeout?: QuickExternalReviewDecisionReceiptReplacementCloseout | null
): QuickBuyerEvidencePackSharePayload {
  if (!closeout?.canReopen) return payload;
  const itemById = new Map(closeout.items.map((item) => [item.id, item]));
  return {
    ...payload,
    status: "ready",
    label: "Replacement proof closeout ready",
    headline: "Buyer evidence pack reopened by replacement closeout",
    summary: `${closeout.readyCount}/${closeout.slotTotal} replacement proof URLs verified at ${closeout.checkedAt}. The buyer response can reference the closeout receipt before external send.`,
    sendRule: `Buyer send is reopened by the replacement closeout: ${closeout.readyCount}/${closeout.slotTotal} repair slots verified. Keep the closeout export and source verifier attached.`,
    firstAction: {
      label: "Open receipt verifier",
      href: payload.verifierHref
    },
    artifacts: payload.artifacts.map((artifact) => {
      const item = itemById.get(artifact.id);
      return {
        ...artifact,
        status: "ready",
        href: item?.replacementHref || artifact.href,
        proof: item ? `${artifact.proof} Replacement closeout: ${item.evidence}` : artifact.proof
      };
    })
  };
}
