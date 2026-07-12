#!/usr/bin/env node

/**
 * ops.mjs — create-pr統合実行エンジン (8コマンド, GitHub Flow, v2レスポンス契約)
 *
 * コマンド:
 *   Mode A (Staged隔離):  init / isolate / commit / ship-feature / finalize
 *   Mode B (Worktree):    verify-plan / ship-worktree / cleanup-worktree
 *
 * 出力契約 (v2): stdout JSON 1行
 *   成功: { ok: true,  mode, command, ... }                   (exit 0)
 *   失敗: { ok: false, mode, command, error, hint?, details? } (exit 1)
 *
 *   sync_status値: synced | fetch_failed | local_changes | ff_failed
 *
 * Config: .claude/skills/create-pr/config.json
 *   { github_account, base_branch, enforce_ssh_remote? }  (base_branch デフォルトmain)
 *
 * 鉄則: unstaged/untrackedファイルは実行前後で完全に同一でなければならない。
 *   - worktree隔離: 元のHEAD不変
 *   - dirty main時のsync abort: 元の変更に触れず同期のみ中断（自動stash不使用）
 *
 * セキュリティ: すべての外部コマンドはexecFileSync配列引数 → shell非経由。
 *
 * hook連携: cmdInitが.tmp/create-pr-activeフラグを生成 →
 *   commit-guard.mjs / destructive-git-guard.mjsがallowlistモードに転換。
 *   cmdFinalize / cmdCleanupWorktree終了時にフラグを自動削除。
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
 * Project rootを算出。多重worktree環境でAIがworktree内部からops.mjsを
 * 直接呼び出してもmain worktree rootへ復帰することを保証する。
 *
 * 優先順位:
 *   1. `process.env.CLAUDE_PROJECT_DIR` — 明示override（テスト / ユーザー指定）。
 *   2. `git rev-parse --git-common-dir` の親 — すべてのworktreeが同一main rootへ回帰。
 *      `.git`ディレクトリはmain worktree内に本体があり、他のworktreeは
 *      `.git`ファイルでmainのcommon-dirを指す。親 = main worktree root。
 *   3. `__dirname`ベースのfallback — worktree内で呼び出すとworktree rootに落ちてしまう
 *      罠があるため最終fallback（過去の動作互換性用 — git外部実行環境）。
 *
 * リグレッション: tests/unit/create-pr-ops.test.mjs `resolveProjectRoot` describe block。
 */
