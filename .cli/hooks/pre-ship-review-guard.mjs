#!/usr/bin/env node

/**
 * pre-ship-review-guard.mjs - PreToolUse Bash Hook
 *
 * `/create-pr ship-worktree` / `ship-feature` 呼び出し直前に Pre-Ship Human Review Panel
 * 確認マーカーが新鮮かどうかを検証する。不在時は deny + パネル義務を案内する。
 *
 * ポリシー SSOT: R-CM-030 "Pre-Ship Human Review Panel" 節
 *
 * 動作:
 *   - tool_name != Bash → passthrough
 *   - command が ops.mjs ship-worktree / ship-feature パターンでない → passthrough
 *   - マーカー (.tmp/pre-ship-review-confirmed-<branch>) が新鮮 (10分) → passthrough (allow)
 *   - マーカー不在/stale → deny + AI に Human Review Panel + ユーザー確認 + マーカー生成を案内
 *   - error → passthrough (R-CM-006 Rule 2 fail-open)
 *
 * マーカー生成の責任:
 *   AI が 11セクション Human Review Panel + ユーザーの「承認して進める」確認を受けた直後に
 *   `node .claude/scripts/mark-pre-ship-confirmed.mjs <branch> --quality <label>` を実行する。
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  readStdin,
  output,
  safeHookMainWithProfile,
  resolveProjectDir,
} from '../lib/utils.mjs';
import { HookOutput } from '../lib/hook-output.mjs';
import { VALID_QUALITY_LABELS } from '../lib/quality-gate-labels.mjs';

const MARKER_TTL_MS = 10 * 60 * 1000; // 10分 — ユーザー確認後 ship 呼び出しまで十分
import { CMD_ANCHOR_SRC } from '../lib/hook-anchors.mjs';

// command の先頭トークン (または chain operator 直後) の `node ... ops.mjs ship-...` のみマッチ。
// 単純な word boundary `\bops\.mjs\b` は quoted string / 診断コード / grep / echo 内の
// "ops.mjs ship-worktree" 文字列まで false-positive マッチしてユーザーの一般コマンドを
// 遮断していた (ユーザー報告「shell がよく止まる」root cause F1, PR #493)。
// anchor (コマンド開始 / chain operator / newline 直後のみマッチ) は hook-anchors.mjs が SSOT。
const SHIP_PATTERN = new RegExp(
  CMD_ANCHOR_SRC + '(?:cd\\s+\\S+\\s+&&\\s+)?\\s*node\\s+\\S*ops\\.mjs\\s+ship-(?:worktree|feature)\\b',
);
const WORKTREE_ARG = /--worktree[\s=]+["']?([^"'\s]+)["']?/;
// chain operator: && / || / ; — コマンド chain のみ検出。standalone pipe `|` は除外
// (output filtering — `cmd 2>&1 | tail` — marker touch (file write) とは無関係)。
// `&` background も除外 — ship 呼び出しは foreground 前提のため background 使用は異常。
// chain のみ検出する理由: marker touch + ship 呼び出しが同じ chain 内にあると hook 評価
// 時点で marker が反映されていないリスクがある — pipe は stdout transfer なので
// marker file write とは無関係。
const CHAIN_PATTERN = /&&|\|\||;/;

// Bash heredoc body を除去 — `<<EOF...EOF` 内のテキストは *データ* であり *呼び出しコンテキスト*
// ではないため、SHIP_PATTERN / CHAIN_PATTERN の検査対象から除外する必要がある。
// lib SSOT — destructive-git-guard など他の hook も同じ lib を直接 import する。
import { stripHeredocBodies } from '../lib/heredoc-strip.mjs';

export function isShipCommand(command) {
  return typeof command === 'string' && SHIP_PATTERN.test(stripHeredocBodies(command));
}

export function isChainedCommand(command) {
  return typeof command === 'string' && CHAIN_PATTERN.test(stripHeredocBodies(command));
}

// SSOT: branch parsing + escape 変形の正規化 + マーカーパスは worktree-plan-path.mjs。
// 本 hook は marker key の算出に同じ正規化結果を使用しないと worktree-shipping-guard +
// create-pr/ops.mjs#resolveWorktreePlanPath + mark-pre-ship-confirmed.mjs (CLI) と
// 一貫した branch 識別子 + マーカーパスが保証されない (R-CM-024)。
import {
  safeBranchKey,
  inferBranchFromWorktreePath,
  preShipMarkerPath,
} from '../lib/worktree-plan-path.mjs';
import { buildPreShipApprovalReview } from '../lib/worktree-ship-report.mjs';

export { safeBranchKey, inferBranchFromWorktreePath };

export function extractBranch(command) {
  const m = command.match(WORKTREE_ARG);
  if (!m) return null; // ship-feature モード (worktree 引数なし)
  return inferBranchFromWorktreePath(m[1]);
}

export const markerPath = preShipMarkerPath;

export function isFresh(absPath, ttlMs) {
  if (!existsSync(absPath)) return false;
  try {
    return Date.now() - statSync(absPath).mtime.getTime() <= ttlMs;
  } catch {
    return false;
  }
}

// Quality Gate label enum SSOT: `scripts/lib/quality-gate-labels.mjs` (import 上記)。
// mark-pre-ship-confirmed.mjs (発行者) + 本 hook (検証者) が同じ Set インスタンスを共有 →
// 新ラベル追加時は両側同時反映 (R-CM-024 回帰防止)。
// 回顧 #1 回帰防止: marker ファイルに quality_gate ラベルを永続化 → hook 検証 → silent skip 遮断。

/**
 * marker ファイルから quality_gate ラベルを抽出。JSON parse + enum 検証。
 *
 * Fail-open ポリシー (R-CM-006 Rule 2): ENOENT (不在) のみ null を返す。readFileSync の
 * I/O エラー (EACCES / ENFILE など) は throw — caller (run()) の外側 try/catch が
 * 捕捉して passthrough を返す。invalid JSON / enum 外 / empty は意図された deny 事由。
 *
 * @param {string} absPath
 * @returns {string|null} 有効な label または null (不在 / empty / invalid JSON / enum 外)
 * @throws I/O エラー (呼び出し側が fail-open 処理する義務)
 */
