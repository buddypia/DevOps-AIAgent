---
name: feature-architect
description: ユーザーストーリー/Why/要件/タスクを入力として受け取りコンテキストを収集し、feature-spec-generatorを呼び出してSPEC.mdとScreenドキュメントを生成する。意図→ドキュメント変換のオーケストレーターである。
---

# Feature Architect

このスキルは、上位レベルのユーザー意図を収集し、コンテキストを分析した後、feature-spec-generatorへ接続するオーケストレーターの役割を担う。

## 役割分界

> **注意: Option B原則**: feature-architectは**CONTEXT.json生成の唯一の責任者**である。
> feature-spec-generatorはCONTEXT.jsonが存在する場合のみ実行される。

```
[意図入力]
  |  ユーザーストーリー / Why / 要件 / タスク
  |
  v
[feature-architect] ─────────────────────┐
  |  意図分析 + ID割り当て + コンテキスト収集  |
  |  CONTEXT.json生成（必須ゲート）        |
  v──────────────────────────────────────┘
[feature-spec-generator] → SPEC.md + screens/
  |  （CONTEXT.json必須入力）
  v
[Implementation]
```

| スキル                     | 責務                                                        | Output                     | 必須 |
| ------------------------ | ----------------------------------------------------------- | -------------------------- | :--: |
| **feature-architect**      | 意図確定、コンテキスト収集、**BRIEF.md + CONTEXT.json生成** | `BRIEF.md`, `CONTEXT.json` | 必須 |
| **feature-spec-generator** | CONTEXT + BRIEFに基づき実装契約を文書化                     | `SPEC.md`, `screens/*.md`  | 必須 |

**役割分離原則**:

- **Architect**: 「何を作るか」(What) - 意図、スコープ、コンテキストの定義
- **Spec-Generator**: 「どう作るか」(How) - 実装契約、テスト条件の文書化

---

## 実行モード (Execution Modes)

### Standardモード（唯一のモード）

> **目的**: すべての機能で十分なコンテキストを収集する

Standardモードは、以下「プロトコル」セクションの全ステップに従う。

### Step: Feature Characteristics Detection

codebaseをスキャンし、12個のboolean特性をCONTEXT.jsonの`characteristics`に記録する。

| 特性 | 検出方法 |
|------|----------|
| `involves_new_api` | 新規APIルートファイルの生成有無 |
| `involves_external_api` | 外部サービス呼び出しコードの存在 |
| `db_schema_change` | DBマイグレーション/スキーマ変更 |
| `multi_screen` | 2つ以上のページ/画面の生成 |
| `ai_ml_integration` | AI/MLモデル連携コード |
| `security_sensitive` | 認証/権限関連の修正 |
| `realtime_processing` | WebSocket/SSEなどのリアルタイム処理 |
| `offline_capability` | オフライン同期ロジック |
| `payment_billing` | 決済/課金関連コード |
| `pii_handling` | 個人情報(PII)の処理 |
| `novel_domain` | プロジェクトに新規のドメイン概念 |
| `cross_feature_impact` | 他の機能ディレクトリへの影響 |

**Risk Level自動導出**:
- **high**: `security_sensitive`、`payment_billing`、`pii_handling`のいずれかがtrue
- **medium**: `involves_external_api`、`multi_screen`、`db_schema_change`のいずれかがtrue
- **low**: 上記いずれにも該当しない

---

## PATH CONTRACT (MANDATORY)

> **BINDING**: このスキルは動的パスプレースホルダーを使用する。
> AIはファイル操作の前に必ず`project-config.json`からパスを解決しなければならない。
> リテラルパスの使用は**プロトコル違反**である。

| Placeholder | Resolution Source | Default |
|-------------|-------------------|---------|
| `{FEATURES_DIR}` | project-config.paths.features | `src/features` |
| `{DOCS_DIR}` | project-config.paths.docs_features | `docs/features` |

**Resolution**: `Read project-config.json → プレースホルダー解決 → 解決済みの値を使用`
**Fallback**: project-config.jsonが無い場合はDefault列を使用

**FORBIDDEN**: 生成コード、コマンド、ファイルパスにリテラル`src/features/`の使用を禁止する。

