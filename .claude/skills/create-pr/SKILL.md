---
name: create-pr
model: sonnet
effort: low
description: "Worktree 隔離 GitHub Flow (8 コマンド, v2 応答契約)。Mode A (staged 隔離 → Feature PR → main 同期) + Mode B (PLAN.md 基準の worktree 配備)。unstaged/untracked は stash バックアップで 100% 保存。"
argument-hint: "[追加指示事項 (選択)]"
---

## `/create-pr` — Worktree 隔離 GitHub Flow

AI が並行して変更した結果を Feature PR → main 同期まで自動実行。2つのモードをサポート、質問なしで自動進行。

> **推奨 (強制ではない)**: 本スキル呼び出しの直前、変更 size に応じて `/pre-ship-quality-advisor` の実行を推奨する。`/code-review --fix` (Claude Code, simplification + correctness が最優先) / `code-standards-aligner` (ポータブルな fallback) / final-review (すべての PR) / `/code-review high` (実質的な変更の review-only correctness verdict オプション) ツールの優先順位とマニュアルチェックリストを提案。他の CLI (Gemini CLI, Codex など) 環境でもマニュアルチェックリストに fallback して動作。

### 核心不変式 + 禁止事項

**不変式**: unstaged/untracked は実行前後で正確に同一でなければならない。
- Mode A Phase 1: worktree 隔離 → オリジナル HEAD 不変
- Mode A Phase 2: dirty main は自動 stash せずに sync を中断 (`sync_status: local_changes`) する。オリジナル working tree に手を加えず、ユーザーが手動で commit/stash させた後に再試行する。

**Worktree Commit Requirement**: Mode B `ship-worktree` は dirty worktree を配備しない。
- PR 生成/マージ前に `git status --porcelain --untracked-files=all` が clean である必要がある。
- uncommitted tracked/untracked 変更がある場合は `code: "commit_required"` で失敗する。
- AI は自身が作成したファイルのみを stage/commit させた後に `ship-worktree` を再実行する。
- ユーザーが明示的に WIP 保存/コミット禁止を要求した場合は、`ship-worktree` の代わりに作業状態を報告して中断する。

**禁止**: オリジナル working tree の修正 · `git reset --hard` · `git checkout .` · `git restore .` · `git clean -f` · `git stash clear` (R-CM-008 Rule 7 — clear のみ遮断、その他 stash 許容) · `--force` push · main 削除 · 衝突の自動解決

### v2 応答契約 (すべてのコマンド共通)

```jsonc
{
  "ok": true | false,
  "mode": "staged" | "worktree" | null,    // AI 分岐指標
  "command": "init" | "verify-plan" ...,
  "sync_status"?: "synced" | "fetch_failed" | "local_changes" | "ff_failed",
  "changed_files"?: ["a.md", "b/c.mjs"],   // ship-feature/ship-worktree マージ成功時
  "changed_files_tree"?: "└── ...",         // 人用の markdown box-drawing ツリー
  "completion_report_markdown"?: "# PR 承認後の完了報告\n...", // ship-worktree 承認後のユーザー報告テンプレート
  "warnings"?: ["..."],
  "error"?: "...",     // ok:false 時
  "hint"?: "..."       // ok:false 時の回復案内
}
```

**fail-loud セマンティクス** (R-CM-010 整合): `finalize`/`cleanup-worktree` の fetch/local_changes/ff 失敗は `ok:false` + `sync_status`。silent warning ではない。dirty main は `sync_status: local_changes` で中断し、オリジナル working tree に手を加えない。

**Post-merge ツリー報告義務 (`changed_files_tree`)**: `ship-feature` / `ship-worktree` が `merged: true` 応答時に `changed_files` (path 配列) + `changed_files_tree` (markdown box-drawing ツリー) の2つのフィールドを包含する。AI はマージ報告の直後、`changed_files_tree` フィールドの値を**ユーザーにそのまま出力**し、どのファイルがマージされたかを認知できるようにする。gh 呼び出し失敗時は `changed_files: []` + `changed_files_tree: "(no files)"` (silent fail-open — 中核のマージ結果に影響なし)。

**承認後の完了報告義務 (`completion_report_markdown`)**: `ship-worktree` は PR/cleanup 後に `completion_report_markdown` フィールドを包含する。AI はユーザー承認後に ship を実行したならば、このフィールドをユーザーに出力しなければならない。生成 SSOT は `.cli/lib/worktree-ship-report.mjs#buildPostApprovalCompletionReport` であり、PR URL/merge commit/CI status、cleanup 状況、反映ファイル tree、残りの対応、問題/改善メモを包含する。

### ops.mjs 使用

```
node .claude/scripts/create-pr/ops.mjs <command> [--key value ...]
```

設定: `.claude/skills/create-pr/config.json` — `github_account`、`base_branch` (基本 `main`)、`enforce_ssh_remote` (基本 false)。ops.mjs が `gh auth token -u` で `GH_TOKEN` を自動注入。