export function readMarkerQualityLabel(absPath) {
  if (!existsSync(absPath)) return null; // ENOENT — 正常な不在
  const content = readFileSync(absPath, 'utf-8').trim(); // I/O エラー時は throw → 外側 catch で passthrough
  if (!content) return null; // empty marker (legacy) — deny 意図
  try {
    const parsed = JSON.parse(content);
    const label = parsed?.quality_gate;
    return typeof label === 'string' && VALID_QUALITY_LABELS.has(label) ? label : null;
  } catch {
    return null; // invalid JSON — deny 意図
  }
}

/**
 * helper script (mark-pre-ship-confirmed.mjs) の適切な絶対パスを算出する。
 *
 * Why: helper 自体が新しい feature branch の PR 進行中である可能性があり、main には
 * まだ存在せず worktree 内にのみ存在する場合がある。そのシナリオで deny メッセージが
 * main パスのみを案内すると AI が "Cannot find module" エラーに遭遇する
 * (2026-05-15 セッション実測)。main → worktree の順で fs.existsSync 検査を行い、
 * 最も適切なパスを返す。
 *
 * Fail-soft: fs アクセス失敗時は main パスを default とする (helper がなければ
 * fallback コマンド案内が別途存在)。
 *
 * Export の理由 (test coverage): real-fs 単体テスト (mkdtempSync 隔離) で 4 分岐
 * (main 存在 / 2-seg worktree / 1-seg worktree / fallback) を直接検証する。
 */
