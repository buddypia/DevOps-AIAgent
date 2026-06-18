import { createHash } from "node:crypto";
import type { WinningAutopilotRun } from "./autopilot.js";
import type { JudgeDemoReceipt } from "./demoReceipt.js";
import type { ImpactCase } from "./impact.js";
import type { MarketIntelReport } from "./marketIntel.js";
import type { MvpAuditGate, MvpAuditReport } from "./mvpAudit.js";
import { observabilityProofScore, type ObservabilityOracle } from "./observabilityOracle.js";
import type { PilotEconomics } from "./pilotEconomics.js";
import type { JudgeProof } from "./proof.js";
import type { ReleaseDriftGuard } from "./releaseDrift.js";
import type { SecurityReview } from "./security.js";
import type { SubmissionLaunchGate } from "./submissionLaunch.js";
import type { WinningStrategy } from "./strategy.js";
import type { UserPilotLab } from "./userPilot.js";

export type AcceptanceStatus = "accepted" | "watch" | "blocked";
export type AcceptanceArea = "required" | "judge" | "proof" | "submission";
export type AcceptanceVerdict = "ready-to-submit" | "accepted-with-external-gaps" | "not-accepted";

export type AcceptanceRow = {
  id: string;
  label: string;
  area: AcceptanceArea;
  status: AcceptanceStatus;
  score: number;
  requirement: string;
  evidence: string;
  proofUrl: string;
  nextAction: string;
};

export type AcceptanceAction = {
  id: string;
  priority: "now" | "next";
  owner: string;
  action: string;
  proof: string;
};

export type AcceptanceDigest = {
  algorithm: "sha256";
  digest: string;
  verification: string;
};

