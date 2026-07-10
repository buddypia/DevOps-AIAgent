#!/usr/bin/env node

/**
 * _cli-dispatch.mjs — 단일 범용 멀티-CLI hook dispatcher (R-CM-006 Rule 4 확장)
 *
 * 본체 hook 의 `run(data)` 를 동적 로드 → `runAdapter` 로 위임한다. 이전의 CLI별 어댑터 파일
 * 무더기(`.claude/hooks/{codex,antigravity}/<name>.mjs`, 각 ~17줄 보일러플레이트)를 단일 파일로
 * 대체한다 — "hook 마다 어댑터 파일을 만드는" 이식 노동 제거.
 *
 * codegen(`cli-hooks-codegen.mjs#renderEntry`)이 `.codex/hooks.json` / `.claude/hooks.json` /
 * `.gemini/settings.json` 의 command 로 다음을 생성한다:
 *   node "$(git rev-parse --show-toplevel)/.cli/_cli-dispatch.mjs" <module> <cli> [eventName]
 *
 * Usage: node _cli-dispatch.mjs <module> <codex|antigravity|gemini> [eventName]
 *   - module    : repo-root 기준 module 경로 (예: `.cli/hooks/commit-guard.mjs`).
 *                 멀티-CLI 가드는 전부 `.cli/hooks/` 거주 — dispatcher 가 repoRoot 기준으로 해석.
 *   - cli       : 'codex' | 'antigravity' | 'gemini' (normalizePayload / wire 변환 선택)
 *   - eventName : 'PreToolUse' | 'PostToolUse' | 'UserPromptSubmit' | 'SessionStart' | 'Stop'
 *                 (Antigravity/Gemini wire 변환에 필요; Codex 는 무시)
 *
 * fail-open (R-CM-006 Rule 2): 인자/모듈/run 부재 + `.cli/` 경계 탈출 등 모든 실패는 exit 0
 *           (본체 흐름 차단 안 함).
 * Boundary: 관점 1 (brief2dev 자체) — R-CM-028. git-worktree-isolation 등 번들로 외부 전파 시
 *           이 단일 파일 + 본체 hook 만 복사되면 모든 CLI 어댑터가 따라간다.
 *
 * @see .cli/lib/cli-adapter-utils.mjs (runAdapter — 본체 위임 표준 진입점)
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
  const target = resolve(repoRoot, mod); // module 은 repo-relative (.cli/hooks/X.mjs)
  // `.cli/` 경계 탈출 차단 (방어 — codegen 은 .cli/hooks/ module 만 생성).
  if (target !== cliDir && !target.startsWith(cliDir + sep)) process.exit(0);

  // 동적 import 전 orchestrator 플래그 set: 본체 hook 의 standalone 블록
  // (`if (!globalThis.__HOOK_ORCHESTRATOR__) safeHookMain(...)`)이 import 부수효과로 실행되어
  // stdin 이중 소비/이중 실행되는 것을 차단한다. dispatcher 는 run() 만 호출하므로 standalone
  // 진입은 불필요 (orchestrator 와 동일 패턴 — code-reviewer finding 방어).
  globalThis.__HOOK_ORCHESTRATOR__ = true;

  let run;
  try {
    ({ run } = await import(target));
  } catch {
    process.exit(0); // 본체 모듈 로드 실패 → fail-open
  }
  if (typeof run !== 'function') process.exit(0);

  // runAdapter 가 stdin 읽기 → normalizePayload → run → emit + process.exit 까지 수행 (자체 fail-open).
  await runAdapter(run, { cli, eventName });
}

main();
