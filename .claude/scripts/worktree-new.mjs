#!/usr/bin/env node
/**
 * worktree-new.mjs — Worktree freshness enforcement standard entry point (Layer 1).
 *
 * 目的: 新しい worktree が常に最新の `origin/<base>` 基準で開始されるように強制。生の
 * `git worktree add ... -b ...` が stale なローカル main の上で分岐する罠を遮断する。
 * Claude Code / Codex / Gemini CLI ともに同一のエントリーポイントを使用 (CLI agnostic)。
 *
 * フロー:
 *   1) `git fetch origin <base>` (ネットワーク失敗 → fail-loud + hint)
 *   2) main worktree であり、かつ base が origin/<base> の FF 可能 → `git merge --ff-only` を試行
 *      (すでに同一または ahead なら SKIP)。non-FF → STOP + 手動 reconcile 案内。
 *   3) `git worktree add <path> -b <branch> origin/<base>` (すでに同一の path/branch
 *      が登録されていて同一であればべき等 SKIP、別の branch/path 衝突は STOP)
 *   4) `node .claude/scripts/worktree-init.mjs --worktree <path>` chain
 *      (symlink + PLAN.md)
 *   5) JSON 報告: { ok, branch, base, base_sha, worktree_path, plan_path,
 *                   actions: [...], warnings: [...] }
 *
 * 使用:
 *   node .claude/scripts/worktree-new.mjs --branch feature/<task>
 *   node .claude/scripts/worktree-new.mjs --branch fix/<bug> --base main
 *   node .claude/scripts/worktree-new.mjs --branch feature/<task> --dry-run
 *
 * exit code:
 *   0 — 成功 (生成またはべき等 SKIP)
 *   1 — git 失敗 (fetch / non-FF / 衝突)
 *   2 — ユーザー/引数エラー
 *
 * 本スクリプトは R-CM-008 Rule 4-6 + worktree freshness 要求事項の単一エントリーポイントである。
 * 直接の `git worktree add` 呼び出しを代替する。ガイド文書 (CLAUDE.md / commit-guard /
 * worktree-policy-guard) が本スクリプトを指す。
 */

import { execFileSync } from 'node:child_process';
import { existsSync, realpathSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '../..');

const KNOWN_BRANCH_PREFIXES = ['feature', 'fix', 'hotfix', 'chore', 'refactor', 'docs', 'test'];

/* ============================================================
 * CLI parsing
 * ============================================================ */

function parseArgs(argv) {
  // base=null → CLI エントリーポイントが detectDefaultBase() により自動検知 (master 基本 repo 互換)。
  // 明示的な --base はそのまま使用。runWorktreeNew 直接呼び出し (テスト/プログラム) はデフォルト 'main'。
  const args = { branch: null, base: null, dryRun: false, path: null, json: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--branch' || a === '-b') args.branch = argv[++i] || null;
    else if (a === '--base') args.base = argv[++i] || null;
    else if (a === '--path' || a === '-p') args.path = argv[++i] || null;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--no-json') args.json = false;
    else if (a === '--help' || a === '-h') args.help = true;
    else if (a.startsWith('-')) {
      throw new Error(`Unknown option: ${a}`);
    }
  }
  return args;
}

const HELP = `worktree-new.mjs — Worktree freshness enforcement standard entry point

Usage:
  node .claude/scripts/worktree-new.mjs --branch <name> [--base main] [--path <dir>] [--dry-run]

Options:
  --branch, -b <name>   ブランチ名 (必須)。feature/<task> / fix/<bug> 形式を推奨。
  --base <name>         base ブランチ (default: 自動検知 — origin/HEAD → main → master)。
                        fetch + worktree base。origin がなければ local <base> を使用。
  --path, -p <dir>      worktree パス (default: .worktrees/<branch>)。
  --dry-run             実行せずに計画のみ出力。
  --no-json             報告 JSON の代わりに人読みテキストのみを stderr に。
  --help, -h            本メッセージを出力。

フロー: (origin があれば) fetch origin <base> → ff base (可能な場合) → git worktree add
<baseRef> 基準 → worktree-init.mjs chain。origin がなければ fetch/ff skip + local <base>。
`;

