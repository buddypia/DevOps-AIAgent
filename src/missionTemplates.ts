export type MissionTemplate = {
  id: string;
  label: string;
  description: string;
  goal: string;
};

// ミッションの入口テンプレート。ゴールは実在システムに対する実行可能な依頼にする。
export const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    id: "prod-inspection",
    label: "本番サービス総点検",
    description: "ログ・脆弱性・UX・CIを横断チェック",
    goal: [
      "本番Cloud Runサービスの稼働リスクを総点検して。",
      "直近のログ異常のトリアージ、依存パッケージの既知脆弱性、配信中HTMLのUX/アクセシビリティ、CIの状態を確認し、",
      "優先度付きの対応計画としてまとめて。"
    ].join("")
  },
  {
    id: "release-gate",
    label: "リリース前ゲート",
    description: "CI・契約・脆弱性・HTML品質で可否判定",
    goal: [
      "リリース前の品質ゲートを実行して。",
      "GitHub ActionsのCI結果とデプロイ済みAPIの契約プローブ、依存パッケージの脆弱性照会、配信HTMLの品質監査を行い、",
      "リリース可否と残リスクを判定して。"
    ].join("")
  },
  {
    id: "incident-triage",
    label: "インシデント初動",
    description: "エラーログのトリアージと影響整理",
    goal: [
      "インシデント初動対応をして。",
      "直近のエラー/警告ログをトリアージして影響範囲と原因仮説を整理し、",
      "実測メトリクス(レイテンシ/ステータス分布)で裏取りした上で対応アクションを提案して。"
    ].join("")
  }
];
