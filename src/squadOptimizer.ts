import { recommendSquad } from "./agentEngine.js";
import { MARKET_AGENTS } from "./market.js";
import { buildWinningStrategy, type JudgeCriterion } from "./strategy.js";
import type { MarketAgent, Recommendation, SquadScore } from "./types.js";

export type SquadOptimizerReadiness = "optimized" | "worth-swapping" | "needs-more-budget";

export type SquadCoverageGate = {
  id: string;
  label: string;
  met: boolean;
  evidence: string;
};

export type OptimizedSquadAgent = {
  id: string;
  name: string;
  handle: string;
  price: number;
  stage: MarketAgent["stage"];
};

export type OptimizedSquadCandidate = {
  id: string;
  rank: number;
  agentIds: string[];
  agents: OptimizedSquadAgent[];
  totalPrice: number;
  remainingBudget: number;
  judgeScore: number;
  mvpScore: number;
  moatScore: number;
  squadScore: SquadScore;
  coverageScore: number;
  budgetFitScore: number;
  totalScore: number;
  usabilityScore: number;
  implementationScore: number;
  weakestCriterion: Pick<JudgeCriterion, "id" | "label" | "score" | "nextAction">;
  coverage: SquadCoverageGate[];
  strengths: string[];
  tradeoffs: string[];
};

export type SquadSwapStep = {
  id: string;
  action: "keep" | "add" | "remove" | "fund";
  label: string;
  reason: string;
  scoreImpact: string;
};

export type SquadOptimizerRule = {
  id: string;
  label: string;
  weight: number;
  evidence: string;
};

export type SquadOptimizerDelta = {
  totalScore: number;
  judgeScore: number;
  usability: number;
  implementation: number;
  coverageScore: number;
  budgetUsed: number;
};

export type SquadOptimizerRun = {
  id: string;
  optimizerScore: number;
  readiness: SquadOptimizerReadiness;
  budget: number;
  maxSquadSize: number;
  headline: string;
  hardTruth: string;
  current: OptimizedSquadCandidate;
  recommended: OptimizedSquadCandidate;
  stretch: OptimizedSquadCandidate | null;
  budgetGap: number;
  alternatives: OptimizedSquadCandidate[];
  delta: SquadOptimizerDelta;
  swapPlan: SquadSwapStep[];
  decisionRules: SquadOptimizerRule[];
  a2aPayload: Record<string, unknown>;
};

const COVERAGE_GATES: Array<{
  id: string;
  label: string;
  agentIds: string[];
  evidence: string;
}> = [
  {
    id: "a2a-market",
    label: "A2A marketplace broker",
    agentIds: ["market-broker"],
    evidence: "Agent Card discovery, negotiation, and message/send delegation stay visible."
  },
  {
    id: "google-ai",
    label: "Google AI strategist",
    agentIds: ["gemini-strategist"],
    evidence: "Gemini API analysis remains part of the winning story."
  },
  {
    id: "cloud-run",
    label: "Cloud Run runtime owner",
    agentIds: ["cloud-run-sre"],
    evidence: "The deployed URL, health checks, and rollback story remain covered."
  },
  {
    id: "first-run-ux",
    label: "First-run UX owner",
    agentIds: ["ux-guildmaster", "brief-cartographer"],
    evidence: "The first 90 seconds and target-user paths have a named owner."
  },
  {
    id: "devops-feedback",
    label: "DevOps feedback loop",
    agentIds: ["cloud-run-sre", "observability-oracle", "test-forge", "security-sentinel"],
    evidence: "The squad can turn CI, security, or runtime signals into the next decision."
  }
];

