> Archive note: 本ファイルは `feature-spec-generator/SKILL.md` の旧・長文プロトコルを
> on-demand reference に移したものである。普段は現行 `SKILL.md` の実行契約に従い、
> 詳細な質問リスト、API/NFR テンプレート、並列実装ガイドの例が必要な時のみ本ファイルを読む。

---
name: feature-spec-generator
description: ユーザーストーリー、Why、要求事項を入力として受け取り、実装可能な SPEC.md と Screen 文書を生成するスキル。開発者の意図を AI が実装できる契約文書に変換する。
---

# Feature Spec Generator

> **コアコンセプト**: 「意図 → 契約」の変換器 (Intent to Contract)

このスキルは開発者が入力した**ユーザーストーリー、Why(目的)、要求事項**を受け取り、AI が実装できる具体的な契約文書(SPEC/Screen)に変換する。

## 入力形式

> **必須前提条件**: `CONTEXT.json` が必ず存在すること。
> CONTEXT.json は **feature-architect** が生成する。本スキルは CONTEXT.json を **読み取り専用** として使用する。

### 必須入力

| 入力             | 説明                          | 例                                               |
| ---------------- | ----------------------------- | ------------------------------------------------ |
| **機能ID**      | feature-architect が割り当てた ID | `001-user-dashboard`                            |
| **CONTEXT.json** | 機能ディレクトリに存在          | `docs/features/001-user-dashboard/CONTEXT.json` |

### 任意の追加入力

以下は CONTEXT.json の情報を補完・具体化する際に使用する:

| 入力タイプ        | 説明                      | 例                       |
| ---------------- | ------------------------- | ------------------------ |
| **追加要求事項** | CONTEXT にない詳細要求事項 | "オフライン同期のサポート"   |
| **制約条件**    | 追加の技術/ビジネス制約  | "既存データ構造の再利用" |

---

## プロトコル (Protocol)

### PATH CONTRACT (MANDATORY)

> **BINDING**: このスキルは動的パスのプレースホルダーを使用する。
> AI はファイル操作前に必ず `project-config.json` からパスを解決しなければならない。
> リテラルパスの使用は**プロトコル違反**である。

| Placeholder | Resolution Source | Default |
|-------------|-------------------|---------|
| `{FEATURES_DIR}` | project-config.paths.features | `src/features` |
| `{DOCS_DIR}` | project-config.paths.docs_features | `docs/features` |
| `{COMPONENT_EXT}` | project-config.conventions.component_extension | `.tsx` |
| `{FEATURE_LAYERS}` | project-config.conventions.feature_structure | `["types","api","hooks","components"]` |

**Resolution**: `Read project-config.json → プレースホルダー解決 → 解決済みの値を使用`
**Fallback**: project-config.json がなければ Default 列を使用

**FORBIDDEN**: 生成コード、コマンド、ファイルパスにリテラル `src/features/`、`src/shared/` の使用禁止。

### Phase 0: CONTEXT.json 検証 (Context Validation)

> **必須前提**: feature-architect が生成した CONTEXT.json が存在すること。

1. **CONTEXT.json 存在確認**:

   ```
   docs/features/<機能ID>/CONTEXT.json の存在確認
   ├── 存在 → Phase 1 へ進む
   └── 不在 → エラー: "CONTEXT.json がありません。feature-architect を先に実行してください。"
   ```

2. **CONTEXT.json ロード及び検証**:

   ```
   CONTEXT.json で必須フィールドを確認:
   ├── feature_id
   ├── title
   ├── why
   └── quick_resume.current_state == "SpecDrafting"
   ```

3. **機能情報の抽出**:
   - CONTEXT.json から why, user_story, requirements, assumptions を読む
   - 追加入力があれば CONTEXT 情報とマージ

4. **BRIEF.md 検証及び抽出**:

   ```
   CONTEXT.json の artifacts.brief パスから BRIEF.md を確認
   ├── 存在 → BRIEF から以下の情報を抽出:
   |   ├── Section 0: 原文リクエスト (FR 設計時に意図を参照)
   |   ├── Section 2: User Stories → FR マッピングの基準
   |   ├── Section 4: BDD AC → FR AC 参照
   |   ├── Section 5: In/Out Scope → SPEC §1.4 Goals/Non-Goals
   |   └── Section 6: Constraints → SPEC §0 に反映
   └── 不在 → Warning: "BRIEF.md がありません。意図の追跡が制限されます。"
             (エラーではない - SPEC 生成を続行)
   ```

5. **検証結果の出力**:

   ```markdown
   CONTEXT.json 検証完了

   **機能ID**: 001-user-dashboard
   **機能名**: ユーザーダッシュボード

   **CONTEXT から抽出された要素**:

   - Why: 業務効率 30% 向上
   - ユーザーストーリー: ユーザーとしてダッシュボードを管理したい
   - 要求事項: ウィジェットの追加/削除/お気に入り機能

   → SPEC 生成のためのコンテキスト収集を開始する。
   ```

### Phase 1: コンテキスト収集 (Context Discovery)

1. **CONTEXT.json 参照** (読み取り専用):
   - `docs/features/<feature-id>/CONTEXT.json` を読む (Phase 0 で検証済み)
   - references セクションで関連コード/スペックのパスを確認
   - **このステップでは CONTEXT.json を生成しない** (feature-architect の責務)

