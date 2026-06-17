---
paths:
  - "src/**/*"
  - "**/features/**"
  - "**/shared/**"
---
# Architecture Patterns Rules

## ID: R-CM-005
## Severity: major
## Enforced by: null (scaffold target に feature-boundary-guard hook を自動配備 — `.claude/skills/project-scaffolder/templates/hooks/feature-boundary-guard.mjs`。brief2dev リポ自体では prompt-level)

### Rules

1. **Feature-First Architecture**: 技術レイヤー(controllers/, services/)ではなく機能単位(features/search/)で構成する
2. **Repository Pattern**: データアクセスロジックは repository レイヤーに隔離する。コンポーネントから直接 DB にアクセスすることは禁止
3. **API Response フォーマット**: 一貫した応答形式を使用する `{ data, error, meta }`
4. **エラー処理パターン**: カスタムエラークラスを使用する。try-catch は境界でのみ
5. **依存方向**: features/ → shared/ (許可)、shared/ → features/ (禁止)
6. **共有コード**: 2つ以上の feature で使用されるコードのみを shared/ に移動する
7. **状態管理**: サーバー状態(TanStack Query 等)とクライアント状態(Zustand 等)を分離する
