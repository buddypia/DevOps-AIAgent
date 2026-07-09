import { lookup } from "node:dns/promises";
import { isBlockedAgentCardHostname, isBlockedIpAddress } from "../src/agentCardDiscovery.js";

type ResolveHost = (hostname: string) => Promise<Array<{ address: string }>>;
type FetchImpl = typeof fetch;

export type PublicProofLinkInput = {
  id: string;
  label: string;
  value: string;
};

export type PublicProofLinkStatus = "pass" | "watch" | "block";

export type PublicProofLinkVerification = {
  id: string;
  label: string;
  url: string;
  status: PublicProofLinkStatus;
  httpStatus?: number;
  finalUrl?: string;
  contentType?: string;
  evidence: string;
  action: string;
};

export type PublicProofLinkVerificationSummary = {
  checkedAt: string;
  verifiedCount: number;
  totalCount: number;
  score: number;
  results: PublicProofLinkVerification[];
};

const MAX_LINKS = 8;
const MAX_URL_LENGTH = 1000;
const MAX_REDIRECTS = 2;

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function publicLinkResult(input: PublicProofLinkInput, patch: Omit<PublicProofLinkVerification, "id" | "label" | "url"> & { url?: string }): PublicProofLinkVerification {
  return {
    id: input.id,
    label: input.label,
    url: patch.url ?? input.value.trim(),
    ...patch
  };
}

