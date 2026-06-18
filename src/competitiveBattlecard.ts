import { sourceForMarketIntel, type MarketIntelComparison, type MarketIntelReport } from "./marketIntel.js";
import type { MoatStressScenario, MoatStressTest } from "./moatStress.js";
import type { SwotItem, SwotQuadrant, WinningStrategy } from "./strategy.js";

export type BattlecardReadiness = "judge-ready" | "needs-proof" | "exposed";
export type BattlecardStatus = "lead" | "parity" | "risk";

export type BattlecardSwotLink = {
  quadrant: SwotQuadrant;
  title: string;
  signal: SwotItem["signal"];
};

export type CompetitiveBattlecardCard = {
  id: string;
  competitor: string;
  category: string;
  threatLevel: string;
  status: BattlecardStatus;
  score: number;
  judgeQuestion: string;
  shortAnswer: string;
  whereTheyWin: string;
  whereWeWin: string;
  proofRoute: string;
  sourceUrls: Array<{ label: string; url: string }>;
  swotLinks: BattlecardSwotLink[];
  recordingCue: string;
};

export type CompetitiveBattlecardRisk = {
  id: string;
  severity: "high" | "medium" | "low";
  risk: string;
  response: string;
  proof: string;
};

export type CompetitiveObjectionReceipt = {
  id: string;
  competitor: string;
  status: BattlecardStatus;
  objection: string;
  swotSignal: BattlecardSwotLink;
  proofRoute: string;
  mvpUpgrade: string;
  recordingCue: string;
  protopediaLine: string;
  acceptance: string;
};

export type ObjectionReplayReadiness = "replay-ready" | "replay-watch" | "needs-counterproof";

export type CompetitiveObjectionReplayStep = {
  id: string;
  timeRange: string;
  screen: string;
  say: string;
  proofUrl: string;
  judgeSignal: string;
  status: "ready" | "watch" | "blocked";
};

export type CompetitiveObjectionReplay = {
  id: string;
  replayScore: number;
  readiness: ObjectionReplayReadiness;
  weakestCompetitor: string;
  openingObjection: string;
  lockedAnswer: string;
  sourceCount: number;
  swotSignalCount: number;
  proofRoute: string;
  protopediaLine: string;
  steps: CompetitiveObjectionReplayStep[];
};

