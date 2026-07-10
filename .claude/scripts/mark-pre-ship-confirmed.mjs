#!/usr/bin/env node

/**
 * mark-pre-ship-confirmed.mjs — Pre-Ship Review Panel 承認マーカー生成 CLI
 *
 * Why (R-CM-029 Rule 3.1 Proposal-stage 義務):
 *   (a) 脅威: pre-ship-review-guard の deny メッセージが絶対パスの substring で
 *       `mkdir -p /abs/main/.tmp && touch /abs/main/.tmp/pre-ship-review-confirmed-<key>`
 *       を提示した際、AI が worktree cwd で動作中である場合、(1) パスの truncation または
 *       (2) 無意識な相対パス of 短縮により誤った `.tmp/` (worktree-local) にマーカーを
 *       生成してしまい、hook が不在と判定 → 無限 deny loop の危険。
 *   (b) 既存のギャップ: deny メッセージは cwd-agnostic な絶対パスの substring のみを提供。AI が
 *       cwd コンテキストを見失った場合の安全網が不在。
 *   (c) より単純な代替案の比較: 絶対パスの substring 維持 (現行) でも正常動作するが、
 *       multi-worktree 環境において AI の認知負荷が非対称的に大きい。CLI 1行は
 *       cwd のどこから呼び出されても同一の結果を保証 → AI コンテキストの混乱を遮断。
 *
 * Usage:
 *   node .claude/scripts/mark-pre-ship-confirmed.mjs <branch-or-worktree-path>
 *   node /abs/path/.claude/scripts/mark-pre-ship-confirmed.mjs feature/foo
 *   node /abs/path/.claude/scripts/mark-pre-ship-confirmed.mjs .worktrees/fix__bar
 *   node /abs/path/.claude/scripts/mark-pre-ship-confirmed.mjs --staged    # ship-feature モード
 *
 * Behavior:
 *   - main project root を `git rev-parse --git-common-dir` の親として自動 resolve。
 *     (どの worktree cwd から呼び出されても同一の main root。)
 *   - `<main>/.tmp/pre-ship-review-confirmed-<safeBranchKey>` マーカーを生成 (mkdir -p + touch)。
 *   - safeBranchKey / inferBranchFromWorktreePath は worktree-plan-path.mjs SSOT。
 *   - 結果パスを stdout に出力。
 *
 * Exit codes:
 *   0 — マーカー生成成功
 *   1 — 引数不足 / git common-dir resolve 失敗 / mkdir・touch 失敗
 *
 * Boundary (R-CM-028): 観点 1 (brief2dev 自体) 専用。観点 2 は pre-ship-review-guard
 * が scaffold target に未配備 (R-CM-030 Rule 11 boundary-divergent)。
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, utimesSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  inferBranchFromWorktreePath,
  preShipMarkerPath,
  resolveWorktreePlanPath,
  safeBranchKey,
} from '../../.cli/lib/worktree-plan-path.mjs';
import { VALID_QUALITY_LABELS } from '../../.cli/lib/quality-gate-labels.mjs';
import { parseUncheckedPlanItems } from '../../.cli/lib/worktree-plan-status.mjs';

/**
 * git common-dir の親を main project root として resolve。
 * worktree cwd でも main cwd でも同一の root を返却。
 *
 * @param {string} cwd
 * @returns {string|null} 絶対パスまたは null (git repo ではない)
 */
export function resolveMainRoot(cwd = process.cwd()) {
  try {
    const out = execSync('git rev-parse --git-common-dir', {
      cwd,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 3000,
    }).trim();
    if (!out) return null;
    // common-dir は main の `.git` ディレクトリ。parent = main root。
    // Edge case: bare repo / git ルート自体で呼び出した際 `--git-common-dir` が `.`
    // を返却 → abs === cwd → dirname() は親ディレクトリ (誤った main root) を返却。
    const abs = resolve(cwd, out);
    if (abs === cwd) return cwd;
    return dirname(abs);
  } catch {
    return null;
  }
}

/**
 * 引数から branch 名を抽出。worktree path / branch / --staged すべて許容。
 *
 * @param {string} arg
 * @returns {string|null}
 */
export function resolveBranch(arg) {
  if (!arg) return null;
  if (arg === '--staged' || arg === 'staged') return null; // ship-feature mode → safeBranchKey('') = 'staged'
  // worktree path (절대/상대 모두 .worktrees/ 포함) → inferBranchFromWorktreePath
  if (arg.includes('.worktrees/') || arg.includes('.worktrees\\')) {
    return inferBranchFromWorktreePath(arg);
  }
  return arg;
}

/**
 * マーカーファイルパスの算出 — SSOT: worktree-plan-path.mjs#preShipMarkerPath。
 * pre-ship-review-guard.mjs (hook) と同一関数を共有 → marker create/check 整合性。
 */
