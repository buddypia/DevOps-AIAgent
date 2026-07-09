import { CAPABILITY_LABELS } from "./market.js";
import type { CapabilityKey, MarketAgent, Recommendation, SquadScore } from "./types.js";

export type ValueMetric = {
  id: string;
  label: string;
  before: string;
  after: string;
  delta: string;
  proof: string;
};

export type ValueJob = {
  id: string;
  agentName: string;
  title: string;
  userStory: string;
  currentPain: string;
  deliveredOutcome: string;
  acceptanceCriteria: string[];
  evidenceSignals: string[];
};

export type ValueRoadmapStep = {
  id: string;
  phase: string;
  duration: string;
  outcome: string;
  actions: string[];
  exitGate: string;
};

export type ValueBlueprint = {
  id: string;
  primaryUser: string;
  headline: string;
  valuePromise: string;
  boardScore: number;
  scores: {
    valueClarity: number;
    deliveryConfidence: number;
    operationalTrust: number;
    adoptionReadiness: number;
  };
  businessCase: {
    manualHours: number;
    assistedHours: number;
    hoursSaved: number;
    paybackDays: number;
    basis: string;
  };
  metrics: ValueMetric[];
  jobs: ValueJob[];
  roadmap: ValueRoadmapStep[];
  proofContract: {
    owner: string;
    mustProve: string[];
    qualityGate: string;
    evidenceUrls: string[];
  };
  exportMarkdown: string;
};

const SCORE_KEYS: Array<keyof SquadScore> = ["planning", "delivery", "reliability", "usability", "governance"];

const AGENT_JOB_COPY: Record<string, { title: string; pain: string; outcome: string }> = {
  "market-broker": {
    title: "必要なAI能力を調達可能な選定表へ変える",
    pain: "AIエージェント導入が、担当者の勘と機能名の羅列で止まりやすい。",
    outcome: "能力、価格、A2Aスキル、MCP成熟度で候補を比べ、採用理由を説明できる。"
  },
  "gemini-strategist": {
    title: "勝ち筋とリスクを短い意思決定メモへ圧縮する",
    pain: "価値説明、競合差分、残リスクが画面ごとに散らばり、意思決定者に伝わらない。",
    outcome: "導入理由、反論、次アクションを1つのストーリーとして更新できる。"
  },
  "cloud-run-sre": {
    title: "公開後も動く運用条件を先に固定する",
    pain: "デモは動いても、公開URL、ログ、ロールバック、ヘルスチェックが後回しになる。",
    outcome: "Cloud Run公開、監視、復旧手順を検収条件に入れ、提出後の不安を減らす。"
  },
  "ux-guildmaster": {
    title: "初回3分で価値が伝わる操作面へ磨く",
    pain: "機能が多くても、利用者が何をすれば価値に届くのか分からない。",
    outcome: "入力、選定、結果、検収が同じ画面の流れとして理解できる。"
  },
  "test-forge": {
    title: "価値仮説を壊れにくい契約テストに変える",
    pain: "良い説明があっても、変更で推薦や証拠が壊れた時に気づけない。",
    outcome: "推薦、A2A、品質ゲートの不変条件をテストで固定できる。"
  },
  "security-sentinel": {
    title: "公開デモの安全境界を導入条件に入れる",
    pain: "APIキー、入力上限、公開URLの扱いが曖昧だと、グローバル公開に踏み切れない。",
    outcome: "Secret、入力検証、公開範囲、監査証跡を検収できる。"
  },
  "observability-oracle": {
    title: "運用ログを次の改善購入へ戻す",
    pain: "公開後のログや異常検知が、プロダクト改善や追加投資に接続されない。",
    outcome: "稼働シグナルを読み、継続、復旧、次に雇うAIを判断できる。"
  },
  "brief-cartographer": {
    title: "曖昧な要求を実装単位と価値単位に分ける",
    pain: "何を作るか、誰に刺すか、どこまで作れば十分かが混ざる。",
    outcome: "対象ユーザー、課題、スコープ、受入条件を実装前に固定できる。"
  }
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function scoreLabel(key: keyof SquadScore) {
  if (key === "delivery") return "delivery";
  if (key === "reliability") return "operability";
  if (key === "usability") return "adoption";
  if (key === "governance") return "governance";
  return "planning";
}

function inferPrimaryUser(brief: string) {
  const normalized = brief.toLowerCase();
  if (/(security|secret|privacy|個人情報|安全|監査)/i.test(normalized)) return "Security-conscious Engineering Lead";
  if (/(sre|platform|cloud run|devops|運用|本番|デプロイ)/i.test(normalized)) return "Platform / DevOps Lead";
  if (/(protopedia|hackathon|審査|提出|pitch|動画)/i.test(normalized)) return "Builder preparing a public product launch";
  if (/(sales|buyer|customer|顧客|導入|roi)/i.test(normalized)) return "AI product buyer";
  return "AI product owner";
}

function topCapabilityGaps(recommendation: Recommendation) {
  return SCORE_KEYS.map((key) => ({
    key,
    label: scoreLabel(key),
    before: recommendation.before[key],
    after: recommendation.after[key],
    uplift: recommendation.uplift[key]
  })).sort((a, b) => b.uplift - a.uplift);
}

function strongestCapabilities(agents: MarketAgent[]): CapabilityKey[] {
  const totals = new Map<CapabilityKey, number>();
  for (const agent of agents) {
    for (const [key, value] of Object.entries(agent.capabilities)) {
      totals.set(key as CapabilityKey, (totals.get(key as CapabilityKey) ?? 0) + value);
    }
  }

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([key]) => key);
}

