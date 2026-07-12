/**
 * cli-adapter-utils.mjs — Multi-CLI Hook Adapter Utilities
 *
 * Codex CLI と Antigravity CLI (agy — Google Antigravity) の stdin JSON payload を
 * 本体 hook (Claude Code 形式 `{ tool_name, tool_input, cwd }`) に正規化し、
 * 本体の結果を各 CLI の wire 形式に変換する。
 *
 * 本体 hook の `run(data)` 関数は Claude stdin 形式を前提とするため、アダプターは
 * stdin schema 変換 + 本体 run() 呼び出し + CLI 別の応答形式変換のみを担当する。
 *
 * 本 lib はガードのドメインロジックを含まない (schema/IO のみ)。ガードの決定は
 * 本体 hook (`.claude/hooks/<name>.mjs`) の export された純粋関数が SSOT。
 *
 * Antigravity hook spec の出典 (公式優先、R-CM-029 Rule 6 — 2026-07-09 再検証):
 *   - **PRIMARY (実測、最新)**: インストール済みの `agy` v1.1.0 バイナリに埋め込まれた公式ドキュメント全文(`# Lifecycle
 *     Hooks (\`hooks.json\`)`、`strings` 抽出で確認) — antigravity.google/docs/hooks の Web ページは
 *     JS SPA なので自動 fetch では本文を読めず(WebFetch 試行、2026-07-09)、3rd-party ブログ
 *     (danicat.dev / antigravitylab.net)は互いに異なるスキーマ(ファイルパス `.antigravity/settings.json`
 *     vs `.agents/hooks.json`、matcher 名 `run_shell_command` vs `run_command` など)を主張しており
 *     信頼できない — バイナリに実際にコンパイルされたドキュメントテキストが最も権威ある 1 次ソース。
 *   - 交差検証(パスのみ): 公式 repo CHANGELOG https://github.com/google-antigravity/antigravity-cli
 *     v1.0.8 — `~/.gemini/config/hooks.json` (グローバルオプションのパス存在自体は有効)。
 *   Antigravity は Claude とは異なる独自イベントを使用する — **PreToolUse / PostToolUse / PreInvocation /
 *   PostInvocation / Stop** の 5 種のみ (`SessionStart` は公式イベントではない — 実装が誤って仮定していた
 *   部分、2026-07-09 の実測で確定)。**構造もイベントごとに異なる**: PreToolUse/PostToolUse は
 *   GROUPED(`[{matcher, hooks:[...]}]`)、Stop/PreInvocation/PostInvocation は FLAT(ハンドラオブジェクトを
 *   matcher/hooks ラッパーなしにイベント配列へ直接列挙) — 以前の実装は Stop にも GROUPED を誤って適用し
 *   `.claude/hooks.json` 全体がスキーマ不適合で事実上無視されていた可能性が高い(codegen 修正:
 *   `.cli/lib/cli-hooks-codegen.mjs` `flatEvents`)。stdin(`toolCall.name`/`toolCall.args`)・
 *   stdout(`{decision, reason}`)・tool 名(`run_command`/`write_to_file`/`replace_file_content`)は
 *   既存の実装がすでに正確だった(実測で再確認)。
 *   (旧実装は Antigravity を Gemini CLI hook(BeforeTool/run_shell)と仮定していたが公式 spec と
 *   不一致だったため以前の PR で修正。legacy Gemini tool alias は backwards-compat としてマッピングのみ維持。)
 *
 * Gemini CLI hook spec の出典 (公式、R-CM-029 Rule 6 — Antigravity とは別製品):
 *   - 公式ドキュメント: https://geminicli.com/docs/hooks/reference/ (イベント/入出力スキーマの SSOT)
 *   - 公式 tool 名: https://github.com/google-gemini/gemini-cli/blob/main/docs/reference/tools.md
 *   Gemini CLI は `BeforeTool`/`AfterTool`(≈PreToolUse/PostToolUse) + `AfterAgent`(≈Stop) イベントを
 *   使用し、stdin フィールド名(`tool_name`/`tool_input`)は Claude Code と同一である(値のみ異なる — 例:
 *   `run_shell_command`)。stdout は `{decision:"allow"|"deny"("block" alias), reason}` — exit code
 *   0/2 の契約も Claude と事実上同型。Antigravity とは別製品(別の hook 契約)なので混同禁止
 *   (旧実装が Antigravity を Gemini と誤認した事故 — 上記コメント参照。本 PR で本物の Gemini CLI を
 *   `GEMINI_TOOL_MAP`/`mapGeminiCliToolName`/`toGeminiWire` として新規追加、legacy alias はそのまま維持)。
 *
 * Boundary: 観点 1 (brief2dev 自体) 専用 — R-CM-028。
 */

const STDIN_DEADLINE_MS = 1500;

