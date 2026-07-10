#!/usr/bin/env node

/**
 * destructive-git-guard.mjs - PreToolUse Bash Hook
 *
 * Claude Code の Bash ツールで破壊的な git コマンドを遮断します。
 *
 * 防御体系における役割:
 * ┌──────────────────────────────────────────────────────────────┐
 * │ L1: settings.json deny 規則 → defaultMode 設定に依存        │
 * │ L2: この Hook                → PreToolUse でコマンドパージ遮断│
 * │ L3: .git/hooks/              → git native レベルで遮断        │
 * └──────────────────────────────────────────────────────────────┘
 *
 * L1(deny) が bypassPermissions などにより無力化されたとしても、
 * この Hook(L2) が独立して破壊的なコマンドを遮断します。
 *
 * 遮断対象 (working tree 破壊コマンドのみ):
 * - git reset --hard/--merge/--keep (working tree 破壊)
 * - git checkout . / git checkout -- <file> (working tree 破壊)
 * - git restore . / glob / <dir>/ / :magic / pathspec 不在 (working tree 広域破壊)
 * - git clean -f/-d (untracked ファイル削除)
 * - git stash clear (すべての stash スナップショット一括削除 — 復旧不可)
 * - git push --force / -f (リモートヒストリ破壊)
 * - git rebase (ヒストリ変更)
 * - git push --no-verify (pre-push 検証 hook 迂回 — agent-worktree-guard retire 吸収 2026-06-26)
 * - raw git worktree add/remove (標準エントリーポイントの迂回 — 上記同様)
 * - rm -rf <.worktrees/...> (worktree ディレクトリ強制削除 — 上記同様, tokenizer classifyRmWorktree)
 *
 * 許容 (inherently safe — working tree 保存):
 * - git reset --soft (HEAD のみ移動)
 * - git reset HEAD <files> / git reset HEAD -- <files> (unstage, index のみ修正)
 * - git reset (bare, --mixed) (全体 unstage, index のみ修正)
 * - git restore --staged (unstage, index のみ修正)
 * - git restore <明示的ファイル> (bounded blast radius — stash drop (単一) の前例と同型, ユーザー決定 2026-06-16)
 * - git stash push/save/drop/apply/pop/list/show/branch / 引数なし of git stash (clear 以外のすべての stash を許容)
 * - git checkout <branch-name> (ブランチの切り替え)
 */

import { existsSync, statSync } from 'fs';
import { join } from 'path';
import { readStdin, output, safeHookMainWithProfile } from '../lib/utils.mjs';
import { HookOutput } from '../lib/hook-output.mjs';
// heredoc body 除去 — `cat <<EOF\ngit stash clear\nEOF` のようなデータコンテキストの destructive
// 文字列が newline anchor (`\n` chain operator 認識) により false-positive 遮断される問題を解決。
// lib SSOT — pre-ship-review-guard も同一の lib を使用 (cross-hook circular execution を回避)。
import { stripHeredocBodies } from '../lib/heredoc-strip.mjs';
import { anchoredPattern } from '../lib/hook-anchors.mjs';

/**
 * 破壊的な git コマンドパターン定義
 * 各パターンは { regex, description, allowIf? } 形式
 */
