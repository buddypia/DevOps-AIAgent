# DevOps x AI Agent Hackathon Outputs

This folder contains 20 independent projects generated from the recalculated top 20 ideas in `docs/01_hackathon/idea_recommendations_500_scored.md`.

| Rank | No | Project | Package |
| ---: | ---: | --- | --- |
| 1 | 001 | [ShipGuard AI](./01-shipguard-ai/) | shipguard-ai |
| 2 | 026 | [Two Minute Triage](./02-two-minute-triage/) | two-minute-triage |
| 3 | 002 | [Canary Diff Judge](./03-canary-diff-judge/) | canary-diff-judge |
| 4 | 004 | [Blast Radius Agent](./04-blast-radius-agent/) | blast-radius-agent |
| 5 | 226 | [Privacy Impact Diff Agent](./05-privacy-impact-diff-agent/) | privacy-impact-diff-agent |
| 6 | 003 | [Deploy Rehearsal Agent](./06-deploy-rehearsal-agent/) | deploy-rehearsal-agent |
| 7 | 024 | [Post Deploy Judge](./07-post-deploy-judge/) | post-deploy-judge |
| 8 | 027 | [Recovery Confidence Meter](./08-recovery-confidence-meter/) | recovery-confidence-meter |
| 9 | 051 | [Eval Dataset Gardener](./09-eval-dataset-gardener/) | eval-dataset-gardener |
| 10 | 123 | [Cloud Run Traffic Mixer](./10-cloud-run-traffic-mixer/) | cloud-run-traffic-mixer |
| 11 | 126 | [Runbook Decay Detector](./11-runbook-decay-detector/) | runbook-decay-detector |
| 12 | 201 | [Data Pipeline Sheriff](./12-data-pipeline-sheriff/) | data-pipeline-sheriff |
| 13 | 005 | [Rollback Concierge](./13-rollback-concierge/) | rollback-concierge |
| 14 | 150 | [Deployment Black Box Recorder](./14-deployment-black-box-recorder/) | deployment-black-box-recorder |
| 15 | 011 | [Dark Launch Scout](./15-dark-launch-scout/) | dark-launch-scout |
| 16 | 076 | [AI Exploratory Tester](./16-ai-exploratory-tester/) | ai-exploratory-tester |
| 17 | 179 | [Decision Fatigue Reducer](./17-decision-fatigue-reducer/) | decision-fatigue-reducer |
| 18 | 209 | [Model Rollback Agent](./18-model-rollback-agent/) | model-rollback-agent |
| 19 | 401 | [Chaos Drill Agent](./19-chaos-drill-agent/) | chaos-drill-agent |
| 20 | 424 | [Incident Commander Karaoke](./20-incident-commander-karaoke/) | incident-commander-karaoke |

Each project has its own `package.json`, `.env.example`, `Dockerfile`, source tree, and environment document.

## Quick Start

```bash
cd outputs/01-shipguard-ai
npm install
cp .env.example .env
npm run dev
```

## Shared Environment

See `ENVIRONMENT_SETUP.md` for common Gemini and Cloud Run setup. See each project's `docs/environment.md` for project-specific details.

## HTMLマニュアル / 開発ドキュメント

全20プロジェクトに、GitHub公開前に読めるHTML図解ドキュメントを追加しました。各READMEからも辿れます。

- [Web調査に基づくMVP要件](./WEB_RESEARCH_MVP_REQUIREMENTS.md)
- 各プロジェクト: `docs/manual.html` と `docs/development.html`


## Production-Level MVP Gate

All 20 projects are hardened with health/readiness/version endpoints, security headers, request IDs, structured errors, contract tests, and multi-stage non-root Dockerfiles. See `PRODUCTION_MVP_EVALUATION.md` and `PRODUCTION_MVP_AUDIT.md`.

## Terraform / Cloud Run Deployment

All 20 projects include project-local Terraform under `infra/terraform/`. The modules deploy each app to Cloud Run, build the Docker image with Cloud Build, store images in Artifact Registry, and optionally attach Gemini/API secrets from Secret Manager. Each project also includes `docs/terraform.md`, `docs/terraform.html`, and `docs/architecture.svg` for human-readable deployment and ProtoPedia system architecture documentation.
