# 017-decision-fatigue-reducer: Decision Fatigue Reducer

> **状態**: 実装済み・仕様化 (100%) | **優先度**: P1 | **更新日**: 2026-07-12
> **SPECバージョン**: v1.0 | **機能タイプ**: UI / Gemini AI / Cloud Run

## 0. AI実装契約

### 0.0 Project Context

Vite + TypeScript（UI）、Express（API）、Zod（入力契約）、Gemini API（任意）、Cloud Run（実行基盤）の既存実装をSSOTとする。新しいデータベーススキーマや破壊的な本番操作は追加しない。

#### 0.0.1 Naming / Glossary

| 用語 | 定義 | コード表現 |
|---|---|---|
| Agent | decision prioritization agentとして判断を行うAI役割 | agent |
| Decision | DECIDE THREE / DEFER / ESCALATEの判断ラベル | decision |
| Evidence | 判断に使った観測可能な根拠 | evidence[] |

### 0.1 Target Files

| レイヤー | 実体 | 作業 | 条件 |
|---|---|:---:|---|
| Type/Schema | outputs/17-decision-fatigue-reducer/src/project.ts | 🔄 | 実装済み型・Zod契約 |
| Type/Schema | outputs/17-decision-fatigue-reducer/src/agent.ts | 🔄 | 実装済み型・Zod契約 |
| API/Service | outputs/17-decision-fatigue-reducer/src/server.ts | 🔄 | API/外部サービス境界 |
| UI | outputs/17-decision-fatigue-reducer/src/main.ts | 🔄 | UIまたは表示層 |
| Test | outputs/17-decision-fatigue-reducer/src/server.test.ts | ✅ | 回帰・契約テスト |

#### 0.1.1 Traceability Matrix

| FR-ID | 実装ファイル | テスト | 状態 |
|---|---|---|:---:|
| FR-01701 | outputs/17-decision-fatigue-reducer/src/server.ts | outputs/17-decision-fatigue-reducer/src/server.test.ts | 実装済み |
| FR-01702 | outputs/17-decision-fatigue-reducer/src/agent.ts | outputs/17-decision-fatigue-reducer/src/server.test.ts | 実装済み |
| FR-01703 | outputs/17-decision-fatigue-reducer/src/main.ts | outputs/17-decision-fatigue-reducer/src/server.test.ts | 実装済み |
| FR-01704 | outputs/17-decision-fatigue-reducer/src/server.ts | outputs/17-decision-fatigue-reducer/src/server.test.ts | 実装済み |

### 0.2 Core State / Architecture / State Transitions

| 状態 | 型 | 初期値 | 用途 |
|---|---|---|---|
| input | target, context, signals | sample/empty | 分析対象 |
| status | idle / loading / data / error | idle | 画面状態 |
| result | Analysis | null | null | 判断結果 |
| error | string | null | null | 回復可能な失敗 |

**遷移**: idle → loading → data または error。AIエラーは fallback を経て data、入力エラーは loading に入らず error。

**アーキテクチャ指針**: 既存の薄いUI層、Express Route、agent/domainロジック、Zod schema、Vitest契約テストの境界を維持する。新規抽象化は、同じ責務が2箇所以上に増えた場合だけ検討する。

### 0.3 Error Handling

| 事象 | HTTP/UI | 回復 |
|---|---|---|
| 入力不正 | 400 / 入力エラー | 入力を修正して再実行 |
| Gemini未設定/失敗 | fallback または 503 ready | fallback確認、設定後再実行 |
| 認証不正 | 401/403 | BearerまたはX-API-Keyを設定 |
| rate limit | 429 | 待機して再試行 |
| 予期せぬ例外 | 統一JSONエラー + request ID | ログを追跡し人間が判断 |

### 0.4 Data Schema

#### 0.4.1 Zod / TypeScript

入力は既存のZod schema（AnalyzeInputSchema / ProductEventSchema）を優先し、文字数・URL・enum・数値範囲をサーバー側で再検証する。結果はdecision、confidence、summary、risks、actions、evidence、automationPlan、commentDraftを持つ。

