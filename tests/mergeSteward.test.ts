import { describe, expect, it, vi } from "vitest";

import {
  MergeStewardError,
  actionTokenMatches,
  createMergeSteward,
  evaluateMergeGate,
  previewIssue
} from "../server/mergeSteward.js";

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const issueInput = {
  title: "Release health check fails after deploy",
  problem: "The deployed revision returns 503 from /api/healthz.",
  evidence: ["Cloud Run revision agent-guild-00042", "healthz returned HTTP 503"],
  acceptanceCriteria: ["healthz returns 200", "CI quality gate passes"]
};

const safePull = {
  number: 57,
  html_url: "https://github.com/acme/demo/pull/57",
  draft: false,
  mergeable: true,
  mergeable_state: "clean",
  changed_files: 2,
  head: { sha: "abc123def456" },
  base: { ref: "main" }
};

function githubFetch(options?: { files?: string[]; checks?: string[]; reviews?: string[]; pull?: typeof safePull; checkTotal?: number }) {
  const files = options?.files ?? ["src/App.tsx", "tests/app.test.ts"];
  const checks = options?.checks ?? ["success", "success"];
  const reviews = options?.reviews ?? ["APPROVED"];
  return vi.fn<typeof fetch>(async (input, init) => {
    const url = String(input);
    if (url.endsWith("/pulls/57")) return response(options?.pull ?? safePull);
    if (url.endsWith("/pulls/57/files?per_page=100")) return response(files.map((filename) => ({ filename })));
    if (url.endsWith("/commits/abc123def456/check-runs?per_page=100")) {
      return response({
        total_count: options?.checkTotal ?? checks.length,
        check_runs: checks.map((conclusion, index) => ({ name: `check-${index}`, status: "completed", conclusion }))
      });
    }
    if (url.endsWith("/pulls/57/reviews?per_page=100")) {
      return response(reviews.map((state, index) => ({ id: index + 1, state, user: { login: `reviewer-${index}` } })));
    }
    if (url.endsWith("/pulls/57/merge") && init?.method === "PUT") return response({ merged: true, sha: "merge789", message: "merged" });
    throw new Error(`unexpected request: ${url}`);
  });
}

