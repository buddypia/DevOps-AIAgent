#!/usr/bin/env node

/**
 * mark-pre-ship-confirmed.mjs — Pre-Ship Review Panel 確認マーカー生成CLI
 *
 * Why (R-CM-029 Rule 3.1 Proposal-stage義務):
 *   (a) 脅威: pre-ship-review-guard のdenyメッセージが絶対パスsubstringで
 *       `mkdir -p /abs/main/.tmp && touch /abs/main/.tmp/pre-ship-review-confirmed-<key>`
 *       を提示すると、AIがworktree cwdで動作中の時 (1) パスtruncation または
 *       (2) 無意識的な相対パス短縮によりwrong `.tmp/`（worktree-local）にマーカーを
 *       生成した後hookが不在判定 → 無限denyループの危険。
 *   (b) 既存のギャップ: denyメッセージはcwd-agnosticな絶対パスsubstringのみ提供。AIが
 *       cwdコンテキストで迷った時の安全網が不在。
 *   (c) よりシンプルな代替案の比較: 絶対パスsubstringの維持（現行）も正常動作するが、
 *       multi-worktree環境ではAIの認知負荷が非対称的に大きい。CLI一行は
 *       cwdのどこから呼び出されても同一結果を保証 → AIのコンテキスト迷子を防止。
 *
 * Usage:
 *   node .claude/scripts/mark-pre-ship-confirmed.mjs <branch-or-worktree-path>
 *   node /abs/path/.claude/scripts/mark-pre-ship-confirmed.mjs feature/foo
 *   node /abs/path/.claude/scripts/mark-pre-ship-confirmed.mjs .worktrees/fix__bar
 *   node /abs/path/.claude/scripts/mark-pre-ship-confirmed.mjs --staged    # ship-featureモード
 *
 * Behavior:
 *   - main project root を `git rev-parse --git-common-dir` の親として自動resolve。
 *     （どのworktree cwdから呼び出されても同一main root。）
 *   - `<main>/.tmp/pre-ship-review-confirmed-<safeBranchKey>` マーカーを生成 (mkdir -p + touch)。
 *   - safeBranchKey / inferBranchFromWorktreePath は worktree-plan-path.mjs SSOT。
 *   - 結果パスをstdoutに出力。
 *
 * Exit codes:
 *   0 — マーカー生成成功
 *   1 — 引数不足 / git common-dir resolve失敗 / mkdir/touch失敗
 *
 * Boundary (R-CM-028): 観点1（brief2dev自体）専用。観点2は pre-ship-review-guard
 * がscaffold targetに未配布（R-CM-030 Rule 11 boundary-divergent）。
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
 * git common-dirの親をmain project rootとしてresolveする。
 * worktree cwdでもmain cwdでも同一rootを返す。
 *
 * @param {string} cwd
 * @returns {string|null} 絶対パスまたはnull（git repoでない場合）
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
    // common-dirはmainの`.git`ディレクトリ。parent = main root。
    // Edge case: bare repo / gitルート自体で呼び出した場合 `--git-common-dir` が `.`
    // を返す → abs === cwd → dirname() は親ディレクトリ（誤ったmain root）を返す。
    // この場合はcwd自体がmain root。
    const abs = resolve(cwd, out);
    if (abs === cwd) return cwd;
    return dirname(abs);
  } catch {
    return null;
  }
}

/**
 * 引数からbranch名を抽出。worktree path / branch / --stagedすべて受容。
 *
 * @param {string} arg
 * @returns {string|null}
 */
export function resolveBranch(arg) {
  if (!arg) return null;
  if (arg === '--staged' || arg === 'staged') return null; // ship-feature mode → safeBranchKey('') = 'staged'
  // worktree path（絶対/相対いずれも.worktrees/を含む）→ inferBranchFromWorktreePath
  if (arg.includes('.worktrees/') || arg.includes('.worktrees\\')) {
    return inferBranchFromWorktreePath(arg);
  }
  return arg;
}

/**
 * マーカーファイルパス算出 — SSOT: worktree-plan-path.mjs#preShipMarkerPath。
 * pre-ship-review-guard.mjs (hook) と同一関数を共有 → marker create/checkの整合性。
 */
export const markerPath = preShipMarkerPath;

/**
 * --quality引数の検証 + 正規化 (trim)。enum SSOT: `lib/quality-gate-labels.mjs`。
 *
 * 振り返り #1 リグレッション防止: markerファイルにlabelを永続化 → pre-ship-review-guardが
 * label不在/無効時にdeny。silent skipを防止。
 *
 * @param {string|null|undefined} raw
 * @returns {string|null} 有効なlabelまたはnull
 */
export function parseQualityLabel(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return VALID_QUALITY_LABELS.has(trimmed) ? trimmed : null;
}

/**
 * マーカー生成 (mkdir -p + write)。`content === ''` の場合は既存シグネチャ互換（empty
 * marker + mtime refresh）。`content !== ''` の場合は常にoverwrite（label更新）。
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
 * PLAN.md未完了チェックボックスの事前検査 — ops.mjs verify-planと同じSSOT (parseUnchecked) を再利用。
 *
 * Why (R-CM-029 Rule 3 Proposal-stage義務):
 *   (a) 脅威: PR #303 ship段階でPLAN.md `- [ ]` トグル漏れによりops.mjs verify-planが
 *       ブロック → 1 round-trip発生。AIがverification通過 → commit → marker生成 → ship
 *       のフローでPLAN.mdトグル段階をsilentlyにSKIPできる。
 *   (b) 既存のギャップ: ops.mjs verify-planはship呼び出し時点のみブロック。marker生成時点は
 *       検査が不在 → round-trip発生後にブロック。
 *   (c) よりシンプルな代替案: 本関数が1phase早い時点でブロック + ops.mjsのparseUnchecked
 *       再利用でSSOTを1つに維持。
 *
 * ポリシー:
 *   - branch=null (stagedモード) → skip (ship-featureモード、worktree不在)
 *   - force=true → skip (意図的な迂回、ops.mjs --force-plan整合)
 *   - worktree path候補2つを自動探索: slash variant + escape variant
 *   - worktree / PLAN.md不在 → skip (fail-open)
 *   - 未完了チェックボックス0件 → ok
 *   - 未完了チェックボックス1+件 → fail (uncheckedライン + planPathを返す)
 *
 * @param {string} mainRoot — main project rootの絶対パス
 * @param {string|null} branch — resolveBranch()の結果
 * @param {boolean} force — --forceフラグ
 * @returns {{ok: boolean, skipped?: string, unchecked?: string[], planPath?: string}}
 */
