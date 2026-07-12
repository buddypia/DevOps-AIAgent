# 機能概要: 022-merge-steward

> **状態**: Draft | **優先度**: High | **作成日**: 2026-07-12
> **コンテキスト**: `docs/features/022-merge-steward/CONTEXT.json`

---

## 0. 原本リクエスト（ユーザー原文）

```text
別件で問題に対してGithub Issueを作成し、レビューして評価し、マージまで自動的にやるエージェントもあると良いと思うけどどう？

進めて。そしておわったらコミットPRマージまで
```

---

## 1. 問題と理由（Shape Up Pitch）

### 問題

運用中に見つかった問題とGitHub上のIssue・Pull Request・CI・レビュー・マージ判断が分断されている。現在のAgent Guildは問題の分析、GitHub Actionsの参照、独立checkerによる評価までは行えるが、問題をIssueに固定し、対象PRを安全基準で評価してマージまで閉じる実行主体がない。

### 今なぜ

ハッカソンの「企画→開発→デプロイ→運用」フルサイクルを、説明だけでなく操作可能な体験として示すには、運用シグナルをGitHubの変更ライフサイクルへ戻す最後のループが必要である。一方、無条件マージは本番事故につながるため、AI判断の価値とGitHub側の保護ルールを両立する安全ゲートが不可欠である。

### 食欲

| 項目 | 値 |
|---|---|
| タイムボックス | 1日以内のMVP |
| 複雑度 | 高（GitHub書き込み、権限、安全ゲート） |
| ユーザー価値 | 問題の記録から安全なマージ判断までの手作業と待ち時間を短縮する |
| ビジネスメトリクス | Issue化率、評価完了率、安全ゲート通過率、誤マージ0件 |

---

## 2. ユーザーストーリー（JTBD）

| ID | When | I want to | So I can |
|---|---|---|---|
| US-01 | 運用上の問題を発見したとき | 問題・証拠・受入条件をGitHub Issueへ記録したい | 修正責任と完了条件を追跡できる |
| US-02 | 問題に対応するPull Requestがあるとき | 変更ファイル、CI、レビュー、マージ可能性を独立評価したい | 根拠付きでマージ可否を判断できる |
| US-03 | 低リスクPRが全ゲートを満たしたとき | GitHubの保護ルールを迂回せずマージしたい | 定型修正を安全かつ短時間で本流へ届けられる |

---

## 3. ユーザー旅程

| 段階 | ユーザー行動 | システム反応 | 備考 |
|---:|---|---|---|
| 1 | 問題タイトル、説明、証拠を入力する | 入力を検証し、重複候補とIssue本文プレビューを返す | 初期状態は書き込み前プレビュー |
| 2 | Issue作成を明示確認する | GitHub APIでIssueを作成し、URLと監査receiptを返す | `Issues: write` が必要 |
| 3 | 対応PRのURLまたは番号を入力する | files/checks/reviews/mergeability/head SHAを取得し、独立評価する | 読み取り失敗時はマージ禁止 |
| 4 | 評価結果を確認する | `READY / HUMAN REVIEW / BLOCKED`、根拠、阻害条件を表示する | 高リスクパスは必ず人間確認 |
| 5 | READY時にマージを明示確認する | head SHA一致とゲートを再検証し、squash mergeを実行する | branch protectionを迂回しない |

---

## 4. 受入基準（BDD）

| AC | Given | When | Then | 観測点 |
|---|---|---|---|---|
| AC-01 | 有効な問題入力とGitHub書き込み設定がある | Issue作成を明示確認する | 証拠・受入条件・agent receiptを含むIssueが1件だけ作成される | GitHub APIモック契約テスト |
| AC-02 | PR番号が有効である | 評価を実行する | 変更ファイル、checks、reviews、mergeability、head SHAに基づく構造化判定が返る | evaluator単体テスト |
| AC-03 | required checks未完了、競合、未解決レビュー、または高リスクパスがある | マージを要求する | GitHub merge APIを呼ばず `BLOCKED` または `HUMAN REVIEW` を返す | fetch呼出し検証 |
| AC-04 | 低リスクPRが全ゲート通過し、評価時と同じhead SHAである | マージを明示確認する | squash mergeを1回実行し、merge commit SHAとreceiptを返す | API統合テスト |
| AC-05 | GitHub tokenが未設定またはGitHub APIが失敗する | 書き込み操作を試みる | シークレットを露出せず、復旧行動を含むエラーを表示する | エラー/ログredactionテスト |
| AC-06 | エージェント一覧を開く | Merge Stewardを選択する | 役割、GitHub能力、安全境界、専用ポートレートを確認できる | market/UIテストと目視確認 |

---

## 5. スコープ境界

### スコープ内

- Agent Guild市場への `merge-steward` 追加と専用ポートレート
- 問題入力からGitHub Issue本文を生成し、明示確認後にIssueを作成
- 既存PRのファイル、CI/checks、reviews、mergeability、head SHAの取得
- deterministic gateとGemini maker/checkerによる根拠付き評価
- 低リスクかつ全ゲート通過時のみ、再検証後にsquash merge
- UIでのプレビュー、実行確認、成功、空、ローディング、エラー状態
- 監査receipt、入力上限、rate limit、ログredaction

### スコープ外

- エージェント自身によるコード生成、ブランチ作成、コミット、Pull Request作成
- branch protection、required checks、CODEOWNERS、レビュー要件の迂回
- workflow、認証、権限、Secret、Terraform、migration等の高リスク変更の自動マージ
- 複数リポジトリ横断、fork PR、merge queueの自動投入
- GitHub Appのinstallationフロー構築（MVPは環境変数のfine-grained token）

### ラビットホール

