import type { BuyerShareGate } from "./buyerShareGate";

export type MarketHeroUnlockMode = "send" | "review" | "hold";

function yen(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

export function MarketHeroUnlockBrief({
  shareGate,
  measuredMonthlyValueYen,
  proofReadyCount,
  proofItemCount,
  receiptAlgorithm,
  receiptChecksum
}: {
  shareGate: BuyerShareGate;
  measuredMonthlyValueYen: number;
  proofReadyCount: number;
  proofItemCount: number;
  receiptAlgorithm: string;
  receiptChecksum: string;
}) {
  const firstRepair = shareGate.repairPlan.items.find((item) => item.status === "block") ?? shareGate.repairPlan.items.find((item) => item.status === "watch") ?? null;
  const href = firstRepair?.href || shareGate.primaryActionHref;
  const external = /^https?:\/\//i.test(href);
  const owner = firstRepair?.owner ?? (shareGate.sendPacket.mode === "send" ? "Launch owner" : "Proof owner");
  const headline =
    shareGate.sendPacket.mode === "send"
      ? `${yen(measuredMonthlyValueYen)} measured value is ready for buyer review`
      : `${yen(measuredMonthlyValueYen)} measured value waits on ${firstRepair?.label ?? shareGate.primaryActionLabel}`;
  const summary = firstRepair ? `${firstRepair.owner}: ${firstRepair.action}` : shareGate.decision;
  const proofLine = `${proofReadyCount}/${proofItemCount} proof artifacts / ${shareGate.score}/100 send gate`;
  const receiptLine = `${receiptAlgorithm}:${receiptChecksum}`;

  return (
    <div className={`market-hero-unlock-brief is-${shareGate.sendPacket.mode}`} aria-label="Buyer-ready unlock brief">
      <div className="market-hero-unlock-copy">
        <span>Buyer-ready unlock</span>
        <strong>{headline}</strong>
        <small>{summary}</small>
      </div>
      <div className="market-hero-unlock-metrics" aria-label="Unlock proof metrics">
        <span>{proofLine}</span>
        <span>{receiptLine}</span>
      </div>
      <a className="market-hero-unlock-action" href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
        <span>Next owner</span>
        <strong>{owner}</strong>
        <small>{shareGate.primaryActionLabel}</small>
      </a>
    </div>
  );
}