export function checkPlanCheckboxes(mainRoot, branch, force) {
  if (!branch) return { ok: true, skipped: 'staged_mode' };
  if (force) return { ok: true, skipped: 'force_flag' };

  // worktree path候補: slash variant (.worktrees/feature/foo) + escape variant (.worktrees/feature__foo)
  const safeKey = safeBranchKey(branch);
  const candidates = [
    join(mainRoot, '.worktrees', branch),
    join(mainRoot, '.worktrees', safeKey),
  ];
  const wtPath = candidates.find((c) => existsSync(c));
  if (!wtPath) return { ok: true, skipped: 'worktree_absent' };

  const planPath = resolveWorktreePlanPath(wtPath);
  if (!existsSync(planPath)) return { ok: true, skipped: 'plan_absent' };

  // readFileSync fail-open — エンコーディング / symlink / 同時アクセス例外時はskip (R-CM-006 Rule 2)。
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
 * Unknown `--*` flagの検出。リグレッション防止（本セッション2026-05-15 10:23 `--worktree` orphan
 * marker）: unknown `--<flag>` がpositionalとしてsilentlyに受容され、branch key `---<flag>`
 * 形式の無意味なmarkerが生成された事例。
 *
 * known flag定義:
 * - `--force` / `--quality` / `--staged` のみknown（現在main()が処理する引数）
 * - `--quality`の次のトークンはvalueとして分類（parseQualityLabelがenum検証を担当）
 *
 * @param {string[]} args — argv.slice(2)
 * @returns {string|null} 最初のunknown flag（あれば）/ null（すべてknown）
 */
export function validateUnknownFlags(args) {
  const KNOWN_FLAGS = new Set(['--force', '--quality', '--staged']);
  const qualityIdx = args.indexOf('--quality');
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (typeof a !== 'string' || !a.startsWith('--')) continue;
    if (qualityIdx >= 0 && i === qualityIdx + 1) continue; // --qualityのvalueスロットをskip
    if (!KNOWN_FLAGS.has(a)) return a;
  }
  return null;
}

function main(argv) {
  // --force / --quality <label> フラグを抽出
  const args = argv.slice(2);

  // Unknown flag検出 — silent positional受容を防止（リグレッション防止）
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

  // --quality強制検証（振り返り #1 リグレッション防止 — silent skip防止）
  const quality = parseQualityLabel(qualityRaw);
  if (!quality) {
    process.stderr.write(
      '[mark-pre-ship-confirmed] --quality <label> 必須。\n' +
        '  labelの種類:\n' +
        '    agent_go         : /code-review --fix + code-reviewer agent の両方がGo (2026-05-27 — Claude Code 組み込み/simplify廃止 + simplifitスキルdeprecate後、/code-review単一エントリポイント)\n' +
        '    self_review_pass : agent呼び出し失敗/skip時の自己点検通過 (Panel Decisions理由を明示)\n' +
        '    trivial_skip     : R-CM-030 Rule 10 trivial免除 (≤2ファイル + ≤20 LOC + non-substantive)\n',
    );
    process.exit(1);
  }

  const mainRoot = resolveMainRoot();
  if (!mainRoot) {
    process.stderr.write(
      '[mark-pre-ship-confirmed] git common-dir resolve失敗（git repoではない?）\n',
    );
    process.exit(1);
  }
  const branch = resolveBranch(arg);

  // PLAN.md事前検査 — 未完了チェックボックス発見時はマーカー生成をブロック（round-trip回避）。
  const check = checkPlanCheckboxes(mainRoot, branch, force);
  if (!check.ok) {
    process.stderr.write(
      `[mark-pre-ship-confirmed] PLAN.md未完了チェックボックス ${check.unchecked.length}件:\n` +
        check.unchecked.map((l) => `  ${l}`).join('\n') +
        `\n\n回避策: --forceフラグ、または項目に(取消済み) / (dropped) / (deferred) / ~~取り消し線~~ マーカーを追加。\n` +
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
 * 「このモジュールがCLIとして直接実行されたか」を判定 — non-ASCIIパス安全。
 *
 * 振り返り 2026-07-10: repoパスにnon-ASCII文字（例: "×"、U+00D7）があると、
 * `import.meta.url === \`file://${argv1}\`` の手動concat比較が常にfalseになる。
 * import.meta.urlはnon-ASCIIをpercent-encodeするが、concatはraw文字列の
 * ままだからである。pathToFileURLで両者を同じく正規化して比較する。
 *
 * @param {string} moduleUrl — import.meta.url
 * @param {string|undefined} argv1 — process.argv[1]
 * @returns {boolean}
 */
export function isMainModule(moduleUrl, argv1) {
  if (!argv1) return false;
  return moduleUrl === pathToFileURL(argv1).href;
}

// CLI entry (import時は未実行)
if (isMainModule(import.meta.url, process.argv[1])) {
  main(process.argv);
}