export type CompetitiveBattlecard = {
  id: string;
  battleScore: number;
  readiness: BattlecardReadiness;
  headline: string;
  hardTruth: string;
  thesis: string;
  cards: CompetitiveBattlecardCard[];
  topRisks: CompetitiveBattlecardRisk[];
  swotReceipts: Array<BattlecardSwotLink & { detail: string }>;
  objectionReceipts: CompetitiveObjectionReceipt[];
  objectionReplay: CompetitiveObjectionReplay;
  judgeScript: string[];
  a2aPayload: Record<string, unknown>;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function battleStatus(score: number): BattlecardStatus {
  if (score >= 86) return "lead";
  if (score >= 74) return "parity";
  return "risk";
}

function readinessFor(score: number, scenarios: MoatStressScenario[]): BattlecardReadiness {
  if (score >= 86 && scenarios.every((scenario) => scenario.verdict !== "exposed")) return "judge-ready";
  if (score >= 74) return "needs-proof";
  return "exposed";
}

function scenarioFor(comparison: MarketIntelComparison, moatStress: MoatStressTest) {
  return moatStress.scenarios.find((scenario) => scenario.id === comparison.id);
}

function sourceUrls(comparison: MarketIntelComparison, marketIntel: MarketIntelReport) {
  return comparison.sourceIds
    .map((sourceId) => sourceForMarketIntel(sourceId) ?? marketIntel.sources.find((source) => source.id === sourceId))
    .filter((source): source is NonNullable<ReturnType<typeof sourceForMarketIntel>> => Boolean(source))
    .map((source) => ({ label: source.label, url: source.url }));
}

function swotLink(quadrant: SwotQuadrant, item: SwotItem): BattlecardSwotLink {
  return {
    quadrant,
    title: item.title,
    signal: item.signal
  };
}

function swotLinksFor(input: { comparison: MarketIntelComparison; strategy: WinningStrategy }): BattlecardSwotLink[] {
  const { comparison, strategy } = input;
  const competitorToken = comparison.competitor.split(" / ")[0];
  const threat =
    strategy.swot.threats.find((item) => item.title === comparison.competitor || item.title.includes(competitorToken)) ??
    strategy.swot.threats[0];
  const opportunity =
    strategy.swot.opportunities.find((item) => item.detail.includes("A2A") || item.title.includes("Marketplace")) ??
    strategy.swot.opportunities[0];
  const strength = strategy.swot.strengths[0];
  const weakness = strategy.swot.weaknesses[0];

  return [
    ...(strength ? [swotLink("strengths", strength)] : []),
    ...(opportunity ? [swotLink("opportunities", opportunity)] : []),
    ...(threat ? [swotLink("threats", threat)] : []),
    ...(weakness && comparison.threatLevel === "high" ? [swotLink("weaknesses", weakness)] : [])
  ];
}

function buildCard(input: {
  comparison: MarketIntelComparison;
  marketIntel: MarketIntelReport;
  moatStress: MoatStressTest;
  strategy: WinningStrategy;
}): CompetitiveBattlecardCard {
  const scenario = scenarioFor(input.comparison, input.moatStress);
  const sourceCoverage = input.comparison.sourceIds.length >= 2 ? 6 : 3;
  const threatPenalty = input.comparison.threatLevel === "high" ? 4 : input.comparison.threatLevel === "medium" ? 2 : 0;
  const scenarioScore = scenario?.score ?? input.moatStress.stressScore;
  const score = Math.round(clamp(average([scenarioScore, input.marketIntel.marketScore, input.strategy.moatScore]) + sourceCoverage - threatPenalty));

  return {
    id: input.comparison.id,
    competitor: input.comparison.competitor,
    category: input.comparison.category,
    threatLevel: input.comparison.threatLevel,
    status: battleStatus(score),
    score,
    judgeQuestion: scenario?.objection ?? `${input.comparison.competitor}で代替できるのでは？`,
    shortAnswer: scenario?.answer ?? `${input.comparison.ourCounter} ${input.comparison.demoProof}`,
    whereTheyWin: input.comparison.theyWinAt,
    whereWeWin: `${input.comparison.exposedGap} ${input.comparison.ourCounter}`,
    proofRoute: scenario?.proofToShow ?? input.comparison.demoProof,
    sourceUrls: sourceUrls(input.comparison, input.marketIntel),
    swotLinks: swotLinksFor({ comparison: input.comparison, strategy: input.strategy }),
    recordingCue: `${input.comparison.competitor}: ${scenario?.proofToShow ?? "Market Intel -> Live Evidenceで差分を見せる。"}`
  };
}

function buildTopRisks(cards: CompetitiveBattlecardCard[], moatStress: MoatStressTest): CompetitiveBattlecardRisk[] {
  return [...cards]
    .sort((left, right) => left.score - right.score)
    .slice(0, 3)
    .map((card) => {
      const scenario = moatStress.scenarios.find((item) => item.id === card.id);
      return {
        id: card.id,
        severity: card.status === "risk" || card.threatLevel === "high" ? "high" : card.status === "parity" ? "medium" : "low",
        risk: scenario?.residualRisk ?? `${card.competitor}との差分が動画内で薄く見える可能性。`,
        response: card.shortAnswer,
        proof: card.proofRoute
      };
    });
}

function buildSwotReceipts(strategy: WinningStrategy) {
  const quadrants: SwotQuadrant[] = ["strengths", "weaknesses", "opportunities", "threats"];
  return quadrants.flatMap((quadrant) =>
    strategy.swot[quadrant].slice(0, 2).map((item) => ({
      ...swotLink(quadrant, item),
      detail: item.detail
    }))
  );
}

function buildObjectionReceipts(cards: CompetitiveBattlecardCard[]): CompetitiveObjectionReceipt[] {
  return [...cards]
    .sort((left, right) => left.score - right.score)
    .map((card) => {
      const swotSignal = card.swotLinks.find((link) => link.quadrant === "threats") ?? card.swotLinks[0];
      const priorityVerb = card.status === "risk" ? "先頭で補強する" : card.status === "parity" ? "録画で証拠を開く" : "提出本文に固定する";
      return {
        id: card.id,
        competitor: card.competitor,
        status: card.status,
        objection: card.judgeQuestion,
        swotSignal: swotSignal ?? {
          quadrant: "threats",
          title: "競合差分の証拠不足",
          signal: "warning"
        },
        proofRoute: card.proofRoute,
        mvpUpgrade: `${card.competitor}への反論を${priorityVerb}: source ${card.sourceUrls.length}件、SWOT、proof routeを同じカードで開く。`,
        recordingCue: card.recordingCue,
        protopediaLine: `${card.competitor}は${card.category}領域で強い競合です。本作は既存基盤の置き換えではなく、AI能力の調達、A2A委任、Cloud Run上の検収証拠に焦点を当てます。`,
        acceptance: "審査質問に15秒で回答し、公式ソース、SWOTシグナル、公開証拠routeを同時に提示できる。"
      };
    });
}

function replayStatusForCard(card: CompetitiveBattlecardCard): CompetitiveObjectionReplayStep["status"] {
  if (card.status === "lead") return "ready";
  if (card.status === "parity") return "watch";
  return "blocked";
}

function replayReadiness(input: { score: number; steps: CompetitiveObjectionReplayStep[] }): ObjectionReplayReadiness {
  if (input.steps.some((step) => step.status === "blocked")) return "needs-counterproof";
  if (input.score >= 90) return "replay-ready";
  return "replay-watch";
}

function buildObjectionReplay(input: {
  baseUrl: string;
  battleScore: number;
  cards: CompetitiveBattlecardCard[];
  objectionReceipts: CompetitiveObjectionReceipt[];
}): CompetitiveObjectionReplay {
  const normalizedBase = input.baseUrl.replace(/\/$/, "");
  const weakest = [...input.cards].sort((left, right) => left.score - right.score)[0];
  const receipt = input.objectionReceipts.find((item) => item.id === weakest.id) ?? input.objectionReceipts[0];
  const sourceScore = weakest.sourceUrls.length >= 2 ? 100 : weakest.sourceUrls.length === 1 ? 88 : 50;
  const swotScore = weakest.swotLinks.length >= 3 ? 100 : weakest.swotLinks.length >= 2 ? 92 : 74;
  const proofRouteScore = weakest.proofRoute.length >= 30 ? 96 : 80;
  const cardStatusScore = weakest.status === "lead" ? 100 : weakest.status === "parity" ? 88 : 60;
  const replayScore = Math.round(clamp(average([input.battleScore, weakest.score, sourceScore, swotScore, proofRouteScore, cardStatusScore])));
  const steps: CompetitiveObjectionReplayStep[] = [
    {
      id: "objection",
      timeRange: "0-8s",
      screen: "Competitive Battlecard",
      say: weakest.judgeQuestion,
      proofUrl: `${normalizedBase}/api/competitive-battlecard`,
      judgeSignal: `${weakest.competitor} objection is named before the answer.`,
      status: replayStatusForCard(weakest)
    },
    {
      id: "source-ledger",
      timeRange: "8-16s",
      screen: "Market Intel",
      say: `${weakest.sourceUrls.length} official sources back the answer.`,
      proofUrl: `${normalizedBase}/api/market-intel`,
      judgeSignal: "Official source links are visible before the claim.",
      status: weakest.sourceUrls.length >= 2 ? "ready" : weakest.sourceUrls.length === 1 ? "watch" : "blocked"
    },
    {
      id: "swot-receipt",
      timeRange: "16-24s",
      screen: "Competitive Battlecard",
      say: `${receipt.swotSignal.quadrant}: ${receipt.swotSignal.title}`,
      proofUrl: `${normalizedBase}/api/competitive-battlecard`,
      judgeSignal: `${weakest.swotLinks.length} SWOT signals connect risk to strategy.`,
      status: weakest.swotLinks.length >= 3 ? "ready" : weakest.swotLinks.length >= 2 ? "watch" : "blocked"
    },
    {
      id: "proof-route",
      timeRange: "24-30s",
      screen: "Live Evidence",
      say: weakest.proofRoute,
      proofUrl: `${normalizedBase}/api/live-evidence`,
      judgeSignal: "The answer ends on runnable public proof, not a slide.",
      status: weakest.proofRoute.length >= 30 ? "ready" : "watch"
    }
  ];

  return {
    id: `objection-replay-${weakest.id}-${replayScore}`,
    replayScore,
    readiness: replayReadiness({ score: replayScore, steps }),
    weakestCompetitor: weakest.competitor,
    openingObjection: weakest.judgeQuestion,
    lockedAnswer: weakest.shortAnswer,
    sourceCount: weakest.sourceUrls.length,
    swotSignalCount: weakest.swotLinks.length,
    proofRoute: weakest.proofRoute,
    protopediaLine: receipt.protopediaLine,
    steps
  };
}

export function buildCompetitiveBattlecard(input: {
  baseUrl: string;
  strategy: WinningStrategy;
  marketIntel: MarketIntelReport;
  moatStress: MoatStressTest;
}): CompetitiveBattlecard {
  const normalizedBase = input.baseUrl.replace(/\/$/, "");
  const cards = input.marketIntel.comparisons.map((comparison) =>
    buildCard({
      comparison,
      marketIntel: input.marketIntel,
      moatStress: input.moatStress,
      strategy: input.strategy
    })
  );
  const sourceCoverage = (new Set(input.marketIntel.comparisons.flatMap((comparison) => comparison.sourceIds)).size / input.marketIntel.sources.length) * 100;
  const battleScore = Math.round(clamp(average([input.marketIntel.marketScore, input.moatStress.stressScore, input.strategy.moatScore, input.strategy.judgeScore, sourceCoverage])));
  const readiness = readinessFor(battleScore, input.moatStress.scenarios);
  const topRisks = buildTopRisks(cards, input.moatStress);
  const swotReceipts = buildSwotReceipts(input.strategy);
  const objectionReceipts = buildObjectionReceipts(cards);
  const objectionReplay = buildObjectionReplay({ baseUrl: normalizedBase, battleScore, cards, objectionReceipts });

  return {
    id: `competitive-battlecard-${battleScore}-${readiness}`,
    battleScore,
    readiness,
    headline:
      readiness === "judge-ready"
        ? "競合質問にそのまま出せるbattlecardです。強みを認め、調達体験と公開証拠へ戻せます。"
        : readiness === "needs-proof"
          ? "差別化は語れますが、動画では証拠routeを先に開かないと既存ツールに見えます。"
          : "競合に飲み込まれる危険があります。SWOTと反論証拠を補強してください。",
    hardTruth:
      "ADK、LangGraph、CrewAI、Dify、AgentOpsはいずれも本物の競合です。勝つには相手の強みを否定せず、AI能力を買い、A2Aで委任し、Cloud Runの証拠で検収する体験に焦点を固定する必要があります。",
    thesis: input.marketIntel.thesis,
    cards,
    topRisks,
    swotReceipts,
    objectionReceipts,
    objectionReplay,
    judgeScript: [
      "まず競合の強みを認める: 作る基盤、workflow、observabilityは既存ツールが強い。",
      `Objection Replayで${objectionReplay.weakestCompetitor}への質問を、source、SWOT、proof routeの30秒順に固定する。`,
      "次にずらす: このプロダクトはAI能力を選び、雇い、A2A委任し、DevOps証拠で検収する市場体験です。",
      "Battlecardで最も強い競合質問を1つ開き、source、SWOT、proof routeを同時に見せる。",
      "最後にLive EvidenceとRelease Driftで、公開Cloud Runが本当にその能力を返すかを確認する。"
    ],
    a2aPayload: {
      method: "message/send",
      skill: "competitive.battlecard",
      battleScore,
      readiness,
      cards: cards.map((card) => ({
        id: card.id,
        competitor: card.competitor,
        status: card.status,
        score: card.score,
        judgeQuestion: card.judgeQuestion,
        sourceCount: card.sourceUrls.length
      })),
      topRisks: topRisks.map((risk) => ({
        id: risk.id,
        severity: risk.severity,
        proof: risk.proof
      })),
      objectionReceipts: objectionReceipts.map((receipt) => ({
        id: receipt.id,
        status: receipt.status,
        swot: receipt.swotSignal.quadrant,
        proofRoute: receipt.proofRoute,
        acceptance: receipt.acceptance
      })),
      objectionReplay: {
        replayScore: objectionReplay.replayScore,
        readiness: objectionReplay.readiness,
        weakestCompetitor: objectionReplay.weakestCompetitor,
        sourceCount: objectionReplay.sourceCount,
        swotSignalCount: objectionReplay.swotSignalCount,
        steps: objectionReplay.steps.map((step) => ({ id: step.id, status: step.status, proofUrl: step.proofUrl }))
      },
      endpoints: {
        app: normalizedBase,
        competitiveBattlecard: `${normalizedBase}/api/competitive-battlecard`,
        marketIntel: `${normalizedBase}/api/market-intel`,
        moatStress: `${normalizedBase}/api/moat-stress`,
        agentCard: `${normalizedBase}/.well-known/agent-card.json`
      }
    }
  };
}