function buildAcceptanceCriteria(agent: MarketAgent, recommendation: Recommendation) {
  const skills = agent.skills.slice(0, 2).map((skill) => `${skill.label}: ${skill.proof}`);
  return [
    ...skills,
    `A2A skill id: ${agent.a2aSkillIds[0] ?? "task.delegate"} is visible in the handoff plan`,
    `Score impact is visible: ${recommendation.before.total} -> ${recommendation.after.total}`
  ];
}

function buildEvidenceSignals(agent: MarketAgent) {
  return [
    ...agent.a2aSkillIds.slice(0, 2),
    ...agent.mcp.flatMap((mcp) => mcp.tools.slice(0, 1)).slice(0, 2)
  ];
}

function buildJobs(recommendation: Recommendation, primaryUser: string): ValueJob[] {
  const selected = recommendation.selected.length > 0 ? recommendation.selected : recommendation.ranked.slice(0, 3).map((fit) => fit.agent);
  return selected.slice(0, 4).map((agent) => {
    const copy = AGENT_JOB_COPY[agent.id] ?? {
      title: agent.outcome,
      pain: "AI機能が点在し、導入判断に必要な成果物へ接続されない。",
      outcome: agent.headline
    };

    return {
      id: agent.id,
      agentName: agent.name,
      title: copy.title,
      userStory: `${primaryUser}として、${copy.outcome}`,
      currentPain: copy.pain,
      deliveredOutcome: copy.outcome,
      acceptanceCriteria: buildAcceptanceCriteria(agent, recommendation),
      evidenceSignals: buildEvidenceSignals(agent)
    };
  });
}

