# Git Workflow Rules

## ID: R-CM-008
## Severity: critical
## Enforced by: commit-guard（本プロジェクトでは未配備 — prompt-level）, destructive-git-guard

### Rules

1. **コミットメッセージ**: Conventional Commits 形式 (feat:, fix:, refactor:, docs:, test:, chore:)
2. **コミット単位**: 論理的に独立した変更単位。1つのコミットに複数機能を混在させることは禁止
3. **Force Push 禁止**: main/master ブランチへの force push は絶対禁止 (destructive-git-guard)
4. **ブランチ戦略**: feature/ → main (GitHub Flow)。Feature PR は squash merge で main に直接統合。develop ブランチなし。根拠: Git Flow 原作者 Vincent Driessen 2020 note — continuous delivery チームは GitHub Flow 推奨。
5. **破壊的 Git コマンドのブロック**: reset --hard, checkout ., clean -f, stash clear, push --force, rebase などを destructive-git-guard がブロックする。(ユーザー決定 2026-06-06 — `git branch -D` はブロック対象から除外: 未マージ branch の強制削除を許可。remote main の削除は git-push-redirect が別途ブロック。)
6. **AI commit ポリシー (worktree-aware)**: AI の git commit は以下のポリシーで commit-guard が自動的に強制する。*(brief2dev 生成器固有の運用。本プロジェクトでは未導入 — 参考情報)*
   - **main 直接 commit ブロック**: マルチターミナル同時作業時のコード競合を回避。worktree ブランチ内では commit を許可。**AI 呼び出し時は `git -C <worktree-path>` を明示することを推奨** — chained `cd .worktrees/<br> && git commit` は hook 評価時点の cwd が main と認識されてブロックされる罠を回避 (P0 cluster PR 3 事例、ユーザー決定 2026-05-23 — learnings `git-bash-needs-explicit-git-C`)。
   - **`git commit --amend` は常にブロック**: マルチターミナルでの push 競合 + history rewrite リスク。メッセージ修正は `reset --soft HEAD~1 + 新規 commit` または新規 commit で訂正する。
   - **ブランチ生成のブロック**: `git checkout -b`, `git switch -c`, `git branch <name>` をブロック。代わりに **標準エントリポイント** `make wt.new BR=feature/<task>` (または `node .claude/scripts/worktree-new.mjs --branch feature/<task>`) を使用 — fetch + ff main + add origin/main を基準として stale base の罠をブロックする。CLI agnostic (Claude/Codex/Gemini 共通)。
   - **`/create-pr` 進行中の例外**: `.tmp/create-pr-active` ファイルが存在する場合は commit + branch create を許可 (ただし amend は常にブロック)。`/create-pr` 使用時は feature ブランチ + commit + PR + squash merge を自動処理する。
   - **`git commit --dry-run` は許可**: 検証用であり実際の commit ではないため。
7. **stash 安全ポリシー (ユーザー決定 2026-05-18 — clear-only 緩和)**: AI の `git stash clear` のみがブロックされる。すべての stash entry を一括削除し reflog なしでは復旧不可能なためである。`git stash push` / `git stash save` / 引数なしの `git stash` / `git stash drop` / `apply` / `pop` / `list` / `show` / `branch` はすべて許可する。以前の push/save/no-arg ブロック (マルチターミナルでの untracked 損失の懸念) は、ユーザー判断で stash の活用性を優先して解除された。drop (単一 entry) は許可するが clear (全体一括) のみをブロックし、誤操作時の被害範囲を制限する。*(brief2dev 生成器固有の運用。本プロジェクトでは未導入 — 参考情報)*
8. **.gitignore 必須**: .env, node_modules, .DS_Store, ビルド成果物などを追跡対象から除外
9. **Multi-worktree superset 検知 (ユーザー決定 2026-05-14)**: AI が同時に複数の worktree を `.worktrees/` に生成して進める環境において、あるセッションが別セッションの commit を superset として squash merge すると、後者の worktree が意味を失い silently に吸収される。本ルールは `ops.mjs#shipWorktree` の fetch 直後 (merge 前) に `detectExternalSupersetRisk()` を実行し、以下を検知する。*(brief2dev 生成器固有の運用。本プロジェクトでは未導入 — 参考情報)*
   - 当該 worktree の変更ファイル set (`git diff origin/main..HEAD --name-only`)
   - origin/main の直近 24h commit が触れたファイル set (単一の `git log origin/main --since=24h.ago --name-only --format="%H %s"` 呼び出し、blank-line block separator で commit ごとのファイル list をパース — N+1 child process spawn を回避)
   - 2つの set の intersection が 1+ の場合、ship-worktree response の `warnings[]` 配列に superset 危険項目を追加
   - **ブロックしない (Reversible default)**: ユーザーが意図的な fix または merge conflict resolution を進めることが可能。AI は warnings を認識した後、ユーザーに明示的な reconcile を案内しなければならない (R-CM-016 Rule 10 User Sovereignty と整合)。
   - **fail-open**: git コマンド失敗時は silent skip (R-CM-006 Rule 2 と整合)。
   - **回帰ブロック**: `tests/unit/create-pr-superset-detection.test.mjs` が detection function の stub gitFn で file overlap / no-overlap / 24h window edge / 空 input edge を検証する。