/* ============================================================
 * Helpers (injectable for tests)
 * ============================================================ */

export function defaultGitFn(args, opts = {}) {
  return execFileSync('git', args, {
    cwd: opts.cwd || REPO_ROOT,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: opts.timeout || 60_000,
  });
}

export function defaultNodeFn(args, opts = {}) {
  return execFileSync(process.execPath, args, {
    cwd: opts.cwd || REPO_ROOT,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: opts.timeout || 60_000,
  });
}

export function defaultExistsFn(p) {
  return existsSync(p);
}

/* ============================================================
 * Core
 * ============================================================ */

/**
 * Resolve main worktree root (where `.git` directory lives, not a worktree dir).
 */
export function resolveMainRoot(cwd, gitFn = defaultGitFn) {
  try {
    const commonDir = gitFn(['rev-parse', '--git-common-dir'], { cwd }).trim();
    if (!commonDir) return null;
    const absoluteCommonDir = resolve(cwd, commonDir);
    return dirname(absoluteCommonDir);
  } catch {
    return null;
  }
}

/**
 * Whether the given cwd is the main worktree (not a linked worktree).
 */
export function isMainWorktree(cwd, gitFn = defaultGitFn) {
  const mainRoot = resolveMainRoot(cwd, gitFn);
  if (!mainRoot) return false;
  try {
    return realpathSync(cwd) === realpathSync(mainRoot);
  } catch {
    return mainRoot === cwd;
  }
}

/**
 * Parse `git worktree list --porcelain` into a list of entries.
 * Returns: [{ path, branch, head }]
 */
export function listWorktrees(cwd, gitFn = defaultGitFn) {
  let out;
  try {
    out = gitFn(['worktree', 'list', '--porcelain'], { cwd });
  } catch {
    return [];
  }
  const entries = [];
  let cur = null;
  for (const line of out.split(/\r?\n/)) {
    if (line.startsWith('worktree ')) {
      if (cur) entries.push(cur);
      cur = { path: line.slice('worktree '.length), branch: null, head: null };
    } else if (line.startsWith('HEAD ') && cur) {
      cur.head = line.slice('HEAD '.length);
    } else if (line.startsWith('branch ') && cur) {
      const ref = line.slice('branch '.length);
      cur.branch = ref.startsWith('refs/heads/') ? ref.slice('refs/heads/'.length) : ref;
    } else if (line === '' && cur) {
      entries.push(cur);
      cur = null;
    }
  }
  if (cur) entries.push(cur);
  return entries;
}

/**
 * Whether a local branch exists.
 */
export function localBranchExists(branch, cwd, gitFn = defaultGitFn) {
  try {
    gitFn(['show-ref', '--verify', '--quiet', `refs/heads/${branch}`], { cwd });
    return true;
  } catch {
    return false;
  }
}

/**
 * Whether ref `a` is an ancestor of ref `b` (a → b is FF possible).
 */
export function isAncestor(a, b, cwd, gitFn = defaultGitFn) {
  try {
    gitFn(['merge-base', '--is-ancestor', a, b], { cwd });
    return true;
  } catch {
    return false;
  }
}

/**
 * Whether a named remote (default `origin`) is configured.
 * 外部移植: origin がない純粋なローカル repo ででの graceful degrade の中核判定。
 */
export function remoteExists(remote = 'origin', cwd, gitFn = defaultGitFn) {
  try {
    const out = gitFn(['remote'], { cwd }) || '';
    return out
      .split(/\r?\n/)
      .map((l) => l.trim())
      .includes(remote);
  } catch {
    return false;
  }
}

