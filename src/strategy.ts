import { MARKET_AGENTS } from "./market.js";
import { hasSubmissionUrl, SUBMISSION_PROOF } from "./submission.js";
import type { CapabilityKey, MarketAgent, Recommendation } from "./types.js";

export type ThreatLevel = "low" | "medium" | "high";
export type SwotQuadrant = "strengths" | "weaknesses" | "opportunities" | "threats";

export type Competitor = {
  id: string;
  name: string;
  category: string;
  marketProof: string;
  strengths: string[];
  threatLevel: ThreatLevel;
  counterPosition: string;
  counterMove: string;
  sourceUrl: string;
};

export type SwotItem = {
  title: string;
  detail: string;
  signal: "positive" | "warning" | "risk" | "opening";
};

export type JudgeCriterion = {
  id: string;
  label: string;
  score: number;
  evidence: string;
  nextAction: string;
};

export type SubmissionItem = {
  id: string;
  label: string;
  done: boolean;
  proof: string;
  nextAction: string;
};

export type WinningHypothesis = {
  id: string;
  claim: string;
  proof: string;
  experiment: string;
  confidence: number;
};

export type WinningStrategy = {
  strategicThesis: string;
  moatScore: number;
  riskLevel: ThreatLevel;
  competitors: Competitor[];
  swot: Record<SwotQuadrant, SwotItem[]>;
  judgeCriteria: JudgeCriterion[];
  judgeScore: number;
  mvpScore: number;
  submissionItems: SubmissionItem[];
  hypotheses: WinningHypothesis[];
  nextBestAgent: {
    agent: MarketAgent;
    reason: string;
    expectedLift: string;
  } | null;
};

export const COMPETITORS: Competitor[] = [
  {
    id: "google-adk",
    name: "Google ADK / Gemini Enterprise",
    category: "公式エージェント基盤",
    marketProof: "ADKは構築、デバッグ、評価、Cloud Run/GKE/Runtimeへの展開を公式に支える。",
    strengths: ["Google Cloudとの親和性", "マルチエージェント構成", "評価とデプロイ導線"],
    threatLevel: "high",
    counterPosition: "ADKが作る基盤なら、こちらは審査員が触れる調達・編成・委任の体験を作る。",
    counterMove: "Agent Cardを購買意思決定のUIに変換し、Cloud Run提出まで一画面で見せる。",
    sourceUrl: "https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/adk"
  },
  {
    id: "a2a-marketplace",
    name: "Google Cloud AI Agent Marketplace",
    category: "A2A商流",
    marketProof: "Google CloudはA2Aエージェントを発見・購入できるマーケットプレイス導線を示している。",
    strengths: ["A2A標準との直結", "販売導線", "Cloud Run/Agent Engine/GKE展開"],
    threatLevel: "high",
    counterPosition: "大企業向け販売導線より前段の、チームが必要能力を見極める意思決定を狙う。",
    counterMove: "価格、MCP成熟度、審査スコア改善を組み合わせたハッカソン特化の購買体験にする。",
    sourceUrl: "https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/"
  },
  {
    id: "langgraph",
    name: "LangGraph / LangSmith",
    category: "信頼性オーケストレーション",
    marketProof: "ワークフロー、ルーティング、並列worker、評価ループ、人間参加を開発者向けに提供する。",
    strengths: ["状態グラフ", "human-in-the-loop", "デバッグ/運用品質"],
    threatLevel: "medium",
    counterPosition: "LangGraphは作る人の制御面、こちらは選ぶ人の意思決定面を持つ。",
    counterMove: "A2A委任タイムラインと改善スコアを、非実装者にも読める事業UIとして提示する。",
    sourceUrl: "https://github.com/langchain-ai/langgraph"
  },
  {
    id: "crewai",
    name: "CrewAI",
    category: "マルチエージェント開発",
    marketProof: "役割ベースのcrew、MCP対応、豊富なツールでマルチエージェント構築を支える。",
    strengths: ["role-based crews", "MCP/ツール統合", "開発者コミュニティ"],
    threatLevel: "medium",
    counterPosition: "CrewAIはcrewを作る。こちらはcrewを市場から雇うストーリーを見せる。",
    counterMove: "エージェントの価格、希少性、能力値、成果物を比較できる市場表現に集中する。",
    sourceUrl: "https://docs.crewai.com/"
  },
  {
    id: "dify",
    name: "Dify",
    category: "ワークフロー/RAGアプリビルダー",
    marketProof: "AI workflow、RAG、agent capabilities、model management、observabilityを統合する。",
    strengths: ["ノーコード/ローコード", "RAG/ワークフロー", "プロトタイプから本番"],
    threatLevel: "medium",
    counterPosition: "Difyはアプリを速く作る。こちらはDevOps改善に足りないAI能力を発見する。",
    counterMove: "審査基準、提出物、Cloud Run運用までを市場の購買結果として可視化する。",
    sourceUrl: "https://docs.dify.ai/en/use-dify/getting-started/introduction"
  },
  {
    id: "agentops",
    name: "AgentOps",
    category: "Agent Observability",
    marketProof: "AI agents/LLM appsのtesting、debugging、deploying、observabilityを扱う。",
    strengths: ["トレース", "デバッグ", "主要フレームワーク連携"],
    threatLevel: "medium",
    counterPosition: "AgentOpsは動いた後を見る。こちらは何を雇えば勝てるかを事前に判断する。",
    counterMove: "運用観測エージェントを編成に入れ、ログから次の買い足しへ戻すループを示す。",
    sourceUrl: "https://www.agentops.ai/"
  }
];

