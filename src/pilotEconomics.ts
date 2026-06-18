import type { SquadContract } from "./contracts.js";
import type { ImpactCase, ImpactMetric } from "./impact.js";
import type { OpsDrill } from "./ops.js";
import type { SecurityReview } from "./security.js";
import type { WinningStrategy } from "./strategy.js";
import type { Recommendation } from "./types.js";
import type { UserPilotLab } from "./userPilot.js";

export type PilotEconomicsPosture = "investment-ready" | "needs-pilot-proof" | "not-economic";
export type PilotEconomicsStatus = "clear" | "watch" | "blocked";

export type UnitEconomics = {
  savedHoursPerCycle: number;
  assumedHourlyCostYen: number;
  avoidedLaborCostYen: number;
  riskAvoidanceYen: number;
  confidenceValueYen: number;
  monthlyValueYen: number;
  pilotCostYen: number;
  paybackDays: number;
  confidenceScore: number;
};

export type PilotEconomicsMetric = {
  id: string;
  label: string;
  value: number;
  unit: "yen" | "days" | "hours" | "score" | "percent";
  status: PilotEconomicsStatus;
  evidence: string;
};

export type PricingLane = {
  id: string;
  label: string;
  priceYen: number;
  targetBuyer: string;
  includes: string[];
  acceptance: string;
  status: PilotEconomicsStatus;
};

export type PilotMilestone = {
  id: string;
  horizon: string;
  owner: string;
  action: string;
  successMetric: string;
  proof: string;
  status: PilotEconomicsStatus;
};

export type BuyerObjection = {
  id: string;
  objection: string;
  answer: string;
  evidence: string;
  status: PilotEconomicsStatus;
};

export type PilotEconomicsAction = {
  id: string;
  priority: "now" | "next";
  owner: string;
  action: string;
  proof: string;
};

