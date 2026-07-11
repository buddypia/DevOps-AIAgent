# Production MVP Evaluation

Date: 2026-05-14

## Evaluation Standard

20個すべてを「MVPとして言い張れる」状態にするため、次の観点で再評価しました。

| Axis | Gate |
| --- | --- |
| Product Usability | 3シナリオ、判断モード、履歴、コピー/エクスポートがある |
| AI Contract | 入力検証、構造化AI出力、fallback、契約テストがある |
| Operational Readiness | health/ready/version、request ID、構造化ログ、統一エラーがある |
| Security Baseline | セキュリティヘッダ、CSP、API no-store、CORS設定がある |
| Deployment Readiness | multi-stage Docker、non-root runtime、Cloud Run PORT対応がある |
| Verification | `npm run verify` が通る |

## Per-Project Evaluation

| Rank | Project | Product | AI Contract | Ops | Security | Deploy | Verdict |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | ShipGuard AI | Go | Go | Go | Go | Go | Production-level MVP |
| 2 | Two Minute Triage | Go | Go | Go | Go | Go | Production-level MVP |
| 3 | Canary Diff Judge | Go | Go | Go | Go | Go | Production-level MVP |
| 4 | Blast Radius Agent | Go | Go | Go | Go | Go | Production-level MVP |
| 5 | Privacy Impact Diff Agent | Go | Go | Go | Go | Go | Production-level MVP |
| 6 | Deploy Rehearsal Agent | Go | Go | Go | Go | Go | Production-level MVP |
| 7 | Post Deploy Judge | Go | Go | Go | Go | Go | Production-level MVP |
| 8 | Recovery Confidence Meter | Go | Go | Go | Go | Go | Production-level MVP |
| 9 | Eval Dataset Gardener | Go | Go | Go | Go | Go | Production-level MVP |
| 10 | Cloud Run Traffic Mixer | Go | Go | Go | Go | Go | Production-level MVP |
| 11 | Runbook Decay Detector | Go | Go | Go | Go | Go | Production-level MVP |
| 12 | Data Pipeline Sheriff | Go | Go | Go | Go | Go | Production-level MVP |
| 13 | Rollback Concierge | Go | Go | Go | Go | Go | Production-level MVP |
| 14 | Deployment Black Box Recorder | Go | Go | Go | Go | Go | Production-level MVP |
| 15 | Dark Launch Scout | Go | Go | Go | Go | Go | Production-level MVP |
| 16 | AI Exploratory Tester | Go | Go | Go | Go | Go | Production-level MVP |
| 17 | Decision Fatigue Reducer | Go | Go | Go | Go | Go | Production-level MVP |
| 18 | Model Rollback Agent | Go | Go | Go | Go | Go | Production-level MVP |
| 19 | Chaos Drill Agent | Go | Go | Go | Go | Go | Production-level MVP |
| 20 | Incident Commander Karaoke | Go | Go | Go | Go | Go | Production-level MVP |

## Verdict

全20プロジェクトは、外部APIの実接続を追加すれば本番運用へ進められるProduction-level MVPです。現時点ではハッカソンMVPとして、UI、API、AI契約、検証、Cloud Runデプロイ、運用監視の入口を備えています。
