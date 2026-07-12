# Features

Feature Architect / feature-spec-generator により、現行コードベースから抽出した機能台帳です。

| ID | Feature | Domain | Source | Status |
|---|---|---|---|---|
| [001-shipguard-ai](./001-shipguard-ai/) | ShipGuard AI | release-governance | outputs/01-shipguard-ai | implemented / documented |
| [002-two-minute-triage](./002-two-minute-triage/) | Two Minute Triage | incident-response | outputs/02-two-minute-triage | implemented / documented |
| [003-canary-diff-judge](./003-canary-diff-judge/) | Canary Diff Judge | deployment-safety | outputs/03-canary-diff-judge | implemented / documented |
| [004-blast-radius-agent](./004-blast-radius-agent/) | Blast Radius Agent | release-governance | outputs/04-blast-radius-agent | implemented / documented |
| [005-privacy-impact-diff-agent](./005-privacy-impact-diff-agent/) | Privacy Impact Diff Agent | data-operations | outputs/05-privacy-impact-diff-agent | implemented / documented |
| [006-deploy-rehearsal-agent](./006-deploy-rehearsal-agent/) | Deploy Rehearsal Agent | deployment-safety | outputs/06-deploy-rehearsal-agent | implemented / documented |
| [007-post-deploy-judge](./007-post-deploy-judge/) | Post Deploy Judge | release-governance | outputs/07-post-deploy-judge | implemented / documented |
| [008-recovery-confidence-meter](./008-recovery-confidence-meter/) | Recovery Confidence Meter | incident-response | outputs/08-recovery-confidence-meter | implemented / documented |
| [009-eval-dataset-gardener](./009-eval-dataset-gardener/) | Eval Dataset Gardener | ai-quality | outputs/09-eval-dataset-gardener | implemented / documented |
| [010-cloud-run-traffic-mixer](./010-cloud-run-traffic-mixer/) | Cloud Run Traffic Mixer | deployment-safety | outputs/10-cloud-run-traffic-mixer | implemented / documented |
| [011-runbook-decay-detector](./011-runbook-decay-detector/) | Runbook Decay Detector | data-operations | outputs/11-runbook-decay-detector | implemented / documented |
| [012-data-pipeline-sheriff](./012-data-pipeline-sheriff/) | Data Pipeline Sheriff | data-operations | outputs/12-data-pipeline-sheriff | implemented / documented |
| [013-rollback-concierge](./013-rollback-concierge/) | Rollback Concierge | deployment-safety | outputs/13-rollback-concierge | implemented / documented |
| [014-deployment-black-box-recorder](./014-deployment-black-box-recorder/) | Deployment Black Box Recorder | deployment-safety | outputs/14-deployment-black-box-recorder | implemented / documented |
| [015-dark-launch-scout](./015-dark-launch-scout/) | Dark Launch Scout | ai-quality | outputs/15-dark-launch-scout | implemented / documented |
| [016-ai-exploratory-tester](./016-ai-exploratory-tester/) | AI Exploratory Tester | ai-quality | outputs/16-ai-exploratory-tester | implemented / documented |
| [017-decision-fatigue-reducer](./017-decision-fatigue-reducer/) | Decision Fatigue Reducer | release-governance | outputs/17-decision-fatigue-reducer | implemented / documented |
| [018-model-rollback-agent](./018-model-rollback-agent/) | Model Rollback Agent | ai-quality | outputs/18-model-rollback-agent | implemented / documented |
| [019-chaos-drill-agent](./019-chaos-drill-agent/) | Chaos Drill Agent | incident-response | outputs/19-chaos-drill-agent | implemented / documented |
| [020-incident-commander-karaoke](./020-incident-commander-karaoke/) | Incident Commander Karaoke | incident-response | outputs/20-incident-commander-karaoke | implemented / documented |
| [021-agent-guild-platform](./021-agent-guild-platform/) | Agent Guild プラットフォーム | agent-platform | src + server | implemented / documented |
| [022-merge-steward](./022-merge-steward/) | Merge Steward | agent-platform | src + server | planned / UI approval |
| [001-external-agent-delegation](./001-external-agent-delegation/) | 外部Agent Cardの実委任 | agent-orchestration | src + server | done |

- Domain SSOT: [domain-map.json](domain-map.json)
- 共通パス: project-config.json の paths.features/docs_features は未定義のため、スキル既定値を採用。
- upstream feature registry: 外部Agent Cardの実委任を含む。
