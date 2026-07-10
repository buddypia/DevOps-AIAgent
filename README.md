# Agent-To-Agent Marketplace

必要な能力を持つAIエージェントを市場から探して雇い、A2Aで委任し、**実システムに対して本当に実行させる** DevOps × AI Agent Hackathon 向けプロダクトです。

## Concept

`brief2dev` の「要件を開発・検証・運用へ落とす」考え方を、エージェント市場に変換しました。ユーザーはプロジェクトブリーフを貼り、AIエージェントを能力値・スキル・価格で比較して雇用します。雇ったエージェントはデモ表示ではなく、実ログ・実CI・実脆弱性DB・実HTML・実A2A委任を証拠として Gemini が分析する実行ラン（maker → 引用ゲート → 独立checker）を回し、結果を Firestore に永続化します。

## Hackathon Fit

- **Google Cloud**: Cloud Run デプロイ（`Dockerfile` / `cloudbuild.yaml` / `/api/healthz`）、Cloud Logging、Firestore
- **AI**: Gemini `gemini-3.5-flash`（APIキー or Vertex AI + ADC）
- **A2A**: `/.well-known/agent-card.json` と `/a2a` JSON-RPC 互換エンドポイント。skillId 指定の `message/send` で実行、`tasks/get` で追跡
- **DevOps**: GitHub Actions CI（typecheck / test / build / architecture check）+ 手動デプロイ / 公開検証ワークフロー

## 実行可能な8エージェント

全エージェントが共通パイプライン（実証拠収集 → Gemini maker → 引用ゲート機械検証 → 独立 Gemini checker → 受入判定 → Firestore 永続化）で動きます。ハードストップ: 実行レート制限（10分12ラン）、時間予算55秒、証拠ゼロなら Gemini を呼ばずコスト0で完了。

| エージェント | A2A skillId | 実際に触るシステム |
|---|---|---|
| Cloud Run SRE | `ops.triage.execute` | Cloud Logging API の実ログをトリアージ |
| Observability Oracle | `ops.observe.execute` | 実リクエストログから p50/p95・ステータス分布を計測 |
| Test Forge | `test.contract.execute` | GitHub Actions 実CI + デプロイ済みAPIへのライブ契約プローブ |
| Security Sentinel | `security.scan.execute` | 実依存パッケージを OSV.dev に照会 + 実HTTPヘッダー監査 |
| UX Guildmaster | `ux.audit.execute` | 配信中の実HTMLのアクセシビリティ・メタ監査 |
| A2A Market Broker | `task.delegate.execute` | Agent Card 実取得（SSRFガード）+ 同一オリジンへ実A2A委任 |
| Gemini Strategist | `gemini.review.execute` | 実 healthz + Firestore の実行実績を証拠に戦略生成 |
| Brief Cartographer | `brief.analyze` | ブリーフを span 分割し引用接地を強制した要件分解 |

## Web UI

1. プロジェクトブリーフを入力
2. 語句から必要能力を診断（ローカル能力モデル）
3. エージェント市場を価値スコア順にランキング、「雇う」で編成
4. 雇用前後のプロジェクトスコア改善を可視化
5. 雇ったエージェントの実行コンソール — 実行ランの phase / 証拠 / findings / checker 判定を追跡
6. Gemini 3.5 Flash が戦略サマリを生成（未設定時は `local-fallback` と明示してローカル推論で代替）

公開 Agent Card の取り込み（`/api/agent-card/discover`、SSRFガード付き）でカタログに外部エージェントを追加できます（実行対象は上記8体のみ）。

## Endpoints

- `GET /healthz` / `GET /api/healthz` — 稼働状態（Gemini 構成、実行基盤、runStore）
- `GET /.well-known/agent-card.json` — Agent Card（実行可能8スキル + market.discover + agent-card.discover）
- `POST /a2a` — JSON-RPC。`message.metadata.skillId` に実行スキルを指定すると雇用契約 + 実実行、`tasks/get` でラン状態照会。スキル未指定は市場推薦で応答
- `GET /api/market` — エージェントカタログ
- `POST /api/recommend` — Gemini 戦略サマリ（失敗時 local-fallback）
- `POST /api/agent-card/discover` — 公開 Agent Card の検証付き取得
- `GET|POST /api/hires`, `DELETE /api/hires/:agentId` — 雇用管理
- `GET /api/agent-jobs` — 実行可能エージェントのカタログ
- `POST /api/agent-runs`, `GET /api/agent-runs`, `GET /api/agent-runs/:id` — 実行ランの起動・一覧・照会
- `POST /api/ops-agent/incident-drill` — 模擬インシデントを実ログとして Cloud Logging に注入（SREドリル用、1分1回）

## Configuration

サーバーは dotenv を読みません。環境変数はシェルで export するか、Cloud Run の環境変数 / Secret Manager で渡します。

