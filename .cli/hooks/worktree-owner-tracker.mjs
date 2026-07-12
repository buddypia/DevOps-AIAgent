#!/usr/bin/env node

/**
 * worktree-owner-tracker.mjs — PostToolUse Bash Hook (CLI-agnostic)
 *
 * worktree 作成コマンド（`make wt.new` / `worktree-new.mjs` / `git worktree add`）成功直後に
 * 現在のセッション ID を `.tmp/worktree-<safeBranch>/.session-owner` サイドカーに記録する。
 * worktree ごとに所有セッションを累積追跡する（per-worktree 1 サイドカー）。
 *
 * ポリシー SSOT: R-CM-036 (worktree-session-ownership.md)。
 *
 * Why: worktree-session-owner-guard が「自セッションが作成した worktree」のみ編集/コミットを
 * 許可するには、作成時点で所有セッションを残しておく必要がある。session_id は env var ではなく
 * hook stdin JSON でのみ渡されるため（公式ドキュメント）、shell スクリプトではなく PostToolUse hook
 * のみが記録可能。
 *
 * Multi-CLI: `session_id` は Claude Code と Codex（PostToolUse 共通フィールド — 公式ドキュメント
 * https://developers.openai.com/codex/hooks）の payload に存在する。そのため `run(data)` を
 * export し、単一 dispatcher（`.cli/_cli-dispatch.mjs`）が Codex payload を正規化した後に
 * 委譲する（guard と同じ dispatcher 委譲 — MULTI-CLI.md）。Antigravity は session_id フィールドの
 * 代わりに共通フィールド conversationId がセッション UUID の役割を果たす（公式マニュアル
 * 2026-07-11 確定 — deriveSessionId マッピング）。ただし本 tracker の *記録* は Antigravity では
 * 依然として no-op である — PostToolUse payload に toolCall 自体が存在せず（§PostToolUse:
 * stepIdx/error/共通フィールドのみ）worktree 作成コマンドを検知できない。conversationId
 * マッピングの実効性は PreToolUse 側 worktree-session-owner-guard の Layer 2 比較で発揮される
 * （R-CM-036）。
 *
 * 動作: 非-worktree-作成 / session_id 不在 / branch 未解析 / コマンド失敗 / worktree 未検出
 *       → no-op。tracker は決してツール呼び出しを BLOCK しない（safeHookMain）。
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { readStdin, output, safeHookMain, safeGit, resolveProjectDir } from '../lib/utils.mjs';
import { worktreeOwnerPath, parseWorktreeList } from '../lib/worktree-plan-path.mjs';

const WORKTREE_CREATE_RE = /(?:\bwt\.new\b|worktree-new\.(?:mjs|sh)|\bgit\s+worktree\s+add\b)/;

/**
 * worktree 作成コマンドから branch 名を抽出する。
 *   1) `make wt.new BR=<x>` / `BRANCH=<x>` / `--branch <x>` (worktree-new.mjs)
 *   2) `worktree-new.sh <x>` (positional、flag は除外)
 *   3) `git worktree add <path> -b <x>` (新規 branch)
 *   4) `git worktree add <path> <x>` (既存 branch へ attach)
 * 未解析 → null（guard が fail-open skip — 誤ブロックなし）。
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
 * セッション所有権サイドカー記録ロジック（CLI-agnostic、副作用のみ — 常に passthrough）。
 *
 * Claude Code standalone（下記 safeHookMain）+ Codex/Antigravity dispatcher 委譲が共有する。
 * dispatcher は `cli-adapter-utils.mjs#runAdapter` で CLI payload を Claude 形式
 * (`{ tool_name, tool_input, session_id, tool_response, cwd }`) に正規化した後に委譲する。
 *
 * @param {object} data - 正規化された hook payload
 * @returns {Promise<object>} 常に {}（passthrough — tracker は決して BLOCK しない）
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
    // worktree 作成コマンドにはマッチしたが branch を抽出できなかった（custom wrapper / 非標準形式）。
    // サイドカー未記録 → Layer 2 は動作しない（Layer 1 cwd-confinement が PRIMARY 保護）。
    // デバッグ可視性 (DEBT-184): DEBUG_WORKTREE_OWNER 時のみ stderr に出力（通常時は noise 0）。
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
    // silent — 記録に失敗してもツール呼び出しは禁止しない（guard が fail-open skip）
  }
  return {};
}

// standalone エントリポイント（Claude Code 直接実行）。__HOOK_ORCHESTRATOR__ は orchestrated 統合の
// 予約フラグであり、dispatcher の動的 import 時点では設定されない → このブロックは
// dispatcher import の副作用としても発火する（既存 guard 本体と同じ構造）。
// それでも無害: (1) tracker は常に passthrough({}) のため stdout 衝突なし (2) サイドカー write は
// 冪等（同一 session_id での上書き） (3) 空 payload に縮退しても run() の最初のガードで no-op。
if (!globalThis.__HOOK_ORCHESTRATOR__) {
  safeHookMain(async () => {
    const data = await readStdin();
    return output(await run(data));
  });
}