export function resolveHelperPath(projectDir, cwd) {
  const HELPER_REL = '.claude/scripts/mark-pre-ship-confirmed.mjs';
  const mainPath = join(projectDir, HELPER_REL);
  try {
    if (existsSync(mainPath)) return mainPath;
  } catch {
    return mainPath;
  }
  // main 不在 → cwd が worktree 内であれば worktree パスを試行。
  // worktree path のコンベンションは 2 種類とも対応:
  //   - 2 segment: .worktrees/feature/foo (GitHub Flow prefix/name)
  //   - 1 segment: .worktrees/hotfix-123 (single-segment branch)
  if (cwd && cwd.includes('/.worktrees/')) {
    const idx = cwd.indexOf('/.worktrees/');
    const after = cwd.substring(idx + '/.worktrees/'.length);
    const segments = after.split('/').filter(Boolean);
    // 2 segment を優先試行 (GitHub Flow)
    for (const len of [2, 1]) {
      if (segments.length >= len) {
        const worktreeRoot =
          cwd.substring(0, idx) + '/.worktrees/' + segments.slice(0, len).join('/');
        const wtPath = join(worktreeRoot, HELPER_REL);
        try {
          if (existsSync(wtPath)) return wtPath;
        } catch {
          // fall-through to next len or main default
        }
      }
    }
  }
  return mainPath;
}

function buildDenyMessage(branch, safeKey, projectDir, cwd, chained, reason = 'marker_absent') {
  const helperPath = resolveHelperPath(projectDir, cwd);
  const reviewTemplate = buildPreShipApprovalReview({
    worktreePath: branch ? `.worktrees/${branch}` : '(staged / ship-feature)',
    branch: branch || 'staged',
    planPath: branch ? `.tmp/worktree-${safeKey}/PLAN.md` : '(staged mode)',
  });
  const header =
    reason === 'quality_label_missing'
      ? '[pre-ship-review-guard] ship 呼び出し遮断: marker の quality_gate ラベルが不在/無効'
      : '[pre-ship-review-guard] ship 呼び出し遮断: Pre-Ship Human Review Panel 未確認';
  const lines = [
    header,
    '',
    ...(reason === 'quality_label_missing'
      ? [
          'R-CM-030 Rule 8 Pre-Ship Quality Gate: marker ファイルへの quality_gate ラベル永続化が必須です。',
          'silent skip 遮断 (回顧 #1 — 当時の名称 simplify agent の漏れが累積 2 回。2026-05-27 ユーザー決定により /simplify を完全廃止 + simplifit スキルを deprecate 後 /code-review 単一エントリーポイント化)。',
          '',
          'helper CLI の --quality <label> 引数が欠落した場合に発生します。',
          '  label の種類:',
          '    agent_go         — /code-review --fix + code-reviewer agent の両方が Go',
          '    self_review_pass — agent 呼び出し失敗/skip 時の自己点検通過 (Panel Decisions に理由を明記)',
          '    trivial_skip     — R-CM-030 Rule 10 trivial (≤2ファイル + ≤20LOC + non-substantive)',
          '',
          '再試行:',
          `  node ${helperPath} ${branch || '--staged'} --quality <label>`,
          '',
        ]
      : []),
    ...(chained
      ? [
          '⚠️ chained command を検出 (&& / || / ;)。hook はコマンドの *開始時点* に評価するため、',
          '   同じ chain 内で marker touch が実行されても hook 評価には反映されません。',
          '   → marker 生成 (touch または mark-pre-ship-confirmed.mjs CLI) と ship 呼び出しを',
          '   **別々の Bash call に分離** してから再試行してください。',
          '',
        ]
      : []),
    // marker_absent 時: Human Review Panel + マーカー生成手順を案内 (正常な新規進入)
    // quality_label_missing 時: 上記 quality_label_missing セクションのみで十分 — touch fallback /
    //   `--quality` なしの helper コマンド露出は無限 deny ループ回避のため遮断 (HIGH #1)
    ...(reason !== 'quality_label_missing'
      ? [
          'R-CM-030 "Pre-Ship Human Review Panel" 節に基づき、ship-worktree / ship-feature 呼び出し直前には',
          '人間が merge の可否を判断できる 11セクション意思決定ブリーフを先に提供する必要があります。',
          '単独の質問 (「ship で PR をマージしますか?」) だけでは確認を受けたとみなしません。',
          '',
          '進行手順:',
          '  1. 以下の 11セクション Review を実際の値で埋めてユーザーに提供する:',
          '',
          ...reviewTemplate.split('\n').map((line) => `     ${line}`),
          '',
          '     推奨収集コマンド:',
          '       git log --oneline origin/main..HEAD',
          '       git diff origin/main...HEAD --stat',
          '       git diff origin/main...HEAD --name-status',
          '       git diff origin/main...HEAD --numstat',
          '  2. ユーザー確認を受ける:',
          '     - Claude Code native: AskUserQuestion で「承認して進める」/「修正が必要」/「中止」を選択',
          '     - Codex/Gemini/file mode: Decision Exchange または通常のチャットで同じ 3 択を確認',
          '  3. 「承認して進める」選択時に次のマーカーを生成 (10分 freshness):',
          `     node ${helperPath} ${branch || '--staged'} --quality <label>`,
          `     (cwd がどこであっても main root の .tmp/ にマーカーを生成。helper パスは fs 検査で自動選択)`,
          `     label の種類: agent_go / self_review_pass / trivial_skip (helper --help または本 PR の Decisions セクション参照)`,
          '  4. その後 ship コマンドを再実行',
          '  5. ship-worktree JSON 応答の completion_report_markdown をユーザーに出力',
          '',
        ]
      : []),
    branch
      ? `対象 branch: ${branch}`
      : '注意: --worktree 引数が欠落しているか ship-feature モード (branch=staged として処理)',
    '',
    `marker key: ${safeKey}`,
    'trivial な変更 (≤3ファイル / ≤50LOC / コード無影響) でも 11セクションヘッダーは維持 — 内容のみ簡略化。',
    '限界: 本 hook はマーカーの存在 + label 検証のみ。AI がパネルなしでマーカー生成後に呼び出すと回避可能。',
    '       → ユーザーが retroactive に発見した場合は R-CM-030 違反として報告。',
  ];
  return lines.join('\n');
}