const DESTRUCTIVE_PATTERNS = [
  {
    // git reset --hard (HEAD + index + working tree すべてリセット = データ破壊)
    // git reset --merge, --keep (working tree 条件付き変更 = 危険)
    //
    // 許容 (working tree 保存, inherently safe):
    //   --soft             → HEAD のみ移動
    //   --mixed (基本)     → index のみリセット, working tree 保存
    //   HEAD <files>       → 特定ファイル unstage (index のみ修正)
    //   HEAD -- <files>    → 上記と同様 (-- 区切り文字)
    //   (bare)             → 全体 unstage (index のみ修正)
    //
    // 判別基準: --hard/--merge/--keep フラグの存在有無のみで決定。
    // フラグのない git reset は mixed モードであり working tree に手を加えないため安全。
    regex: anchoredPattern('git\\s+reset\\s+--(hard|merge|keep)\\b', 'i'),
    description: 'git reset --hard/--merge/--keep は作業中の変更事項を削除します',
    allowIf: null,
  },
  {
    // git checkout . または git checkout -- <path>
    // 許容: git checkout <branch>, git checkout -b <branch>
    regex: anchoredPattern('git\\s+checkout\\s+(\\.|\\-\\-\\s)', 'i'),
    description: 'git checkout ./-- は作業中の変更事項を削除します',
    allowIf: null,
  },
  // git restore は DESTRUCTIVE_PATTERNS から除去されました (ユーザー決定 2026-06-16)。
  //   regex 基準の検査は `git -C x restore .` のような global option 迂回に対して構造的に脆弱
  //   (regex が git↔restore 近接を要求)。tokenizer 基準の classifyRestore() が専担し、
  //   checkDestructiveGit() から別途呼び出される — blast-radius scoped 許容/遮断。
  {
    // git clean -f, -fd, -fx など
    regex: anchoredPattern('git\\s+clean\\s+.*-[fdxX]', 'i'),
    description: 'git clean は untracked ファイルを永久に削除します',
    allowIf: null,
  },
  {
    // git stash clear (すべての stash entry 一括削除 — reflog なしでは復旧不可)。
    //
    // ユーザー決定 2026-05-18: stash ポリシーを clear-only に緩和。
    // push/save/drop/apply/pop/list/show/branch および引数なしの git stash は
    // すべて許容する (マルチターミナルの untracked 損失懸念より stash 活用性を優先)。
    // clear のみ遮断 — 単一の drop とは異なり全体一括削除のため、ミス時の被害範囲が大きい。
    //
    // ミスマッチ (安全なコマンドは通過):
    //   git stash push / save / drop / apply / pop / list / show / branch
    //   引数なしの git stash (= 暗黙的 push)
    regex: anchoredPattern('git\\s+stash\\s+clear\\b', 'i'),
    description: 'git stash clear はすべての stash スナップショットを一括削除します (復旧不可)',
    allowIf: null,
  },
  {
    // git push --force, git push -f
    regex: anchoredPattern('git\\s+push\\s+.*(-f\\b|--force\\b)', 'i'),
    description: 'git push --force はリモートリポジトリのヒストリを破壊します',
    allowIf: null,
  },
  {
    // git rebase
    regex: anchoredPattern('git\\s+rebase\\b', 'i'),
    description: 'git rebase はコミットヒストリを変更します',
    allowIf: null,
  },
  {
    // git push --no-verify (pre-push/pre-commit 検証 hook 迂回)
    // agent-worktree-guard(Python) retire 時に吸収 (2026-06-26)。
    regex: anchoredPattern('git\\s+push\\s+.*--no-verify\\b', 'i'),
    description: 'git push --no-verify は pre-push 検証 hook を迂回します',
    allowIf: null,
  },
  {
    // raw git worktree add/remove (標準エントリーポイントの迂回 → stale base / 未整理リスク)。
    // 生成は make wt.new (worktree-new.mjs)、除去は /create-pr ship-worktree cleanup。
    // create-pr フローの worktree remove は run() の CREATE_PR_SAFE_PATTERNS carve-out により許容。
    // agent-worktree-guard (Python) retire 時に吸収 (2026-06-26)。
    regex: anchoredPattern('git\\s+worktree\\s+(add|remove)\\b', 'i'),
    description:
      'raw git worktree add/remove は遮断されます (生成: make wt.new, 除去: /create-pr ship-worktree)',
    allowIf: null,
  },
];

// ── create-pr Safe Command Allowlist ──
//
// create-pr フロー進行中 (.tmp/create-pr-active 存在時)
// 以下のパターンのみ追加で許容。その他の破壊的コマンドはフラグ有無に関わらず遮断。
//
// 安全性根拠:
//   git merge --ff-only:  HEAD 前進のみ遂行。ヒストリ変更不可。衝突時は git 拒否。
//   git worktree remove:  隔離された worktree ディレクトリのみ削除。
//
// 除去された項目:
//   git reset HEAD -- <path>: DESTRUCTIVE_PATTERNS 自体が --hard/--merge/--keep のみ
//   遮断するため unstage はフラグがなくても常に許容される。(v2.1)
//
// フラグ漏洩時の影響:
//   上記 2つのコマンドはデータ破壊が不可能なためセキュリティ影響なし。
const CREATE_PR_SAFE_PATTERNS = [
  /\bgit\s+merge\s+--ff-only\b/i,
  /\bgit\s+worktree\s+remove\b/i,
];

