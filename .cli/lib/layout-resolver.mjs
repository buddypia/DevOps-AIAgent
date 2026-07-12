/**
 * layout-resolver.mjs — R-CM-026 brief2dev .brief2dev/ Layout Resolver (単一 SSOT ヘルパー)
 *
 * data/registry/brief2dev-layout.json のカテゴリを決定的なパスに解決する。
 * すべての hook/script は .brief2dev/ を直接ハードコードする代わりに、このモジュールのヘルパーを使用しなければならない。
 *
 * 役割:
 *   - system カテゴリ (registry.json, learnings.jsonl, ...) のパス決定
 *   - run カテゴリ (active-run state) のパス決定
 *   - system/session-history ディレクトリのパス決定
 *   - run-scoped カテゴリ (stage-output, handoff, reports, references) のディレクトリ決定
 *   - active run_id の照会 (.brief2dev/run/active.json 優先)
 *
 * 設計原則:
 *   - 純粋関数 (read 限定の副作用 — fs.existsSync/readFileSync のみ)
 *   - throw しない — 不在/エラー時は安全なデフォルト値を返す
 *   - 決定的 — 同一入力 + 同一ファイルシステム状態 → 常に同一パス
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, relative, resolve, dirname } from 'node:path';

/** プロジェクトルート (CLAUDE_PROJECT_DIR 優先) — プロセスの実際のルート (system/governance/scan の基準、不変) */
const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR
  ? resolve(process.env.CLAUDE_PROJECT_DIR)
  : process.cwd();

/**
 * worktree_local 解決 base の同期スコープ override (R-CM-035 例外 5 — loom cross-worktree run mutation)。
 *
 * webui サーバ(main プロセス)が *別の worktree* の run を archive/削除する際、worktree_local
 * 資産(`run/active.json`, `runs/<id>/`)をその worktree 基準で解決させる。system_persistent
 * (`getArchivesRoot`/`resolveSystemFile` → `resolveSystemPersistentRoot` git-common-dir)は影響を受けない
 * ため、archive snapshot/registry/index は常に main に蓄積される (R-CM-026 / R-CM-030 整合)。
 *
 * **同期専用**: `fn` は同期関数でなければならない (try/finally で復元)。async 呼び出しの間に override が
 * 漏洩しないように、archive コアは sync fs のみを使用する。webui は単一プロセス・単一ユーザーなので
 * AsyncLocalStorage なしに module 変数 + sync スコープで十分 (over-engineering の回避)。
 */
let _projectDirOverride = null;

/**
 * worktree_local 解決 base (override > PROJECT_DIR)。getPipelineDataRoot + saga state dir などに使用。
 * system_persistent 解決(resolveSystemPersistentRoot)は本関数を使わないため override の影響なし。
 * @returns {string} 絶対パス
 */
export function getProjectDir() {
  return _projectDirOverride || PROJECT_DIR;
}

/**
 * `dir` を worktree_local base として override したまま同期関数 `fn` を実行し、結果を返す。
 * 実行後(throw を含む)は必ず以前の override に復元する (re-entrant 安全 — 以前の値を保存)。
 *
 * @template T
 * @param {string} dir - worktree の絶対/相対パス。falsy なら override 解除の効果。
 * @param {() => T} fn - 同期コールバック
 * @returns {T}
 */
export function withProjectDirOverride(dir, fn) {
  const prev = _projectDirOverride;
  _projectDirOverride = dir ? resolve(dir) : null;
  try {
    return fn();
  } finally {
    _projectDirOverride = prev;
  }
}

/**
 * system_persistent root のキャッシュ (1回の git 呼び出しで決定)。
 * null = まだ未解決、false = 解決失敗 (PROJECT_DIR fallback 確定)。
 */
let _systemPersistentRootCache = null;

/**
 * system_persistent カテゴリの単一 SSOT root を返す (R-CM-030 worktree 統一)。
 *
 * 優先順位:
 *   1. process.env.BRIEF2DEV_SYSTEM_ROOT 明示 (テスト隔離 / override)
 *   2. git rev-parse --git-common-dir の親 (= main worktree ルート)
 *   3. PROJECT_DIR fallback (git 外部 / 非-worktree / git 呼び出し失敗)
 *
 * 返り値は `.brief2dev` の親ディレクトリのパス (絶対パス)。呼び出し側は join で
 * `.brief2dev/system/...` を組み立てる。
 *
 * **落とし穴注意**: 名前が "system_persistent root" だが *system ファイルのパスではない*。
 * `<root>` のみを返すので、呼び出し側が `.brief2dev/system/<filename>` を組み立てなければならない。
 * system ファイルへの直接アクセスは `resolveSystemFile(filename)` を推奨 — 自動で
 * `.brief2dev/system/<filename>` の絶対パスを算出 + new vs legacy path fallback を処理する。
 * raw root への直接 join (例: `join(root, 'learnings.jsonl')`) は、main root にファイルを
 * 誤って append する違反パターン (本セッション 2026-05-24 事例)。
 *
 * 本関数は throw しない — git 失敗は fallback で graceful degrade。
 *
 * @param {object} [opts]
 * @param {string} [opts.cwd=PROJECT_DIR] - git 呼び出しの cwd (テスト隔離用)
 * @param {boolean} [opts.bustCache=false] - キャッシュ無効化 (テスト用)
 * @returns {string} 絶対パス
 */
