import { describe, expect, it } from "vitest";
import { normalizeLiveEvidenceBaseUrl, shouldForwardSelfProbeHeaders } from "../server/liveEvidenceTarget";

describe("live evidence target selection", () => {
  it("uses the current app origin when no target URL is supplied", () => {
    expect(normalizeLiveEvidenceBaseUrl("https://current.example/")).toBe("https://current.example");
  });

  it("uses the supplied deployed target URL for live evidence probes", () => {
    expect(normalizeLiveEvidenceBaseUrl("https://current.example", " https://target.example/run/ ")).toBe("https://target.example/run");
  });

  it("only forwards self-probe headers when the target is the current app", () => {
    expect(shouldForwardSelfProbeHeaders("https://current.example/", "https://current.example")).toBe(true);
    expect(shouldForwardSelfProbeHeaders("https://current.example", "https://target.example")).toBe(false);
  });
});
