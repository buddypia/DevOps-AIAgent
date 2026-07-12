import { lookup } from "node:dns/promises";
import { AGENT_CARD_MAX_BYTES, isBlockedIpAddress, normalizeAgentCardDiscoveryUrl } from "../src/agentCardDiscovery.js";
import { buildImportedAgentFromCard, type AgentCardImportResult } from "../src/customAgent.js";

type ResolveHost = (hostname: string) => Promise<Array<{ address: string }>>;
type FetchImpl = typeof fetch;

export type AgentCardDiscoveryResult = AgentCardImportResult & {
  sourceUrl?: string;
  discoveredUrl?: string;
  a2aEndpoint?: string;
};

async function defaultResolveHost(hostname: string) {
  return lookup(hostname, { all: true, verbatim: true });
}

async function assertPublicAgentCardHost(url: string, resolveHost: ResolveHost) {
  const hostname = new URL(url).hostname;
  const records = await resolveHost(hostname);
  if (records.length === 0 || records.some((record) => isBlockedIpAddress(record.address))) {
    throw new Error("Agent Card host resolved to a private or unsupported address.");
  }
}

async function readLimitedText(response: Response) {
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > AGENT_CARD_MAX_BYTES) {
    throw new Error("Agent Card response is too large.");
  }
  if (!response.body) return response.text();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > AGENT_CARD_MAX_BYTES) {
      await reader.cancel();
      throw new Error("Agent Card response is too large.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

async function fetchAgentCardText(
  inputUrl: string,
  input: {
    fetchImpl: FetchImpl;
    resolveHost: ResolveHost;
    redirectCount?: number;
  }
): Promise<{ url: string; text: string; warnings: string[] }> {
  const normalized = normalizeAgentCardDiscoveryUrl(inputUrl);
  if (!normalized.ok) throw new Error(normalized.error);
  await assertPublicAgentCardHost(normalized.url, input.resolveHost);

  const response = await input.fetchImpl(normalized.url, {
    headers: { accept: "application/json, application/agent+json;q=0.9, text/json;q=0.8" },
    redirect: "manual",
    signal: AbortSignal.timeout(5000)
  });

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (!location || (input.redirectCount ?? 0) >= 2) throw new Error("Agent Card redirect could not be followed safely.");
    return fetchAgentCardText(new URL(location, normalized.url).toString(), {
      ...input,
      redirectCount: (input.redirectCount ?? 0) + 1
    });
  }

  if (!response.ok) {
    throw new Error(`Agent Card request failed with HTTP ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") || "";
  const warnings = [...normalized.warnings, !/json/i.test(contentType) ? "Agent Card response did not advertise a JSON content type." : ""].filter(Boolean);
  return {
    url: normalized.url,
    text: await readLimitedText(response),
    warnings
  };
}

function resolveA2AEndpoint(cardText: string, discoveredUrl: string): string | undefined {
  let parsedCard: unknown;
  try {
    parsedCard = JSON.parse(cardText);
  } catch {
    return undefined;
  }
  const card = parsedCard && typeof parsedCard === "object" && !Array.isArray(parsedCard) ? (parsedCard as Record<string, unknown>) : {};
  const cardOrigin = new URL(discoveredUrl).origin;
  const declared = typeof card.url === "string" && card.url.trim() ? card.url.trim() : "";
  if (!declared) return new URL("/a2a", discoveredUrl).toString();
  try {
    const endpoint = new URL(declared, discoveredUrl);
    if (!(["http:", "https:"].includes(endpoint.protocol) && !endpoint.username && !endpoint.password && endpoint.origin === cardOrigin)) return undefined;
    endpoint.hash = "";
    return endpoint.toString();
  } catch {
    return undefined;
  }
}

export async function discoverAgentCardFromUrl(
  sourceUrl: string,
  deps: {
    fetchImpl?: FetchImpl;
    resolveHost?: ResolveHost;
  } = {}
): Promise<AgentCardDiscoveryResult> {
  try {
    const fetched = await fetchAgentCardText(sourceUrl, {
      fetchImpl: deps.fetchImpl ?? fetch,
      resolveHost: deps.resolveHost ?? defaultResolveHost
    });
    const result = buildImportedAgentFromCard(fetched.text, fetched.url);
    return {
      ...result,
      sourceUrl,
      discoveredUrl: fetched.url,
      a2aEndpoint: result.status === "accepted" ? resolveA2AEndpoint(fetched.text, fetched.url) : undefined,
      warnings: [...fetched.warnings, ...result.warnings]
    };
  } catch (error) {
    return {
      status: "rejected",
      error: error instanceof Error ? error.message : "Agent Card discovery failed.",
      warnings: [],
      signals: []
    };
  }
}