export const markerPath = preShipMarkerPath;

/**
 * --quality 引数の検証 + 正規化 (trim)。enum SSOT: `lib/quality-gate-labels.mjs`。
 *
 * デグレード #1 遮断: marker ファイルに label を永続化 → pre-ship-review-guard が
 * label 不在/無効時に deny。silent skip 遮断。
 *
 * @param {string|null|undefined} raw
 * @returns {string|null} 有効な label または null
 */
export function parseQualityLabel(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return VALID_QUALITY_LABELS.has(trimmed) ? trimmed : null;
}

/**
 * マーカー生成 (mkdir -p + write)。`content === ''` 時は従来のシグネチャ互換 (empty
 * marker + mtime refresh)。`content !== ''` 時は常に overwrite (label 更新)。
 *
 * @param {string} path
 * @param {string} content
 */
export function createMarker(path, content = '') {
  mkdirSync(dirname(path), { recursive: true });
  if (content === '' && existsSync(path)) {
    const now = new Date();
    utimesSync(path, now, now);
  } else {
    writeFileSync(path, content);
  }
}

/**
 * PLAN.md 未完了チェックボックス事前検査 — ops.mjs verify-plan と同一の SSOT (parseUnchecked) を再利用。
 *
 * Why (R-CM-029 Rule 3 Proposal-stage 義務):
 *   (a) 脅威: PR #303 ship 段階で PLAN.md の `- [ ]` トグルの漏れにより ops.mjs verify-plan が
 *       遮断 → 1 round-trip が発生。AI が verification を通過 → commit → marker 生成 → ship の
 *       フローにおいて PLAN.md トグル段階を silently に SKIP 可能。
 *   (b) 既存のギャップ: ops.mjs verify-plan は ship 呼び出し時点のみ遮断。マーカー生成時点は
 *       検査不在 → round-trip 発生後に遮断。
 *   (c) より単純な代替案: 本関数が 1フェーズ早い時点で遮断 + ops.mjs の parseUnchecked を
 *       再利用することで SSOT を 1つに維持。
 *
 * ポリシー:
 *   - branch=null (staged モード) → skip (ship-feature モード、worktree 不在)
 *   - force=true → skip (意図的な迂回、ops.mjs --force-plan と整合)
 *   - worktree path 候補を 2つ自動探索: slash variant + escape variant
 *   - worktree / PLAN.md 不在 → skip (fail-open)
 *   - 未完了チェックボックス 0件 → ok
 *   - 未完了チェックボックス 1件以上 → fail (unchecked 行 + planPath 返却)
 *
 * @param {string} mainRoot — main project root 絶対パス
 * @param {string|null} branch — resolveBranch() 結果
 * @param {boolean} force — --force フラグ
 * @returns {{ok: boolean, skipped?: string, unchecked?: string[], planPath?: string}}
 */
export function checkPlanCheckboxes(mainRoot, branch, force) {
  if (!branch) return { ok: true, skipped: 'staged_mode' };
  if (force) return { ok: true, skipped: 'force_flag' };

  // worktree path 候補: slash variant (.worktrees/feature/foo) + escape variant (.worktrees/feature__foo)
  const safeKey = safeBranchKey(branch);
  const candidates = [
    join(mainRoot, '.worktrees', branch),
    join(mainRoot, '.worktrees', safeKey),
  ];
  const wtPath = candidates.find((c) => existsSync(c));
  if (!wtPath) return { ok: true, skipped: 'worktree_absent' };

  const planPath = resolveWorktreePlanPath(wtPath);
  if (!existsSync(planPath)) return { ok: true, skipped: 'plan_absent' };

  // readFileSync fail-open — エンコーディング / symlink / 同時アクセス例外時は skip (R-CM-006 Rule 2)。
  let content;
  try {
    content = readFileSync(planPath, 'utf-8');
  } catch {
    return { ok: true, skipped: 'plan_unreadable' };
  }
  const unchecked = parseUncheckedPlanItems(content);
  if (unchecked.length === 0) return { ok: true };
  return { ok: false, unchecked, planPath };
}

/**
 * Unknown `--*` flag の検出。デグレード遮断 (本セッション 2026-05-15 10:23 `--worktree` orphan
 * marker): unknown `--<flag>` が positional として silently に受容され、branch key `---<flag>`
 * 形の無意味な marker が生成された事例。
 *
 * known flag 定義:
 * - `--force` / `--quality` / `--staged` のみ known (現在 main() 処理引数)
 * - `--quality` 次のトークンは value として分類 (parseQualityLabel が enum 検証を担当)
 *
 * @param {string[]} args — argv.slice(2)
 * @returns {string|null} 最初の unknown flag (あれば) / null (すべて known)
 */