const CREATE_PR_ACTIVE_TTL_MS = 30 * 60 * 1000;

const WORKTREE_SHIPPING_BRANCH_PREFIXES = [
  'feature',
  'fix',
  'chore',
  'docs',
  'refactor',
  'test',
  'perf',
  'ci',
  'build',
  'style',
  'hotfix',
  'release',
];

function isCreatePrSafeCommand(command) {
  return CREATE_PR_SAFE_PATTERNS.some(p => p.test(command));
}

function isFreshCreatePrFlag(flagPath, now = Date.now()) {
  try {
    if (!existsSync(flagPath)) return false;
    const ageMs = now - statSync(flagPath).mtimeMs;
    return ageMs <= CREATE_PR_ACTIVE_TTL_MS;
  } catch {
    return false;
  }
}

/**
 * `git commit -m <body>` のメッセージ本文を検査対象から除外する。
 *
 * Problem: regex が `\bgit\s+reset\s+--hard\b` でマッチするため、commit メッセージ本文に
 * 入った `git reset --hard` のようなテキストも false-positive 遮断。本関数は `-m` 引数の
 * クォーテーション/heredoc 本文のみを strip して false-positive を遮断する。
 *
 * 処理する3つの変形 (Bash 標準 -m 使用様式):
 *   -m "$(cat <<'EOF' ... EOF)"   — heredoc inside command substitution
 *   -m '...'                        — single-quoted literal
 *   -m "..."                        — double-quoted literal
 *
 * 他の quoted context (例: `echo "git reset --hard"`) は意図的に strip しない。
 * 安全側 — `-m` 以外の任意の string literal は destructive コマンドを正当化する意図が
 * 明確ではないため遮断を維持。
 *
 * @param {string} command
 * @returns {string} stripped command
 */
export function stripCommitMessageBody(command) {
  let result = command;
  result = result.replace(
    /-m\s+"\$\(cat\s+<<\s*['"]?(\w+)['"]?\s*[\r\n][\s\S]*?[\r\n]\1\s*\)"/g,
    '-m ""'
  );
  result = result.replace(/-m\s+'(?:[^'\\]|\\.)*'/g, "-m ''");
  result = result.replace(/-m\s+"(?:[^"\\]|\\.)*"/g, '-m ""');
  return result;
}

function shellishTokens(commandSegment) {
  const tokens = [];
  const tokenPattern = /"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|(\S+)/g;
  for (const match of commandSegment.matchAll(tokenPattern)) {
    tokens.push(match[1] ?? match[2] ?? match[3]);
  }
  return tokens;
}

/**
 * `git <global-option...> <subcommand>` から git global option を除去して `git <subcommand>` に正規化。
 * regex 基準の DESTRUCTIVE_PATTERNS は `git\s+<subcommand>` 近接を要求するため `-C <path>` / `-c k=v` /
 * `--git-dir=` / `--work-tree=` / `--no-pager` など global option が挟まると迂回される (例: `git -C x push --force`)。
 * classifyRestore/classifyRmWorktree (tokenizer) は独自処理するため、本正規化は DESTRUCTIVE_PATTERNS 専用。
 * subcommand オプション (`git commit -C HEAD` の -C) は `git` 直後ではないため影響を受けない。
 * agent-worktree-guard retire 時に吸収 — 旧 guard.py が git_invocation() で処理していた迂回防御を復元。
 * @param {string} command
 * @returns {string}
 */
export function stripGitGlobalOptions(command) {
  if (!command || typeof command !== 'string') return command;
  const STEP =
    /\bgit\s+(?:-C\s+\S+|-C\S+|-c\s+\S+|--git-dir(?:=\S+|\s+\S+)|--work-tree(?:=\S+|\s+\S+)|--namespace(?:=\S+|\s+\S+)|--no-pager|--paginate|--literal-pathspecs|--no-optional-locks|--bare)(\s+)/gi;
  let prev;
  let out = command;
  do {
    prev = out;
    out = out.replace(STEP, 'git$1');
  } while (out !== prev);
  return out;
}