#### 0.4.2 DB Schema

N/A - MVPは分析リクエストを永続化せず、イベントを構造化ログへ出力する。

### 0.5 API Contract

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| GET | /api/health | 本番設定時 Bearer または X-API-Key | Zod契約 | JSON + request ID |
| GET | /api/ready | 本番設定時 Bearer または X-API-Key | Zod契約 | JSON + request ID |
| GET | /api/version | 本番設定時 Bearer または X-API-Key | Zod契約 | JSON + request ID |
| GET | /api/project | 本番設定時 Bearer または X-API-Key | Zod契約 | JSON + request ID |
| POST | /api/analyze | 本番設定時 Bearer または X-API-Key | Zod契約 | JSON + request ID |
| POST | /api/events | 本番設定時 Bearer または X-API-Key | Zod契約 | JSON + request ID |

### 0.6 NFR

- レスポンス: health/readinessは即時、分析はAI応答時間に依存するためUIにloadingを表示する。
- 信頼性: Gemini失敗時はdeterministic fallback、実行系は状態をqueued/running/completed/failedで記録する。
- コスト: rate limit、入力上限、モデル設定、推定トークン/コストを維持する。
- 可観測性: request ID、構造化ログ、health/ready/version、実行履歴を使う。

### 0.7 AI Logic & Prompts

システム役割は「decision prioritization agent」。入力のdecision ranking・delegation・unblock sequenceを優先して、DECIDE THREE / DEFER / ESCALATEの1つを選び、断定にはsummary・risks・evidenceを添える。実データにない事実を創作せず、不確実な場合は保守的なラベルと人間確認のactionを返す。JSON解析に失敗した場合はfallbackを返す。

### 0.8 Safety & Guardrails

- AIは判断支援と下書き生成に限定し、本番変更・決済・削除を自動実行しない。
- シークレットは環境変数/Secret Managerのみ。ログにトークンやPIIを出さない。
- 入力サイズ、URL、認証、rate limit、CSP/helmet、no-store API cacheを既存実装どおり適用する。
- 不確実な判断は人間の最終確認へエスカレーションする。

### 0.9 Design Tokens

既存の outputs/17-decision-fatigue-reducer/src/styles.css をデザインSSOTとし、semantic token、既存の色・間隔・フォーカス表示・レスポンシブブレークポイントを再利用する。新規色の追加は判断ラベルの意味が既存表現で不足する場合だけに限定する。

### 0.10 FR Dependency Graph

```
FR-01701 (input/contract) → FR-01702 (AI/execution) → FR-01703 (display)
                                      └──────────────→ FR-01704 (safety/operations)
```

### 0.11 Parallel Work Units

| Unit | 対象 | 依存 |
|---|---|---|
| Foundation | 型・Zod・エラー契約 | なし |
| Backend | Route・AI/fallback・ログ | Foundation |
| Frontend | 入力・結果・状態表示 | Foundation |
| Test | 契約・fallback・エラー | Backend/Frontend |
| Integration | Cloud Run/health/readiness | 全ユニット |

## 1. Overview

### 1.1 Goal

Decision Fatigue Reducer によるdecision rankingの自動判断を、判断可能なJSONと確認可能なUIとして提供する。

### 1.4 Goals / Non-Goals

**Goals**: decision ranking、delegation、unblock sequenceを構造化し、DECIDE THREE / DEFER / ESCALATEと根拠・アクションを返す。Cloud Runで実行可能にする。

**Non-Goals**: 実サービスへの自動書き込み、新規DB移行、AI判断だけでの本番変更。

### 1.5 UI Flow Contract

入力画面 → 実行中表示 → 判断ストリップ/レポート → 根拠・リスク・アクション → フィードバックまたは再実行。画面ごとの詳細は [screens/analysis.md](screens/analysis.md) を参照する。

## 2. Functional Requirements

