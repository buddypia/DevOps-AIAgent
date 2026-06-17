/**
 * hook-output.mjs — Hook Output 標準化ライブラリ
 *
 * Claude Code Hooks API 公式仕様に準拠した出力ヘルパー。
 * 各 Hook Event Type ごとに正しい JSON 構造を生成する。
 *
 * API 仕様参照:
 * - PreToolUse: hookSpecificOutput.permissionDecision ("deny"/"allow"/"ask")
 * - PostToolUse: トップレベル decision ("block") または hookSpecificOutput.additionalContext
 * - Stop/SubagentStop: トップレベル decision ("block") + reason
 * - UserPromptSubmit: トップレベル decision ("block") + reason
 *
 * 使用法:
 *   import { output } from './utils.mjs';
 *   import { HookOutput } from './hook-output.mjs';
 *   return output(HookOutput.deny('理由'));
 */

// ═══════════════════════════════════════════════════════════════
// PreToolUse 出力 (permissionDecision ベース)
// ═══════════════════════════════════════════════════════════════

/**
 * PreToolUse: ツール呼び出しを拒否する。
 * reason は Claude にフィードバックとして渡される。
 *
 * @param {string} reason - 拒否理由 (Claude が読んで対応)
 * @returns {object} Hook output JSON
 */
export function deny(reason) {
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  };
}

/**
 * PreToolUse: ツール呼び出しを許可しつつ警告メッセージを表示する。
 * reason はユーザーにのみ表示される (Claude には非表示)。(備考: Claude 0.2.x 以降 permissionDecisionReason が Claude に渡される場合あり)
 *
 * @param {string} reason - 警告メッセージ (ユーザーが読む)
 * @param {string} [contextBlock] - 任意の追加コンテキスト。reason にマージされて渡される。
 * @returns {object} Hook output JSON
 */
export function allowWithWarning(reason, contextBlock) {
  const fullReason = contextBlock ? `${reason}\n\n${contextBlock}` : reason;
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
      permissionDecisionReason: fullReason,
    },
  };
}

/**
 * PreToolUse: ツール呼び出しを許可しつつ入力を修正する。
 * 入力パラメータを自動補正する際に使用 (例: model routing)。
 *
 * @param {string} reason - 修正理由 (ユーザーに表示)
 * @param {object} updatedInput - 修正された tool_input オブジェクト全体
 * @returns {object} Hook output JSON
 */
export function allowWithUpdatedInput(reason, updatedInput) {
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
      permissionDecisionReason: reason,
      updatedInput,
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// Stop / SubagentStop 出力 (decision ベース)
// ═══════════════════════════════════════════════════════════════

/**
 * Stop: セッション終了をブロックする。
 * reason は Claude に渡され、続行するよう指示する。
 *
 * @param {string} reason - ブロック理由 (Claude が読んで対応)
 * @returns {object} Hook output JSON
 */
export function block(reason) {
  return { decision: 'block', reason };
}

// ═══════════════════════════════════════════════════════════════
// コンテキスト注入 (PostToolUse, PostToolBatch, UserPromptSubmit, SessionStart で使用)
// ═══════════════════════════════════════════════════════════════

/**
 * Claude に追加コンテキストを注入する。
 * ブロックせず、情報メッセージを伝える。
 *
 * 対応イベント: PostToolUse, PostToolBatch, UserPromptSubmit, SessionStart
 * 非対応: Stop, SubagentStop (decision ベースのみ対応 — block() または passthrough() を使用)
 *         PreToolUse (permissionDecision ベース — deny()/allowWithWarning() を使用)
 *         PreCompact (Claude Code 仕様上 hookSpecificOutput.additionalContext 非対応 —
 *                     compact 後のコンテキスト保存が必要なら SessionStart hook で source==='compact' 分岐を使用)
 *
 * @param {string} message - 注入するコンテキストメッセージ
 * @param {string} [hookEventName] - イベント名。明示引数 > CLAUDE_HOOK_EVENT_NAME > PostToolUse。
 * @returns {object} Hook output JSON
 */
export function context(message, hookEventName) {
  const resolvedEvent = hookEventName || process.env.CLAUDE_HOOK_EVENT_NAME || 'PostToolUse';
  return {
    hookSpecificOutput: {
      hookEventName: resolvedEvent,
      additionalContext: message,
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// パススルー (全イベントで使用可能)
// ═══════════════════════════════════════════════════════════════

/**
 * 何もせず通過する。
 * @returns {object} 空オブジェクト
 */
export function passthrough() {
  return {};
}

// ═══════════════════════════════════════════════════════════════
// イベントタイプ別ファクトリ (型安全 — 有効な出力のみ公開)
// ═══════════════════════════════════════════════════════════════

/**
 * Stop/SubagentStop 専用の出力セット。
 * block() または passthrough() のみ有効。
 *
 * 使用法:
 *   const H = HookOutput.forStop();
 *   return output(H.block('理由'));
 *   return output(H.passthrough());
 */
export function forStop() {
  return { block, passthrough };
}

/**
 * PreToolUse 専用の出力セット。
 * deny(), allowWithWarning(), allowWithUpdatedInput(), passthrough() のみ有効。
 */
export function forPreToolUse() {
  return { deny, allowWithWarning, allowWithUpdatedInput, passthrough };
}

/**
 * PostToolUse 専用の出力セット。
 * block(), context(), passthrough() のみ有効。
 */
export function forPostToolUse() {
  return {
    block,
    context: (message) => context(message, 'PostToolUse'),
    passthrough,
  };
}

/**
 * UserPromptSubmit 専用の出力セット。
 * block(), context(), passthrough() のみ有効。
 */
export function forUserPromptSubmit() {
  return {
    block,
    context: (message) => context(message, 'UserPromptSubmit'),
    passthrough,
  };
}

/**
 * SessionStart 専用の出力セット。
 * context(), passthrough() のみ有効。
 *
 * 注意: PreCompact は hookSpecificOutput.additionalContext を仕様上非対応。
 * compact 後のコンテキスト保存が必要なら SessionStart hook で source==='compact' 分岐を使用。
 */
export function forSession(hookEventName = process.env.CLAUDE_HOOK_EVENT_NAME || 'SessionStart') {
  return {
    context: (message) => context(message, hookEventName),
    passthrough,
  };
}

// ═══════════════════════════════════════════════════════════════
// 名前空間エクスポート
// ═══════════════════════════════════════════════════════════════

export const HookOutput = {
  // 個別関数 (レガシー互換 — 新規コードはファクトリ使用を推奨)
  deny,
  allowWithWarning,
  allowWithUpdatedInput,
  block,
  context,
  passthrough,
  // イベントタイプ別ファクトリ (推奨)
  forStop,
  forPreToolUse,
  forPostToolUse,
  forUserPromptSubmit,
  forSession,
};
