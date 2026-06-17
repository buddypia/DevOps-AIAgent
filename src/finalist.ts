import type { SquadContract } from "./contracts.js";
import type { JudgeDrill, JudgeObjection } from "./judgeDrill.js";
import type { MissionRun } from "./mission.js";
import type { OpsDrill } from "./ops.js";
import type { PitchChecklistItem, PitchRun } from "./pitch.js";
import { SUBMISSION_PROOF, hasSubmissionUrl } from "./submission.js";
import type { JudgeCriterion, WinningStrategy } from "./strategy.js";
import type { Recommendation } from "./types.js";

export type FinalistBand = "finalist-ready" | "borderline" | "not-mvp";
export type FinalistVerdict = "advance" | "watch" | "hold";

export type FinalistPanel = {
  id: string;
  judgeRole: string;
  criterion: string;
  score: number;
  verdict: FinalistVerdict;
  decisiveProof: string;
  concern: string;
  demoMove: string;
  nextAction: string;
  evidenceUrl: string;
};

export type FinalistGap = {
  id: string;
  label: string;
  severity: "external" | "watch" | "blocker";
  owner: string;
  action: string;
  proof: string;
};

export type FinalistSimulation = {
  id: string;
  finalistScore: number;
  finalistBand: FinalistBand;
  advanceDecision: string;
  judgeConsensus: string;
  topConcern: string;
  winningMove: string;
  panels: FinalistPanel[];
  gaps: FinalistGap[];
  runbook: string[];
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
  if (path.startsWith("https://")) return path;
  return `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function criterion(strategy: WinningStrategy, id: string) {
  return strategy.judgeCriteria.find((item) => item.id === id);
}

function objection(drill: JudgeDrill, criterionId: string) {
  return drill.objections.find((item) => item.criterionId === criterionId);
}

function riskPenalty(item: JudgeObjection | undefined) {
  if (!item) return 0;
  if (item.risk === "high") return 10;
  if (item.risk === "medium") return 5;
  return 0;
}

function verdict(score: number): FinalistVerdict {
  if (score >= 88) return "advance";
  if (score >= 76) return "watch";
  return "hold";
}

function panel(input: {
  id: string;
  judgeRole: string;
  criterion: JudgeCriterion | undefined;
  score: number;
  decisiveProof: string;
  concern: string;
  demoMove: string;
  nextAction: string;
  evidenceUrl: string;
}): FinalistPanel {
  const score = Math.round(clamp(input.score));
  return {
    id: input.id,
    judgeRole: input.judgeRole,
    criterion: input.criterion?.label ?? input.id,
    score,
    verdict: verdict(score),
    decisiveProof: input.decisiveProof,
    concern: input.concern,
    demoMove: input.demoMove,
    nextAction: input.nextAction,
    evidenceUrl: input.evidenceUrl
  };
}

function checklistGaps(items: PitchChecklistItem[]) {
  return items
    .filter((item) => item.status === "watch")
    .map((item) => ({
      id: item.id,
      label: item.label,
      severity: item.id === "protopedia" || item.id === "video" ? "external" : "watch",
      owner: item.id === "video" ? "Pitch Director" : "Submission owner",
      action: item.id === "video" ? "30秒リールを録画し、動画URLを提出欄へ貼る" : `${item.label}を提出欄へ貼る`,
      proof: item.proof
    })) satisfies FinalistGap[];
}

function submissionGaps(strategy: WinningStrategy) {
  return strategy.submissionItems
    .filter((item) => !item.done)
    .map((item) => ({
      id: item.id,
      label: item.label,
      severity: item.id === "protopedia" ? "external" : "watch",
      owner: "Submission owner",
      action: item.nextAction,
      proof: item.proof
    })) satisfies FinalistGap[];
}

function uniqueGaps(gaps: FinalistGap[]) {
  const seen = new Set<string>();
  return gaps.filter((gap) => {
    if (seen.has(gap.id)) return false;
    seen.add(gap.id);
    return true;
  });
}

export function buildFinalistSimulation(input: {
  baseUrl: string;
  recommendation: Recommendation;
  strategy: WinningStrategy;
  mission: MissionRun;
  opsDrill: OpsDrill;
  pitch: PitchRun;
  judgeDrill: JudgeDrill;
  squadContract: SquadContract;
}): FinalistSimulation {
  const { baseUrl, recommendation, strategy, mission, opsDrill, pitch, judgeDrill, squadContract } = input;
  const appUrl = mission.submissionPack.deployedUrl || baseUrl;
  const proofUrl = absoluteUrl(baseUrl, "/api/proof");
  const finalistUrl = absoluteUrl(baseUrl, "/api/finalist");
  const agentCardUrl = absoluteUrl(baseUrl, "/.well-known/agent-card.json");
  const strategyUrl = absoluteUrl(baseUrl, mission.submissionPack.storyMarkdownPath);
  const opsUrl = absoluteUrl(baseUrl, "/api/ops-drill");
  const pitchUrl = absoluteUrl(baseUrl, "/api/pitch");
  const contractUrl = absoluteUrl(baseUrl, "/api/contracts");
  const ciReady = hasSubmissionUrl(SUBMISSION_PROOF.ciWorkflowUrl) ? 100 : 45;
  const externalGaps = uniqueGaps([...submissionGaps(strategy), ...checklistGaps(pitch.recordingChecklist)]);
  const externalPenalty = externalGaps.filter((gap) => gap.severity === "external").length * 2;
  const selectedAgentNames = recommendation.selected.map((agent) => agent.name).join(" / ") || "A2A Market Broker";

  const agentCentrality = criterion(strategy, "agentCentrality");
  const approach = criterion(strategy, "approach");
  const usability = criterion(strategy, "usability");
  const practicality = criterion(strategy, "practicality");
  const implementation = criterion(strategy, "implementation");

  const panels: FinalistPanel[] = [
    panel({
      id: "agent-centrality",
      judgeRole: "AI Agent Judge",
      criterion: agentCentrality,
      score: average([agentCentrality?.score ?? 0, mission.autonomyScore, squadContract.contractScore, strategy.moatScore]) - riskPenalty(objection(judgeDrill, "agentCentrality")),
      decisiveProof: `${selectedAgentNames} が市場探索、契約、A2A委任、検証runbookまで生成する。`,
      concern: objection(judgeDrill, "agentCentrality")?.question ?? "AIエージェントの必然性を最初に見せられるか。",
      demoMove: "Judge ProofのあとAgent CardとA2A Delegationを開く",
      nextAction: agentCentrality?.nextAction ?? "A2A Market Brokerの委任ログを見せる",
      evidenceUrl: agentCardUrl
    }),
    panel({
      id: "approach",
      judgeRole: "Problem Framing Judge",
      criterion: approach,
      score: average([approach?.score ?? 0, strategy.judgeScore, strategy.moatScore, strategy.competitors.length >= 6 ? 96 : 78]) - riskPenalty(objection(judgeDrill, "approach")),
      decisiveProof: `${strategy.competitors.length}競合、SWOT、Winning Movesで「作る基盤」ではなく「AI能力調達」にずらしている。`,
      concern: objection(judgeDrill, "approach")?.question ?? "既存基盤との差別化が伝わるか。",
      demoMove: "Winning Strategyの競合/SWOTと次に雇うAIを見せる",
      nextAction: approach?.nextAction ?? "競合との差分をProtoPediaの課題文へ転記する",
      evidenceUrl: strategyUrl
    }),
    panel({
      id: "usability",
      judgeRole: "Experience Judge",
      criterion: usability,
      score: average([usability?.score ?? 0, pitch.readinessScore, 100 - pitch.submissionWarnings.length * 8, recommendation.after.usability]) - riskPenalty(objection(judgeDrill, "usability")),
      decisiveProof: `Pitch Directorが${pitch.totalSeconds}秒/${pitch.scenes.length}シーンの操作順、字幕、証拠リンクを生成する。`,
      concern: externalGaps.length > 0 ? `${externalGaps.map((gap) => gap.label).join(" / ")} が未登録。` : "初見30秒で価値を理解できるか。",
      demoMove: "Build pitchで録画順を出し、トップから順に画面を辿る",
      nextAction: usability?.nextAction ?? "審査員が押すボタンをJudge Proofから固定する",
      evidenceUrl: pitchUrl
    }),
    panel({
      id: "practicality",
      judgeRole: "Operations Judge",
      criterion: practicality,
      score:
        average([practicality?.score ?? 0, opsDrill.readinessScore, squadContract.contractScore, mission.submissionScore]) -
        (opsDrill.rollbackRecommended ? 12 : 0) -
        externalPenalty,
      decisiveProof: `Ops Drillが${opsDrill.signals.length}シグナルから${opsDrill.severity}判定とrollback ${opsDrill.rollbackRecommended ? "yes" : "no"}を返す。`,
      concern: opsDrill.rollbackRecommended ? "公開デモのロールバック判断が必要。" : "外部提出URLまで運用証跡に含められるか。",
      demoMove: "Ops DrillとContract Deskを並べ、運用判断と検収条件を説明する",
      nextAction: practicality?.nextAction ?? "Ops Drillのwatch項目を提出前runbookに固定する",
      evidenceUrl: opsUrl
    }),
    panel({
      id: "implementation",
      judgeRole: "Implementation Judge",
      criterion: implementation,
      score: average([implementation?.score ?? 0, mission.verificationScore, squadContract.contractScore, ciReady, recommendation.after.delivery]) - riskPenalty(objection(judgeDrill, "implementation")),
      decisiveProof: "Cloud Run、Express API、React UI、Agent Card、GitHub Actions、sha256 receiptを同一作品で検証できる。",
      concern: objection(judgeDrill, "implementation")?.question ?? "CI/CDと公開デプロイの証拠を短時間で開けるか。",
      demoMove: "GitHub Actions、/api/proof receipt、/api/contractsを開く",
      nextAction: implementation?.nextAction ?? "最新main CI runをJudge Proofに含める",
      evidenceUrl: SUBMISSION_PROOF.ciWorkflowUrl
    })
  ];

  const rawScore = average(panels.map((item) => item.score));
  const finalistScore = Math.round(clamp(rawScore - externalPenalty));
  const advanceCount = panels.filter((item) => item.verdict === "advance").length;
  const watchCount = panels.filter((item) => item.verdict === "watch").length;
  const holdCount = panels.filter((item) => item.verdict === "hold").length;
  const weakestPanel = [...panels].sort((left, right) => left.score - right.score)[0];
  const finalistBand: FinalistBand =
    finalistScore >= 88 && externalGaps.length === 0 && holdCount === 0 ? "finalist-ready" : finalistScore >= 78 && holdCount <= 1 ? "borderline" : "not-mvp";
  const winningMove =
    externalGaps.length > 0
      ? `${externalGaps[0].label}を埋め、Pitch Directorの30秒リールにJudge ProofとFinalist Simulatorを入れる。`
      : weakestPanel?.nextAction ?? "Judge Proofを開いて証拠からピッチを始める。";
  const advanceDecision =
    finalistBand === "finalist-ready"
      ? "最終候補として押し出せる。証拠起点の30秒ピッチを録画する。"
      : finalistBand === "borderline"
        ? "最終候補圏内。ただし外部URLと最弱審査項目を提出前に潰す。"
        : "MVP未達。hold判定の審査項目を先に実装で補強する。";

  return {
    id: `finalist-${finalistScore}-${mission.id}`,
    finalistScore,
    finalistBand,
    advanceDecision,
    judgeConsensus: `${advanceCount} advance / ${watchCount} watch / ${holdCount} hold`,
    topConcern: weakestPanel?.concern ?? "審査員が開ける証拠を先頭に固定できているか。",
    winningMove,
    panels,
    gaps: externalGaps,
    runbook: [
      `curl -s -X POST ${finalistUrl} -H 'Content-Type: application/json' --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'`,
      `curl -s -X POST ${proofUrl} -H 'Content-Type: application/json' --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'`,
      `curl -s -X POST ${contractUrl} -H 'Content-Type: application/json' --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'`,
      `curl -s ${agentCardUrl}`,
      `curl -s ${SUBMISSION_PROOF.ciWorkflowUrl}`
    ],
    a2aPayload: {
      method: "message/send",
      skill: "finalist.simulate",
      finalistScore,
      finalistBand,
      judgeConsensus: {
        advance: advanceCount,
        watch: watchCount,
        hold: holdCount
      },
      panels: panels.map((item) => ({
        id: item.id,
        score: item.score,
        verdict: item.verdict,
        evidenceUrl: item.evidenceUrl
      })),
      gaps: externalGaps.map((gap) => ({
        id: gap.id,
        severity: gap.severity,
        action: gap.action
      })),
      appUrl
    }
  };
}