function buildRoadmap(recommendation: Recommendation, primaryUser: string): ValueRoadmapStep[] {
  const topAgents = recommendation.selected.map((agent) => agent.name).slice(0, 3).join(" / ") || "A2A Market Broker";
  return [
    {
      id: "diagnose",
      phase: "Diagnose",
      duration: "Day 0",
      outcome: `${primaryUser}の成功条件と導入リスクを1枚に固定する。`,
      actions: [
        "Project briefから対象ユーザー、価値仮説、成功指標を抽出する",
        "現在の弱点をplanning / delivery / operability / adoptionへ分解する"
      ],
      exitGate: "成功条件、除外範囲、最初の検収コマンドが1画面で説明できる"
    },
    {
      id: "compose",
      phase: "Compose",
      duration: "Day 1-2",
      outcome: `${topAgents}で実装、運用、説明責任の役割を分担する。`,
      actions: recommendation.selected.slice(0, 3).map((agent) => `${agent.name}: ${agent.outcome}`),
      exitGate: `予算 ${recommendation.budgetUsed} / 140 内で、A2A委任先と受入条件が決まっている`
    },
    {
      id: "pilot",
      phase: "Pilot",
      duration: "Day 3-5",
      outcome: "最初のユーザーが、入力から価値ある計画まで自力で到達できる。",
      actions: [
        "Value Blueprintをユーザーに読ませ、意思決定に使えるか確認する",
        "Cloud Run公開URL、Agent Card、品質ゲートを同じ導線で開けるようにする"
      ],
      exitGate: "初回3分で価値、リスク、次アクションが説明できる"
    },
    {
      id: "scale",
      phase: "Scale",
      duration: "Week 2",
      outcome: "公開後のログと利用者反応を、次に雇うAI能力へ戻す。",
      actions: [
        "運用シグナル、失敗理由、ユーザー反論を週次で見直す",
        "追加AIの採用理由をValue Blueprintに追記する"
      ],
      exitGate: "利用ログから次の投資判断が説明できる"
    }
  ];
}

function buildMetrics(recommendation: Recommendation, businessCase: ValueBlueprint["businessCase"]): ValueMetric[] {
  const gaps = topCapabilityGaps(recommendation);
  const strongest = strongestCapabilities(recommendation.selected)
    .map((key) => CAPABILITY_LABELS[key])
    .join(" / ");

  return [
    {
      id: "first-plan",
      label: "Time to first operating plan",
      before: `${businessCase.manualHours}h manual synthesis`,
      after: `${businessCase.assistedHours}h guided blueprint`,
      delta: `${businessCase.hoursSaved}h saved`,
      proof: "Brief, squad, acceptance criteria, and roadmap are generated from the same recommendation model."
    },
    {
      id: "readiness",
      label: "Deployment readiness",
      before: `${recommendation.before.reliability}/100`,
      after: `${recommendation.after.reliability}/100`,
      delta: `+${recommendation.uplift.reliability}`,
      proof: "Cloud Run, observability, security, and test capabilities are scored together."
    },
    {
      id: "adoption",
      label: "User adoption clarity",
      before: `${recommendation.before.usability}/100`,
      after: `${recommendation.after.usability}/100`,
      delta: `+${recommendation.uplift.usability}`,
      proof: "The blueprint ties every selected agent to a user job and acceptance signal."
    },
    {
      id: "differentiation",
      label: "Strongest capability cluster",
      before: gaps[gaps.length - 1]?.label ?? "baseline",
      after: strongest || "A2A marketplace",
      delta: `${recommendation.selected.length} accountable agents`,
      proof: "Selected agents expose skills, MCP tools, and A2A IDs instead of generic feature labels."
    }
  ];
}

function buildMarkdown(blueprint: Omit<ValueBlueprint, "exportMarkdown">) {
  return [
    `# ${blueprint.headline}`,
    "",
    `Primary user: ${blueprint.primaryUser}`,
    `Value promise: ${blueprint.valuePromise}`,
    `Board score: ${blueprint.boardScore}/100`,
    "",
    "## Business case",
    `- ${blueprint.businessCase.hoursSaved} hours saved in the first planning cycle`,
    `- Payback window: ${blueprint.businessCase.paybackDays} days`,
    `- Basis: ${blueprint.businessCase.basis}`,
    "",
    "## Jobs to be done",
    ...blueprint.jobs.flatMap((job) => [
      `- ${job.title}`,
      `  - User story: ${job.userStory}`,
      `  - Acceptance: ${job.acceptanceCriteria[0]}`
    ]),
    "",
    "## Roadmap",
    ...blueprint.roadmap.map((step) => `- ${step.phase} (${step.duration}): ${step.exitGate}`),
    "",
    "## Proof contract",
    ...blueprint.proofContract.mustProve.map((item) => `- ${item}`)
  ].join("\n");
}

