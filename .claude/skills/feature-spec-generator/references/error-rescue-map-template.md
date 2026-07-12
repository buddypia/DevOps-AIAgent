# Error & Rescue Map Template

> **Purpose**: SPEC作成時にエラーシナリオを事前定義し、実装段階でのエラーハンドリング漏れを防止する
> **When**: feature-spec-generatorがSPEC.md生成時に本テンプレートを参照し、Error & Rescue Mapセクションを含める

---

## 概要

すべてのAPIエンドポイント/コンポーネントについて、失敗シナリオを事前定義する。
「ユーザーに見えるもの」まで明示し、エラーUXを設計段階で決定する。

---

## Error & Rescue Map テーブル

SPEC.mdの各APIエンドポイントまたは主要関数について、以下のテーブルを作成する。

```markdown
### Error & Rescue Map: {endpoint/function name}

| Method/Path | Failure | Exception | Rescued? | Test? | User Sees |
|------------|---------|-----------|:--------:|:-----:|-----------|
| POST /api/search | DB connection timeout | DatabaseTimeoutError | Y | Y | "検索サービスが一時的に不安定です。しばらくしてから再度お試しください。" |
| POST /api/search | Invalid query param | ValidationError | Y | Y | インラインフィールドエラーメッセージ |
| POST /api/search | Rate limit exceeded | RateLimitError | Y | N | "リクエストが多すぎます。1分後に再度お試しください。" |
| POST /api/search | Elasticsearch down | ServiceUnavailableError | N | N | **500 — Silent failure** |
| GET /api/search/:id | Not found | NotFoundError | Y | Y | 404ページ |
| GET /api/search/:id | Unauthorized | AuthError | Y | Y | ログインページへリダイレクト |
```

---

## CRITICAL GAP 自動フラグ規則

以下の組み合わせは**CRITICAL GAP**として自動フラグする。

```
IF Rescued = N AND Test = N AND User Sees = "Silent" or empty
THEN → CRITICAL GAP: ユーザーに無応答の失敗が発生する可能性がある
```

### 深刻度マトリクス

| Rescued | Test | User Sees | 判定 |
|:-------:|:----:|-----------|------|
| Y | Y | 明確なメッセージ | OK |
| Y | N | 明確なメッセージ | MEDIUM — テスト必要 |
| N | Y | Silent | HIGH — Rescue実装必要 |
| N | N | Silent/Empty | **CRITICAL** — 即時解決 |
| Y | Y | Generic "エラー発生" | LOW — UX改善推奨 |

---

## 作成ガイド

### 失敗シナリオ導出チェックリスト

各エンドポイント/関数について、以下のカテゴリ別の失敗を考慮する。

1. **ネットワーク**: タイムアウト、DNS失敗、接続拒否
2. **認証/認可**: 期限切れトークン、権限なし、セッション切れ
3. **検証**: 必須フィールド欠落、形式エラー、範囲超過
4. **データ**: レコードなし、重複キー、参照整合性違反
5. **外部サービス**: APIダウン、レスポンス形式変更、Rate limit
6. **リソース**: ディスクフル、メモリ不足、ファイルロック
7. **並行性**: Race condition、楽観的ロック失敗、デッドロック

### "User Sees" 作成規則

- 具体的なメッセージを作成する（汎用的な「エラーが発生しました」は禁止）
- ユーザーアクションを含める（再試行、別の方法、サポート問い合わせ）
- Silent failureは必ずCRITICALとしてフラグする

---

## SPEC.md 統合

feature-spec-generatorがSPEC.md生成時:

1. 各 `api_endpoint` ブロックにError & Rescue Mapサブセクションを含める
2. 各主要UIインタラクションにエラー状態シナリオを含める
3. CRITICAL GAPが1件以上あればSPEC完成度の警告を出力する

---

## プラットフォーム非依存

本テンプレートはすべてのフレームワーク(Web/Mobile/Desktop)に適用可能。
Exceptionクラス名とHTTPステータスコードはフレームワークに応じて調整する。
