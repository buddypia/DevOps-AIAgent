---
paths:
  - "src/**/*.{ts,tsx}"
  - "server/**/*.ts"
---
# TypeScript Testing Rules

## ID: R-TS-002
## Severity: critical
## Enforced by: coverage-threshold-guard（本プロジェクトでは未配備 — prompt-level）

### Rules

1. **テストフレームワーク**: Vitest を使用する（Jest 互換 API）
2. **MSW**: API のモックは MSW（Mock Service Worker）を使用する。fetch/axios の直接モックは避ける
3. **Testing Library**: DOM テストは @testing-library を使用する。アクセシビリティクエリを優先する
4. **型安全なテスト**: テストにも型チェックを適用する（tsconfig に含める）
5. **Fixture パターン**: テストデータはファクトリ関数で生成する。ハードコーディングは避ける
6. **非同期テスト**: waitFor、findBy など適切な非同期ユーティリティを使用する
7. **カバレッジ設定**: vitest.config.ts に coverage 設定を含める。lcov レポーターを有効化する
