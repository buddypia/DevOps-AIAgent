---
name: feature-spec-updater
description: |
  既存のSPECを修正するスキル。新規SPEC生成(feature-spec-generator)とは異なり、既存のSPECをロードして変更された部分のみを更新する。
  変更履歴管理、diff表示、影響範囲分析を提供する。

  「SPEC修正」「SPEC更新」「機能変更」「FR追加」「FR修正」等の要求でトリガーされる。
---

# Feature Spec Update

> **核心コンセプト**: 「変更追跡が可能な修正」(Tracked Modification)
> **SPECフォーマット**: IEEE 830 SRS + FSD/FRD統合、Zero-Context実装対応

既存のSPECを安全に修正するスキル。全体上書きではなく**変更された部分のみを更新**し、**変更履歴**を残す。

## spec-generator vs spec-updater 比較

| 項目             | spec-generator     | spec-updater                     |
| ---------------- | ------------------ | --------------------------------- |
| **用途**         | 新規SPEC生成       | 既存SPEC修正                     |
| **入力**         | CONTEXT.json       | CONTEXT.json + **既存SPEC**      |
| **出力**         | SPEC全体を新規作成 | **変更されたセクションのみ**修正 |
| **変更履歴**     | 初回バージョンのみ | **全変更記録**                   |
| **上書きリスク** | なし（新規）        | **防止ロジック内蔵**             |

---

## プロトコル (Protocol)

### PATH CONTRACT (MANDATORY)

> **BINDING**: 本スキルは動的パスプレースホルダーを使用する。
> AIはファイル操作前に必ず`project-config.json`からパスを解決しなければならない。
> リテラルパスの使用は**プロトコル違反**である。

| Placeholder | Resolution Source | Default |
|-------------|-------------------|---------|
| `{FEATURES_DIR}` | project-config.paths.features | `src/features` |
| `{DOCS_DIR}` | project-config.paths.docs_features | `docs/features` |

**Resolution**: `Read project-config.json → プレースホルダー解決 → 解決された値を使用`
**Fallback**: project-config.jsonが存在しない場合はDefault列を使用

**FORBIDDEN**: 生成コード、コマンド、ファイルパスにリテラル`src/features/`の使用を禁止する。

### Phase 0: ドキュメント及びコードロード (Document & Code Loading)

1. **必須ファイルロード**:

   ```
   docs/features/<ID>/
   ├── CONTEXT.json          # 統合コンテキスト (SSOT)
   ├── SPEC-<ID>-*.md        # 既存SPEC (必須)
   └── CONTEXT.json          # 統合コンテキスト (SSOT)

   フレームワーク別APIディレクトリ  # $0.5変更時に必須
   └── [endpoint]/route.ts   # APIルートコード（フレームワークによりパスが異なる）
   ```

   > **参考**: `CONTEXT.json`が唯一のコンテキストSSOTである。

2. **変更タイプ別ファイル収集**:

   | 変更タイプ            | 追加収集が必要なファイル          |
   | --------------------- | -------------------------------- |
   | $0.4 Zodスキーマ変更  | `{FEATURES_DIR}/*/types/*.ts`    |
   | $0.5 API契約変更      | フレームワーク別APIルートファイル |
   | $0.6 NFR変更          | 既存SPECのパフォーマンス/コストセクション |
   | $0.9 Design Token変更 | フレームワーク別グローバルスタイルファイル（例: globals.css） |

3. **SPEC未存在時のリジェクト**:

   ```markdown
   既存SPECなし - spec-generatorへの切り替えが必要

   `docs/features/001-user-dashboard/SPEC-*.md`が存在しない。

   -> /feature-spec-generator 001 を実行してSPECを先に生成すること。
   ```

### Phase 1: 変更範囲分析 (Change Scope Analysis)

