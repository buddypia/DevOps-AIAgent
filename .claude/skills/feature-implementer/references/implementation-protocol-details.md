---
name: feature-implementer
description: SPEC.mdとScreen文書を入力として、TDD方式で実際のコードを実装するスキル。feature-spec-generatorとreadiness-gateの間で「実装実行者（Executor）」の役割を担う。
---

# Feature Implementer

> **コアコンセプト**: 「設計 → コード」の実行者 (The Executor)

このスキルは、`feature-spec-generator`が生成したSPEC.mdとScreen文書を入力として、TDD原則に従いテストとコードを実装します。

## プロジェクト技術スタック前提 (MUST)

> **重要**: このスキルは対象プロジェクトの技術スタックに合わせて設計されています。

| 項目                   | スタック                                          | 詳細                       |
| ---------------------- | --------------------------------------------- | -------------------------- |
| **アーキテクチャ**           | Feature-First + Simplified Clean Architecture | project-config.paths.features基準（デフォルト: src/features/） |
| **状態管理**          | project-config.jsonのframeworkに従う        | フレームワーク標準の状態管理パターン |
| **データモデル**        | Zod schema                                    | バリデーションを含む型定義  |
| **エラーハンドリング**        | try-catch + logger                            | Fail-Fast原則             |
| **テスト**             | project-config.quality.test_framework         | フレームワーク標準のテストパターン |

---

## 役割分担

| スキル                     | 責務                                                        | Output                                    |
| ------------------------ | ----------------------------------------------------------- | ------------------------------------------ |
| **feature-architect**      | 意図確定 (Why/Value)、コンテキスト収集、spec-generator呼び出し   | `CONTEXT.json`                            |
| **feature-spec-generator** | 入力を実装可能な契約に変換                            | `SPEC.md`, `screens/*.md`                 |
| **feature-implementer**    | SPECをTDDで実装                                           | `{FEATURES_DIR}/**/*.{EXT}`, `{TESTS_DIR}/**/*.test.{EXT}` |
| **feature-wiring**         | Export/ルート/データフロー統合検証                       | Go/No-Go判定                             |

---

## プロトコル (Protocol)

### PATH CONTRACT (MANDATORY)

> **BINDING**: このスキルは動的パスプレースホルダーを使用します。
> AIはファイル操作前に必ず`project-config.json`からパスを解決しなければなりません。
> リテラルパスの使用は**プロトコル違反**です。

| Placeholder | Resolution Source | Default |
|-------------|-------------------|---------|
| `{FEATURES_DIR}` | project-config.paths.features | `src/features` |
| `{TESTS_DIR}` | project-config.paths.tests_unit | `tests/unit` |
| `{COMPONENT_EXT}` | project-config.conventions.component_extension | `.tsx` |
| `{FEATURE_LAYERS}` | project-config.conventions.feature_structure | `["types","api","hooks","components"]` |

**Resolution**: `Read project-config.json → プレースホルダー解決 → 解決済みの値を使用`
**Fallback**: project-config.jsonがない場合はDefault列を使用

**FORBIDDEN**: 生成コード、コマンド、ファイルパスにリテラルの`src/features/`、`tests/unit/`の使用禁止。

### Phase 0: 事前検証 (Pre-validation)

1. **CLAUDE.mdアーキテクチャルール必読** (MUST):
   - CLAUDE.mdの「アーキテクチャ概要」「Feature-First依存関係ルール」セクションを確認
   - Feature-First依存関係ルールを確認
   - プロジェクト構造の標準パスを確認

   > **この確認をせずに実装を開始してはいけません。**

2. **SPECロード**: `docs/features/<feature-id>/SPEC-<NNN>-*.md`を読む
3. **完全性チェック**: 必須セクションの存在確認
   - `## 0. AI実装契約` - Target Files、State/Hook、Error Handling、Data Model
   - `## 2. 機能要件` - FR単位の仕様
   - `## 3. 依存関係とリスク` - API契約
4. **不完全時は差し戻し**: SPECが不完全な場合は`feature-spec-generator`に差し戻し

   ```
   SPEC不完全 - Generatorへ差し戻し

   不足項目:
   - [ ] §0.2 State/Hook構造未定義
   - [ ] §0.4 Data Model未定義

   → /feature-spec-generatorを実行してSPECを補完してください。
   ```

5. **CONTEXT.json参照**: Hard Constraintsを確認（違反禁止事項を把握）

