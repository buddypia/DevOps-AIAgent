---
name: feature-status-sync
description: |
  対象プロジェクトのCONTEXT.json(SSOT)とindex.mdを同期するスキル。
  CONTEXT.jsonのprogress情報を基にコードの存在有無を検証し、index.mdを生成/更新する。
  feature-pilotの実装完了後、状態更新ステップで呼び出される。
  「機能状態同期」「ドキュメント/コード同期」「index.md更新」「feature status sync」等の要求でもトリガーされる。
---

# Feature Status Synchronizer

## Overview

対象プロジェクトで**CONTEXT.json(SSOT)とコード/ドキュメント間の同期**を実行するスキル。

### SSOT構造

```
CONTEXT.json (SSOT) ← 唯一の真実の情報源
    |
    +--→ コード検証（ファイル存在有無）
    |
    +--→ index.md生成（個別feature view）
    |
    +--→ domain-map.json整合性検証 + 同期 (Phase 7)
    |
    +--→ top-level index.md同期 (Phase 7)
```

> **重要**: `index.md`はSSOTではない。`CONTEXT.json`から**生成されるview**である。

### 問題定義

- CONTEXT.jsonのprogressと実際のコード状態の不一致
- index.mdがoutdatedになり、他のスキルが誤った情報を参照
- スキル間のSSOT不一致による混乱

### 解決方法

1. `CONTEXT.json`から**FR別コードパス**を読む
2. 該当**ファイルが実際に存在するか**を検証
3. **テストファイルの存在有無**も確認
4. `CONTEXT.json` progressを更新
5. `index.md`を再生成

## PATH CONTRACT (MANDATORY)

> **BINDING**: 本スキルは動的パスプレースホルダーを使用する。
> AIはファイル操作前に必ず`project-config.json`からパスを解決しなければならない。
> リテラルパスの使用は**プロトコル違反**である。

| Placeholder | Resolution Source | Default |
|-------------|-------------------|---------|
| `{FEATURES_DIR}` | project-config.paths.features | `src/features` |
| `{TESTS_DIR}` | project-config.paths.tests_unit | `tests/unit` |
| `{DOCS_DIR}` | project-config.paths.docs_features | `docs/features` |
| `{SHARED_DIR}` | project-config.paths.shared | `src/shared` |
| `{TEST_SUFFIX}` | project-config.conventions.test_suffix | `.test.ts` |

**Resolution**: `Read project-config.json → プレースホルダー解決 → 解決された値を使用`
**Fallback**: project-config.jsonが存在しない場合はDefault列を使用

**FORBIDDEN**: 生成コード、コマンド、ファイルパスにリテラル`src/features/`、`src/shared/`、`tests/unit/`の使用を禁止する。

---

## トリガー条件

- `feature-pilot`の実装完了後に自動呼び出し（Step 5）
- 「機能状態同期」「feature status sync」
- 「index.md更新」「ドキュメント/コード同期」
- PR作成前の品質検査（`/pre-quality-gate`拡張）
- `priority-analyzer`実行前の自動呼び出しを推奨

## ワークフロー

### Phase 1: 対象Feature識別

```bash
# すべてのfeature CONTEXT.json一覧を収集
Glob docs/features/*/CONTEXT.json
```

### Phase 2: 各Feature別分析

各`CONTEXT.json`から:

1. **progress.detailsを読む**（FR別ファイルリスト）
2. **references.related_codeを読む**（関連コードパス）
3. **priority.last_updatedを確認**（Staleness検査）

#### Priority Staleness検査

> **自動化トリガー**: priority更新の必要性を能動的に案内

```python
STALE_THRESHOLD_DAYS = 14

priority = context.get("priority", {})
last_updated = priority.get("last_updated")

if last_updated:
    days_old = (now - parse_datetime(last_updated)).days
    if days_old >= STALE_THRESHOLD_DAYS:
        print(f"Warning: {feature_id}: priorityが{days_old}日間更新されていません。")
        print(f"   /priority-analyzer {feature_id} --apply の実行を推奨します。")
```

