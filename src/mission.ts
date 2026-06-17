import type { Recommendation } from "./types.js";
import { hasSubmissionUrl, SUBMISSION_PROOF } from "./submission.js";
import type { JudgeCriterion, WinningStrategy } from "./strategy.js";

export type MissionPhase = "sense" | "decide" | "delegate" | "verify" | "ship";

export type MissionStep = {
  id: string;
  phase: MissionPhase;
  actor: string;
  action: string;
  input: string;
  output: string;
  status: "completed" | "ready";
};

export type MissionDecision = {
  id: string;
  actor: string;
  target: string;
  rationale: string;
  evidence: string;
  confidence: number;
};

export type MissionArtifact = {
  id: string;
  name: string;
  type: "story" | "architecture" | "verification" | "a2a" | "video";
  content: string;
};

export type SubmissionRequirement = {
  id: string;
  label: string;
  status: "ready" | "needs-url";
  proof: string;
};

export type MissionRun = {
  id: string;
  objective: string;
  summary: string;
  autonomyScore: number;
  verificationScore: number;
  submissionScore: number;
  weakestCriterion: JudgeCriterion;
  decisions: MissionDecision[];
  steps: MissionStep[];
  artifacts: MissionArtifact[];
  verificationCommands: string[];
  submissionPack: {
    protopediaTitle: string;
    tags: string[];
    story: string;
    demoScript: string;
    architectureBullets: string[];
    architectureDiagramUrl: string;
    storyMarkdownPath: string;
    publicGitHubUrl: string;
    ciWorkflowUrl: string;
    deployedUrl: string;
    protopediaUrl: string;
    videoUrl: string;
    videoStoryboard: string[];
    requirements: SubmissionRequirement[];
  };
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function pickAgentName(recommendation: Recommendation, id: string, fallback: string) {
  return recommendation.selected.find((agent) => agent.id === id)?.name ?? fallback;
}

function weakestCriterion(strategy: WinningStrategy) {
  return [...strategy.judgeCriteria].sort((a, b) => a.score - b.score)[0];
}

function selectedNames(recommendation: Recommendation) {
  const names = recommendation.selected.map((agent) => agent.name);
  return names.length > 0 ? names.join(" / ") : "A2A Market Broker";
}

export function buildMissionRun(recommendation: Recommendation, strategy: WinningStrategy, objective?: string): MissionRun {
  const missionObjective =
    objective?.trim() ||
    "ハッカソン審査で勝てる提出物にするため、競合差分、A2A委任、Cloud Run運用証跡、ProtoPediaストーリーを一気通貫で固める。";
  const weakest = weakestCriterion(strategy);
  const broker = pickAgentName(recommendation, "market-broker", recommendation.selected[0]?.name ?? "A2A Market Broker");
  const strategist = pickAgentName(recommendation, "gemini-strategist", "Gemini Strategist");
  const sre = pickAgentName(recommendation, "cloud-run-sre", "Cloud Run SRE");
  const verifier = strategy.nextBestAgent?.agent.name ?? pickAgentName(recommendation, "test-forge", "Test Forge");
  const selected = selectedNames(recommendation);
  const topCompetitor = strategy.competitors[0];
  const nextHire = strategy.nextBestAgent?.agent.name ?? "追加雇用なし";
  const runId = `mission-${slugify(`${weakest.id}-${recommendation.selected.map((agent) => agent.id).join("-")}`) || "default"}`;

  const decisions: MissionDecision[] = [
    {
      id: "positioning",
      actor: broker,
      target: topCompetitor.name,
      rationale: "公式基盤と競争せず、必要能力を発見して買う市場体験へポジションをずらす。",
      evidence: topCompetitor.counterPosition,
      confidence: strategy.moatScore
    },
    {
      id: "weakness-repair",
      actor: strategist,
      target: weakest.label,
      rationale: `審査スコアで最も弱い ${weakest.label} を先に補強する。`,
      evidence: weakest.nextAction,
      confidence: weakest.score
    },
    {
      id: "next-hire",
      actor: broker,
      target: nextHire,
      rationale: strategy.nextBestAgent?.reason ?? "既存編成で審査基準を満たしている。",
      evidence: strategy.nextBestAgent?.expectedLift ?? "追加雇用なしで提出パック生成へ進む。",
      confidence: clamp(strategy.judgeScore + 4)
    }
  ];

  const steps: MissionStep[] = [
    {
      id: "sense-market",
      phase: "sense",
      actor: broker,
      action: "競合と審査基準を読む",
      input: missionObjective,
      output: `${strategy.competitors.length}競合、${strategy.judgeCriteria.length}審査項目、MVP proof ${strategy.mvpScore}を確認`,
      status: "completed"
    },
    {
      id: "decide-squad",
      phase: "decide",
      actor: broker,
      action: "編成と次の買い足しを決める",
      input: selected,
      output: `${weakest.label}を補うため ${nextHire} を推薦`,
      status: "completed"
    },
    {
      id: "delegate-a2a",
      phase: "delegate",
      actor: broker,
      action: "A2A message/sendでタスク委任",
      input: "/.well-known/agent-card.json",
      output: `${selected} に勝ち筋、検証、提出パック生成を委任`,
      status: "completed"
    },
    {
      id: "verify-release",
      phase: "verify",
      actor: verifier,
      action: "検証コマンドと証跡を固定",
      input: "typecheck / test / build / strategy API",
      output: "審査員に見せる検証runbookを生成",
      status: "completed"
    },
    {
      id: "ship-pack",
      phase: "ship",
      actor: sre,
      action: "Cloud RunとProtoPedia提出へ接続",
      input: "Cloud Run URL / Agent Card / demo script",
      output: "30秒動画用の提出順序を生成",
      status: "completed"
    }
  ];

  const verificationCommands = [
    "npm run typecheck",
    "npm test",
    "npm run build",
    "make q.check-architecture",
    "curl -s ${PUBLIC_BASE_URL:-http://localhost:8080}/api/healthz",
    "curl -s ${PUBLIC_BASE_URL:-http://localhost:8080}/.well-known/agent-card.json",
    "curl -s -X POST ${PUBLIC_BASE_URL:-http://localhost:8080}/api/strategy -H 'Content-Type: application/json' --data '{\"projectBrief\":\"A2A Cloud Run Gemini DevOps\",\"selectedAgentIds\":[\"market-broker\",\"gemini-strategist\",\"cloud-run-sre\"]}'",
    "curl -s -X POST ${PUBLIC_BASE_URL:-http://localhost:8080}/api/ops-drill -H 'Content-Type: application/json' --data '{\"projectBrief\":\"A2A Cloud Run Gemini DevOps\",\"selectedAgentIds\":[\"market-broker\",\"gemini-strategist\",\"cloud-run-sre\"]}'",
    "curl -s https://api.github.com/repos/buddypia/DevOps-AIAgent/actions/workflows/ci.yml/runs?branch=main\\&per_page=1"
  ];

  const story = [
    "開発チームは、AIエージェントを作る前に、どの能力を持つAIを選ぶべきかで迷っている。",
    "Agent-To-Agent Marketplaceは、Agent Card、MCP成熟度、価格、審査スコアを読み、必要なAIを市場から雇う。",
    "雇われたAIはA2Aで委任を受け、Gemini分析、Cloud Run運用、検証証跡、ProtoPedia提出物へつなげる。"
  ].join("\n");
  const architectureDiagramUrl = "/assets/a2a-marketplace-architecture.svg";
  const videoStoryboard = [
    "0-4秒: Win Autopilotを実行し、win score、残アクション、証拠デッキを表示する",
    "4-8秒: Judge Proofを実行し、Gemini/Cloud Run/A2A/CIの証拠束を見せる",
    "8-12秒: Finalist Simulatorで審査員5役の判定と残ギャップを見せる",
    "12-16秒: Submission PublisherでProtoPedia貼り付け本文と提出チェックリストを見せる",
    "16-21秒: Demo Runway、Marketplace、Winning Strategyで30秒導線と競合/SWOTを確認する",
    "21-30秒: Contract、Mission、Ops、Cloud Run URL、GitHub Actions、Agent Card、構成図で締める"
  ];
  const requirements: SubmissionRequirement[] = [
    {
      id: "github",
      label: "公開GitHubリポジトリURL",
      status: hasSubmissionUrl(SUBMISSION_PROOF.publicGitHubUrl) ? "ready" : "needs-url",
      proof: hasSubmissionUrl(SUBMISSION_PROOF.publicGitHubUrl)
        ? `${SUBMISSION_PROOF.publicGitHubUrl} をPUBLICリポジトリとして提出可能。`
        : "コード、README、テスト、Cloud Run構成、提出資料はリポジトリ側に準備済み。"
    },
    {
      id: "deployed-url",
      label: "デプロイ済みURL",
      status: "ready",
      proof: `${SUBMISSION_PROOF.deployedUrl} でCloud Run公開済み。Dockerfile、cloudbuild.yaml、/api/healthz、Agent Card、A2A endpointを実装済み。`
    },
    {
      id: "protopedia",
      label: "ProtoPedia作品URL",
      status: "needs-url",
      proof: "タイトル、タグ、ストーリー、動画構成、システム構成図を提出パックとして生成済み。"
    },
    {
      id: "video",
      label: "動画URL",
      status: "needs-url",
      proof: "30秒デモ台本と6カットのストーリーボードを生成済み。"
    },
    {
      id: "architecture",
      label: "システム構成図",
      status: "ready",
      proof: `${architectureDiagramUrl} を公開アセットとして用意。`
    },
    {
      id: "github-ci",
      label: "GitHub Actions CI",
      status: hasSubmissionUrl(SUBMISSION_PROOF.ciWorkflowUrl) ? "ready" : "needs-url",
      proof: hasSubmissionUrl(SUBMISSION_PROOF.ciWorkflowUrl)
        ? `${SUBMISSION_PROOF.ciWorkflowUrl} でtypecheck、test、build、architecture checkの公開証跡を確認可能。`
        : "公開CI workflowは未設定。"
    },
    {
      id: "tag",
      label: "findy_hackathonタグ",
      status: "ready",
      proof: "Submission Packのタグ配列に findy_hackathon を含めている。"
    }
  ];

  const artifacts: MissionArtifact[] = [
    {
      id: "protopedia-story",
      name: "ProtoPedia story draft",
      type: "story",
      content: story
    },
    {
      id: "architecture",
      name: "Architecture bullets",
      type: "architecture",
      content: `React UI -> Express API -> Strategy/Mission Engine -> Gemini 3.5 Flash -> A2A endpoint -> Cloud Run\nDiagram: ${architectureDiagramUrl}`
    },
    {
      id: "verification",
      name: "Verification runbook",
      type: "verification",
      content: verificationCommands.join("\n")
    },
    {
      id: "a2a-delegation",
      name: "A2A delegation payload",
      type: "a2a",
      content: JSON.stringify(
        {
          method: "message/send",
          objective: missionObjective,
          selectedAgents: recommendation.selected.map((agent) => agent.id),
          weakestCriterion: weakest.id,
          nextHire: strategy.nextBestAgent?.agent.id ?? null
        },
        null,
        2
      )
    },
    {
      id: "video-storyboard",
      name: "30 second demo storyboard",
      type: "video",
      content: videoStoryboard.join("\n")
    }
  ];

  const verificationScore = clamp(Math.round((verificationCommands.length / 6) * 100));
  const submissionScore = clamp(Math.round((strategy.submissionItems.filter((item) => item.done).length / strategy.submissionItems.length) * 100));

  return {
    id: runId,
    objective: missionObjective,
    summary: `${broker} が ${weakest.label} を検出し、${nextHire} を推薦しながら、A2A委任と提出パックを生成しました。`,
    autonomyScore: clamp(Math.round((strategy.judgeScore + strategy.moatScore + decisions.length * 6) / 2.2)),
    verificationScore,
    submissionScore,
    weakestCriterion: weakest,
    decisions,
    steps,
    artifacts,
    verificationCommands,
    submissionPack: {
      protopediaTitle: "Agent-To-Agent Marketplace",
      tags: ["findy_hackathon", "DevOps", "AI Agent", "A2A", "Cloud Run", "Gemini"],
      story,
      demoScript:
        "ブリーフを貼ると、市場仲介AIが必要能力を読み取り、AIエージェントを雇います。競合/SWOTと審査スコアを確認し、A2Aで委任、Geminiで勝ち筋を分析、Cloud Runの公開URLとAgent Cardまで提出物として閉じます。",
      architectureBullets: [
        "React UIでブリーフ、マーケット、戦略、ミッション証跡を表示",
        "Express APIがGemini、A2A、Strategy、Missionを提供",
        "Strategy Engineが競合、SWOT、審査基準、MVP proofを算出",
        "Mission Engineが自律判断、A2A委任、検証runbook、提出パックを生成",
        "Cloud RunがUI/API/Agent Cardを単一サービスとして公開"
      ],
      architectureDiagramUrl,
      storyMarkdownPath: "/docs/03_submission/submission-pack.md",
      publicGitHubUrl: SUBMISSION_PROOF.publicGitHubUrl,
      ciWorkflowUrl: SUBMISSION_PROOF.ciWorkflowUrl,
      deployedUrl: SUBMISSION_PROOF.deployedUrl,
      protopediaUrl: SUBMISSION_PROOF.protopediaUrl,
      videoUrl: SUBMISSION_PROOF.videoUrl,
      videoStoryboard,
      requirements
    }
  };
}