1. **変更タイプ判別**:

   | 変更タイプ                | トリガーシグナル                | 影響範囲                   | 影響セクション   |
   | ------------------------- | ------------------------------ | -------------------------- | ---------------- |
   | **Project Context変更**   | 命名規則の変更                 | AI実装契約の修正           | $0.0     |
   | **FR追加**                | 「〜機能追加」「新規要求事項」  | 新しいFRセクションの作成    | $2               |
   | **FR修正**                | 「FR-XXXXX変更」「動作修正」   | 該当FRのみ修正             | $2               |
   | **FR削除**                | 「FR-XXXXX削除」「機能削除」   | 該当FR削除 + 影響分析       | $2, $3           |
   | **セクション0修正**        | Target Files、Architecture変更 | AI実装契約の修正           | $0.1~$0.3       |
   | **React Hook仕様変更**    | ライフサイクル/依存配列の変更   | Hookライフサイクル          | $0.2.2   |
   | **State Transitions変更** | 状態マシンの変更               | 状態遷移図                 | $0.2.3   |
   | **Error Handling変更**    | エラーハンドリングポリシーの変更 | 4レベルエラー処理           | $0.3 |
   | **Zodスキーマ変更**       | バリデーションの追加/修正       | 型定義 + バリデーション     | $0.4             |
   | **API Contract変更**      | Request/Responseの変更         | API Contractドキュメント    | $0.5             |
   | **NFR変更**               | パフォーマンス/コスト目標の変更 | 非機能要求事項              | $0.6             |
   | **AI Prompt変更**         | プロンプト/レスポンススキーマの変更 | AI Logicドキュメント     | $0.7             |
   | **AI安全性変更**          | 検証ルール/Rate Limitの変更     | Safetyドキュメント          | $0.8             |
   | **Design Token変更**      | テーマトークンの追加/変更       | UI一貫性                   | $0.9     |
   | **Goals/Non-Goals変更**   | 範囲の拡大/縮小                | 範囲定義                   | $1.4             |
   | **Screen Flow変更**       | ナビゲーションの変更            | Screen Flowダイアグラム     | $1.5     |
   | **Business Logic変更**    | コアロジックの変更             | Business Rules pseudocode  | $2.X     |
   | **Exception Flow変更**    | エラー処理方式の変更            | FR内のEFテーブル            | $2 EF            |
   | **Sequence Diagram変更**  | コンポーネントフローの変更      | 依存関係セクション           | $3.4             |
   | **Screen修正**            | UI変更、画面修正                | Screenドキュメント修正      | $4               |
   | **テスト仕様変更**        | テスト条件の変更               | 検証セクション              | $5       |
   | **メッセージキー変更**    | messages.tsキーの追加/変更      | メッセージ定義              | $6       |

2. **影響範囲の出力**:

   ```markdown
   ## 変更範囲分析

   **要求**: 通知方式をメールからプッシュ通知に変更

   ### 影響を受ける項目

   | 項目        | 現在                       | 変更後                     | 影響セクション |
   | ----------- | -------------------------- | --------------------------- | ---------- |
   | FR-00602    | メール送信ロジックを使用    | プッシュ通知送信            | $2         |
   | Zodスキーマ | `emailAddress`フィールド    | `pushToken`フィールド        | $0.4       |
   | Custom Hook | `useEmailNotification()`   | ロジック全面変更            | $0.1       |

   ### 連鎖的影響

   - Screen: notification-settings画面の設定UI
   - Test: `tests/unit/features/notification/hooks/use-push-notification.test.ts`

   ### 追加確認が必要

   - [ ] 既存ユーザーの通知設定移行方針

   このまま進めるか？
   ```

### Phase 2: 修正計画の策定 (Modification Planning)

1. **修正単位の決定**:
   - **Atomic Update**: 単一FRのみ変更（推奨）
   - **Batch Update**: 関連FRをまとめて変更
   - **Major Update**: セクション全体を再作成（注意が必要）

2. **修正前のバックアップ提案**（Major Update時）:

   ````markdown
   Major Update検知

   この変更はSPECの30%以上を修正する。
   進行前にバックアップを推奨する:

   ```bash
   cp SPEC-006-payment-system.md SPEC-006-payment-system.md.bak
   ```
   ````

   続行するか？

   ```

   ```

### Phase 3: SPEC修正 (Spec Modification)

1. **変更の適用**:
   - 既存の内容を維持しつつ変更された部分のみ修正
   - **全体ファイルの再作成は絶対禁止**

2. **変更履歴の追加**（SPEC最下部）:

   ```markdown
   ## 変更履歴

   | バージョン | 日付       | 変更内容                       | 影響FR   |
   | ---- | ---------- | -------------------------------- | -------- |
   | 1.0  | 2026-01-15 | 初回作成                          | -        |
   | 1.1  | 2026-01-25 | メール -> プッシュ通知方式に変更   | FR-00602 |
   ```

