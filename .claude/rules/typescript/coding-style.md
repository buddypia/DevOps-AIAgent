---
paths:
  - "src/**/*.{ts,tsx}"
  - "server/**/*.ts"
---
# TypeScript Coding Style Rules

## ID: R-TS-001
## Severity: critical
## Enforced by: null

### Rules

1. **strict モード**: tsconfig.json に strict: true を必須とする
2. **any 使用禁止**: any 型の使用を禁止。unknown または具体的な型を使用する
3. **Zod スキーマ**: API リクエスト/レスポンスは Zod スキーマで定義し、`z.infer<typeof schema>` で型を抽出する
4. **React Props 型**: interface で Props を定義する。`ComponentProps` ユーティリティ型を活用する
5. **型ガード**: instanceof、in 演算子、またはカスタム型ガード関数を使用する
6. **ジェネリクス**: 再利用可能なユーティリティにジェネリクスを活用する。ただし2段階以上のネストは避ける
7. **const assertion**: リテラル型が必要な箇所には `as const` を使用する
8. **enum 回避**: string union type または `as const` オブジェクトの使用を推奨する