/**
 * stdin から JSON を読み取る。タイムアウトまたは parse 失敗時は空オブジェクトを返す (fail-open)。
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
 * Antigravity tool 名 → Claude tool 名のマッピング表 (table-driven — cyclomatic を最小化)。
 *
 * 公式の Antigravity tool 名 (antigravity.google/docs + danicat.dev "Mastering Hooks"):
 *   run_command / write_to_file / replace_file_content / multi_replace_file_content / view_file。
 * legacy Gemini CLI alias (backwards-compat — 旧実装環境の回帰防止。Antigravity native については UNVERIFIED):
 *   run_shell / shell / run_shell_command / write_file / replace / multi_replace。
 */
const ANTIGRAVITY_TOOL_MAP = {
  // 公式の Antigravity tool 名
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
 * Antigravity のツール名を Claude 形式にマッピングする。未登録の名前はそのまま通過
 * (本体 hook の tool name 分岐でパススルー)。空の値は Bash default。
 */
export function mapAntigravityToolName(name) {
  if (!name) return 'Bash';
  return ANTIGRAVITY_TOOL_MAP[name] || name;
}

/**
 * Backwards-compat alias。新規コードは mapAntigravityToolName の使用を推奨。
 * (Antigravity rename PR — feature/antigravity-rename-p0-fix)
 *
 * @deprecated この名前は Antigravity のマッピングを指す(過去の誤認の痕跡) — 本物の Gemini CLI マッピング
 * ではない。新規コードは `mapGeminiCliToolName` (本物の Gemini CLI 専用) を使用すること。
 */
export const mapGeminiToolName = mapAntigravityToolName;

/**
 * Gemini CLI(geminicli.com) 公式の tool 名 → Claude tool 名のマッピング表。
 *
 * 出典(公式、2026-07-02 確認): https://github.com/google-gemini/gemini-cli/blob/main/docs/reference/tools.md
 * + https://github.com/google-gemini/gemini-cli/issues/18807 (`.gemini/settings.json` tools.core
 * 識別子の原文) — run_shell_command / read_file / write_file / replace / glob / grep_search /
 * list_directory を確認。`run_shell_command`/`read_file` は hooks reference ドキュメント(BeforeTool 例)でも
 * 再確認済み。Gemini CLI には Antigravity の `multi_replace_file_content` に対応する専用 tool が存在しない —
 * `replace` 一つが単一/複数編集をすべて処理するため MultiEdit も `replace` にマッピングする(Codex の
 * apply_patch が Write/Edit/MultiEdit を吸収するのと類似した多対一の構造)。
 */
const GEMINI_TOOL_MAP = {
  run_shell_command: 'Bash',
  read_file: 'Read',
  write_file: 'Write',
  replace: 'Edit',
};

/**
 * Gemini CLI のツール名を Claude 形式にマッピングする。未登録の名前はそのまま通過
 * (本体 hook の tool name 分岐でパススルー)。空の値は Bash default(Antigravity と同一ポリシー —
 * 両 CLI とも tool 名が常に埋まる仕様を前提とした、防御的な default)。
 */
export function mapGeminiCliToolName(name) {
  if (!name) return 'Bash';
  return GEMINI_TOOL_MAP[name] || name;
}

/**
 * 逆方向マッピングの SSOT — Claude tool 名 → 各 CLI の matcher トークン (Codex / Antigravity / Gemini)。
 *
 * `ANTIGRAVITY_TOOL_MAP`/`GEMINI_TOOL_MAP` (CLI→Claude) の逆方向。`scaffold-multi-cli-hook.mjs` の
 * TOOL_MATCH とマルチ CLI 登録の parity 検証(`tests/unit/multi-cli-parity.test.mjs`)が本 SSOT を
 * 共有する — 重複を排除。
 *
 * Codex: 公式 canonical は Bash / apply_patch (references/codex-cli-hooks.md)。shell / run_shell /
 *   run_shell_command / exec_command は brief2dev の慣例(既存の .codex/hooks.json)の防御的な変種(UNVERIFIED)。
 *   apply_patch が Edit / Write / MultiEdit を単一ファイル tool として吸収する。
 * Antigravity: 公式の tool 名 run_command / write_to_file / replace_file_content /
 *   multi_replace_file_content / view_file (antigravity.google/docs/hooks — ANTIGRAVITY_TOOL_MAP の逆方向)。
 * Gemini: 公式の tool 名 run_shell_command / write_file / replace / read_file
 *   (github.com/google-gemini/gemini-cli docs/reference/tools.md — GEMINI_TOOL_MAP の逆方向)。MultiEdit は
 *   Gemini に専用 tool がないため `replace` を再利用(上記 GEMINI_TOOL_MAP のコメント参照)。
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
 * Claude tool 名の配列 → 指定した CLI の matcher トークンの配列 (順序を保存した dedup)。
 * 未登録の Claude tool はそのまま通過(防御的 — 本体 matcher が非標準 tool の場合)。
 *
 * @param {string[]} claudeTools - Claude matcher の tool 名の配列 (例: ['Edit','Write'])
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
 * Codex tool 名 → Claude tool 名の正規化マップ (CLAUDE_TO_CLI_MATCHERS の逆インデックス — matcher SSOT の単一原点)。
 *
 * 背景 (drift 遮断): codex matcher は `CLAUDE_TO_CLI_MATCHERS[*].codex` のトークン群 (Bash の場合は
 * shell / run_shell / run_shell_command / exec_command の防御的変種を含む) に対して dispatch を fire する。
 * ところが normalizePayload は antigravity のみ tool name を正規化し codex は passthrough だった — matcher は
 * 変種を受け取るのに normalizer が変種を canonical Bash に畳まないため、本体 guard (tool_name === 'Bash' 分岐) が
 * codex 変種の命令 (例: `run_shell` の `git push --force`) を認識できず fail-open していた。正規化マップを
 * matcher SSOT から逆 derive することで matcher ⟺ normalizer の対称性を構造的に保証する (両者が同一の原点から派生)。
 *
 * apply_patch は Write / Edit / MultiEdit の 3 tool に同時マッピング (ambiguous) されるため単一 canonical に
 * 畳めず、マップから除外する — normalizePayload が expandCodexApplyPatch で別途処理する。
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
 * Codex のツール名を Claude 形式にマッピングする。未登録の名前 + 空の値はそのまま通過 (本体 hook の tool name
 * 分岐でパススルー)。antigravity (空の値 → Bash default) と異なり codex は空の値も passthrough することで
 * 既存の動作を保存する — 正規化は matcher が fire する *既知のトークン* にのみ適用する (over-mapping を回避)。
 */
export function mapCodexToolName(name) {
  if (!name) return name;
  return CODEX_TOOL_MAP[name] || name;
}

/**
 * raw tool 名 → Claude canonical tool 名 (CLI 別正規化の単一エントリポイント)。
 *   - antigravity: mapAntigravityToolName (空の値 → Bash default + legacy alias を含む)
 *   - codex:       mapCodexToolName (matcher SSOT からの逆 derive、空の値は passthrough)
 *   - gemini:      mapGeminiCliToolName (空の値 → Bash default、公式の tool 名マッピング)
 *   - その他 (claude など): passthrough
 */
export function normalizeCliToolName(name, cli) {
  if (cli === 'antigravity') return mapAntigravityToolName(name);
  if (cli === 'codex') return mapCodexToolName(name);
  if (cli === 'gemini') return mapGeminiCliToolName(name);
  return name;
}

/**
 * Claude 互換の payload 形式 (`tool_name` キーを保持) であればそのまま pick する。
 * 不在時は null を返す — 呼び出し側が alternate schema を処理する。
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
    // PostToolUse アダプター(worktree-owner-tracker)が exit_code のゲートに使用する。PreToolUse では undefined。
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
 * 各 CLI の nested/alternate payload から tool name を抽出する。
 *   - Antigravity: `toolCall.name` (公式)
 *   - Codex:       `tool.name` (nested fallback) または flat `tool_name`
 */
function extractToolName(data) {
  return data?.toolCall?.name || data?.tool?.name || data?.tool_name || '';
}

/**
 * tool 入力オブジェクトを抽出する。Antigravity `toolCall.args` / Codex `tool.input` / flat `input` の順。
 */
function extractToolInput(data) {
  return data.toolCall?.args || data.tool?.input || data.input || {};
}

/**
 * Antigravity `toolCall.args` の *命令* フィールド → Claude `tool_input.command` (VERIFIED、additive)。
 *
 * Antigravity は run_command の命令文字列を `CommandLine` として渡す (Gemini の
 * `tool_input.command` とは異なる) — Galloro マイグレーションガイド + danicat.dev による検証 2026-06-20
 * (hook-specific な出典)。本体 guard(commit-guard / destructive-git-guard の `tool_input.command`)が
 * 命令を読むため、マッピングしなければ本体 guard が命令を見られず fail-open(git push --force を未遮断)する。
 * キー存在ベースの additive — 元のキー(`CommandLine`)も保存し、Claude キー(`command`)は不在時のみ追加する。
 */
const ANTIGRAVITY_ARG_MAP = Object.freeze({ CommandLine: 'command' });

/**
 * Antigravity の write/edit tool の *file path* フィールド名候補 (防御的 multi-candidate probe)。
 *
 * 正確なフィールド名は UNVERIFIED — ローカルに `agy` CLI が無く `agy inspect` を未確認(DEBT-203/204)。
 * 単一候補(`TargetFile`)のみをマッピングすると、実際の名前が少しでも異なると file guard が `file_path` 不在で
 * fail-open(file-edit ベクトルを未遮断)する。候補集合を *first-match additive* にマッピングすることで — 実際の
 * フィールド名が候補のどれであっても — guard がパスを抽出できるようにする → **fail-open を fail-safe に転換**
 * (defense-in-depth、DEBT-195 のセキュリティギャップを閉じる)。これは「TargetFile がそのフィールドだ」という
 * *事実の主張ではなく* 不確実性に対する防御である (R-CM-024 の誠実性 — 事実の確定ではない)。正確な名前が
 * 確定すれば本候補を単一の検証済みマッピングに絞り込める(DEBT-203、`agy inspect`)。
 *
 * 順序 = 特異性の高い順(first-match 時により具体的な候補を優先)。適用は Write/Edit/MultiEdit に正規化された
 * tool にのみゲートする — run_command の generic な `path` 系 args の誤検知を回避。write_to_file/replace_file_content
 * の args は本質的にファイルターゲットなので候補マッチの誤検知リスクは低い。
 */
const ANTIGRAVITY_PATH_FIELD_CANDIDATES = Object.freeze([
  'TargetFile', // リバースエンジニアリングの第 1 候補 (Antigravity)
  'target_file', // snake_case の変種
  'filePath', // camelCase の変種
  'absolute_path', // 絶対パス規約の変種
  'path', // generic — edit-class tool のゲート下でのみ適用 (誤検知を最小化)
]);

/**
 * 各 *正規化後* の Claude tool 名の file-path probe 適格性 (SSOT)。
 *
 * `ANTIGRAVITY_TOOL_MAP` のすべての正規化値(Claude 名)はここに分類されなければならない — file-edit(write/edit)
 * tool = `true` → パスガードが `file_path` を見る必要があるので probe 対象。command/read tool = `false` →
 * run_command の generic な path args の誤検知を回避するため probe から除外。
 *
 * **drift 遮断 (2026-06-24 の coverage-claim-scope-drift 回顧と同型)**: 過去は `PATH_PROBE_TOOLS` が
 * 独立したハードコード集合だったため、新規の Antigravity write tool を `ANTIGRAVITY_TOOL_MAP` に追加した際に probe
 * 集合の更新を漏らすと、その write tool が probe を受けられずセキュリティ fail-open が再発する可能性があった (二つの集合の
 * 独立進化 = 検知範囲が保護対象より狭くなる drift)。本分類 SSOT から `PATH_PROBE_TOOLS` を
 * *派生* させることでその drift を構造的に除去し、`unclassifiedProbeTools()` invariant が分類漏れを
 * RED で捕捉する (回帰: `tests/unit/cli-adapter-utils.test.mjs`)。
 */
const TOOL_PATH_DISPOSITION = Object.freeze({
  Bash: false, // command — generic な path args の誤検知を回避
  Read: false, // read-only — パスガードの対象外
  Write: true, // file-edit
  Edit: true, // file-edit
  MultiEdit: true, // file-edit
});

/**
 * file path probe の対象 tool (Claude の *正規化後* の名前)。`TOOL_PATH_DISPOSITION` から *派生* — 独立した
 * ハードコード集合ではないため tool-map 分類との drift が起きない(構造的に除去)。file-edit に分類された tool のみを含む。
 *
 * 残余 (誠実に明示 — 本 fix の範囲外): Antigravity が *将来* `ANTIGRAVITY_TOOL_MAP` に *未登録* の書き込み tool
 * (raw 名がどの Claude tool にも正規化されない)を導入すると、ゲートを越えられず probe 未適用 → fail-open が
 * 残存する。この残余は外部検証不能(名前の spec が存在しない)なのでコードでは閉じられず、解消経路は新規 tool を
 * `ANTIGRAVITY_TOOL_MAP` に登録する(→ 正規化されて自動的に probe される)ことである。tripwire テストが明示的に文書化する。
 */
const PATH_PROBE_TOOLS = Object.freeze(
  new Set(
    Object.entries(TOOL_PATH_DISPOSITION)
      .filter(([, isFileEdit]) => isFileEdit)
      .map(([toolName]) => toolName),
  ),
);

/**
 * 分類漏れ(drift)の検出 — `ANTIGRAVITY_TOOL_MAP` の正規化値のうち `TOOL_PATH_DISPOSITION` に未分類の名前を返す。
 * 空配列 = drift なし。新規の write tool を tool-map に追加した際に本分類を漏らすとその名前が返され、
 * invariant テストが RED → セキュリティ fail-open の再発を構造的に遮断する。
 *
 * @param {Record<string,string>} [toolMap] - テスト stub 注入用 (default: 実際の ANTIGRAVITY_TOOL_MAP)
 * @returns {string[]} 未分類の正規化 tool 名 (重複を排除、出現順)
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
 * 候補フィールドのうち最初の non-empty string 値を返す (無ければ undefined)。防御的 file path probe のコア。
 */
function probeAntigravityFilePath(args) {
  for (const cand of ANTIGRAVITY_PATH_FIELD_CANDIDATES) {
    const v = args[cand];
    if (typeof v === 'string' && v.trim().length > 0) return v;
  }
  return undefined;
}

/**
 * Antigravity の write/edit tool の *new content* フィールド名候補 (防御的 multi-candidate probe)。
 *
 * file_path probe と同じ rationale (DEBT-195/203 — `agy inspect` 不在のため正確なフィールド名は UNVERIFIED)。
 * コンテンツスキャナ(secret-leak-guard が Write の `content` / Edit の `new_string` を読む)が Antigravity の
 * edit でコンテンツを見られず fail-open(シークレット漏洩を未遮断)するセキュリティギャップを fail-safe に転換する。Claude
 * キー(`content`/`new_string`)は `{...args}` がすでに保存するため(フィールド名がそのままのとき)、本 probe の価値は
 * *非 Claude なフィールド名*を Claude キーへ alias することにある。「この名前がそのフィールドだ」という事実の主張ではなく
 * 不確実性への防御である (R-CM-024)。正確な名前が確定すれば単一マッピングに絞り込む。
 *
 * 限界 (誠実に明示): old_string(Edit の変更前の内容)は Antigravity の edit args においてさらに UNVERIFIED なので probe
 * しない → old/new の両方が必要な coverage-threshold-guard は Antigravity では部分的に動作(Codex apply_patch
 * は -/+ 行で両方が確保され完全に動作)。secret-leak-guard(new のみ必要)は本 probe で動作する。
 */
const ANTIGRAVITY_CONTENT_FIELD_CANDIDATES = Object.freeze([
  'content', // Claude Write のキー — {...args} で保存されるが明示 (probe コアと一貫させる)
  'new_string', // Claude Edit のキー — 同上
  'Contents', // PascalCase 変種の候補
  'FileText', // 変種の候補
  'code', // 変種の候補
  'text', // generic — edit-class tool のゲート下でのみ適用
]);

/**
 * 候補フィールドのうち最初の non-empty string 値を返す (無ければ undefined)。防御的 content probe のコア。
 * file_path probe と異なり trim しない (whitespace-only もコンテンツとして保存 — スキャナ入力に忠実)。
 */
function probeAntigravityContent(args) {
  for (const cand of ANTIGRAVITY_CONTENT_FIELD_CANDIDATES) {
    const v = args[cand];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return undefined;
}

/**
 * Antigravity args → Claude tool_input の正規化 (すべて additive、元のキーを保存)。
 *   1. command: `CommandLine` → `command` (VERIFIED、キー存在ベース)。
 *   2. file_path: write/edit tool に限定した候補フィールドの first-match probe (防御的 fail-safe)。
 *   3. content/new_string: write/edit tool に限定したコンテンツ probe (コンテンツスキャナの fail-safe、フィールド名は UNVERIFIED)。
 *
 * @param {object} args - raw toolCall.args
 * @param {string} [normalizedToolName] - 正規化された Claude tool 名 (probe ゲート用)
 * @returns {object}
 */
function mapAntigravityArgs(args, normalizedToolName) {
  if (!args || typeof args !== 'object') return {};
  const mapped = { ...args };
  // 1. command (VERIFIED) — キー存在時のみ、既存の command は上書きしない
  for (const [agKey, claudeKey] of Object.entries(ANTIGRAVITY_ARG_MAP)) {
    if (agKey in args && !(claudeKey in mapped)) mapped[claudeKey] = args[agKey];
  }
  // 2・3. file_path + content (防御的 probe) — edit-class tool に限定
  if (PATH_PROBE_TOOLS.has(normalizedToolName)) {
    if (!('file_path' in mapped)) {
      const probedPath = probeAntigravityFilePath(args);
      if (probedPath !== undefined) mapped.file_path = probedPath;
    }
    // content は Write 本体が、new_string は Edit 本体が読むため、両方を埋める(不在時) — tool 分岐を回避。
    const probedContent = probeAntigravityContent(args);
    if (probedContent !== undefined) {
      if (!('content' in mapped)) mapped.content = probedContent;
      if (!('new_string' in mapped)) mapped.new_string = probedContent;
    }
  }
  return mapped;
}

/**
 * 呼び出しの cwd を解決する。明示 cwd → session.cwd → Antigravity workspacePaths[0] → process.cwd()。
 */
function resolveCwd(data) {
  if (data.cwd) return data.cwd;
  if (data.session?.cwd) return data.session.cwd;
  if (Array.isArray(data.workspacePaths) && data.workspacePaths[0]) return data.workspacePaths[0];
  return process.cwd();
}

/**
 * Codex の `apply_patch` 命令文字列をパースして { op, filePath, newContent, oldContent } を抽出する。
 *
 * Codex のファイル編集は tool_name が常に `apply_patch` で、パッチ本文は tool_input.command に格納される
 * (公式: references/codex-cli-hooks.md L464/L473 — "apply_patch use tool_input.command"、
 * "hook input still reports tool_name: 'apply_patch'")。本関数が無いと、Edit|Write を tool_name で
 * ゲートしたり new_string/old_string/content を読む本体ガード(secret-leak-guard / coverage-threshold-guard
 * など)が Codex の apply_patch では PASSTHROUGH(無力化)される — 実証済み(2026-06-26)。
 *
 * apply_patch フォーマット (OpenAI/Codex 標準):
 *   *** Begin Patch
 *   *** (Add|Update|Delete) File: <path>
 *   @@ <optional context>
 *    unchanged line
 *   -removed line   (→ oldContent、Edit の old_string)
 *   +added line     (→ newContent、Edit の new_string / Write の content)
 *   *** End Patch
 *
 * 最初のファイルの path を file_path として、パッチ全体の +/- 行を content として収集する(マルチファイルパッチ時は最初の
 * ファイルパス + 全体の added/removed — コンテンツスキャナは過検知(全体スキャン)の方が見逃しより安全。単一ファイルが一般的なケース)。
 * `+++`/`---` の diff ヘッダーは content から除外する(prefix が単一の `+`/`-` ではない)。認識不能時は null を返す(fail-open)。
 *
 * @param {string} command - apply_patch 本文の文字列
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
    // diff ヘッダー(`+++ b/path` / `--- a/path`)は常にマーカーの後に空白を持つ → 空白まで含めてマッチさせ、
    // 内容行(`+++x` のように content が `++` で始まる追加行)の誤フィルタ(スキャン漏れ)を回避する。
    if (line.startsWith('+++ ') || line.startsWith('--- ')) continue;
    if (line.startsWith('+')) added.push(line.slice(1));
    else if (line.startsWith('-')) removed.push(line.slice(1));
  }
  if (!filePath) return null;
  return { op, filePath, newContent: added.join('\n'), oldContent: removed.join('\n') };
}

/**
 * Codex の apply_patch payload を Claude の Edit/Write shape に拡張する (tool_name の再マッピング + content 抽出)。
 *   - Add File   → Write (tool_input.content = newContent)
 *   - Update File→ Edit  (tool_input.new_string = newContent、old_string = oldContent)
 *   - Delete File→ Edit  (file_path のみ; content なし)
 * 元の tool_input.command も保存する(additive)。パース不能時は元の shape のまま(fail-open — apply_patch を維持)。
 *
 * 副作用(意図された改善): file_path を埋めるため、既存の Codex Edit|Write ポート(worktree-policy-guard /
 * worktree-session-owner-guard)も、これまで file_path 不在で無力だった latent なギャップが解消され正常に動作する。
 *
 * @param {object} shape - pickClaudeShape の結果 (tool_name==='apply_patch')
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
 * 各 CLI の stdin payload を Claude Code 形式に正規化する。
 *
 * Schema (公式ドキュメントで cross-check 済み):
 *   - Claude Code:   { tool_name, tool_input: { command, file_path, ... }, cwd, session_id, ... }
 *   - Codex CLI:     同一 schema (flat) + turn_id / permission_mode の拡張
 *                    (https://developers.openai.com/codex/hooks)
 *   - Antigravity:   { toolCall: { name: 'run_command'|'write_to_file'|..., args: {...} },
 *                    workspacePaths: [...], transcriptPath }
 *                    (https://antigravity.google/docs/hooks、danicat.dev で交差検証)
 *
 * Codex の `tool.name` (nested) fallback は schema drift の安全網 — 現在の仕様上は dead path だが
 * future-proof として維持する。
 *
 * フィールド名マッピング: Antigravity `toolCall.args` のフィールド名は Claude `tool_input` と異なる。
 *   - run_command: `CommandLine` → `command` (VERIFIED 2026-06-20 — Galloro マイグレーションガイド +
 *     danicat.dev、hook-specific)。`mapAntigravityArgs` が additive にマッピングして本体 guard が命令を読めるようにする。
 *     マッピング不在時は本体 guard が fail-open(git push --force を未遮断)だった。
 *   - write_to_file/replace_file_content の file path フィールド(フィールド名は UNVERIFIED — `agy` CLI 不在):
 *     `mapAntigravityArgs` が write/edit tool に限定した候補集合(`TargetFile`/`target_file`/`filePath`/
 *     `absolute_path`/`path`)を first-match additive で probe して `file_path` を埋める — 実際のフィールド名が
 *     候補のどれであっても file guard がパスを抽出する(fail-open→fail-safe、DEBT-195 のセキュリティギャップを閉じる)。正確な
 *     名前の確定(DEBT-203、`agy inspect`)は後続 — 確定時に候補を単一の検証済みマッピングに絞り込む。
 *
 * @param {object} data - raw stdin JSON
 * @param {'claude'|'codex'|'antigravity'} cli
 * @returns {object} Claude Code 形式に正規化された payload
 */
export function normalizePayload(data, cli) {
  if (!data || typeof data !== 'object') return { tool_name: '', tool_input: {} };

  const claudeShape = pickClaudeShape(data);
  if (claudeShape) {
    // Codex のファイル編集は tool_name='apply_patch' + パッチ本文が tool_input.command 内 — Edit/Write shape に拡張する
    // (そうしないと Edit|Write ゲート/コンテンツガードが無力化)。他の tool/CLI はそのまま passthrough。
    if (cli === 'codex' && claudeShape.tool_name === 'apply_patch') {
      return expandCodexApplyPatch(claudeShape);
    }
    // Codex 変種の tool name (flat shape — shell/run_shell/run_shell_command/exec_command) → canonical Bash。
    // Gemini の BeforeTool/AfterTool payload も tool_name のフィールド名は Claude と同一だが、値は公式 Gemini の
    // tool 名(run_shell_command/write_file/replace/read_file)なので同じ正規化が必要 — 両 CLI とも
    // normalizeCliToolName(matcher SSOT からの逆 derive) で canonical な Claude 名に畳み、本体 guard の
    // tool_name==='Bash' のような分岐が認識できるようにする。nested shape と同一の処理。
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
    // Antigravity の payload には session_id フィールドが存在しない (検証 2026-06-20: danicat.dev ほか複数の出典 — セッションは
    // transcriptPath で識別)。不在時は undefined → 所有権 Layer 2 は動作しないが Layer 1(cwd-confinement)で保護。
    session_id: data.session_id || data.session?.id,
    stop_hook_active: data.stop_hook_active,
    hook_event_name: data.hook_event_name,
    // Antigravity の transcriptPath / Claude の transcript_path を正規化 (あれば保存)。
    transcript_path: data.transcriptPath || data.transcript_path,
    tool_response: data.tool_response,
    ...pickNonToolEventShape(data),
  };
}

/**
 * 本体 hook の Claude 形式の結果を Antigravity の wire 形式 `{ decision, reason }` に変換する。
 *
 * Antigravity の stdout 契約 (antigravity.google/docs/hooks、danicat.dev):
 *   - PreToolUse/PostToolUse: `{ "decision": "allow"|"deny"|"ask", "reason": "..." }`
 *   - 空の出力 = passthrough(allow)。reason は任意。
 *
 * 変換規則:
 *   - 空の結果 → {} (出力なし = allow)。
 *   - PreToolUse: Claude `hookSpecificOutput.permissionDecision` (allow|deny|ask) → top-level の `decision`。
 *     `permissionDecisionReason` → `reason`。
 *   - Stop: 本体が `{ decision: 'block', reason }` を返す (Claude/Codex の Stop と互換)。Antigravity の Stop の
 *     block honoring は UNVERIFIED — `{ decision: 'block', reason }` をそのまま渡す (fail-open: Antigravity が
 *     認識できなくてもセッションが進むだけで無害)。
 *   - SessionStart のコンテキスト(`hookSpecificOutput.additionalContext`): Antigravity のコンテキスト注入メカニズムは
 *     UNVERIFIED — 元のまま渡す (side-effect-only なイベントなので無視されても無害)。
 *
 * @param {object} result - 本体 hook の返り値 (HookOutput.deny/passthrough/block/context)
 * @returns {object} Antigravity の wire オブジェクト
 */
export function toAntigravityWire(result) {
  if (!result || Object.keys(result).length === 0) return {};

  const hso = result.hookSpecificOutput;
  // PreToolUse: Claude の permissionDecision(allow|deny|ask) → Antigravity の top-level decision。
  if (hso && typeof hso.permissionDecision === 'string') {
    const wire = { decision: hso.permissionDecision };
    const reason = hso.permissionDecisionReason;
    if (reason) wire.reason = reason;
    return wire;
  }
  // Stop: 本体の {decision:'block', reason}。Antigravity の block honoring は UNVERIFIED — そのまま渡す。
  if (typeof result.decision === 'string') {
    const wire = { decision: result.decision };
    if (result.reason) wire.reason = result.reason;
    return wire;
  }
  // SessionStart の additionalContext などその他の shape — 元のまま (Antigravity が無視しても無害)。
  return result;
}

/**
 * 本体 hook の Claude 形式の結果を Gemini CLI の wire 形式 `{ decision, reason }` に変換する。
 *
 * Gemini CLI の stdout 契約 (公式、geminicli.com/docs/hooks/reference/):
 *   - BeforeTool(≈PreToolUse): `{ "decision": "allow"|"deny"("block" alias), "reason": "..." }`。
 *     Claude の "ask" に対応する値は公式ドキュメントに存在しない(allow/deny の二値) — registry のすべての hook が
 *     ask を返さないため(2026-07-02 確認、`grep -rn "ask" .cli/hooks/` は無結果)実質的な影響はない。
 *   - AfterAgent(≈Stop): 本体が `{ decision: 'block', reason }` を返す — Gemini は `continue:false` で
 *     セッションの停止を表現するため(公式ドキュメント §Stop の例)、`decision:'block'` はそのまま渡しても無害
 *     (Gemini が認識できなくても fail-open — セッションが継続するだけ)。
 *   - 空の結果 → {} (出力なし = allow、Claude/Antigravity と同一の慣例)。
 *
 * @param {object} result - 本体 hook の返り値 (HookOutput.deny/passthrough/block/context)
 * @returns {object} Gemini CLI の wire オブジェクト
 */
export function toGeminiWire(result) {
  if (!result || Object.keys(result).length === 0) return {};

  const hso = result.hookSpecificOutput;
  // PreToolUse: Claude の permissionDecision(allow|deny|ask) → Gemini の top-level decision。
  // "ask" は Gemini の公式な値集合(allow/deny)に無いが、registry に ask を返す hook が無いため到達しない分岐。
  if (hso && typeof hso.permissionDecision === 'string') {
    const wire = { decision: hso.permissionDecision };
    const reason = hso.permissionDecisionReason;
    if (reason) wire.reason = reason;
    return wire;
  }
  // Stop(AfterAgent): 本体の {decision:'block', reason} をそのまま渡す。
  if (typeof result.decision === 'string') {
    const wire = { decision: result.decision };
    if (result.reason) wire.reason = result.reason;
    return wire;
  }
  // SessionStart の additionalContext などその他の shape — 元のまま (Gemini が無視しても無害)。
  return result;
}

/**
 * @deprecated toAntigravityWire に置き換えられた。既存の呼び出し側との互換のため維持 (deny reason の補強のみ実行)。
 * Antigravity の正式な wire 変換は toAntigravityWire を使用すること。
 */
export function augmentAntigravityDenyReason(result) {
  if (result?.hookSpecificOutput?.permissionDecision !== 'deny') return result;
  if (result.reason) return result;
  const detailReason = result.hookSpecificOutput.permissionDecisionReason;
  if (!detailReason) return result;
  return { ...result, reason: detailReason };
}

/**
 * 本体 hook の結果 (Claude 形式の JSON) を CLI 別の wire 出力に変換する。
 *
 * Codex の hook spec は block/deny に対して二つの方式を許容する:
 *   1. exit 0 + stdout JSON (推奨 — すべてのイベントで構造化応答を維持)
 *   2. exit 2 + stderr reason (legacy/plain-text の fallback)
 * 両者を混ぜた `exit 2 + stdout JSON + empty stderr` は Stop hook で
 * "did not write a continuation prompt to stderr" というランタイムエラーを起こす。
 * したがってアダプターは常に exit 0 + stdout JSON を使用する。
 *
 * Antigravity と Gemini CLI は Claude の `hookSpecificOutput.permissionDecision` の代わりに top-level の
 * `{ decision, reason }` を読むため、それぞれ toAntigravityWire / toGeminiWire で変換してから emit する。
 *
 * @param {object} result - 本体 hook の返り値 (HookOutput.deny/passthrough/block/context)
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

  // Codex (およびその他): Claude 形式の JSON を passthrough + eventName ラベルの再書き込み。
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
 * 本体 hook の結果 (Claude 形式の JSON) を CLI 別に emit する。
 *
 * @param {object} result - 本体 hook の返り値 (HookOutput.deny/passthrough/block/context)
 * @param {{ cli: 'codex'|'antigravity'|'gemini', eventName?: string }} opts
 */
export function emit(result, opts = {}) {
  const emission = buildCliEmission(result, opts);
  if (emission.stdout) process.stdout.write(emission.stdout);
  if (emission.stderr) process.stderr.write(emission.stderr);
  process.exit(emission.exitCode);
}

/**
 * アダプターの標準エントリポイント。本体 hook の run(data) 関数を呼び出す。
 *
 * @param {Function} runFn - 本体 hook の export された run(data) async 関数
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
    // fail-open (R-CM-006 Rule 2 と整合) — アダプター自体の失敗が本体の流れを遮断しないようにする
    process.exit(0);
  }
}