| コマンド | Mode | 引数 | 役割 |
|---|---|---|---|
| `init` | staged | — | base 確認 + 同時実行保護 (30min mtime) + CI Mirror Gate (60min stamp) + staged 抽出 + 機密遮断 + gh auth |
| `isolate` | staged | `--branch <b>` | worktree + feature ブランチ生成 + staged `apply --index` |
| `commit` | staged | `--message <m> [--files <f1,f2>]` | worktree 内のコミット |
| `ship-feature` | staged | `--title <t> [--body <b>] [--no-merge]` | push → べき等 PR → squash merge → remote branch 削除 |
| `finalize` | staged | — | worktree 除去 + オリジナル main 同期 (dirty 時は abort、fail-loud) |
| `verify-plan` | worktree | `--worktree <p> [--force]` | PLAN.md 未完了チェックボックス検証 (コードブロック/HTML コメントのストリップ、キャンセルマーカーの認識) |
| `ship-worktree` | worktree | `--worktree <p> --title <t> [--body <b>] [--force-plan] [--no-merge] [--no-cleanup]` | PLAN.md 検証 + committed/clean worktree 検証 + push + べき等 PR + auto full cleanup (デフォルト値 — `cleanup-worktree` に委譲: worktree・branch 除去 + auto-checkpoint stash drop + CONTEXT.json 整理 + main 同期) |
| `cleanup-worktree` | worktree | `--worktree <p>` | worktree 除去 + branch 削除 + auto-checkpoint stash drop + CONTEXT.json 整理 + main 同期 (fail-loud)。`--no-cleanup` で ship した場合に別途呼び出し |

### AI 実行シーケンス — Mode A (Staged 隔離)

各応答が `ok: false` ならば即時中断 + エラー報告 + `finalize` 呼び出し。

```bash
OPS="node .claude/scripts/create-pr/ops.mjs"

$OPS init                                             # Step 1
$OPS isolate --branch "$BRANCH"                       # Step 2 (AI が BRANCH を決定)
$OPS commit --message "$MSG"                          # Step 3 (必要時に --files で複数回)
$OPS ship-feature --title "$FT" --body "$FB"          # Step 4 (CI 完了まで最大 5分待機)
$OPS finalize                                         # Step 5
# → finalize の sync_status !== 'synced' の場合は追加措置が必要
#   (local_changes: dirty main → 手動で commit/stash させた後に再試行)
```

### AI 実行シーケンス — Mode B (Worktree, feature-pilot 連動)

`.worktrees/<branch>` で作業した機能を PR に出して整理する際に使用。PLAN.md チェックボックス検証の後に進行。

