---
name: feature-wiring
description: |
  対象プロジェクトの機能統合検証スキル。
  実装された機能のExport、ルート、データフロー、Lintを検証し、
  すべてのコンポーネントが正しく接続されているかを確認する。

  「統合検証して」「接続確認」「wiring実行」等の要求でトリガーされる。
---

# Feature Wiring (機能統合検証スキル)

> **核心コンセプト**: 「すべての接続ポイントの検証」- 実装後の統合完全性を保証

本スキルは機能実装後、Export/ルート/データフロー/Lintの4項目を検証し、機能がアプリに正しく統合されているかを確認する。

## PATH CONTRACT (MANDATORY)

> **BINDING**: 本スキルは動的パスプレースホルダーを使用する。
> AIはファイル操作前に必ず`project-config.json`からパスを解決しなければならない。
> リテラルパスの使用は**プロトコル違反**である。

| Placeholder | Resolution Source | Default |
|-------------|-------------------|---------|
| `{FEATURES_DIR}` | project-config.paths.features | `src/features` |
| `{SOURCE_ROOT}` | project-config.paths.source_root | `src` |

**Resolution**: `Read project-config.json → プレースホルダー解決 → 解決された値を使用`
**Fallback**: project-config.jsonが存在しない場合はDefault列を使用
**ルート検証**: フレームワークにより分岐（next.js: `{SOURCE_ROOT}/app/`、nuxt: `pages/`、sveltekit: `{SOURCE_ROOT}/routes/`、flutter: `lib/app/router.dart`、expo: `app/`）

**FORBIDDEN**: 生成コード、コマンド、ファイルパスにリテラル`src/features/`、`src/app/`の使用を禁止する。

```
1. Read project-config.json（存在しない場合はデフォルト値を使用）
2. FEATURES_DIR = paths.features（デフォルト値: "src/features"）
3. SOURCE_ROOT = paths.source_root（デフォルト値: "src"）
4. LINT_CMD = project-config.commands.lint（nullならスキップ）
5. ルート検証はフレームワークにより分岐:
   - next.js: {SOURCE_ROOT}/app/配下のページファイル
   - nuxt: pages/ または src/pages/
   - sveltekit: {SOURCE_ROOT}/routes/
   - flutter: lib/app/router.dart
   - expo: app/ (Expo Router)
```

---

## 検証項目

| #   | 検証                 | 対象                                     | 合格基準                                |
| --- | -------------------- | ---------------------------------------- | ---------------------------------------- |
| 1   | **Export検証**       | barrel file（`index.ts`または同等）      | 必要なモジュールがすべてexportされている |
| 2   | **ルート検証**       | フレームワーク別ルートディレクトリ        | ページファイルが正しい位置に存在する     |
| 3   | **データフロー検証** | Hook/Store → API → Backend             | 接続チェーンが途切れていない             |
| 4   | **Lint検証**         | プロジェクト全体                          | lintエラー0件                            |

---

## 実行フロー

```
[Start]
  |
  +-- Phase 1: 静的検証
  |     +-- 1.1 Export検証: barrel file (index.ts)の公開APIを確認
  |     +-- 1.2 ルート検証: App Router上のページ存在を確認
  |
  +-- Phase 2: 動的検証
  |     +-- 2.1 データフロー検証: Hook → API → Backendの接続を確認
  |     +-- 2.2 Lint検証: project-config.commands.lintエラー0を確認
  |     +-- 2.3 UI Flow検証: project-config.commands.check_architecture通過を確認
  |
  +-- Phase 2.5: Cross-Feature依存関係検証 (GSD Boundary Mapパターン)
  |     +-- 2.5.1 依存Featureのcompletion_summaryをロード
  |     +-- 2.5.2 import ↔ produces交差検証
  |     +-- 2.5.3 Stub Detection (return null, TODO, 空関数)
  |
  +-- Phase 3: 結果レポート
        +-- 全項目Pass → Go判定
        +-- 失敗あり → 修正案提示 → 修正後再検証
```

---

## Phase 1: 静的検証

### 1.1 Export検証

対象: `{FEATURES_DIR}/<feature>/index.ts`

確認内容:

- 型定義（types）がexportされているか
- カスタムフック（hooks）がexportされているか
- コンポーネント（components）がexportされているか
- API関数が必要に応じてexportされているか（内部専用の場合は不要）