export function buildValueBlueprint(recommendation: Recommendation, projectBrief = recommendation.profile.brief, baseUrl = ""): ValueBlueprint {
  const primaryUser = inferPrimaryUser(projectBrief);
  const gaps = topCapabilityGaps(recommendation);
  const focusGap = gaps[0]?.label ?? "delivery";
  const strongest = strongestCapabilities(recommendation.selected);
  const businessCase = {
    manualHours: clamp(18 + recommendation.selected.length * 3 + Math.round(recommendation.before.total / 6), 12, 48),
    assistedHours: clamp(4 + Math.max(0, 4 - recommendation.selected.length), 2, 10),
    hoursSaved: 0,
    paybackDays: clamp(14 - Math.round(recommendation.uplift.total / 6), 3, 14),
    basis: `${recommendation.selected.length} selected agents, ${recommendation.mcpMatrix.length} MCP tool groups, ${recommendation.a2aTimeline.length} A2A handoff steps`
  };
  businessCase.hoursSaved = Math.max(1, businessCase.manualHours - businessCase.assistedHours);

  const scores = {
    valueClarity: Math.round(clamp(recommendation.after.planning * 0.52 + recommendation.after.usability * 0.32 + recommendation.uplift.total * 0.35)),
    deliveryConfidence: Math.round(clamp(recommendation.after.delivery * 0.58 + recommendation.after.governance * 0.22 + recommendation.selected.length * 4)),
    operationalTrust: Math.round(clamp(recommendation.after.reliability * 0.58 + recommendation.after.governance * 0.32 + recommendation.uplift.reliability * 0.2)),
    adoptionReadiness: Math.round(clamp(recommendation.after.usability * 0.62 + recommendation.after.planning * 0.24 + recommendation.uplift.usability * 0.22))
  };
  const boardScore = Math.round(clamp((scores.valueClarity + scores.deliveryConfidence + scores.operationalTrust + scores.adoptionReadiness) / 4));
  const headline = "Turn this AI-agent idea into a buyer-ready operating plan";
  const valuePromise =
    `${primaryUser} gets a concrete buyer story, accountable AI squad, acceptance gates, and first pilot roadmap instead of a feature-count demo.`;

  const partial = {
    id: `value-blueprint-${boardScore}-${recommendation.selected.map((agent) => agent.id).join("-") || "baseline"}`,
    primaryUser,
    headline,
    valuePromise,
    boardScore,
    scores,
    businessCase,
    metrics: buildMetrics(recommendation, businessCase),
    jobs: buildJobs(recommendation, primaryUser),
    roadmap: buildRoadmap(recommendation, primaryUser),
    proofContract: {
      owner: recommendation.selected[0]?.name ?? "A2A Market Broker",
      mustProve: [
        "A first-time user can understand the promised outcome without reading implementation docs.",
        "Every selected AI has a job, acceptance criterion, and evidence signal.",
        "The public service exposes health, Agent Card, and quality-gate evidence before launch.",
        `The weakest high-value gap is actively addressed: ${focusGap}.`
      ],
      qualityGate: "npm run typecheck && npm test && npm run build",
      evidenceUrls: [
        `${baseUrl}/.well-known/agent-card.json`,
        `${baseUrl}/api/healthz`,
        `${baseUrl}/api/value-blueprint`
      ].map((url) => url.replace(/^\/\//, "/"))
    }
  };

  return {
    ...partial,
    exportMarkdown: buildMarkdown(partial)
  };
}
