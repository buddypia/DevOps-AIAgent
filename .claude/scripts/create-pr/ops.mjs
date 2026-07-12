#!/usr/bin/env node

/**
 * ops.mjs — create-pr 統合実行エンジン (8 コマンド, GitHub Flow, v2 応答契約)
 *
 * コマンド:
 *   Mode A (Staged 隔離):  init / isolate / commit / ship-feature / finalize
 *   Mode B (Worktree):    verify-plan / ship-worktree / cleanup-worktree
 *
 * 出力契約 (v2): stdout JSON 1行
 *   成功: { ok: true,  mode, command, ... }                   (exit 0)
 *   失敗: { ok: false, mode, command, error, hint?, details? } (exit 1)
 *
 *   sync_status 値: synced | fetch_failed | local_changes | ff_failed
 *
 * Config: .claude/skills/create-pr/config.json
 *   { github_account, base_branch, enforce_ssh_remote? }  (base_branch デフォルト main)
 *
 * 鉄則: unstaged/untracked ファイルは実行前後で正確に同一でなければならない。
 *   - worktree 隔離: オリジナル HEAD 不変
 *   - dirty main 時の sync abort: オリジナルの変更に手を加えず同期のみ中断 (自動 stash 未使用)
 *
 * セキュリティ: すべての外部コマンドは execFileSync 配列引数 → shell 非経由。
 *
 * フック連動: cmdInit が .tmp/create-pr-active フラグを生成 →
 *   commit-guard.mjs / destructive-git-guard.mjs が allowlist モードに転換。
 *   cmdFinalize / cmdCleanupWorktree 終了時にフラグを自動除去。
 */

import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, writeFileSync, readFileSync, rmSync, statSync, readdirSync } from 'node:fs';
import { basename, join, resolve, dirname, isAbsolute, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveWorktreePlanPath } from '../../../.cli/lib/worktree-plan-path.mjs';
import { parseUncheckedPlanItems } from '../../../.cli/lib/worktree-plan-status.mjs';
import {
  buildFileTree,
  buildPostApprovalCompletionReport,
} from '../../../.cli/lib/worktree-ship-report.mjs';
import {
  getActiveRunPath,
  getPipelineDataRoot,
  getRunsRoot,
  hasBrief2devMarker,
} from '../../../.cli/lib/layout-resolver.mjs';

export { buildFileTree };

// ═ Paths + Config ═
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Project root 算出。マルチ worktree 環境で AI が worktree 内部から ops.mjs を
 * 直接呼び出しても main worktree root を回復するように保証。
 *
 * 優先順位:
 *   1. `process.env.CLAUDE_PROJECT_DIR` — 明示 override (テスト / ユーザー指定)。
 *   2. `git rev-parse --git-common-dir` 親 — すべての worktree が同一の main root に回帰。
 *      `.git` ディレクトリは main worktree 内に本体があり、他の worktree は
 *      `.git` ファイルで main の common-dir を指す。親 = main worktree root。
 *   3. `__dirname` 基準 fallback — worktree 内での呼び出し時に worktree ルートに落ちてしまう
 *      罠があるための最終 fallback (従来の動作互換用 — git 外部実行環境)。
 *
 * 回帰: tests/unit/create-pr-ops.test.mjs `resolveProjectRoot` describe block.
 */
export function resolveProjectRoot(cwd = process.cwd()) {
  if (process.env.CLAUDE_PROJECT_DIR) return process.env.CLAUDE_PROJECT_DIR;
  try {
    const commonDir = execFileSync('git', ['rev-parse', '--git-common-dir'], {
      cwd,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    // 空の stdout または '.' のみでは親の推論に意味がない — silent worktree-root
    // fallback の罠が再現されるため、明示的に fallback へ送り、stderr に痕跡を残す。
    if (commonDir && commonDir !== '.' && commonDir !== '') {
      return dirname(resolve(cwd, commonDir));
    }
    process.stderr.write(
      `[ops.mjs] resolveProjectRoot: git common-dir empty (cwd=${cwd}), falling back to __dirname-based path.\n`,
    );
  } catch {
    // git 外部 / git 未インストール — __dirname fallback へ
  }
  return resolve(__dirname, '..', '..', '..');
}

const PROJECT_DIR = resolveProjectRoot();
const STATE_DIR = join(PROJECT_DIR, '.tmp', 'create-pr');
const ACTIVE_FLAG = join(PROJECT_DIR, '.tmp', 'create-pr-active');
const WT_DIR = join(STATE_DIR, 'wt');
const PATCH_FILE = join(STATE_DIR, 'patch');
const BRANCH_FILE = join(STATE_DIR, 'branch');
const MSG_FILE = join(STATE_DIR, 'msg');
const BODY_FILE = join(STATE_DIR, 'body');
const CONFIG_PATH = join(PROJECT_DIR, '.claude', 'skills', 'create-pr', 'config.json');

const CFG = existsSync(CONFIG_PATH) ? JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')) : {};
const BASE_BRANCH = CFG.base_branch || 'main';
const GH_ACCOUNT = CFG.github_account || null;
const ENFORCE_SSH = CFG.enforce_ssh_remote === true;

// v2.1: 30s → 30min。ship-feature は MERGEABLE_TIMEOUT_MS=5min の間 polling するため
// 30s threshold は活発に動作中の ship-feature 直後に他のコマンドが flag を stale と
// 判断し、同時進入保護を迂回する事故を誘発する。30min は単一ユーザー CLI の
// 合理的なサイクル上限。
// export: デグレードテストが import してヘルパーの複製なしで検証。
export const ACTIVE_FLAG_STALE_MS = 30 * 60 * 1000;
const MERGEABLE_TIMEOUT_MS = 300_000;
const MERGEABLE_POLL_MS = 5_000;

// ═ Shell ═
// ネットワーク transient エラーパターン — ポート遮断/ホットスポット不安定時の gh・git 呼び出しの *一時的* 失敗。
// 論理エラー ("already exists" / merge conflict / auth) は含めない — 再試行しても同一の結果。
// export: デグレードテストがヘルパーの複製なしで直接検証。
const TRANSIENT_ERROR_PATTERNS = [
  /ETIMEDOUT/i,
  /ECONNRESET/i,
  /ENETUNREACH/i,
  /EAI_AGAIN/i,
  /ENOTFOUND/i,
  /timed out/i,
  // /timeout/i は意図的に除外 — GitHub API 422 検証エラー ("...timeout: 0" など) を false-transient
  // として誤って再試行するのを防ぐ。実際の timeout は /timed out/・ETIMEDOUT・/TLS handshake/・以下の Go http client でカバー。
  /Client\.Timeout exceeded/i,
  /TLS handshake/i,
  /connection reset/i,
  /reset by peer/i,
  /connection closed/i,
  /could not resolve host/i,
  /temporary failure in name resolution/i,
  /banner exchange/i,
  /kex_exchange_identification/i,
  /Could not read from remote repository/i,
  /Connection refused/i,
];

export function isTransient(err) {
  const msg = String(err && err.message ? err.message : err == null ? '' : err);
  return TRANSIENT_ERROR_PATTERNS.some((re) => re.test(msg));
}

function defaultSleepSeconds(sec) {
  if (!(sec > 0)) return;
  try {
    execFileSync('sleep', [String(sec)], { stdio: 'ignore' });
  } catch {
    /* sleep 失敗は無視 — 再試行を進行 (delay 0 に降格) */
  }
}

// transient ネットワークエラーのみ再試行。論理エラーは即時 throw (再試行は無意味)。
// opts.sleep 注入によりテストは実際の待機なしで検証。
export function retryTransient(fn, opts = {}) {
  const attempts = Number.isInteger(opts.attempts) && opts.attempts > 0 ? opts.attempts : 3;
  const sleep = typeof opts.sleep === 'function' ? opts.sleep : defaultSleepSeconds;
  const baseDelaySec = Number.isFinite(opts.baseDelaySec) ? opts.baseDelaySec : 2;
  let lastErr;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return fn();
    } catch (e) {
      lastErr = e;
      if (attempt >= attempts || !isTransient(e)) throw e;
      sleep(Math.min(baseDelaySec * attempt, 8)); // 2s → 4s → 6s (上限 8s)
    }
  }
  throw lastErr;
}

function execOnce(cmd, opts = {}) {
  try {
    const r = execFileSync(cmd[0], cmd.slice(1), {
      cwd: opts.cwd || PROJECT_DIR,
      encoding: opts.raw ? 'buffer' : 'utf-8',
      timeout: opts.timeout ?? 30_000,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: opts.env || process.env,
      maxBuffer: opts.maxBuffer ?? 256 * 1024 * 1024,
    });
    return opts.raw ? r : (typeof r === 'string' ? r : r.toString('utf-8')).trim();
  } catch (e) {
    const stderr = (e.stderr || '').toString().trim();
    throw new Error(`${cmd[0]} failed: ${stderr || e.message}`);
  }
}

