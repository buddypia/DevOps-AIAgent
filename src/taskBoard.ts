import { createHash } from "node:crypto";
import type { AgentContract, SquadContract } from "./contracts.js";
import type { MissionRun, MissionStep } from "./mission.js";
import type { OpsDrill } from "./ops.js";
import type { WinningStrategy } from "./strategy.js";
import type { Recommendation } from "./types.js";

export type TaskBoardReadiness = "delegation-ready" | "watch-verification" | "blocked";
export type TaskBoardStatus = "verified" | "running" | "blocked";
export type TaskBoardPhase = "sense" | "decide" | "contract" | "delegate" | "verify" | "operate" | "submit";

export type AgentWorkOrder = {
  id: string;
  agentId: string;
  agentName: string;
  phase: TaskBoardPhase;
  status: TaskBoardStatus;
  objective: string;
  delegatedPayload: Record<string, unknown>;
  acceptance: string[];
  verifier: string;
  proofUrl: string;
  nextAction: string;
};

export type TaskBoardVerification = {
  id: string;
  label: string;
  status: TaskBoardStatus;
  command: string;
  proof: string;
};

export type TaskBoardReceipt = {
  algorithm: "sha256";
  digest: string;
  verification: string;
};

export type AgentTaskBoard = {
  id: string;
  taskScore: number;
  readiness: TaskBoardReadiness;
  headline: string;
  hardTruth: string;
  workOrders: AgentWorkOrder[];
  executionOrder: string[];
  verifications: TaskBoardVerification[];
  receipt: TaskBoardReceipt;
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
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function digest(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function statusScore(status: TaskBoardStatus) {
  if (status === "verified") return 100;
  if (status === "running") return 74;
  return 20;
}

function statusFromContract(contract: AgentContract, opsDrill: OpsDrill): TaskBoardStatus {
  if (contract.risk === "high") return "blocked";
  if (opsDrill.rollbackRecommended && contract.agentId === "cloud-run-sre") return "running";
  return "verified";
}

function phaseForContract(contract: AgentContract): TaskBoardPhase {
  if (contract.agentId === "market-broker") return "sense";
  if (contract.agentId === "gemini-strategist") return "decide";
  if (contract.agentId === "cloud-run-sre") return "operate";
  if (contract.agentId === "test-forge") return "verify";
  if (contract.agentId === "ux-guildmaster") return "submit";
  return "delegate";
}

function proofForContract(baseUrl: string, contract: AgentContract) {
  if (contract.agentId === "market-broker") return absoluteUrl(baseUrl, "/api/market-intel");
  if (contract.agentId === "gemini-strategist") return absoluteUrl(baseUrl, "/api/competitive-battlecard");
  if (contract.agentId === "cloud-run-sre") return absoluteUrl(baseUrl, "/api/release-drift");
  if (contract.agentId === "test-forge") return absoluteUrl(baseUrl, "/api/proof");
  if (contract.agentId === "ux-guildmaster") return absoluteUrl(baseUrl, "/api/user-pilot");
  return absoluteUrl(baseUrl, "/api/contracts");
}

function objectiveForContract(contract: AgentContract, mission: MissionRun, strategy: WinningStrategy) {
  if (contract.agentId === "market-broker") return `競合${strategy.competitors.length}件とSWOTから、次に雇うべきAI能力を判断する。`;
  if (contract.agentId === "gemini-strategist") return `${mission.weakestCriterion.label}の弱点を、競合反論とWinner proofへ変換する。`;
  if (contract.agentId === "cloud-run-sre") return "Cloud Run公開URL、release drift、rollback判断を提出前に検収する。";
  if (contract.agentId === "test-forge") return "typecheck/test/build/architecture checkを実行し、Judge Proof receiptへ残す。";
  if (contract.agentId === "ux-guildmaster") return "審査員のfirst clickと提出動画の迷いを減らす。";
  return contract.scope;
}

function missionVerifier(step: MissionStep) {
  if (step.phase === "sense") return "Market Intel";
  if (step.phase === "decide") return "Winning Strategy";
  if (step.phase === "delegate") return "A2A JSON-RPC";
  if (step.phase === "verify") return "Judge Proof";
  return "Submission Runway";
}

function contractVerifier(contract: AgentContract, fallback: string) {
  if (contract.agentId === "cloud-run-sre") {
    return (
      contract.verificationCommands.find((command) => command.includes("healthz")) ??
      contract.verificationCommands.find((command) => command.includes("release-drift")) ??
      fallback
    );
  }
  if (contract.agentId === "gemini-strategist") {
    return contract.verificationCommands.find((command) => command.includes("/api/strategy")) ?? fallback;
  }
  return contract.verificationCommands[0] ?? fallback;
}

function nextActionForContract(contract: AgentContract, status: TaskBoardStatus) {
  if (status === "verified") return "Keep receipt and show proof during judge demo";
  if (status === "blocked") {
    return contract.riskControls.find((control) => control.includes("rollback") || control.includes("代替")) ?? "Resolve blocker before recording";
  }
  return contract.riskControls[0] ?? "Run verifier before demo";
}

function buildWorkOrder(input: {
  baseUrl: string;
  contract: AgentContract;
  mission: MissionRun;
  strategy: WinningStrategy;
  opsDrill: OpsDrill;
  index: number;
}): AgentWorkOrder {
  const proofUrl = proofForContract(input.baseUrl, input.contract);
  const phase = phaseForContract(input.contract);
  const status = statusFromContract(input.contract, input.opsDrill);
  const objective = objectiveForContract(input.contract, input.mission, input.strategy);
  return {
    id: `work-order-${input.index + 1}-${input.contract.agentId}`,
    agentId: input.contract.agentId,
    agentName: input.contract.agentName,
    phase,
    status,
    objective,
    delegatedPayload: {
      jsonrpc: "2.0",
      method: "message/send",
      params: {
        to: input.contract.agentId,
        objective,
        acceptanceCriteria: input.contract.acceptanceCriteria,
        proofUrl
      }
    },
    acceptance: input.contract.acceptanceCriteria.slice(0, 4),
    verifier: contractVerifier(input.contract, missionVerifier(input.mission.steps[input.index] ?? input.mission.steps[0])),
    proofUrl,
    nextAction: nextActionForContract(input.contract, status)
  };
}

function verificationStatus(command: string, opsDrill: OpsDrill): TaskBoardStatus {
  if (opsDrill.rollbackRecommended && command.includes("healthz")) return "running";
  return "verified";
}

export function buildAgentTaskBoard(input: {
  baseUrl: string;
  recommendation: Recommendation;
  strategy: WinningStrategy;
  mission: MissionRun;
  opsDrill: OpsDrill;
  squadContract: SquadContract;
}): AgentTaskBoard {
  const base = input.baseUrl.replace(/\/$/, "");
  const workOrders = input.squadContract.contracts.map((contract, index) =>
    buildWorkOrder({
      baseUrl: base,
      contract,
      mission: input.mission,
      strategy: input.strategy,
      opsDrill: input.opsDrill,
      index
    })
  );
  const verificationCommands = Array.from(
    new Set([...input.squadContract.acceptanceRunbook.slice(0, 3), ...input.mission.verificationCommands.slice(0, 4)])
  );
  const verifications: TaskBoardVerification[] = verificationCommands.map((command, index) => ({
    id: `verify-${index + 1}`,
    label: command.startsWith("curl") ? "Public proof command" : command,
    status: verificationStatus(command, input.opsDrill),
    command,
    proof: command.includes("GitHub Actions")
      ? "Quality gate must be visible in public CI"
      : command.includes("Agent Card")
        ? "A2A skill surface must include task.delegate"
        : "Command is part of the acceptance runbook"
  }));
  const blocked = workOrders.some((order) => order.status === "blocked") || verifications.some((item) => item.status === "blocked");
  const running = workOrders.some((order) => order.status === "running") || verifications.some((item) => item.status === "running");
  const taskScore = Math.round(
    clamp(
      average([
        input.squadContract.contractScore,
        input.mission.autonomyScore,
        input.opsDrill.readinessScore,
        average(workOrders.map((order) => statusScore(order.status))),
        average(verifications.map((item) => statusScore(item.status)))
      ])
    )
  );
  const readiness: TaskBoardReadiness = blocked ? "blocked" : running ? "watch-verification" : "delegation-ready";
  const receiptPayload = {
    taskScore,
    readiness,
    workOrders: workOrders.map((order) => ({ id: order.id, agentId: order.agentId, status: order.status, proofUrl: order.proofUrl })),
    verifications: verifications.map((item) => ({ id: item.id, status: item.status, command: item.command }))
  };
  const receipt: TaskBoardReceipt = {
    algorithm: "sha256",
    digest: digest(receiptPayload),
    verification: "Recompute sha256 over task score, readiness, work order status/proof URLs, and verification commands."
  };

  return {
    id: `agent-task-board-${taskScore}-${readiness}`,
    taskScore,
    readiness,
    headline:
      readiness === "delegation-ready"
        ? "選んだAIへ、A2Aで委任する仕事と検収条件が揃っています。"
        : readiness === "watch-verification"
          ? "委任票は揃っています。公開検証または運用watchを通してから録画します。"
          : "委任先または検証条件にblockerがあります。録画前に直します。",
    hardTruth:
      "AIエージェント中心性は、賢そうな分析ではなく、誰に何を委任し、どの証拠で完了とみなすかを示せるかで判断されます。",
    workOrders,
    executionOrder: workOrders.map((order) => `${order.phase}: ${order.agentName} -> ${order.objective}`),
    verifications,
    receipt,
    a2aPayload: {
      method: "message/send",
      skill: "task.delegate",
      taskScore,
      readiness,
      selectedAgents: input.recommendation.selected.map((agent) => agent.id),
      workOrders: workOrders.map((order) => ({
        id: order.id,
        agentId: order.agentId,
        status: order.status,
        proofUrl: order.proofUrl
      })),
      receipt: receipt.digest,
      endpoints: {
        taskBoard: absoluteUrl(base, "/api/task-board"),
        contracts: absoluteUrl(base, "/api/contracts"),
        autonomyLedger: absoluteUrl(base, "/api/autonomy-ledger"),
        proof: absoluteUrl(base, "/api/proof")
      }
    }
  };
}