export function validateUnknownFlags(args) {
  const KNOWN_FLAGS = new Set(['--force', '--quality', '--staged']);
  const qualityIdx = args.indexOf('--quality');
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (typeof a !== 'string' || !a.startsWith('--')) continue;
    if (qualityIdx >= 0 && i === qualityIdx + 1) continue; // --quality の value スロット skip
    if (!KNOWN_FLAGS.has(a)) return a;
  }
  return null;
}

function main(argv) {
  // --force / --quality <label> フラグを抽出
  const args = argv.slice(2);

  // Unknown flag 検出 — silent positional の受容を遮断 (デグレード遮断)
  const unknown = validateUnknownFlags(args);
  if (unknown) {
    process.stderr.write(
      `[mark-pre-ship-confirmed] unknown flag: ${unknown}\n` +
        '  known flags: --force / --quality <label> / --staged\n' +
        '  使用法: node mark-pre-ship-confirmed.mjs <branch | worktree-path | --staged> --quality <label> [--force]\n',
    );
    process.exit(1);
  }

  const force = args.includes('--force');
  const qualityIdx = args.indexOf('--quality');
  const qualityRaw = qualityIdx >= 0 ? args[qualityIdx + 1] : null;
  const positional = args.filter(
    (a, i) =>
      a !== '--force' &&
      a !== '--quality' &&
      (qualityIdx < 0 || (i !== qualityIdx && i !== qualityIdx + 1)),
  );
  const arg = positional[0];

  if (!arg) {
    process.stderr.write(
      'Usage: node mark-pre-ship-confirmed.mjs <branch | worktree-path | --staged> --quality <label> [--force]\n',
    );
    process.exit(1);
  }

  // --quality 強制検証 (デグレード #1 遮断 — silent skip 遮断)
  const quality = parseQualityLabel(qualityRaw);
  if (!quality) {
    process.stderr.write(
      '[mark-pre-ship-confirmed] --quality <label> は必須です。\n' +
        '  label の種類:\n' +
        '    agent_go         : /code-review --fix + code-reviewer agent ともに Go (2026-05-27 — Claude Code ビルトイン /simplify 廃止 + simplifit スキル deprecate 後 /code-review 単一エントリーポイント)\n' +
        '    self_review_pass : agent 呼び出し失敗/skip 時のセルフチェック通過 (Panel Decisions 理由明示)\n' +
        '    trivial_skip     : R-CM-030 Rule 10 trivial 免除 (≤2 ファイル + ≤20 LOC + non-substantive)\n',
    );
    process.exit(1);
  }

  const mainRoot = resolveMainRoot();
  if (!mainRoot) {
    process.stderr.write(
      '[mark-pre-ship-confirmed] git common-dir resolve 失敗 (git repo ではない？)\n',
    );
    process.exit(1);
  }
  const branch = resolveBranch(arg);

  // PLAN.md 事前検査 — 未完了チェックボックス発見時はマーカー生成を遮断 (round-trip 回避)。
  const check = checkPlanCheckboxes(mainRoot, branch, force);
  if (!check.ok) {
    process.stderr.write(
      `[mark-pre-ship-confirmed] PLAN.md 未完了チェックボックス ${check.unchecked.length}件:\n` +
        check.unchecked.map((l) => `  ${l}`).join('\n') +
        `\n\n迂回: --force フラグまたは項目に (キャンセル済み) / (dropped) / (deferred) / ~~取り消し線~~ マーカーを追加してください。\n` +
        `PLAN: ${check.planPath}\n`,
    );
    process.exit(1);
  }

  const path = markerPath(mainRoot, branch);
  const payload = JSON.stringify({
    quality_gate: quality,
    confirmed_at: new Date().toISOString(),
  });
  try {
    createMarker(path, payload);
  } catch (e) {
    process.stderr.write(`[mark-pre-ship-confirmed] マーカー生成失敗: ${e.message}\n`);
    process.exit(1);
  }
  process.stdout.write(`${path}\n`);
}

/**
 * "このモジュールが CLI として直接実行されたか" 判定 — non-ASCII パス安全。
 *
 * 振り返り 2026-07-10: repo パスに non-ASCII 文字 (例: "×", U+00D7) がある場合、
 * `import.meta.url === \`file://${argv1}\`` の手動 concat 比較が常に false となる。
 * import.meta.url は non-ASCII を percent-encode するが、concat は raw 文字列
 * そのままであるため。pathToFileURL で両者を同一に正規化して比較する。
 *
 * @param {string} moduleUrl — import.meta.url
 * @param {string|undefined} argv1 — process.argv[1]
 * @returns {boolean}
 */
export function isMainModule(moduleUrl, argv1) {
  if (!argv1) return false;
  return moduleUrl === pathToFileURL(argv1).href;
}

// CLI entry (import 時の実行は遮断)
if (isMainModule(import.meta.url, process.argv[1])) {
  main(process.argv);
}
