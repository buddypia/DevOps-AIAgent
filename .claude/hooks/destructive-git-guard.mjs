#!/usr/bin/env node

/**
 * destructive-git-guard.mjs - PreToolUse Bash Hook
 *
 * Claude Code の Bash ツールで破壊的な git コマンドをブロックする。
 *
 * 防御体系における役割:
 * ┌──────────────────────────────────────────────────────────────┐
 * │ L1: settings.json deny ルール → defaultMode 設定に依存       │
 * │ L2: この Hook                 → PreToolUse でコマンド解析・ブロック│
 * │ L3: .git/hooks/              → git native レベルでブロック   │
 * └──────────────────────────────────────────────────────────────┘
 *
 * L1(deny) が bypassPermissions などで無効化されても、
 * この Hook(L2) が独立して破壊的なコマンドをブロックする。
 *
 * ブロック対象:
 * - git reset (--hard, --mixed, HEAD など)
 * - git checkout . / git checkout -- <file>
 * - git restore (unstaged 変更の復元)
 * - git clean -f/-d (untracked ファイル削除)
 * - git stash clear (すべての stash スナップショットを一括削除 — 復元不可)
 * - git push --force / -f (リモート履歴の破壊)
 * - git rebase (履歴の変更)
 *
 * 許可される例外:
 * - git stash push/save/drop (バックアップ作成/単一削除)
 * - git stash apply/pop (バックアップ復元)
 * - git stash list/show/branch / 引数なしの git stash (照会/作成)
 * - git checkout <branch-name> (ブランチ切り替え)
 * - git reset --soft (コミットのみ解除、変更は維持)
 */

import { readStdin, output, safeHookMain } from '../scripts/lib/utils.mjs';
import { HookOutput } from '../scripts/lib/hook-output.mjs';

/**
 * 破壊的な git コマンドのパターン定義
 * 各パターンは { regex, description, allowIf? } 形式
 */
const DESTRUCTIVE_PATTERNS = [
  {
    // git reset --hard, git reset HEAD, git reset (mixed を含む)
    // 許可: git reset --soft (コミットのみ解除)
    regex: /\bgit\s+reset\b(?!.*--soft)/i,
    description: 'git reset は作業中の変更を削除します',
    allowIf: null,
  },
  {
    // git checkout . または git checkout -- <path>
    // 許可: git checkout <branch>, git checkout -b <branch>
    regex: /\bgit\s+checkout\s+(\.|\-\-\s)/i,
    description: 'git checkout ./-- は作業中の変更を削除します',
    allowIf: null,
  },
  {
    // git restore (unstaged の復元)
    // 許可: git restore --staged (安全 - staging からの unstage のみ実行、変更は維持)
    regex: /\bgit\s+restore\b(?!.*--staged)/i,
    description: 'git restore は作業中の変更を削除します',
    allowIf: null,
  },
  {
    // git clean -f, -fd, -fx など
    regex: /\bgit\s+clean\s+.*-[fdxX]/i,
    description: 'git clean は untracked ファイルを永久に削除します',
    allowIf: null,
  },
  {
    // git stash clear (すべての stash entry を一括削除 — reflog なしで復元不可)。
    // ユーザー決定 2026-05-18: stash ポリシーを clear のみ厳格化に緩和 (push/save/drop/apply/pop 等は許可)。
    regex: /\bgit\s+stash\s+clear\b/i,
    description: 'git stash clear はすべての stash スナップショットを一括削除します (復元不可)',
    allowIf: null,
  },
  {
    // git push --force, git push -f
    regex: /\bgit\s+push\s+.*(-f\b|--force\b)/i,
    description: 'git push --force はリモートリポジトリの履歴を破壊します',
    allowIf: null,
  },
  {
    // git rebase
    regex: /\bgit\s+rebase\b/i,
    description: 'git rebase はコミット履歴を変更します',
    allowIf: null,
  },
];

/**
 * コマンドに破壊的な git パターンが含まれるか検査する
 * @param {string} command - Bash コマンド
 * @returns {{ blocked: boolean, description: string, matched: string }}
 */
function checkDestructiveGit(command) {
  if (!command || typeof command !== 'string') {
    return { blocked: false };
  }

  // 複数行または && / ; / | で連結された複合コマンドも検査
  for (const pattern of DESTRUCTIVE_PATTERNS) {
    const match = command.match(pattern.regex);
    if (match) {
      // allowIf 条件の確認
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

async function main() {
  try {
    const data = await readStdin();

    // Bash ツールのみ検査 (matcher で既にフィルタされているが安全装置)
    const toolName = data.tool_name || '';
    if (toolName !== 'Bash') {
      return output(HookOutput.passthrough());
    }

    // コマンド抽出
    const command = data.tool_input?.command || '';

    const result = checkDestructiveGit(command);

    if (result.blocked) {
      const reason =
        `[Destructive Git Guard] 破壊的な git コマンドが検出されたためブロックします。\n\n` +
        `ブロックされたコマンド: ${result.matched}\n` +
        `理由: ${result.description}\n\n` +
        `このコマンドはコミットされていない作業を永久に削除する可能性があります。\n` +
        `先にユーザーへ確認を取ってから進めてください。`;

      return output(HookOutput.deny(reason));
    }

    // 安全なコマンド → 通過
    return output(HookOutput.passthrough());
  } catch { /* non-critical */
    return output(HookOutput.passthrough());
  }
}

safeHookMain(main);
