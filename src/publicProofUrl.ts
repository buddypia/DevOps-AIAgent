const LOCAL_PROOF_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

export const PUBLIC_PROOF_INPUT_PLACEHOLDERS = {
  targetUrl: "<public Cloud Run product URL reviewers can open>",
  protopediaUrl: "<published ProtoPedia work URL>",
  videoUrl: "<public or unlisted walkthrough video URL>",
  pilotEvidenceUrl: "<public measured pilot receipt URL>",
  workOrderEvidenceUrl: "<public work-order proof URL>",
  agentTrialArtifactUrl: "<public accepted A2A trial receipt URL>",
  agentCardUrl: "<public Agent Card URL>",
  genericProofUrl: "<public proof URL reviewers can open>"
} as const;

function hasPlaceholderProofToken(value: string) {
  const normalized = value.toLowerCase();
  return value.includes("...") || normalized.includes("%2e%2e%2e") || /[<>]/.test(value) || normalized.includes("%3c") || normalized.includes("%3e");
}

function isPlaceholderProofHost(hostname: string) {
  const host = hostname.toLowerCase();
  return host.includes("your-company") || host.includes("your-service") || host.includes("your-cloud-run-url") || host.endsWith(".test") || host.endsWith(".invalid");
}

function isDemoProofHost(hostname: string) {
  const host = hostname.toLowerCase();
  return (
    host === "example.com" ||
    host.endsWith(".example.com") ||
    host === "example.org" ||
    host.endsWith(".example.org") ||
    host === "example.net" ||
    host.endsWith(".example.net")
  );
}

function isLocalOrPrivateProofHost(hostname: string) {
  const host = hostname.toLowerCase();
  return (
    LOCAL_PROOF_HOSTS.has(host) ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  );
}

export function buyerFacingProofUrlProblem(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "Paste a public HTTPS proof URL.";
  if (trimmed.length > 1000) return "Proof URL is too long to verify safely.";
  if (hasPlaceholderProofToken(trimmed)) return "Replace placeholder tokens with a real public artifact URL.";
  try {
    const url = new URL(trimmed);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== "https:") return "Use a secure https:// proof URL.";
    if (isLocalOrPrivateProofHost(hostname)) return "Use a public host reviewers can open, not a local or private network URL.";
    if (isPlaceholderProofHost(hostname)) return "Replace the placeholder proof host with a real public artifact URL.";
    if (isDemoProofHost(hostname)) return "Replace the demo proof host with a real public artifact URL.";
    return "";
  } catch {
    return "Use a valid absolute https:// proof URL.";
  }
}

export function isBuyerFacingProofUrl(value: string) {
  return !buyerFacingProofUrlProblem(value);
}

export function normalizeBuyerFacingProofUrl(value: unknown) {
  const raw = typeof value === "string" ? value.trim().slice(0, 1000) : "";
  if (!isBuyerFacingProofUrl(raw)) return "";
  return new URL(raw).toString();
}