/**
 * Detect the repository's default base branch when `--base` is not given.
 * 優先順位:
 *   1) origin/HEAD symbolic-ref (origin があり default 設定時に最も権威的)
 *   2) ローカルの main → master の存在順
 *   3) 現在の branch (detached HEAD を除く)
 *   4) 'main' (最終 fallback)
 * 外部移植: master 基本 repo で --base がなくても正常に動作するようにする。
 */
export function detectDefaultBase(cwd, gitFn = defaultGitFn) {
  try {
    const ref = (gitFn(['symbolic-ref', '--short', 'refs/remotes/origin/HEAD'], { cwd }) || '').trim();
    if (ref.startsWith('origin/')) {
      const name = ref.slice('origin/'.length).trim();
      if (name) return name;
    }
  } catch {
    // origin/HEAD 未設定 → 次の段階
  }
  for (const cand of ['main', 'master']) {
    if (localBranchExists(cand, cwd, gitFn)) return cand;
  }
  try {
    const cur = (gitFn(['rev-parse', '--abbrev-ref', 'HEAD'], { cwd }) || '').trim();
    if (cur && cur !== 'HEAD') return cur;
  } catch {
    // detached / git 外部 → 最終 fallback
  }
  return 'main';
}

/**
 * Sanitize a branch name into a path-safe segment list.
 *   feature/foo → .worktrees/feature/foo
 */
export function defaultWorktreePath(branch) {
  return join('.worktrees', branch);
}

/**
 * Validate branch name shape (very minimal — git ref rules are more permissive).
 */
export function validateBranch(branch) {
  if (!branch || typeof branch !== 'string') return 'branch is required';
  if (branch.includes('..') || branch.includes(' ') || branch.startsWith('-')) {
    return `invalid branch: "${branch}"`;
  }
  const first = branch.split('/')[0];
  if (!KNOWN_BRANCH_PREFIXES.includes(first)) {
    return `branch should start with one of ${KNOWN_BRANCH_PREFIXES.join('|')}/ (got "${first}/")`;
  }
  return null;
}

/**
 * Step 2 helper: main worktree + checked-out base の場合、local base を origin/<base>
 * に fast-forward する。origin 不在時は FF 対象がないため SKIP (local が authoritative)。
 * non-FF divergent / FF 失敗は STOP (result.errors push + false 返却)。
 *
 * @returns {boolean} true=継続進行、false=STOP (呼び出し側が result を返却)
 */
