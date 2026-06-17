---
paths:
  - "src/**/*.{ts,tsx}"
  - "server/**/*.ts"
---
# TypeScript Security Rules

## ID: R-TS-004
## Severity: critical
## Enforced by: security-scan-guard（本プロジェクトでは未配備 — prompt-level）

### Rules

1. **環境変数の型安全**: `process.env` への直接アクセスの代わりに、Zod で検証された env オブジェクトを使用する
2. **SQL Injection**: Prisma/Drizzle ORM を使用する。`.raw()` 呼び出し時は parameterized query を必須とする
3. **XSS**: dangerouslySetInnerHTML の使用を禁止する。必須の場合は DOMPurify で sanitize する
4. **CSRF**: 状態変更を伴う API には CSRF トークン検証を適用する
5. **型ベースの検証**: `as` 型アサーションの代わりにランタイム検証（Zod parse）を使用する
6. **Secret in Code**: .env.example には実際の値ではなく placeholder を使用する
7. **Dependency**: npm audit 結果の critical/high 脆弱性を 0 件に維持する
