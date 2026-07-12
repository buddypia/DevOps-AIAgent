#!/usr/bin/env node
/**
 * wt-run.mjs — Redirect command execution to the active worktree.
 *
 * このスクリプトは、AI セッション中に CWD がメインリポジトリにリセットされた際、
 * 自動的に有効化された worktree を探してその中で検証/チェックコマンドを実行します。
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { spawnSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '../..');

function parseArgs(args) {
  let worktree = null;
  const cmdArgs = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--worktree' || arg === '-w') {
      worktree = args[++i] || null;
    } else {
      cmdArgs.push(arg);
    }
  }

  return { worktree, cmdArgs };
}

function resolveActiveWorktree(explicitWt) {
  if (explicitWt) {
    return resolve(REPO_ROOT, explicitWt);
  }

  // 1. CONTEXT.json から活性 worktree を検出
  const ctxPath = join(REPO_ROOT, 'CONTEXT.json');
  if (existsSync(ctxPath)) {
    try {
      const ctx = JSON.parse(readFileSync(ctxPath, 'utf-8'));
      if (ctx.execution?.worktree?.worktree_path) {
        return resolve(REPO_ROOT, ctx.execution.worktree.worktree_path);
      }
    } catch {
      // ignore
    }
  }

  // 2. git worktree list から .worktrees/ 配下の worktree を検出
  try {
    const stdout = execSync('git worktree list --porcelain', { cwd: REPO_ROOT, encoding: 'utf-8' });
    const lines = stdout.split('\n');
    const wtPaths = [];
    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        const p = line.slice('worktree '.length).trim();
        // check if it is under .worktrees/
        if (p.includes('/.worktrees/')) {
          wtPaths.push(p);
        }
      }
    }

    if (wtPaths.length === 1) {
      return wtPaths[0];
    } else if (wtPaths.length > 1) {
      console.warn(`[wt-run] 警告: 複数の活性 worktree が発見されました。最初の一つ (${wtPaths[0]}) を使用します。`);
      return wtPaths[0];
    }
  } catch {
    // ignore
  }

  return null;
}

const { worktree: explicitWt, cmdArgs } = parseArgs(process.argv.slice(2));

if (cmdArgs.length === 0) {
  console.error('❌ wt-run: 実行するコマンドが必要です。例) node .claude/scripts/wt-run.mjs npm run test');
  process.exit(2);
}

const targetCwd = resolveActiveWorktree(explicitWt) || REPO_ROOT;

if (targetCwd === REPO_ROOT) {
  console.warn(`[wt-run] 警告: 有効化された worktree を見つけられませんでした。メインリポジトリのルート (${targetCwd}) から実行します。`);
} else {
  console.log(`[wt-run] CWD リダイレクション: ${targetCwd}`);
}

const cmdString = cmdArgs.join(' ');
console.log(`[wt-run] 実行コマンド: ${cmdString}`);

const child = spawnSync(cmdString, {
  cwd: targetCwd,
  stdio: 'inherit',
  shell: true,
});

process.exit(child.status ?? 0);
