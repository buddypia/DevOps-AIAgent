import type { MissionRun } from "./mission.js";
import type { WinningStrategy } from "./strategy.js";
import type { Recommendation } from "./types.js";

export type ArchitecturePackStatus = "ready" | "watch";
export type ArchitecturePackReadiness = "submission-ready" | "needs-external-urls";

export type ArchitectureNode = {
  id: string;
  label: string;
  layer: "user" | "runtime" | "agent" | "ai" | "devops" | "submission";
  proofUrl: string;
  judgeProof: string;
};

export type ArchitectureEdge = {
  from: string;
  to: string;
  label: string;
  proof: string;
};

export type ArchitectureRequirement = {
  id: string;
  label: string;
  status: ArchitecturePackStatus;
  evidence: string;
  proofUrl: string;
};

export type ArchitecturePack = {
  id: string;
  architectureScore: number;
  readiness: ArchitecturePackReadiness;
  headline: string;
  diagramUrl: string;
  mermaid: string;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  requirements: ArchitectureRequirement[];
  protopediaChecklist: string[];
  demoClose: string;
  a2aPayload: Record<string, unknown>;
};

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function absoluteUrl(baseUrl: string, path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function points(status: ArchitecturePackStatus) {
  return status === "ready" ? 100 : 66;
}

function hasUrl(value: string) {
  return value.startsWith("https://");
}

export function buildArchitecturePack(input: {
  baseUrl: string;
  recommendation: Recommendation;
  strategy: WinningStrategy;
  mission: MissionRun;
}): ArchitecturePack {
  const { baseUrl, recommendation, strategy, mission } = input;
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const diagramUrl = absoluteUrl(normalizedBase, mission.submissionPack.architectureDiagramUrl);
  const agentCardUrl = absoluteUrl(normalizedBase, "/.well-known/agent-card.json");
  const a2aUrl = absoluteUrl(normalizedBase, "/a2a");
  const proofUrl = absoluteUrl(normalizedBase, "/api/proof");
  const dossierUrl = absoluteUrl(normalizedBase, "/api/dossier");
  const selectedAgents = recommendation.selected.map((agent) => agent.name).join(" / ") || "A2A Market Broker";

  const nodes: ArchitectureNode[] = [
    {
      id: "react-ui",
      label: "React UI",
      layer: "user",
      proofUrl: normalizedBase,
      judgeProof: "Project Brief、Marketplace、Judge Command Center、Submission Dossierを操作する入口。"
    },
    {
      id: "express-api",
      label: "Express API",
      layer: "runtime",
      proofUrl: absoluteUrl(normalizedBase, "/api/healthz"),
      judgeProof: "Vite/Expressの単一サービスでUI、API、health、Agent Cardを公開。"
    },
    {
      id: "agent-engines",
      label: "Agent Engines",
      layer: "agent",
      proofUrl: absoluteUrl(normalizedBase, "/api/prize-strategy"),
      judgeProof: `競合${strategy.competitors.length}件、SWOT、審査5項目、次に雇うAIを算出。`
    },
    {
      id: "gemini",
      label: "Gemini 3.5 Flash",
      layer: "ai",
      proofUrl: absoluteUrl(normalizedBase, "/api/recommend"),
      judgeProof: "勝ち筋、リスク、30秒ピッチをJSON生成し、APIキー未設定時もデモ継続。"
    },
    {
      id: "a2a-card",
      label: "A2A Agent Card",
      layer: "agent",
      proofUrl: agentCardUrl,
      judgeProof: "market、mission、ops、judge、submissionのskill surfaceを公開。"
    },
    {
      id: "a2a-jsonrpc",
      label: "A2A JSON-RPC",
      layer: "agent",
      proofUrl: a2aUrl,
      judgeProof: `${selectedAgents}へのmessage/send委任をartifactとして返す。`
    },
    {
      id: "cloud-run",
      label: "Cloud Run",
      layer: "runtime",
      proofUrl: mission.submissionPack.deployedUrl,
      judgeProof: "公開URLでUI/API/A2A/healthを同一revisionとして届ける。"
    },
    {
      id: "github-actions",
      label: "GitHub Actions CI",
      layer: "devops",
      proofUrl: mission.submissionPack.ciWorkflowUrl,
      judgeProof: "typecheck、test、build、architecture checkを公開repoで実行。"
    },
    {
      id: "submission-dossier",
      label: "Submission Dossier",
      layer: "submission",
      proofUrl: dossierUrl,
      judgeProof: "ProtoPedia本文、動画チャプター、提出フォーム項目、構成図を最終パケット化。"
    }
  ];

  const edges: ArchitectureEdge[] = [
    { from: "react-ui", to: "express-api", label: "操作", proof: "UIから各審査/提出APIを呼び出す。" },
    { from: "express-api", to: "agent-engines", label: "判定", proof: "recommendation、strategy、mission、proof系モジュールを実行。" },
    { from: "agent-engines", to: "gemini", label: "分析", proof: "Geminiで勝ち筋とリスクを生成。" },
    { from: "agent-engines", to: "a2a-card", label: "公開", proof: "Agent Cardにskillを登録し、審査員が確認可能。" },
    { from: "a2a-card", to: "a2a-jsonrpc", label: "委任", proof: "message/send artifactとしてA2A payloadを返す。" },
    { from: "express-api", to: "cloud-run", label: "配備", proof: "Cloud RunでUI/API/A2Aを単一サービスとして公開。" },
    { from: "github-actions", to: "cloud-run", label: "検証", proof: "CIとRelease Drift Guardで公開revisionの古さを検知。" },
    { from: "agent-engines", to: "submission-dossier", label: "提出化", proof: "証拠、録画順、構成図をProtoPedia提出パケットへ束ねる。" }
  ];

  const requirements: ArchitectureRequirement[] = [
    {
      id: "cloud-run",
      label: "必須技術: Cloud Run",
      status: hasUrl(mission.submissionPack.deployedUrl) ? "ready" : "watch",
      evidence: mission.submissionPack.deployedUrl || "Cloud Run URL needs publication.",
      proofUrl: mission.submissionPack.deployedUrl || normalizedBase
    },
    {
      id: "google-ai",
      label: "必須技術: Gemini API",
      status: recommendation.selected.some((agent) => agent.id === "gemini-strategist") ? "ready" : "watch",
      evidence: "Gemini 3.5 Flash is the configured AI analysis path; /api/proof verifies live/fallback state.",
      proofUrl: proofUrl
    },
    {
      id: "a2a",
      label: "AI Agent: A2A delegation",
      status: recommendation.selected.some((agent) => agent.id === "market-broker") ? "ready" : "watch",
      evidence: "Agent Card and JSON-RPC message/send artifacts expose AI capability procurement.",
      proofUrl: agentCardUrl
    },
    {
      id: "devops",
      label: "DevOps: CI/CD and release drift",
      status: hasUrl(mission.submissionPack.ciWorkflowUrl) ? "ready" : "watch",
      evidence: "GitHub Actions, Cloud Build runbook, Release Drift Guard, and health endpoints are linked.",
      proofUrl: mission.submissionPack.ciWorkflowUrl
    },
    {
      id: "protopedia-architecture",
      label: "提出物: システム構成図",
      status: "ready",
      evidence: "Public SVG diagram plus Mermaid text and paste checklist are generated.",
      proofUrl: diagramUrl
    },
    {
      id: "external-submit",
      label: "提出物: ProtoPedia URL and video URL",
      status: mission.submissionPack.protopediaUrl && mission.submissionPack.videoUrl ? "ready" : "watch",
      evidence: "Architecture is ready; final external URLs are sealed by Submission Launch Gate.",
      proofUrl: dossierUrl
    }
  ];
  const architectureScore = Math.round(
    clamp(average([average(requirements.map((item) => points(item.status))), strategy.mvpScore, mission.submissionScore, strategy.judgeScore]))
  );
  const readiness: ArchitecturePackReadiness = requirements.every((item) => item.status === "ready") ? "submission-ready" : "needs-external-urls";
  const mermaid = [
    "flowchart LR",
    '  UI["React UI"] --> API["Express API"]',
    '  API --> Engines["Agent Engines: Strategy / Mission / Proof"]',
    '  Engines --> Gemini["Gemini 3.5 Flash"]',
    '  Engines --> Card["A2A Agent Card"]',
    '  Card --> RPC["A2A JSON-RPC"]',
    '  API --> Run["Cloud Run"]',
    '  CI["GitHub Actions CI"] --> Run',
    '  Engines --> Dossier["Submission Dossier"]'
  ].join("\n");

  return {
    id: `architecture-pack-${architectureScore}-${mission.id}`,
    architectureScore,
    readiness,
    headline:
      readiness === "submission-ready"
        ? "構成図、必須技術、提出リンクが提出可能な状態でそろっています。"
        : "構成図と技術証拠は提出可能です。残りはProtoPedia作品URLと動画URLの外部登録です。",
    diagramUrl,
    mermaid,
    nodes,
    edges,
    requirements,
    protopediaChecklist: [
      "System Architecture欄または本文にSVGを貼る",
      "Cloud Run、Gemini、A2A、GitHub Actions、Submission Dossierの5点を図中の説明として添える",
      "動画の最後2秒で構成図、Agent Card、CIリンクを並べて見せる",
      "提出直前にSubmission Launch GateでProtoPedia URLと動画URLをreadyにする"
    ],
    demoClose:
      "この構成図は、React UIからAI能力調達、A2A委任、Gemini分析、Cloud Run公開、CI/CD、提出ドシエまでが一つのDevOpsループで閉じていることを示します。",
    a2aPayload: {
      method: "message/send",
      skill: "submission.package",
      architectureScore,
      readiness,
      diagramUrl,
      nodes: nodes.map((node) => ({ id: node.id, layer: node.layer, proofUrl: node.proofUrl })),
      edges: edges.map((edge) => ({ from: edge.from, to: edge.to, label: edge.label })),
      requirements: requirements.map((item) => ({ id: item.id, status: item.status, proofUrl: item.proofUrl })),
      endpoint: absoluteUrl(normalizedBase, "/api/architecture-pack"),
      pageEndpoint: absoluteUrl(normalizedBase, "/architecture-pack")
    }
  };
}

function statusTone(status: string) {
  if (["ready", "submission-ready"].includes(status)) return "good";
  return "watch";
}

export function renderArchitecturePackHtml(pack: ArchitecturePack) {
  const nodes = pack.nodes
    .map(
      (node) => `
        <article class="node ${escapeHtml(node.layer)}">
          <div><strong>${escapeHtml(node.label)}</strong><span>${escapeHtml(node.layer)}</span></div>
          <p>${escapeHtml(node.judgeProof)}</p>
          <a href="${escapeHtml(node.proofUrl)}">${escapeHtml(node.proofUrl)}</a>
        </article>`
    )
    .join("");
  const edges = pack.edges
    .map(
      (edge) => `
        <article class="edge">
          <strong>${escapeHtml(edge.from)} -> ${escapeHtml(edge.to)}</strong>
          <span>${escapeHtml(edge.label)}</span>
          <p>${escapeHtml(edge.proof)}</p>
        </article>`
    )
    .join("");
  const requirements = pack.requirements
    .map(
      (requirement) => `
        <article class="requirement ${statusTone(requirement.status)}">
          <div><strong>${escapeHtml(requirement.label)}</strong><span>${escapeHtml(requirement.status)}</span></div>
          <p>${escapeHtml(requirement.evidence)}</p>
          <a href="${escapeHtml(requirement.proofUrl)}">${escapeHtml(requirement.proofUrl)}</a>
        </article>`
    )
    .join("");
  const checklist = pack.protopediaChecklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Architecture Pack</title>
    <style>
      :root { color-scheme: light; --ink: #17201d; --muted: #5f6965; --line: #dce5df; --paper: #fbfcfa; --panel: #fff; --green: #13715d; --mint: #e6f4ed; --amber: #8a620d; --amber-bg: #fff4d4; --blue: #245c99; }
      * { box-sizing: border-box; }
      body { margin: 0; background: var(--paper); color: var(--ink); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1120px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 40px 0 20px; }
      .eyebrow { color: var(--green); font-size: .78rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0; }
      h1 { margin: 8px 0 10px; font-size: clamp(2rem, 5vw, 4.3rem); line-height: 1; letter-spacing: 0; max-width: 940px; }
      header p { color: var(--muted); max-width: 860px; }
      .metrics, .grid { display: grid; gap: 12px; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 22px; }
      .metric, .section, .node, .edge, .requirement { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; box-shadow: 0 1px 0 rgba(23, 32, 29, .03); }
      .metric { padding: 14px; }
      .metric span, .node span, .edge span, .requirement span { color: var(--muted); font-size: .74rem; font-weight: 900; text-transform: uppercase; }
      .metric strong { display: block; margin-top: 6px; font-size: 1.45rem; overflow-wrap: anywhere; }
      .good { background: var(--mint); border-color: #b9dfd1; }
      .watch { background: var(--amber-bg); border-color: #ead39a; }
      .section { padding: 18px; margin: 14px 0; }
      .section h2 { margin: 0 0 12px; font-size: 1.05rem; }
      .diagram { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, .72fr); gap: 18px; align-items: start; }
      img { width: 100%; height: auto; border: 1px solid var(--line); border-radius: 8px; background: #fff; }
      pre { white-space: pre-wrap; overflow-wrap: anywhere; margin: 0; padding: 12px; border-radius: 8px; background: #17201d; color: #eef8f4; font-size: .82rem; }
      .grid.nodes { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .grid.edges, .grid.requirements { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .node, .edge, .requirement { padding: 12px; }
      .node div, .requirement div { display: flex; justify-content: space-between; gap: 10px; }
      .node p, .edge p, .requirement p { color: var(--muted); margin: 8px 0; }
      ul { margin: 0; padding-left: 22px; color: var(--muted); }
      li + li { margin-top: 8px; }
      footer { color: var(--muted); font-size: .84rem; padding: 10px 0 36px; }
      @media (max-width: 860px) { header { padding-top: 28px; } .metrics, .diagram, .grid.nodes, .grid.edges, .grid.requirements { grid-template-columns: 1fr; } }
    </style>
  </head>
  <body>
    <header>
      <div class="eyebrow">Architecture Pack</div>
      <h1>${escapeHtml(pack.headline)}</h1>
      <p>${escapeHtml(pack.demoClose)}</p>
      <section class="metrics">
        <div class="metric ${statusTone(pack.readiness)}"><span>Readiness</span><strong>${escapeHtml(pack.readiness)}</strong></div>
        <div class="metric good"><span>Architecture Score</span><strong>${escapeHtml(pack.architectureScore)}</strong></div>
        <div class="metric good"><span>Nodes</span><strong>${escapeHtml(pack.nodes.length)}</strong></div>
        <div class="metric watch"><span>Requirements</span><strong>${escapeHtml(pack.requirements.filter((item) => item.status === "ready").length)} / ${escapeHtml(pack.requirements.length)}</strong></div>
      </section>
    </header>
    <main>
      <section class="section diagram">
        <div>
          <h2>System Architecture Diagram</h2>
          <img src="${escapeHtml(pack.diagramUrl)}" alt="A2A Agent Marketplace system architecture diagram" />
        </div>
        <div>
          <h2>Mermaid</h2>
          <pre>${escapeHtml(pack.mermaid)}</pre>
        </div>
      </section>
      <section class="section">
        <h2>Proof Nodes</h2>
        <div class="grid nodes">${nodes}</div>
      </section>
      <section class="section">
        <h2>DevOps Edges</h2>
        <div class="grid edges">${edges}</div>
      </section>
      <section class="section">
        <h2>Submission Requirements</h2>
        <div class="grid requirements">${requirements}</div>
      </section>
      <section class="section">
        <h2>ProtoPedia Checklist</h2>
        <ul>${checklist}</ul>
      </section>
    </main>
    <footer>${escapeHtml(pack.id)}</footer>
  </body>
</html>`;
}
