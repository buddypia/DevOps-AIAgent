import type { MissionRun, SubmissionRequirement } from "./mission.js";

export type SubmissionAssetStatus = "ready" | "watch";

export type SubmissionAssetLink = {
  id: string;
  label: string;
  url: string;
  status: SubmissionAssetStatus;
  purpose: string;
};

export type SubmissionAssetsPage = {
  id: string;
  generatedAt: string;
  readiness: "assets-ready-external-watch" | "assets-ready";
  headline: string;
  hardTruth: string;
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

export function buildSubmissionAssetsPage(input: { baseUrl: string; mission: MissionRun; generatedAt?: string }): SubmissionAssetsPage {
  const { mission } = input;
  const baseUrl = normalizeBase(input.baseUrl);
  const readiness = readinessFrom(mission.submissionPack.requirements);
  const architectureUrl = absoluteUrl(baseUrl, mission.submissionPack.architectureDiagramUrl);
  const storyUrl = absoluteUrl(baseUrl, mission.submissionPack.storyMarkdownPath);
  const tags = mission.submissionPack.tags;

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
    title: mission.submissionPack.protopediaTitle,
    tags,
    story: mission.submissionPack.story.split("\n").filter(Boolean),
    demoScript: mission.submissionPack.demoScript,
    architecture: {
      diagramUrl: architectureUrl,
      bullets: mission.submissionPack.architectureBullets
    },
    videoStoryboard: mission.submissionPack.videoStoryboard,
    requirements: mission.submissionPack.requirements,
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
  return status === "ready" || status === "assets-ready" ? "good" : "watch";
}

export function renderSubmissionAssetsHtml(page: SubmissionAssetsPage) {
  const story = page.story.map((line) => `<li>${escapeHtml(line)}</li>`).join("");
  const tags = page.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
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
      .tag-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
      .tag-row span { border: 1px solid #b9dfd1; background: var(--mint); border-radius: 999px; padding: 5px 10px; font-size: 0.82rem; font-weight: 800; }
      .section, .requirement, .paste-field, .link-row {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 8px;
        box-shadow: 0 1px 0 rgba(23, 32, 29, 0.03);
      }
      .section { padding: 18px; margin: 14px 0; }
      .section h2 { margin: 0 0 12px; font-size: 1.05rem; }
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
        .links-grid, .requirements-grid, .story-grid { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <header>
      <div class="eyebrow">Submission Assets</div>
      <h1>${escapeHtml(page.headline)}</h1>
      <p>${escapeHtml(page.hardTruth)}</p>
      <div class="tag-row">${tags}</div>
    </header>
    <main>
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
