import { createHash, timingSafeEqual } from "node:crypto";

import { z } from "zod";

const RepositorySchema = z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/);

export const IssueDraftSchema = z.object({
  title: z.string().trim().min(4).max(160),
  problem: z.string().trim().min(8).max(4000),
  evidence: z.array(z.string().trim().min(1).max(500)).max(12).default([]),
  acceptanceCriteria: z.array(z.string().trim().min(1).max(500)).min(1).max(12)
});

export const IssueCreateSchema = IssueDraftSchema.extend({ confirm: z.boolean() });
export const PullEvaluateSchema = z.object({ pullNumber: z.number().int().positive().max(999999) });
export const PullMergeSchema = PullEvaluateSchema.extend({
  headSha: z.string().regex(/^[a-f0-9]{7,64}$/i),
  baseBranch: z.string().trim().min(1).max(255),
  receipt: z.string().regex(/^[a-f0-9]{64}$/i),
  confirm: z.boolean()
});

const PullSchema = z.object({
  number: z.number().int().positive(),
  html_url: z.string().url(),
  draft: z.boolean(),
  mergeable: z.boolean().nullable(),
  mergeable_state: z.string().min(1).max(64),
  changed_files: z.number().int().nonnegative(),
  head: z.object({ sha: z.string().min(7).max(64) }),
  base: z.object({ ref: z.string().min(1).max(255) })
});

const PullFilesSchema = z.array(z.object({ filename: z.string().min(1).max(1000) }));
const CheckRunsSchema = z.object({
  total_count: z.number().int().nonnegative(),
  check_runs: z.array(
    z.object({
      name: z.string().default("check"),
      status: z.string(),
      conclusion: z.string().nullable().optional()
    })
  )
});
const ReviewsSchema = z.array(
  z.object({
    id: z.number(),
    state: z.string(),
    user: z.object({ login: z.string() }).nullable().optional()
  })
);
const IssuesSchema = z.array(
  z.object({
    number: z.number().int().positive(),
    html_url: z.string().url(),
    body: z.string().nullable().optional(),
    pull_request: z.unknown().optional()
  })
);
const CreatedIssueSchema = z.object({ number: z.number().int().positive(), html_url: z.string().url() });
const MergeResponseSchema = z.object({ merged: z.boolean(), sha: z.string().optional(), message: z.string().optional() });

type Pull = z.infer<typeof PullSchema>;
type CheckRun = z.infer<typeof CheckRunsSchema>["check_runs"][number];
type IssueDraft = z.infer<typeof IssueDraftSchema>;

export type MergeVerdict = "ready" | "human_review" | "blocked";

export type MergeEvaluationReceipt = {
  repository: string;
  pullNumber: number;
  pullUrl: string;
  baseBranch: string;
  headSha: string;
  evaluatedAt: string;
  verdict: MergeVerdict;
  checks: { total: number; successful: number; pending: number; failed: number };
  approvals: number;
  mergeable: boolean | null;
  mergeState: string;
  highRiskFiles: string[];
  blockers: string[];
  evidence: string[];
  receipt: string;
};

export class MergeStewardError extends Error {
  constructor(
    public readonly code: string,
    public readonly httpStatus: number,
    message: string,
    public readonly retryable = false
  ) {
    super(message);
    this.name = "MergeStewardError";
  }
}

const HIGH_RISK_PATHS = [
  /^\.github\/workflows\//i,
  /(^|\/)CODEOWNERS$/i,
  /^infra\//i,
  /(^|\/)[^/]*(?:auth|permissions?|secrets?|credentials?)[^/]*(?:\/|$)/i,
  /(^|\/)migrations?\//i,
  /(^|\/)package\.json$/i,
  /(^|\/)(?:package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|pnpm-lock\.yaml)$/i
];

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function actionTokenMatches(provided: string | undefined, expected: string | undefined) {
  if (!provided || !expected || expected.length < 32) return false;
  const providedHash = Buffer.from(sha256(provided));
  const expectedHash = Buffer.from(sha256(expected));
  return timingSafeEqual(providedHash, expectedHash);
}

export function previewIssue(input: IssueDraft) {
  const data = IssueDraftSchema.parse(input);
  const markerId = sha256(`${data.title}\n${data.problem}`).slice(0, 20);
  const marker = `<!-- merge-steward:${markerId} -->`;
  const evidence = data.evidence.length > 0 ? data.evidence.map((item) => `- ${item}`).join("\n") : "- 証拠は未添付";
  const acceptance = data.acceptanceCriteria.map((item) => `- [ ] ${item}`).join("\n");
  const body = [
    marker,
    "## 問題",
    data.problem,
    "",
    "## 証拠",
    evidence,
    "",
    "## 受入条件",
    acceptance,
    "",
    "## Agent receipt",
    `Merge Steward issue marker: \`${markerId}\``
  ].join("\n");
  return { ...data, body, marker, markerId };
}