---

## プロトコル (Protocol)

### Step 0: Path Resolution（必須）

> project-config.jsonからプロジェクトパスを動的に解決する。

```
1. Read project-config.json（存在しない場合はデフォルト値を使用）
2. FEATURES_DIR = paths.features（デフォルト: "src/features"）
3. DOCS_DIR = paths.docs_features（デフォルト: "docs/features"）
4. COMPONENT_EXT = conventions.component_extension（デフォルト: ".tsx"）
5. FEATURE_LAYERS = conventions.feature_structure（デフォルト: ["types","api","hooks","components"]）
```

### 0段階: 入力モード判別 (Input Mode Detection)

> argsの内容に基づきモードを決定する

**自由形式モード（デフォルト）**: 既存のプロトコルをそのまま実行

---

### 0.5段階: 冪等性事前検査 (Idempotency Pre-flight)

> 半完了状態を検知し、安全に再開するための段階

**検査項目**:

1. 対象Featureディレクトリが既に存在するか?
   - `CONTEXT.json`が存在 → **スキップ（既に完了）**
   - `CONTEXT.json`が無い → **通常通り進行**

**判定テーブル**:

| CONTEXT存在? |   判定   | アクション                 |
| :-----------: | :------: | ------------------------- |
|     無し      |   正常   | 全体実行                  |
|     有り      | 既に完了 | スキップ + 案内メッセージ |

---

### 1段階: コンテキスト分析とID割り当て (Context Analysis & ID Assignment)

1. **意図分析 (Analyze Intent)**: ユーザーの要求から「Why（目標）」と「Value（ユーザー便益）」を抽出する。

1.5. **ドメイン帰属確定 (Domain Placement)** - 必須ステップ、ID割り当て*前*に実行:

   > **目的**: 類似機能の重複生成と誤ったドメイン分離を、ID割り当て前に遮断する。

   1. `{DOCS_DIR}/domain-map.json` + `{DOCS_DIR}/index.md`を読む。domain-map.jsonが無い場合は`docs/_templates/domain_map_template.json`をコピーして初期生成する（空のdomains/features — init入口）。
   2. 新規要件のキーワード/責務を`domains[].keywords`/`responsibility`および`features[].title`と比較する。
   3. **Domain Placement Verdictを表形式で出力する**（省略禁止）:

      | 判定 | 意味 | 後続アクション |
      | --- | --- | --- |
      | `DUPLICATE` | 同一機能が既に存在 | 生成中断、既存機能IDを報告 |
      | `EXTEND_EXISTING` | 既存機能のスコープ拡張 | 生成中断、feature-pilotへMODIFY_FEATURE再ルーティングを報告 |
      | `NEW_IN_EXISTING_DOMAIN` | 既存ドメイン内の新規機能 | 該当`domain` idで進行 |
      | `NEW_DOMAIN` | 新規ドメイン | domain-map.json#domains[]に定義を追加後、進行 |

      出力フォーマット: `判定 / 帰属domain id / 比較した既存機能ID一覧 / 根拠1-2文`。
   4. 判定がfeature-pilot Phase 0のVerdictと異なる場合、差異を報告しユーザー確認を得る。類似（近接）機能を発見した場合は、該当SPECパスをCONTEXT.jsonの`references.related_specs`に、依存機能IDを`dependencies.features`に記録する候補としてメモする。

2. **機能ID決定 (Determine Feature ID)** - 必須ステップ:

   > **重要**: ID重複を防ぐため、以下のコマンドを**必ず**実行しなければならない。

   ```bash
   # 必須実行 - docs/features/ 内の既存ID確認
   ls -d docs/features/[0-9][0-9][0-9]-*/ 2>/dev/null | sed 's/.*\/\([0-9]\{3\}\)-.*/\1/' | sort -n | tail -1
   ```

   - **成功時**: 返された数値（例: `028`）に+1して次のIDを割り当てる（例: `029`）
   - **失敗/空の結果時**: `001`から開始
   - **絶対禁止**: ディレクトリスキャン無しに任意のIDを使用すること

   - 機能に対してケバブケース(kebab-case)の名前を生成する（例: `user-dashboard`）
   - 最終ID形式: `XXX-feature-name`（例: `001-user-dashboard`）

