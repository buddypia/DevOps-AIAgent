import type { DemoRunway } from "./demoRunway.js";
import type { ImpactCase } from "./impact.js";
import type { JudgeBrief } from "./judgeBrief.js";
import type { MarketIntelReport } from "./marketIntel.js";
import type { JudgeProof, ProofStatus } from "./proof.js";
import type { SecurityReview, SecurityStatus } from "./security.js";
import type { SubmissionLaunchGate, LaunchItemStatus } from "./submissionLaunch.js";
import type { WinningStrategy } from "./strategy.js";
import type { Recommendation } from "./types.js";

export type JudgeTourReadiness = "walkthrough-ready" | "external-url-gaps" | "needs-fix";
export type JudgeTourStepStatus = "ready" | "watch" | "blocked";
export type JudgeTourBlockerSeverity = "external" | "quality" | "runtime";

export type JudgeTourClaim = {
  id: string;
  label: string;
  claim: string;
  score: number;
  evidence: string;
};

export type JudgeTourStep = {
  id: string;
  order: number;
  timeRange: string;
  screen: string;
  action: string;
  narratorLine: string;
  evidence: string;
  endpoint: string;
  status: JudgeTourStepStatus;
};

export type JudgeTourObjection = {
  id: string;
  question: string;
  response: string;
  proof: string;
  openStepId: string;
};

export type JudgeTourBlocker = {
  id: string;
  label: string;
  severity: JudgeTourBlockerSeverity;
  owner: string;
  action: string;
  proof: string;
};

