#!/usr/bin/env node

/**
 * edit-error-recovery.mjs - PostToolUse Edit Hook
 *
 * Edit の失敗を検出して、自己復旧ガイダンスを Claude に注入する。
 *
 * Self-Healing Loop (中核メカニズム):
 * ┌─────────────────────────────────────────────────────────┐
 * │ 1. Claude が Write/Edit → フォーマッタ Hook がファイルを再フォーマット │
 * │ 2. Claude が stale content で Edit → 失敗                │
 * │ 3. この Hook が検出 → "まず Read" ガイダンスを注入       │
 * │ 4. Claude が Read → 最新のフォーマット済み content を取得 → 成功 │
 * └─────────────────────────────────────────────────────────┘
 *
 * edit-error-recovery パターンを Claude Code Hook として実装。
 */

import { readStdin, output, safeHookMain } from '../scripts/lib/utils.mjs';
import { HookOutput } from '../scripts/lib/hook-output.mjs';

/**
 * Edit 失敗かどうかの判定
 * Claude Code の Edit ツールは失敗時に特定のエラーメッセージを返す
 */
function isEditFailure(toolOutput) {
  if (typeof toolOutput !== 'string') return false;

  const failurePatterns = [
    'is not unique',
    'was not found',
    'not found in',
    'no match',
    'does not exist',
    'multiple occurrences',
    'old_string',
    'did not match',
  ];

  const lower = toolOutput.toLowerCase();
  return failurePatterns.some((p) => lower.includes(p));
}

/**
 * 失敗の種類に応じた復旧ガイダンスを生成する
 */
function getRecoveryGuidance(toolOutput, filePath) {
  const lower = toolOutput.toLowerCase();

  // Case 1: old_string が見つからない (最も一般的なケース)
  // 原因: フォーマッタがインデント/空白を変更したか、以前の編集で内容が変わった
  if (
    lower.includes('not found') ||
    lower.includes('no match') ||
    lower.includes('did not match')
  ) {
    return (
      `[Edit Recovery] "${filePath}" の編集に失敗: old_string が見つかりません。\n` +
      `考えられる原因: フォーマッタがファイルを再フォーマットした可能性があります。\n` +
      `解決: Read ツールで "${filePath}" の現在の内容を読み込んでから、再度 Edit してください。`
    );
  }

  // Case 2: old_string が複数箇所で見つかった
  if (lower.includes('not unique') || lower.includes('multiple')) {
    return (
      `[Edit Recovery] "${filePath}" の編集に失敗: old_string が複数箇所で見つかりました。\n` +
      `解決: 周辺コードをより多く含めて old_string を一意にするか、replace_all の使用を検討してください。`
    );
  }

  // Case 3: ファイルが存在しない
  if (lower.includes('does not exist')) {
    return (
      `[Edit Recovery] "${filePath}" の編集に失敗: ファイルが存在しません。\n` +
      `解決: ファイルパスを確認してください。新規ファイルなら Write ツールを使用してください。`
    );
  }

  return null;
}

async function main() {
  try {
    const data = await readStdin();

    const toolResult = data.tool_result || '';
    const filePath = data.tool_input?.file_path || 'unknown';

    // Edit 成功ならパススルー
    if (!isEditFailure(toolResult)) {
      return output(HookOutput.passthrough());
    }

    const guidance = getRecoveryGuidance(toolResult, filePath);

    if (guidance) {
      return output({ ...HookOutput.context(guidance), continue: true });
    }

    return output(HookOutput.passthrough());
  } catch {
    return output(HookOutput.passthrough());
  }
}

safeHookMain(main);
