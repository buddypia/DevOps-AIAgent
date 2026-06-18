import { createHash } from "node:crypto";
import type { GeminiRecommendation, Recommendation } from "./types.js";
import type { MissionRun } from "./mission.js";
import type { OpsDrill } from "./ops.js";
import type { WinningStrategy } from "./strategy.js";

export type ProofStatus = "passed" | "watch" | "missing";
export type GeminiProofReadiness = "gemini-live" | "fallback-visible" | "needs-gemini-proof";
export type UsabilityProofReadiness = "usability-locked" | "usability-budget-watch" | "needs-usability-proof";

export type ProofItem = {
  id: string;
  label: string;
  status: ProofStatus;
  evidence: string;
  url?: string;
};

export type CiProof = {
  status: ProofStatus;
  conclusion: string;
  url: string;
  workflowUrl: string;
  branch: string;
  checkedAt: string;
  evidence: string;
  runId?: number;
};

export type GeminiProofCheck = {
  id: string;
  label: string;
  status: ProofStatus;
  evidence: string;
  acceptance: string;
};

export type GeminiProofLock = {
  id: string;
  score: number;
  readiness: GeminiProofReadiness;
  headline: string;
  model: string;
  source: GeminiRecommendation["source"];
  checks: GeminiProofCheck[];
  judgeAnswer: string;
};

export type UsabilityProofCheck = {
  id: string;
  label: string;
  status: ProofStatus;
  evidence: string;
  acceptance: string;
};

export type UsabilityProofLock = {
  id: string;
  score: number;
  readiness: UsabilityProofReadiness;
  headline: string;
  firstClick: string;
  nextUxAgent: string | null;
  budgetGap: number;
  checks: UsabilityProofCheck[];
  judgeAnswer: string;
};

export type ProofReceiptPayload = {
  proofId: string;
  issuedAt: string;
  overallScore: number;
  scores: JudgeProof["scores"];
  links: JudgeProof["links"];
  ci: {
    status: ProofStatus;
    conclusion: string;
    branch: string;
    checkedAt: string;
    runId: number | null;
  };
  geminiSource: GeminiRecommendation["source"];
  geminiModel: string;
  geminiProofLock: {
    score: number;
    readiness: GeminiProofReadiness;
    checks: Array<{ id: string; status: ProofStatus }>;
  };
  usabilityProofLock: {
    score: number;
    readiness: UsabilityProofReadiness;
    budgetGap: number;
    checks: Array<{ id: string; status: ProofStatus }>;
  };
  proofItemStatuses: Array<{ id: string; status: ProofStatus }>;
  missionId: string;
  opsDrillId: string;
  rollbackRecommended: boolean;
};

export type ProofReceipt = {
  algorithm: "sha256";
  digest: string;
  payload: ProofReceiptPayload;
  verification: string;
};

