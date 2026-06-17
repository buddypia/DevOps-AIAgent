---
paths:
  - "**/*.{test,spec}.{ts,tsx,js,jsx,mjs,py,go,rs,java,kt,swift,cpp,cs,php,dart}"
  - "tests/**/*"
  - "test/**/*"
  - "**/__tests__/**/*"
---
# Testing Rules

## ID: R-CM-002
## Severity: critical
## Enforced by: coverage-threshold-guard（本プロジェクトでは未配備 — prompt-level）

### Rules

1. **TDD 必須**: 新機能は Red-Green-Refactor の順序で開発する
2. **カバレッジ Ratchet**: カバレッジは上昇のみ許可（up-only）。低下する場合は guard が DENY する
3. **テストパス**: project-config.json の paths.tests_unit を参照する
4. **テスト命名**: `describe('<対象>') > it('should <振る舞い>')` の形式
5. **テスト隔離**: 各テストは独立して実行可能とする。共有状態の使用を禁止する
6. **モック最小化**: 外部依存のみモックする。内部モジュールは実物を使用する
7. **Edge Case 必須**: 空値・null・境界値・エラーケースを必ず含める
8. **スナップショットテストを避ける**: UI 変更に脆弱。動作ベースのテストを優先する
9. **E2E Fixture の分離**: E2E テストの大容量 fixture（HTML ページの dump、API レスポンスの sample、長い JSON 成果物など）は SKILL.md / テストファイル本文に直接含めない。`tests/fixtures/` または `references/fixtures/` 配下に分離し、テストはパスのみを参照する。理由: AI のコンテキストロード時に SKILL.md / テストファイルがいずれもトークンを消費する。fixture が本文にあると呼び出しのたびに context bloat が発生する。R-CM-019（skill-doc-hygiene）のトークン上限の精神を補完するもの。
