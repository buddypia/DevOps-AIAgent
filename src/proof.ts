import { createHash } from "node:crypto";
import type { GeminiRecommendation, Recommendation } from "./types.js";
import type { MissionRun } from "./mission.js";
import type { OpsDrill } from "./ops.js";
import type { WinningStrategy } from "./strategy.js";

export type ProofStatus = "passed" | "watch" | "missing";

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

  const scores = {
    ai: hasGemini ? 100 : 68,
    cloudRun: mission.submissionPack.deployedUrl.startsWith("https://") ? 100 : 42,
    a2a: hasMarketBroker ? 100 : 70,
    strategy: Math.round(average([strategy.judgeScore, strategy.moatScore])),
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
        "Agent Card exposes market.discover, agent.hire, contract.issue, task.delegate, strategy.audit, market.intel, mvp.audit, judge.brief, autonomy.ledger, mission.run, submission.package, submission.publish, submission.dossier, submission.launch, security.review, impact.case, demo.runway, win.autopilot, ops.drill, ci.verify, pitch.director, judge.drill, finalist.simulate, and judge.proof.",
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
    summary: `Judge proof bundle scored ${overallScore}: Gemini ${scores.ai}, Cloud Run ${scores.cloudRun}, A2A ${scores.a2a}, strategy ${scores.strategy}, DevOps ${scores.devops}, CI ${scores.ci}, submission ${scores.submission}.`,
    overallScore,
    scores,
    links,
    proofItems,
    receipt,
    runbook: [
      `curl -s ${absoluteUrl(baseUrl, "/api/healthz")}`,
      `curl -s ${links.agentCard}`,
      `curl -s ${links.ci}`,
      `curl -s -X POST ${absoluteUrl(baseUrl, "/api/impact-case")} -H 'Content-Type: application/json' --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'`,
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
