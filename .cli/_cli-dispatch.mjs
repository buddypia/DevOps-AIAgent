#!/usr/bin/env node

/**
 * _cli-dispatch.mjs — 単一汎用マルチ-CLI hook dispatcher（R-CM-006 Rule 4 拡張）
 *
 * 本体 hook の `run(data)` を動的ロード → `runAdapter` に委譲する。以前の CLI 別アダプターファイルの
 * 山（`.claude/hooks/{codex,antigravity}/<name>.mjs`、それぞれ ~17行のボイラープレート）を単一ファイルに
 * 置き換える — 「hook ごとにアダプターファイルを作る」移植労力を排除。
 *
 * codegen（`cli-hooks-codegen.mjs#renderEntry`）が `.codex/hooks.json` / `.claude/hooks.json` /
 * `.gemini/settings.json` の command として次を生成する:
 *   node "$(git rev-parse --show-toplevel)/.cli/_cli-dispatch.mjs" <module> <cli> [eventName]
 *
 * Usage: node _cli-dispatch.mjs <module> <codex|antigravity|gemini> [eventName]
 *   - module    : repo-root 基準の module パス（例: `.cli/hooks/commit-guard.mjs`,
 *                 `.claude/hooks/task-context-injector.mjs`）。dispatcher が repoRoot 基準で解決する。
 *                 許可境界: `.cli/` + `.claude/hooks/` + `.claude/scripts/`（codegen の
 *                 `moduleToRepoRelativePath` 生成集合と1:1）— それ以外のパスは fail-open で拒否。
 *   - cli       : 'codex' | 'antigravity' | 'gemini'（normalizePayload / wire 変換の選択）
 *   - eventName : 'PreToolUse' | 'PostToolUse' | 'UserPromptSubmit' | 'SessionStart' | 'Stop'
 *                 （Antigravity/Gemini wire 変換に必要; Codex では無視）
 *
 * fail-open（R-CM-006 Rule 2）: 引数/モジュール/run 不在 + `.cli/` 境界逸脱などすべての失敗は exit 0
 *           （本体フローを遮断しない）。
 * Boundary: 観点1（brief2dev 自体）— R-CM-028。git-worktree-isolation などバンドルで外部伝播時、
 *           この単一ファイル + 本体 hook のみコピーされればすべての CLI アダプターが追従する。
 *
 * @see .cli/lib/cli-adapter-utils.mjs（runAdapter — 本体委譲の標準エントリポイント）
 * @see .cli/lib/cli-hooks-codegen.mjs（renderEntry — command codegen）
 */
import { fileURLToPath } from 'node:url';
import { resolve, sep } from 'node:path';
import { runAdapter } from './lib/cli-adapter-utils.mjs';

async function main() {
  const [, , rawModule, cli, eventName] = process.argv;
  const mod = String(rawModule || '').trim();
  if (!mod || !mod.endsWith('.mjs') || !cli) process.exit(0);

  const cliDir = resolve(fileURLToPath(new URL('.', import.meta.url))); // .../.cli
  const repoRoot = resolve(cliDir, '..'); // repo root
  const target = resolve(repoRoot, mod); // module は repo-relative（.cli/hooks/X.mjs など）
  // 許可境界: `.cli/` + `.claude/hooks/` + `.claude/scripts/`（repo-tracked 本体 hook の居住地）—
  // codegen（`cli-hooks-codegen.mjs#moduleToRepoRelativePath`）が生成するパス集合と1:1。
  // それ以外のパス（traversal 含む）は依然として fail-open passthrough（防御）。
  const allowedRoots = [cliDir, resolve(repoRoot, '.claude', 'hooks'), resolve(repoRoot, '.claude', 'scripts')];
  const inBounds = allowedRoots.some((root) => target === root || target.startsWith(root + sep));
  if (!inBounds) process.exit(0);

  // 動的 import 前に orchestrator フラグを set: 本体 hook の standalone ブロック
  // （`if (!globalThis.__HOOK_ORCHESTRATOR__) safeHookMain(...)`）が import の副作用として実行され、
  // stdin の二重消費/二重実行になるのを遮断する。dispatcher は run() のみ呼び出すため standalone
  // への進入は不要（orchestrator と同一パターン — code-reviewer finding 防御）。
  globalThis.__HOOK_ORCHESTRATOR__ = true;

  let run;
  try {
    ({ run } = await import(target));
  } catch {
    process.exit(0); // 本体モジュールのロード失敗 → fail-open
  }
  if (typeof run !== 'function') process.exit(0);

  // runAdapter が stdin 読み込み → normalizePayload → run → emit + process.exit までを行う（自体 fail-open）。
  await runAdapter(run, { cli, eventName });
}

main();
