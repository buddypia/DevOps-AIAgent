# Superpowers Controller Verification For SDD

> Source: `oss/superpowers/skills/subagent-driven-development/SKILL.md`, `oss/superpowers/skills/verification-before-completion/SKILL.md`
> Adaptation: brief2dev `feature-implementer` SDDモードにcontroller-side verificationのみを吸収。Subagent実行エンジンは新規デプロイしない。

## Core Principle

Subagentの`DONE`報告は証拠ではなく検証対象である。Controllerは次のtaskに進む前に、変更範囲、spec compliance、quality review、command outputを直接確認する。

## Required Controller Checks

| 段階 | 確認内容 |
|------|------|
| 1. Report parse | Statusが`DONE`、`DONE_WITH_CONCERNS`、`BLOCKED`、`NEEDS_CONTEXT`のいずれかであるかを確認 |
| 2. Diff check | 報告されたchanged filesと実際の`git diff --name-only`が一致するかを確認 |
| 3. Spec review | SPEC/PLANのtask要求と実装diffを照合 |
| 4. Quality review | code quality reviewerがCritical/Importantなしで承認したかを確認 |
| 5. Fresh verification | subagentが実行したというcommandをcontrollerが必要な範囲で再確認 |
| 6. Handoff update | PLANまたはCONTEXT状態を最新に更新 |

## Status Handling

| Status | Controller action |
|--------|-------------------|
| `DONE` | diffとverificationを確認した後、review段階に進む |
| `DONE_WITH_CONCERNS` | 懸念がcorrectness/scopeであればreview前に解決 |
| `NEEDS_CONTEXT` | 欠落しているcontextを提供し、同じtaskを再ディスパッチ |
| `BLOCKED` | context不足、モデルの限界、task過大、plan誤りのいずれかに分類し、ユーザーまたは上位skillにエスカレーション |

## Anti-Patterns

| Anti-Pattern | 問題点 |
|--------------|------|
| DONE報告だけを見て次のtaskに進む | 要求の欠落とhidden failureを見逃す。 |
| spec reviewとquality reviewを統合する | 「要求充足」と「良いコード」が混ざりtriageが曖昧になる。 |
| subagent outputのtest passをそのまま信頼する | 実行環境、branch、command scopeが異なる可能性がある。 |
| 同じファイルを並列workerに割り当てる | 衝突とsilent overwriteのリスクが高まる。 |

## brief2dev Usage

`feature-implementer`のSDDモードで、taskごとの実装が終わるたびにこのreferenceを読む。並列workerを運用する場合はworkerごとのwrite setを分離し、controllerが最終diffとverification evidenceを集めて完了主張を行う。
