/**
 * cli-adapter-utils.mjs — Multi-CLI Hook Adapter Utilities
 *
 * Codex CLI 와 Antigravity CLI (agy — Google Antigravity) 의 stdin JSON payload 를
 * 본체 hook (Claude Code 형식 `{ tool_name, tool_input, cwd }`) 으로 정규화하고,
 * 본체 결과를 각 CLI 의 wire 형식으로 변환한다.
 *
 * 본체 hook 의 `run(data)` 함수는 Claude stdin 형식을 가정하므로, 어댑터는
 * stdin schema 변환 + 본체 run() 호출 + CLI 별 응답 형식 변환만 담당한다.
 *
 * 본 lib 는 가드 도메인 로직을 포함하지 않는다 (schema/IO 만). 가드 결정은
 * 본체 hook (`.claude/hooks/<name>.mjs`) 의 export 된 순수 함수가 SSOT.
 *
 * Antigravity hook spec 출처 (공식 우선, R-CM-029 Rule 6 — 2026-07-09 재검증):
 *   - **PRIMARY (실측, 최신)**: 설치된 `agy` v1.1.0 바이너리에 임베드된 공식 문서 전문(`# Lifecycle
 *     Hooks (\`hooks.json\`)`, `strings` 추출로 확인) — antigravity.google/docs/hooks 웹페이지는
 *     JS SPA 라 자동 fetch 로 본문을 못 읽고(WebFetch 시도, 2026-07-09), 3rd-party 블로그
 *     (danicat.dev / antigravitylab.net)는 서로 다른 스키마(파일 경로 `.antigravity/settings.json`
 *     vs `.agents/hooks.json`, matcher 이름 `run_shell_command` vs `run_command` 등)를 주장해
 *     신뢰 불가 — 바이너리에 실제 컴파일된 문서 텍스트가 가장 권위 있는 1차 소스.
 *   - 교차검증(경로만): 공식 repo CHANGELOG https://github.com/google-antigravity/antigravity-cli
 *     v1.0.8 — `~/.gemini/config/hooks.json` (글로벌 옵션 경로 존재 자체는 유효).
 *   Antigravity 는 Claude 와 다른 자체 이벤트를 사용한다 — **PreToolUse / PostToolUse / PreInvocation /
 *   PostInvocation / Stop** 5 종뿐 (`SessionStart` 는 공식 이벤트가 아님 — 구현이 잘못 가정했던
 *   부분, 2026-07-09 실측으로 확정). **구조도 이벤트별로 다르다**: PreToolUse/PostToolUse 는
 *   GROUPED(`[{matcher, hooks:[...]}]`), Stop/PreInvocation/PostInvocation 은 FLAT(핸들러 객체를
 *   매처/hooks 래퍼 없이 이벤트 배열에 직접 나열) — 이전 구현은 Stop 에도 GROUPED 를 잘못 적용해
 *   `.claude/hooks.json` 전체가 스키마 부적합으로 사실상 무시됐을 가능성이 높다(codegen 수정:
 *   `.cli/lib/cli-hooks-codegen.mjs` `flatEvents`). stdin(`toolCall.name`/`toolCall.args`)·
 *   stdout(`{decision, reason}`)·tool 이름(`run_command`/`write_to_file`/`replace_file_content`)은
 *   기존 구현이 이미 정확했다(실측 재확인).
 *   (구 구현은 Antigravity 를 Gemini CLI hook(BeforeTool/run_shell)으로 가정했으나 공식 spec 과
 *   불일치하여 이전 PR 에서 교정. legacy Gemini tool alias 는 backwards-compat 로 매핑만 유지.)
 *
 * Gemini CLI hook spec 출처 (공식, R-CM-029 Rule 6 — Antigravity 와 별개 제품):
 *   - 공식 문서: https://geminicli.com/docs/hooks/reference/ (이벤트/입출력 스키마 SSOT)
 *   - 공식 tool 이름: https://github.com/google-gemini/gemini-cli/blob/main/docs/reference/tools.md
 *   Gemini CLI 는 `BeforeTool`/`AfterTool`(≈PreToolUse/PostToolUse) + `AfterAgent`(≈Stop) 이벤트를
 *   쓰며, stdin 필드명(`tool_name`/`tool_input`)은 Claude Code 와 동일하다(값만 다름 — 예:
 *   `run_shell_command`). stdout 은 `{decision:"allow"|"deny"("block" alias), reason}` — exit code
 *   0/2 계약도 Claude 와 사실상 동형. Antigravity 와는 별개 제품(별도 hook 계약)이므로 혼동 금지
 *   (구 구현이 Antigravity 를 Gemini 로 오인했던 사고 — 위 주석 참조. 본 PR 에서 진짜 Gemini CLI 를
 *   `GEMINI_TOOL_MAP`/`mapGeminiCliToolName`/`toGeminiWire` 로 신규 추가, legacy alias 는 그대로 유지).
 *
 * Boundary: 관점 1 (brief2dev 자체) 전용 — R-CM-028.
 */

const STDIN_DEADLINE_MS = 1500;

/**
 * stdin 에서 JSON 읽기. 타임아웃 또는 parse 실패 시 빈 객체 반환 (fail-open).
 *
 * @returns {Promise<object>}
 */
export async function readStdinJson() {
  return new Promise((resolve) => {
    let buf = '';
    let timer = setTimeout(() => resolve({}), STDIN_DEADLINE_MS);
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => {
      buf += chunk;
    });
    process.stdin.on('end', () => {
      clearTimeout(timer);
      try {
        resolve(JSON.parse(buf || '{}'));
      } catch {
        resolve({});
      }
    });
    process.stdin.on('error', () => {
      clearTimeout(timer);
      resolve({});
    });
  });
}

