---
name: feature-spec-generator
description: ユーザーストーリー、Why、要件を入力として受け取り、実装可能なSPEC.mdとScreenドキュメントを生成するスキル。開発者の意図をAIが実装できる契約文書に変換する。
---

# Feature Spec Generator

> **Core concept**: 意図とCONTEXT.jsonを実装可能なSPEC/Screen契約に変換する。

このスキルは `feature-architect` が作成した `CONTEXT.json` を読み込み、AI実装者が推測なしで作業できる `SPEC-*.md` と、必要に応じて `screens/*.md` を作成する。長い質問リストとテンプレート例は必要な時だけreferenceを読む。

## Inputs

Required:

- 機能ID: 例 `001-user-dashboard`
- `docs/features/<id>/CONTEXT.json`

Optional:

- CONTEXTにない追加要件
- 追加の技術/ビジネス制約

このスキルは `CONTEXT.json` を生成しない。存在しない場合は `feature-architect` を先に実行する必要がある。

## Path Contract

ファイル作業前に `project-config.json` を読み、パスプレースホルダーを解決する。

| Placeholder | Resolution Source | Default |
|---|---|---|
| `{FEATURES_DIR}` | `project-config.paths.features` | `src/features` |
| `{DOCS_DIR}` | `project-config.paths.docs_features` | `docs/features` |
| `{COMPONENT_EXT}` | `project-config.conventions.component_extension` | `.tsx` |
| `{FEATURE_LAYERS}` | `project-config.conventions.feature_structure` | `["types","api","hooks","components"]` |

リテラルの `src/features/`、`src/shared/` をSPECの生成パスとして使わない。

## Protocol

### Phase 0: CONTEXT検証

必須確認:

- `feature_id`
- `title`
- `why`
- `quick_resume.current_state == "SpecDrafting"`
- `artifacts.brief` があればBRIEF.mdを読み、元の要求、User Stories、BDD AC、Scope、Constraintsを抽出する。

BRIEF.mdがなくても中断しない。ただし、意図追跡が制限される旨のwarningを残す。

### Phase 1: コンテキスト収集

読み取り専用で収集する。

| Source | Purpose |
|---|---|
| `CONTEXT.json.references` | 関連SPEC/code/API routeの候補 |
| 既存 `SPEC-*.md` | ローカル文書パターン |
| `{FEATURES_DIR}/<feature>/types` | TypeScript/Zodスキーマ |
| `{FEATURES_DIR}/<feature>/hooks`, `components`, `api` | 実装パターン |
| `DESIGN.md` | UI機能のデザイントークン/タイポグラフィ/コンポーネント言語のSSOT |
| `docs/ui-flow/ui-flow.json` | UI Flow Contract |
| `docs/features/<id>/design/` | Screen §13 Design Reference |

### Phase 2: 明確化

質問は最大7個。

- 1〜6個: 必要な質問だけ行う。
- 7個: 最後の質問の後、自律的に停止する。
- 7個超が必要な場合: デフォルト値を選択するか、Assumptionとして記録する。

Q&AはBRIEF.md Section 8 Clarification Logに記録する。詳細な質問カタログは必要な時に `references/spec-generation-protocol-details.md` を読む。

### Phase 3: SPEC生成

必須成果物:

- `docs/features/<id>/SPEC-<id>.md`
- UI機能の場合 `docs/features/<id>/screens/*.md`

生成原則:

- 保守的/拡張的アプローチの2案をまず提示し、選択を反映する。
- `feature_type` でScreenの要否を判定する。
- ユーザー向け機能はProduct Requirements §6.5を生成する。
- `ui_feature` は §1.5 UI Flow Contract を生成する。
- `ui_feature` は §0.9 Design Tokens に `DESIGN.md` の参照と使用するsemantic tokenの範囲を明示する。
- 空セクションは禁止。該当なしの場合は `N/A - 理由` を明示する。

SPECセクションの深さと必須セクションは `references/spec-sections.md` に従う。

### Phase 3.5: API Contract, Dependencies, NFR

常にAPI Contractセクションを作成する。

- API未使用: `N/A - クライアントサイドのみ`
- API 1〜2個: SPEC内に直接記述
- API 3個以上または複雑: `API-<id>.md` への分離要否をユーザーに確認

API使用時の必須項目:

- Method, Path, Auth
- Request Schema
- Response Schema
- Error Codes
- コードのZod/type定義と競合する場合はコード優先

