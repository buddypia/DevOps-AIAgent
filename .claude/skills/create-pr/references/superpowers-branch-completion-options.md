# Superpowers Branch Completion Options

> Source: `oss/superpowers/skills/finishing-a-development-branch/SKILL.md`
> Adaptation: brief2dev `create-pr` Mode B に合わせて終了選択原則のみ吸収。元のスキルの local merge/discard 手順は直接配布しない。

## Core Principle

開発 branch の完了は「作業終了」ではなく統合意思決定である。検証結果を先に確認し、その後ユーザーが選択できる終了経路を明確に提示する。

## Completion Options

| Option | brief2dev action | Worktree handling | Safety rule |
|--------|------------------|-------------------|-------------|
| PR 生成 | `create-pr ship-worktree` | 自動整理 (デフォルト値)、`--no-cleanup` で保存を選択 | uncommitted changes があれば中断 |
| ローカルマージ | `create-pr` 自動化外の高リスク作業 | マージ後に別途 cleanup 必要 | main sync と q.check 再検証前の完了主張禁止 |
| 保管 | 自動整理を一切行わない | worktree 維持 | `PLAN.md` に paused/next action 明示 |
| 廃棄 | destructive 作業 | worktree/branch 削除 | ユーザーの typed confirmation 必要 |

## Before Presenting Options

1. 現在の branch と worktree path を確認する。
2. `PLAN.md` に未完了のチェックボックスがあるか確認する。
3. 変更がコミットされたか確認する。
4. 最新の verification evidence を確認する。
5. base branch が `main` であるか、または別の base が必要であるかを明示する。

## Recommended Prompt Shape

brief2dev では元の4オプションをそのまま使用するよりも、現在の自動化に適合した選択肢のみを露出する。

```text
現在の worktree は検証された状態です。以下から選択できます。

1. PR 生成: create-pr Mode B で push + PR 生成
2. 保管: worktree と branch をそのまま維持し、PLAN.md handoff のみ残す
3. 廃棄: typed confirmation の後に worktree/branch 削除

ローカル main マージが必要な場合は、別途の要求で処理します。
```

## Do Not

- テストや `PLAN.md` 確認なしに完了オプションを提示しない。
- PR 生成後の自動 cleanup をデフォルト値としない。
- discard を暗黙的に実行しない。
- `git reset --hard`, `git clean`, `git checkout --` で整理しない。

## Mapping To Existing Automation

| Superpowers 元 | brief2dev マッピング |
|------------------|----------------|
| verify tests | `make q.check`、`npm run validate`、または作業別の proving command |
| push and create PR | `node .claude/scripts/create-pr/ops.mjs ship-worktree ...` |
| keep branch as-is | worktree 保存 + `PLAN.md` handoff |
| discard | ユーザーの typed confirmation 後、destructive guard 規則の中で処理 |