6. **UI Flow SSOT参照** (ui_feature時MUST):
   - `docs/ui-flow/ui-flow.json`を読み、以下を把握:
     - 既存パネル一覧とvisibility条件
     - SSEイベント → 状態遷移マッピング
     - フェーズ別レイアウト構成
   - SPEC §1.5 UI Flow Contractの`json:schema/ui_flow_contract`ブロックと照合
   - `operation: "new"`のパネルは実装完了後に`ui-flow.json`への追加が必要（feature-wiringで検証）

---

### Phase 1: 実装計画策定 (Implementation Planning)

1. **Target Files分析**:
   - SPEC §0.1から実装対象ファイル一覧を抽出
   - 状態別分類: 完了 / 進行中 / 未着手

2. **依存関係グラフ構築** (Feature-First基準):

   ```
   [Type + Zod Schema] → [API Layer] → [Custom Hook] → [UI Component]
         ↓                    ↓              ↓               ↓
   {FEATURES_DIR}/<feature>/{layer1}/  →  {layer2}/  →  {layer3}/  →  {layer4}/
   # FEATURES_DIR = project-config.jsonのpaths.features（デフォルト: src/features）
   # layer順序 = project-config.jsonのconventions.feature_structure（デフォルト: types → api → hooks → components）
   ```

3. **実装順序決定** (Bottom-Up):
   ```
   1. Type + Zod Schema（型定義 + バリデーション） ─┐
   2. API Layer（fetch / API Route）              ─┘ 並列可能
   3. Custom Hook（useXxx）
   4. Component / Page（UI）
   5. Test（各レイヤー）
   ```

### Phase 2: TDD実装サイクル (Red-Green-Refactor)

> **原則**: 各ファイルごとに必ずテストを先に作成
> **REQUIRED RULE**: `R-CM-011` (testing-anti-patterns) — モック動作テスト禁止、テスト専用メソッド禁止、理解のないモッキング禁止
> **REQUIRED RULE**: `R-CM-010` (verification-before-completion) — 完了主張前に検証証拠必須

**単一ファイル実装サイクル**:

```
+-------------------------------------------------------------+
| 1. RED: 失敗するテストを作成                                    |
|    - SPECのAC（Acceptance Criteria）をテストケースに変換      |
|    - SPECのEC（Edge Cases）を追加テストに変換                |
|    - `make q.test`またはproject-config基準のテストコマンド → 失敗確認 |
+-------------------------------------------------------------+
| 2. GREEN: テストを通過する最小コードを実装                       |
|    - SPECの「AI実装ヒント」を参照                                |
|    - 既存パターン準拠（プロジェクト規約）                            |
|    - `make q.test`またはproject-config基準のテストコマンド → 通過確認 |
+-------------------------------------------------------------+
| 3. REFACTOR: コード品質改善                                    |
|    - 重複除去、命名改善                                     |
|    - `make q.check`またはproject-config基準のlintコマンド → 警告なし確認 |
|    - テストが引き続き通過することを確認                                    |
+-------------------------------------------------------------+
```

### Phase 3: FR単位実装 (Feature Request Implementation)

SPECの各FR（Feature Request）を順番に実装します。

**FR実装チェックリスト**:

> **CHECKLIST UPDATE RULE (MANDATORY)**:
> 各FRの実装過程で、テスト作成/コード実装/品質検証の各項目完了時にチェックリストを再出力し`[ ]`を`[x]`に更新すること。
> 全項目`[x]`確認後に次のFRへ進むこと。
> **更新せずに次の段階へ進む = Violation Protocol違反 (severity: HIGH)**

```markdown
## FR-NNNNN実装

### テスト作成 (Red)

- [ ] Unit Test: `{TESTS_DIR}/features/<feature>/<name>.test.ts(x)`作成
- [ ] AC別テストケース作成
- [ ] EC別エッジケーステスト作成
- [ ] `make q.test`またはproject-config基準のテストコマンド → 失敗確認

### コード実装 (Green)

- [ ] Type + Zod Schema実装（必要時）
- [ ] API Layer実装（必要時）
- [ ] Custom Hook実装（必要時）
- [ ] Component/Page実装（必要時）
- [ ] `make q.test`またはproject-config基準のテストコマンド → 通過確認

### 品質検証 (Refactor)

- [ ] `make q.check`またはproject-config基準のlintコマンド通過
- [ ] コード重複除去
- [ ] SPECのError Handling Policy準拠確認
```

