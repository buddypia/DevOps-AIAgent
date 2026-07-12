#!/usr/bin/env node
/**
 * worktree-init.mjs — R-CM-030 system_persistent worktree share helper
 *
 * 目的: 現在の worktree の `.brief2dev/system/` ディレクトリを main worktree の
 *       同一ディレクトリに向けた symlink にする。すべての worktree が単一の SSOT
 *       (system_persistent root — git common-dir の親) を共有するようにする。
 *
 * べき等性:
 *   - core.hooksPath が `.husky` 相対パスでなければ repo-local 設定正規化
 *   - すでに正確な symlink → no-op (exit 0)
 *   - 空ディレクトリ → 安全に除去した後に symlink 生成
 *   - 不在 → 親ディレクトリ作成後に symlink
 *   - ファイルがあるディレクトリ → STOP + エラー (サイレントデータ損失を回避、R-CM-029 Rule 5)
 *   - 異なる symlink → STOP + エラー
 *
 * 使用:
 *   node .claude/scripts/worktree-init.mjs                  # 現在の cwd
 *   node .claude/scripts/worktree-init.mjs --worktree <path>
 *   node .claude/scripts/worktree-init.mjs --dry-run        # 検査のみ
 *
 * exit code:
 *   0 — symlink 正常 (生成 / すでに存在)
 *   1 — 衝突 (手動解決が必要) / git 外部 / main worktree 自体
 *   2 — 引数 / ユーザーエラー
 *
 * AI / ユーザーへの案内:
 *   本スクリプトは R-CM-031 Consequential カテゴリ (ディレクトリ修正 + データ lifecycle 影響) のため、
 *   SessionStart guard が自動呼び出ししない。ユーザーが明示的に呼び出す。
 */

import { existsSync, lstatSync, readlinkSync, readdirSync, rmdirSync, mkdirSync, symlinkSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ensureWorktreePlan } from './lib/worktree-plan-template.mjs';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

function getOpt(name) {
  const idx = args.indexOf(name);
  if (idx < 0) return null;
  return args[idx + 1] || null;
}

const worktreeArg = getOpt('--worktree');
const WORKTREE = resolve(worktreeArg || process.cwd());

function fail(code, msg) {
  console.error(msg);
  process.exit(code);
}

function info(msg) {
  console.log(msg);
}

/**
 * git rev-parse --git-common-dir により main worktree ルートを算出。
 * 失敗時は null 返却 (呼び出し元が処理)。
 */
