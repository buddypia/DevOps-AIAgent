# 021-agent-guild-platform: Agent Guild プラットフォーム

> **状態**: 実装済み・仕様化 (100%) | **優先度**: P1 | **更新日**: 2026-07-12
> **SPECバージョン**: v1.0 | **機能タイプ**: UI / Gemini AI / Cloud Run

## 0. AI実装契約

### 0.0 Project Context

Vite + TypeScript（UI）、Express（API）、Zod（入力契約）、Gemini API（任意）、Cloud Run（実行基盤）の既存実装をSSOTとする。新しいデータベーススキーマや破壊的な本番操作は追加しない。

#### 0.0.1 Naming / Glossary

| 用語 | 定義 | コード表現 |
|---|---|---|
| Agent | A2A DevOps mission controlとして判断を行うAI役割 | agent |
| Decision | RECOMMEND / EXECUTE / VERIFYの判断ラベル | decision |
| Evidence | 判断に使った観測可能な根拠 | evidence[] |

### 0.1 Target Files

| レイヤー | 実体 | 作業 | 条件 |
|---|---|:---:|---|
| Type/Schema | src/types.ts | 🔄 | 実装済み型・Zod契約 |
| Type/Schema | src/missionTypes.ts | 🔄 | 実装済み型・Zod契約 |
| API/Service | server/index.ts | 🔄 | API/外部サービス境界 |
| API/Service | server/missionAgent.ts | 🔄 | API/外部サービス境界 |
| API/Service | server/opsAgent.ts | 🔄 | API/外部サービス境界 |
| API/Service | server/runStore.ts | 🔄 | API/外部サービス境界 |
| API/Service | server/agentCardDiscovery.ts, server/agentJobs.ts, server/agentStats.ts, server/incidentDrill.ts, server/ipAllowlist.ts | 🔄 | 連携・統計・安全演習・IP制御 |
| Domain | src/agentEngine.ts, src/agentCardAssessment.ts, src/agentCardDiscovery.ts, src/customAgent.ts, src/market.ts, src/missionTemplates.ts, src/submission.ts | 🔄 | 推薦・外部Agent・提出証跡 |
| UI | src/AppHome.tsx | 🔄 | UIまたは表示層 |
| UI | src/MissionControl.tsx | 🔄 | UIまたは表示層 |
| UI | src/OpsAgentConsole.tsx | 🔄 | UIまたは表示層 |
| UI | src/IncidentDrillPanel.tsx | 🔄 | UIまたは表示層 |
| UI | src/AgentRoster.tsx | 🔄 | UIまたは表示層 |
| UI | src/EvidenceDashboard.tsx | 🔄 | UIまたは表示層 |
| UI | src/AgentAvatar.tsx, src/App.tsx, src/ResultInspector.tsx, src/RosterHighlights.tsx, src/main.tsx | 🔄 | 共通表示・起動 |
| Test | tests/**/*.test.ts | ✅ | 回帰・契約テスト |

#### 0.1.1 Traceability Matrix

| FR-ID | 実装ファイル | テスト | 状態 |
|---|---|---|:---:|
| FR-02101 | src/market.ts, src/agentEngine.ts | tests/market.test.ts, tests/agentEngine.test.ts | 実装済み |
| FR-02102 | server/index.ts, server/runStore.ts | tests/runStore.test.ts, tests/agentJobs.test.ts | 実装済み |
| FR-02103 | server/missionAgent.ts, src/MissionControl.tsx | tests/missionAgent.test.ts | 実装済み |
| FR-02104 | server/opsAgent.ts, src/EvidenceDashboard.tsx, src/OpsAgentConsole.tsx | tests/opsAgent.test.ts | 実装済み |
| FR-02105 | src/agentCardDiscovery.ts, server/agentCardDiscovery.ts, src/customAgent.ts | tests/agentCardDiscovery.test.ts, tests/customAgent.test.ts | 実装済み |
| FR-02106 | server/incidentDrill.ts, src/IncidentDrillPanel.tsx | tests/incidentDrill.test.ts | 実装済み |

### 0.2 Core State / Architecture / State Transitions