// opts.retry > 1 の時のみ transient 再試行 (ネットワーク呼び出し — gh / git fetch・push)。
// ローカル呼び出し (git status / rev-parse / make q.check) は retry 未指定 → 即時 fail-fast。
function exec(cmd, opts = {}) {
  if (opts.retry && opts.retry > 1) {
    return retryTransient(() => execOnce(cmd, opts), { attempts: opts.retry, sleep: opts.sleep });
  }
  return execOnce(cmd, opts);
}

const git = (args, opts = {}) => exec(['git', ...args], opts);

/**
 * github_account 未設定時は gh CLI のデフォルトログインアカウントをそのまま使用する
 * (config.json _adapt / SKILL.md / transplant-bundles.json が文書化した契約)。
 * 純粋関数に分離 — gh CLI 実行なしでコマンド構成ロジックのみを単体テスト可能。
 */
export function buildGhTokenCommand(ghAccount) {
  return ghAccount ? ['gh', 'auth', 'token', '-u', ghAccount] : ['gh', 'auth', 'token'];
}

let cachedToken = null;
function ghToken() {
  if (cachedToken) return cachedToken;
  const tokenCmd = buildGhTokenCommand(GH_ACCOUNT);
  // gh() の env 構成段階で eager 呼び出しされ、exec の retry scope 外であるため直接 retryTransient.
  // (gh auth token はローカルキーリング参照のため通常はネットワークと無関係だが、最初の gh() 呼び出しの transient ギャップを遮断。)
  try {
    cachedToken = retryTransient(() => exec(tokenCmd), { attempts: 3 });
  } catch (e) {
    const err = new Error(
      `gh 認証トークン照会失敗 (${GH_ACCOUNT ? `アカウント: ${GH_ACCOUNT}` : 'デフォルトログインアカウント'}): ${e.message}`
    );
    err.details = { hint: `gh auth login 状態を確認、または config.github_account にてアカウントを明示: ${CONFIG_PATH}` };
    throw err;
  }
  return cachedToken;
}

const gh = (args, opts = {}) => exec(['gh', ...args], {
  timeout: 60_000,
  retry: 3, // すべての gh 呼び出しは api.github.com transient (TLS handshake timeout など) 再試行。opts.retry で override。
  ...opts,
  env: { ...process.env, GH_TOKEN: ghToken(), GH_HOST: 'github.com' },
});

function resolveRepo() {
  const url = git(['remote', 'get-url', 'origin']);
  const m = url.match(/[:/]([^:/]+\/[^/]+?)(?:\.git)?$/);
  if (!m) throw new Error(`origin URL パース失敗: ${url}`);
  return m[1];
}

/**
 * `--worktree <p>` 引数を PROJECT_DIR 基準の絶対パスに正規化する。
 * 絶対パス入力はそのまま返却 (false-prepend 回避)。
 * デグレード遮断: tests/unit/create-pr-ops.test.mjs
 */
export function resolveWorktreeAbsPath(wtPath) {
  if (!wtPath) return wtPath;
  return isAbsolute(wtPath) ? wtPath : join(PROJECT_DIR, wtPath);
}

/**
 * `git worktree list --porcelain` 出力から worktree 絶対パスの一覧を抽出。
 * Pure parser — テスト可能。
 *
 * 入力例:
 *   worktree /a/main
 *   HEAD abc...
 *   branch refs/heads/main
 *
 *   worktree /a/main/.worktrees/feature/foo
 *   HEAD def...
 *   branch refs/heads/feature/foo
 *
 * 正確なマッチング (`^worktree (.+)$`) により、将来的な git の他の `worktree` 開始の prefix
 * 拡張 (例: 仮定的な `worktree-config-file ...`) と衝突しないように保護。
 * 空の path は capture group の結果として自動除外。
 *
 * @param {string} porcelainOutput
 * @returns {string[]}
 */
const WORKTREE_LINE_RE = /^worktree (.+)$/;

export function parseWorktreePaths(porcelainOutput) {
  if (!porcelainOutput) return [];
  const paths = [];
  for (const line of porcelainOutput.split(/\r?\n/)) {
    const match = WORKTREE_LINE_RE.exec(line);
    if (match) {
      // `.trim()` は trailing whitespace 防御用 — git porcelain は trailing space
      // がないのが正常だが、capture group が吸い込む場合を考慮 (no-op 同等)。
      const path = match[1].trim();
      if (path) paths.push(path);
    }
  }
  return paths;
}

/**
 * `git status --porcelain` 出力を dirty/clean に分類する。Pure parser — テスト可能。
 *
 * Untracked ファイル (`?? path`) は意図的に除外 — ユーザーの ad-hoc 作業物でありマージ結果と
 * 衝突する変更ではない。マージ結果の ff を防ぐのは tracked file の unstaged/staged 変更。
 *
 * @param {string} porcelain - `git status --porcelain` の stdout
 * @returns {{status: 'clean'|'dirty', dirty_paths?: string[]}}
 */
export function parsePorcelainStatus(porcelain) {
  if (!porcelain || !porcelain.trim()) return { status: 'clean' };
  const dirty_paths = porcelain
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('??'))
    .map((line) => {
      const rest = line.slice(3).trim();
      // ff merge 影響は rename の new path 側なので、それのみを dirty_paths に報告。
      const arrow = rest.indexOf(' -> ');
      return arrow >= 0 ? rest.slice(arrow + 4).trim() : rest;
    })
    .filter(Boolean);
  return dirty_paths.length > 0 ? { status: 'dirty', dirty_paths } : { status: 'clean' };
}

/**
 * マージ成功後、main repo (PROJECT_DIR) の working tree dirty 状態を検知する。
 * ユーザーが main repo で squash merge 結果と衝突する unstaged 変更を所持していると
 * `git pull --ff-only` 失敗 — AI が該当状態を認知して初めて明示的な reconcile 案内が可能。
 *
 * git 呼び出し失敗は fail-open ('unknown') — ship 結果自体に影響なし。
 *
 * @returns {{status: 'clean'|'dirty'|'unknown', dirty_paths?: string[]}}
 */
export function detectPostMergeMainStatus(cwd = PROJECT_DIR) {
  try {
    const status = git(['status', '--porcelain'], { cwd, timeout: 5_000 });
    return parsePorcelainStatus(status);
  } catch {
    return { status: 'unknown' };
  }
}

// ═ Pure helpers (テスト可能) ═

/**
 * マージされた PR の変更ファイル一覧を収集。gh CLI 呼び出し。
 * 失敗時は空の配列 (中核のマージ結果に影響なし — fail-open)。
 */
function collectChangedFilesViaPr(prNumber, repo) {
  try {
    const out = gh(['pr', 'view', String(prNumber), '--repo', repo, '--json', 'files']);
    const data = JSON.parse(out);
    if (!Array.isArray(data?.files)) return [];
    return data.files.map(f => f?.path).filter(p => typeof p === 'string' && p.length > 0);
  } catch {
    return [];
  }
}

function deleteBranchAndStashes(branch) {
  if (!branch) return;
  try {
    const list = git(['stash', 'list']).split('\n').filter(Boolean);
    const toDrop = [];
    list.forEach((line, idx) => {
      const match = line.match(/^(?:stash@\{\d+\}:\s+)?(?:On|WIP on)\s+([^\s:]+):\s*auto-checkpoint/);
      if (match && match[1] === branch) toDrop.push(idx);
    });
    toDrop.reverse().forEach(idx => {
      try { git(['stash', 'drop', `stash@{${idx}}`]); } catch {}
    });
  } catch {}
  try { git(['branch', '-D', branch]); } catch {}
}

// PLAN.md parser SSOT. Re-exported for legacy tests / callers.
export const parseUnchecked = parseUncheckedPlanItems;

// AI コンテキストの分岐の明確化
const STAGED_CMDS = new Set(['init', 'isolate', 'commit', 'ship-feature', 'finalize']);
const WORKTREE_CMDS = new Set(['verify-plan', 'ship-worktree', 'cleanup-worktree']);
function inferMode(command) {
  if (STAGED_CMDS.has(command)) return 'staged';
  if (WORKTREE_CMDS.has(command)) return 'worktree';
  return null;
}

// 同時実行保護: 30秒以内 active flag = 他のセッション進行中
function isStaleActiveFlag(flagPath, now = Date.now(), thresholdMs = ACTIVE_FLAG_STALE_MS) {
  if (!existsSync(flagPath)) return true;
  try {
    const mtime = statSync(flagPath).mtimeMs;
    return (now - mtime) > thresholdMs;
  } catch { return true; }
}

