export type OnboardingTemplate = {
  id: string;
  label: string;
  audience: string;
  promise: string;
  brief: string;
  selectedAgentIds: string[];
};

export const ONBOARDING_TEMPLATES: OnboardingTemplate[] = [
  {
    id: "platform-launch",
    label: "Platform Launch",
    audience: "Platform / DevOps Lead",
    promise: "AIエージェント構想をCloud Runで動く運用計画に変える。",
    brief: [
      "プラットフォームチーム向けのAIエージェントプロダクト。",
      "Cloud Runデプロイ、Agent Card探索、A2A委任、ヘルスチェック、ロールバック判断が必要。",
      "誰に価値があり、何時間節約できるか、公開後にどう運用するかを明確にしたい。"
    ].join("\n"),
    selectedAgentIds: ["market-broker", "cloud-run-sre", "gemini-strategist"]
  },
  {
    id: "security-review",
    label: "Security Review",
    audience: "Security-conscious Engineering Lead",
    promise: "公開AIエージェントを社外に見せられる安全性まで引き上げる。",
    brief: [
      "社外ユーザー向けの公開AIエージェントサービス。",
      "APIキー境界、入力の安全性、セキュリティレビュー、監査ログ、Cloud Run堅牢化が必要。",
      "秘密情報が漏れていない証拠を、外部トラフィックを許可する前に揃えたい。"
    ].join("\n"),
    selectedAgentIds: ["security-sentinel", "cloud-run-sre", "market-broker"]
  },
  {
    id: "quality-proof",
    label: "Quality Proof",
    audience: "Engineering Manager",
    promise: "デモ段階のプロダクトを検証済みのリリース候補に変える。",
    brief: [
      "本番公開を控えたAIエージェントプロダクト。",
      "推薦ロジックのテスト、A2A契約チェック、Cloud Runヘルス、セキュリティ境界、デプロイ証跡が必要。",
      "本番運用可能と呼べるだけの実務的な検証をチームで揃えたい。"
    ].join("\n"),
    selectedAgentIds: ["market-broker", "cloud-run-sre", "security-sentinel", "test-forge"]
  }
];

export const DEFAULT_ONBOARDING_TEMPLATE = ONBOARDING_TEMPLATES[0];

export function getOnboardingTemplate(id: string) {
  return ONBOARDING_TEMPLATES.find((template) => template.id === id) ?? DEFAULT_ONBOARDING_TEMPLATE;
}
