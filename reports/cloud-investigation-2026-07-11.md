# Cloud実測調査レポート（2026-07-11）

対象: `sixth-oath-502008-u3` / `asia-northeast1` / Cloud Run `a2a-agent-marketplace`  
調査時点: 2026-07-11 13:04 UTC（22:04 JST前後）

## 6項目の回答

### 1. どのくらい費用がかかったか

Firestoreの実行記録から計算できるGemini利用見積りは以下です。これは実請求額ではなく、アプリ設定の入力 `$0.30/1M tokens`・出力 `$2.50/1M tokens` による見積りです。

- agent run 11件: **$0.017665**（26,988 tokens）
- mission orchestrator 3件: **$0.003115**（8,301 tokens）
- 記録上の合計: **$0.020780**（35,289 tokens）
- 成功run 9件: $0.016331 / 失敗run 2件: $0.001334

GCPの実請求額（Cloud Run・Firestore・Cloud Logging・Vertex AI等）は確定できません。`billingEnabled=true` と請求先の紐付けは確認できましたが、Cloud Billing APIに利用額レポート取得機能はなく、BigQuery請求エクスポートdatasetも確認できませんでした。したがって **$0.020780を実請求額とは断定しません**。

### 2. AIエージェントは本当に実行されたか

**はい。** Firestoreの `agent_runs` に `completed` 9件があり、実証拠取得、Gemini maker、引用ゲート、独立checker、decisionのphaseとtoken usageが保存されています。現行 `/api/healthz` も次を返します。

```text
geminiConfigured=true, geminiMode=vertex
opsAgent.enabled=true, runStore=firestore, executableAgents=8
missionControl.activeMission=null
```

8体すべてに少なくとも1件の完了runがあります。SREだけは `completed 2 / failed 2`、他7体は各 `completed 1` です。

### 3. ログはどこで確認できるか

- [Cloud Logging Logs Explorer](https://console.cloud.google.com/logs/query;query=resource.type%3D%22cloud_run_revision%22%0Aresource.labels.service_name%3D%22a2a-agent-marketplace%22?project=sixth-oath-502008-u3)
- [最新Cloud Run revisionのログ](https://console.cloud.google.com/logs/viewer?project=sixth-oath-502008-u3&resource=cloud_run_revision/service_name/a2a-agent-marketplace/revision_name/a2a-agent-marketplace-00004-phg)
- 実行履歴: `GET https://a2a-agent-marketplace-nxbw7of6cq-an.a.run.app/api/agent-runs?limit=50`
- ミッション履歴: `GET https://a2a-agent-marketplace-nxbw7of6cq-an.a.run.app/api/missions?limit=30`

再取得コマンド:

```bash
gcloud logging read \
  'resource.type="cloud_run_revision" AND resource.labels.service_name="a2a-agent-marketplace"' \
  --project=sixth-oath-502008-u3 --limit=5000 --order=asc --format=json
```

直近180分の実測は、ログ1,413件、HTTP request 1,398件、HTTP 200が28件、304が1,370件、ERROR/WARNINGが0件。latencyはp50 25.8ms、p95 53.3ms、最大1.327sでした。

### 4. 「ミッション実行中」はまだ実行中か

**実行中ではありません。Firestoreの状態だけが `running` のまま残っています。**

- 現在の `/api/healthz`: `activeMission=null`
- Firestoreミッション: `running=2`, `failed=1`
- `c4cb4849...`: 04:17:20 JST開始、04:19:15 JSTの `security-sentinel` 失敗で停止、`finishedAt`なし
- `9b0fe230...`: 04:11:56 JST開始、SRE失敗後に進行停止、`finishedAt`なし
- 最新revision `00004-phg` は 16:57 JSTにReady化。ミッション開始後にCloud Runプロセスが入れ替わっています。

`void executeMission(...)` はCloud Runインスタンス内の非同期処理なので、revision切替で実行が失われ、Firestoreの途中状態だけが残ったという時系列と一致します。現在workerが動いている証拠はありません。

### 5. バグでずっと空実行・無限実行していないか

**Geminiを無限に呼び続けている証拠はありません。** 直近180分に新規AI run作成やGeminiエラーはなく、最新runは 2026-07-10 19:18:01 UTCで停止しています。

ただし、**画面のpollingが止まらないバグ**はあります。直近180分で `/api/missions/c4cb4849-...` が1,340件。`src/MissionControl.tsx` は `running` のミッションを2.5秒間隔で取得し、Firestore状態が変わらないため永続的に再取得します。これはAI無限実行ではありませんが、不要なCloud Run/Firestoreアクセスと「実行中」表示を生みます。

ミッションの実行失敗は以下です。

- `192d2165...`: 証拠20件取得後 `Unterminated string in JSON at position 147`
- `2c450595...`: 証拠20件取得後 `Unexpected token '.', "..." is not valid JSON`
- `security-sentinel`: `fetch failed`（runIdなし、run記録前に失敗）

つまりSREは空振りではなく実ログ20件を取得してGemini処理に入り、JSON解析で失敗しました。後続ステップが未実行のまま孤児化しています。

### 6. 実際に動いていないデモAIエージェントはあるか

**8体すべてが未実行のデモ、という状態ではありません。** 8体すべてに完了run・実証拠・token usage・checker結果があります。

ただし、最新ミッションでは次の3体が未実行です。

- `security-sentinel`: 起動前の `fetch failed`
- `ux-guildmaster`: `planned` のまま
- `observability-oracle`: `planned` のまま

したがって「8体が実行可能」は正しい一方、「このミッションで8体すべて実行済み」は誤りです。

## 稼働リスクと優先対応

| 優先度 | 実測リスク | 対応 |
|---|---|---|
| P0 | Firestoreの `running` と実workerの状態が乖離。UI pollingも継続 | heartbeat/lease、stale状態の自動failed化、UIで `active` と照合してpolling停止 |
| P0 | Cloud Run request内のfire-and-forget実行がrevision切替で消失 | Cloud Tasks / Workflows / Cloud Run Jobs等の再開可能な実行基盤へ移行 |
| P1 | Gemini JSON解析失敗が2回発生 | 応答切断・コードフェンス・不正JSONを検証/記録し、一定回数で必ずmissionを確定 |
| P1 | `allUsers -> roles/run.invoker`、IP allowlist `enforced=false` | 公開デモ要件を確認し、ミッション起動/A2A/incident drillを認証またはallowlistで保護 |
| P2 | 初期SPA HTMLにh1が0個 | 初期HTMLまたは主画面にh1を追加し、キーボード/スクリーンリーダー監査を追加 |
| P2 | 実請求額を日次で照合できない | Cloud Billing BigQuery exportとbudget/alertを有効化 |

補足: `npm audit --omit=dev` は info/low/moderate/high/critical がすべて0件。過去72時間のWARNING/ERRORは `incident-drill` が注入した合成障害2件のみで、直近180分のCloud LoggingにはERROR/WARNINGはありません。