// ═ Args ═
function parseArgs(tokens) {
  const opts = {};
  for (let i = 0; i < tokens.length; i++) {
    if (!tokens[i].startsWith('--')) continue;
    const key = tokens[i].slice(2);
    opts[key] = (tokens[i + 1] && !tokens[i + 1].startsWith('--')) ? tokens[++i] : true;
  }
  return opts;
}
function requireArg(args, key, { type = 'string' } = {}) {
  const v = args[key];
  if (v === undefined) throw new Error(`--${key} is required`);
  if (type === 'string' && typeof v !== 'string') {
    throw new Error(`--${key} requires a value (got: ${v}). 使用法: --${key} <value>`);
  }
  return v;
}

// ═ State ═
const readBranch = () => {
  if (!existsSync(BRANCH_FILE)) throw new Error('セッションなし。isolate を先に実行');
  return readFileSync(BRANCH_FILE, 'utf-8').trim();
};

function autoCleanup() {
  try { if (existsSync(ACTIVE_FLAG)) rmSync(ACTIVE_FLAG); } catch {}
  if (!existsSync(STATE_DIR)) return;
  if (existsSync(WT_DIR)) {
    try { git(['worktree', 'remove', WT_DIR, '--force']); } catch {}
    try { git(['worktree', 'prune']); } catch {}
  }
  if (existsSync(BRANCH_FILE)) {
    const branch = readFileSync(BRANCH_FILE, 'utf-8').trim();
    if (branch) { try { git(['branch', '-D', branch]); } catch {} }
  }
  rmSync(STATE_DIR, { recursive: true, force: true });
}

// Pre-Ship Review マーカーライフサイクル (R-CM-030)
// 正常な ship 成功時に即時 unlink、cleanup-worktree 進入時に stale GC にて cancelled フローの累積を防止。
const SHIP_REVIEW_MARKER_PREFIX = 'pre-ship-review-confirmed-';
const SHIP_REVIEW_MARKER_MAX_AGE_MS = 60 * 60 * 1000;
export function shipReviewMarkerKey(branchOrPath) {
  if (!branchOrPath) return 'staged';
  const parts = String(branchOrPath).split(/[/\\]/).filter(Boolean);
  const idx = parts.lastIndexOf('.worktrees');
  const branch = (idx >= 0 && parts.length > idx + 2)
    ? parts.slice(idx + 1, idx + 3).join('/')
    : parts.length >= 2 ? parts.slice(-2).join('/') : parts[0];
  return branch.replace(/[/\\]/g, '__');
}
function unlinkShipReviewMarker(branchOrPath) {
  const key = shipReviewMarkerKey(branchOrPath);
  const path = join(PROJECT_DIR, '.tmp', `${SHIP_REVIEW_MARKER_PREFIX}${key}`);
  try { if (existsSync(path)) rmSync(path, { force: true }); } catch {}
}
function gcStaleShipReviewMarkers(maxAgeMs = SHIP_REVIEW_MARKER_MAX_AGE_MS) {
  const dir = join(PROJECT_DIR, '.tmp');
  if (!existsSync(dir)) return;
  try {
    for (const name of readdirSync(dir)) {
      if (!name.startsWith(SHIP_REVIEW_MARKER_PREFIX)) continue;
      const p = join(dir, name);
      try {
        if (Date.now() - statSync(p).mtime.getTime() > maxAgeMs) rmSync(p, { force: true });
      } catch {}
    }
  } catch {}
}

// SSH remote 検査 (config.enforce_ssh_remote による opt-in)
function checkSshRemoteIfRequired() {
  if (!ENFORCE_SSH) return;
  const remoteUrl = git(['remote', 'get-url', 'origin']);
  const isSsh = remoteUrl.startsWith('git@') || remoteUrl.startsWith('ssh://');
  if (!isSsh) {
    const err = new Error('origin が SSH remote ではありません');
    err.details = {
      remote_url: remoteUrl,
      hint: 'config.enforce_ssh_remote=true の場合、SSH alias remote が必要。git remote set-url にて切り替え後に再試行してください。',
    };
    throw err;
  }
}

/**
 * make ターゲットの存在有無を確認 (`make -n <target>` dry-run — 実際のレシピ実行なしで rule 探索のみ)。
 * Makefile 不在 / ターゲット不在はすべて false。移植されたプロジェクト(brief2dev 専用 `q.ci-mirror` などソフト
 * 参照ターゲット)がそのターゲットを持たない場合を検知し、ハードエラーの代わりに graceful にスキップするためのヘルパー。
 * デグレード: tests/unit/create-pr-ops.test.mjs `makeTargetExists` describe block。
 */