2. **必須ファイルの収集**:

   | カテゴリ             | ファイル                                                                                                 |    必須    | 抽出情報                               |
   | -------------------- | ---------------------------------------------------------------------------------------------------- | :--------: | --------------------------------------- |
   | **型定義**        | `{FEATURES_DIR}/<feature>/types/*.ts`                                                                  |    必須    | TypeScript インターフェース、Zod スキーマ       |
   | **API Route**        | `{SOURCE_ROOT}の API ルート (フレームワークによる)`                                                     | 条件付き\*   | レスポンススキーマ、エラーコード              |
   | **既存 SPEC**        | `docs/features/*/SPEC-*.md`                                                                          |    任意    | 参考パターン                               |
   | **既存コード**        | `{FEATURES_DIR}/<feature>/components/`, `{FEATURES_DIR}/<feature>/hooks/`, `{FEATURES_DIR}/<feature>/api/`  |    任意    | 既存パターン                               |
   | **デザインアセット**      | `docs/features/<feature-id>/design/`                                                                 |    任意    | カラートークン、レイアウト参照               |
   | **UI Flow SSOT**     | `docs/ui-flow/ui-flow.json`                                                                          |    必須    | 既存パネル/状態/SSE/フェーズ定義          |

   > 条件付き\* = 該当機能が API Route を使用する場合は必須

3. **CONTEXT.json references セクション** (関連コード情報):
   ```json
   {
     "references": {
       "related_specs": ["SPEC-003-notification-settings.md"],
       "related_code": {
         "components": ["{FEATURES_DIR}/dashboard/components/*.tsx"],
         "hooks": ["{FEATURES_DIR}/dashboard/hooks/*.ts"],
         "api": ["{FEATURES_DIR}/dashboard/api/*.ts"]
       },
       "api_routes": ["{SOURCE_ROOT}/api/dashboard/ (フレームワーク別パス)"]
     }
   }
   ```

### Phase 2: 対話形式の明確化 (Interactive Clarification)

> **原則**: 最大 7 問に圧縮してユーザーに質問する

#### Q&A → BRIEF.md 記録プロトコル

> Phase 2 の各質問-回答ペアを BRIEF.md Section 8 (Clarification Log) に記録する。

**記録手順**:

1. ユーザーに質問し、回答を受け取る
2. BRIEF.md の Section 8 テーブルに行を追加:
   ```markdown
   | {番号} | {質問内容} | {回答内容} | {影響セクション} | {日付} |
   ```
3. 回答に応じて BRIEF.md の関連セクションも更新する (例: Scope 変更時は Section 5 を修正)

**例**:

```markdown
| 1 | オフラインデータ追加時の処理方法? | ローカル保存後に同期 | §5 Scope, §6 Constraints | 2026-02-11 |
| 2 | エラー表示方式? | トースト | §4 AC-03 | 2026-02-11 |
```

#### 7問上限ルール (Autonomy Control)

| 質問カウント | 状態         | 動作                         |
| :---------: | ------------ | ---------------------------- |
|     1-6     | 通常         | 質問後に待機                 |
|      7      | 上限到達    | 最後の質問後に**自律停止** |
|    7 超過   | AwaitingUser | 追加質問不可、デフォルト値を選択  |

**7問上限到達時の処理**:

1. CONTEXT.json の `quick_resume.question_count` を 7 に設定
2. `quick_resume.current_state` を `AwaitingUser` に遷移
3. 未回答の項目は**デフォルト値(推奨案)を自動選択**または**仮定(Assumption)として記録**
4. ユーザーに上限到達を通知:

   ```markdown
   7問質問の上限に到達

   未回答の項目は推奨案として自動選択された:

   - Q4: オフライン動作 → "ローカル保存後に同期" (推奨案)
   - Q5: エラー表示 → "トースト" (推奨案)

   この仮定を変更する場合は回答してください。
   そうでない場合は SPEC 生成を続行する。
   ```

**CONTEXT.json question_count 更新**:

```json
{
  "quick_resume": {
    "question_count": 3,
    "current_state": "SpecDrafting"
  },
  "autonomy_control": {
    "max_questions_per_session": 7,
    "current_autonomy_level": "supervised"
  }
}
```

**質問カテゴリ** (各カテゴリで必要なもののみ):

| カテゴリ               | 質問例                                                    |
| ---------------------- | ------------------------------------------------------------ |
| **画面/UX**            | 新規画面 vs 既存画面拡張? エラー表示方式(トースト/ダイアログ)? |
| **状態管理**          | 状態単位(画面別/グローバル)? 失敗状態を含むか?                    |
| **データ**             | 新規データ構造が必要か? API 連携方式?                          |
| **テスト**             | 統合テストの範囲? モッキング(mock)方針?                           |
| **Product/Engagement** | Engagement コアループ? Aha Moment? 無料/有料の境界線?            |

**質問形式**:

```markdown
## SPEC 生成のための明確化質問

入力を分析した結果、以下の事項の確認が必要である:

### Q1. 画面構成 [UX]

この機能を**新しいパネル**として追加するか、既存の**パネルに統合**するか?

- [ ] A: 新パネル (レイアウトに追加)
- [ ] B: 既存パネル内のセクションとして統合 (推奨)

### Q2. データ連携 [DATA]

API とのデータ連携方式はどうするか?

- [ ] A: リアルタイムストリーミング (推奨)
- [ ] B: ポーリング
- [ ] C: MVP では除外

(最大 7 問)
```

