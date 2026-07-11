import type { CapabilityKey, MarketAgent } from "./types.js";

export const CAPABILITY_LABELS: Record<CapabilityKey, string> = {
  autonomy: "自律判断",
  planning: "企画設計",
  code: "実装",
  testing: "検証",
  cloudRun: "Cloud Run",
  security: "セキュリティ",
  observability: "運用観測",
  ux: "UX",
  mcp: "MCP",
  a2a: "A2A"
};

export const DEFAULT_PROJECT_BRIEF = [
  "brief2dev を分析し、Agent-To-Agent Marketplace と組み合わせる。",
  "必要な能力を持つAIを市場から探し、雇い、A2Aで連携させる。",
  "Gemini 3.5 Flash でプロジェクトの弱点を診断し、Cloud Run へ届ける。",
  "MCP/スキル/DevOps能力を数値化して、購入でプロジェクト改善が見える体験にする。"
].join("\n");

export const MARKET_AGENTS: MarketAgent[] = [
  {
    id: "brief-cartographer",
    name: "Brief Cartographer",
    handle: "企画地図師",
    stage: "plan",
    rarity: "epic",
    price: 32,
    headline: "曖昧な要件を審査ストーリーと実装単位へ分解",
    outcome: "ProtoPediaの課題・対象ユーザー・特徴欄をそのまま埋められる骨子を作る",
    color: "#284b63",
    accent: "#f9c74f",
    capabilities: {
      autonomy: 84,
      planning: 96,
      code: 44,
      testing: 56,
      cloudRun: 50,
      security: 48,
      observability: 54,
      ux: 72,
      mcp: 68,
      a2a: 80
    },
    skills: [
      { id: "brief-slicing", label: "要件スライス", proof: "BRIEF/CONTEXT/SPECへ分離", score: 96 },
      { id: "judge-story", label: "審査軸ストーリー", proof: "5項目を1本の体験価値へ接続", score: 91 },
      { id: "scope-pruning", label: "過剰機能の剪定", proof: "MVPと提出物を分離", score: 82 }
    ],
    mcp: [
      { name: "notion-brief-reader", tools: ["read_page", "extract_blocks"], maturity: 82 },
      { name: "github-issue-drafter", tools: ["create_issue", "link_pr"], maturity: 74 }
    ],
    a2aSkillIds: ["brief.analyze", "project.scope", "judge.pitch", "judge.tour", "demo.receipt"],
    synergyTags: ["brief2dev", "protopedia", "planning", "a2a"]
  },
  {
    id: "market-broker",
    name: "A2A Market Broker",
    handle: "市場仲介AI",
    stage: "govern",
    rarity: "legendary",
    price: 46,
    headline: "Agent Cardを読み、交渉し、最適なAIチームを編成",
    outcome: "必要能力から候補を探索し、A2A message/sendで協働タスクを開始",
    color: "#0f766e",
    accent: "#b7f7d7",
    capabilities: {
      autonomy: 92,
      planning: 86,
      code: 62,
      testing: 66,
      cloudRun: 70,
      security: 72,
      observability: 80,
      ux: 76,
      mcp: 96,
      a2a: 98
    },
    skills: [
      { id: "agent-card-discovery", label: "Agent Card探索", proof: "/.well-known/agent-card.json対応", score: 98 },
      { id: "capability-auction", label: "能力オークション", proof: "価格/能力/相性で選定", score: 93 },
      { id: "handoff-ledger", label: "委任台帳", proof: "依頼・成果・検証を時系列化", score: 88 }
    ],
    mcp: [
      { name: "a2a-directory", tools: ["discover", "negotiate", "delegate"], maturity: 96 },
      { name: "mcp-ledger", tools: ["score_skill", "record_handoff"], maturity: 91 }
    ],
    a2aSkillIds: ["market.discover", "agent.hire", "task.delegate", "squad.optimize", "moat.stress"],
    synergyTags: ["a2a", "marketplace", "mcp", "governance"]
  },
  {
    id: "cloud-run-sre",
    name: "Cloud Run SRE",
    handle: "本番配送係",
    stage: "deploy",
    rarity: "epic",
    price: 38,
    headline: "Cloud Runのデプロイ、ログ、ロールバックを運用可能にする",
    outcome: "提出URLが動き続けるためのヘルスチェックと運用コマンドを揃える",
    color: "#2457a6",
    accent: "#8ecae6",
    capabilities: {
      autonomy: 78,
      planning: 66,
      code: 70,
      testing: 74,
      cloudRun: 98,
      security: 76,
      observability: 92,
      ux: 48,
      mcp: 76,
      a2a: 72
    },
    skills: [
      { id: "run-deploy", label: "Cloud Run配送", proof: "Dockerfile/cloudbuild.yaml/runbook", score: 98 },
      { id: "slo-health", label: "SLOヘルス", proof: "/api/healthz とログクエリ", score: 90 },
      { id: "rollback", label: "ロールバック判断", proof: "失敗時の停止条件を提示", score: 84 }
    ],
    mcp: [
      { name: "gcloud-runner", tools: ["deploy", "describe_service", "read_logs"], maturity: 86 },
      { name: "github-actions", tools: ["check_run", "annotate"], maturity: 80 }
    ],
    a2aSkillIds: ["cloudrun.deploy", "ops.observe", "release.rollback", "evidence.monitor", "observability.oracle"],
    synergyTags: ["cloud-run", "devops", "operate", "submission"]
  },
  {
    id: "gemini-strategist",
    name: "Gemini Strategist",
    handle: "審査突破参謀",
    stage: "plan",
    rarity: "legendary",
    price: 44,
    headline: "Gemini 3.5 Flashで勝ち筋、リスク、ピッチを高速更新",
    outcome: "審査軸に沿う一貫したプロダクトメッセージを生成",
    color: "#3d405b",
    accent: "#81b29a",
    capabilities: {
      autonomy: 88,
      planning: 94,
      code: 58,
      testing: 62,
      cloudRun: 64,
      security: 68,
      observability: 70,
      ux: 84,
      mcp: 72,
      a2a: 78
    },
    skills: [
      { id: "flash-critique", label: "高速批評", proof: "Gemini 3.5 Flash API", score: 96 },
      { id: "pitch-refine", label: "ピッチ生成", proof: "30秒説明と審査員向け論点", score: 93 },
      { id: "risk-tradeoff", label: "リスク整理", proof: "実用性/実装力の穴を検出", score: 88 }
    ],
    mcp: [
      { name: "gemini-api", tools: ["generateContent", "json_mode"], maturity: 92 },
      { name: "pitch-pack-writer", tools: ["draft_story", "extract_risks"], maturity: 78 }
    ],
    a2aSkillIds: ["gemini.review", "pitch.write", "risk.rank"],
    synergyTags: ["gemini", "planning", "pitch", "hackathon"]
  },
  {
    id: "test-forge",
    name: "Test Forge",
    handle: "品質鍛冶",
    stage: "build",
    rarity: "rare",
    price: 27,
    headline: "市場ロジック、購入効果、API契約をテストで固める",
    outcome: "壊れていないだけでなく、審査で説明できる検証証跡を残す",
    color: "#6d597a",
    accent: "#ffc8dd",
    capabilities: {
      autonomy: 70,
      planning: 62,
      code: 78,
      testing: 96,
      cloudRun: 58,
      security: 68,
      observability: 72,
      ux: 42,
      mcp: 66,
      a2a: 64
    },
    skills: [
      { id: "contract-tests", label: "契約テスト", proof: "A2A/推薦エンジンの不変条件", score: 94 },
      { id: "fallback-tests", label: "鍵なし動作検証", proof: "Gemini未設定でもデモ継続", score: 91 },
      { id: "score-tests", label: "数値化検証", proof: "購入前後の改善量を検査", score: 88 }
    ],
    mcp: [
      { name: "vitest-runner", tools: ["run_unit", "coverage_summary"], maturity: 88 },
      { name: "playwright-smoke", tools: ["open_page", "capture_trace"], maturity: 70 }
    ],
    a2aSkillIds: ["test.contract", "test.regression", "verify.evidence"],
    synergyTags: ["testing", "devops", "quality", "brief2dev"]
  },
  {
    id: "security-sentinel",
    name: "Security Sentinel",
    handle: "安全監査役",
    stage: "govern",
    rarity: "rare",
    price: 29,
    headline: "APIキー、公開URL、提出物の安全境界を守る",
    outcome: "公開デモで漏洩しない設定と、審査員へ説明できるガードレールを用意",
    color: "#8f2d56",
    accent: "#ffb3c1",
    capabilities: {
      autonomy: 74,
      planning: 66,
      code: 64,
      testing: 72,
      cloudRun: 72,
      security: 98,
      observability: 78,
      ux: 44,
      mcp: 70,
      a2a: 68
    },
    skills: [
      { id: "secret-boundary", label: "秘密境界", proof: "環境変数/ログ出力の分離", score: 98 },
      { id: "public-demo-guard", label: "公開デモ監査", proof: "鍵なしフォールバックと入力上限", score: 88 },
      { id: "a2a-trust", label: "A2A信頼境界", proof: "Agent Cardと委任ログを分離", score: 82 }
    ],
    mcp: [
      { name: "secret-scanner", tools: ["scan_env", "redact_logs"], maturity: 86 },
      { name: "policy-checker", tools: ["check_headers", "limit_payload"], maturity: 80 }
    ],
    a2aSkillIds: ["security.scan", "policy.guard", "trust.explain"],
    synergyTags: ["security", "governance", "cloud-run", "submission"]
  },
  {
    id: "ux-guildmaster",
    name: "UX Guildmaster",
    handle: "体験ギルド長",
    stage: "build",
    rarity: "epic",
    price: 34,
    headline: "能力市場をひと目で遊べる業務UIに整える",
    outcome: "能力値、購入効果、A2A連携が触った瞬間に伝わる",
    color: "#b56576",
    accent: "#f6bd60",
    capabilities: {
      autonomy: 72,
      planning: 78,
      code: 74,
      testing: 58,
      cloudRun: 44,
      security: 46,
      observability: 62,
      ux: 98,
      mcp: 68,
      a2a: 76
    },
    skills: [
      { id: "market-readable", label: "市場可視化", proof: "価格/レアリティ/能力バー", score: 98 },
      { id: "game-loop", label: "購入ループ", proof: "雇う→改善→計画更新", score: 92 },
      { id: "dense-ui", label: "審査用密度", proof: "1画面で価値・技術・運用を見せる", score: 88 }
    ],
    mcp: [
      { name: "design-lint", tools: ["check_contrast", "inspect_layout"], maturity: 76 },
      { name: "asset-ledger", tools: ["record_image_source", "verify_assets"], maturity: 70 }
    ],
    a2aSkillIds: ["ux.compose", "market.visualize", "demo.polish", "user.pilot"],
    synergyTags: ["ux", "marketplace", "game", "a2a"]
  },
  {
    id: "observability-oracle",
    name: "Observability Oracle",
    handle: "運用予言者",
    stage: "operate",
    rarity: "rare",
    price: 31,
    headline: "ログ・メトリクス・提出後の改善サイクルを読む",
    outcome: "Cloud Runログから次の改善候補を市場へ戻す",
    color: "#2f4858",
    accent: "#86bbd8",
    capabilities: {
      autonomy: 80,
      planning: 62,
      code: 60,
      testing: 66,
      cloudRun: 84,
      security: 70,
      observability: 98,
      ux: 56,
      mcp: 82,
      a2a: 74
    },
    skills: [
      { id: "signal-radar", label: "シグナル抽出", proof: "ログ/CI/ユーザー入力を統合", score: 96 },
      { id: "improvement-loop", label: "改善ループ", proof: "次に雇う能力を推薦", score: 89 },
      { id: "runtime-evidence", label: "運用証跡", proof: "提出URLの稼働証拠を生成", score: 86 }
    ],
    mcp: [
      { name: "cloud-logging", tools: ["read_errors", "summarize_latency"], maturity: 88 },
      { name: "ci-observer", tools: ["read_checks", "rank_failures"], maturity: 82 }
    ],
    a2aSkillIds: ["ops.observe", "feedback.rank", "market.rebuy"],
    synergyTags: ["operate", "observability", "cloud-run", "devops"]
  }
];