function approvedReviewCount(reviews: Array<{ state: string; login: string }>) {
  const latest = new Map<string, string>();
  for (const review of reviews) latest.set(review.login, review.state.toUpperCase());
  return [...latest.values()].filter((state) => state === "APPROVED").length;
}

function receiptFor(result: Omit<MergeEvaluationReceipt, "evaluatedAt" | "receipt">) {
  return sha256(
    JSON.stringify({
      repository: result.repository,
      pullNumber: result.pullNumber,
      headSha: result.headSha,
      baseBranch: result.baseBranch,
      verdict: result.verdict,
      checks: result.checks,
      approvals: result.approvals,
      mergeable: result.mergeable,
      mergeState: result.mergeState,
      highRiskFiles: result.highRiskFiles,
      blockers: result.blockers
    })
  );
}

export function evaluateMergeGate(input: {
  repository?: string;
  pull: Pull;
  files: string[];
  checkRuns: Array<Pick<CheckRun, "status" | "conclusion">>;
  reviews: string[] | Array<{ state: string; login: string }>;
  evidenceComplete?: boolean;
  now?: () => Date;
}): MergeEvaluationReceipt {
  const repository = RepositorySchema.parse(input.repository ?? "unknown/repository");
  const highRiskFiles = input.files.filter((file) => HIGH_RISK_PATHS.some((pattern) => pattern.test(file)));
  const checks = input.checkRuns.reduce(
    (summary, check) => {
      summary.total += 1;
      if (check.status !== "completed" || !check.conclusion) summary.pending += 1;
      else if (["success", "neutral", "skipped"].includes(check.conclusion.toLowerCase())) summary.successful += 1;
      else summary.failed += 1;
      return summary;
    },
    { total: 0, successful: 0, pending: 0, failed: 0 }
  );
  const normalizedReviews = input.reviews.map((review, index) =>
    typeof review === "string" ? { state: review, login: `reviewer-${index}` } : review
  );
  const approvals = approvedReviewCount(normalizedReviews);
  const blockers: string[] = [];
  let verdict: MergeVerdict = "ready";

  if (input.evidenceComplete === false) blockers.push("変更ファイル、CI check、またはreviewの証拠を完全に取得できません");
  if (input.pull.draft) blockers.push("PRがDraftです");
  if (input.pull.mergeable !== true) blockers.push(input.pull.mergeable === false ? "PRに競合があります" : "mergeabilityを確定できません");
  if (input.pull.mergeable_state.toLowerCase() !== "clean") blockers.push(`GitHubの保護条件が未充足です (${input.pull.mergeable_state})`);
  if (checks.total === 0) blockers.push("CI checkがありません");
  if (checks.pending > 0) blockers.push(`保留中のcheckが${checks.pending}件あります`);
  if (checks.failed > 0) blockers.push(`失敗したcheckが${checks.failed}件あります`);
  if (blockers.length > 0) verdict = "blocked";
  else if (highRiskFiles.length > 0 || approvals < 1) {
    verdict = "human_review";
    if (highRiskFiles.length > 0) blockers.push(`高リスク変更: ${highRiskFiles.join(", ")}`);
    if (approvals < 1) blockers.push("GitHub上の承認レビューが必要です");
  }

  const base = {
    repository,
    pullNumber: input.pull.number,
    pullUrl: input.pull.html_url,
    baseBranch: input.pull.base.ref,
    headSha: input.pull.head.sha,
    verdict,
    checks,
    approvals,
    mergeable: input.pull.mergeable,
    mergeState: input.pull.mergeable_state,
    highRiskFiles,
    blockers,
    evidence: [
      `files=${input.files.length}`,
      `checks=${checks.successful}/${checks.total}`,
      `approvals=${approvals}`,
      `mergeable=${String(input.pull.mergeable)}`,
      `mergeState=${input.pull.mergeable_state}`,
      `head=${input.pull.head.sha.slice(0, 12)}`
    ]
  };
  return { ...base, evaluatedAt: (input.now ?? (() => new Date()))().toISOString(), receipt: receiptFor(base) };
}

type StewardDependencies = {
  repository: string;
  token?: string;
  fetchImpl?: typeof fetch;
  now?: () => Date;
};

function githubError(status: number, fallback: string) {
  if (status === 401 || status === 403) return new MergeStewardError("github_forbidden", status, "GitHub連携の権限を確認してください。", false);
  if (status === 404 || status === 410) return new MergeStewardError("github_not_found", status, "対象が見つからないか、機能が無効です。", false);
  if (status === 409) return new MergeStewardError("github_conflict", status, "PRが更新または競合しています。再評価してください。", false);
  if (status === 422) return new MergeStewardError("github_rejected", status, "GitHubが操作を拒否しました。入力または保護条件を確認してください。", false);
  if (status === 429) return new MergeStewardError("github_rate_limited", status, "GitHubのレート制限に達しました。時間を置いて再試行してください。", true);
  return new MergeStewardError("github_unavailable", 502, fallback, true);
}