/**
 * `git merge --ff-only <target>` 形式から merge target を抽出する。
 * `git -C <path> merge --ff-only ...` のような git global option も許容する。
 *
 * @param {string} command
 * @returns {string|null}
 */
export function extractFastForwardMergeTarget(command) {
  if (!command || typeof command !== 'string') return null;

  const inspectable = stripCommitMessageBody(stripHeredocBodies(command));
  const commandSegments = inspectable.split(/[\n;&|]+/);

  for (const segment of commandSegments) {
    const args = shellishTokens(segment);
    const gitIndex = args.findIndex(arg => arg === 'git');
    if (gitIndex < 0) continue;

    let mergeIndex = -1;
    for (let i = gitIndex + 1; i < args.length; i += 1) {
      const arg = args[i];
      if (arg === 'merge') {
        mergeIndex = i;
        break;
      }
      if (arg === '-C' || arg === '-c' || arg === '--git-dir' || arg === '--work-tree') {
        i += 1;
        continue;
      }
      if (
        arg.startsWith('-C') ||
        arg.startsWith('-c') ||
        arg.startsWith('--git-dir=') ||
        arg.startsWith('--work-tree=') ||
        arg === '--no-pager' ||
        arg === '--literal-pathspecs' ||
        arg === '--no-optional-locks'
      ) {
        continue;
      }
    }

    if (mergeIndex < 0) continue;

    const mergeArgs = args.slice(mergeIndex + 1);
    if (!mergeArgs.includes('--ff-only')) continue;

    const target = mergeArgs.find(arg => arg !== '--ff-only' && arg !== '--no-edit' && !arg.startsWith('-'));
    if (target) return target;
  }

  return null;
}

