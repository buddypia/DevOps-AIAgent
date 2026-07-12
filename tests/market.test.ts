import { describe, expect, it } from "vitest";

import { MARKET_AGENTS } from "../src/market.js";

describe("market agent display names", () => {
  it("uses Japanese-first names without changing stable agent IDs", () => {
    expect(MARKET_AGENTS.map(({ id, name }) => ({ id, name }))).toEqual([
      { id: "brief-cartographer", name: "企画地図師" },
      { id: "market-broker", name: "A2A連携仲介役" },
      { id: "cloud-run-sre", name: "Cloud Run SRE" },
      { id: "gemini-strategist", name: "Gemini審査参謀" },
      { id: "test-forge", name: "テスト検証役" },
      { id: "security-sentinel", name: "セキュリティ監査役" },
      { id: "ux-guildmaster", name: "UX設計役" },
      { id: "observability-oracle", name: "運用観測役" },
      { id: "release-guardian", name: "リリース守護者" }
    ]);
  });
});
