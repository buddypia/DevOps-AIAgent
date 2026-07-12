# 機能概要: 016-ai-exploratory-tester-ai-exploratory-tester

> **状態**: 実装済み・仕様化 | **優先度**: P1 | **生成日**: 2026-07-12
> **コンテキスト**: `docs/features/016-ai-exploratory-tester/CONTEXT.json`

---

## 0. 原本の依頼（ユーザー原文）

> ユーザーの入力をそのまま保持します。

```
現状のコードベースで全ての機能をfeature-architectスキルを利用して反映して。漏れなく
```

## 1. 問題と理由

### 問題

AI Exploratory Testerは、exploration route・bug reproduction・risk-based coverageに関わる運用判断を、分散した情報から再現可能な判断へ変換する機能です。対象情報を読み解く時間と、判断根拠の共有コストが課題です。

### 今なぜ

ハッカソンの提出物として、AIが価値の中心にある実行可能なDevOps体験を、Cloud Run・Gemini・入力検証・フォールバック込みで説明可能にする必要があります。

### 食欲

| 項目 | 値 |
|---|---|
| タイムボックス | 1〜2日で既存実装を仕様化 |
| 複雑度 | 中〜高（外部AI・運用判断） |
| ユーザー価値 | exploratory QA agentが判断の初動を短縮し、根拠付きの次アクションを得る |
| 指標 | 分析完了率、判断の有用性、根拠付きアクション率 |

## 2. ユーザーストーリー

| ID | When | I want to | So I can |
|---|---|---|---|
| US-01 | リリース・障害・品質判断が必要 | 運用担当者として、AI Exploratory Testerに対象の証拠を渡したい | 判断対象を短時間で整理する |
| US-02 | 分析結果を受け取った | リリース責任者として、AI Exploratory TesterのTEST NOW / EXPLORE MORE / BLOCK RELEASEの判断を根拠付きで確認したい | 次の行動と責任範囲を説明する |

## 3. ユーザー旅程

| 段階 | ユーザー行動 | システム反応 |
|---:|---|---|
| 1 | 対象・文脈・シグナルを入力する | 入力をZodで検証し、実行状態を表示する |
| 2 | 分析を開始する | Geminiプロンプトを実行し、失敗時はdeterministic fallbackへ切り替える |
| 3 | 判断結果を確認する | ラベル、信頼度、根拠、リスク、アクション、コメント案を表示する |

## 4. 受入基準（BDD）

| AC | Given | When | Then | 観測点 |
|---|---|---|---|---|
| AC-01 | 入力がスキーマに適合する | 分析を実行する | 構造化結果と判断ラベルが返る | outputs/16-ai-exploratory-tester/src/server.test.ts |
| AC-02 | Geminiが利用できない | 分析を実行する | deterministic fallbackで同じ結果形状を返す | outputs/16-ai-exploratory-tester/src/agent.ts |
| AC-03 | 結果が返る | 画面を確認する | 信頼度・根拠・次アクション・エラー状態を識別できる | outputs/16-ai-exploratory-tester/src/main.ts |

## 5. スコープ境界

### スコープ内

- 対象・文脈・シグナルの入力
- Gemini構造化分析とdeterministic fallback
- 判断・信頼度・根拠・アクションの表示
- health/ready/version/project とイベント記録

### スコープ外

- GitHub/Cloud Logging/Monitoringの実データ自動収集
- AI判断だけでの本番変更実行
- 新しい永続データストアの追加

### ラビットホール

- 外部サービスの実データ連携を先に広げると検証不能になるため、MVPはテキスト証拠と安全なフォールバックを維持する。
- AI出力が未根拠の断定にならないよう、最終判断は人間、根拠表示と入力制約を必須にする。

## 5.5 エンゲージメント設計

| ステージ | 設計 |
|---|---|
| トリガー | リリース、障害、品質確認の判断が必要になったとき |
| アクション | 証拠を貼り付けて分析を1回実行する |
| リワード | TEST NOW〜BLOCK RELEASEの明確な判断と次アクション |
| 投資 | フィードバック、コメント案、運用コンテキスト |

**Aha moment**: 初回分析で、曖昧な要約ではなく判断・根拠・担当付きアクションが同時に表示される瞬間。

## 5.6 競合ベンチマーク

N/A - 本リポジトリのハッカソンMVPでは競合比較を実装要件に含めない。

## 5.7 収益化タッチポイント

N/A - ハッカソン提出用の無料検証機能であり、課金境界は扱わない。

## 6. 制約条件

### ハード制約

- [ ] TypeScript・Express・Viteの既存構成と、Zodによる入力検証を維持する。
- [ ] Gemini APIキーや認証トークンをコードへ埋め込まず、環境変数/Secret Managerを使う。
- [ ] Cloud Runで起動でき、AI失敗時にも安全なfallbackを提供する。
- [ ] AIは本番変更を自律実行せず、人間の確認用の判断・計画を出力する。

### ソフト制約

- 既存のUI語彙・レスポンシブな単一画面構成を再利用する。
- ログ・request ID・health/readiness/versionを運用証拠として残す。

## 7. 完了条件（Definition of Done）

| ID | 完了条件 | 検証タイプ | 観測方法 |
|---|---|---|---|
| DoD-FS-01 | 入力検証・分析結果・fallbackが既存テストで確認できる | machine | npm test -- --run outputs/16-ai-exploratory-tester/src/server.test.ts |
| DoD-FS-02 | 判断ラベル、信頼度、根拠、アクション、エラー状態を画面で確認できる | human | outputs/16-ai-exploratory-tester/src/main.ts を目視確認 |
| DoD-FS-03 | Cloud Run向けDocker/Terraformとreadinessが存在する | machine | infra/terraform/main.tf と /api/ready を確認 |
| DoD-FS-04 | 実行した品質ゲートの出力を記録し、未実行項目を推測で埋めない | machine | make q.check / 個別テスト結果を記録 |

## 8. 明確化ログ

| # | 質問 | 回答 | 影響 |
|---:|---|---|---|
| 1 | 実データの外部連携をMVPに含めるか | 含めない。既存のテキスト証拠/FallbackをSSOTとする | API設計・安全性 |

## 9. コンテキストマップ（PRP）

| カテゴリ | 参照 |
|---|---|
| コードパターン | outputs/16-ai-exploratory-tester/src/main.ts、outputs/16-ai-exploratory-tester/src/server.ts |
| 型・スキーマ | outputs/16-ai-exploratory-tester/src/project.ts, outputs/16-ai-exploratory-tester/src/agent.ts |
| テスト | outputs/16-ai-exploratory-tester/src/server.test.ts |
| 仕様・運用 | outputs/16-ai-exploratory-tester/README.md、outputs/16-ai-exploratory-tester/docs/development.html |
| 外部依存 | Gemini API、Cloud Run、Secret Manager（コード化せず環境変数で接続） |

## 10. インフラ要件

| 項目 | 値 |
|---|---|
| コンピュート | Cloud Run、Node.js 22、PORTは環境変数 |
| 外部サービス | Gemini API（任意のlive mode）、Cloud Logging/Monitoring（本番拡張） |
| シークレット | GEMINI_API_KEY/API_AUTH_TOKENはSecret Manager経由 |
| スケール | MVPはCloud Runの標準スケール、AI/APIコスト面はrate limitで制御 |