const CAPABILITY_FOR_CRITERION: Record<string, CapabilityKey[]> = {
  agentCentrality: ["autonomy", "a2a", "mcp"],
  approach: ["planning", "ux", "a2a"],
  usability: ["ux", "planning"],
  practicality: ["cloudRun", "observability", "security"],
  implementation: ["code", "testing", "cloudRun", "security"]
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function hasAgent(recommendation: Recommendation, id: string) {
  return recommendation.selected.some((agent) => agent.id === id);
}

function selectedCapabilityAverage(recommendation: Recommendation, keys: CapabilityKey[]) {
  if (recommendation.selected.length === 0) return 0;
  return average(
    recommendation.selected.map((agent) => {
      return average(keys.map((key) => agent.capabilities[key]));
    })
  );
}

function buildJudgeCriteria(recommendation: Recommendation): JudgeCriterion[] {
  const agentCentrality = selectedCapabilityAverage(recommendation, CAPABILITY_FOR_CRITERION.agentCentrality);
  const approach = selectedCapabilityAverage(recommendation, CAPABILITY_FOR_CRITERION.approach);
  const usability = selectedCapabilityAverage(recommendation, CAPABILITY_FOR_CRITERION.usability);
  const practicality = selectedCapabilityAverage(recommendation, CAPABILITY_FOR_CRITERION.practicality);
  const implementation = selectedCapabilityAverage(recommendation, CAPABILITY_FOR_CRITERION.implementation);
  const implementationProofBoost =
    (hasSubmissionUrl(SUBMISSION_PROOF.ciWorkflowUrl) ? 6 : 0) + (hasSubmissionUrl(SUBMISSION_PROOF.deployedUrl) ? 4 : 0);

  return [
    {
      id: "agentCentrality",
      label: "AIエージェント中心性",
      score: Math.round(clamp(agentCentrality + (hasAgent(recommendation, "market-broker") ? 6 : 0))),
      evidence: "Agent Card探索、能力比較、A2A委任が体験の中心にある。",
      nextAction: hasAgent(recommendation, "market-broker") ? "委任ログを提出動画で見せる" : "A2A Market Brokerを編成する"
    },
    {
      id: "approach",
      label: "課題アプローチ力",
      score: Math.round(clamp(approach + (hasAgent(recommendation, "gemini-strategist") ? 5 : 0))),
      evidence: "AIを作る課題から、AI能力を選び運用する課題へずらしている。",
      nextAction: hasAgent(recommendation, "brief-cartographer") ? "ProtoPediaの課題文へ転記する" : "Brief Cartographerでストーリーを固める"
    },
    {
      id: "usability",
      label: "ユーザビリティ",
      score: Math.round(clamp(usability + (hasAgent(recommendation, "ux-guildmaster") ? 7 : 0))),
      evidence: "価格、能力値、改善量を同じ画面で比較できる。",
      nextAction: hasAgent(recommendation, "ux-guildmaster") ? "審査員が30秒で触る順番を固定する" : "UX Guildmasterを雇い、購買ループを磨く"
    },
    {
      id: "practicality",
      label: "実用性・体験価値",
      score: Math.round(clamp(practicality + (hasAgent(recommendation, "cloud-run-sre") ? 6 : 0))),
      evidence: "Cloud Run、ヘルスチェック、Geminiフォールバックで公開デモを維持する。",
      nextAction: hasAgent(recommendation, "observability-oracle") ? "ログから次の推薦へ戻す" : "Observability Oracleで運用ループを補強する"
    },
    {
      id: "implementation",
      label: "実装力",
      score: Math.round(clamp(implementation + (hasAgent(recommendation, "test-forge") ? 7 : 0) + implementationProofBoost)),
      evidence: "React、Express、Gemini API、A2A、Cloud Run、GitHub Actions CI、テストを同一プロダクトに統合する。",
      nextAction: hasAgent(recommendation, "test-forge")
        ? "テスト結果をREADMEと動画で示す"
        : hasSubmissionUrl(SUBMISSION_PROOF.ciWorkflowUrl)
          ? "最新CI成功runをJudge ProofとFinalist Simulatorで前面に出す"
          : "Test Forgeを雇い、検証証跡を前面に出す"
    }
  ];
}

function buildSubmissionItems(recommendation: Recommendation): SubmissionItem[] {
  return [
    {
      id: "cloud-run",
      label: "デプロイ済みURL",
      done: true,
      proof: `${SUBMISSION_PROOF.deployedUrl} をCloud Runで公開済み。Dockerfile、cloudbuild.yaml、/api/healthzを実装済み。`,
      nextAction: "Cloud Run URLを提出フォームとProtoPediaに貼る"
    },
    {
      id: "gemini",
      label: "Google AI必須技術",
      done: hasAgent(recommendation, "gemini-strategist"),
      proof: "Gemini 3.5 Flash分析APIと鍵なしフォールバックを実装済み。",
      nextAction: "GEMINI_API_KEYをSecret Managerから渡して実API応答を録画する"
    },
    {
      id: "a2a",
      label: "A2A Agent Card",
      done: hasAgent(recommendation, "market-broker"),
      proof: "/.well-known/agent-card.json と /a2a JSON-RPC互換エンドポイントを公開。",
      nextAction: "Agent Card JSONを動画内で開いて見せる"
    },
    {
      id: "public-github",
      label: "公開GitHub",
      done: hasSubmissionUrl(SUBMISSION_PROOF.publicGitHubUrl),
      proof: hasSubmissionUrl(SUBMISSION_PROOF.publicGitHubUrl)
        ? `${SUBMISSION_PROOF.publicGitHubUrl} をPUBLICリポジトリとして公開済み。`
        : "URLは環境外の提出作業なので、アプリ内では未証明。",
      nextAction: hasSubmissionUrl(SUBMISSION_PROOF.publicGitHubUrl)
        ? "ProtoPediaと提出フォームに公開GitHub URLを貼る"
        : "mainブランチを公開リポジトリへpushし、READMEに提出URLを固定する"
    },
    {
      id: "github-ci",
      label: "GitHub Actions CI",
      done: hasSubmissionUrl(SUBMISSION_PROOF.ciWorkflowUrl),
      proof: hasSubmissionUrl(SUBMISSION_PROOF.ciWorkflowUrl)
        ? `${SUBMISSION_PROOF.ciWorkflowUrl} でtypecheck/test/build/architecture checkを公開実行する。`
        : "CI/CDの公開証跡は未設定。",
      nextAction: hasSubmissionUrl(SUBMISSION_PROOF.ciWorkflowUrl)
        ? "Judge Proofで最新main CI runの状態を見せる"
        : ".github/workflows/ci.ymlを追加して公開repo上で品質ゲートを走らせる"
    },
    {
      id: "protopedia",
      label: "ProtoPedia作品",
      done: false,
      proof: "作品ページ、動画、構成図、タグ findy_hackathon は提出直前作業。",
      nextAction: "競合/SWOT/審査スコア画面を構成図とストーリーに入れる"
    }
  ];
}

function buildSwot(recommendation: Recommendation): Record<SwotQuadrant, SwotItem[]> {
  const hasMarket = hasAgent(recommendation, "market-broker");
  const hasGemini = hasAgent(recommendation, "gemini-strategist");
  const hasCloud = hasAgent(recommendation, "cloud-run-sre");
  const hasSecurity = hasAgent(recommendation, "security-sentinel");
  const hasOps = hasAgent(recommendation, "observability-oracle");
  const weakest = Object.entries(recommendation.after)
    .filter(([key]) => key !== "total")
    .sort((a, b) => a[1] - b[1])[0]?.[0] ?? "delivery";

  return {
    strengths: [
      {
        title: hasMarket ? "A2Aを市場体験にできている" : "市場体験の核が明確",
        detail: hasMarket
          ? "Agent Card探索、交渉、message/send委任がプロダクトの主操作になっている。"
          : "A2A Market Brokerを入れれば、プロダクトの必然性が一気に強くなる。",
        signal: "positive"
      },
      {
        title: hasGemini ? "Geminiで勝ち筋を更新できる" : "Gemini導線を持っている",
        detail: hasGemini
          ? "選んだ編成をGemini分析へ渡し、審査向けのリスクとピッチに変換できる。"
          : "Gemini Strategistを入れると、審査ストーリーを動的に更新できる。",
        signal: "positive"
      },
      {
        title: hasCloud ? "Cloud Run提出に直結している" : "Cloud Run基盤はある",
        detail: hasCloud
          ? "ヘルスチェックとCloud Buildを含み、提出URLの運用説明までつなげられる。"
          : "Cloud Run SREを入れると、提出URLの信頼性が審査項目に直結する。",
        signal: "positive"
      }
    ],
    weaknesses: [
      {
        title: "効果測定はまだ仮説モデル",
        detail: "改善スコアは能力モデル由来なので、実ログやユーザー操作履歴で補強したい。",
        signal: "warning"
      },
      {
        title: hasSecurity ? "認証は説明できるが最小実装" : "A2A認証と永続化が薄い",
        detail: hasSecurity
          ? "公開デモでは十分だが、商用市場としてはOAuth、署名、タスク永続化が次の壁になる。"
          : "Security Sentinelを入れ、公開デモの信頼境界を審査員に説明できる状態にする。",
        signal: "warning"
      },
      {
        title: `${weakest} が相対的に弱い`,
        detail: "編成の穴を市場で買い足す体験そのものに変換できる。",
        signal: "warning"
      }
    ],
    opportunities: [
      {
        title: "A2A標準化の波に乗れる",
        detail: "A2Aは異なるベンダー/フレームワークのエージェント協調を狙うため、能力調達UIとの相性が高い。",
        signal: "opening"
      },
      {
        title: "Google Cloud AI Agent Marketplaceの前段を取れる",
        detail: "販売導線の前に、どの能力を買うべきかを判断するワークベンチとして差別化できる。",
        signal: "opening"
      },
      {
        title: hasOps ? "AgentOps文脈へ接続済み" : "運用ログを次の推薦に戻せる",
        detail: hasOps
          ? "観測エージェントが入っているため、提出後の改善ループを語れる。"
          : "Observability Oracleを入れると、DevOpsらしい継続改善の説得力が増す。",
        signal: "opening"
      }
    ],
    threats: COMPETITORS.filter((competitor) => competitor.threatLevel !== "low")
      .slice(0, 3)
      .map((competitor) => ({
        title: competitor.name,
        detail: `${competitor.category}: ${competitor.counterPosition}`,
        signal: "risk"
      }))
  };
}

function buildHypotheses(recommendation: Recommendation): WinningHypothesis[] {
  return [
    {
      id: "market-not-framework",
      claim: "フレームワーク競争ではなく、AI能力の調達競争にずらす。",
      proof: "ADK/LangGraph/CrewAIが作る領域を尊重しつつ、選ぶ・買う・委任するUXに集中する。",
      experiment: "審査員にブリーフを貼ってもらい、30秒で推奨編成が変わるところを見せる。",
      confidence: Math.round(clamp(recommendation.after.governance + (hasAgent(recommendation, "market-broker") ? 8 : 0)))
    },
    {
      id: "a2a-as-procurement",
      claim: "Agent CardをAPI仕様ではなく購買カードとして見せる。",
      proof: "能力、MCP成熟度、価格、A2AスキルIDを同じカードで比較できる。",
      experiment: "/.well-known/agent-card.json を開き、UI上の能力カードと対応づける。",
      confidence: Math.round(clamp(selectedCapabilityAverage(recommendation, ["a2a", "mcp"]) + 5))
    },
    {
      id: "judge-loop",
      claim: "審査基準を機能に変えると、ピッチが説明ではなく操作になる。",
      proof: "5項目の審査軸をスコア化し、弱点に対して次に雇うAIを提案する。",
      experiment: "Security/UX/Test系のエージェントを追加し、スコアとSWOTが変化する様子を録画する。",
      confidence: Math.round(clamp(recommendation.after.total + 10))
    }
  ];
}

function findNextBestAgent(recommendation: Recommendation, criteria: JudgeCriterion[]) {
  const missing = MARKET_AGENTS.filter((agent) => !recommendation.selected.some((selected) => selected.id === agent.id));
  if (missing.length === 0) return null;

  const weakestCriterion = [...criteria].sort((a, b) => a.score - b.score)[0]?.id;
  const preferredByCriterion: Record<string, string[]> = {
    agentCentrality: ["market-broker", "security-sentinel"],
    approach: ["brief-cartographer", "gemini-strategist"],
    usability: ["ux-guildmaster", "brief-cartographer"],
    practicality: ["observability-oracle", "cloud-run-sre", "security-sentinel"],
    implementation: ["test-forge", "security-sentinel", "cloud-run-sre"]
  };
  const preferred = preferredByCriterion[weakestCriterion ?? "implementation"] ?? ["test-forge"];
  const agent = preferred.map((id) => missing.find((candidate) => candidate.id === id)).find(Boolean) ?? missing[0];

  return {
    agent,
    reason: `${criteria.find((criterion) => criterion.id === weakestCriterion)?.label ?? "実装力"}を補強する最短の買い足し。`,
    expectedLift: agent.outcome
  };
}

export function buildWinningStrategy(recommendation: Recommendation): WinningStrategy {
  const judgeCriteria = buildJudgeCriteria(recommendation);
  const judgeScore = Math.round(average(judgeCriteria.map((criterion) => criterion.score)));
  const submissionItems = buildSubmissionItems(recommendation);
  const mvpScore = Math.round((submissionItems.filter((item) => item.done).length / submissionItems.length) * 100);
  const moatScore = Math.round(
    clamp(
      average([
        selectedCapabilityAverage(recommendation, ["a2a", "mcp"]),
        selectedCapabilityAverage(recommendation, ["cloudRun", "observability"]),
        recommendation.after.total
      ]) + (hasAgent(recommendation, "market-broker") ? 6 : 0)
    )
  );
  const riskLevel: ThreatLevel = judgeScore >= 82 && mvpScore >= 70 ? "low" : judgeScore >= 68 ? "medium" : "high";

  return {
    strategicThesis:
      "勝ち筋は、AIエージェントを作るデモではなく、必要能力を発見し、雇い、A2Aで委任し、Cloud Run運用まで閉じる調達体験にすること。",
    moatScore,
    riskLevel,
    competitors: COMPETITORS,
    swot: buildSwot(recommendation),
    judgeCriteria,
    judgeScore,
    mvpScore,
    submissionItems,
    hypotheses: buildHypotheses(recommendation),
    nextBestAgent: findNextBestAgent(recommendation, judgeCriteria)
  };
}