export function resolveProjectRoot(cwd = process.cwd()) {
  if (process.env.CLAUDE_PROJECT_DIR) return process.env.CLAUDE_PROJECT_DIR;
  try {
    const commonDir = execFileSync('git', ['rev-parse', '--git-common-dir'], {
      cwd,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    // 空stdoutまたは'.'のみでは親推論に意味がない — silent worktree-root
    // fallbackの罠が再現するため明示的にfallbackへ送りstderrに痕跡を残す。
    if (commonDir && commonDir !== '.' && commonDir !== '') {
      return dirname(resolve(cwd, commonDir));
    }
    process.stderr.write(
      `[ops.mjs] resolveProjectRoot: git common-dir empty (cwd=${cwd}), falling back to __dirname-based path.\n`,
    );
  } catch {
    // git外部 / git未インストール — __dirname fallbackへ
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

// v2.1: 30s → 30min。ship-featureはMERGEABLE_TIMEOUT_MS=5min間pollingするため
// 30s thresholdだと活発に動作中のship-feature直後に他コマンドがflagをstaleと
// 判断し、同時進入保護を回避してしまう事故を引き起こす。30minは単一ユーザーCLIの
// 妥当なサイクル上限。
// export: リグレッションテストがimportしてhelper複製なしで検証。
export const ACTIVE_FLAG_STALE_MS = 30 * 60 * 1000;
const MERGEABLE_TIMEOUT_MS = 300_000;
const MERGEABLE_POLL_MS = 5_000;

// ═ Shell ═
// ネットワークtransientエラーパターン — ポート遮断/ホットスポット不安定時のgh・git呼び出しの*一時的*失敗。
// 論理エラー("already exists" / merge conflict / auth)は含まない — 再試行しても同じ結果。
// export: リグレッションテストがhelper複製なしで直接検証。
const TRANSIENT_ERROR_PATTERNS = [
  /ETIMEDOUT/i,
  /ECONNRESET/i,
  /ENETUNREACH/i,
  /EAI_AGAIN/i,
  /ENOTFOUND/i,
  /timed out/i,
  // /timeout/i は意図的に除外 — GitHub API 422検証エラー("...timeout: 0"など)をfalse-transient
  // として誤って再試行してしまう。実際のtimeoutは/timed out/・ETIMEDOUT・/TLS handshake/・下記Go http clientでカバー。
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
    /* sleep失敗は無視 — 再試行続行（delay 0に降格） */
  }
}

// transientネットワークエラーのみ再試行。論理エラーは即座にthrow（再試行は無意味）。
// opts.sleep注入によりテストは実際の待機なしで検証。
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
      sleep(Math.min(baseDelaySec * attempt, 8)); // 2s → 4s → 6s (上限8s)
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

// opts.retry > 1の時のみtransient再試行（ネットワーク呼び出し — gh / git fetch・push）。
// ローカル呼び出し（git status / rev-parse / make q.check）はretry未指定 → 即座にfail-fast。
function exec(cmd, opts = {}) {
  if (opts.retry && opts.retry > 1) {
    return retryTransient(() => execOnce(cmd, opts), { attempts: opts.retry, sleep: opts.sleep });
  }
  return execOnce(cmd, opts);
}

const git = (args, opts = {}) => exec(['git', ...args], opts);

/**
 * github_account未設定時はgh CLIのデフォルトログインアカウントをそのまま使用する
 * (config.json _adapt / SKILL.md / transplant-bundles.jsonが文書化した契約)。
 * 純粋関数として分離 — gh CLI実行なしでコマンド構成ロジックのみ単体テスト可能。
 */
export function buildGhTokenCommand(ghAccount) {
  return ghAccount ? ['gh', 'auth', 'token', '-u', ghAccount] : ['gh', 'auth', 'token'];
}

let cachedToken = null;
function ghToken() {
  if (cachedToken) return cachedToken;
  const tokenCmd = buildGhTokenCommand(GH_ACCOUNT);
  // gh()のenv構成段階でeager呼び出しされexecのretry scope外のため直接retryTransient。
  // (gh auth tokenはローカルkeyring参照のため通常ネットワーク無関係だが、初回gh()呼び出しのtransientギャップを防止。)
  try {
    cachedToken = retryTransient(() => exec(tokenCmd), { attempts: 3 });
  } catch (e) {
    const err = new Error(
      `gh認証トークン取得失敗 (${GH_ACCOUNT ? `アカウント: ${GH_ACCOUNT}` : 'デフォルトログインアカウント'}): ${e.message}`
    );
    err.details = { hint: `gh auth login状態を確認、またはconfig.github_accountでアカウントを明示: ${CONFIG_PATH}` };
    throw err;
  }
  return cachedToken;
}

const gh = (args, opts = {}) => exec(['gh', ...args], {
  timeout: 60_000,
  retry: 3, // すべてのgh呼び出しはapi.github.com transient(TLS handshake timeoutなど)を再試行。opts.retryでoverride。
  ...opts,
  env: { ...process.env, GH_TOKEN: ghToken(), GH_HOST: 'github.com' },
});

function resolveRepo() {
  const url = git(['remote', 'get-url', 'origin']);
  const m = url.match(/[:/]([^:/]+\/[^/]+?)(?:\.git)?$/);
  if (!m) throw new Error(`origin URLパース失敗: ${url}`);
  return m[1];
}

/**
 * `--worktree <p>` 引数をPROJECT_DIR基準の絶対パスに正規化する。
 * 絶対パス入力はそのまま返す（false-prepend回避）。
 * リグレッション防止: tests/unit/create-pr-ops.test.mjs
 */
export function resolveWorktreeAbsPath(wtPath) {
  if (!wtPath) return wtPath;
  return isAbsolute(wtPath) ? wtPath : join(PROJECT_DIR, wtPath);
}

/**
 * `git worktree list --porcelain` の出力からworktree絶対パスの一覧を抽出。
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
 * 正確マッチ（`^worktree (.+)$`）で将来のgitの他の`worktree`始まりprefix
 * 拡張（例: hypothetical `worktree-config-file ...`）と衝突しないよう保護。
 * 空のpathはcapture group結果から自動除外。
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
      // `.trim()` はtrailing whitespace防御用 — git porcelainはtrailing space
      // がないのが正常だが、capture groupが吸い込む場合に備える（no-op同等）。
      const path = match[1].trim();
      if (path) paths.push(path);
    }
  }
  return paths;
}

/**
 * `git status --porcelain` の出力をdirty/cleanに分類する。Pure parser — テスト可能。
 *
 * Untrackedファイル（`?? path`）は意図的に除外 — ユーザーのad-hoc作業物であり、マージ結果と
 * 衝突する変更ではない。マージ結果のffを妨げるのはtracked fileのunstaged/staged変更。
 *
 * @param {string} porcelain - `git status --porcelain` のstdout
 * @returns {{status: 'clean'|'dirty', dirty_paths?: string[]}}
 */
export function parsePorcelainStatus(porcelain) {
  if (!porcelain || !porcelain.trim()) return { status: 'clean' };
  const dirty_paths = porcelain
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('??'))
    .map((line) => {
      const rest = line.slice(3).trim();
      // ff mergeの影響はrenameのnew path側なので、それのみdirty_pathsに報告。
      const arrow = rest.indexOf(' -> ');
      return arrow >= 0 ? rest.slice(arrow + 4).trim() : rest;
    })
    .filter(Boolean);
  return dirty_paths.length > 0 ? { status: 'dirty', dirty_paths } : { status: 'clean' };
}

/**
 * マージ成功後、main repo (PROJECT_DIR) のworking tree dirty状態を検知する。
 * ユーザーがmain repoでsquash merge結果と衝突するunstaged変更を持っている場合、
 * `git pull --ff-only` が失敗する — AIがこの状態を把握して初めて明示的なreconcile案内が可能。
 *
 * git呼び出し失敗はfail-open ('unknown') — ship結果自体には影響しない。
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
 * マージされたPRの変更ファイル一覧を収集。gh CLI呼び出し。
 * 失敗時は空配列（核心のマージ結果には影響なし — fail-open）。
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

/**
 * `/create-pr ship-worktree` post-merge段階でfollowup-debt-tracker.mjsの
 * `register --pr <num> --json` を呼び出し、登録されたDEBT項目をレスポンスに可視化する。
 *
 * R-CM-010 Iron Law整合: silent execute後の「自動登録されたはず」という推定を防止 — 結果を
 * `count` + `items` で明示的に返し、AIがユーザーに直接報告できるようにする。
 *
 * Fail-open（R-CM-033 #10整合）: script不在 / invalid PR / 実行失敗 / stdout
 * parse失敗すべて `{ error, count: 0, items: [] }` を返す（throwしない）— ship-worktree
 * のメインフローをブロックしない。
 *
 * @param {number} prNumber
 * @returns {{ error: string | null, count: number, items: Array<object> }}
 */
export function registerFollowupDebtFromPr(prNumber) {
  if (!Number.isInteger(prNumber) || prNumber < 1) {
    return {
      error: `followup-debt registration skipped: invalid PR number (${prNumber})`,
      count: 0,
      items: [],
    };
  }
  const scriptPath = join(PROJECT_DIR, '.claude', 'scripts', 'followup-debt-tracker.mjs');
  if (!existsSync(scriptPath)) {
    return {
      error: `followup-debt-tracker script not found at ${scriptPath} — skipped`,
      count: 0,
      items: [],
    };
  }

  let stdout;
  try {
    stdout = execFileSync(
      process.execPath,
      [scriptPath, 'register', '--pr', String(prNumber), '--json'],
      {
        cwd: PROJECT_DIR,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 10_000,
        env: process.env,
      },
    );
  } catch (e) {
    const stderr = (e.stderr || '').toString().trim();
    const errStdout = (e.stdout || '').toString().trim();
    const detail = stderr || errStdout || e.message;
    return {
      error: `followup-debt registration skipped: ${detail}`,
      count: 0,
      items: [],
    };
  }

  try {
    const parsed = JSON.parse((stdout || '').trim());
    return {
      error: null,
      count: typeof parsed.registered === 'number' ? parsed.registered : 0,
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  } catch (e) {
    return {
      error: `followup-debt stdout parse failed: ${e.message}`,
      count: 0,
      items: [],
    };
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

// AIコンテキスト分岐の明確化
const STAGED_CMDS = new Set(['init', 'isolate', 'commit', 'ship-feature', 'finalize']);
const WORKTREE_CMDS = new Set(['verify-plan', 'ship-worktree', 'cleanup-worktree']);
function inferMode(command) {
  if (STAGED_CMDS.has(command)) return 'staged';
  if (WORKTREE_CMDS.has(command)) return 'worktree';
  return null;
}

// 同時実行保護: 30秒以内のactive flag = 別セッション進行中
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
  if (!existsSync(BRANCH_FILE)) throw new Error('セッションなし。isolateを先に実行してください');
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

// Pre-Ship Reviewマーカーのライフサイクル (R-CM-030)
// 正常ship成功時は即座にunlink、cleanup-worktree進入時にstale GCでcancelledフローの累積を防止。
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

// SSH remote検査 (opt-in via config.enforce_ssh_remote)
function checkSshRemoteIfRequired() {
  if (!ENFORCE_SSH) return;
  const remoteUrl = git(['remote', 'get-url', 'origin']);
  const isSsh = remoteUrl.startsWith('git@') || remoteUrl.startsWith('ssh://');
  if (!isSsh) {
    const err = new Error('originがSSH remoteではありません');
    err.details = {
      remote_url: remoteUrl,
      hint: 'config.enforce_ssh_remote=trueの場合、SSH alias remoteが必要です。git remote set-urlで切り替え後に再試行してください。',
    };
    throw err;
  }
}

/**
 * makeターゲットの存在確認（`make -n <target>` dry-run — 実際のレシピ実行なしでrule探索のみ）。
 * Makefile不在 / ターゲット不在いずれもfalse。移植されたプロジェクト（brief2dev専用`q.ci-mirror`などソフト
 * 参照ターゲット）がそのターゲットを持たない場合を検知し、ハード失敗の代わりにgraceful skipするためのhelper。
 * リグレッション: tests/unit/create-pr-ops.test.mjs `makeTargetExists` describe block。
 */
export function makeTargetExists(target, cwd) {
  try {
    execFileSync('make', ['-n', target], { cwd, stdio: 'pipe', encoding: 'utf-8', timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

// ═ Mode A: Staged隔離 ═

function cmdInit() {
  if (!isStaleActiveFlag(ACTIVE_FLAG)) {
    const err = new Error('別のcreate-prセッションが進行中です（30秒以内のactive flag）。');
    err.details = { hint: '進行中のセッション終了を待つか、.tmp/create-pr-activeを手動で整理してから再試行してください' };
    throw err;
  }
  autoCleanup();

  // CI Mirror Gate (60min stamp freshness)。brief2dev自体は`make q.ci-mirror`を持つが、
  // 移植されたプロジェクト（transplant-bundle）はそのターゲットがない場合がある — ソフト参照のためターゲット
  // 不在時はゲート自体をskipする（ハード失敗禁止、adaptation_notes整合）。
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
        `CIミラー (make q.ci-mirror) 失敗。create-prスキルで自動修正ループを開始するか、` +
        `手動修正後に再試行してください。\n\n[STDOUT]\n${stdout}\n[STDERR]\n${stderr}`
      );
      err.details = { stdout, stderr };
      throw err;
    }
  }

  const branch = git(['branch', '--show-current']);
  if (branch !== BASE_BRANCH) throw new Error(`現在のブランチが${BASE_BRANCH}ではありません: ${branch}`);

  const stagedFiles = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean);
  if (stagedFiles.length === 0) throw new Error('stagedファイルなし');

  const secretPattern = /\.(env|key|pem|p12|keystore)$|(^|\/)credentials\.json$|service-account/;
  const secrets = stagedFiles.filter(f => secretPattern.test(f));
  if (secrets.length) {
    const err = new Error(`機密ファイルを検出: ${secrets.join(', ')}`);
    err.details = { secrets };
    throw err;
  }

  checkSshRemoteIfRequired();
  ghToken();

  const warnings = [];
  try {
    git(['fetch', 'origin', BASE_BRANCH], { timeout: 30_000, retry: 3 });
  } catch (e) {
    warnings.push(`リモートfetch失敗: ${e.message}。最新性未検証。`);
  }
  try {
    const localSha = git(['rev-parse', 'HEAD']);
    const remoteSha = git(['rev-parse', `origin/${BASE_BRANCH}`]);
    if (localSha !== remoteSha) {
      const ahead = parseInt(git(['rev-list', '--count', `origin/${BASE_BRANCH}..HEAD`]) || '0', 10);
      const behind = parseInt(git(['rev-list', '--count', `HEAD..origin/${BASE_BRANCH}`]) || '0', 10);
      if (ahead > 0) {
        throw new Error(
          `ローカル${BASE_BRANCH}がorigin/${BASE_BRANCH}より${ahead}コミット進んでいます。` +
          `先にpush/PR処理後に再試行してください。（自動pushは意図しないcommit伝播リスクのため無効化されています）`
        );
      }
      if (behind > 0) {
        warnings.push(
          `ローカル${BASE_BRANCH}がorigin/${BASE_BRANCH}より${behind}コミット遅れています。` +
          `finalizeがff-mergeで自動同期予定。PRマージ時に競合の可能性。`
        );
      }
    }
  } catch (e) {
    if (e.message.includes('進んでいます')) throw e;
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
  if (!existsSync(PATCH_FILE)) throw new Error('initを先に実行してください');

  git(['worktree', 'add', '-b', branchName, WT_DIR, 'HEAD']);
  writeFileSync(BRANCH_FILE, branchName);
  git(['apply', '--index', PATCH_FILE], { cwd: WT_DIR });

  writeFileSync(ACTIVE_FLAG, String(Date.now()));
  return { ok: true, branch: branchName, worktreeDir: WT_DIR };
}

function cmdCommit(args) {
  const message = requireArg(args, 'message');
  const files = (typeof args.files === 'string') ? args.files.split(',') : null;
  if (!existsSync(WT_DIR)) throw new Error('worktreeなし。isolateを先に実行してください');

  writeFileSync(MSG_FILE, message);
  const cmdArgs = files
    ? ['commit', '--only', '-F', MSG_FILE, '--', ...files]
    : ['commit', '-F', MSG_FILE];
  git(cmdArgs, { cwd: WT_DIR });

  writeFileSync(ACTIVE_FLAG, String(Date.now()));
  return { ok: true, sha: git(['rev-parse', 'HEAD'], { cwd: WT_DIR }).slice(0, 7) };
}

// 冪等PR生成: 同一headのopen PRがあれば再利用 + title/body更新。
// gh()がtransient(TLS timeoutなど)を再試行するためlistの一時的失敗が空の結果に見え、
// 重複create → "already exists"で止まる罠を防止。create "already exists"も再検知で復旧。
// ghFn注入(default gh) — リグレッションテストがalready-exists復旧シナリオをstubで検証
// (detectExternalSupersetRiskのgitFn注入パターンと同一)。
export function getOrCreatePr({ base, head, title, body, repo }, ghFn = gh) {
  // ship-worktree単独呼び出し時はSTATE_DIR不在の可能性がある（init非依存）。冪等mkdir。
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

  // 1) 既存のopen PRを検知（gh transient再試行を含む）。検知自体がpersistent失敗する場合は
  //    create段階の"already exists"分岐で復旧するため、ここでは飲み込んで続行。
  try {
    const found = findExistingPr();
    if (found) return useExisting(found);
  } catch {
    /* 検知失敗 — createのalready-exists復旧に委ねる */
  }

  // 2) 生成。"already exists" = すでにPRが存在（検知がtransientで見逃した）→ 再検知で復旧。
  try {
    const url = ghFn([
      'pr', 'create', '--repo', repo, '--base', base, '--head', head,
      '--title', title, '--body-file', BODY_FILE,
    ]);
    const prNumber = parseInt(url.match(/\/pull\/(\d+)/)?.[1] || '0', 10);
    if (!prNumber) throw new Error(`PR番号パース失敗: ${url}`);
    return { prNumber, prUrl: url, existing: false };
  } catch (e) {
    if (/already exists/i.test(String(e && e.message))) {
      try {
        const recovered = findExistingPr();
        if (recovered) return useExisting(recovered);
      } catch {
        /* 再検知も失敗 — 元のalready-existsエラーで「PR存在」の事実を伝達 */
      }
    }
    throw e;
  }
}

// BLOCKED/BEHIND時はfalseを返す（graceful pending）、タイムアウトもfalse
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
    console.log(`[create-pr] PR #${prNumber}がマージ不可能な状態(${state})です。自動同期と再試行を試みます。`);
    try {
      git(['fetch', 'origin', base], { cwd: worktreeDir, timeout: 30_000, retry: 3 });
      let syncSuccess = false;
      try {
        git(['merge', '--no-edit', `origin/${base}`], { cwd: worktreeDir });
        console.log(`[create-pr] ローカルマージ成功。`);
        syncSuccess = true;
      } catch (mergeErr) {
        console.log(`[create-pr] ローカルマージで競合発生。自動競合解決を試行中...`);
        const conflictingFiles = git(['diff', '--name-only', '--diff-filter=U'], { cwd: worktreeDir })
          .trim()
          .split('\n')
          .filter(Boolean);

        const resolved = tryAutoResolveConflicts(worktreeDir, conflictingFiles);
        if (resolved) {
          const hasMakefile = existsSync(join(worktreeDir, 'Makefile'));
          const validateCmd = hasMakefile ? 'make q.check' : (existsSync(join(worktreeDir, 'package.json')) ? 'npm test' : null);
          if (validateCmd) {
            console.log(`[create-pr] 自動解決完了。検証ツール(${validateCmd})を実行します...`);
            try {
              exec(validateCmd.split(' '), { cwd: worktreeDir });
              console.log(`[create-pr] 検証通過!`);
              syncSuccess = true;
            } catch (gateErr) {
              console.error(`[create-pr] 検証失敗。マージを取り消します。`);
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
        console.log(`[create-pr] 更新されたブランチのpush完了。PR状態を再確認中...`);
        const retryResult = waitMergeable(prNumber, repo);
        mergeable = retryResult.mergeable;
        state = retryResult.state;
      }
    } catch (syncErr) {
      console.error(`[create-pr] 自動同期試行中にエラー: ${syncErr.message}`);
    }
  }

  if (!mergeable) {
    // v2.1: warning(string) → warnings(array)に統一。finalizeと同じ形式。
    return {
      prNumber, prUrl, merged: false, pending: true, existing,
      warnings: [`PR #${prNumber} 自動マージ保留 (mergeStateStatus=${state})。CI/レビュー通過後に手動マージまたは再試行。`],
    };
  }

  const resp = JSON.parse(gh([
    'api', '--method', 'PUT',
    '-H', 'Accept: application/vnd.github+json',
    `/repos/${repo}/pulls/${prNumber}/merge`,
    '-f', `merge_method=squash`,
  ]));
  if (!resp.merged) throw new Error(`PR #${prNumber} merge失敗`);

  if (deleteBranch) {
    try { gh(['api', '--method', 'DELETE', `/repos/${repo}/git/refs/heads/${deleteBranch}`]); } catch {}
  }

  // マージされたファイル一覧 + ツリー（失敗時はsilent passthrough — 核心のマージ結果に影響なし）
  const changed_files = collectChangedFilesViaPr(prNumber, repo);
  const changed_files_tree = buildFileTree(changed_files);
  const warnings = [];
  const followupDebt = registerFollowupDebtFromPr(prNumber);
  if (followupDebt.error) warnings.push(followupDebt.error);

  return {
    prNumber, prUrl, sha: resp.sha, merged: true, pending: false, existing,
    changed_files, changed_files_tree, warnings,
    followup_debt_registered: { count: followupDebt.count, items: followupDebt.items },
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

  // ship成功時にPre-Ship Reviewマーカーを整理（R-CM-030ライフサイクル）。
  // ship-featureモードのマーカーキーは'staged'。
  if (result.merged) unlinkShipReviewMarker('staged');

  return { ok: true, ...result };
}

// finalize: fail-loud意味論。fetch/stash/ff失敗はok:false (R-CM-010整合)
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
      ok: false, error: `同期用fetch失敗: ${e.message}`,
      hint: 'remoteを確認 (git remote -v)。ネットワーク復旧後にgit fetch + git merge --ff-onlyを手動実行。',
      worktree_cleaned: true, sync_status: 'fetch_failed',
    };
  }

  // dirty mainは同期せず中断する（自動stash不使用 — 元のworking treeに触れない）。
  // ユーザーが手動でcommit/stashした後に再試行する。mainローカルsyncのみskipされ、
  // 次のworktree-newのfetch + ffがself-healする。
  const hasChanges = git(['status', '--porcelain']).trim().length > 0;
  if (hasChanges) {
    cleanupState();
    return {
      ok: false,
      error: 'ローカルにuncommittedな変更が存在するため、同期を進めることができません。',
      hint: '変更を手動でcommitするかstashした後、再度同期してください。',
      worktree_cleaned: true,
      sync_status: 'local_changes',
    };
  }

  let ffFailed = null;
  try {
    git(['checkout', BASE_BRANCH]);
    git(['merge', '--ff-only', `origin/${BASE_BRANCH}`]);
  } catch (e) {
    ffFailed = `${BASE_BRANCH} ff-only失敗: ${e.message}`;
  }

  cleanupState();

  if (ffFailed) {
    return {
      ok: false, error: ffFailed,
      hint: 'リモートmainがローカルmainの祖先ではありません (non-fast-forward)。git log + 手動rebaseが必要。',
      sync_status: 'ff_failed',
    };
  }
  return { ok: true, sync_status: 'synced' };
}

// ═ Mode B: Worktree ═

/**
 * R-CM-008 Rule 9 (multi-worktree superset detection)。
 *
 * 本worktreeの変更ファイルsetと、origin/<baseBranch>の最近24h commitが
 * 触れたファイルsetのintersectionを計算し、別セッションのPRが本worktreeの
 * 作業をsilentlyにsupersetとして吸収した可能性を検知する。
 *
 * Multi-worktree同時進行（Claude Code / Codexなど）時、あるセッションが別セッションの
 * commitをsupersetとしてsquash mergeすると、後者のworktreeが意味を失う。
 * fetch直後のdetection → warning（block X — R-CM-031 Reversible default）で
 * ユーザーに気づく機会を提供する。
 *
 * fail-open: gitコマンド失敗時はnullを返す（R-CM-006 Rule 2）。
 *
 * @param {string} absWtPath worktreeの絶対パス
 * @param {string} baseBranch 比較基準branch（通常main）
 * @param {Function} [gitFn=git] git executor (default = モジュールgit wrapper)。Override in tests only.
 * @returns {Array<{sha,subject,files}> | null} overlapが1件以上なら配列、なければnull
 */
export function detectExternalSupersetRisk(absWtPath, baseBranch, gitFn = git) {
  const splitLines = (s) => s.split('\n').map((line) => line.trim()).filter(Boolean);
  try {
    const myFiles = splitLines(
      gitFn(['diff', '--name-only', `origin/${baseBranch}..HEAD`], { cwd: absWtPath }),
    );
    if (myFiles.length === 0) return null;

    // Single `git log --name-only --format="%H %s"` 呼び出しでN+1 spawnを回避。
    // 出力: 各commit blockは空行で区切られる — "<sha> <subject>\n<file1>\n<file2>\n\n<sha2>...".
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

  console.log(`[auto-resolve] 競合ファイルを検出: ${conflictingFiles.join(', ')}`);

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
        console.log(`[auto-resolve] ${file} の競合解決を試行: --theirsを選択後にパッケージ再生成`);
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
        console.log(`[auto-resolve] ${file} の競合解決を試行: --oursを選択`);
        git(['checkout', '--ours', file], { cwd: absWtPath });
        git(['add', file], { cwd: absWtPath });
      }
    }

    const remaining = git(['diff', '--name-only', '--diff-filter=U'], { cwd: absWtPath }).trim();
    if (remaining.length > 0) {
      console.log(`[auto-resolve] 未解決の競合が残っています: ${remaining}`);
      return false;
    }

    git(['commit', '--no-edit'], { cwd: absWtPath });
    console.log(`[auto-resolve] すべての競合が正常に自動解決され、merge commitが生成されました。`);
    return true;
  } catch (err) {
    console.error(`[auto-resolve] 競合解決中にエラー発生: ${err.message}`);
    return false;
  }
}

/**
 * `detectExternalSupersetRisk` のoverlaps配列をユーザー向けwarning文字列にフォーマット。
 * Helper抽出目的: cmdShipWorktree統合経路（warningフォーマット + indentation）を単体テスト
 * 可能化 — code-reviewer agent HIGH-2 (PR #296) リグレッション防止。
 *
 * @param {Array<{sha,subject,files}> | null} overlaps
 * @param {string} baseBranch
 * @returns {string | null} overlapsが1件以上ならwarning string、それ以外null
 */
export function formatSupersetWarning(overlaps, baseBranch) {
  if (!overlaps || overlaps.length === 0) return null;
  const lines = overlaps
    .map((o) => `  ${o.sha} ${o.subject} (${o.files.join(', ')})`)
    .join('\n');
  return `multi-worktree superset危険: origin/${baseBranch} の最近24hマージ${overlaps.length}件が本worktreeの変更ファイルに触れました。本PRがredundantまたはsilentlyにsuperset吸収された可能性 — 変更意図が依然有効か確認してから進めてください。\n${lines}`;
}

/**
 * ship応答の5-source `mergedWarnings` を合成する純粋関数（DEBT-15「mergedWarnings
 * spread」の明示対象）。各sourceのnull/undefinedを防御して平坦配列に結合する。
 * 順序: result → superset → preservation → runBundle → cleanup（ユーザー露出順序契約）。
 *
 * @param {object} p
 * @param {object} p.result            createAndMergePr結果（warnings保有可）
 * @param {string[]} [p.supersetWarnings=[]]
 * @param {string[]} [p.preservationWarnings=[]]
 * @param {object|null} [p.runBundle=null]      warnings保有可
 * @param {object|null} [p.cleanupResult=null]  warnings保有可
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
 * ship応答の`cleanup_hint`分岐のみ分離した純粋関数。cmdShipWorktreeの最も
 * 分岐密度が高いsub-logic（nested ternary）を独立したテスト単位に隔離する。
 *
 * R-CM-010 Iron Law: AIがcleanupを自動実行したと推定するのを禁止 — hintで明示。
 *   - `--no-cleanup` + merged: 後続のcleanup-worktree実行を案内（最優先）。
 *   - 委任cleanupのmain同期失敗（fetch/stash/ff）: そのhintをそのまま伝達
 *     （PRマージは不可逆 — shipはok:true維持、sync状態のみsurface）。
 *   - その他: null。
 *
 * @param {object} p
 * @param {boolean} [p.cleanup=true]   cleanup要求有無（--no-cleanupの反対）
 * @param {boolean} [p.merged=false]   PRマージ成功有無（result.merged）
 * @param {string} p.wtPath            元のworktree引数（未整理hintメッセージ用）
 * @param {object|null} [p.cleanupResult=null]  cmdCleanupWorktree結果
 * @returns {string|null}
 */
export function composeCleanupHint({ cleanup = true, merged = false, wtPath, cleanupResult = null }) {
  if (!cleanup && merged) {
    return `worktree未整理 — 後続実行: node .claude/scripts/create-pr/ops.mjs cleanup-worktree --worktree ${wtPath}`;
  }
  const cr = cleanupResult ?? {};
  return cr.ok === false ? (cr.hint ?? null) : null;
}

/**
 * cmdShipWorktreeの応答組み立てglue — 5-source `mergedWarnings` spread + `cleanup_hint`
 * 分岐 + `?? null` フィールドデフォルト値 — を純粋関数として分離。git/gh/fs呼び出し部と隔離して
 * `formatSupersetWarning`抽出の先例のように単体テスト可能にする（DEBT-15 / DEBT-27）。
 *
 * 動作はcmdShipWorktreeインライン版と同一である（pure refactor — 入力のみ受けて応答形成）。
 *
 * @param {object} p
 * @param {object} p.result            createAndMergePr結果（warnings / merged / ...rest）
 * @param {string[]} [p.supersetWarnings=[]]      R-CM-008 Rule 9 superset警告
 * @param {string[]} [p.preservationWarnings=[]]  run/output保存警告
 * @param {object|null} [p.runBundle=null]        preserveWorktreeRunOutputs結果
 * @param {object|null} [p.cleanupResult=null]    cmdCleanupWorktree結果
 * @param {boolean} [p.cleanedUp=false]           worktree整理完了有無
 * @param {boolean} [p.cleanup=true]              cleanup要求有無（--no-cleanupの反対）
 * @param {string} p.wtPath                       元のworktree引数（cleanup_hintメッセージ用）
 * @param {object|null} [p.postMergeMainStatus=null]  main repo dirty状態
 * @returns {object} ship-worktree最終応答オブジェクト（ok:true固定）
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

// 移植された外部プロジェクト（transplant-bundle対象）はbrief2devパイプラインを使わないため、
// 'output' / 'docs/pipeline-log' のようなありふれた名前の自前ディレクトリを持つ可能性がある — これを
// brief2dev runの成果物と誤認して保存ロジックを発動させてはならない。`.brief2dev/`マーカーが
// 実在するプロジェクト（brief2dev自体 + そのパイプラインを使うscaffold成果物）でのみこの
// ジェネリック候補を含める。マーカーがないプロジェクトはlayout-resolverベースの動的候補
// (`.brief2dev/runs`など、すでに`.brief2dev/`でネームスペース化済み)のみを対象とする。
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
      warnings: ['保存すべきrun/output候補がありません。'],
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
    warnings.push('worktree HEAD sha確認失敗 — manifest.head_sha=nullとして記録。');
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
  if (!existsSync(planPath)) throw new Error(`PLAN.mdなし: ${planPath}`);
  const content = readFileSync(planPath, 'utf-8');
  const force = args.force === true;
  const unchecked = parseUnchecked(content);
  if (!force && unchecked.length > 0) {
    throw new Error(
      `PLAN.mdに未完了のタスクが${unchecked.length}件あります:\n${unchecked.join('\n')}\n\n` +
      `※ 回避: --force、または項目に(取消済み)/(dropped)/(deferred)/~~取り消し線~~ マーカーを追加`
    );
  }
  return {
    ok: true,
    message: unchecked.length === 0
      ? 'すべてのPLANチェックボックスが完了（または取消/無視）済み'
      : `--force回避で${unchecked.length}件の未完了項目を無視`,
    unchecked_count: unchecked.length,
  };
}

function cmdShipWorktree(args) {
  const wtPath = requireArg(args, 'worktree');
  const absWtPath = resolveWorktreeAbsPath(wtPath);
  if (!existsSync(absWtPath)) {
    // 多重worktree環境でAIがworktree内部cwdからops.mjsを呼び出すと
    // 正規化が誤る場合がしばしばあった（PROJECT_DIR fallbackの罠）。明確な
    // 診断メッセージで誤ったpathとともに実際のアクティブworktree一覧を提示する。
    let candidates = [];
    try {
      candidates = parseWorktreePaths(git(['worktree', 'list', '--porcelain']));
    } catch {
      // git呼び出し失敗 — 単一メッセージへfallback
    }
    const candidateBlock = candidates.length > 0
      ? `\nアクティブなworktree候補:\n  - ${candidates.join('\n  - ')}`
      : '';
    throw new Error(`Worktreeなし: ${absWtPath}${candidateBlock}`);
  }

  // PLAN.md必須検証 (CLAUDE.md「PLAN.md必須」ポリシー。--force-planは未完了チェックボックスの回避用)
  // 位置: .tmp/worktree-<safeBranch>/PLAN.md (worktree-plan-path.mjs SSOT)
  const planPath = resolveWorktreePlanPath(absWtPath);
  if (!existsSync(planPath)) {
    throw new Error(`PLAN.mdファイルが存在しません: ${planPath}。worktreeルートの.tmp/worktree-<branch>/PLAN.mdに作成後、再試行してください。`);
  }
  const forcePlan = args['force-plan'] === true;
  if (!forcePlan) {
    const unchecked = parseUnchecked(readFileSync(planPath, 'utf-8'));
    if (unchecked.length > 0) {
      throw new Error(
        `PLAN.mdに未完了のチェックボックスが${unchecked.length}件あります。\n` +
        `※ 回避: --force-planフラグ、または項目に(取消済み)/(dropped)/(deferred)/~~取り消し線~~ マーカーを追加`
      );
    }
  }

  // Worktree Commit Requirement: create-prはdirty worktreeをshipしない。
  // Stop guardと同じ契約でtracked/untracked変更すべてを先にcommitさせる。
  const status = git(['status', '--porcelain', '--untracked-files=all'], { cwd: absWtPath }).trim();
  if (status.length > 0) {
    const err = new Error(
      `Worktreeにコミットされていない変更があります。\nその変更をコミットしてから再試行してください。\n[状態]\n${status}`
    );
    err.details = {
      code: 'commit_required',
      dirty_status: status.split('\n'),
      hint: 'worktree内でgit status --shortを確認後、自分が作成したファイルのみstage/commitしてship-worktreeを再実行してください。',
    };
    throw err;
  }


  // Push前に元の変更を自動同期（Shift-Left Conflict Detection）
  // + R-CM-008 Rule 9: multi-worktree superset検知（fetch後、merge前）
  const supersetWarnings = [];
  try {
    git(['fetch', 'origin', BASE_BRANCH], { cwd: absWtPath, timeout: 30_000, retry: 3 });

    const overlaps = detectExternalSupersetRisk(absWtPath, BASE_BRANCH);
    const warning = formatSupersetWarning(overlaps, BASE_BRANCH);
    if (warning) supersetWarnings.push(warning);

    try {
      git(['merge', '--no-edit', `origin/${BASE_BRANCH}`], { cwd: absWtPath });
    } catch (mergeErr) {
      console.log(`[ship-worktree] 元(${BASE_BRANCH})とのマージ中に競合が検出されました。自動解決を試みます。`);
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
        console.log(`[ship-worktree] 自動解決完了。検証ツール(${validateCmd})を実行して最終整合性を検査します...`);
        try {
          exec(validateCmd.split(' '), { cwd: absWtPath });
          console.log(`[ship-worktree] 検証通過! 自動競合解決が承認されました。`);
        } catch (gateErr) {
          console.error(`[ship-worktree] 検証失敗: 自動解決されたコードが品質ゲートを通過できませんでした。マージを取り消します。`);
          try { git(['merge', '--abort'], { cwd: absWtPath }); } catch {}
          throw new Error(`自動競合解決後の品質検査(${validateCmd})失敗: ${gateErr.message}`);
        }
      } else {
        console.log(`[ship-worktree] 自動解決完了。実行する品質検査ツールがないため検証をスキップします。`);
      }
    }
  } catch (e) {
    throw new Error(`元(${BASE_BRANCH})とのマージ中に競合が発生しました。手動で競合を解決してからコミットし、再試行してください。\nエラー: ${e.message}`);
  }

  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: absWtPath });
  if (!branch || branch === 'HEAD') throw new Error(`ブランチ特定不可: ${wtPath}`);

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

  // マージ成功時にworktree全体を整理（デフォルト）。--no-cleanupでopt-out。
  // cmdCleanupWorktreeに委任してworktree削除 + ローカルbranch削除だけでなく、
  // auto-checkpoint stash drop（deleteBranchAndStashes）+ CONTEXT.json整理 +
  // ローカルmain同期（fetch + stashベースのff-merge）まで一括実行する。
  // 以前はインラインでworktree remove/prune/branch -Dのみ実行しており、stash・main同期が
  // 漏れていたため、ユーザーがcleanup-worktreeを別途呼び出す必要があった（整理漏れギャップ）。
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
        `cleanupが${candidates.map((candidate) => candidate.relPath).join(', ')}候補を削除します。保存するにはship-worktree --preserve-runを使用してください。`,
      );
    }
    cleanupResult = cmdCleanupWorktree({ worktree: wtPath });
    cleanedUp = cleanupResult.worktree_cleaned === true;
  }

  // ship成功時にPre-Ship Reviewマーカーを整理（R-CM-030ライフサイクル）。
  // 委任cleanup時はcmdCleanupWorktreeがすでにunlink — ここでは--no-cleanup
  // 経路カバー用（冪等 — 重複呼び出し安全）。
  if (result.merged) unlinkShipReviewMarker(wtPath);

  // マージ成功直後にmain repoのworking tree dirty有無を報告。
  // AIはmainのunstaged変更がマージ結果と衝突する可能性を把握し、ユーザーに
  // 明示的なreconcile（git pull --ff-only）を案内すべきである。
  const post_merge_main_status = result.merged ? detectPostMergeMainStatus() : null;

  // 応答組み立てglue（mergedWarnings spread + cleanup_hint分岐 + ?? nullフィールドデフォルト値）
  // は純粋関数composeShipResponseに委任 — git/gh/fs隔離により単体テスト可能
  // (DEBT-15 / DEBT-27, `tests/unit/create-pr-ship-response-compose.test.mjs`)。
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

  // 該当worktreeマーカー + stale (>1h) マーカーGC（R-CM-030ライフサイクル）。
  // ship-worktreeがすでにunlinkしていても冪等 — cancelledフローの累積防止が主目的。
  unlinkShipReviewMarker(wtPath);
  gcStaleShipReviewMarkers();

  let branch = null;
  if (existsSync(absWtPath)) {
    try { branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: absWtPath }); } catch {}
    try { git(['worktree', 'remove', absWtPath, '--force']); } catch {}
    try { git(['worktree', 'prune']); } catch {}
  }
  if (branch) deleteBranchAndStashes(branch);

  // CONTEXT.jsonのworktree参照を整理（存在する場合のみ）
  const ctxPath = join(PROJECT_DIR, 'CONTEXT.json');
  if (existsSync(ctxPath)) {
    try {
      const ctx = JSON.parse(readFileSync(ctxPath, 'utf-8'));
      if (ctx.execution?.worktree?.worktree_path === wtPath) {
        delete ctx.execution.worktree;
        writeFileSync(ctxPath, JSON.stringify(ctx, null, 2) + '\n');
      }
    } catch (e) {
      warnings.push(`CONTEXT.json更新失敗: ${e.message}`);
    }
  }

  // main同期（finalizeと同一意味論、fail-loud）。dirty mainはstashせずabort。
  try {
    git(['fetch', 'origin', BASE_BRANCH], { cwd: PROJECT_DIR, timeout: 60_000, retry: 3 });
  } catch (e) {
    return {
      ok: false, error: `${BASE_BRANCH} fetch失敗: ${e.message}`,
      hint: 'remote確認後に手動同期', sync_status: 'fetch_failed',
      worktree_cleaned: true, warnings,
    };
  }

  // dirty mainは同期せず中断する（自動stash不使用 — 元のworking treeに触れない）。
  // PRはすでにマージ済みのため有効であり、mainローカルsyncのみskipされる（次のworktree-new self-heal）。
  const hasChanges = git(['status', '--porcelain'], { cwd: PROJECT_DIR }).trim().length > 0;
  if (hasChanges) {
    return {
      ok: false,
      error: 'ローカルにuncommittedな変更が存在するため、同期を進めることができません。',
      hint: '変更を手動でcommitするかstashした後、再度同期してください。',
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
    ffFailed = `${BASE_BRANCH} ff-only失敗: ${e.message}`;
  }

  if (ffFailed) {
    return {
      ok: false, error: ffFailed,
      hint: 'リモートmainがローカルの祖先ではありません。手動rebaseが必要',
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

// v2.1: import時のmain()自動実行を防止。リグレッションテストがconstantのみimport可能。
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
