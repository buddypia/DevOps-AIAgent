#!/usr/bin/env node

/**
 * commit-guard.mjs - PreToolUse Bash Hook
 *
 * AI の git commit / branch 生成 / amend を main での直接作業から保護する。
 *
 * ポリシー (マルチターミナル同時作業環境の保護):
 *   - main で의 直接 commit   → 遮断 (worktree 内でのみ commit 許容)
 *   - git commit --amend     → 常に遮断 (push 衝突 + マルチターミナルの history rewrite 危険性)
 *   - ブランチ生成           → 常に遮断 (worktree add の使用を強制)
 *   - worktree commit        → 許容
 *   - git commit --dry-run   → 許容 (検証用)
 *
 * 例外:
 *   - .tmp/create-pr-active ファイル存在時は commit + branch create を許容 (ただし amend は常に遮断)
 *
 * 遮断対象:
 *   - git commit (main ブランチにおいて)
 *   - git commit --amend (すべてのブランチ)
 *   - git checkout -b/-B (新規ブランチ作成)
 *   - git switch -c / -C / --create / --force-create (新規ブランチ作成)
 *   - git branch <name> (新規ブランチ作成)
 *
 * 許容例外:
 *   - git commit --dry-run (実際の commit ではなく検証用)
 *   - git commit (worktree ブランチにおいて)
 *   - git checkout <existing-branch> (ブランチの切り替え、生成ではない)
 *   - git switch <existing-branch> (ブランチの切り替え、生成ではない)
 *   - git branch --list / -a / -v / --show-current / -d / -D (照会/削除)
 *
 * 設計 (テスト可能性):
 *   - isGitCommit / isGitAmend / isGitBranchCreate: 純粋関数、コマンド文字列の検査のみ
 *   - decide({ command, branch, isCreatePrActive }): 純粋関数、ポリシー決定 SSOT
 *   - run(data): I/O (ブランチ検出、state ファイルの確認) の後に decide() を呼び出し
 */

import {
  readStdin,
  output,
  resolveProjectDir,
  safeHookMainWithProfile,
  safeGit,
} from '../lib/utils.mjs';
import { HookOutput } from '../lib/hook-output.mjs';
import { anchoredPattern } from '../lib/hook-anchors.mjs';
import { existsSync } from 'fs';
import { join } from 'path';

const PROJECT_DIR = resolveProjectDir();
const STATE_FILE = join(PROJECT_DIR, '.tmp', 'create-pr-active');

// --- Pattern constants ---
// anchor (コマンド開始 / chain operator / newline 直後のみマッチ) は hook-anchors.mjs SSOT。
// 単純な word boundary `\b` は診断コード / heredoc / grep / echo 内の "git commit"
// 文字列まで false-positive マッチ (ユーザー報告 "shell 停止" の root cause F3, PR #493)。
const GIT_COMMIT_PATTERN = anchoredPattern('git\\s+commit\\b', 'i');
const GIT_AMEND_PATTERN = anchoredPattern('git\\s+commit\\b.*\\B--amend\\b', 'i');
const GIT_CHECKOUT_NEWBRANCH_PATTERN = anchoredPattern('git\\s+checkout\\s+(-b|-B|--orphan)\\b');
const GIT_SWITCH_CREATE_PATTERN = anchoredPattern(
  'git\\s+switch\\s+.*(-c|--create|-C|--force-create)\\b',
  'i',
);
const GIT_BRANCH_PATTERN = anchoredPattern('git\\s+branch\\b', 'i');

/**
 * git commit コマンド検出。amend も commit と見なす (別途 isGitAmend で区分)。
 *
 * @param {string} command
 * @returns {boolean}
 */
export function isGitCommit(command) {
  if (!command || typeof command !== 'string') return false;
  if (!GIT_COMMIT_PATTERN.test(command)) return false;
  // git commit --dry-run は検証用 (実際の commit ではない) → 許容
  if (/--dry-run\b/i.test(command)) return false;
  return true;
}

