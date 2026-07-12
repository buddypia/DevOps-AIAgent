---
name: feature-implementer
description: SPEC.mdとScreen文書を入力として、TDD方式で実際のコードを実装するスキル。feature-spec-generatorとreadiness-gateの間で「実装実行者（Executor）」の役割を担う。
---

# Feature Implementer

`feature-implementer`は、`feature-spec-generator`が作成した実装契約を実際のコードとテストに変換する実行者である。アクティブなドキュメントにはAIが作業中に必ず維持すべき最小限の契約のみを含み、長いテンプレートや詳細な例は`references/implementation-protocol-details.md`で必要な時だけ読む。

## 役割分担

| スキル | 責務 | Output |
| --- | --- | --- |
| `feature-architect` | 意図確定、コンテキスト収集 | `CONTEXT.json` |
| `feature-spec-generator` | 要求を実装可能な契約に変換 | `SPEC.md`, `screens/*.md` |
| `feature-implementer` | SPECをTDDで実装 | `{FEATURES_DIR}/**/*`, `{TESTS_DIR}/**/*.test.*` |
| `feature-wiring` | Export、ルート、データフロー統合検証 | Go/No-Go判定 |

## Path Contract

ファイル操作前に`project-config.json`を読み、動的パスを解決する。存在しない場合は以下のデフォルト値を使用するが、生成コードとコマンドには解決済みの値を使用する。

| Placeholder | Resolution Source | Default |
| --- | --- | --- |
| `{FEATURES_DIR}` | `project-config.paths.features` | `src/features` |
| `{TESTS_DIR}` | `project-config.paths.tests_unit` | `tests/unit` |
| `{COMPONENT_EXT}` | `project-config.conventions.component_extension` | `.tsx` |
| `{FEATURE_LAYERS}` | `project-config.conventions.feature_structure` | `["types","api","hooks","components"]` |

リテラルの`src/features/`、`tests/unit/`に固定して設計しない。パスがSPEC、`project-config.json`、既存コードと衝突する場合は実装を止めて衝突を報告する。

## Phase 0: Pre-Validation

実装開始前に、以下の順序でコンテキストを固定する。

1. `CLAUDE.md`のアーキテクチャ概要、Feature-First依存関係ルール、テスト/品質コマンドを確認する。
2. 対象の`SPEC.md`と`screens/*.md`を読み、`## 0. AI実装契約`、`## 2. 機能要件`、`## 3. 依存関係とリスク`が十分かを確認する。
3. `CONTEXT.json`のHard Constraints、Soft Constraints、現在の状態、worktree情報を確認する。
4. UI機能の場合はルートの`DESIGN.md`を先に読み、派生トークン（`docs/design/tokens/`）とページオーバーライド（`docs/design/pages/{page}.md`）を確認する。
5. UI機能の場合は`docs/ui-flow/ui-flow.json`とSPECのUI Flow Contractを照合する。
6. 実装するコードパスとユーザーフローを、Test Coverage Diagram（`references/test-coverage-diagram-template.md`）基準で先にマッピングする。
7. `PLAN.md`にTask Identity Contractがある場合は、ファイル/行の指示よりもCurrent Behavior / Desired Behavior / Out of Scope / Context Authorityを優先する。コードが計画のファイル指示と異なっている場合は、実装前に計画を更新するか上位スキルに差し戻す。
8. `PLAN.contract.json`がある場合は`make q.engineering-plan-contract`で先に検証する。存在せず`PLAN.md`にFailure Modes Registryがある場合は、上位スキルに差し戻すか同じディレクトリに`PLAN.contract.json`を補強した後、各Failure Modeがテスト計画（Red段階）に漏れなくマッピングされているかを確認する。

SPECのData Model、State/Hook、Error Handling、Target Files、AC/ECのうち実装に必要な項目が空の場合は、コード作成前に`feature-spec-generator`に差し戻す。

## Phase 1: Implementation Plan

SPEC `§0.1 Target Files`とFR一覧を基準に、小さな単位の実装順序を作成する。基本順序は`Type/Zod Schema -> API Layer -> Hook/State -> Component/Page -> Export/Wiring -> Tests`であり、実際の順序は既存コードの依存関係を優先する。

各FRごとに以下のチェックリストを維持し、項目が完了するたびに`[x]`に更新する。

```markdown
## FR-xxxxx

- [ ] Red: AC/ECおよびFailure Modes Registryに基づく失敗テストの作成と失敗確認
- [ ] Green: 通過に必要な最小実装
- [ ] Refactor: 重複/命名/エラー処理の整理
- [ ] Verify: project-config.json#commands.testに基づくテスト通過（nullの場合は動的検出）
- [ ] Verify: project-config.json#commands.quality_gateに基づく品質検証通過（nullの場合はスキップ）
- [ ] SPEC/CONTEXT.json進捗状態の更新
```