### Phase 3: SPEC 生成 (Spec Generation)

1. **2 案の提示** (保守的/拡張的):

   ```markdown
   ## SPEC 草案の提案

   ### Option A: 保守的アプローチ

   - 既存システムを再利用
   - 新規データ構造 1 個
   - 実装複雑度: 低

   ### Option B: 拡張的アプローチ

   - カスタムアルゴリズムを導入
   - 新規データ構造 3 個
   - 実装複雑度: 高

   どちらの方向で進めるか?
   ```

2. **選択後に SPEC 生成**:
   - `SPEC-<NNN>-<feature-name>.md` を生成
   - `screens/<screen-name>.md` を生成 (**feature_type 別の必須/任意判定** — 下記参照)

   **Screen 文書生成ルール** (feature_type 基準):

   |  feature_type   | screens/ 生成 | 条件                                                |
   | :-------------: | :-----------: | --------------------------------------------------- |
   | **ui_feature**  |   **必須**    | 最低 1 個の Screen 文書が必須。欠落時は Readiness Gate No-Go |
   | backend_feature |     不要    | サーバーロジック専用 — Screen 該当なし                   |
   | system_feature  |     任意      | 設定 UI などユーザー向け画面があれば生成           |

   > **CONTEXT.json の `feature_type` フィールドを必ず確認**して判定する。
   > `feature_type` が null または未設定の場合、BRIEF/SPEC の内容から UI 画面の有無を推論して判定する。

   **§6.5 Product Requirements の生成** (ユーザー向け機能のみ):
   - BRIEF §5.5 → SPEC §6.5.1 Engagement Loop (Hook Model 4 段階 → 実装可能なトリガー/報酬メカニズム)
   - BRIEF §5.6 → SPEC §6.5.2 Competitive Context (差別化ポイント → 実装優先度に反映)
   - BRIEF §5.7 → SPEC §6.5.3 Conversion Design (Soft Paywall トリガー条件 → FR に分解)
   - Backend-only 機能: §6.5 に "N/A - Backend-only" と表記

3. **Screen 文書 §13 Design Reference の自動生成**:

   ```
   docs/features/<feature-id>/design/ ディレクトリの存在確認
   ├── 存在 → Screen 文書に §13 Design Reference を追加:
   |   ├── design/ 内のファイル一覧 → ファイルテーブル生成
   |   ├── code.html が存在する場合 → カラートークン抽出 (hex → Theme マッピングの注意警告を含む)
   |   ├── Screen Doc とデザインの差異 → 差異テーブル生成
   |   └── CONTEXT.json の artifacts.design_assets を更新
   └── 不在 → §13 を省略 (ディレクトリ自体は生成しない)
   ```

   > **SSOT 原則**: §13 は視覚的な参考用であり、Screen Doc §3~§8 が実装の定義である。

4. **§1.5 UI Flow Contract の生成** (ui_feature 必須):

   > Phase 1 で収集した `docs/ui-flow/ui-flow.json` を参照して §1.5 を生成する

   ```
   feature_type 判定:
   ├── ui_feature → §1.5 UI Flow Contract を必須生成
   ├── backend_feature → "N/A - Backend-only 機能のため UI Flow Contract を省略"
   └── system_feature → UI 画面がある場合のみ生成
   ```

   **生成プロセス**:

   ```
   1. ui-flow.json から既存の panels/sse_mapping/phases を読む
   2. この機能が追加/変更するパネルを特定:
      ├── 新パネル → operation: "new"、visibility 条件を定義
      ├── 既存変更 → operation: "modify"、変更内容を記述
      └── 参照のみ → operation: "reference"
   3. §1.5.1 パネル宣言テーブルを生成
   4. §1.5.2 SSE イベントマッピングテーブルを生成
   5. §1.5.3 フェーズ統合テーブルを生成
   6. §1.5.4 状態遷移ダイアグラムを生成
   7. json:schema/ui_flow_contract ブロックを生成 (機械可読)
   ```

   **検証**: `panels[].name` が ui-flow.json の既存パネル名規約に従っているか

### Phase 3.5: API Contract & NFR 生成 (必須)

> "常に必須" - AI が API 契約と品質基準を明確に把握するため

#### API Contract (必須)

**判断基準**:

```
API Route の使用有無:
├── 使用しない → "N/A - クライアントサイドのみ" と明示 (空セクション禁止)
├── 使用する (エンドポイント 1-2 個)
|   └── SPEC 内の API Contract セクションに直接記述
└── 使用する (エンドポイント 3 個以上)
    └── 別途 API-{NNN}-{name}.md を生成 + SPEC からリンク
```

**API Contract 必須要素**:

| 要素               | 必須 | 内容                                             |
| ------------------ | :--: | ------------------------------------------------ |
| エンドポイント一覧    | 必須 | Method, Path, Auth の有無                          |
| Request Schema     | 必須 | Zod スキーマ (required, properties)                |
| Response Schema    | 必須 | Zod スキーマ (status, data, error)                 |
| Error Codes        | 必須 | HTTP コード、アプリエラーコード、クライアント側の対応         |

**スキーマ抽出プロセス**:

