export type CapabilityKey =
  | "autonomy"
  | "planning"
  | "code"
  | "testing"
  | "cloudRun"
  | "security"
  | "observability"
  | "ux"
  | "mcp"
  | "a2a";

export type AgentStage = "plan" | "build" | "deploy" | "operate" | "govern";

export type AgentSkill = {
  id: string;
  label: string;
  proof: string;
  score: number;
};

export type McpCapability = {
  name: string;
  tools: string[];
  maturity: number;
};

export type MarketAgent = {
  id: string;
  name: string;
  handle: string;
  stage: AgentStage;
  rarity: "common" | "rare" | "epic" | "legendary";
  price: number;
  headline: string;
  outcome: string;
  color: string;
  accent: string;
  capabilities: Record<CapabilityKey, number>;
  skills: AgentSkill[];
  mcp: McpCapability[];
  a2aSkillIds: string[];
  synergyTags: string[];
};

export type ProjectProfile = {
  brief: string;
  weights: Record<CapabilityKey, number>;
  matchedTerms: string[];
};

export type AgentFit = {
  agent: MarketAgent;
  fitScore: number;
  synergyScore: number;
  valueScore: number;
  matchedSkills: string[];
};

export type SquadScore = {
  planning: number;
  delivery: number;
  reliability: number;
  usability: number;
  governance: number;
  total: number;
};

export type A2ATimelineItem = {
  actor: string;
  verb: string;
  payload: string;
  status: "ready" | "running" | "done";
};

export type Recommendation = {
  profile: ProjectProfile;
  selected: MarketAgent[];
  ranked: AgentFit[];
  budgetUsed: number;
  remainingBudget: number;
  before: SquadScore;
  after: SquadScore;
  uplift: SquadScore;
  a2aTimeline: A2ATimelineItem[];
  devopsPlan: string[];
  mcpMatrix: Array<{ agent: string; mcp: string; maturity: number; tools: string[] }>;
  headline: string;
};

export type GeminiRecommendation = {
  source: "gemini" | "local-fallback";
  model: string;
  executiveSummary: string;
  winningAngle: string;
  risks: string[];
  nextActions: string[];
  pitchScript: string;
};