| 変数 | 用途 | 未設定時 |
|---|---|---|
| `GEMINI_API_KEY` | Gemini API キー認証 | `GOOGLE_CLOUD_PROJECT` があれば Vertex AI + ADC に自動フォールバック |
| `GOOGLE_CLOUD_PROJECT` | Vertex AI / Cloud Logging / Firestore の対象プロジェクト | ログ系2エージェント無効、runStore は memory |
| `GOOGLE_CLOUD_LOCATION` | Vertex ロケーション | `asia-northeast1` |
| `GEMINI_MODEL` | モデル名 | `gemini-3.5-flash` |
| `OPS_TARGET_SERVICE` / `OPS_TARGET_ALLOWLIST` | ログトリアージ対象の Cloud Run サービス | `a2a-agent-marketplace` |
| `OPS_RUN_STORE` | `memory` 指定で Firestore を使わない | project があれば firestore |
| `PUBLIC_BASE_URL` | 自己プローブ・A2A委任の基準URL | リクエストヘッダーから推定 |

どちらの認証も無い場合、8エージェントの実行APIは 503 を返します（UIの市場・推薦はローカル推論で動作）。

## Local Development

```bash
npm install
npm run dev            # http://localhost:8080 (Gemini未設定: 市場UIのみ)
```

実行エージェントまで動かす場合（Vertex AI + ADC、`docs/infra.md` のプロジェクトを使用）:

```bash
gcloud auth application-default login \
  --scopes="https://www.googleapis.com/auth/datastore,https://www.googleapis.com/auth/cloud-platform"
gcloud config set project sixth-oath-502008-u3
gcloud auth application-default set-quota-project sixth-oath-502008-u3

export GOOGLE_CLOUD_PROJECT=sixth-oath-502008-u3
export GOOGLE_CLOUD_LOCATION=asia-northeast1
npm run dev
```

Gemini API キーを使う場合は、`GEMINI_API_KEY` をシェルに export してから `npm run dev` を起動します（値のハードコード・コミットは禁止）。

## Quality Gates

```bash
make q.check               # typecheck + test
make q.build               # 本番ビルド (asset budget 検証含む)
make q.check-architecture  # SSOT ファイル + workflow 検証項目の存在確認
```

## GitHub Actions

- **CI** (`ci.yml`): push / PR で typecheck / test / build / architecture check — <https://github.com/buddypia/DevOps-AIAgent/actions/workflows/ci.yml>
- **Deploy Cloud Run** (`deploy-cloud-run.yml`): 手動実行。Workload Identity Federation で Cloud Build を叩き、デプロイ後に公開URLの実サーフェス（healthz / Agent Card の実行8スキル / A2A契約）を検証
- **Verify Public Proof** (`verify-public-proof.yml`): 手動実行。Secrets 不要で公開URLの実サーフェスだけを検証

```bash
gh workflow run deploy-cloud-run.yml --ref main \
  -f region=asia-northeast1 \
  -f service=a2a-agent-marketplace \
  -f repository=cloud-run-source-deploy \
  -f target_url=https://a2a-agent-marketplace-nxbw7of6cq-an.a.run.app

gh workflow run verify-public-proof.yml --ref main \
  -f target_url=https://a2a-agent-marketplace-nxbw7of6cq-an.a.run.app
```

Deploy 用 secrets（`GCP_PROJECT_ID` / `GCP_WORKLOAD_IDENTITY_PROVIDER` / `GCP_DEPLOY_SERVICE_ACCOUNT`）の初期設定は `scripts/bootstrap_github_actions_deploy.sh` を参照。

## Cloud Run

Deployed URL: <https://a2a-agent-marketplace-nxbw7of6cq-an.a.run.app>

```bash
gcloud builds submit --config cloudbuild.yaml \
  --project sixth-oath-502008-u3 \
  --substitutions _REGION=asia-northeast1,_SERVICE=a2a-agent-marketplace,_REPOSITORY=cloud-run-source-deploy
```

またはローカル Docker（`GEMINI_API_KEY` をシェルに export してから）:

```bash
docker build -t a2a-agent-marketplace .
docker run --rm -p 8080:8080 --env GEMINI_API_KEY a2a-agent-marketplace
```

本番は APIキーを使わず、Cloud Run の実行サービスアカウント（`agent-market-runtime`）+ Vertex AI で認証します（`cloudbuild.yaml` — シークレット不要）。インフラ構成・IAM・移行手順は [docs/infra.md](docs/infra.md) を参照。

## IP Allowlist

固定IPと楽天モバイル帯のallowlistを持ちますが、審査員と GitHub Actions から開けることを優先し既定は `monitor` mode（遮断しない）です。非公開デモ時のみ `IP_ALLOWLIST_MODE=strict` を設定します。

## Submission

- 公開GitHub: <https://github.com/buddypia/DevOps-AIAgent>
- Cloud Run: <https://a2a-agent-marketplace-nxbw7of6cq-an.a.run.app>
- 公開CI: <https://github.com/buddypia/DevOps-AIAgent/actions/workflows/ci.yml>
- ProtoPedia タグ: `findy_hackathon`
