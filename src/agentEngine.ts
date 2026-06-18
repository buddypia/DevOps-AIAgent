import { CAPABILITY_LABELS, MARKET_AGENTS } from "./market.js";
import type {
  A2ATimelineItem,
  AgentFit,
  CapabilityKey,
  GeminiRecommendation,
  MarketAgent,
  ProjectProfile,
  Recommendation,
  SquadScore
} from "./types.js";

const CAPABILITY_KEYS = Object.keys(CAPABILITY_LABELS) as CapabilityKey[];

const BASE_WEIGHTS: Record<CapabilityKey, number> = {
  autonomy: 1.1,
  planning: 1,
  code: 1,
  testing: 0.85,
  cloudRun: 0.85,
  security: 0.75,
  observability: 0.75,
  ux: 0.9,
  mcp: 1,
  a2a: 1.15
};

const TERM_WEIGHTS: Array<{ terms: string[]; weights: Partial<Record<CapabilityKey, number>> }> = [
  {
    terms: ["a2a", "agent-to-agent", "agent card", "連携", "委任", "marketplace", "市場"],
    weights: { a2a: 0.75, mcp: 0.35, autonomy: 0.3, planning: 0.2 }
  },
  {
    terms: ["mcp", "tool", "ツール", "skill", "スキル", "能力"],
    weights: { mcp: 0.65, autonomy: 0.15, testing: 0.1 }
  },
  {
    terms: ["cloud run", "gcp", "google cloud", "deploy", "デプロイ", "本番"],
    weights: { cloudRun: 0.75, observability: 0.35, security: 0.2 }
  },
  {
    terms: ["gemini", "flash", "api", "生成", "分析"],
    weights: { planning: 0.35, autonomy: 0.2, code: 0.15 }
  },
  {
    terms: ["test", "ci", "cd", "quality", "検証", "品質", "github"],
    weights: { testing: 0.65, code: 0.25, observability: 0.2 }
  },
  {
    terms: ["ux", "ui", "market", "ゲーム", "ゲーミフィケーション", "可視化"],
    weights: { ux: 0.75, planning: 0.2, a2a: 0.15 }
  },
  {
    terms: ["security", "secret", "api key", "安全", "公開", "個人情報"],
    weights: { security: 0.75, cloudRun: 0.15, observability: 0.15 }
  },
  {
    terms: ["brief2dev", "spec", "要件", "企画", "protopedia", "審査"],
    weights: { planning: 0.7, ux: 0.25, testing: 0.15 }
  }
];

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function normalize(text: string) {
  return text.toLowerCase();
}

export function profileProject(brief: string): ProjectProfile {
  const normalized = normalize(brief);
  const weights = { ...BASE_WEIGHTS };
  const matchedTerms = new Set<string>();

  for (const rule of TERM_WEIGHTS) {
    if (rule.terms.some((term) => normalized.includes(term.toLowerCase()))) {
      for (const term of rule.terms) {
        if (normalized.includes(term.toLowerCase())) matchedTerms.add(term);
      }
      for (const [key, value] of Object.entries(rule.weights)) {
        weights[key as CapabilityKey] += value ?? 0;
      }
    }
  }

  return {
    brief,
    weights,
    matchedTerms: [...matchedTerms].slice(0, 12)
  };
}

function agentBaseFit(agent: MarketAgent, profile: ProjectProfile) {
  const weighted = CAPABILITY_KEYS.reduce((sum, key) => {
    return sum + agent.capabilities[key] * profile.weights[key];
  }, 0);
  const max = CAPABILITY_KEYS.reduce((sum, key) => sum + 100 * profile.weights[key], 0);
  return (weighted / max) * 100;
}

function skillMatches(agent: MarketAgent, profile: ProjectProfile) {
  const normalized = normalize([profile.brief, ...profile.matchedTerms].join(" "));
  return agent.skills
    .filter((skill) => {
      const haystack = normalize([skill.id, skill.label, skill.proof, ...agent.synergyTags].join(" "));
      return haystack.split(/[^a-z0-9ぁ-んァ-ン一-龥]+/).some((token) => token && normalized.includes(token));
    })
    .map((skill) => skill.label);
}

