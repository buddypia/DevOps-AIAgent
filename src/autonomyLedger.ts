import { createHash } from "node:crypto";
import type { SquadContract } from "./contracts.js";
import type { MissionRun } from "./mission.js";
import type { OpsDrill } from "./ops.js";
import type { JudgeProof } from "./proof.js";
import type { WinningStrategy } from "./strategy.js";
import type { Recommendation } from "./types.js";

export type AutonomyLedgerStatus = "verified" | "watch" | "blocked";
export type AutonomyLedgerPhase = "sense" | "decide" | "contract" | "delegate" | "verify" | "operate" | "submit";

export type AutonomyMetric = {
  id: string;
  label: string;
  value: string;
  score: number;
  status: AutonomyLedgerStatus;
};

export type AutonomyLedgerEvent = {
  id: string;
  phase: AutonomyLedgerPhase;
  actor: string;
  decision: string;
  action: string;
  evidence: string;
  verifier: string;
  endpoint: string;
  status: AutonomyLedgerStatus;
};

export type AutonomyHandoff = {
  id: string;
  agentName: string;
  scope: string;
  acceptance: string;
  proof: string;
  status: AutonomyLedgerStatus;
};

export type AutonomyChallenge = {
  id: string;
  challenge: string;
  answer: string;
  proof: string;
};

export type AutonomyReceipt = {
  algorithm: "sha256";
  digest: string;
  verification: string;
};

