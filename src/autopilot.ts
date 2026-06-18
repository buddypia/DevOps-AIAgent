import type { SquadContract } from "./contracts.js";
import { buildJudgeDemoReceipt } from "./demoReceipt.js";
import type { DemoRunway } from "./demoRunway.js";
import type { FinalistGap, FinalistSimulation } from "./finalist.js";
import { buildMarketIntelReport } from "./marketIntel.js";
import type { MissionRun } from "./mission.js";
import { buildMoatStressTest } from "./moatStress.js";
import type { OpsDrill } from "./ops.js";
import type { PitchRun } from "./pitch.js";
import type { JudgeProof } from "./proof.js";
import type { ProtoPediaPublisher, PublisherStep } from "./publisher.js";
import { buildSquadOptimizer } from "./squadOptimizer.js";
import type { WinningStrategy } from "./strategy.js";
import type { Recommendation } from "./types.js";

export type AutopilotReadiness = "finalist-ready" | "external-gaps" | "needs-build";
export type AutopilotStatus = "passed" | "watch" | "blocked";
export type AutopilotPriority = "now" | "next" | "later";

export type AutopilotLane = {
  id: string;
  label: string;
  score: number;
  status: AutopilotStatus;
  proof: string;
  action: string;
  evidenceUrl: string;
};

export type AutopilotAction = {
  id: string;
  label: string;
  owner: string;
  priority: AutopilotPriority;
  command: string;
  proof: string;
};

export type AutopilotEvidence = {
  id: string;
  label: string;
  url: string;
  proof: string;
};

export type AutopilotTrace = {
  phase: string;
  actor: string;
  decision: string;
  proof: string;
};

