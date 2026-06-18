import type { MarketIntelComparison, MarketIntelReport } from "./marketIntel.js";
import type { WinningStrategy } from "./strategy.js";
import type { Recommendation } from "./types.js";

export type MoatStressVerdict = "defensible" | "needs-proof" | "exposed";
export type MoatStressPriority = "now" | "next";

export type MoatStressScenario = {
  id: string;
  competitor: string;
  threatLevel: string;
  verdict: MoatStressVerdict;
  score: number;
  objection: string;
  pressure: string;
  answer: string;
  proofToShow: string;
  residualRisk: string;
  evidenceLinks: Array<{ label: string; url: string }>;
};

export type MoatStressAction = {
  id: string;
  priority: MoatStressPriority;
  owner: string;
  action: string;
  proof: string;
};

export type MoatStressTest = {
  id: string;
  generatedAt: string;
  stressScore: number;
  verdict: MoatStressVerdict;
  headline: string;
  hardTruth: string;
  scenarios: MoatStressScenario[];
  recordingOrder: string[];
  actions: MoatStressAction[];
  a2aPayload: Record<string, unknown>;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function verdictFromScore(score: number): MoatStressVerdict {
  if (score >= 86) return "defensible";
  if (score >= 74) return "needs-proof";
  return "exposed";
}

function hasAgent(recommendation: Recommendation, id: string) {
  return recommendation.selected.some((agent) => agent.id === id);
}

function threatPenalty(threatLevel: string) {
  if (threatLevel === "high") return 9;
  if (threatLevel === "medium") return 5;
  return 2;
}

function proofBoost(recommendation: Recommendation) {
  return [
    hasAgent(recommendation, "market-broker") ? 5 : 0,
    hasAgent(recommendation, "gemini-strategist") ? 4 : 0,
    hasAgent(recommendation, "cloud-run-sre") ? 4 : 0,
    hasAgent(recommendation, "security-sentinel") ? 2 : 0,
    hasAgent(recommendation, "ux-guildmaster") ? 2 : 0
  ].reduce((sum, value) => sum + value, 0);
}

function objectionFor(comparison: MarketIntelComparison) {
  if (comparison.id === "google-adk") return "Google ADKで作れば十分では？";
  if (comparison.id === "a2a-marketplace") return "Google CloudのAI Agent Marketplaceそのものと何が違う？";
  if (comparison.id === "langgraph") return "LangGraphのオーケストレーションで代替できるのでは？";
  if (comparison.id === "crewai") return "CrewAIのcrew設計で同じ体験を作れるのでは？";
  if (comparison.id === "dify") return "Difyならもっと速くワークフロー化できるのでは？";
  if (comparison.id === "agentops") return "AgentOps/LangSmith系の観測で十分では？";
  return `${comparison.competitor}で代替できるのでは？`;
}

function pressureFor(comparison: MarketIntelComparison) {
  return `${comparison.competitor}は${comparison.theyWinAt}で強い。${comparison.exposedGap}`;
}

function riskFor(comparison: MarketIntelComparison, verdict: MoatStressVerdict) {
  if (verdict === "defensible") return "録画では証拠を短く開けば足りる。深掘り質問には比較表とA2A payloadで返す。";
  if (comparison.threatLevel === "high") return "公式Google文脈が強いため、作る基盤ではなく調達・委任・提出証拠の体験だと先に言い切る。";
  return "反論は成立しているが、動画で該当パネルを飛ばすと差分が伝わりにくい。";
}

function evidenceLinks(base: string, comparison: MarketIntelComparison) {
  const normalized = base.replace(/\/$/, "");
  const links = [
    { label: "Market Intel", url: `${normalized}/api/market-intel` },
    { label: "Judge Tour", url: `${normalized}/api/judge-tour` },
    { label: "Live Evidence", url: `${normalized}/api/live-evidence` }
  ];
  if (comparison.threatLevel === "high") {
    links.push({ label: "Agent Card", url: `${normalized}/.well-known/agent-card.json` });
  }
  return links;
}

function buildScenario(input: {
  baseUrl: string;
  recommendation: Recommendation;
  strategy: WinningStrategy;
  marketIntel: MarketIntelReport;
  comparison: MarketIntelComparison;
}): MoatStressScenario {
  const base = average([input.marketIntel.marketScore, input.strategy.moatScore, input.strategy.judgeScore]);
  const sourceCoverage = input.comparison.sourceIds.length >= 2 ? 5 : 2;
  const score = Math.round(clamp(base + proofBoost(input.recommendation) + sourceCoverage - threatPenalty(input.comparison.threatLevel)));
  const verdict = verdictFromScore(score);
  return {
    id: input.comparison.id,
    competitor: input.comparison.competitor,
    threatLevel: input.comparison.threatLevel,
    verdict,
    score,
    objection: objectionFor(input.comparison),
    pressure: pressureFor(input.comparison),
    answer: `${input.comparison.ourCounter} ${input.comparison.demoProof}`,
    proofToShow:
      verdict === "defensible"
        ? "Judge Tour -> Market Intel -> Live Evidenceの順で、差分と実行証拠を30秒以内に見せる。"
        : "Market Intelの比較表を先に開き、相手の強みを認めた上で本プロダクトの調達ループへ戻す。",
    residualRisk: riskFor(input.comparison, verdict),
    evidenceLinks: evidenceLinks(input.baseUrl, input.comparison)
  };
}

function buildActions(scenarios: MoatStressScenario[]): MoatStressAction[] {
  const weakest = [...scenarios].sort((left, right) => left.score - right.score)[0];
  const actions: MoatStressAction[] = [
    {
      id: "lead-with-moat",
      priority: "now",
      owner: "Gemini Strategist",
      action: "冒頭で「作る基盤ではなく、AI能力を調達してDevOps証拠まで閉じる体験」と言い切る",
      proof: "全競合への共通カウンターポジション"
    },
    {
      id: "record-counterproof",
      priority: "now",
      owner: "Submission owner",
      action: "Market Intel、Moat Stress Test、Live Evidenceを連続で録画する",
      proof: "反論、比較、公開証拠を同じ導線で確認できる"
    }
  ];

  if (weakest && weakest.verdict !== "defensible") {
    actions.push({
      id: `shore-up-${weakest.id}`,
      priority: "next",
      owner: "A2A Market Broker",
      action: `${weakest.competitor}への反論を動画台本の最初の15秒へ入れる`,
      proof: weakest.residualRisk
    });
  }

  return actions;
}

export function buildMoatStressTest(input: {
  baseUrl: string;
  recommendation: Recommendation;
  strategy: WinningStrategy;
  marketIntel: MarketIntelReport;
  generatedAt?: string;
}): MoatStressTest {
  const scenarios = input.marketIntel.comparisons.map((comparison) =>
    buildScenario({
      baseUrl: input.baseUrl,
      recommendation: input.recommendation,
      strategy: input.strategy,
      marketIntel: input.marketIntel,
      comparison
    })
  );
  const stressScore = Math.round(clamp(average(scenarios.map((scenario) => scenario.score))));
  const verdict = verdictFromScore(stressScore);
  const actions = buildActions(scenarios);
  const normalizedBase = input.baseUrl.replace(/\/$/, "");

  return {
    id: `moat-stress-${stressScore}-${input.recommendation.selected.map((agent) => agent.id).join("-") || "none"}`,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    stressScore,
    verdict,
    headline:
      verdict === "defensible"
        ? "競合反論に耐えます。市場調達、A2A委任、公開証拠の3点で押し切れます。"
        : verdict === "needs-proof"
          ? "反論は成立していますが、動画で証拠を見せないと既存ツールとの差分が薄く見えます。"
          : "競合に飲み込まれる危険があります。調達体験と公開証拠を先に補強してください。",
    hardTruth:
      "ADK、LangGraph、CrewAI、Dify、AgentOpsは強いです。勝ち筋は置き換えではなく、どのAI能力を雇い、A2Aで委任し、Cloud Run上の証拠へ閉じるかを審査員に操作させることです。",
    scenarios,
    recordingOrder: [
      "Judge Tourで90秒の審査導線を開く",
      "Market Intelで競合比較とSWOTを見せる",
      "Moat Stress Testで反論ごとの証拠を選ぶ",
      "Live Evidence Monitorで公開URL/CI/A2Aのライブ証拠を通す",
      "Submission Launch Gateで外部URLの残ギャップを誠実に示す"
    ],
    actions,
    a2aPayload: {
      method: "message/send",
      skill: "moat.stress",
      stressScore,
      verdict,
      scenarios: scenarios.map((scenario) => ({
        id: scenario.id,
        competitor: scenario.competitor,
        verdict: scenario.verdict,
        score: scenario.score,
        proofToShow: scenario.proofToShow
      })),
      nextActions: actions.map((action) => ({
        id: action.id,
        priority: action.priority,
        action: action.action
      })),
      endpoints: {
        app: normalizedBase,
        moatStress: `${normalizedBase}/api/moat-stress`,
        marketIntel: `${normalizedBase}/api/market-intel`,
        liveEvidence: `${normalizedBase}/api/live-evidence`
      }
    }
  };
}