3. **diffスタイル出力**:

   ````markdown
   ## 変更内容 (Diff)

   ### FR-00602: 復習間隔計算

   ```diff
   - メールで通知を送信する。
   - emailService.send(to, subject, body)
   + プッシュ通知で通知を送信する。
   + pushService.send(token, title, message)
   ```
   ````

   ### $0.4 Zodスキーマ変更

   ```diff
   import { z } from 'zod';

   export const notificationItemSchema = z.object({
   -   emailAddress: z.string().email(),
   -   emailSubject: z.string(),
   +   pushToken: z.string(),
   +   scheduledAt: z.string().datetime(),
   });

   export type NotificationItem = z.infer<typeof notificationItemSchema>;
   ```

   ```

   ```

### Phase 4: 検証と引き継ぎ (Validation & Handover)

1. **自己検証**チェックリスト:

   **基本検証**:
   - [ ] 変更されたFRのACは完全か？
   - [ ] **ACはBDD 5カラムテーブル形式か？**（`| AC | Given | When | Then | 観測点 |`）
   - [ ] **EF（Exception Flows）テーブルは存在するか？**
   - [ ] 連鎖的に影響を受けるドキュメント（Screen等）も更新されたか？
   - [ ] 変更履歴（$7）が追加されたか？

   **$0.0 Project Context変更時**:
   - [ ] 命名規則は既存パターンと一貫しているか？
   - [ ] 用語集参照（`docs/glossary.md`）は維持されているか？

   **$0.2.2 React Hook Specifications変更時**:
   - [ ] ライフサイクル/依存配列ポリシーは明示されたか？
   - [ ] Hookの生成/消滅タイミングは明確か？

   **$0.2.3 State Transitions変更時**:
   - [ ] 状態遷移ダイアグラムは更新されたか？
   - [ ] 許可された遷移と不変条件は定義されたか？

   **$0.3 Error Handling変更時**:
   - [ ] Hook/API/Component/Globalの4レベルは定義されたか？
   - [ ] 各エラータイプ別の処理ポリシーは明示されたか？

   **$0.4 Data Schema変更時**:
   - [ ] $0.4.1 Zodスキーマは型定義と一致しているか？
   - [ ] $0.4.2 バリデーションルールは完全か？

   **$0.5 API Contract変更時**:
   - [ ] Request/Response SchemaはAPI Routeコードと一致しているか？
   - [ ] Error Codesは完全に定義されたか？
   - [ ] クライアント側の対応方針は明示されたか？

   **$0.6 NFR変更時**:
   - [ ] パフォーマンス目標（応答時間等）は測定可能な形式で記述されたか？
   - [ ] AI使用機能であればコスト上限は明示されたか？

   **$0.7 AI Logic & Prompts変更時**:
   - [ ] System Promptの全文が記載されたか？（要約禁止）
   - [ ] Response SchemaはAPI RouteのresponseSchemaと一致しているか？
   - [ ] Prompt変数注入テーブルは完全か？
   - [ ] 役割定義テーブルは更新されたか？

   **$0.8 Safety & Guardrails変更時**:
   - [ ] 入力/出力検証ルールは明確に定義されたか？
   - [ ] Rate Limitingポリシーは明示されたか？
   - [ ] Fallback戦略 + ユーザーメッセージは定義されたか？

   **$0.9 Design Tokens変更時**:
   - [ ] テーマガイド（`globals.css`）参照は維持されているか？
   - [ ] カスタムトークンが必要であれば定義されたか？

   **$1.4 Goals / Non-Goals変更時**:
   - [ ] Goalsは具体的なチェックリストとして作成されたか？
   - [ ] Non-Goalsに「なぜ除外したか」の理由は明示されたか？

   **$1.5 Screen Flow変更時**:
   - [ ] 画面間ナビゲーションダイアグラムは更新されたか？
   - [ ] 進入点/終了点は明示されたか？

   **$2.X Business Rules変更時**:
   - [ ] ビジネスロジックpseudocodeは更新されたか？
   - [ ] Edge casesは明示されたか？

   **$3.4 Sequence Diagrams変更時**:
   - [ ] Happy Path + Error Pathが最低2つ存在するか？
   - [ ] 責任分担テーブルは更新されたか？
   - [ ] タイムアウトポリシーは明示されたか？

   **$5 検証 & テスト変更時**:
   - [ ] Test Fixturesは更新されたか？
   - [ ] Acceptance Checklistは変更内容を反映しているか？

   **$6 メッセージ定義変更時**:
   - [ ] messages.tsキー命名規則は遵守されたか？
   - [ ] 追加するキー一覧は完全か？

