import type { WinningAutopilotRun } from "./autopilot.js";
import type { SubmissionDossier } from "./dossier.js";
import type { FinalistSimulation } from "./finalist.js";
import type { MarketIntelReport } from "./marketIntel.js";
import type { MvpAuditReport } from "./mvpAudit.js";
import type { JudgeProof } from "./proof.js";
import type { WinningStrategy } from "./strategy.js";
import type { Recommendation } from "./types.js";

export type JudgeBriefReadiness = "demo-ready" | "external-gaps" | "needs-fix";
export type JudgeBriefTone = "lead" | "watch" | "block";

export type JudgeBriefMetric = {
  id: string;
  label: string;
  value: string;
  tone: JudgeBriefTone;
};

export type JudgeBriefProof = {
  id: string;
  label: string;
  proof: string;
  url: string;
  tone: JudgeBriefTone;
};

export type JudgeBriefRisk = {
  id: string;
  label: string;
  owner: string;
  action: string;
  tone: JudgeBriefTone;
};

export type JudgeBrief = {
  id: string;
  briefScore: number;
  readiness: JudgeBriefReadiness;
  title: string;
  openingClaim: string;
  hardTruth: string;
  oneLineVerdict: string;
  keyMetrics: JudgeBriefMetric[];
  proofLadder: JudgeBriefProof[];
  demoRoute: string[];
  judgeAnswers: Array<{ id: string; label: string; answer: string; evidence: string }>;
  riskRegister: JudgeBriefRisk[];
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

function readinessFrom(input: { mvpAudit: MvpAuditReport; autopilot: WinningAutopilotRun; briefScore: number }): JudgeBriefReadiness {
  if (input.mvpAudit.gates.some((gate) => gate.status === "fail") || input.autopilot.readiness === "needs-build") return "needs-fix";
  if (input.mvpAudit.band === "submission-ready" && input.autopilot.readiness === "finalist-ready" && input.briefScore >= 88) return "demo-ready";
  return "external-gaps";
}

function toneFromScore(score: number): JudgeBriefTone {
  if (score >= 84) return "lead";
  if (score >= 65) return "watch";
  return "block";
}

function absoluteUrl(baseUrl: string, path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildJudgeBrief(input: {
  baseUrl: string;
  recommendation: Recommendation;
  strategy: WinningStrategy;
  marketIntel: MarketIntelReport;
  mvpAudit: MvpAuditReport;
  autopilot: WinningAutopilotRun;
  dossier: SubmissionDossier;
  proof: JudgeProof;
  finalist: FinalistSimulation;
}): JudgeBrief {
  const { baseUrl, recommendation, strategy, marketIntel, mvpAudit, autopilot, dossier, proof, finalist } = input;
  const briefScore = Math.round(
    clamp(average([marketIntel.marketScore, mvpAudit.mvpScore, autopilot.winScore, dossier.dossierScore, proof.overallScore, finalist.finalistScore]))
  );
  const readiness = readinessFrom({ mvpAudit, autopilot, briefScore });
  const selectedAgents = recommendation.selected.map((agent) => agent.name).join(" / ") || "A2A Market Broker";
  const externalBlockers = mvpAudit.blockers.filter((blocker) => blocker.id === "protopedia-url" || blocker.id === "video-url");
  const keyMetrics: JudgeBriefMetric[] = [
    { id: "brief", label: "Judge brief", value: String(briefScore), tone: toneFromScore(briefScore) },
    { id: "mvp", label: "MVP", value: `${mvpAudit.mvpScore} ${mvpAudit.band}`, tone: mvpAudit.band === "not-mvp" ? "block" : "watch" },
    { id: "market", label: "Market", value: `${marketIntel.marketScore} ${marketIntel.status}`, tone: toneFromScore(marketIntel.marketScore) },
    { id: "win", label: "Win", value: `${autopilot.winScore} ${autopilot.readiness}`, tone: autopilot.readiness === "needs-build" ? "block" : "watch" },
    { id: "proof", label: "Proof", value: `${proof.overallScore} overall`, tone: toneFromScore(proof.overallScore) },
    { id: "finalist", label: "Finalist", value: `${finalist.finalistScore} ${finalist.finalistBand}`, tone: finalist.finalistBand === "not-mvp" ? "block" : "watch" }
  ];
  const proofLadder: JudgeBriefProof[] = [
    {
      id: "market-intel",
      label: "Why this is different",
      proof: `${marketIntel.sources.length} official/primary sources, ${strategy.competitors.length} competitors, SWOT included.`,
      url: absoluteUrl(baseUrl, "/api/market-intel"),
      tone: toneFromScore(marketIntel.marketScore)
    },
    {
      id: "mvp-audit",
      label: "Whether it is MVP",
      proof: `${mvpAudit.gates.length} hard gates, ${mvpAudit.blockers.length} blockers, ${mvpAudit.band}.`,
      url: absoluteUrl(baseUrl, "/api/mvp-audit"),
      tone: mvpAudit.band === "not-mvp" ? "block" : "watch"
    },
    {
      id: "judge-proof",
      label: "What proves it runs",
      proof: proof.summary,
      url: absoluteUrl(baseUrl, "/api/proof"),
      tone: toneFromScore(proof.overallScore)
    },
    {
      id: "win-autopilot",
      label: "What to do next",
      proof: `${autopilot.lanes.length} lanes, ${autopilot.blockers.length} blockers, ${autopilot.readiness}.`,
      url: absoluteUrl(baseUrl, "/api/win-run"),
      tone: autopilot.readiness === "needs-build" ? "block" : "watch"
    },
    {
      id: "submission-dossier",
      label: "How to submit",
      proof: `${dossier.copyBlocks.length} copy blocks, ${dossier.links.length} links, ${dossier.readiness}.`,
      url: absoluteUrl(baseUrl, "/api/dossier"),
      tone: dossier.readiness === "ready-to-submit" ? "lead" : "watch"
    }
  ];
  const demoRoute = [
    "0-4s: Market Intelで競合/SWOTとAI能力調達の勝ち筋を見せる",
    "4-8s: MVP Auditで必須技術、審査5項目、提出3点のwatch/failを見せる",
    "8-12s: Judge Briefのkey metricsとhard truthを見せる",
    "12-18s: Win Autopilotで次アクションと証拠デッキを見せる",
    "18-24s: Judge ProofでGemini、Cloud Run、A2A、CIを見せる",
    "24-30s: Submission DossierでProtoPedia本文、録画順、外部残作業を見せる"
  ];
  const judgeAnswers = marketIntel.judgeAnswers.slice(0, 5).map((answer) => ({
    id: answer.criterionId,
    label: answer.label,
    answer: answer.answer,
    evidence: answer.evidence
  }));
  const riskRegister: JudgeBriefRisk[] =
    mvpAudit.blockers.length > 0
      ? mvpAudit.blockers.map((blocker) => ({
          id: blocker.id,
          label: blocker.label,
          owner: blocker.owner,
          action: blocker.action,
          tone: blocker.priority === "now" ? "watch" : "lead"
        }))
      : [
          {
            id: "none",
            label: "No blockers",
            owner: "Submission owner",
            action: "Record the final demo and submit.",
            tone: "lead"
          }
        ];
  const hardTruth =
    externalBlockers.length > 0
      ? `MVP機能は成立していますが、${externalBlockers.map((blocker) => blocker.label).join(" / ")} は外部作業として未完了です。`
      : mvpAudit.hardTruth;
  const oneLineVerdict =
    readiness === "demo-ready"
      ? "審査員にそのまま見せられる状態です。"
      : readiness === "external-gaps"
        ? "デモ可能。ただし外部提出URLが揃うまで提出完了とは言い切りません。"
        : "MVPとして出す前にfailゲートを直す必要があります。";

  return {
    id: `judge-brief-${briefScore}-${mvpAudit.id}`,
    briefScore,
    readiness,
    title: "Judge Brief: Agent-To-Agent Marketplace",
    openingClaim: `${selectedAgents} を市場から雇い、A2Aで委任し、Cloud Run運用と提出証拠まで閉じるAI能力調達ワークベンチです。`,
    hardTruth,
    oneLineVerdict,
    keyMetrics,
    proofLadder,
    demoRoute,
    judgeAnswers,
    riskRegister,
    links: [
      { id: "app", label: "Cloud Run", url: proof.links.app },
      { id: "github", label: "GitHub", url: proof.links.github },
      { id: "ci", label: "CI", url: proof.links.ci },
      { id: "agent-card", label: "Agent Card", url: proof.links.agentCard },
      { id: "architecture", label: "Architecture", url: proof.links.architecture }
    ],
    a2aPayload: {
      method: "message/send",
      skill: "judge.brief",
      briefScore,
      readiness,
      oneLineVerdict,
      metrics: keyMetrics.map((metric) => ({ id: metric.id, value: metric.value, tone: metric.tone })),
      risks: riskRegister.map((risk) => ({ id: risk.id, tone: risk.tone, action: risk.action }))
    }
  };
}
