import type { MissionRun, SubmissionRequirement } from "./mission.js";

export type SubmissionAssetStatus = "ready" | "watch";

export type SubmissionAssetLink = {
  id: string;
  label: string;
  url: string;
  status: SubmissionAssetStatus;
  purpose: string;
};

export type SubmissionValueSnapshot = {
  audience: string;
  pain: string;
  promise: string;
  proofMoment: string;
};

export type SubmissionProofReadiness = {
  readyCount: number;
  totalCount: number;
  scoreLabel: string;
  blockers: Array<{ id: string; label: string; proof: string }>;
};

export type SubmissionReviewerPathItem = {
  id: string;
  label: string;
  href: string;
  proof: string;
};

export type SubmissionAgentDecisionProof = {
  id: string;
  actor: string;
  target: string;
  rationale: string;
  evidence: string;
  confidence: number;
};

export type SubmissionEvidenceChainItem = {
  id: string;
  label: string;
  url: string;
  command: string;
  proves: string;
  userValue: string;
};

export type SubmissionClaimProof = {
  id: string;
  criterion: string;
  claim: string;
  proofLabel: string;
  proofUrl: string;
  evidence: string;
  userValue: string;
  status: "proven" | "watch";
};

export type SubmissionAssetsPage = {
  id: string;
  generatedAt: string;
  readiness: "assets-ready-external-watch" | "assets-ready";
  headline: string;
  hardTruth: string;
  jsonEndpoint: string;
  valueSnapshot: SubmissionValueSnapshot;
  proofReadiness: SubmissionProofReadiness;
  reviewerPath: SubmissionReviewerPathItem[];
  agentDecisionProof: SubmissionAgentDecisionProof[];
  claimProofMatrix: SubmissionClaimProof[];
  evidenceChain: SubmissionEvidenceChainItem[];
  title: string;
  tags: string[];
  story: string[];
  demoScript: string;
  architecture: {
    diagramUrl: string;
    bullets: string[];
  };
  videoStoryboard: string[];
  requirements: SubmissionRequirement[];
  links: SubmissionAssetLink[];
  pasteFields: Array<{ id: string; label: string; value: string; target: string }>;
};

function normalizeBase(url: string) {
  return url.replace(/\/$/, "");
}