チェックリストの更新なしに次のFRへ進まない。

## Phase 2: Red-Green-Refactor

TDDの順序は固定である。

1. **Red**: SPECのAcceptance CriteriaとEdge Casesを先にテストとして作成し、失敗を確認する。
2. **Green**: テストを通過させる最小限のコードを実装する。SPECにない機能を追加しない。
3. **Refactor**: 既存のプロジェクトパターンに合わせて整理し、テストが引き続き通過するかを確認する。

必須ルール:

- `R-CM-011`: モック自体を検証しない。テスト専用メソッドや理解のないモッキングを作らない。
- `R-CM-010`: 完了主張前に検証コマンドと結果を残す。
- SPECがSingle Source of Truthである。データモデル、状態構造、エラー処理、AC、EC、実装ヒントはSPECに由来する。
- UIの色、タイポグラフィ、spacing、radius、component languageは`DESIGN.md`がSingle Source of Truthである。
- UIテキスト、ロギング、エラー処理、importの方式は既存のプロジェクトパターンに従う。

## Hard Constraints And Auto-Stop

`CONTEXT.json`のHard Constraintsはいかなる状況でも回避しない。以下の条件は即座に中断し、ユーザー確認または上位スキルへの差し戻しが必要である。

| 条件 | 対応 |
| --- | --- |
| SPEC必須契約が不完全 | `feature-spec-generator`に差し戻し |
| Hard Constraintsと実装要求の衝突 | 中断後、衝突を報告 |
| 認証・権限・決済・PII処理の修正 | ユーザー承認またはセキュリティレビュー要求 |
| 外部API契約と実際のコードの不一致 | 差異を報告しSPEC/API契約を再確認 |
| 既存の公開インターフェース変更が必要 | Soft Constraintの許可可否を確認 |
| テスト失敗の原因不明 | 原因分析後、停止して報告 |

オーバーエンジニアリング防止基準: 現在のFRのAC/EC、SPEC実装ヒント、既存パターンで説明できない抽象化や汎用化は追加しない。

## CONTEXT.json Update

実装開始時に`quick_resume.current_state`を`Implementing`に更新し、現在のFR、次のアクション、`last_updated_at`を残す。各FR完了時に`progress.fr_completed`、`fr_in_progress`、関連ファイル一覧を更新する。全体の実装完了時、次のアクションは`feature-wiring`と`feature-status-sync`とする。

作業が中断された場合は`status: paused`性質のhandoffを残し、次のAIセッションがSPEC、CONTEXT、PLAN、失敗した検証コマンドを即座に理解できるようにする。

## SDD Mode

`PLAN.md`があり独立タスクが3つ以上ある場合はSubagent-Driven Developmentを検討する。ただし、実装エージェントを並列ディスパッチして同一ファイルを同時に修正することはしない。

SDDの固定順序:

1. Implementerが1つのタスクを実行する。
2. Spec Compliance Reviewを先に実行する。
3. Specが通過した後、Code Quality Reviewを実行する。
4. Controllerがsubagentの`DONE`報告をそのまま信じず、diff、review結果、検証コマンドを再確認する。
5. 問題があれば同じ段階に戻し、修正後に再レビューする。

プロンプトと詳細な状態処理:

- `references/sdd-implementer-prompt.md`
- `references/sdd-spec-reviewer-prompt.md`
- `references/sdd-quality-reviewer-prompt.md`
- `references/gan-generator-evaluator-pattern.md`

## References

必要な時だけ読む。

| Reference | Use When |
| --- | --- |
| `references/implementation-protocol-details.md` | 従来の全体プロトコル、コードテンプレート、テスト作成例、エラーハンドリング表が必要な時 |
| `references/test-coverage-diagram-template.md` | TDD開始前に分岐、ユーザーフロー、エッジケースをマッピングする時 |
| `references/sdd-*.md` | SDDモードで下位の実装/レビュープロンプトが必要な時 |
| `references/superpowers-controller-verification.md` | SDD task完了報告後、controllerがdiff、review、verification evidenceを再確認する時 |
| `references/gan-generator-evaluator-pattern.md` | 生成者/評価者分離の原則を強化する時 |

## Not For / Boundaries

- バグ修正専用の作業: `bug-fix`
- 仕様変更のないリファクタリング: `de-sloppify`
- インフラ/デプロイの変更: `infra-designer`または`deploy`
- 単純なドキュメント同期: `sync-project-md`

## Maintenance

- Sources: TDD原則、SDDパターン、プロジェクトSPEC.md、CLAUDE.md
- Last updated: 2026-05-04
- Active budget target: 260 lines以下