export type JudgeAcceptanceMatrix = {
  id: string;
  generatedAt: string;
  acceptanceScore: number;
  verdict: AcceptanceVerdict;
  headline: string;
  hardTruth: string;
  rows: AcceptanceRow[];
  nextActions: AcceptanceAction[];
  decisiveProof: Array<{ id: string; label: string; value: string; proof: string }>;
  digest: AcceptanceDigest;
  a2aPayload: Record<string, unknown>;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function digest(value: unknown) {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

function absoluteUrl(baseUrl: string, path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function statusFromScore(score: number): AcceptanceStatus {
  if (score >= 82) return "accepted";
  if (score >= 62) return "watch";
  return "blocked";
}

function statusFromGate(gate?: MvpAuditGate): AcceptanceStatus {
  if (!gate) return "blocked";
  if (gate.status === "pass") return "accepted";
  if (gate.status === "watch") return "watch";
  return "blocked";
}

function gateById(report: MvpAuditReport, id: string) {
  return report.gates.find((gate) => gate.id === id);
}

function criterionScore(strategy: WinningStrategy, id: string) {
  return strategy.judgeCriteria.find((criterion) => criterion.id === id)?.score ?? strategy.judgeScore;
}

function laneById(autopilot: WinningAutopilotRun, id: string) {
  return autopilot.lanes.find((lane) => lane.id === id);
}

function row(input: AcceptanceRow): AcceptanceRow {
  return {
    ...input,
    score: Math.round(clamp(input.score))
  };
}

function actionFromRow(rowItem: AcceptanceRow): AcceptanceAction {
  const external = rowItem.id === "submission-assets" || rowItem.id === "demo-receipt";
  const release = rowItem.id === "release-drift";
  return {
    id: rowItem.id,
    priority: rowItem.status === "blocked" || external || release ? "now" : "next",
    owner: release ? "Cloud Run SRE" : external ? "Submission owner" : rowItem.area === "proof" ? "Cloud Run SRE" : "A2A Market Broker",
    action: rowItem.nextAction,
    proof: rowItem.evidence
  };
}

function statusFromLaunch(readiness: SubmissionLaunchGate["readiness"]): AcceptanceStatus {
  if (readiness === "submit-ready") return "accepted";
  if (readiness === "needs-external-urls") return "watch";
  return "blocked";
}

function launchItemScore(status: "ready" | "missing" | "invalid") {
  if (status === "ready") return 100;
  if (status === "missing") return 58;
  return 20;
}

function verdictFrom(rows: AcceptanceRow[]): AcceptanceVerdict {
  if (rows.some((item) => item.status === "blocked")) return "not-accepted";
  if (rows.every((item) => item.status === "accepted")) return "ready-to-submit";
  return "accepted-with-external-gaps";
}

export function buildJudgeAcceptanceMatrix(input: {
  baseUrl: string;
  strategy: WinningStrategy;
  marketIntel: MarketIntelReport;
  mvpAudit: MvpAuditReport;
  autopilot: WinningAutopilotRun;
  proof: JudgeProof;
  userPilot: UserPilotLab;
  impactCase: ImpactCase;
  pilotEconomics: PilotEconomics;
  observabilityOracle?: ObservabilityOracle;
  securityReview: SecurityReview;
  demoReceipt: JudgeDemoReceipt;
  releaseDrift?: ReleaseDriftGuard;
  submissionLaunch?: SubmissionLaunchGate;
  generatedAt?: string;
}): JudgeAcceptanceMatrix {
  const base = input.baseUrl.replace(/\/$/, "");
  const cloudRunGate = gateById(input.mvpAudit, "cloud-run-runtime");
  const geminiGate = gateById(input.mvpAudit, "gemini-ai");
  const a2aGate = gateById(input.mvpAudit, "a2a-core");
  const marketGate = gateById(input.mvpAudit, "market-swot");
  const githubGate = gateById(input.mvpAudit, "github-url");
  const deployedGate = gateById(input.mvpAudit, "deployed-url");
  const protopediaGate = gateById(input.mvpAudit, "protopedia-url");
  const videoGate = gateById(input.mvpAudit, "video-url");
  const liveLane = laneById(input.autopilot, "live-evidence");
  const moatLane = laneById(input.autopilot, "moat-stress");

  const submissionGates = [githubGate, deployedGate, protopediaGate, videoGate].filter((gate): gate is MvpAuditGate => Boolean(gate));
  const oracleScore = input.observabilityOracle ? observabilityProofScore(input.observabilityOracle) : undefined;
  const buyerSlo = input.observabilityOracle?.receipts.find((receipt) => receipt.id === "buyer-slo");
  const practicalImpactScore =
    oracleScore === undefined ? input.impactCase.impactScore : average([input.impactCase.impactScore, oracleScore, input.pilotEconomics.economicsScore]);
  const practicalImpactEvidence =
    oracleScore === undefined
      ? input.impactCase.hardTruth
      : `${input.impactCase.hardTruth} Observability Oracle ${input.observabilityOracle?.readiness}; ${buyerSlo?.metric ?? `${oracleScore} operational proof`}.`;
  const practicalImpactNextAction =
    oracleScore === undefined
      ? input.impactCase.nextImpactHire
        ? `${input.impactCase.nextImpactHire.name}を追加して実用性を補強する`
        : "Impact CaseをProtoPedia本文へ転記する"
      : `${buyerSlo?.metric ?? "Observability Oracleのbuyer SLO"}をProtoPedia本文と30秒動画へ入れる`;
  const submissionStatus = submissionGates.some((gate) => gate.status === "fail")
    ? "blocked"
    : submissionGates.some((gate) => gate.status === "watch")
      ? "watch"
      : "accepted";
  const launchCompliance = input.submissionLaunch?.protopediaCompliance;
  const complianceReadyCount = launchCompliance?.filter((item) => item.status === "ready").length ?? 0;
  const complianceTotal = launchCompliance?.length ?? 0;
  const launchSubmissionStatus = input.submissionLaunch ? statusFromLaunch(input.submissionLaunch.readiness) : submissionStatus;
  const launchSubmissionScore = input.submissionLaunch
    ? average([
        input.submissionLaunch.launchScore,
        ...input.submissionLaunch.urlStatuses.map((item) => launchItemScore(item.status)),
        ...input.submissionLaunch.protopediaCompliance.map((item) => launchItemScore(item.status))
      ])
    : average(submissionGates.map((gate) => gate.score));
  const launchSubmissionEvidence = input.submissionLaunch
    ? [
        `Launch Gate ${input.submissionLaunch.readiness}`,
        `ProtoPedia compliance ${complianceReadyCount}/${complianceTotal}`,
        input.submissionLaunch.urlStatuses.map((item) => `${item.label}:${item.status}`).join(" / ")
      ].join("; ")
    : submissionGates.map((gate) => `${gate.label}:${gate.status}`).join(" / ");

  const rows: AcceptanceRow[] = [
    row({
      id: "cloud-run-required",
      label: "Required runtime",
      area: "required",
      status: statusFromGate(cloudRunGate),
      score: cloudRunGate?.score ?? 0,
      requirement: "Cloud Run / Cloud Functions / GKE / App Engine / GCE / TPU/GPUのいずれか",
      evidence: cloudRunGate?.evidence ?? "Cloud runtime gate missing.",
      proofUrl: cloudRunGate?.url ?? absoluteUrl(base, "/api/healthz"),
      nextAction: cloudRunGate?.nextAction ?? "Cloud Run runtime proofを追加する"
    }),
    row({
      id: "google-ai-required",
      label: "Required Google AI",
      area: "required",
      status: statusFromGate(geminiGate),
      score: geminiGate?.score ?? 0,
      requirement: "Gemini API / ADK / Agent Builder / Gemma / Imagen / Google AI APIのいずれか",
      evidence: geminiGate?.evidence ?? "Google AI gate missing.",
      proofUrl: geminiGate?.url ?? absoluteUrl(base, "/api/proof"),
      nextAction: geminiGate?.nextAction ?? "Gemini evidenceをJudge Proofに接続する"
    }),
    row({
      id: "a2a-agent-center",
      label: "AI agent centrality",
      area: "judge",
      status: statusFromGate(a2aGate),
      score: a2aGate?.score ?? 0,
      requirement: "AIエージェントが価値の中心で、自律的判断と実行が必然であること",
      evidence: a2aGate?.evidence ?? "A2A centrality gate missing.",
      proofUrl: a2aGate?.url ?? absoluteUrl(base, "/.well-known/agent-card.json"),
      nextAction: a2aGate?.nextAction ?? "Agent CardとA2A payloadを見せる"
    }),
    row({
      id: "competitive-swot",
      label: "Competitive/SWOT proof",
      area: "judge",
      status: statusFromGate(marketGate),
      score: marketGate?.score ?? 0,
      requirement: "課題アプローチ力: 一貫したストーリー、新規性、競合差別化",
      evidence: marketGate?.evidence ?? `${input.marketIntel.sources.length} sources / ${input.strategy.competitors.length} competitors.`,
      proofUrl: marketGate?.url ?? absoluteUrl(base, "/api/market-intel"),
      nextAction: marketGate?.nextAction ?? "Market Intel Boardを録画導線へ入れる"
    }),
    row({
      id: "moat-rebuttal",
      label: "Moat rebuttal",
      area: "judge",
      status: moatLane?.status === "blocked" ? "blocked" : moatLane?.status === "passed" ? "accepted" : "watch",
      score: moatLane?.score ?? input.strategy.moatScore,
      requirement: "既存フレームワークでよいのでは、への証拠付き反論",
      evidence: moatLane?.proof ?? `${input.strategy.competitors.length} competitors and moat ${input.strategy.moatScore}.`,
      proofUrl: moatLane?.evidenceUrl ?? absoluteUrl(base, "/api/moat-stress"),
      nextAction: moatLane?.action ?? "Moat Stress Testを動画内で見せる"
    }),
    row({
      id: "usability-first-run",
      label: "First-run usability",
      area: "judge",
      status: input.userPilot.readiness === "pilot-ready" ? "accepted" : input.userPilot.readiness === "needs-guidance" ? "watch" : "blocked",
      score: input.userPilot.pilotScore,
      requirement: "ユーザビリティ: 初見ユーザーが最初の3分で価値に到達できること",
      evidence: `${input.userPilot.paths.length} persona paths; ${input.userPilot.readiness}.`,
      proofUrl: absoluteUrl(base, "/api/user-pilot"),
      nextAction: input.userPilot.nextClicks[0]
        ? `${input.userPilot.nextClicks[0].screen}で${input.userPilot.nextClicks[0].button}を実行する`
        : "User Pilot Labを再実行する"
    }),
    row({
      id: "practical-impact",
      label: "Practical value",
      area: "judge",
      status: oracleScore === undefined ? (input.impactCase.posture === "pilot-ready" ? "accepted" : input.impactCase.posture === "needs-pilot-proof" ? "watch" : "blocked") : statusFromScore(practicalImpactScore),
      score: practicalImpactScore,
      requirement: "実用性・体験価値: 現場価値、KPI、導入後の効果が説明できること",
      evidence: practicalImpactEvidence,
      proofUrl: oracleScore === undefined ? absoluteUrl(base, "/api/impact-case") : absoluteUrl(base, "/api/observability-oracle"),
      nextAction: practicalImpactNextAction
    }),
    row({
      id: "pilot-economics",
      label: "Pilot economics",
      area: "judge",
      status:
        input.pilotEconomics.posture === "investment-ready"
          ? "accepted"
          : input.pilotEconomics.posture === "needs-pilot-proof"
            ? "watch"
            : "blocked",
      score: input.pilotEconomics.economicsScore,
      requirement: "実用性・体験価値: 導入費用、回収日数、買い手の反論、価格レーンを説明できること",
      evidence: input.pilotEconomics.hardTruth,
      proofUrl: absoluteUrl(base, "/api/pilot-economics"),
      nextAction:
        input.pilotEconomics.posture === "investment-ready"
          ? `Pilot Economicsの${input.pilotEconomics.unitEconomics.paybackDays}日paybackを提出ストーリーへ入れる`
          : input.pilotEconomics.nextActions[0]?.action ??
            `Pilot Economicsの${input.pilotEconomics.unitEconomics.paybackDays}日paybackを提出ストーリーへ入れる`
    }),
    row({
      id: "implementation-quality",
      label: "Implementation proof",
      area: "proof",
      status: input.proof.ci.status === "missing" ? "blocked" : statusFromScore(average([criterionScore(input.strategy, "implementation"), input.proof.overallScore, input.proof.scores.ci])),
      score: average([criterionScore(input.strategy, "implementation"), input.proof.overallScore, input.proof.scores.ci]),
      requirement: "実装力: 技術選定、拡張性、CI、テスト、運用配慮",
      evidence: `${input.proof.summary} Implementation criterion ${criterionScore(input.strategy, "implementation")}.`,
      proofUrl: absoluteUrl(base, "/api/proof"),
      nextAction: "Judge ProofとGitHub Actions CIを審査前に開く"
    }),
    row({
      id: "live-public-proof",
      label: "Live public proof",
      area: "proof",
      status: liveLane?.status === "passed" ? "accepted" : liveLane?.status === "blocked" ? "blocked" : "watch",
      score: liveLane?.score ?? average([input.proof.scores.cloudRun, input.proof.scores.a2a, input.proof.scores.ci]),
      requirement: "公開Cloud Run、Agent Card、A2A、Optimizer、CIを再検証できること",
      evidence: liveLane?.proof ?? "Live evidence lane missing from Win Autopilot.",
      proofUrl: liveLane?.evidenceUrl ?? absoluteUrl(base, "/api/live-evidence"),
      nextAction: liveLane?.action ?? "Live Evidence Monitorを実行する"
    }),
    row({
      id: "release-drift",
      label: "Cloud Run revision",
      area: "proof",
      status: input.releaseDrift?.verdict === "release-current" ? "accepted" : "blocked",
      score: input.releaseDrift?.driftScore ?? 0,
      requirement: "提出用Cloud Run URLが最新Agent Card、Acceptance Matrix、A2A artifactを返すこと",
      evidence: input.releaseDrift
        ? `${input.releaseDrift.verdict}; ${input.releaseDrift.observedSkillCount}/${input.releaseDrift.expectedSkillCount} skills; missing ${input.releaseDrift.missingSkills.join(", ") || "none"}.`
        : "Release Drift Guard evidence missing.",
      proofUrl: absoluteUrl(base, "/api/release-drift"),
      nextAction: input.releaseDrift?.verdict === "release-current" ? "Release Drift Guardを審査前に再実行する" : "Cloud BuildでCloud Runへ最新mainを再デプロイする"
    }),
    row({
      id: "security-boundary",
      label: "Security boundary",
      area: "proof",
      status: input.securityReview.posture === "guarded" ? "accepted" : input.securityReview.posture === "watch" ? "watch" : "blocked",
      score: input.securityReview.securityScore,
      requirement: "公開デモのSecret、入力、A2A、Cloud Run境界を説明できること",
      evidence: input.securityReview.hardTruth,
      proofUrl: absoluteUrl(base, "/api/security-review"),
      nextAction: input.securityReview.nextSecurityHire ? `${input.securityReview.nextSecurityHire.name}で安全境界を補強する` : "Security Reviewを質疑回答に使う"
    }),
    row({
      id: "submission-assets",
      label: "Submission assets",
      area: "submission",
      status: launchSubmissionStatus,
      score: launchSubmissionScore,
      requirement: "公開GitHub URL、デプロイ済みURL、ProtoPedia作品URL、YouTube/Vimeo動画URL、findy_hackathonタグ、構成図、ストーリー",
      evidence: launchSubmissionEvidence,
      proofUrl: absoluteUrl(base, "/api/submission-launch"),
      nextAction: "ProtoPedia作品URLとYouTube/Vimeo動画URLを発行し、Submission Launch Gateをsubmit-readyにする"
    }),
    row({
      id: "demo-receipt",
      label: "Demo receipt seal",
      area: "submission",
      status: input.demoReceipt.verdict === "sealed" ? "accepted" : input.demoReceipt.verdict === "needs-external-submit" ? "watch" : "blocked",
      score: input.demoReceipt.receiptScore,
      requirement: "審査動画の主張、反論、編成判断、公開証拠、外部URLをreceiptで封印すること",
      evidence: `${input.demoReceipt.verdict}; digest ${input.demoReceipt.digest.digest}.`,
      proofUrl: absoluteUrl(base, "/api/demo-receipt"),
      nextAction: input.demoReceipt.actions[0]?.action ?? "Judge Demo Receiptのdigestを提出メモへ控える"
    })
  ].filter((item) => item.id !== "release-drift" || input.releaseDrift);

  const acceptanceScore = Math.round(clamp(average(rows.map((item) => item.score))));
  const verdict = verdictFrom(rows);
  const nextActions = rows.filter((item) => item.status !== "accepted").map(actionFromRow);
  const payload = {
    acceptanceScore,
    verdict,
    rows: rows.map((item) => ({ id: item.id, status: item.status, score: item.score })),
    proofDigest: input.proof.receipt.digest,
    demoReceiptDigest: input.demoReceipt.digest.digest,
    pilotEconomicsPosture: input.pilotEconomics.posture,
    observabilityOracleReadiness: input.observabilityOracle?.readiness ?? "not-checked",
    observabilityOracleScore: oracleScore ?? 0,
    submissionLaunchReadiness: input.submissionLaunch?.readiness ?? "not-checked",
    protopediaCompliance: input.submissionLaunch ? `${complianceReadyCount}/${complianceTotal}` : "not-checked",
    releaseDriftVerdict: input.releaseDrift?.verdict ?? "not-checked"
  };
  const acceptanceDigest = digest(payload);

  return {
    id: `acceptance-matrix-${acceptanceScore}-${verdict}`,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    acceptanceScore,
    verdict,
    headline:
      verdict === "ready-to-submit"
        ? "MVP受入、提出、審査説明がすべてacceptedです。"
        : verdict === "accepted-with-external-gaps"
          ? "MVP本体は受入可能です。残りは外部提出URLとwatch項目を締める段階です。"
          : "受入できないblocked項目があります。提出前に実装または証拠を直してください。",
    hardTruth:
      "優勝狙いでは、機能一覧ではなく、審査基準・必須技術・提出物・公開証拠を同じ受入表で説明する必要があります。",
    rows,
    nextActions,
    decisiveProof: [
      { id: "mvp", label: "MVP band", value: input.mvpAudit.band, proof: input.mvpAudit.verdict },
      { id: "win", label: "Win readiness", value: input.autopilot.readiness, proof: `${input.autopilot.lanes.length} lanes / ${input.autopilot.winScore}` },
      { id: "brief", label: "Judge brief", value: input.marketIntel.status, proof: `${input.marketIntel.sources.length} sources` },
      { id: "economics", label: "Pilot economics", value: input.pilotEconomics.posture, proof: `${input.pilotEconomics.unitEconomics.paybackDays}d payback` },
      ...(input.observabilityOracle
        ? [
            {
              id: "observability",
              label: "Observability Oracle",
              value: input.observabilityOracle.readiness,
              proof: `${oracleScore} operational buyer proof`
            }
          ]
        : []),
      ...(input.submissionLaunch
        ? [
            {
              id: "protopedia",
              label: "ProtoPedia compliance",
              value: `${complianceReadyCount}/${complianceTotal}`,
              proof: input.submissionLaunch.readiness
            }
          ]
        : []),
      ...(input.releaseDrift
        ? [{ id: "release", label: "Release drift", value: input.releaseDrift.verdict, proof: `${input.releaseDrift.observedSkillCount}/${input.releaseDrift.expectedSkillCount} skills` }]
        : []),
      { id: "receipt", label: "Receipt digest", value: acceptanceDigest.slice(0, 16), proof: input.demoReceipt.digest.digest }
    ],
    digest: {
      algorithm: "sha256",
      digest: acceptanceDigest,
      verification:
        "Recompute sha256 over acceptanceScore, verdict, row statuses, Judge Proof digest, Demo Receipt digest, Pilot Economics posture, Observability Oracle readiness/score, Submission Launch readiness, ProtoPedia compliance, and Release Drift verdict."
    },
    a2aPayload: {
      method: "message/send",
      skill: "acceptance.matrix",
      acceptanceScore,
      verdict,
      digest: acceptanceDigest,
      rows: rows.map((item) => ({ id: item.id, area: item.area, status: item.status, score: item.score })),
      nextActions: nextActions.map((item) => ({ id: item.id, priority: item.priority, action: item.action })),
      observabilityOracle: input.observabilityOracle
        ? {
            readiness: input.observabilityOracle.readiness,
            score: oracleScore,
            buyerSlo: buyerSlo ? { status: buyerSlo.status, metric: buyerSlo.metric } : null
          }
        : null,
      submissionLaunch: input.submissionLaunch
        ? {
            readiness: input.submissionLaunch.readiness,
            complianceReady: complianceReadyCount,
            complianceTotal,
            urls: input.submissionLaunch.urlStatuses.map((item) => ({ id: item.id, status: item.status }))
          }
        : null,
      endpoints: {
        app: base,
        acceptanceMatrix: absoluteUrl(base, "/api/acceptance-matrix"),
        mvpAudit: absoluteUrl(base, "/api/mvp-audit"),
        winRun: absoluteUrl(base, "/api/win-run"),
        pilotEconomics: absoluteUrl(base, "/api/pilot-economics"),
        observabilityOracle: absoluteUrl(base, "/api/observability-oracle"),
        releaseDrift: absoluteUrl(base, "/api/release-drift"),
        demoReceipt: absoluteUrl(base, "/api/demo-receipt")
      }
    }
  };
}