export function resolveSystemPersistentRoot(opts = {}) {
  const { cwd = PROJECT_DIR, bustCache = false } = opts;

  if (process.env.BRIEF2DEV_SYSTEM_ROOT) {
    return resolve(process.env.BRIEF2DEV_SYSTEM_ROOT);
  }

  // R-CM-030: vitest sandbox 隔離。B2D_TEST_SANDBOX=1 のとき CLAUDE_PROJECT_DIR
  // を system_persistent root として使用 (git common-dir を無視)。worktree で
  // vitest 実行時にも main repo の system を改変しないように強制する。
  if (process.env.B2D_TEST_SANDBOX === '1' && process.env.CLAUDE_PROJECT_DIR) {
    return resolve(process.env.CLAUDE_PROJECT_DIR);
  }

  if (!bustCache && _systemPersistentRootCache !== null) {
    return _systemPersistentRootCache || PROJECT_DIR;
  }

  try {
    const out = execFileSync('git', ['rev-parse', '--git-common-dir'], {
      cwd,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (!out) {
      _systemPersistentRootCache = false;
      return PROJECT_DIR;
    }
    const absGitDir = resolve(cwd, out);
    const mainWorktreeRoot = dirname(absGitDir);
    _systemPersistentRootCache = mainWorktreeRoot;
    return mainWorktreeRoot;
  } catch {
    _systemPersistentRootCache = false;
    return PROJECT_DIR;
  }
}

/**
 * 任意のパスが brief2dev パイプラインを使用するプロジェクト(`.brief2dev/` マーカー保有)かどうかを確認する。
 * resolveSystemPersistentRoot() など他の関数と異なり、**現在のプロセス自身の root ではなく任意の
 * 外部パス**(例: 別の worktree、transplant-bundle 移植対象プロジェクト)を検査する際に使用する —
 * 例: create-pr/ops.mjs が別の worktree の run 産出物の保存候補を判断する際。
 * @param {string} root - 検査する絶対/相対パス
 * @returns {boolean}
 */
export function hasBrief2devMarker(root) {
  return existsSync(join(root, '.brief2dev'));
}

/**
 * ランタイムデータルート (例: `.brief2dev/` または産出物の `docs/discovery/`) — env-aware + project-config-aware (lazy lookup)。
 *
 * 優先順位 (呼び出しごとに評価):
 *   1. <PROJECT_DIR>/project-config.json#pipeline_data_root 明示の string → join(PROJECT_DIR, その path)
 *   2. fallback → join(PROJECT_DIR, '.brief2dev')
 *
 * **Lazy lookup (ユーザー決定 2026-05-25 オプション 3)**: const ではなく関数 — 呼び出しごとに project-config.json を
 * sync read する。R-CM-026 Rule 8 単一エントリポイント SSOT: 本モジュールのみ `.brief2dev` literal を保有し、pipeline-config など
 * 他のモジュールは本関数への import に委任する。
 *
 * **セキュリティガード**: pipeline_data_root 入力に絶対パス (`/...`) または path traversal (`..`) が含まれる場合は silent fallback
 * (R-CM-006 Rule 2 fail-open 整合)。産出物の project-config.json は scaffold-deploy が生成するのでユーザーが直接
 * 制御する input ではないが、defense-in-depth。
 *
 * **性能**: 呼び出しごとに disk I/O。hot loop での呼び出し時は caller が結果を変数に cache することを推奨。
 *
 * @returns {string} 絶対パス
 */
export function getPipelineDataRoot() {
  // worktree_local base — withProjectDirOverride 適用時はその worktree 基準 (R-CM-035 例外 5)。
  const base = getProjectDir();
  const configPath = join(base, 'project-config.json');
  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      const raw = config?.pipeline_data_root;
      if (typeof raw === 'string') {
        const trimmed = raw.trim();
        // セキュリティガード (意図的に strict): 空文字列 / 絶対パス / `..` substring を含む path → silent fallback。
        // `..` substring 検査なので `docs..v2` のような任意の名前も拒否 — `pipeline_data_root` は単純なディレクトリ名 (例: `docs/discovery`) を想定。
        if (trimmed.length > 0 && !trimmed.startsWith('/') && !trimmed.includes('..')) {
          return join(base, trimmed);
        }
      }
    } catch {
      // JSON parse 失敗などの silent fallback
    }
  }
  return join(base, '.brief2dev');
}

