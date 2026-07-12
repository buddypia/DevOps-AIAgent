---
name: create-pr
model: sonnet
effort: low
description: "Worktree隔離GitHub Flow (8コマンド、v2応答契約)。Mode A (staged隔離 → Feature PR → main同期) + Mode B (PLAN.md基盤worktree配備)。unstaged/untrackedはstashバックアップで100%保全。"
argument-hint: "[追加指示事項 (任意)]"
---

## `/create-pr` — Worktree隔離GitHub Flow

AIが並行して行った変更をFeature PR → main同期まで自動実行。2つのモードをサポート、質問なしで自動進行。

> **推奨 (強制ではない)**: 本スキル呼び出し直前、変更サイズに応じて`/pre-ship-quality-advisor`の実行を推奨する。`/code-review --fix` (Claude Code, simplification + correctness優先) / `code-standards-aligner` (ポータブルfallback) / final-review (全PR) / `/code-review high` (substantial変更のreview-only correctness verdictオプション) のツール優先順位とマニュアルチェックリストを提案。他のCLI (Gemini CLI, Codexなど) 環境でもマニュアルチェックリストへfallback動作。

### 核心不変式 + 禁止事項

**不変式**: unstaged/untrackedは実行前後で完全に同一である。
- Mode A Phase 1: worktree隔離 → 元のHEAD不変
- Mode A Phase 2: dirty mainは自動stashせずsyncを中断(`sync_status: local_changes`)する。元のworking treeには触れず、ユーザーが手動でcommit/stash後に再試行する。

**Worktree Commit Requirement**: Mode B `ship-worktree` はdirty worktreeを配備しない。
- PR生成/マージ前に`git status --porcelain --untracked-files=all`がcleanである必要がある。
- uncommitted tracked/untracked変更があると`code: "commit_required"`で失敗する。
- AIは自分が作成したファイルのみをstage/commitした後、`ship-worktree`を再実行する。
- ユーザーが明示的にWIP保存/コミット禁止を要求した場合は、`ship-worktree`の代わりに作業状態を報告し中断する。

**禁止**: 元のworking tree修正・`git reset --hard`・`git checkout .`・`git restore .`・`git clean -f`・`git stash clear` (R-CM-008 Rule 7 — clearのみ遮断、それ以外のstashは許容)・`--force` push・main削除・競合自動解決

### v2応答契約 (全コマンド共通)

```jsonc
{
  "ok": true | false,
  "mode": "staged" | "worktree" | null,    // AI分岐指標
  "command": "init" | "verify-plan" ...,
  "sync_status"?: "synced" | "fetch_failed" | "local_changes" | "ff_failed",
  "changed_files"?: ["a.md", "b/c.mjs"],   // ship-feature/ship-worktreeマージ成功時
  "changed_files_tree"?: "└── ...",         // 人間用markdown box-drawingツリー
  "completion_report_markdown"?: "# PR承認後完了報告\n...", // ship-worktree承認後のユーザー報告テンプレート
  "warnings"?: ["..."],
  "error"?: "...",     // ok:false時
  "hint"?: "..."       // ok:false時の復旧案内
}
```

**fail-loud意味論** (R-CM-010整合): `finalize`/`cleanup-worktree`のfetch/local_changes/ff失敗は`ok:false` + `sync_status`。silent warningではない。dirty mainは`sync_status: local_changes`で中断し、元のworking treeには触れない。

**Post-mergeツリー報告義務 (`changed_files_tree`)**: `ship-feature` / `ship-worktree` が `merged: true` を応答する際、`changed_files` (pathの配列) + `changed_files_tree` (markdown box-drawingツリー) の2フィールドを含む。AIはマージ報告直後に`changed_files_tree`フィールドの値を**ユーザーにそのまま出力**し、どのファイルがマージされたかを認知可能にする。gh呼び出し失敗時は`changed_files: []` + `changed_files_tree: "(no files)"` (silent fail-open — 核心マージ結果への影響なし)。

**承認後完了報告義務 (`completion_report_markdown`)**: `ship-worktree` はPR/cleanup後に `completion_report_markdown` フィールドを含む。AIはユーザー承認後にshipを実行した場合、このフィールドをユーザーに出力しなければならない。生成SSOTは`.cli/lib/worktree-ship-report.mjs#buildPostApprovalCompletionReport`であり、PR URL/merge commit/CI status、cleanup状況、反映ファイルtree、残対応、問題/改善メモを含む。

### ops.mjs使用

```
node .claude/scripts/create-pr/ops.mjs <command> [--key value ...]
```

設定: `.claude/skills/create-pr/config.json` — `github_account`, `base_branch`(デフォルト `main`), `enforce_ssh_remote`(デフォルト false)。ops.mjsが`gh auth token -u`で`GH_TOKEN`を自動注入。

