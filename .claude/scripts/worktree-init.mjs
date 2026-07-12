#!/usr/bin/env node
/**
 * worktree-init.mjs — R-CM-030 system_persistent worktree share helper
 *
 * 目的: 現在のworktreeの `.brief2dev/system/` ディレクトリを、main worktreeの
 *       同一ディレクトリを指すsymlinkにする。すべてのworktreeが単一SSOT
 *       (system_persistent root — git common-dirの親) を共有するようにする。
 *
 * 冪等性:
 *   - core.hooksPath が `.husky` 相対パスでなければrepo-local設定を正規化
 *   - すでに正しいsymlink → no-op (exit 0)
 *   - 空ディレクトリ → 安全に削除後symlink生成
 *   - 不在 → 親ディレクトリ生成後symlink
 *   - ファイルがあるディレクトリ → STOP + エラー（silentデータ損失回避、R-CM-029 Rule 5）
 *   - 別のsymlink → STOP + エラー
 *
 * 使用法:
 *   node .claude/scripts/worktree-init.mjs                  # 現在のcwd
 *   node .claude/scripts/worktree-init.mjs --worktree <path>
 *   node .claude/scripts/worktree-init.mjs --dry-run        # 検査のみ
 *
 * exit code:
 *   0 — symlink正常（生成 / 既存）
 *   1 — 競合（手動解決が必要）/ git外部 / main worktree自体
 *   2 — 引数 / ユーザーエラー
 *
 * AI / ユーザー向け案内:
 *   本スクリプトはR-CM-031 Consequentialカテゴリ（ディレクトリ変更 + データlifecycle影響）なので
 *   SessionStart guardが自動呼び出ししない。ユーザーが明示的に呼び出す。
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
 * git rev-parse --git-common-dirでmain worktreeのrootを算出。
 * 失敗時はnullを返す（呼び出し側が処理）。
 */