/**
 * Antigravity tool 이름 → Claude tool 이름 매핑 표 (table-driven — cyclomatic 최소화).
 *
 * 공식 Antigravity tool 이름 (antigravity.google/docs + danicat.dev "Mastering Hooks"):
 *   run_command / write_to_file / replace_file_content / multi_replace_file_content / view_file.
 * legacy Gemini CLI alias (backwards-compat — 구 구현 환경 회귀 방지. UNVERIFIED for Antigravity native):
 *   run_shell / shell / run_shell_command / write_file / replace / multi_replace.
 */
const ANTIGRAVITY_TOOL_MAP = {
  // 공식 Antigravity tool 이름
  run_command: 'Bash',
  write_to_file: 'Write',
  replace_file_content: 'Edit',
  multi_replace_file_content: 'MultiEdit',
  view_file: 'Read',
  // legacy Gemini CLI alias (backwards-compat)
  run_shell: 'Bash',
  shell: 'Bash',
  run_shell_command: 'Bash',
  write_file: 'Write',
  replace: 'Edit',
  multi_replace: 'MultiEdit',
};

/**
 * Antigravity 도구 이름을 Claude 형식으로 매핑. 미등록 이름은 그대로 통과
 * (본체 hook 의 tool name 분기에서 패스스루). 빈 값은 Bash default.
 */
export function mapAntigravityToolName(name) {
  if (!name) return 'Bash';
  return ANTIGRAVITY_TOOL_MAP[name] || name;
}

/**
 * Backwards-compat alias. 신규 코드는 mapAntigravityToolName 사용 권장.
 * (Antigravity rename PR — feature/antigravity-rename-p0-fix)
 *
 * @deprecated 이 이름은 Antigravity 매핑을 가리킨다(과거 오인의 흔적) — 진짜 Gemini CLI 매핑이
 * 아니다. 신규 코드는 `mapGeminiCliToolName` (진짜 Gemini CLI 전용) 을 사용할 것.
 */
export const mapGeminiToolName = mapAntigravityToolName;

/**
 * Gemini CLI(geminicli.com) 공식 tool 이름 → Claude tool 이름 매핑 표.
 *
 * 출처(공식, 2026-07-02 확인): https://github.com/google-gemini/gemini-cli/blob/main/docs/reference/tools.md
 * + https://github.com/google-gemini/gemini-cli/issues/18807 (`.gemini/settings.json` tools.core
 * 식별자 원문) — run_shell_command / read_file / write_file / replace / glob / grep_search /
 * list_directory 확인. `run_shell_command`/`read_file` 은 hooks reference 문서(BeforeTool 예시)에서도
 * 재확인됨. Gemini CLI 에는 Antigravity 의 `multi_replace_file_content` 에 대응하는 별도 tool 이 없다 —
 * `replace` 하나가 단일/복수 편집을 모두 처리하므로 MultiEdit 도 `replace` 로 매핑한다(Codex의
 * apply_patch 가 Write/Edit/MultiEdit 를 흡수하는 것과 유사한 다대일 구조).
 */
const GEMINI_TOOL_MAP = {
  run_shell_command: 'Bash',
  read_file: 'Read',
  write_file: 'Write',
  replace: 'Edit',
};

/**
 * Gemini CLI 도구 이름을 Claude 형식으로 매핑. 미등록 이름은 그대로 통과
 * (본체 hook 의 tool name 분기에서 패스스루). 빈 값은 Bash default(Antigravity 와 동일 정책 —
 * 두 CLI 모두 tool 이름이 항상 채워지는 스펙 전제, 방어적 default).
 */
export function mapGeminiCliToolName(name) {
  if (!name) return 'Bash';
  return GEMINI_TOOL_MAP[name] || name;
}

/**
 * 역방향 매핑 SSOT — Claude tool 이름 → 각 CLI 의 matcher 토큰 (Codex / Antigravity / Gemini).
 *
 * `ANTIGRAVITY_TOOL_MAP`/`GEMINI_TOOL_MAP` (CLI→Claude) 의 역방향. `scaffold-multi-cli-hook.mjs` 의
 * TOOL_MATCH 와 멀티-CLI 등록 parity 검증(`tests/unit/multi-cli-parity.test.mjs`)이 본 SSOT 를
 * 공유한다 — 중복 제거.
 *
 * Codex: 공식 canonical 은 Bash / apply_patch (references/codex-cli-hooks.md). shell / run_shell /
 *   run_shell_command / exec_command 는 brief2dev 관례(기존 .codex/hooks.json)의 방어적 변종(UNVERIFIED).
 *   apply_patch 가 Edit / Write / MultiEdit 를 단일 파일 tool 로 흡수.
 * Antigravity: 공식 tool 이름 run_command / write_to_file / replace_file_content /
 *   multi_replace_file_content / view_file (antigravity.google/docs/hooks — ANTIGRAVITY_TOOL_MAP 역방향).
 * Gemini: 공식 tool 이름 run_shell_command / write_file / replace / read_file
 *   (github.com/google-gemini/gemini-cli docs/reference/tools.md — GEMINI_TOOL_MAP 역방향). MultiEdit 은
 *   Gemini 에 전용 tool 이 없어 `replace` 재사용(위 GEMINI_TOOL_MAP 주석 참조).
 */
export const CLAUDE_TO_CLI_MATCHERS = Object.freeze({
  Bash: {
    codex: ['Bash', 'shell', 'run_shell', 'run_shell_command', 'exec_command'],
    antigravity: ['run_command'],
    gemini: ['run_shell_command'],
  },
  Write: { codex: ['Write', 'apply_patch'], antigravity: ['write_to_file'], gemini: ['write_file'] },
  Edit: { codex: ['Edit', 'apply_patch'], antigravity: ['replace_file_content'], gemini: ['replace'] },
  MultiEdit: {
    codex: ['MultiEdit', 'apply_patch'],
    antigravity: ['multi_replace_file_content'],
    gemini: ['replace'],
  },
  Read: { codex: ['Read'], antigravity: ['view_file'], gemini: ['read_file'] },
});

