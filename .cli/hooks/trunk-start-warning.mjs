#!/usr/bin/env node

/**
 * trunk-start-warning.mjs - SessionStart Hook
 *
 * main ブランチで AI セッション進入時に worktree 案内をコンテキストとして注入する。
 *
 * R-CM-006 Rule 1 整合: SessionStart は side-effect-only イベントであるため
 * セッションフロー自体を遮断することはできない (Claude Code Hooks spec —
 * https://code.claude.com/docs/en/hooks)。したがって本 hook は deny/block ではなく
 * additionalContext 注入のみを遂行する。
 *
 * 実際の destructive 遮断 (main への直接 commit / 新規 branch 作成 / force push) は、
 * commit-guard / branch-create-guard / destructive-git-guard が PreToolUse 時点にて担当する。
 *
 * 本 hook は advisory (案内) 専用のため選択事項である — 毎回の main セッションコンテキスト注入コストが
 * 価値より大きいと判断される場合は、hook-registry から除去しても実際の遮断 (上記の guard 群) には影響しない。
 *
 * 迂回条件 (警告未注入):
 *   - 環境変数 `ALLOW_MAIN_SESSION=1` 設定時
 *   - 現在のブランチが trunk (main/master) ではないとき (hotfix/* など自動免除)
 *
 * trunk ブランチ名: 'main' ハードコーディング時は master 基本ブランチの外部プロジェクト (git-worktree-isolation
 * バンドル移植対象) で警告が差し障りなく欠落する — worktree-new.mjs の自動 base 検知
 * (origin/HEAD → main → master) と同様に両方の名前ともに trunk と認識する。
 */

import {
  readStdin,
  output,
  safeHookMainWithProfile,
  safeGit,
  resolveProjectDir,
} from '../lib/utils.mjs';
import { HookOutput } from '../lib/hook-output.mjs';

const TRUNK_BRANCHES = new Set(['main', 'master']);

export async function run(data) {
  try {
    const projectDir = resolveProjectDir(data);
    const branch = safeGit('branch --show-current', projectDir, { timeout: 2000 });

    if (!branch) return HookOutput.passthrough();
    if (!TRUNK_BRANCHES.has(branch)) return HookOutput.passthrough();

    // Bypass check
    if (process.env.ALLOW_MAIN_SESSION === '1' || process.env.ALLOW_MAIN_SESSION === 'true') {
      return HookOutput.passthrough();
    }

    const warningMessage =
      `[Trunk Warning] ${branch} ブランチにおいて AI セッションが進行中です。\n\n` +
      `AI の作業は隔離された Git worktree 内で進行するのが標準です。\n` +
      `${branch} への直接 commit / 新規 branch 作成 / force push は個別の guard により遮断されます。\n\n` +
      `→ worktree 生成:\n` +
      `    make wt.new BR=feature/<task>\n\n` +
      `→ 本警告を未注入 (read-only 探索など):\n` +
      `    ALLOW_MAIN_SESSION=1 環境変数の設定時は本案内非表示`;

    return HookOutput.context(warningMessage, 'SessionStart');
  } catch (_) {
    return HookOutput.passthrough();
  }
}

if (!globalThis.__HOOK_ORCHESTRATOR__) {
  safeHookMainWithProfile('trunk-start-warning', async () => {
    const data = await readStdin();
    return output(await run(data));
  });
}
