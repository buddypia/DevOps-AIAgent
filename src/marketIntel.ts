import { SUBMISSION_PROOF } from "./submission.js";
import type { Competitor, ThreatLevel, WinningStrategy } from "./strategy.js";
import type { Recommendation } from "./types.js";

export type IntelStatus = "lead" | "parity" | "watch";
export type IntelPriority = "now" | "next" | "later";

export type MarketIntelSource = {
  id: string;
  label: string;
  category: string;
  url: string;
  sourceType: "official-doc" | "official-site" | "official-blog" | "repository";
  currentSignal: string;
  strategicRead: string;
};

export type MarketIntelComparison = {
  id: string;
  competitor: string;
  category: string;
  threatLevel: ThreatLevel;
  theyWinAt: string;
  exposedGap: string;
  ourCounter: string;
  demoProof: string;
  sourceIds: string[];
};

export type MarketIntelJudgeAnswer = {
  criterionId: string;
  label: string;
  answer: string;
  evidence: string;
  score: number;
};

export type MarketIntelMove = {
  id: string;
  priority: IntelPriority;
  owner: string;
  action: string;
  proof: string;
};

export type MarketIntelReport = {
  id: string;
  marketScore: number;
  status: IntelStatus;
  thesis: string;
  headline: string;
  sources: MarketIntelSource[];
  comparisons: MarketIntelComparison[];
  judgeAnswers: MarketIntelJudgeAnswer[];
  moves: MarketIntelMove[];
  sourceChecklist: Array<{ id: string; label: string; url: string }>;
  a2aPayload: Record<string, unknown>;
};

const SOURCES: MarketIntelSource[] = [
  {
    id: "gemini-enterprise",
    label: "Gemini Enterprise Agent Platform",
    category: "enterprise agent platform",
    url: "https://cloud.google.com/products/gemini-enterprise-agent-platform",
    sourceType: "official-site",
    currentSignal: "Google Cloud positions the platform as a place to build, scale, govern, and optimize enterprise agents.",
    strategicRead: "Competing on agent infrastructure alone is a losing pitch; the demo needs a sharper decision workflow."
  },
  {
    id: "google-adk",
    label: "Agent Development Kit",
    category: "code-first agent framework",
    url: "https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/adk",
    sourceType: "official-doc",
    currentSignal: "ADK is an open-source framework for building, debugging, and deploying reliable agents at enterprise scale.",
    strategicRead: "ADK proves agent building is well served; our wedge is deciding which agent capability to buy and why."
  },
  {
    id: "a2a-protocol",
    label: "Agent2Agent Protocol",
    category: "interoperability protocol",
    url: "https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/",
    sourceType: "official-blog",
    currentSignal: "A2A is about agents communicating, exchanging information, and coordinating actions across platforms.",
    strategicRead: "The product should make interoperability visible as a hiring and delegation loop, not just a JSON endpoint."
  },
  {
    id: "langgraph",
    label: "LangGraph",
    category: "stateful orchestration",
    url: "https://github.com/langchain-ai/langgraph",
    sourceType: "repository",
    currentSignal: "LangGraph is positioned as a low-level framework for stateful, long-running agents.",
    strategicRead: "LangGraph owns the builder control plane; this project can own the buyer decision plane."
  },
  {
    id: "crewai",
    label: "CrewAI",
    category: "multi-agent workflow platform",
    url: "https://docs.crewai.com/",
    sourceType: "official-doc",
    currentSignal: "CrewAI emphasizes designing agents, orchestrating crews, guardrails, memory, knowledge, and observability.",
    strategicRead: "CrewAI makes crews; our demo must show how a team chooses, contracts, and verifies a crew."
  },
  {
    id: "dify",
    label: "Dify",
    category: "agentic workflow builder",
    url: "https://docs.dify.ai/en/use-dify/getting-started/introduction",
    sourceType: "official-doc",
    currentSignal: "Dify is an open-source platform for visual workflows, tools, data sources, and AI app deployment.",
    strategicRead: "Dify accelerates app creation; this project turns hackathon judging and DevOps proof into the workflow."
  },
  {
    id: "agentops",
    label: "AgentOps",
    category: "agent observability",
    url: "https://www.agentops.ai/",
    sourceType: "official-site",
    currentSignal: "AgentOps focuses on tracing, debugging, deploying, and observing reliable agents.",
    strategicRead: "Observability is a lane inside our market, not the whole product; the next hire loop is the differentiator."
  },
  {
    id: "cloud-run",
    label: "Cloud Run",
    category: "serverless runtime",
    url: "https://cloud.google.com/run",
    sourceType: "official-site",
    currentSignal: "Cloud Run is a fully managed platform for scalable containerized apps.",
    strategicRead: "Deployment evidence is table stakes; the winning story is how Cloud Run operations feed back into agent hiring."
  }
];

