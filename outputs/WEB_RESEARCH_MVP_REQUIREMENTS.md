# Web Research MVP Requirements

Date: 2026-05-22

## Researched Baseline

- [Google Cloud Run health checks](https://docs.cloud.google.com/run/docs/configuring/healthchecks): Cloud Run startup probes succeed on HTTP 2xx/3xx health endpoints, so every MVP exposes health/readiness endpoints.
- [Google Cloud Run security overview](https://docs.cloud.google.com/run/docs/securing/security): Cloud Run production services should use dedicated identity, secrets, IAM, and runtime security controls.
- [GitHub README guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes): A README should explain what the project does, why it is useful, how to start, where to get help, and who maintains it.
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/): Use security requirements as a verification yardstick for web applications and APIs.
- [Hypothesis-driven MVP research](https://arxiv.org/abs/1808.05630): Startup MVPs should connect experiments to explicit business hypotheses and learning decisions.
- [Gemini 3.1 Flash-Lite announcement](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-1-flash-lite/): Gemini 3.1 Flash-Lite is positioned for high-volume, low-latency AI workloads.

## Applied Gate

| Requirement | Local evidence |
| --- | --- |
| Startup hypothesis validation | Every project now has an HTML manual and developer guide section for problem hypothesis, MVP experiment, success metrics, and learn/pivot decision. |
| GitHub-ready README | Every project README explains what it does, why it matters, setup, build, deploy, environment, demo flow, production guarantees, and links to HTML docs. |
| Production web/API baseline | Every server includes health/readiness/version endpoints, request IDs, structured logs, security headers, no-store API cache, JSON error format, Zod validation, and deterministic fallback. |
| Cloud Run deployability | Every project includes Dockerfile, .dockerignore, PORT-aware Express server, and Cloud Run deploy command. |
| Security baseline | API input is bounded and validated; generated docs call out Secret Manager, CORS, service identity, non-root runtime, and no committed secrets. |
| Developer verification | Every project exposes npm run typecheck, test, build, and verify. |
| HTML diagram documentation | Every project includes docs/manual.html and docs/development.html with SVG diagrams and Japanese explanatory text. |

## Project Documentation Matrix

| Rank | Project | README | Manual | Developer Guide | Environment |
| ---: | --- | --- | --- | --- | --- |
| 1 | ShipGuard AI | [README](./01-shipguard-ai/README.md) | [Manual](./01-shipguard-ai/docs/manual.html) | [Developer Guide](./01-shipguard-ai/docs/development.html) | [Environment](./01-shipguard-ai/docs/environment.md) |
| 2 | Two Minute Triage | [README](./02-two-minute-triage/README.md) | [Manual](./02-two-minute-triage/docs/manual.html) | [Developer Guide](./02-two-minute-triage/docs/development.html) | [Environment](./02-two-minute-triage/docs/environment.md) |
| 3 | Canary Diff Judge | [README](./03-canary-diff-judge/README.md) | [Manual](./03-canary-diff-judge/docs/manual.html) | [Developer Guide](./03-canary-diff-judge/docs/development.html) | [Environment](./03-canary-diff-judge/docs/environment.md) |
| 4 | Blast Radius Agent | [README](./04-blast-radius-agent/README.md) | [Manual](./04-blast-radius-agent/docs/manual.html) | [Developer Guide](./04-blast-radius-agent/docs/development.html) | [Environment](./04-blast-radius-agent/docs/environment.md) |
| 5 | Privacy Impact Diff Agent | [README](./05-privacy-impact-diff-agent/README.md) | [Manual](./05-privacy-impact-diff-agent/docs/manual.html) | [Developer Guide](./05-privacy-impact-diff-agent/docs/development.html) | [Environment](./05-privacy-impact-diff-agent/docs/environment.md) |
| 6 | Deploy Rehearsal Agent | [README](./06-deploy-rehearsal-agent/README.md) | [Manual](./06-deploy-rehearsal-agent/docs/manual.html) | [Developer Guide](./06-deploy-rehearsal-agent/docs/development.html) | [Environment](./06-deploy-rehearsal-agent/docs/environment.md) |
| 7 | Post Deploy Judge | [README](./07-post-deploy-judge/README.md) | [Manual](./07-post-deploy-judge/docs/manual.html) | [Developer Guide](./07-post-deploy-judge/docs/development.html) | [Environment](./07-post-deploy-judge/docs/environment.md) |
| 8 | Recovery Confidence Meter | [README](./08-recovery-confidence-meter/README.md) | [Manual](./08-recovery-confidence-meter/docs/manual.html) | [Developer Guide](./08-recovery-confidence-meter/docs/development.html) | [Environment](./08-recovery-confidence-meter/docs/environment.md) |
| 9 | Eval Dataset Gardener | [README](./09-eval-dataset-gardener/README.md) | [Manual](./09-eval-dataset-gardener/docs/manual.html) | [Developer Guide](./09-eval-dataset-gardener/docs/development.html) | [Environment](./09-eval-dataset-gardener/docs/environment.md) |
| 10 | Cloud Run Traffic Mixer | [README](./10-cloud-run-traffic-mixer/README.md) | [Manual](./10-cloud-run-traffic-mixer/docs/manual.html) | [Developer Guide](./10-cloud-run-traffic-mixer/docs/development.html) | [Environment](./10-cloud-run-traffic-mixer/docs/environment.md) |
| 11 | Runbook Decay Detector | [README](./11-runbook-decay-detector/README.md) | [Manual](./11-runbook-decay-detector/docs/manual.html) | [Developer Guide](./11-runbook-decay-detector/docs/development.html) | [Environment](./11-runbook-decay-detector/docs/environment.md) |
| 12 | Data Pipeline Sheriff | [README](./12-data-pipeline-sheriff/README.md) | [Manual](./12-data-pipeline-sheriff/docs/manual.html) | [Developer Guide](./12-data-pipeline-sheriff/docs/development.html) | [Environment](./12-data-pipeline-sheriff/docs/environment.md) |
| 13 | Rollback Concierge | [README](./13-rollback-concierge/README.md) | [Manual](./13-rollback-concierge/docs/manual.html) | [Developer Guide](./13-rollback-concierge/docs/development.html) | [Environment](./13-rollback-concierge/docs/environment.md) |
| 14 | Deployment Black Box Recorder | [README](./14-deployment-black-box-recorder/README.md) | [Manual](./14-deployment-black-box-recorder/docs/manual.html) | [Developer Guide](./14-deployment-black-box-recorder/docs/development.html) | [Environment](./14-deployment-black-box-recorder/docs/environment.md) |
| 15 | Dark Launch Scout | [README](./15-dark-launch-scout/README.md) | [Manual](./15-dark-launch-scout/docs/manual.html) | [Developer Guide](./15-dark-launch-scout/docs/development.html) | [Environment](./15-dark-launch-scout/docs/environment.md) |
| 16 | AI Exploratory Tester | [README](./16-ai-exploratory-tester/README.md) | [Manual](./16-ai-exploratory-tester/docs/manual.html) | [Developer Guide](./16-ai-exploratory-tester/docs/development.html) | [Environment](./16-ai-exploratory-tester/docs/environment.md) |
| 17 | Decision Fatigue Reducer | [README](./17-decision-fatigue-reducer/README.md) | [Manual](./17-decision-fatigue-reducer/docs/manual.html) | [Developer Guide](./17-decision-fatigue-reducer/docs/development.html) | [Environment](./17-decision-fatigue-reducer/docs/environment.md) |
| 18 | Model Rollback Agent | [README](./18-model-rollback-agent/README.md) | [Manual](./18-model-rollback-agent/docs/manual.html) | [Developer Guide](./18-model-rollback-agent/docs/development.html) | [Environment](./18-model-rollback-agent/docs/environment.md) |
| 19 | Chaos Drill Agent | [README](./19-chaos-drill-agent/README.md) | [Manual](./19-chaos-drill-agent/docs/manual.html) | [Developer Guide](./19-chaos-drill-agent/docs/development.html) | [Environment](./19-chaos-drill-agent/docs/environment.md) |
| 20 | Incident Commander Karaoke | [README](./20-incident-commander-karaoke/README.md) | [Manual](./20-incident-commander-karaoke/docs/manual.html) | [Developer Guide](./20-incident-commander-karaoke/docs/development.html) | [Environment](./20-incident-commander-karaoke/docs/environment.md) |