2. **引き継ぎメッセージ**:

   ```markdown
   SPEC修正完了

   **修正されたファイル**:

   - `SPEC-006-payment-system.md`（FR-00602修正）

   **変更概要**:

   - メール -> プッシュ通知方式に変更
   - Data Schema: `pushToken`フィールド追加

   **次のステップ**:
   -> feature-pilotの内蔵Readiness Gateで検証すること。
   または直接実装を開始できる。
   ```

---

## 修正タイプ別詳細

### FR追加

```markdown
## 新規FR追加フォーム

### FR-XXXNN: [機能名]

**Priority**: P0/P1/P2
**Complexity**: Low/Medium/High

#### 説明

[機能説明]

#### Acceptance Criteria (BDD 5カラムテーブル)

| AC  | Given（事前条件） | When（行動） | Then（期待結果） | 観測点          |
| :-: | ----------------- | ----------- | ---------------- | --------------- |
| AC1 | {事前条件}        | {行動}      | {期待結果}       | {検証変数/状態} |
| AC2 | {事前条件}        | {行動}      | {期待結果}       | {検証変数/状態} |

#### Edge Cases

- EC1: [例外状況] -> [処理方法]

#### AI Implementation Hint

- Target: `{FEATURES_DIR}/...`
- Pattern: [参考にする既存コード]
```

### FR修正

1. 既存FR内容を読む
2. 変更部分のみ修正（Editツール使用）
3. 変更履歴に記録

### FR削除

1. 削除するFRを確認
2. 依存する他のFRを確認
3. 削除後の番号再整列は**禁止**（gap維持）
4. 変更履歴に「削除」を記録

### Zodスキーマ変更 ($0.4)

1. 既存の$0.4型定義を読む
2. 変更フィールドのみdiffで表示
3. **Zodバリデーションルールの完全性を確認**
4. 関連するCustom Hookも併せて修正

````markdown
## Zodスキーマ変更例

### $0.4修正

```diff
export const reviewItemSchema = z.object({
+   boxLevel: z.number().int().min(1).max(5),  // 新規
-   intervalDays: z.number().int(),             // 削除予定
});
```
````

> 関連ファイル: `{FEATURES_DIR}/review/types/index.ts`の更新が必要

### API Contract変更 ($0.5)

1. 既存の$0.5 Request/Response Schemaを読む
2. 変更フィールドのみdiffで表示
3. **Error Codesの漏れを確認**（新しいエラー条件が発生する場合）
4. API Routeコードとの同期を確認

```markdown
## API Contract変更例

### Response Schema変更

```diff
{
  "data": {
-   "interval_days": { "type": "integer" },
+   "box_level": { "type": "integer", "minimum": 1, "maximum": 5 },
+   "next_review_at": { "type": "string", "format": "date-time" }
  }
}
````

> API Route同期が必要: フレームワーク別APIルートファイル（例: `{SOURCE_ROOT}/app/api/payment-process/route.ts`）

### NFR変更 ($0.6)

1. 既存の$0.6パフォーマンス/コスト目標を読む
2. 変更項目のみ修正
3. **測定方法の一貫性を維持**

### AI Logic & Prompts変更 ($0.7)

> AI機能でプロンプトやレスポンススキーマを変更する場合

1. 既存の$0.7セクションを読む
2. **変更されるプロンプトの全文を記載**（要約禁止）
3. Response Schema変更時はAPI Routeコードとの同期を確認
4. 変数注入テーブルを更新

```markdown
## AIプロンプト変更例

### $0.7.2 System Prompt変更

**Coach Prompt**（変更）:
```diff
- ## Feedback Rules
- 1. Be encouraging, not critical
+ ## Feedback Rules
+ 1. Be encouraging but direct
+ 2. Always provide the grammar rule name
````

> API Route同期が必要: フレームワーク別APIルートファイル（例: `{SOURCE_ROOT}/app/api/notification-send/route.ts`）

### Safety & Guardrails変更 ($0.8)

> Rate Limit、検証ルール、Fallback戦略変更時

1. 既存の$0.8セクションを読む
2. 変更項目のみdiffで表示
3. **ポリシーの一貫性を維持**

```markdown
## Rate Limit変更例

### $0.8.3 Rate Limiting変更

```diff
| 制限項目 | 無料プラン | 有料プラン | 超過時 |
- | AI呼び出し/日 | 50回 | 500回 | 日次上限通知 |
+ | AI呼び出し/日 | 30回 | 300回 | 日次上限通知 + アップグレード誘導 |
````