export function ffLocalBaseIfPossible({ base, originExists, cwd, gitFn, dryRun, result }) {
  if (!isMainWorktree(cwd, gitFn)) {
    result.warnings.push(
      'invoked from a linked worktree (not main); skipped ff of local main. ' +
        `worktree は ${originExists ? `origin/${base}` : `local ${base}`} 基準で生成されます。`,
    );
    return true;
  }
  if (!originExists) {
    result.actions.push(`no 'origin' remote — skipped ff of local ${base} (local is authoritative)`);
    return true;
  }

  let currentBranch = '';
  try {
    currentBranch = gitFn(['rev-parse', '--abbrev-ref', 'HEAD'], { cwd }).trim();
  } catch {
    // ignore
  }
  if (currentBranch !== base) {
    result.warnings.push(
      `current branch is "${currentBranch}" (not ${base}); skipped ff of local ${base}. ` +
        `worktree 自体は origin/${base} 基準で生成されます。`,
    );
    return true;
  }
  if (dryRun) {
    result.actions.push(`(dry-run) would attempt ff-only merge of origin/${base} into ${base}`);
    return true;
  }

  const countOrZero = (range) => {
    try {
      return parseInt(gitFn(['rev-list', '--count', range], { cwd }).trim() || '0', 10);
    } catch {
      return 0;
    }
  };
  const localAhead = countOrZero(`origin/${base}..HEAD`);
  const localBehind = countOrZero(`HEAD..origin/${base}`);

  if (localBehind === 0) {
    result.actions.push(`local ${base} is up-to-date with origin/${base} (no ff needed)`);
    return true;
  }
  if (localAhead === 0) {
    try {
      gitFn(['merge', '--ff-only', `origin/${base}`], { cwd });
      result.actions.push(`fast-forwarded local ${base} by ${localBehind} commits`);
      return true;
    } catch (e) {
      result.errors.push(
        `fast-forward local ${base} failed: ${(e.stderr || e.message || '').toString().trim()}`,
      );
      return false;
    }
  }

  // local が unique commits を所持 — divergent。STOP (silent rebase 回避)。
  result.errors.push(
    `local ${base} diverged from origin/${base} (ahead ${localAhead}, behind ${localBehind})。` +
      `silent rebase の危険回避のため STOP。手動で reconcile させた後に再度お試しください。`,
  );
  result.errors.push(
    `hint (brief2dev R-CM-008 整合復旧 — rebase/merge は destructive-git-guard 遮断 + main 直接フローのため非推奨): ` +
      `1) git format-patch origin/${base}..HEAD -o .tmp/git-backup/ (ローカルの unique commits patch バックアップ) ` +
      `2) git reset --hard origin/${base} (ユーザーが直接実行 — destructive-git-guard が AI を遮断) ` +
      `3) make wt.new BR=feature/<task> 再試行 (diverge 解消後に成功) ` +
      `4) worktree 内で git am <main>/.tmp/git-backup/*.patch (オリジナル author/message/timestamp 保存) ` +
      `5) /create-pr ship-worktree。`,
  );
  return false;
}

/* ============================================================
 * Main orchestrator (testable)
 * ============================================================ */