export type JudgeTour = {
  id: string;
  tourScore: number;
  readiness: JudgeTourReadiness;
  totalSeconds: number;
  headline: string;
  hardTruth: string;
  openingScript: string;
  claims: JudgeTourClaim[];
  steps: JudgeTourStep[];
  objections: JudgeTourObjection[];
  blockers: JudgeTourBlocker[];
  links: Array<{ id: string; label: string; url: string }>;
  a2aPayload: Record<string, unknown>;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function absoluteUrl(baseUrl: string, path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function stepStatusFromScore(score: number): JudgeTourStepStatus {
  if (score >= 82) return "ready";
  if (score >= 62) return "watch";
  return "blocked";
}

function stepStatusFromLaunch(status: LaunchItemStatus): JudgeTourStepStatus {
  if (status === "ready") return "ready";
  if (status === "missing") return "watch";
  return "blocked";
}

function stepStatusFromSecurity(statuses: SecurityStatus[]): JudgeTourStepStatus {
  if (statuses.includes("fail")) return "blocked";
  if (statuses.filter((status) => status === "watch").length > 2) return "watch";
  return "ready";
}

function stepStatusFromProof(status: ProofStatus): JudgeTourStepStatus {
  if (status === "passed") return "ready";
  if (status === "watch") return "watch";
  return "blocked";
}

function uniqueBlockers(blockers: JudgeTourBlocker[]) {
  const seen = new Set<string>();
  return blockers.filter((blocker) => {
    if (seen.has(blocker.id)) return false;
    seen.add(blocker.id);
    return true;
  });
}

function readinessFrom(input: { tourScore: number; blockers: JudgeTourBlocker[]; launch: SubmissionLaunchGate }): JudgeTourReadiness {
  if (input.blockers.some((blocker) => blocker.severity === "quality" || blocker.severity === "runtime")) return "needs-fix";
  if (input.launch.readiness !== "submit-ready" || input.blockers.some((blocker) => blocker.severity === "external")) return "external-url-gaps";
  return input.tourScore >= 88 ? "walkthrough-ready" : "external-url-gaps";
}

export function buildJudgeTour(input: {
  baseUrl: string;
  recommendation: Recommendation;
  strategy: WinningStrategy;
  marketIntel: MarketIntelReport;
  judgeBrief: JudgeBrief;
  impactCase: ImpactCase;
  securityReview: SecurityReview;
  proof: JudgeProof;
  demoRunway: DemoRunway;
  submissionLaunch: SubmissionLaunchGate;
}): JudgeTour {
  const { baseUrl, recommendation, strategy, marketIntel, judgeBrief, impactCase, securityReview, proof, demoRunway, submissionLaunch } = input;
  const selectedAgents = recommendation.selected.map((agent) => agent.name).join(" / ") || "A2A Market Broker";
  const externalBlockers: JudgeTourBlocker[] = submissionLaunch.urlStatuses
    .filter((item) => item.status !== "ready")
    .map((item) => ({
      id: item.id,
      label: item.label,
      severity: item.status === "invalid" ? "quality" : "external",
      owner: "Submission owner",
      action: item.action,
      proof: item.proof
    }));
  const securityBlockers: JudgeTourBlocker[] = securityReview.controls
    .filter((control) => control.status === "fail")
    .map((control) => ({
      id: control.id,
      label: control.label,
      severity: "quality",
      owner: "Security Sentinel",
      action: control.action,
      proof: control.evidence
    }));
  const ciBlockers: JudgeTourBlocker[] =
    proof.ci.status === "missing"
      ? [
          {
            id: "ci",
            label: "GitHub Actions CI",
            severity: "quality",
            owner: "Test Forge",
            action: "main CIを成功させ、Judge Proofを再実行する",
            proof: proof.ci.conclusion
          }
        ]
      : [];
  const runtimeBlockers: JudgeTourBlocker[] = demoRunway.risks
    .filter((risk) => risk.id === "rollback")
    .map((risk) => ({
      id: risk.id,
      label: risk.label,
      severity: "runtime",
      owner: "Cloud Run SRE",
      action: risk.mitigation,
      proof: risk.label
    }));
  const blockers = uniqueBlockers([...externalBlockers, ...securityBlockers, ...ciBlockers, ...runtimeBlockers]);
  const tourScore = Math.round(
    clamp(
      average([
        judgeBrief.briefScore,
        marketIntel.marketScore,
        impactCase.impactScore,
        securityReview.securityScore,
        proof.overallScore,
        demoRunway.demoScore,
        submissionLaunch.launchScore,
        strategy.judgeScore
      ]) +
        (submissionLaunch.readiness === "submit-ready" ? 2 : 0) -
        blockers.filter((blocker) => blocker.severity !== "external").length * 6
    )
  );
  const readiness = readinessFrom({ tourScore, blockers, launch: submissionLaunch });
  const launchUrlStatus = submissionLaunch.urlStatuses.some((item) => item.status === "invalid")
    ? "blocked"
    : submissionLaunch.urlStatuses.some((item) => item.status === "missing")
      ? "watch"
      : "ready";

  const claims: JudgeTourClaim[] = [
    {
      id: "agent-market",
      label: "AI is the center",
      claim: "AI能力を市場で選び、雇い、A2Aで委任することが主操作です。",
      score: strategy.judgeCriteria.find((criterion) => criterion.id === "agentCentrality")?.score ?? strategy.judgeScore,
      evidence: `${selectedAgents} / ${recommendation.a2aTimeline.length} A2A events`
    },
    {
      id: "competitive-moat",
      label: "Moat",
      claim: "競合の強みを作る基盤に置き、こちらは買う・検収する意思決定面で差別化します。",
      score: marketIntel.marketScore,
      evidence: `${marketIntel.sources.length} sources / ${strategy.competitors.length} competitors / SWOT included`
    },
    {
      id: "practical-value",
      label: "Practical value",
      claim: impactCase.hardTruth,
      score: impactCase.impactScore,
      evidence: impactCase.metrics.map((metric) => `${metric.id}:${metric.after}${metric.unit}`).join(" / ")
    },
    {
      id: "trust-boundary",
      label: "Trust",
      claim: securityReview.hardTruth,
      score: securityReview.securityScore,
      evidence: `${securityReview.controls.length} controls / ${securityReview.boundaries.length} boundaries`
    },
    {
      id: "submission-honesty",
      label: "Submission honesty",
      claim: submissionLaunch.hardTruth,
      score: submissionLaunch.launchScore,
      evidence: submissionLaunch.urlStatuses.map((item) => `${item.id}:${item.status}`).join(" / ")
    }
  ];

  const steps: JudgeTourStep[] = [
    {
      id: "judge-brief",
      order: 1,
      timeRange: "0-15s",
      screen: "Judge Brief",
      action: "Build judge briefを押し、one-line verdict、hard truth、proof ladderを見せる",
      narratorLine: judgeBrief.oneLineVerdict,
      evidence: `${judgeBrief.keyMetrics.length} key metrics / ${judgeBrief.proofLadder.length} proof steps`,
      endpoint: absoluteUrl(baseUrl, "/api/judge-brief"),
      status: stepStatusFromScore(judgeBrief.briefScore)
    },
    {
      id: "market-intel",
      order: 2,
      timeRange: "15-30s",
      screen: "Market Intel + SWOT",
      action: "公式ソース付き競合比較とSWOTを見せ、フレームワーク競争ではないことを説明する",
      narratorLine: marketIntel.thesis,
      evidence: `${marketIntel.comparisons.length} comparisons / ${marketIntel.sourceChecklist.length} sources`,
      endpoint: absoluteUrl(baseUrl, "/api/market-intel"),
      status: stepStatusFromScore(marketIntel.marketScore)
    },
    {
      id: "impact-case",
      order: 3,
      timeRange: "30-45s",
      screen: "Impact Case",
      action: "Run impact caseを押し、対象ユーザー、時間短縮、提出信頼度、運用リスクを見せる",
      narratorLine: impactCase.verdict,
      evidence: `${impactCase.metrics.length} metrics / ${impactCase.personas.length} personas`,
      endpoint: absoluteUrl(baseUrl, "/api/impact-case"),
      status: stepStatusFromScore(impactCase.impactScore)
    },
    {
      id: "security-review",
      order: 4,
      timeRange: "45-60s",
      screen: "Security Sentinel Review",
      action: "公開デモのSecret、IP、入力、A2A、CI、Cloud Run境界を見せる",
      narratorLine: securityReview.verdict,
      evidence: `${securityReview.controls.length} controls / ${securityReview.threats.length} threats`,
      endpoint: absoluteUrl(baseUrl, "/api/security-review"),
      status: stepStatusFromSecurity(securityReview.controls.map((control) => control.status))
    },
    {
      id: "judge-proof",
      order: 5,
      timeRange: "60-75s",
      screen: "Judge Proof",
      action: "Run judge proofを押し、Gemini、Cloud Run、A2A、CI、receiptを見せる",
      narratorLine: proof.summary,
      evidence: `${proof.proofItems.length} proof items / CI ${proof.ci.conclusion}`,
      endpoint: absoluteUrl(baseUrl, "/api/proof"),
      status: stepStatusFromProof(proof.ci.status)
    },
    {
      id: "submission-launch",
      order: 6,
      timeRange: "75-90s",
      screen: "Submission Launch Gate",
      action: "外部URLの状態を見せ、未入力を提出完了扱いにしないことを説明する",
      narratorLine: submissionLaunch.verdict,
      evidence: `${submissionLaunch.checklist.length} checklist items / ${submissionLaunch.readiness}`,
      endpoint: absoluteUrl(baseUrl, "/api/submission-launch"),
      status: launchUrlStatus
    }
  ];

  const objections: JudgeTourObjection[] = [
    {
      id: "dashboard",
      question: "これは単なるダッシュボードでは？",
      response: "市場探索、購入判断、契約、A2A委任、検証、運用、提出までをAIの判断連鎖として実行します。",
      proof: claims.find((claim) => claim.id === "agent-market")?.evidence ?? selectedAgents,
      openStepId: "judge-brief"
    },
    {
      id: "competition",
      question: "ADKやCrewAIと比べて何が違う？",
      response: "それらは作る基盤です。この作品は、どのAI能力を買い、どう検収し、どう提出証拠へ変えるかを扱います。",
      proof: claims.find((claim) => claim.id === "competitive-moat")?.evidence ?? marketIntel.headline,
      openStepId: "market-intel"
    },
    {
      id: "practicality",
      question: "現場価値はスコアだけでは？",
      response: "対象ユーザー別KPI、時間短縮、運用リスク、導入計画をImpact Caseでbefore/afterにしています。",
      proof: claims.find((claim) => claim.id === "practical-value")?.evidence ?? impactCase.verdict,
      openStepId: "impact-case"
    },
    {
      id: "safe-demo",
      question: "公開URLを安全に審査できますか？",
      response: "Secret、IP allowlist、入力上限、A2A信頼境界、CI、Cloud Run runtimeをSecurity Reviewで説明できます。",
      proof: claims.find((claim) => claim.id === "trust-boundary")?.evidence ?? securityReview.verdict,
      openStepId: "security-review"
    },
    {
      id: "submission",
      question: "提出完了と言い切れますか？",
      response: "コードと証拠は公開済みですが、ProtoPedia作品URLと動画URLはLaunch Gateで未完了なら未完了として扱います。",
      proof: claims.find((claim) => claim.id === "submission-honesty")?.evidence ?? submissionLaunch.verdict,
      openStepId: "submission-launch"
    }
  ];

  const hardTruth =
    readiness === "walkthrough-ready"
      ? "審査員に見せる順番、証拠、反論、提出URLが揃っています。"
      : readiness === "external-url-gaps"
        ? "審査ウォークスルーは成立していますが、ProtoPedia作品URLと動画URLが揃うまで提出完了ではありません。"
        : "審査ウォークスルー前に、CI、セキュリティ、またはCloud Run運用のブロッカーを直す必要があります。";

  return {
    id: `judge-tour-${tourScore}-${readiness}`,
    tourScore,
    readiness,
    totalSeconds: 90,
    headline: "90秒で、競合差別化、現場価値、安全境界、実行証拠、提出誠実性を順番に見せる。",
    hardTruth,
    openingScript: `これは ${selectedAgents} を市場から雇い、A2Aで委任し、Cloud Run運用と提出証拠まで閉じるAI能力調達ワークベンチです。`,
    claims,
    steps,
    objections,
    blockers,
    links: [
      { id: "app", label: "Cloud Run app", url: proof.links.app },
      { id: "agent-card", label: "Agent Card", url: proof.links.agentCard },
      { id: "ci", label: "GitHub Actions", url: proof.links.ci },
      { id: "architecture", label: "Architecture", url: proof.links.architecture },
      { id: "story", label: "Story Markdown", url: proof.links.story }
    ],
    a2aPayload: {
      method: "message/send",
      skill: "judge.tour",
      tourScore,
      readiness,
      totalSeconds: 90,
      steps: steps.map((step) => ({ id: step.id, order: step.order, endpoint: step.endpoint, status: step.status })),
      claims: claims.map((claim) => ({ id: claim.id, score: claim.score })),
      blockers: blockers.map((blocker) => ({ id: blocker.id, severity: blocker.severity, action: blocker.action }))
    }
  };
}