> クライアント + API Route両方の更新が必要

### Goals / Non-Goals変更 ($1.4)

> 機能範囲の拡大/縮小時

1. 既存の$1.4セクションを読む
2. Goals追加/削除時は該当FRとの連動を確認
3. **Non-Goals追加時は「なぜ除外したか」の理由が必須**

```markdown
## Non-Goals追加例

### $1.4 Non-Goals変更

```diff
| 除外項目 | 除外理由 | 代替案 |
| データ共有 | MVP範囲超過 | Phase 2 |
+ | AI自動翻訳 | 著作権問題未解決 | ユーザー直接入力 |
````

> 関連FR要求が来た場合はNon-Goalsを参照するよう案内

### Exception Flows追加/修正 ($2 EF)

> エラー処理方式変更時

1. 該当FRのEFテーブルを読む
2. 新しい例外状況を追加、または既存の処理方式を修正
3. **復旧経路の明示が必須**

```markdown
## Exception Flow追加例

### FR-00101 EF変更

```diff
| EF | トリガー条件 | システム反応 | ユーザーメッセージ | 復旧経路 |
| EF3 | 認証期限切れ | トークン更新 | （透過処理） | 失敗時ログイン |
+ | EF6 | ストレージ不足 | エラー状態 | 「ストレージが不足しています」 | キャッシュクリア案内 |
````

### Sequence Diagrams変更 ($3.4)

> コンポーネント間フロー変更時（Tier 1-2）

1. 既存の$3.4ダイアグラムを読む
2. 変更されるステップのみdiffで表示
3. **責任分担テーブル + タイムアウトポリシーの同期**

```markdown
## Sequence Diagram変更例

### SD-001変更（新規ステップ追加）

```diff
User          UI/Page           Custom Hook        API Route
 |               |                  |                 |
 |--[1] 単語入力->|                  |                 |
 |               |--[2] addWord()-->|                 |
+|               |                  |--[2.5] AI検証()->|
+|               |                  |<-[2.6] 検証結果-|
 |               |                  |--[3] POST /api/words->|
````

**責任分担テーブル更新**:
| ステップ | コンポーネント | 責任 |
| 2.5-2.6 | API Route | AIベースの単語検証（新規） |

---

## AI行動指針

### DO（すべきこと）
- 既存SPECをまず完全に読む
- 変更範囲を明確に分析してから修正を開始
- diff形式で変更内容を表示
- 変更履歴（$7）を必ず追加
- 連鎖的に影響を受けるドキュメントを確認
- **$0.0変更時、用語集（`docs/glossary.md`）参照を維持**
- **$0.2.2変更時、React Hookライフサイクルポリシーを明示**
- **$0.2.3変更時、状態遷移ダイアグラムを同期**
- **$0.3変更時、4レベル（Hook/API/Component/Global）を検討**
- **$0.4変更時、Zodスキーマの完全性を確認**
- **$0.5変更時、API Routeコードとの同期を確認**
- **$0.7変更時、プロンプトの全文を記載**
- **$0.8変更時、Rate Limitポリシーの一貫性を維持**
- **$0.9変更時、テーマガイド参照を維持**
- **$1.4 Non-Goals追加時「なぜ除外したか」の理由必須**
- **$1.5変更時、Screen Flowダイアグラムを同期**
- **$2 EF変更時、復旧経路を明示**
- **$2.X変更時、Business Rules pseudocodeを同期**
- **$3.4変更時、責任分担テーブルを同期**
- **$5変更時、Test Fixturesを同期**
- **$6変更時、messages.tsメッセージキー命名規則を遵守**

### DON'T（してはいけないこと）
- SPECファイル全体の再作成（Writeツールでの全体上書き禁止）
- 変更範囲分析なしでの即時修正
- 削除されたFR番号の再利用
- 変更履歴（$7）の欠落
- **SPECのみ修正して実コードとの同期を欠落させること**
- **$0.0用語集のin-SPEC重複定義**
- **$0.5 API変更時のError Codes更新漏れ**
- **$0.7プロンプトを要約して記載すること**
- **$0.8 Fallback戦略なしでのエラー処理変更**
- **$1.4 Non-Goalsで「後で」とだけ記載し理由を欠落させること**
- **$3.4 Sequence Diagram変更時のタイムアウトポリシー欠落**

---

## CONTEXT.json直接更新

