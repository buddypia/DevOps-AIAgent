import type { MissionRun } from "./mission.js";
import type { OpsDrill } from "./ops.js";
import { SUBMISSION_PROOF, hasSubmissionUrl } from "./submission.js";
import type { WinningStrategy } from "./strategy.js";
import type { Recommendation } from "./types.js";

export type PitchScene = {
  id: string;
  timeRange: string;
  durationSeconds: number;
  title: string;
  screen: string;
  gesture: string;
  voiceover: string;
  caption: string;
  proof: string;
  judgeCriterion: string;
  evidenceUrl: string;
};

export type PitchChecklistItem = {
  id: string;
  label: string;
  status: "ready" | "watch";
  proof: string;
  url?: string;
};

export type PitchRun = {
  id: string;
  totalSeconds: number;
  readinessScore: number;
  heroLine: string;
  thesis: string;
  scenes: PitchScene[];
  lowerThirds: string[];
  recordingChecklist: PitchChecklistItem[];
  submissionWarnings: PitchChecklistItem[];
  voiceoverScript: string;
  shotList: string[];
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

function timeRange(start: number, duration: number) {
  return `${start}-${start + duration}s`;
}

function checklistStatus(ready: boolean): PitchChecklistItem["status"] {
  return ready ? "ready" : "watch";
}

export function buildPitchRun(input: {
  baseUrl: string;
  recommendation: Recommendation;
  strategy: WinningStrategy;
  mission: MissionRun;
  opsDrill: OpsDrill;
}): PitchRun {
  const { baseUrl, recommendation, strategy, mission, opsDrill } = input;
  const appUrl = mission.submissionPack.deployedUrl || baseUrl;
  const proofUrl = absoluteUrl(baseUrl, "/api/proof");
  const agentCardUrl = absoluteUrl(baseUrl, "/.well-known/agent-card.json");
  const storyUrl = absoluteUrl(baseUrl, mission.submissionPack.storyMarkdownPath);
  const architectureUrl = absoluteUrl(baseUrl, mission.submissionPack.architectureDiagramUrl);
  const topCompetitor = strategy.competitors[0]?.name ?? "Google ADK";
  const nextAgent = strategy.nextBestAgent?.agent.name ?? opsDrill.nextOpsAgent?.name ?? "追加雇用なし";
  const selectedAgents = recommendation.selected.map((agent) => agent.name).join(" / ") || "A2A Market Broker";
  const durations = [4, 5, 5, 6, 5, 5];

  const scenes: PitchScene[] = [
    {
      id: "proof",
      timeRange: timeRange(0, durations[0]),
      durationSeconds: durations[0],
      title: "Open with proof",
      screen: "Judge Proof",
      gesture: "Run judge proofを押し、CI/Cloud Run/A2A/Geminiのpassed証拠を最初に見せる",
      voiceover: "これはAIを作るデモではなく、必要なAI能力を雇って運用まで閉じるマーケットプレイスです。",
      caption: "Evidence first",
      proof: "Judge ProofがGemini、Cloud Run、A2A、CI、提出資料を1つのreceiptへ束ねる。",
      judgeCriterion: "実装力",
      evidenceUrl: proofUrl
    },
    {
      id: "market",
      timeRange: timeRange(4, durations[1]),
      durationSeconds: durations[1],
      title: "Show the buying loop",
      screen: "Marketplace",
      gesture: "Project Briefと選択済みエージェントを見せ、能力値で雇う体験を示す",
      voiceover: "ブリーフから必要能力を読み、A2A、MCP、Cloud Run、UXの足りない役割を市場から選びます。",
      caption: "Buy capabilities, not prompts",
      proof: `${selectedAgents} が選択され、改善スコアとA2A委任タイムラインが更新される。`,
      judgeCriterion: "AIエージェント中心性",
      evidenceUrl: appUrl
    },
    {
      id: "strategy",
      timeRange: timeRange(9, durations[2]),
      durationSeconds: durations[2],
      title: "Position against competitors",
      screen: "Winning Strategy",
      gesture: "競合、SWOT、審査スコア、次に雇うAIを横断して見せる",
      voiceover: `ADKやLangGraphと正面衝突せず、${topCompetitor}の前段にある調達判断を狙います。`,
      caption: "Compete before the build",
      proof: `競合${strategy.competitors.length}件、SWOT、moat ${strategy.moatScore}、judge ${strategy.judgeScore}を算出済み。`,
      judgeCriterion: "課題アプローチ力",
      evidenceUrl: storyUrl
    },
    {
      id: "mission",
      timeRange: timeRange(14, durations[3]),
      durationSeconds: durations[3],
      title: "Let agents act",
      screen: "Mission Control",
      gesture: "sense -> decide -> delegate -> verify -> shipの5段階を流す",
      voiceover: "AIは推薦で止まらず、弱点を検出し、A2Aで委任し、検証runbookと提出パックまで生成します。",
      caption: "Autonomy with evidence",
      proof: `${mission.weakestCriterion.label}を検出し、${nextAgent}を次の補強として提示する。`,
      judgeCriterion: "実用性・体験価値",
      evidenceUrl: appUrl
    },
    {
      id: "ops",
      timeRange: timeRange(20, durations[4]),
      durationSeconds: durations[4],
      title: "Operate the release",
      screen: "Cloud Run Ops Drill",
      gesture: "ヘルス、latency、5xx、fallback、rollback判断を見せる",
      voiceover: "公開後もAIが運用シグナルを読み、継続かロールバックか、次に何を雇うかを判断します。",
      caption: "DevOps loop",
      proof: `severity ${opsDrill.severity}、readiness ${opsDrill.readinessScore}、rollback ${opsDrill.rollbackRecommended ? "yes" : "no"}。`,
      judgeCriterion: "実装力",
      evidenceUrl: appUrl
    },
    {
      id: "submission",
      timeRange: timeRange(25, durations[5]),
      durationSeconds: durations[5],
      title: "Close with submission",
      screen: "Submission Kit",
      gesture: "構成図、findy_hackathonタグ、GitHub、Cloud Run、CI URLで締める",
      voiceover: "最後に、ProtoPediaに貼るストーリー、構成図、公開URL、CI証跡まで提出物として閉じます。",
      caption: "Ready to submit",
      proof: `architecture ${architectureUrl}、GitHub ${SUBMISSION_PROOF.publicGitHubUrl}、CI ${SUBMISSION_PROOF.ciWorkflowUrl}。`,
      judgeCriterion: "ユーザビリティ",
      evidenceUrl: architectureUrl
    }
  ];

  const recordingChecklist: PitchChecklistItem[] = [
    {
      id: "cloud-run",
      label: "Cloud Run URL",
      status: checklistStatus(hasSubmissionUrl(SUBMISSION_PROOF.deployedUrl)),
      proof: "公開デモを録画できるURLが固定されている。",
      url: SUBMISSION_PROOF.deployedUrl
    },
    {
      id: "github",
      label: "Public GitHub",
      status: checklistStatus(hasSubmissionUrl(SUBMISSION_PROOF.publicGitHubUrl)),
      proof: "README、テスト、Cloud Run構成、提出資料を公開repoで確認できる。",
      url: SUBMISSION_PROOF.publicGitHubUrl
    },
    {
      id: "ci",
      label: "GitHub Actions CI",
      status: checklistStatus(hasSubmissionUrl(SUBMISSION_PROOF.ciWorkflowUrl)),
      proof: "typecheck/test/build/architecture checkの公開証跡を見せられる。",
      url: SUBMISSION_PROOF.ciWorkflowUrl
    },
    {
      id: "agent-card",
      label: "A2A Agent Card",
      status: "ready",
      proof: "A2A skillとしてmarket、mission、ops、ci、judge、pitchを公開する。",
      url: agentCardUrl
    },
    {
      id: "protopedia",
      label: "ProtoPedia URL",
      status: checklistStatus(hasSubmissionUrl(SUBMISSION_PROOF.protopediaUrl)),
      proof: "作品URLは外部登録後に貼る。",
      url: SUBMISSION_PROOF.protopediaUrl || undefined
    },
    {
      id: "video",
      label: "Video URL",
      status: checklistStatus(hasSubmissionUrl(SUBMISSION_PROOF.videoUrl)),
      proof: "このPitch Directorの30秒構成を録画して貼る。",
      url: SUBMISSION_PROOF.videoUrl || undefined
    }
  ];
  const readyChecklist = recordingChecklist.filter((item) => item.status === "ready").length;
  const checklistScore = Math.round((readyChecklist / recordingChecklist.length) * 100);
  const readinessScore = Math.round(
    clamp(
      average([
        strategy.judgeScore,
        strategy.moatScore,
        mission.autonomyScore,
        mission.verificationScore,
        opsDrill.readinessScore,
        checklistScore
      ])
    )
  );
  const submissionWarnings = recordingChecklist.filter((item) => item.status === "watch");
  const voiceoverScript = scenes.map((scene) => `${scene.timeRange} ${scene.voiceover}`).join("\n");

  return {
    id: `pitch-${readinessScore}-${mission.id}`,
    totalSeconds: scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0),
    readinessScore,
    heroLine: "30秒で、AI能力を雇い、A2Aで動かし、Cloud Run運用証跡まで閉じる。",
    thesis: "勝ち筋は、エージェント開発基盤ではなく、審査基準・運用制約・提出証跡を見ながらAI能力を調達する体験に置くこと。",
    scenes,
    lowerThirds: [
      "AI能力を市場から雇う",
      "競合/SWOTで勝ち筋を決める",
      "A2Aで委任して検証へ進む",
      "Cloud RunとCIで公開証跡を残す"
    ],
    recordingChecklist,
    submissionWarnings,
    voiceoverScript,
    shotList: scenes.map((scene) => `${scene.timeRange} ${scene.screen}: ${scene.gesture}`),
    a2aPayload: {
      method: "message/send",
      skill: "pitch.director",
      totalSeconds: 30,
      selectedAgents: recommendation.selected.map((agent) => agent.id),
      scenes: scenes.map((scene) => ({ id: scene.id, screen: scene.screen, proof: scene.proof })),
      warnings: submissionWarnings.map((item) => item.id)
    }
  };
}
