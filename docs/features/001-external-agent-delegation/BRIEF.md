# 機能概要: 001-external-agent-delegation

> **状態**: 仕様作成中 | **優先度**: MVP | **生成日**: 2026-07-12
> **コンテキスト**: `docs/features/001-external-agent-delegation/CONTEXT.json`

## 0. 原文リクエスト（ユーザー原文）

```
$feature-architect 実装して。
```

### 会話コンテキスト

Agent Cardを外部連携に使う意味を明確にし、Agent Cardを読み取るだけで終わらず、実際に外部エージェントへ仕事を委任して結果を受け取れるようにする。

## 1. 問題と理由

### 問題

現在のAgent Guildは外部Agent Cardを取得して能力評価できるが、外部オリジンへタスクを送信できない。そのため、Agent Cardが単なるカタログ情報に留まり、実際のDevOps作業の短縮につながらない。

### 今なぜ

外部エージェント連携を実行可能にしない限り、A2Aマーケットプレイスの中心価値である「能力を発見し、選び、任せ、結果を検証する」体験が成立しない。一方、任意URLへの無制限POSTはSSRF・認証情報漏えい・意図しない副作用のリスクがあるため、許可リストと安全境界を同時に設計する必要がある。

### 食欲

| 項目 | 値 |
| --- | --- |
| **タイムボックス** | 1-2日 |
| **複雑度** | 高 |
| **ユーザー価値** | 外部の専門AIへ同じ作業を再入力せず、安全な委任と結果確認を行える |
| **ビジネスメトリクス** | Agent Card取込から委任完了までの成功率、委任結果の確認率 |

## 2. ユーザーストーリー

| ID | When（状況） | I want to（行動） | So I can（価値） |
| :---: | --- | --- | --- |
| US-01 | 必要な能力を持つ外部AIを見つけたとき | Agent Cardを取り込み、委任可能なスキルを確認したい | 対応できる仕事を誤認せずに選べる |
| US-02 | 外部AIを選んだとき | 目的とskillIdをA2Aで送信したい | 実際の専門作業を外部AIに任せられる |
| US-03 | 外部AIがタスクを受け付けたとき | task ID、状態、応答証拠を確認したい | 委任しただけで終わらず、結果を追跡できる |

## 3. ユーザーの旅

| 段階 | ユーザー行動 | システム反応 | 備考 |
| :--: | --- | --- | --- |
| 1 | Agent Card URLを入力 | 公開ホスト、JSON、スキル、A2A endpointを検証 | private IP・認証情報付きURLは拒否 |
| 2 | skillと依頼文を選択して委任 | 許可された外部originへJSON-RPC `message/send`を送信 | 認証情報は転送しない |
| 3 | 結果を確認 | task ID・状態・応答・検証用receiptを表示 | `submitted/working`は未完了として表示 |

## 4. 受容基準（BDD）

| AC | Given | When | Then | 観測点 |
| :---: | --- | --- | --- | --- |
| AC-01 | 公開Agent Cardがあり、A2A originがallowlist内 | 委任を実行する | 外部endpointにJSON-RPC `message/send`が1回送られ、task IDと状態が返る | APIレスポンスとテストの送信payload |
| AC-02 | Agent Cardのhostがprivate IP、またはoriginがallowlist外 | 委任を実行する | 外部endpointへ接続せず、拒否理由を返す | fetch未実行とHTTP 403/422 |
| AC-03 | skillIdがCardに存在しない | 委任を実行する | 不正リクエストとして拒否し、外部POSTしない | HTTP 422 |
| AC-04 | 外部応答がJSON-RPC 2.0でない、またはタイムアウトする | 委任を実行する | `external_agent_error`として安全なエラーを返し、秘密情報を含めない | HTTP 502/504 |
| AC-05 | 依頼文が空、または上限超過 | 委任を実行する | Zod入力検証で拒否する | HTTP 400 |
| AC-06 | 外部応答に破壊操作・資格情報要求が含まれる | 応答を受け取る | 自動実行済みとは扱わず、要人間確認として表示する | safety status / receipt |