/**
 * Claude tool 이름 배열 → 주어진 CLI 의 matcher 토큰 배열 (순서 보존 dedup).
 * 미등록 Claude tool 은 그대로 통과(방어적 — 본체 matcher 가 비표준 tool 일 때).
 *
 * @param {string[]} claudeTools - Claude matcher 의 tool 이름들 (예: ['Edit','Write'])
 * @param {'codex'|'antigravity'} cli
 * @returns {string[]}
 */
export function cliMatcherTokens(claudeTools, cli) {
  const out = [];
  for (const t of claudeTools || []) {
    const tokens = CLAUDE_TO_CLI_MATCHERS[t]?.[cli] || [t];
    for (const tok of tokens) if (!out.includes(tok)) out.push(tok);
  }
  return out;
}

/**
 * Codex tool 이름 → Claude tool 이름 정규화 맵 (CLAUDE_TO_CLI_MATCHERS 역인덱싱 — matcher SSOT 단일 원천).
 *
 * 배경 (drift 차단): codex matcher 는 `CLAUDE_TO_CLI_MATCHERS[*].codex` 의 토큰들 (Bash 의 경우
 * shell / run_shell / run_shell_command / exec_command 방어적 변종 포함) 에 대해 dispatch 를 fire 한다.
 * 그런데 normalizePayload 는 antigravity 만 tool name 을 정규화하고 codex 는 passthrough 였다 — matcher 는
 * 변종을 받는데 normalizer 는 변종을 canonical Bash 로 접지 않아, 본체 guard (tool_name === 'Bash' 분기) 가
 * codex 변종 명령 (예: `run_shell` 의 `git push --force`) 을 인식 못 하고 fail-open 했다. 정규화 맵을
 * matcher SSOT 에서 역derive 하여 matcher ⟺ normalizer 대칭을 구조적으로 보장한다 (둘이 같은 원천에서 파생).
 *
 * apply_patch 는 Write / Edit / MultiEdit 3 tool 에 동시 매핑 (ambiguous) 되어 단일 canonical 로 접을 수
 * 없으므로 맵에서 제외 — normalizePayload 가 expandCodexApplyPatch 로 별도 처리한다.
 */
function buildCodexToolNameMap() {
  const map = Object.create(null);
  const ambiguous = new Set();
  for (const [claudeTool, perCli] of Object.entries(CLAUDE_TO_CLI_MATCHERS)) {
    for (const token of perCli.codex || []) {
      if (token in map && map[token] !== claudeTool) ambiguous.add(token);
      else map[token] = claudeTool;
    }
  }
  for (const token of ambiguous) delete map[token];
  return Object.freeze(map);
}
const CODEX_TOOL_MAP = buildCodexToolNameMap();

/**
 * Codex 도구 이름을 Claude 형식으로 매핑. 미등록 이름 + 빈 값은 그대로 통과 (본체 hook 의 tool name
 * 분기에서 패스스루). antigravity (빈 값 → Bash default) 와 달리 codex 는 빈 값도 passthrough 하여
 * 기존 동작을 보존한다 — 정규화는 matcher 가 fire 하는 *알려진 토큰* 에만 적용 (over-mapping 회피).
 */
export function mapCodexToolName(name) {
  if (!name) return name;
  return CODEX_TOOL_MAP[name] || name;
}

/**
 * raw tool 이름 → Claude canonical tool 이름 (CLI 별 정규화 단일 진입점).
 *   - antigravity: mapAntigravityToolName (빈 값 → Bash default + legacy alias 포함)
 *   - codex:       mapCodexToolName (matcher SSOT 역derive, 빈 값 passthrough)
 *   - gemini:      mapGeminiCliToolName (빈 값 → Bash default, 공식 tool 이름 매핑)
 *   - 그 외 (claude 등): passthrough
 */
export function normalizeCliToolName(name, cli) {
  if (cli === 'antigravity') return mapAntigravityToolName(name);
  if (cli === 'codex') return mapCodexToolName(name);
  if (cli === 'gemini') return mapGeminiCliToolName(name);
  return name;
}

/**
 * Claude 호환 payload 형식 (`tool_name` 키 보유) 이면 그대로 picking.
 * 부재 시 null 반환 — 호출자가 alternate schema 처리.
 */
function pickClaudeShape(data) {
  if (!data?.tool_name) return null;
  return {
    tool_name: data.tool_name,
    tool_input: data.tool_input || {},
    cwd: data.cwd || process.cwd(),
    session_id: data.session_id,
    stop_hook_active: data.stop_hook_active,
    hook_event_name: data.hook_event_name,
    // PostToolUse 어댑터(worktree-owner-tracker)가 exit_code 게이트에 사용. PreToolUse 는 undefined.
    tool_response: data.tool_response,
  };
}

/**
 * Non-tool event fields that prompt/session hooks need after CLI normalization.
 * Tool guards ignore these keys, but UserPromptSubmit hooks lose their only
 * useful input if the adapter only returns tool_name/tool_input.
 */
function pickNonToolEventShape(data) {
  const out = {};
  for (const key of ['prompt', 'user_prompt', 'message', 'parts', 'source', 'turn_id', 'agent_type']) {
    if (data?.[key] !== undefined) out[key] = data[key];
  }
  return out;
}

/**
 * 각 CLI 의 nested/alternate payload 에서 tool name 추출.
 *   - Antigravity: `toolCall.name` (공식)
 *   - Codex:       `tool.name` (nested fallback) 또는 flat `tool_name`
 */
function extractToolName(data) {
  return data?.toolCall?.name || data?.tool?.name || data?.tool_name || '';
}

/**
 * tool 입력 객체 추출. Antigravity `toolCall.args` / Codex `tool.input` / flat `input` 순.
 */
function extractToolInput(data) {
  return data.toolCall?.args || data.tool?.input || data.input || {};
}

