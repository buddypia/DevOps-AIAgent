---
paths:
  - "src/**/*"
  - "**/*.config.{ts,js,mjs}"
  - "**/package.json"
---
# Performance Rules

## ID: R-CM-004
## Severity: major
## Enforced by: model-routing-guard（本プロジェクトでは未配備 — prompt-level）

### Rules

1. **バンドルサイズ**: 不要な大型ライブラリの使用を控える。tree-shaking 可能なパッケージを優先する
2. **遅延ロード**: 初期ロードに不要なモジュールは dynamic import を使用する
3. **画像最適化**: フレームワークが提供する画像最適化（例: 適切なサイズ・遅延読み込み）を活用する
4. **メモ化**: コストの大きい計算にのみ useMemo/useCallback を適用する。過度な使用を避ける
5. **N+1 クエリ防止**: データロード時はバッチ/ジョインを活用する。ループ内での個別クエリを禁止する
6. **キャッシュ戦略**: API レスポンス・静的アセットに適切なキャッシュヘッダーを設定する
7. **モデルルーティング**: AI モデル呼び出し時はタスクの複雑度に合ったモデルを選択する（model-routing-guard と連携）
