#!/usr/bin/env node
/**
 * completion-evidence-guard.mjs — Stop Hook (command)
 *
 * R-CM-010: 「検証証拠なしに完了を主張してはならない」
 *
 * 以前はprompt形式のhookでLLMに判定を委任していたが、
 * LLMのJSON生成が非決定的でJSON validation failedが発生していた。
 * command形式に変換し、git diff + state fileベースの決定論的検証に転換した。
 *
 * 検証ロジック:
 *   1. git diff --name-only でコードファイルの変更を検出
 *   2. .claude/state/governance-events.jsonl でテスト/ビルド実行履歴を確認
 *   3. コード変更あり + 検証未実行 → block
 *   4. コード変更なし or 検証実行済み → passthrough
 *
 * Layer: L3 Stop
 * Fail-safe: エラー時はpassthrough（開発を妨げない）
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'node:url';
import { readStdin, safeHookMainWithProfile } from '../../.cli/lib/utils.mjs';
import { isContextLimitStop, isUserAbort } from '../../.cli/lib/utils.mjs';
import { matchVerificationCommand } from '../scripts/lib/verification-patterns.mjs';

const CODE_EXTENSIONS = /\.(ts|tsx|js|jsx|mjs|py|rs|go|java|kt|swift|dart|cpp|cs|php|svelte|vue)$/;

/**
 * git diffでコードファイルの変更を検出する。
 * @returns {string[]} 変更されたコードファイル一覧
 */
function getChangedCodeFiles() {
  try {
    // staged + unstaged + untracked
    const diffOutput = execSync('git diff --name-only HEAD 2>/dev/null || git diff --name-only 2>/dev/null || echo ""', {
      encoding: 'utf-8',
      timeout: 5000,
    }).trim();

    if (!diffOutput) return [];

    return diffOutput.split('\n')
      .filter(f => f && CODE_EXTENSIONS.test(f))
      .filter(f => !f.includes('node_modules/') && !f.includes('.claude/'));
  } catch {
    return []; // git not available → fail-safe: no code changes detected
  }
}

/**
 * 変更されたコードファイルの最新更新時刻(mtimeMs)を取得する。
 * 検証証拠はこの時刻「以降」でなければ「コード変更後の検証」として認められない (R-CM-010 freshness)。
 * @param {string[]} files - 変更されたコードファイル (repo相対パス)
 * @param {string} projectDir
 * @returns {number} 最新mtimeMs。一つもstatできなければ0 (fail-safe: freshness未適用)
 */
export function getLatestCodeChangeMtime(files, projectDir) {
  let latest = 0;
  for (const f of files) {
    try {
      const m = statSync(join(projectDir, f)).mtimeMs;
      if (m > latest) latest = m;
    } catch { /* stat不可 → skip */ }
  }
  return latest;
}

/**
 * governance-events.jsonlの1行がsinceMs以降のverificationコマンドかを判定する。
 * sinceMs<=0なら時間無関係 (fail-safe)。malformedな行はfalse。
 * @param {string} line
 * @param {number} sinceMs
 * @returns {boolean}
 */
function isFreshVerificationLine(line, sinceMs) {
  try {
    const event = JSON.parse(line);
    const cmd = event.command || event.tool_input?.command || '';
    if (!matchVerificationCommand(cmd)) return false;
    if (sinceMs <= 0) return true; // fail-safe: コード変更時刻不明 → 時間無関係で認定
    const ts = Date.parse(event.createdAt);
    return Number.isFinite(ts) && ts >= sinceMs;
  } catch {
    return false; // malformed line
  }
}

/**
 * Check 1: governance-events.jsonl でsinceMs以降のverificationコマンド実行履歴を探す。
 * @param {string} projectDir
 * @param {number} sinceMs
 * @returns {boolean}
 */
function hasFreshGovernanceEvidence(projectDir, sinceMs) {
  const eventsPath = join(projectDir, '.claude', 'state', 'governance-events.jsonl');
  if (!existsSync(eventsPath)) return false;
  try {
    const lines = readFileSync(eventsPath, 'utf-8').trim().split('\n').slice(-50); // last 50 events
    return lines.some((line) => isFreshVerificationLine(line, sinceMs));
  } catch {
    return false; // ignore read errors
  }
}

/**
 * Check 2: coverage / test-results ディレクトリがsinceMs以降に更新されたかを検査する。
 * sinceMs<=0なら存在するだけで認定 (fail-safe)。
 * @param {string} projectDir
 * @param {number} sinceMs
 * @returns {boolean}
 */
function hasFreshTestResults(projectDir, sinceMs) {
  const testResultPaths = [
    join(projectDir, 'coverage'),
    join(projectDir, 'test-results'),
  ];
  for (const p of testResultPaths) {
    try {
      if (sinceMs <= 0 || statSync(p).mtimeMs >= sinceMs) return true;
    } catch { /* ディレクトリなし / stat不可 → skip */ }
  }
  return false;
}

/**
 * テスト/ビルド検証証拠が（コード変更以降に）存在するかを確認する。
 * Check 1 (governance-events) とCheck 2 (test-results) の両方にsinceMs freshnessを適用し、
 * 過去セッションに残ったstaleな検証痕跡が現在のコード変更の証拠として誤認されるのを防ぐ。
 * @param {string} projectDir
 * @param {number} [sinceMs=0] この時刻(ms)以降の検証証拠のみ認定（コード変更mtime）。
 *   0以下ならfreshness未適用 (fail-safe — コード変更時刻不明時は既存動作を維持)
 * @returns {boolean}
 */
export function hasVerificationEvidence(projectDir, sinceMs = 0) {
  return hasFreshGovernanceEvidence(projectDir, sinceMs)
    || hasFreshTestResults(projectDir, sinceMs);
}

export async function run(input) {
  // Fail-safe: invalid input → passthrough
  if (!input || typeof input !== 'object') {
    return {};
  }

  // Context limit / user abort → passthrough
  if (isContextLimitStop(input) || isUserAbort(input)) {
    return {};
  }

  try {
    const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
    const changedCodeFiles = getChangedCodeFiles();

    // No code changes → passthrough
    if (changedCodeFiles.length === 0) {
      return {};
    }

    // Code changed → コード変更mtime以降の検証証拠のみ認定 (R-CM-010 freshness)
    const sinceMs = getLatestCodeChangeMtime(changedCodeFiles, projectDir);
    const verified = hasVerificationEvidence(projectDir, sinceMs);

    if (verified) {
      return {};
    }

    // Code changed + no verification → block
    const fileList = changedCodeFiles.slice(0, 5).join(', ');
    const more = changedCodeFiles.length > 5 ? ` 他${changedCodeFiles.length - 5}件` : '';

    return {
      decision: 'block',
      reason:
        `[R-CM-010] コード変更を検出 (${changedCodeFiles.length}件のファイル: ${fileList}${more}) — 検証未実行。\n` +
        `セッション終了前にテスト/lint/ビルドコマンドを実行してください:\n` +
        `  make q.check  または  npm test  または  npx tsc --noEmit`,
    };
  } catch (e) {
    // Fail-safe: any error → passthrough
    process.stderr.write(`[verification-before-completion] Error: ${e.message}\n`);
    return {};
  }
}

if (!globalThis.__HOOK_ORCHESTRATOR__ && process.argv[1] === fileURLToPath(import.meta.url)) {
  safeHookMainWithProfile('completion-evidence-guard', async () => {
    const input = await readStdin();
    console.log(JSON.stringify(await run(input)));
  });
}
