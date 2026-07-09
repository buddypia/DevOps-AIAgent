import type { BuyerValueScenarioInput } from "./buyerValueScenario.js";
import type { BuyerWorkOrderInput } from "./buyerWorkOrder.js";
import type { PilotRunReceiptInput } from "./pilotRunReceipt.js";

export type BlueprintTemplate = {
  id: string;
  label: string;
  audience: string;
  promise: string;
  brief: string;
  selectedAgentIds: string[];
  buyerScenario: BuyerValueScenarioInput;
  pilotRun: PilotRunReceiptInput;
  buyerWorkOrder: BuyerWorkOrderInput;
};

export const BLUEPRINT_TEMPLATES: BlueprintTemplate[] = [
  {
    id: "platform-launch",
    label: "Platform Launch",
    audience: "Platform / DevOps Lead",
    promise: "Turn an AI-agent concept into a deployable Cloud Run operating plan.",
    brief: [
      "Global AI agent product for platform teams.",
      "Needs Cloud Run deployment, Agent Card discovery, A2A delegation, health checks, rollback rules, and a clear buyer-ready operating plan.",
      "The user must understand who gets value, how many hours are saved, what acceptance gates prove readiness, and what to do in the first pilot week."
    ].join("\n"),
    selectedAgentIds: ["market-broker", "cloud-run-sre", "gemini-strategist"],
    buyerScenario: {
      teamSize: 6,
      hourlyCostYen: 9000,
      cyclesPerMonth: 4,
      manualHoursPerCycle: 24,
      adoptionRatePercent: 70,
      incidentRiskYenPerMonth: 180000
    },
    pilotRun: {
      observedManualMinutes: 90,
      observedAssistedMinutes: 55,
      participants: 2,
      acceptedTasks: 2,
      totalTasks: 3,
      evidenceUrl: "",
      reviewerName: "",
      notes: "Starter benchmark: replace this with the first measured Cloud Run pilot receipt before sharing externally."
    },
    buyerWorkOrder: {
      request: "Turn one Cloud Run release-readiness review into a buyer proof packet with owners, A2A receipt, launch evidence, and a continue/revise/stop decision.",
      targetUser: "Platform / DevOps Lead",
      successMetric: "Close launch proof gaps and save at least 27 hours per month across release reviews",
      currentBaseline: "Release proof is collected manually from scattered notes, CI links, Cloud Run checks, and reviewer comments.",
      dataSensitivity: "internal",
      evidenceUrl: ""
    }
  },
  {
    id: "security-review",
    label: "Security Review",
    audience: "Security-conscious Engineering Lead",
    promise: "Make a public AI agent safe enough to show outside the team.",
    brief: [
      "Public AI agent service for global users.",
      "Needs API key boundaries, privacy-safe inputs, security review, audit logs, Cloud Run hardening, and clear evidence that no secret is exposed.",
      "The buyer needs ROI, acceptance criteria, and a launch checklist before approving external traffic."
    ].join("\n"),
    selectedAgentIds: ["security-sentinel", "cloud-run-sre", "market-broker"],
    buyerScenario: {
      teamSize: 8,
      hourlyCostYen: 12000,
      cyclesPerMonth: 5,
      manualHoursPerCycle: 28,
      adoptionRatePercent: 75,
      incidentRiskYenPerMonth: 240000
    },
    pilotRun: {
      observedManualMinutes: 1680,
      observedAssistedMinutes: 560,
      participants: 4,
      acceptedTasks: 3,
      totalTasks: 3,
      evidenceUrl: "",
      reviewerName: "Security sponsor",
      notes: "Security-review starter benchmark. Attach the public receipt URL after the first no-private-data run."
    },
    buyerWorkOrder: {
      request: "Convert the security release review into an external-safe proof packet that shows no secrets, redacted inputs, audit owner, and Cloud Run hardening evidence.",
      targetUser: "Security-conscious Engineering Lead",
      successMetric: "Close four security proof gaps before approving external traffic",
      currentBaseline: "Security review evidence sits across issue comments, policy notes, screenshots, and manual sign-off messages.",
      dataSensitivity: "internal",
      evidenceUrl: ""
    }
  },
  {
    id: "buyer-roi",
    label: "Buyer ROI",
    audience: "AI product buyer",
    promise: "Translate agent features into a business case a buyer can repeat.",
    brief: [
      "AI agent workflow for business buyers evaluating automation spend.",
      "Needs plain-language value, payback days, user adoption clarity, objections, proof jobs, and a pilot roadmap that does not depend on reading implementation docs.",
      "The output should show why this is worth buying, what it replaces, and what evidence proves the first deployment worked."
    ].join("\n"),
    selectedAgentIds: ["market-broker", "ux-guildmaster", "observability-oracle"],
    buyerScenario: {
      teamSize: 12,
      hourlyCostYen: 15000,
      cyclesPerMonth: 8,
      manualHoursPerCycle: 18,
      adoptionRatePercent: 65,
      incidentRiskYenPerMonth: 300000
    },
    pilotRun: {
      observedManualMinutes: 1080,
      observedAssistedMinutes: 420,
      participants: 5,
      acceptedTasks: 4,
      totalTasks: 4,
      evidenceUrl: "",
      reviewerName: "Revenue sponsor",
      notes: "ROI starter benchmark. Replace with a signed buyer receipt before moving to sponsor approval."
    },
    buyerWorkOrder: {
      request: "Turn a buyer's automation request into an ROI memo, pilot scope, measured receipt, and proof packet a sponsor can reuse without implementation context.",
      targetUser: "AI product buyer",
      successMetric: "Defend payback, adoption, and measured time saved in one buyer approval packet",
      currentBaseline: "Business value is explained through feature lists and scattered assumptions instead of repeatable buyer proof.",
      dataSensitivity: "public",
      evidenceUrl: ""
    }
  },
  {
    id: "quality-proof",
    label: "Quality Proof",
    audience: "Engineering Manager",
    promise: "Convert a promising demo into a tested, inspectable release candidate.",
    brief: [
      "AI agent product preparing for a global public release.",
      "Needs recommendation tests, A2A contract checks, Cloud Run health, security boundaries, deployment proof, and a user-facing value story.",
      "The team needs a practical proof contract before calling the product production-ready."
    ].join("\n"),
    selectedAgentIds: ["market-broker", "cloud-run-sre", "security-sentinel", "test-forge"],
    buyerScenario: {
      teamSize: 10,
      hourlyCostYen: 13000,
      cyclesPerMonth: 6,
      manualHoursPerCycle: 26,
      adoptionRatePercent: 68,
      incidentRiskYenPerMonth: 360000
    },
    pilotRun: {
      observedManualMinutes: 1320,
      observedAssistedMinutes: 520,
      participants: 4,
      acceptedTasks: 3,
      totalTasks: 4,
      evidenceUrl: "",
      reviewerName: "Engineering manager",
      notes: "Quality-proof starter benchmark. Attach test, CI, and receipt proof before calling the release candidate ready."
    },
    buyerWorkOrder: {
      request: "Convert the release-candidate quality review into a tested work order with CI proof, A2A contract checks, owner assignments, and a buyer-visible release decision.",
      targetUser: "Engineering Manager",
      successMetric: "Close CI, A2A, security, and runtime proof gates before calling the release candidate ready",
      currentBaseline: "Quality evidence is split between manual QA notes, test logs, and informal release confidence.",
      dataSensitivity: "internal",
      evidenceUrl: ""
    }
  }
];

export const DEFAULT_BLUEPRINT_TEMPLATE = BLUEPRINT_TEMPLATES[0];

export function getBlueprintTemplate(id: string) {
  return BLUEPRINT_TEMPLATES.find((template) => template.id === id) ?? DEFAULT_BLUEPRINT_TEMPLATE;
}