```bash
# barrel fileの内容を確認
Read("{FEATURES_DIR}/<feature>/index.ts")

# 各サブモジュールのファイル存在を確認
Glob("{FEATURES_DIR}/<feature>/**/*.ts*")
```

### 1.2 ルート検証

対象: フレームワーク別ルートディレクトリ（PATH CONTRACTのルート検証規則を参照）

確認内容:

- 機能に対応するページファイルが存在するか
- ページファイルがフレームワーク規約に沿った正しいパスに配置されているか
- 該当コンポーネントをimportしているか

---

## Phase 2: 動的検証

### 2.1 データフロー検証

接続チェーン: `Component → Hook → API → Backend (API Route)`

確認内容:

- ComponentがHookを呼び出しているか
- HookがAPI関数を呼び出しているか
- API関数が適切なエンドポイントを参照しているか
- API Route（フレームワーク別APIディレクトリ）が存在するか（必要な場合）

### 2.2 Lint検証

```bash
# project-config.json → commands.lint（nullならスキップ）
# R-CM-009: makeターゲットのハードコーディング禁止
```

- エラー0件が必須
- 警告は報告するが、通過扱い
- `commands.lint`がnullの場合は本Phaseをスキップ

### 2.5 Cross-Feature依存関係検証 (GSD Boundary Mapパターン)

> **目的**: 現在のFeatureが依存するFeatureの`completion_summary.produces`と実際のimportを交差検証。
> Feature間の「ファイルはあるが接続されていない」状態を検知するGSDのKey Linksパターンを適用。

**有効化条件**: `CONTEXT.json`の`references.dependencies.features`に1つ以上の依存Featureがある場合

**検証手順**:

1. **依存Featureのcompletion_summaryをロード**:
   ```bash
   # CONTEXT.jsonのdependencies.featuresから依存Feature IDを抽出
   # 各依存FeatureのCONTEXT.jsonからcompletion_summary.producesを読む
   Read docs/features/<dep-feature-id>/CONTEXT.json → .completion_summary.produces
   ```

2. **import ↔ produces交差検証**:
   ```bash
   # 現在のFeatureコードから依存Featureのimportを抽出
   Grep "from.*features/<dep-feature>" {FEATURES_DIR}/<current-feature>/

   # 各import項目が依存Featureのcompletion_summary.produces.exportsに存在するか確認
   # 欠落 = FAIL: 「Feature BがFeature AのgenerateToken()をimportしているが、
   #                Feature Aのcompletion_summary.produces.exportsに存在しない」
   ```

3. **Stub Detection**（GSD Static Verificationパターン）:
   ```bash
   # 現在のFeatureのすべての.ts/.tsx/.dartファイルでstubパターンを検知
   Grep "return null|return \{\}|return \[\]|TODO|FIXME|HACK|console\.log.*placeholder|throw new Error\('not implemented'\)" {FEATURES_DIR}/<feature>/

   # 最小行数検証: barrel fileの各export対象が最低10行以上
   # 8行未満 + return文のみのファイル = stub疑い
   ```

**結果レポート形式**:

```markdown
### Phase 2.5: Cross-Feature依存関係検証

| 依存Feature | 項目 | import存在 | producesに存在 | 判定 |
|-------------|------|:---------:|:-------------:|:----:|
| 001-auth    | generateToken() | OK | OK | PASS |
| 001-auth    | User (type) | OK | OK | PASS |
| 001-auth    | refreshToken() | OK | **MISSING** | FAIL |

### Stub Detection

| ファイル | 行数 | Stubパターン | 判定 |
|------|:----:|----------|:----:|
| api/auth.ts | 45 | なし | PASS |
| hooks/useSearch.ts | 6 | `return null` | FAIL |
```

**completion_summary未存在時**: 依存Featureの`completion_summary`が`null`であれば該当Featureは未完了。警告を出力するがFAILではない（先行Featureが実装中の可能性がある）。

### 2.3 UI Flow検証

対象: `docs/ui-flow/ui-flow.json`

確認内容:

- 新しいパネルがui-flow.jsonのpanelsに定義されているか
- 新しいSSEイベントがsse_mappingに登録されているか
- phasesで新しいパネルが適切なフェーズに追加されているか
- `project-config.commands.check_architecture`で検証通過（nullならスキップ）

```bash
# project-config.json → commands.check_architecture（nullならスキップ）
# R-CM-009: makeターゲットのハードコーディング禁止
```