function parseGitHubResponse<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new MergeStewardError("github_invalid_response", 502, "GitHub APIの応答形式を確認できませんでした。", true);
  }
  return parsed.data;
}

export function createMergeSteward(deps: StewardDependencies) {
  const repository = RepositorySchema.parse(deps.repository);
  const token = deps.token?.trim() ?? "";
  const fetchImpl = deps.fetchImpl ?? fetch;
  const baseUrl = `https://api.github.com/repos/${repository}`;

  async function request(path: string, init: RequestInit = {}) {
    const headers: Record<string, string> = {
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {})
    };
    let response: Response;
    try {
      response = await fetchImpl(`${baseUrl}${path}`, { ...init, headers: { ...headers, ...(init.headers as Record<string, string> | undefined) }, signal: AbortSignal.timeout(6000) });
    } catch {
      throw new MergeStewardError("github_unavailable", 502, "GitHubへ接続できませんでした。再試行してください。", true);
    }
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    if (!response.ok) throw githubError(response.status, "GitHub APIが一時的に利用できません。");
    return body;
  }

  function requireWrite(confirm: boolean) {
    if (!confirm) throw new MergeStewardError("confirmation_required", 400, "書き込み前の確認が必要です。");
    if (!token) throw new MergeStewardError("github_not_configured", 503, "GitHub書き込み連携が未設定です。");
  }

  async function evaluatePull(pullNumber: number) {
    const parsed = PullEvaluateSchema.parse({ pullNumber });
    const pull = parseGitHubResponse(PullSchema, await request(`/pulls/${parsed.pullNumber}`));
    const [filesBody, checksBody, reviewsBody] = await Promise.all([
      request(`/pulls/${parsed.pullNumber}/files?per_page=100`),
      request(`/commits/${pull.head.sha}/check-runs?per_page=100`),
      request(`/pulls/${parsed.pullNumber}/reviews?per_page=100`)
    ]);
    const files = parseGitHubResponse(PullFilesSchema, filesBody).map((file) => file.filename);
    const parsedChecks = parseGitHubResponse(CheckRunsSchema, checksBody);
    const checkRuns = parsedChecks.check_runs;
    const parsedReviews = parseGitHubResponse(ReviewsSchema, reviewsBody);
    const reviews = parsedReviews.map((review) => ({ state: review.state, login: review.user?.login ?? `review-${review.id}` }));
    const evidenceComplete = pull.changed_files === files.length && parsedChecks.total_count === checkRuns.length && parsedReviews.length < 100;
    return evaluateMergeGate({ repository, pull, files, checkRuns, reviews, evidenceComplete, now: deps.now });
  }

  return {
    previewIssue,
    async createIssue(input: z.infer<typeof IssueCreateSchema>) {
      const data = IssueCreateSchema.parse(input);
      requireWrite(data.confirm);
      const preview = previewIssue(data);
      const issues = parseGitHubResponse(IssuesSchema, await request("/issues?state=open&per_page=100"));
      const duplicate = issues.find((issue) => !issue.pull_request && issue.body?.includes(preview.marker));
      if (duplicate) return { created: false, duplicate: true, number: duplicate.number, url: duplicate.html_url, marker: preview.markerId };
      if (issues.length === 100) {
        throw new MergeStewardError("issue_evidence_incomplete", 409, "open Issueが100件以上あるため、重複がないことを確認できません。");
      }
      const created = parseGitHubResponse(
        CreatedIssueSchema,
        await request("/issues", { method: "POST", body: JSON.stringify({ title: preview.title, body: preview.body, labels: ["agent-found"] }) })
      );
      return { created: true, duplicate: false, number: created.number, url: created.html_url, marker: preview.markerId };
    },
    evaluatePull,
    async mergePull(input: z.infer<typeof PullMergeSchema>) {
      const data = PullMergeSchema.parse(input);
      requireWrite(data.confirm);
      const evaluation = await evaluatePull(data.pullNumber);
      if (evaluation.verdict !== "ready") {
        throw new MergeStewardError("merge_not_ready", 409, `安全ゲートが${evaluation.verdict}のためマージできません。`);
      }
      if (evaluation.headSha !== data.headSha || evaluation.baseBranch !== data.baseBranch || evaluation.receipt !== data.receipt) {
        throw new MergeStewardError("evaluation_stale", 409, "PRが評価後に変化しています。再評価してください。");
      }
      const merged = parseGitHubResponse(
        MergeResponseSchema,
        await request(`/pulls/${data.pullNumber}/merge`, {
          method: "PUT",
          body: JSON.stringify({ sha: data.headSha, merge_method: "squash", commit_title: `Merge Steward: PR #${data.pullNumber}` })
        })
      );
      if (!merged.merged) throw new MergeStewardError("github_rejected", 422, merged.message ?? "GitHubがマージを拒否しました。");
      return { merged: true as const, sha: merged.sha ?? "", message: merged.message ?? "merged", pullUrl: evaluation.pullUrl };
    }
  };
}
