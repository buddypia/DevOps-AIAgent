/**
 * worktree-plan-status.mjs — PLAN.md checklist status SSOT.
 *
 * Used by Stop hooks and create-pr so "ready for review" and "ready to ship"
 * mean the same thing: no unchecked, non-cancelled PLAN.md checklist items.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolveWorktreePlanPath } from './worktree-plan-path.mjs';

export function stripIgnoredPlanSections(content) {
  return String(content || '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<!--[\s\S]*?-->/g, '');
}

const UNCHECKED_RE =
  /^[\s]*[-*]\s\[\s\](?!.*(?:\(取消済み[^)]*\)|\(dropped[^)]*\)|\(Dropped[^)]*\)|\(deferred[^)]*\)|\(Deferred[^)]*\)|~~)).*$/gm;

export function parseUncheckedPlanItems(content) {
  return stripIgnoredPlanSections(content).match(UNCHECKED_RE) || [];
}

export function readWorktreePlanChecklistStatus(worktreePath, branch = null, opts = {}) {
  const _existsSync = opts._existsSync || existsSync;
  const _readFileSync = opts._readFileSync || readFileSync;
  const plan_path = resolveWorktreePlanPath(worktreePath, branch);

  if (!_existsSync(plan_path)) {
    return {
      present: false,
      complete: false,
      unreadable: false,
      unchecked_count: null,
      unchecked: [],
      plan_path,
    };
  }

  try {
    const unchecked = parseUncheckedPlanItems(_readFileSync(plan_path, 'utf-8'));
    return {
      present: true,
      complete: unchecked.length === 0,
      unreadable: false,
      unchecked_count: unchecked.length,
      unchecked,
      plan_path,
    };
  } catch {
    return {
      present: true,
      complete: false,
      unreadable: true,
      unchecked_count: null,
      unchecked: [],
      plan_path,
    };
  }
}

export function formatPlanChecklistStatus(status) {
  if (!status || status.present === false) return 'PLAN.md なし';
  if (status.unreadable) return 'PLAN.md 読み取り失敗';
  if (status.complete) return '完了';
  return `未完了 ${status.unchecked_count ?? '?'}件`;
}