## 5. スコープ境界

### スコープ内

- Agent CardからA2A endpointとskillを解決する
- 公開ホスト検証、origin allowlist、redirect制限、タイムアウト、payload上限
- 外部A2AへのJSON-RPC `message/send`実行
- task ID、状態、応答サマリ、証拠receiptの返却
- APIと既存の外部Agent Card UIからの委任導線
- 単体テストとAPI契約テスト

### スコープ外

- OAuth、mTLS、署名検証などの認証基盤の新規導入
- 外部エージェントへのGitHub/GCP認証情報の転送
- 外部サービスのデプロイ、削除、ロールバックなどの破壊的操作
- 非同期taskの長期ポーリング・Webhook受信
- 外部Agent Cardの永続カタログDB化

### ラビットホール

- **認証の一般化**: 今回は公開・allowlist済みendpointへの無認証委任に限定し、認証が必要なCardはwatch扱いにする。
- **A2A仕様差異**: 今回は`message/send`の最小JSON-RPC契約に限定し、異なるプロトコルは未対応として明示する。
- **副作用の安全性**: 外部応答を「完了」と表示しても、Agent Guild自身が破壊的操作を実行したとは扱わない。

### §5.5 エンゲージメントデザイン

N/A - バックエンド/API連携を中心とし、既存のAgent Card取込UIに最小限の委任状態を追加する。

## 6. メッセージと運用ルール

- 成功: `外部エージェントがタスクを受け付けました（task ID: ...）`
- allowlist拒否: `このAgent Cardは許可された接続先ではありません`
- private host拒否: `公開ネットワーク上のAgent Cardだけ利用できます`
- 未完了: `外部タスクは受付済みです。完了結果ではありません`
- 外部エラー: `外部エージェントから安全に結果を取得できませんでした`

## 7. 完了条件（Definition of Done）

- [ ] 許可リストで外部originを制限できる
- [ ] Agent CardのskillとA2A endpointを検証して外部`message/send`を実行できる
- [ ] private IP、allowlist外、未知skill、巨大payload、タイムアウトを拒否できる
- [ ] JSON-RPC応答からtask IDと状態を抽出し、receiptを返せる
- [ ] 外部連携の送信payloadにAuthorizationや秘密情報を自動付与しない
- [ ] 主要な成功・拒否・タイムアウト経路のテストがある
- [ ] `npm run typecheck`、`npm test`、`npm run build`、`make q.check-architecture`の実行結果を記録する

## 8. Clarification Log

| 日付 | 質問 | 回答/仮定 | 影響 |
| --- | --- | --- | --- |
| 2026-07-12 | 外部認証を今回導入するか | 導入しない。公開・allowlist済みendpointに限定 | OAuth/mTLSは別機能 |
| 2026-07-12 | 非同期taskを永続追跡するか | 今回は受付receiptまで。長期pollingは範囲外 | DBスキーマ変更なし |

## 9. Context Map（PRP）

### Codebase Patterns

- `server/agentCardDiscovery.ts` — SSRFガード付きAgent Card取得とリダイレクト制限
- `src/agentCardDiscovery.ts` — URL正規化とprivate host判定
- `src/customAgent.ts` — Cardのskill/capability変換
- `src/agentCardAssessment.ts` — Cardの信頼評価とtrial task生成
- `server/index.ts` — Express route、Agent Card公開、A2A `message/send`
- `server/agentJobs.ts` — 既存の同一オリジン委任ブローカー
- `tests/agentCardDiscovery.test.ts` / `tests/customAgent.test.ts` — discovery/importテスト

### Convention References

- `AGENTS.md` — Zod入力検証、外部操作の安全境界、検証前完了禁止
- `project-config.json` — TypeScript/Express/Vitest、`npm run typecheck`、`npm test`、`npm run build`
- `README.md` — 既存の8エージェント、A2A endpoint、外部Card取込の実装範囲

### Unverified Dependencies

- A2A外部endpointの実装差異は未検証。最小JSON-RPC `message/send`のみを契約対象にする。
