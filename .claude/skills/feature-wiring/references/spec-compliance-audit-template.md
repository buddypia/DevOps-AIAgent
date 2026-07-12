# SPEC Compliance Audit Template

> **Purpose**: 実装完了後、SPEC.mdのFR/NFR項目と実際のコードを交差検証し、漏れ/範囲超過を検知する
> **When**: feature-wiringの統合検証時、Export/ルート/Lint検証の後に実行

---

## 目的

SPEC.mdが存在していても、実装がSPECを完全に充足しているかを**構造的に**検証するメカニズムがない。
本テンプレートはSPEC項目別にDONE/PARTIAL/NOT_DONE/CHANGED状態をマッピングし、
Scope Drift（SPEC外の実装） + Missing Requirements（SPEC未充足）の双方向検知を行う。

---

## Step 1: SPEC項目の抽出

SPEC.mdを読み、すべての実行可能項目を抽出する。

### 抽出対象

- **FR (Functional Requirements)**: `FR-XXX`または`### FR`配下の項目
- **NFR (Non-Functional Requirements)**: `NFR-XXX`またはパフォーマンス/セキュリティ/アクセシビリティ要求事項
- **API Endpoints**: `api_endpoint`ブロックの各エンドポイント
- **コンポーネント仕様**: `### Components`配下の各コンポーネント
- **テストシナリオ**: `### Test Scenarios`配下の各シナリオ

### 抽出除外

- 背景/コンテキストセクション
- 将来の検討事項（Future、Out of scope）
- 質問/未決事項（TBD、TODO）

### 項目分類

各項目にカテゴリを付与する:

|カテゴリ | 説明 |
|---------|------|
| `CODE` | 実装コードが必要 |
| `TEST` | テスト作成が必要 |
| `API` | APIエンドポイント実装 |
| `UI` | UIコンポーネント実装 |
| `CONFIG` | 設定/環境変数 |
| `DOCS` | ドキュメント作成 |

**上限**: 最大50項目。超過時: 「上位50件中N件を表示 — 全リストはSPEC.mdを参照。」

---

## Step 2: 実装コードとの交差検証

実装されたコード（features/{name}/配下）を読み、各SPEC項目の状態を判定する。

### 判定基準

| 状態 | 定義 | 判定基準 |
|------|------|----------|
| **DONE** | 完全に実装済み | diffから該当機能の明確な証拠。具体的なファイル引用が必須 |
| **PARTIAL** | 部分実装済み | 一部の作業は存在するが不完全（例: モデルはあるがコントローラーが欠落） |
| **NOT_DONE** | 未実装 | diffから該当機能の証拠なし |
| **CHANGED** | 別の方式で実装 | 目標は達成したがSPECと異なるアプローチ。差異を記録 |

**DONE判定は保守的に**: ファイルが変更されただけでは不十分。明示された機能が実際に存在する必要がある。
**CHANGED判定は寛容に**: 目標が別の手段で達成されていれば認める。

---

## Step 3: Scope Drift検知

実装からSPECにない変更を検知する。

### SCOPE CREEPシグナル

- SPECにないファイル変更
- SPECに明示されていない新機能/リファクタリング
- 「ついでに…」変更（blast radius拡大）

### MISSING REQUIREMENTSシグナル

- SPECのFR/NFRがコードに反映されていない
- 明示されたテストシナリオのテストコードが不在
- 不完全な実装（着手したが完了していない）

---

## Step 4: 監査レポート出力

```
SPEC COMPLIANCE AUDIT
═══════════════════════════════
SPEC: docs/features/{name}/SPEC.md
Feature: {feature-name}

## Functional Requirements
  [DONE]      FR-001 検索API — src/features/search/api/search-api.ts (+142 lines)
  [PARTIAL]   FR-002 フィルタリング — カテゴリフィルタはあるが日付フィルタが欠落
  [NOT_DONE]  FR-003 自動補完 — 関連コードなし
  [CHANGED]   FR-004「Redisキャッシュ」→ in-memory LRUキャッシュとして実装

## Non-Functional Requirements
  [DONE]      NFR-001 応答時間200ms以下 — キャッシュレイヤー実装済み
  [NOT_DONE]  NFR-002 アクセシビリティWCAG 2.1 AA — aria属性未適用

## Test Scenarios
  [DONE]      TS-001 キーワード検索 — search.test.ts:15
  [NOT_DONE]  TS-002 空結果処理 — テストなし

## Scope Check
  [SCOPE CREEP] src/shared/utils/debounce.ts — SPECにないユーティリティを追加
  [CLEAN]       残りの変更はSPEC範囲内

─────────────────────────────────
COMPLIANCE: 4/8 DONE, 1 PARTIAL, 2 NOT_DONE, 1 CHANGED
SCOPE: 1 creep detected, 2 requirements missing
─────────────────────────────────
```

---

## 連携

- **NOT_DONE項目** → feature-pilotに未完了作業として報告
- **PARTIAL項目** → CONTEXT.jsonのprogressに反映
- **SCOPE CREEP項目** → 情報提供目的（ブロックしない、ユーザー認知用）
- **COMPLIANCE 80%未満** → feature-wiring FAIL勧告

---

## プラットフォーム非依存

本テンプレートはproject-config.jsonの動的パス解決に従う。
SPECパス: `{FEATURES_DIR}/{name}/SPEC.md`
コードパス: `{FEATURES_DIR}/{name}/`
