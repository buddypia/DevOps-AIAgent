# SRE / DevOps ランキングとリリース守護者

更新日: 2026-07-12

## 判断

Cloud Runを対象にしたSRE/DevOps案件では、単なる能力値や価格だけで候補を並べるのは不十分である。変更失敗を早く止め、復旧の判断に必要な実証拠を集められる能力を独立して評価する。

`src/agentEngine.ts` は通常案件では従来の要求適合度を88%重視し、SRE/DevOps用語を検出した案件では要求適合度55%・DevOps効率45%へ切り替える。DevOps効率は次の加重合成で、価格を小さく減点する。

1. リリース安全性: Cloud Run 40%、テスト 30%、可観測性 30%
2. 障害復旧性: 自律判断 35%、可観測性 40%、セキュリティ 25%
3. 証拠取得性: テスト 35%、MCP 25%、A2A 40%

`release-guardian`（リリース守護者）は上記3項目を満たす実行可能エージェントとして追加した。Geminiのmaker/checkerループは、実際のhealthz、GitHub Actionsの直近CI、Cloud Loggingのrevision別リクエストと5xxを根拠に、継続・停止・ロールバックの推奨を作る。引用ゲートと独立checkerを通らない推奨は採用しない。

## 安全境界

リリース守護者はCloud Runのトラフィックを変更しない。Cloud Runではrevision間のトラフィック分割と過去revisionへのロールバックが可能だが、エージェントは「実行済み」と主張せず、人が証拠を確認してから操作する。これにより、AIエージェントの判断・実行価値と本番変更の説明責任を両立する。

Cloud Loggingから得るrevision別リクエスト件数は観測窓の標本であり、Cloud Runに設定された正確なトラフィック配分ではない。件数がない、CIが取得できない、またはhealthzが失敗した場合は、継続を自動承認せず証拠不足として人へエスカレーションする。

## 調査根拠

- [Cloud Run: rollouts, rollbacks, and traffic migration](https://docs.cloud.google.com/run/docs/rollouts-rollbacks-traffic-migration): revisionへの段階的なトラフィック移行とロールバックを提供する。
- [Cloud Deploy: canary deployment](https://docs.cloud.google.com/deploy/docs/deployment-strategies/canary): Cloud Run向けカナリアは段階的にトラフィックを広げ、Observabilityメトリクスで分析できる。
- [Cloud Run: monitor health and performance](https://docs.cloud.google.com/run/docs/monitoring): リクエスト数・レイテンシなどの組み込みメトリクスとアラートが利用できる。
- [Google Cloud Observability: SLO monitoring concepts](https://docs.cloud.google.com/stackdriver/docs/solutions/slo-monitoring): SLI、SLO、エラーバジェットをリスク軽減に使う。
- [DORA: The ROI of DevOps Transformation](https://dora.dev/research/2020/the-roi-of-devops-transformation-google-cloud-dora.pdf): 変更失敗率とサービス復旧時間をDevOps成果の評価軸に置く。
