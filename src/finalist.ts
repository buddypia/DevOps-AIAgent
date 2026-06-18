import type { SquadContract } from "./contracts.js";
import type { JudgeDrill, JudgeObjection } from "./judgeDrill.js";
import type { MissionRun } from "./mission.js";
import type { OpsDrill } from "./ops.js";
import type { PitchChecklistItem, PitchRun } from "./pitch.js";
import type { ReleaseDriftGuard, ReleaseDriftVerdict } from "./releaseDrift.js";
import {
  SUBMISSION_PROOF,
  hasSubmissionUrl,
  normalizeSubmissionUrl,
  type SubmissionUrlEvidence,
  validProtoPediaUrl,
  validVideoUrl
} from "./submission.js";
import type { JudgeCriterion, WinningStrategy } from "./strategy.js";
import type { Recommendation } from "./types.js";

export type FinalistBand = "finalist-ready" | "borderline" | "not-mvp";
export type FinalistVerdict = "advance" | "watch" | "hold";
export type FinalistInternalLockStatus = "sealed" | "watch" | "blocked";
export type FinalistInternalLockReadiness = "internal-finalist-ready" | "internal-finalist-external-watch" | "needs-finalist-proof";

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

type ExternalUrlState = "ready" | "missing" | "invalid";

type FinalistSubmissionState = {
  protopediaUrl: string;
  protopedia: ExternalUrlState;
  videoUrl: string;
  video: ExternalUrlState;
};

export type FinalistInternalLockCheck = {
  id: string;
  label: string;
  status: FinalistInternalLockStatus;
  score: number;
  proof: string;
  evidenceUrl: string;
};

export type FinalistInternalLock = {
  id: string;
  lockScore: number;
  internalScore: number;
  readiness: FinalistInternalLockReadiness;
  sealedCount: number;
  watchCount: number;
  blockedCount: number;
  operatorLine: string;
  checks: FinalistInternalLockCheck[];
};