/**
 * `.brief2dev/system/` — システム永続資産 (registry, learnings など)。
 *
 * **Lazy lookup**: getPipelineDataRoot() の lookup 結果に従う。
 *
 * @returns {string} 絶対パス
 */
export function getSystemRoot() {
  return join(getPipelineDataRoot(), 'system');
}

/**
 * `.brief2dev/runs/` — run-scoped 産出物ルート。
 *
 * @returns {string} 絶対パス
 */
export function getRunsRoot() {
  return join(getPipelineDataRoot(), 'runs');
}

/**
 * `.brief2dev/governance/` — ガバナンス永続資産 (handoff/retrospectives/audits)。
 *
 * @returns {string} 絶対パス
 */
export function getGovernanceRoot() {
  return join(getPipelineDataRoot(), 'governance');
}

/**
 * `.brief2dev/inbox/` — パイプライン開始前の参考資料ステージング。
 *
 * @returns {string} 絶対パス
 */
export function getInboxRoot() {
  return join(getPipelineDataRoot(), 'inbox');
}

/**
 * `.brief2dev/transplants/` — OSS 移植システム (別レイアウト)。
 *
 * @returns {string} 絶対パス
 */
export function getTransplantsRoot() {
  return join(getPipelineDataRoot(), 'transplants');
}

/**
 * `.brief2dev/archives/` — sealed idea archive snapshot ルート。
 *
 * **system_persistent root 基準** (main worktree, ユーザー決定 2026-05-14)。各 worktree の archive-and-reset
 * 産出物が main へ sync され、cross-aidea archive の蓄積が保存されるようにする。`.brief2dev/run/active.json` は
 * worktree-local (per-session 隔離) だが、archives は cross-worktree で共有される。
 *
 * 本関数は getPipelineDataRoot() lookup とは *独立* — system_persistent root が base なので project-config.json
 * の `pipeline_data_root` の影響なし。産出物 (観点 2) では意味を持たない。**本体 (観点 1) 専用の cross-aidea 資産**。
 *
 * @returns {string} 絶対パス
 */
export function getArchivesRoot() {
  return join(resolveSystemPersistentRoot(), '.brief2dev', 'archives');
}

/**
 * `.brief2dev/_archive/` — governance/raw history archive ルート。
 *
 * @returns {string} 絶対パス
 */
export function getArchiveRoot() {
  return join(getPipelineDataRoot(), '_archive');
}

// ═══════════════════════════════════════════════════════════════
// system カテゴリ (system_persistent lifecycle)
// ═══════════════════════════════════════════════════════════════

/**
 * system カテゴリのファイルパスを決定する。
 *
 * 優先順位 (R-CM-030 worktree 統一):
 *   1. projectDir 明示 + 明示した root に新パスが存在 → 明示した root の新パス (テスト隔離優先)
 *   2. system_persistent root (`git common-dir` の親) の新パスが存在 → そのパス
 *   3. system_persistent root の旧パス (.brief2dev/<filename>) が存在 + 新パス不在 → 旧パス (P3 legacy fallback)
 *   4. どちらも不在の場合: 新パス (write target)
 *
 * projectDir 引数はテスト隔離用 — デフォルト値 PROJECT_DIR の場合は system_persistent root を自動解決する。
 * 明示時はそのパスを強制使用 (BRIEF2DEV_SYSTEM_ROOT env と同等の効果)。
 *
 * @param {string} filename - ファイル名 (例: "learnings.jsonl", "registry.json")
 * @param {string} [projectDir] - プロジェクトルート明示 (テスト隔離)。未明示時は system_persistent root。
 *   **注意**: `filename === 'active-run.json'` の場合、本引数は無視され `getActiveRunPath()` へ
 *   委任される (worktree_local lifecycle, R-CM-026 2026-05-14)。active-run state の worktree 隔離が
 *   必要な呼び出し側は `getActiveRunPath()` を直接使用することを推奨。
 * @returns {string} 絶対パス
 */