- 「Issueから自動修正」まで含めるとサンドボックス実行、任意コード生成、資格情報委譲が必要になるため、MVPは既存PRの安全評価とマージに限定する。
- AI評価だけでマージすると幻覚や自己承認が事故につながるため、deterministic gateを最終SSOTとし、AIは説明とリスク分類を担当する。
- GitHubの保護設定をアプリ側で再実装せず、GitHubが返すmergeability/checks/reviewsとhead SHAの楽観ロックを利用する。

### §5.5 エンゲージメント設計

| ステージ | 設計 |
|---|---|
| トリガー | 運用エージェントが問題を検出、またはユーザーが問題を入力 |
| アクション | 問題プレビュー→Issue作成、PR番号→評価、READY→マージ確認 |
| リワード | 分散した証拠が1つの判定receiptになり、安全にループが閉じる |
| 投資 | Issue、PRリンク、評価receipt、マージ履歴がGitHubへ残る |

**Aha moment**: PRの変更、CI、レビュー、リスクが1つの判定へまとまり、条件を満たした変更だけがその場でマージされる瞬間。

### §5.6 競合ベンチマーク

GitHub Auto-merge/branch protectionを実行基盤として再利用し、Agent Guildは運用問題のIssue化、証拠収集、AI説明、リスク分類、A2A委任を一続きにする点で差別化する。

### §5.7 収益化タッチポイント

N/A - ハッカソン提出用MVPであり課金境界は扱わない。

---

## 6. 制約条件

### ハード制約

- [ ] GitHub tokenは `GITHUB_TOKEN` 等の環境変数/Secret Managerから取得し、レスポンス・ログ・クライアントへ出さない。
- [ ] Issue作成とマージは、プレビュー/評価とは別の明示確認操作にする。
- [ ] deterministic gateが拒否した場合、AI判定に関係なくmerge APIを呼ばない。
- [ ] マージ直前にPR情報とhead SHAを再取得し、評価receiptと不一致なら停止する。
- [ ] branch protectionとrequired checksを迂回しない。APIの403/405/409/422を安全停止として扱う。
- [ ] `.github/workflows/**`, `infra/**`, 認証・権限・Secret・migrationに該当するパスは自動マージ対象外にする。
- [ ] Zod入力検証、レート制限、redaction、タイムアウトを適用する。
- [ ] GitHub未設定時も読みやすい設定不足状態を返し、既存デモを壊さない。

### ソフト制約

- 既存のVite + React + Express、plain CSS、OpsAgentConsoleの状態表現を再利用する。
- GitHub APIは既存`fetch`パターンに揃え、新規SDK依存を追加しない。
- UIコピーは日本語、機械判定値は安定した英語enumを使う。

---

## 7. 完了条件（Definition of Done）

### 7.1 機能固有完了条件

| ID | 完了条件 | 検証タイプ | 観測方法 |
|---|---|---|---|
| DoD-FS-01 | Issue作成が明示確認、重複防止、redaction付きで動作する | machine | GitHub API契約テスト |
| DoD-FS-02 | PR評価がchecks/reviews/files/mergeability/head SHAを網羅する | machine | gate分岐単体テスト |
| DoD-FS-03 | BLOCKED/HUMAN REVIEWではmerge APIを呼ばない | machine | fetch spyによるnegative test |
| DoD-FS-04 | READYかつ同一head SHAの場合だけsquash mergeする | machine | 成功/TOCTOUテスト |
| DoD-FS-05 | 通常、ローディング、空、エラー、部分成功をUIで識別できる | machine + human | component/API状態テストと目視確認 |
| DoD-FS-06 | Merge Stewardの市場カードと画像が表示される | machine + human | marketテスト、ビルド成果物、目視確認 |
| DoD-FS-07 | `make q.check`、`make q.check-architecture`、`npm run build`が成功する | machine | 各コマンド exit code 0 |

### 7.2 Base DoD

NEW_FEATURE: 全FR DoD通過 + `make q.check` + SPEC §0準拠 + アーキテクチャ準拠 + テスト追加 + ビルド成功 + UI Flow + CONTEXT更新。

---

## 8. 明確化ログ

| # | 質問 | 回答 | 影響を受ける節 | 日付 |
|---:|---|---|---|---|
| - | （feature-spec-generatorで記録） | - | - | - |

---

## 9. コンテキストマップ（PRP）

| カテゴリ | パス/参照 |
|---|---|
| 関連SPEC | `docs/features/021-agent-guild-platform/SPEC-021-agent-guild-platform.md`, `docs/features/004-blast-radius-agent/SPEC-004-blast-radius-agent.md` |
| コードパターン | `server/agentJobs.ts`, `server/index.ts`, `server/opsAgent.ts`, `src/OpsAgentConsole.tsx`, `src/market.ts` |
| 型・スキーマ | `src/types.ts`, `server/opsAgent.ts` |
| テスト | `tests/agentJobs.test.ts`, `tests/opsAgent.test.ts`, `tests/market.test.ts` |
| 外部契約 | GitHub REST Issues API、Pull Requests API、protected branches / required checks公式仕様（2026-07-12確認） |
| 規約 | `AGENTS.md`, `CLAUDE.md`, `project-config.json`, `.claude/rules/MANIFEST.json` |

---

## 10. インフラ要件

| 項目 | 値 | 備考 |
|---|---|---|
| コンピュート | 既存Cloud Run | 新規サービスなし |
| シークレット | fine-grained GitHub token | Issues: write、Pull requests/Contentsの必要最小権限 |
| 外部サービス | GitHub REST API | タイムアウト、rate limit、安全停止 |
| 永続化 | 既存run store + GitHub | 新規DBなし |
| コスト | 既存Gemini maker/checker範囲 | deterministic gateはモデル非依存 |
