#!/usr/bin/env node
/**
 * governance-capture.mjs — PostToolUse (Bash) Hook
 *
 * R-CM-010 (Verification Before Completion) の自動capture。
 *
 * AIがvitest/lint/buildなどのverificationコマンドをBashで実行すると、このhookがPostToolUseで
 * コマンドをマッチングし、.claude/state/governance-events.jsonlにverificationイベントをappendする。
 *
 * Stop hook (completion-evidence-guard.mjs) がこのjsonlを読み、R-CM-010の検証証拠の有無を判定する。
 * 両hookは.claude/scripts/lib/verification-patterns.mjsの同一正規表現を共有する（整合性を保証）。
 *
 * Background:
 *   以前のgovernance-capture.mjsはsecret_detected + verificationの二つの責務を持ちPreToolUse +
 *   PostToolUseの両方に登録されており、cross-eventの重複違反だった。整理の過程でsecret_detectedは
 *   secret-leak-guard.mjsに移管されたが、verification captureは漏れたまま消えてしまい、completion-evidence-guardが
 *   証拠不在によりR-CM-010メッセージを繰り返しブロックする構造的欠陥が発生した（handoff Section 12.8）。
 *
 *   本hookはPostToolUse Bash単独登録によりcross-eventの重複リグレッションを回避する。
 *
 * Layer: L2 PostToolUse (captureノード、ブロック権限なし — R-CM-022 -captureホワイトリスト)
 * Hook Profile: minimal (MINIMAL_HOOKS — 常時ON)
 * Fail-safe: いかなるエラーもpassthrough（jsonl記録失敗時もツール実行には無影響）
 */

import { existsSync, mkdirSync, appendFileSync } from 'fs';
import { join } from 'path';
import { readStdin, safeHookMainWithProfile } from '../../.cli/lib/utils.mjs';
import { matchVerificationCommand } from '../scripts/lib/verification-patterns.mjs';

const MAX_COMMAND_LEN = 1000;
const MAX_TAIL_LEN = 500;

function tail(str, n) {
  if (typeof str !== 'string') return '';
  return str.length > n ? str.slice(-n) : str;
}

async function main() {
  const data = await readStdin();

  if (!data || typeof data !== 'object') {
    console.log('{}');
    return;
  }

  if (data.tool_name !== 'Bash') {
    console.log('{}');
    return;
  }

  const command = data.tool_input?.command;
  if (!command || typeof command !== 'string') {
    console.log('{}');
    return;
  }

  if (!matchVerificationCommand(command)) {
    console.log('{}');
    return;
  }

  try {
    const projectDir = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();
    const stateDir = join(projectDir, '.claude', 'state');
    const eventsPath = join(stateDir, 'governance-events.jsonl');

    if (!existsSync(stateDir)) mkdirSync(stateDir, { recursive: true });

    const tr = data.tool_response || data.tool_output || {};
    const stdout = typeof tr.stdout === 'string' ? tr.stdout : (typeof tr.output === 'string' ? tr.output : '');
    const stderr = typeof tr.stderr === 'string' ? tr.stderr : '';
    const interrupted = tr.interrupted === true;

    appendFileSync(
      eventsPath,
      JSON.stringify({
        eventType: 'verification',
        command: command.slice(0, MAX_COMMAND_LEN),
        interrupted,
        stdoutTail: tail(stdout, MAX_TAIL_LEN),
        stderrTail: tail(stderr, MAX_TAIL_LEN),
        createdAt: new Date().toISOString(),
      }) + '\n',
      'utf-8'
    );
  } catch {
    /* fail-safe: appendの失敗はツール動作と無関係 */
  }

  console.log('{}');
}

safeHookMainWithProfile('governance-capture', main);
