export type FirstClickTone = "primary" | "ready" | "watch";

export type FirstClickProofLink = {
  id: string;
  label: string;
  href: string;
  signal: string;
  judgeValue: string;
  tone: FirstClickTone;
};

export type FirstClickScorecard = {
  id: string;
  label: string;
  value: string;
  proof: string;
};

export type FirstClickProofRoute = FirstClickProofLink & {
  url: string;
};

export type FirstClickRouteLock = {
  id: string;
  noPostRequired: boolean;
  proofPathCount: number;
  firstProofPath: string;
  requiredAgentCardSignal: string;
};

export type FirstClickProof = {
  skill: typeof FIRST_CLICK_SKILL_ID;
  id: string;
  headline: string;
  directOpen: boolean;
  proofLinks: FirstClickProofRoute[];
  scorecards: FirstClickScorecard[];
  routeLock: FirstClickRouteLock;
};

export const FIRST_CLICK_SKILL_ID = "judge.first-click";
export const FIRST_CLICK_ROUTE_LOCK_TAG = "first-click-route-lock";
export const FIRST_CLICK_REQUIRED_SIGNAL = `${FIRST_CLICK_SKILL_ID}:tag:${FIRST_CLICK_ROUTE_LOCK_TAG}`;

export const FIRST_CLICK_PROOF_LINKS: FirstClickProofLink[] = [
  {
    id: "win-autopilot",
    label: "Win Autopilot",
    href: "/win-autopilot",
    signal: "agentic-win-run",
    judgeValue: "競合/SWOT、証拠、運用、提出、残アクションをAIが一括判定する入口。",
    tone: "primary"
  },
  {
    id: "judge-snapshot",
    label: "Judge Snapshot",
    href: "/judge-snapshot",
    signal: "first-click-ready",
    judgeValue: "初見審査員の入口。競合、MVP、AI中心性、実用性、提出証拠へ分岐する。",
    tone: "primary"
  },
  {
    id: "winner-packet",
    label: "Winner Packet",
    href: "/winner-packet",
    signal: "five-criteria-proof",
    judgeValue: "審査5項目ごとの主張、証拠URL、反論、録画cueを1枚で読む。",
    tone: "primary"
  },
  {
    id: "objection-arena",
    label: "Objection Arena",
    href: "/objection-arena",
    signal: "judge-qa-lock",
    judgeValue: "ADKで十分では、AI中心性は本物か、公開URLは最新かを証拠URL付きで即答する。",
    tone: "primary"
  },
  {
    id: "competitive-swot",
    label: "Competitive SWOT",
    href: "/competitive-swot",
    signal: "source-backed-swot",
    judgeValue: "ADK、LangGraph、CrewAI、Dify、AgentOps等との違いとSWOT根拠を確認する。",
    tone: "ready"
  },
  {
    id: "mvp-readiness",
    label: "MVP Readiness",
    href: "/mvp-readiness",
    signal: "mvp-gate",
    judgeValue: "必須技術、公開revision、外部提出gapをwatch/readyで確認する。",
    tone: "ready"
  },
  {
    id: "deploy-recovery",
    label: "Deploy Recovery",
    href: "/deploy-recovery",
    signal: "cloud-run-recovery",
    judgeValue: "公開Cloud Runが古い時のgcloud認証、Cloud Build、Agent Card、A2A再検証手順を確認する。",
    tone: "watch"
  },
  {
    id: "autonomy-snapshot",
    label: "Autonomy Snapshot",
    href: "/autonomy-snapshot",
    signal: "agent-centrality",
    judgeValue: "AIが探索、判断、契約、A2A委任、検証、運用、提出を進める連鎖を見る。",
    tone: "ready"
  },
  {
    id: "pilot-value",
    label: "Pilot Value",
    href: "/pilot-value",
    signal: "buyer-value",
    judgeValue: "実用性、初回UX、買い手反論、payback daysを確認する。",
    tone: "ready"
  },
  {
    id: "recording-script",
    label: "Recording Script",
    href: "/recording-script",
    signal: "video-ready",
    judgeValue: "30秒動画の章立て、字幕、開く証拠URL、公開手順を見る。",
    tone: "watch"
  },
  {
    id: "architecture-pack",
    label: "Architecture Pack",
    href: "/architecture-pack",
    signal: "architecture-proof",
    judgeValue: "ProtoPedia必須の構成図、Mermaid、Cloud Run/Gemini/A2A/CI/提出物の対応表を見る。",
    tone: "watch"
  },
  {
    id: "submission-launch",
    label: "Submission Launch",
    href: "/submission-launch",
    signal: "submit-form-lock",
    judgeValue: "Findy最終提出フォームへ貼る3URL、動画、タグ、完成ステータス、締切をFinal Submit Lockで確認する。",
    tone: "watch"
  },
  {
    id: "submission-assets",
    label: "Submission Assets",
    href: "/submission-assets",
    signal: "protopedia-assets",
    judgeValue: "ProtoPedia本文、構成図、タグ、提出URLの作業面を確認する。",
    tone: "watch"
  }
];

export const FIRST_CLICK_SCORECARDS: FirstClickScorecard[] = [
  {
    id: "no-post-first",
    label: "No POST required",
    value: "13 GET links",
    proof: "初回審査はcurlやJSONを知らなくても主要証拠に到達できる。"
  },
  {
    id: "criteria-covered",
    label: "Judge criteria",
    value: "5/5 covered",
    proof: "AI中心性、課題、UX、実用性、実装力をWinner Packetへ集約する。"
  },
  {
    id: "drift-honesty",
    label: "Release honesty",
    value: "?live=1",
    proof: "公開Cloud Runが古い場合はready扱いにせず、Release Driftで止める。"
  }
];

function absoluteUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

export function buildFirstClickProof(baseUrl: string): FirstClickProof {
  const proofLinks = FIRST_CLICK_PROOF_LINKS.map((link) => ({
    ...link,
    url: absoluteUrl(baseUrl, link.href)
  }));

  return {
    skill: FIRST_CLICK_SKILL_ID,
    id: `judge-first-click-${proofLinks.length}-get-proof-links`,
    headline: "Start with proof, not feature hunting",
    directOpen: true,
    proofLinks,
    scorecards: FIRST_CLICK_SCORECARDS,
    routeLock: {
      id: "judge-first-click-route-lock",
      noPostRequired: true,
      proofPathCount: proofLinks.length,
      firstProofPath: FIRST_CLICK_PROOF_LINKS[0]?.href ?? "/judge-snapshot",
      requiredAgentCardSignal: FIRST_CLICK_REQUIRED_SIGNAL
    }
  };
}