/**
 * Antigravity `toolCall.args` 의 *명령* 필드 → Claude `tool_input.command` (VERIFIED, additive).
 *
 * Antigravity 는 run_command 의 명령 문자열을 `CommandLine` 으로 전달한다 (Gemini 의
 * `tool_input.command` 와 다름) — Galloro 마이그레이션 가이드 + danicat.dev 검증 2026-06-20
 * (hook-specific 출처). 본체 guard(commit-guard / destructive-git-guard 의 `tool_input.command`)가
 * 명령을 읽으므로, 매핑하지 않으면 본체 guard 가 명령을 못 봐 fail-open(git push --force 미차단)한다.
 * 키 존재 기반 additive — 원본 키(`CommandLine`)도 보존하고 Claude 키(`command`)를 미존재 시에만 추가.
 */
const ANTIGRAVITY_ARG_MAP = Object.freeze({ CommandLine: 'command' });

/**
 * Antigravity write/edit tool 의 *file path* 필드명 후보 (방어적 multi-candidate probe).
 *
 * 정확한 필드명은 UNVERIFIED — 로컬 `agy` CLI 부재로 `agy inspect` 미확인(DEBT-203/204).
 * 단일 후보(`TargetFile`)만 매핑하면 실제 이름이 조금만 달라도 file guard 가 `file_path` 부재로
 * fail-open(file-edit 벡터 미차단)된다. 후보 집합을 *first-match additive* 매핑하여 — 실제 필드명이
 * 후보 중 무엇이든 — guard 가 경로를 추출하도록 한다 → **fail-open 을 fail-safe 로 전환**(defense-in-depth,
 * DEBT-195 보안 갭 폐쇄). 이는 "TargetFile 이 그 필드다" 라는 *사실 주장이 아니라* 불확실성에 대한
 * 방어다 (R-CM-024 정직성 — 사실 확정 아님). 정확한 이름이 확정되면 본 후보를 단일 검증 매핑으로
 * 좁힐 수 있다(DEBT-203, `agy inspect`).
 *
 * 순서 = 특이성 높은 순(first-match 시 더 구체적 후보 우선). 적용은 Write/Edit/MultiEdit 로 정규화된
 * tool 에만 게이트 — run_command 의 generic `path` 류 args 오탐 회피. write_to_file/replace_file_content
 * 의 args 는 본질적으로 파일-타깃이므로 후보 매칭 오탐 위험 낮음.
 */
const ANTIGRAVITY_PATH_FIELD_CANDIDATES = Object.freeze([
  'TargetFile', // 리버스 엔지니어링 1순위 후보 (Antigravity)
  'target_file', // snake_case 변종
  'filePath', // camelCase 변종
  'absolute_path', // 절대경로 컨벤션 변종
  'path', // generic — edit-class tool 게이트 하에서만 적용 (오탐 최소)
]);

/**
 * 각 *정규화* Claude tool 이름의 file-path probe 적격성 (SSOT).
 *
 * `ANTIGRAVITY_TOOL_MAP` 의 모든 정규화 값(Claude 이름)은 여기 분류돼야 한다 — file-edit(write/edit)
 * tool = `true` → 경로 가드가 `file_path` 를 봐야 하므로 probe 대상. command/read tool = `false` →
 * run_command 의 generic path args 오탐 회피 위해 probe 제외.
 *
 * **drift 차단 (2026-06-24 coverage-claim-scope-drift 회고 동형)**: 과거엔 `PATH_PROBE_TOOLS` 가
 * 독립 하드코딩 집합이라, 신규 Antigravity write tool 을 `ANTIGRAVITY_TOOL_MAP` 에 추가하면서 probe
 * 집합 갱신을 누락하면 그 write tool 이 probe 를 못 받아 보안 fail-open 이 재발할 수 있었다 (두 집합의
 * 독립 진화 = 탐지 범위가 보호 대상보다 좁아지는 drift). 본 분류 SSOT 에서 `PATH_PROBE_TOOLS` 를
 * *파생* 하여 그 drift 를 구조적으로 제거하고, `unclassifiedProbeTools()` invariant 가 분류 누락을
 * RED 로 잡는다 (회귀: `tests/unit/cli-adapter-utils.test.mjs`).
 */
const TOOL_PATH_DISPOSITION = Object.freeze({
  Bash: false, // command — generic path args 오탐 회피
  Read: false, // read-only — 경로 가드 비대상
  Write: true, // file-edit
  Edit: true, // file-edit
  MultiEdit: true, // file-edit
});

/**
 * file path probe 대상 tool (Claude *정규화* 이름). `TOOL_PATH_DISPOSITION` 에서 *파생* — 독립
 * 하드코딩 집합이 아니므로 tool-map 분류와 drift 불가(구조적 제거). file-edit 분류 tool 만 포함.
 *
 * 잔여 (정직 — 본 fix 범위 밖): Antigravity 가 *미래에* `ANTIGRAVITY_TOOL_MAP` *미등록* 쓰기 tool
 * (raw 이름이 어느 Claude tool 로도 정규화 안 됨)을 도입하면 게이트를 못 넘어 probe 미적용 → fail-open
 * 잔존. 이 잔여는 외부-검증불가(이름 spec 부재)라 코드로 닫을 수 없고, 해소 경로는 신규 tool 을
 * `ANTIGRAVITY_TOOL_MAP` 에 등록(→ 정규화되어 자동 probe)하는 것. tripwire 테스트가 명시 문서화.
 */
const PATH_PROBE_TOOLS = Object.freeze(
  new Set(
    Object.entries(TOOL_PATH_DISPOSITION)
      .filter(([, isFileEdit]) => isFileEdit)
      .map(([toolName]) => toolName),
  ),
);

/**
 * 분류 누락(drift) 검출 — `ANTIGRAVITY_TOOL_MAP` 의 정규화 값 중 `TOOL_PATH_DISPOSITION` 미분류 이름 반환.
 * 빈 배열 = drift 없음. 신규 write tool 을 tool-map 에 추가하면서 본 분류를 누락하면 그 이름이 반환되어
 * invariant 테스트가 RED → 보안 fail-open 재발을 구조적으로 차단.
 *
 * @param {Record<string,string>} [toolMap] - 테스트 stub 주입용 (default: 실제 ANTIGRAVITY_TOOL_MAP)
 * @returns {string[]} 미분류 정규화 tool 이름 (중복 제거, 등장 순서)
 */
