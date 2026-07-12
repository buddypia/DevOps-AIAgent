#!/usr/bin/env node

/**
 * worktree-owner-tracker.mjs — PostToolUse Bash Hook (CLI-agnostic)
 *
 * worktree 生成コマンド (`make wt.new` / `worktree-new.mjs` / `git worktree add`) の成功直後、
 * 現在のセッション ID を `.tmp/worktree-<safeBranch>/.session-owner` サイドカーに記録する。
 * worktree ごとに所有セッションを累積追跡 (per-worktree 1 サイドカー)。
 *
 * ポリシー SSOT: R-CM-036 (worktree-session-ownership.md).
 *
 * Why: worktree-session-owner-guard が「自身のセッションが作成した worktree」のみ編集/コミットを許容するためには、
 * 生成された時点で所有セッションを残す必要がある。session_id は環境変数ではなく hook の stdin JSON
 * でのみ伝達されるため (公式ドキュメント)、シェルスクリプトではなく PostToolUse hook のみが記録可能。
 *
 * Multi-CLI: `session_id` は Claude Code と Codex (PostToolUse 共通フィールド — 公式ドキュメント
 * https://developers.openai.com/codex/hooks) payload に存在する。したがって `run(data)` を
 * export して単一の dispatcher (`.cli/_cli-dispatch.mjs`) が Codex payload 正規化
 * 後に委譲する (ガードと同一の dispatcher 委譲 — MULTI-CLI.md)。Antigravity payload は session_id フィールドの
 * 不在が確定 (2026-06-20 検証: transcriptPath で識別) — cd-into-worktree モデルなため Layer 1 で十分であり、
 * Layer 2 は事実上 no-op (R-CM-036)。
 *
 * 動作: 非 worktree 生成 / session_id 不在 / branch 未解析 / コマンド失敗 / worktree 未発見
 *       → no-op。tracker は絶対にツール呼び出しを BLOCK しない (safeHookMain)。
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { readStdin, output, safeHookMain, safeGit, resolveProjectDir } from '../lib/utils.mjs';
import { worktreeOwnerPath, parseWorktreeList } from '../lib/worktree-plan-path.mjs';

const WORKTREE_CREATE_RE = /(?:\bwt\.new\b|worktree-new\.(?:mjs|sh)|\bgit\s+worktree\s+add\b)/;

/**
 * worktree 生成コマンドから branch 名を抽出。
 *   1) `make wt.new BR=<x>` / `BRANCH=<x>` / `--branch <x>` (worktree-new.mjs)
 *   2) `worktree-new.sh <x>` (positional, フラグ除く)
 *   3) `git worktree add <path> -b <x>` (新規 branch)
 *   4) `git worktree add <path> <x>` (既存の branch attach)
 * 未解析 → null (guard が fail-open skip — 誤遮断なし)。
 */
export function parseBranchFromCommand(cmd) {
  if (!cmd || typeof cmd !== 'string') return null;
  const mBr = cmd.match(/\bBR=([^\s'"]+)/);
  if (mBr) return mBr[1];
  const mEnv = cmd.match(/\bBRANCH=([^\s'"]+)/);
  if (mEnv) return mEnv[1];
  const mFlag = cmd.match(/--branch\s+([^\s'"]+)/);
  if (mFlag) return mFlag[1];
  const mPos = cmd.match(/worktree-new\.sh\s+(?!-)([^\s'"]+)/);
  if (mPos) return mPos[1];
  const mNew = cmd.match(/\bgit\s+worktree\s+add\s+\S+\s+-b\s+([^\s'"]+)/);
  if (mNew) return mNew[1];
  const mAttach = cmd.match(/\bgit\s+worktree\s+add\s+(?!-)\S+\s+(?!-)([^\s'"]+)/);
  if (mAttach) return mAttach[1];
  return null;
}

/**
 * セッション所有権サイドカーの記録ロジック (CLI-agnostic, 副作用のみ — 常に passthrough)。
 *
 * Claude Code standalone (以下の safeHookMain) + Codex/Antigravity dispatcher 委譲が共有する。
 * dispatcher は `cli-adapter-utils.mjs#runAdapter` で CLI payload を Claude 形式
 * (`{ tool_name, tool_input, session_id, tool_response, cwd }`) に正規化した後に委譲する。
 *
 * @param {object} data - 正規化された hook payload
 * @returns {Promise<object>} 常に {} (passthrough — tracker は絶対に BLOCK しない)
 */
export async function run(data) {
  if (!data || data.tool_name !== 'Bash') return {};

  const cmd = data.tool_input?.command;
  if (!cmd || typeof cmd !== 'string' || !WORKTREE_CREATE_RE.test(cmd)) return {};

  const resp = data.tool_response;
  if (resp && typeof resp.exit_code === 'number' && resp.exit_code !== 0) return {};

  const sessionId = data.session_id;
  if (!sessionId || typeof sessionId !== 'string') return {};

  const branch = parseBranchFromCommand(cmd);
  if (!branch) {
    // worktree 生成コマンドはマッチしたが branch 未抽出 (custom wrapper / 非標準形式)。
    // サイドカー未記録 → Layer 2 未動作 (Layer 1 cwd-confinement が PRIMARY 保護)。
    // デバッグ可視性 (DEBT-184): DEBUG_WORKTREE_OWNER 時のみ stderr (普段は noise 0)。
    if (process.env.DEBUG_WORKTREE_OWNER) {
      console.error(`[worktree-owner-tracker] branch 未抽出 → サイドカー skip: ${cmd.slice(0, 80)}`);
    }
    return {};
  }

  const projectDir = resolveProjectDir(data);
  const wtOut = safeGit('worktree list --porcelain', projectDir, { timeout: 3000 });
  if (wtOut === null) return {};

  const wt = parseWorktreeList(wtOut).find((e) => e.branch === branch);
  if (!wt) return {};

  try {
    const sidecar = worktreeOwnerPath(wt.path, branch);
    if (!existsSync(dirname(sidecar))) mkdirSync(dirname(sidecar), { recursive: true });
    writeFileSync(sidecar, `${sessionId}\n`);
  } catch {
    // silent — 記録が失敗してもツール呼び出しの遮断禁止 (guard が fail-open skip)
  }
  return {};
}

// standalone エントリーポイント (Claude Code 直接実行)。__HOOK_ORCHESTRATOR__ は orchestrated 統合の
// 予約フラグであり、dispatcher の動的 import 時点には設定されない → このブロックは
// dispatcher の import 副作用としても発動する (既存の guard 本体と同一構造)。
// それでも無害: (1) tracker は常に passthrough({}) のため stdout 衝突なし (2) サイドカー write は
// べき等 (同一 session_id 上書き) (3) 空の payload に退化しても run() の最初のガードで no-op。
if (!globalThis.__HOOK_ORCHESTRATOR__) {
  safeHookMain(async () => {
    const data = await readStdin();
    return output(await run(data));
  });
}