export function resolveSystemFile(filename, projectDir) {
  // active-run.json は worktree_local に分離されたので (R-CM-026 `run` カテゴリ)、
  // 呼び出し側のコード変更なしに自動委任する。projectDir 明示は無視 — getActiveRunPath が
  // PROJECT_DIR (worktree-local) を自動解決する。
  if (filename === 'active-run.json') return getActiveRunPath();
  const root = projectDir
    ? join(resolve(projectDir), '.brief2dev')
    : join(resolveSystemPersistentRoot(), '.brief2dev');
  const newPath = join(root, 'system', filename);
  const oldPath = join(root, filename);
  if (existsSync(newPath)) return newPath;
  if (existsSync(oldPath)) return oldPath;
  return newPath;
}

/**
 * system/session-history/ ディレクトリのパスを決定する。
 *
 * @param {string} [projectDir] - プロジェクトルート明示 (テスト隔離)。未明示時は system_persistent root。
 * @returns {string} 絶対パス
 */
export function resolveSessionHistoryDir(projectDir) {
  const root = projectDir
    ? join(resolve(projectDir), '.brief2dev')
    : join(resolveSystemPersistentRoot(), '.brief2dev');
  return join(root, 'system', 'session-history');
}

// ═══════════════════════════════════════════════════════════════
// active run 照会
// ═══════════════════════════════════════════════════════════════

/**
 * active-run state ファイルのパスを返す (worktree-local)。
 *
 * **ユーザー決定 2026-05-14 per-worktree run isolation**: active-run state は
 * worktree ごとに隔離される (multi-session safe)。main 共有の system 資産 (pipeline-memory
 * など) と異なり、PROJECT_DIR 基準の `.brief2dev/run/active.json` で解決する。
 *
 * Legacy fallback (段階的マイグレーション + test fixture 互換):
 *   1. `<wt>/.brief2dev/run/active.json` が存在 → そのパス
 *   2. system_persistent root の `system/active-run.json` が存在 → そのパス (P3 legacy)
 *   3. system_persistent root の `.brief2dev/active-run.json` フラット位置が存在 → そのパス (P3 flat)
 *   4. すべて不在: 新パス (write target)
 *
 * @returns {string} 絶対パス
 */
export function getActiveRunPath() {
  const newPath = join(getPipelineDataRoot(), 'run', 'active.json');
  if (existsSync(newPath)) return newPath;
  const systemRoot = resolveSystemPersistentRoot();
  const systemLegacy = join(systemRoot, '.brief2dev', 'system', 'active-run.json');
  if (existsSync(systemLegacy)) return systemLegacy;
  const flatLegacy = join(systemRoot, '.brief2dev', 'active-run.json');
  if (existsSync(flatLegacy)) return flatLegacy;
  return newPath;
}

/**
 * main + すべての worktree (.worktrees/**) の active-run.json 候補パスを収集する。
 * active-run は worktree_local (R-CM-026 `run` カテゴリ, ユーザー決定 2026-05-14) なので、
 * cross-worktree running guard は各 worktree の active を個別に確認しなければならない。
 * パスの存在有無は呼び出し側が判断する (存在に関わらず候補を返す — fail-open)。
 *
 * @param {string} [projectDir=PROJECT_DIR] プロジェクトルート
 * @returns {string[]} active-run.json の絶対パス一覧 (main 1 + worktree N)
 */