| コマンド | Mode | 引数 | 役割 |
|---|---|---|---|
| `init` | staged | — | base確認 + 同時実行保護(30min mtime) + CI Mirror Gate(60min stamp) + staged抽出 + 機密遮断 + gh auth |
| `isolate` | staged | `--branch <b>` | worktree + featureブランチ作成 + staged `apply --index` |
| `commit` | staged | `--message <m> [--files <f1,f2>]` | worktree内コミット |
| `ship-feature` | staged | `--title <t> [--body <b>] [--no-merge]` | push → 冪等PR → squash merge → remoteブランチ削除 |
| `finalize` | staged | — | worktree削除 + 元のmain同期 (dirty時abort, fail-loud) |
| `verify-plan` | worktree | `--worktree <p> [--force]` | PLAN.md未完了チェックボックス検証 (コードブロック/HTMLコメントstrip、取消マーカー認識) |
| `ship-worktree` | worktree | `--worktree <p> --title <t> [--body <b>] [--force-plan] [--no-merge] [--no-cleanup]` | PLAN.md検証 + committed/clean worktree検証 + push + 冪等PR + auto full cleanup (デフォルト値 — `cleanup-worktree`委譲: worktree・branch削除 + auto-checkpoint stash drop + CONTEXT.json整理 + main同期) |
| `cleanup-worktree` | worktree | `--worktree <p>` | worktree削除 + branch削除 + auto-checkpoint stash drop + CONTEXT.json整理 + main同期 (fail-loud)。`--no-cleanup`でshipした場合は別途呼び出し |

### AI実行シーケンス — Mode A (Staged隔離)

各応答が`ok: false`なら即座に中断 + エラー報告 + `finalize`呼び出し。

```bash
OPS="node .claude/scripts/create-pr/ops.mjs"

$OPS init                                             # Step 1
$OPS isolate --branch "$BRANCH"                       # Step 2 (AIがBRANCHを決定)
$OPS commit --message "$MSG"                          # Step 3 (必要に応じて--filesで複数回)
$OPS ship-feature --title "$FT" --body "$FB"          # Step 4 (CI完了まで最大5分待機)
$OPS finalize                                         # Step 5
# → finalizeのsync_status !== 'synced' なら追加対応が必要
#   (local_changes: dirty main → 手動commit/stash後に再試行)
```

### AI実行シーケンス — Mode B (Worktree, feature-pilot連携)

`.worktrees/<branch>` で作業した機能をPRとして出し整理する際に使用。PLAN.mdチェックボックス検証後に進行。