/**
 * git commit --amend 検出。
 *
 * amend はマルチターミナル環境において以下の危険性を作ります:
 *   - すでに push された commit を amend 時に force push を強制 (R-CM-008 Rule 3 違反)
 *   - 他の worktree が同一ブランチを push しようとする際に衝突
 *
 * @param {string} command
 * @returns {boolean}
 */
export function isGitAmend(command) {
  if (!command || typeof command !== 'string') return false;
  // git commit ... --amend 形式のみマッチ (他のコマンドに偶然 --amend があっても無視)。
  // anchor 適用 — quoted 内の "git commit --amend" の false-positive を遮断。
  return GIT_AMEND_PATTERN.test(command);
}

/**
 * git branch 生成コマンド検出。
 *
 * @param {string} command
 * @returns {boolean}
 */
export function isGitBranchCreate(command) {
  if (!command || typeof command !== 'string') return false;

  // git checkout -b/-B <branch> (新規ブランチ作成、-B は force create)。anchor 適用。
  if (GIT_CHECKOUT_NEWBRANCH_PATTERN.test(command)) return true;

  // git switch -c / --create / -C / --force-create (新規ブランチ作成)。anchor 適用。
  if (GIT_SWITCH_CREATE_PATTERN.test(command)) return true;

  // git branch <name> (新規ブランチ作成)。anchor 適用。
  // 除外: git branch -d/-D (削除), --list, -a, -v, --show-current, -r, --merged など照会/管理フラグ
  if (GIT_BRANCH_PATTERN.test(command)) {
    // 照会/削除/管理専用のフラグがある場合 → ブランチ生成ではない
    if (
      /\bgit\s+branch\s+(-d\b|-D\b|--delete\b|--list\b|-a\b|--all\b|-v\b|--verbose\b|--show-current\b|-r\b|--remote\b|--merged\b|--no-merged\b|--contains\b|--sort\b|--column\b|--no-column\b|--format\b|-m\b|-M\b|--move\b|--copy\b|-c\b|-C\b)/i.test(
        command,
      )
    ) {
      return false;
    }
    // フラグがなく引数がある場合 → ブランチ生成 (例: git branch my-feature)
    // `git branch` 単独 (引数なし) = ブランチ一覧照会 → 許容
    const stripped = command.replace(/\bgit\s+branch\b/i, '').trim();
    if (stripped.length > 0) return true;
  }

  return false;
}

/**
 * ポリシー決定 SSOT。純粋関数。
 *
 * 決定優先順位:
 *   1. amend         → 常に deny (create-pr active でも迂回不可、セキュリティの一貫性)
 *   2. create-pr     → passthrough (commit + branch create 許容)
 *   3. branch create → 常に deny
 *   4. main + commit → deny (worktree commit 許容)
 *   5. その他        → passthrough
 *
 * @param {{ command: string, branch: string, isCreatePrActive: boolean }} ctx
 * @returns {{ action: 'deny' | 'passthrough', kind?: 'amend' | 'branch_create' | 'main_commit' }}
 */
export function decide({ command, branch, isCreatePrActive, isWorktree }) {
  if (isGitAmend(command)) {
    return { action: 'deny', kind: 'amend' };
  }
  if (isCreatePrActive || isWorktree) {
    return { action: 'passthrough' };
  }
  if (isGitBranchCreate(command)) {
    return { action: 'deny', kind: 'branch_create' };
  }
  if (isGitCommit(command) && branch === 'main') {
    return { action: 'deny', kind: 'main_commit' };
  }
  return { action: 'passthrough' };
}

/**
 * 実際のコマンド実行 cwd を基準とする worktree 判定。
 *
 * Codex/Antigravity dispatcher は hook プロセスを repo root で実行できるため、
 * process.cwd() のみを見ると worktree 呼び出しも main と誤判定する。Hook payload の cwd が
 * あればそれを優先使用する。
 *
 * @param {object} [data]
 * @param {string} [fallbackCwd]
 * @returns {boolean}
 */
export function isWorktreeCommandCwd(data, fallbackCwd = process.cwd()) {
  const cwd = typeof data?.cwd === 'string' && data.cwd ? data.cwd : fallbackCwd;
  return typeof cwd === 'string' && cwd.includes('/.worktrees/');
}