| FR-ID | 名称 | 要件 | 実装 | テスト |
|---|---|---|---|---|
| FR-01701 | 証拠入力 | target/context/signalsを受け付け、Zodでサイズ・形式を検証する。 | outputs/17-decision-fatigue-reducer/src/server.ts | outputs/17-decision-fatigue-reducer/src/server.test.ts |
| FR-01702 | AI判断 | decision prioritization agentとしてdecision ranking・delegation・unblock sequenceをGeminiへ渡し、DECIDE THREE / DEFER / ESCALATEのいずれかを返す。 | outputs/17-decision-fatigue-reducer/src/agent.ts | outputs/17-decision-fatigue-reducer/src/server.test.ts |
| FR-01703 | 結果表示 | confidence、summary、risks、actions、evidence、automationPlan、commentDraftを画面で確認できる。 | outputs/17-decision-fatigue-reducer/src/main.ts | outputs/17-decision-fatigue-reducer/src/server.test.ts |
| FR-01704 | 運用安全性 | Gemini失敗時のfallback、request ID、health/ready/version、認証・rate limit・構造化エラーを提供する。 | outputs/17-decision-fatigue-reducer/src/server.ts | outputs/17-decision-fatigue-reducer/src/server.test.ts |

### BDD Acceptance Criteria

| AC | Given | When | Then | 観測 |
|---|---|---|---|---|
| AC-01 | 入力/実行可能な状態 | 証拠入力を実行する | 期待する構造化結果と観測可能な状態が返る | 対応テストと画面 |
| AC-02 | 入力/実行可能な状態 | AI判断を実行する | 期待する構造化結果と観測可能な状態が返る | 対応テストと画面 |
| AC-03 | 入力/実行可能な状態 | 結果表示を実行する | 期待する構造化結果と観測可能な状態が返る | 対応テストと画面 |
| AC-04 | 入力/実行可能な状態 | 運用安全性を実行する | 期待する構造化結果と観測可能な状態が返る | 対応テストと画面 |


### Exception Flows / Business Rules

1. 入力不正はAI呼び出し前に拒否する。
2. AI応答はスキーマ/構造を検証し、妥当性がない場合はfallbackまたはエラーにする。
3. 最も保守的な判断ラベル相当の高リスク判断では、最終確認を人間へ戻す。

## 3. Dependencies & Risks

| 依存 | 状態 | リスク/対策 |
|---|---|---|
| Gemini API / @google/genai | verified by package.json・実装 | キー不足はfallback、readyで可視化 |
| Cloud Run / Terraform | verified by Dockerfile・infra/terraform | 起動/PORT/Secret設定をデプロイ前に確認 |
| 外部証拠 | MVPは入力テキスト | 自動取得は別スコープ、人間が出典を確認 |

## 4. Screen Docs

- [Analysis Console](screens/analysis.md)

## 5. Verification & Tests

| 検証 | コマンド/観測 | 現状 |
|---|---|---|
| 型チェック | npm run typecheck（ルート） | 要実行（この生成処理では未実行） |
| テスト | npm test（ルート）または各outputの npm test | 要実行（この生成処理では未実行） |
| ビルド | npm run build と対象Docker/Terraform | 要実行 |
| 画面 | 対象URLで入力→結果→エラー/fallbackを目視 | 要実行 |

## 6. Messages

- analysis.loading: 分析中
- analysis.invalid_input: 入力内容を確認してください
- analysis.fallback: AI接続なしのローカル判定を表示しています
- analysis.error: 分析に失敗しました。request IDを添えて再試行してください
- analysis.human_review: 最終判断は担当者が確認してください

## 6.5 Product Requirements

- 初回利用者が1画面で対象入力から判断結果まで到達できること。
- 判断ラベルだけでなく、信頼度・根拠・リスク・担当付きアクションを同時に表示すること。
- AIが利用できない審査環境でも、fallbackで体験の主線を検証できること。

## 7. Change History

| 日付 | 版 | 変更 |
|---|---|---|
| 2026-07-12 | v1.0 | feature-architectで現行実装を棚卸しし、feature-spec-generator契約へ変換 |