3. **テンプレート読み込み (Read Template)**:
   - `docs/_templates/context_template.json`を読み、CONTEXT構造を把握する。

### 2段階: 技術探索と草案作成 (Technical Discovery & Drafting)

1. **コードベーススキャン (Scan Codebase)**: `glob`または`grep`を使用して関連する既存コードを特定する。
   - 関連コンポーネント/Hook/APIファイル（`{FEATURES_DIR}/<feature>/`構造）
   - 関連APIルートファイル（project-config.jsonのpaths参照、フレームワーク別APIディレクトリ）
   - 類似機能の既存SPECドキュメント

2. **制約条件推論 (Infer Constraints)**: コードベースに基づき技術的制約条件を提案する。
   - _Hard Constraints（必須）_: 既存スキーマ、主要パッケージ、アーキテクチャパターン（React Hooks、Feature-First + Simplified Clean Architecture、Zod）
   - _Soft Constraints（推奨）_: 特定サービスまたはUIコンポーネントの再利用

3. **入力情報の整理**: ユーザー入力から抽出した情報を整理する。
   - ユーザーストーリー、Why、要件、タスク分類
   - テスト配置場所（例: `tests/unit/features/<feature>/hooks/<name>.test.ts`）

4. **暗黙的要件チェック (Implicit Requirements Check)**: ユーザーが明示していないが、この機能に必要な項目をドメインチェックリストで点検する。

   > **原則**: 全項目を機械的に適用しない。当該機能に**関連する項目のみ**検討し、漏れがあれば`open_questions`に追加する。

   | カテゴリ          | チェック項目                          | 該当時のアクション                                    |
   | ----------------- | ------------------------------------ | --------------------------------------------------- |
   | **API Route**     | AI/外部API呼び出しが必要か?          | APIルート設計 → references.api_routes                |
   | **エラー/空状態** | データ無し/読み込み失敗時のUIは?     | エラーシナリオ → requirementsに反映                   |
   | **既存機能重複** | 類似機能が既に存在するか?             | Step 1.5 Domain Placement Verdictで先行解決 — 新情報発見時はverdict再実行 |
   | **UI Flow影響**   | 新パネル/SSEイベント/状態追加が必要か? | feature_type判定根拠 → open_questionsに影響範囲を記録 |

   **出力**: 該当しない項目は省略。漏れを発見した場合はサマリー報告:

   ```markdown
   暗黙的要件の発見:

   - エラー状態: データが無い場合の空状態UI未定義 → open_questionsに追加
   ```

5. **PRPコンテキストキュレーション (PRP Context Curation)**:

   > **PRP = PRD + curated codebase intelligence + agent runbook**
   > AIが最初のパスでプロダクション品質のコードを生成するための必要十分最小コンテキストパケット。

   | 段階 | 収集対象 | 方法 | 条件 |
   |------|-----------|------|------|
   | 5a | **コードベースパターン** | 類似機能の実装パターン（コンポーネント構造、状態管理、API呼び出し方式） | 常時 |
   | 5b | **ライブラリドキュメント** | context7 MCPで使用ライブラリの最新APIを照会 | `involves_external_api`または`novel_domain`がtrueの場合 |
   | 5c | **既存SPEC参照** | 類似機能のSPEC.mdからパターン/構造を参照 | 既存SPECが存在する場合 |
   | 5d | **プロジェクト規約** | CLAUDE.md、project-config.jsonからコーディング規約を抽出 | 常時 |

   **出力**: BRIEF.mdのSection 9（Context Map）に収集した参照を構造化して記録:

   ```markdown
   ## Context Map (PRP)

   ### Codebase Patterns
   - `{FEATURES_DIR}/existing-feature/hooks/useX.ts` — 同一パターン参照

   ### Library References
   - zustand v5: createStoreパターン（context7照会）

   ### Convention References
   - CLAUDE.md: Feature-First Architecture (R-CM-005)
   - project-config.json: feature_structure layers
   ```

   **スキップ条件**: 単純なUI変更（ファイル1-2個の修正）は5b/5cを省略可能。