function resolveMainWorktreeRoot(cwd) {
  try {
    const commonDir = execFileSync('git', ['rev-parse', '--git-common-dir'], {
      cwd,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (!commonDir) return null;
    // common-dirはmain repoの.gitディレクトリ（worktree内では絶対パス、
    // main内では".git"）。その親がmain worktreeのroot。
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

  // .huskyを使わないプロジェクト（移植対象など）に強制すると、既存/将来の他のhooksメカニズム
  // (lefthook / simple-git-hooks / 手動hooksPathなど) がsilentに無効化される可能性がある。
  // .huskyディレクトリが実在する時のみ正規化対象とする。
  if (!existsSync(join(cwd, '.husky'))) {
    info(`[worktree-init] .huskyディレクトリ不在 — core.hooksPath正規化をSKIP（husky未使用プロジェクト、既存設定を保存）。`);
    return;
  }

  if (DRY_RUN) {
    info(`[worktree-init] (dry-run) core.hooksPath正規化予定: ${current || '(unset)'} → .husky`);
    return;
  }

  execFileSync('git', ['config', 'core.hooksPath', '.husky'], {
    cwd,
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  info(`[worktree-init] core.hooksPath正規化: ${current || '(unset)'} → .husky`);
}

const mainRoot = resolveMainWorktreeRoot(WORKTREE);
if (!mainRoot) {
  fail(1, `[worktree-init] git common-dir解決失敗。cwd=${WORKTREE} がgit外部の可能性。`);
}

normalizeHooksPath(WORKTREE);

if (mainRoot === WORKTREE) {
  info(`[worktree-init] 現在の位置(${WORKTREE}) はmain worktreeです。systemディレクトリはすでにSSOT本体なのでsymlink不要。SKIP。`);
  process.exit(0);
}

// @layout-resolver-allow — 本スクリプトはlayout-resolverの依存関係（symlink生成）を
// 自ら bootstrap する責務を持つ。resolver呼び出し時に本worktreeのsystem pathが
// すでにmain symlinkを指してしまうため、hardcodeが意図的。
const mainSystemDir = join(mainRoot, '.brief2dev', 'system'); // @layout-resolver-allow
const localBriefDir = join(WORKTREE, '.brief2dev'); // @layout-resolver-allow
const localSystemPath = join(localBriefDir, 'system');

// mainのsystemディレクトリ不在 → symlink対象がないためgraceful SKIP（failではない）。
//  - 外部移植target: cross-aidea SSOT (.brief2dev/system) 未使用が正常（transplant
//    bundle adaptation_notes[0] が約束した動作 — 過去のfail(1)はその約束と矛盾していた）。
//  - brief2dev自体: 初回orchestrator run前のfresh cloneなどsystem未生成状態。
//  両ケースとも「共有するsystemがない → symlink no-op」で同じ意味（boundary-uniform）。
//  PLAN.md自動生成 + git env注入はworktree隔離に有効なのでfinishInitへ進む。
//  (brief2devでその後systemが生成されたらworktree-system-symlink-guardが不在を検知・案内する。)
if (!existsSync(mainSystemDir)) {
  info(
    `[worktree-init] mainのsystemディレクトリ不在 (${mainSystemDir}) — symlink段階をSKIP ` +
      `（共有するcross-aidea SSOTなし）。PLAN.md + git env注入は続行。`,
  );
  finishInit();
}

// 現在の状態分類
let status; // 'absent' | 'correct_symlink' | 'wrong_symlink' | 'empty_dir' | 'non_empty_dir' | 'file'
let detail = null;

if (!existsSync(localSystemPath)) {
  // lstatもthrowすれば不在。ただし壊れたsymlinkもlstatは通過 → 別途処理。
  try {
    const st = lstatSync(localSystemPath);
    if (st.isSymbolicLink()) {
      const target = readlinkSync(localSystemPath);
      const resolved = resolve(dirname(localSystemPath), target);
      status = resolved === mainSystemDir ? 'correct_symlink' : 'wrong_symlink';
      detail = { target, resolved };
    } else {
      // existsSyncがfalseなのにlstat成功 = ほぼ発生しない。安全なfallback。
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
    info(`[worktree-init] (dry-run) symlink生成予定: ${relSystemFromWorktree} → ${relTargetFromLink}`);
    return;
  }
  if (!existsSync(localBriefDir)) {
    mkdirSync(localBriefDir, { recursive: true });
  }
  // 相対パスsymlink — worktreeが別のマシンに移動しても動作するように（ただし
  // 同じディレクトリ構造を前提。絶対パスより堅牢）。
  symlinkSync(relTargetFromLink, localSystemPath);
  info(`[worktree-init] 生成: ${relSystemFromWorktree} → ${relTargetFromLink}`);
}

/**
 * PLAN.mdがなければ標準テンプレートで自動生成。あれば保存。
 * DRY_RUNではSKIP。失敗はfail-open（worktree-initのsymlink責務には影響なし）。
 *
 * リグレッション項目: 直前の振り返り #1「PLAN.mdの配置場所の混同」— AIがworktreeごとに
 * mkdir + Writeサイクルを繰り返していたパターンをSSOT呼び出し1回で防止。
 */
function ensurePlanIfApplicable() {
  if (DRY_RUN) return;
  try {
    const result = ensureWorktreePlan(WORKTREE);
    if (result.created) {
      info(`[worktree-init] PLAN.md自動生成: ${relative(WORKTREE, result.path)}`);
    } else {
      info(`[worktree-init] PLAN.mdはすでに存在（保存）: ${relative(WORKTREE, result.path)}`);
    }
  } catch (e) {
    info(`[worktree-init] PLAN.md自動生成をSKIP: ${e.message}`);
  }
}

const MAIN_LOG_LINES = 5;

/**
 * mainの最近N件のcommitを表示する。AIが作業開始時にmainのhook/script CLIの
 * 変化（例: PR #309 `mark-pre-ship-confirmed --quality` 強制）を事前に把握できるようにする。
 * fetchは実行しない — ユーザーがfetchした時点のmainを表示するだけ。
 *
 * fail-open: git log失敗（worktreeがgit外部 / origin/main不在 / 権限不足など）
 * 時はsilent skip。worktree-initのsymlink責務には影響なし。
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
      info(`[worktree-init] mainの最近${MAIN_LOG_LINES}件のcommit（作業開始前のレビュー推奨）:\n${indented}`);
    }
  } catch {
    // origin/main不在 / git fetch未実行 / 権限不足 → silent fail-open
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
    info(`[worktree-init] settings.local.json環境変数(GIT_WORK_TREE, GIT_DIR)注入完了: ${relative(worktreePath, settingsLocalPath)}`);

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
    info(`[worktree-init] .codex/config.toml環境変数注入完了: ${relative(worktreePath, codexConfigPath)}`);

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
    info(`[worktree-init] .agents/config.json環境変数注入完了: ${relative(worktreePath, agentsConfigPath)}`);

  } catch (e) {
    info(`[worktree-init] 環境変数注入失敗: ${e.message}`);
  }
}

/**
 * 成功caseの共通終了トリオ。新caseの追加時に呼び出し漏れを防止 (DRY)。
 */
function finishInit() {
  injectGitEnv(WORKTREE);
  ensurePlanIfApplicable();
  showMainRecentCommits();
  process.exit(0);
}

switch (status) {
  case 'correct_symlink':
    info(`[worktree-init] すでに正常なsymlink: ${relSystemFromWorktree} → ${relTargetFromLink} (no-op)`);
    finishInit();
    break;

  case 'absent':
    createSymlink();
    finishInit();
    break;

  case 'empty_dir':
    if (DRY_RUN) {
      info(`[worktree-init] (dry-run) 空ディレクトリ削除後symlink生成予定`);
      process.exit(0);
    }
    rmdirSync(localSystemPath);
    createSymlink();
    finishInit();
    break;

  case 'wrong_symlink':
    fail(
      1,
      `[worktree-init] CONFLICT: ${relSystemFromWorktree} はすでに別のsymlinkです。\n` +
        `  現在のtarget : ${detail.target} (= ${detail.resolved})\n` +
        `  必要なtarget: ${relTargetFromLink} (= ${mainSystemDir})\n` +
        `解決: 意図されたlinkであればSKIP。そうでなければ次のコマンドで手動修正:\n` +
        `  rm '${localSystemPath}' && node ${process.argv[1]} --worktree '${WORKTREE}'`,
    );
    break;

  case 'non_empty_dir':
    fail(
      1,
      `[worktree-init] CONFLICT: ${relSystemFromWorktree} はファイルが存在する実ディレクトリです。\n` +
        `  内容: ${detail.entries.slice(0, 5).join(', ')}${detail.entries.length > 5 ? ' ...' : ''}\n` +
        `silentなデータ損失を防ぐため、自動変換は行いません。\n` +
        `解決オプション:\n` +
        `  (a) このworktreeのsystem/の内容が不要なら — rm -rf '${localSystemPath}' 後に再実行\n` +
        `  (b) mainのsystem/への統合が必要なら — 手動比較後mainへコピー、その後rm -rf '${localSystemPath}' 後に再実行\n` +
        `  (c) 本worktreeのみ隔離されたsystemが必要なら — symlinkメカニズム不使用。R-CM-030違反となるため非推奨。`,
    );
    break;

  case 'file':
    fail(
      1,
      `[worktree-init] CONFLICT: ${relSystemFromWorktree} はファイルです（ディレクトリまたはsymlinkを想定）。\n` +
        `解決: rm '${localSystemPath}' 後に再実行。`,
    );
    break;

  default:
    fail(2, `[worktree-init] internal: 不明な状態 — ${status}`);
}
