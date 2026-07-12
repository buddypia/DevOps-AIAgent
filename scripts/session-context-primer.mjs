#!/usr/bin/env node

/**
 * session-context-primer.mjs — SessionStart Hook (Claude Code)
 *
 * セッション開始時に「リポジトリ状態コンテキスト」を additionalContext として注入し、
 * マルチターミナル並行運用 (Codex CLI / Claude Code) で頻発する 3 つの誤読・二重作業を防ぐ:
 *   1. stale な local main による「未pull の upstream commit を user WIP と誤読」
 *      → git status の staged/modified を WIP 断定する前に provenance 検証を促す
 *   2. 並行セッションの非可視化による二重 PR
 *      → active worktree / open PR を提示
 *   3. git deny 制約の未把握による無駄な試行 (3-Strike)
 *      → .claude/settings.json permissions.deny の git 項目を提示
 *
 * side-effect-only / advisory 専用 (SessionStart は遮断不可 — Claude Code Hooks spec)。
 * 全処理 fail-open: 例外・タイムアウト・オフラインは exit 0 + 無出力で素通り。遮断は一切しない。
 *
 * retro: docs/governance/retro-2026-07-12-session-context-primer.md
 * class: stale-context-parallel-agent-blindness
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/** git/gh コマンドを安全実行。失敗・タイムアウトは空文字を返す (fail-open)。 */
function sh(cmd, cwd) {
  try {
    return execSync(cmd, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 4000,
    }).trim();
  } catch {
    return '';
  }
}

function main() {
  // リポジトリルート: CLAUDE_PROJECT_DIR 優先、無ければ git から解決
  const root = process.env.CLAUDE_PROJECT_DIR || sh('git rev-parse --show-toplevel', process.cwd());
  if (!root) return; // repo 外 → 無出力で素通り

  const lines = [];

  // 1. main 同期状況 (fetch は best-effort。offline/timeout は fail-open で続行)
  sh('git fetch --quiet origin main', root);
  const counts = sh('git rev-list --left-right --count origin/main...HEAD', root); // "<behind>\t<ahead>"
  const parts = counts ? counts.split(/\s+/) : [];
  const behind = Number.parseInt(parts[0], 10) || 0;
  const ahead = Number.parseInt(parts[1], 10) || 0;
  if (behind > 0) {
    lines.push(
      `- ⚠ local main は origin/main より ${behind} commit 遅延。未pull の upstream commit が ` +
        '`git status` 上で「未コミット変更」に見えることがある。',
    );
    lines.push(
      '  → staged/modified を user WIP と断定する前に `git diff HEAD -- <file>` で provenance を検証する' +
        ' (空=既コミット=損失なし)。証拠なしに「WIP消失」等を主張しない (R-CM-010)。',
    );
  } else if (counts) {
    lines.push(`- local main は origin/main と同期 (behind 0${ahead ? `, ahead ${ahead}` : ''})。`);
  }

  // 2. active worktree (main 以外 = 並行セッションの可能性)
  const wtRaw = sh('git worktree list --porcelain', root);
  const worktrees = [];
  let cur = null;
  for (const line of wtRaw.split('\n')) {
    if (line.startsWith('worktree ')) {
      if (cur) worktrees.push(cur);
      cur = { path: line.slice('worktree '.length), branch: null };
    } else if (line.startsWith('branch ') && cur) {
      cur.branch = line.slice('branch '.length).replace('refs/heads/', '');
    }
  }
  if (cur) worktrees.push(cur);
  const others = worktrees.filter((w) => w.path && w.path !== root);
  if (others.length) {
    const label = others.map((w) => w.branch || w.path).join(', ');
    lines.push(`- アクティブな worktree ${others.length} 件 (並行セッションの可能性): ${label}`);
  }

  // 3. open PR (gh 未認証/offline は fail-open)
  const prRaw = sh('gh pr list --state open --json number,title --limit 20', root);
  if (prRaw) {
    try {
      const prs = JSON.parse(prRaw);
      if (Array.isArray(prs) && prs.length) {
        const label = prs.map((p) => `#${p.number} ${p.title}`).join(' / ');
        lines.push(`- open PR ${prs.length} 件 (二重作業回避のため PR 作成前に確認): ${label}`);
      }
    } catch {
      /* JSON パース失敗 → skip */
    }
  }

  // 4. git deny 制約 (.claude/settings.json permissions.deny の git 項目を動的 read)
  try {
    const settings = JSON.parse(readFileSync(`${root}/.claude/settings.json`, 'utf8'));
    const deny = (settings?.permissions?.deny || []).filter((d) => typeof d === 'string' && /\bgit\b/.test(d));
    if (deny.length) {
      lines.push(
        `- 本 repo が deny する git 操作 (Bash tool): ${deny.join(', ')}。` +
          'index 調整が必要でも `git restore`/`git reset` を試さず worktree フロー (`make wt.new BR=...`) を使う。',
      );
    }
  } catch {
    /* settings 読めない → skip */
  }

  if (!lines.length) return; // 提示すべき情報なし → 無出力

  const context = `[Session Context Primer] リポジトリ状態 (誤読・二重作業の防止):\n${lines.join('\n')}`;
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: context },
    }),
  );
}

try {
  main();
} catch {
  /* fail-open: どんな例外でも素通り */
}
process.exit(0);
