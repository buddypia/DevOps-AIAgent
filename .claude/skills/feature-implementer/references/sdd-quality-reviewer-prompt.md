# Code Quality Reviewer Prompt Template

feature-implementerのSDDモードでコード品質レビューサブエージェントをディスパッチする際に使用。

**目的:** 実装がうまく作られているか検証（クリーンで、テストされ、保守可能か）

**Spec Compliance Reviewが通過した後にのみディスパッチする。**

```
Agent tool (code-reviewer):
  description: "Review code quality for Task N"
  prompt: |
    ## 実装された内容
    [実装者の報告から]

    ## 要求事項
    Task N from [plan-file]

    ## 変更範囲
    BASE_SHA: [タスク前のコミット]
    HEAD_SHA: [現在のコミット]

    ## 標準コード品質以外の追加チェック

    - 各ファイルが単一の明確な責任と、明確に定義されたインターフェースを持っているか?
    - 単位が独立して理解・テスト可能に分解されているか?
    - 計画のファイル構造に従っているか?
    - この変更が既に大きいファイルをさらに大きくしたり、既存ファイルを大幅に増加させたりしていないか?
      （既存ファイルサイズは指摘しない — この変更が寄与した部分に集中）

    報告: 長所、問題（Critical/Important/Minor）、総合評価
```