export function runWorktreeNew(opts) {
  const {
    branch,
    base = 'main',
    path: explicitPath = null,
    dryRun = false,
    cwd = REPO_ROOT,
    gitFn = defaultGitFn,
    nodeFn = defaultNodeFn,
    existsFn = defaultExistsFn,
  } = opts;

  const result = {
    ok: false,
    branch,
    base,
    base_sha: null,
    worktree_path: null,
    plan_path: null,
    actions: [],
    warnings: [],
    errors: [],
    dry_run: dryRun,
  };

  const branchErr = validateBranch(branch);
  if (branchErr) {
    result.errors.push(branchErr);
    return result;
  }

  const wtPathRel = explicitPath || defaultWorktreePath(branch);
  const wtPathAbs = resolve(cwd, wtPathRel);
  result.worktree_path = wtPathAbs;

  // origin リモートの有無 → graceful degrade。なければ fetch/FF を skip し local <base> を
  // worktree base として使用する (外部の純粋なローカル repo 互換)。origin があれば従来の freshness フロー。
  const originExists = remoteExists('origin', cwd, gitFn);
  const baseRef = originExists ? `origin/${base}` : base;

  // origin 不在 + local base ブランチも不在 → 進行不可 (base 指定案内)。
  // dry-run も検査する (show-ref は read-only) — 失敗する計画を ok と表示しないように
  // 正確に preview (code-review LOW: misleading dry-run plan 解消)。
  if (!originExists && !localBranchExists(base, cwd, gitFn)) {
    result.errors.push(
      `no 'origin' remote であり、かつ local branch "${base}" もありません。` +
        `--base <既存の branch> で指定するか、origin を設定してください。(git remote -v)`,
    );
    return result;
  }

  // Step 1: fetch origin <base> (origin がある場合のみ)
  if (originExists) {
    const cacheDir = join(cwd, '.brief2dev', 'system'); // @layout-resolver-allow
    const cacheFile = join(cacheDir, `fetch-cache-${base}.json`);
    let shouldFetch = true;
    const FETCH_TTL = 60_000; // 60s

    if (existsFn(cacheFile)) {
      try {
        const cacheData = JSON.parse(readFileSync(cacheFile, 'utf-8'));
        const age = Date.now() - (cacheData.timestamp || 0);
        if (age < FETCH_TTL) {
          shouldFetch = false;
          result.actions.push(`fetch origin skipped (cached within 60s)`);
        }
      } catch {
        // ignore and fetch
      }
    }

    if (shouldFetch) {
      result.actions.push(`fetch origin ${base}`);
      if (!dryRun) {
        try {
          gitFn(['fetch', 'origin', base], { cwd, timeout: 60_000 });
          try {
            if (!existsSync(cacheDir)) {
              mkdirSync(cacheDir, { recursive: true });
            }
            writeFileSync(cacheFile, JSON.stringify({ timestamp: Date.now() }));
          } catch {
            // ignore cache write error
          }
        } catch (e) {
          result.errors.push(
            `fetch origin ${base} failed: ${(e.stderr || e.message || '').toString().trim()}`,
          );
          result.errors.push('hint: ネットワーク / origin 設定を確認のうえ再試行してください。(git remote -v)');
          return result;
        }
      }
    }
  } else {
    result.actions.push(`no 'origin' remote — skipped fetch; using local ${base} as base`);
  }

  // Resolve base SHA for reporting + base for worktree add (baseRef = origin/<base> または local <base>)
  if (!dryRun) {
    try {
      result.base_sha = gitFn(['rev-parse', baseRef], { cwd }).trim();
    } catch (e) {
      result.errors.push(`rev-parse ${baseRef} failed: ${(e.message || '').trim()}`);
      return result;
    }
  }

  // Step 2: FF local base to origin/<base> when in main worktree (origin がある場合のみ)
  if (!ffLocalBaseIfPossible({ base, originExists, cwd, gitFn, dryRun, result })) {
    return result;
  }

  // Step 3: git worktree add
  const existingWorktrees = listWorktrees(cwd, gitFn);
  const matchingWtForPath = existingWorktrees.find(
    (w) => resolve(w.path) === resolve(wtPathAbs),
  );
  const matchingWtForBranch = existingWorktrees.find((w) => w.branch === branch);

  if (matchingWtForPath && matchingWtForPath.branch === branch) {
    // べき等: 同一 path + 同一 branch — すでに登録された worktree、skip add でそのまま init へ。
    result.warnings.push(
      `worktree already registered at ${wtPathRel} on branch ${branch} (skipped add — idempotent).`,
    );
    result.actions.push('skip git worktree add (idempotent)');
  } else if (matchingWtForPath) {
    result.errors.push(
      `path ${wtPathRel} が別の branch (${matchingWtForPath.branch}) の worktree として登録されています。` +
        `先に git worktree remove ${wtPathRel} の後に再試行してください。`,
    );
    return result;
  } else if (matchingWtForBranch) {
    result.errors.push(
      `branch ${branch} はすでに別の worktree (${matchingWtForBranch.path}) にチェックアウトされています。` +
        `同一の branch は 1 worktree のみ許容 — 別の path を使用するか、既存の worktree を整理してください。`,
    );
    return result;
  } else if (localBranchExists(branch, cwd, gitFn)) {
    // すでにローカル branch が存在 — base との FF 可能性を確認後に add。
    if (!isAncestor(baseRef, branch, cwd, gitFn)) {
      result.warnings.push(
        `local branch "${branch}" がすでに存在し、かつ ${baseRef} の後継ではありません。` +
          `既存の branch そのままで worktree 追加 (base 強制しない) — stale の可能性あり。`,
      );
    }
    result.actions.push(`git worktree add ${wtPathRel} (existing branch ${branch})`);
    if (!dryRun) {
      try {
        gitFn(['worktree', 'add', wtPathAbs, branch], { cwd, timeout: 60_000 });
      } catch (e) {
        result.errors.push(
          `git worktree add failed: ${(e.stderr || e.message || '').toString().trim()}`,
        );
        return result;
      }
    }
  } else {
    result.actions.push(
      `git worktree add ${wtPathRel} -b ${branch} ${baseRef}`,
    );
    if (!dryRun) {
      try {
        gitFn(['worktree', 'add', wtPathAbs, '-b', branch, baseRef], {
          cwd,
          timeout: 60_000,
        });
      } catch (e) {
        result.errors.push(
          `git worktree add failed: ${(e.stderr || e.message || '').toString().trim()}`,
        );
        return result;
      }
    }
  }

  // Step 4: worktree-init.mjs chain
  const initScript = join(cwd, '.claude/scripts/worktree-init.mjs');
  if (!existsFn(initScript)) {
    result.warnings.push(
      `worktree-init.mjs not found at ${initScript} — skipped symlink + PLAN.md auto-creation.`,
    );
  } else {
    result.actions.push(`node worktree-init.mjs --worktree ${wtPathRel}`);
    if (!dryRun) {
      try {
        const out = nodeFn([initScript, '--worktree', wtPathAbs], { cwd, timeout: 30_000 });
        // worktree-init prints PLAN.md path on creation — parse for reporting.
        const planMatch = out.match(/PLAN\.md (?:自動生成|すでに存在[^:]*): (.+)/);
        if (planMatch) {
          result.plan_path = resolve(wtPathAbs, planMatch[1].trim());
        }
      } catch (e) {
        result.errors.push(
          `worktree-init.mjs failed: ${(e.stderr || e.message || '').toString().trim()}`,
        );
        return result;
      }
    }
  }

  result.ok = true;
  return result;
}