6. **feature_type判定 (Feature Type Classification)**: 意図分析とスキャン結果から機能タイプを分類する。

   > **スキーマ契約**: `context_schema.json`により、architectがCONTEXT生成時に**必須設定**。

   | feature_type       | 判定基準                                              | 例                               |
   | ------------------ | ------------------------------------------------------ | -------------------------------- |
   | `ui_feature`       | ユーザー対面画面を保有（パネル/ページの追加/変更）      | ダッシュボードパネル、設定画面    |
   | `backend_feature`  | サーバーロジック専用（APIルート、DB処理）              | レートリミット、バッチ処理        |
   | `system_feature`   | インフラ/プラットフォーム基盤                          | オフライン同期、プッシュ通知基盤  |
   | `strategy_feature` | ビジネス戦略（UA、リテンション施策）                   | A/Bテスト、リファラルプログラム   |

   **判定根拠**: ユーザー入力の意図 + コードベーススキャン結果 + Implicit Requirements Checkの「UI Flow影響」項目。
   **ui-flow.jsonの読み込みは不要** — What（何を作るか）レベルの分類であり、How（パネル配置）の詳細はspec-generatorが担当する。

6. **`CONTEXT.json`草案準備**: スキャン結果と入力情報をCONTEXT構造として準備する。

### 3段階: BRIEF生成 → CONTEXT生成 → spec-generator呼び出し (Brief & Context Creation & Handoff)

> **変更点**: BRIEF.mdをCONTEXT.jsonより先に生成し、ユーザー意図を保存する

1. **ディレクトリ生成**:
   - ディレクトリ生成: `docs/features/<ID>-<name>/`

1.5. **domain-map.json自動登録**:

- `{DOCS_DIR}/domain-map.json`を読み込む（Step 1.5で既に生成/参照済み）
- `features[]`に項目を追加: `{"id": "{NNN}-{kebab-name}", "title": "{機能タイトル}", "domain": "{Step 1.5で確定したdomain id}", "src_dir": "{FEATURES_DIR}/ のディレクトリ名（コード非保有機能はnull）", "status": "planned"}`
- `NEW_DOMAIN`判定だった場合は`domains[]`に`{id, name, responsibility, keywords[], out_of_scope[]}`の定義も追加（任意: `aliases[]` — このドメインのDDD bounded_context名称がid/nameと異なる場合はマッピング用に追加。domain-boundary-coherenceのBC名称整合検査を有効化）
- `updated_at`を更新。**冪等性**: 既に登録済みの場合はスキップ
- **例**: `{"id": "001-user-dashboard", "title": "ユーザーダッシュボード", "domain": "dashboard", "src_dir": "user-dashboard", "status": "planned"}`

2. **BRIEF.md生成**（unified_feature_brief.mdテンプレート使用）:
   - `docs/_templates/unified_feature_brief.md`テンプレートを基に生成
   - **Section 0**: ユーザー入力原文を**そのまま**コピー（編集/要約禁止）
   - **Section 1-7**: 意図分析 + コードベーススキャン結果を反映
   - **Section 8**: 空のClarification Log（spec-generatorで追加）
   - **Section 9**: コードベーススキャン結果でContext Mapを作成
   - ファイルパス: `docs/features/<ID>-<name>/BRIEF.md`

3. **ユーザーへBRIEFサマリー報告 + レビュー依頼**:

   ```markdown
   BRIEF生成完了

   **機能ID**: 001-user-dashboard
   **機能名**: ユーザーダッシュボード

   ### BRIEFサマリー

   - **Problem**: 主要データを一目で把握する方法が無い
   - **User Stories**: 2件 (US-01, US-02)
   - **Acceptance Criteria**: 3件 (AC-01 ~ AC-03)
   - **Scope**: In 3件、Out 2件

   > BRIEFをレビューしてください。修正が必要な場合はお知らせください。
   > 問題なければCONTEXT.json生成 + SPEC生成を進めます。
   ```

4. **CONTEXT.json生成**（`artifacts.brief`パス含む）:
   - ファイル生成: `docs/features/<ID>-<name>/CONTEXT.json`
   - `artifacts.brief` → BRIEF.mdパスを設定
   - `architecture` → `null`で初期化（スキーマ契約: architectがnull初期化、feature-pilotがDiscovery Gate後に更新）
   - `traceability` → 空の初期値（spec-generatorで埋める）