```
1. API Route の route.ts を読む
2. Zod スキーマまたはレスポンス型定義を検索
3. エラーハンドリングコードからエラーコードを抽出
4. API Contract セクションにスキーマ形式で文書化
```

**SSOT 原則の案内**:

```markdown
> **SSOT 原則**
>
> コードの Zod スキーマ/型定義が真実の源泉である。
> 本文書はコードを反映しており、矛盾時はコードが優先される。
>
> API Route コードの位置: `{SOURCE_ROOT}の API ルートディレクトリ (フレームワークによる)`
```

#### Verified Dependencies (必須)

> 外部 API/サービス/ライブラリの互換性検証状態を記録する。

| 外部システム | 用途 | API/SDK | verified | verification_source | verified_at |
|------------|------|---------|:--------:|--------------------|----|
| Supabase Auth | 認証 | supabase-js v2 | true | context7: supabase/auth | 2026-03-26 |
| Google Maps | 地図 | @googlemaps/api | false | - | - |

**verified 判定基準**:
- `true`: context7 MCP または WebSearch で API 互換性/バージョン確認完了
- `false`: AI の知識のみによる推定。実装時に確認が必要。リスクセクションに自動反映。

**機械可読ブロック** (SPEC に含める):
```json:schema/verified_dependencies
{
  "dependencies": [
    {
      "name": "サービス名",
      "purpose": "用途",
      "api_version": "SDK/API バージョン",
      "verified": true,
      "verification_source": "context7 または WebSearch の出典",
      "verified_at": "ISO 8601"
    }
  ],
  "unverified_count": 0,
  "risk_level": "low|medium|high"
}
```

> **Gate**: `unverified_count > 0` の場合、リスクセクションに「未検証の外部依存」リスクを自動追加。

#### NFR (必須)

> パフォーマンス、同時接続、コスト、可観測性の要求事項を明示する

**必須項目**:

| 項目              |    必須    | 該当なしの場合              |
| ----------------- | :--------: | ------------------------- |
| パフォーマンス (応答時間)  |    必須    | "一般的な CRUD - 標準を適用"   |
| 信頼性 (リトライ)   |    必須    | ポリシーの明示が必須            |
| コスト (AI 使用時) | 条件付き\*   | N/A (AI 未使用)           |
| 可観測性            |    任意    | "標準ロギングを適用"          |

> 条件付き\* = AI/LLM を使用する機能でのみ必須

**分離判断時の質問 (7 問上限内)**:

API の複雑度が不確定な場合はユーザーに確認する:

```markdown
### Q. API 文書分離 [API]

API Route が 3 個以上、または API 契約が複雑である。どう処理するか?

- [ ] A: SPEC 内に統合 (簡素化を推奨)
- [ ] B: 別途 API-{NNN}.md に分離 (詳細管理が必要な場合)
```

### Phase 3.7: 並列実装ガイド生成 (Parallel Implementation Guide)

> **適用条件**: FR が 3 個以上の機能でのみ生成。2 個以下は `N/A - 順次実装` と表記。

#### 生成プロセス

1. **FR 依存性分析** (レイヤーベースの自動推論):

   ```
   Type/Schema FR  → depends_on なし
   Hook FR         → Type/Schema に依存
   Component FR    → Hook に依存
   API Route FR    → 独立 (サーバーサイド)
   ```

2. **トポロジカルソート** → 並列配置を自動計算

3. **各 FR のファイルを Foundation/Backend/Frontend/Test に分類**

4. **§0.10, §0.11 セクション生成**

#### §0.10 FR Dependency Graph テンプレート

```markdown
### 0.10 FR Dependency Graph

#### 0.10.1 依存性テーブル

|   FR-ID    | 説明   | depends_on | レイヤー      | 複雑度 |
| :--------: | ------ | :--------: | ----------- | :----: |
| FR-{NNN}01 | {説明} |     -      | Type/Schema |   S    |
| FR-{NNN}02 | {説明} | FR-{NNN}01 | Hook        |   M    |
| FR-{NNN}03 | {説明} | FR-{NNN}01 | Hook        |   M    |
| FR-{NNN}04 | {説明} |   02, 03   | Component   |   L    |
| FR-{NNN}05 | {説明} |     -      | API Route   |   M    |

レイヤー: Type/Schema | Hook | Component | API Route | Page
複雑度: S (<50 LOC) | M (50-150) | L (150-300) | XL (300+)

#### 0.10.2 並列配置 (トポロジカルソート)

| バッチ | FR 一覧      | 並列可能 | 予想時間 |
| :--: | ------------ | :------: | :------: |
|  B1  | FR-01, FR-05 |   Yes    |   N分    |
|  B2  | FR-02, FR-03 |   Yes    |   N分    |
|  B3  | FR-04        |    No    |   N分    |
```

#### §0.11 Parallel Work Units テンプレート