/* ============================================================
 * CLI entry
 * ============================================================ */

/**
 * 2つのパスが (symlink 解釈後) 同一のファイルを指すか判定。
 * import.meta.url は realpath を返却するが、process.argv[1] は symlink パスの場合があり、
 * (例: /tmp → /private/var シンボリック、または symlink で露出されたスクリプト) 単純比較時に mismatch
 * → CLI 進入が silently に SKIP される。両方に realpath を適用して symlink パス実行も検知。
 */
export function isSamePath(p1, p2, realpathFn = realpathSync) {
  if (!p1 || !p2) return false;
  const a = resolve(p1);
  const b = resolve(p2);
  if (a === b) return true;
  try {
    return realpathFn(a) === realpathFn(b);
  } catch {
    return false;
  }
}

function isMain() {
  return isSamePath(process.argv[1], __filename);
}

if (isMain()) {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    console.error(HELP);
    process.exit(2);
  }

  if (args.help) {
    console.log(HELP);
    process.exit(0);
  }

  if (!args.branch) {
    console.error('--branch <name> is required.');
    console.error(HELP);
    process.exit(2);
  }

  // Always operate from main worktree root so .worktrees/ 配下が一致する。
  // (worktree 内で呼び出しても main repo の .worktrees/<branch> として生成される)
  const invocationCwd = process.cwd();
  const mainRoot = resolveMainRoot(invocationCwd) || invocationCwd;

  // --base 未指定時は repo の default branch を自動検知 (master 基本 repo 互換)。
  const base = args.base || detectDefaultBase(mainRoot);

  const result = runWorktreeNew({
    branch: args.branch,
    base,
    path: args.path,
    dryRun: args.dryRun,
    cwd: mainRoot,
  });

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    for (const a of result.actions) console.error(`[worktree-new] ${a}`);
    for (const w of result.warnings) console.error(`[worktree-new][warn] ${w}`);
    for (const e of result.errors) console.error(`[worktree-new][error] ${e}`);
    if (result.ok) {
      console.error(
        `[worktree-new] OK — worktree at ${result.worktree_path} (base ${result.base_sha || 'origin/' + result.base}).`,
      );
    }
  }

  process.exit(result.ok ? 0 : 1);
}