export type PilotEconomics = {
  id: string;
  economicsScore: number;
  posture: PilotEconomicsPosture;
  verdict: string;
  hardTruth: string;
  unitEconomics: UnitEconomics;
  metrics: PilotEconomicsMetric[];
  pricingLanes: PricingLane[];
  pilotPlan: PilotMilestone[];
  buyerObjections: BuyerObjection[];
  nextActions: PilotEconomicsAction[];
  a2aPayload: Record<string, unknown>;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function roundYen(value: number) {
  return Math.round(value / 1000) * 1000;
}

function statusFromScore(score: number): PilotEconomicsStatus {
  if (score >= 82) return "clear";
  if (score >= 62) return "watch";
  return "blocked";
}

function metricById(impactCase: ImpactCase, id: string) {
  return impactCase.metrics.find((metric) => metric.id === id);
}

function hoursSaved(metrics: ImpactMetric[]) {
  return round1(
    metrics
      .filter((metric) => metric.unit === "hours")
      .reduce((sum, metric) => sum + Math.max(0, metric.before - metric.after), 0)
  );
}

function criterionScore(strategy: WinningStrategy, id: string) {
  return strategy.judgeCriteria.find((criterion) => criterion.id === id)?.score ?? strategy.judgeScore;
}

function hasAgent(recommendation: Recommendation, id: string) {
  return recommendation.selected.some((agent) => agent.id === id);
}

function economicsPosture(input: {
  economicsScore: number;
  paybackDays: number;
  impactCase: ImpactCase;
  userPilot: UserPilotLab;
  securityReview: SecurityReview;
}): PilotEconomicsPosture {
  if (
    input.economicsScore < 70 ||
    input.paybackDays > 60 ||
    input.userPilot.readiness === "needs-redesign" ||
    input.securityReview.posture === "exposed"
  ) {
    return "not-economic";
  }
  if (input.economicsScore >= 86 && input.paybackDays <= 30 && input.impactCase.posture === "pilot-ready") {
    return "investment-ready";
  }
  return "needs-pilot-proof";
}

function actionFromObjection(objection: BuyerObjection): PilotEconomicsAction {
  return {
    id: objection.id,
    priority: objection.status === "blocked" ? "now" : "next",
    owner: objection.id === "security" ? "Security Sentinel" : objection.id === "adoption" ? "UX Guildmaster" : "A2A Market Broker",
    action:
      objection.status === "clear"
        ? `${objection.objection} への回答を審査動画とProtoPedia本文に固定する`
        : `${objection.objection} への証拠をPilot Economicsで補強する`,
    proof: objection.evidence
  };
}

export function buildPilotEconomics(input: {
  recommendation: Recommendation;
  strategy: WinningStrategy;
  impactCase: ImpactCase;
  userPilot: UserPilotLab;
  squadContract: SquadContract;
  opsDrill: OpsDrill;
  securityReview: SecurityReview;
}): PilotEconomics {
  const { recommendation, strategy, impactCase, userPilot, squadContract, opsDrill, securityReview } = input;
  const savedHoursPerCycle = hoursSaved(impactCase.metrics);
  const runtimeRisk = metricById(impactCase, "runtime-risk");
  const submissionConfidence = metricById(impactCase, "submission-confidence");
  const experienceValue = metricById(impactCase, "experience-value");
  const assumedHourlyCostYen = 9000;
  const cyclesPerMonth = 4;
  const avoidedLaborCostYen = roundYen(savedHoursPerCycle * assumedHourlyCostYen * cyclesPerMonth);
  const riskAvoidanceYen = roundYen(Math.max(0, runtimeRisk?.delta ?? 0) * 4000);
  const confidenceValueYen = roundYen(Math.max(0, submissionConfidence?.delta ?? 0) * 2500);
  const monthlyValueYen = roundYen(avoidedLaborCostYen + riskAvoidanceYen + confidenceValueYen);
  const pilotCostYen = roundYen(80000 + recommendation.budgetUsed * 2500 + squadContract.contracts.length * 12000);
  const paybackDays = Math.max(1, Math.ceil((pilotCostYen / Math.max(1, monthlyValueYen)) * 30));
  const confidenceScore = Math.round(
    clamp(
      average([
        impactCase.impactScore,
        userPilot.pilotScore,
        squadContract.contractScore,
        opsDrill.readinessScore,
        securityReview.securityScore,
        criterionScore(strategy, "practicality"),
        criterionScore(strategy, "usability")
      ])
    )
  );
  const paybackScore = clamp(120 - paybackDays);
  const marginScore = clamp((monthlyValueYen / Math.max(1, pilotCostYen)) * 64);
  const economicsScore = Math.round(
    clamp(average([impactCase.impactScore, userPilot.pilotScore, confidenceScore, paybackScore, marginScore, squadContract.contractScore]))
  );
  const posture = economicsPosture({ economicsScore, paybackDays, impactCase, userPilot, securityReview });
  const verdict =
    posture === "investment-ready"
      ? "Pilot investment case is ready"
      : posture === "needs-pilot-proof"
        ? "Economics are plausible, but need one measured pilot"
        : "Economics are not defensible yet";
  const hardTruth =
    posture === "investment-ready"
      ? `審査員には「${paybackDays}日で回収できる小さな導入実験」として説明できます。価値は月${monthlyValueYen.toLocaleString("ja-JP")}円相当、初期pilotは${pilotCostYen.toLocaleString("ja-JP")}円想定です。`
      : posture === "needs-pilot-proof"
        ? "採算仮説はありますが、実ユーザーの計測値を1本足さないと、導入判断としてはまだ弱いです。"
        : "現状では買い手の予算、回収日数、セキュリティ、初回利用のいずれかが弱く、MVPの実用性説明に耐えません。";

  const unitEconomics: UnitEconomics = {
    savedHoursPerCycle,
    assumedHourlyCostYen,
    avoidedLaborCostYen,
    riskAvoidanceYen,
    confidenceValueYen,
    monthlyValueYen,
    pilotCostYen,
    paybackDays,
    confidenceScore
  };

  const metrics: PilotEconomicsMetric[] = [
    {
      id: "saved-hours",
      label: "Saved hours / cycle",
      value: savedHoursPerCycle,
      unit: "hours",
      status: statusFromScore(clamp(savedHoursPerCycle * 9)),
      evidence: "Impact CaseのAI選定、提出証拠、委任手戻りの時間差分を合算。"
    },
    {
      id: "monthly-value",
      label: "Monthly value",
      value: monthlyValueYen,
      unit: "yen",
      status: statusFromScore(clamp((monthlyValueYen / Math.max(1, pilotCostYen)) * 86)),
      evidence: "時間短縮、公開デモ運用リスク低下、提出信頼度上昇を月次価値へ換算。"
    },
    {
      id: "pilot-cost",
      label: "Pilot cost",
      value: pilotCostYen,
      unit: "yen",
      status: recommendation.remainingBudget >= 0 ? "clear" : "blocked",
      evidence: `${recommendation.selected.length} selected agents; contract score ${squadContract.contractScore}; budget used ${recommendation.budgetUsed}.`
    },
    {
      id: "payback-days",
      label: "Payback",
      value: paybackDays,
      unit: "days",
      status: paybackDays <= 30 ? "clear" : paybackDays <= 60 ? "watch" : "blocked",
      evidence: "pilotCostYen / monthlyValueYen * 30で、審査用の保守的な回収日数を算出。"
    },
    {
      id: "confidence",
      label: "Evidence confidence",
      value: confidenceScore,
      unit: "score",
      status: statusFromScore(confidenceScore),
      evidence: "Impact、User Pilot、Contract、Ops、Security、審査基準を平均。"
    },
    {
      id: "experience-value",
      label: "Experience value",
      value: experienceValue?.after ?? impactCase.impactScore,
      unit: "score",
      status: statusFromScore(experienceValue?.after ?? impactCase.impactScore),
      evidence: experienceValue?.evidence ?? "Impact Caseの体験価値指標。"
    }
  ];

  const pricingLanes: PricingLane[] = [
    {
      id: "two-week-pilot",
      label: "2-week pilot",
      priceYen: pilotCostYen,
      targetBuyer: "ハッカソン提出者 / 小規模DevOpsチーム",
      includes: ["AI能力棚卸し", "A2A Agent Card検収", "Judge Proof/Acceptance Matrix", "Cloud Run公開証拠"],
      acceptance: "3 persona pathsが180秒以内、payback <= 30 days、外部URL不足をwatchとして可視化。",
      status: paybackDays <= 30 && userPilot.readiness !== "needs-redesign" ? "clear" : "watch"
    },
    {
      id: "team-retainer",
      label: "Team retainer",
      priceYen: roundYen(monthlyValueYen * 0.35),
      targetBuyer: "Platform/SRE・開発基盤チーム",
      includes: ["月次AI調達レビュー", "Ops Drill", "Release Drift Guard", "Security Sentinel Review"],
      acceptance: "Cloud Run公開証拠、CI、drift検知、rollback判断を毎回receipt化。",
      status: opsDrill.rollbackRecommended ? "watch" : "clear"
    },
    {
      id: "procurement-desk",
      label: "Procurement desk",
      priceYen: roundYen(monthlyValueYen * 0.55),
      targetBuyer: "AI導入を統制したい事業部",
      includes: ["Contract Desk", "Buyer objection handling", "Security boundary", "A2A delegation ledger"],
      acceptance: "契約、検収、支払い条件、セキュリティ境界を1つのA2A payloadで監査可能。",
      status: securityReview.posture === "exposed" ? "blocked" : "clear"
    }
  ];

  const pilotPlan: PilotMilestone[] = [
    {
      id: "baseline",
      horizon: "Day 0",
      owner: "A2A Market Broker",
      action: "既存のAI選定、証拠作成、委任手戻り時間をImpact Caseのbefore値で固定する。",
      successMetric: `${savedHoursPerCycle}h/cycle hypothesis locked`,
      proof: "/api/impact-case",
      status: impactCase.posture === "not-credible" ? "blocked" : "clear"
    },
    {
      id: "first-run",
      horizon: "Day 3",
      owner: "UX Guildmaster",
      action: "3 personaが最初の3分でMarketplace、Contract、Impact、Acceptanceを理解できるか測る。",
      successMetric: `${userPilot.timeToValueSeconds}s max time-to-value`,
      proof: "/api/user-pilot",
      status: userPilot.readiness === "needs-redesign" ? "blocked" : userPilot.readiness === "needs-guidance" ? "watch" : "clear"
    },
    {
      id: "economic-check",
      horizon: "Week 2",
      owner: "Contract Desk",
      action: "受入条件、支払い条件、security boundary、paybackを購入判断の形へ固定する。",
      successMetric: `${paybackDays}d payback / ${confidenceScore} confidence`,
      proof: "/api/pilot-economics",
      status: paybackDays <= 30 && confidenceScore >= 82 ? "clear" : "watch"
    },
    {
      id: "public-proof",
      horizon: "Before submit",
      owner: "Cloud Run SRE",
      action: "公開URL、Release Drift、Acceptance Matrix、Demo Receiptを審査直前に再実行する。",
      successMetric: `ops ${opsDrill.readinessScore} / security ${securityReview.securityScore}`,
      proof: "/api/release-drift + /api/acceptance-matrix",
      status: opsDrill.rollbackRecommended || securityReview.posture === "exposed" ? "blocked" : "clear"
    }
  ];

  const buyerObjections: BuyerObjection[] = [
    {
      id: "existing-tools",
      objection: "ADKやLangGraphで十分では？",
      answer: "既存ツールは作る/動かす基盤が強い一方、このMVPはどのAI能力を買うべきか、いくらで、何を検収するかを市場体験にしている。",
      evidence: `${strategy.competitors.length} competitors; moat ${strategy.moatScore}; market thesis: ${strategy.strategicThesis}`,
      status: statusFromScore(strategy.moatScore)
    },
    {
      id: "roi-assumption",
      objection: "ROIが机上の仮説では？",
      answer: "ROIではなくpilot economicsとして扱い、before/after時間、payback、受入条件、反論を審査員の前で再計算できるようにする。",
      evidence: `${savedHoursPerCycle}h saved/cycle; ${paybackDays}d payback; ${metrics.length} economic metrics.`,
      status: paybackDays <= 30 ? "clear" : paybackDays <= 60 ? "watch" : "blocked"
    },
    {
      id: "security",
      objection: "公開デモとして安全に導入できる？",
      answer: "Secret境界、IP allowlist、入力制限、A2A信頼境界、CIをSecurity Sentinel Reviewで見せる。",
      evidence: `${securityReview.posture}; security score ${securityReview.securityScore}.`,
      status: securityReview.posture === "guarded" ? "clear" : securityReview.posture === "watch" ? "watch" : "blocked"
    },
    {
      id: "adoption",
      objection: "初見ユーザーが使い切れる？",
      answer: "User Pilot Labで開発リード、Platform/SRE、提出者のfirst-run pathと摩擦を明示する。",
      evidence: `${userPilot.paths.length} paths; ${userPilot.readiness}; ${userPilot.timeToValueSeconds}s.`,
      status: userPilot.readiness === "pilot-ready" ? "clear" : userPilot.readiness === "needs-guidance" ? "watch" : "blocked"
    }
  ];

  const nextActions = [
    ...buyerObjections.filter((objection) => objection.status !== "clear").map(actionFromObjection),
    ...(hasAgent(recommendation, "ux-guildmaster")
      ? []
      : [
          {
            id: "hire-ux",
            priority: "next" as const,
            owner: "A2A Market Broker",
            action: "UX Guildmasterをstretch squadへ入れ、導入実験のfirst-run frictionを下げる。",
            proof: "Squad Optimizer stretch plan"
          }
        ])
  ];

  return {
    id: `pilot-economics-${economicsScore}-${posture}`,
    economicsScore,
    posture,
    verdict,
    hardTruth,
    unitEconomics,
    metrics,
    pricingLanes,
    pilotPlan,
    buyerObjections,
    nextActions,
    a2aPayload: {
      method: "message/send",
      skill: "pilot.economics",
      posture,
      economicsScore,
      unitEconomics,
      pricing: pricingLanes.map((lane) => ({
        id: lane.id,
        priceYen: lane.priceYen,
        status: lane.status
      })),
      pilotPlan: pilotPlan.map((milestone) => ({
        id: milestone.id,
        status: milestone.status,
        proof: milestone.proof
      })),
      buyerObjections: buyerObjections.map((objection) => ({
        id: objection.id,
        status: objection.status
      }))
    }
  };
}
