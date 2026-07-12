/**
 * Common Utilities Module
 *
 * Hook スクリプトが共有するユーティリティ関数。
 * stdin 読み取り、stdout 出力、安全チェックなど。
 */

import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync, renameSync, unlinkSync } from 'fs';
import { join, dirname, basename } from 'path';
import { homedir } from 'os';
import { execSync } from 'child_process';
import { randomBytes } from 'crypto';
import { isHookEnabled } from './hook-flags.mjs';

// ═══════════════════════════════════════════════════════════════
// 安全な JSON ファイル読み取り (中央化)
//
// existsSync + readFileSync + JSON.parse + try/catch パターンが
// 82回以上繰り返されていたものを単一関数に統合。
// ═══════════════════════════════════════════════════════════════

/**
 * JSON ファイルを安全に読み取ってパースする。
 *
 * ファイル未存在、読み取りエラー、JSON パースエラー時は defaultValue を返す。
 * throw しないため、すべての呼び出し元で try/catch が不要である。
 *
 * @param {string} filePath - 絶対パス
 * @param {*} [defaultValue=null] - 失敗時に返すデフォルト値
 * @returns {object|*} パースされた JSON オブジェクトまたは defaultValue
 */
export function safeReadJson(filePath, defaultValue = null) {
  try {
    if (!existsSync(filePath)) return defaultValue;
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    return defaultValue;
  }
}

/**
 * handoff.confidence が object {score, level, ...} または number (legacy) 形式の両方を
 * サポートする score 抽出 helper。finite な数値でなければ null を返す。
 *
 * R-CM-026 整合: handoff (skill detail) SSOT の confidence 表現が多様な形式を
 * 取り得る boundary 関数。saga-manager.syncStageFromHandoff +
 * stage-output-aggregator.mergeHandoffConfidence の 2 つの進入点で共有。
 *
 * @param {*} conf - handoff.confidence 値 (object|number|undefined|null)
 * @returns {number|null} finite な score または null
 */
export function extractConfidenceScore(conf) {
  const raw =
    typeof conf === 'object' && conf !== null
      ? conf.score
      : typeof conf === 'number'
        ? conf
        : null;
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : null;
}

// ═══════════════════════════════════════════════════════════════
// 原子的ファイル書き込み (中央化)
//
// 6 箇所で重複していた tmp+rename パターンを単一関数に統合。
// すべての状態管理モジュール(state.mjs, saga-manager.mjs など)がこの関数を使用。
// ═══════════════════════════════════════════════════════════════

/**
 * JSON データをファイルに原子的に書き込む (tmp + rename パターン)。
 *
 * POSIX では同一ファイルシステム内の rename は原子的であるため、
 * 対象ファイルと同じディレクトリに tmp ファイルを生成してクロスパーティション問題を防止する。
 *
 * @param {string} filePath - 対象ファイルの絶対パス
 * @param {object|string} data - JSON シリアライズするオブジェクトまたは既にシリアライズされた文字列
 * @param {object} [options]
 * @param {boolean} [options.ensureDir=true] - ディレクトリ自動生成の可否
 * @param {number} [options.indent=2] - JSON.stringify indent (data が文字列なら無視)
 * @returns {boolean} 成功の可否
 */