const SOURCE_BY_ID = new Map(SOURCES.map((source) => [source.id, source]));

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sourceIdsFor(competitor: Competitor) {
  if (competitor.id === "google-adk") return ["gemini-enterprise", "google-adk"];
  if (competitor.id === "a2a-marketplace") return ["a2a-protocol", "gemini-enterprise"];
  if (competitor.id === "langgraph") return ["langgraph"];
  if (competitor.id === "crewai") return ["crewai"];
  if (competitor.id === "dify") return ["dify"];
  if (competitor.id === "agentops") return ["agentops"];
  return [];
}

function theyWinAt(competitor: Competitor) {
  if (competitor.id === "google-adk") return "enterprise-grade agent build, debug, and deploy workflows";
  if (competitor.id === "a2a-marketplace") return "standardized interop and enterprise discovery";
  if (competitor.id === "langgraph") return "stateful orchestration and developer control";
  if (competitor.id === "crewai") return "crew design, guardrails, memory, and workflow automation";
  if (competitor.id === "dify") return "visual agentic workflow and RAG app delivery";
  if (competitor.id === "agentops") return "post-run traces, debugging, and observability";
  return competitor.strengths.join(", ");
}

function exposedGap(competitor: Competitor) {
  if (competitor.id === "google-adk") return "It does not by itself answer which capability a hackathon team should hire first.";
  if (competitor.id === "a2a-marketplace") return "Enterprise marketplace discovery still needs a pre-purchase decision and proof workflow.";
  if (competitor.id === "langgraph") return "Graph control is powerful, but it is not a buyer-facing procurement and judging surface.";
  if (competitor.id === "crewai") return "Crew creation does not automatically produce acceptance criteria, submission proof, or DevOps runbooks.";
  if (competitor.id === "dify") return "App building speed is not the same as proving AI-agent centrality and Cloud Run operations.";
  if (competitor.id === "agentops") return "Observability starts after execution; the hackathon story needs pre-run capability selection too.";
  return "The product category does not cover capability procurement, judging, and submission proof in one loop.";
}

function statusFromScore(score: number): IntelStatus {
  if (score >= 86) return "lead";
  if (score >= 74) return "parity";
  return "watch";
}

function buildComparison(competitor: Competitor): MarketIntelComparison {
  const sourceIds = sourceIdsFor(competitor);
  return {
    id: competitor.id,
    competitor: competitor.name,
    category: competitor.category,
    threatLevel: competitor.threatLevel,
    theyWinAt: theyWinAt(competitor),
    exposedGap: exposedGap(competitor),
    ourCounter: competitor.counterPosition,
    demoProof: competitor.counterMove,
    sourceIds
  };
}

function buildJudgeAnswers(strategy: WinningStrategy): MarketIntelJudgeAnswer[] {
  return strategy.judgeCriteria.map((criterion) => ({
    criterionId: criterion.id,
    label: criterion.label,
    score: criterion.score,
    answer:
      criterion.id === "approach"
        ? "競合が強い「作る基盤」からずらし、AI能力を選び、雇い、検証し、提出する市場体験に絞っています。"
        : criterion.id === "agentCentrality"
          ? "Agent Card、A2A委任、エージェント契約、Ops判断が主操作なので、AIエージェントが価値の中心です。"
          : criterion.nextAction,
    evidence: criterion.evidence
  }));
}

