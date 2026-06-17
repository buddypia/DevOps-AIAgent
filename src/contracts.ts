import type { MissionRun } from "./mission.js";
import type { OpsDrill } from "./ops.js";
import { SUBMISSION_PROOF } from "./submission.js";
import type { WinningStrategy } from "./strategy.js";
import type { MarketAgent, Recommendation } from "./types.js";

export type ContractRisk = "low" | "medium" | "high";

export type AgentContract = {
  id: string;
  agentId: string;
  agentName: string;
  handle: string;
  price: number;
  scope: string;
  deliverables: string[];
  acceptanceCriteria: string[];
  mcpAccess: string[];
  a2aSkills: string[];
  sla: {
    responseWindow: string;
    successMetric: string;
    rollbackRule: string;
  };
  risk: ContractRisk;
  riskControls: string[];
  verificationCommands: string[];
  payableOn: string;
};

export type ContractLedgerEvent = {
  id: string;
  actor: string;
  event: string;
  proof: string;
};

export type SquadContract = {
  id: string;
  contractScore: number;
  summary: string;
  totalPrice: number;
  remainingBudget: number;
  contracts: AgentContract[];
  ledger: ContractLedgerEvent[];
  acceptanceRunbook: string[];
  a2aPayload: Record<string, unknown>;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function riskForAgent(agent: MarketAgent, strategy: WinningStrategy, opsDrill: OpsDrill): ContractRisk {
  const contractFitness = average([
    agent.capabilities.a2a,
    agent.capabilities.mcp,
    agent.capabilities.testing,
    agent.capabilities.security,
    agent.capabilities.observability
  ]);
  if (opsDrill.rollbackRecommended && agent.stage === "deploy") return "high";
  if (strategy.riskLevel === "high" && contractFitness < 76) return "high";
  if (contractFitness < 72) return "medium";
  return "low";
}

function scopeForAgent(agent: MarketAgent, strategy: WinningStrategy, mission: MissionRun) {
  if (agent.id === "market-broker") return "必要能力の探索、価格/能力比較、A2A委任台帳、次に雇うAIの推薦を担当する。";
  if (agent.id === "cloud-run-sre") return "Cloud Run公開、health check、rollback判断、運用runbookを担当する。";
  if (agent.id === "gemini-strategist") return "競合/SWOT、審査スコア、ピッチ、残リスクの分析を担当する。";
  if (agent.id === "test-forge") return "品質ゲート、契約テスト、CI証跡、受入条件の検証を担当する。";
  if (agent.id === "ux-guildmaster") return "審査員が短時間で理解できる操作順、密度、説明導線を担当する。";
  return `${strategy.nextBestAgent?.agent.id === agent.id ? mission.weakestCriterion.label : agent.stage} の弱点を補い、提出証跡へ変換する。`;
}

function verificationForAgent(agent: MarketAgent, mission: MissionRun, opsDrill: OpsDrill) {
  const base = ["npm run typecheck", "npm test"];
  if (agent.capabilities.cloudRun >= 80) base.push("curl -s ${PUBLIC_BASE_URL:-http://localhost:8080}/api/healthz");
  if (agent.capabilities.a2a >= 80) base.push("curl -s ${PUBLIC_BASE_URL:-http://localhost:8080}/.well-known/agent-card.json");
  if (agent.capabilities.observability >= 80) base.push(...opsDrill.runbookCommands.slice(0, 2));
  if (agent.capabilities.planning >= 85) base.push(mission.verificationCommands.find((command) => command.includes("/api/strategy")) ?? "curl -s ${PUBLIC_BASE_URL:-http://localhost:8080}/api/strategy");
  return [...new Set(base)].slice(0, 5);
}

function riskControls(agent: MarketAgent, risk: ContractRisk) {
  const controls = [
    "成果物はA2A payloadと公開APIレスポンスで検収する",
    "シークレットは環境変数とSecret Manager境界を越えない",
    "提出動画では受入条件と公開証跡を同じ画面で見せる"
  ];
  if (agent.capabilities.security < 70) controls.push("外部入力はZod schemaとpayload size limitで制限する");
  if (agent.capabilities.testing < 70) controls.push("Test ForgeまたはGitHub Actionsで回帰確認を補う");
  if (risk === "high") controls.push("Cloud Run rollbackまたは代替エージェント雇用を事前条件にする");
  return controls;
}

function buildContract(agent: MarketAgent, input: { strategy: WinningStrategy; mission: MissionRun; opsDrill: OpsDrill }): AgentContract {
  const { strategy, mission, opsDrill } = input;
  const risk = riskForAgent(agent, strategy, opsDrill);
  const verificationCommands = verificationForAgent(agent, mission, opsDrill);
  return {
    id: `contract-${agent.id}`,
    agentId: agent.id,
    agentName: agent.name,
    handle: agent.handle,
    price: agent.price,
    scope: scopeForAgent(agent, strategy, mission),
    deliverables: [
      agent.outcome,
      ...agent.skills.slice(0, 2).map((skill) => `${skill.label}: ${skill.proof}`)
    ],
    acceptanceCriteria: [
      `A2A skill IDs are declared: ${agent.a2aSkillIds.join(", ")}`,
      `Top capability score stays above 70: ${Math.max(...Object.values(agent.capabilities))}`,
      `Verification command count >= 2: ${verificationCommands.length}`,
      `Output maps to judge criterion: ${mission.weakestCriterion.label}`
    ],
    mcpAccess: agent.mcp.map((mcp) => `${mcp.name} (${mcp.tools.join(" / ")})`),
    a2aSkills: agent.a2aSkillIds,
    sla: {
      responseWindow: agent.stage === "operate" || agent.stage === "deploy" ? "during public demo" : "before submission recording",
      successMetric: agent.stage === "deploy" ? "Cloud Run health and rollback runbook stay ready" : `${agent.outcome} is visible in the app and API`,
      rollbackRule: risk === "high" ? "block publish until rollback or replacement hire is documented" : "attach watch item to Judge Proof if acceptance fails"
    },
    risk,
    riskControls: riskControls(agent, risk),
    verificationCommands,
    payableOn: "public API evidence, UI evidence, and GitHub Actions success"
  };
}

export function buildSquadContract(input: {
  recommendation: Recommendation;
  strategy: WinningStrategy;
  mission: MissionRun;
  opsDrill: OpsDrill;
}): SquadContract {
  const { recommendation, strategy, mission, opsDrill } = input;
  const contracts = recommendation.selected.map((agent) => buildContract(agent, { strategy, mission, opsDrill }));
  const acceptanceAverage = average(
    contracts.map((contract) => {
      const riskPenalty = contract.risk === "high" ? 22 : contract.risk === "medium" ? 10 : 0;
      return clamp(100 - riskPenalty + contract.verificationCommands.length * 2);
    })
  );
  const contractScore = Math.round(
    clamp(average([recommendation.after.total, strategy.judgeScore, mission.verificationScore, opsDrill.readinessScore, acceptanceAverage]))
  );
  const ledger: ContractLedgerEvent[] = [
    {
      id: "discover",
      actor: "A2A Market Broker",
      event: "候補AIの能力、価格、A2A skill IDsを発見",
      proof: "/.well-known/agent-card.json"
    },
    {
      id: "contract",
      actor: "Contract Desk",
      event: `${contracts.length}件のAI契約と受入条件を生成`,
      proof: "/api/contracts"
    },
    {
      id: "verify",
      actor: "Test Forge / GitHub Actions",
      event: "typecheck/test/build/architecture checkで検収",
      proof: SUBMISSION_PROOF.ciWorkflowUrl
    },
    {
      id: "operate",
      actor: "Cloud Run SRE",
      event: "公開後のhealth/latency/rollback条件を監視",
      proof: "/api/ops-drill"
    }
  ];
  const acceptanceRunbook = [
    "Open /api/contracts and confirm every selected agent has scope, deliverables, and acceptanceCriteria",
    "Run judge proof and confirm CI, Cloud Run, A2A, Strategy, Mission, Ops evidence is present",
    "Open GitHub Actions and confirm the latest main quality gate is success",
    "Run ops drill and confirm rollbackRecommended is false or documented",
    "Record Pitch Director with Contract Desk visible before ProtoPedia upload"
  ];

  return {
    id: `squad-contract-${contractScore}-${contracts.map((contract) => contract.agentId).join("-") || "none"}`,
    contractScore,
    summary: `${contracts.length} AI contracts lock scope, acceptance, SLA, and verification before the hackathon pitch.`,
    totalPrice: recommendation.budgetUsed,
    remainingBudget: recommendation.remainingBudget,
    contracts,
    ledger,
    acceptanceRunbook,
    a2aPayload: {
      method: "message/send",
      skill: "contract.issue",
      budget: {
        used: recommendation.budgetUsed,
        remaining: recommendation.remainingBudget
      },
      contractScore,
      contracts: contracts.map((contract) => ({
        agentId: contract.agentId,
        price: contract.price,
        risk: contract.risk,
        acceptanceCriteria: contract.acceptanceCriteria
      }))
    }
  };
}
