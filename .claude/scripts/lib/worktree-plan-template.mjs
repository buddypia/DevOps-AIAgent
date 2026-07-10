/**
 * worktree-plan-template.mjs — `worktree-init.mjs` が初回実行時に作成する
 * PLAN.md の標準テンプレート helper。
 *
 * 目的 (R-CM-030 worktree フロー + 直前の振り返り項目 #1 #5 #6 の根本解決):
 *   - PLAN.md の位置を `worktree-plan-path.mjs#resolveWorktreePlanPath` SSOT に
 *     合わせて自動生成 → AI が worktree ごとに mkdir + Write を行う際の位置の混乱パターンを遮断。
 *   - verify セクションを「AI 自動」 / 「ユーザー手動」の2つのカテゴリに分離 → AI が作成時点で
 *     ユーザー依存の検証と自動検証を意識的に区分するように強制。
 *   - べき等 — 既存の PLAN.md があれば保存 (ユーザーが作成中の PLAN 上書き禁止)。
 *
 * 本モジュールは pure helper のため単体テスト可能。
 * デグレード: tests/unit/worktree-plan-template.test.mjs。
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  resolveWorktreePlanPath,
  inferBranchFromWorktreePath,
} from '../../../.cli/lib/worktree-plan-path.mjs';
import { renderTemplateFromSections } from '../../../.cli/lib/section-template-renderer.mjs';

/**
 * brief2dev 自身が使用する 8セクション PLAN.md 基本構造 (JS 定数 — オプション C、ライブパスのファイル I/O なし)。
 * 移植用 customizable バージョン: data/registry/transplant-templates/worktree-plan.generic.json
 * (brief2dev はこの JSON を読み込まない — 対象プロジェクトが直接編集/wiring)。
 */
export const DEFAULT_PLAN_SECTIONS = [
  { heading: '# PLAN — {{branch}}', blocks: [] },
  {
    heading: '## Goal',
    blocks: [{ type: 'static', lines: ['(作成必要 — この worktree で達成する目標を1文で記載)'] }],
  },
  {
    heading: '## Why',
    blocks: [{ type: 'static', lines: ['(作成必要 — なぜ今この変更が必要なのか？ 既存のギャップ/問題)'] }],
  },
  {
    heading: '## Scope (Surgical — R-CM-029 Rule 4)',
    blocks: [{ type: 'static', lines: ['(作成必要 — 変更対象のファイル/モジュール一覧)'] }],
  },
  {
    heading: '## Out of scope',
    blocks: [{ type: 'static', lines: ['(作成必要 — 意図的にタッチしない領域)'] }],
  },
  {
    heading: '## Verify',
    blocks: [
      {
        type: 'checklist_group',
        subheading: '### AI 自動 (このターン内に実行)',
        items: [
          '(作成必要 — `npm test` / `npx vitest run <paths>` などのコマンド)',
          '(作成必要 — lint / audit / smoke などの自動検証)',
        ],
      },
      {
        type: 'checklist_group',
        subheading: '### ユーザー手動',
        items: [
          '(該当なしの場合は項目自体を削除または (dropped) マーカー。UI 変更であれば \"ブラウザで X を確認\" などのユーザーの決定に依存する検証)',
        ],
      },
    ],
  },
  {
    heading: '## Status',
    blocks: [{ type: 'static', lines: ['- {{createdAt}}: worktree 作成 + PLAN 草案。'] }],
  },
  { heading: '## Outstanding', blocks: [{ type: 'static', lines: ['- なし (開始時点)'] }] },
  {
    heading: '## Decisions',
    blocks: [{ type: 'static', lines: ['- (作成必要 — AI デフォルト / ユーザー明示決定の区分)'] }],
  },
];

/**
 * PLAN.md 標準テンプレート本文を算出。Pure — fs 非タッチ。
 *
 * @param {string} branch — `feature/cmux-surface-select` のような branch 名。
 * @param {{ createdAt?: string, sections?: Array<object> }} [options] — `sections` 未指定時は
 *   `DEFAULT_PLAN_SECTIONS` を使用 (既存の関数シグネチャ/返却値は変更なし)。
 * @returns {string}
 */
export function renderPlanTemplate(branch, options = {}) {
  const branchName = branch || '<branch>';
  const createdAt = options.createdAt || new Date().toISOString().slice(0, 10);
  const sections = options.sections || DEFAULT_PLAN_SECTIONS;
  return renderTemplateFromSections(sections, { branch: branchName, createdAt }) + '\n';
}

/**
 * worktree 内に PLAN.md がなければ標準テンプレートで作成。あれば保存。
 *
 * **`options.branch` override に注意** — branch を明示的に override すると PLAN.md が
 * `resolveWorktreePlanPath(worktreePath, options.branch)` の位置に作成される。
 * このパスは `inferBranchFromWorktreePath(worktreePath)` で取得するデフォルトパスと
 * **異なる場合がある** (worktree の物理ディレクトリ名と branch override 名が異なる場合)。
 * 結果として、同一の worktree 内に `.tmp/worktree-<inferred>/PLAN.md` と
 * `.tmp/worktree-<override>/PLAN.md` の2つのファイルが共存する可能性がある。
 * 呼び出し元が意図的に branch alias を使用する場合のみ override を推奨する。
 *
 * @param {string} worktreePath — worktree の絶対パス。
 * @param {{ branch?: string, createdAt?: string }} [options]
 * @returns {{ created: boolean, path: string }}
 */
export function ensureWorktreePlan(worktreePath, options = {}) {
  const branch = options.branch || inferBranchFromWorktreePath(worktreePath);
  const planPath = resolveWorktreePlanPath(worktreePath, branch);
  if (existsSync(planPath)) {
    return { created: false, path: planPath };
  }
  const planDir = dirname(planPath);
  mkdirSync(planDir, { recursive: true });
  const body = renderPlanTemplate(branch, { createdAt: options.createdAt });
  writeFileSync(planPath, body, 'utf-8');
  return { created: true, path: planPath };
}