describe("Merge Steward", () => {
  it("requires a dedicated action token with constant-shape comparison", () => {
    const token = "correct-action-token-with-32-chars";
    expect(actionTokenMatches(token, token)).toBe(true);
    expect(actionTokenMatches("wrong-action-token-with-32-chars!!", token)).toBe(false);
    expect(actionTokenMatches(undefined, token)).toBe(false);
    expect(actionTokenMatches("short", "short")).toBe(false);
  });

  it("builds a stable issue preview with evidence, acceptance criteria, and an idempotency marker", () => {
    const first = previewIssue(issueInput);
    const second = previewIssue(issueInput);

    expect(first.marker).toBe(second.marker);
    expect(first.body).toContain("## 問題");
    expect(first.body).toContain("## 証拠");
    expect(first.body).toContain("## 受入条件");
    expect(first.body).toContain(first.marker);
  });

  it("returns the existing issue instead of creating a duplicate", async () => {
    const preview = previewIssue(issueInput);
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.endsWith("/issues?state=open&per_page=100")) {
        return response([{ number: 12, html_url: "https://github.com/acme/demo/issues/12", body: `existing\n${preview.marker}` }]);
      }
      throw new Error(`unexpected request: ${url}`);
    });
    const steward = createMergeSteward({ repository: "acme/demo", token: "test-token", fetchImpl });

    const result = await steward.createIssue({ ...issueInput, confirm: true });

    expect(result).toMatchObject({ created: false, duplicate: true, number: 12 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("creates one issue after explicit confirmation", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input, init) => {
      const url = String(input);
      if (url.endsWith("/issues?state=open&per_page=100")) return response([]);
      if (url.endsWith("/issues") && init?.method === "POST") {
        expect(init.headers).toMatchObject({ authorization: "Bearer test-token" });
        return response({ number: 21, html_url: "https://github.com/acme/demo/issues/21" }, 201);
      }
      throw new Error(`unexpected request: ${url}`);
    });
    const steward = createMergeSteward({ repository: "acme/demo", token: "test-token", fetchImpl });

    await expect(steward.createIssue({ ...issueInput, confirm: true })).resolves.toMatchObject({ created: true, number: 21 });
  });

  it("does not create an issue when duplicate evidence is paginated", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      if (String(input).endsWith("/issues?state=open&per_page=100")) {
        return response(
          Array.from({ length: 100 }, (_, index) => ({
            number: index + 1,
            html_url: `https://github.com/acme/demo/issues/${index + 1}`,
            body: "different issue"
          }))
        );
      }
      throw new Error(`unexpected request: ${String(input)}`);
    });
    const steward = createMergeSteward({ repository: "acme/demo", token: "test-token", fetchImpl });

    await expect(steward.createIssue({ ...issueInput, confirm: true })).rejects.toMatchObject({ code: "issue_evidence_incomplete" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("refuses writes without confirmation or a server token", async () => {
    const steward = createMergeSteward({ repository: "acme/demo", token: "", fetchImpl: vi.fn() as unknown as typeof fetch });

    await expect(steward.createIssue({ ...issueInput, confirm: false })).rejects.toMatchObject({ code: "confirmation_required" });
    await expect(steward.createIssue({ ...issueInput, confirm: true })).rejects.toMatchObject({ code: "github_not_configured" });
  });

  it("returns READY only when files, checks, reviews, and mergeability all pass", async () => {
    const fetchImpl = githubFetch();
    const steward = createMergeSteward({ repository: "acme/demo", token: "", fetchImpl });

    const result = await steward.evaluatePull(57);

    expect(result).toMatchObject({ verdict: "ready", pullNumber: 57, headSha: "abc123def456", approvals: 1, mergeable: true });
    expect(result.checks).toEqual({ total: 2, successful: 2, pending: 0, failed: 0 });
    expect(result.receipt).toMatch(/^[a-f0-9]{64}$/);
  });

  it.each([
    { pull: { ...safePull, changed_files: 101 }, checkTotal: 2 },
    { pull: safePull, checkTotal: 101 },
    { pull: safePull, checkTotal: 2, reviews: Array.from({ length: 100 }, () => "APPROVED") }
  ])("blocks when paginated safety evidence is incomplete", async ({ pull, checkTotal, reviews }) => {
    const steward = createMergeSteward({ repository: "acme/demo", token: "", fetchImpl: githubFetch({ pull, checkTotal, reviews }) });

    await expect(steward.evaluatePull(57)).resolves.toMatchObject({
      verdict: "blocked",
      blockers: expect.arrayContaining([expect.stringContaining("完全に取得できません")])
    });
  });

  it.each([
    { files: [".github/workflows/deploy.yml"], checks: ["success"], reviews: ["APPROVED"], pull: safePull, verdict: "human_review" },
    { files: ["src/authService.ts"], checks: ["success"], reviews: ["APPROVED"], pull: safePull, verdict: "human_review" },
    { files: ["src/permissionsPanel.ts"], checks: ["success"], reviews: ["APPROVED"], pull: safePull, verdict: "human_review" },
    { files: [".github/CODEOWNERS"], checks: ["success"], reviews: ["APPROVED"], pull: safePull, verdict: "human_review" },
    { files: ["CODEOWNERS"], checks: ["success"], reviews: ["APPROVED"], pull: safePull, verdict: "human_review" },
    { files: ["docs/CODEOWNERS"], checks: ["success"], reviews: ["APPROVED"], pull: safePull, verdict: "human_review" },
    { files: ["package.json"], checks: ["success"], reviews: ["APPROVED"], pull: safePull, verdict: "human_review" },
    { files: ["src/App.tsx"], checks: ["failure"], reviews: ["APPROVED"], pull: safePull, verdict: "blocked" },
    { files: ["src/App.tsx"], checks: ["success"], reviews: [], pull: safePull, verdict: "human_review" },
    { files: ["src/App.tsx"], checks: ["success"], reviews: ["APPROVED"], pull: { ...safePull, mergeable_state: "blocked" }, verdict: "blocked" }
  ])("classifies unsafe pull evidence as $verdict", ({ files, checks, reviews, pull, verdict }) => {
    const result = evaluateMergeGate({ pull, files, checkRuns: checks.map((conclusion) => ({ status: "completed", conclusion })), reviews });
    expect(result.verdict).toBe(verdict);
  });

  it("re-evaluates and squash merges only the unchanged READY receipt", async () => {
    const fetchImpl = githubFetch();
    const steward = createMergeSteward({ repository: "acme/demo", token: "test-token", fetchImpl });
    const evaluation = await steward.evaluatePull(57);

    const result = await steward.mergePull({ pullNumber: 57, headSha: evaluation.headSha, baseBranch: evaluation.baseBranch, receipt: evaluation.receipt, confirm: true });

    expect(result).toMatchObject({ merged: true, sha: "merge789" });
    const mergeCall = fetchImpl.mock.calls.find(([input]) => String(input).endsWith("/pulls/57/merge"));
    expect(mergeCall?.[1]?.body).toContain('"merge_method":"squash"');
  });

  it("never calls merge when the receipt is stale", async () => {
    const fetchImpl = githubFetch();
    const steward = createMergeSteward({ repository: "acme/demo", token: "test-token", fetchImpl });

    await expect(steward.mergePull({ pullNumber: 57, headSha: "abc123def456", baseBranch: "main", receipt: "0".repeat(64), confirm: true })).rejects.toBeInstanceOf(
      MergeStewardError
    );
    expect(fetchImpl.mock.calls.some(([input]) => String(input).endsWith("/pulls/57/merge"))).toBe(false);
  });

  it("rejects a changed base branch before calling merge", async () => {
    const fetchImpl = githubFetch();
    const steward = createMergeSteward({ repository: "acme/demo", token: "test-token", fetchImpl });
    const evaluation = await steward.evaluatePull(57);

    await expect(
      steward.mergePull({ pullNumber: 57, headSha: evaluation.headSha, baseBranch: "release", receipt: evaluation.receipt, confirm: true })
    ).rejects.toMatchObject({ code: "evaluation_stale" });
    expect(fetchImpl.mock.calls.some(([input]) => String(input).endsWith("/pulls/57/merge"))).toBe(false);
  });

  it("maps malformed GitHub responses to a retryable upstream error", async () => {
    const steward = createMergeSteward({ repository: "acme/demo", fetchImpl: vi.fn(async () => response({})) as unknown as typeof fetch });

    await expect(steward.evaluatePull(57)).rejects.toMatchObject({ code: "github_invalid_response", httpStatus: 502, retryable: true });
  });
});
