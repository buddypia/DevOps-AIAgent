export type IncidentDrillSeverity = "ERROR" | "WARNING";

export type IncidentDrillScenario = {
  id: string;
  label: string;
  summary: string;
  targetService: string;
  baseline: string;
  observableChange: string;
  expectedDetection: string;
  primarySeverity: IncidentDrillSeverity;
  primaryMessage: string;
  secondarySeverity: IncidentDrillSeverity;
  secondaryMessage: string;
};

export const INCIDENT_DRILL_SCENARIOS = [
  {
    id: "checkout-latency",
    label: "決済アップストリーム遅延",
    summary: "合成チェックアウトのレイテンシスパイクを記録しました。",
    targetService: "checkout-api",
    baseline: "通常: checkout p95 は 400ms 未満、再試行は 2回/分以内",
    observableChange: "payments-api の応答遅延が checkout の待ち時間と再試行へ波及",
    expectedDetection: "Cloud Run SRE が ERROR/WARNING の2件を拾い、payments-api のタイムアウトを一次原因として確認",
    primarySeverity: "ERROR",
    primaryMessage: "synthetic checkout latency spike: p95 4800ms, upstream timeout to payments-api",
    secondarySeverity: "WARNING",
    secondaryMessage: "retry storm detected: 34 retries/min against /api/recommend"
  },
  {
    id: "queue-backlog",
    label: "ジョブキュー滞留",
    summary: "合成ジョブキューの滞留と再試行増加を記録しました。",
    targetService: "agent-dispatch",
    baseline: "通常: pending jobs は 10件未満、worker timeout は発生しない",
    observableChange: "キュー処理が詰まり、worker timeout が再試行を増やす状態へ変化",
    expectedDetection: "Cloud Run SRE が WARNING/ERROR の2件を拾い、agent-dispatch の滞留箇所を確認",
    primarySeverity: "WARNING",
    primaryMessage: "synthetic queue backlog: 86 pending jobs on agent-dispatch",
    secondarySeverity: "ERROR",
    secondaryMessage: "synthetic worker timeout: 7 dispatch attempts exceeded 3000ms"
  },
  {
    id: "logging-delay",
    label: "ログ配送遅延",
    summary: "合成ログ配送の遅延と観測欠損を記録しました。",
    targetService: "logging-exporter",
    baseline: "通常: export lag は 500ms 未満、trace の相関ID欠損は発生しない",
    observableChange: "ログ転送が遅れ、trace の相関ID欠損で観測範囲が狭まる状態へ変化",
    expectedDetection: "Cloud Run SRE が ERROR/WARNING の2件を拾い、観測欠損を含めて調査範囲を再確認",
    primarySeverity: "ERROR",
    primaryMessage: "synthetic log delivery delay: Cloud Logging export lag p95 4200ms",
    secondarySeverity: "WARNING",
    secondaryMessage: "synthetic observability gap: 12 request traces missing correlation ids"
  }
] as const satisfies readonly IncidentDrillScenario[];

export type IncidentDrillScenarioView = {
  id: string;
  label: string;
  severity: IncidentDrillSeverity;
  summary: string;
  targetService: string;
  baseline: string;
  observableChange: string;
  expectedDetection: string;
  signals: readonly [
    { role: "primary"; severity: IncidentDrillSeverity; message: string },
    { role: "secondary"; severity: IncidentDrillSeverity; message: string }
  ];
};

export function toIncidentDrillScenarioView(scenario: IncidentDrillScenario): IncidentDrillScenarioView {
  return {
    id: scenario.id,
    label: scenario.label,
    severity: scenario.primarySeverity,
    summary: scenario.summary,
    targetService: scenario.targetService,
    baseline: scenario.baseline,
    observableChange: scenario.observableChange,
    expectedDetection: scenario.expectedDetection,
    signals: [
      { role: "primary", severity: scenario.primarySeverity, message: scenario.primaryMessage },
      { role: "secondary", severity: scenario.secondarySeverity, message: scenario.secondaryMessage }
    ]
  };
}