**出力例**:

```
Warning: 008-monetization-system: priorityが21日間更新されていません。
   /priority-analyzer 008-monetization-system --apply の実行を推奨します。
```

```json
{
  "progress": {
    "percentage": 100,
    "fr_total": 6,
    "fr_completed": 6,
    "details": {
      "FR-501": {
        "status": "completed",
        "files": ["{FEATURES_DIR}/lesson/components/LessonListPage.tsx"]
      }
    }
  }
}
```

### Phase 3: コード存在有無検証

```bash
# 各パスに対してファイル存在を確認
Glob {FEATURES_DIR}/<feature>/components/<file>.tsx
Glob {FEATURES_DIR}/<feature>/hooks/<file>.ts

# テストファイル存在確認（規則: {FEATURES_DIR}/ → {TESTS_DIR}/features/ 変換）
Glob {TESTS_DIR}/features/<feature>/components/<file>.test.tsx
Glob {TESTS_DIR}/features/<feature>/hooks/<file>.test.ts
```

### Phase 4: 状態判定ロジック

| コード存在 | テスト存在 | テスト成功 |  実装状態   |
| :--------: | :---------: | :---------: | :---------: |
|     OK     |     OK      |     OK      |  completed  |
|     OK     |     OK      |     NG      | in_progress |
|     OK     |     NG      |     --      | in_progress |
|     NG     |     --      |     --      |   pending   |

### Phase 4.5: テスト実行検証

> **目的**: ファイル存在だけでなく、テスト成功をDone判定条件に含める

```bash
# project-config.quality.test_frameworkに従ってテストランナーを決定
# 例 (Vitest):  npx vitest run {TESTS_DIR}/features/${feature_name}/ --reporter=json
# 例 (Flutter): flutter test test/features/${feature_name}/ --machine
# 例 (Jest):    npx jest {TESTS_DIR}/features/${feature_name}/ --json
# 一般形: {TEST_RUNNER} run {TESTS_DIR}/features/${feature_name}/ --reporter=json
```

**結果をCONTEXT.jsonに記録**:

```json
{
  "progress": {
    "details": {
      "FR-XXX": {
        "status": "completed",
        "files": ["{FEATURES_DIR}/xxx/components/Yyy.tsx"],
        "test_passed": true,
        "last_verified_at": "2026-02-13T12:00:00+09:00"
      }
    }
  }
}
```

**判定フロー**:

1. テストファイルが存在しない → `in_progress`（テスト未作成）
2. テスト実行失敗 → `in_progress`（テスト未成功）
3. テスト実行成功 → `completed`（検証完了Done）

### Phase 4.7: Completion Summary自動生成 (GSD Pattern)

> **目的**: Feature実装完了（progress.percentage === 100）時、**何が作られたか**をコードから自動抽出し`completion_summary`に記録。
> 他のFeatureが本Featureに依存する際、AIはコードを読まずに`completion_summary.produces`のみを参照すればよい。
> GSDのSlice Summaryパターンをbrief2devの独立Featureモデルに適合させて適用。

**有効化条件**: `progress.percentage >= 100`（すべてのFR completed）

**抽出手順**:

1. **Export抽出** — barrel file（`{FEATURES_DIR}/<feature>/index.ts`または同等）から`export`文をパース

   ```bash
   # barrel fileからnamed exportsを抽出
   Grep "^export" {FEATURES_DIR}/<feature>/index.ts
   # またはFlutter: Grep "^export" lib/features/<feature>/<feature>.dart
   ```

2. **型抽出** — types/ディレクトリからexportされたinterface/type名を抽出

   ```bash
   Grep "export (type|interface|class|enum)" {FEATURES_DIR}/<feature>/types/
   ```