### Phase 4: 統合と引き継ぎ (Integration & Handover)

1. **全体テスト実行**:

   ```bash
   make q.test
   # またはproject-config.quality.test_frameworkに従うテストコマンド
   ```

2. **Lint検証**:

   ```bash
   make q.check
   # またはproject-config.quality.linterに従うlintコマンド
   ```

3. **SPEC状態更新**:
   - SPEC §0.1のTarget Filesの状態を完了に更新
   - 変更履歴（§5）に実装完了を記録

4. **引き継ぎメッセージ**:

   ```markdown
   実装完了

   生成/修正されたファイル:

   - {FEATURES_DIR}/<feature>/types/index.ts (新規)
   - {FEATURES_DIR}/<feature>/api/<feature>-api.ts (新規)
   - {FEATURES_DIR}/<feature>/hooks/use-<feature>.ts (新規)
   - {FEATURES_DIR}/<feature>/components/<Feature>Panel.tsx (新規)
   - {FEATURES_DIR}/<feature>/index.ts (バレルファイル更新)
   - {TESTS_DIR}/features/<feature>/use-<feature>.test.ts (新規)

   テスト結果:

   - 全体テスト: N件通過
   - 新規テスト: M件追加

   次のステップ:
   → /feature-wiring <feature-id>を実行して統合検証を行ってください。
   ```

---

## Wisdom直接記録

> **目的**: 実装過程の学習内容をWisdomに直接記録し、セッション間の連続性を確保

### 作業開始時

**Wisdom参照** (既存パターン確認):

```bash
Read(".claude/wisdom/project-patterns.md")   # プロジェクトパターン確認
Read(".claude/wisdom/common-errors.md")       # エラー解決策参照
```

### 作業中に学習が発生した場合

**即座にWisdomに記録** (APPENDのみ使用):

#### 1. 新しいパターン発見時

```bash
bash -c "echo '
## {パターン名}

**状況**: {どのような状況で使うか}
**実装**: \`\`\`typescript
// コード例
\`\`\`
**根拠**: {なぜこの方法が良いか}

---
' >> .claude/wisdom/project-patterns.md"
```

#### 2. エラー解決時

```bash
bash -c "echo '
### {エラー概要}

**原因**: {根本原因}
**解決**: {適用した解決策}
**再発防止**: {同一問題の防止方法}

---
' >> .claude/wisdom/common-errors.md"
```

### 注意事項

**APPEND専用**:

```bash
# 正しい使用
bash -c "echo 'content' >> .claude/wisdom/file.md"

# 誤った使用（上書き）
bash -c "echo 'content' > .claude/wisdom/file.md"
```

**即座に記録**: 作業中に発生したら即座に記録（後でまとめて記録することは禁止）

---

## 実装原則 (Implementation Principles)

### 1. SPECがSingle Source of Truth

| 項目         | 参照位置                        |
| ------------ | --------------------------------- |
| データモデル  | SPEC §0.4 Data Model             |
| 状態構造    | SPEC §0.2 State/Hook             |
| エラー処理    | SPEC §0.3 Error Handling Policy  |
| 受け入れ基準    | SPEC §2 各FRのAC               |
| エッジケース  | SPEC §2 各FRのEC               |
| 実装ヒント    | SPEC §2 各FRの「AI実装ヒント」   |

### 2. Hard Constraints絶対遵守

CONTEXT.jsonのHard Constraintsは**いかなる状況でも違反禁止**です。

```markdown
## 違反時は即座に中断しユーザーに報告

例:

- 「DBスキーマ変更禁止」→ 新規テーブルが必要な場合 → 中断 & 報告
- 「外部パッケージ追加禁止」→ 新規パッケージが必要な場合 → 中断 & 報告
```

### 3. 既存パターン準拠（プロジェクト標準）

| パターン              | プロジェクト規約                                          |
| ----------------- | -------------------------------------------------------- |
| **フォルダ構造**     | `{FEATURES_DIR}/{name}/types/`等                        |
| **Importルール**     | バレルファイル（index.ts）経由のみ、内部への直接import禁止       |
| **状態管理**     | フレームワーク標準の状態管理パターン（project-config.json参照） |
| **エラー処理**     | `try-catch` + logger                                     |
| **データモデル**   | `interface` + `z.object()`（Zod schema）                  |
| **API Layer**     | `async function` + `fetch`                               |
| **テストモッキング**   | フレームワーク標準のモッキングパターン（project-config.quality.test_framework参照） |
| **命名**        | kebab-caseファイル名、PascalCaseコンポーネント名                 |
| **UIテキスト**     | `messages.ts`経由（ハードコーディング禁止）                |

