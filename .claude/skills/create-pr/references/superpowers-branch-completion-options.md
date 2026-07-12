# Superpowers Branch Completion Options

> Source: `oss/superpowers/skills/finishing-a-development-branch/SKILL.md`
> Adaptation: brief2dev `create-pr` Mode Bに合わせ終了選択の原則のみを吸収。原本skillのlocal merge/discard手順は直接配布しない。

## Core Principle

開発branchの完了は「作業終了」ではなく統合意思決定である。検証結果をまず確認し、その後ユーザーが選択できる終了経路を明確に提示する。

## Completion Options

| Option | brief2dev action | Worktree handling | Safety rule |
|--------|------------------|-------------------|-------------|
| PR生成 | `create-pr ship-worktree` | 自動整理(デフォルト)、`--no-cleanup`で保存選択 | uncommitted changesがあれば中断 |
| ローカルマージ | `create-pr`自動化外の高リスク作業 | マージ後別途cleanup必要 | main syncとq.check再検証前の完了主張禁止 |
| 保管 | 自動整理を一切行わない | worktree維持 | `PLAN.md`にpaused/next actionを明記 |
| 破棄 | destructive作業 | worktree/branch削除 | ユーザーのtyped confirmationが必要 |

## Before Presenting Options

1. 現在のbranchとworktree pathを確認する。
2. `PLAN.md`に未完了チェックボックスがあるか確認する。
3. 変更がコミットされているか確認する。
4. 最新のverification evidenceを確認する。
5. base branchが`main`か、または別のbaseが必要かを明示する。

## Recommended Prompt Shape

brief2devでは原本の4オプションをそのまま使うより、現在の自動化に合った選択肢のみを提示する。

```text
現在のworktreeは検証済みの状態です。以下から選択できます。

1. PR生成: create-pr Mode Bでpush + PR生成
2. 保管: worktreeとbranchをそのまま維持し、PLAN.md handoffのみ残す
3. 破棄: typed confirmation後にworktree/branch削除

ローカルmainマージが必要な場合は別途要求で処理します。
```

## Do Not

- テストや`PLAN.md`確認なしに完了オプションを提示しない。
- PR生成後の自動cleanupをデフォルト値としない。
- discardを暗黙的に実行しない。
- `git reset --hard`, `git clean`, `git checkout --`で整理しない。

## Mapping To Existing Automation

| Superpowers原本 | brief2devマッピング |
|------------------|----------------|
| verify tests | `make q.check`, `npm run validate`, または作業別proving command |
| push and create PR | `node .claude/scripts/create-pr/ops.mjs ship-worktree ...` |
| keep branch as-is | worktree保存 + `PLAN.md` handoff |
| discard | ユーザーtyped confirmation後、destructive guardルール内で処理 |
