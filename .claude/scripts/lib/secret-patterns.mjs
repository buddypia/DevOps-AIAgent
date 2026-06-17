/**
 * secret-patterns.mjs
 *
 * hermes-agent の prefix-taxonomy redaction パターンから適応した小さな
 * シークレット検出/マスキングライブラリ。hook が Edit/Write のたびに
 * import するため、決定論的かつ依存ゼロに保つこと。
 */

const REDACT_ENABLED = process.env.BRIEF2DEV_REDACT_SECRETS !== 'false';

export const SECRET_PATTERNS = [
  { name: 'AWS Access Key', regex: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g },
  { name: 'AWS Secret Key', regex: /\baws_secret_access_key\s*=\s*['"]?[A-Za-z0-9/+=]{40}['"]?/gi },
  { name: 'Google API Key', regex: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { name: 'Firebase Config Key', regex: /\bAIzaSy[A-Za-z0-9_-]{33}\b/g },
  { name: 'OpenAI API Key', regex: /\bsk-(?:proj|svcacct|admin|None)-[A-Za-z0-9_]{48,}\b/g },
  { name: 'OpenAI Legacy API Key', regex: /\bsk-[A-Za-z0-9]{48,}\b/g },
  { name: 'Anthropic API Key', regex: /\bsk-ant-(?:api|admin)\d{2}-[A-Za-z0-9_-]{48,}\b/g },
  { name: 'Perplexity API Key', regex: /\bpplx-[A-Za-z0-9]{32,}\b/g },
  { name: 'Tavily API Key', regex: /\btvly-[A-Za-z0-9_-]{20,}\b/g },
  { name: 'GitHub Token', regex: /\bgh[pousr]_[A-Za-z0-9_]{36,}\b/g },
  { name: 'GitLab PAT', regex: /\bglpat-[A-Za-z0-9_-]{20,}\b/g },
  { name: 'Slack Token', regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { name: 'Slack App Token', regex: /\bxapp-[A-Za-z0-9-]{10,}\b/g },
  { name: 'Stripe Key', regex: /\b[sp]k_(?:live|test)_[A-Za-z0-9]{20,}\b/g },
  { name: 'npm Token', regex: /\bnpm_[A-Za-z0-9]{36,}\b/g },
  { name: 'PyPI Token', regex: /\bpypi-AgEI[A-Za-z0-9_-]{20,}\b/g },
  { name: 'Hugging Face Token', regex: /\bhf_[A-Za-z0-9]{30,}\b/g },
  { name: 'Cohere API Key', regex: /\bco-[A-Za-z0-9]{30,}\b/g },
  { name: 'Vercel Token', regex: /\bvercel_[A-Za-z0-9]{24,}\b/g },
  { name: 'Linear API Key', regex: /\blin_api_[A-Za-z0-9]{30,}\b/g },
  { name: 'Telegram Bot Token', regex: /\b\d{8,10}:[A-Za-z0-9_-]{35}\b/g },
  { name: 'JWT', regex: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}(?:\.[A-Za-z0-9_-]{10,})?\b/g },
  { name: 'Private Key', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { name: 'Database URL', redactor: 'database-url', regex: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|amqp):\/\/[^:\s/]+:[^@\s]+@[^\s'")]+/gi },
  { name: 'Authorization Bearer', redactor: 'bearer', regex: /\bAuthorization\s*:\s*Bearer\s+[A-Za-z0-9._~+/=-]{20,}/gi },
  { name: 'JSON Secret Field', redactor: 'json-field', regex: /"[^"]*(?:api[_-]?key|token|secret|password|credential)[^"]*"\s*:\s*"[^"]{8,}"/gi },
  // ENV スタイルの識別子のみマッチ (UPPER_SNAKE_CASE)。camelCase/PascalCase の変数名 (例: commaTokens, apiKey) は
  // 下記の Mixed-Case Secret Assignment + L39-42 の Hardcoded {Password,Secret,API Key,Token} パターンが string literal の形のときに捕捉する。
  // 以前の `gi` フラグは一般的な英単語 (Tokens, Secrets) の変数代入まで誤検出していた → case-sensitive (`g` のみ) に絞った。
  { name: 'Env Secret Assignment', redactor: 'assignment', regex: /\b[A-Z0-9_]*(?:API_?KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL)[A-Z0-9_]*\s*=\s*['"]?[^'"\s]{8,}['"]?/g },
  // Mixed-case の識別子 (myToken / accessToken / MyApiKey 等) が **string literal** に代入されるときのみ捕捉。
  // 関数呼び出し (`= getToken()`) / 配列 (`= []`) / env 参照 (`= process.env.X`) は quote 不在で自然に回避される。
  // 単語境界 `\b\w+` + キーワード (Token/Secret/Password/ApiKey) suffix マッチ — 複数形 (Tokens) を回避 (suffix の後に追加の word char があるとマッチ終了)。
  { name: 'Mixed-Case Secret Assignment', redactor: 'assignment', regex: /\b\w+(?:Token|Secret|Password|ApiKey)\s*=\s*['"][^'"]{8,}['"]/g },
  { name: 'Hardcoded Password', redactor: 'assignment', regex: /\b(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]{4,}['"]/gi },
  { name: 'Hardcoded Secret', redactor: 'assignment', regex: /\b(?:secret|secret_key|client_secret)\s*[:=]\s*['"][^'"]{4,}['"]/gi },
  { name: 'Hardcoded API Key', redactor: 'assignment', regex: /\b(?:api_key|apikey|api_secret)\s*[:=]\s*['"][^'"]{8,}['"]/gi },
  { name: 'Hardcoded Token', redactor: 'assignment', regex: /\b(?:auth_token|access_token|bearer)\s*[:=]\s*['"][^'"]{8,}['"]/gi },
];

function reset(regex) {
  regex.lastIndex = 0;
  return regex;
}

export function maskToken(token) {
  if (typeof token !== 'string' || token.length < 18) return '***';
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

function redactDatabaseUrl(match) {
  return match.replace(/:\/\/([^:\s/]+):([^@\s]+)@/, '://$1:***@');
}

function redactAssignment(match) {
  return match.replace(/([:=])\s*(['"]?)([^'"\s]+)\2$/, (_full, sep) => `${sep}***`);
}

function redactJsonField(match) {
  return match.replace(/:\s*"[^"]*"/, ': "***"');
}

export function detectSecrets(content) {
  if (!content || typeof content !== 'string') return [];

  const found = [];
  for (const { name, regex } of SECRET_PATTERNS) {
    if (reset(regex).test(content)) found.push(name);
  }
  return [...new Set(found)];
}

export function redactSensitiveText(text) {
  if (!REDACT_ENABLED || !text || typeof text !== 'string') return text;

  let out = text;
  for (const { regex, redactor } of SECRET_PATTERNS) {
    reset(regex);
    out = out.replace(regex, (match) => {
      if (redactor === 'database-url') return redactDatabaseUrl(match);
      if (redactor === 'json-field') return redactJsonField(match);
      if (redactor === 'assignment') return redactAssignment(match);
      if (redactor === 'bearer') {
        return match.replace(/Bearer\s+(.+)$/i, (_, token) => `Bearer ${maskToken(token)}`);
      }
      return maskToken(match);
    });
  }
  return out;
}