> **PLAN.md取消項目の処理**: 空チェックボックス(`- [ ]`)に`(取消済み)` / `(dropped)` / `~~取消線~~`マーカーがあれば無視して通過。コードブロック(```` ``` ````)とHTMLコメント(`<!-- -->`)内のチェックリストは自動stripされfalse positiveを防止。`--force` / `--force-plan`で強制迂回可能。

```bash
OPS="node .claude/scripts/create-pr/ops.mjs"
WT_PATH=".worktrees/feature/add-login"

# 1. PLAN.md検証 (任意、ship-worktree内部でも自動検証)
$OPS verify-plan --worktree "$WT_PATH"

# 2. 品質検査およびコミット (必須: ship-worktreeはuncommitted変更があるとcommit_requiredエラー)
# cd $WT_PATH && $QUALITY_GATE_CMD && git add . && git commit -m "..." && cd -
#   ($QUALITY_GATE_CMD = project-config.json#commands.quality_gate、nullならスキップ — R-CM-009 Rule 3)

# 3. PushおよびPR生成 (squash merge、既存PRがあれば冪等再利用)
# オプション: --force-plan (PLAN未完了迂回), --no-merge (PRのみ生成), --no-cleanup (auto full cleanup opt-out)
# デフォルト値: マージ成功時にcleanup-worktreeへ委譲しworktree・branch削除 +
#         auto-checkpoint stash drop + CONTEXT.json整理 + main同期まで一括実行
$OPS ship-worktree --worktree "$WT_PATH" --title "$FT" --body "$FB"

# 4. (--no-cleanupでshipした場合のみ別途呼び出し) Worktree・branch・stash整理 + CONTEXT.json + main同期
$OPS cleanup-worktree --worktree "$WT_PATH"
```

AI判断領域: BRANCH(Conventional Commits, 30文字以内), コミットメッセージ, PRタイトル/本文, PLAN.md取消項目の明示判断。

## フック連携 (commit-guard / destructive-git-guard)

`init` / `isolate` / `commit` が更新する`.tmp/create-pr-active`フラグ(mtime基準30分freshness — ship-feature 5min polling + finalize 1minカバー)で2つのフックが自動緩和:
- **commit-guard**: `/create-pr`以外の直接`git commit` / ブランチ作成を遮断 → フラグfreshness時は通過
- **destructive-git-guard**: `git merge --ff-only`および`git worktree remove`のみ追加許可 (それ以外の破壊コマンドはフラグ無関係に遮断)
- `finalize` / `cleanup-worktree`終了時にフラグ自動削除

**同時実行保護**: `init`呼び出し時、30秒以内にactive flagがあれば拒否。前セッションが完了していない状態での新セッション進入を遮断しデータ損失を防止。

## Branch Completion Options

worktree作業は終わったが、PR、保管、破棄のうちどの終了経路を選ぶか決める必要がある場合は、`references/superpowers-branch-completion-options.md`を参照する。このreferenceはSuperpowersのbranch finishing UXをbrief2dev Mode Bとdestructive guardポリシーに合わせて再構成したものである。

## Not For / Boundaries

| 状況 | 処理 |
|---|---|
| featureブランチで`init`実行 | エラー (mainのみ許可) |
| ローカルmainがorigin/mainより**先行** | エラー (自動pushは意図しないcommit伝播リスクのため無効化) |
| ローカルmainがorigin/mainより**遅延** | 警告、finalizeがff-mergeで同期 |
| `gh` CLI未認証 | エラー |
| `git fetch`失敗 (オフライン) | 警告、フロー進行 |
| ship-worktree時にPLAN.md未完了 | エラー (`--force-plan`または取消マーカーで迂回) |
| ship-worktree時にworktreeにuncommitted変更 | エラー (`code: "commit_required"`; まず自分の変更のみcommit) |
| PR再生成 | 冪等 (open PR再利用 + title/body更新) |
| BLOCKED/BEHIND mergeStateStatus | `pending: true`返却 (graceful — エラーではない) |
| 他のcreate-prセッション進行中 | `init`拒否 (30分mtimeチェック — ship-feature 5min polling + finalize 1min安全) |

**扱わない範囲**: 品質ゲート(CI担当、brief2devは`init`がq.ci-mirrorを自動実行)・hotfix・rebaseフロー(squash固定)・競合自動解決・multi-repo・サブモジュール・複数バージョンリリース(GitHub Flow単一ブランチ)・元のunstaged/untrackedのworktree移住

## Pre-flight Checklist

| ID | 項目 | 必須 | 担当 |
|----|------|------|------|
| PF-001 | init: main最新性 + staged存在 + 機密ファイル遮断 + gh auth + 同時実行保護 (30min flag mtime) | ✅ | ops.mjs |
| PF-002 | init: CI Mirror Gate (make q.ci-mirror, 60min stamp freshness) | ✅ | ops.mjs |
| PF-003 | ship-worktree: PLAN.md検証 + committed/clean worktree検査 (`commit_required`) | ✅ | ops.mjs |

## Post-flight Checklist

| ID | 項目 | 必須 |
|----|------|------|
| POF-001 | ship-feature完了 (`merged === true` または `pending === true` graceful) | ✅ |
| POF-002 | finalize完了 (`sync_status === 'synced'` または意図されたfail-loud応答) | ✅ |
| POF-003 | cleanup-worktree完了時`sync_status === 'synced'`または意図されたfail-loud応答 (`local_changes`/`ff_failed`/`fetch_failed`) | ✅ |

## Maintenance

- **Boundary (R-CM-028)**: boundary-uniform — 本スキルは観点1 (brief2dev自体のガバナンス/ルール/スキル/フック変更) + 観点2 (scaffold内部feature/bug-fix) 両方で同一の意味で使用。main + worktree-aware分岐はコードレベル (commit-guard / destructive-git-guard) で自動処理され、両観点とも同じフロー (init/isolate/commit/ship/finalize) に従う。分岐メカニズム不要。
- **Sources**: R-CM-008 (git-workflow), R-CM-010 (verification-before-completion, fail-loud意味論), R-CM-028 (two-perspective-boundary), `git-worktree(1)`, GitHub REST `PUT /repos/{owner}/{repo}/pulls/{n}/merge`
- **関連スクリプト**: `.claude/scripts/create-pr/ops.mjs` — 8コマンド統合実行エンジン
- **関連フック**: `.cli/hooks/commit-guard.mjs`, `.cli/hooks/destructive-git-guard.mjs`
- **テスト**: `tests/unit/create-pr-ops.test.mjs` (verify-plan + 応答契約), `tests/unit/create-pr-spec.test.mjs` (PLAN.mdパーサー + parseArgs + finalize状態マシン + scope-aware gate + 同時実行保護などfragile領域隔離検証)
- **Known limits**: `git merge --ff-only`は実行中にremoteが変更されると失敗 (`sync_status: ff_failed`)・dirty mainは同期せず中断 (`sync_status: local_changes`) — ユーザーが手動commit/stash後に再試行 (次のworktree-newのfetch+ffがself-heal)・BLOCKED/BEHIND mergeStateStatus時は`pending`返却 — AIがCI通過後に再試行または手動マージ・multi-commitは`commit --files`手動分割・`--key=value`形式未対応 (全コマンド`--key value`形式使用)
- **Last updated**: 2026-05-14
