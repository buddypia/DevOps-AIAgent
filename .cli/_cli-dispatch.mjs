#!/usr/bin/env node

/**
 * _cli-dispatch.mjs — 単一の汎用マルチ CLI hook dispatcher (R-CM-006 Rule 4 の拡張)
 *
 * 本体 hook の `run(data)` を動的にロード → `runAdapter` へ委譲する。従来の CLI 別アダプターファイル
 * の山(`.claude/hooks/{codex,antigravity}/<name>.mjs`、各 ~17 行のボイラープレート)を単一ファイルに
 * 置き換える — 「hook ごとにアダプターファイルを作る」移植の手間を排除。
 *
 * codegen(`cli-hooks-codegen.mjs#renderEntry`)が `.codex/hooks.json` / `.claude/hooks.json` /
 * `.gemini/settings.json` の command として次を生成する:
 *   node "$(git rev-parse --show-toplevel)/.cli/_cli-dispatch.mjs" <module> <cli> [eventName]
 *
 * Usage: node _cli-dispatch.mjs <module> <codex|antigravity|gemini> [eventName]
 *   - module    : repo-root 基準の module パス (例: `.cli/hooks/commit-guard.mjs`)。
 *                 マルチ CLI ガードはすべて `.cli/hooks/` に居住 — dispatcher が repoRoot 基準で解決。
 *   - cli       : 'codex' | 'antigravity' | 'gemini' (normalizePayload / wire 変換の選択)
 *   - eventName : 'PreToolUse' | 'PostToolUse' | 'UserPromptSubmit' | 'SessionStart' | 'Stop'
 *                 (Antigravity/Gemini の wire 変換に必要; Codex は無視)
 *
 * fail-open (R-CM-006 Rule 2): 引数/モジュール/run の不在 + `.cli/` 境界からの脱出など、すべての失敗は exit 0
 *           (本体フローをブロックしない)。
 * Boundary: 観点 1 (brief2dev 自体) — R-CM-028。git-worktree-isolation などバンドルで外部へ伝播する際、
 *           この単一ファイル + 本体 hook だけコピーすれば、すべての CLI アダプターが付いてくる。
 *
 * @see .cli/lib/cli-adapter-utils.mjs (runAdapter — 本体委譲の標準エントリポイント)
 * @see .cli/lib/cli-hooks-codegen.mjs (renderEntry — command codegen)
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
  const target = resolve(repoRoot, mod); // module は repo-relative (.cli/hooks/X.mjs)
  // `.cli/` 境界からの脱出をブロック (防御 — codegen は .cli/hooks/ module のみ生成)。
  if (target !== cliDir && !target.startsWith(cliDir + sep)) process.exit(0);

  // 動的 import の前に orchestrator フラグを set: 本体 hook の standalone ブロック
  // (`if (!globalThis.__HOOK_ORCHESTRATOR__) safeHookMain(...)`)が import の副作用として実行され、
  // stdin の二重消費/二重実行が起きるのをブロックする。dispatcher は run() のみを呼び出すため standalone
  // 進入は不要 (orchestrator と同一パターン — code-reviewer finding の防御)。
  globalThis.__HOOK_ORCHESTRATOR__ = true;

  let run;
  try {
    ({ run } = await import(target));
  } catch {
    process.exit(0); // 本体モジュールのロード失敗 → fail-open
  }
  if (typeof run !== 'function') process.exit(0);

  // runAdapter が stdin 読み込み → normalizePayload → run → emit + process.exit まで実行する (それ自体で fail-open)。
  await runAdapter(run, { cli, eventName });
}

main();
