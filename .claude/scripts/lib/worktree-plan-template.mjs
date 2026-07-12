/**
 * worktree-plan-template.mjs — `worktree-init.mjs` が初回実行時に作成する
 * PLAN.md の標準テンプレートhelper。
 *
 * 目的 (R-CM-030 worktree フロー + 直前の振り返り項目 #1 #5 #6 の根本解決):
 *   - PLAN.md の配置場所を `worktree-plan-path.mjs#resolveWorktreePlanPath` SSOT に
 *     合わせて自動生成 → AI が worktree ごとに mkdir + Write で配置場所を混同するパターンを防止。
 *   - verify セクションを「AI自動」/「ユーザー手動」の2カテゴリに分離 → AI が作成時点で
 *     ユーザー依存verifyと自動verifyを意識的に区別することを強制。
 *   - 冪等 — 既存のPLAN.mdがあれば保存する（ユーザー作成中のPLANを上書き禁止）。
 *
 * 本モジュールはpure helperなので単体テスト可能。
 * リグレッション: tests/unit/worktree-plan-template.test.mjs。
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  resolveWorktreePlanPath,
  inferBranchFromWorktreePath,
} from '../../../.cli/lib/worktree-plan-path.mjs';
import { renderTemplateFromSections } from '../../../.cli/lib/section-template-renderer.mjs';

/**
 * brief2dev自身が使用する8セクションPLAN.mdの基本構造（JS定数 — オプションC、ライブ経路のファイルI/Oなし）。
 * 移植用customizableバージョン: data/registry/transplant-templates/worktree-plan.generic.json
 * （brief2devはこのJSONを読まない — 対象プロジェクトが直接編集/wiringする）。
 */
export const DEFAULT_PLAN_SECTIONS = [
  { heading: '# PLAN — {{branch}}', blocks: [] },
  {
    heading: '## Goal',
    blocks: [{ type: 'static', lines: ['(要記入 — この worktree で達成する目標を一文で)'] }],
  },
  {
    heading: '## Why',
    blocks: [{ type: 'static', lines: ['(要記入 — なぜ今この変更が必要か？既存のギャップ/問題)'] }],
  },
  {
    heading: '## Scope (Surgical — R-CM-029 Rule 4)',
    blocks: [{ type: 'static', lines: ['(要記入 — 変更対象のファイル/モジュール一覧)'] }],
  },
  {
    heading: '## Out of scope',
    blocks: [{ type: 'static', lines: ['(要記入 — 意図的に触れない範囲)'] }],
  },
  {
    heading: '## Verify',
    blocks: [
      {
        type: 'checklist_group',
        subheading: '### AI自動（このターン内に実行）',
        items: [
          '(要記入 — `npm test` / `npx vitest run <paths>` のようなコマンド)',
          '(要記入 — lint / audit / smoke などの自動検証)',
        ],
      },
      {
        type: 'checklist_group',
        subheading: '### ユーザー手動',
        items: [
          '(該当なしなら項目自体を削除、または(dropped)マーカー。UI変更なら「ブラウザでXを確認」のようなユーザー判断依存の検証)',
        ],
      },
    ],
  },
  {
    heading: '## Status',
    blocks: [{ type: 'static', lines: ['- {{createdAt}}: worktree生成 + PLAN草案。'] }],
  },
  { heading: '## Outstanding', blocks: [{ type: 'static', lines: ['- なし（開始時点）'] }] },
  {
    heading: '## Decisions',
    blocks: [{ type: 'static', lines: ['- (要記入 — AI default / ユーザー明示決定の区別)'] }],
  },
];

/**
 * PLAN.md標準テンプレート本文を算出。Pure — fs非アクセス。
 *
 * @param {string} branch — `feature/cmux-surface-select` のようなbranch名。
 * @param {{ createdAt?: string, sections?: Array<object> }} [options] — `sections` 未指定時は
 *   `DEFAULT_PLAN_SECTIONS` を使用（既存の関数シグネチャ/戻り値は無変更）。
 * @returns {string}
 */
export function renderPlanTemplate(branch, options = {}) {
  const branchName = branch || '<branch>';
  const createdAt = options.createdAt || new Date().toISOString().slice(0, 10);
  const sections = options.sections || DEFAULT_PLAN_SECTIONS;
  return renderTemplateFromSections(sections, { branch: branchName, createdAt }) + '\n';
}

/**
 * worktree内にPLAN.mdがなければ標準テンプレートで生成。あれば保存。
 *
 * **`options.branch` overrideの注意** — branchを明示的にoverrideすると、PLAN.mdが
 * `resolveWorktreePlanPath(worktreePath, options.branch)` の位置に生成される。
 * このpathは `inferBranchFromWorktreePath(worktreePath)` で得られるdefault pathと
 * **異なる場合がある**（worktreeの物理ディレクトリ名とbranch override名が異なる時）。
 * 結果として同じworktree内に `.tmp/worktree-<inferred>/PLAN.md` と
 * `.tmp/worktree-<override>/PLAN.md` の2ファイルが共存する場合がある。
 * 呼び出し側が意図的にbranch aliasを使う場合のみoverrideを推奨する。
 *
 * @param {string} worktreePath — worktreeの絶対パス。
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