function absoluteUrl(baseUrl: string, pathOrUrl: string) {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;
  return `${normalizeBase(baseUrl)}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function linkStatus(url: string): SubmissionAssetStatus {
  return url.startsWith("https://") || url.startsWith("http://") ? "ready" : "watch";
}

function readinessFrom(requirements: SubmissionRequirement[]) {
  return requirements.some((requirement) => requirement.status === "needs-url") ? "assets-ready-external-watch" : "assets-ready";
}

function proofReadinessFrom(requirements: SubmissionRequirement[]): SubmissionProofReadiness {
  const readyCount = requirements.filter((requirement) => requirement.status === "ready").length;
  const blockers = requirements
    .filter((requirement) => requirement.status === "needs-url")
    .map((requirement) => ({ id: requirement.id, label: requirement.label, proof: requirement.proof }));
  return {
    readyCount,
    totalCount: requirements.length,
    scoreLabel: `${readyCount}/${requirements.length} submission requirements ready`,
    blockers
  };
}

function commandForPath(commands: string[], path: string, fallback: string) {
  return commands.find((command) => command.includes(path)) ?? fallback;
}

export function buildSubmissionAssetsPage(input: { baseUrl: string; mission: MissionRun; generatedAt?: string }): SubmissionAssetsPage {
  const { mission } = input;
  const baseUrl = normalizeBase(input.baseUrl);
  const readiness = readinessFrom(mission.submissionPack.requirements);
  const architectureUrl = absoluteUrl(baseUrl, mission.submissionPack.architectureDiagramUrl);
  const storyUrl = absoluteUrl(baseUrl, mission.submissionPack.storyMarkdownPath);
  const jsonEndpoint = `${baseUrl}/api/submission-assets`;
  const tags = mission.submissionPack.tags;
  const requirements = mission.submissionPack.requirements;
  const proofReadiness = proofReadinessFrom(requirements);
  const completedStepCount = mission.steps.filter((step) => step.status === "completed").length;
  const story = mission.submissionPack.story.split("\n").filter(Boolean);
  const reviewerPath: SubmissionReviewerPathItem[] = [
    {
      id: "live-product",
      label: "Open the live product",
      href: mission.submissionPack.deployedUrl,
      proof: "Confirms Cloud Run deployment, public interaction, health checks, and visible buyer workflow."
    },
    {
      id: "judge-snapshot",
      label: "Read the proof snapshot",
      href: `${baseUrl}/judge-snapshot`,
      proof: "Shows the shortest evidence path for AI centrality, usability, practicality, and implementation depth."
    },
    {
      id: "recording-script",
      label: "Record the 30 second walkthrough",
      href: `${baseUrl}/recording-script`,
      proof: "Gives shot order, narration, proof links, and the public submission sequence."
    }
  ];
  const agentDecisionProof: SubmissionAgentDecisionProof[] = mission.decisions.map((decision) => ({
    id: decision.id,
    actor: decision.actor,
    target: decision.target,
    rationale: decision.rationale,
    evidence: decision.evidence,
    confidence: decision.confidence
  }));
  const evidenceChain: SubmissionEvidenceChainItem[] = [
    {
      id: "cloud-run-health",
      label: "Cloud Run health",
      url: `${baseUrl}/api/healthz`,
      command: commandForPath(mission.verificationCommands, "/api/healthz", `curl -s ${baseUrl}/api/healthz`),
      proves: "The deployed service is reachable and can answer operational health checks.",
      userValue: "A buyer can open the product without trusting a screenshot."
    },
    {
      id: "agent-card",
      label: "A2A Agent Card",
      url: `${baseUrl}/.well-known/agent-card.json`,
      command: commandForPath(mission.verificationCommands, "/.well-known/agent-card.json", `curl -s ${baseUrl}/.well-known/agent-card.json`),
      proves: "The agent capability surface, A2A skills, and public proof endpoints are machine-readable.",
      userValue: "A platform team can inspect what the agent can actually do before running a trial."
    },
    {
      id: "strategy-api",
      label: "Strategy API",
      url: `${baseUrl}/api/strategy`,
      command: commandForPath(mission.verificationCommands, "/api/strategy", `curl -s -X POST ${baseUrl}/api/strategy`),
      proves: "The product can turn a brief into a squad decision, competitive angle, and next action.",
      userValue: "The core value is executable logic, not static marketing copy."
    },
    {
      id: "judge-snapshot",
      label: "Judge Snapshot",
      url: `${baseUrl}/judge-snapshot`,
      command: `curl -s ${baseUrl}/judge-snapshot`,
      proves: "The public review surface explains AI centrality, usability, practicality, and implementation proof.",
      userValue: "A reviewer gets the shortest path to understand why the product matters."
    },
    {
      id: "ci-workflow",
      label: "GitHub Actions CI",
      url: mission.submissionPack.ciWorkflowUrl,
      command: commandForPath(mission.verificationCommands, "api.github.com/repos", "Open the public GitHub Actions workflow run."),
      proves: "The repository has repeatable typecheck, test, build, and architecture checks.",
      userValue: "The product can survive change after the hackathon demo."
    },
    {
      id: "submission-assets",
      label: "Submission Room",
      url: `${baseUrl}/submission-assets`,
      command: `curl -s ${baseUrl}/submission-assets`,
      proves: "The story, video plan, architecture, review path, and submission blockers are generated in one public room.",
      userValue: "The launch workflow is understandable without asking the builder for context."
    },
    {
      id: "submission-assets-json",
      label: "Submission JSON",
      url: jsonEndpoint,
      command: `curl -s ${jsonEndpoint}`,
      proves: "The same submission room is available as structured evidence for external validators and agent readers.",
      userValue: "Reviewers and automation can compare the public page with the machine-readable proof contract."
    }
  ];
  const claimProofMatrix: SubmissionClaimProof[] = [
    {
      id: "ai-agent-centrality",
      criterion: "AI agent centrality",
      claim: "The agent is the operating core, not a decorative chat layer.",
      proofLabel: "A2A Agent Card",
      proofUrl: `${baseUrl}/.well-known/agent-card.json`,
      evidence: `${mission.decisions.length} autonomous decisions and ${completedStepCount}/${mission.steps.length} mission steps are exposed from the public proof room.`,
      userValue: "A platform team can inspect the agent surface before trusting the workflow.",
      status: "proven"
    },
    {
      id: "approach-story",
      criterion: "Problem approach",
      claim: "The story connects one painful DevOps workflow to a buyer-reviewable AI pilot.",
      proofLabel: "Judge Snapshot",
      proofUrl: `${baseUrl}/judge-snapshot`,
      evidence: `The submission story has ${story.length} focused beats and the weakest judging criterion is ${mission.weakestCriterion.label}.`,
      userValue: "A reviewer can understand the product thesis without a private walkthrough.",
      status: "proven"
    },
    {
      id: "usability",
      criterion: "Usability",
      claim: "The first review path is explicit and short enough to follow in minutes.",
      proofLabel: "Submission Room",
      proofUrl: `${baseUrl}/submission-assets`,
      evidence: `Reviewer path has ${reviewerPath.length} ordered steps and ${requirements.length} requirements with blockers separated.`,
      userValue: "A user can find the live product, proof snapshot, and recording flow without hunting through the app.",
      status: "proven"
    },
    {
      id: "practical-value",
      criterion: "Practical value",
      claim: "The product proves a live buyer workflow instead of presenting a static concept demo.",
      proofLabel: "MVP Readiness",
      proofUrl: `${baseUrl}/mvp-readiness`,
      evidence: `${proofReadiness.readyCount}/${proofReadiness.totalCount} submission requirements are ready, with public blockers made explicit.`,
      userValue: "A buyer sees what is usable now and what still blocks public submission.",
      status: readiness === "assets-ready" ? "proven" : "watch"
    },
    {
      id: "implementation",
      criterion: "Implementation depth",
      claim: "The release has inspectable Cloud Run, CI, Agent Card, and structured proof contracts.",
      proofLabel: "Submission JSON",
      proofUrl: jsonEndpoint,
      evidence: `${mission.verificationCommands.length} verification commands and ${evidenceChain.length} evidence-chain checks are published as HTML and JSON.`,
      userValue: "External validators can compare the visible page with a machine-readable proof contract.",
      status: "proven"
    }
  ];

  return {
    id: `submission-assets-${readiness}`,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    readiness,
    headline:
      readiness === "assets-ready"
        ? "ProtoPedia提出素材は外部URLまで揃っています。"
        : "ProtoPedia提出素材は揃っています。外部URLだけを最後に閉じます。",
    hardTruth:
      readiness === "assets-ready"
        ? "提出フォームへ貼るURL、動画、タグ、構成図を同じ証拠ページから確認できます。"
        : "コード側で生成できる動画台本、構成図、ストーリー、タグは揃っています。残りはProtoPedia作品URLと動画URLの外部公開です。",
    jsonEndpoint,
    valueSnapshot: {
      audience: "Platform and DevOps teams deciding whether an AI agent can own one production workflow.",
      pain: "Most agent demos show a busy interface but hide deployment proof, delegation proof, and the commercial decision rule.",
      promise: "This room turns one Cloud Run + A2A pilot into an inspectable buyer packet: live URL, Agent Card, CI proof, story, video plan, and stop/continue evidence.",
      proofMoment: `${completedStepCount}/${mission.steps.length} mission steps completed with ${mission.decisions.length} autonomous agent decisions.`
    },
    proofReadiness,
    reviewerPath,
    agentDecisionProof,
    claimProofMatrix,
    evidenceChain,
    title: mission.submissionPack.protopediaTitle,
    tags,
    story,
    demoScript: mission.submissionPack.demoScript,
    architecture: {
      diagramUrl: architectureUrl,
      bullets: mission.submissionPack.architectureBullets
    },
    videoStoryboard: mission.submissionPack.videoStoryboard,
    requirements,
    links: [
      {
        id: "github",
        label: "Public GitHub",
        url: mission.submissionPack.publicGitHubUrl,
        status: linkStatus(mission.submissionPack.publicGitHubUrl),
        purpose: "提出フォームへ貼る公開リポジトリ。"
      },
      {
        id: "cloud-run",
        label: "Cloud Run",
        url: mission.submissionPack.deployedUrl,
        status: linkStatus(mission.submissionPack.deployedUrl),
        purpose: "動作確認用の公開URL。"
      },
      {
        id: "ci",
        label: "GitHub Actions CI",
        url: mission.submissionPack.ciWorkflowUrl,
        status: linkStatus(mission.submissionPack.ciWorkflowUrl),
        purpose: "typecheck/test/build/architecture checkの公開証跡。"
      },
      {
        id: "architecture",
        label: "System Architecture",
        url: architectureUrl,
        status: "ready",
        purpose: "ProtoPediaに貼るシステム構成図。"
      },
      {
        id: "story",
        label: "Story Markdown",
        url: storyUrl,
        status: "ready",
        purpose: "課題、対象ユーザー、特徴を含む本文下書き。"
      },
      {
        id: "judge-snapshot",
        label: "Judge Snapshot",
        url: `${baseUrl}/judge-snapshot`,
        status: "ready",
        purpose: "審査員が直接読む証拠ページ。"
      },
      {
        id: "mvp-readiness",
        label: "MVP Readiness",
        url: `${baseUrl}/mvp-readiness`,
        status: "ready",
        purpose: "MVP本体、外部gap、公開revisionの提出可否ページ。"
      },
      {
        id: "recording-script",
        label: "Recording Script",
        url: `${baseUrl}/recording-script`,
        status: "ready",
        purpose: "30秒動画の録画台本、字幕、証拠リンク、公開手順。"
      }
    ],
    pasteFields: [
      { id: "title", label: "作品タイトル", value: mission.submissionPack.protopediaTitle, target: "ProtoPedia title" },
      { id: "tags", label: "タグ", value: tags.join(", "), target: "ProtoPedia tags" },
      { id: "story", label: "ストーリー", value: mission.submissionPack.story, target: "ProtoPedia story" },
      { id: "demo", label: "デモ説明", value: mission.submissionPack.demoScript, target: "ProtoPedia description / video script" },
      { id: "github", label: "GitHub URL", value: mission.submissionPack.publicGitHubUrl, target: "Findy submission form" },
      { id: "cloud-run", label: "デプロイ済みURL", value: mission.submissionPack.deployedUrl, target: "Findy submission form" }
    ]
  };
}

function statusTone(status: string) {
  return status === "ready" || status === "assets-ready" || status === "proven" ? "good" : "watch";
}

export function renderSubmissionAssetsHtml(page: SubmissionAssetsPage) {
  const story = page.story.map((line) => `<li>${escapeHtml(line)}</li>`).join("");
  const tags = page.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  const valueSnapshot = `
        <article>
          <span>Audience</span>
          <strong>${escapeHtml(page.valueSnapshot.audience)}</strong>
        </article>
        <article>
          <span>Pain</span>
          <strong>${escapeHtml(page.valueSnapshot.pain)}</strong>
        </article>
        <article>
          <span>Value</span>
          <strong>${escapeHtml(page.valueSnapshot.promise)}</strong>
        </article>
        <article>
          <span>Proof moment</span>
          <strong>${escapeHtml(page.valueSnapshot.proofMoment)}</strong>
        </article>`;
  const proofBlockers =
    page.proofReadiness.blockers.length > 0
      ? page.proofReadiness.blockers
          .map(
            (blocker) => `
          <li>
            <strong>${escapeHtml(blocker.label)}</strong>
            <span>${escapeHtml(blocker.proof)}</span>
          </li>`
          )
          .join("")
      : `<li><strong>External submission proof</strong><span>All required public submission URLs are attached.</span></li>`;
  const reviewerPath = page.reviewerPath
    .map(
      (item, index) => `
        <a class="review-step" href="${escapeHtml(item.href)}">
          <span>${String(index + 1).padStart(2, "0")}</span>
          <strong>${escapeHtml(item.label)}</strong>
          <small>${escapeHtml(item.proof)}</small>
        </a>`
    )
    .join("");
  const agentDecisionProof = page.agentDecisionProof
    .map(
      (decision) => `
        <article class="decision-proof">
          <div>
            <span>${escapeHtml(decision.actor)}</span>
            <strong>${escapeHtml(decision.target)}</strong>
            <b>${escapeHtml(decision.confidence)}%</b>
          </div>
          <p>${escapeHtml(decision.rationale)}</p>
          <small>${escapeHtml(decision.evidence)}</small>
        </article>`
    )
    .join("");
  const claimProofMatrix = page.claimProofMatrix
    .map(
      (item) => `
        <article class="claim-row ${statusTone(item.status)}">
          <div>
            <span>${escapeHtml(item.criterion)}</span>
            <strong>${escapeHtml(item.claim)}</strong>
          </div>
          <a href="${escapeHtml(item.proofUrl)}">${escapeHtml(item.proofLabel)}</a>
          <p>${escapeHtml(item.evidence)}</p>
          <small>${escapeHtml(item.userValue)}</small>
        </article>`
    )
    .join("");
  const evidenceChain = page.evidenceChain
    .map(
      (item) => `
        <article class="evidence-chain-row">
          <div>
            <span>${escapeHtml(item.label)}</span>
            <a href="${escapeHtml(item.url)}">${escapeHtml(item.url)}</a>
          </div>
          <p>${escapeHtml(item.proves)}</p>
          <small>${escapeHtml(item.userValue)}</small>
          <pre>${escapeHtml(item.command)}</pre>
        </article>`
    )
    .join("");
  const links = page.links
    .map(
      (link) => `
        <a class="link-row ${statusTone(link.status)}" href="${escapeHtml(link.url)}">
          <strong>${escapeHtml(link.label)}</strong>
          <span>${escapeHtml(link.status)}</span>
          <small>${escapeHtml(link.purpose)}</small>
        </a>`
    )
    .join("");
  const requirements = page.requirements
    .map(
      (item) => `
        <article class="requirement ${statusTone(item.status)}">
          <div><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.status)}</span></div>
          <p>${escapeHtml(item.proof)}</p>
        </article>`
    )
    .join("");
  const storyboard = page.videoStoryboard.map((shot) => `<li>${escapeHtml(shot)}</li>`).join("");
  const architectureBullets = page.architecture.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("");
  const pasteFields = page.pasteFields
    .map(
      (field) => `
        <article class="paste-field">
          <div><strong>${escapeHtml(field.label)}</strong><span>${escapeHtml(field.target)}</span></div>
          <pre>${escapeHtml(field.value)}</pre>
        </article>`
    )
    .join("");

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Submission Assets</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #17201d;
        --muted: #5f6965;
        --line: #dce5df;
        --paper: #fbfcfa;
        --panel: #ffffff;
        --green: #13715d;
        --mint: #e6f4ed;
        --amber: #8a620d;
        --amber-bg: #fff4d4;
        --blue: #245c99;
        --blue-bg: #eaf2fb;
        --charcoal: #1e2522;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--paper);
        color: var(--ink);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.55;
      }
      a { color: inherit; }
      header, main, footer { width: min(1120px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 40px 0 20px; }
      .eyebrow { color: var(--green); font-size: 0.78rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0; }
      h1 { margin: 8px 0 10px; font-size: clamp(2rem, 5vw, 4.5rem); line-height: 1; letter-spacing: 0; max-width: 900px; }
      header p { color: var(--muted); max-width: 760px; }
      .machine-link {
        display: inline-flex;
        align-items: center;
        margin-top: 10px;
        border: 1px solid #b9dfd1;
        border-radius: 999px;
        background: #fff;
        color: var(--green);
        padding: 7px 11px;
        font-size: 0.84rem;
        font-weight: 900;
        text-decoration: none;
      }
      .tag-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
      .tag-row span { border: 1px solid #b9dfd1; background: var(--mint); border-radius: 999px; padding: 5px 10px; font-size: 0.82rem; font-weight: 800; }
      .section, .requirement, .paste-field, .link-row, .value-grid article, .review-step, .decision-proof, .claim-row, .evidence-chain-row {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 8px;
        box-shadow: 0 1px 0 rgba(23, 32, 29, 0.03);
      }
      .section { padding: 18px; margin: 14px 0; }
      .section h2 { margin: 0 0 12px; font-size: 1.05rem; }
      .proof-brief {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(280px, 0.48fr);
        gap: 14px;
        align-items: stretch;
      }
      .value-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      .value-grid article { padding: 14px; display: grid; gap: 8px; }
      .value-grid span, .proof-score span, .review-step span, .decision-proof span {
        color: var(--green);
        font-size: 0.74rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0;
      }
      .value-grid strong { font-size: 0.98rem; line-height: 1.38; }
      .proof-score {
        border: 1px solid #b9dfd1;
        border-radius: 8px;
        background: var(--mint);
        padding: 16px;
        display: grid;
        align-content: start;
        gap: 10px;
      }
      .proof-score > strong { font-size: clamp(2rem, 6vw, 4rem); line-height: 1; }
      .proof-score li strong { display: block; font-size: 0.95rem; line-height: 1.3; }
      .proof-score p { margin: 0; color: var(--muted); }
      .proof-score ul { padding-left: 18px; }
      .proof-score li span { display: block; color: var(--muted); }
      .review-path { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
      .review-step { padding: 12px; text-decoration: none; display: grid; gap: 7px; }
      .review-step small { color: var(--muted); }
      .decision-rail { display: grid; gap: 10px; }
      .decision-proof { padding: 12px; border-left: 4px solid var(--blue); }
      .decision-proof div { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 6px 10px; align-items: start; }
      .decision-proof div span { grid-column: 1 / -1; color: var(--blue); }
      .decision-proof b {
        border-radius: 999px;
        background: var(--blue-bg);
        color: var(--blue);
        padding: 3px 8px;
        font-size: 0.78rem;
      }
      .decision-proof p { margin: 8px 0; color: var(--charcoal); }
      .decision-proof small { color: var(--muted); }
      .claim-matrix { display: grid; gap: 10px; }
      .claim-row {
        display: grid;
        grid-template-columns: minmax(220px, 0.7fr) minmax(140px, 0.32fr) minmax(0, 1fr) minmax(0, 0.78fr);
        gap: 12px;
        align-items: start;
        padding: 12px;
        border-left: 4px solid var(--blue);
      }
      .claim-row.watch { border-left-color: var(--amber); }
      .claim-row div { display: grid; gap: 5px; }
      .claim-row span {
        color: var(--blue);
        font-size: 0.74rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0;
      }
      .claim-row.watch span { color: var(--amber); }
      .claim-row strong { line-height: 1.35; }
      .claim-row a {
        justify-self: start;
        border: 1px solid #b9cde1;
        border-radius: 999px;
        background: var(--blue-bg);
        color: var(--blue);
        padding: 5px 9px;
        font-size: 0.8rem;
        font-weight: 900;
        text-decoration: none;
      }
      .claim-row.watch a {
        border-color: #e3ca80;
        background: var(--amber-bg);
        color: var(--amber);
      }
      .claim-row p { margin: 0; color: var(--charcoal); }
      .claim-row small { color: var(--muted); }
      .evidence-chain { display: grid; gap: 10px; }
      .evidence-chain-row {
        display: grid;
        grid-template-columns: minmax(210px, 0.45fr) minmax(0, 1fr) minmax(0, 0.82fr);
        gap: 12px;
        align-items: start;
        padding: 12px;
        border-left: 4px solid var(--green);
      }
      .evidence-chain-row div { display: grid; gap: 5px; }
      .evidence-chain-row span {
        color: var(--green);
        font-size: 0.74rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0;
      }
      .evidence-chain-row a { overflow-wrap: anywhere; font-weight: 850; }
      .evidence-chain-row p { margin: 0; color: var(--charcoal); }
      .evidence-chain-row small { color: var(--muted); }
      .evidence-chain-row pre { margin: 0; }
      .links-grid, .requirements-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
      .link-row { display: grid; gap: 5px; padding: 12px; text-decoration: none; }
      .link-row span, .requirement span, .paste-field span { color: var(--green); font-size: 0.75rem; font-weight: 900; }
      .link-row.watch span, .requirement.watch span { color: var(--amber); }
      .link-row small { color: var(--muted); }
      .story-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 0.78fr); gap: 18px; align-items: start; }
      img { width: 100%; height: auto; border: 1px solid var(--line); border-radius: 8px; background: #fff; }
      ul, ol { margin: 0; padding-left: 22px; color: var(--muted); }
      li + li { margin-top: 8px; }
      .requirements-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .requirement, .paste-field { padding: 12px; }
      .requirement div, .paste-field div { display: flex; justify-content: space-between; gap: 10px; }
      .requirement p { color: var(--muted); margin: 8px 0 0; }
      .paste-field { margin: 10px 0; }
      pre { white-space: pre-wrap; overflow-wrap: anywhere; margin: 8px 0 0; padding: 10px; border-radius: 8px; background: #17201d; color: #eef8f4; font-size: 0.82rem; }
      footer { color: var(--muted); font-size: 0.84rem; padding: 10px 0 36px; }
      @media (max-width: 760px) {
        header { padding-top: 28px; }
        .links-grid, .requirements-grid, .story-grid, .proof-brief, .value-grid, .review-path, .claim-row, .evidence-chain-row { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <header>
      <div class="eyebrow">Submission Assets</div>
      <h1>${escapeHtml(page.headline)}</h1>
      <p>${escapeHtml(page.hardTruth)}</p>
      <a class="machine-link" href="${escapeHtml(page.jsonEndpoint)}">Machine-readable JSON</a>
      <div class="tag-row">${tags}</div>
    </header>
    <main>
      <section class="section proof-brief">
        <div>
          <h2>Value In One Minute</h2>
          <div class="value-grid">${valueSnapshot}</div>
        </div>
        <aside class="proof-score" aria-label="Submission proof readiness">
          <span>Proof readiness</span>
          <strong>${escapeHtml(page.proofReadiness.readyCount)}/${escapeHtml(page.proofReadiness.totalCount)}</strong>
          <p>${escapeHtml(page.proofReadiness.scoreLabel)}. Public submission requirements are attached or generated.</p>
          <ul>${proofBlockers}</ul>
        </aside>
      </section>
      <section class="section">
        <h2>Claim-To-Proof Matrix</h2>
        <div class="claim-matrix">${claimProofMatrix}</div>
      </section>
      <section class="section">
        <h2>Reviewer Path</h2>
        <div class="review-path">${reviewerPath}</div>
      </section>
      <section class="section">
        <h2>AI Agent Proof</h2>
        <div class="decision-rail">${agentDecisionProof}</div>
      </section>
      <section class="section">
        <h2>Live Evidence Chain</h2>
        <div class="evidence-chain">${evidenceChain}</div>
      </section>
      <section class="section">
        <h2>First Submit Links</h2>
        <div class="links-grid">${links}</div>
      </section>
      <section class="section">
        <h2>ProtoPedia Story</h2>
        <div class="story-grid">
          <div>
            <strong>${escapeHtml(page.title)}</strong>
            <ul>${story}</ul>
            <p>${escapeHtml(page.demoScript)}</p>
          </div>
          <img src="${escapeHtml(page.architecture.diagramUrl)}" alt="Agent-To-Agent Marketplace architecture" />
        </div>
      </section>
      <section class="section">
        <h2>Architecture Bullets</h2>
        <ul>${architectureBullets}</ul>
      </section>
      <section class="section">
        <h2>30 Second Video Storyboard</h2>
        <ol>${storyboard}</ol>
      </section>
      <section class="section">
        <h2>Submission Requirements</h2>
        <div class="requirements-grid">${requirements}</div>
      </section>
      <section class="section">
        <h2>Paste Fields</h2>
        ${pasteFields}
      </section>
    </main>
    <footer>${escapeHtml(page.id)} / generated ${escapeHtml(page.generatedAt)}</footer>
  </body>
</html>`;
}
