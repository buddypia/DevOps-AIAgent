---
name: story-decomposer
description: |
  対象プロジェクトのSPEC.mdを開発可能なUser Story / Job Storyに分解するTier 2 Deliveryスキル。
  INVEST基準(Independent, Negotiable, Valuable, Estimable, Small, Testable)を適用し、
  各ストーリーに受け入れ基準(Acceptance Criteria)を含むバックログアイテムを生成する。

  **核心機能**:
  - SPEC.md → User Stories分解（"As a... I want... so that..."）
  - SPEC.md → Job Stories分解（"When... I want... so I can..."）
  - INVEST基準の自動検証
  - 受け入れ基準（Given-When-Then）の自動生成
  - 依存関係グラフ + 実装順序の提案

  「ストーリー分解」「user story」「バックログ」「story decompose」等の要求でトリガーされる。
---

# Story Decomposer (ストーリー分解)

> **核心コンセプト**: 「良いストーリーは1日以内に実装・検証できるべきである」— INVEST原則

SPEC.mdの機能仕様を、開発者がすぐに着手できるサイズのストーリーに分解する。

---

## EXECUTION PROTOCOL (MANDATORY)

### Pre-flight Checklist

```markdown
## Pre-flight Checklist

|  #  | 項目                                    | 状態 | 備考 |
| :-: | --------------------------------------- | :--: | ---- |
|  1  | 対象SPEC.mdの確定                       |  ⬜  |      |
|  2  | BRIEF.mdペルソナ情報の確認             |  ⬜  |      |
|  3  | ストーリー形式の選択 (user/job)             |  ⬜  |      |
|  4  | project-config.jsonのパス解決           |  ⬜  |      |
```

### Model Routing Policy

| 作業タイプ           | モデル   | 根拠                     |
| ------------------- | ------ | ------------------------ |
| ストーリー分解         | opus   | 機能分析、品質優先     |
| 受け入れ基準作成      | sonnet | 構造化された記述、速度優先 |
| INVEST検証         | sonnet | パターンマッチング、速度優先     |
| 依存関係分析       | sonnet | 構造分析、速度優先     |

### Post-flight Checklist

```markdown
## Post-flight Checklist

|  #  | 項目                                          | 状態 | 備考 |
| :-: | --------------------------------------------- | :--: | ---- |
|  1  | ストーリーを最低3件以上生成                     |  ⬜  |      |
|  2  | 各ストーリーがINVEST基準を通過                    |  ⬜  |      |
|  3  | 各ストーリーに受け入れ基準3件以上 (Given-When-Then)  |  ⬜  |      |
|  4  | 依存関係グラフの作成                          |  ⬜  |      |
|  5  | 実装順序の提案                                |  ⬜  |      |
```

---

## 核心原則

1. **INVEST必須**: すべてのストーリーはINVESTの6基準を通過しなければならない
2. **検証可能**: 各ストーリーにGiven-When-Then形式の受け入れ基準が必須
3. **1日規模**: 1つのストーリーは1日以内に実装 + 検証可能なサイズ

---

## 2種類のストーリー形式

### User Story (役割ベース)

```
As a <役割>,
I want to <行動>,
so that <目的/価値>.
```

- 適合: 役割が明確な場合（B2B、複数ユーザー）
- 例: "As a プロジェクトマネージャー, I want to チームメンバー別の進捗状況を一目で確認したい, so that ボトルネックを素早く発見できる"

### Job Story (状況ベース)

```
When <状況>,
I want to <動機>,
so I can <結果>.
```

- 適合: 状況/文脈が重要な場合（B2C、単一ユーザー）
- 例: "When 検索結果が多すぎるとき, I want to カテゴリ別にフィルタリングしたい, so I can 求める結果を素早く見つけられる"

---

## INVEST検証基準

| 基準 | 質問 | PASS条件 |
|------|------|----------|
| **I**ndependent | 他のストーリーなしで独立して実装可能か? | 依存関係を最小化 |
| **N**egotiable | 実装方法に余地があるか? | HOWではなくWHATを記述 |
| **V**aluable | ユーザーに直接的な価値を与えるか? | 技術的作業のみではない |
| **E**stimable | 労力を見積もれるか? | 不確実性が低い |
| **S**mall | 1日以内に実装可能か? | 分解が必要な場合は表示 |
| **T**estable | 受け入れ基準で検証可能か? | Given-When-Thenが記述可能 |