> **状態遷移**: `Idle` -> `SpecUpdating`
> **参照**: [context_schema.json](../../docs/_templates/context_schema.json) | [context_template.json](../../docs/_templates/context_template.json)

作業完了時に**CONTEXT.jsonを直接更新**する:

```markdown
## CONTEXT.json更新内容

1. Read `docs/features/<id>/CONTEXT.json`
2. Edit:
   - quick_resume.current_state -> "SpecUpdating"
   - quick_resume.current_task -> "SPEC修正完了、Readiness Gate待ち"
   - quick_resume.next_actions -> ["Readiness Gate実行", "Go時に実装を進める"]
   - quick_resume.last_updated_at -> 現在時刻
   - artifacts.spec -> 修正されたSPECのパス
   - decisions[] += 修正決定の記録
   - history[] += 状態遷移の記録
````

**更新例**:

```json
{
  "quick_resume": {
    "current_state": "SpecUpdating",
    "current_task": "SPEC-006修正完了 - メール -> プッシュ通知に変更",
    "next_actions": ["Readiness Gate実行", "影響を受けるScreenドキュメントを確認"],
    "last_updated_at": "2026-01-25T14:00:00+09:00"
  },
  "decisions": [
    {
      "at": "2026-01-25T14:00:00+09:00",
      "summary": "通知方式をメール -> プッシュ通知に変更",
      "rationale": "実装簡素化 + ユーザーの直感性"
    }
  ],
  "history": [
    {
      "at": "2026-01-25T14:00:00+09:00",
      "from_state": "Idle",
      "to_state": "SpecUpdating",
      "triggered_by": "feature-spec-updater",
      "note": "SPEC v1.1 - FR-00602アルゴリズム変更"
    }
  ]
}
```

---

## 使用例

```bash
# 基本使用（機能ID + 変更内容）
/feature-spec-updater 006 "メール通知をプッシュ通知に変更"

# FR追加
/feature-spec-updater 005 --add-fr "オフラインデータ保存機能"

# FR修正
/feature-spec-updater 006 --modify FR-00602 "通知送信ロジック変更"

# Zodスキーマ変更
/feature-spec-updater 006 --section 0.4 "boxLevelフィールド追加"

# API Contract変更
/feature-spec-updater 002 --section 0.5 "レスポンスにconfidence_score追加"

# 対話モード
/feature-spec-updater 006
```

---

## feature-pilotとの統合

```
[feature-pilot自動判別]
     |
     +-- SPECなし -> /feature-spec-generator
     |
     +-- SPECあり -> /feature-spec-updater <-- 自動選択
```

feature-pilotがMODIFY_FEATUREに分類すると自動的に本スキルが呼び出される。

---

## 参照ドキュメント

- [feature-spec-generatorスキル](../feature-spec-generator/SKILL.md) - 新規SPEC生成用
- [feature-pilotスキル](../feature-pilot/SKILL.md) - 内蔵Readiness Gate検証用
- [SPECテンプレート v3.0](../../docs/_templates/spec_template.md) - IEEE 830 + FSD/FRD統合
- [SPECセクションガイド v3.0](../feature-spec-generator/references/spec-sections.md) - セクション別作成指針
- [CONTEXTスキーマ](../../docs/_templates/context_schema.json) - コンテキストSSOT
- [用語集 (Glossary)](../../docs/glossary.md) - $0.0で参照、in-SPEC重複禁止

## Not For / Boundaries

> 本skillの明示的非対象（R-CM-018 Rule 4 — Missing Boundaries遮断）。詳細なboundaryはfrontmatter description + 本文trigger節を単一の真実の情報源として使用する。

- frontmatter descriptionに明示されたtrigger以外の領域は本skillでは扱わない。
- 関連skill / 呼び出しチェーン / 依存関係は本文またはMANIFEST.jsonを参照。
- 既存SPEC修正 + diff表示のみ担当。新規SPEC生成は`feature-spec-generator`に委任（R-CM-019 whitelist分離）。
- 実装段階のコード変更は`feature-implementer`の領域 — 本skillはSPECドキュメント更新のみ。
- SPEC検証 / Schema整合性は`spec-validator`に委任 — 本skillは作成/diff責任のみ。

## Maintenance

- **Sources**: brief2dev内部（`.claude/rules/` R-CM/R-PL rules + `.claude/skills/`スキルコンベンション）。外部referenceは本文参照。
- **Last updated**: 2026-04-19
- **Known limits**: 本スキルの明示的boundaryはfrontmatter description（`|...`）及び本文参照。