function buildMoves(strategy: WinningStrategy, recommendation: Recommendation): MarketIntelMove[] {
  const sourceMove: MarketIntelMove = {
    id: "cite-sources",
    priority: "now",
    owner: "Gemini Strategist",
    action: "ProtoPedia本文と30秒動画で、公式ソース付き競合比較を1画面見せる",
    proof: `${SOURCES.length} source-backed market signals / ${strategy.competitors.length} competitors`
  };
  const nextHire: MarketIntelMove | null = strategy.nextBestAgent
    ? {
        id: "hire-gap-agent",
        priority: "next",
        owner: "A2A Market Broker",
        action: `${strategy.nextBestAgent.agent.name}を追加し、最弱審査項目を補強する`,
        proof: `${strategy.nextBestAgent.reason} ${strategy.nextBestAgent.expectedLift}`
      }
    : null;
  const recording: MarketIntelMove = {
    id: "record-market-intel",
    priority: "now",
    owner: "Submission owner",
    action: "Market Intel Board -> Win Autopilot -> Submission Dossierの順で録画する",
    proof: "競合分析、勝ち筋、提出証拠を説明ではなく操作として見せられる"
  };
  const cloudRun: MarketIntelMove = {
    id: "connect-runtime-proof",
    priority: recommendation.selected.some((agent) => agent.id === "cloud-run-sre") ? "later" : "next",
    owner: "Cloud Run SRE",
    action: "Cloud Run公開URL、healthz、CI、Ops Drillを競合比較の実装証拠へ接続する",
    proof: SUBMISSION_PROOF.deployedUrl
  };
  return [sourceMove, recording, ...(nextHire ? [nextHire] : []), cloudRun];
}

export function buildMarketIntelReport(input: {
  baseUrl: string;
  recommendation: Recommendation;
  strategy: WinningStrategy;
}): MarketIntelReport {
  const { baseUrl, recommendation, strategy } = input;
  const comparisons = strategy.competitors.map(buildComparison);
  const sourceCoverage = new Set(comparisons.flatMap((comparison) => comparison.sourceIds)).size;
  const marketScore = Math.round(
    clamp(
      average([
        strategy.judgeScore,
        strategy.moatScore,
        strategy.mvpScore,
        recommendation.after.governance,
        (sourceCoverage / SOURCES.length) * 100
      ])
    )
  );
  const status = statusFromScore(marketScore);
  const sourceChecklist = SOURCES.map((source) => ({
    id: source.id,
    label: source.label,
    url: source.url
  }));

  return {
    id: `market-intel-${marketScore}-${recommendation.selected.map((agent) => agent.id).join("-") || "none"}`,
    marketScore,
    status,
    thesis:
      "競合の強みはエージェントを作る、動かす、観測すること。こちらの勝ち筋は、必要なAI能力を調達し、A2Aで委任し、Cloud Run運用と提出証拠まで閉じる意思決定体験にある。",
    headline:
      status === "lead"
        ? "Source-backed moat is strong enough to lead with market procurement."
        : status === "parity"
          ? "Competitive story is credible, but the demo must show the procurement loop first."
          : "Market story needs stronger proof before the product can claim MVP readiness.",
    sources: SOURCES,
    comparisons,
    judgeAnswers: buildJudgeAnswers(strategy),
    moves: buildMoves(strategy, recommendation),
    sourceChecklist,
    a2aPayload: {
      skill: "market.intel",
      marketScore,
      status,
      sources: sourceChecklist.map((source) => source.id),
      competitors: comparisons.map((comparison) => ({
        id: comparison.id,
        threatLevel: comparison.threatLevel,
        sourceIds: comparison.sourceIds,
        counter: comparison.ourCounter
      })),
      nextMoves: buildMoves(strategy, recommendation).map((move) => ({
        id: move.id,
        priority: move.priority,
        action: move.action
      })),
      endpoints: {
        app: baseUrl,
        strategy: `${baseUrl.replace(/\/$/, "")}/api/strategy`,
        marketIntel: `${baseUrl.replace(/\/$/, "")}/api/market-intel`
      }
    }
  };
}

export function sourceForMarketIntel(id: string) {
  return SOURCE_BY_ID.get(id);
}