function synergyScore(agent: MarketAgent, selected: MarketAgent[], profile: ProjectProfile) {
  const selectedTags = new Set(selected.flatMap((item) => item.synergyTags));
  const tagOverlap = agent.synergyTags.filter((tag) => selectedTags.has(tag)).length;
  const termOverlap = agent.synergyTags.filter((tag) => profile.matchedTerms.join(" ").toLowerCase().includes(tag)).length;
  return clamp(tagOverlap * 5 + termOverlap * 7 + agent.a2aSkillIds.length * 1.5, 0, 24);
}

export function rankAgents(brief: string, selectedIds: string[] = []): AgentFit[] {
  const profile = profileProject(brief);
  const selected = MARKET_AGENTS.filter((agent) => selectedIds.includes(agent.id));
  return MARKET_AGENTS.map((agent) => {
    const fitScore = agentBaseFit(agent, profile);
    const synergy = synergyScore(agent, selected, profile);
    const matchedSkills = skillMatches(agent, profile);
    const valueScore = clamp(fitScore + synergy + matchedSkills.length * 3 - agent.price * 0.12);
    return {
      agent,
      fitScore: Math.round(fitScore),
      synergyScore: Math.round(synergy),
      valueScore: Math.round(valueScore),
      matchedSkills
    };
  }).sort((a, b) => b.valueScore - a.valueScore);
}

function emptyScore(): SquadScore {
  return {
    planning: 34,
    delivery: 30,
    reliability: 32,
    usability: 36,
    governance: 28,
    total: 32
  };
}

function average(items: number[]) {
  if (items.length === 0) return 0;
  return items.reduce((sum, item) => sum + item, 0) / items.length;
}

export function scoreSquad(selected: MarketAgent[]): SquadScore {
  if (selected.length === 0) return emptyScore();
  const planning = average(selected.map((agent) => (agent.capabilities.planning + agent.capabilities.autonomy + agent.capabilities.a2a) / 3));
  const delivery = average(selected.map((agent) => (agent.capabilities.code + agent.capabilities.testing + agent.capabilities.cloudRun) / 3));
  const reliability = average(selected.map((agent) => (agent.capabilities.observability + agent.capabilities.security + agent.capabilities.testing) / 3));
  const usability = average(selected.map((agent) => (agent.capabilities.ux + agent.capabilities.planning + agent.capabilities.a2a) / 3));
  const governance = average(selected.map((agent) => (agent.capabilities.mcp + agent.capabilities.a2a + agent.capabilities.security) / 3));
  const total = average([planning, delivery, reliability, usability, governance]);

  return {
    planning: Math.round(clamp(planning)),
    delivery: Math.round(clamp(delivery)),
    reliability: Math.round(clamp(reliability)),
    usability: Math.round(clamp(usability)),
    governance: Math.round(clamp(governance)),
    total: Math.round(clamp(total))
  };
}

function subtractScore(after: SquadScore, before: SquadScore): SquadScore {
  return {
    planning: after.planning - before.planning,
    delivery: after.delivery - before.delivery,
    reliability: after.reliability - before.reliability,
    usability: after.usability - before.usability,
    governance: after.governance - before.governance,
    total: after.total - before.total
  };
}

function selectWithinBudget(ranked: AgentFit[], budget: number) {
  const selected: MarketAgent[] = [];
  let used = 0;
  for (const fit of ranked) {
    if (used + fit.agent.price <= budget && selected.length < 4) {
      selected.push(fit.agent);
      used += fit.agent.price;
    }
  }
  return selected;
}

export function createA2ATimeline(selected: MarketAgent[]): A2ATimelineItem[] {
  const lead = selected.find((agent) => agent.id === "market-broker") ?? selected[0];
  if (!lead) return [];

  const hired = selected.filter((agent) => agent.id !== lead.id);
  const delegation = hired.length > 0 ? hired.map((agent) => agent.handle).join(" / ") : "候補エージェント";

  return [
    {
      actor: lead.name,
      verb: "discover",
      payload: "/.well-known/agent-card.json から候補の能力と入力形式を確認",
      status: "done"
    },
    {
      actor: lead.name,
      verb: "negotiate",
      payload: `予算・MCP成熟度・A2AスキルIDで ${delegation} を選定`,
      status: "done"
    },
    {
      actor: delegation,
      verb: "message/send",
      payload: "プロジェクト弱点、希望アウトカム、検証コマンドをJSONで委任",
      status: hired.length > 0 ? "running" : "ready"
    },
    {
      actor: "Gemini Strategist",
      verb: "review",
      payload: "Gemini 3.5 Flashで勝ち筋・残リスク・30秒ピッチへ圧縮",
      status: selected.some((agent) => agent.id === "gemini-strategist") ? "running" : "ready"
    },
    {
      actor: "Cloud Run SRE",
      verb: "ship",
      payload: "Cloud Runの公開URL、ヘルスチェック、ログ確認を提出物へ接続",
      status: selected.some((agent) => agent.id === "cloud-run-sre") ? "running" : "ready"
    }
  ];
}

