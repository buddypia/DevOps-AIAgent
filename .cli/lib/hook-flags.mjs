/**
 * hook-flags.mjs — Profile resolver (registry-derived, R-CM-006 Rule 4 Single SSOT)
 *
 * profile メンバーシップは hook-registry.mjs entry の `profile` フィールドから derive する。
 * 本ファイルは SSOT ではない。
 *
 * profile 変更:
 *   ❌ 本ファイルの編集禁止
 *   ✅ hook-registry.mjs entry の `profile` フィールド変更 + regen-hooks-settings.mjs 実行
 *
 * 環境変数:
 *   ECC_HOOK_PROFILE   = minimal | standard (基本: standard)
 *   ECC_DISABLED_HOOKS = カンマ区切りの hookId リスト (強制無効化)
 *
 * @see .cli/lib/hook-registry.mjs (Single SSOT)
 * @see .claude/rules/common/hooks.md (R-CM-006 Rule 4)
 */
import { flattenRegistry } from './hook-registry.mjs';

const VALID_PROFILES = new Set(['minimal', 'standard']);

let _profileMapCache = null;

function buildProfileMap() {
  if (_profileMapCache) return _profileMapCache;
  const flat = flattenRegistry();
  const minimalIds = new Set();
  const standardIds = new Set();
  for (const h of flat) {
    if (h.profile === 'minimal') minimalIds.add(h.id);
    else if (h.profile === 'standard') standardIds.add(h.id);
  }
  _profileMapCache = {
    minimal: minimalIds,
    standard: new Set([...minimalIds, ...standardIds]),
  };
  return _profileMapCache;
}

let _disabledHooksCache = null;

export function getDisabledHookIds() {
  if (_disabledHooksCache) return _disabledHooksCache;
  const raw = (process.env.ECC_DISABLED_HOOKS || '').trim();
  _disabledHooksCache = raw
    ? new Set(raw.split(',').map((v) => v.trim().toLowerCase()).filter(Boolean))
    : new Set();
  return _disabledHooksCache;
}

export function getActiveProfile() {
  const env = (process.env.ECC_HOOK_PROFILE || '').toLowerCase().trim();
  return VALID_PROFILES.has(env) ? env : 'standard';
}

export function isHookEnabled(hookId, options) {
  const disabled = getDisabledHookIds();
  if (disabled.has(hookId)) return false;
  const profile = options?.profile || getActiveProfile();
  const profileMap = buildProfileMap();
  const enabledSet = profileMap[profile];
  if (!enabledSet) return true;
  return enabledSet.has(hookId);
}

/** ecosystem-health-guard E14 互換 — Single SSOT 後は derive のため常に valid */
export function validateProfileCoverage(registryHookIds, profileUncheckedIds = []) {
  const profileMap = buildProfileMap();
  // 2-tier (minimal ⊂ standard). standard が全プロファイルの superset (strict ティア除去, 2026-06-11)。
  const allProfileIds = profileMap.standard;
  const registrySet = new Set(registryHookIds);
  const uncheckedSet = new Set(profileUncheckedIds);
  const orphaned = [...allProfileIds].filter((id) => !registrySet.has(id));
  const missing = [...registrySet].filter(
    (id) => !allProfileIds.has(id) && !uncheckedSet.has(id),
  );
  return { valid: orphaned.length === 0 && missing.length === 0, orphaned, missing };
}

export function getEnabledHooks(profile) {
  const p = profile || getActiveProfile();
  const profileMap = buildProfileMap();
  const enabledSet = profileMap[p];
  if (!enabledSet) return [];
  const disabled = getDisabledHookIds();
  return [...enabledSet].filter((id) => !disabled.has(id)).sort();
}