- 全12項目Passが必須（MVS項目はexit 1でブロッキング）

---

## 失敗時の対応

各検証項目の失敗時:

| 検証           | よくある原因            | 修正アクション                          |
| ------------ | -------------------- | ---------------------------------- |
| Export       | barrel file更新漏れ | `index.ts`にexportを追加       |
| ルート       | ページファイル未生成   | フレームワーク別ルートディレクトリにページを生成 |
| データフロー | importパス不一致  | barrel file経由のimportに修正   |
| Lint         | 型エラー、未使用変数 | エラー内容に応じて修正            |
| UI Flow      | panels/phases未登録 | `docs/ui-flow/ui-flow.json`を更新 |

修正後は必ず**再検証**を実行する。

---

## 出力形式

### 全項目Pass

```markdown
Feature Wiring - 検証完了

機能: <feature-id>
結果: 全項目Pass

| #   | 検証             | 結果 |
| --- | ---------------- | ---- |
| 1   | Export検証      | Pass |
| 2   | ルート検証      | Pass |
| 3   | データフロー検証 | Pass |
| 4   | Lint検証        | Pass |

→ 機能の統合が正常に完了した。
```

### 失敗あり

```markdown
Feature Wiring - 修正が必要

機能: <feature-id>
結果: N件の問題を発見

| #   | 検証             | 結果 | 問題               |
| --- | ---------------- | ---- | ------------------ |
| 1   | Export検証      | Fail | useXxxが未export |
| 2   | ルート検証      | Pass | -                  |
| 3   | データフロー検証 | Pass | -                  |
| 4   | Lint検証        | Fail | 2 errors           |

修正アクション:

1. {FEATURES_DIR}/<feature>/index.tsに`export { useXxx }`を追加
2. Lintエラー修正（詳細は上記参照）

→ 修正後、再検証を実行する。
```

---

## 使用例

```bash
# 機能IDで実行（推奨）
/feature-wiring dashboard

# feature-implementer完了後に自動呼び出し（feature-pilot経由）
# → 手動呼び出し不要
```

---

## AI行動指針

### DO（すべきこと）

- 4項目すべてを検証してからレポート出力
- 失敗時は具体的な修正案を提示
- 修正後は再検証を実行
- barrel file (index.ts)の存在を前提に確認

### DON'T（してはいけないこと）

- 検証項目のスキップ
- テストコードの修正（Wiringスキルの範囲外）
- 不要な新規ファイルの作成

---

## SPEC Compliance Audit（統合検証の最終段階）

Phase 1〜3の検証完了後、SPEC.mdが存在する機能に限り`references/spec-compliance-audit-template.md`をReadし、SPEC整合性監査を実行する。

**プロセス**:
1. SPEC.mdのFR/NFR/API/UI/テスト項目を抽出
2. 実装されたコードと交差検証しDONE/PARTIAL/NOT_DONE/CHANGEDを判定
3. Scope Drift（SPEC外の実装） + Missing Requirements（SPEC未充足）を双方向で検知
4. COMPLIANCE 80%未満であればFAIL勧告

本監査は**情報提供目的** — Export/ルート/Lint検証をブロックしないが、feature-pilotに未完了項目を報告する。

## Not For / Boundaries

> 本skillの明示的非対象（R-CM-018 Rule 4 — Missing Boundaries遮断）。詳細なboundaryはfrontmatter description + 本文trigger節を単一の真実の情報源として使用する。

- frontmatter descriptionに明示されたtrigger以外の領域は本skillでは扱わない。
- 関連skill / 呼び出しチェーン / 依存関係は本文またはMANIFEST.jsonを参照。
- 統合検証（Export / ルート / データフロー / Lint）のみ実行。コード作成 / 修正は`feature-implementer`に委任。
- ビルド / テストゲートは`pre-quality-gate`の領域 — 本skillはwiring整合性に集中。
- E2E / 視覚検証は別ツール / `final-review`の領域。本skillは静的wiringのみ。

## Maintenance

- **Sources**: brief2dev内部（`.claude/rules/` R-CM/R-PL rules + `.claude/skills/`スキルコンベンション）。外部referenceは本文参照。
- **Last updated**: 2026-04-11
- **Known limits**: 本スキルの明示的boundaryはfrontmatter description（`|...`）及び本文参照。