function buildDenyMessage(kind) {
  if (kind === 'amend') {
    return (
      `[Commit Guard] git commit --amend が遮断されました。\n\n` +
      `amend はマルチターミナル環境において以下の危険性を作ります:\n` +
      `  - すでに push された commit を amend 時に force push を強制 (R-CM-008 Rule 3 違反)\n` +
      `  - 他の worktree が同一ブランチを push しようとする際に衝突\n\n` +
      `代替案:\n` +
      `  - メッセージ修正のみ必要: git reset --soft HEAD~1 && git commit -m "<new msg>"\n` +
      `  - 新規変更の追加: 新しい commit で訂正 (R-CM-008 Rule 1: 新規 commit を推奨)\n`
    );
  }
  if (kind === 'branch_create') {
    return (
      `[Branch Guard] ブランチ生成が遮断されました。\n\n` +
      `ブランチ生成は worktree とペアにする必要があり、これによりマルチターミナルの衝突を防止できます。\n\n` +
      `代替案 (標準エントリーポイント — fetch + ff main + worktree add origin/main 基準):\n` +
      `  make wt.new BR=feature/<task>\n` +
      `  # または: node .claude/scripts/worktree-new.mjs --branch feature/<task>\n` +
      `または /create-pr スキル — feature ブランチ + PR + squash merge 自動処理。\n`
    );
  }
  // main_commit
  return (
    `[Commit Guard] main ブランチでの直接 commit が遮断されました。\n\n` +
    `このポリシーは、マルチターミナル同時作業によるコード競合の遮断が目的です。\n` +
    `worktree ブランチ内では commit が許容されます。\n\n` +
    `代替案 (標準エントリーポイント — fetch + ff main + worktree add origin/main 基準):\n` +
    `  make wt.new BR=feature/<task>\n` +
    `  # または: node .claude/scripts/worktree-new.mjs --branch feature/<task>\n\n` +
    `[推奨] AI 呼び出し時 'git -C <worktree-path>' を明示 — chained 'cd && git' は hook 評価時点の cwd が main と認識されて遮断されます。\n` +
    `  git -C .worktrees/feature/<task> add <files>\n` +
    `  git -C .worktrees/feature/<task> commit -m "<msg>"\n\n` +
    `[代替案 — ユーザーが直接] cd の後に git commit (ユーザーの shell にて):\n` +
    `  cd .worktrees/feature/<task>\n` +
    `  git commit -m "<msg>"\n\n` +
    `または /create-pr スキル — 自動処理。\n`
  );
}

/**
 * Orchestrator 互換エントリーポイント。
 */
export async function run(data) {
  try {
    const toolName = data.tool_name || '';
    if (toolName !== 'Bash' && toolName !== 'run_shell_command') {
      return HookOutput.passthrough();
    }

    const command = data.tool_input?.command || '';

    // 高速パス: 関連するコマンドでなければ即時通過 (ブランチ検出コストの回避)
    // amend は isGitCommit の部分集合なため、isGitCommit のみのチェックで十分。
    if (!isGitCommit(command) && !isGitBranchCreate(command)) {
      return HookOutput.passthrough();
    }

    const projectDir = resolveProjectDir(data);
    const branch = safeGit('branch --show-current', projectDir, { timeout: 2000 }) || '';
    const isCreatePrActive = existsSync(STATE_FILE);
    // command-cwd based worktree detection.
    // Codex/Antigravity dispatcher 는 hook 프로세스를 repo root 에서 실행할 수 있으므로
    // process.cwd() 대신 payload cwd 를 우선 사용한다.
    const isWorktree = isWorktreeCommandCwd(data);

    const result = decide({ command, branch, isCreatePrActive, isWorktree });

    if (result.action === 'deny') {
      return HookOutput.deny(buildDenyMessage(result.kind));
    }
    return HookOutput.passthrough();
  } catch (_) {
    return HookOutput.passthrough();
  }
}

// Standalone fallback (settings.json から直接呼び出された場合)
if (!globalThis.__HOOK_ORCHESTRATOR__) {
  safeHookMainWithProfile('commit-guard', async () => {
    const data = await readStdin();
    return output(await run(data));
  });
}