export type FinalistReleaseDriftSummary = {
  verdict: ReleaseDriftVerdict;
  driftScore: number;
  targetBaseUrl: string;
  missingSkills: string[];
  missingAgentCardSignals: string[];
  nextAction: string;
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
  internalLock: FinalistInternalLock;
  releaseDrift: FinalistReleaseDriftSummary | null;
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

function internalLockScore(status: FinalistInternalLockStatus) {
  if (status === "sealed") return 100;
  if (status === "watch") return 88;
  return 20;
}

function internalLockCheck(input: Omit<FinalistInternalLockCheck, "score"> & { score?: number }): FinalistInternalLockCheck {
  return {
    ...input,
    score: Math.round(clamp(input.score ?? internalLockScore(input.status)))
  };
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

function urlState(value: string, valid: boolean): ExternalUrlState {
  if (!value) return "missing";
  return valid ? "ready" : "invalid";
}

function buildSubmissionState(urls: SubmissionUrlEvidence | undefined): FinalistSubmissionState {
  const protopediaUrl = normalizeSubmissionUrl(urls?.protopediaUrl ?? SUBMISSION_PROOF.protopediaUrl);
  const videoUrl = normalizeSubmissionUrl(urls?.videoUrl ?? SUBMISSION_PROOF.videoUrl);
  return {
    protopediaUrl,
    protopedia: urlState(protopediaUrl, validProtoPediaUrl(protopediaUrl)),
    videoUrl,
    video: urlState(videoUrl, validVideoUrl(videoUrl))
  };
}

function submissionUrlGap(id: "protopedia" | "video", state: ExternalUrlState): FinalistGap | null {
  if (state === "ready") return null;
  if (id === "protopedia") {
    return {
      id,
      label: "ProtoPedia作品",
      severity: state === "invalid" ? "blocker" : "external",
      owner: "Submission owner",
      action:
        state === "invalid"
          ? "https://protopedia.net/prototype/... の作品URLを入力する"
          : "競合/SWOT/審査スコア画面を構成図とストーリーに入れる",
      proof: state === "invalid" ? "ProtoPedia URL is not a valid protopedia.net https URL." : "作品ページ、動画、構成図、タグ findy_hackathon は提出直前作業。"
    };
  }
  return {
    id,
    label: "Video URL",
    severity: state === "invalid" ? "blocker" : "external",
    owner: "Pitch Director",
    action: state === "invalid" ? "YouTubeまたはVimeoのhttps動画URLを入力する" : "30秒リールを録画し、動画URLを提出欄へ貼る",
    proof: state === "invalid" ? "Video URL is not a valid YouTube or Vimeo https URL." : "Demo RunwayとPitch Directorの30秒構成を録画して貼る。"
  };
}

function checklistGaps(items: PitchChecklistItem[], submissionState: FinalistSubmissionState) {
  return items
    .filter((item) => item.status === "watch")
    .flatMap((item) => {
      if (item.id === "protopedia") {
        const gap = submissionUrlGap("protopedia", submissionState.protopedia);
        return gap ? [gap] : [];
      }
      if (item.id === "video") {
        const gap = submissionUrlGap("video", submissionState.video);
        return gap ? [gap] : [];
      }
      return [
        {
          id: item.id,
          label: item.label,
          severity: "watch",
          owner: "Submission owner",
          action: `${item.label}を提出欄へ貼る`,
          proof: item.proof
        } satisfies FinalistGap
      ];
    });
}

function submissionGaps(strategy: WinningStrategy, submissionState: FinalistSubmissionState) {
  return strategy.submissionItems
    .filter((item) => !item.done)
    .flatMap((item) => {
      if (item.id === "protopedia") {
        const gap = submissionUrlGap("protopedia", submissionState.protopedia);
        return gap ? [gap] : [];
      }
      return [
        {
          id: item.id,
          label: item.label,
          severity: "watch",
          owner: "Submission owner",
          action: item.nextAction,
          proof: item.proof
        } satisfies FinalistGap
      ];
    });
}

function uniqueGaps(gaps: FinalistGap[]) {
  const seen = new Set<string>();
  return gaps.filter((gap) => {
    if (seen.has(gap.id)) return false;
    seen.add(gap.id);
    return true;
  });
}

function buildInternalLock(input: {
  baseUrl: string;
  strategy: WinningStrategy;
  mission: MissionRun;
  opsDrill: OpsDrill;
  pitch: PitchRun;
  squadContract: SquadContract;
  panels: FinalistPanel[];
  gaps: FinalistGap[];
  ciReady: number;
  releaseDrift?: ReleaseDriftGuard;
}): FinalistInternalLock {
  const base = input.baseUrl.replace(/\/$/, "");
  const holdCount = input.panels.filter((panel) => panel.verdict === "hold").length;
  const externalGapCount = input.gaps.filter((gap) => gap.severity === "external").length;
  const externalBlockerCount = input.gaps.filter((gap) => gap.severity === "blocker").length;
  const externalTruthGaps = input.gaps.filter((gap) => gap.severity === "external" || gap.severity === "blocker");
  const swotCount =
    input.strategy.swot.strengths.length +
    input.strategy.swot.weaknesses.length +
    input.strategy.swot.opportunities.length +
    input.strategy.swot.threats.length;
  const proofRouteReady = input.pitch.totalSeconds === 30 && input.pitch.scenes.length >= 5 && input.pitch.recordingChecklist.length >= 4;
  const checks = [
    internalLockCheck({
      id: "five-panel-floor",
      label: "Five judge panels avoid hold",
      status: holdCount === 0 && input.panels.every((panel) => panel.score >= 76) ? "sealed" : holdCount <= 1 ? "watch" : "blocked",
      proof: `${input.panels.filter((panel) => panel.verdict === "advance").length} advance / ${input.panels.filter((panel) => panel.verdict === "watch").length} watch / ${holdCount} hold.`,
      evidenceUrl: absoluteUrl(base, "/api/finalist")
    }),
    internalLockCheck({
      id: "competitive-swot-proof",
      label: "Competitive and SWOT proof exists",
      status: input.strategy.competitors.length >= 6 && swotCount >= 8 && input.strategy.moatScore >= 82 ? "sealed" : input.strategy.moatScore >= 74 ? "watch" : "blocked",
      proof: `${input.strategy.competitors.length} competitors / ${swotCount} SWOT items / ${input.strategy.moatScore} moat score.`,
      evidenceUrl: absoluteUrl(base, input.mission.submissionPack.storyMarkdownPath)
    }),
    internalLockCheck({
      id: "agent-necessity-proof",
      label: "A2A agent necessity is visible",
      status: input.mission.autonomyScore >= 84 && input.squadContract.contractScore >= 88 ? "sealed" : input.mission.autonomyScore >= 76 ? "watch" : "blocked",
      proof: `${input.mission.autonomyScore} autonomy / ${input.squadContract.contractScore} contract proof.`,
      evidenceUrl: absoluteUrl(base, "/.well-known/agent-card.json")
    }),
    internalLockCheck({
      id: "demo-route-proof",
      label: "30-second finalist demo route",
      status: proofRouteReady ? "sealed" : input.pitch.readinessScore >= 76 ? "watch" : "blocked",
      proof: `${input.pitch.totalSeconds}s / ${input.pitch.scenes.length} scenes / ${input.pitch.recordingChecklist.length} checklist items.`,
      evidenceUrl: absoluteUrl(base, "/api/pitch")
    }),
    internalLockCheck({
      id: "ops-ci-proof",
      label: "Public implementation and CI proof",
      status: !input.opsDrill.rollbackRecommended && input.ciReady >= 100 && input.mission.verificationScore >= 84 ? "sealed" : input.ciReady >= 80 ? "watch" : "blocked",
      proof: `${input.opsDrill.readinessScore} ops / ${input.mission.verificationScore} verification / ${input.ciReady} CI.`,
      evidenceUrl: SUBMISSION_PROOF.ciWorkflowUrl
    }),
    internalLockCheck({
      id: "external-submit-truth",
      label: "External submission truth stays visible",
      status: externalBlockerCount > 0 ? "blocked" : externalGapCount > 0 ? "watch" : "sealed",
      proof:
        externalBlockerCount > 0
          ? `${externalBlockerCount} invalid external URL gaps remain: ${externalTruthGaps.map((gap) => gap.id).join(", ")}.`
          : externalGapCount > 0
            ? `${externalGapCount} external gaps remain: ${externalTruthGaps.map((gap) => gap.id).join(", ")}.`
          : "ProtoPedia and video submission gaps are closed.",
      evidenceUrl: absoluteUrl(base, "/api/submission-closeout")
    })
  ];
  if (input.releaseDrift) {
    checks.push(
      internalLockCheck({
        id: "public-release-truth",
        label: "Public Cloud Run revision is current",
        status:
          input.releaseDrift.verdict === "release-current"
            ? "sealed"
            : input.releaseDrift.verdict === "deploy-drift"
              ? "watch"
              : "blocked",
        score: input.releaseDrift.verdict === "release-current" ? 100 : input.releaseDrift.verdict === "deploy-drift" ? 72 : 20,
        proof:
          input.releaseDrift.verdict === "release-current"
            ? `${input.releaseDrift.driftScore} drift score; public release is current.`
            : `${input.releaseDrift.verdict}: ${input.releaseDrift.missingSkills.length} missing skills / ${input.releaseDrift.missingAgentCardSignals.length} missing Agent Card signals.`,
        evidenceUrl: absoluteUrl(base, "/api/release-drift")
      })
    );
  }
  const nonExternalChecks = checks.filter((check) => check.id !== "external-submit-truth");
  const sealedCount = checks.filter((check) => check.status === "sealed").length;
  const watchCount = checks.filter((check) => check.status === "watch").length;
  const blockedCount = checks.filter((check) => check.status === "blocked").length;
  const internalScore = Math.round(clamp(average(nonExternalChecks.map((check) => check.score))));
  const lockScore = Math.round(clamp(average(checks.map((check) => check.score))));
  const nonExternalSealed = nonExternalChecks.every((check) => check.status === "sealed");
  const readiness: FinalistInternalLockReadiness =
    blockedCount > 0 || !nonExternalSealed
      ? "needs-finalist-proof"
      : externalGapCount > 0
        ? "internal-finalist-external-watch"
        : "internal-finalist-ready";

  return {
    id: `finalist-internal-lock-${lockScore}-${readiness}`,
    lockScore,
    internalScore,
    readiness,
    sealedCount,
    watchCount,
    blockedCount,
    operatorLine:
      readiness === "internal-finalist-ready"
        ? "Internal finalist proof and external submission evidence are sealed."
        : readiness === "internal-finalist-external-watch"
          ? "Internal finalist proof is sealed; only ProtoPedia/video external submission URLs remain."
          : "One or more internal finalist proof lanes still needs work before the pitch.",
    checks
  };
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
  submissionUrls?: SubmissionUrlEvidence;
  releaseDrift?: ReleaseDriftGuard;
}): FinalistSimulation {
  const { baseUrl, recommendation, strategy, mission, opsDrill, pitch, judgeDrill, squadContract, submissionUrls, releaseDrift } = input;
  const appUrl = mission.submissionPack.deployedUrl || baseUrl;
  const proofUrl = absoluteUrl(baseUrl, "/api/proof");
  const finalistUrl = absoluteUrl(baseUrl, "/api/finalist");
  const agentCardUrl = absoluteUrl(baseUrl, "/.well-known/agent-card.json");
  const strategyUrl = absoluteUrl(baseUrl, mission.submissionPack.storyMarkdownPath);
  const opsUrl = absoluteUrl(baseUrl, "/api/ops-drill");
  const pitchUrl = absoluteUrl(baseUrl, "/api/pitch");
  const contractUrl = absoluteUrl(baseUrl, "/api/contracts");
  const ciReady = hasSubmissionUrl(SUBMISSION_PROOF.ciWorkflowUrl) ? 100 : 45;
  const submissionState = buildSubmissionState(submissionUrls);
  const releaseGap =
    releaseDrift && releaseDrift.verdict !== "release-current"
      ? ({
          id: "public-release-drift",
          label: "Public Cloud Run release drift",
          severity: releaseDrift.verdict === "release-blocked" ? "blocker" : "watch",
          owner: "Cloud Run SRE",
          action:
            releaseDrift.verdict === "release-blocked"
              ? "公開Cloud RunまたはCIを復旧し、Release Drift Guardを再実行する"
              : "最新mainをCloud Runへ再デプロイし、Agent Card / A2A / Acceptance Matrixを再検証する",
          proof: releaseDrift.summary
        } satisfies FinalistGap)
      : null;
  const externalGaps = uniqueGaps([
    ...submissionGaps(strategy, submissionState),
    ...checklistGaps(pitch.recordingChecklist, submissionState),
    ...(releaseGap ? [releaseGap] : [])
  ]);
  const externalPenalty = externalGaps.filter((gap) => gap.severity === "external").length * 2 + externalGaps.filter((gap) => gap.severity === "blocker").length * 18;
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
      nextAction: usability?.nextAction ?? "審査員が押すボタンをWin Autopilotから固定する",
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
  const advanceCount = panels.filter((item) => item.verdict === "advance").length;
  const watchCount = panels.filter((item) => item.verdict === "watch").length;
  const holdCount = panels.filter((item) => item.verdict === "hold").length;
  const internalLock = buildInternalLock({
    baseUrl,
    strategy,
    mission,
    opsDrill,
    pitch,
    squadContract,
    panels,
    gaps: externalGaps,
    ciReady,
    releaseDrift
  });
  const finalistScore = Math.round(clamp(average([rawScore, internalLock.internalScore]) - externalPenalty));
  const weakestPanel = [...panels].sort((left, right) => left.score - right.score)[0];
  const finalistBand: FinalistBand =
    finalistScore >= 88 && externalGaps.length === 0 && holdCount === 0 ? "finalist-ready" : finalistScore >= 78 && holdCount <= 1 ? "borderline" : "not-mvp";
  const releaseDriftSummary: FinalistReleaseDriftSummary | null = releaseDrift
    ? {
        verdict: releaseDrift.verdict,
        driftScore: releaseDrift.driftScore,
        targetBaseUrl: releaseDrift.targetBaseUrl,
        missingSkills: releaseDrift.missingSkills,
        missingAgentCardSignals: releaseDrift.missingAgentCardSignals,
        nextAction: releaseDrift.nextActions[0]?.action ?? (releaseDrift.verdict === "release-current" ? "Public release is current." : "Run Release Drift Guard.")
      }
    : null;
  const winningMove =
    externalGaps.length > 0
      ? `${externalGaps[0].label}を埋め、Finalist Internal LockとDemo Runwayの30秒リールにJudge Proofを入れる。`
      : weakestPanel?.nextAction ?? "Win Autopilotを開いて証拠からピッチを始める。";
  const advanceDecision =
    finalistBand === "finalist-ready"
      ? "最終候補として押し出せる。証拠起点の30秒ピッチを録画する。"
      : internalLock.readiness === "internal-finalist-external-watch"
        ? "内部MVPは最終候補級です。ProtoPedia作品URLと動画URLを発行すれば提出判定へ進めます。"
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
    internalLock,
    releaseDrift: releaseDriftSummary,
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
      submissionUrls: {
        protopedia: {
          status: submissionState.protopedia,
          url: submissionState.protopediaUrl || null
        },
        video: {
          status: submissionState.video,
          url: submissionState.videoUrl || null
        }
      },
      internalLock: {
        lockScore: internalLock.lockScore,
        internalScore: internalLock.internalScore,
        readiness: internalLock.readiness,
        checks: internalLock.checks.map((check) => ({
          id: check.id,
          status: check.status,
          score: check.score,
          evidenceUrl: check.evidenceUrl
        }))
      },
      releaseDrift: releaseDriftSummary,
      appUrl
    }
  };
}
