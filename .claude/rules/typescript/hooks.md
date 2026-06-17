---
paths:
  - "src/**/*.{ts,tsx}"
---
# TypeScript Hooks Rules (React)

## ID: R-TS-005
## Severity: major
## Enforced by: null

### Rules

1. **依存配列**: useEffect、useMemo、useCallback の deps 配列を正確に設定する。ESLint exhaustive-deps を遵守する
2. **Cleanup**: useEffect 内の購読、タイマー、イベントリスナーは必ず cleanup を返す
3. **Custom Hook**: 再利用ロジックは use* プレフィックスのカスタム Hook として抽出する
4. **Hook の規則**: 条件文/ループ内での Hook 呼び出しを禁止する。最上位でのみ呼び出す
5. **状態の初期化**: useState の初期値には意味のあるデフォルト値を設定する。undefined は避ける
6. **派生状態**: 計算可能な値は useState ではなく useMemo で派生させる
7. **イベントハンドラ**: handle* という命名にする。useCallback で包むのは子コンポーネントに渡す場合のみとする
