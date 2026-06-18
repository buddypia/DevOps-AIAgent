import { describe, expect, test } from "vitest";
import type { CompetitiveSnapshot } from "../src/competitiveSnapshot";
import type { FirstClickSmokeLock } from "../src/firstClickSmoke";
import type { MvpSnapshot } from "../src/mvpSnapshot";
import type { SubmissionLaunchGate } from "../src/submissionLaunch";
import type { WinGapRadar } from "../src/winGapRadar";
import {
  buildWinnerSufficiencyLock,
  renderWinnerSufficiencyHtml,
  WINNER_SUFFICIENCY_REQUIRED_SIGNAL,
  WINNER_SUFFICIENCY_SKILL_ID
} from "../src/winnerSufficiency";

const baseUrl = "https://example.com";

function mvp(input: Record<string, unknown> = {}): MvpSnapshot {
  return {
    readiness: "mvp-ready",
    hardTruth: "MVP core proof is ready.",
    summary: {
      mvpScore: 92,
      acceptanceScore: 91,
      externalGapCount: 0,
      releaseVerdict: "release-current"
    },
    releaseLock: {
      missingSkills: [],
      missingAgentCardSignals: []
    },
    ...input
  } as unknown as MvpSnapshot;
}

function competitive(input: Record<string, unknown> = {}): CompetitiveSnapshot {
  return {
    readiness: "competitive-swot-ready",
    hardTruth: "Competitive SWOT is ready.",
    summary: {
      battleScore: 94,
      competitorCount: 6,
      swotQuadrantCount: 4,
      sourceLockReadiness: "source-lock-live"
    },
    ...input
  } as unknown as CompetitiveSnapshot;
}

function smoke(input: Record<string, unknown> = {}): FirstClickSmokeLock {
  return {
    readiness: "smoke-passed",
    smokeScore: 100,
    passedCount: 12,
    missingCount: 0,
    probes: Array.from({ length: 12 }, (_, index) => ({ id: `probe-${index}` })),
    ...input
  } as unknown as FirstClickSmokeLock;
}

function radar(input: Record<string, unknown> = {}): WinGapRadar {
  return {
    readiness: "winner-track",
    externalGaps: [],
    featureFreezeLock: {
      readiness: "feature-freeze-ready",
      freezeScore: 96,
      shipNowCount: 0,
      externalCount: 0,
      cutCount: 3,
      operatorLine: "Stop adding core features."
    },
    ...input
  } as unknown as WinGapRadar;
}

function launch(input: Record<string, unknown> = {}): SubmissionLaunchGate {
  return {
    readiness: "submit-ready",
    launchScore: 96,
    finalSubmitLock: {
      readiness: "findy-form-sealed",
      missingCount: 0,
      invalidCount: 0,
      operatorLine: "Submit sealed URLs."
    },
    ...input
  } as unknown as SubmissionLaunchGate;
}

describe("winner sufficiency lock", () => {
  test("answers yes only when MVP, competitive proof, public proof, feature freeze, and submission are sealed", () => {
    const lock = buildWinnerSufficiencyLock({
      baseUrl,
      mvpSnapshot: mvp(),
      competitiveSnapshot: competitive(),
      winGapRadar: radar(),
      firstClickSmoke: smoke(),
      submissionLaunch: launch(),
      generatedAt: "2026-06-18T00:00:00.000Z"
    });

    expect(lock.verdict).toBe("winner-sufficient");
    expect(lock.sufficiencyScore).toBeGreaterThanOrEqual(90);
    expect(lock.answer).toContain("十分です");
    expect(lock.actions).toEqual([
      expect.objectContaining({
        id: "record-proof",
        priority: "hold"
      })
    ]);
    expect(lock.a2aPayload).toMatchObject({
      skill: WINNER_SUFFICIENCY_SKILL_ID,
      sufficientForWinner: true,
      endpoints: {
        winnerSufficiencyPage: "https://example.com/winner-sufficiency"
      }
    });
    expect(WINNER_SUFFICIENCY_REQUIRED_SIGNAL).toBe("winner.sufficiency:tag:winner-sufficiency-lock");
  });

  test("does not call the project sufficient when public proof is stale", () => {
    const lock = buildWinnerSufficiencyLock({
      baseUrl,
      mvpSnapshot: mvp({
        readiness: "mvp-release-drift",
        summary: {
          mvpScore: 92,
          acceptanceScore: 91,
          externalGapCount: 0,
          releaseVerdict: "deploy-drift"
        },
        releaseLock: {
          missingSkills: ["winner.sufficiency"],
          missingAgentCardSignals: ["winner.sufficiency:tag:winner-sufficiency-lock"]
        }
      }),
      competitiveSnapshot: competitive(),
      winGapRadar: radar(),
      firstClickSmoke: smoke({ readiness: "smoke-failed", smokeScore: 80, missingCount: 1 }),
      submissionLaunch: launch()
    });

    expect(lock.verdict).toBe("public-drift");
    expect(lock.actions.map((action) => action.id)).toEqual(expect.arrayContaining(["mvp-core", "public-release", "first-click-proof"]));
    expect(lock.answer).toContain("まだ十分とは言いません");
  });

  test("freezes core feature work when only external submission URLs remain", () => {
    const lock = buildWinnerSufficiencyLock({
      baseUrl,
      mvpSnapshot: mvp({
        readiness: "mvp-ready-external-watch",
        summary: {
          mvpScore: 90,
          acceptanceScore: 90,
          externalGapCount: 2,
          releaseVerdict: "release-current"
        }
      }),
      competitiveSnapshot: competitive(),
      winGapRadar: radar({
        readiness: "mvp-gap-watch",
        externalGaps: [{ id: "video", label: "Video URL", action: "Publish video" }],
        featureFreezeLock: {
          readiness: "feature-freeze-external-watch",
          freezeScore: 91,
          shipNowCount: 0,
          externalCount: 1,
          cutCount: 3,
          operatorLine: "Stop adding core features."
        }
      }),
      firstClickSmoke: smoke(),
      submissionLaunch: launch({
        readiness: "needs-external-urls",
        launchScore: 86,
        finalSubmitLock: {
          readiness: "external-url-watch",
          missingCount: 2,
          invalidCount: 0,
          operatorLine: "Publish and paste external URLs."
        }
      })
    });

    expect(lock.verdict).toBe("external-closeout");
    expect(lock.answer).toContain("機能を増やすより");
    expect(lock.actions.map((action) => action.id)).toEqual(expect.arrayContaining(["feature-freeze", "submission-launch"]));
  });

  test("escapes rendered judge-facing HTML", () => {
    const lock = buildWinnerSufficiencyLock({
      baseUrl,
      mvpSnapshot: mvp({ hardTruth: "<script>alert('mvp')</script>" }),
      competitiveSnapshot: competitive(),
      winGapRadar: radar(),
      firstClickSmoke: smoke(),
      submissionLaunch: launch()
    });
    const html = renderWinnerSufficiencyHtml({
      ...lock,
      answer: "<script>alert('winner')</script>"
    });

    expect(html).toContain("Winner Sufficiency Lock");
    expect(html).toContain("Sufficiency Checks");
    expect(html).toContain("&lt;script&gt;alert(&#39;winner&#39;)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert('winner')</script>");
  });
});