export type AutonomyLedger = {
  id: string;
  ledgerScore: number;
  verdict: "agent-led" | "agent-led-with-external-gaps" | "needs-stronger-autonomy";
  autonomyClaim: string;
  summary: string;
  metrics: AutonomyMetric[];
  chain: AutonomyLedgerEvent[];
  handoffs: AutonomyHandoff[];
  challengeAnswers: AutonomyChallenge[];
  receipt: AutonomyReceipt;
  a2aPayload: Record<string, unknown>;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function statusFromScore(score: number): AutonomyLedgerStatus {
  if (score >= 84) return "verified";
  if (score >= 64) return "watch";
  return "blocked";
}

function absoluteUrl(baseUrl: string, path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function digest(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function buildAutonomyLedger(input: {
  baseUrl: string;
  recommendation: Recommendation;
  strategy: WinningStrategy;
  mission: MissionRun;
  opsDrill: OpsDrill;
  squadContract: SquadContract;
  proof: JudgeProof;
}): AutonomyLedger {
  const { baseUrl, recommendation, strategy, mission, opsDrill, squadContract, proof } = input;
  const agentCriterion = strategy.judgeCriteria.find((criterion) => criterion.id === "agentCentrality");
  const proofStatusScore = proof.proofItems.filter((item) => item.status === "passed").length / proof.proofItems.length;
  const contractAcceptanceScore = average(squadContract.contracts.map((contract) => (contract.risk === "low" ? 92 : contract.risk === "medium" ? 76 : 48)));
  const ledgerScore = Math.round(
    clamp(
      average([
        mission.autonomyScore,
        agentCriterion?.score ?? strategy.judgeScore,
        proof.scores.ai,
        proof.scores.a2a,
        proof.scores.devops,
        opsDrill.readinessScore,
        squadContract.contractScore,
        Math.round(proofStatusScore * 100),
        contractAcceptanceScore
      ])
    )
  );
  const hasExternalGaps = mission.submissionPack.requirements.some((requirement) => requirement.status === "needs-url");
  const verdict =
    ledgerScore >= 84 && !hasExternalGaps
      ? "agent-led"
      : ledgerScore >= 76
        ? "agent-led-with-external-gaps"
        : "needs-stronger-autonomy";
  const selectedAgents = recommendation.selected.map((agent) => agent.name).join(" / ") || "A2A Market Broker";
  const weakest = mission.weakestCriterion.label;
  const nextHire = strategy.nextBestAgent?.agent.name ?? "追加雇用なし";

  const metrics: AutonomyMetric[] = [
    { id: "ledger", label: "Autonomy ledger", value: String(ledgerScore), score: ledgerScore, status: statusFromScore(ledgerScore) },
    { id: "agent-centrality", label: "Agent centrality", value: `${agentCriterion?.score ?? strategy.judgeScore}`, score: agentCriterion?.score ?? strategy.judgeScore, status: statusFromScore(agentCriterion?.score ?? strategy.judgeScore) },
    { id: "mission", label: "Mission", value: String(mission.autonomyScore), score: mission.autonomyScore, status: statusFromScore(mission.autonomyScore) },
    { id: "a2a", label: "A2A", value: String(proof.scores.a2a), score: proof.scores.a2a, status: statusFromScore(proof.scores.a2a) },
    { id: "contract", label: "Contracts", value: String(squadContract.contractScore), score: squadContract.contractScore, status: statusFromScore(squadContract.contractScore) },
    { id: "ops", label: "Ops", value: String(opsDrill.readinessScore), score: opsDrill.readinessScore, status: statusFromScore(opsDrill.readinessScore) }
  ];

  const chain: AutonomyLedgerEvent[] = [
    {
      id: "sense-market",
      phase: "sense",
      actor: "A2A Market Broker",
      decision: `${strategy.competitors.length}競合とSWOTから、作る基盤ではなくAI能力調達で勝つと判断`,
      action: "競合比較、SWOT、審査スコアを生成",
      evidence: strategy.competitors[0]?.counterPosition ?? strategy.strategicThesis,
      verifier: "Market Intel / Winning Strategy",
      endpoint: absoluteUrl(baseUrl, "/api/market-intel"),
      status: statusFromScore(strategy.judgeScore)
    },
    {
      id: "decide-gap",
      phase: "decide",
      actor: "Gemini Strategist",
      decision: `${weakest} を最弱項目として補強対象にした`,
      action: `${nextHire} を次に雇う候補として提示`,
      evidence: mission.decisions.find((decision) => decision.id === "weakness-repair")?.evidence ?? mission.summary,
      verifier: "Mission Control",
      endpoint: absoluteUrl(baseUrl, "/api/mission"),
      status: statusFromScore(mission.autonomyScore)
    },
    {
      id: "contract-acceptance",
      phase: "contract",
      actor: "Contract Desk",
      decision: `${squadContract.contracts.length}件のAI契約を受入条件付きで発行`,
      action: "scope、deliverables、acceptance、SLA、verification commandを固定",
      evidence: squadContract.summary,
      verifier: "Contract acceptance runbook",
      endpoint: absoluteUrl(baseUrl, "/api/contracts"),
      status: statusFromScore(squadContract.contractScore)
    },
    {
      id: "delegate-a2a",
      phase: "delegate",
      actor: "Agent Card",
      decision: `${selectedAgents} にA2A message/sendで委任できる状態を公開`,
      action: "Agent CardとJSON-RPC endpointでskill surfaceを提示",
      evidence: proof.proofItems.find((item) => item.id === "a2a")?.evidence ?? "A2A endpoint ready",
      verifier: "Judge Proof",
      endpoint: proof.links.agentCard,
      status: statusFromScore(proof.scores.a2a)
    },
    {
      id: "verify-proof",
      phase: "verify",
      actor: "Judge Proof",
      decision: "Gemini、Cloud Run、A2A、CI、提出URLを証拠束にまとめた",
      action: "proof receiptとrunbookで再検証可能にする",
      evidence: `${proof.summary} receipt ${proof.receipt.digest}`,
      verifier: "sha256 receipt / GitHub Actions",
      endpoint: absoluteUrl(baseUrl, "/api/proof"),
      status: statusFromScore(proof.overallScore)
    },
    {
      id: "operate-release",
      phase: "operate",
      actor: "Cloud Run SRE",
      decision: opsDrill.rollbackRecommended ? "公開前にrollbackを選ぶ" : "watch項目を分離して公開継続を選ぶ",
      action: "health、latency、5xx、fallback、budget、external URLを評価",
      evidence: opsDrill.summary,
      verifier: "Ops Drill",
      endpoint: absoluteUrl(baseUrl, "/api/ops-drill"),
      status: opsDrill.rollbackRecommended ? "watch" : statusFromScore(opsDrill.readinessScore)
    },
    {
      id: "submit-pack",
      phase: "submit",
      actor: "Submission owner + Publisher",
      decision: hasExternalGaps ? "ProtoPedia作品URLと動画URLは外部作業として残す" : "提出3点をリンク付きで確定",
      action: "提出パック、構成図、タグ、30秒動画導線を固定",
      evidence: mission.submissionPack.requirements.map((requirement) => `${requirement.id}:${requirement.status}`).join(", "),
      verifier: "MVP Audit / Submission Dossier",
      endpoint: absoluteUrl(baseUrl, "/api/dossier"),
      status: hasExternalGaps ? "watch" : "verified"
    }
  ];

  const handoffs: AutonomyHandoff[] = squadContract.contracts.map((contract) => ({
    id: contract.id,
    agentName: contract.agentName,
    scope: contract.scope,
    acceptance: contract.acceptanceCriteria[0] ?? "Public API evidence must exist",
    proof: contract.verificationCommands[0] ?? "/api/proof",
    status: contract.risk === "high" ? "blocked" : contract.risk === "medium" ? "watch" : "verified"
  }));

  const challengeAnswers: AutonomyChallenge[] = [
    {
      id: "not-dashboard",
      challenge: "これは単なるダッシュボードではないのか",
      answer: "入力ブリーフから市場探索、弱点判定、次の雇用、A2A委任、検証runbook、運用判断までを連鎖させ、各判断にactorとverifierを持たせています。",
      proof: chain.map((event) => `${event.phase}:${event.verifier}`).join(" -> ")
    },
    {
      id: "why-agent-needed",
      challenge: "なぜAIエージェントが価値の中心なのか",
      answer: "人間はブリーフを渡すだけで、どのAI能力を買うか、どの審査項目を補うか、公開継続かrollbackかをエージェント側の証拠台帳が決めます。",
      proof: `${mission.decisions.length} mission decisions, ${opsDrill.decisions.length} ops decisions, ${squadContract.contracts.length} contracts`
    },
    {
      id: "devops-loop",
      challenge: "DevOpsの企画から運用まで閉じているか",
      answer: "企画はMarket Intel、開発/検収はContract Desk、デプロイはCloud Run、運用はOps Drill、提出はDossierへ接続しています。",
      proof: chain.map((event) => event.endpoint).join("\n")
    }
  ];

  const receiptPayload = {
    ledgerScore,
    verdict,
    chain: chain.map((event) => ({ id: event.id, status: event.status, endpoint: event.endpoint })),
    handoffs: handoffs.map((handoff) => ({ id: handoff.id, status: handoff.status })),
    proofDigest: proof.receipt.digest
  };
  const receipt: AutonomyReceipt = {
    algorithm: "sha256",
    digest: digest(receiptPayload),
    verification: "Recompute sha256 over the ledger receipt payload fields: score, verdict, chain, handoffs, and proof digest."
  };

  return {
    id: `autonomy-ledger-${ledgerScore}-${mission.id}`,
    ledgerScore,
    verdict,
    autonomyClaim:
      "この作品の中心価値は、AIを作ることではなく、必要なAI能力を発見し、雇い、A2Aで委任し、検収・運用・提出まで証拠付きで閉じる判断連鎖です。",
    summary: `${selectedAgents} が sense -> decide -> contract -> delegate -> verify -> operate -> submit の自律台帳を生成しました。`,
    metrics,
    chain,
    handoffs,
    challengeAnswers,
    receipt,
    a2aPayload: {
      method: "message/send",
      skill: "autonomy.ledger",
      ledgerScore,
      verdict,
      phases: chain.map((event) => ({ id: event.id, phase: event.phase, status: event.status })),
      handoffs: handoffs.map((handoff) => ({ id: handoff.id, status: handoff.status })),
      receipt: receipt.digest
    }
  };
}