export function listAllActiveRunPaths(projectDir = PROJECT_DIR) {
  // worktree-local 隔離スキャン: 各 worktree の .brief2dev/run/active.json を直接見る。
  const paths = [join(projectDir, '.brief2dev', 'run', 'active.json')];
  const worktreesRoot = join(projectDir, '.worktrees');
  if (!existsSync(worktreesRoot)) return paths;
  // withFileTypes でディレクトリのみを抽出する — ファイル (.DS_Store など) をブランチ segment と
  // 誤認したり、worktree 内部 (node_modules/src など) を over-scan したりするのを防ぐ。
  let level1 = [];
  try {
    level1 = readdirSync(worktreesRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return paths;
  }
  for (const entry of level1) {
    const entryPath = join(worktreesRoot, entry);
    paths.push(join(entryPath, '.brief2dev', 'run', 'active.json'));
    // feature/foo, fix/bar のような 2-depth ブランチはもう1レベル探索する (ディレクトリのみ)
    let level2 = [];
    try {
      level2 = readdirSync(entryPath, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
    } catch {
      continue;
    }
    for (const sub of level2) {
      paths.push(join(entryPath, sub, '.brief2dev', 'run', 'active.json'));
    }
  }
  return paths;
}

/**
 * active-run.json の run_id を返す (idle/存在しなければ null)。
 *
 * @returns {string|null}
 */
export function getActiveRunId() {
  try {
    const path = getActiveRunPath();
    if (!existsSync(path)) return null;
    const data = JSON.parse(readFileSync(path, 'utf-8'));
    if (!data || data.status === 'idle') return null;
    return data.run_id || null;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// run-scoped カテゴリ (run_scoped lifecycle)
// ═══════════════════════════════════════════════════════════════

/**
 * run-scoped カテゴリのディレクトリパスを決定する。
 *
 * @param {string} subdir - サブディレクトリ (例: "stage-output", "handoff", "reports", "references")
 * @returns {string} 絶対パス
 */
export function resolveRunScopedDir(subdir) {
  const runId = getActiveRunId();
  if (runId) {
    return join(getRunsRoot(), runId, subdir);
  }
  // active がなければ新パス (write 時点で mkdir が必要)
  return join(getRunsRoot(), '_unassigned', subdir);
}

/**
 * run-scoped カテゴリのディレクトリ (特定の run_id を明示)。
 *
 * @param {string} runId - run_id (例: "brief2dev-20260428-104115")
 * @param {string} subdir
 * @returns {string} 絶対パス
 */
export function resolveRunScopedDirFor(runId, subdir) {
  if (!runId) return resolveRunScopedDir(subdir);
  return join(getRunsRoot(), runId, subdir);
}

/**
 * 現在の active run のルートディレクトリを返す。
 * カテゴリの sub-dir ではなく、run-level 資産 (inbox-manifest.json など) の位置決定に使用。
 *
 * 優先順位:
 *   1. active run_id あり → .brief2dev/runs/<run_id>/
 *   2. active なし → null
 *
 * @returns {string|null} 絶対パスまたは null
 */
export function resolveActiveRunDir() {
  const runId = getActiveRunId();
  if (!runId) return null;
  return join(getRunsRoot(), runId);
}

/**
 * idea-memory.json ファイルのパスを返す (R-CM-014 P3, 2026-05-06)。
 *
 * R-CM-026 layout SSOT の `runs/{active}/idea-memory.json` カテゴリ (lifecycle: run_scoped)。
 * R-CM-028 Two-Perspective Boundary のデータ分離を適用 — system pipeline-memory.json と隔離された
 * per-aidea fact ストア。archive-and-reset Phase 7 で一緒に封印される。
 *
 * 優先順位:
 *   1. runId 明示 → .brief2dev/runs/<runId>/idea-memory.json (write target としても使用可能)
 *   2. runId 未明示 + active run_id あり → active run の idea-memory
 *   3. runId 未明示 + active なし → null (idle 状態では idea-memory 不在)
 *
 * @param {string} [runId] - 特定の run_id を明示。null または undefined の場合は active を使用。
 * @returns {string|null} 絶対パスまたは null (idle + runId 未明示の場合)
 */
export function resolveIdeaMemoryPath(runId) {
  if (runId) return join(getRunsRoot(), runId, 'idea-memory.json');
  const active = getActiveRunId();
  if (!active) return null;
  return join(getRunsRoot(), active, 'idea-memory.json');
}

// ═══════════════════════════════════════════════════════════════
// governance カテゴリ (permanent lifecycle)
// ═══════════════════════════════════════════════════════════════

/**
 * governance サブディレクトリのパスを返す。
 *
 * @param {string} subdir - "handoff" | "retrospectives" | "audits" | その他の governance category
 * @param {string} [projectDir=PROJECT_DIR] - プロジェクトルートのオーバーライド (テスト隔離用)
 * @returns {string} 絶対パス
 */
export function resolveGovernanceDir(subdir, projectDir = PROJECT_DIR) {
  const root =
    resolve(projectDir) === PROJECT_DIR
      ? getGovernanceRoot()
      : join(resolve(projectDir), relative(PROJECT_DIR, getGovernanceRoot()));
  return join(root, subdir);
}

/**
 * archive サブディレクトリのパスを返す。
 *
 * @param {string} subdir - archive 内部のサブディレクトリ
 * @param {string} [projectDir=PROJECT_DIR] - プロジェクトルートのオーバーライド (テスト隔離用)
 * @returns {string} 絶対パス
 */
export function resolveArchiveDir(subdir, projectDir = PROJECT_DIR) {
  const root =
    resolve(projectDir) === PROJECT_DIR
      ? getArchiveRoot()
      : join(resolve(projectDir), relative(PROJECT_DIR, getArchiveRoot()));
  return join(root, subdir);
}
