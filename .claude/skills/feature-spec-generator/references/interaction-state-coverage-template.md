# Interaction State Coverage Template

> **Purpose**: SPEC作成時にUIコンポーネントごとの5つの状態カバレッジを事前定義し、実装漏れを防止する
> **When**: feature-spec-generatorがUIコンポーネントを含むSPEC.md生成時に本テンプレートを参照

---

## 概要

すべてのUI機能は5つのインタラクション状態を持つ。
SPEC段階で各状態を明示的に定義すれば、実装時の状態漏れを防止できる。

---

## 5つのインタラクション状態

| 状態 | 定義 | 例 |
|------|------|------|
| **LOADING** | データ取得中 | スケルトンUI、スピナー、プログレスバー |
| **EMPTY** | データなし / 初回利用 | "まだ項目がありません" + CTAボタン |
| **ERROR** | 失敗状態 | エラーメッセージ + 再試行ボタン |
| **SUCCESS** | 正常データ表示 | データ一覧、詳細画面 |
| **PARTIAL** | 部分ロード / 部分失敗 | 一部データ表示 + 残りロード中 |

---

## Interaction State Coverage Matrix

SPEC.mdの各UIコンポーネント/画面について、以下のマトリクスを作成する。

```markdown
### Interaction State Coverage: {feature-name}

| Component | LOADING | EMPTY | ERROR | SUCCESS | PARTIAL | Notes |
|-----------|:-------:|:-----:|:-----:|:-------:|:-------:|-------|
| SearchResults | Skeleton 3行 | "検索結果なし" + おすすめキーワード | "検索失敗" + 再試行 | 結果カードグリッド | 1ページ目表示 + 次ページロード中 | — |
| FilterPanel | 非活性状態 | デフォルトフィルタのみ表示 | フィルタ読み込み失敗の案内 | 全フィルタオプション | 一部フィルタカテゴリのみロード | カテゴリ別に独立してロード |
| SearchInput | — | placeholder表示 | — | 入力値表示 | オートコンプリートロード中 | LOADING/ERRORはオートコンプリートにのみ該当 |
| Pagination | 非活性 | — | — | ページ番号表示 | — | EMPTYはSearchResultsが処理 |
```

---

## 未定義状態 = デザインギャップ

マトリクスの空セルは以下のいずれかでなければならない。

1. **N/A (該当なし)**: 該当状態が論理的に発生しない → `—` と表記し、Notesに理由を明示
2. **GAP (未定義)**: 該当状態が発生し得るがデザインが定義されていない → **自動フラグ**

### 自動フラグ規則

```
IF cell is empty AND no N/A justification in Notes
THEN → DESIGN GAP: {Component}の{State}状態が定義されていない
```

### 深刻度

| 未定義状態 | 深刻度 | 根拠 |
|----------|:------:|------|
| ERROR | **HIGH** | エラー時にユーザーが何のフィードバックもなく止まる |
| LOADING | **HIGH** | ロード中の空画面は「故障」の印象を与える |
| EMPTY | **MEDIUM** | 初回利用体験を損なう |
| PARTIAL | **LOW** | 稀な状況だがUX品質に影響 |
| SUCCESS | **CRITICAL** | 中核状態の欠落 = 機能未実装 |

---

## 作成ガイド

### 各状態定義時に含める要素

**LOADING**:
- 表示方式: スケルトン / スピナー / プログレスバー
- 遷移条件: 何秒以内にロード完了が期待されるか
- タイムアウト: N秒後にERROR状態へ遷移

**EMPTY**:
- メッセージ: 状況に応じた具体的な案内
- CTA: ユーザーが次に取れる行動
- イラスト/アイコン: 空状態を視覚的に伝える

**ERROR**:
- メッセージ: 具体的な原因 + 解決行動
- 復旧アクション: 再試行、戻る、代替経路
- ロギング: エラーを自動レポートするかどうか

**SUCCESS**:
- レイアウト: データ表示構造
- インタラクション: クリック、ホバー、選択などの可能なアクション
- ソート/フィルタ: デフォルトのソート順

**PARTIAL**:
- どの部分がロード済みで、どの部分が待機中か
- 部分エラー時に正常データは維持されるか
- 段階的ロードUX (Progressive Enhancement)

---

## SPEC.md 統合

feature-spec-generatorがUIコンポーネントを含むSPEC.md生成時:

1. 各UIコンポーネントセクションにInteraction State Coverage Matrixを含める
2. GAPが検出されたらSPEC完成度の警告を出力する
3. HIGH以上のGAPが2件以上あればSPEC完了をブロックし、状態定義を要求する

---

## プラットフォーム非依存

本テンプレートはすべてのUIプラットフォーム(Web/Mobile/Desktop)に適用可能。

| プラットフォーム | LOADING表現 | EMPTY表現 | ERROR表現 |
|--------|-------------|-----------|-----------|
| Web (React/Vue/Svelte) | Skeleton, Suspense | EmptyState component | ErrorBoundary |
| Mobile (Flutter) | Shimmer, CircularProgressIndicator | EmptyWidget | ErrorWidget |
| Mobile (React Native) | ActivityIndicator, Skeleton | ListEmptyComponent | Error boundary |
| Desktop (Tauri) | Loading overlay | Empty view | Error dialog |