```markdown
### 0.11 Parallel Work Units

#### 0.11.1 Foundation (Lead Agent)

| 項目           | ファイル         | 関連 FR |
| -------------- | ------------ | :----: |
| Zod スキーマ     | `types/*.ts` |  ALL   |
| Hook Interface | `hooks/*.ts` |  ALL   |
| Barrel File    | `index.ts`   |  ALL   |

#### 0.11.2 Backend Work Units

| PWU-ID | FR-ID | 作業   | ファイル                     |
| :----: | :---: | ------ | ------------------------ |
| BE-01  | FR-XX | {説明} | `api/*.ts`               |
| BE-02  | FR-XX | {説明} | `{SOURCE_ROOT}/api/*/route.{ext}` (フレームワークによる) |

#### 0.11.3 Frontend Work Units

| PWU-ID | FR-ID | 作業   | ファイル               |
| :----: | :---: | ------ | ------------------ |
| FE-01  | FR-XX | {説明} | `hooks/*.ts`       |
| FE-02  | FR-XX | {説明} | `components/*.tsx` |

#### 0.11.4 Test Work Units

| PWU-ID  | FR-ID | 対象      | ファイル                                            |
| :-----: | :---: | --------- | ----------------------------------------------- |
| TEST-01 | FR-XX | Hook      | `tests/unit/features/.../hooks/*.test.ts`       |
| TEST-02 | FR-XX | Component | `tests/unit/features/.../components/*.test.tsx` |

#### 0.11.5 Integration Checklist

- [ ] Hook → 実際の API に接続
- [ ] Component → 実際の Hook にバインディング
- [ ] make q.lint エラー 0
- [ ] make q.test 全体通過
```

### Phase 4: 検証及び引き継ぎ (Validation & Handover)

0. **BRIEF <-> SPEC Traceability マッピング** (BRIEF 存在時):

   > BRIEF.md が存在する場合、CONTEXT.json の traceability セクションを埋める。

   **マッピングプロセス**:

   ```
   1. BRIEF Section 2 から User Story ID を抽出 (US-01, US-02, ...)
   2. BRIEF Section 4 から BDD AC 名を抽出 (AC-01, AC-02, ...)
   3. 生成された SPEC から FR ID を抽出 (FR-XXXNN)
   4. マッピング生成:
      - user_story_to_fr: 各 US → 関連 FR マッピング
      - bdd_to_fr: 各 AC → 関連 FR マッピング
   5. マッピングされなかった項目 → unmapped_* 配列に記録
   6. CONTEXT.json の traceability セクションに保存
   ```

   **CONTEXT.json 更新例**:

   ```json
   {
     "traceability": {
       "user_story_to_fr": [
         { "user_story_id": "US-01", "fr_ids": ["FR-00101", "FR-00102"] },
         { "user_story_id": "US-02", "fr_ids": ["FR-00103"] }
       ],
       "bdd_to_fr": [
         { "scenario_name": "AC-01", "fr_ids": ["FR-00101"] },
         { "scenario_name": "AC-02", "fr_ids": ["FR-00102", "FR-00103"] }
       ],
       "unmapped_user_stories": [],
       "unmapped_bdd_scenarios": [],
       "validated_at": null
     }
   }
   ```

   **未マッピング項目の処理**: unmapped 配列に項目がある場合 Warning を出力:

   ```markdown
   Traceability Warning:

   - US-03: FR マッピングなし (Out of Scope かどうか確認が必要)
   - AC-04: FR マッピングなし
   ```

1. **クロスリファレンス検証 (Cross-Reference Validation)** 必須:

   > **目的**: Target Files で定義した項目が Data Schema に反映されているか確認する

   | 定義した項目     | Target Files 必須項目                 | 検証 |
   | --------------- | -------------------------------------- | :--: |
   | 新規 Zod スキーマ | `Type/Schema` レイヤー + ファイルパス       |  OK  |
   | 新規 API Route  | `API Route` レイヤー + ディレクトリ          |  OK  |

   **検証プロセス**:

   ```
   1. 新規 Zod スキーマ定義の有無を確認
      ├── 定義あり → Target Files に Type/Schema レイヤーが存在するか確認
      |   ├── 存在 → Pass
      |   └── 欠落 → 追加が必要: `{FEATURES_DIR}/{feature}/types/{schema}.ts`
      └── 既存の再利用のみ → N/A (Type/Schema レイヤーは省略可能)

   2. 新規 API Route 定義の有無を確認
      ├── 定義あり → Target Files に API Route レイヤーが存在するか確認
      └── 既存再利用/N/A → API Route レイヤーは省略可能
   ```

   **自動修正**: 検証失敗時、§0.1 Target Files に欠落レイヤーを自動追加する

1-B. **§0.10/§0.11 クロス検証** (FR 3 個以上の場合):

| 検証項目                          | 条件                                          | 結果 |
| ---------------------------------- | --------------------------------------------- | :--: |
| 全 FR が §0.10 に登録             | §2 の FR 一覧 ↔ §0.10 依存性テーブル            |  OK  |
| 循環依存なし                      | depends_on グラフにサイクルなし               |  OK  |
| §0.1 ファイル ↔ §0.11 PWU マッピング        | Target Files の全ファイルが PWU に割当完了     |  OK  |
| Foundation の完全性                   | 全 Zod スキーマ + Hook Interface が §0.11.1 に登録 |  OK  |

**検証プロセス**:

```
1. §2 の FR 一覧を抽出 → §0.10 依存性テーブルと対照
   ├── 全部登録済み → Pass
   └── 欠落 FR あり → §0.10 への追加が必要
2. depends_on グラフで循環を検出 (DFS ベース)
   ├── 循環なし → Pass
   └── 循環を発見 → 依存性の再設計が必要
3. §0.1 Target Files のファイル → §0.11 PWU マッピングを検証
   ├── 全部マッピング済み → Pass
   └── 未マッピングのファイル → 適切な PWU への割当が必要
```

2. **自己検証チェックリスト**:

   **セクション 0 必須項目**:
   - [ ] **§0.0 Project Context**: ネーミング規則、用語集の参照
   - [ ] **§0.1 Target Files**: Glob パターン、条件付きファイルの条件を明示
   - [ ] **§0.2.1 Core State**: 主要な状態要素、状態 enum 定義
   - [ ] **§0.2.2 Architecture Guidance**: Hook/Component の分離基準、ネーミング規則
   - [ ] **§0.2.3 State Transitions**: 状態一覧 + 遷移テーブル
   - [ ] **§0.3 Error Handling**: エラー種別ごとの処理方針
   - [ ] **§0.4.1 Data Schema**: Zod スキーマのフィールド/型/nullable 定義
   - [ ] **§0.5 API Contract**: Request/Response Schema, Error Codes (または N/A)
   - [ ] **§0.6 NFR**: パフォーマンス目標、AI コスト上限 (該当時)
   - [ ] **§0.7 AI Logic & Prompts (AI 機能)**:
     - [ ] AI 未使用時は "N/A" と明示
     - [ ] AI 使用時は System Prompt + Response Schema を定義
   - [ ] **§0.8 Safety & Guardrails (AI 機能)**: 入出力検証、Rate Limiting
   - [ ] **§0.9 Design Tokens**: 使用するテーマトークンの参照
   - [ ] **§0.10 FR Dependency Graph** (FR 3 個以上時): 依存性テーブル、並列配置
   - [ ] **§0.11 Parallel Work Units** (§0.10 存在時): Foundation/BE/FE/Test 分解

   **概要セクション**:
   - [ ] **§1.4 Goals / Non-Goals**: 範囲の明確化
   - [ ] **§1.5 UI Flow Contract**: パネル宣言/SSE/フェーズ + `json:schema/ui_flow_contract` ブロック

   **外部依存性**:
   - [ ] **Verified Dependencies**: 全ての外部依存に verified フラグが存在
   - [ ] **未検証項目**: unverified_count > 0 ならリスクに「未検証の外部依存」を反映

   **機能要求事項**:
   - [ ] SPEC の全 FR が入力された要求事項をカバー
   - [ ] 全 AC が **BDD 5 カラムテーブル形式**
   - [ ] 全 FR に **Exception Flows テーブル** が存在
   - [ ] **§2.X Business Rules**: pseudocode + Edge cases

   **検証 & テスト**:
   - [ ] **§5.1 Test Scenarios**: 正常/空/エラーシナリオの一覧
   - [ ] **§5.2 Acceptance Checklist**: 手動検証項目

   **メッセージ定義**:
   - [ ] **§6 メッセージ定義**: messages.ts のキー一覧 (日本語)

   **Product Requirements** (ユーザー向け機能のみ):
   - [ ] **§6.5.1 Engagement Loop**: Hook Model 4 段階 + Aha Moment 定義 (N/A 許容)
   - [ ] **§6.5.2 Competitive Context**: 競合ベンチマーク (N/A 許容)
   - [ ] **§6.5.3 Conversion Design**: 無料/有料の境界 + Soft Paywall (N/A 許容)

   **一般**:
   - [ ] 空セクションなし (該当なしの場合は "N/A" と明示)
   - [ ] SSOT 参照パスが正確

3. **引き継ぎメッセージ**:

   ```markdown
   SPEC 生成完了

   生成されたファイル:

   - docs/features/001-user-dashboard/SPEC-001-user-dashboard.md
   - docs/features/001-user-dashboard/screens/dashboard-overview.md

   次のステップ:
   → 検証を進めた後、実装を開始する。
   ```

---

## SPEC 必須セクション (プロジェクト技術スタック最適化)

> **v3.0**: IEEE 830 SRS + FSD/FRD 統合、Zero-Context 実装対応

| #         | セクション                      |    必須    | 説明                                                      |
| --------- | ------------------------- | :--------: | --------------------------------------------------------- |
| **0.0**   | **Project Context**       |    必須    | ネーミング規則、用語集の参照                                  |
| 0.1       | Target Files              |    必須    | 影響範囲 (Glob パターン) + 条件付きファイル                       |
| **0.2.1** | **Core State**            |    必須    | 主要な状態要素、状態 enum                                 |
| **0.2.2** | **Architecture Guidance** |    必須    | Hook/Component 分離基準、ネーミング規則                     |
| **0.2.3** | **State Transitions**     |    必須    | 状態一覧 + 遷移テーブル                                   |
| 0.3       | Error Handling            |    必須    | エラー種別ごとの処理方針                                     |
| 0.4.1     | Data Schema               |    必須    | Zod スキーマ + TypeScript フィールド/型定義                    |
| 0.5       | API Contract              |    必須    | Request/Response Schema, Error Codes                      |
| 0.6       | NFR                       |    必須    | パフォーマンス、コスト (AI 使用時)                                   |
| 0.7       | AI Logic & Prompts        | 条件付き\*   | System Prompt, Response Schema (AI 機能では必須)             |
| 0.8       | Safety & Guardrails       | 条件付き\*   | 入出力検証、Rate Limit (AI 機能では必須)                    |
| **0.9**   | **Design Tokens**         |    任意    | 使用するテーマトークンの参照                                   |
| **0.10**  | **FR Dependency Graph**   |    任意    | FR 間の依存性 DAG + 並列配置 (FR 3 個以上では必須)           |
| **0.11**  | **Parallel Work Units**   |    任意    | Foundation/Backend/Frontend/Test 分解 (0.10 存在時は必須) |
| 1         | 概要                      |    必須    | WHY, User Story, MVP 範囲                                 |
| 1.4       | Goals / Non-Goals         |    必須    | 範囲の明確化                                               |
| **1.5**   | **UI Flow Contract**      | 条件付き\*\* | 状態駆動パネル表示契約 (`ui-flow.json` SSOT 連動、SPA パネルアーキテクチャ使用時に必須) |
| 2         | 機能要求事項             |    必須    | FR 単位の詳細 (BDD AC, EC, EF)                             |
| **2.X**   | **Business Rules**        |    必須    | ビジネスロジック pseudocode                                  |
| 3         | 依存性 & リスク           |    必須    | 先行依存性、リスク                                       |
| 4         | 画面文書                 |    任意    | Screen 文書の参照 (UI 変更時)                             |
| **5**     | **検証 & テスト**         |    必須    | Test Scenarios, Acceptance Checklist                      |
| **6**     | **メッセージ定義**           |    必須    | messages.ts のキー一覧                                       |
| **6.5**   | **Product Requirements**  |    任意    | Engagement Loop, Conversion, AARRR (ユーザー向け機能のみ)   |
| **7**     | **変更履歴**             |    必須    | バージョン管理                                                 |

> 条件付き\* = AI/LLM 使用機能でのみ必須、未使用時は "N/A" と明示

---

## 失敗ケースへの対処

| ケース                         | 対処                                                         |
| ------------------------------ | ------------------------------------------------------------ |
| **入力不足**                  | Phase 2 で核心的な質問により補完、最小要求事項を収集           |
| **技術的制約により実装不可**  | 代替案(Plan B)を SPEC に併記                                   |
| **ユーザー回答が曖昧**           | デフォルト値(推奨案)を選択して進行、SPEC に "仮定(Assumption)" を明示 |
| **7 問上限到達**            | 未回答項目は推奨案を自動選択、SPEC に仮定を明示             |
| **Tier 1 セキュリティ作業を検知**      | 自律停止、ユーザー確認が必須 (認証/決済/PII 関連)             |

---

## AI 行動指針

### DO (すべきこと)

- 入力された要求事項を SPEC の全 FR に反映
- 既存パターンを参照 (類似 SPEC ファイルを読む)
- 質問は最大 7 個に圧縮
- 仮定(Assumption)を明示的に記録
- テストパスを具体的に指定

### DON'T (してはいけないこと)

- 入力された要求事項を無視して SPEC を作成
- ユーザー確認なしに新しいデータ構造の追加を決定
- 空セクションのまま SPEC を生成 (記載内容がない場合は "N/A - 該当なし" と明示)
- PRD レベルの膨大な文書を生成 (SPEC は単一機能に集中)

---

## CONTEXT.json 更新 (更新専用)

> **状態遷移**: `SpecDrafting` (維持) → SPEC 生成完了を記録
>
> **注意**: 本スキルは CONTEXT.json を**更新のみ**行う。**生成は feature-architect の責務**である。

作業完了時に**既存の CONTEXT.json を更新**する:

```markdown
## CONTEXT.json 更新内容

1. Read `docs/features/<id>/CONTEXT.json`
2. Edit:
   - quick_resume.current_state → "SpecDrafting"
   - quick_resume.current_task → "SPEC.md 生成完了、Readiness Gate 待機中"
   - quick_resume.next_actions → ["Readiness Gate 実行", "Go 判定時に実装開始"]
   - quick_resume.last_updated_at → 現在時刻
   - progress.fr_total → SPEC に定義された FR 個数
   - progress.details → FR ごとの初期状態 (全て "pending")
   - artifacts.spec → SPEC.md のパス
   - artifacts.screens → Screen 文書のパス一覧
   - artifacts.design_assets → design/ ディレクトリ存在時は `{directory, files}`、不在時は `null`
   - decisions[] += SPEC 作成中の決定を記録
   - history[] += 状態遷移を記録
   - traceability → BRIEF <-> SPEC マッピング結果 (Phase 4 Step 0 で生成)

3. **references.related_code 同期** 必須:

   > **目的**: §0.1 Target Files と CONTEXT.json の一貫性を保証する
   - 新規 Zod スキーマ定義時:
     → `references.related_code.types[]` にファイルパスを追加
     → 例: `"{FEATURES_DIR}/analysis/types/analysis-result.ts"`

   - 新規 Hook 定義時:
     → `references.related_code.hooks[]` にファイルパスを追加
     → 例: `"{FEATURES_DIR}/analysis/hooks/use-analysis.ts"`

   - 新規 Component 定義時:
     → `references.related_code.components[]` にファイルパスを追加
     → 例: `"{FEATURES_DIR}/analysis/components/AnalysisPanel.tsx"`

   - 新規 Page 定義時:
     → `references.related_code.pages[]` にファイルパスを追加
     → 例: `"{SOURCE_ROOT}のページコンポーネント (フレームワーク別のパス)"`
```

**更新例**:

```json
{
  "quick_resume": {
    "current_state": "SpecDrafting",
    "current_task": "SPEC-001.md 生成完了、Readiness Gate 待機中",
    "next_actions": ["Readiness Gate 実行", "Go 判定時に実装開始"],
    "last_updated_at": "2026-02-11T11:00:00+09:00"
  },
  "progress": {
    "percentage": 0,
    "fr_total": 5,
    "fr_completed": 0,
    "fr_in_progress": 0,
    "details": {
      "FR-00101": { "status": "pending", "weight": 1 },
      "FR-00102": { "status": "pending", "weight": 1 },
      "FR-00103": { "status": "pending", "weight": 2 },
      "FR-00104": { "status": "pending", "weight": 1 },
      "FR-00105": { "status": "pending", "weight": 1 }
    }
  },
  "artifacts": {
    "spec": "docs/features/001-user-dashboard/SPEC-001.md",
    "screens": ["docs/features/001-user-dashboard/screens/dashboard-overview-screen.md"]
  },
  "references": {
    "related_code": {
      "types": ["{FEATURES_DIR}/dashboard/types/dashboard-widget.ts"],
      "hooks": ["{FEATURES_DIR}/dashboard/hooks/use-dashboard.ts"],
      "components": ["{FEATURES_DIR}/dashboard/components/DashboardPanel.tsx"],
      "pages": []
    }
  },
  "history": [
    {
      "at": "2026-02-11T11:00:00+09:00",
      "from_state": "InputReceived",
      "to_state": "SpecDrafting",
      "triggered_by": "feature-spec-generator",
      "note": "SPEC-001.md + Screen 文書 1 個を生成"
    }
  ]
}
```

> **注意**: `references.related_code` のファイル一覧は §0.1 Target Files と一致していなければならない。

---

## 使用例

> **前提条件**: CONTEXT.json が存在すること (feature-architect 実行後)

```bash
# 基本的な使い方 - 機能 ID で呼び出す (推奨)
/feature-spec-generator 001-user-dashboard

# 追加要求事項とともに
/feature-spec-generator 001-user-dashboard --req "オフライン同期のサポート"

# feature-pilot から自動呼び出し (ユーザーが直接呼び出す必要はない)
# pilot が architect 完了後に自動で呼び出す
```

**サポートしないパターン**:

```bash
# ユーザーストーリーで直接開始 (非対応 - architect を先に実行する必要あり)
/feature-spec-generator ユーザーとしてダッシュボードを管理したい  # NG

# CONTEXT.json なしで呼び出し (非対応)
/feature-spec-generator --why "業務効率の向上"  # NG
```

---

## 統合ワークフロー

> **Option B 原則**: feature-architect が CONTEXT.json を生成した後にのみ、本スキルが実行される。

```
[意図入力]
  |  ユーザーストーリー / Why / 要求事項 / タスク
  v
[feature-architect] ──────────────────────────┐
  |  意図分析 + ID 割当 + CONTEXT.json 生成   |
  v──────────────────────────────────────────┘
[feature-spec-generator] ─────────────────────┐
  |  CONTEXT.json ベースの SPEC/Screen 生成        |
  |  (CONTEXT 読み取り + 対話による明確化)            |
  v──────────────────────────────────────────┘
[Implementation] → SPEC 準拠の実装
```

> **必須ワークフロー**: architect (CONTEXT 生成) → spec-generator (SPEC 生成) → 実装

---

## 参照文書

- [SPEC テンプレート](../../docs/_templates/spec_template.md)
- [Screen テンプレート](../../docs/_templates/screen_template.md)
- [API テンプレート](../../docs/_templates/api_template.md) - 別途 API 文書を分離する際に使用

### 品質強化テンプレート (SPEC 生成時に必須参照)

SPEC.md 生成時、以下のテンプレートを**必ず Read** して該当セクションを SPEC に含める。

| 優先度 | テンプレート | 用途 | SPEC 収録セクション |
|:--------:|--------|------|---------------|
| **必須** | `references/error-rescue-map-template.md` | API エンドポイントごとのエラーシナリオの事前定義 | §Error & Rescue Map |
| **必須** | `references/interaction-state-coverage-template.md` | UI コンポーネントごとの 5 種類の状態カバレッジマトリクス | §Interaction State Coverage |

**プロセス**:
1. SPEC 生成開始前に両テンプレートを Read
2. 各 API エンドポイントに Error & Rescue Map テーブルを作成 (CRITICAL GAP を自動フラグ)
3. 各 UI コンポーネントに Interaction State Coverage Matrix を作成 (欠落状態を自動フラグ)
4. CRITICAL GAP または HIGH の欠落が 2 個以上の場合、SPEC 完成度の警告を出力

## Not For / Boundaries

- CONTEXT.json の生成 (→ feature-architect)
- コード実装 (→ feature-implementer)
- 既存 SPEC の修正 (→ feature-spec-updater)
- 市場リサーチ/競合分析 (→ discover, research-pilot)

## Maintenance

- **Sources**: spec_template.md, screen_template.md, error-rescue-map-template.md, interaction-state-coverage-template.md
- **Last updated**: 2026-03-26
- **Known limits**: context7/WebSearch 未使用時、verified_dependencies の verified フラグが全て false になる。外部 API の検証は AI が直接行う必要がある。