export type WinningAutopilotRun = {
  id: string;
  winScore: number;
  readiness: AutopilotReadiness;
  headline: string;
  summary: string;
  lanes: AutopilotLane[];
  blockers: AutopilotAction[];
  nextActions: AutopilotAction[];
  evidenceDeck: AutopilotEvidence[];
  autonomyTrace: AutopilotTrace[];
  judgeNarrative: string;
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

function statusFromScore(score: number): AutopilotStatus {
  if (score >= 88) return "passed";
  if (score >= 76) return "watch";
  return "blocked";
}

function statusFromReceipt(verdict: string, score: number): AutopilotStatus {
  if (verdict === "sealed") return statusFromScore(score);
  if (verdict === "needs-external-submit") return "watch";
  return "blocked";
}

function normalizedId(id: string) {
  if (id.includes("video")) return "record-video";
  if (id.includes("protopedia")) return "publish-protopedia";
  return id;
}

function actionFromPublisher(item: PublisherStep): AutopilotAction {
  return {
    id: normalizedId(item.id),
    label: item.label,
    owner: "Submission owner",
    priority: "now",
    command: item.action,
    proof: item.proof
  };
}

function actionFromGap(gap: FinalistGap): AutopilotAction {
  return {
    id: normalizedId(gap.id),
    label: gap.label,
    owner: gap.owner,
    priority: gap.severity === "external" || gap.severity === "blocker" ? "now" : "next",
    command: gap.action,
    proof: gap.proof
  };
}

function uniqueActions(actions: AutopilotAction[]) {
  const seen = new Set<string>();
  return actions.filter((action) => {
    if (seen.has(action.id)) return false;
    seen.add(action.id);
    return true;
  });
}

function readinessFrom(input: {
  winScore: number;
  finalist: FinalistSimulation;
  blockers: AutopilotAction[];
  lanes: AutopilotLane[];
}): AutopilotReadiness {
  if (input.lanes.some((lane) => lane.status === "blocked")) return "needs-build";
  if (input.blockers.some((action) => action.priority === "now")) return "external-gaps";
  if (input.winScore >= 88 && input.finalist.finalistBand === "finalist-ready") return "finalist-ready";
  return input.winScore >= 82 ? "external-gaps" : "needs-build";
}

export function buildWinningAutopilot(input: {
  baseUrl: string;
  recommendation: Recommendation;
  strategy: WinningStrategy;
  mission: MissionRun;
  opsDrill: OpsDrill;
  squadContract: SquadContract;
  pitch: PitchRun;
  finalist: FinalistSimulation;
  publisher: ProtoPediaPublisher;
  demoRunway: DemoRunway;
  proof: JudgeProof;
}): WinningAutopilotRun {
  const { baseUrl, recommendation, strategy, mission, opsDrill, squadContract, pitch, finalist, publisher, demoRunway, proof } = input;
  const demoUrl = absoluteUrl(baseUrl, "/api/demo-run");
  const liveEvidenceUrl = absoluteUrl(baseUrl, "/api/live-evidence");
  const receiptUrl = absoluteUrl(baseUrl, "/api/demo-receipt");
  const moatUrl = absoluteUrl(baseUrl, "/api/moat-stress");
  const squadUrl = absoluteUrl(baseUrl, "/api/squad-optimizer");
  const publisherUrl = absoluteUrl(baseUrl, "/api/publisher");
  const finalistUrl = absoluteUrl(baseUrl, "/api/finalist");
  const strategyUrl = absoluteUrl(baseUrl, mission.submissionPack.storyMarkdownPath);
  const contractUrl = absoluteUrl(baseUrl, "/api/contracts");
  const opsUrl = absoluteUrl(baseUrl, "/api/ops-drill");
  const selectedAgents = recommendation.selected.map((agent) => agent.name).join(" / ") || "A2A Market Broker";
  const selectedAgentIds = recommendation.selected.map((agent) => agent.id);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const squadOptimizer = buildSquadOptimizer({
    projectBrief: recommendation.profile.brief,
    selectedAgentIds,
    budget: 140,
    maxSquadSize: 4
  });
  const demoReceipt = buildJudgeDemoReceipt({
    baseUrl,
    recommendation,
    strategy,
    moatStress,
    squadOptimizer
  });
  const liveEvidenceScore = Math.round(average([proof.scores.cloudRun, proof.scores.a2a, proof.scores.devops, proof.scores.ci]));
  const liveEvidenceStatus: AutopilotStatus =
    proof.ci.status === "passed" && liveEvidenceScore >= 88 ? "passed" : liveEvidenceScore >= 72 ? "watch" : "blocked";
  const blockers = uniqueActions([
    ...publisher.missingExternal.map(actionFromPublisher),
    ...finalist.gaps.map(actionFromGap),
    ...(moatStress.verdict === "exposed"
      ? [
          {
            id: "shore-up-moat",
            label: "競合反論",
            owner: "Gemini Strategist",
            priority: "now" as const,
            command: "Moat Stress Testのexposedシナリオを先に修正し、競合/SWOTの反論を録画台本へ入れる",
            proof: moatStress.hardTruth
          }
        ]
      : moatStress.verdict === "needs-proof"
        ? [
            {
              id: "record-counterproof",
              label: "競合反証録画",
              owner: "Submission owner",
              priority: "next" as const,
              command: "Market Intel、Moat Stress Test、Live Evidenceを連続で録画し、既存ツールとの差分を証拠で見せる",
              proof: moatStress.headline
            }
          ]
        : []),
    ...demoReceipt.actions
      .filter((action) => action.priority === "now")
      .map((action) => ({
        id: action.id,
        label: "Demo receipt stamp",
        owner: "Submission owner",
        priority: "now" as const,
        command: action.action,
        proof: action.proof
      })),
    ...(proof.ci.status === "missing"
      ? [
          {
            id: "latest-ci",
            label: "最新CI成功run",
            owner: "Test Forge",
            priority: "now" as const,
            command: "GitHub Actionsのmain CIを成功させ、Judge Proofを再実行する",
            proof: proof.ci.conclusion
          }
        ]
      : []),
    ...(opsDrill.rollbackRecommended
      ? [
          {
            id: "rollback",
            label: "Cloud Run rollback",
            owner: "Cloud Run SRE",
            priority: "now" as const,
            command: "Ops Drillのrunbookに従って前revisionへ戻す",
            proof: opsDrill.incidentTitle
          }
        ]
      : [])
  ]);

  const lanes: AutopilotLane[] = [
    {
      id: "proof",
      label: "Judge proof",
      score: proof.overallScore,
      status: proof.ci.status === "passed" ? statusFromScore(proof.overallScore) : "watch",
      proof: proof.summary,
      action: "審査員には最初にこの証拠束を開く",
      evidenceUrl: absoluteUrl(baseUrl, "/api/proof")
    },
    {
      id: "live-evidence",
      label: "Live evidence",
      score: liveEvidenceScore,
      status: liveEvidenceStatus,
      proof: `Cloud Run ${proof.scores.cloudRun}, A2A ${proof.scores.a2a}, DevOps ${proof.scores.devops}, CI ${proof.scores.ci}.`,
      action: "公開URL、Agent Card、A2A、Optimizer、CIを審査前に再実行する",
      evidenceUrl: liveEvidenceUrl
    },
    {
      id: "demo-receipt",
      label: "Judge demo receipt",
      score: demoReceipt.receiptScore,
      status: statusFromReceipt(demoReceipt.verdict, demoReceipt.receiptScore),
      proof: `${demoReceipt.verdict}; digest ${demoReceipt.digest.digest.slice(0, 12)}...`,
      action: "動画の最後にreceipt digestを控え、外部URLの状態を正直に見せる",
      evidenceUrl: receiptUrl
    },
    {
      id: "moat-stress",
      label: "Moat stress test",
      score: moatStress.stressScore,
      status: moatStress.verdict === "defensible" ? statusFromScore(moatStress.stressScore) : moatStress.verdict === "needs-proof" ? "watch" : "blocked",
      proof: `${moatStress.scenarios.length} competitor objections; ${moatStress.verdict}.`,
      action: "既存ツールでよいのでは、への回答を証拠付きで先に見せる",
      evidenceUrl: moatUrl
    },
    {
      id: "squad-optimizer",
      label: "Squad optimizer",
      score: squadOptimizer.optimizerScore,
      status: squadOptimizer.readiness === "optimized" ? statusFromScore(squadOptimizer.optimizerScore) : "watch",
      proof: `${squadOptimizer.readiness}; recommended ${squadOptimizer.recommended.totalScore}, budget gap ${squadOptimizer.budgetGap}.`,
      action: squadOptimizer.swapPlan[0]?.label ?? "予算内の最適編成を審査前に確認する",
      evidenceUrl: squadUrl
    },
    {
      id: "demo",
      label: "30s demo route",
      score: demoRunway.demoScore,
      status: demoRunway.readiness === "recording-ready" ? statusFromScore(demoRunway.demoScore) : "watch",
      proof: `${demoRunway.steps.length} steps / ${demoRunway.totalSeconds}s / ${demoRunway.risks.length} risks`,
      action: "録画はDemo Runwayの順番で進める",
      evidenceUrl: demoUrl
    },
    {
      id: "strategy",
      label: "Competitive moat",
      score: strategy.judgeScore,
      status: statusFromScore(strategy.judgeScore),
      proof: `${strategy.competitors.length} competitors, SWOT, moat ${strategy.moatScore}`,
      action: strategy.nextBestAgent?.reason ?? "Winning StrategyをProtoPedia本文に転記する",
      evidenceUrl: strategyUrl
    },
    {
      id: "autonomy",
      label: "Agent autonomy",
      score: mission.autonomyScore,
      status: statusFromScore(mission.autonomyScore),
      proof: `Mission ${mission.id}: ${mission.steps.map((step) => step.phase).join(" -> ")}`,
      action: "A2A委任と検証runbookを動画内で見せる",
      evidenceUrl: absoluteUrl(baseUrl, "/api/mission")
    },
    {
      id: "finalist",
      label: "Finalist panel",
      score: finalist.finalistScore,
      status: finalist.finalistBand === "not-mvp" ? "blocked" : "watch",
      proof: `${finalist.finalistBand}: ${finalist.judgeConsensus}`,
      action: finalist.winningMove,
      evidenceUrl: finalistUrl
    },
    {
      id: "publisher",
      label: "Submission pack",
      score: publisher.publishScore,
      status: publisher.readiness === "ready-to-register" ? statusFromScore(publisher.publishScore) : "watch",
      proof: `${publisher.pasteFields.length} paste fields, ${publisher.missingExternal.length} external gaps`,
      action: publisher.missingExternal[0]?.action ?? "Publisherのpaste fieldsをProtoPediaに貼る",
      evidenceUrl: publisherUrl
    },
    {
      id: "ops",
      label: "Cloud Run ops",
      score: opsDrill.readinessScore,
      status: opsDrill.rollbackRecommended ? "blocked" : statusFromScore(opsDrill.readinessScore),
      proof: `${opsDrill.severity}, rollback ${opsDrill.rollbackRecommended ? "yes" : "no"}`,
      action: opsDrill.rollbackRecommended ? "前revisionへ戻してから録画する" : "Ops DrillをDevOps証跡として見せる",
      evidenceUrl: opsUrl
    },
    {
      id: "contract",
      label: "Agent contracts",
      score: squadContract.contractScore,
      status: statusFromScore(squadContract.contractScore),
      proof: `${squadContract.contracts.length} contracts, ${squadContract.totalPrice} budget used`,
      action: "AIを雇う体験を検収条件まで接続する",
      evidenceUrl: contractUrl
    }
  ];

  const winScore = Math.round(
    clamp(
      average([
        proof.overallScore,
        liveEvidenceScore,
        demoReceipt.receiptScore,
        moatStress.stressScore,
        squadOptimizer.optimizerScore,
        demoRunway.demoScore,
        finalist.finalistScore,
        publisher.publishScore,
        strategy.judgeScore,
        strategy.moatScore,
        mission.autonomyScore,
        opsDrill.readinessScore,
        squadContract.contractScore,
        100 - blockers.filter((action) => action.priority === "now").length * 4
      ])
    )
  );
  const readiness = readinessFrom({ winScore, finalist, blockers, lanes });
  const nextActions =
    blockers.length > 0
      ? blockers
      : [
          {
            id: "record-and-submit",
            label: "録画と提出",
            owner: "Submission owner",
            priority: "now" as const,
            command: "Demo Runwayの順番で録画し、Publisherのpaste fieldsをProtoPediaに貼る",
            proof: demoRunway.summary
          }
        ];

  const evidenceDeck: AutopilotEvidence[] = [
    { id: "app", label: "Cloud Run app", url: proof.links.app, proof: "公開デモ" },
    { id: "proof", label: "Judge Proof", url: absoluteUrl(baseUrl, "/api/proof"), proof: "証拠束とsha256 receipt" },
    { id: "live-evidence", label: "Live Evidence", url: liveEvidenceUrl, proof: "公開Cloud Run/A2A/CI再実行証拠" },
    { id: "demo-receipt", label: "Judge Demo Receipt", url: receiptUrl, proof: "審査デモのsha256検収票" },
    { id: "moat-stress", label: "Moat Stress Test", url: moatUrl, proof: "競合反論への証拠付き回答" },
    { id: "squad-optimizer", label: "Squad Optimizer", url: squadUrl, proof: "予算内のAI編成判断" },
    { id: "demo", label: "Demo Runway", url: demoUrl, proof: "30秒審査員導線" },
    { id: "finalist", label: "Finalist Simulator", url: finalistUrl, proof: "審査員5役の模擬判定" },
    { id: "publisher", label: "Submission Publisher", url: publisherUrl, proof: "ProtoPedia貼り付け本文" },
    { id: "agent-card", label: "Agent Card", url: proof.links.agentCard, proof: "A2A skill surface" },
    { id: "ci", label: "GitHub Actions", url: proof.links.ci, proof: "公開品質ゲート" }
  ];
  const autonomyTrace: AutopilotTrace[] = [
    {
      phase: "sense",
      actor: selectedAgents,
      decision: `${strategy.competitors.length}競合とSWOTを読み、${strategy.strategicThesis}`,
      proof: `Judge score ${strategy.judgeScore}, moat ${strategy.moatScore}`
    },
    {
      phase: "decide",
      actor: strategy.nextBestAgent?.agent.name ?? "A2A Market Broker",
      decision: strategy.nextBestAgent?.reason ?? "現編成で提出可能な証拠を優先する",
      proof: strategy.nextBestAgent?.expectedLift ?? "No additional hire required"
    },
    {
      phase: "delegate",
      actor: "Agent Card",
      decision: "market, contract, mission, ops, proof, live evidence, demo receiptをA2A skillとして公開する",
      proof: proof.proofItems.find((item) => item.id === "a2a")?.evidence ?? "A2A endpoint ready"
    },
    {
      phase: "stress",
      actor: "Moat Stress Test",
      decision: `${moatStress.scenarios.length}競合からの反論を先に受け、${moatStress.verdict}と判定する`,
      proof: moatStress.headline
    },
    {
      phase: "optimize",
      actor: "Squad Optimizer",
      decision: `${squadOptimizer.readiness}として、予算内の推薦編成を${squadOptimizer.recommended.totalScore}点で固定する`,
      proof: squadOptimizer.hardTruth
    },
    {
      phase: "verify",
      actor: "GitHub Actions + Live Evidence",
      decision: "typecheck/test/build/architecture check、公開URL、A2A、CI statusを証拠化する",
      proof: `${proof.ci.conclusion} / live evidence ${liveEvidenceScore}`
    },
    {
      phase: "rehearse",
      actor: "Demo Runway",
      decision: `${demoRunway.totalSeconds}秒で${demoRunway.steps.length}画面を順番に見せる`,
      proof: demoRunway.recordingCues[0] ?? demoRunway.summary
    },
    {
      phase: "seal",
      actor: "Judge Demo Receipt",
      decision: `${demoReceipt.verdict}として、審査導線、競合反論、編成判断、公開証拠、外部URL状態をdigest化する`,
      proof: demoReceipt.digest.digest
    },
    {
      phase: "submit",
      actor: "Submission Publisher",
      decision: `${publisher.pasteFields.length}項目をProtoPediaへ貼る`,
      proof: publisher.summary
    }
  ];
  const headline =
    readiness === "finalist-ready"
      ? "勝負できる。証拠起点の30秒デモを録画して提出する。"
      : readiness === "external-gaps"
        ? "MVPの核は到達。残りは外部URLを埋めれば提出戦闘力が上がる。"
        : "まだMVP未達。blocked laneを先に実装で潰す。";

  return {
    id: `win-autopilot-${winScore}-${mission.id}`,
    winScore,
    readiness,
    headline,
    summary: `${selectedAgents} が、競合/SWOT、A2A委任、Cloud Run運用、提出証拠、30秒デモ導線を一括で束ねた。`,
    lanes,
    blockers,
    nextActions,
    evidenceDeck,
    autonomyTrace,
    judgeNarrative: [
      "最初にWin Autopilotを押し、全体スコアと残ギャップを示す。",
      "次にLive EvidenceとJudge Demo Receiptで、公開URL、A2A、CI、競合反論、編成判断を再検証する。",
      "最後にDemo Runwayの順番で録画すれば、AI中心性、課題アプローチ、ユーザビリティ、実用性、実装力を30秒で説明できる。"
    ].join("\n"),
    a2aPayload: {
      method: "message/send",
      skill: "win.autopilot",
      winScore,
      readiness,
      selectedAgents: selectedAgentIds,
      lanes: lanes.map((lane) => ({ id: lane.id, score: lane.score, status: lane.status })),
      blockers: blockers.map((action) => ({ id: action.id, priority: action.priority, command: action.command })),
      evidenceDeck: evidenceDeck.map((item) => ({ id: item.id, url: item.url })),
      decisiveProof: {
        liveEvidenceScore,
        receiptDigest: demoReceipt.digest.digest,
        moatVerdict: moatStress.verdict,
        squadReadiness: squadOptimizer.readiness
      }
    }
  };
}
