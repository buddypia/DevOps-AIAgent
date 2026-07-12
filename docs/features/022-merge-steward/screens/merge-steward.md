# スクリーン: Merge Steward Panel

> **画面ID**: SCR-022-merge-steward | **関連SPEC**: [SPEC-022-merge-steward](../SPEC-022-merge-steward.md)

## 1. 画面情報

| 項目 | 内容 |
|---|---|
| 実装予定 | `src/MergeStewardPanel.tsx`, `src/AppHome.tsx` |
| ルート | `/#merge-steward`（ホーム内セクション） |
| API | Issue preview/create、PR evaluate/merge |
| デザイン | `src/styles.css` Amber Circuit tokens |

## 2. レイアウト

```text
┌─ Merge Steward ───────────────────────────────────────────┐
│ 🛡 Issue→PR→安全マージ              [GitHub 接続状態]      │
│ [Issue化] [PR評価]                                        │
├──────────────────────────┬───────────────────────────────┤
│ 入力                     │ 判定 / 証拠                   │
│ 問題タイトル             │ READY / HUMAN REVIEW / BLOCKED│
│ 問題・証拠・受入条件     │ checks / reviews / files      │
│ または PR番号            │ blockers / receipt            │
│ [プレビュー / 評価]      │                               │
├──────────────────────────┴───────────────────────────────┤
│ 書き込み前確認: 実行内容・対象repository・安全境界        │
│                    [戻る] [Issue作成 / squash merge]      │
└──────────────────────────────────────────────────────────┘
```

## 3. 状態

| 状態 | 表示 | 操作 |
|---|---|---|
| Empty | 役割説明、入力例、安全境界 | Issue/PRを入力 |
| Loading | evidence skeleton、CTA disabled | 待機 |
| Preview | Issue本文、duplicate候補、対象repo | 確認/戻る |
| Success | Issue URLまたはverdict/receipt/merge URL | GitHubを開く/再評価 |
| Partial | 取得済み証拠と欠落項目、BLOCKED | 再試行 |
| Error | safe message、設定/再試行アクション | 修正/再試行 |

## 4. コンポーネント仕様

### Header

- 専用ポートレート、名前、役割、GitHub接続状態を表示する。
- 「AIが無条件にマージしない」安全境界を1行で示す。

### Issue Composer

- title、problem、evidence、acceptance criteriaを入力する。
- preview成功までIssue作成CTAを表示しない。
- duplicate候補があれば既存Issueリンクを優先する。

### PR Evaluator

- positive integerのPR番号だけを受け付ける。
- verdictを色だけでなくラベルとアイコンで区別する。
- checks、reviews、files、mergeability、head SHA、blockersを表示する。

### Confirmation Bar

- 書き込み直前だけ表示する。
- 対象repository、操作、head SHA、安全ゲートの最終状態を明示する。
- destructive actionは既存primary CTAと区別し、二重送信を防止する。

## 5. Event → Logic Mapping

| UI event | API/logic | state |
|---|---|---|
| Issueプレビュー | `POST /issues/preview` | idle→loading→preview/error |
| Issue作成確認 | `POST /issues` | preview→loading→success/error |
| PR評価 | `POST /pulls/evaluate` | idle→loading→success/partial/error |
| merge確認 | `POST /pulls/merge` | READY→loading→merged/error |
| stale | head SHA mismatch | error→要再評価 |

## 6. アクセシビリティ

- tabは`role=tablist/tab/tabpanel`と矢印キーを支援する。
- live regionはloading、success、errorだけを簡潔に通知する。
- verdictは色単独で表現しない。
- confirmationへfocusを移し、キャンセル後は元CTAへ戻す。

## 7. FRマッピング

- FR-02201: Issue Composer / preview / confirmation
- FR-02202: PR Evaluator evidence
- FR-02203: verdict / blockers / receipt
- FR-02204: Confirmation Bar / guarded merge
- FR-02205: market card / portrait / all states
