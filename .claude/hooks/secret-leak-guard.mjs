#!/usr/bin/env node

/**
 * secret-leak-guard.mjs - PreToolUse Edit|Write Hook
 *
 * コードにシークレット(API キー、秘密鍵など)がハードコードされるのを検出してブロックする。
 *
 * 検出パターン:
 * - Provider-specific prefixes (AWS, Google, OpenAI, Anthropic, GitHub, Slack, Stripe, etc.)
 * - JWT / DB connection strings / Authorization headers
 * - Env, JSON, and hardcoded assignment secret fields
 * - Private key blocks
 *
 * 除外パス: .env*, .example, mock/, test.*fixture/, CLAUDE.md, SKILL.md, .schema.json
 */

import { readStdin, output, safeHookMain } from '../scripts/lib/utils.mjs';
import { HookOutput } from '../scripts/lib/hook-output.mjs';
import { detectSecrets } from '../scripts/lib/secret-patterns.mjs';

const EXCLUDED_PATH_PATTERNS = [
  /\.env/,
  /\.example$/,
  /\/mock\//,
  /\/test.*fixture\//,
  /CLAUDE\.md$/,
  /SKILL\.md$/,
  /\.schema\.json$/,
  /\.env\.example$/,
];

function isExcludedPath(filePath) {
  if (!filePath) return false;
  return EXCLUDED_PATH_PATTERNS.some((p) => p.test(filePath));
}

async function main() {
  try {
    const data = await readStdin();

    const toolName = data.tool_name || '';
    if (toolName !== 'Edit' && toolName !== 'Write') {
      return output(HookOutput.passthrough());
    }

    const filePath = data.tool_input?.file_path || '';

    if (isExcludedPath(filePath)) {
      return output(HookOutput.passthrough());
    }

    // Edit: new_string を検査、Write: content を検査
    const contentToCheck =
      toolName === 'Edit'
        ? data.tool_input?.new_string || ''
        : data.tool_input?.content || '';

    const secrets = detectSecrets(contentToCheck);

    if (secrets.length > 0) {
      const reason =
        `[Secret Leak Guard] シークレットのハードコードが検出されました。\n\n` +
        `ファイル: ${filePath}\n` +
        `検出されたシークレット: ${secrets.join(', ')}\n\n` +
        `解決方法:\n` +
        `1. シークレットを .env ファイルに移動してください\n` +
        `2. 環境変数として参照してください (例: process.env.API_KEY)\n` +
        `3. .env.example にはプレースホルダーのみ記載してください`;
      return output(HookOutput.deny(reason));
    }

    return output(HookOutput.passthrough());
  } catch (_) {
    return output(HookOutput.passthrough());
  }
}

safeHookMain(main);
