# UI Approval Gate — Review Templates

> SKILL.md Tier 2 reference. Phase 4 ユーザーレビュー提示テンプレート (NEW_FEATURE + MODIFY_FEATURE) + 承認/修正/拒否出力形式。

## Phase 4: ユーザーレビュー — NEW_FEATUREテンプレート

```markdown
---

# このように実装されます。承認しますか?

> **機能**: {feature-id} - {title}
> **作業タイプ**: 新規機能開発
> **修正回数**: {revision_count}/3

---

## 1. パイプライン進捗

{Phase 2のダイアグラム}

## 2. ユーザーフロー

{Phase 3Aのフローチャート}

## 3. 画面レイアウト

### 画面: {screen_1_name}

{ASCII UIレイアウト}

### 画面: {screen_2_name}

{ASCII UIレイアウト}

## 4. 状態バリエーション

### ローディング中

{ASCII UI}

### 空状態

{ASCII UI}

---

## レビュー判定

上記内容を確認し、判定してください:

- **承認**: 上記設計で実装を進めます
- **修正要求**: 具体的なフィードバックを提供してください({3 - revision_count}回まで修正可能)
- **拒否**: パイプラインを中断し、SPECから再検討します

---
```

## Phase 4: ユーザーレビュー — MODIFY_FEATUREテンプレート

```markdown
---

# このように変更されます。承認しますか?

> **機能**: {feature-id} - {title}
> **作業タイプ**: 既存機能修正
> **修正回数**: {revision_count}/3
> **変更対象FR**: {modified_fr_list}

---

## 1. パイプライン進捗

{Phase 2のダイアグラム}

## 2. ユーザーフロー変更

{Phase 3Aのフローチャート — 変更箇所ハイライト}

## 3. UI変更比較

{Phase 3CのBefore/After比較}

## 4. 変更影響サマリー

| 影響範囲       | 詳細                 |
| :--------------- | :------------------- |
| 変更される画面    | {screen_list}        |
| 新規追加        | {new_elements}       |
| 削除/変更        | {modified_elements}  |
| 既存機能への影響   | {impact_description} |

---

## レビュー判定

上記変更内容を確認し、判定してください:

- **承認**: 上記変更で実装を進めます
- **修正要求**: 具体的なフィードバックを提供してください({3 - revision_count}回まで修正可能)
- **拒否**: パイプラインを中断し、SPECから再検討します

---
```

## 出力形式 — 承認完了報告

```markdown
# UI Approval Gate - 承認完了

> **機能**: {feature-id} - {title}
> **承認日**: {YYYY-MM-DD HH:MM}
> **修正回数**: {revision_count}/3

## ワイヤーフレーム保存位置

- 文書: `docs/wireframes/feature-{id}-wireframe.md`
- フローSVG: `docs/wireframes/feature-{id}-flow.svg`

## 次段階

→ Readiness Gate検証 → 実装段階 (feature-implementer)へ進みます。
```

## 出力形式 — 修正要求報告

```markdown
# UI Approval Gate - 修正要求

> **機能**: {feature-id} - {title}
> **修正回数**: {revision_count}/3

## フィードバック内容

{ユーザーフィードバック}

## 次のアクション

→ フィードバックを反映してワイヤーフレームを再生成します。
```

## 出力形式 — 拒否報告

```markdown
# UI Approval Gate - 拒否

> **機能**: {feature-id} - {title}
> **拒否理由**: {reason}

## 次のアクション

→ パイプラインが中断されました。
→ SPEC再検討後の再実行を推奨します。
```

## 強制決定 (3回修正後)

```markdown
修正上限到達 (3/3)

追加修正は非効率的です。選択してください:

- **現行バージョンで承認**: 現在のワイヤーフレームで進行
- **パイプライン中断**: SPEC再検討後に再開始
```