function proofFieldId(id: string) {
  return id.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function normalizedHost(url: URL) {
  return url.hostname.replace(/^www\./i, "").toLowerCase();
}

function demoProofHostReason(host: string) {
  if (host === "localhost" || host.endsWith(".localhost")) return "local-only host";
  if (host === "example.com" || host.endsWith(".example.com")) return "example.com demo domain";
  if (host === "example.org" || host.endsWith(".example.org")) return "example.org demo domain";
  if (host === "example.net" || host.endsWith(".example.net")) return "example.net demo domain";
  if (host.endsWith(".example")) return ".example demo domain";
  if (host.endsWith(".test")) return ".test placeholder domain";
  if (host.endsWith(".invalid")) return ".invalid placeholder domain";
  if (host.includes("your-cloud-run-url") || host.includes("your-service")) return "placeholder deployment host";
  return "";
}

function placeholderProofUrlReason(value: string) {
  const normalized = value.toLowerCase();
  if (value.includes("...") || normalized.includes("%2e%2e%2e") || /[<>]/.test(value) || normalized.includes("%3c") || normalized.includes("%3e")) {
    return "placeholder proof URL";
  }
  return "";
}

function isProtoPediaHost(host: string) {
  return host === "protopedia.net" || host.endsWith(".protopedia.net");
}

function isPrimaryVideoHost(host: string) {
  return host === "youtube.com" || host === "youtu.be" || host === "vimeo.com";
}

function isBackupVideoHost(host: string) {
  return host === "drive.google.com";
}

function isGitHubHost(host: string) {
  return host === "github.com";
}

function isMediaOrRepositoryHost(host: string) {
  return isGitHubHost(host) || isProtoPediaHost(host) || isPrimaryVideoHost(host) || isBackupVideoHost(host);
}

function validateProofUrlKind(input: PublicProofLinkInput, parsed: URL): { ok: true } | { ok: false; reason: string; action: string } {
  const fieldId = proofFieldId(input.id);
  const host = normalizedHost(parsed);
  if (fieldId === "githuburl" && (parsed.protocol !== "https:" || !isGitHubHost(host))) {
    return {
      ok: false,
      reason: "GitHub proof must use a public github.com repository URL.",
      action: "Replace the GitHub field with the public repository URL before final submission."
    };
  }
  if (fieldId === "deployedurl" && isMediaOrRepositoryHost(host)) {
    return {
      ok: false,
      reason: "Deployed proof must point to the running product, not a repository, ProtoPedia page, or media host.",
      action: "Replace the deployed URL with the public Cloud Run service or production app URL."
    };
  }
  if (fieldId === "protopediaurl" && (parsed.protocol !== "https:" || !isProtoPediaHost(host))) {
    return {
      ok: false,
      reason: "ProtoPedia proof must use a public protopedia.net URL.",
      action: "Replace the ProtoPedia URL with the published ProtoPedia work page."
    };
  }
  if (fieldId === "videourl" && (parsed.protocol !== "https:" || (!isPrimaryVideoHost(host) && !isBackupVideoHost(host)))) {
    return {
      ok: false,
      reason: "Demo video proof must use YouTube, Vimeo, or a Google Drive backup URL.",
      action: "Replace the demo video URL with a public YouTube or Vimeo URL before buyer sharing."
    };
  }
  return { ok: true };
}

function normalizePublicProofUrl(input: PublicProofLinkInput): { ok: true; url: string } | { ok: false; reason: string; action: string } {
  const trimmed = input.value.trim();
  if (!trimmed) {
    return {
      ok: false,
      reason: "No public URL is attached.",
      action: `Attach a public URL for ${input.label}.`
    };
  }
  if (trimmed.length > MAX_URL_LENGTH) {
    return {
      ok: false,
      reason: "The URL is too long to verify safely.",
      action: `Shorten or replace the ${input.label} URL.`
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      ok: false,
      reason: "The URL is not a valid absolute URL.",
      action: `Replace ${input.label} with a valid https:// URL.`
    };
  }

  if (parsed.protocol !== "https:") {
    return {
      ok: false,
      reason: "Only https URLs can be verified as buyer-facing proof.",
      action: `Replace ${input.label} with a secure https:// URL.`
    };
  }
  if (parsed.username || parsed.password) {
    return {
      ok: false,
      reason: "URLs with embedded credentials are not allowed.",
      action: `Remove credentials from the ${input.label} URL.`
    };
  }
  const placeholderReason = placeholderProofUrlReason(trimmed);
  if (placeholderReason) {
    return {
      ok: false,
      reason: `The URL still contains a ${placeholderReason}, so it cannot verify buyer-facing proof.`,
      action: `Replace ${input.label} with a real public artifact URL reviewers can open.`
    };
  }
  if (isBlockedAgentCardHostname(parsed.hostname)) {
    return {
      ok: false,
      reason: "The URL points to a private or local host.",
      action: `Use a public, externally reachable URL for ${input.label}.`
    };
  }
  const demoReason = demoProofHostReason(normalizedHost(parsed));
  if (demoReason) {
    return {
      ok: false,
      reason: `The URL uses a ${demoReason}, so it cannot verify buyer-facing proof.`,
      action: `Replace ${input.label} with a real public artifact URL reviewers can open.`
    };
  }
  const proofKind = validateProofUrlKind(input, parsed);
  if (!proofKind.ok) return proofKind;

  parsed.hash = "";
  return { ok: true, url: parsed.toString() };
}

async function defaultResolveHost(hostname: string) {
  return lookup(hostname, { all: true, verbatim: true });
}

async function assertPublicHost(url: string, resolveHost: ResolveHost) {
  const hostname = new URL(url).hostname;
  const records = await resolveHost(hostname);
  if (records.length === 0 || records.some((record) => isBlockedIpAddress(record.address))) {
    throw new Error("URL host resolved to a private or unsupported address.");
  }
}

function statusFromResponse(input: PublicProofLinkInput, url: string, response: Response): Pick<PublicProofLinkVerification, "status" | "evidence" | "action"> {
  if (response.status >= 200 && response.status < 300) {
    const parsed = new URL(url);
    if (proofFieldId(input.id) === "videourl" && isBackupVideoHost(normalizedHost(parsed))) {
      return {
        status: "watch",
        evidence: `Google Drive returned HTTP ${response.status}; keep it as backup proof only.`,
        action: "Attach a YouTube or Vimeo demo video before sending this proof packet to a buyer."
      };
    }
    return {
      status: "pass",
      evidence: `Public URL responded with HTTP ${response.status}.`,
      action: "Keep this link attached to the launch room."
    };
  }
  if (response.status === 429 || response.status >= 500) {
    return {
      status: "watch",
      evidence: `Public URL responded with HTTP ${response.status}; it exists but is not reliably readable right now.`,
      action: "Retry the check or replace this proof with a more stable public artifact."
    };
  }
  if (response.status === 401 || response.status === 403) {
    return {
      status: "block",
      evidence: `Public URL responded with HTTP ${response.status}; external reviewers may not be able to open it.`,
      action: "Make the artifact publicly readable or attach a different proof URL."
    };
  }
  return {
    status: "block",
    evidence: `Public URL responded with HTTP ${response.status}.`,
    action: "Fix the broken URL or attach a reachable replacement."
  };
}

async function requestProofUrl(
  url: string,
  input: {
    fetchImpl: FetchImpl;
    resolveHost: ResolveHost;
    method: "HEAD" | "GET";
    proofInput: PublicProofLinkInput;
    redirectCount?: number;
  }
): Promise<{ response: Response; finalUrl: string }> {
  await assertPublicHost(url, input.resolveHost);
  const response = await input.fetchImpl(url, {
    method: input.method,
    headers: {
      accept: "text/html,application/json,text/plain,*/*;q=0.7",
      ...(input.method === "GET" ? { range: "bytes=0-0" } : {})
    },
    redirect: "manual",
    signal: AbortSignal.timeout(5000)
  });

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (!location || (input.redirectCount ?? 0) >= MAX_REDIRECTS) {
      return { response, finalUrl: url };
    }
    const next = normalizePublicProofUrl({ ...input.proofInput, value: new URL(location, url).toString() });
    if (!next.ok) {
      throw new Error(next.reason);
    }
    return requestProofUrl(next.url, {
      ...input,
      redirectCount: (input.redirectCount ?? 0) + 1
    });
  }

  return { response, finalUrl: url };
}