3. **APIエンドポイント抽出** — api/ディレクトリからHTTPメソッド + パスを抽出

   ```bash
   # Next.js: app/api/配下のroute.tsでexportされたHTTPメソッド
   Grep "export (async function|const) (GET|POST|PUT|DELETE|PATCH)" {SOURCE_ROOT}/app/api/
   # Flutter: repositories/配下のURLパターン
   Grep "Uri.parse|http\.(get|post|put|delete)" {FEATURES_DIR}/<feature>/repositories/
   ```

4. **パターン抽出** — SPEC.mdの§0.4（技術決定）とコードコメントからパターンキーワードを収集

   ```bash
   Grep "Pattern:|パターン:" docs/features/<feature>/SPEC.md
   ```

5. **依存関係抽出（consumes）** — コードから他featureのimportを検知

   ```bash
   # 他featureからimportされる項目を検知
   Grep "from.*features/(?!<current-feature>)" {FEATURES_DIR}/<feature>/ --type ts
   ```

6. **CONTEXT.jsonに記録**:

   ```json
   {
     "completion_summary": {
       "produces": {
         "types": ["User", "AuthToken", "LoginRequest"],
         "exports": ["generateToken()", "verifyToken()", "LoginForm", "useAuth()"],
         "api_endpoints": ["POST /api/auth/login", "POST /api/auth/register", "GET /api/auth/me"],
         "patterns_established": ["JWT refresh rotation", "Zod request validation"]
       },
       "consumes": {
         "from_features": []
       },
       "files_created": [
         "{FEATURES_DIR}/auth/types/auth.types.ts",
         "{FEATURES_DIR}/auth/api/auth.ts",
         "{FEATURES_DIR}/auth/components/LoginForm.tsx",
         "{FEATURES_DIR}/auth/hooks/useAuth.ts"
       ],
       "generated_at": "2026-03-25T21:00:00+09:00",
       "generated_by": "feature-status-sync"
     }
   }
   ```

**未完了Feature**: `progress.percentage < 100`であれば`completion_summary`を`null`のまま維持。部分要約は禁止。

**次のFeature開始時の活用**: feature-architectが新しいFeatureのCONTEXT.jsonを生成する際、`references.dependencies.features`に列挙されたFeatureの`completion_summary.produces`を読み、AIコンテキストに注入（~500トークン/Feature）。

### Phase 5: CONTEXT.json更新

```markdown
## CONTEXT.json更新内容

1. Read `docs/features/<id>/CONTEXT.json`
2. Edit:
   - progress.percentage → 再計算
   - progress.fr_completed → 再計算
   - progress.details[FR-XXX].status → 検証結果を反映
   - quick_resume.current_state → "SyncingStatus"
   - quick_resume.last_updated_at → 現在時刻
   - history[] += 同期記録
```

### Phase 6: index.md生成

CONTEXT.jsonを基にindex.mdを生成/再生成:

```markdown
# {feature_id}: {title}

> **状態**: {状態} ({progress.percentage}%)

## 進行状況

| FR     | 名称         | コード | テスト |
| ------ | ------------ | :--: | :----: |
| FR-501 | レッスン一覧 |  OK  |   OK   |
| FR-502 | データ取得   |  OK  |   --   |

## 関連ファイル

### Components

- {FEATURES_DIR}/lesson/components/LessonListPage.tsx

### Hooks

- {FEATURES_DIR}/lesson/hooks/useLessonSession.ts

...
```

### Phase 7: domain-map.json整合性検証 + top-level index.md同期

> **目的**: 個別featureのindex.md生成後、プロジェクト全体の整合性を保証