const DECISION_RULES: SquadOptimizerRule[] = [
  {
    id: "judge-fit",
    label: "Hackathon judge fit",
    weight: 28,
    evidence: "審査5項目の平均点を最重視する。"
  },
  {
    id: "must-have-coverage",
    label: "Required story coverage",
    weight: 22,
    evidence: "A2A、Gemini、Cloud Run、UX、DevOps feedbackを崩さない。"
  },
  {
    id: "moat",
    label: "A2A marketplace moat",
    weight: 15,
    evidence: "既存フレームワークとの違いを、調達体験として説明できるか。"
  },
  {
    id: "mvp-proof",
    label: "MVP proof gates",
    weight: 10,
    evidence: "提出3点、CI、Cloud Run、Agent Cardの証拠を維持する。"
  },
  {
    id: "base-squad-score",
    label: "Base capability score",
    weight: 10,
    evidence: "企画、配送、信頼性、UX、統制の能力平均を見る。"
  },
  {
    id: "weak-lane-lift",
    label: "Weak-lane lift",
    weight: 12,
    evidence: "ユーザビリティと実装力の穴を追加で補正する。"
  },
  {
    id: "budget-fit",
    label: "Budget fit",
    weight: 3,
    evidence: "同点なら予算余力が残る編成を優先する。"
  }
];

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sameIds(left: string[], right: string[]) {
  const a = [...left].sort();
  const b = [...right].sort();
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

function combinations<T>(items: T[], maxSize: number) {
  const result: T[][] = [];

  function walk(start: number, picked: T[]) {
    if (picked.length > 0) result.push(picked);
    if (picked.length === maxSize) return;

    for (let index = start; index < items.length; index += 1) {
      walk(index + 1, [...picked, items[index]]);
    }
  }

  walk(0, []);
  return result;
}

function coverageFor(agentIds: string[]): SquadCoverageGate[] {
  return COVERAGE_GATES.map((gate) => {
    const met = gate.agentIds.some((id) => agentIds.includes(id));
    return {
      id: gate.id,
      label: gate.label,
      met,
      evidence: met ? gate.evidence : `${gate.label} is not covered by the current squad.`
    };
  });
}

function criterionScore(criteria: JudgeCriterion[], id: string) {
  return criteria.find((criterion) => criterion.id === id)?.score ?? 0;
}

function candidateStrengths(input: {
  recommendation: Recommendation;
  coverage: SquadCoverageGate[];
  judgeScore: number;
  moatScore: number;
  mvpScore: number;
}) {
  const strengths = input.coverage.filter((gate) => gate.met).map((gate) => gate.label);
  const scoreStrengths = [
    input.judgeScore >= 82 ? `Judge fit ${input.judgeScore}` : "",
    input.moatScore >= 84 ? `Moat ${input.moatScore}` : "",
    input.mvpScore >= 80 ? `MVP gates ${input.mvpScore}` : "",
    input.recommendation.after.total >= 76 ? `Capability total ${input.recommendation.after.total}` : ""
  ].filter(Boolean);
  return [...strengths.slice(0, 3), ...scoreStrengths].slice(0, 5);
}

function candidateTradeoffs(input: {
  coverage: SquadCoverageGate[];
  weakestCriterion: JudgeCriterion;
  totalPrice: number;
  budget: number;
}) {
  const missing = input.coverage
    .filter((gate) => !gate.met)
    .map((gate) => `${gate.label} missing`);
  const tradeoffs = [
    ...missing,
    input.weakestCriterion.score < 82 ? `${input.weakestCriterion.label}: ${input.weakestCriterion.nextAction}` : "",
    input.totalPrice > input.budget ? `Budget overshoot ${input.totalPrice - input.budget}` : ""
  ].filter(Boolean);

  return tradeoffs.length > 0 ? tradeoffs.slice(0, 4) : ["No major tradeoff under the current scoring model."];
}

function buildCandidate(projectBrief: string, agentIds: string[], budget: number, rank = 0): OptimizedSquadCandidate {
  const recommendation = recommendSquad(projectBrief, agentIds, budget);
  const strategy = buildWinningStrategy(recommendation);
  const sortedCriteria = [...strategy.judgeCriteria].sort((left, right) => left.score - right.score);
  const weakestCriterion = sortedCriteria[0];
  const coverage = coverageFor(recommendation.selected.map((agent) => agent.id));
  const coverageScore = Math.round((coverage.filter((gate) => gate.met).length / coverage.length) * 100);
  const totalPrice = recommendation.selected.reduce((sum, agent) => sum + agent.price, 0);
  const budgetFitScore = totalPrice <= budget && budget > 0 ? Math.round(clamp((1 - totalPrice / budget) * 100)) : 0;
  const usabilityScore = criterionScore(strategy.judgeCriteria, "usability");
  const implementationScore = criterionScore(strategy.judgeCriteria, "implementation");
  const totalScore = Math.round(
    clamp(
      strategy.judgeScore * 0.28 +
        coverageScore * 0.22 +
        strategy.moatScore * 0.15 +
        strategy.mvpScore * 0.1 +
        recommendation.after.total * 0.1 +
        usabilityScore * 0.07 +
        implementationScore * 0.05 +
        budgetFitScore * 0.03
    )
  );

  return {
    id: `squad-${recommendation.selected.map((agent) => agent.id).join("-")}`,
    rank,
    agentIds: recommendation.selected.map((agent) => agent.id),
    agents: recommendation.selected.map((agent) => ({
      id: agent.id,
      name: agent.name,
      handle: agent.handle,
      price: agent.price,
      stage: agent.stage
    })),
    totalPrice,
    remainingBudget: budget - totalPrice,
    judgeScore: strategy.judgeScore,
    mvpScore: strategy.mvpScore,
    moatScore: strategy.moatScore,
    squadScore: recommendation.after,
    coverageScore,
    budgetFitScore,
    totalScore,
    usabilityScore,
    implementationScore,
    weakestCriterion: {
      id: weakestCriterion.id,
      label: weakestCriterion.label,
      score: weakestCriterion.score,
      nextAction: weakestCriterion.nextAction
    },
    coverage,
    strengths: candidateStrengths({
      recommendation,
      coverage,
      judgeScore: strategy.judgeScore,
      moatScore: strategy.moatScore,
      mvpScore: strategy.mvpScore
    }),
    tradeoffs: candidateTradeoffs({
      coverage,
      weakestCriterion,
      totalPrice,
      budget
    })
  };
}

function rankCandidates(candidates: OptimizedSquadCandidate[]) {
  return [...candidates]
    .sort((left, right) => {
      if (right.totalScore !== left.totalScore) return right.totalScore - left.totalScore;
      if (right.coverageScore !== left.coverageScore) return right.coverageScore - left.coverageScore;
      if (right.judgeScore !== left.judgeScore) return right.judgeScore - left.judgeScore;
      if (left.totalPrice !== right.totalPrice) return left.totalPrice - right.totalPrice;
      return left.id.localeCompare(right.id);
    })
    .map((candidate, index) => ({ ...candidate, rank: index + 1 }));
}

function selectedOrDefaultIds(projectBrief: string, selectedAgentIds: string[], budget: number) {
  if (selectedAgentIds.length > 0) return selectedAgentIds;
  return recommendSquad(projectBrief, [], budget).selected.map((agent) => agent.id);
}

function computeDelta(current: OptimizedSquadCandidate, recommended: OptimizedSquadCandidate): SquadOptimizerDelta {
  return {
    totalScore: recommended.totalScore - current.totalScore,
    judgeScore: recommended.judgeScore - current.judgeScore,
    usability: recommended.usabilityScore - current.usabilityScore,
    implementation: recommended.implementationScore - current.implementationScore,
    coverageScore: recommended.coverageScore - current.coverageScore,
    budgetUsed: recommended.totalPrice - current.totalPrice
  };
}

function buildSwapPlan(input: {
  current: OptimizedSquadCandidate;
  recommended: OptimizedSquadCandidate;
  stretch: OptimizedSquadCandidate | null;
  budgetGap: number;
}): SquadSwapStep[] {
  const { current, recommended, stretch, budgetGap } = input;
  const currentIds = new Set(current.agentIds);
  const recommendedIds = new Set(recommended.agentIds);
  const steps: SquadSwapStep[] = [];

  for (const agent of current.agents) {
    if (recommendedIds.has(agent.id)) {
      steps.push({
        id: `keep-${agent.id}`,
        action: "keep",
        label: `Keep ${agent.name}`,
        reason: "最適化後も必須ストーリーを支える。",
        scoreImpact: "preserves coverage"
      });
    } else {
      steps.push({
        id: `remove-${agent.id}`,
        action: "remove",
        label: `Remove ${agent.name}`,
        reason: "予算内の勝ち筋に対して相対優先度が下がった。",
        scoreImpact: "frees budget"
      });
    }
  }

  for (const agent of recommended.agents) {
    if (!currentIds.has(agent.id)) {
      steps.push({
        id: `add-${agent.id}`,
        action: "add",
        label: `Hire ${agent.name}`,
        reason: `${recommended.weakestCriterion.label}と必須技術カバレッジを補強する。`,
        scoreImpact: `optimizer +${Math.max(0, recommended.totalScore - current.totalScore)}`
      });
    }
  }

  if (sameIds(current.agentIds, recommended.agentIds) && stretch && budgetGap > 0) {
    const stretchAdds = stretch.agents.filter((agent) => !recommendedIds.has(agent.id)).map((agent) => agent.name).join(" / ");
    steps.push({
      id: "fund-stretch-squad",
      action: "fund",
      label: `Add ${budgetGap} budget`,
      reason: `${stretchAdds} を足すと必須ストーリーカバレッジが100%になる。`,
      scoreImpact: `stretch ${recommended.totalScore} -> ${stretch.totalScore}`
    });
  }

  if (steps.length === 0) {
    steps.push({
      id: "keep-current-squad",
      action: "keep",
      label: "Keep current squad",
      reason: "現在の編成が予算内の最上位候補。",
      scoreImpact: "no swap required"
    });
  }

  return steps;
}

function buildHeadline(readiness: SquadOptimizerReadiness, recommended: OptimizedSquadCandidate, stretch: OptimizedSquadCandidate | null) {
  if (readiness === "worth-swapping") {
    return `Swap to ${recommended.agents.map((agent) => agent.name).join(" / ")} for the strongest budget fit.`;
  }
  if (readiness === "needs-more-budget" && stretch) {
    return `Best under budget is locked; add budget to unlock ${stretch.agents.map((agent) => agent.name).join(" / ")}.`;
  }
  return "Current squad is already the best under this budget.";
}

function buildHardTruth(readiness: SquadOptimizerReadiness, current: OptimizedSquadCandidate, recommended: OptimizedSquadCandidate, stretch: OptimizedSquadCandidate | null, budgetGap: number) {
  if (readiness === "worth-swapping") {
    return `今の編成は ${current.totalScore} 点。${recommended.totalPrice} budget の推薦編成へ替えると ${recommended.totalScore} 点になり、${recommended.weakestCriterion.label} の穴を小さくできます。`;
  }
  if (readiness === "needs-more-budget" && stretch) {
    return `140前後の予算ではA2A、Gemini、Cloud Runを崩さない判断が正解です。ただし審査でUXまで取り切るには +${budgetGap} で ${stretch.agents
      .filter((agent) => !recommended.agentIds.includes(agent.id))
      .map((agent) => agent.name)
      .join(" / ")} を足す必要があります。`;
  }
  return `現在の編成は ${current.totalScore} 点で予算内最上位です。次の改善は編成変更ではなく、提出URLと動画の外部証拠を埋めることです。`;
}

export function buildSquadOptimizer(input: {
  projectBrief: string;
  selectedAgentIds?: string[];
  budget?: number;
  maxSquadSize?: number;
}): SquadOptimizerRun {
  const budget = Math.round(input.budget ?? 140);
  const maxSquadSize = Math.max(1, Math.min(6, Math.round(input.maxSquadSize ?? 4)));
  const currentIds = selectedOrDefaultIds(input.projectBrief, input.selectedAgentIds ?? [], budget);
  const allCandidates = combinations(MARKET_AGENTS, maxSquadSize).map((agents) =>
    buildCandidate(
      input.projectBrief,
      agents.map((agent) => agent.id),
      budget
    )
  );
  const ranked = rankCandidates(allCandidates.filter((candidate) => candidate.totalPrice <= budget));
  const recommended = ranked[0] ?? buildCandidate(input.projectBrief, currentIds, budget, 1);
  const currentRank = ranked.find((candidate) => sameIds(candidate.agentIds, currentIds))?.rank ?? ranked.length + 1;
  const current = {
    ...buildCandidate(input.projectBrief, currentIds, budget, currentRank),
    rank: currentRank
  };
  const stretch = rankCandidates(
    allCandidates.filter((candidate) => candidate.totalPrice > budget && candidate.totalPrice <= budget + 40 && candidate.coverageScore > recommended.coverageScore)
  )[0] ?? null;
  const budgetGap = stretch ? Math.max(0, stretch.totalPrice - budget) : 0;
  const delta = computeDelta(current, recommended);
  const readiness: SquadOptimizerReadiness =
    delta.totalScore >= 3
      ? "worth-swapping"
      : stretch && recommended.coverageScore < 100 && stretch.totalScore > recommended.totalScore
        ? "needs-more-budget"
        : "optimized";
  const alternatives = ranked.filter((candidate) => candidate.id !== recommended.id).slice(0, 3);
  const headline = buildHeadline(readiness, recommended, stretch);
  const hardTruth = buildHardTruth(readiness, current, recommended, stretch, budgetGap);
  const swapPlan = buildSwapPlan({ current, recommended, stretch, budgetGap });
  const id = `squad-optimizer-${recommended.totalScore}-${readiness}`;

  return {
    id,
    optimizerScore: recommended.totalScore,
    readiness,
    budget,
    maxSquadSize,
    headline,
    hardTruth,
    current,
    recommended,
    stretch,
    budgetGap,
    alternatives,
    delta,
    swapPlan,
    decisionRules: DECISION_RULES,
    a2aPayload: {
      method: "message/send",
      skill: "squad.optimize",
      id,
      readiness,
      budget,
      optimizerScore: recommended.totalScore,
      recommended: {
        agentIds: recommended.agentIds,
        totalPrice: recommended.totalPrice,
        totalScore: recommended.totalScore,
        coverageScore: recommended.coverageScore
      },
      stretch: stretch
        ? {
            agentIds: stretch.agentIds,
            budgetGap,
            totalScore: stretch.totalScore,
            coverageScore: stretch.coverageScore
          }
        : null,
      swapPlan: swapPlan.map((step) => ({
        action: step.action,
        label: step.label,
        scoreImpact: step.scoreImpact
      }))
    }
  };
}
