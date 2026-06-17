/**
 * prompt-injection-patterns.mjs
 *
 * hermes-agent の context prompt-injection スキャンから適応した
 * コンテキストファイルスキャナ。
 *
 * 【移行時の適応】brief2dev 本体では R-CM-020 learnings SSOT (learnings.mjs の
 * `findAllInjectionMatches`) を import して、動的に学習した注入パターンを
 * 静的パターンに上乗せしていた。本プロジェクトでは learnings ストアを移行して
 * いないため、その依存をローカルスタブ (常に空配列を返す) に置き換えた。
 * 静的な INVISIBLE_CHARS + CONTEXT_THREAT_PATTERNS による検出はそのまま機能する。
 */

/**
 * R-CM-020 学習パターンのスタブ (移行時に適応)。
 * learnings ストア未移行のため、動的に学習した注入パターンは存在しない。
 * @returns {Array<{index: number, pattern: string, matched: string}>} 常に空配列
 */
function findAllInjectionMatches() {
  return [];
}

export const INVISIBLE_CHARS = [
  { id: 'zero_width_space', char: '​' },
  { id: 'zero_width_non_joiner', char: '‌' },
  { id: 'zero_width_joiner', char: '‍' },
  { id: 'word_joiner', char: '⁠' },
  { id: 'byte_order_mark', char: '﻿' },
  { id: 'left_to_right_embedding', char: '‪' },
  { id: 'right_to_left_embedding', char: '‫' },
  { id: 'pop_directional_formatting', char: '‬' },
  { id: 'left_to_right_override', char: '‭' },
  { id: 'right_to_left_override', char: '‮' },
];

export const CONTEXT_THREAT_PATTERNS = [
  { id: 'do_not_tell_user', regex: /do\s+not\s+tell\s+the\s+user/i },
  { id: 'system_prompt_override', regex: /system\s+prompt\s+(override|replacement|update)/i },
  { id: 'hidden_html_comment', regex: /<!--[\s\S]*?(?:ignore|override|system|secret|hidden)[\s\S]*?-->/i },
  { id: 'hidden_div', regex: /<\s*div\b[^>]*style\s*=\s*["'][^"']*display\s*:\s*none/i },
  { id: 'translate_then_execute', regex: /translate[\s\S]{0,120}(then|and)\s+execute/i },
  { id: 'curl_secret_exfiltration', regex: /curl\s+[^\n]*\$\{?\w*(?:KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|API)/i },
  { id: 'read_secret_file', regex: /cat\s+[^\n]*(?:\.env|credentials|\.netrc|\.pgpass)/i },
  { id: 'base64_shell_pipe', regex: /base64\s+-d\s*\|\s*(?:bash|sh)\b/i },
];

const MAX_MATCH_PREVIEW = 120;

function uniqueFindings(findings) {
  const seen = new Set();
  const out = [];
  for (const finding of findings) {
    const key = `${finding.source}:${finding.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(finding);
  }
  return out;
}

export function previewPromptInjectionMatch(value, maxLength = MAX_MATCH_PREVIEW) {
  if (!value) return '';
  const compact = String(value).replace(/\s+/g, ' ').trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength)}...`;
}

export function formatPromptInjectionFinding(finding) {
  const id = finding?.id || 'unknown';
  const matched = previewPromptInjectionMatch(finding?.matched);
  return `${id}${matched ? ` (${matched})` : ''}`;
}

export function scanPromptInjectionContent(content) {
  if (!content || typeof content !== 'string') return [];

  const findings = [];

  for (const match of findAllInjectionMatches(content)) {
    findings.push({
      id: `r-cm-020-pattern-${match.index}`,
      source: 'r-cm-020',
      pattern: match.pattern,
      matched: match.matched,
    });
  }

  for (const { id, char } of INVISIBLE_CHARS) {
    if (content.includes(char)) {
      findings.push({
        id: `invisible_unicode_${id}`,
        source: 'hermes-context-scan',
        matched: `U+${char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`,
      });
    }
  }

  for (const { id, regex } of CONTEXT_THREAT_PATTERNS) {
    const match = regex.exec(content);
    if (match) {
      findings.push({
        id,
        source: 'hermes-context-scan',
        pattern: regex.toString(),
        matched: match[0],
      });
    }
  }

  return uniqueFindings(findings);
}