### 4. 段階的実装

一度に全体を実装しません。

```
BAD:  全体ファイルを一括生成
GOOD: 1つのFR → テスト → 実装 → 検証 → 次のFR
```

---

## コードテンプレート

### Type + Zod Schema

```typescript
// {FEATURES_DIR}/<feature>/types/index.ts

import { z } from 'zod';

/** [機能名] データモデルスキーマ */
export const xxxSchema = z.object({
  id: z.string(),
  name: z.string(),
  // ... フィールド
});

/** [機能名] データモデル型 */
export type XxxModel = z.infer<typeof xxxSchema>;
```

### API Layer

```typescript
// {FEATURES_DIR}/<feature>/api/<feature>-api.ts

import { xxxSchema, type XxxModel } from '../types';
import { logger } from '@/shared/lib/logger';

const TAG = 'XxxApi';

/**
 * [機能名] データ取得
 *
 * @param id - 対象ID
 * @returns データ（失敗時はnull）
 */
export async function fetchXxx(id: string): Promise<XxxModel | null> {
  try {
    const response = await fetch(`/api/xxx/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return xxxSchema.parse(data);
  } catch (error) {
    logger.error(TAG, 'Error fetching xxx', error);
    return null;
  }
}
```

### Custom Hook

```typescript
// {FEATURES_DIR}/<feature>/hooks/use-<feature>.ts

// フレームワークに応じて必要時に追加（例: Next.js App Routerの'use client'）

// フレームワーク標準の状態管理import（例: ReactのuseState/useEffect/useCallback）
import { fetchXxx } from '../api/<feature>-api';
import { type XxxModel } from '../types';
import { MESSAGES } from '@/shared/constants/messages';
import { logger } from '@/shared/lib/logger';

const TAG = 'useXxx';

/** [機能名] フック状態 */
interface XxxState {
  data: XxxModel | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * [機能名] カスタムフック
 *
 * @param id - 対象ID
 * @returns 状態とアクション
 */
export function useXxx(id: string) {
  const [state, setState] = useState<XxxState>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        logger.debug(TAG, `Loading xxx: ${id}`);
        const data = await fetchXxx(id);

        if (cancelled) return;

        if (data === null) {
          setState({ data: null, isLoading: false, error: MESSAGES.errors.dataNotFound });
          return;
        }

        setState({ data, isLoading: false, error: null });
      } catch (error) {
        if (cancelled) return;
        logger.error(TAG, 'Error loading xxx', error);
        setState({ data: null, isLoading: false, error: MESSAGES.errors.loadFailed });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const doSomething = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // ビジネスロジック
      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      logger.error(TAG, 'Error doing something', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: MESSAGES.errors.operationFailed,
      }));
    }
  }, []);

  return { ...state, doSomething };
}
```

---

## テスト作成ガイド

### テストファイル構造

```typescript
// {TESTS_DIR}/features/<feature>/hooks/use-<feature>.test.ts

// project-config.quality.test_frameworkに応じたimport
// 例（Vitest + React Testing Library）:
//   import { renderHook, waitFor } from '@testing-library/react';
//   import { vi, describe, it, expect, beforeEach } from 'vitest';
// 例（Flutter）:
//   import 'package:flutter_test/flutter_test.dart';
// 例（Jest）:
//   import { renderHook, waitFor } from '@testing-library/react';
import { useXxx } from '@/features/<feature>/hooks/use-<feature>';
import * as xxxApi from '@/features/<feature>/api/<feature>-api';
import type { XxxModel } from '@/features/<feature>/types';

// フレームワーク標準のモッキングパターン（例: Vitestのvi.mock、Jestのjest.mockなど）
// vi.mock('@/features/<feature>/api/<feature>-api');

