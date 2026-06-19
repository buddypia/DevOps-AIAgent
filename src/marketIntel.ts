import { SUBMISSION_PROOF } from "./submission.js";
import type { Competitor, ThreatLevel, WinningStrategy } from "./strategy.js";
import type { Recommendation } from "./types.js";

export type IntelStatus = "lead" | "parity" | "watch";
export type IntelPriority = "now" | "next" | "later";
export type SourceFreshness = "fresh" | "watch";
export type SourceProofStatus = "passed" | "watch" | "failed" | "unchecked";
export type SourceProofReadiness = "source-lock-live" | "source-lock-watch" | "source-lock-blocked" | "source-lock-declared";

export type MarketIntelSource = {
  id: string;
  label: string;
  category: string;
  url: string;
  sourceType: "official-doc" | "official-site" | "official-blog" | "repository";
  reviewedAt: string;
  freshness: SourceFreshness;
  currentSignal: string;
  strategicRead: string;
  judgeUse: string;
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

export type MarketSourceLedgerItem = {
  id: string;
  label: string;
  url: string;
  sourceType: MarketIntelSource["sourceType"];
  reviewedAt: string;
  freshness: SourceFreshness;
  currentSignal: string;
  strategicRead: string;
  judgeUse: string;
  competitorIds: string[];
  proofCue: string;
};

export type MarketSourceFreshnessSummary = {
  reviewedAt: string;
  freshCount: number;
  watchCount: number;
  officialOrPrimaryCount: number;
  competitorCoveragePercent: number;
};

export type MarketSourceProofProbe = {
  id: string;
  label: string;
  url: string;
  sourceType: MarketIntelSource["sourceType"];
  status: SourceProofStatus;
  statusCode?: number;
  latencyMs?: number;
  checkedAt: string;
  competitorIds: string[];
  evidence: string;
  judgeUse: string;
};

export type MarketSourceProofLock = {
  id: string;
  score: number;
  readiness: SourceProofReadiness;
  checkedAt: string;
  passedCount: number;
  watchCount: number;
  failedCount: number;
  uncheckedCount: number;
  liveProbeCount: number;
  competitorCoveragePercent: number;
  headline: string;
  hardTruth: string;
  probes: MarketSourceProofProbe[];
  runbook: string[];
  nextActions: string[];
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
  sourceFreshness: MarketSourceFreshnessSummary;
  sourceProofLock: MarketSourceProofLock;
  sourceLedger: MarketSourceLedgerItem[];
  sourceChecklist: Array<{ id: string; label: string; url: string }>;
  a2aPayload: Record<string, unknown>;
};

export type SourceFetch = (url: string, init?: RequestInit) => Promise<Response>;

const SOURCE_REVIEWED_AT = "2026-06-18";

const SOURCES: MarketIntelSource[] = [
  {
    id: "gemini-agent-platform-launch",
    label: "Gemini Enterprise Agent Platform launch",
    category: "enterprise agent platform",
    url: "https://cloud.google.com/blog/products/ai-machine-learning/introducing-gemini-enterprise-agent-platform",
    sourceType: "official-blog",
    reviewedAt: SOURCE_REVIEWED_AT,
    freshness: "fresh",
    currentSignal: "Google Cloud launched Gemini Enterprise Agent Platform as the evolution of Vertex AI for agent integration, DevOps, orchestration, and security.",
    strategicRead: "Google's own story has moved from isolated agents to governed production platforms, so our pitch must show where teams decide which capability to procure.",
    judgeUse: "Use this when asked why a Google Cloud AI-centered product is timely in 2026."
  },
  {
    id: "gemini-enterprise",
    label: "Gemini Enterprise Agent Platform",
    category: "enterprise agent platform",
    url: "https://cloud.google.com/products/gemini-enterprise-agent-platform",
    sourceType: "official-site",
    reviewedAt: SOURCE_REVIEWED_AT,
    freshness: "fresh",
    currentSignal: "Google Cloud positions the platform as a place to build, scale, govern, and optimize enterprise agents.",
    strategicRead: "Competing on agent infrastructure alone is a losing pitch; the demo needs a sharper decision workflow.",
    judgeUse: "Use this to acknowledge that official Google infrastructure is strong before shifting to the procurement workflow."
  },
  {
    id: "google-adk",
    label: "Agent Development Kit",
    category: "code-first agent framework",
    url: "https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/adk",
    sourceType: "official-doc",
    reviewedAt: SOURCE_REVIEWED_AT,
    freshness: "fresh",
    currentSignal: "ADK is an open-source framework for building, debugging, and deploying reliable agents at enterprise scale.",
    strategicRead: "ADK proves agent building is well served; our wedge is deciding which agent capability to buy and why.",
    judgeUse: "Use this when a judge asks whether ADK alone would solve the problem."
  },
  {
    id: "a2a-protocol",
    label: "Agent2Agent Protocol",
    category: "interoperability protocol",
    url: "https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/",
    sourceType: "official-blog",
    reviewedAt: SOURCE_REVIEWED_AT,
    freshness: "fresh",
    currentSignal: "A2A is about agents communicating, exchanging information, and coordinating actions across platforms.",
    strategicRead: "The product should make interoperability visible as a hiring and delegation loop, not just a JSON endpoint.",
    judgeUse: "Use this to explain why Agent Card discovery and message/send delegation are core product actions."
  },
  {
    id: "a2a-upgrade",
    label: "A2A toolkit and marketplace upgrade",
    category: "A2A commercialization",
    url: "https://cloud.google.com/blog/products/ai-machine-learning/agent2agent-protocol-is-getting-an-upgrade",
    sourceType: "official-blog",
    reviewedAt: SOURCE_REVIEWED_AT,
    freshness: "fresh",
    currentSignal: "Google Cloud described build, deploy, evaluate, and sell paths for A2A agents, including Cloud Run deployment and AI Agent Marketplace discovery.",
    strategicRead: "The commercial A2A channel is real; our demo should own the pre-market decision, evaluation, and proof loop.",
    judgeUse: "Use this when asked why AI Agent Marketplace is a real competitor and why Cloud Run matters."
  },
  {
    id: "google-marketplace-ai-agents",
    label: "Cloud Marketplace A2A agent requirements",
    category: "A2A marketplace listing",
    url: "https://docs.cloud.google.com/marketplace/docs/partners/ai-agents",
    sourceType: "official-doc",
    reviewedAt: SOURCE_REVIEWED_AT,
    freshness: "fresh",
    currentSignal: "Cloud Marketplace A2A agents need an Agent Card, product listing, pricing, integration, and review flow.",
    strategicRead: "Marketplace listing requirements validate the need for capability metadata, pricing, and verification before a buyer chooses an agent.",
    judgeUse: "Use this to connect our Agent Card, pricing, and acceptance criteria to a real marketplace path."
  },
  {
    id: "langgraph",
    label: "LangGraph",
    category: "stateful orchestration",
    url: "https://github.com/langchain-ai/langgraph",
    sourceType: "repository",
    reviewedAt: SOURCE_REVIEWED_AT,
    freshness: "fresh",
    currentSignal: "LangGraph is positioned as a low-level framework for stateful, long-running agents.",
    strategicRead: "LangGraph owns the builder control plane; this project can own the buyer decision plane.",
    judgeUse: "Use this when a judge asks why a stateful agent framework is not enough."
  },
  {
    id: "crewai",
    label: "CrewAI",
    category: "multi-agent workflow platform",
    url: "https://docs.crewai.com/",
    sourceType: "official-doc",
    reviewedAt: SOURCE_REVIEWED_AT,
    freshness: "fresh",
    currentSignal: "CrewAI emphasizes designing agents, orchestrating crews, guardrails, memory, knowledge, and observability.",
    strategicRead: "CrewAI makes crews; our demo must show how a team chooses, contracts, and verifies a crew.",
    judgeUse: "Use this when a judge asks whether crew orchestration already covers the value."
  },
  {
    id: "dify",
    label: "Dify",
    category: "agentic workflow builder",
    url: "https://docs.dify.ai/en/use-dify/getting-started/introduction",
    sourceType: "official-doc",
    reviewedAt: SOURCE_REVIEWED_AT,
    freshness: "watch",
    currentSignal: "Dify is an open-source platform for visual workflows, tools, data sources, and AI app deployment.",
    strategicRead: "Dify accelerates app creation; this project turns hackathon judging and DevOps proof into the workflow.",
    judgeUse: "Use this when comparing visual workflow building against proof-driven DevOps submission."
  },
  {
    id: "microsoft-copilot-studio",
    label: "Microsoft Copilot Studio",
    category: "enterprise low-code agent studio",
    url: "https://learn.microsoft.com/en-us/microsoft-copilot-studio/fundamentals-what-is-copilot-studio",
    sourceType: "official-doc",
    reviewedAt: SOURCE_REVIEWED_AT,
    freshness: "fresh",
    currentSignal: "Copilot Studio is a graphical, low-code tool for building agents and agent flows with connectors and enterprise data.",
    strategicRead: "Enterprise low-code agent builders are strong; our wedge must be cross-vendor capability buying, A2A delegation, and submission proof.",
    judgeUse: "Use this when a judge asks why Microsoft-style low-code agent building is not already the product."
  },
  {
    id: "microsoft-copilot-studio-product",
    label: "Microsoft Copilot Studio product page",
    category: "enterprise low-code agent studio",
    url: "https://www.microsoft.com/en-us/microsoft-365-copilot/microsoft-copilot-studio",
    sourceType: "official-site",
    reviewedAt: SOURCE_REVIEWED_AT,
    freshness: "fresh",
    currentSignal: "Microsoft positions Copilot Studio as an end-to-end conversational AI platform for designing, testing, and publishing agents.",
    strategicRead: "The low-code publishing story is credible; our demo must show why hackathon teams still need procurement, proof, and release evidence.",
    judgeUse: "Use this as the second official citation before claiming we have answered Copilot Studio."
  },
  {
    id: "openai-agents-sdk",
    label: "OpenAI Agents SDK",
    category: "code-first agent SDK",
    url: "https://developers.openai.com/api/docs/guides/agents",
    sourceType: "official-doc",
    reviewedAt: SOURCE_REVIEWED_AT,
    freshness: "fresh",
    currentSignal: "OpenAI describes agents as applications that plan, call tools, collaborate across specialists, and keep state for multi-step work.",
    strategicRead: "SDK orchestration is a credible build path; this project should show the buyer-facing proof loop around which capability to delegate.",
    judgeUse: "Use this when a judge asks whether a code-first agent SDK would replace the marketplace workflow."
  },
  {
    id: "agentops",
    label: "AgentOps",
    category: "agent observability",
    url: "https://www.agentops.ai/",
    sourceType: "official-site",
    reviewedAt: SOURCE_REVIEWED_AT,
    freshness: "fresh",
    currentSignal: "AgentOps focuses on tracing, debugging, deploying, and observing reliable agents.",
    strategicRead: "Observability is a lane inside our market, not the whole product; the next hire loop is the differentiator.",
    judgeUse: "Use this when asked why operations evidence is part of the workflow but not the whole product."
  },
  {
    id: "cloud-run",
    label: "Cloud Run",
    category: "serverless runtime",
    url: "https://cloud.google.com/run",
    sourceType: "official-site",
    reviewedAt: SOURCE_REVIEWED_AT,
    freshness: "fresh",
    currentSignal: "Cloud Run is a fully managed platform for scalable containerized apps.",
    strategicRead: "Deployment evidence is table stakes; the winning story is how Cloud Run operations feed back into agent hiring.",
    judgeUse: "Use this to connect the required Cloud Run runtime to release drift, health, and operations proof."
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
  if (competitor.id === "google-adk") return ["gemini-agent-platform-launch", "gemini-enterprise", "google-adk"];
  if (competitor.id === "a2a-marketplace") return ["a2a-protocol", "a2a-upgrade", "google-marketplace-ai-agents", "gemini-enterprise"];
  if (competitor.id === "langgraph") return ["langgraph"];
  if (competitor.id === "crewai") return ["crewai"];
  if (competitor.id === "dify") return ["dify"];
  if (competitor.id === "microsoft-copilot-studio") return ["microsoft-copilot-studio", "microsoft-copilot-studio-product"];
  if (competitor.id === "openai-agents-sdk") return ["openai-agents-sdk"];
  if (competitor.id === "agentops") return ["agentops"];
  return [];
}

function theyWinAt(competitor: Competitor) {
  if (competitor.id === "google-adk") return "enterprise-grade agent build, debug, and deploy workflows";
  if (competitor.id === "a2a-marketplace") return "standardized interop and enterprise discovery";
  if (competitor.id === "langgraph") return "stateful orchestration and developer control";
  if (competitor.id === "crewai") return "crew design, guardrails, memory, and workflow automation";
  if (competitor.id === "dify") return "visual agentic workflow and RAG app delivery";
  if (competitor.id === "microsoft-copilot-studio") return "enterprise low-code agent creation, connectors, and Microsoft 365 distribution";
  if (competitor.id === "openai-agents-sdk") return "code-first agent orchestration, tools, handoffs, and state";
  if (competitor.id === "agentops") return "post-run traces, debugging, and observability";
  return competitor.strengths.join(", ");
}

function exposedGap(competitor: Competitor) {
  if (competitor.id === "google-adk") return "It does not by itself answer which capability a hackathon team should hire first.";
  if (competitor.id === "a2a-marketplace") return "Enterprise marketplace discovery still needs a pre-purchase decision and proof workflow.";
  if (competitor.id === "langgraph") return "Graph control is powerful, but it is not a buyer-facing procurement and judging surface.";
  if (competitor.id === "crewai") return "Crew creation does not automatically produce acceptance criteria, submission proof, or DevOps runbooks.";
  if (competitor.id === "dify") return "App building speed is not the same as proving AI-agent centrality and Cloud Run operations.";
  if (competitor.id === "microsoft-copilot-studio") return "Low-code agent building does not answer cross-vendor capability selection, hackathon judging, or public release proof.";
  if (competitor.id === "openai-agents-sdk") return "An SDK can orchestrate agents, but it does not provide buyer-facing procurement, A2A marketplace evidence, or submission closeout.";
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

function competitorIdsForSource(sourceId: string, comparisons: MarketIntelComparison[]) {
  return comparisons.filter((comparison) => comparison.sourceIds.includes(sourceId)).map((comparison) => comparison.id);
}

function buildSourceLedger(comparisons: MarketIntelComparison[]): MarketSourceLedgerItem[] {
  return SOURCES.map((source) => {
    const competitorIds = competitorIdsForSource(source.id, comparisons);
    return {
      id: source.id,
      label: source.label,
      url: source.url,
      sourceType: source.sourceType,
      reviewedAt: source.reviewedAt,
      freshness: source.freshness,
      currentSignal: source.currentSignal,
      strategicRead: source.strategicRead,
      judgeUse: source.judgeUse,
      competitorIds,
      proofCue:
        competitorIds.length > 0
          ? `Open ${competitorIds.join(" / ")} battlecard before claiming differentiation.`
          : "Use as runtime or submission context, not as a direct competitor claim."
    };
  });
}

function buildSourceFreshnessSummary(sourceLedger: MarketSourceLedgerItem[], comparisons: MarketIntelComparison[]): MarketSourceFreshnessSummary {
  const coveredCompetitors = new Set(sourceLedger.flatMap((source) => source.competitorIds));
  return {
    reviewedAt: SOURCE_REVIEWED_AT,
    freshCount: sourceLedger.filter((source) => source.freshness === "fresh").length,
    watchCount: sourceLedger.filter((source) => source.freshness === "watch").length,
    officialOrPrimaryCount: sourceLedger.length,
    competitorCoveragePercent: Math.round((coveredCompetitors.size / Math.max(1, comparisons.length)) * 100)
  };
}

function sourceStatusScore(status: SourceProofStatus) {
  if (status === "passed") return 100;
  if (status === "watch") return 82;
  if (status === "unchecked") return 62;
  return 24;
}

function sourceProofReadiness(input: {
  score: number;
  failedCount: number;
  watchCount: number;
  uncheckedCount: number;
  liveProbeCount: number;
}): SourceProofReadiness {
  if (input.failedCount > 0) return "source-lock-blocked";
  if (input.liveProbeCount === 0 || input.uncheckedCount > 0) return "source-lock-declared";
  if (input.watchCount > 0) return "source-lock-watch";
  if (input.score >= 92) return "source-lock-live";
  return "source-lock-watch";
}

function sourceProofHeadline(readiness: SourceProofReadiness) {
  if (readiness === "source-lock-live") return "Official source links are live enough to defend the market thesis.";
  if (readiness === "source-lock-watch") return "Official source links are mostly live, but at least one source needs a backup citation.";
  if (readiness === "source-lock-blocked") return "At least one official source is not reachable; do not lead with unsupported competitor claims.";
  return "Source citations are declared; run the live lock before final submission.";
}

function sourceProofHardTruth(readiness: SourceProofReadiness, failedCount: number, uncheckedCount: number) {
  if (readiness === "source-lock-live") return "競合分析は公式ソース到達性つきで再実行できる。";
  if (readiness === "source-lock-watch") return "一部ソースはwatch扱い。録画前に代替URLかスクリーンショット証拠を用意する。";
  if (readiness === "source-lock-blocked") return `${failedCount}件の公式ソースが到達不可。審査で競合/SWOTの根拠として使う前に差し替える。`;
  return `${uncheckedCount}件の公式ソースが未プローブ。提出直前に/api/market-intelでlive lockを再実行する。`;
}

function buildUncheckedSourceProbe(source: MarketSourceLedgerItem, checkedAt: string): MarketSourceProofProbe {
  return {
    id: source.id,
    label: source.label,
    url: source.url,
    sourceType: source.sourceType,
    status: "unchecked",
    checkedAt,
    competitorIds: source.competitorIds,
    evidence: "Live probe has not run in this artifact; source is declared from the curated ledger.",
    judgeUse: source.judgeUse
  };
}

export function buildSourceProofLock(input: {
  sourceLedger: MarketSourceLedgerItem[];
  probes?: MarketSourceProofProbe[];
  checkedAt?: string;
}): MarketSourceProofLock {
  const checkedAt = input.checkedAt ?? SOURCE_REVIEWED_AT;
  const probeById = new Map((input.probes ?? []).map((probe) => [probe.id, probe]));
  const probes = input.sourceLedger.map((source) => probeById.get(source.id) ?? buildUncheckedSourceProbe(source, checkedAt));
  const passedCount = probes.filter((probe) => probe.status === "passed").length;
  const watchCount = probes.filter((probe) => probe.status === "watch").length;
  const failedCount = probes.filter((probe) => probe.status === "failed").length;
  const uncheckedCount = probes.filter((probe) => probe.status === "unchecked").length;
  const liveProbeCount = probes.length - uncheckedCount;
  const coveredCompetitors = new Set(
    probes.filter((probe) => probe.status === "passed" || probe.status === "watch").flatMap((probe) => probe.competitorIds)
  );
  const competitorIds = new Set(input.sourceLedger.flatMap((source) => source.competitorIds));
  const competitorCoveragePercent = Math.round((coveredCompetitors.size / Math.max(1, competitorIds.size)) * 100);
  const statusScore = average(probes.map((probe) => sourceStatusScore(probe.status)));
  const score = Math.round(clamp(average([statusScore, competitorCoveragePercent, liveProbeCount === probes.length ? 100 : 70])));
  const readiness = sourceProofReadiness({ score, failedCount, watchCount, uncheckedCount, liveProbeCount });
  const normalizedRunbookUrls = input.sourceLedger.slice(0, 4).map((source) => `curl -I -L ${source.url}`);

  return {
    id: `source-proof-lock-${readiness}-${score}`,
    score,
    readiness,
    checkedAt,
    passedCount,
    watchCount,
    failedCount,
    uncheckedCount,
    liveProbeCount,
    competitorCoveragePercent,
    headline: sourceProofHeadline(readiness),
    hardTruth: sourceProofHardTruth(readiness, failedCount, uncheckedCount),
    probes,
    runbook: [
      "POST /api/market-intel to refresh the live Source Freshness Lock before recording.",
      ...normalizedRunbookUrls
    ],
    nextActions:
      readiness === "source-lock-blocked"
        ? probes
            .filter((probe) => probe.status === "failed")
            .slice(0, 3)
            .map((probe) => `Replace or screenshot ${probe.label} before using it in the battlecard.`)
        : readiness === "source-lock-watch"
          ? probes
              .filter((probe) => probe.status === "watch")
              .slice(0, 3)
              .map((probe) => `Keep a backup citation or screenshot for ${probe.label}.`)
        : readiness === "source-lock-declared"
          ? ["Run /api/market-intel on the public Cloud Run URL and capture the live source lock."]
          : ["Use Market Intel before Competitive Battlecard so citations appear before claims."]
  };
}

function classifyProbeStatus(statusCode: number): SourceProofStatus {
  if (statusCode >= 200 && statusCode < 400) return "passed";
  if (statusCode === 401 || statusCode === 403 || statusCode === 429) return "watch";
  return "failed";
}

export async function probeMarketIntelSources(input: {
  sourceLedger: MarketSourceLedgerItem[];
  fetcher?: SourceFetch;
  checkedAt?: string;
  timeoutMs?: number;
}): Promise<MarketSourceProofLock> {
  const fetcher = input.fetcher ?? fetch;
  const checkedAt = input.checkedAt ?? new Date().toISOString();
  const timeoutMs = input.timeoutMs ?? 4500;
  const probes = await Promise.all(
    input.sourceLedger.map(async (source): Promise<MarketSourceProofProbe> => {
      const startedAt = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetcher(source.url, {
          method: "GET",
          redirect: "follow",
          signal: controller.signal,
          headers: {
            accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8"
          }
        });
        const latencyMs = Date.now() - startedAt;
        const status = classifyProbeStatus(response.status);
        return {
          id: source.id,
          label: source.label,
          url: source.url,
          sourceType: source.sourceType,
          status,
          statusCode: response.status,
          latencyMs,
          checkedAt,
          competitorIds: source.competitorIds,
          evidence:
            status === "passed"
              ? `HTTP ${response.status} in ${latencyMs}ms; official source is reachable.`
              : `HTTP ${response.status} in ${latencyMs}ms; keep a backup citation or screenshot.`,
          judgeUse: source.judgeUse
        };
      } catch (error) {
        const isAbort = error instanceof Error && error.name === "AbortError";
        return {
          id: source.id,
          label: source.label,
          url: source.url,
          sourceType: source.sourceType,
          status: isAbort ? "watch" : "failed",
          latencyMs: Date.now() - startedAt,
          checkedAt,
          competitorIds: source.competitorIds,
          evidence: isAbort
            ? `Probe timed out after ${timeoutMs}ms; keep a backup citation or screenshot.`
            : `Probe failed: ${error instanceof Error ? error.message : "unknown error"}.`,
          judgeUse: source.judgeUse
        };
      } finally {
        clearTimeout(timeout);
      }
    })
  );

  return buildSourceProofLock({ sourceLedger: input.sourceLedger, probes, checkedAt });
}

export function attachSourceProofLock(report: MarketIntelReport, sourceProofLock: MarketSourceProofLock): MarketIntelReport {
  return {
    ...report,
    sourceProofLock,
    a2aPayload: {
      ...report.a2aPayload,
      sourceProofLock: {
        score: sourceProofLock.score,
        readiness: sourceProofLock.readiness,
        checkedAt: sourceProofLock.checkedAt,
        passedCount: sourceProofLock.passedCount,
        watchCount: sourceProofLock.watchCount,
        failedCount: sourceProofLock.failedCount,
        liveProbeCount: sourceProofLock.liveProbeCount,
        competitorCoveragePercent: sourceProofLock.competitorCoveragePercent
      }
    }
  };
}

export function buildMarketIntelReport(input: {
  baseUrl: string;
  recommendation: Recommendation;
  strategy: WinningStrategy;
}): MarketIntelReport {
  const { baseUrl, recommendation, strategy } = input;
  const comparisons = strategy.competitors.map(buildComparison);
  const sourceLedger = buildSourceLedger(comparisons);
  const sourceFreshness = buildSourceFreshnessSummary(sourceLedger, comparisons);
  const sourceProofLock = buildSourceProofLock({ sourceLedger });
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
    sourceFreshness,
    sourceProofLock,
    sourceLedger,
    sourceChecklist,
    a2aPayload: {
      skill: "market.intel",
      marketScore,
      status,
      sources: sourceChecklist.map((source) => source.id),
      sourceFreshness,
      sourceProofLock: {
        score: sourceProofLock.score,
        readiness: sourceProofLock.readiness,
        checkedAt: sourceProofLock.checkedAt,
        passedCount: sourceProofLock.passedCount,
        watchCount: sourceProofLock.watchCount,
        failedCount: sourceProofLock.failedCount,
        liveProbeCount: sourceProofLock.liveProbeCount,
        competitorCoveragePercent: sourceProofLock.competitorCoveragePercent
      },
      sourceLedger: sourceLedger.map((source) => ({
        id: source.id,
        freshness: source.freshness,
        reviewedAt: source.reviewedAt,
        competitorIds: source.competitorIds,
        judgeUse: source.judgeUse
      })),
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