export async function run(data) {
  try {
    if (data?.tool_name !== 'Bash') return HookOutput.passthrough();
    const command = data?.tool_input?.command || '';
    // strip を1回行った後、両パターンを直接検査 (isShipCommand + isChainedCommand の重複 strip 回避)。
    const stripped = stripHeredocBodies(command);
    if (!SHIP_PATTERN.test(stripped)) return HookOutput.passthrough();

    const projectDir = resolveProjectDir(data);
    const branch = extractBranch(command);
    const safeKey = safeBranchKey(branch);
    const path = markerPath(projectDir, branch);

    const chained = CHAIN_PATTERN.test(stripped);
    if (isFresh(path, MARKER_TTL_MS)) {
      // marker が新鮮 + ラベル検証 (回顧 #1 回帰防止)
      const label = readMarkerQualityLabel(path);
      if (label) return HookOutput.passthrough();
      return HookOutput.deny(
        buildDenyMessage(
          branch,
          safeKey,
          projectDir,
          data?.cwd,
          chained,
          'quality_label_missing',
        ),
      );
    }
    return HookOutput.deny(
      buildDenyMessage(branch, safeKey, projectDir, data?.cwd, chained),
    );
  } catch {
    return HookOutput.passthrough();
  }
}

if (!globalThis.__HOOK_ORCHESTRATOR__) {
  safeHookMainWithProfile('pre-ship-review-guard', async () => {
    const data = await readStdin();
    return output(await run(data));
  });
}