5. **feature-spec-generator自動呼び出し**:
   - 収集した入力情報（ユーザーストーリー/Why/要件/タスク）を渡す
   - CONTEXT.jsonのパスを渡す
   - feature-spec-generatorがSPEC.md + screens/を生成

---

## CONTEXT.json生成ガイド

> **参照**: 詳細スキーマは[context_schema.json](../../docs/_templates/context_schema.json)に定義されている。

スキャン結果を以下の形式で記録する:

```json
{
  "schema_version": 8,
  "feature_id": "001-user-dashboard",
  "title": "ユーザーダッシュボード",
  "feature_type": "ui_feature",
  "domain": "dashboard",
  "why": "主要データを一目で把握し業務効率を向上",
  "user_story": "ユーザーとしてダッシュボードを通じて現況を把握したい",
  "requirements": ["ウィジェット追加/削除", "お気に入り機能"],
  "quick_resume": {
    "current_state": "SpecDrafting",
    "current_task": "feature-spec-generatorでSPEC生成中",
    "next_actions": ["SPEC.md完了", "実装開始"],
    "last_updated_at": "2026-01-24T10:30:00+09:00"
  },
  "artifacts": {
    "brief": "docs/features/001-user-dashboard/BRIEF.md",
    "spec": "docs/features/001-user-dashboard/SPEC-001-user-dashboard.md"
  },
  "references": {
    "related_specs": ["docs/features/003-notification-settings/SPEC-003-notification-settings.md"],
    # パスはproject-config.jsonのpaths.featuresから解決（デフォルト: src/features）
    "related_code": {
      "components": ["{FEATURES_DIR}/review/components/*.tsx"],
      "hooks": ["{FEATURES_DIR}/review/hooks/*.ts"],
      "api": ["{FEATURES_DIR}/review/api/*.ts"]
    },
    "api_routes": []
  },
  "dependencies": {
    "features": ["003-notification-settings"],
    "packages": []
  },
  "assumptions": ["既存データ構造にdashboardタイプの追加が可能"],
  "open_questions": ["ウィジェットあたりの最大データソース数の制限が必要か?"],
  "history": []
}
```

---

## AI行動指針

### DO（すべきこと）

- **必ず`ls -d docs/features/[0-9][0-9][0-9]-*/`コマンドで既存IDを確認する**（ID重複防止に必須）
- ユーザー入力からユーザーストーリー/Why/要件/タスクを明確に抽出する
- コードベースをスキャンし、実際に存在するファイルを参照する
- 仮定(Assumptions)と未解決の質問(Open Questions)を明示的に記録する
- **CONTEXT.json生成後、feature-spec-generatorを自動呼び出しする**
- CONTEXT.jsonにreferencesセクションで関連コード/スペックのパスを記録する
- **BRIEF.mdをCONTEXT.jsonより先に生成する**
- **Section 0にユーザー原文をそのまま保存する**（編集/要約禁止）
- **ユーザーへBRIEFサマリー報告後、レビューを依頼する**
- **§7完了条件(DoD)を必ず生成する**（Quickモードでも省略禁止 — 検証可能なテスト + 実装要件）
- **ID割り当て前にDomain Placement Verdictを表形式で出力する**（Step 1.5 — domain-map.json照会必須）
- **domain-map.jsonに自動登録する**（ディレクトリ生成後、BRIEF.md生成前。ファイルが無ければテンプレートコピーで初期生成）
- **feature_typeとdomainを必ず設定する**（スキーマ契約上必須 — nullのままCONTEXT.json生成を禁止）

### DON'T（してはいけないこと）

