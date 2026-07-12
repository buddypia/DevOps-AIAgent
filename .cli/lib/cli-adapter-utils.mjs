/**
 * cli-adapter-utils.mjs — Multi-CLI Hook Adapter Utilities
 *
 * Codex CLI と Antigravity CLI (agy — Google Antigravity) の stdin JSON payload を
 * 本体 hook (Claude Code 形式 `{ tool_name, tool_input, cwd }`) に正規化し、
 * 本体の結果を各 CLI の wire 形式に変換する。
 *
 * 本体 hook の `run(data)` 関数は Claude stdin 形式を前提とするため、アダプタは
 * stdin schema 変換 + 本体 run() 呼び出し + CLI 別レスポンス形式変換のみを担当する。
 *
 * 本 lib はガードのドメインロジックを含まない (schema/IO のみ)。ガード判定は
 * 本体 hook (`.claude/hooks/<name>.mjs`) の export された純粋関数が SSOT。
 *
 * Antigravity hook spec の出典 (公式優先、R-CM-029 Rule 6 — 2026-07-09 再検証):
 *   - **PRIMARY (実測、最新)**: インストール済み `agy` v1.1.0 バイナリに埋め込まれた公式ドキュメント全文(`# Lifecycle
 *     Hooks (\`hooks.json\`)`、`strings` 抽出で確認) — antigravity.google/docs/hooks の Web ページは
 *     JS SPA のため自動 fetch では本文を読めず(WebFetch 試行、2026-07-09)、3rd-party ブログ
 *     (danicat.dev / antigravitylab.net)は互いに異なるスキーマ(ファイルパス `.antigravity/settings.json`
 *     vs `.agents/hooks.json`、matcher 名 `run_shell_command` vs `run_command` など)を主張しており
 *     信頼できない — バイナリに実際にコンパイルされたドキュメントテキストが最も権威ある一次ソース。
 *   - 相互検証(パスのみ): 公式 repo CHANGELOG https://github.com/google-antigravity/antigravity-cli
 *     v1.0.8 — `~/.gemini/config/hooks.json` (グローバルオプションパスの存在自体は有効)。
 *   Antigravity は Claude と異なる独自イベントを使う — **PreToolUse / PostToolUse / PreInvocation /
 *   PostInvocation / Stop** の 5 種のみ (`SessionStart` は公式イベントではない — 実装が誤って前提としていた
 *   部分、2026-07-09 の実測で確定)。**構造もイベントごとに異なる**: PreToolUse/PostToolUse は
 *   GROUPED(`[{matcher, hooks:[...]}]`)、Stop/PreInvocation/PostInvocation は FLAT(ハンドラオブジェクトを
 *   マッチャー/hooks ラッパーなしでイベント配列に直接列挙) — 以前の実装は Stop にも GROUPED を誤って適用しており
 *   `.claude/hooks.json` 全体がスキーマ不適合で事実上無視されていた可能性が高い(codegen 修正:
 *   `.cli/lib/cli-hooks-codegen.mjs` の `flatEvents`)。stdin(`toolCall.name`/`toolCall.args`)・
 *   stdout(`{decision, reason}`)・tool 名(`run_command`/`write_to_file`/`replace_file_content`)は
 *   既存実装がすでに正確だった(実測で再確認)。
 *   (旧実装は Antigravity を Gemini CLI hook(BeforeTool/run_shell)と仮定していたが公式 spec と
 *   不一致のため以前の PR で修正済み。legacy Gemini tool alias は backwards-compat としてマッピングのみ維持。)
 *
 * Gemini CLI hook spec の出典 (公式、R-CM-029 Rule 6 — Antigravity とは別製品):
 *   - 公式ドキュメント: https://geminicli.com/docs/hooks/reference/ (イベント/入出力スキーマ SSOT)
 *   - 公式 tool 名: https://github.com/google-gemini/gemini-cli/blob/main/docs/reference/tools.md
 *   Gemini CLI は `BeforeTool`/`AfterTool`(≈PreToolUse/PostToolUse) + `AfterAgent`(≈Stop) イベントを
 *   使い、stdin フィールド名(`tool_name`/`tool_input`)は Claude Code と同一である(値のみ異なる — 例:
 *   `run_shell_command`)。stdout は `{decision:"allow"|"deny"("block" alias), reason}` — exit code
 *   0/2 の契約も Claude とほぼ同型。Antigravity とは別製品(別 hook 契約)なので混同禁止
 *   (旧実装が Antigravity を Gemini と誤認していた事故 — 上記コメント参照。本 PR で本物の Gemini CLI を
 *   `GEMINI_TOOL_MAP`/`mapGeminiCliToolName`/`toGeminiWire` として新規追加、legacy alias はそのまま維持)。
 *
 * Boundary: 観点 1 (brief2dev 自体) 専用 — R-CM-028。
 */

const STDIN_DEADLINE_MS = 1500;

/**
 * stdin から JSON を読み込む。タイムアウトまたは parse 失敗時は空オブジェクトを返す (fail-open)。
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
 * Antigravity tool 名 → Claude tool 名 マッピング表 (table-driven — cyclomatic を最小化)。
 *
 * 公式 Antigravity tool 名 (antigravity.google/docs + danicat.dev "Mastering Hooks"):
 *   run_command / write_to_file / replace_file_content / multi_replace_file_content / view_file。
 * legacy Gemini CLI alias (backwards-compat — 旧実装環境の回帰防止。UNVERIFIED for Antigravity native):
 *   run_shell / shell / run_shell_command / write_file / replace / multi_replace。
 */