describe('useXxx', () => {
  const mockData: XxxModel = { id: 'test-id', name: 'Test' };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  // AC基準テスト
  describe('AC1: データロード成功', () => {
    it('サービスがデータを返した場合、正常にロードされること', async () => {
      // Arrange
      vi.mocked(xxxApi.fetchXxx).mockResolvedValue(mockData);

      // Act
      const { result } = renderHook(() => useXxx('test-id'));

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
    });
  });

  // EC基準テスト
  describe('EC1: データなし', () => {
    it('サービスがnullを返した場合、エラーが設定されること', async () => {
      // Arrange
      vi.mocked(xxxApi.fetchXxx).mockResolvedValue(null);

      // Act
      const { result } = renderHook(() => useXxx('test-id'));

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('EC2: ネットワークエラー', () => {
    it('サービスが例外をスローした場合、エラーが設定されること', async () => {
      // Arrange
      vi.mocked(xxxApi.fetchXxx).mockRejectedValue(new Error('Network error'));

      // Act
      const { result } = renderHook(() => useXxx('test-id'));

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeTruthy();
    });
  });
});
```

### AC/EC → テスト変換規則

> **BDD 5-columnテーブルマッピング**: SPECのACテーブルをテストコードに直接変換

| BDD列             | テストマッピング                       | コードの役割                                      |
| -------------------- | ---------------------------------- | ---------------------------------------------- |
| **Given（事前条件）** | Arrange（`beforeEach`、Mock設定） | `vi.mocked(api.method).mockResolvedValue(...)` |
| **When（アクション）**       | Act（実行）                        | `renderHook(() => useXxx(...))`                |
| **Then（期待結果）**  | Assert（検証）                     | `expect(result.current.xxx).toBe(...)`         |
| **観測点**            | `expect()` matcher対象               | 具体的な変数名、状態値                          |

---

## エラーハンドリング規約

### API Layer

| 状況       | 処理                                |
| ---------- | ------------------------------------ |
| データなし | `null`を返す                         |
| 例外発生   | `logger.error()`ログ後`null`を返す |

### Custom Hook Layer

| 状況              | 処理                                                             |
| ----------------- | ---------------------------------------------------------------- |
| APIがnullを返す   | `state.error = MESSAGES.errors.xxx`を設定                         |
| 例外発生         | `logger.error()`ログ + `state.error = MESSAGES.errors.xxx`を設定 |

---

## AI行動指針

### DO（すべきこと）

- CLAUDE.mdのアーキテクチャルール確認後に実装開始
- SPECの全ACをテストケースに変換
- テストを先に作成してから実装（Red-Green-Refactor）
- 既存コードパターンを参照（`{FEATURES_DIR}/`内の類似ファイルを確認）
- バレルファイル（index.ts）を通じたimportのみ使用
- エラー処理は`try-catch` + `logger`を使用
- 各FR完了後にテストを実行して確認
- UIテキストは`messages.ts`経由で参照

### DON'T（してはいけないこと）

- CLAUDE.mdのルール確認なしに実装開始
- CONTEXT.jsonのHard Constraints違反
- テストなしでコード実装
- SPECにない機能追加（Over-engineering）
- 既存インターフェースシグネチャの変更（Soft Constraintで許可されない限り）
- `any`型の乱用（明示的な型または`unknown` + 型ガードを使用）
- 一度に全体ファイル生成（段階的実装）
- Feature外部にコード作成（レガシーパス使用禁止）
- バレルファイルを迂回して内部ファイルに直接import
- `console.log`の使用（loggerを使用）

---

## 失敗ケース対処

| ケース                          | 対処                                          |
| ------------------------------- | ---------------------------------------------- |
| **SPEC不完全**                 | 実装中断、`feature-spec-generator`に差し戻し     |
| **Hard Constraint衝突**        | 実装中断、ユーザーに承認要求               |
| **テスト失敗継続**            | 原因分析後に報告、必要時SPEC再検討要求   |
| **外部APIスキーマ不一致**      | SPECのAPI契約と実際のAPIを比較、差異を報告    |
| **Tier 1セキュリティ作業検知**       | 即座に停止、ユーザー確認必須（認証/決済/PII）   |

---

## 自律停止条件 (Auto-Stop Conditions)

> **原則**: 以下の条件検知時は**即座に作業中断**後ユーザー確認要求

### Tier 1（High Risk）- 即座に停止

| 検知条件                | 必要な対応             |
| ----------------------- | -------------------- |
| 認証/権限関連コード修正 | ユーザー承認必須     |
| 決済/課金ロジック           | ユーザー承認必須     |
| 個人情報（PII）処理       | セキュリティレビュー必須       |

### Tier 2（Medium Risk）- 注意して進行

| 検知条件                    | 処理                 |
| --------------------------- | -------------------- |
| 外部API連携               | 契約確認後に進行    |
| 複数画面にまたがる状態管理   | 既存パターン準拠確認  |
| API Route新規/修正          | テスト必須          |

---

## CONTEXT.json直接更新

> **状態遷移**: `SpecDrafting` / `SpecUpdating` → `Implementing`

作業中/完了時に**CONTEXT.jsonを直接更新**します:

### 実装開始時

```json
{
  "quick_resume": {
    "current_state": "Implementing",
    "current_task": "FR-02901実装中 - 機能名",
    "next_actions": ["FR-02901テスト作成", "FR-02902実装"],
    "last_updated_at": "2026-02-11T12:00:00+09:00"
  }
}
```

### 各FR完了時

```json
{
  "progress": {
    "percentage": 40,
    "fr_total": 5,
    "fr_completed": 2,
    "fr_in_progress": 1,
    "details": {
      "FR-02901": { "status": "completed", "files": ["{FEATURES_DIR}/xxx/types/index.ts"] },
      "FR-02902": { "status": "completed", "files": ["{FEATURES_DIR}/xxx/api/xxx-api.ts"] },
      "FR-02903": { "status": "in_progress", "files": [] }
    }
  }
}
```

### 全体実装完了時

```json
{
  "quick_resume": {
    "current_state": "Implementing",
    "current_task": "全体実装完了、状態同期待ち",
    "next_actions": ["feature-wiring実行", "feature-status-sync実行"]
  },
  "progress": {
    "percentage": 100,
    "fr_completed": 5,
    "fr_in_progress": 0
  }
}
```

---

## 使用例

```bash
# 基本使用 - 機能IDで呼び出し
/feature-implementer 001

# SPECパス直接指定
/feature-implementer docs/features/001-dashboard/SPEC-001-dashboard.md

# 特定FRのみ実装
/feature-implementer 001 --fr FR-00101

# テストのみ生成（実装なし）
/feature-implementer 001 --tests-only
```

---

## 統合ワークフロー

```
[アイデア]
     |
[feature-architect] → CONTEXT.json生成
     |
[feature-spec-generator] → SPEC/Screen生成
     |
[ui-approval-gate] → UI承認
     |
[feature-implementer] → TDD実装  ← ここ！
     |
[feature-wiring] → 統合検証
     |
[完了] → コミット & PR
```

---

## フォルダ構造参照

> **Feature-Firstアーキテクチャ**: すべてのコードは`{FEATURES_DIR}/<feature>/`配下に配置

```
{FEATURES_DIR}/<feature>/
├── components/          # 機能固有のUIコンポーネント
│   └── <Feature>Panel.tsx
├── hooks/               # 機能固有のカスタムフック
│   └── use-<feature>.ts
├── api/                 # API呼び出し/データフェッチ
│   └── <feature>-api.ts
├── types/               # 機能固有の型定義
│   └── index.ts         # Zod schema + 型
└── index.ts             # バレルファイル（公開API）

{TESTS_DIR}/features/<feature>/
├── hooks/
│   └── use-<feature>.test.ts
└── api/
    └── <feature>-api.test.ts
```

---

## SDDモード (Subagent-Driven Development)

> **PLAN.mdが存在し独立したタスクが3個以上**の場合、SDDモードを自動有効化する。
> PLAN.mdがない場合は既存のインラインTDDモードで実行する。

### SDDモードとは

タスクごとの専用サブエージェントをディスパッチして実装し、各タスク完了後に**2-Stage Review**（Spec Compliance → Code Quality）を行う実行パターン。

**核心原則**: タスクごとの新規サブエージェント + 2-Stage Review = 高品質・高速反復

### SDDプロセス

```
PLAN.md読み込み → 全体タスク抽出 → TaskCreateで追跡開始
  ↓
Per Task:
  1. Implementerサブエージェントディスパッチ（references/sdd-implementer-prompt.md）
  2. Implementer状態処理（DONE/DONE_WITH_CONCERNS/BLOCKED/NEEDS_CONTEXT）
  3. Spec Compliance Reviewディスパッチ（references/sdd-spec-reviewer-prompt.md）
     → ❌ 問題あり → Implementerが修正 → 再レビュー
     → ✅ 通過 → 次の段階
  4. Code Quality Reviewディスパッチ（references/sdd-quality-reviewer-prompt.md）
     → ❌ 問題あり → Implementerが修正 → 再レビュー
     → ✅ 通過 → タスク完了
  ↓
全タスク完了 → final-review実行
```

### Implementer状態処理

| 状態 | 行動 |
|------|------|
| **DONE** | Spec Compliance Reviewに進行 |
| **DONE_WITH_CONCERNS** | 懸念事項検討後にReview進行 |
| **NEEDS_CONTEXT** | 欠落コンテキスト提供後に再ディスパッチ |
| **BLOCKED** | (1) コンテキスト問題 → 追加提供 (2) タスクが大きい → 分割 (3) 計画エラー → ユーザーにサーフェス |

### モデルルーティング

| タスク複雑度 | モデル選択 | シグナル |
|---|---|---|
| Mechanical（1-2ファイル、明確なスペック） | haiku/sonnet | 計画に完全なコードを含む |
| Integration（複数ファイル、調整必要） | sonnet | ファイル間依存関係、パターンマッチング |
| Architecture（設計判断、広い理解） | opus | アーキテクチャ決定、レビュー |

### 2-Stage Review規則

1. **Spec Complianceが先。** Code Quality ReviewはSpecが通過した後にのみ進行
2. **レビュアーが問題を発見したら** → Implementerが修正 → レビュアーが再レビュー。再レビューを飛ばさない
3. **実装エージェントを並列でディスパッチしない**（衝突リスク）

> 参照: `references/gan-generator-evaluator-pattern.md` — Generator（実装）-Evaluator（レビュー）分離パターン。SDD 2-stageレビュー強化時に参照

### プロンプトテンプレートとスキーマ

- `references/sdd-implementer-prompt.md` — 実装サブエージェントディスパッチ
- `references/sdd-spec-reviewer-prompt.md` — Spec Complianceレビュー
- `references/sdd-quality-reviewer-prompt.md` — Code Qualityレビュー
- `data/schemas/sdd-phase-transition.schema.json` — Phase遷移追跡スキーマ（spec_compliance=PASSの場合のみquality_reviewに進入可能）
- `data/schemas/stage-output/engineering-plan.schema.json` — PLAN.md構造検証

---

## 参照文書

| 優先度 | 文書                                  |   必須   |
| :------: | ------------------------------------- | :------: |
|    1     | **CLAUDE.md**（アーキテクチャ/ルール）           | **必須** |
|    2     | SPECテンプレート                           |   必須   |
|    3     | PLAN.md（engineering-plan-writer成果物） | 推奨（SDDモード時必須） |
|    4     | 既存feature実装例（`{FEATURES_DIR}/`） |   推奨   |
|    5     | SDDプロンプトテンプレート（`references/sdd-*.md`） | SDDモード時必須 |
|    6     | Test Coverage Diagram（`references/test-coverage-diagram-template.md`） | **必須** |

> CLAUDE.mdのアーキテクチャルールは実装開始前に必ず確認してください。

### Test Coverage Diagram（TDD開始前必須）

TDD Red-Green-Refactorサイクル**開始前**に`references/test-coverage-diagram-template.md`をReadし、以下を実行する:

1. **コードパス追跡**: 実装するコードのすべての分岐/エラー経路をASCIIダイアグラムでマッピング
2. **ユーザーフローマッピング**: ユーザーインタラクションシーケンス + エッジケース（ダブルクリック、タイムアウト、同時アクション）
3. **ギャップ識別**: 各分岐を既存テストと照合し★★★/★★/★品質スコアリング
4. **テスト生成**: GAPとマークされた経路のテストをTDDで作成

このダイアグラムはTDDの「どのテストを作成するか」を決定する設計ツールである。テストを作成した後ではなく、**作成する前に**実行する。

---

## Not For / Boundaries

- バグ修正専用の作業 → `bug-fix`スキル使用
- 既存機能のリファクタリング（仕様変更なし） → `de-sloppify`使用
- インフラ/デプロイ変更 → `infra-designer`または`deploy`使用
- 単純なドキュメント更新 → `sync-project-md`使用

---

## Maintenance

- **Sources**: TDD原則、SDDパターン、プロジェクトSPEC.md、CLAUDE.md
- **Last updated**: 2026-04-05
- **Known limits**: SDDモードはPLAN.mdなしでは動作しない；サブエージェント並列ディスパッチ禁止規則は手動遵守が必要
