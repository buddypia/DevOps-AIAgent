# UI Approval Gate — State Management

> SKILL.md Tier 2 reference. Phase 5 結果処理 + CONTEXT.jsonスキーマ拡張 + feature-pilot状態マシン統合 + 遷移ルール。

## Phase 5: 結果処理

### 承認時

```markdown
1. CONTEXT.json更新
   - ui_approval.status → "approved"
   - ui_approval.approved_at → 現在時刻
   - ui_approval.revision_count → {count}
   - historyに状態遷移を記録

2. ワイヤーフレーム保存確定
   - docs/wireframes/feature-<id>-wireframe.md

3. 次段階へ進行
   - feature-pilotにGo信号を返す
```

### 修正要求時

```markdown
1. 修正回数確認
   - revision_count < 3 → Phase 3へ復帰
   - revision_count >= 3 → 強制決定要求 (review-templates.md参照)

2. フィードバック収集
   - 具体的な修正事項を質問
   - 修正内容を記録

3. ワイヤーフレーム再生成
   - フィードバック反映
   - Phase 4再実行
```

### 拒否時

```markdown
1. 理由記録
   - 拒否理由を収集
   - CONTEXT.jsonに記録

2. CONTEXT.json更新
   - ui_approval.status → "rejected"
   - ui_approval.rejected_reason → {reason}
   - current_state → "Blocked"

3. パイプライン中断
   - feature-pilotにNo-Go信号を返す
   - 次の行動を案内: SPEC再検討または要件再定義
```

## CONTEXT.jsonスキーマ拡張

ui-approval-gate が CONTEXT.json に `ui_approval` セクションを追加/更新する:

```json
{
  "ui_approval": {
    "status": "pending | in_review | approved | rejected",
    "wireframe_path": "docs/wireframes/feature-xxx-wireframe.md",
    "svg_paths": {
      "flow": "docs/wireframes/feature-xxx-flow.svg",
      "pipeline": "docs/wireframes/feature-xxx-pipeline.svg"
    },
    "work_type": "NEW_FEATURE | MODIFY_FEATURE",
    "revision_count": 0,
    "revisions": [
      {
        "at": "2026-02-14T10:00:00+09:00",
        "feedback": "カードレイアウトをもう少し大きく",
        "applied": true
      }
    ],
    "approved_at": null,
    "rejected_reason": null,
    "last_updated_at": "2026-02-14T10:00:00+09:00"
  }
}
```

### 状態定義

| 状態        | 説明                                     |
| :---------- | :--------------------------------------- |
| `pending`   | UI承認段階未進入                      |
| `in_review` | ワイヤーフレーム生成後、ユーザーレビュー中      |
| `approved`  | ユーザー承認完了                         |
| `rejected`  | ユーザー拒否、SPEC再検討が必要            |

## feature-pilot状態マシン統合

feature-pilot状態マシンに `UiApproval` 状態を追加:

```
                          +--------------+
                          | SpecDrafting |
                          +------+-------+
                                 | spec_done
                                 v
                          +--------------+
                          | UiApproval   |  (必須)
                          +------+-------+
                                 | ui_approved
                                 v
                          +--------------+
                          | Implementing |
                          +--------------+
```

### 遷移ルール

| 現在の状態      | トリガー        | 次の状態      | 条件                        |
| :------------- | :------------ | :------------- | :--------------------------- |
| SpecDrafting   | SPEC完了     | **UiApproval** | SPEC.md, screens/\*.md 存在 |
| SpecUpdating   | SPEC修正完了 | **UiApproval** | SPEC変更差分あり         |
| **UiApproval** | UI承認       | Implementing   | Readiness Gate Go           |
| **UiApproval** | UI拒否       | Blocked        | 拒否理由記録              |
| Blocked        | 質問解決     | UiApproval     | 再検討後再開始            |

## ワイヤーフレームファイル命名規則

```
docs/wireframes/
├── feature-{id}-wireframe.md        # ワイヤーフレーム文書
├── feature-{id}-flow.svg            # ユーザーフローSVG
└── feature-{id}-pipeline.svg        # パイプライン進捗SVG
```
