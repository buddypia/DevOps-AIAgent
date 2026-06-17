import { MARKET_AGENTS } from "./market.js";
import type { OpsDrill } from "./ops.js";
import type { SecurityReview } from "./security.js";
import type { WinningStrategy } from "./strategy.js";
import type { MarketAgent, Recommendation } from "./types.js";

export type ImpactPosture = "pilot-ready" | "needs-pilot-proof" | "not-credible";
export type ImpactMetricDirection = "lower-is-better" | "higher-is-better";

export type ImpactMetric = {
  id: string;
  label: string;
  before: number;
  after: number;
  delta: number;
  unit: "hours" | "percent" | "score" | "agents";
  direction: ImpactMetricDirection;
  evidence: string;
};

export type PersonaImpact = {
  id: string;
  persona: string;
  pain: string;
  workflowWin: string;
  kpi: string;
  proof: string;
};

export type ImpactWorkflowStep = {
  id: string;
  phase: string;
  before: string;
  after: string;
  owner: string;
  evidence: string;
};

export type AdoptionStep = {
  id: string;
  horizon: string;
  action: string;
  acceptance: string;
};

export type ImpactRisk = {
  id: string;
  label: string;
  severity: "low" | "medium" | "high";
  mitigation: string;
};

export type ImpactCase = {
  id: string;
  impactScore: number;
  posture: ImpactPosture;
  verdict: string;
  hardTruth: string;
  metrics: ImpactMetric[];
  personas: PersonaImpact[];
  workflow: ImpactWorkflowStep[];
  adoptionPlan: AdoptionStep[];
  risks: ImpactRisk[];
  judgeAnswers: Array<{ id: string; question: string; answer: string; evidence: string }>;
  nextImpactHire: {
    id: string;
    name: string;
    reason: string;
    expectedLift: string;
  } | null;
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

function criterionScore(strategy: WinningStrategy, id: string) {
  return strategy.judgeCriteria.find((criterion) => criterion.id === id)?.score ?? strategy.judgeScore;
}

function hasAgent(recommendation: Recommendation, id: string) {
  return recommendation.selected.some((agent) => agent.id === id);
}

function pickAgent(recommendation: Recommendation, ids: string[]) {
  return ids
    .map((id) => MARKET_AGENTS.find((agent) => agent.id === id && !hasAgent(recommendation, id)))
    .find((agent): agent is MarketAgent => Boolean(agent));
}

function nextImpactHire(recommendation: Recommendation, strategy: WinningStrategy) {
  const usability = criterionScore(strategy, "usability");
  const practicality = criterionScore(strategy, "practicality");
  const agent =
    usability < 84
      ? pickAgent(recommendation, ["ux-guildmaster", "observability-oracle", "test-forge"])
      : practicality < 86
        ? pickAgent(recommendation, ["observability-oracle", "security-sentinel", "test-forge"])
        : pickAgent(recommendation, ["observability-oracle", "ux-guildmaster"]);
  if (!agent) return null;
  const reason =
    agent.id === "ux-guildmaster"
      ? "能力市場の価値を、審査員と開発リードが迷わず触れる業務UIへ押し上げるため。"
      : agent.id === "observability-oracle"
        ? "公開後のログとCI結果を次のAI調達判断へ戻し、実運用価値を証明するため。"
        : "価値仮説を検証証跡へ変換し、実装力と継続運用の説明を補強するため。";
  return {
    id: agent.id,
    name: agent.name,
    reason,
    expectedLift: agent.outcome
  };
}

function hoursSaved(metrics: ImpactMetric[]) {
  return metrics
    .filter((metric) => metric.unit === "hours")
    .reduce((sum, metric) => sum + Math.max(0, metric.before - metric.after), 0);
}

export function buildImpactCase(input: {
  recommendation: Recommendation;
  strategy: WinningStrategy;
  opsDrill: OpsDrill;
  securityReview: SecurityReview;
}): ImpactCase {
  const { recommendation, strategy, opsDrill, securityReview } = input;
  const usability = criterionScore(strategy, "usability");
  const practicality = criterionScore(strategy, "practicality");
  const implementation = criterionScore(strategy, "implementation");
  const totalLift = recommendation.uplift.total;
  const governanceLift = recommendation.uplift.governance;
  const deliveryLift = recommendation.uplift.delivery;
  const selectedCount = recommendation.selected.length;

  const selectionBefore = 8;
  const selectionAfter = round1(clamp(selectionBefore - governanceLift / 8 - selectedCount * 0.25, 1.4, 7.2));
  const evidenceBefore = 7;
  const evidenceAfter = round1(clamp(evidenceBefore - average([strategy.mvpScore, implementation, securityReview.securityScore]) / 28, 2.2, 6.4));
  const handoffBefore = 5;
  const handoffAfter = round1(clamp(handoffBefore - deliveryLift / 12 - selectedCount * 0.18, 1.8, 4.5));
  const riskBefore = 42;
  const riskAfter = round1(clamp(riskBefore - average([opsDrill.readinessScore, securityReview.securityScore]) / 4.8, 6, 34));
  const confidenceBefore = 45;
  const confidenceAfter = Math.round(clamp(average([strategy.mvpScore, opsDrill.readinessScore, securityReview.securityScore, recommendation.after.total]) + 4));
  const valueBefore = 38;
  const valueAfter = Math.round(clamp(average([practicality, usability, confidenceAfter, recommendation.after.total]) + Math.min(8, totalLift / 5)));

  const metrics: ImpactMetric[] = [
    {
      id: "agent-selection-hours",
      label: "AI能力選定の時間",
      before: selectionBefore,
      after: selectionAfter,
      delta: round1(selectionBefore - selectionAfter),
      unit: "hours",
      direction: "lower-is-better",
      evidence: `${selectedCount} agents selected from scored capability, MCP, A2A, and price signals.`
    },
    {
      id: "evidence-pack-hours",
      label: "提出証拠づくり",
      before: evidenceBefore,
      after: evidenceAfter,
      delta: round1(evidenceBefore - evidenceAfter),
      unit: "hours",
      direction: "lower-is-better",
      evidence: "Judge Proof, MVP Audit, Security Review, Submission Dossier, and Launch Gate produce paste-ready evidence."
    },
    {
      id: "handoff-friction-hours",
      label: "エージェント委任の手戻り",
      before: handoffBefore,
      after: handoffAfter,
      delta: round1(handoffBefore - handoffAfter),
      unit: "hours",
      direction: "lower-is-better",
      evidence: "Contract Desk and Autonomy Ledger turn handoffs into acceptance criteria and evidence endpoints."
    },
    {
      id: "runtime-risk",
      label: "公開デモ運用リスク",
      before: riskBefore,
      after: riskAfter,
      delta: round1(riskBefore - riskAfter),
      unit: "percent",
      direction: "lower-is-better",
      evidence: `Ops readiness ${opsDrill.readinessScore} and security score ${securityReview.securityScore} reduce live-demo risk.`
    },
    {
      id: "submission-confidence",
      label: "提出信頼度",
      before: confidenceBefore,
      after: confidenceAfter,
      delta: confidenceAfter - confidenceBefore,
      unit: "score",
      direction: "higher-is-better",
      evidence: `MVP ${strategy.mvpScore}, Ops ${opsDrill.readinessScore}, Security ${securityReview.securityScore}, Squad ${recommendation.after.total}.`
    },
    {
      id: "experience-value",
      label: "体験価値",
      before: valueBefore,
      after: valueAfter,
      delta: valueAfter - valueBefore,
      unit: "score",
      direction: "higher-is-better",
      evidence: "Capability marketplace, buying loop, proof ledger, and launch gate create a complete decision experience."
    }
  ];

  const savedHours = round1(hoursSaved(metrics));
  const impactScore = Math.round(
    clamp(
      average([
        valueAfter,
        confidenceAfter,
        practicality,
        usability,
        opsDrill.readinessScore,
        securityReview.securityScore,
        clamp(savedHours * 10, 40, 100)
      ])
    )
  );
  const posture: ImpactPosture = impactScore >= 86 ? "pilot-ready" : impactScore >= 70 ? "needs-pilot-proof" : "not-credible";
  const verdict =
    posture === "pilot-ready"
      ? "Impact story is pilot-ready"
      : posture === "needs-pilot-proof"
        ? "Impact story needs a live-user proof point"
        : "Impact story is not credible enough yet";
  const hardTruth =
    posture === "pilot-ready"
      ? `審査員へ「AI調達の意思決定を約${savedHours}時間短縮し、提出信頼度を${confidenceAfter}まで上げる」体験価値として説明できます。`
      : posture === "needs-pilot-proof"
        ? "価値仮説はありますが、UXまたは運用ログをもう一段足さないと実用性の説得力が伸びません。"
        : "現場価値を示すには、Cloud Run運用、提出証拠、ユーザー別の便益をつなぐ必要があります。";
  const nextHire = nextImpactHire(recommendation, strategy);

  const personas: PersonaImpact[] = [
    {
      id: "engineering-manager",
      persona: "開発リード",
      pain: "どのAIエージェントを採用すればDevOps成果に効くかを毎回手探りで判断している。",
      workflowWin: "能力、価格、MCP成熟度、A2A委任、検収条件を1画面で比較できる。",
      kpi: `${metrics.find((metric) => metric.id === "agent-selection-hours")?.delta ?? 0}h selection saved`,
      proof: "Marketplace, Winning Strategy, Contract Desk"
    },
    {
      id: "platform-sre",
      persona: "Platform / SRE",
      pain: "公開後の異常検知、ロールバック、セキュリティ境界がAIデモから切り離されがち。",
      workflowWin: "Ops DrillとSecurity Reviewが、継続/rollback/guardrail判断を証拠化する。",
      kpi: `${metrics.find((metric) => metric.id === "runtime-risk")?.after ?? 0}% residual demo risk`,
      proof: "Cloud Run Ops Drill, Security Sentinel Review"
    },
    {
      id: "hackathon-submitter",
      persona: "ハッカソン提出者",
      pain: "アイデア、実装、提出本文、動画、URL証拠が散らばり、締切直前に抜け漏れが起きる。",
      workflowWin: "DossierとLaunch Gateが、提出3点、本文、タグ、CI、receiptを最後に束ねる。",
      kpi: `${confidenceAfter}/100 submission confidence`,
      proof: "Submission Dossier, Launch Gate, Judge Proof"
    }
  ];

  const workflow: ImpactWorkflowStep[] = [
    {
      id: "sense",
      phase: "Sense",
      before: "担当者が候補AIや競合を個別に調べる",
      after: "Market IntelとStrategyが競合/SWOT/必要能力を返す",
      owner: "A2A Market Broker",
      evidence: `${strategy.competitors.length} competitors and ${Object.values(strategy.swot).flat().length} SWOT items`
    },
    {
      id: "buy",
      phase: "Buy",
      before: "AI選定の理由が属人的で検収条件が曖昧",
      after: "Agent Card、価格、能力、Contract Deskで購入理由を固定",
      owner: "Contract Desk",
      evidence: `${recommendation.selected.length} selected agents / budget ${recommendation.budgetUsed}`
    },
    {
      id: "delegate",
      phase: "Delegate",
      before: "AI間の作業分担が口頭やプロンプトに閉じる",
      after: "A2A timelineとAutonomy Ledgerで委任、検証、運用を追跡",
      owner: "Autonomy Ledger",
      evidence: `${recommendation.a2aTimeline.length} A2A timeline events`
    },
    {
      id: "operate",
      phase: "Operate",
      before: "公開後の判断が提出物から消える",
      after: "Ops DrillとSecurity ReviewでCloud Run継続判断を証拠化",
      owner: "Cloud Run SRE",
      evidence: `${opsDrill.severity} ops severity / ${securityReview.posture} security posture`
    },
    {
      id: "submit",
      phase: "Submit",
      before: "ProtoPedia本文、動画、URL、CIが散らばる",
      after: "Dossier、Proof、Launch Gateが提出パケットを束ねる",
      owner: "Gemini Strategist",
      evidence: `${confidenceAfter}/100 submission confidence`
    }
  ];

  const adoptionPlan: AdoptionStep[] = [
    {
      id: "day-0",
      horizon: "0-48h",
      action: "1プロジェクトのbriefを貼り、必要AI、契約、提出証拠を生成する",
      acceptance: "Impact score >= 86 and Launch Gate remains explicit about external URLs"
    },
    {
      id: "week-2",
      horizon: "2 weeks",
      action: "GitHub ActionsとCloud Run logsをOps Drillへ接続し、次のAI買い足しを決める",
      acceptance: "Ops readiness >= 85 and runtime-risk metric stays below 15%"
    },
    {
      id: "quarter",
      horizon: "Quarter",
      action: "複数チームのAI調達判断を比較し、よく買われる能力と成果の相関を読む",
      acceptance: "Selection time reduced by 50%+ and evidence-pack time reduced by 40%+"
    }
  ];

  const risks: ImpactRisk[] = [
    {
      id: "model-assumption",
      label: "効果指標は能力モデル由来",
      severity: "medium",
      mitigation: "Cloud Run logs、GitHub Actions、実ユーザー操作時間を次のiterationで取り込む。"
    },
    {
      id: "external-submit",
      label: "ProtoPedia作品URLと動画URLは外部作業",
      severity: "medium",
      mitigation: "Submission Launch Gateで未入力をsubmit-readyにしない。"
    },
    {
      id: "ui-density",
      label: "証拠面が多く初見で迷う可能性",
      severity: usability >= 84 ? "low" : "medium",
      mitigation: nextHire?.id === "ux-guildmaster" ? "UX Guildmasterを次に雇い、Judge Brief -> Impact Case -> Launch Gateの導線へ絞る。" : "Judge BriefとDemo Runwayを最初に開く順番へ固定する。"
    }
  ];

  const judgeAnswers = [
    {
      id: "who-uses",
      question: "誰が本当に使いますか？",
      answer: "開発リード、Platform/SRE、ハッカソン提出者です。AIを作る前に、どのAI能力を買うべきかを判断する場面で使います。",
      evidence: personas.map((persona) => `${persona.persona}: ${persona.kpi}`).join(" / ")
    },
    {
      id: "why-practical",
      question: "実用性はスコアだけでは？",
      answer: "スコアに留めず、契約、検収条件、Ops判断、Security境界、提出パケットまで実際の作業単位へ落としています。",
      evidence: workflow.map((step) => `${step.phase}:${step.owner}`).join(" -> ")
    },
    {
      id: "how-validate",
      question: "効果をどう検証しますか？",
      answer: "selection hours、evidence-pack hours、runtime risk、submission confidenceを追い、CI/Cloud Run/Launch Gateの証拠で裏取りします。",
      evidence: metrics.map((metric) => `${metric.id}:${metric.after}${metric.unit}`).join(" / ")
    }
  ];

  return {
    id: `impact-${impactScore}-${posture}`,
    impactScore,
    posture,
    verdict,
    hardTruth,
    metrics,
    personas,
    workflow,
    adoptionPlan,
    risks,
    judgeAnswers,
    nextImpactHire: nextHire,
    a2aPayload: {
      method: "message/send",
      skill: "impact.case",
      impactScore,
      posture,
      savedHours,
      residualRuntimeRisk: riskAfter,
      submissionConfidence: confidenceAfter,
      personas: personas.map((persona) => ({ id: persona.id, kpi: persona.kpi })),
      metrics: metrics.map((metric) => ({ id: metric.id, before: metric.before, after: metric.after, delta: metric.delta, unit: metric.unit })),
      nextImpactHire: nextHire?.id ?? null
    }
  };
}
