---
paths:
  - "**/{auth,security,secret,crypto,oauth,jwt,session}/**"
  - "**/.env*"
  - "**/*secret*"
  - "**/middleware/**"
---
# Security Rules

## ID: R-CM-003
## Severity: critical
## Enforced by: secret-leak-guard, security-scan-guard（本プロジェクトでは未配備 — prompt-level）

### Rules

1. **シークレット禁止**: コードに API キー・パスワード・トークンをハードコードすることは絶対に禁止
2. **環境変数**: 機密情報は必ず環境変数を使用する。`.env` は `.gitignore` に含める
3. **入力検証**: すべてのユーザー入力はサーバーサイドで検証する（Zod など）
4. **SQL Injection 防止**: ORM/Query Builder を使用する。Raw SQL を使う場合は parameterized query を必須とする
5. **XSS 防止**: ユーザー入力を HTML に直接挿入しない。フレームワークの自動エスケープを活用する
6. **CORS 設定**: ワイルドカード（*）の使用を禁止する。許可ドメインを明示的に設定する
7. **依存関係のセキュリティ**: 既知の脆弱性があるパッケージを使用しない。`npm audit` を定期的に実行する
8. **認証/認可**: すべての保護リソースに認証ミドルウェアを適用する。RBAC による権限チェックを必須とする