| 状態 | 型 | 初期値 | 用途 |
|---|---|---|---|
| input | goal / selected agent ids | sample/empty | 分析対象 |
| status | idle / loading / data / error | idle | 画面状態 |
| result | Mission / OpsRun | null | null | 判断結果 |
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

入力は既存のZod schema（RecommendSchema / HireSchema / RunCreateSchema / MissionCreateSchema）を優先し、文字数・URL・enum・数値範囲をサーバー側で再検証する。結果はdecision、confidence、summary、risks、actions、evidence、automationPlan、commentDraftを持つ。

#### 0.4.2 DB Schema

N/A - Firestoreまたはmemory run storeの既存契約を使用し、新規スキーマは追加しない。

### 0.5 API Contract

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| GET | /api/healthz | IP allowlist/必要時の設定 | Zod契約 | JSON + request ID |
| GET | /api/market | IP allowlist/必要時の設定 | Zod契約 | JSON + request ID |
| POST | /api/recommend | IP allowlist/必要時の設定 | Zod契約 | JSON + request ID |
| POST | /api/agent-card/discover | IP allowlist/必要時の設定 | Zod契約 | JSON + request ID |
| GET|POST|DELETE | /api/hires | IP allowlist/必要時の設定 | Zod契約 | JSON + request ID |
| POST | /api/agent-runs | IP allowlist/必要時の設定 | Zod契約 | JSON + request ID |
| POST|GET | /api/missions | IP allowlist/必要時の設定 | Zod契約 | JSON + request ID |
| GET | /api/agent-stats | IP allowlist/必要時の設定 | Zod契約 | JSON + request ID |
| GET | /api/agent-jobs | IP allowlist/必要時の設定 | Zod契約 | JSON + request ID |
| GET | /api/agent-runs | IP allowlist/必要時の設定 | Zod契約 | JSON + request ID |
| POST | /api/ops-agent/incident-drill | IP allowlist/必要時の設定 | Zod契約 | JSON + request ID |
| GET | /.well-known/agent-card.json | IP allowlist/必要時の設定 | Zod契約 | JSON + request ID |
| POST | /a2a | IP allowlist/必要時の設定 | Zod契約 | JSON + request ID |

### 0.6 NFR

- レスポンス: health/readinessは即時、分析はAI応答時間に依存するためUIにloadingを表示する。
- 信頼性: Gemini失敗時はdeterministic fallback、実行系は状態をqueued/running/completed/failedで記録する。
- コスト: rate limit、入力上限、モデル設定、推定トークン/コストを維持する。
- 可観測性: request ID、構造化ログ、health/ready/version、実行履歴を使う。

### 0.7 AI Logic & Prompts

システム役割は「A2A DevOps mission control」。入力のagent marketplace and squad recommendation・mission orchestration with evidence・Cloud Run SRE operations and A2A integrationを優先して、RECOMMEND / EXECUTE / VERIFYの1つを選び、断定にはsummary・risks・evidenceを添える。実データにない事実を創作せず、不確実な場合は保守的なラベルと人間確認のactionを返す。JSON解析に失敗した場合はfallbackを返す。

### 0.8 Safety & Guardrails

- AIは判断支援と下書き生成に限定し、本番変更・決済・削除を自動実行しない。
- シークレットは環境変数/Secret Managerのみ。ログにトークンやPIIを出さない。
- 入力サイズ、URL、認証、rate limit、CSP/helmet、no-store API cacheを既存実装どおり適用する。
- 不確実な判断は人間の最終確認へエスカレーションする。

### 0.9 Design Tokens

既存の src/styles.css をデザインSSOTとし、semantic token、既存の色・間隔・フォーカス表示・レスポンシブブレークポイントを再利用する。新規色の追加は判断ラベルの意味が既存表現で不足する場合だけに限定する。

### 0.10 FR Dependency Graph

