export type BuyerDecisionAgendaStatus = "ready" | "attention" | "blocked";

export type BuyerDecisionAgendaAction = {
  label: string;
  href: string;
  external: boolean;
};

export type BuyerDecisionAgendaItemId = "decision-request" | "commercial-boundary" | "proof-trust" | "stop-rule";

export type BuyerDecisionAgendaItem = {
  id: BuyerDecisionAgendaItemId;
  label: string;
  status: BuyerDecisionAgendaStatus;
  owner: string;
  outcome: string;
  evidence: string;
  href: string;
};

export type BuyerDecisionAgendaSnapshot = {
  status: BuyerDecisionAgendaStatus;
  decisionLabel: string;
  headline: string;
  summary: string;
  buyer: string;
  valueLine: string;
  sendSubject: string;
  firstAction: BuyerDecisionAgendaAction;
  readyCount: number;
  agendaTotal: number;
  items: BuyerDecisionAgendaItem[];
  noSendRules: string[];
  copyText: string;
  exportMarkdown: string;
};

export type BuyerDecisionAgendaBuildInput = {
  proofChain: {
    status: BuyerDecisionAgendaStatus;
    verdict: string;
    score: number;
    primaryAction: BuyerDecisionAgendaAction;
  };
  publicDecisionPath: {
    status: BuyerDecisionAgendaStatus;
    decision: "send-to-buyer" | "sponsor-review" | "hold-internal";
    headline: string;
    buyerLine: string;
    firstAction: BuyerDecisionAgendaAction;
    guardrails: string[];
  };
  pilotContract: {
    status: BuyerDecisionAgendaStatus;
    buyer: string;
    pilotOffer: string;
    firstCommitmentYen: number;
    expectedMonthlyValueYen: number;
    paybackDays: number;
    proofLine: string;
    stopRule: string;
    firstAction: BuyerDecisionAgendaAction;
    sendNote: {
      status: BuyerDecisionAgendaStatus;
      subject: string;
      instruction: string;
      body: string[];
    };
  };
  trustSnapshot: {
    status: BuyerDecisionAgendaStatus;
    trustScore: number;
    headline: string;
    dataBoundary: string;
    firstAction: BuyerDecisionAgendaAction;
  };
  commercialOffer: {
    status: BuyerDecisionAgendaStatus;
    recommendedTier: string;
    firstCommitmentYen: number;
    expectedMonthlyValueYen: number;
    paybackDays: number;
    contractLine: string;
    firstAction: BuyerDecisionAgendaAction;
  };
};

function yen(value: number) {
  return `${Math.round(value).toLocaleString("ja-JP")} yen`;
}

function worstStatus(statuses: BuyerDecisionAgendaStatus[]): BuyerDecisionAgendaStatus {
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("attention")) return "attention";
  return "ready";
}

function decisionLabel(decision: BuyerDecisionAgendaBuildInput["publicDecisionPath"]["decision"]) {
  if (decision === "send-to-buyer") return "Send to buyer";
  if (decision === "sponsor-review") return "Sponsor review";
  return "Hold internal";
}

function headlineFor(status: BuyerDecisionAgendaStatus) {
  if (status === "ready") return "Buyer decision agenda is ready";
  if (status === "attention") return "Sponsor review needs one owner before the buyer meeting";
  return "Hold the buyer meeting until blockers are closed";
}

function hrefIsExternal(href: string) {
  return /^https?:\/\//i.test(href);
}

function buildMarkdown(snapshot: Omit<BuyerDecisionAgendaSnapshot, "copyText" | "exportMarkdown">) {
  return [
    "# Buyer decision agenda",
    "",
    `Status: ${snapshot.status}`,
    `Decision: ${snapshot.decisionLabel}`,
    `Buyer: ${snapshot.buyer}`,
    `Value: ${snapshot.valueLine}`,
    `Send subject: ${snapshot.sendSubject}`,
    `First action: ${snapshot.firstAction.label} (${snapshot.firstAction.href})`,
    "",
    snapshot.summary,
    "",
    "## Agenda",
    ...snapshot.items.map((item) => `- [${item.status}] ${item.label} (${item.owner}): ${item.outcome} Evidence: ${item.evidence}`),
    "",
    "## No-send rules",
    ...snapshot.noSendRules.map((rule) => `- ${rule}`)
  ].join("\n");
}