export function unclassifiedProbeTools(toolMap = ANTIGRAVITY_TOOL_MAP) {
  if (!toolMap || typeof toolMap !== 'object' || Array.isArray(toolMap)) return [];
  const out = [];
  const seen = new Set();
  for (const claudeName of Object.values(toolMap)) {
    if (typeof claudeName !== 'string' || seen.has(claudeName)) continue;
    seen.add(claudeName);
    if (!Object.hasOwn(TOOL_PATH_DISPOSITION, claudeName)) out.push(claudeName);
  }
  return out;
}

/**
 * 후보 필드 중 first non-empty string 값을 반환 (없으면 undefined). 방어적 file path probe 의 코어.
 */
function probeAntigravityFilePath(args) {
  for (const cand of ANTIGRAVITY_PATH_FIELD_CANDIDATES) {
    const v = args[cand];
    if (typeof v === 'string' && v.trim().length > 0) return v;
  }
  return undefined;
}

/**
 * Antigravity write/edit tool 의 *new content* 필드명 후보 (방어적 multi-candidate probe).
 *
 * file_path probe 와 동일 rationale (DEBT-195/203 — `agy inspect` 부재로 정확 필드명 UNVERIFIED).
 * 콘텐츠 스캐너(secret-leak-guard 가 Write 의 `content` / Edit 의 `new_string` 을 읽음)가 Antigravity
 * edit 에서 콘텐츠를 못 봐 fail-open(시크릿 누출 미차단)되는 보안 갭을 fail-safe 로 전환한다. Claude
 * 키(`content`/`new_string`)는 `{...args}` 가 이미 보존하므로(필드명이 그대로일 때), 본 probe 의 가치는
 * *비-Claude 필드명*을 Claude 키로 alias 하는 것. "이 이름이 그 필드다" 라는 사실 주장이 아니라 불확실성
 * 방어다 (R-CM-024). 정확 이름 확정 시 단일 매핑으로 좁힌다.
 *
 * 한계 (정직): old_string(Edit 의 변경 전 내용)은 Antigravity edit args 에서 더욱 UNVERIFIED 라 probe 하지
 * 않는다 → old/new 둘 다 필요한 coverage-threshold-guard 는 Antigravity 에서 부분 동작(Codex apply_patch
 * 는 -/+ 라인으로 둘 다 확보되어 완전 동작). secret-leak-guard(new 만 필요)는 본 probe 로 동작.
 */
const ANTIGRAVITY_CONTENT_FIELD_CANDIDATES = Object.freeze([
  'content', // Claude Write 키 — {...args} 보존하나 명시 (probe 코어 일관)
  'new_string', // Claude Edit 키 — 동상
  'Contents', // PascalCase 변종 후보
  'FileText', // 변종 후보
  'code', // 변종 후보
  'text', // generic — edit-class tool 게이트 하에서만 적용
]);

/**
 * 후보 필드 중 first non-empty string 값을 반환 (없으면 undefined). 방어적 content probe 의 코어.
 * file_path probe 와 달리 trim 하지 않는다 (whitespace-only 도 콘텐츠로 보존 — 스캐너 입력 충실).
 */
