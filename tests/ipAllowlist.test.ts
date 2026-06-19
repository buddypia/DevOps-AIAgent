import { describe, expect, test } from "vitest";
import { ipAllowlistSummary, isAllowedClientIp } from "../server/ipAllowlist";

describe("IP allowlist", () => {
  test("allows local development loopback addresses", () => {
    expect(isAllowedClientIp("127.0.0.1")).toBe(true);
    expect(isAllowedClientIp("::1")).toBe(true);
    expect(isAllowedClientIp("::ffff:127.0.0.1")).toBe(true);
  });

  test("allows the explicitly requested fixed IPs", () => {
    expect(isAllowedClientIp("61.25.196.10")).toBe(true);
    expect(isAllowedClientIp("221.241.27.92")).toBe(true);
  });

  test("allows Rakuten Mobile CIDR ranges collected from the referenced sources", () => {
    expect(isAllowedClientIp("210.157.194.99")).toBe(true);
    expect(isAllowedClientIp("133.106.112.1")).toBe(true);
    expect(isAllowedClientIp("103.124.0.1")).toBe(true);
    expect(isAllowedClientIp("27.111.76.1")).toBe(true);
    expect(isAllowedClientIp("2400:5100::1")).toBe(true);
    expect(isAllowedClientIp("240b:c000::1")).toBe(true);
  });

  test("rejects unrelated public addresses", () => {
    expect(isAllowedClientIp("8.8.8.8")).toBe(false);
    expect(isAllowedClientIp("2001:4860:4860::8888")).toBe(false);
  });

  test("defaults to monitor mode so public judges and GitHub proof checks can open the demo", () => {
    expect(ipAllowlistSummary).toMatchObject({
      mode: "monitor",
      enforced: false
    });
  });
});