---

## 受け入れ基準 (Acceptance Criteria)

Given-When-Then形式で各ストーリーに3〜6個の受け入れ基準を記述する:

```markdown
### AC-1: 基本フィルタリング
- **Given** 検索結果が20件以上表示されているとき
- **When** ユーザーが「カテゴリ」フィルタを選択すると
- **Then** 選択したカテゴリの結果のみが表示され、件数が更新される

### AC-2: フィルタ解除
- **Given** カテゴリフィルタが適用された状態で
- **When** ユーザーが「全体」ボタンをクリックすると
- **Then** フィルタが解除され、全体の結果が再表示される

### AC-3: 結果なしの処理
- **Given** 選択したカテゴリに結果がないとき
- **When** フィルタが適用されると
- **Then** 「結果がありません。別のカテゴリをお試しください」というメッセージが表示される
```

---

## 出力形式

```markdown
# Story Decomposition: <機能名>

> **ソース**: docs/features/<name>/SPEC.md
> **形式**: User Story / Job Story
> **INVEST検証**: 全件通過

## Stories

### US-001: <ストーリータイトル>
> As a <役割>, I want to <行動>, so that <目的>.

**INVEST**: I✅ N✅ V✅ E✅ S✅ T✅
**推定労力**: 0.5日
**依存関係**: なし

#### Acceptance Criteria
1. **Given** ... **When** ... **Then** ...
2. **Given** ... **When** ... **Then** ...
3. **Given** ... **When** ... **Then** ...

---

### US-002: <ストーリータイトル>
...

## Dependency Graph

```
US-001 (独立)
  ↓
US-002 → US-003
  ↓
US-004 (US-002完了後)
```

## 実装順序（推奨）

| 順序 | ストーリー | 理由 | 推定労力 |
|:----:|--------|------|:---------:|
| 1 | US-001 | 独立、コア機能 | 0.5日 |
| 2 | US-002 | US-001を基に拡張 | 1日 |
| 3 | US-003 | US-002と並行可能 | 0.5日 |
```

---

## 関連スキル

| 方向 | スキル | 関係 |
| ---- | ---- | ---- |
| 呼び出し元 | `feature-pilot` | 機能実装前のストーリー分解 |
| 参照 | `feature-spec-generator` | SPEC.md生成後の分解 |
| 参照 | `feature-architect` | BRIEF.mdペルソナ情報 |
| 後続 | `feature-implementer` | ストーリー単位のTDD実装 |

---

## 使用例

```bash
# User Story形式で分解
/story-decomposer "検索機能"

# Job Story形式で分解
/story-decomposer --format job "検索機能"

# 特定のSPECパスを指定
/story-decomposer --spec docs/features/search/SPEC.md

# 受け入れ基準のみ追加（既存ストーリーに）
/story-decomposer --ac-only "検索機能"
```

## Not For / Boundaries

> 本skillの明示的非対象（R-CM-018 Rule 4 — Missing Boundaries遮断）。詳細なboundaryはfrontmatter description + 本文trigger節を単一の真実の情報源として使用する。

- frontmatter descriptionに明示されたtrigger以外の領域は本skillでは扱わない。
- 関連skill / 呼び出しチェーン / 依存関係は本文またはMANIFEST.jsonを参照。
- ユーザーストーリー（storyレベル）→ 小単位への分解。エンジニアリング単位の分解は`engineering-plan-writer`の領域。
- SPEC作成 / 実装は`feature-spec-generator` / `feature-implementer`に委任 — 本skillはstory分解までを担当。
- 分解されたstoryの優先順位付けは`prioritize` / `betting-table`の領域。

## Maintenance

- **Sources**: brief2dev内部（`.claude/rules/` R-CM/R-PL rules + `.claude/skills/`スキルコンベンション）。外部referenceは本文参照。
- **Last updated**: 2026-04-11
- **Known limits**: 本スキルの明示的boundaryはfrontmatter description（`|...`）及び本文参照。