function normalizeBranchTarget(target) {
  return target
    .replace(/^refs\/heads\//, '')
    .replace(/^refs\/remotes\/[^/]+\//, '')
    .replace(/^[^/]+\/(?=(feature|fix|chore|docs|refactor|test|perf|ci|build|style|hotfix|release)\/)/, '');
}

/**
 * create-pr 外部から worktree ブランチを main に直接 fast-forward merge する
 * shipping 迂回を検知する。`origin/main` freshness sync は許容される必要があるため、
 * GitHub Flow 系の branch prefix のみ遮断する。
 *
 * @param {string} command
 * @returns {boolean}
 */
export function isDirectWorktreeShippingMerge(command) {
  const target = extractFastForwardMergeTarget(command);
  if (!target) return false;

  const normalized = normalizeBranchTarget(target);
  return WORKTREE_SHIPPING_BRANCH_PREFIXES.some(prefix => normalized.startsWith(`${prefix}/`));
}

/**
 * 単一の pathspec が局所 (bounded) であるか判定する。
 * 具体的なファイルパスのみ true。cwd 再帰(.)/glob/magic/ディレクトリは false。
 *
 * @param {string} p
 * @returns {boolean}
 */
function isBoundedPathspec(p) {
  if (!p) return false;
  const u = p.replace(/\\(.)/g, '$1'); // shell バックスラッシュエスケープ解除 (\. → . , \* → *)
  // glob(* ? [ ]) / brace({ }) / 変数・置換($ `) — expand 結果が静的に未知 (例: {.,x} → . 包含)。
  if (/[*?[\]{}$`]/.test(u)) return false;
  if (u.startsWith(':')) return false; // magic pathspec (:/ , :(top) など repo-root 広域)
  if (u.startsWith('~')) return false; // home 拡張 (広域可能)
  if (u.endsWith('/')) return false; // 明示的ディレクトリ (再帰)
  // path segment が . または .. であれば cwd/上位/ディレクトリに normalize される → 広域 (foo/.. , ./. , ../x , .)。
  if (u.split('/').some(seg => seg === '.' || seg === '..')) return false;
  return true; // 具体的なファイルパス
}

/**
 * `restore` subcommand 引数から pathspec を抽出し、すべて bounded であるか判定する。
 *
 * @param {string[]} args - 'restore' の後ろのトークン群
 * @returns {boolean}
 */
function isBoundedRestoreArgs(args) {
  // 別途値を持つオプション (次のトークンを値として消費)
  const VALUE_OPTS = new Set(['--source', '-s']);
  let sawDashDash = false;
  const pathspecs = [];

  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (!sawDashDash && a === '--') {
      sawDashDash = true;
      continue;
    }
    if (!sawDashDash && a.startsWith('-')) {
      // pathspec を外部ファイル/stdin から読み取るオプションは内容を静的検査できないため保守的遮断。
      if (a === '--pathspec-from-file' || a.startsWith('--pathspec-from-file=')) return false;
      if (VALUE_OPTS.has(a)) {
        i += 1; // オプション値を消費 (例: --source HEAD)
        continue;
      }
      continue; // --staged / --worktree / -W / -p など値のないフラグ
    }
    pathspecs.push(a);
  }

  if (pathspecs.length === 0) return false; // pathspec 不在 → 意図不明、遮断
  return pathspecs.every(isBoundedPathspec);
}

/**
 * コマンド segment が shell command substitution / parameter expansion を含むか。
 * 含む場合 restore の実際の blast radius を静的に知ることができない (置換内容 = 未知)。
 *
 * @param {string} s
 * @returns {boolean}
 */
function hasShellSubstitution(s) {
  return /\$[({]/.test(s) || s.includes('`');
}

/**
 * git global option 群を読み飛ばし、restore subcommand トークンインデックスを見つける。
 * `git -C <path> restore`, `git --no-pager restore` など global option 迂回を閉じる
 * (regex 基準の検査は git↔restore 近接を要求し、この迂回に構造的に脆弱)。
 *
 * @param {string[]} tokens
 * @returns {number} restore インデックス, およその位置、なければ -1
 */
function findRestoreIndex(tokens) {
  const gitIndex = tokens.findIndex(t => t === 'git');
  if (gitIndex < 0) return -1;
  for (let i = gitIndex + 1; i < tokens.length; i += 1) {
    const t = tokens[i];
    if (t === 'restore') return i;
    // 別途値を持つ global option → 値トークン消費
    if (t === '-C' || t === '-c' || t === '--git-dir' || t === '--work-tree') {
      i += 1;
      continue;
    }
    if (t.startsWith('-')) continue; // 値のない global flag (--no-pager / --literal-pathspecs / -C glued など)
    return -1; // restore ではない他の subcommand
  }
  return -1;
}

/**
 * restore 引数が unstage-only (--staged であり --worktree なし) であるか。
 * unstage-only は working tree に手を加えないため pathspec 範囲と関係なく安全。
 *
 * @param {string[]} args - 'restore' の後ろのトークン群
 * @returns {boolean}
 */
export function isUnstageOnly(args) {
  let staged = false;
  let worktree = false;
  for (const a of args) {
    if (a === '--') break; // 以降は pathspec
    if (a === '--staged') staged = true;
    if (a === '--worktree') worktree = true;
  }
  return staged && !worktree;
}

/**
 * `git restore` 呼び出しを分类する: 'block' | 'allow' | 'none'。
 *
 * ポリシー (ユーザー決定 2026-06-16 — blast-radius scoped 緩和): stash drop (単一) 許容 /
 * clear (全体) 遮断の前例と同型。明示的ファイル対象の restore は許容し、working tree
 * 全体/ディレクトリ/glob/置換/広域 pathspec を一回で吹き飛ばす大型 blast radius のみ遮断する。
 *
 * regex ではなく tokenizer 基準なため global option 迂回 (`git -C x restore .`) を閉じる。
 * command substitution (`$(...)`, backtick) が restore segment にあれば置換内容を
 * 静的に知ることができないため、保守的に遮断する (--pathspec-from-file 遮断と同一精神)。
 * バックスラッシュエスケープ (`\.`) は isBoundedPathspec が unescape 後に判定する。
 *
 * Known limitation: 後行スラッシュのないディレクトリ名 (`git restore src`) は静的に
 * ファイル/ディレクトリの区分が不可能なため bounded と判定される (FS stat 回避 — R-CM-006 fail-open)。
 * 主な脅威である `git restore .` 広域削除は遮断される。
 *
 * 遮断ガードの文脈であるためパージ曖昧時は 'block' 側へ conservative。
 *
 * @param {string} command
 * @returns {'block'|'allow'|'none'}
 */
export function classifyRestore(command) {
  if (!command || typeof command !== 'string') return 'none';

  const inspectable = stripCommitMessageBody(stripHeredocBodies(command));
  const segments = inspectable.split(/[\n;&|]+/);

  let sawRestore = false;
  for (const segment of segments) {
    // restore を言及する segment に shell 置換があれば blast radius 未知 → 遮断。
    // (置換が inner `git restore .` を隠蔽するか pathspec を動的生成する迂回を遮断)
    if (hasShellSubstitution(segment) && /\brestore\b/i.test(segment)) {
      return 'block';
    }

    const tokens = shellishTokens(segment);
    const restoreIndex = findRestoreIndex(tokens);
    if (restoreIndex < 0) continue;

    sawRestore = true;
    const args = tokens.slice(restoreIndex + 1);
    if (isUnstageOnly(args)) continue; // --staged (working tree 非接触) → 許容
    if (isBoundedRestoreArgs(args)) continue; // 明示的ファイル → 許容
    return 'block'; // 大型 blast radius
  }

  return sawRestore ? 'allow' : 'none';
}

/**
 * rm 引数トークン群が recursive(-r/-R/--recursive) AND force(-f/--force) をすべて包含するか。
 * 結合短縮フラグ (-rf/-fr) + 分離フラグ (-r -f) + long フラグをすべて認識。
 * @param {string[]} args - 'rm' の後ろのトークン群
 * @returns {boolean}
 */
function rmHasRecursiveForce(args) {
  let recursive = false;
  let force = false;
  for (const t of args) {
    if (!t.startsWith('-') || t === '--') continue;
    if (t === '--recursive' || /^-[a-zA-Z]*[rR][a-zA-Z]*$/.test(t)) recursive = true;
    if (t === '--force' || /^-[a-zA-Z]*f[a-zA-Z]*$/.test(t)) force = true;
  }
  return recursive && force;
}

/**
 * rm 引数トークンのうち非フラグ path が `.worktrees/` ディレクトリを指すか。
 * バックスラッシュエスケープ (`\.`) は unescape 後に判定。
 * @param {string[]} args - 'rm' の後ろのトークン群
 * @returns {boolean}
 */
function rmTargetsWorktree(args) {
  const WT = /(^|\/)\.worktrees(\/|$)/;
  return args.some((t) => !t.startsWith('-') && WT.test(t.replace(/\\(.)/g, '$1')));
}

/**
 * `rm -rf <.worktrees/...>` を検出する (worktree ディレクトリの強制削除を遮断)。
 * 標準の除去パスは /create-pr ship-worktree cleanup (または create-pr フローの git worktree remove)。
 * agent-worktree-guard (Python) retire 時に吸収 (2026-06-26)。regex ではなく tokenizer 基準
 * (classifyRestore 同型) でフラグ順序/global option 変形に robust。
 * @param {string} command
 * @returns {boolean}
 */
export function classifyRmWorktree(command) {
  if (!command || typeof command !== 'string') return false;
  const inspectable = stripCommitMessageBody(stripHeredocBodies(command));
  for (const segment of inspectable.split(/[\n;&|]+/)) {
    const tokens = shellishTokens(segment);
    const rmIdx = tokens.indexOf('rm');
    if (rmIdx < 0) continue;
    const args = tokens.slice(rmIdx + 1);
    if (rmHasRecursiveForce(args) && rmTargetsWorktree(args)) return true;
  }
  return false;
}

/**
 * コマンドから破壊的な git パターンを検査します
 * @param {string} command - Bash コマンド
 * @returns {{ blocked: boolean, description?: string, matched?: string }}
 */
export function checkDestructiveGit(command) {
  if (!command || typeof command !== 'string') {
    return { blocked: false };
  }

  const inspectable = stripCommitMessageBody(stripHeredocBodies(command));

  if (isDirectWorktreeShippingMerge(command)) {
    return {
      blocked: true,
      kind: 'worktree-shipping',
      description: 'worktree branch fast-forward merge は create-pr ship-worktree パスのみで遂行する必要があります',
      matched: extractFastForwardMergeTarget(command),
    };
  }

  // git restore は tokenizer 基準の classifyRestore が専担 (global option 迂回遮断)。
  // 'allow'/'none' であれば通過 (ただし、他の destructive パターン検査は継続 — 例: restore && reset --hard)。
  if (classifyRestore(command) === 'block') {
    return {
      blocked: true,
      description:
        'git restore . / glob / ディレクトリ / 置換 / 広域 pathspec は working tree 変更を広域削除します (明示的な単一ファイル restore は許容)',
      matched: 'git restore',
    };
  }

  // rm -rf <.worktrees/...> — worktree ディレクトリ強制削除を遮断 (tokenizer 基準)。
  if (classifyRmWorktree(command)) {
    return {
      blocked: true,
      description:
        'rm -rf で worktree ディレクトリを削除することは遮断されます (除去: /create-pr ship-worktree cleanup または create-pr フローの git worktree remove)',
      matched: 'rm -rf .worktrees',
    };
  }

  // 複数行または && / ; / | で連結された複合コマンドも検査。
  // git global option (-C / -c / --git-dir など) 正規化で `git -C <path> push --force` 類の迂回を閉じる
  // (regex パターンが git↔subcommand 近接を要求するため — agent-worktree-guard retire 吸収)。
  const normalized = stripGitGlobalOptions(inspectable);
  for (const pattern of DESTRUCTIVE_PATTERNS) {
    const match = normalized.match(pattern.regex);
    if (match) {
      // allowIf 条件を確認
      if (pattern.allowIf && pattern.allowIf(command)) {
        continue;
      }
      return {
        blocked: true,
        description: pattern.description,
        matched: match[0],
      };
    }
  }

  return { blocked: false };
}

/**
 * Orchestrator 互換エントリーポイント。
 */
export async function run(data) {
  try {
    const toolName = data.tool_name || '';
    if (toolName !== 'Bash') {
      return HookOutput.passthrough();
    }

    const command = data.tool_input?.command || '';

    // create-pr フロー進行中: 安全なコマンドのみ許容、残りは一般の検査として進行
    const projectDir = process.env.CLAUDE_PROJECT_DIR || '';
    const activeFlag = join(projectDir, '.tmp', 'create-pr-active');
    if (isFreshCreatePrFlag(activeFlag) && isCreatePrSafeCommand(command)) {
      return HookOutput.passthrough();
    }

    const result = checkDestructiveGit(command);

    if (result.blocked) {
      if (result.kind === 'worktree-shipping') {
        return HookOutput.deny(
          `[Destructive Git Guard] 直接の worktree branch fast-forward merge が遮断されました。\n\n` +
          `遮断された merge target: ${result.matched}\n` +
          `理由: ${result.description}\n\n` +
          `worktree shipping は /create-pr ship-worktree または ` +
          `node .claude/scripts/create-pr/ops.mjs ship-worktree --worktree <path> パスのみを使用してください。`
        );
      }

      return HookOutput.deny(
        `[Destructive Git Guard] 破壊的な git コマンドが検知されたため遮断します。\n\n` +
        `遮断されたコマンド: ${result.matched}\n` +
        `理由: ${result.description}\n\n` +
        `このコマンドはコミットされていない作業を永久に削除する可能性があります。\n` +
        `ユーザーに先に確認を得たうえで進行してください。`
      );
    }

    return HookOutput.passthrough();
  } catch {
    return HookOutput.passthrough();
  }
}

// Standalone fallback (settings.json から直接呼び出された場合)
if (!globalThis.__HOOK_ORCHESTRATOR__) {
  safeHookMainWithProfile('destructive-git-guard', async () => {
    const data = await readStdin();
    return output(await run(data));
  });
}