const ANTIGRAVITY_TOOL_MAP = {
  // 公式 Antigravity tool 名
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
 * Antigravity のツール名を Claude 形式にマッピングする。未登録の名前はそのまま通す
 * (本体 hook の tool name 分岐でパススルー)。空値は Bash default。
 */
export function mapAntigravityToolName(name) {
  if (!name) return 'Bash';
  // Object.hasOwn ゲート — 'constructor' のような Object.prototype キーが関数値として漏れるのを防ぐ。
  return Object.hasOwn(ANTIGRAVITY_TOOL_MAP, name) ? ANTIGRAVITY_TOOL_MAP[name] : name;
}

/**
 * Backwards-compat alias。新規コードは mapAntigravityToolName の使用を推奨。
 * (Antigravity rename PR — feature/antigravity-rename-p0-fix)
 *
 * @deprecated この名前は Antigravity マッピングを指す(過去の誤認の名残) — 本物の Gemini CLI マッピング
 * ではない。新規コードは `mapGeminiCliToolName` (本物の Gemini CLI 専用) を使うこと。
 */
export const mapGeminiToolName = mapAntigravityToolName;

/**
 * Gemini CLI(geminicli.com) 公式 tool 名 → Claude tool 名 マッピング表。
 *
 * 出典(公式、2026-07-02 確認): https://github.com/google-gemini/gemini-cli/blob/main/docs/reference/tools.md
 * + https://github.com/google-gemini/gemini-cli/issues/18807 (`.gemini/settings.json` tools.core
 * 識別子の原文) — run_shell_command / read_file / write_file / replace / glob / grep_search /
 * list_directory を確認。`run_shell_command`/`read_file` は hooks reference ドキュメント(BeforeTool 例)でも
 * 再確認済み。Gemini CLI には Antigravity の `multi_replace_file_content` に対応する専用 tool がない —
 * `replace` 一つが単一/複数編集を両方処理するため MultiEdit も `replace` にマッピングする(Codex の
 * apply_patch が Write/Edit/MultiEdit を吸収するのと類似の多対一構造)。
 */
const GEMINI_TOOL_MAP = {
  run_shell_command: 'Bash',
  read_file: 'Read',
  write_file: 'Write',
  replace: 'Edit',
};

/**
 * Gemini CLI のツール名を Claude 形式にマッピングする。未登録の名前はそのまま通す
 * (本体 hook の tool name 分岐でパススルー)。空値は Bash default(Antigravity と同一ポリシー —
 * 両 CLI とも tool 名が常に埋まる仕様を前提とした防御的 default)。
 */
export function mapGeminiCliToolName(name) {
  if (!name) return 'Bash';
  // Object.hasOwn ゲート — Object.prototype キー('constructor' 等)の関数値漏出を防ぐ (antigravity と同型)。
  return Object.hasOwn(GEMINI_TOOL_MAP, name) ? GEMINI_TOOL_MAP[name] : name;
}

/**
 * 逆方向マッピング SSOT — Claude tool 名 → 各 CLI の matcher トークン (Codex / Antigravity / Gemini)。
 *
 * `ANTIGRAVITY_TOOL_MAP`/`GEMINI_TOOL_MAP` (CLI→Claude) の逆方向。`scaffold-multi-cli-hook.mjs` の
 * TOOL_MATCH とマルチ CLI 登録 parity 検証(`tests/unit/multi-cli-parity.test.mjs`)が本 SSOT を
 * 共有する — 重複排除。
 *
 * Codex: 公式 canonical は Bash / apply_patch (references/codex-cli-hooks.md)。shell / run_shell /
 *   run_shell_command / exec_command は brief2dev の慣例(既存 .codex/hooks.json)による防御的変種(UNVERIFIED)。
 *   apply_patch が Edit / Write / MultiEdit を単一ファイル tool として吸収する。
 * Antigravity: 公式 tool 名 run_command / write_to_file / replace_file_content /
 *   multi_replace_file_content / view_file (antigravity.google/docs/hooks — ANTIGRAVITY_TOOL_MAP の逆方向)。
 * Gemini: 公式 tool 名 run_shell_command / write_file / replace / read_file
 *   (github.com/google-gemini/gemini-cli docs/reference/tools.md — GEMINI_TOOL_MAP の逆方向)。MultiEdit は
 *   Gemini に専用 tool がないため `replace` を再利用(上記 GEMINI_TOOL_MAP コメント参照)。
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
 * Claude tool 名配列 → 与えられた CLI の matcher トークン配列 (順序保存 dedup)。
 * 未登録の Claude tool はそのまま通す(防御的 — 本体 matcher が非標準 tool の場合)。
 *
 * @param {string[]} claudeTools - Claude matcher の tool 名群 (例: ['Edit','Write'])
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
 * Codex tool 名 → Claude tool 名 正規化マップ (CLAUDE_TO_CLI_MATCHERS の逆インデックス — matcher SSOT 単一原点)。
 *
 * 背景 (drift 遮断): codex matcher は `CLAUDE_TO_CLI_MATCHERS[*].codex` のトークン群 (Bash の場合
 * shell / run_shell / run_shell_command / exec_command の防御的変種を含む) に対して dispatch を fire する。
 * ところが normalizePayload は antigravity のみ tool name を正規化し codex は passthrough だった — matcher は
 * 変種を受け取るのに normalizer が変種を canonical Bash に畳まないため、本体 guard (tool_name === 'Bash' 分岐) が
 * codex の変種コマンド (例: `run_shell` の `git push --force`) を認識できず fail-open していた。正規化マップを
 * matcher SSOT から逆derive し、matcher ⟺ normalizer の対称性を構造的に保証する (両者が同じ原点から派生)。
 *
 * apply_patch は Write / Edit / MultiEdit の 3 tool に同時マッピング (ambiguous) されており単一 canonical に
 * 畳めないためマップから除外 — normalizePayload が expandCodexApplyPatch で別途処理する。
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
 * Codex のツール名を Claude 形式にマッピングする。未登録の名前 + 空値はそのまま通す (本体 hook の tool name
 * 分岐でパススルー)。antigravity (空値 → Bash default) と異なり codex は空値も passthrough して
 * 既存の挙動を保存する — 正規化は matcher が fire する*既知のトークン*にのみ適用する (over-mapping 回避)。
 */
export function mapCodexToolName(name) {
  if (!name) return name;
  return CODEX_TOOL_MAP[name] || name;
}

/**
 * raw tool 名 → Claude canonical tool 名 (CLI 別正規化の単一エントリポイント)。
 *   - antigravity: mapAntigravityToolName (空値 → Bash default + legacy alias 含む)
 *   - codex:       mapCodexToolName (matcher SSOT 逆derive、空値 passthrough)
 *   - gemini:      mapGeminiCliToolName (空値 → Bash default、公式 tool 名マッピング)
 *   - その他 (claude 等): passthrough
 */
export function normalizeCliToolName(name, cli) {
  if (cli === 'antigravity') return mapAntigravityToolName(name);
  if (cli === 'codex') return mapCodexToolName(name);
  if (cli === 'gemini') return mapGeminiCliToolName(name);
  return name;
}

/**
 * Claude 互換 payload 形式 (`tool_name` キー保有) であればそのまま picking する。
 * 不在時は null を返す — 呼び出し元が alternate schema を処理する。
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
    // PostToolUse アダプタ(worktree-owner-tracker)が exit_code ゲートに使用。PreToolUse は undefined。
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
 * Antigravity `toolCall.args` の*コマンド*フィールド → Claude `tool_input.command` (VERIFIED, additive)。
 *
 * Antigravity は run_command のコマンド文字列を `CommandLine` として渡す (Gemini の
 * `tool_input.command` とは異なる) — Galloro マイグレーションガイド + danicat.dev 検証 2026-06-20
 * (hook-specific の出典)。本体 guard(commit-guard / destructive-git-guard の `tool_input.command`)が
 * コマンドを読むため、マッピングしないと本体 guard がコマンドを見られず fail-open(git push --force 未遮断)となる。
 * キー存在ベースの additive — 元のキー(`CommandLine`)も保存し、Claude キー(`command`)は未存在時のみ追加する。
 */
const ANTIGRAVITY_ARG_MAP = Object.freeze({ CommandLine: 'command' });

/**
 * Antigravity write/edit tool の*file path*フィールド名候補 (VERIFIED 第 1 候補 + 防御的な残り候補)。
 *
 * **`TargetFile` は公式マニュアルで確定** (2026-07-11): 公式 hooks ドキュメント §Supported Tools —
 * write_to_file / replace_file_content / multi_replace_file_content いずれも Arguments に `TargetFile`
 * を明示 (ユーザー提供の公式マニュアル写し `~/dev/buddypia/shared/cli-manuals/antigravity-cli/
 * antigravity-cli-hooks.md` L91-95、原典 https://antigravity.google/docs/hooks)。これにより DEBT-203 の
 * path 軸は解消 — first-match の第 1 候補が検証済みマッピングに昇格した。残りの候補(snake_case 等)は将来の
 * schema drift に対する defense-in-depth として維持する (削除しても得るものはゼロで、drift 時に fail-open が再発する)。
 *
 * 順序 = 特異性の高い順(first-match 時により具体的な候補を優先)。適用は Write/Edit/MultiEdit に正規化された
 * tool にのみゲート — run_command の generic な `path` 系 args の誤検出を回避。write_to_file/replace_file_content
 * の args は本質的にファイルターゲットなので候補マッチの誤検出リスクは低い。
 */
const ANTIGRAVITY_PATH_FIELD_CANDIDATES = Object.freeze([
  'TargetFile', // 公式確定 (antigravity-cli-hooks.md §Supported Tools, 2026-07-11)
  'target_file', // snake_case 変種
  'filePath', // camelCase 変種
  'absolute_path', // 絶対パス命名規則の変種
  'path', // generic — edit-class tool ゲート下でのみ適用 (誤検出最小化)
]);

/**
 * 各*正規化*済み Claude tool 名の file-path probe 適格性 (SSOT)。
 *
 * `ANTIGRAVITY_TOOL_MAP` のすべての正規化値(Claude 名)はここで分類されなければならない — file-edit(write/edit)
 * tool = `true` → パスガードが `file_path` を見る必要があるため probe 対象。command/read tool = `false` →
 * run_command の generic な path args の誤検出回避のため probe 除外。
 *
 * **drift 遮断 (2026-06-24 coverage-claim-scope-drift 回顧と同型)**: 以前は `PATH_PROBE_TOOLS` が
 * 独立したハードコード集合だったため、新規 Antigravity write tool を `ANTIGRAVITY_TOOL_MAP` に追加する際に
 * probe 集合の更新を漏らすと、その write tool が probe を受けられずセキュリティ fail-open が再発しうた (2 つの集合の
 * 独立進化 = 検出範囲が保護対象より狭くなる drift)。本分類 SSOT から `PATH_PROBE_TOOLS` を
 * *派生*させることでその drift を構造的に排除し、`unclassifiedProbeTools()` の invariant が分類漏れを
 * RED として捕捉する (回帰: `tests/unit/cli-adapter-utils.test.mjs`)。
 */
const TOOL_PATH_DISPOSITION = Object.freeze({
  Bash: false, // command — generic path args の誤検出回避
  Read: false, // read-only — パスガード非対象
  Write: true, // file-edit
  Edit: true, // file-edit
  MultiEdit: true, // file-edit
});

/**
 * file path probe 対象 tool (Claude *正規化*名)。`TOOL_PATH_DISPOSITION` から*派生* — 独立した
 * ハードコード集合ではないため tool-map 分類との drift が起きない(構造的排除)。file-edit 分類 tool のみ含む。
 *
 * 残余 (正直に明示 — 本 fix の範囲外): Antigravity が*将来*`ANTIGRAVITY_TOOL_MAP`*未登録*の書き込み tool
 * (raw 名がどの Claude tool にも正規化されない)を導入すると、ゲートを通過できず probe 未適用 → fail-open が
 * 残存する。この残余は外部検証不可(名前 spec 不在)なのでコードで閉じられず、解消経路は新規 tool を
 * `ANTIGRAVITY_TOOL_MAP` に登録すること(→ 正規化され自動的に probe 対象になる)。tripwire テストが明示的に文書化する。
 */
const PATH_PROBE_TOOLS = Object.freeze(
  new Set(
    Object.entries(TOOL_PATH_DISPOSITION)
      .filter(([, isFileEdit]) => isFileEdit)
      .map(([toolName]) => toolName),
  ),
);

/**
 * 分類漏れ(drift) 検出 — `ANTIGRAVITY_TOOL_MAP` の正規化値のうち `TOOL_PATH_DISPOSITION` 未分類の名前を返す。
 * 空配列 = drift なし。新規 write tool を tool-map に追加する際に本分類を漏らすとその名前が返され、
 * invariant テストが RED になる → セキュリティ fail-open の再発を構造的に遮断する。
 *
 * @param {Record<string,string>} [toolMap] - テスト stub 注入用 (default: 実際の ANTIGRAVITY_TOOL_MAP)
 * @returns {string[]} 未分類の正規化 tool 名 (重複除去、出現順)
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
 * 候補フィールドのうち first non-empty string 値を返す (なければ undefined)。防御的 file path probe のコア。
 */
function probeAntigravityFilePath(args) {
  for (const cand of ANTIGRAVITY_PATH_FIELD_CANDIDATES) {
    const v = args[cand];
    if (typeof v === 'string' && v.trim().length > 0) return v;
  }
  return undefined;
}

/**
 * Antigravity write/edit tool の*new content*フィールド名候補 (VERIFIED 第 1・第 2 候補 + 防御的な残り候補)。
 *
 * **公式マニュアルで確定** (2026-07-11、antigravity-cli-hooks.md §Supported Tools L91-95 — 原典
 * https://antigravity.google/docs/hooks):
 *   - write_to_file          → `CodeContent` (Claude Write の content に対応)
 *   - replace_file_content   → `ReplacementContent` (変更後 = Claude Edit の new_string に対応)
 *                              + `TargetContent` (変更前 = old_string に対応、下記の別定数)
 *   - multi_replace_file_content → `ReplacementChunks` (配列 — probeAntigravityChunks 専用処理)
 * 以前の候補集合(Contents/FileText/code/text)は実際のフィールド名を一つも含んでおらず、コンテンツスキャナー
 * (secret-leak-guard 等)が Antigravity のファイル編集で fail-open 状態だった — 本確定でその状態を閉塞した (DEBT-203
 * の content 軸を解消)。残りの generic 候補は将来の schema drift への防御として維持する。
 */
const ANTIGRAVITY_CONTENT_FIELD_CANDIDATES = Object.freeze([
  'CodeContent', // 公式確定 — write_to_file (antigravity-cli-hooks.md L91)
  'ReplacementContent', // 公式確定 — replace_file_content 変更後 (L93)
  'content', // Claude Write キー — {...args} で保存されるが明示 (probe コアの一貫性)
  'new_string', // Claude Edit キー — 同上
  'Contents', // PascalCase 変種候補 (drift 防御の残り)
  'FileText', // 変種候補 (drift 防御の残り)
  'code', // 変種候補 (drift 防御の残り)
  'text', // generic — edit-class tool ゲート下でのみ適用
]);

/**
 * Antigravity replace_file_content の*変更前*コンテンツフィールド (公式確定 — Claude Edit old_string に対応)。
 * old/new 両方が必要な coverage-threshold-guard が Antigravity で完全に動作するようにする
 * (以前は old_string が UNVERIFIED で probe 自体を行わず部分動作だった)。
 */
const ANTIGRAVITY_OLD_CONTENT_FIELD_CANDIDATES = Object.freeze([
  'TargetContent', // 公式確定 — replace_file_content 変更前 (antigravity-cli-hooks.md L93)
]);

/**
 * 候補フィールドのうち first non-empty string 値を返す (なければ undefined)。防御的 content probe のコア。
 * file_path probe と異なり trim しない (whitespace-only もコンテンツとして保存 — スキャナー入力の忠実性)。
 */
function probeFirstStringField(args, candidates) {
  for (const cand of candidates) {
    const v = args[cand];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return undefined;
}

function probeAntigravityContent(args) {
  return probeFirstStringField(args, ANTIGRAVITY_CONTENT_FIELD_CANDIDATES);
}

/**
 * multi_replace_file_content の `ReplacementChunks` 配列から new/old コンテンツのペアを単一走査で抽出する。
 *
 * 公式マニュアル(L95)は "array of chunks" とのみ明示し、chunk 内部のフィールドは未文書化 — chunk が
 * replace_file_content と同型(TargetContent/ReplacementContent)であるという前提のもと同一候補集合で
 * probe する (UNVERIFIED — chunk フィールド名が実測できたら絞り込む)。single-string first-match probe は配列
 * 構造に構造的に不適合なため、chunk 走査 + '\n' join でスキャナーに全コンテンツを渡す。
 * new/old を一度の走査でまとめて抽出 — 2 つの候補集合で配列を 2 回走査していた重複を排除。
 *
 * @param {object} args - raw toolCall.args
 * @returns {{ newContent: string|undefined, oldContent: string|undefined }}
 */
function probeAntigravityChunks(args) {
  const chunks = args.ReplacementChunks;
  if (!Array.isArray(chunks) || chunks.length === 0) {
    return { newContent: undefined, oldContent: undefined };
  }
  const news = [];
  const olds = [];
  for (const chunk of chunks) {
    if (!chunk || typeof chunk !== 'object') continue;
    const n = probeFirstStringField(chunk, ANTIGRAVITY_CONTENT_FIELD_CANDIDATES);
    if (n !== undefined) news.push(n);
    const o = probeFirstStringField(chunk, ANTIGRAVITY_OLD_CONTENT_FIELD_CANDIDATES);
    if (o !== undefined) olds.push(o);
  }
  return {
    newContent: news.length > 0 ? news.join('\n') : undefined,
    oldContent: olds.length > 0 ? olds.join('\n') : undefined,
  };
}

/**
 * Antigravity args → Claude tool_input 正規化 (すべて additive、元のキーを保存)。
 *   1. command: `CommandLine` → `command` (VERIFIED、キー存在ベース)。
 *   2. file_path: write/edit tool 限定の候補フィールド first-match probe (`TargetFile` 公式確定)。
 *   3. content/new_string: write/edit tool 限定のコンテンツ probe (`CodeContent`/`ReplacementContent`
 *      公式確定 + `ReplacementChunks` 配列専用処理)。
 *   4. old_string: replace 系の変更前コンテンツ (`TargetContent` 公式確定) — coverage-threshold-guard
 *      の old/new 比較が Antigravity でも動作するようにする。
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
  // 2~4. file_path + content + old_string probe — edit-class tool 限定
  if (PATH_PROBE_TOOLS.has(normalizedToolName)) applyAntigravityEditProbes(args, mapped);
  return mapped;
}

/**
 * edit-class tool の file_path/content/old_string probe を適用する (mapAntigravityArgs の分離ヘルパー —
 * cyclomatic 抑制)。mapped を in-place で補強する (additive — 既存キーは上書きしない)。
 */
function applyAntigravityEditProbes(args, mapped) {
  if (!('file_path' in mapped)) {
    const probedPath = probeAntigravityFilePath(args);
    if (probedPath !== undefined) mapped.file_path = probedPath;
  }
  // content は Write 本体が、new_string は Edit 本体が読むため両方埋める(未存在時) — tool 分岐を回避。
  // 単一文字列フィールドを優先し、不在時は ReplacementChunks 配列に fallback (multi_replace_file_content、単一走査)。
  const chunkProbe = probeAntigravityChunks(args);
  const probedContent = probeAntigravityContent(args) ?? chunkProbe.newContent;
  if (probedContent !== undefined) {
    if (!('content' in mapped)) mapped.content = probedContent;
    if (!('new_string' in mapped)) mapped.new_string = probedContent;
  }
  const probedOld =
    probeFirstStringField(args, ANTIGRAVITY_OLD_CONTENT_FIELD_CANDIDATES) ?? chunkProbe.oldContent;
  if (probedOld !== undefined && !('old_string' in mapped)) mapped.old_string = probedOld;
}

/**
 * 呼び出し cwd の解決。明示 cwd → session.cwd → Antigravity workspacePaths[0] → process.cwd()。
 */
function resolveCwd(data) {
  if (data.cwd) return data.cwd;
  if (data.session?.cwd) return data.session.cwd;
  if (Array.isArray(data.workspacePaths) && data.workspacePaths[0]) return data.workspacePaths[0];
  return process.cwd();
}

/**
 * Codex `apply_patch` コマンド文字列をパースし { op, filePath, newContent, oldContent } を抽出する。
 *
 * Codex のファイル編集は tool_name が常に `apply_patch` で、パッチ本文は tool_input.command に格納される
 * (公式: references/codex-cli-hooks.md L464/L473 — "apply_patch use tool_input.command",
 * "hook input still reports tool_name: 'apply_patch'")。本関数がなければ Edit|Write を tool_name で
 * ゲートしたり new_string/old_string/content を読む本体ガード(secret-leak-guard / coverage-threshold-guard
 * 等)が Codex apply_patch で PASSTHROUGH(無力化)される — 実証確認済み(2026-06-26)。
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
 * 最初のファイルの path を file_path とし、パッチ全体の +/- 行を content として収集する(マルチファイルパッチ時は
 * 最初のファイルのパス + 全体の added/removed — コンテンツスキャナーは過検出(全体スキャン)の方が見逃しより安全。
 * 単一ファイルが一般的なケース)。`+++`/`---` の diff ヘッダーは content から除外(prefix が単一の `+`/`-` ではない)。
 * 認識不可時は null を返す(fail-open)。
 *
 * @param {string} command - apply_patch 本文文字列
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
    // diff ヘッダー(`+++ b/path` / `--- a/path`)は常にマーカーの後ろに空白を持つ → 空白まで含めてマッチさせ、
    // 内容行(`+++x` のように content が `++` で始まる追加行)の誤フィルタ(スキャン漏れ)を回避する。
    if (line.startsWith('+++ ') || line.startsWith('--- ')) continue;
    if (line.startsWith('+')) added.push(line.slice(1));
    else if (line.startsWith('-')) removed.push(line.slice(1));
  }
  if (!filePath) return null;
  return { op, filePath, newContent: added.join('\n'), oldContent: removed.join('\n') };
}

/**
 * Codex apply_patch payload を Claude Edit/Write shape に拡張する (tool_name 再マッピング + content 抽出)。
 *   - Add File   → Write (tool_input.content = newContent)
 *   - Update File→ Edit  (tool_input.new_string = newContent, old_string = oldContent)
 *   - Delete File→ Edit  (file_path のみ; content なし)
 * 元の tool_input.command も保存する(additive)。パース不可時は元の shape のまま(fail-open — apply_patch 維持)。
 *
 * 副作用(意図された改善): file_path を埋めるため、既存の Codex Edit|Write ポート(worktree-policy-guard /
 * worktree-session-owner-guard)もこれまで file_path 不在で無力だった latent なギャップが解消され正常動作する。
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
 * Schema (cross-checked 公式ドキュメント):
 *   - Claude Code:   { tool_name, tool_input: { command, file_path, ... }, cwd, session_id, ... }
 *   - Codex CLI:     同一 schema (flat) + turn_id / permission_mode 拡張
 *                    (https://developers.openai.com/codex/hooks)
 *   - Antigravity:   { toolCall: { name: 'run_command'|'write_to_file'|..., args: {...} },
 *                    workspacePaths: [...], transcriptPath }
 *                    (https://antigravity.google/docs/hooks、danicat.dev で相互検証)
 *
 * Codex の `tool.name` (nested) fallback は schema drift への安全網 — 現行仕様上は dead path だが
 * future-proof として維持する。
 *
 * フィールド名マッピング: Antigravity `toolCall.args` のフィールド名は Claude `tool_input` と異なる。
 *   - run_command: `CommandLine` → `command` (VERIFIED — 公式マニュアル §Supported Tools 再確認
 *     2026-07-11)。`mapAntigravityArgs` が additive にマッピングし、本体 guard がコマンドを読めるようにする。
 *     マッピングがなければ本体 guard は fail-open(git push --force 未遮断)だった。
 *   - write/edit tool のファイルパス・コンテンツフィールド (公式マニュアル確定 2026-07-11 — antigravity-cli-hooks.md
 *     §Supported Tools): `TargetFile`(パス) / `CodeContent`(write_to_file) / `ReplacementContent`・
 *     `TargetContent`(replace_file_content の new/old) / `ReplacementChunks`(multi_* 配列)。
 *     `mapAntigravityArgs` が file_path/content/new_string/old_string に additive マッピング — コンテンツ
 *     スキャナー(secret-leak-guard)と old/new 比較ガード(coverage-threshold-guard)が Antigravity で動作する。
 *
 * @param {object} data - raw stdin JSON
 * @param {'claude'|'codex'|'antigravity'} cli
 * @returns {object} Claude Code 形式に正規化された payload
 */
/**
 * Antigravity payload のセッション識別子の派生 (公式マニュアル確定、2026-07-11)。
 *
 * Antigravity には `session_id` という*フィールド名*はないが、5 つのイベントすべての共通入力に同等の役割を持つ
 * `conversationId`(アクティブな会話の unique UUID)が存在する — antigravity-cli-hooks.md §Common Input
 * Fields L154 (原典 https://antigravity.google/docs/hooks)。以前の実装はこのフィールドを読んでおらず
 * worktree-owner-tracker の Layer 2(session_id サイドカー)が Antigravity で no-op だった (旧結論
 * "session_id 不在 → transcriptPath で識別" はフィールド名基準では正しいが代替識別子を見落としていた)。
 * conversationId を session_id にマッピングして Layer 2 の所有権追跡を Antigravity でも動作させる。
 */
function deriveSessionId(data, cli) {
  const explicit = data.session_id || data.session?.id;
  if (explicit) return explicit;
  // conversationId は Antigravity 専用の共通フィールド — 他 CLI に偶然同名のフィールドが生じても
  // session_id に誤派生しないよう cli ゲート (兄弟の derive* 関数群とゲーティングパターンを一貫させる)。
  return cli === 'antigravity' ? data.conversationId : undefined;
}

/**
 * Antigravity Stop payload の stop_hook_active 派生。
 *
 * Claude は stop-hook が引き起こした再継続後の Stop に `stop_hook_active=true` を与えて無限ブロックループを
 * 断ち切る。Antigravity にはそのフィールドがなく `executionNum`("The sequence number of the execution
 * attempt" — antigravity-cli-hooks.md §Stop L348) だけがある。サンプル payload(L366)が最初の停止に見える
 * 状況で `executionNum: 1` を示すため baseline=1 と推定し、`>= 2`(= 1 回以上 continue で再進入)
 * を stop_hook_active の等価として派生する — baseline が 0 であってもブロックは最大 2 回に有界(無限ループ防止を
 * 優先、正確な semantics は UNVERIFIED — 実 smoke 時に確定、DEBT-204)。
 */
function deriveAntigravityStopHookActive(data, cli) {
  if (cli !== 'antigravity' || typeof data.executionNum !== 'number') return undefined;
  return data.executionNum >= 2;
}

/**
 * Antigravity PostToolUse の `error` フィールド → Claude `tool_response` 合成。
 *
 * Antigravity PostToolUse 入力には Claude の `tool_response` がなく、失敗時のみ詳細メッセージを持つ
 * `error`(string) がある — antigravity-cli-hooks.md §PostToolUse。worktree-owner-tracker 等が
 * `tool_response.exit_code !== 0` ゲートで失敗コマンドを除外するため、error が non-empty のときのみ
 * `{exit_code: 1}` を合成する (成功/不在時は undefined — ゲート通過 = 既存の Claude 不在時のセマンティクスと同一)。
 */
function deriveAntigravityToolResponse(data, cli) {
  if (cli !== 'antigravity' || typeof data.error !== 'string' || data.error.trim().length === 0) {
    return undefined;
  }
  // stepIdx は Pre/PostToolUse 入力専用フィールド (Stop は executionNum — antigravity-cli-hooks.md §Stop)。
  // Stop のシステム error を tool 失敗(tool_response)に誤合成しないようイベント-shape ゲート。
  if (typeof data.stepIdx !== 'number') return undefined;
  return { exit_code: 1, error: data.error };
}

export function normalizePayload(data, cli) {
  if (!data || typeof data !== 'object') return { tool_name: '', tool_input: {} };

  const claudeShape = pickClaudeShape(data);
  if (claudeShape) {
    // Codex のファイル編集は tool_name='apply_patch' + パッチ本文が tool_input.command — Edit/Write shape に拡張
    // (そうしないと Edit|Write ゲート/コンテンツガードが無力化される)。他の tool/CLI はそのまま passthrough。
    if (cli === 'codex' && claudeShape.tool_name === 'apply_patch') {
      return expandCodexApplyPatch(claudeShape);
    }
    // Codex の変種 tool name (flat shape — shell/run_shell/run_shell_command/exec_command) → canonical Bash。
    // Gemini の BeforeTool/AfterTool payload も tool_name フィールド名は Claude と同一だが値は公式 Gemini
    // tool 名(run_shell_command/write_file/replace/read_file)であり同じ正規化が必要 — 両 CLI とも
    // normalizeCliToolName(matcher SSOT 逆derive) で canonical な Claude 名に畳み、本体 guard の
    // tool_name==='Bash' のような分岐が認識できるようにする。nested shape と同一処理。
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
    // Antigravity は session_id フィールドの代わりに conversationId(共通フィールド、セッション UUID) — deriveSessionId でマッピング。
    // 注意 (正直に明示): このマッピングで Layer 2 が動作するのは、payload にフィールドが乗るイベント(PreToolUse 等)
    // の*比較*側(worktree-session-owner-guard)である。サイドカーの*記録*側(owner-tracker、PostToolUse)は
    // Antigravity PostToolUse payload に toolCall 自体がなく(§PostToolUse — stepIdx/error/共通フィールドのみ)
    // コマンドを見られないため依然として no-op — Antigravity が作成した worktree は orphan として残る。
    session_id: deriveSessionId(data, cli),
    stop_hook_active: data.stop_hook_active ?? deriveAntigravityStopHookActive(data, cli),
    hook_event_name: data.hook_event_name,
    // Antigravity transcriptPath / Claude transcript_path の正規化 (あれば保存)。
    transcript_path: data.transcriptPath || data.transcript_path,
    tool_response: data.tool_response ?? deriveAntigravityToolResponse(data, cli),
    ...pickNonToolEventShape(data),
  };
}

/**
 * 本体 hook の Claude 形式の結果を Antigravity wire 形式に変換する (イベント別 decision 語彙分岐)。
 *
 * Antigravity stdout 契約 (公式マニュアル antigravity-cli-hooks.md、2026-07-11 確定 — 原典
 * https://antigravity.google/docs/hooks):
 *   - PreToolUse: `{ "decision": "allow"|"deny"|"ask"|"force_ask", "reason": "..." }`
 *   - Stop: `decision` は**`"continue"` のみが停止防止として認識される** — "Set to \"continue\" to prevent the
 *     agent from stopping and re-enter the execution loop. Any other value allows the stop." (§Stop
 *     L358)。つまり Claude/Codex 慣例の `"block"` は「それ以外の値」とみなされ停止がそのまま許可される —
 *     以前の実装("block honoring UNVERIFIED — そのまま転送")は Stop ガード全体を事実上無力化して
 *     いた。`block` → `continue` マッピングで是正する (本体 hook は Claude 語彙を維持 — SSOT 不変)。
 *   - PreInvocation(SessionStart の代替登録): 出力は `{ injectSteps: [...] }` — 各 step は
 *     `toolCall`/`userMessage`/`ephemeralMessage` のいずれか (§PreInvocation L275-281)。本体 hook の
 *     `hookSpecificOutput.additionalContext` を `ephemeralMessage`(transient system message) に変換する。
 *   - 空出力 = passthrough(allow)。reason は任意。
 *
 * @param {object} result - 本体 hook の戻り値 (HookOutput.deny/passthrough/block/context)
 * @param {string} [eventName] - dispatcher が渡した Claude イベント名 (Stop/SessionStart 分岐用)
 * @returns {object} Antigravity wire オブジェクト
 */
export function toAntigravityWire(result, eventName) {
  if (!result || Object.keys(result).length === 0) return {};

  const hso = result.hookSpecificOutput;
  // SessionStart(→PreInvocation 登録) のコンテキスト注入: additionalContext → injectSteps.ephemeralMessage。
  if (eventName === 'SessionStart' && typeof hso?.additionalContext === 'string' && hso.additionalContext) {
    return { injectSteps: [{ ephemeralMessage: hso.additionalContext }] };
  }
  // PreToolUse: Claude permissionDecision(allow|deny|ask) → Antigravity top-level decision。
  if (hso && typeof hso.permissionDecision === 'string') {
    const wire = { decision: hso.permissionDecision };
    const reason = hso.permissionDecisionReason;
    if (reason) wire.reason = reason;
    return wire;
  }
  if (typeof result.decision === 'string') {
    // Stop: Antigravity は "continue" のみを停止防止として認識する (上記の契約コメント) — block → continue マッピング。
    const decision = eventName === 'Stop' && result.decision === 'block' ? 'continue' : result.decision;
    const wire = { decision };
    if (result.reason) wire.reason = result.reason;
    return wire;
  }
  // その他の shape — 元のまま (Antigravity が無視しても無害)。
  return result;
}

/**
 * 本体 hook の Claude 形式の結果を Gemini CLI wire 形式 `{ decision, reason }` に変換する。
 *
 * Gemini CLI stdout 契約 (公式、geminicli.com/docs/hooks/reference/):
 *   - BeforeTool(≈PreToolUse): `{ "decision": "allow"|"deny"("block" alias), "reason": "..." }`。
 *     Claude の "ask" に対応する値は公式ドキュメントにない(allow/deny の二値) — registry のすべての hook が
 *     ask を返さないため(2026-07-02 確認、`grep -rn "ask" .cli/hooks/` 無結果)実質的な影響はない。
 *   - AfterAgent(≈Stop): 本体が `{ decision: 'block', reason }` を返す — Gemini は `continue:false` で
 *     セッション停止を表現するため(公式ドキュメント §Stop の例)、`decision:'block'` はそのまま渡しても無害
 *     (Gemini が認識できなくても fail-open — セッションが継続進行するだけ)。
 *   - 空結果 → {} (出力なし = allow、Claude/Antigravity と同一の慣例)。
 *
 * @param {object} result - 本体 hook の戻り値 (HookOutput.deny/passthrough/block/context)
 * @returns {object} Gemini CLI wire オブジェクト
 */
export function toGeminiWire(result) {
  if (!result || Object.keys(result).length === 0) return {};

  const hso = result.hookSpecificOutput;
  // PreToolUse: Claude permissionDecision(allow|deny|ask) → Gemini top-level decision。
  // "ask" は Gemini 公式値集合(allow/deny)にないが、registry に ask を返す hook がないため未到達の分岐。
  if (hso && typeof hso.permissionDecision === 'string') {
    const wire = { decision: hso.permissionDecision };
    const reason = hso.permissionDecisionReason;
    if (reason) wire.reason = reason;
    return wire;
  }
  // Stop(AfterAgent): 本体の {decision:'block', reason} をそのまま転送。
  if (typeof result.decision === 'string') {
    const wire = { decision: result.decision };
    if (result.reason) wire.reason = result.reason;
    return wire;
  }
  // SessionStart additionalContext 等その他の shape — 元のまま (Gemini が無視しても無害)。
  return result;
}

/**
 * @deprecated toAntigravityWire に置き換え済み。既存呼び出し元との互換のため維持 (deny reason の補強のみ実施)。
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
 * 本体 hook の結果 (Claude 形式 JSON) を CLI 別の wire 出力に変換する。
 *
 * Codex hook spec は block/deny に対して 2 つの方式を許容する:
 *   1. exit 0 + stdout JSON (推奨 — すべてのイベントで構造化レスポンスを維持)
 *   2. exit 2 + stderr reason (legacy/plain-text fallback)
 * 両者を混ぜた `exit 2 + stdout JSON + empty stderr` は Stop hook で
 * "did not write a continuation prompt to stderr" というランタイムエラーを引き起こす。
 * そのため adapter は常に exit 0 + stdout JSON を使用する。
 *
 * Antigravity と Gemini CLI は Claude の `hookSpecificOutput.permissionDecision` の代わりに top-level の
 * `{ decision, reason }` を読むため、それぞれ toAntigravityWire / toGeminiWire で変換してから emit する。
 *
 * @param {object} result - 本体 hook の戻り値 (HookOutput.deny/passthrough/block/context)
 * @param {{ cli: 'codex'|'antigravity'|'gemini', eventName?: string }} opts
 * @returns {{ stdout: string, stderr: string, exitCode: number }}
 */
export function buildCliEmission(result, opts = {}) {
  if (!result || Object.keys(result).length === 0) {
    return { stdout: '', stderr: '', exitCode: 0 };
  }

  if (opts.cli === 'antigravity' || opts.cli === 'gemini') {
    const wire = opts.cli === 'antigravity' ? toAntigravityWire(result, opts.eventName) : toGeminiWire(result);
    if (!wire || Object.keys(wire).length === 0) {
      return { stdout: '', stderr: '', exitCode: 0 };
    }
    return { stdout: JSON.stringify(wire) + '\n', stderr: '', exitCode: 0 };
  }

  // Codex (およびその他): Claude 形式 JSON passthrough + eventName ラベルの書き換え。
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
 * 本体 hook の結果 (Claude 形式 JSON) を CLI 別に emit する。
 *
 * @param {object} result - 本体 hook の戻り値 (HookOutput.deny/passthrough/block/context)
 * @param {{ cli: 'codex'|'antigravity'|'gemini', eventName?: string }} opts
 */
export function emit(result, opts = {}) {
  const emission = buildCliEmission(result, opts);
  if (emission.stdout) process.stdout.write(emission.stdout);
  if (emission.stderr) process.stderr.write(emission.stderr);
  process.exit(emission.exitCode);
}

/**
 * アダプタの標準エントリポイント。本体 hook の run(data) 関数を呼び出す。
 *
 * @param {Function} runFn - 本体 hook の export された run(data) async 関数
 * @param {{ cli: 'codex'|'antigravity'|'gemini', eventName?: string }} opts
 */
export async function runAdapter(runFn, opts) {
  try {
    const raw = await readStdinJson();
    // Antigravity は SessionStart 公式イベントがなく、登録が PreInvocation で代替される (codegen の
    // eventNameMap)。PreInvocation はモデル呼び出しごとに発火するため、`invocationNum === 0`(0-indexed の最初の
    // invocation — antigravity-cli-hooks.md §PreInvocation L267) のときのみ 1 回実行する。invocationNum
    // 不在(schema drift)も skip — SessionStart 代替 hook は advisory なコンテキスト注入であり、毎 invocation
    // 重複注入(ノイズ)するより未発火の方が安全。
    if (opts.cli === 'antigravity' && opts.eventName === 'SessionStart' && raw.invocationNum !== 0) {
      process.exit(0);
    }
    const normalized = normalizePayload(raw, opts.cli);
    normalized.hook_event_name = normalized.hook_event_name || opts.eventName;
    normalized._cli = opts.cli;
    const result = await runFn(normalized);
    emit(result, opts);
  } catch {
    // fail-open (R-CM-006 Rule 2 準拠) — アダプタ自体の失敗が本体フローを遮断しない
    process.exit(0);
  }
}