Verified Dependencies:

- 外部API/SDK/サービスは `verified`、`verification_source`、`verified_at` を記録する。
- `verified=false` があればリスクセクションに未検証の外部依存を反映する。

NFR:

- パフォーマンス/応答時間
- 信頼性/リトライ
- AI/LLM使用時のコスト
- 標準ロギングまたは可観測性

### Phase 3.7: Parallel Implementation Guide

FRが3個以上であれば §0.10/§0.11 を生成する。

- §0.10 FR Dependency Graph: FR間のdepends_on、レイヤー、複雑度、並列配置
- §0.11 Parallel Work Units: Foundation, Backend, Frontend, Test, Integration Checklist

FRが2個以下であれば `N/A - 順次実装` と明示する。

### Phase 4: 検証と引き継ぎ

必須検証:

- BRIEFがあれば User Story/BDD AC ↔ FR traceability を `CONTEXT.json.traceability` に記録する。
- 新規Zodスキーマがあれば §0.1 Target Files にType/Schemaレイヤーが必要。
- 新規API Routeがあれば §0.1 Target Files にAPI Routeレイヤーが必要。
- FR 3個以上であれば §0.10/§0.11 が全FRとTarget Filesをカバーする必要がある。
- Error & Rescue Map と Interaction State Coverage テンプレートをSPECに反映する。

完了時に `CONTEXT.json` を更新する。

- `quick_resume.current_state`: `SpecDrafting`
- `quick_resume.current_task`: `SPEC.md生成完了、Readiness Gate待ち`
- `quick_resume.next_actions`: `["Readiness Gate実行", "Go時に実装開始"]`
- `progress.fr_total`
- `progress.details`
- `artifacts.spec`
- `artifacts.screens`
- `artifacts.design_assets`
- `decisions[]`
- `history[]`
- `references.related_code` と §0.1 Target Files の同期

## Required SPEC Surface

最小限含む項目:

- §0.0 Project Context
- §0.1 Target Files
- §0.2 Core State / Architecture / State Transitions
- §0.3 Error Handling
- §0.4 Data Schema
- §0.5 API Contract
- §0.6 NFR
- §0.7 AI Logic & Prompts または N/A
- §0.8 Safety & Guardrails または N/A
- §0.10/§0.11 並列実装ガイド または N/A
- §1 Overview, §1.4 Goals / Non-Goals, §1.5 UI Flow Contract または N/A
- §2 Functional Requirements, BDD AC, Exception Flows, Business Rules
- §3 Dependencies & Risks
- §4 Screen Docs または N/A
- §5 Verification & Tests
- §6 Messages
- §6.5 Product Requirements または N/A

詳細なdepth matrixとSPEC-Lite例は `references/spec-sections.md` を読む。

## Reference Loading Guide

| 状況 | Reference |
|---|---|
| SPECセクション別の詳細作成基準 | `references/spec-sections.md` |
| 以前の長文プロトコル、質問リスト、API/NFR例 | `references/spec-generation-protocol-details.md` |
| Error & Rescue Map作成 | `references/error-rescue-map-template.md` |
| Interaction State Coverage作成 | `references/interaction-state-coverage-template.md` |

## AI Behavior

### DO

- CONTEXT.jsonとBRIEF.mdの意図をFR/ACに追跡可能な形で反映する。
- 質問は7個以内に絞る。
- 仮定はAssumptionとして明示する。
- 外部依存の検証状態を偽らない。
- Test pathとTarget Filesを具体的に指定する。

### DON'T

- CONTEXT.jsonなしに開始しない。
- ユーザー確認なしに新しいデータ構造を確定しない。
- 空セクションを作らない。
- PRDのように範囲の広い文書は作らない。SPECは単一機能の実装契約である。

## Not For / Boundaries

- CONTEXT.json生成: `feature-architect`
- コード実装: `feature-implementer`
- 既存SPEC修正: `feature-spec-updater`
- 市場リサーチ/競合分析: `discover`, `research-pilot`

## Maintenance

Sources:

- `docs/_templates/spec_template.md`
- `docs/_templates/screen_template.md`
- `docs/_templates/api_template.md`
- `references/spec-sections.md`
- `references/error-rescue-map-template.md`
- `references/interaction-state-coverage-template.md`

Known limits:

- context7/WebSearch未使用時、`verified_dependencies.verified` はfalseのまま残ることがある。
- BRIEF.mdがない場合、traceabilityの品質が制限される。