function resolveMainWorktreeRoot(cwd) {
  try {
    const commonDir = execFileSync('git', ['rev-parse', '--git-common-dir'], {
      cwd,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (!commonDir) return null;
    // common-dir は main repo の .git ディレクトリ (worktree 内では絶対パス、
    // main 内では ".git")。その親が main worktree ルート。
    const absoluteCommonDir = resolve(cwd, commonDir);
    return dirname(absoluteCommonDir);
  } catch {
    return null;
  }
}

function readGitConfig(cwd, key) {
  try {
    return execFileSync('git', ['config', '--get', key], {
      cwd,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

function normalizeHooksPath(cwd) {
  const current = readGitConfig(cwd, 'core.hooksPath');
  if (current === '.husky') {
    info(`[worktree-init] core.hooksPath already relative: .husky (no-op)`);
    return;
  }

  // .husky を使用しないプロジェクト (移植対象など) に強制すると、既存/将来的な他の hooks メカニズム
  // (lefthook / simple-git-hooks / 手動 hooksPath など) がサイレントに無効化される可能性がある。
  // .husky ディレクトリが実在する場合のみ正規化の対象とする。
  if (!existsSync(join(cwd, '.husky'))) {
    info(`[worktree-init] .husky ディレクトリ不在 — core.hooksPath 正規化 SKIP (husky 未使用プロジェクト、既存設定を保存)。`);
    return;
  }

  if (DRY_RUN) {
    info(`[worktree-init] (dry-run) core.hooksPath 正規化予定: ${current || '(unset)'} → .husky`);
    return;
  }

  execFileSync('git', ['config', 'core.hooksPath', '.husky'], {
    cwd,
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  info(`[worktree-init] core.hooksPath 正規化: ${current || '(unset)'} → .husky`);
}

const mainRoot = resolveMainWorktreeRoot(WORKTREE);
if (!mainRoot) {
  fail(1, `[worktree-init] git common-dir 解決失敗。cwd=${WORKTREE} が git 外部である可能性。`);
}

normalizeHooksPath(WORKTREE);

if (mainRoot === WORKTREE) {
  info(`[worktree-init] 現在の位置 (${WORKTREE}) は main worktree です。system ディレクトリはすでに SSOT 本体のため symlink 不要。SKIP。`);
  process.exit(0);
}

// @layout-resolver-allow — 本スクリプトは layout-resolver の依存関係 (symlink 生成) を
// 自主的にブートストラップする責任を持つ。resolver 呼び出し時に本 worktree の system path が
// すでに main symlink に向いているため、hardcode は意図的。
const mainSystemDir = join(mainRoot, '.brief2dev', 'system'); // @layout-resolver-allow
const localBriefDir = join(WORKTREE, '.brief2dev'); // @layout-resolver-allow
const localSystemPath = join(localBriefDir, 'system');

// main の system ディレクトリ不在 → symlink 対象がないため graceful に SKIP (fail しない)。
//  - 外部移植 target: cross-aidea SSOT (.brief2dev/system) 未使用が正常 (transplant
//    bundle adaptation_notes[0] が約束した動作 — 過去の fail(1) はその約束と矛盾していた)。
//  - brief2dev 自体: 初回 orchestrator run 前の fresh clone など system 未生成状態。
//  両ケースともに「共有する system なし → symlink no-op」で同一の意味 (boundary-uniform)。
//  PLAN.md 自動生成 + git env 注入は worktree 隔離に有効なため finishInit に進行。
//  (brief2dev で以降に system が生成された場合、worktree-system-symlink-guard が不在を検知・案内)。
if (!existsSync(mainSystemDir)) {
  info(
    `[worktree-init] main の system ディレクトリ不在 (${mainSystemDir}) — symlink 段階 SKIP ` +
      `(共有する cross-aidea SSOT なし)。PLAN.md + git env 注入は継続進行。`,
  );
  finishInit();
}

// 現在の状態分類
let status; // 'absent' | 'correct_symlink' | 'wrong_symlink' | 'empty_dir' | 'non_empty_dir' | 'file'
let detail = null;

if (!existsSync(localSystemPath)) {
  // lstat も throw すれば不在。ただし、壊れた symlink も lstat は通過する → 別途処理。
  try {
    const st = lstatSync(localSystemPath);
    if (st.isSymbolicLink()) {
      const target = readlinkSync(localSystemPath);
      const resolved = resolve(dirname(localSystemPath), target);
      status = resolved === mainSystemDir ? 'correct_symlink' : 'wrong_symlink';
      detail = { target, resolved };
    } else {
      // existsSync が false なのに lstat が成功 = ほぼ発生しない。安全な fallback。
      status = 'absent';
    }
  } catch {
    status = 'absent';
  }
} else {
  const st = lstatSync(localSystemPath);
  if (st.isSymbolicLink()) {
    const target = readlinkSync(localSystemPath);
    const resolved = resolve(dirname(localSystemPath), target);
    status = resolved === mainSystemDir ? 'correct_symlink' : 'wrong_symlink';
    detail = { target, resolved };
  } else if (st.isDirectory()) {
    const entries = readdirSync(localSystemPath).filter((e) => !e.startsWith('.DS_'));
    status = entries.length === 0 ? 'empty_dir' : 'non_empty_dir';
    detail = { entries };
  } else {
    status = 'file';
  }
}

const relSystemFromWorktree = relative(WORKTREE, localSystemPath);
const relTargetFromLink = relative(dirname(localSystemPath), mainSystemDir);

function createSymlink() {
  if (DRY_RUN) {
    info(`[worktree-init] (dry-run) symlink 生成予定: ${relSystemFromWorktree} → ${relTargetFromLink}`);
    return;
  }
  if (!existsSync(localBriefDir)) {
    mkdirSync(localBriefDir, { recursive: true });
  }
  // 相対パス symlink — worktree が別のマシンに移動しても動作するように (ただし、
  // 同一のディレクトリ構造を想定。絶対パスより堅牢)。
  symlinkSync(relTargetFromLink, localSystemPath);
  info(`[worktree-init] 生成: ${relSystemFromWorktree} → ${relTargetFromLink}`);
}

/**
 * PLAN.md がなければ標準テンプレートで自動生成。あれば保存。
 * DRY_RUN では SKIP。失敗は fail-open (worktree-init の symlink 責任には影響なし)。
 *
 * デグレード項目: 直前の振り返り #1 "PLAN.md 位置の混乱" — AI が worktree ごとに mkdir
 * + Write のサイクルを繰り返していたパターンを SSOT 呼び出し 1回で遮断。
 */
function ensurePlanIfApplicable() {
  if (DRY_RUN) return;
  try {
    const result = ensureWorktreePlan(WORKTREE);
    if (result.created) {
      info(`[worktree-init] PLAN.md 自動生成: ${relative(WORKTREE, result.path)}`);
    } else {
      info(`[worktree-init] PLAN.md すでに存在 (保存): ${relative(WORKTREE, result.path)}`);
    }
  } catch (e) {
    info(`[worktree-init] PLAN.md 自動生成 SKIP: ${e.message}`);
  }
}

const MAIN_LOG_LINES = 5;

/**
 * main の最近の N コミットを表示する。AI が作業開始時に main の hook/script CLI
 * 変化 (例: PR #309 `mark-pre-ship-confirmed --quality` 強制) を事前認知できるように
 * する。fetch は実行しない — ユーザーが fetch させた時点の main を表示するのみ。
 *
 * fail-open: git log 失敗 (worktree が git 外部 / origin/main 不在 / 権限不足など)
 * 時は silent skip。worktree-init の symlink 責任には影響なし。
 */
function showMainRecentCommits() {
  if (DRY_RUN) return;
  try {
    const log = execFileSync('git', ['log', '--oneline', `-${MAIN_LOG_LINES}`, 'origin/main'], {
      cwd: WORKTREE,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (log) {
      const indented = log.split('\n').map((l) => `  ${l}`).join('\n');
      info(`[worktree-init] main 最近の ${MAIN_LOG_LINES} コミット (作業開始前の確認を推奨):\n${indented}`);
    }
  } catch {
    // origin/main 不在 / git fetch されていない / 権限不足 → silent fail-open
  }
}

function injectGitEnv(worktreePath) {
  if (DRY_RUN) return;
  try {
    const dotGitPath = join(worktreePath, '.git');
    let gitDir = join(mainRoot, '.git');
    if (existsSync(dotGitPath)) {
      const gitContent = readFileSync(dotGitPath, 'utf-8').trim();
      if (gitContent.startsWith('gitdir:')) {
        gitDir = gitContent.slice('gitdir:'.length).trim();
      }
    }

    // 1. Claude Code env injection (.claude/settings.local.json)
    const settingsLocalPath = join(worktreePath, '.claude', 'settings.local.json');
    let existing = {};
    if (existsSync(settingsLocalPath)) {
      try {
        existing = JSON.parse(readFileSync(settingsLocalPath, 'utf-8'));
      } catch {
        // ignore
      }
    }

    const merged = {
      ...existing,
      env: {
        ...(existing.env || {}),
        GIT_WORK_TREE: worktreePath,
        GIT_DIR: gitDir,
      },
    };

    mkdirSync(dirname(settingsLocalPath), { recursive: true });
    writeFileSync(settingsLocalPath, JSON.stringify(merged, null, 2) + '\n');
    info(`[worktree-init] settings.local.json 環境変数 (GIT_WORK_TREE, GIT_DIR) 注入完了: ${relative(worktreePath, settingsLocalPath)}`);

    // 2. Codex env injection (.codex/config.toml)
    const codexConfigPath = join(worktreePath, '.codex', 'config.toml');
    let codexContent = '';
    if (existsSync(codexConfigPath)) {
      codexContent = readFileSync(codexConfigPath, 'utf-8');
    }

    const envBlockPattern = /^\[env\]\s*$/m;
    const worktreeLine = `GIT_WORK_TREE = "${worktreePath}"`;
    const gitDirLine = `GIT_DIR = "${gitDir}"`;

    if (envBlockPattern.test(codexContent)) {
      let lines = codexContent.split('\n');
      let envIdx = lines.findIndex(line => line.trim() === '[env]');
      
      // Clean up previous values if they exist
      let wtIdx = lines.findIndex((line, i) => i > envIdx && line.trim().startsWith('GIT_WORK_TREE'));
      if (wtIdx !== -1) lines.splice(wtIdx, 1);
      
      let dirIdx = lines.findIndex((line, i) => i > envIdx && line.trim().startsWith('GIT_DIR'));
      if (dirIdx !== -1) lines.splice(dirIdx, 1);

      // Re-evaluate index and insert values right after [env]
      envIdx = lines.findIndex(line => line.trim() === '[env]');
      lines.splice(envIdx + 1, 0, worktreeLine, gitDirLine);
      codexContent = lines.join('\n');
    } else {
      if (codexContent && !codexContent.endsWith('\n')) {
        codexContent += '\n';
      }
      codexContent += `\n[env]\n${worktreeLine}\n${gitDirLine}\n`;
    }

    mkdirSync(dirname(codexConfigPath), { recursive: true });
    writeFileSync(codexConfigPath, codexContent);
    info(`[worktree-init] .codex/config.toml 環境変数注入完了: ${relative(worktreePath, codexConfigPath)}`);

    // 3. Antigravity CLI config injection (.agents/config.json)
    const agentsConfigPath = join(worktreePath, '.agents', 'config.json');
    let agentsExisting = {};
    if (existsSync(agentsConfigPath)) {
      try {
        agentsExisting = JSON.parse(readFileSync(agentsConfigPath, 'utf-8'));
      } catch {
        // ignore
      }
    }

    const agentsMerged = {
      ...agentsExisting,
      env: {
        ...(agentsExisting.env || {}),
        GIT_WORK_TREE: worktreePath,
        GIT_DIR: gitDir,
      },
    };

    mkdirSync(dirname(agentsConfigPath), { recursive: true });
    writeFileSync(agentsConfigPath, JSON.stringify(agentsMerged, null, 2) + '\n');
    info(`[worktree-init] .agents/config.json 環境変数注入完了: ${relative(worktreePath, agentsConfigPath)}`);

  } catch (e) {
    info(`[worktree-init] 環境変数注入失敗: ${e.message}`);
  }
}

/**
 * 成功ケースの共通終了トリオ。新規ケース追加時の呼び出し漏れを遮断 (DRY)。
 */
function finishInit() {
  injectGitEnv(WORKTREE);
  ensurePlanIfApplicable();
  showMainRecentCommits();
  process.exit(0);
}

switch (status) {
  case 'correct_symlink':
    info(`[worktree-init] すでに正常な symlink: ${relSystemFromWorktree} → ${relTargetFromLink} (no-op)`);
    finishInit();
    break;

  case 'absent':
    createSymlink();
    finishInit();
    break;

  case 'empty_dir':
    if (DRY_RUN) {
      info(`[worktree-init] (dry-run) 空ディレクトリ除去のうえ symlink 生成予定`);
      process.exit(0);
    }
    rmdirSync(localSystemPath);
    createSymlink();
    finishInit();
    break;

  case 'wrong_symlink':
    fail(
      1,
      `[worktree-init] CONFLICT: ${relSystemFromWorktree} はすでに異なる symlink です。\n` +
        `  現在の target : ${detail.target} (= ${detail.resolved})\n` +
        `  必要な target: ${relTargetFromLink} (= ${mainSystemDir})\n` +
        `解決: 意図された link であれば SKIP。そうでなければ次のコマンドで手動修正してください:\n` +
        `  rm '${localSystemPath}' && node ${process.argv[1]} --worktree '${WORKTREE}'`,
    );
    break;

  case 'non_empty_dir':
    fail(
      1,
      `[worktree-init] CONFLICT: ${relSystemFromWorktree} はファイルが存在する実際のディレクトリです。\n` +
        `  内容: ${detail.entries.slice(0, 5).join(', ')}${detail.entries.length > 5 ? ' ...' : ''}\n` +
        `サイレントなデータ損失防止のため、自動変換は行いません。\n` +
        `解決オプション:\n` +
        `  (a) この worktree の system/ の内容が不要な場合 — rm -rf '${localSystemPath}' の後に再実行\n` +
        `  (b) main の system/ へのマージが必要な場合 — 手動で比較した後に main へコピーし、その後に rm -rf '${localSystemPath}' して再実行\n` +
        `  (c) 本 worktree のみで隔離された system が必要な場合 — symlink メカニズムを使用しない。R-CM-030 違反となるため非推奨。`,
    );
    break;

  case 'file':
    fail(
      1,
      `[worktree-init] CONFLICT: ${relSystemFromWorktree} はファイルです (ディレクトリまたは symlink を想定)。\n` +
        `解決: rm '${localSystemPath}' の後に再実行。`,
    );
    break;

  default:
    fail(2, `[worktree-init] internal: 未知の状態 — ${status}`);
}
