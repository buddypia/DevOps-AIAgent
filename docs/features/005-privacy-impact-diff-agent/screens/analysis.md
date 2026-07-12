# スクリーン: Privacy Impact Diff Agent Analysis Console

> **画面ID**: SCR-005-analysis | **関連SPEC**: [SPEC-005-privacy-impact-diff-agent](../SPEC-005-privacy-impact-diff-agent.md)

## 1. 画面情報

| 項目 | 内容 |
|---|---|
| 実装 | outputs/05-privacy-impact-diff-agent/src/main.ts |
| ルート | / |
| API | GET /api/health, POST /api/analyze |

## 2. レイアウト

```
┌────────────────────────────────────────────┐
│ Brand / Health / Agent Card                │
├──────────────────┬─────────────────────────┤
│ Input / Goal     │ Decision / Mission      │
│ Context          │ Confidence / Status     │
│ Signals / CTA    │ Evidence / Actions      │
├──────────────────┴─────────────────────────┤
│ Risks / Logs / Feedback / Safe recovery    │
└────────────────────────────────────────────┘
```

## 3. 進入条件

- ログイン不要のMVP。ただし本番APIは設定済みの認証・IP allowlist・CORS制約に従う。
- Gemini未設定でもfallback導線を表示する。

## 4. UI状態マトリクス

| 状態 | 表示 | ユーザー操作 |
|---|---|---|
| 初期 | サンプルまたは空入力、CTA | 対象を入力する |
| 入力不正 | フィールド/JSONエラー | 入力を修正する |
| Loading | 実行中表示、CTA無効化 | 待機する |
| 成功 | CLEAR / REVIEW / BLOCK PRIVACY、confidence、summary、evidence、actions | 根拠を確認/再実行 |
| Fallback | AI未接続の注記と同一結果形状 | 環境設定後に再実行 |
| Error | request ID付きエラー | 再試行/管理者へ共有 |

## 5. コンポーネント仕様

### Input / Goal Form

- target/context/signalsを必須または既存schemaの範囲で受け付ける。
- 実行中は二重送信を防止する。

### Decision / Mission Report

- 最上段に判断ラベルとconfidenceを表示する。
- 根拠はラベル・値・重みまたは引用ログIDと紐付ける。
- actionには担当とpriorityを表示し、AIの提案と人間の承認を区別する。

### Empty / Error

- 入力前は「証拠を入力してください」または「目的を書いてください」を表示する。
- エラーには秘密情報を含めず、request IDと再試行導線だけを示す。

## 6. ユーザーインタラクション

| 要素 | 操作 | 結果 |
|---|---|---|
| 実行CTA | クリック | API実行、Loadingへ遷移 |
| サンプル | クリック | 検証可能なサンプルを入力 |
| 再試行 | クリック | 同一入力を再送信 |
| フィードバック | Useful/Unclear/Wrong | /api/eventsまたは履歴へ記録 |

## 7. Event → Logic Mapping

| UIイベント | ロジック | 状態変化 |
|---|---|---|
| 実行 | POST /api/analyze | idle → loading → data/error |
| 結果取得 | 分析レスポンスをレンダー | loading → data |
| エラー | 統一エラー/fallback | loading → error/data |

## 8. ナビゲーション

| 項目 | 値 |
|---|---|
| 入口 | / |
| 関連導線 | health/ready/version/project |
| Deep link | N/A - SPA/単一画面MVP |

## 9. ロジックSSOT

- [SPEC-005-privacy-impact-diff-agent.md](../SPEC-005-privacy-impact-diff-agent.md) §0.2、§0.5、§2

## 10. APIタッチポイント

- GET /api/health
- GET /api/ready
- GET /api/version
- GET /api/project
- POST /api/analyze
- POST /api/events

## 11. FRマッピング

- FR-00501: 入力/契約
- FR-00502: AI/実行
- FR-00503: 結果表示
- FR-00504: 安全性/運用

## 12. AI実装ヒント

1. 既存の型・Zod・APIレスポンスを先に確認する。
2. Loading/Empty/Error/Success/Fallbackを同じ画面状態モデルで実装する。
3. 判断・根拠・アクション・人間確認を視覚的に分離する。
4. 既存のスタイルとアクセシビリティ属性を再利用する。
