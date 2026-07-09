export const AGENT_CARD_DISCOVERY_PATH = "/.well-known/agent-card.json";
export const AGENT_CARD_MAX_BYTES = 128 * 1024;

export type AgentCardDiscoveryUrlResult =
  | {
      ok: true;
      url: string;
      warnings: string[];
    }
  | {
      ok: false;
      error: string;
    };

const BLOCKED_HOSTNAMES = new Set(["localhost", "0", "0.0.0.0"]);

function isPlainIpv4(value: string) {
  const parts = value.split(".");
  return (
    parts.length === 4 &&
    parts.every((part) => {
      if (!/^\d{1,3}$/.test(part)) return false;
      const value = Number(part);
      return value >= 0 && value <= 255;
    })
  );
}

function ipv4Parts(value: string) {
  if (!isPlainIpv4(value)) return null;
  return value.split(".").map((part) => Number(part));
}

function stripIpv6Brackets(value: string) {
  return value.replace(/^\[/, "").replace(/\]$/, "").toLowerCase();
}

export function isBlockedIpAddress(value: string) {
  const normalized = stripIpv6Brackets(value.trim());
  const ipv4 = ipv4Parts(normalized);
  if (ipv4) {
    const [a, b] = ipv4;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }

  if (normalized === "::1" || normalized === "::" || normalized.startsWith("fe80:") || normalized.startsWith("fc") || normalized.startsWith("fd")) {
    return true;
  }

  if (normalized.startsWith("::ffff:")) {
    return isBlockedIpAddress(normalized.slice("::ffff:".length));
  }

  return false;
}

export function isBlockedAgentCardHostname(hostname: string) {
  const normalized = stripIpv6Brackets(hostname.trim().toLowerCase());
  return BLOCKED_HOSTNAMES.has(normalized) || normalized.endsWith(".localhost") || isBlockedIpAddress(normalized);
}

function agentCardUrlFrom(parsed: URL) {
  const pathname = parsed.pathname.replace(/\/+$/, "");
  if (!pathname || pathname === "") {
    parsed.pathname = AGENT_CARD_DISCOVERY_PATH;
    parsed.search = "";
    parsed.hash = "";
    return parsed;
  }
  if (pathname.endsWith(".json") || pathname.endsWith(AGENT_CARD_DISCOVERY_PATH)) {
    parsed.hash = "";
    return parsed;
  }
  parsed.pathname = AGENT_CARD_DISCOVERY_PATH;
  parsed.search = "";
  parsed.hash = "";
  return parsed;
}

export function normalizeAgentCardDiscoveryUrl(raw: string): AgentCardDiscoveryUrlResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "Agent Card URL is required." };
  if (trimmed.length > 1000) return { ok: false, error: "Agent Card URL is too long." };

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: "Agent Card URL must be a valid absolute URL." };
  }

  if (!["https:", "http:"].includes(parsed.protocol)) {
    return { ok: false, error: "Agent Card URL must use http or https." };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, error: "Agent Card URL must not include embedded credentials." };
  }
  if (isBlockedAgentCardHostname(parsed.hostname)) {
    return { ok: false, error: "Agent Card URL must point to a public host." };
  }

  const warnings = parsed.protocol === "http:" ? ["HTTP Agent Card URLs are allowed for testing, but HTTPS is recommended for production."] : [];
  return {
    ok: true,
    url: agentCardUrlFrom(parsed).toString(),
    warnings
  };
}