export type JudgeProof = {
  id: string;
  generatedAt: string;
  summary: string;
  overallScore: number;
  scores: {
    ai: number;
    cloudRun: number;
    a2a: number;
    strategy: number;
    devops: number;
    ci: number;
    usability: number;
    submission: number;
  };
  links: {
    app: string;
    github: string;
    ci: string;
    agentCard: string;
    a2a: string;
    architecture: string;
    story: string;
  };
  proofItems: ProofItem[];
  geminiProofLock: GeminiProofLock;
  usabilityProofLock: UsabilityProofLock;
  receipt: ProofReceipt;
  runbook: string[];
  gemini: GeminiRecommendation;
  strategy: {
    judgeScore: number;
    mvpScore: number;
    moatScore: number;
    riskLevel: WinningStrategy["riskLevel"];
    topCompetitor: string;
    nextBestAgent: string | null;
  };
  mission: {
    id: string;
    summary: string;
    autonomyScore: number;
    verificationScore: number;
    submissionScore: number;
    weakestCriterion: string;
  };
  opsDrill: {
    id: string;
    severity: OpsDrill["severity"];
    readinessScore: number;
    rollbackRecommended: boolean;
    nextOpsAgent: string | null;
  };
  ci: {
    status: ProofStatus;
    conclusion: string;
    branch: string;
    checkedAt: string;
    runId: number | null;
  };
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function statusFromScore(value: number): ProofStatus {
  if (value >= 80) return "passed";
  if (value >= 55) return "watch";
  return "missing";
}

function scoreFromStatus(status: ProofStatus) {
  if (status === "passed") return 100;
  if (status === "watch") return 72;
  return 35;
}

function statusFromBoolean(value: boolean, fallback: ProofStatus = "watch"): ProofStatus {
  return value ? "passed" : fallback;
}

function absoluteUrl(baseUrl: string, path: string) {
  if (path.startsWith("https://")) return path;
  return `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function defaultCiProof(githubUrl: string, generatedAt: string): CiProof {
  const workflowUrl = `${githubUrl.replace(/\/$/, "")}/actions/workflows/ci.yml`;
  return {
    status: "watch",
    conclusion: "not-checked",
    url: workflowUrl,
    workflowUrl,
    branch: "main",
    checkedAt: generatedAt,
    evidence: "GitHub Actions workflow is configured; live run status is checked by the deployed proof endpoint."
  };
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

export function proofDigest(payload: ProofReceiptPayload) {
  return createHash("sha256").update(JSON.stringify(canonicalize(payload))).digest("hex");
}

function buildGeminiProofLock(input: {
  recommendation: Recommendation;
  mission: MissionRun;
  opsDrill: OpsDrill;
  gemini: GeminiRecommendation;
  ci: CiProof;
}): GeminiProofLock {
  const { recommendation, mission, opsDrill, gemini, ci } = input;
  const hasLiveGemini = gemini.source === "gemini";
  const hasGeminiStrategist = recommendation.selected.some((agent) => agent.id === "gemini-strategist");
  const structuredFields = [
    gemini.executiveSummary,
    gemini.winningAngle,
    gemini.pitchScript,
    ...gemini.risks,
    ...gemini.nextActions
  ].filter((value) => value.trim().length > 0);
  const hasStructuredOutput = structuredFields.length >= 5;
  const decisionCount = mission.decisions.length + opsDrill.decisions.length;
  const checks: GeminiProofCheck[] = [
    {
      id: "live-gemini-response",
      label: "Live Gemini response",
      status: hasLiveGemini ? "passed" : "watch",
      evidence: hasLiveGemini ? `${gemini.model} returned a live strategy response.` : `Fallback is visible: ${gemini.executiveSummary}`,
      acceptance: "Gemini APIが使えた場合はlive、使えない場合もfallbackを偽らず表示する。"
    },
    {
      id: "gemini-strategist-selected",
      label: "Gemini Strategist selected",
      status: statusFromBoolean(hasGeminiStrategist),
      evidence: hasGeminiStrategist
        ? "Selected squad includes Gemini Strategist as a first-class AI agent."
        : "Selected squad does not include Gemini Strategist.",
      acceptance: "必須AI技術を周辺機能ではなく、選定済みエージェントとして勝ち筋に組み込む。"
    },
    {
      id: "structured-judge-output",
      label: "Structured judge output",
      status: hasLiveGemini && hasStructuredOutput ? "passed" : hasStructuredOutput ? "watch" : "missing",
      evidence: `${structuredFields.length} structured fields across summary, angle, risks, next actions, and pitch.`,
      acceptance: "審査で使う勝ち筋、リスク、次アクション、ピッチをJSON構造で返せる。"
    },
    {
      id: "autonomy-decision-use",
      label: "Autonomy decision use",
      status: statusFromBoolean(decisionCount >= 6),
      evidence: `${mission.decisions.length} mission decisions / ${opsDrill.decisions.length} ops decisions feed the proof bundle.`,
      acceptance: "Gemini分析を単発回答ではなく、弱点補強、運用判断、提出runbookへ接続する。"
    },
    {
      id: "receipt-replayable",
      label: "Receipt replayable",
      status: ci.status === "missing" ? "watch" : "passed",
      evidence: `Receipt stores geminiSource=${gemini.source}, geminiModel=${gemini.model}, CI=${ci.conclusion}.`,
      acceptance: "質疑で同じ状態をsha256 receiptとCIリンクから再確認できる。"
    },
    {
      id: "honest-fallback-boundary",
      label: "Honest fallback boundary",
      status: hasLiveGemini ? "passed" : "watch",
      evidence: hasLiveGemini
        ? "Gemini path is live; fallback remains only a demo continuity guard."
        : "Fallback response is explicitly marked and does not claim live Gemini execution.",
      acceptance: "Geminiが落ちてもデモは継続するが、live実行とfallbackを混同しない。"
    }
  ];
  const score = Math.round(clamp(average(checks.map((check) => scoreFromStatus(check.status)))));
  const readiness: GeminiProofReadiness =
    checks.some((check) => check.status === "missing")
      ? "needs-gemini-proof"
      : hasLiveGemini && score >= 90
        ? "gemini-live"
        : "fallback-visible";

  return {
    id: `gemini-proof-${score}-${readiness}`,
    score,
    readiness,
    headline:
      readiness === "gemini-live"
        ? "Gemini is live and tied to the judging proof."
        : readiness === "fallback-visible"
          ? "Gemini fallback is honest; live proof should be rerun on Cloud Run before judging."
          : "Gemini proof is incomplete for the required AI technology gate.",
    model: gemini.model,
    source: gemini.source,
    checks,
    judgeAnswer:
      readiness === "gemini-live"
        ? `Gemini ${gemini.model} is not decorative: it generates the winning angle, risks, next actions, and pitch script used by Mission, Ops, and Judge Proof.`
        : "この環境ではfallbackを明示しています。提出前はCloud Runの /api/proof を再実行し、gemini-live のreceiptを提示します。"
    };
}

function buildUsabilityProofLock(input: {
  recommendation: Recommendation;
  strategy: WinningStrategy;
  mission: MissionRun;
}): UsabilityProofLock {
  const { recommendation, strategy, mission } = input;
  const selectedIds = new Set(recommendation.selected.map((agent) => agent.id));
  const usabilityCriterion = strategy.judgeCriteria.find((criterion) => criterion.id === "usability");
  const hasGuidedCore = ["market-broker", "gemini-strategist", "cloud-run-sre"].every((id) => selectedIds.has(id));
  const hasUxOwner = selectedIds.has("ux-guildmaster") || selectedIds.has("brief-cartographer");
  const nextUxAgent =
    strategy.nextBestAgent?.agent.id === "ux-guildmaster" || strategy.nextBestAgent?.agent.id === "brief-cartographer"
      ? strategy.nextBestAgent.agent
      : null;
  const budgetGap = nextUxAgent ? Math.max(0, nextUxAgent.price - recommendation.remainingBudget) : 0;
  const swotCount = Object.values(strategy.swot).reduce((sum, items) => sum + items.length, 0);
  const externalWatchCount = mission.submissionPack.requirements.filter((requirement) => requirement.status === "needs-url").length;
  const hasStoryboard = mission.submissionPack.videoStoryboard.length >= 6;
  const hasProofAssets =
    Boolean(mission.submissionPack.architectureDiagramUrl) &&
    Boolean(mission.submissionPack.storyMarkdownPath) &&
    mission.submissionPack.requirements.some((requirement) => requirement.id === "deployed-url" && requirement.status === "ready");
  const usabilityScore = usabilityCriterion?.score ?? 0;

  const checks: UsabilityProofCheck[] = [
    {
      id: "single-first-click",
      label: "Single first click",
      status: hasGuidedCore ? "passed" : "watch",
      evidence: hasGuidedCore
        ? "Market Broker, Gemini Strategist, and Cloud Run SRE form one guided judge route."
        : "The recommended judge route is missing at least one core agent.",
      acceptance: "初見審査員に機能一覧を浴びせず、最初の操作を1つに固定する。"
    },
    {
      id: "ninety-second-route",
      label: "90-second route",
      status: hasStoryboard ? "passed" : "missing",
      evidence: `${mission.submissionPack.videoStoryboard.length} storyboard cuts are ready for the 30-second recording path.`,
      acceptance: "録画と審査導線が同じ順番で辿れる。"
    },
    {
      id: "proof-assets-visible",
      label: "Proof assets visible",
      status: hasProofAssets ? "passed" : "missing",
      evidence: `${mission.submissionPack.deployedUrl}, ${mission.submissionPack.architectureDiagramUrl}, ${mission.submissionPack.storyMarkdownPath}`,
      acceptance: "Cloud Run、構成図、ストーリーが1クリック証拠として開ける。"
    },
    {
      id: "competitor-before-browse",
      label: "Competitor answer before browsing",
      status: strategy.competitors.length >= 6 && swotCount >= 8 ? "passed" : "watch",
      evidence: `${strategy.competitors.length} competitors and ${swotCount} SWOT signals are available before marketplace browsing.`,
      acceptance: "ADK/LangGraph等への反論を先に出し、その後で市場UIを見せる。"
    },
    {
      id: "ux-owner-budget",
      label: "UX owner budget",
      status: hasUxOwner ? "passed" : nextUxAgent ? "watch" : "missing",
      evidence: hasUxOwner
        ? "A UX/story owner is already selected."
        : nextUxAgent
          ? `${nextUxAgent.name} is the next UX hire; budget gap ${budgetGap}.`
          : "No explicit UX/story owner is selected or recommended.",
      acceptance: "UX不足を隠さず、必要な追加雇用や予算差分として説明する。"
    },
    {
      id: "external-gap-honesty",
      label: "External gap honesty",
      status: "passed",
      evidence: `${externalWatchCount} external submission URL rows remain visible instead of being treated as done.`,
      acceptance: "ProtoPedia/動画URL未発行をユーザビリティ不足と混同せず、提出watchとして表示する。"
    }
  ];
  const score = Math.round(clamp(average(checks.map((check) => scoreFromStatus(check.status)))));
  const readiness: UsabilityProofReadiness =
    checks.some((check) => check.status === "missing") || usabilityScore < 70
      ? "needs-usability-proof"
      : hasUxOwner && score >= 92
        ? "usability-locked"
        : "usability-budget-watch";

  return {
    id: `usability-proof-${score}-${readiness}`,
    score,
    readiness,
    headline:
      readiness === "usability-locked"
        ? "First-run usability is locked with an explicit UX/story owner."
        : readiness === "usability-budget-watch"
          ? "First-run route is defensible; the UX owner remains an honest budget watch."
          : "The judge route needs a first-click or proof-asset fix before it can carry the demo.",
    firstClick: "Run judge proof",
    nextUxAgent: nextUxAgent?.name ?? null,
    budgetGap,
    checks,
    judgeAnswer:
      readiness === "usability-locked"
        ? "初見審査員はRun judge proofから入り、Gemini、Cloud Run、A2A、競合反論、提出watchを同じ順番で確認できます。"
        : nextUxAgent
          ? `140予算内では現在編成が最適です。UX専任の${nextUxAgent.name}を入れるには+${budgetGap}が必要なので、Demo ConciergeとJudge Route Lockで先に導線を固定します。`
          : "Run judge proofを入口にし、競合反論と提出watchを先に見せる導線へ寄せます。"
  };
}

export function buildJudgeProof(input: {
  baseUrl: string;
  recommendation: Recommendation;
  strategy: WinningStrategy;
  mission: MissionRun;
  opsDrill: OpsDrill;
  gemini: GeminiRecommendation;
  ci?: CiProof;
}): JudgeProof {
  const { baseUrl, recommendation, strategy, mission, opsDrill, gemini } = input;
  const generatedAt = new Date().toISOString();
  const ciProof = input.ci ?? defaultCiProof(mission.submissionPack.publicGitHubUrl, generatedAt);
  const hasGemini = gemini.source === "gemini";
  const hasMarketBroker = recommendation.selected.some((agent) => agent.id === "market-broker");
  const readyRequirements = mission.submissionPack.requirements.filter((item) => item.status === "ready").length;
  const requirementScore = Math.round((readyRequirements / mission.submissionPack.requirements.length) * 100);
  const ciScore = scoreFromStatus(ciProof.status);
  const geminiProofLock = buildGeminiProofLock({ recommendation, mission, opsDrill, gemini, ci: ciProof });
  const usabilityProofLock = buildUsabilityProofLock({ recommendation, strategy, mission });

  const scores = {
    ai: Math.round(average([hasGemini ? 100 : 68, geminiProofLock.score])),
    cloudRun: mission.submissionPack.deployedUrl.startsWith("https://") ? 100 : 42,
    a2a: hasMarketBroker ? 100 : 70,
    strategy: Math.round(average([strategy.judgeScore, strategy.moatScore])),
    usability: usabilityProofLock.score,
    devops: Math.round(average([mission.verificationScore, opsDrill.readinessScore, ciScore])),
    ci: ciScore,
    submission: Math.round(average([mission.submissionScore, requirementScore]))
  };
  const overallScore = Math.round(clamp(average(Object.values(scores))));
  const links = {
    app: mission.submissionPack.deployedUrl || baseUrl,
    github: mission.submissionPack.publicGitHubUrl,
    ci: ciProof.workflowUrl,
    agentCard: absoluteUrl(baseUrl, "/.well-known/agent-card.json"),
    a2a: absoluteUrl(baseUrl, "/a2a"),
    architecture: absoluteUrl(baseUrl, mission.submissionPack.architectureDiagramUrl),
    story: absoluteUrl(baseUrl, mission.submissionPack.storyMarkdownPath)
  };

  const proofItems: ProofItem[] = [
    {
      id: "gemini",
      label: "Gemini API live analysis",
      status: hasGemini ? "passed" : "watch",
      evidence: hasGemini ? `${gemini.model} returned a live strategy analysis.` : `Fallback response: ${gemini.executiveSummary}`,
      url: links.app
    },
    {
      id: "cloud-run",
      label: "Cloud Run public deployment",
      status: "passed",
      evidence: `${mission.submissionPack.deployedUrl} is the deployed service URL.`,
      url: mission.submissionPack.deployedUrl
    },
    {
      id: "a2a",
      label: "A2A Agent Card and JSON-RPC endpoint",
      status: hasMarketBroker ? "passed" : "watch",
      evidence:
        "Agent Card exposes market.discover, agent.hire, contract.issue, task.delegate, strategy.audit, market.intel, moat.stress, competitive.battlecard, competitive.snapshot, judge.snapshot, mvp.audit, mvp.snapshot, acceptance.matrix, judge.brief, judge.command, judge.rehearsal, winner.packet, submission.runway, submission.assets, prize.strategy, win.gap.radar, judge.tour, user.pilot, squad.optimize, evidence.monitor, observability.oracle, release.drift, deploy.recover, demo.receipt, autonomy.ledger, mission.run, submission.package, submission.publish, submission.dossier, submission.launch, submission.closeout, security.review, impact.case, pilot.economics, demo.runway, win.autopilot, ops.drill, ci.verify, pitch.director, judge.drill, finalist.simulate, and judge.proof.",
      url: links.agentCard
    },
    {
      id: "strategy",
      label: "Competitive strategy and SWOT",
      status: statusFromScore(scores.strategy),
      evidence: `${strategy.competitors.length} competitors, SWOT quadrants, judge score ${strategy.judgeScore}, moat ${strategy.moatScore}.`,
      url: links.story
    },
    {
      id: "usability",
      label: "First-run usability proof",
      status:
        usabilityProofLock.readiness === "needs-usability-proof"
          ? "missing"
          : usabilityProofLock.readiness === "usability-budget-watch"
            ? "watch"
            : "passed",
      evidence: `${usabilityProofLock.headline} First click: ${usabilityProofLock.firstClick}; UX budget gap ${usabilityProofLock.budgetGap}.`,
      url: links.app
    },
    {
      id: "mission",
      label: "Autonomous mission evidence",
      status: statusFromScore(mission.autonomyScore),
      evidence: `${mission.summary} Verification score ${mission.verificationScore}.`,
      url: links.app
    },
    {
      id: "ops",
      label: "Cloud Run operations drill",
      status: opsDrill.rollbackRecommended ? "watch" : statusFromScore(opsDrill.readinessScore),
      evidence: `${opsDrill.severity} severity, readiness ${opsDrill.readinessScore}, rollback ${opsDrill.rollbackRecommended ? "recommended" : "not recommended"}.`,
      url: links.app
    },
    {
      id: "ci",
      label: "GitHub Actions quality gate",
      status: ciProof.status,
      evidence: ciProof.evidence,
      url: ciProof.url
    },
    {
      id: "submission",
      label: "Submission assets",
      status: mission.submissionScore >= 80 ? "passed" : "watch",
      evidence: `${readyRequirements}/${mission.submissionPack.requirements.length} required assets are ready; ProtoPedia/video remain external if not linked.`,
      url: links.github
    }
  ];

  const id = `proof-${overallScore}-${mission.id}`;
  const receiptPayload: ProofReceiptPayload = {
    proofId: id,
    issuedAt: generatedAt,
    overallScore,
    scores,
    links,
    ci: {
      status: ciProof.status,
      conclusion: ciProof.conclusion,
      branch: ciProof.branch,
      checkedAt: ciProof.checkedAt,
      runId: ciProof.runId ?? null
    },
    geminiSource: gemini.source,
    geminiModel: gemini.model,
    geminiProofLock: {
      score: geminiProofLock.score,
      readiness: geminiProofLock.readiness,
      checks: geminiProofLock.checks.map((check) => ({ id: check.id, status: check.status }))
    },
    usabilityProofLock: {
      score: usabilityProofLock.score,
      readiness: usabilityProofLock.readiness,
      budgetGap: usabilityProofLock.budgetGap,
      checks: usabilityProofLock.checks.map((check) => ({ id: check.id, status: check.status }))
    },
    proofItemStatuses: proofItems.map((item) => ({ id: item.id, status: item.status })),
    missionId: mission.id,
    opsDrillId: opsDrill.id,
    rollbackRecommended: opsDrill.rollbackRecommended
  };
  const receipt: ProofReceipt = {
    algorithm: "sha256",
    digest: proofDigest(receiptPayload),
    payload: receiptPayload,
    verification: "Recompute sha256 over the canonical JSON of receipt.payload and compare it with receipt.digest."
  };

  return {
    id,
    generatedAt,
    summary: `Judge proof bundle scored ${overallScore}: Gemini ${scores.ai}, Cloud Run ${scores.cloudRun}, A2A ${scores.a2a}, strategy ${scores.strategy}, usability ${scores.usability}, DevOps ${scores.devops}, CI ${scores.ci}, submission ${scores.submission}.`,
    overallScore,
    scores,
    links,
    proofItems,
    geminiProofLock,
    usabilityProofLock,
    receipt,
    runbook: [
      `curl -s ${absoluteUrl(baseUrl, "/api/healthz")}`,
      `curl -s ${links.agentCard}`,
      `curl -s ${links.ci}`,
      `curl -s -X POST ${absoluteUrl(baseUrl, "/api/judge-command-center")} -H 'Content-Type: application/json' --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'`,
      `curl -s -X POST ${absoluteUrl(baseUrl, "/api/demo-concierge")} -H 'Content-Type: application/json' --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'`,
      `curl -s -X POST ${absoluteUrl(baseUrl, "/api/user-pilot")} -H 'Content-Type: application/json' --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'`,
      `curl -s -X POST ${absoluteUrl(baseUrl, "/api/competitive-battlecard")} -H 'Content-Type: application/json' --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'`,
      `curl -s -X POST ${absoluteUrl(baseUrl, "/api/win-gap-radar")} -H 'Content-Type: application/json' --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'`,
      `curl -s -X POST ${absoluteUrl(baseUrl, "/api/prize-strategy")} -H 'Content-Type: application/json' --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'`,
      `curl -s -X POST ${absoluteUrl(baseUrl, "/api/submission-closeout")} -H 'Content-Type: application/json' --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'`,
      `curl -s -X POST ${absoluteUrl(baseUrl, "/api/judge-rehearsal")} -H 'Content-Type: application/json' --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'`,
      `curl -s -X POST ${absoluteUrl(baseUrl, "/api/winner-packet")} -H 'Content-Type: application/json' --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'`,
      `curl -s -X POST ${absoluteUrl(baseUrl, "/api/submission-runway")} -H 'Content-Type: application/json' --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"],"skipReleaseDrift":true}'`,
      `curl -s -X POST ${absoluteUrl(baseUrl, "/api/deploy-recovery")} -H 'Content-Type: application/json' --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'`,
      `curl -s -X POST ${absoluteUrl(baseUrl, "/api/impact-case")} -H 'Content-Type: application/json' --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'`,
      `curl -s -X POST ${absoluteUrl(baseUrl, "/api/pilot-economics")} -H 'Content-Type: application/json' --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'`,
      `curl -s -X POST ${absoluteUrl(baseUrl, "/api/proof")} -H 'Content-Type: application/json' --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'`,
      `curl -s -X POST ${absoluteUrl(baseUrl, "/api/proof")} -H 'Content-Type: application/json' --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}' | jq '.receipt'`,
      ...mission.verificationCommands,
      ...opsDrill.runbookCommands
    ],
    gemini,
    strategy: {
      judgeScore: strategy.judgeScore,
      mvpScore: strategy.mvpScore,
      moatScore: strategy.moatScore,
      riskLevel: strategy.riskLevel,
      topCompetitor: strategy.competitors[0]?.name ?? "none",
      nextBestAgent: strategy.nextBestAgent?.agent.name ?? null
    },
    mission: {
      id: mission.id,
      summary: mission.summary,
      autonomyScore: mission.autonomyScore,
      verificationScore: mission.verificationScore,
      submissionScore: mission.submissionScore,
      weakestCriterion: mission.weakestCriterion.label
    },
    opsDrill: {
      id: opsDrill.id,
      severity: opsDrill.severity,
      readinessScore: opsDrill.readinessScore,
      rollbackRecommended: opsDrill.rollbackRecommended,
      nextOpsAgent: opsDrill.nextOpsAgent?.name ?? null
    },
    ci: {
      status: ciProof.status,
      conclusion: ciProof.conclusion,
      branch: ciProof.branch,
      checkedAt: ciProof.checkedAt,
      runId: ciProof.runId ?? null
    }
  };
}