> **PLAN.md キャンセル項目の処理**: 空のチェックボックス (`- [ ]`) に `(キャンセル済み)` / `(dropped)` / `~~取り消し線~~` マーカーがあれば無視して通過。コードブロック (```` ``` ````) と HTML コメント (`<!-- -->`) 内のチェックリストは自動的に strip され、false positive を防止。`--force` / `--force-plan` で強制的に迂回可能。

```bash
OPS="node .claude/scripts/create-pr/ops.mjs"
WT_PATH=".worktrees/feature/add-login"

# 1. PLAN.md 検証 (選択、ship-worktree 内部でも自動検証)
$OPS verify-plan --worktree "$WT_PATH"

# 2. 品質検査およびコミット (必須: ship-worktree は uncommitted 変更があれば commit_required エラー)
# cd $WT_PATH && $QUALITY_GATE_CMD && git add . && git commit -m "..." && cd -
#   ($QUALITY_GATE_CMD = project-config.json#commands.quality_gate, null ならスキップ — R-CM-009 Rule 3)

# 3. Push および PR 生成 (squash merge、既存の PR があればべき等再利用)
# オプション: --force-plan (PLAN 未完了迂回), --no-merge (PR のみ生成), --no-cleanup (自動 full cleanup opt-out)
# デフォルト値: マージ成功時に cleanup-worktree に委譲し、worktree・branch 除去 +
#         auto-checkpoint stash drop + CONTEXT.json 整理 + main 同期まで一括遂行
$OPS ship-worktree --worktree "$WT_PATH" --title "$FT" --body "$FB"

# 4. (--no-cleanup で ship した場合にのみ別途呼び出し) Worktree・branch・stash 整理 + CONTEXT.json + main 同期
$OPS cleanup-worktree --worktree "$WT_PATH"
```

AI 判断領域: BRANCH (Conventional Commits, 30文字以内)、コミットメッセージ、PR タイトル/本文、PLAN.md キャンセル項目の明示判断。

## フック連動 (commit-guard / destructive-git-guard)

`init` / `isolate` / `commit` が更新する `.tmp/create-pr-active` フラグ (mtime 基準 30分 freshness — ship-feature 5min polling + finalize 1min カバー) により、2つのフックが自動緩和:
- **commit-guard**: `/create-pr` 以外の直接の `git commit` / ブランチ生成を遮断 → フラグ freshness 時に通過
- **destructive-git-guard**: `git merge --ff-only` および `git worktree remove` のみ追加許容 (その他の破壊コマンドはフラグに関係なく遮断)
- `finalize` / `cleanup-worktree` 終了時にフラグを自動除去

**同時実行保護**: `init` 呼び出し時に 30秒以内に active flag があれば拒否。以前のセッションが完了していない状態での新規セッション進入を遮断してデータ損失を防止。

## Branch Completion Options

worktree 作業が終わったが PR、保管、廃棄のうちどの終了経路を選択すべきか決定する必要がある場合は `references/superpowers-branch-completion-options.md` を参照する。この reference は Superpowers の branch finishing UX を brief2dev Mode B と destructive guard ポリシーに合わせて再作成したものである。

## Not For / Boundaries

| 状況 | 処理 |
|---|---|
| feature ブランチで `init` 実行 | エラー (main のみ許容) |
| ローカル main が origin/main より **先行** | エラー (自動 push は意図しないコミット伝播の危険のため非活性) |
| ローカル main が origin/main より **遅延** | 警告、finalize が ff-merge で同期 |
| `gh` CLI 未認証 | エラー |
| `git fetch` 失敗 (オフライン) | 警告、フロー進行 |
| ship-worktree 時 PLAN.md 未完了 | エラー (`--force-plan` またはキャンセルマーカーで迂回) |
| ship-worktree 時 worktree に uncommitted 変更 | エラー (`code: "commit_required"`; 先に自身が作成した変更のみ commit) |
| PR 再生成 | べき等 (open PR 再利用 + title/body アップデート) |
| BLOCKED/BEHIND mergeStateStatus | `pending: true` 返却 (graceful — エラーではない) |
| 他の create-pr セッション進行中 | `init` 拒否 (30分 mtime チェック — ship-feature 5min polling + finalize 1min 安全) |

**扱わない範囲**: 品質ゲート (CI 担当、brief2dev は `init` が q.ci-mirror 自動実行) · hotfix · rebase フロー (squash 固定) · 衝突自動解決 · multi-repo・サブモジュール · マルチバージョンリリース (GitHub Flow 単一ブランチ) · オリジナル unstaged/untracked の worktree 移住

## Pre-flight Checklist

| ID | 項目 | 必須 | 担当 |
|----|------|------|------|
| PF-001 | init: main 最新性 + staged 存在 + 機密ファイル遮断 + gh auth + 同時実行保護 (30min flag mtime) | ✅ | ops.mjs |
| PF-002 | init: CI Mirror Gate (make q.ci-mirror, 60min stamp freshness) | ✅ | ops.mjs |
| PF-003 | ship-worktree: PLAN.md 検証 + committed/clean worktree 検査 (`commit_required`) | ✅ | ops.mjs |

## Post-flight Checklist

| ID | 項目 | 必須 |
|----|------|------|
| POF-001 | ship-feature 完了 (`merged === true` または `pending === true` graceful) | ✅ |
| POF-002 | finalize 完了 (`sync_status === 'synced'` または意図された fail-loud 応答) | ✅ |
| POF-003 | cleanup-worktree 完了時に `sync_status === 'synced'` または意図された fail-loud 応答 (`local_changes`/`ff_failed`/`fetch_failed`) | ✅ |

## Maintenance

- **Boundary (R-CM-028)**: boundary-uniform — 本スキルは観点 1 (brief2dev 自体のガバナンス/ルール/スキル/hook 変更) + 観点 2 (scaffold 内部の feature/bug-fix) の両方で同一の意味で使用。main + worktree-aware 分岐はコードレベル (commit-guard / destructive-git-guard) で自動処理され、両観点ともに同一のフロー (init/isolate/commit/ship/finalize) に従う。分岐メカニズムは不要。
- **Sources**: R-CM-008 (git-workflow), R-CM-010 (verification-before-completion, fail-loud セマンティクス), R-CM-028 (two-perspective-boundary), `git-worktree(1)`, GitHub REST `PUT /repos/{owner}/{repo}/pulls/{n}/merge`
- **関連スクリプト**: `.claude/scripts/create-pr/ops.mjs` — 8コマンド統合実行エンジン
- **関連フック**: `.cli/hooks/commit-guard.mjs`, `.cli/hooks/destructive-git-guard.mjs`
- **テスト**: `tests/unit/create-pr-ops.test.mjs` (verify-plan + 応答契約), `tests/unit/create-pr-spec.test.mjs` (PLAN.md パーサー + parseArgs + finalize 状態マシン + scope-aware gate + 同時実行保護などの fragile 領域の隔離検証)
- **Known limits**: `git merge --ff-only` は実行中の remote 変更時に失敗 (`sync_status: ff_failed`) · dirty main は同期せずに中断 (`sync_status: local_changes`) — ユーザーが手動で commit/stash させた後に再試行 (次の worktree-new の fetch+ff が self-heal) · BLOCKED/BEHIND mergeStateStatus 時に `pending` 返却 — AI が CI 通過後に再試行または手動マージ · multi-commit は `commit --files` 手動分割 · `--key=value` 形式は未サポート (すべてのコマンドで `--key value` 形式を使用)
- **Last updated**: 2026-05-14