```
FR-02101 (catalog) → FR-02102 (execution) → FR-02103 (mission) → FR-02104 (evidence)
                                      └→ FR-02105 (external card)
                                      └→ FR-02106 (safe drill)
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

Agent Guild本体のエージェント選定・実行・検証を、判断可能なJSONと確認可能なUIとして提供する。

### 1.4 Goals / Non-Goals

**Goals**: agent marketplace and squad recommendation、mission orchestration with evidence、Cloud Run SRE operations and A2A integrationを構造化し、RECOMMEND / EXECUTE / VERIFYと根拠・アクションを返す。Cloud Runで実行可能にする。

**Non-Goals**: 実サービスへの自動書き込み、新規DB移行、AI判断だけでの本番変更。

### 1.5 UI Flow Contract

入力画面 → 実行中表示 → 判断ストリップ/レポート → 根拠・リスク・アクション → フィードバックまたは再実行。画面ごとの詳細は [screens/home.md, screens/mission-control.md](screens/home.md) を参照する。

## 2. Functional Requirements

| FR-ID | 名称 | 要件 | 実装 | テスト |
|---|---|---|---|---|
| FR-02101 | カタログと推薦 | 入力された目的をプロファイル化し、選択候補と根拠付き推薦を返す。 | src/market.ts, src/agentEngine.ts | tests/market.test.ts, tests/agentEngine.test.ts |
| FR-02102 | 雇用と実行 | 有効化したエージェントだけが実行でき、実行履歴を保存・再取得できる。 | server/index.ts, server/runStore.ts | tests/runStore.test.ts, tests/agentJobs.test.ts |
| FR-02103 | Mission Control | 目標から計画・適応・エージェント実行・引用ゲートを経てレポートを作る。 | server/missionAgent.ts, src/MissionControl.tsx | tests/missionAgent.test.ts |
| FR-02104 | SRE証拠確認 | Cloud Loggingの証拠、finding、checker、escalationを表示し、根拠のないfindingを受理しない。 | server/opsAgent.ts, src/EvidenceDashboard.tsx, src/OpsAgentConsole.tsx | tests/opsAgent.test.ts |
| FR-02105 | 外部Agent Card | 公開ホストのみからAgent Cardを取得し、SSRFを防止して評価結果だけを表示する。 | src/agentCardDiscovery.ts, server/agentCardDiscovery.ts, src/customAgent.ts | tests/agentCardDiscovery.test.ts, tests/customAgent.test.ts |
| FR-02106 | 安全な演習 | 本番サービスを変更せず、合成ログ2件を記録するIncident Drillを提供する。 | server/incidentDrill.ts, src/IncidentDrillPanel.tsx | tests/incidentDrill.test.ts |

### BDD Acceptance Criteria

| AC | Given | When | Then | 観測 |
|---|---|---|---|---|
| AC-01 | 入力/実行可能な状態 | カタログと推薦を実行する | 期待する構造化結果と観測可能な状態が返る | 対応テストと画面 |
| AC-02 | 入力/実行可能な状態 | 雇用と実行を実行する | 期待する構造化結果と観測可能な状態が返る | 対応テストと画面 |
| AC-03 | 入力/実行可能な状態 | Mission Controlを実行する | 期待する構造化結果と観測可能な状態が返る | 対応テストと画面 |
| AC-04 | 入力/実行可能な状態 | SRE証拠確認を実行する | 期待する構造化結果と観測可能な状態が返る | 対応テストと画面 |
| AC-05 | 入力/実行可能な状態 | 外部Agent Cardを実行する | 期待する構造化結果と観測可能な状態が返る | 対応テストと画面 |
| AC-06 | 入力/実行可能な状態 | 安全な演習を実行する | 期待する構造化結果と観測可能な状態が返る | 対応テストと画面 |


### Exception Flows / Business Rules

1. 入力不正はAI呼び出し前に拒否する。
2. AI応答はスキーマ/構造を検証し、妥当性がない場合はfallbackまたはエラーにする。
3. 引用のないfindingは受理せず、外部Agent Cardは取得評価だけに留める。

## 3. Dependencies & Risks

| 依存 | 状態 | リスク/対策 |
|---|---|---|
| Gemini API / @google/genai | verified by package.json・実装 | キー不足はfallback、readyで可視化 |
| Cloud Run / Terraform | verified by Dockerfile・infra/terraform | 起動/PORT/Secret設定をデプロイ前に確認 |
| 外部証拠 | MVPは入力テキスト | 自動取得は別スコープ、人間が出典を確認 |

## 4. Screen Docs

- [Home](screens/home.md)
- [Mission Control](screens/mission-control.md)

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