1. **domain-map.json整合性チェック + 同期**:
   - `docs/features/domain-map.json`を読む（存在しない場合は`docs/_templates/domain_map_template.json`のコピーで初期生成）
   - 対象featureが`features[]`に登録されているか確認。未登録の場合はCONTEXT.jsonの`domain`フィールドを基に自動登録（feature-architect未経由の手動生成ケースに対応）。`domain`がnullの場合は報告後ユーザーにドメイン帰属を確認
   - CONTEXT.json `domain` ↔ `features[].domain`の不一致時はCONTEXT.json基準で同期 + 警告報告
   - `features[].status`をCONTEXT.json `quick_resume.current_state`基準で更新（Done → done、Archived → archived、Idle/SpecDrafting → planned、それ以外 → in_progress）
   - 参照する`domain` idが`domains[]`に定義されていない場合は警告（orphan domain）

2. **top-level index.md同期**:
   - `docs/features/index.md`に対象featureのエントリが存在するか確認（Domain列を含む）
   - 存在しない場合はテーブルにエントリを追加、Domain値はCONTEXT.jsonの`domain`を使用
   - 統計セクションの数値を再計算

3. **docs一貫性検証（オプション）**:
   - AIがdocs/ディレクトリのドキュメント一貫性を直接検証（CONTEXT.json、index.md、domain-map.json間の整合性）
   - 不一致項目が発見された場合、警告メッセージを出力

## 不一致レポート

```markdown
## Feature Status Sync Report

### 不一致発見

| Feature                 | CONTEXT状態 | 実際の状態 | 対応             |
| ----------------------- | :----------: | :-------: | ------------ |
| 015-notification-system |      0%      |    95%    | CONTEXT更新 |

### 詳細内容

#### 015-notification-system

| FR      | CONTEXT | コード | テスト | 実際の状態  |
| ------- | :-----: | :--: | :----: | :--------: |
| FR-1501 | pending |  OK  |   OK   | completed  |
| FR-1502 | pending |  OK  |   OK   | completed  |
```

## コードパスマッピング規則

### ソース → テスト変換（Feature-First構造）

| ソースパス                                      | テストパス                                                    |
| ---------------------------------------------- | -------------------------------------------------------------- |
| `{FEATURES_DIR}/xxx/components/Yyy.tsx`        | `{TESTS_DIR}/features/xxx/components/Yyy.test.tsx`             |
| `{FEATURES_DIR}/xxx/hooks/useYyy.ts`           | `{TESTS_DIR}/features/xxx/hooks/useYyy.test.ts`                |
| `{FEATURES_DIR}/xxx/types/index.ts`            | `{TESTS_DIR}/features/xxx/types/index.test.ts`                 |
| `{FEATURES_DIR}/xxx/api/yyy.ts`                | `{TESTS_DIR}/features/xxx/api/yyy.test.ts`                     |
| `{SHARED_DIR}/components/Xxx.tsx`              | `{TESTS_DIR}/shared/components/Xxx.test.tsx`                   |

## 進捗率計算

```
全体進捗率 = (completed FR数 / 全FR数) x 100%

状態ラベル:
- 100%: 完了
- 80~99%: 仕上げ (~XX%)
- 50~79%: 進行中 (~XX%)
- 1~49%: 初期 (~XX%)
- 0%: 未実装
```

## 使用例

### 単一Feature同期

```
ユーザー: "015-notification-systemの状態を同期して"

1. Read docs/features/015-notification-system/CONTEXT.json
2. コードパス抽出/検証
3. CONTEXT.json progress更新
4. index.md再生成
5. ユーザーに結果を報告
```

### 全Featureスキャン

```
ユーザー: "全featureの状態同期チェック"

1. Glob docs/features/*/CONTEXT.json
2. 各featureに対して検証ループ
3. 不一致リスト生成
4. バッチ更新を提案
```

## feature-pilot連携

`feature-pilot`の実装完了ステップで自動的に呼び出され、CONTEXT.jsonとindex.mdを同期:

```
feature-pilotパイプライン (NEW_FEATURE/MODIFY_FEATURE)
    ...
    Step 4: 実装完了
        ↓
    Step 5: feature-status-sync呼び出し
        → Phase 1-6: CONTEXT.json + 個別index.md同期
        → Phase 7: registry整合性 + top-level index.md同期
        ↓
    Step 6: pre-quality-gate呼び出し → 最終品質検証
```

## priority-analyzer連携

`priority-analyzer`実行時は**本スキルを先に呼び出し**てCONTEXT.jsonの状態を最新化した後に分析することを推奨。

```markdown
## priority-analyzer改善フロー

1. feature-status-sync呼び出し → CONTEXT.json同期
2. 同期されたCONTEXT.jsonを基に分析実行
3. 正確な優先順位結果を導出
```

### 双方向連携

| 方向                       | トリガー                  | 動作                            |
| -------------------------- | ----------------------- | -------------------------------- |
| **status-sync → priority** | Phase 2でstaleness検知    | priority更新案内メッセージを出力 |
| **priority → status-sync** | priority-analyzer実行前   | progress最新化を推奨             |

**Staleness閾値**: 14日 (STALE_THRESHOLD_DAYS)

---

## CONTEXT.json直接更新

> **状態遷移**: `Implementing` / `BugFixing` → `SyncingStatus`

**更新例**:

```json
{
  "quick_resume": {
    "current_state": "SyncingStatus",
    "current_task": "015-notification-settings CONTEXT.json + index.md同期完了",
    "next_actions": ["Reviewingステップへ移行", "pre-quality-gate実行"],
    "last_updated_at": "2026-02-11T16:00:00+09:00"
  },
  "progress": {
    "percentage": 95,
    "fr_total": 10,
    "fr_completed": 9,
    "fr_in_progress": 1
  },
  "history": [
    {
      "at": "2026-02-11T16:00:00+09:00",
      "from_state": "Implementing",
      "to_state": "SyncingStatus",
      "triggered_by": "feature-status-sync",
      "note": "FR 9/10完了、CONTEXT.json + index.md同期"
    }
  ]
}
```

---

## 注意事項

- **CONTEXT.jsonがSSOT**: index.mdは生成物、直接編集禁止
- **自動更新にはユーザー承認が必要**: 無断ドキュメント修正の防止
- **Git状態確認**: 修正前に`git status`で衝突可能性をチェック
- **SPECドキュメントは修正しない**: CONTEXT.jsonとindex.mdのみ対象

## CONTEXT.json未存在時

```markdown
CONTEXT.json未存在

`docs/features/001-user-dashboard/CONTEXT.json`が存在しない。

次のいずれかを選択すること:

1. feature-architectで新規生成: `/feature-architect 001`
2. 手動でCONTEXT.jsonを作成
```

## Resources

本スキルは別途の実行スクリプトを必要としない。ファイル検索と編集ツールで同期を実行する。


## Not For / Boundaries

> 本skillの明示的非対象（R-CM-018 Rule 4 — Missing Boundaries遮断）。詳細なboundaryはfrontmatter description + 本文trigger節を単一の真実の情報源として使用する。

- frontmatter descriptionに明示されたtrigger以外の領域は本skillでは扱わない。
- 関連skill / 呼び出しチェーン / 依存関係は本文またはMANIFEST.jsonを参照。
- CONTEXT.json (SSOT) ↔ index.md同期 + progressコード存在検証のみ担当。
- 新規機能実装 / SPEC生成は`feature-pilot` / `feature-spec-generator`に委任。本skillはメタ同期のみ。
- CONTEXT.json破損 / self-healingは`feature-doctor`の領域 — 本skillは正常SSOTを前提とする。

## Maintenance

- **Sources**: brief2dev内部（`.claude/rules/` R-CM/R-PL rules + `.claude/skills/`スキルコンベンション）。外部referenceは本文参照。
- **Last updated**: 2026-06-11
- **Known limits**: 本スキルの明示的boundaryはfrontmatter description（`|...`）及び本文参照。