export function buildBuyerDecisionAgendaSnapshot({
  proofChain,
  publicDecisionPath,
  pilotContract,
  trustSnapshot,
  commercialOffer
}: BuyerDecisionAgendaBuildInput): BuyerDecisionAgendaSnapshot {
  const proofTrustStatus = worstStatus([proofChain.status, trustSnapshot.status]);
  const items: BuyerDecisionAgendaItem[] = [
    {
      id: "decision-request",
      label: "Decision request",
      status: publicDecisionPath.status,
      owner: pilotContract.buyer || "Buyer sponsor",
      outcome: publicDecisionPath.headline,
      evidence: publicDecisionPath.buyerLine,
      href: publicDecisionPath.firstAction.href
    },
    {
      id: "commercial-boundary",
      label: "Commercial boundary",
      status: commercialOffer.status,
      owner: "Sponsor owner",
      outcome: commercialOffer.contractLine,
      evidence: `${commercialOffer.recommendedTier}: ${yen(commercialOffer.firstCommitmentYen)} first commitment, ${commercialOffer.paybackDays} day payback.`,
      href: commercialOffer.firstAction.href
    },
    {
      id: "proof-trust",
      label: "Proof and trust",
      status: proofTrustStatus,
      owner: "Proof owner",
      outcome: trustSnapshot.headline,
      evidence: `${proofChain.score}/100 proof score; ${trustSnapshot.trustScore}/100 trust score; ${trustSnapshot.dataBoundary}.`,
      href: trustSnapshot.status === "ready" ? proofChain.primaryAction.href : trustSnapshot.firstAction.href
    },
    {
      id: "stop-rule",
      label: "Stop rule",
      status: pilotContract.status,
      owner: pilotContract.buyer || "Buyer sponsor",
      outcome: pilotContract.stopRule,
      evidence: pilotContract.proofLine,
      href: pilotContract.firstAction.href
    }
  ];
  const status = worstStatus([...items.map((item) => item.status), pilotContract.sendNote.status]);
  const firstOpen = items.find((item) => item.status === "blocked") ?? items.find((item) => item.status === "attention");
  const valueLine = `${yen(pilotContract.expectedMonthlyValueYen)} expected monthly value, ${yen(pilotContract.firstCommitmentYen)} first commitment, ${pilotContract.paybackDays} day payback`;
  const noSendRules = Array.from(
    new Set([
      ...publicDecisionPath.guardrails.slice(0, 2),
      pilotContract.stopRule,
      proofChain.status === "ready" ? "" : `Do not send while proof chain is ${proofChain.status}.`,
      trustSnapshot.status === "ready" ? "" : `Do not send while trust review is ${trustSnapshot.status}.`
    ].filter(Boolean))
  );
  const partial: Omit<BuyerDecisionAgendaSnapshot, "copyText" | "exportMarkdown"> = {
    status,
    decisionLabel: decisionLabel(publicDecisionPath.decision),
    headline: headlineFor(status),
    summary:
      status === "ready"
        ? `${pilotContract.buyer} can decide on ${pilotContract.pilotOffer} with commercial terms, proof, trust, and stop rules attached.`
        : `${firstOpen?.label ?? "Buyer agenda"} is the first item to close before the meeting can be treated as buyer-ready.`,
    buyer: pilotContract.buyer || "Buyer sponsor",
    valueLine,
    sendSubject: pilotContract.sendNote.subject,
    firstAction: firstOpen
      ? {
          label: `${firstOpen.status === "blocked" ? "Fix" : "Review"} ${firstOpen.label}`,
          href: firstOpen.href,
          external: hrefIsExternal(firstOpen.href)
        }
      : {
          label: "Copy send note",
          href: pilotContract.firstAction.href,
          external: pilotContract.firstAction.external
        },
    readyCount: items.filter((item) => item.status === "ready").length,
    agendaTotal: items.length,
    items,
    noSendRules
  };
  const exportMarkdown = buildMarkdown(partial);

  return {
    ...partial,
    copyText: exportMarkdown,
    exportMarkdown
  };
}