export function atomicWriteJson(filePath, data, options = {}) {
  const { ensureDir = true, indent = 2 } = options;
  const dir = dirname(filePath);
  const base = basename(filePath);
  const tmpPath = join(dir, `.${base}.${randomBytes(4).toString('hex')}.tmp`);

  try {
    if (ensureDir && !existsSync(dir)) mkdirSync(dir, { recursive: true });
    const content = typeof data === 'string' ? data : JSON.stringify(data, null, indent);
    writeFileSync(tmpPath, content);
    renameSync(tmpPath, filePath);
    return true;
  } catch {
    // 一時ファイルの整理を試行
    try { if (existsSync(tmpPath)) unlinkSync(tmpPath); } catch { /* ignore */ }
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// Git ユーティリティ (中央化)
// ═══════════════════════════════════════════════════════════════

/** git repo か否かのキャッシュ (プロセスライフサイクル内で不変) */
const _gitRepoCache = new Map();

/**
 * 指定ディレクトリが git リポジトリかどうかを確認する。
 * 結果をキャッシュして同一プロセス内での反復 fork を防止。
 *
 * @param {string} cwd - 確認するディレクトリ
 * @returns {boolean}
 */
export function isGitRepo(cwd) {
  if (_gitRepoCache.has(cwd)) return _gitRepoCache.get(cwd);
  try {
    execSync('git rev-parse --is-inside-work-tree', {
      cwd,
      encoding: 'utf-8',
      timeout: 3000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    _gitRepoCache.set(cwd, true);
    return true;
  } catch {
    _gitRepoCache.set(cwd, false);
    return false;
  }
}

/**
 * シェルコマンドを安全に実行する (中央化)。
 *
 * - stdio を常にパイプして stderr が親プロセス(Claude Code)へ漏出しないようにする
 * - 失敗時は null を返す (throw しない)
 * - すべての hook スクリプトはこの関数を使用しなければならない
 *
 * @param {string} cmd - 実行するコマンド
 * @param {string} cwd - 作業ディレクトリ
 * @param {object} [options]
 * @param {number} [options.timeout=10000] - タイムアウト(ms)
 * @returns {string|null} stdout (trimmed) または null
 */
export function safeExec(cmd, cwd, options = {}) {
  try {
    return execSync(cmd, {
      cwd,
      encoding: 'utf-8',
      timeout: options.timeout ?? 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return null;
  }
}

/**
 * git コマンドを安全に実行する。
 * git リポジトリでなければ即座に null を返す (fork なしで)。
 *
 * @param {string} gitArgs - git サブコマンド + 引数 (例: "status --porcelain")
 * @param {string} cwd - 作業ディレクトリ
 * @param {object} [options]
 * @param {number} [options.timeout=10000] - タイムアウト(ms)
 * @returns {string|null}
 */
export function safeGit(gitArgs, cwd, options = {}) {
  if (!isGitRepo(cwd)) return null;
  return safeExec(`git ${gitArgs}`, cwd, options);
}

/**
 * プロジェクトルートディレクトリを解決する。(Worktree-aware)
 * 優先順位: CLAUDE_PROJECT_DIR > hookData.cwd > process.cwd()
 * Worktree 内部で実行された場合 (.worktrees/...) 元のプロジェクトルートへ resolve する。
 *
 * @param {object} [hookData] - Hook stdin データ (data.cwd を含み得る)
 * @returns {string} プロジェクトルートの絶対パス
 */
export function resolveProjectDir(hookData) {
  let dir = process.env.CLAUDE_PROJECT_DIR || hookData?.cwd || process.cwd();
  const wtIndex = dir.indexOf('/.worktrees/');
  if (wtIndex !== -1) {
    dir = dir.substring(0, wtIndex);
  }
  return dir;
}

/**
 * stdin から JSON データを読み取る
 * Claude Code Hooks は stdin でイベントデータを渡す。
 *
 * @returns {Promise<object>}
 */
export async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf-8');
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * stdout へ JSON 結果を出力
 * Hook 結果は必ず stdout JSON で渡す。
 *
 * @param {object} data - 出力するデータ
 */
export function output(data) {
  console.log(JSON.stringify(data));
}

/**
 * Context Limit による Stop の検知
 * Context が満杯の場合は絶対にブロックしない (deadlock 防止)
 *
 * Claude Code Hooks では Stop 入力のメタデータで判断。
 */
export function isContextLimitStop(data) {
  const reason = (data.stop_reason || data.stopReason || '').toLowerCase();
  const endTurnReason = (data.end_turn_reason || data.endTurnReason || '').toLowerCase();

  const patterns = [
    'context_limit',
    'context_window',
    'context_exceeded',
    'context_full',
    'max_context',
    'token_limit',
    'max_tokens',
    'conversation_too_long',
    'input_too_long',
  ];

  return patterns.some((p) => reason.includes(p) || endTurnReason.includes(p));
}

/**
 * ユーザーによるキャンセルの検知
 */
export function isUserAbort(data) {
  if (data.user_requested || data.userRequested) return true;

  const reason = (data.stop_reason || data.stopReason || '').toLowerCase();
  const exact = ['aborted', 'abort', 'cancel', 'interrupt'];
  const sub = ['user_cancel', 'user_interrupt', 'ctrl_c', 'manual_stop'];

  return exact.some((p) => reason === p) || sub.some((p) => reason.includes(p));
}

/**
 * Markdown Plan ファイルのチェックボックスをパース
 * - [ ] = 未完了、- [x] または - [X] = 完了
 * コードブロック(```) 内部は無視
 *
 * @param {string} planFilePath
 * @returns {{ total: number, completed: number, uncheckedItems: string[] } | null}
 */
export function parsePlanProgress(planFilePath) {
  if (!existsSync(planFilePath)) return null;

  try {
    const content = readFileSync(planFilePath, 'utf-8');
    const lines = content.split('\n');
    let inCodeBlock = false;
    let total = 0;
    let completed = 0;
    const uncheckedItems = [];

    for (const line of lines) {
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;

      const match = line.match(/^(\s*)- \[([ xX])\]\s+(.+)/);
      if (match) {
        total++;
        if (match[2].toLowerCase() === 'x') {
          completed++;
        } else {
          uncheckedItems.push(match[3].trim());
        }
      }
    }

    return { total, completed, uncheckedItems };
  } catch {
    return null;
  }
}

/**
 * パイプライン産出物の progress を実際のファイル存在有無と交差検証。
 * ファイルが存在するのに status が "pending" である項目を不一致として検知。
 *
 * Stop Hook で進捗率の更新漏れを検知するのに使用。
 *
 * @param {string} projectDir - プロジェクトルートディレクトリ
 * @param {string} contextRelPath - 産出物 JSON の相対パス
 * @returns {{ mismatches: number, details: Array<{stage: string, status: string, existingCount: number}> }}
 */
export function validatePipelineProgress(projectDir, contextRelPath) {
  const contextPath = join(projectDir, contextRelPath);
  if (!existsSync(contextPath)) return { mismatches: 0, details: [] };

  try {
    const context = JSON.parse(readFileSync(contextPath, 'utf-8'));
    const progressDetails = context?.progress?.details;
    if (!progressDetails || typeof progressDetails !== 'object') {
      return { mismatches: 0, details: [] };
    }

    const mismatches = [];

    for (const [stage, info] of Object.entries(progressDetails)) {
      if (typeof info !== 'object' || !info) continue;
      if (info.status === 'completed') continue;
      const files = info.files;
      if (!Array.isArray(files) || files.length === 0) continue;

      const existingCount = files.filter((f) => existsSync(join(projectDir, f))).length;

      if (existingCount > 0 && info.status !== 'completed') {
        mismatches.push({
          stage,
          status: info.status || 'pending',
          existingCount,
          totalFiles: files.length,
        });
      }
    }

    return { mismatches: mismatches.length, details: mismatches };
  } catch {
    return { mismatches: 0, details: [] };
  }
}


/**
 * Claude Code Task システムで未完了タスクをカウント
 *
 * Claude Code の Task ファイルは ~/.claude/tasks/{sessionId}/ に保存。
 */
export function countIncompleteTasks(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') return 0;
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,255}$/.test(sessionId)) return 0;

  const taskDir = join(homedir(), '.claude', 'tasks', sessionId);
  if (!existsSync(taskDir)) return 0;

  let count = 0;
  try {
    const files = readdirSync(taskDir).filter((f) => f.endsWith('.json') && f !== '.lock');
    for (const file of files) {
      try {
        const content = readFileSync(join(taskDir, file), 'utf-8');
        const task = JSON.parse(content);
        if (task.status === 'pending' || task.status === 'in_progress') count++;
      } catch {
        /* skip malformed */
      }
    }
  } catch {
    /* skip */
  }
  return count;
}

/**
 * Hook main 関数の安全ラッパー
 *
 * Node.js 22 の unhandled rejection 防止のための必須ラッパー。
 * 1. 例外時の deadlock 防止 (空 JSON 出力で passthrough)
 * 2. stderr 出力なしで空 JSON(passthrough) を出力
 * 3. stdout パイプ破損も安全に処理
 *
 * 使用法:
 *   import { safeHookMain } from './lib/utils.mjs';
 *   safeHookMain(main);
 *
 * @param {() => Promise<void>} fn - async main 関数
 */
export function safeHookMain(fn) {
  fn().catch((err) => {
    if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
      console.error('[Fail-Loud in Test] Hook execution failed:', err);
      process.exit(1);
    }
    // NOTE: console.error の使用禁止 — stderr 出力が Claude Code に "hook error" として表示される
    try { console.log('{}'); } catch { /* stdout パイプ破損時は無視 */ }
  });
}

/**
 * Hook Profile ベースの安全ラッパー
 *
 * safeHookMain + isHookEnabled チェックを結合。
 * hookId が現在のプロファイルで非活性なら即座に passthrough (空 JSON)。
 *
 * 使用法:
 *   import { safeHookMainWithProfile } from './lib/utils.mjs';
 *   safeHookMainWithProfile('coverage-threshold-guard', main);
 *
 * @param {string} hookId - フック識別子
 * @param {() => Promise<void>} fn - async main 関数
 */
export function safeHookMainWithProfile(hookId, fn) {
  if (!isHookEnabled(hookId)) {
    try { console.log('{}'); } catch { /* stdout パイプ破損時は無視 */ }
    return;
  }
  safeHookMain(fn);
}
