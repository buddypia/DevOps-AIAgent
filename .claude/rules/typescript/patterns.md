---
paths:
  - "src/**/*.{ts,tsx}"
  - "server/**/*.ts"
---
# TypeScript Patterns Rules

## ID: R-TS-003
## Severity: major
## Enforced by: null

### Rules

1. **Barrel Exports**: 各 feature の index.ts では public API のみを re-export する
2. **Zod スキーマパターン**: スキーマ定義 → 型抽出 → validator 関数 の順序で定義する
3. **Error Boundary**: React アプリでは各 feature に ErrorBoundary を設定する
4. **Custom Hook パターン**: ビジネスロジックは use* カスタム Hook として抽出する
5. **クライアント/サーバー分離**: フロントエンド（src/ の React）とバックエンド（server/ の Express）の境界を明示する。共有する型・スキーマは両者から参照可能な場所に配置する
6. **API ルートパターン**: Express のルートハンドラでは Zod 検証 → ビジネスロジック → レスポンス整形 の順序で処理する
7. **DTO 変換**: API レスポンス → ドメインモデルへの変換には明示的なマッパー関数を使用する