function probeAntigravityContent(args) {
  for (const cand of ANTIGRAVITY_CONTENT_FIELD_CANDIDATES) {
    const v = args[cand];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return undefined;
}

/**
 * Antigravity args → Claude tool_input 정규화 (모두 additive, 원본 키 보존).
 *   1. command: `CommandLine` → `command` (VERIFIED, 키 존재 기반).
 *   2. file_path: write/edit tool 한정 후보 필드 first-match probe (방어적 fail-safe).
 *   3. content/new_string: write/edit tool 한정 콘텐츠 probe (콘텐츠 스캐너 fail-safe, 필드명 UNVERIFIED).
 *
 * @param {object} args - raw toolCall.args
 * @param {string} [normalizedToolName] - 정규화된 Claude tool 이름 (probe 게이트용)
 * @returns {object}
 */
function mapAntigravityArgs(args, normalizedToolName) {
  if (!args || typeof args !== 'object') return {};
  const mapped = { ...args };
  // 1. command (VERIFIED) — 키 존재 시에만, 기존 command 미덮어쓰기
  for (const [agKey, claudeKey] of Object.entries(ANTIGRAVITY_ARG_MAP)) {
    if (agKey in args && !(claudeKey in mapped)) mapped[claudeKey] = args[agKey];
  }
  // 2·3. file_path + content (방어적 probe) — edit-class tool 한정
  if (PATH_PROBE_TOOLS.has(normalizedToolName)) {
    if (!('file_path' in mapped)) {
      const probedPath = probeAntigravityFilePath(args);
      if (probedPath !== undefined) mapped.file_path = probedPath;
    }
    // content 는 Write 본체가, new_string 은 Edit 본체가 읽으므로 둘 다 채운다(미존재 시) — tool 분기 회피.
    const probedContent = probeAntigravityContent(args);
    if (probedContent !== undefined) {
      if (!('content' in mapped)) mapped.content = probedContent;
      if (!('new_string' in mapped)) mapped.new_string = probedContent;
    }
  }
  return mapped;
}

/**
 * 호출 cwd 해석. 명시 cwd → session.cwd → Antigravity workspacePaths[0] → process.cwd().
 */
function resolveCwd(data) {
  if (data.cwd) return data.cwd;
  if (data.session?.cwd) return data.session.cwd;
  if (Array.isArray(data.workspacePaths) && data.workspacePaths[0]) return data.workspacePaths[0];
  return process.cwd();
}

/**
 * Codex `apply_patch` 명령 문자열을 파싱하여 { op, filePath, newContent, oldContent } 추출.
 *
 * Codex 의 파일 편집은 tool_name 이 항상 `apply_patch` 이고 패치 본문은 tool_input.command 에 담긴다
 * (공식: references/codex-cli-hooks.md L464/L473 — "apply_patch use tool_input.command",
 * "hook input still reports tool_name: 'apply_patch'"). 본 함수가 없으면 Edit|Write 를 tool_name 으로
 * 게이트하거나 new_string/old_string/content 를 읽는 본체 가드(secret-leak-guard / coverage-threshold-guard
 * 등)가 Codex apply_patch 에서 PASSTHROUGH(무력)된다 — 실증 확인됨(2026-06-26).
 *
 * apply_patch 포맷 (OpenAI/Codex 표준):
 *   *** Begin Patch
 *   *** (Add|Update|Delete) File: <path>
 *   @@ <optional context>
 *    unchanged line
 *   -removed line   (→ oldContent, Edit 의 old_string)
 *   +added line     (→ newContent, Edit 의 new_string / Write 의 content)
 *   *** End Patch
 *
 * 첫 파일의 path 를 file_path 로, 패치 전체의 +/- 라인을 content 로 수집한다(멀티파일 패치 시 첫 파일
 * 경로 + 전체 added/removed — 콘텐츠 스캐너는 과탐(전체 스캔)이 미탐보다 안전. 단일 파일이 일반 케이스).
 * `+++`/`---` diff 헤더는 content 에서 제외(prefix 가 단일 `+`/`-` 가 아님). 인식 불가 시 null 반환(fail-open).
 *
 * @param {string} command - apply_patch 본문 문자열
 * @returns {{op:string, filePath:string, newContent:string, oldContent:string}|null}
 */
export function parseApplyPatch(command) {
  if (typeof command !== 'string' || command.length === 0) return null;
  const lines = command.split(/\r?\n/);
  let filePath = '';
  let op = '';
  const added = [];
  const removed = [];
  for (const line of lines) {
    const m = /^\*\*\*\s+(Add|Update|Delete)\s+File:\s*(.+?)\s*$/.exec(line);
    if (m) {
      if (!filePath) {
        op = m[1].toLowerCase();
        filePath = m[2];
      }
      continue;
    }
    // diff 헤더(`+++ b/path` / `--- a/path`)는 항상 마커 뒤 공백을 가진다 → 공백까지 매칭하여
    // 내용 라인(`+++x` 같이 content 가 `++`로 시작하는 추가 라인)의 오필터(스캔 누락)를 회피한다.
    if (line.startsWith('+++ ') || line.startsWith('--- ')) continue;
    if (line.startsWith('+')) added.push(line.slice(1));
    else if (line.startsWith('-')) removed.push(line.slice(1));
  }
  if (!filePath) return null;
  return { op, filePath, newContent: added.join('\n'), oldContent: removed.join('\n') };
}

/**
 * Codex apply_patch payload 를 Claude Edit/Write shape 으로 확장 (tool_name 재매핑 + content 추출).
 *   - Add File   → Write (tool_input.content = newContent)
 *   - Update File→ Edit  (tool_input.new_string = newContent, old_string = oldContent)
 *   - Delete File→ Edit  (file_path 만; content 없음)
 * 원본 tool_input.command 도 보존(additive). 파싱 불가 시 원본 shape 그대로(fail-open — apply_patch 유지).
 *
 * 부수효과(의도된 개선): file_path 를 채우므로 기존 Codex Edit|Write 포트(worktree-policy-guard /
 * worktree-session-owner-guard)도 그간 file_path 부재로 무력이던 latent 갭이 해소되어 정상 동작한다.
 *
 * @param {object} shape - pickClaudeShape 결과 (tool_name==='apply_patch')
 * @returns {object}
 */
export function expandCodexApplyPatch(shape) {
  const parsed = parseApplyPatch(shape.tool_input?.command);
  if (!parsed) return shape;
  const isWrite = parsed.op === 'add';
  const toolInput = { ...shape.tool_input, file_path: parsed.filePath };
  if (isWrite) {
    toolInput.content = parsed.newContent;
  } else {
    toolInput.new_string = parsed.newContent;
    toolInput.old_string = parsed.oldContent;
  }
  return { ...shape, tool_name: isWrite ? 'Write' : 'Edit', tool_input: toolInput };
}

/**
 * 각 CLI 의 stdin payload 를 Claude Code 형식으로 정규화.
 *
 * Schema (cross-checked 공식 문서):
 *   - Claude Code:   { tool_name, tool_input: { command, file_path, ... }, cwd, session_id, ... }
 *   - Codex CLI:     동일 schema (flat) + turn_id / permission_mode 확장
 *                    (https://developers.openai.com/codex/hooks)
 *   - Antigravity:   { toolCall: { name: 'run_command'|'write_to_file'|..., args: {...} },
 *                    workspacePaths: [...], transcriptPath }
 *                    (https://antigravity.google/docs/hooks, danicat.dev 교차검증)
 *
 * Codex 의 `tool.name` (nested) fallback 은 schema drift 안전망 — 현재 사양상 dead path 이나
 * future-proof 로 유지.
 *
 * 필드명 매핑: Antigravity `toolCall.args` 의 필드명은 Claude `tool_input` 과 다르다.
 *   - run_command: `CommandLine` → `command` (VERIFIED 2026-06-20 — Galloro 마이그레이션 가이드 +
 *     danicat.dev, hook-specific). `mapAntigravityArgs` 가 additive 매핑하여 본체 guard 가 명령을 읽도록 한다.
 *     매핑 부재 시 본체 guard 는 fail-open(git push --force 미차단) 이었음.
 *   - write_to_file/replace_file_content 의 file path 필드(필드명 UNVERIFIED — `agy` CLI 부재):
 *     `mapAntigravityArgs` 가 write/edit tool 한정 후보 집합(`TargetFile`/`target_file`/`filePath`/
 *     `absolute_path`/`path`)을 first-match additive probe 하여 `file_path` 를 채운다 — 실제 필드명이
 *     후보 중 무엇이든 file guard 가 경로를 추출(fail-open→fail-safe, DEBT-195 보안 갭 폐쇄). 정확한
 *     이름 확정(DEBT-203, `agy inspect`)은 후속 — 확정 시 후보를 단일 검증 매핑으로 좁힌다.
 *
 * @param {object} data - raw stdin JSON
 * @param {'claude'|'codex'|'antigravity'} cli
 * @returns {object} Claude Code 형식의 정규화된 payload
 */
export function normalizePayload(data, cli) {
  if (!data || typeof data !== 'object') return { tool_name: '', tool_input: {} };

  const claudeShape = pickClaudeShape(data);
  if (claudeShape) {
    // Codex 파일 편집은 tool_name='apply_patch' + 패치본문 in tool_input.command — Edit/Write shape 으로 확장
    // (그렇지 않으면 Edit|Write 게이트/콘텐츠 가드가 무력). 다른 tool/CLI 는 그대로 passthrough.
    if (cli === 'codex' && claudeShape.tool_name === 'apply_patch') {
      return expandCodexApplyPatch(claudeShape);
    }
    // Codex 변종 tool name (flat shape — shell/run_shell/run_shell_command/exec_command) → canonical Bash.
    // Gemini BeforeTool/AfterTool payload 도 tool_name 필드명은 Claude 와 동일하지만 값은 공식 Gemini
    // tool 이름(run_shell_command/write_file/replace/read_file)이라 같은 정규화가 필요하다 — 두 CLI 모두
    // normalizeCliToolName(matcher SSOT 역derive) 로 canonical Claude 이름으로 접어 본체 guard 의
    // tool_name==='Bash' 같은 분기가 인식하도록 한다. nested shape 와 동일 처리.
    if (cli === 'codex' || cli === 'gemini') {
      const canonical = normalizeCliToolName(claudeShape.tool_name, cli);
      if (canonical !== claudeShape.tool_name) return { ...claudeShape, tool_name: canonical };
    }
    return claudeShape;
  }

  const toolName = extractToolName(data);
  const normalizedName = normalizeCliToolName(toolName, cli);
  const rawInput = extractToolInput(data);
  const toolInput = cli === 'antigravity' ? mapAntigravityArgs(rawInput, normalizedName) : rawInput;

  return {
    tool_name: normalizedName,
    tool_input: toolInput,
    cwd: resolveCwd(data),
    // Antigravity payload 는 session_id 필드 부재 (검증 2026-06-20: danicat.dev 외 다중 출처 — 세션은
    // transcriptPath 로 식별). 부재 시 undefined → 소유권 Layer 2 미동작이나 Layer 1(cwd-confinement) 보호.
    session_id: data.session_id || data.session?.id,
    stop_hook_active: data.stop_hook_active,
    hook_event_name: data.hook_event_name,
    // Antigravity transcriptPath / Claude transcript_path 정규화 (있으면 보존).
    transcript_path: data.transcriptPath || data.transcript_path,
    tool_response: data.tool_response,
    ...pickNonToolEventShape(data),
  };
}

/**
 * 본체 hook 의 Claude 형식 결과를 Antigravity wire 형식 `{ decision, reason }` 으로 변환.
 *
 * Antigravity stdout 계약 (antigravity.google/docs/hooks, danicat.dev):
 *   - PreToolUse/PostToolUse: `{ "decision": "allow"|"deny"|"ask", "reason": "..." }`
 *   - 빈 출력 = passthrough(allow). reason 은 선택.
 *
 * 변환 규칙:
 *   - 빈 결과 → {} (출력 없음 = allow).
 *   - PreToolUse: Claude `hookSpecificOutput.permissionDecision` (allow|deny|ask) → top-level `decision`.
 *     `permissionDecisionReason` → `reason`.
 *   - Stop: 본체가 `{ decision: 'block', reason }` 반환 (Claude/Codex Stop 호환). Antigravity Stop 의
 *     block honoring 은 UNVERIFIED — `{ decision: 'block', reason }` 그대로 전달 (fail-open: Antigravity 가
 *     인식 못 해도 세션이 진행될 뿐 무해).
 *   - SessionStart 컨텍스트(`hookSpecificOutput.additionalContext`): Antigravity 컨텍스트 주입 메커니즘
 *     UNVERIFIED — 원본 그대로 전달 (side-effect-only 이벤트라 무시돼도 무해).
 *
 * @param {object} result - 본체 hook 의 반환값 (HookOutput.deny/passthrough/block/context)
 * @returns {object} Antigravity wire 객체
 */
export function toAntigravityWire(result) {
  if (!result || Object.keys(result).length === 0) return {};

  const hso = result.hookSpecificOutput;
  // PreToolUse: Claude permissionDecision(allow|deny|ask) → Antigravity top-level decision.
  if (hso && typeof hso.permissionDecision === 'string') {
    const wire = { decision: hso.permissionDecision };
    const reason = hso.permissionDecisionReason;
    if (reason) wire.reason = reason;
    return wire;
  }
  // Stop: 본체 {decision:'block', reason}. Antigravity 의 block honoring UNVERIFIED — 그대로 전달.
  if (typeof result.decision === 'string') {
    const wire = { decision: result.decision };
    if (result.reason) wire.reason = result.reason;
    return wire;
  }
  // SessionStart additionalContext 등 기타 shape — 원본 그대로 (Antigravity 가 무시해도 무해).
  return result;
}

/**
 * 본체 hook 의 Claude 형식 결과를 Gemini CLI wire 형식 `{ decision, reason }` 으로 변환.
 *
 * Gemini CLI stdout 계약 (공식, geminicli.com/docs/hooks/reference/):
 *   - BeforeTool(≈PreToolUse): `{ "decision": "allow"|"deny"("block" alias), "reason": "..." }`.
 *     Claude 의 "ask" 에 대응하는 값은 공식 문서에 없음(allow/deny 이원) — registry 의 모든 hook 이
 *     ask 를 반환하지 않으므로(2026-07-02 확인, `grep -rn "ask" .cli/hooks/` 무결과) 실질 영향 없음.
 *   - AfterAgent(≈Stop): 본체가 `{ decision: 'block', reason }` 반환 — Gemini 는 `continue:false` 로
 *     세션 정지를 표현하므로(공식 문서 §Stop 예시), `decision:'block'` 은 그대로 전달해도 무해
 *     (Gemini 가 인식 못 해도 fail-open — 세션이 계속 진행될 뿐).
 *   - 빈 결과 → {} (출력 없음 = allow, Claude/Antigravity 와 동일 관례).
 *
 * @param {object} result - 본체 hook 의 반환값 (HookOutput.deny/passthrough/block/context)
 * @returns {object} Gemini CLI wire 객체
 */
export function toGeminiWire(result) {
  if (!result || Object.keys(result).length === 0) return {};

  const hso = result.hookSpecificOutput;
  // PreToolUse: Claude permissionDecision(allow|deny|ask) → Gemini top-level decision.
  // "ask" 는 Gemini 공식 값 집합(allow/deny)에 없으나, registry 에 ask 반환 hook 이 없어 미도달 분기.
  if (hso && typeof hso.permissionDecision === 'string') {
    const wire = { decision: hso.permissionDecision };
    const reason = hso.permissionDecisionReason;
    if (reason) wire.reason = reason;
    return wire;
  }
  // Stop(AfterAgent): 본체 {decision:'block', reason} 그대로 전달.
  if (typeof result.decision === 'string') {
    const wire = { decision: result.decision };
    if (result.reason) wire.reason = result.reason;
    return wire;
  }
  // SessionStart additionalContext 등 기타 shape — 원본 그대로 (Gemini 가 무시해도 무해).
  return result;
}

/**
 * @deprecated toAntigravityWire 로 대체됨. 기존 호출자 호환을 위해 유지 (deny reason 보강만 수행).
 * Antigravity 의 정식 wire 변환은 toAntigravityWire 사용.
 */
export function augmentAntigravityDenyReason(result) {
  if (result?.hookSpecificOutput?.permissionDecision !== 'deny') return result;
  if (result.reason) return result;
  const detailReason = result.hookSpecificOutput.permissionDecisionReason;
  if (!detailReason) return result;
  return { ...result, reason: detailReason };
}

/**
 * 본체 hook 의 결과 (Claude 형식 JSON) 를 CLI 별 wire 출력으로 변환한다.
 *
 * Codex hook spec 은 block/deny 에 대해 두 가지 방식을 허용한다:
 *   1. exit 0 + stdout JSON (권장 — 모든 이벤트에서 구조화 응답 유지)
 *   2. exit 2 + stderr reason (legacy/plain-text fallback)
 * 둘을 섞은 `exit 2 + stdout JSON + empty stderr` 는 Stop hook 에서
 * "did not write a continuation prompt to stderr" 런타임 오류를 만든다.
 * 따라서 adapter 는 항상 exit 0 + stdout JSON 을 사용한다.
 *
 * Antigravity 와 Gemini CLI 는 Claude 의 `hookSpecificOutput.permissionDecision` 대신 top-level
 * `{ decision, reason }` 을 읽으므로 각각 toAntigravityWire / toGeminiWire 로 변환 후 emit 한다.
 *
 * @param {object} result - 본체 hook 의 반환값 (HookOutput.deny/passthrough/block/context)
 * @param {{ cli: 'codex'|'antigravity'|'gemini', eventName?: string }} opts
 * @returns {{ stdout: string, stderr: string, exitCode: number }}
 */
export function buildCliEmission(result, opts = {}) {
  if (!result || Object.keys(result).length === 0) {
    return { stdout: '', stderr: '', exitCode: 0 };
  }

  if (opts.cli === 'antigravity' || opts.cli === 'gemini') {
    const wire = opts.cli === 'antigravity' ? toAntigravityWire(result) : toGeminiWire(result);
    if (!wire || Object.keys(wire).length === 0) {
      return { stdout: '', stderr: '', exitCode: 0 };
    }
    return { stdout: JSON.stringify(wire) + '\n', stderr: '', exitCode: 0 };
  }

  // Codex (및 기타): Claude 형식 JSON passthrough + eventName 라벨 재라이팅.
  let out = result;
  if (opts.eventName && result.hookSpecificOutput) {
    out = {
      ...result,
      hookSpecificOutput: {
        ...result.hookSpecificOutput,
        hookEventName: opts.eventName,
      },
    };
  }

  return {
    stdout: JSON.stringify(out) + '\n',
    stderr: '',
    exitCode: 0,
  };
}

/**
 * 본체 hook 의 결과 (Claude 형식 JSON) 를 CLI 별로 emit.
 *
 * @param {object} result - 본체 hook 의 반환값 (HookOutput.deny/passthrough/block/context)
 * @param {{ cli: 'codex'|'antigravity'|'gemini', eventName?: string }} opts
 */
export function emit(result, opts = {}) {
  const emission = buildCliEmission(result, opts);
  if (emission.stdout) process.stdout.write(emission.stdout);
  if (emission.stderr) process.stderr.write(emission.stderr);
  process.exit(emission.exitCode);
}

/**
 * 어댑터의 표준 진입점. 본체 hook 의 run(data) 함수를 호출한다.
 *
 * @param {Function} runFn - 본체 hook 의 export 된 run(data) async 함수
 * @param {{ cli: 'codex'|'antigravity'|'gemini', eventName?: string }} opts
 */
export async function runAdapter(runFn, opts) {
  try {
    const raw = await readStdinJson();
    const normalized = normalizePayload(raw, opts.cli);
    normalized.hook_event_name = normalized.hook_event_name || opts.eventName;
    normalized._cli = opts.cli;
    const result = await runFn(normalized);
    emit(result, opts);
  } catch {
    // fail-open (R-CM-006 Rule 2 정합) — 어댑터 자체 실패가 본체 흐름 차단하지 않음
    process.exit(0);
  }
}
