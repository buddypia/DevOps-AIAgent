import { describe, expect, test } from "vitest";
import { FIRST_CLICK_PROOF_LINKS } from "../src/firstClick";
import {
  assertFirstClickSmokeCoverage,
  buildFirstClickSmokeLock,
  FIRST_CLICK_SMOKE_REQUIRED_SIGNAL,
  FIRST_CLICK_SMOKE_SENTINELS,
  FIRST_CLICK_SMOKE_SKILL_ID,
  type FirstClickSmokeProbe
} from "../src/firstClickSmoke";

function probe(input: Partial<FirstClickSmokeProbe> & Pick<FirstClickSmokeProbe, "id">): FirstClickSmokeProbe {
  const sentinel = FIRST_CLICK_SMOKE_SENTINELS.find((item) => item.id === input.id);
  if (!sentinel) throw new Error(`missing sentinel ${input.id}`);
  return {
    ...sentinel,
    url: `https://example.com${sentinel.href}`,
    status: input.status ?? "passed",
    score: input.score ?? 100,
    evidence: input.evidence ?? `${sentinel.sentinel} found`,
    ...input
  };
}

describe("first-click smoke lock", () => {
  test("covers every first-click proof link with a sentinel", () => {
    expect(assertFirstClickSmokeCoverage()).toBe(true);
    expect(FIRST_CLICK_SMOKE_SENTINELS.map((item) => item.id)).toEqual(FIRST_CLICK_PROOF_LINKS.map((link) => link.id));
  });

  test("passes only when every proof page contains its own title sentinel", () => {
    const lock = buildFirstClickSmokeLock({
      targetBaseUrl: "https://example.com/",
      probes: FIRST_CLICK_SMOKE_SENTINELS.map((sentinel) => probe({ id: sentinel.id }))
    });

    expect(lock).toMatchObject({
      targetBaseUrl: "https://example.com",
      smokeScore: 100,
      readiness: "smoke-passed",
      passedCount: 11,
      missingCount: 0
    });
    expect(lock.a2aPayload).toMatchObject({
      skill: FIRST_CLICK_SMOKE_SKILL_ID,
      endpoints: {
        firstClickSmoke: "https://example.com/api/first-click-smoke",
        firstClickSmokePage: "https://example.com/first-click-smoke"
      }
    });
    expect(FIRST_CLICK_SMOKE_REQUIRED_SIGNAL).toBe("judge.first-click-smoke:tag:first-click-smoke-lock");
  });

  test("fails when a route returns SPA fallback without the page sentinel", () => {
    const lock = buildFirstClickSmokeLock({
      targetBaseUrl: "https://example.com",
      probes: FIRST_CLICK_SMOKE_SENTINELS.map((sentinel) =>
        probe(
          sentinel.id === "objection-arena"
            ? {
                id: sentinel.id,
                status: "missing",
                score: 24,
                evidence: "HTTP 200 text/html, but missing sentinel Objection Arena."
              }
            : { id: sentinel.id }
        )
      )
    });

    expect(lock.readiness).toBe("smoke-failed");
    expect(lock.missingCount).toBe(1);
    expect(lock.probes.find((item) => item.id === "objection-arena")?.evidence).toContain("missing sentinel");
    expect(lock.runbook.join("\n")).toContain("rg 'Objection Arena'");
  });
});