export function makeTargetExists(target, cwd) {
  try {
    execFileSync('make', ['-n', target], { cwd, stdio: 'pipe', encoding: 'utf-8', timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

// ═ Mode A: Staged 隔離 ═

function cmdInit() {
  if (!isStaleActiveFlag(ACTIVE_FLAG)) {
    const err = new Error('他の create-pr セッションが進行中です (30秒以内 active flag)。');
    err.details = { hint: '進行中のセッション終了を待つか、.tmp/create-pr-active を手動で整理した後に再試行してください' };
    throw err;
  }
  autoCleanup();

  // CI Mirror Gate (60min stamp freshness)。brief2dev 自体は `make q.ci-mirror` を持つが、
  // 移植されたプロジェクト (transplant-bundle) はそのターゲットがない場合がある — ソフト参照のためターゲット
  // 不在時はゲート自体を skip する (ハードエラー禁止、adaptation_notes 整合)。
  const CI_MIRROR_STAMP = join(PROJECT_DIR, '.tmp', 'ci-mirror-passed');
  const STAMP_FRESHNESS_MS = 60 * 60 * 1000;
  let stampValid = false;
  if (existsSync(CI_MIRROR_STAMP)) {
    try {
      if (Date.now() - statSync(CI_MIRROR_STAMP).mtime.getTime() <= STAMP_FRESHNESS_MS) {
        stampValid = true;
      }
    } catch {}
  }
  if (!stampValid && makeTargetExists('q.ci-mirror', PROJECT_DIR)) {
    try {
      execFileSync('make', ['q.ci-mirror'], {
        cwd: PROJECT_DIR, stdio: 'pipe', encoding: 'utf-8', timeout: 600_000,
      });
    } catch (e) {
      const stdout = e.stdout || '';
      const stderr = e.stderr || '';
      const err = new Error(
        `CI ミラー (make q.ci-mirror) 失敗。create-pr スキルで自動修正ループを開始するか、 ` +
        `手動修正後に再試行してください。\n\n[STDOUT]\n${stdout}\n[STDERR]\n${stderr}`
      );
      err.details = { stdout, stderr };
      throw err;
    }
  }

  const branch = git(['branch', '--show-current']);
  if (branch !== BASE_BRANCH) throw new Error(`現在のブランチが ${BASE_BRANCH} ではありません: ${branch}`);

  const stagedFiles = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean);
  if (stagedFiles.length === 0) throw new Error('staged ファイルなし');

  const secretPattern = /\.(env|key|pem|p12|keystore)$|(^|\/)credentials\.json$|service-account/;
  const secrets = stagedFiles.filter(f => secretPattern.test(f));
  if (secrets.length) {
    const err = new Error(`機密ファイル検知: ${secrets.join(', ')}`);
    err.details = { secrets };
    throw err;
  }

  checkSshRemoteIfRequired();
  ghToken();

  const warnings = [];
  try {
    git(['fetch', 'origin', BASE_BRANCH], { timeout: 30_000, retry: 3 });
  } catch (e) {
    warnings.push(`リモート fetch 失敗: ${e.message}。最新性未検証。`);
  }
  try {
    const localSha = git(['rev-parse', 'HEAD']);
    const remoteSha = git(['rev-parse', `origin/${BASE_BRANCH}`]);
    if (localSha !== remoteSha) {
      const ahead = parseInt(git(['rev-list', '--count', `origin/${BASE_BRANCH}..HEAD`]) || '0', 10);
      const behind = parseInt(git(['rev-list', '--count', `HEAD..origin/${BASE_BRANCH}`]) || '0', 10);
      if (ahead > 0) {
        throw new Error(
          `ローカル ${BASE_BRANCH} が origin/${BASE_BRANCH} より ${ahead} コミット先行しています。` +
          `先に push/PR 処理した後に再試行してください。(自動 push は意図しないコミット伝播の危険性のため無効化されています)`
        );
      }
      if (behind > 0) {
        warnings.push(
          `ローカル ${BASE_BRANCH} が origin/${BASE_BRANCH} より ${behind} コミット遅れています。` +
          `finalize が ff-merge で自動同期予定。PR マージ時に衝突の可能性あり。`
        );
      }
    }
  } catch (e) {
    if (e.message.includes('先行')) throw e;
    warnings.push(`最新性比較失敗: ${e.message}`);
  }

  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(join(STATE_DIR, '.gitignore'), '*\n');
  writeFileSync(PATCH_FILE, exec(['git', 'diff', '--cached', '--binary'], { raw: true }));
  writeFileSync(ACTIVE_FLAG, String(Date.now()));

  return { ok: true, stagedFiles, baseCommit: git(['rev-parse', 'HEAD']), warnings };
}

function cmdIsolate(args) {
  const branchName = requireArg(args, 'branch');
  if (!existsSync(PATCH_FILE)) throw new Error('先に init を実行してください');

  git(['worktree', 'add', '-b', branchName, WT_DIR, 'HEAD']);
  writeFileSync(BRANCH_FILE, branchName);
  git(['apply', '--index', PATCH_FILE], { cwd: WT_DIR });

  writeFileSync(ACTIVE_FLAG, String(Date.now()));
  return { ok: true, branch: branchName, worktreeDir: WT_DIR };
}

function cmdCommit(args) {
  const message = requireArg(args, 'message');
  const files = (typeof args.files === 'string') ? args.files.split(',') : null;
  if (!existsSync(WT_DIR)) throw new Error('worktree なし。先に isolate を実行してください');

  writeFileSync(MSG_FILE, message);
  const cmdArgs = files
    ? ['commit', '--only', '-F', MSG_FILE, '--', ...files]
    : ['commit', '-F', MSG_FILE];
  git(cmdArgs, { cwd: WT_DIR });

  writeFileSync(ACTIVE_FLAG, String(Date.now()));
  return { ok: true, sha: git(['rev-parse', 'HEAD'], { cwd: WT_DIR }).slice(0, 7) };
}

// べき等 PR 生成: 同一 head の open PR があれば再利用 + title/body アップデート。
// gh() が transient (TLS timeout など) を再試行するため、list の一時的失敗が空の結果のように見え、
// 重複 create → "already exists" で停止する罠を遮断。create "already exists" も再検知で復旧。
// ghFn 注入 (default gh) — デグレードテストが already-exists 復旧シナリオを stub で検証
// (detectExternalSupersetRisk の gitFn 注入パターンと同一)。
export function getOrCreatePr({ base, head, title, body, repo }, ghFn = gh) {
  // ship-worktree 単独呼び出し時は STATE_DIR 不在の可能性あり (init 非依存)。べき等 mkdir。
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(BODY_FILE, body);

  const findExistingPr = () => {
    const existing = ghFn([
      'pr', 'list', '--repo', repo, '--head', head, '--state', 'open',
      '--json', 'number,url',
    ]);
    const parsed = JSON.parse(existing);
    return Array.isArray(parsed) && parsed.length > 0
      ? { prNumber: parsed[0].number, prUrl: parsed[0].url }
      : null;
  };
  const useExisting = (found) => {
    try {
      ghFn(['pr', 'edit', String(found.prNumber), '--repo', repo, '--title', title, '--body-file', BODY_FILE]);
    } catch {}
    return { prNumber: found.prNumber, prUrl: found.prUrl, existing: true };
  };

  // 1) 既存の open PR 検知 (gh transient 再試行含む)。検知自体が persistent 失敗した場合は
  //    create 段階の "already exists" 分岐で復旧するため、ここでは無視して進行。
  try {
    const found = findExistingPr();
    if (found) return useExisting(found);
  } catch {
    /* 検知失敗 — create の already-exists 復旧に委譲 */
  }

  // 2) 生成。"already exists" = すでに PR が存在 (検知が transient で漏れた) → 再検知復旧。
  try {
    const url = ghFn([
      'pr', 'create', '--repo', repo, '--base', base, '--head', head,
      '--title', title, '--body-file', BODY_FILE,
    ]);
    const prNumber = parseInt(url.match(/\/pull\/(\d+)/)?.[1] || '0', 10);
    if (!prNumber) throw new Error(`PR 番号パース失敗: ${url}`);
    return { prNumber, prUrl: url, existing: false };
  } catch (e) {
    if (/already exists/i.test(String(e && e.message))) {
      try {
        const recovered = findExistingPr();
        if (recovered) return useExisting(recovered);
      } catch {
        /* 再検知も失敗 — オリジナルの already-exists エラーで 'PR存在' の事実を伝達 */
      }
    }
    throw e;
  }
}

// BLOCKED/BEHIND 時に false 返却 (graceful pending)、タイムアウトも false
function waitMergeable(prNumber, repo) {
  let waited = 0;
  while (waited < MERGEABLE_TIMEOUT_MS) {
    const state = gh([
      'pr', 'view', String(prNumber), '--repo', repo,
      '--json', 'mergeStateStatus', '--jq', '.mergeStateStatus',
    ]);
    if (state === 'CLEAN' || state === 'UNSTABLE') return { mergeable: true, state };
    if (state === 'BLOCKED' || state === 'BEHIND') return { mergeable: false, state };
    execFileSync('sleep', [String(MERGEABLE_POLL_MS / 1000)]);
    waited += MERGEABLE_POLL_MS;
  }
  return { mergeable: false, state: 'TIMEOUT' };
}

function createAndMergePr({ base, head, title, body, deleteBranch = null, noMerge = false, worktreeDir = null }) {
  const repo = resolveRepo();
  const { prNumber, prUrl, existing } = getOrCreatePr({ base, head, title, body, repo });

  if (noMerge) {
    return { prNumber, prUrl, merged: false, pending: true, existing };
  }

  let { mergeable, state } = waitMergeable(prNumber, repo);
  if (!mergeable && worktreeDir && (state === 'BEHIND' || state === 'DIRTY' || state === 'BLOCKED')) {
    console.log(`[create-pr] PR #${prNumber} がマージ不可能な状態 (${state}) です。自動同期および再試行を試みます。`);
    try {
      git(['fetch', 'origin', base], { cwd: worktreeDir, timeout: 30_000, retry: 3 });
      let syncSuccess = false;
      try {
        git(['merge', '--no-edit', `origin/${base}`], { cwd: worktreeDir });
        console.log(`[create-pr] ローカルマージ成功。`);
        syncSuccess = true;
      } catch (mergeErr) {
        console.log(`[create-pr] ローカルマージ衝突発生。自動衝突解決を試行中...`);
        const conflictingFiles = git(['diff', '--name-only', '--diff-filter=U'], { cwd: worktreeDir })
          .trim()
          .split('\n')
          .filter(Boolean);
        
        const resolved = tryAutoResolveConflicts(worktreeDir, conflictingFiles);
        if (resolved) {
          const hasMakefile = existsSync(join(worktreeDir, 'Makefile'));
          const validateCmd = hasMakefile ? 'make q.check' : (existsSync(join(worktreeDir, 'package.json')) ? 'npm test' : null);
          if (validateCmd) {
            console.log(`[create-pr] 自動解決完了。検証ツール (${validateCmd}) を駆動します...`);
            try {
              exec(validateCmd.split(' '), { cwd: worktreeDir });
              console.log(`[create-pr] 検証通過！`);
              syncSuccess = true;
            } catch (gateErr) {
              console.error(`[create-pr] 検証失敗。マージキャンセル。`);
              try { git(['merge', '--abort'], { cwd: worktreeDir }); } catch {}
            }
          } else {
            console.log(`[create-pr] 自動解決完了。検証省略。`);
            syncSuccess = true;
          }
        } else {
          try { git(['merge', '--abort'], { cwd: worktreeDir }); } catch {}
        }
      }

      if (syncSuccess) {
        git(['push', 'origin', head], { cwd: worktreeDir, timeout: 60_000, retry: 3 });
        console.log(`[create-pr] アップデートされたブランチの push 完了。PR 状態を再確認中...`);
        const retryResult = waitMergeable(prNumber, repo);
        mergeable = retryResult.mergeable;
        state = retryResult.state;
      }
    } catch (syncErr) {
      console.error(`[create-pr] 自動同期試行中のエラー: ${syncErr.message}`);
    }
  }

  if (!mergeable) {
    // v2.1: warning (string) → warnings (array) 統一。finalize と同一の形式。
    return {
      prNumber, prUrl, merged: false, pending: true, existing,
      warnings: [`PR #${prNumber} 自動マージ保留 (mergeStateStatus=${state})。CI/レビュー通過後に手動マージまたは再試行してください。`],
    };
  }

  const resp = JSON.parse(gh([
    'api', '--method', 'PUT',
    '-H', 'Accept: application/vnd.github+json',
    `/repos/${repo}/pulls/${prNumber}/merge`,
    '-f', `merge_method=squash`,
  ]));
  if (!resp.merged) throw new Error(`PR #${prNumber} merge 失敗`);

  if (deleteBranch) {
    try { gh(['api', '--method', 'DELETE', `/repos/${repo}/git/refs/heads/${deleteBranch}`]); } catch {}
  }

  // マージされたファイル一覧 + ツリー (失敗時は silent passthrough — 中核のマージ結果に影響なし)
  const changed_files = collectChangedFilesViaPr(prNumber, repo);
  const changed_files_tree = buildFileTree(changed_files);

  return {
    prNumber, prUrl, sha: resp.sha, merged: true, pending: false, existing,
    changed_files, changed_files_tree,
  };
}

function cmdShipFeature(args) {
  const branch = readBranch();
  const title = requireArg(args, 'title');
  const body = (typeof args.body === 'string') ? args.body : '';
  const noMerge = args['no-merge'] === true;

  git(['push', '-u', 'origin', branch], { cwd: WT_DIR, timeout: 60_000, retry: 3 });
  writeFileSync(ACTIVE_FLAG, String(Date.now()));

  const result = createAndMergePr({
    base: BASE_BRANCH, head: branch, title, body,
    deleteBranch: noMerge ? null : branch,
    noMerge,
    worktreeDir: WT_DIR,
  });

  // ship 成功時に Pre-Ship Review マーカー整理 (R-CM-030 ライフサイクル)。
  // ship-feature モードのマーカーキーは 'staged'。
  if (result.merged) unlinkShipReviewMarker('staged');

  return { ok: true, ...result };
}

// finalize: fail-loud セマンティクス。fetch/stash/ff 失敗は ok:false (R-CM-010 整合)
function cmdFinalize() {
  const localBranch = existsSync(BRANCH_FILE) ? readFileSync(BRANCH_FILE, 'utf-8').trim() : null;
  if (existsSync(WT_DIR)) {
    try { git(['worktree', 'remove', WT_DIR, '--force']); } catch {}
    try { git(['worktree', 'prune']); } catch {}
  }
  if (localBranch) deleteBranchAndStashes(localBranch);

  const cleanupState = () => {
    rmSync(STATE_DIR, { recursive: true, force: true });
    try { if (existsSync(ACTIVE_FLAG)) rmSync(ACTIVE_FLAG); } catch {}
  };

  try {
    git(['fetch', 'origin', BASE_BRANCH], { timeout: 60_000, retry: 3 });
  } catch (e) {
    cleanupState();
    return {
      ok: false, error: `同期用 fetch 失敗: ${e.message}`,
      hint: 'remote 確認 (git remote -v)。ネットワーク復旧後に git fetch + git merge --ff-only を手動実行。',
      worktree_cleaned: true, sync_status: 'fetch_failed',
    };
  }

  // dirty main は同期せずに中断する (自動 stash 未使用 — オリジナルの working tree に非接触)。
  // ユーザーが手動で commit/stash させた後に再試行する。main ローカル sync のみが skip され、
  // 次の worktree-new の fetch + ff が self-heal する。
  const hasChanges = git(['status', '--porcelain']).trim().length > 0;
  if (hasChanges) {
    cleanupState();
    return {
      ok: false,
      error: 'ローカルの uncommitted 変更事項が存在するため同期を進行できません。',
      hint: '変更事項を手動で commit するか stash させた後に再度同期してください。',
      worktree_cleaned: true,
      sync_status: 'local_changes',
    };
  }

  let ffFailed = null;
  try {
    git(['checkout', BASE_BRANCH]);
    git(['merge', '--ff-only', `origin/${BASE_BRANCH}`]);
  } catch (e) {
    ffFailed = `${BASE_BRANCH} ff-only 失敗: ${e.message}`;
  }

  cleanupState();

  if (ffFailed) {
    return {
      ok: false, error: ffFailed,
      hint: 'リモートの main がローカルの main の先祖ではありません (non-fast-forward)。git log + 手動 rebase が必要。',
      sync_status: 'ff_failed',
    };
  }
  return { ok: true, sync_status: 'synced' };
}

// ═ Mode B: Worktree ═

/**
 * R-CM-008 Rule 9 (multi-worktree superset detection).
 *
 * 本 worktree の変更ファイル set と origin/<baseBranch> の最近 24h の commit が
 * タッチしたファイル set の intersection を計算し、他のセッションの PR が本 worktree の
 * 作業を silently superset として吸収した可能性を検知する。
 *
 * Multi-worktree 同時進行 (Claude Code / Codex など) 時、あるセッションが他のセッションの
 * commit を superset として squash merge すると後者の worktree が意味を失う。
 * fetch 直後に detection → warning (block しない — R-CM-031 Reversible default) により
 * ユーザーに認知の機会を提供。
 *
 * fail-open: git コマンド失敗時は null を返却 (R-CM-006 Rule 2)。
 *
 * @param {string} absWtPath worktree 絶対パス
 * @param {string} baseBranch 比較基準 branch (通常 main)
 * @param {Function} [gitFn=git] git executor (default = モジュール git wrapper). Override in tests only.
 * @returns {Array<{sha,subject,files}> | null} overlap 1+ の時配列、なければ null
 */
export function detectExternalSupersetRisk(absWtPath, baseBranch, gitFn = git) {
  const splitLines = (s) => s.split('\n').map((line) => line.trim()).filter(Boolean);
  try {
    const myFiles = splitLines(
      gitFn(['diff', '--name-only', `origin/${baseBranch}..HEAD`], { cwd: absWtPath }),
    );
    if (myFiles.length === 0) return null;

    // Single `git log --name-only --format="%H %s"` 呼び出しにより N+1 spawn を回避。
    // 出力: 各 commit block は空の line で区分 — "<sha> <subject>\n<file1>\n<file2>\n\n<sha2>..."。
    const logOutput = gitFn(
      ['log', `origin/${baseBranch}`, '--since=24.hours.ago', '--name-only', '--format=%H %s'],
      { cwd: absWtPath },
    );
    const blocks = logOutput.split('\n\n').map((b) => b.trim()).filter(Boolean);
    if (blocks.length === 0) return null;

    const myFileSet = new Set(myFiles);
    const overlaps = [];
    for (const block of blocks) {
      const lines = splitLines(block);
      if (lines.length === 0) continue;
      const header = lines[0];
      const spaceIdx = header.indexOf(' ');
      if (spaceIdx < 0) continue;
      const sha = header.slice(0, spaceIdx);
      const subject = header.slice(spaceIdx + 1);
      const intersection = lines.slice(1).filter((f) => myFileSet.has(f));
      if (intersection.length > 0) {
        overlaps.push({
          sha: sha.slice(0, 7),
          subject: subject.length > 80 ? subject.slice(0, 80) + '…' : subject,
          files: intersection.slice(0, 5),
        });
      }
    }
    return overlaps.length > 0 ? overlaps : null;
  } catch {
    return null;
  }
}

export function tryAutoResolveConflicts(absWtPath, conflictingFiles) {
  if (!conflictingFiles || conflictingFiles.length === 0) return true;

  console.log(`[auto-resolve] 衝突ファイル検知: ${conflictingFiles.join(', ')}`);

  const autoResolvablePatterns = [
    /package-lock\.json$/,
    /pnpm-lock\.yaml$/,
    /yarn\.lock$/,
    /\.tmp\/worktree-.*\/PLAN\.md$/,
    /\.md$/
  ];

  const unresolvable = conflictingFiles.filter(file => {
    return !autoResolvablePatterns.some(pattern => pattern.test(file));
  });

  if (unresolvable.length > 0) {
    console.log(`[auto-resolve] 自動解決不可能なファイルがあります: ${unresolvable.join(', ')}`);
    return false;
  }

  try {
    for (const file of conflictingFiles) {
      if (file.endsWith('package-lock.json') || file.endsWith('pnpm-lock.yaml') || file.endsWith('yarn.lock')) {
        console.log(`[auto-resolve] ${file} 衝突解決試行: --theirs 選択後にパッケージ再生成`);
        git(['checkout', '--theirs', file], { cwd: absWtPath });
        if (file.endsWith('package-lock.json')) {
          try { exec(['npm', 'install'], { cwd: absWtPath }); } catch {}
        } else if (file.endsWith('pnpm-lock.yaml')) {
          try { exec(['pnpm', 'install'], { cwd: absWtPath }); } catch {}
        } else if (file.endsWith('yarn.lock')) {
          try { exec(['yarn', 'install'], { cwd: absWtPath }); } catch {}
        }
        git(['add', file], { cwd: absWtPath });
      } else if (file.includes('PLAN.md') || file.endsWith('.md')) {
        console.log(`[auto-resolve] ${file} 衝突解決試行: --ours 選択`);
        git(['checkout', '--ours', file], { cwd: absWtPath });
        git(['add', file], { cwd: absWtPath });
      }
    }

    const remaining = git(['diff', '--name-only', '--diff-filter=U'], { cwd: absWtPath }).trim();
    if (remaining.length > 0) {
      console.log(`[auto-resolve] 未解決の衝突が残っています: ${remaining}`);
      return false;
    }

    git(['commit', '--no-edit'], { cwd: absWtPath });
    console.log(`[auto-resolve] すべての衝突が正常に自動解決され、merge commit が生成されました。`);
    return true;
  } catch (err) {
    console.error(`[auto-resolve] 衝突解決中にエラーが発生しました: ${err.message}`);
    return false;
  }
}

/**
 * `detectExternalSupersetRisk` の overlaps 配列をユーザー用の warning 文字列にフォーマット。
 * Helper 抽出目的: cmdShipWorktree 統合パス (warning フォーマット + indentation) 単体テスト
 * 可能化 — code-reviewer agent HIGH-2 (PR #296) デグレード遮断。
 *
 * @param {Array<{sha,subject,files}> | null} overlaps
 * @param {string} baseBranch
 * @returns {string | null} overlaps 1+ の時 warning string、それ以外は null
 */
export function formatSupersetWarning(overlaps, baseBranch) {
  if (!overlaps || overlaps.length === 0) return null;
  const lines = overlaps
    .map((o) => `  ${o.sha} ${o.subject} (${o.files.join(', ')})`)
    .join('\n');
  return `multi-worktree superset 危険: origin/${baseBranch} の最近 24h のマージ ${overlaps.length} 件が本 worktree の変更ファイルにタッチしました。本 PR が redundant または silently superset に吸収される可能性 — 変更意図が依然として有効であるか確認の上で進行してください。\n${lines}`;
}

/**
 * ship 応答の 5ソース `mergedWarnings` を合成する純粋関数 (DEBT-15 "mergedWarnings
 * spread" の明示対象)。各ソースの null/undefined を防ぎつつフラットな配列に結合する。
 * 順序: result → superset → preservation → runBundle → cleanup (ユーザー露出順序の契約)。
 *
 * @param {object} p
 * @param {object} p.result            createAndMergePr 結果 (warnings 保有の可能性あり)
 * @param {string[]} [p.supersetWarnings=[]]
 * @param {string[]} [p.preservationWarnings=[]]
 * @param {object|null} [p.runBundle=null]      warnings 保有の可能性あり
 * @param {object|null} [p.cleanupResult=null]  warnings 保有の可能性あり
 * @returns {string[]}
 */
export function mergeShipWarnings({
  result,
  supersetWarnings = [],
  preservationWarnings = [],
  runBundle = null,
  cleanupResult = null,
}) {
  return [
    ...(result.warnings || []),
    ...supersetWarnings,
    ...preservationWarnings,
    ...(runBundle?.warnings ?? []),
    ...(cleanupResult?.warnings ?? []),
  ];
}

/**
 * ship 応答の `cleanup_hint` 分岐のみを分離した純粋関数。cmdShipWorktree の最も
 * 分岐密度の高い sub-logic (nested ternary) を独立したテスト単位に隔離する。
 *
 * R-CM-010 Iron Law: AI が cleanup を自動実行したと推測するのを禁止 — hint に明示。
 *   - `--no-cleanup` + merged: 後続の cleanup-worktree 実行案内 (最優先)。
 *   - 委譲された cleanup の main 同期失敗 (fetch/stash/ff): その hint をそのまま伝達
 *     (PR マージは非可逆 — ship は ok:true 維持、sync 状態のみを surface)。
 *   - その他: null。
 *
 * @param {object} p
 * @param {boolean} [p.cleanup=true]   cleanup 要求の有無 (--no-cleanup 反対)
 * @param {boolean} [p.merged=false]   PR マージ成功の有無 (result.merged)
 * @param {string} p.wtPath            オリジナル worktree 引数 (未整理 hint メッセージ用)
 * @param {object|null} [p.cleanupResult=null]  cmdCleanupWorktree 結果
 * @returns {string|null}
 */
export function composeCleanupHint({ cleanup = true, merged = false, wtPath, cleanupResult = null }) {
  if (!cleanup && merged) {
    return `worktree 未整理 — 後続実行: node .claude/scripts/create-pr/ops.mjs cleanup-worktree --worktree ${wtPath}`;
  }
  const cr = cleanupResult ?? {};
  return cr.ok === false ? (cr.hint ?? null) : null;
}

/**
 * cmdShipWorktree の応答組み立てグルー — 5ソース `mergedWarnings` spread + `cleanup_hint`
 * 分岐 + `?? null` フィールドデフォルト値 — を純粋関数に分離。git/gh/fs 呼び出し部と隔離して
 * `formatSupersetWarning` 抽出先例のように単体テスト可能にする (DEBT-15 / DEBT-27)。
 *
 * 動作は cmdShipWorktree インラインバージョンと同一 (pure refactor — 入力のみ受け取って応答を形成)。
 *
 * @param {object} p
 * @param {object} p.result            createAndMergePr 結果 (warnings / merged / ...rest)
 * @param {string[]} [p.supersetWarnings=[]]      R-CM-008 Rule 9 superset 警告
 * @param {string[]} [p.preservationWarnings=[]]  run/output 保存警告
 * @param {object|null} [p.runBundle=null]        preserveWorktreeRunOutputs 結果
 * @param {object|null} [p.cleanupResult=null]    cmdCleanupWorktree 結果
 * @param {boolean} [p.cleanedUp=false]           worktree 整理完了の有無
 * @param {boolean} [p.cleanup=true]              cleanup 要求の有無 (--no-cleanup 反対)
 * @param {string} p.wtPath                       オリジナル worktree 引数 (cleanup_hint メッセージ用)
 * @param {object|null} [p.postMergeMainStatus=null]  main repo dirty 状態
 * @returns {object} ship-worktree 最終応答オブジェクト (ok:true 固定)
 */
export function composeShipResponse({
  result,
  supersetWarnings = [],
  preservationWarnings = [],
  runBundle = null,
  cleanupResult = null,
  cleanedUp = false,
  cleanup = true,
  wtPath,
  postMergeMainStatus = null,
}) {
  const cr = cleanupResult ?? {};
  const mergedWarnings = mergeShipWarnings({
    result,
    supersetWarnings,
    preservationWarnings,
    runBundle,
    cleanupResult,
  });
  const cleanup_hint = composeCleanupHint({
    cleanup,
    merged: result.merged,
    wtPath,
    cleanupResult,
  });

  return {
    ok: true,
    ...result,
    warnings: mergedWarnings,
    cleanedUp,
    cleanup_sync_status: cr.sync_status ?? null,
    cleanup_hint,
    post_merge_main_status: postMergeMainStatus,
    run_bundle: runBundle,
    completion_report_markdown: buildPostApprovalCompletionReport({
      result: { ...result, warnings: mergedWarnings },
      cleanup,
      cleanedUp,
      cleanupResult,
      wtPath,
      postMergeMainStatus,
    }),
  };
}

// 移植された外部プロジェクト (transplant-bundle 対象) は brief2dev パイプラインを使用しないため
// 'output' / 'docs/pipeline-log' のような一般的な名前の独自ディレクトリを所持することがある — これを
// brief2dev run 成果物と誤認して保存ロジックを発動させてはならない。`.brief2dev/` マーカーが
// 実在するプロジェクト (brief2dev 自体 + そのパイプラインを使用する scaffold 成果物) でのみこの
// ジェネリック候補を含める。マーカーのないプロジェクトは layout-resolver 基準の動的候補
// (`.brief2dev/runs` 等、すでに `.brief2dev/` でネームスペース化されたもの) のみが対象。
function runOutputCandidateRelPaths(absWtPath) {
  const pipelineRoot = getPipelineDataRoot();
  const pipelineRootName = basename(pipelineRoot);
  const candidates = [
    join(pipelineRootName, relative(pipelineRoot, dirname(getActiveRunPath()))),
    join(pipelineRootName, relative(pipelineRoot, getRunsRoot())),
  ];
  const isBrief2devNative = absWtPath ? hasBrief2devMarker(absWtPath) : false;
  if (isBrief2devNative) {
    candidates.push('output', 'docs/pipeline-log');
  }
  return candidates;
}

function safeBundleName(value) {
  return String(value || 'worktree')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'worktree';
}

function scanTreeStats(root) {
  let files = 0;
  let bytes = 0;
  function walk(current) {
    const stat = statSync(current);
    if (stat.isFile()) {
      files += 1;
      bytes += stat.size;
      return;
    }
    if (!stat.isDirectory()) return;
    for (const entry of readdirSync(current)) {
      walk(join(current, entry));
    }
  }
  walk(root);
  return { files, bytes };
}

export function detectRunOutputCandidates(absWtPath) {
  return runOutputCandidateRelPaths(absWtPath)
    .map((relPath) => ({ relPath, absPath: join(absWtPath, relPath) }))
    .filter((candidate) => existsSync(candidate.absPath));
}

export function preserveWorktreeRunOutputs(absWtPath, branch, options = {}) {
  const candidates = detectRunOutputCandidates(absWtPath);
  const warnings = [];
  if (candidates.length === 0) {
    return {
      ok: true,
      skipped: true,
      warnings: ['保存する run/output 候補がありません。'],
      copied_paths: [],
      total_files: 0,
      total_bytes: 0,
    };
  }

  const createdAt = options.createdAt || new Date().toISOString();
  const timestamp = createdAt.replace(/[:.]/g, '-');
  const bundlePath = options.bundlePath || join(
    PROJECT_DIR,
    '.tmp',
    'run-bundles',
    `${safeBundleName(branch)}-${timestamp}`,
  );
  mkdirSync(bundlePath, { recursive: true });

  let headSha = null;
  try {
    headSha = git(['rev-parse', 'HEAD'], { cwd: absWtPath });
  } catch {
    warnings.push('worktree HEAD sha 確認失敗 — manifest.head_sha=null として記録。');
  }

  const copied = [];
  let totalFiles = 0;
  let totalBytes = 0;
  for (const candidate of candidates) {
    const dest = join(bundlePath, candidate.relPath);
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(candidate.absPath, dest, { recursive: true, force: true });
    const stats = scanTreeStats(dest);
    totalFiles += stats.files;
    totalBytes += stats.bytes;
    copied.push({
      source: candidate.absPath,
      destination: dest,
      relative_path: candidate.relPath,
      files: stats.files,
      bytes: stats.bytes,
    });
  }

  const manifest = {
    schema_version: '1.0',
    created_at: createdAt,
    branch,
    base_branch: BASE_BRANCH,
    source_worktree: absWtPath,
    head_sha: headSha,
    copied,
    total_files: totalFiles,
    total_bytes: totalBytes,
    candidates_considered: runOutputCandidateRelPaths(absWtPath),
    exclusion_rules: [
      'Only known brief2dev run/output roots are copied.',
      'node_modules, .git, and arbitrary .tmp contents are not candidate roots.',
    ],
  };
  const manifestPath = join(bundlePath, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');

  return {
    ok: true,
    skipped: false,
    bundle_path: bundlePath,
    manifest_path: manifestPath,
    copied_paths: copied.map((entry) => entry.relative_path),
    total_files: totalFiles,
    total_bytes: totalBytes,
    warnings,
  };
}

function cmdVerifyPlan(args) {
  const wtPath = requireArg(args, 'worktree');
  const planPath = resolveWorktreePlanPath(resolveWorktreeAbsPath(wtPath));
  if (!existsSync(planPath)) throw new Error(`PLAN.md なし: ${planPath}`);
  const content = readFileSync(planPath, 'utf-8');
  const force = args.force === true;
  const unchecked = parseUnchecked(content);
  if (!force && unchecked.length > 0) {
    throw new Error(
      `PLAN.md に未完了のタスクが ${unchecked.length} 件あります:\n${unchecked.join('\n')}\n\n` +
      `※ 迂回: --force または項目に (キャンセル済み)/(dropped)/(deferred)/~~取り消し線~~ マーカーを追加`
    );
  }
  return {
    ok: true,
    message: unchecked.length === 0
      ? 'すべてのPLANチェックボックスが完了(またはキャンセル/無視)されました'
      : `--force 迂回により ${unchecked.length} 件の未完了項目を無視`,
    unchecked_count: unchecked.length,
  };
}

function cmdShipWorktree(args) {
  const wtPath = requireArg(args, 'worktree');
  const absWtPath = resolveWorktreeAbsPath(wtPath);
  if (!existsSync(absWtPath)) {
    // マルチ worktree 環境で AI が worktree 内部の cwd から ops.mjs を呼び出すと
    // 正規化が誤っているケースが度々存在した (PROJECT_DIR fallback の罠)。明確な
    // 診断メッセージで誤ったパスとともに実際の活性 worktree の一覧を提示する。
    let candidates = [];
    try {
      candidates = parseWorktreePaths(git(['worktree', 'list', '--porcelain']));
    } catch {
      // git 呼び出し失敗 — 単一メッセージで fallback
    }
    const candidateBlock = candidates.length > 0
      ? `\n活性 worktree 候補:\n  - ${candidates.join('\n  - ')}`
      : '';
    throw new Error(`Worktree なし: ${absWtPath}${candidateBlock}`);
  }

  // PLAN.md 必須検証 (CLAUDE.md "PLAN.md 必須" ポリシー。--force-plan は未完了チェックボックスの迂回用)
  // 位置: .tmp/worktree-<safeBranch>/PLAN.md (worktree-plan-path.mjs SSOT)
  const planPath = resolveWorktreePlanPath(absWtPath);
  if (!existsSync(planPath)) {
    throw new Error(`PLAN.md ファイルが存在しません: ${planPath}。worktree ルートの .tmp/worktree-<branch>/PLAN.md に作成した後に再試行してください。`);
  }
  const forcePlan = args['force-plan'] === true;
  if (!forcePlan) {
    const unchecked = parseUnchecked(readFileSync(planPath, 'utf-8'));
    if (unchecked.length > 0) {
      throw new Error(
        `PLAN.md に未完了のチェックボックスが ${unchecked.length} 件あります。\n` +
        `※ 迂回: --force-plan フラグまたは項目に (キャンセル済み)/(dropped)/(deferred)/~~取り消し線~~ マーカーを追加`
      );
    }
  }

  // Worktree Commit Requirement: create-pr は dirty worktree を ship しない。
  // Stop guard と同一の契約により、tracked/untracked の変更ともに先に commit させる。
  const status = git(['status', '--porcelain', '--untracked-files=all'], { cwd: absWtPath }).trim();
  if (status.length > 0) {
    const err = new Error(
      `Worktree にコミットされていない変更事項があります。\n該当の変更をコミットした後に再度お試しください。\n[状態]\n${status}`
    );
    err.details = {
      code: 'commit_required',
      dirty_status: status.split('\n'),
      hint: 'worktree 内で git status --short を確認し、自身が作成したファイルのみを stage/commit して ship-worktree を再度実行してください。',
    };
    throw err;
  }


  // Push 前のオリジナル変更事項の自動同期 (Shift-Left Conflict Detection)
  // + R-CM-008 Rule 9: multi-worktree superset 検知 (fetch 後、merge 前)
  const supersetWarnings = [];
  try {
    git(['fetch', 'origin', BASE_BRANCH], { cwd: absWtPath, timeout: 30_000, retry: 3 });

    const overlaps = detectExternalSupersetRisk(absWtPath, BASE_BRANCH);
    const warning = formatSupersetWarning(overlaps, BASE_BRANCH);
    if (warning) supersetWarnings.push(warning);

    try {
      git(['merge', '--no-edit', `origin/${BASE_BRANCH}`], { cwd: absWtPath });
    } catch (mergeErr) {
      console.log(`[ship-worktree] オリジナル(${BASE_BRANCH}) マージ中に衝突が検知されました。自動解決を試みます。`);
      const conflictingFiles = git(['diff', '--name-only', '--diff-filter=U'], { cwd: absWtPath })
        .trim()
        .split('\n')
        .filter(Boolean);
      
      const resolved = tryAutoResolveConflicts(absWtPath, conflictingFiles);
      if (!resolved) {
        try { git(['merge', '--abort'], { cwd: absWtPath }); } catch {}
        throw mergeErr;
      }
      
      const hasMakefile = existsSync(join(absWtPath, 'Makefile'));
      const validateCmd = hasMakefile ? 'make q.check' : (existsSync(join(absWtPath, 'package.json')) ? 'npm test' : null);
      if (validateCmd) {
        console.log(`[ship-worktree] 自動解決完了。検証ツール(${validateCmd})を駆動して最終的な整合性を検証します...`);
        try {
          exec(validateCmd.split(' '), { cwd: absWtPath });
          console.log(`[ship-worktree] 検証通過！自動衝突解決が承認されました。`);
        } catch (gateErr) {
          console.error(`[ship-worktree] 検証失敗: 自動解決されたコードが品質ゲートを通過しませんでした。マージをキャンセルします。`);
          try { git(['merge', '--abort'], { cwd: absWtPath }); } catch {}
          throw new Error(`自動衝突解決後の品質検査(${validateCmd}) 失敗: ${gateErr.message}`);
        }
      } else {
        console.log(`[ship-worktree] 自動解決完了。実行する品質検査ツールがないため検証をスキップします。`);
      }
    }
  } catch (e) {
    throw new Error(`オリジナル(${BASE_BRANCH})とのマージ中に衝突が発生しました。手動で衝突を解決してコミットした後に再度お試しください。\nエラー: ${e.message}`);
  }

  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: absWtPath });
  if (!branch || branch === 'HEAD') throw new Error(`ブランチの把握不可: ${wtPath}`);

  git(['push', '-u', 'origin', branch], { cwd: absWtPath, timeout: 60_000, retry: 3 });

  const title = requireArg(args, 'title');
  const body = (typeof args.body === 'string') ? args.body : '';
  const noMerge = args['no-merge'] === true;
  const cleanup = args['no-cleanup'] !== true;
  const preserveRun = args['preserve-run'] === true;

  const result = createAndMergePr({
    base: BASE_BRANCH, head: branch, title, body,
    deleteBranch: noMerge ? null : branch,
    noMerge,
    worktreeDir: absWtPath,
  });

  // マージ成功時に worktree 全体整理 (デフォルト)。--no-cleanup にて opt-out。
  // cmdCleanupWorktree に委譲して worktree 除去 + ローカル branch 削除のみならず、
  // auto-checkpoint stash drop (deleteBranchAndStashes) + CONTEXT.json 整理 +
  // ローカル main 同期 (fetch + stash-based ff-merge) まで一括遂行する。
  // 以前はインラインの worktree remove/prune/branch -D のみ実行し、stash・main 同期が
  // 欠落していたため、ユーザーが cleanup-worktree を別途呼び出す必要があった (整理漏れのギャップ)。
  let cleanedUp = false;
  let cleanupResult = null;
  let runBundle = null;
  const preservationWarnings = [];
  if (cleanup && result.merged) {
    const candidates = detectRunOutputCandidates(absWtPath);
    if (preserveRun) {
      runBundle = preserveWorktreeRunOutputs(absWtPath, branch);
    } else if (candidates.length > 0) {
      preservationWarnings.push(
        `cleanup が ${candidates.map((candidate) => candidate.relPath).join(', ')} 候補を除去します。保存するには ship-worktree --preserve-run を使用してください。`,
      );
    }
    cleanupResult = cmdCleanupWorktree({ worktree: wtPath });
    cleanedUp = cleanupResult.worktree_cleaned === true;
  }

  // ship 成功時に Pre-Ship Review マーカー整理 (R-CM-030 ライフサイクル)。
  // 委譲された cleanup 時、cmdCleanupWorktree がすでに unlink — ここでは --no-cleanup
  // パスカバー用 (べき等 — 重複呼び出し安全)。
  if (result.merged) unlinkShipReviewMarker(wtPath);

  // マージ成功直後、main repo working tree dirty 状態を報告。
  // AI は main の unstaged 変更がマージ結果と衝突する可能性があることを認知し、ユーザーに
  // 明示的な reconcile (git pull --ff-only) を案内しなければならない。
  const post_merge_main_status = result.merged ? detectPostMergeMainStatus() : null;

  // 応答組み立てのグルー (mergedWarnings spread + cleanup_hint 分岐 + ?? null フィールドデフォルト値)
  // は純粋関数 composeShipResponse に委譲 — git/gh/fs 隔離により単体テスト可能
  // (DEBT-15 / DEBT-27, `tests/unit/create-pr-ship-response-compose.test.mjs`).
  return composeShipResponse({
    result,
    supersetWarnings,
    preservationWarnings,
    runBundle,
    cleanupResult,
    cleanedUp,
    cleanup,
    wtPath,
    postMergeMainStatus: post_merge_main_status,
  });
}

function cmdCleanupWorktree(args) {
  const wtPath = requireArg(args, 'worktree');
  const absWtPath = resolveWorktreeAbsPath(wtPath);
  const warnings = [];

  // 該当の worktree マーカー + stale (>1h) マーカー GC (R-CM-030 ライフサイクル)。
  // ship-worktree がすでに unlink していてもべき等 — cancelled フローの累積防止が主目的。
  unlinkShipReviewMarker(wtPath);
  gcStaleShipReviewMarkers();

  let branch = null;
  if (existsSync(absWtPath)) {
    try { branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: absWtPath }); } catch {}
    try { git(['worktree', 'remove', absWtPath, '--force']); } catch {}
    try { git(['worktree', 'prune']); } catch {}
  }
  if (branch) deleteBranchAndStashes(branch);

  // CONTEXT.json の worktree 参照整理 (存在する場合のみ)
  const ctxPath = join(PROJECT_DIR, 'CONTEXT.json');
  if (existsSync(ctxPath)) {
    try {
      const ctx = JSON.parse(readFileSync(ctxPath, 'utf-8'));
      if (ctx.execution?.worktree?.worktree_path === wtPath) {
        delete ctx.execution.worktree;
        writeFileSync(ctxPath, JSON.stringify(ctx, null, 2) + '\n');
      }
    } catch (e) {
      warnings.push(`CONTEXT.json アップデート失敗: ${e.message}`);
    }
  }

  // main 同期 (finalize と同一のセマンティクス、fail-loud)。dirty main は stash せずに abort。
  try {
    git(['fetch', 'origin', BASE_BRANCH], { cwd: PROJECT_DIR, timeout: 60_000, retry: 3 });
  } catch (e) {
    return {
      ok: false, error: `${BASE_BRANCH} fetch 失敗: ${e.message}`,
      hint: 'remote 確認のうえ手動同期', sync_status: 'fetch_failed',
      worktree_cleaned: true, warnings,
    };
  }

  // dirty main は同期せずに中断する (自動 stash 未使用 — オリジナルの working tree に非接触)。
  // PR はすでにマージされているため有効であり、main ローカル sync のみが skip される (次の worktree-new で self-heal)。
  const hasChanges = git(['status', '--porcelain'], { cwd: PROJECT_DIR }).trim().length > 0;
  if (hasChanges) {
    return {
      ok: false,
      error: 'ローカルの uncommitted 変更事項が存在するため同期を進行できません。',
      hint: '変更事項を手動で commit するか stash させた後に再度同期してください。',
      worktree_cleaned: true,
      warnings,
      sync_status: 'local_changes',
    };
  }

  let ffFailed = null;
  try {
    git(['checkout', BASE_BRANCH], { cwd: PROJECT_DIR });
    git(['merge', '--ff-only', `origin/${BASE_BRANCH}`], { cwd: PROJECT_DIR });
  } catch (e) {
    ffFailed = `${BASE_BRANCH} ff-only 失敗: ${e.message}`;
  }

  if (ffFailed) {
    return {
      ok: false, error: ffFailed,
      hint: 'リモートの main がローカルの先祖ではありません。手動 rebase が必要',
      sync_status: 'ff_failed', worktree_cleaned: true, warnings,
    };
  }
  return { ok: true, sync_status: 'synced', worktree_cleaned: true, warnings };
}