export async function verifyPublicProofLink(
  input: PublicProofLinkInput,
  deps: {
    fetchImpl?: FetchImpl;
    resolveHost?: ResolveHost;
    now?: Date;
  } = {}
): Promise<PublicProofLinkVerification> {
  const normalized = normalizePublicProofUrl(input);
  if (!normalized.ok) {
    return publicLinkResult(input, {
      url: input.value.trim(),
      status: "block",
      evidence: normalized.reason,
      action: normalized.action
    });
  }

  const fetchImpl = deps.fetchImpl ?? fetch;
  const resolveHost = deps.resolveHost ?? defaultResolveHost;

  try {
    let { response, finalUrl } = await requestProofUrl(normalized.url, {
      fetchImpl,
      resolveHost,
      method: "HEAD",
      proofInput: input
    });
    if (response.status === 405) {
      ({ response, finalUrl } = await requestProofUrl(normalized.url, {
        fetchImpl,
        resolveHost,
        method: "GET",
        proofInput: input
      }));
    }
    const responseStatus = statusFromResponse(input, finalUrl, response);
    return publicLinkResult(input, {
      ...responseStatus,
      url: normalized.url,
      httpStatus: response.status,
      finalUrl,
      contentType: response.headers.get("content-type") ?? undefined
    });
  } catch (error) {
    return publicLinkResult(input, {
      url: normalized.url,
      status: "block",
      evidence: error instanceof Error ? error.message : "Public URL check failed.",
      action: "Attach a publicly reachable proof URL that can be opened without private network access."
    });
  }
}

export async function verifyPublicProofLinks(
  links: PublicProofLinkInput[],
  deps: {
    fetchImpl?: FetchImpl;
    resolveHost?: ResolveHost;
    now?: Date;
  } = {}
): Promise<PublicProofLinkVerificationSummary> {
  const limited = links.slice(0, MAX_LINKS);
  const results = await Promise.all(limited.map((link) => verifyPublicProofLink(link, deps)));
  const verifiedCount = results.filter((result) => result.status === "pass").length;
  const watchCount = results.filter((result) => result.status === "watch").length;
  const score = Math.round(clamp((verifiedCount / Math.max(1, results.length)) * 100 + watchCount * 8));
  return {
    checkedAt: (deps.now ?? new Date()).toISOString(),
    verifiedCount,
    totalCount: results.length,
    score,
    results
  };
}
