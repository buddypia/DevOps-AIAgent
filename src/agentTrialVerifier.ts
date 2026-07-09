import type { AgentTrialReceipt } from "./agentTrialReceipt.js";
import { buyerFacingProofUrlProblem } from "./publicProofUrl.js";

export type AgentTrialVerificationStatus = "accepted" | "needs-evidence" | "failed";
export type AgentTrialVerificationCheckStatus = "pass" | "watch" | "fail";

export type AgentTrialVerificationCheck = {
  id: string;
  label: string;
  status: AgentTrialVerificationCheckStatus;
  evidence: string;
};

export type AgentTrialVerification = {
  status: AgentTrialVerificationStatus;
  score: number;
  receiptId: string;
  skillId: string;
  artifactUrl: string;
  evidenceSource: string;
  headline: string;
  hardTruth: string;
  checks: AgentTrialVerificationCheck[];
  missingEvidence: string[];
  nextActions: string[];
  copyText: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function safeText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function check(input: AgentTrialVerificationCheck): AgentTrialVerificationCheck {
  return input;
}

function statusScore(status: AgentTrialVerificationCheckStatus) {
  if (status === "pass") return 100;
  if (status === "watch") return 60;
  return 0;
}

function readPath(record: Record<string, unknown>, path: string[]) {
  let current: unknown = record;
  for (const key of path) {
    current = asRecord(current)[key];
  }
  return current;
}

function findString(record: Record<string, unknown>, paths: string[][]) {
  for (const path of paths) {
    const value = readPath(record, path);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function findStringList(record: Record<string, unknown>, paths: string[][]) {
  for (const path of paths) {
    const value = readPath(record, path);
    if (Array.isArray(value)) {
      return value.map((item) => safeText(item)).filter(Boolean);
    }
    if (typeof value === "string" && value.trim()) return [value.trim()];
  }
  return [];
}

function collectUrlStrings(value: unknown, depth = 0): string[] {
  if (depth > 5) return [];
  if (typeof value === "string") {
    const matches = value.match(/https?:\/\/[^\s"'<>),]+/gi);
    return matches ?? [];
  }
  if (Array.isArray(value)) return value.flatMap((item) => collectUrlStrings(item, depth + 1));
  if (value && typeof value === "object") return Object.values(value).flatMap((item) => collectUrlStrings(item, depth + 1));
  return [];
}

function findArtifactUrl(record: Record<string, unknown>) {
  const explicit = findString(record, [
    ["artifactUrl"],
    ["artifact", "url"],
    ["artifact", "uri"],
    ["result", "artifactUrl"],
    ["result", "artifact", "url"],
    ["receipt", "artifactUrl"],
    ["output", "artifactUrl"],
    ["proof", "artifactUrl"],
    ["url"]
  ]);
  return explicit || collectUrlStrings(record)[0] || "";
}

function hasTruthyUnsafeFlag(value: unknown): string | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const signal = hasTruthyUnsafeFlag(item);
      if (signal) return signal;
    }
    return null;
  }
  if (!value || typeof value !== "object") return null;

  for (const [key, child] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase();
    const unsafeKey =
      normalizedKey.includes("requirescredentials") ||
      normalizedKey.includes("credentialsrequired") ||
      normalizedKey.includes("needscredentials") ||
      normalizedKey.includes("privateurl") ||
      normalizedKey.includes("privatenetwork") ||
      normalizedKey.includes("mutatedproduction") ||
      normalizedKey.includes("productionmutation") ||
      normalizedKey.includes("destructiveaction");
    if (unsafeKey && child === true) return key;
    const nested = hasTruthyUnsafeFlag(child);
    if (nested) return nested;
  }

  return null;
}

function collectSafetyStrings(value: unknown, depth = 0): string[] {
  if (depth > 4) return [];
  if (typeof value === "string") {
    return value ? [value] : [];
  }
  if (Array.isArray(value)) return value.flatMap((item) => collectSafetyStrings(item, depth + 1));
  if (!value || typeof value !== "object") return [];
  return Object.entries(value)
    .filter(([key]) => /reason|error|warning|status|safety|stop|blocked/i.test(key))
    .flatMap(([, child]) => collectSafetyStrings(child, depth + 1));
}

function unsafePhrase(record: Record<string, unknown>) {
  return collectSafetyStrings(record).find((text) =>
    /requires?\s+(?:user\s+)?credentials?|credentials?\s+(?:are\s+)?required|private\s+(?:url|network|endpoint)\s+(?:required|requested|needed|used)|used\s+private\s+(?:url|network|endpoint)|mutat(?:ed|e|ing)\s+production|destructive\s+action\s+(?:required|taken|used|executed)/i.test(text)
  );
}

function buildCopyText(input: { receipt: AgentTrialReceipt; verification: Omit<AgentTrialVerification, "copyText"> }) {
  const { receipt, verification } = input;
  return [
    `Trial Verification: ${receipt.subject}`,
    `Receipt: ${receipt.id}`,
    `Status: ${verification.status}`,
    `Score: ${verification.score}`,
    "",
    verification.headline,
    verification.hardTruth,
    "",
    "Checks:",
    ...verification.checks.map((item) => `- ${item.status}: ${item.label} - ${item.evidence}`),
    "",
    "Next actions:",
    ...verification.nextActions.map((item) => `- ${item}`)
  ].join("\n");
}

function buildVerification(input: Omit<AgentTrialVerification, "copyText"> & { receipt: AgentTrialReceipt }): AgentTrialVerification {
  const { receipt, ...verification } = input;
  return {
    ...verification,
    copyText: buildCopyText({ receipt, verification })
  };
}

function headlineFor(status: AgentTrialVerificationStatus) {
  if (status === "accepted") return "Trial evidence satisfies the generated A2A receipt";
  if (status === "needs-evidence") return "Trial response is plausible but not yet buyer-ready";
  return "Trial response failed the generated A2A receipt";
}

function hardTruthFor(status: AgentTrialVerificationStatus) {
  if (status === "accepted") return "Attach this verification to the buyer workspace and keep the agent under supervised pilot scope.";
  if (status === "needs-evidence") return "Do not treat this as proof yet; ask the agent to return the missing evidence in a fresh receipt.";
  return "Do not hire from this response. Fix the failed checks or rerun the trial with a narrower, safer task.";
}

function nextActionsFor(status: AgentTrialVerificationStatus, missingEvidence: string[]) {
  if (status === "accepted") {
    return ["Attach the artifact URL to the buyer handoff.", "Keep the original receipt id with the verification summary.", "Run one supervised pilot before production delegation."];
  }
  if (status === "needs-evidence") {
    return [
      `Request missing evidence: ${missingEvidence.join(", ") || "receipt details"}.`,
      "Ask for a public artifact URL and named evidence source.",
      "Keep this agent in trial-first status until proof is complete."
    ];
  }
  return ["Reject this trial response for hiring decisions.", "Rerun the task without credentials, private URLs, or production mutation.", "Require a matching receipt id and skill id before review."];
}

function receiptAcceptanceCount(receipt: AgentTrialReceipt) {
  const dataPart = receipt.jsonRpcPayload.params.message.parts.find((part) => part.type === "data");
  const data = dataPart?.type === "data" ? dataPart.data : {};
  return asArray(data.acceptance).length;
}

export function verifyAgentTrialResponse(input: { receipt: AgentTrialReceipt; rawResponse: string }): AgentTrialVerification {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input.rawResponse);
  } catch {
    return buildVerification({
      receipt: input.receipt,
      status: "failed",
      score: 0,
      receiptId: input.receipt.id,
      skillId: input.receipt.jsonRpcPayload.params.skillId,
      artifactUrl: "",
      evidenceSource: "",
      headline: headlineFor("failed"),
      hardTruth: "The returned trial response is not parseable JSON.",
      checks: [
        check({
          id: "response-shape",
          label: "Response JSON",
          status: "fail",
          evidence: "The response could not be parsed as JSON."
        })
      ],
      missingEvidence: ["parseable JSON"],
      nextActions: ["Ask the agent to resend the response as JSON.", "Do not use free-form text as hiring evidence."]
    });
  }

  const record = asRecord(parsed);
  const expectedSkillId = input.receipt.jsonRpcPayload.params.skillId;
  const responseReceiptId = findString(record, [
    ["receiptId"],
    ["metadata", "receiptId"],
    ["receipt", "id"],
    ["receipt", "receiptId"],
    ["result", "receiptId"],
    ["result", "metadata", "receiptId"],
    ["params", "metadata", "receiptId"],
    ["jsonRpcPayload", "params", "metadata", "receiptId"]
  ]);
  const responseSkillId = findString(record, [
    ["skillId"],
    ["metadata", "skillId"],
    ["receipt", "skillId"],
    ["result", "skillId"],
    ["result", "metadata", "skillId"],
    ["params", "skillId"],
    ["jsonRpcPayload", "params", "skillId"]
  ]);
  const responseStatus = findString(record, [["status"], ["result", "status"], ["receipt", "status"], ["output", "status"]]).toLowerCase();
  const artifactUrl = findArtifactUrl(record);
  const artifactUrlProblem = artifactUrl ? buyerFacingProofUrlProblem(artifactUrl) : "";
  const evidenceSources = findStringList(record, [
    ["evidenceSource"],
    ["evidence", "source"],
    ["evidence", "sources"],
    ["sources"],
    ["source"],
    ["provenance"]
  ]);
  const acceptance = findStringList(record, [
    ["acceptance"],
    ["acceptanceCriteria"],
    ["acceptedCriteria"],
    ["criteria"],
    ["checks"]
  ]);
  const unsafeFlag = hasTruthyUnsafeFlag(record);
  const unsafeText = unsafePhrase(record);
  const expectedAcceptanceCount = receiptAcceptanceCount(input.receipt);

  const checks = [
    check({
      id: "response-shape",
      label: "Response JSON",
      status: Object.keys(record).length > 0 ? "pass" : "fail",
      evidence: Object.keys(record).length > 0 ? "The response is a JSON object." : "The response must be a JSON object."
    }),
    check({
      id: "receipt-match",
      label: "Receipt id",
      status: !responseReceiptId ? "watch" : responseReceiptId === input.receipt.id ? "pass" : "fail",
      evidence: !responseReceiptId ? "No receipt id was returned." : responseReceiptId === input.receipt.id ? responseReceiptId : `Expected ${input.receipt.id}, received ${responseReceiptId}.`
    }),
    check({
      id: "skill-contract",
      label: "Skill id",
      status: !responseSkillId ? "watch" : responseSkillId === expectedSkillId ? "pass" : "fail",
      evidence: !responseSkillId ? "No skill id was returned." : responseSkillId === expectedSkillId ? responseSkillId : `Expected ${expectedSkillId}, received ${responseSkillId}.`
    }),
    check({
      id: "execution-status",
      label: "Execution status",
      status: !responseStatus ? "watch" : /^(completed|complete|done|success|succeeded|accepted|pass|passed)$/.test(responseStatus) ? "pass" : "fail",
      evidence: responseStatus ? `Agent returned status ${responseStatus}.` : "No completion status was returned."
    }),
    check({
      id: "artifact-evidence",
      label: "Artifact evidence",
      status: !artifactUrl ? "watch" : artifactUrlProblem ? "fail" : "pass",
      evidence: !artifactUrl ? "No artifact URL was returned." : artifactUrlProblem || artifactUrl
    }),
    check({
      id: "evidence-source",
      label: "Evidence source",
      status: evidenceSources.length > 0 ? "pass" : "watch",
      evidence: evidenceSources.length > 0 ? evidenceSources.slice(0, 3).join(" / ") : "No named evidence source was returned."
    }),
    check({
      id: "acceptance-criteria",
      label: "Acceptance acknowledgement",
      status: acceptance.length >= expectedAcceptanceCount ? "pass" : "watch",
      evidence: acceptance.length > 0 ? `${acceptance.length} acceptance item(s) returned.` : "No acceptance criteria acknowledgement was returned."
    }),
    check({
      id: "safety-boundary",
      label: "Safety boundary",
      status: unsafeFlag || unsafeText ? "fail" : "pass",
      evidence: unsafeFlag ? `${unsafeFlag} was true.` : unsafeText ? unsafeText : "No credential, private URL, or production mutation signal was returned."
    })
  ];

  const failedChecks = checks.filter((item) => item.status === "fail");
  const missingEvidence = checks.filter((item) => item.status === "watch").map((item) => item.label);
  const score = Math.round(checks.reduce((sum, item) => sum + statusScore(item.status), 0) / checks.length);
  const status: AgentTrialVerificationStatus = failedChecks.length > 0 ? "failed" : missingEvidence.length === 0 && score >= 85 ? "accepted" : "needs-evidence";

  return buildVerification({
    receipt: input.receipt,
    status,
    score,
    receiptId: responseReceiptId || input.receipt.id,
    skillId: responseSkillId || expectedSkillId,
    artifactUrl,
    evidenceSource: evidenceSources[0] ?? "",
    headline: headlineFor(status),
    hardTruth: hardTruthFor(status),
    checks,
    missingEvidence,
    nextActions: nextActionsFor(status, missingEvidence)
  });
}