- **ディレクトリスキャン無しに任意のID（例: 001）を割り当てる** — 必ず既存ID確認が必須
- 存在しないファイルを参照する
- feature-spec-generatorの呼び出し無しに終了する
- **BRIEF.md無しにCONTEXT.jsonのみ生成する**（BRIEF → CONTEXTの順序必須）
- **Section 0のユーザー原文を編集/要約する**
- **§7（完了条件/DoD）を省略する**（Quickモードでも必須 — Readiness GateのNo-Go対象）
- **Domain Placement Verdict無しにID割り当てを行う** — 類似機能重複生成の直接原因（Step 1.5必須）
- **domain-map.json登録無しにCONTEXT.jsonのみ生成する** — domain-map登録はCONTEXT.json生成の前提条件
- **feature_typeまたはdomainをnullのままCONTEXT.jsonを生成する** — スキーマ契約違反、spec-generatorが推論に依存する原因

---

## CONTEXT.json直接生成

> **状態遷移**: `Idle` → `SpecDrafting`

作業完了時、**CONTEXT.jsonをテンプレートからコピーして生成する**:

```markdown
## CONTEXT.json生成ステップ

1. `docs/_templates/context_template.json`をコピー → `docs/features/<id>/CONTEXT.json`
2. 基本情報の設定:
   - feature_id → 割り当てられた機能ID
   - title → 機能の日本語タイトル
   - why → 入力から抽出したWhy
   - user_story → 入力から抽出したユーザーストーリー
   - requirements → 入力から抽出した要件リスト
   - feature_type → 2段階step 5で判定した機能タイプ
   - artifacts.brief_format_version → "v2.0"（新規生成時は常に最新テンプレート準拠）
3. quick_resumeの設定:
   - current_state → "SpecDrafting"
   - current_task → "feature-spec-generatorでSPEC生成中"
   - next_actions → ["SPEC.md完了", "実装開始"]
   - last_updated_at → 現在時刻
4. referencesの設定:
   - related_code → スキャンされた関連コードパス
   - api_routes → 関連APIルート
   - dependencies → 依存機能/パッケージ
5. open_questionsの設定（ある場合）
6. historyに最初の遷移記録を追加
7. **feature-spec-generatorを呼び出し** → SPEC.md + screens/を生成
```

---

## 使用例

```bash
# ユーザーストーリーから開始
/feature-architect ユーザーとしてダッシュボードを管理したい

# Whyと要件を併せて提供
/feature-architect --why "業務効率30%向上" --req "ウィジェット追加/削除/お気に入り"

# 詳細入力（複数行）
/feature-architect
Why: 保存した項目を体系的に管理
ユーザーストーリー: ユーザーとして自分専用のダッシュボードを作りたい
要件:
- ウィジェット追加/削除/修正
- お気に入り機能
```

---

## 参照ドキュメント

- [CONTEXT.jsonスキーマ](../../docs/_templates/context_schema.json) - 必須フィールド、状態値enum定義
- [CONTEXT.jsonテンプレート](../../docs/_templates/context_template.json) - 初期値コピー用
- [feature-spec-generatorスキル](../feature-spec-generator/SKILL.md) - SPEC生成担当
- [BRIEFテンプレート](../../docs/_templates/unified_feature_brief.md) - BRIEF.md初期生成用

## Not For / Boundaries

> 本skillの明示的な非対象（R-CM-018 Rule 4 — Missing Boundaries遮断）。詳細なboundaryはfrontmatter description + 本文trigger節を単一の真実の源として使用する。

- frontmatter descriptionに明示されたtrigger以外の領域は本skillでは扱わない。
- 関連skill / 呼び出しチェーン / 依存関係は本文またはMANIFEST.jsonを参照。
- 本skillはCONTEXT.json + BRIEF.md生成のみを担当する。実装契約の文書化(SPEC.md/screens)は`feature-spec-generator`に委譲。
- 実際のコード実装は本skillの範囲外 — `feature-implementer`または`feature-pilot`に委譲。
- 既存SPECの修正は`feature-spec-updater`、状態同期は`feature-status-sync`が担当。

## Maintenance

- **Sources**: brief2dev内部（`.claude/rules/` R-CM/R-PL rules + `.claude/skills/`スキルコンベンション）。外部referenceは本文参照。
- **Last updated**: 2026-06-11
- **Known limits**: 本スキルの明示的boundaryはfrontmatter description（`ユーザーストーリー/Why/要件/タスクを入力として受け取りコンテキストを収集し、feature-spec-generatorを呼び出してSPEC.mdとS...`）および本文参照。
