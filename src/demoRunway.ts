import type { FinalistSimulation } from "./finalist.js";
import type { MissionRun } from "./mission.js";
import type { OpsDrill } from "./ops.js";
import type { PitchRun } from "./pitch.js";
import type { ProtoPediaPublisher } from "./publisher.js";
import { SUBMISSION_PROOF } from "./submission.js";
import type { WinningStrategy } from "./strategy.js";
import type { Recommendation } from "./types.js";

export type DemoStepStatus = "ready" | "watch";
export type DemoReadiness = "recording-ready" | "needs-external-capture";

export type DemoRunwayStep = {
  id: string;
  order: number;
  timeRange: string;
  screen: string;
  action: string;
  narration: string;
  evidence: string;
  evidenceUrl: string;
  status: DemoStepStatus;
};

export type DemoProofLink = {
  id: string;
  label: string;
  url: string;
  proof: string;
};

export type DemoRisk = {
  id: string;
  label: string;
  severity: DemoStepStatus;
  mitigation: string;
};

export type DemoRunway = {
  id: string;
  demoScore: number;
  readiness: DemoReadiness;
  totalSeconds: number;
  headline: string;
  summary: string;
  steps: DemoRunwayStep[];
  proofLinks: DemoProofLink[];
  risks: DemoRisk[];
  recordingCues: string[];
  nextActions: string[];
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

function timeRange(start: number, duration: number) {
  return `${start}-${start + duration}s`;
}

function statusFromWarnings(count: number): DemoStepStatus {
  return count === 0 ? "ready" : "watch";
}

export function buildDemoRunway(input: {
  baseUrl: string;
  recommendation: Recommendation;
  strategy: WinningStrategy;
  mission: MissionRun;
  opsDrill: OpsDrill;
  pitch: PitchRun;
  finalist: FinalistSimulation;
  publisher: ProtoPediaPublisher;
}): DemoRunway {
  const { baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist, publisher } = input;
  const appUrl = mission.submissionPack.deployedUrl || baseUrl;
  const proofUrl = absoluteUrl(baseUrl, "/api/proof");
  const finalistUrl = absoluteUrl(baseUrl, "/api/finalist");
  const publisherUrl = absoluteUrl(baseUrl, "/api/publisher");
  const contractUrl = absoluteUrl(baseUrl, "/api/contracts");
  const strategyUrl = absoluteUrl(baseUrl, mission.submissionPack.storyMarkdownPath);
  const missionUrl = absoluteUrl(baseUrl, "/api/mission");
  const opsUrl = absoluteUrl(baseUrl, "/api/ops-drill");
  const agentCardUrl = absoluteUrl(baseUrl, "/.well-known/agent-card.json");
  const architectureUrl = absoluteUrl(baseUrl, mission.submissionPack.architectureDiagramUrl);
  const selectedAgents = recommendation.selected.map((agent) => agent.name).join(" / ") || "A2A Market Broker";
  const publisherWarnings = publisher.missingExternal.length;
  const finalistWarnings = finalist.gaps.length;
  const totalSeconds = 30;
  const durations = [4, 4, 4, 4, 5, 4, 3, 2];

  const steps: DemoRunwayStep[] = [
    {
      id: "proof-first",
      order: 1,
      timeRange: timeRange(0, durations[0]),
      screen: "Judge Proof",
      action: "Run judge proofを押し、Gemini/Cloud Run/A2A/CIを先に見せる",
      narration: "最初に証拠を出します。これはAI能力を雇い、A2Aで委任し、Cloud Run運用まで閉じる作品です。",
      evidence: "Judge Proof API and sha256 receipt",
      evidenceUrl: proofUrl,
      status: "ready"
    },
    {
      id: "finalist-verdict",
      order: 2,
      timeRange: timeRange(4, durations[1]),
      screen: "Finalist Simulator",
      action: "Simulate finalistを押し、5人の審査員役と残ギャップを見せる",
      narration: `現在は${finalist.finalistBand}、${finalist.judgeConsensus}です。落選理由を先に出して潰します。`,
      evidence: `Finalist score ${finalist.finalistScore}`,
      evidenceUrl: finalistUrl,
      status: statusFromWarnings(finalistWarnings)
    },
    {
      id: "publisher-kit",
      order: 3,
      timeRange: timeRange(8, durations[2]),
      screen: "Submission Publisher",
      action: "Build publisherを押し、ProtoPediaに貼る本文と提出チェックリストを見せる",
      narration: "提出本文、タグ、URL、動画台本まで貼り付け可能な形にしています。",
      evidence: `Publish score ${publisher.publishScore}, ${publisher.pasteFields.length} paste fields`,
      evidenceUrl: publisherUrl,
      status: statusFromWarnings(publisherWarnings)
    },
    {
      id: "market-loop",
      order: 4,
      timeRange: timeRange(12, durations[3]),
      screen: "Marketplace",
      action: "Project Brief、選択済みAI、改善スコア、A2A Delegationを見せる",
      narration: `ブリーフから必要能力を読み、${selectedAgents} を市場から雇います。`,
      evidence: `Budget ${recommendation.budgetUsed}/140, total ${recommendation.after.total}`,
      evidenceUrl: appUrl,
      status: "ready"
    },
    {
      id: "strategy-swot",
      order: 5,
      timeRange: timeRange(16, durations[4]),
      screen: "Winning Strategy",
      action: "競合、SWOT、Judge Scorecard、Next hireを見せる",
      narration: `競合${strategy.competitors.length}件とSWOTから、作る基盤ではなくAI能力調達に勝ち筋を寄せます。`,
      evidence: `Judge ${strategy.judgeScore}, moat ${strategy.moatScore}`,
      evidenceUrl: strategyUrl,
      status: "ready"
    },
    {
      id: "contract-mission",
      order: 6,
      timeRange: timeRange(21, durations[5]),
      screen: "Contract Desk + Mission Control",
      action: "契約、受入条件、sense -> decide -> delegate -> verify -> shipを見せる",
      narration: "AIは推薦で止まらず、契約、A2A委任、検証runbook、提出パックまで進みます。",
      evidence: `Mission ${mission.id}, weakest ${mission.weakestCriterion.label}`,
      evidenceUrl: contractUrl,
      status: "ready"
    },
    {
      id: "ops-release",
      order: 7,
      timeRange: timeRange(25, durations[6]),
      screen: "Cloud Run Ops Drill",
      action: "health、latency、fallback、rollback判断を見せる",
      narration: "公開後もAIが運用シグナルを読み、継続かロールバックかを判断します。",
      evidence: `Ops ${opsDrill.severity}, readiness ${opsDrill.readinessScore}`,
      evidenceUrl: opsUrl,
      status: opsDrill.rollbackRecommended ? "watch" : "ready"
    },
    {
      id: "close-links",
      order: 8,
      timeRange: timeRange(28, durations[7]),
      screen: "Submission links",
      action: "Cloud Run、GitHub Actions、Agent Card、構成図で締める",
      narration: "最後に、審査員が確認できる公開URLと提出証跡を並べます。",
      evidence: "Cloud Run, CI, Agent Card, architecture",
      evidenceUrl: architectureUrl,
      status: "ready"
    }
  ];

  const risks: DemoRisk[] = [
    ...publisher.missingExternal.map((item) => ({
      id: item.id,
      label: item.label,
      severity: "watch" as const,
      mitigation: item.action
    })),
    ...(opsDrill.rollbackRecommended
      ? [
          {
            id: "rollback",
            label: "Cloud Run rollback",
            severity: "watch" as const,
            mitigation: "Ops Drillのrunbookに従い、前revisionへ戻してから録画する"
          }
        ]
      : [])
  ];
  const readiness: DemoReadiness = risks.length === 0 ? "recording-ready" : "needs-external-capture";
  const demoScore = Math.round(
    clamp(
      average([
        finalist.finalistScore,
        publisher.publishScore,
        pitch.readinessScore,
        opsDrill.readinessScore,
        strategy.judgeScore,
        100 - risks.length * 5
      ])
    )
  );
  const proofLinks: DemoProofLink[] = [
    { id: "app", label: "Cloud Run app", url: appUrl, proof: "公開デモURL" },
    { id: "proof", label: "Judge Proof API", url: proofUrl, proof: "Gemini/Cloud Run/A2A/CI receipt" },
    { id: "finalist", label: "Finalist API", url: finalistUrl, proof: "審査員5役の模擬判定" },
    { id: "publisher", label: "Publisher API", url: publisherUrl, proof: "ProtoPedia貼り付け本文" },
    { id: "agent-card", label: "Agent Card", url: agentCardUrl, proof: "A2A skill surface" },
    { id: "ci", label: "GitHub Actions", url: SUBMISSION_PROOF.ciWorkflowUrl, proof: "公開品質ゲート" },
    { id: "mission", label: "Mission API", url: missionUrl, proof: "A2A委任と提出パック" }
  ];

  return {
    id: `demo-runway-${demoScore}-${mission.id}`,
    demoScore,
    readiness,
    totalSeconds,
    headline: "30秒で、証拠、最終候補判定、提出本文、AI市場、運用判断まで見せ切る。",
    summary:
      readiness === "recording-ready"
        ? "録画に必要な順番、証拠リンク、提出素材が揃っています。"
        : "録画順と証拠は揃っています。残りは動画URLとProtoPedia作品URLの外部作業です。",
    steps,
    proofLinks,
    risks,
    recordingCues: steps.map((step) => `${step.timeRange} ${step.screen}: ${step.narration}`),
    nextActions:
      risks.length > 0
        ? risks.map((risk) => risk.mitigation)
        : ["Demo Runwayの順番で録画し、Publisherのpaste fieldsをProtoPediaに貼る"],
    a2aPayload: {
      method: "message/send",
      skill: "demo.runway",
      demoScore,
      readiness,
      totalSeconds,
      selectedAgents: recommendation.selected.map((agent) => agent.id),
      steps: steps.map((step) => ({
        id: step.id,
        order: step.order,
        timeRange: step.timeRange,
        screen: step.screen,
        status: step.status,
        evidenceUrl: step.evidenceUrl
      })),
      risks: risks.map((risk) => ({ id: risk.id, mitigation: risk.mitigation }))
    }
  };
}