// ═ Dispatch ═
const COMMANDS = {
  'init': cmdInit,
  'isolate': cmdIsolate,
  'commit': cmdCommit,
  'ship-feature': cmdShipFeature,
  'finalize': cmdFinalize,
  'verify-plan': cmdVerifyPlan,
  'ship-worktree': cmdShipWorktree,
  'cleanup-worktree': cmdCleanupWorktree,
};

function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);

  if (!command || command === '--help') {
    process.stdout.write(JSON.stringify({
      ok: true, mode: null, command: '--help',
      commands: Object.keys(COMMANDS),
      modes: { staged: [...STAGED_CMDS], worktree: [...WORKTREE_CMDS] },
      config: {
        github_account: GH_ACCOUNT, base_branch: BASE_BRANCH,
        enforce_ssh_remote: ENFORCE_SSH,
      },
    }) + '\n');
    process.exit(0);
  }

  const mode = inferMode(command);
  if (!COMMANDS[command]) {
    process.stdout.write(JSON.stringify({
      ok: false, mode, command,
      error: `Unknown: ${command}`, available: Object.keys(COMMANDS),
    }) + '\n');
    process.exit(1);
  }

  try {
    const result = COMMANDS[command](args);
    process.stdout.write(JSON.stringify({ mode, command, ...result }) + '\n');
    process.exit(result.ok === false ? 1 : 0);
  } catch (e) {
    process.stdout.write(JSON.stringify({
      ok: false, mode, command,
      error: e.message, ...(e.details || {}),
    }) + '\n');
    process.exit(1);
  }
}

// v2.1: import 時の main() 自動実行を遮断。デグレードテストが constant のみ import 可能。
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