export function recommendSquad(brief: string, selectedIds: string[] = [], budget = 140): Recommendation {
  const profile = profileProject(brief);
  const ranked = rankAgents(brief, selectedIds);
  const explicitSelection = MARKET_AGENTS.filter((agent) => selectedIds.includes(agent.id));
  const selected = explicitSelection.length > 0 ? explicitSelection : selectWithinBudget(ranked, budget);
  const budgetUsed = selected.reduce((sum, agent) => sum + agent.price, 0);
  const before = emptyScore();
  const after = scoreSquad(selected);
  const topAgent = ranked[0]?.agent.name ?? "A2A Market Broker";
  const bestWeakness = (Object.entries(after) as Array<[keyof SquadScore, number]>)
    .filter(([key]) => key !== "total")
    .sort((a, b) => a[1] - b[1])[0]?.[0] ?? "delivery";

  return {
    profile,
    selected,
    ranked,
    budgetUsed,
    remainingBudget: Math.max(0, budget - budgetUsed),
    before,
    after,
    uplift: subtractScore(after, before),
    a2aTimeline: createA2ATimeline(selected),
    devopsPlan: [
      "Agent Cardを公開し、市場ブローカーが能力・MCP成熟度・価格を読み取る",
      "Gemini 3.5 Flashでプロジェクトブリーフを診断し、雇うべき能力を更新する",
      "選ばれたエージェントへA2A message/send形式で実装・検証・運用タスクを委任する",
      "Cloud Runに公開し、/api/healthz とログ確認コマンドを提出物へ添える",
      "ユーザーの購入履歴を改善量として可視化し、次の買い足しを推薦する"
    ],
    mcpMatrix: selected.flatMap((agent) =>
      agent.mcp.map((mcp) => ({
        agent: agent.name,
        mcp: mcp.name,
        maturity: mcp.maturity,
        tools: mcp.tools
      }))
    ),
    headline: `${topAgent} を中心に ${bestWeakness} を補強する編成`
  };
}

export function localGeminiRecommendation(recommendation: Recommendation, reason: string): GeminiRecommendation {
  const names = recommendation.selected.map((agent) => agent.name).join("、") || "A2A Market Broker";
  return {
    source: "local-fallback",
    model: "gemini-3.5-flash",
    executiveSummary: `${names} により、プロジェクト総合値は ${recommendation.before.total} から ${recommendation.after.total} へ改善します。`,
    winningAngle:
      "単なるチャットではなく、必要能力を市場で購入し、A2Aで委任し、Cloud Run運用まで閉じるエージェント体験として見せる。",
    risks: [
      `Gemini API未設定時はローカル推論で代替中: ${reason}`,
      "A2Aはデモ用の最小JSON-RPC互換エンドポイントなので、本番連携では認証とタスク状態永続化を足す",
      "購入効果は能力モデルに基づくため、実運用ログで重みを継続更新する"
    ],
    nextActions: [
      "ProtoPedia用に市場画面、A2A Agent Card、Cloud Run URLの3点を短い動画に収める",
      "Cloud Runにデプロイし、/api/healthz と /.well-known/agent-card.json を確認する",
      "GitHub READMEにGemini 3.5 Flash、A2A、MCP能力値、Cloud Runの説明を固定する"
    ],
    pitchScript:
      "必要なAIを探して雇う市場です。能力、スキル、MCP成熟度を数値化し、購入するとプロジェクトの企画・実装・運用スコアが上がります。裏側ではA2A Agent Cardで発見し、Gemini 3.5 Flashが次に雇うべき能力を判断し、Cloud Runで提出可能な形まで届けます。"
  };
}
