import type { DemoRunway } from "./demoRunway.js";
import type { PitchRun } from "./pitch.js";
import type { CloseoutVideoLockCheck, CloseoutVideoStep, SubmissionCloseoutWorkbench } from "./submissionCloseout.js";

export type RecordingScriptReadiness = "recording-ready" | "recording-external-watch" | "recording-blocked";

export type RecordingScriptLink = {
  id: string;
  label: string;
  method: "GET" | "POST";
  url: string;
  purpose: string;
};

export type RecordingScriptChapter = CloseoutVideoStep & {
  caption: string;
  operatorCue: string;
};

export type RecordingScriptPage = {
  id: string;
  generatedAt: string;
  readiness: RecordingScriptReadiness;
  headline: string;
  hardTruth: string;
  summary: {
    pitchScore: number;
    demoScore: number;
    closeoutScore: number;
    videoLockReadiness: SubmissionCloseoutWorkbench["videoProofLock"]["readiness"];
    targetDurationSeconds: number;
    chapterCount: number;
    proofLinkCount: number;
    externalGapCount: number;
    publishTarget: string;
  };
  links: RecordingScriptLink[];
  chapters: RecordingScriptChapter[];
  voiceoverScript: string;
  lowerThirds: string[];
  proofLinks: DemoRunway["proofLinks"];
  videoChecks: CloseoutVideoLockCheck[];
  publishSteps: Array<{ id: string; label: string; status: "ready" | "watch" | "blocked"; action: string; proof: string; url: string }>;
  a2aPayload: Record<string, unknown>;
};

function normalizeBase(url: string) {
  return url.replace(/\/$/, "");
}

function endpoint(baseUrl: string, path: string) {
  return `${normalizeBase(baseUrl)}${path}`;
}

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function readinessFrom(closeout: SubmissionCloseoutWorkbench): RecordingScriptReadiness {
  if (closeout.videoProofLock.readiness === "blocked-video-url") return "recording-blocked";
  if (closeout.videoProofLock.readiness === "video-url-ready") return "recording-ready";
  return "recording-external-watch";
}

function headlineFor(readiness: RecordingScriptReadiness) {
  if (readiness === "recording-ready") return "30秒動画の台本、公開URL、提出handoffまで揃っています。";
  if (readiness === "recording-external-watch") return "30秒動画の録画台本はロック済みです。公開URLだけを最後に貼ります。";
  return "動画URLまたは録画証拠に不正があります。提出前に直します。";
}

function hardTruthFor(readiness: RecordingScriptReadiness) {
  if (readiness === "recording-ready") return "審査員が見る映像、説明欄、ProtoPedia貼付先が同じ証拠で閉じています。";
  if (readiness === "recording-external-watch") return "コード側で台本を生成しても、YouTube/Vimeo URLが未発行なら提出物は完成しません。録画担当者がこのページだけで撮れる状態にします。";
  return "Google Driveや不正URLのままではFinal Submit Lockに通りません。YouTubeまたはVimeoのhttps URLへ置き換えます。";
}

function chapterCue(step: CloseoutVideoStep, index: number) {
  if (index === 0) return "最初の画面は公開URLまたはJudge Proofにして、ローカル録画ではないことを見せる。";
  if (step.screen.includes("Competitive")) return "競合への反論は短く、source/SWOT/proof routeの順で読む。";
  if (step.screen.includes("Submission")) return "最後は提出先と未発行URLを正直に示す。";
  return "画面を動かしすぎず、台詞と証拠URLを一致させる。";
}

export function buildRecordingScriptPage(input: {
  baseUrl: string;
  pitch: PitchRun;
  demoRunway: DemoRunway;
  closeout: SubmissionCloseoutWorkbench;
  generatedAt?: string;
}): RecordingScriptPage {
  const baseUrl = normalizeBase(input.baseUrl);
  const readiness = readinessFrom(input.closeout);
  const captions = new Map(input.closeout.videoProofLock.captions.map((caption) => [caption.timeRange, caption.text]));
  const chapters: RecordingScriptChapter[] = input.closeout.videoSteps.map((step, index) => ({
    ...step,
    caption: captions.get(step.timeRange) ?? step.narration,
    operatorCue: chapterCue(step, index)
  }));
  const externalGapCount = input.closeout.workItems.filter((item) => ["record-video", "publish-protopedia", "seal-launch-gate"].includes(item.id) && item.status !== "ready").length;
  const publishSteps: RecordingScriptPage["publishSteps"] = [
    {
      id: "record",
      label: "Record 30-second reel",
      status: input.closeout.videoProofLock.readiness === "needs-recording-proof" || input.closeout.videoProofLock.readiness === "blocked-video-url" ? "watch" : "ready",
      action: "このページの章順で画面を録画し、冒頭に公開証拠、中央に競合/SWOT、最後に提出handoffを入れる。",
      proof: `${chapters.length} chapters / ${input.closeout.videoProofLock.targetDurationSeconds}s`,
      url: endpoint(baseUrl, "/recording-script")
    },
    {
      id: "publish-video",
      label: "Publish YouTube or Vimeo URL",
      status: input.closeout.workItems.find((item) => item.id === "record-video")?.status ?? "watch",
      action: "録画後、YouTubeまたはVimeoへ公開し、共有可能なhttps URLを控える。",
      proof: input.closeout.workItems.find((item) => item.id === "record-video")?.proof ?? "動画URLが未入力です。",
      url: endpoint(baseUrl, "/api/submission-launch")
    },
    {
      id: "paste-protopedia",
      label: "Paste video into ProtoPedia",
      status: input.closeout.protopediaPolicyLock.checks.find((check) => check.id === "embeddable-media")?.status === "ready" ? "ready" : "watch",
      action: "ProtoPedia作品ページの動画/説明欄へ動画URL、caption、Judge Proof digestを貼る。",
      proof: input.closeout.protopediaPolicyLock.checks.find((check) => check.id === "embeddable-media")?.proof ?? "ProtoPedia media slot remains watch.",
      url: endpoint(baseUrl, "/submission-assets")
    },
    {
      id: "seal-launch",
      label: "Seal launch gate",
      status: input.closeout.workItems.find((item) => item.id === "seal-launch-gate")?.status ?? "watch",
      action: "ProtoPedia URLと動画URLをSubmission Launch Gateに入れ、submit-readyまで確認する。",
      proof: input.closeout.submitPacket.submitterMemo,
      url: endpoint(baseUrl, "/api/submission-launch")
    }
  ];

  return {
    id: `recording-script-${input.closeout.videoProofLock.lockScore}-${readiness}`,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    readiness,
    headline: headlineFor(readiness),
    hardTruth: hardTruthFor(readiness),
    summary: {
      pitchScore: input.pitch.readinessScore,
      demoScore: input.demoRunway.demoScore,
      closeoutScore: input.closeout.closeoutScore,
      videoLockReadiness: input.closeout.videoProofLock.readiness,
      targetDurationSeconds: input.closeout.videoProofLock.targetDurationSeconds,
      chapterCount: chapters.length,
      proofLinkCount: input.demoRunway.proofLinks.length,
      externalGapCount,
      publishTarget: input.closeout.videoProofLock.publishTarget
    },
    links: [
      {
        id: "recording-script",
        label: "Recording Script",
        method: "GET",
        url: endpoint(baseUrl, "/recording-script"),
        purpose: "録画担当者が直接読む30秒動画台本。"
      },
      {
        id: "recording-script-json",
        label: "Recording Script JSON",
        method: "GET",
        url: endpoint(baseUrl, "/api/recording-script"),
        purpose: "A2Aや自動検証で読む動画台本JSON。"
      },
      {
        id: "submission-assets",
        label: "Submission Assets",
        method: "GET",
        url: endpoint(baseUrl, "/submission-assets"),
        purpose: "ProtoPedia本文、構成図、タグ、提出URLを確認する。"
      },
      {
        id: "mvp-readiness",
        label: "MVP Readiness",
        method: "GET",
        url: endpoint(baseUrl, "/mvp-readiness"),
        purpose: "MVP本体と公開revisionの提出可否を確認する。"
      },
      {
        id: "demo-runway",
        label: "Demo Runway",
        method: "POST",
        url: endpoint(baseUrl, "/api/demo-run"),
        purpose: "30秒デモ順と証拠リンクを再生成する。"
      },
      {
        id: "submission-closeout",
        label: "Submission Closeout",
        method: "POST",
        url: endpoint(baseUrl, "/api/submission-closeout"),
        purpose: "Video Proof Lockと外部提出gapを再確認する。"
      }
    ],
    chapters,
    voiceoverScript: input.pitch.voiceoverScript,
    lowerThirds: input.pitch.lowerThirds,
    proofLinks: input.demoRunway.proofLinks,
    videoChecks: input.closeout.videoProofLock.checks,
    publishSteps,
    a2aPayload: {
      method: "message/send",
      skill: "recording.script",
      readiness,
      targetDurationSeconds: input.closeout.videoProofLock.targetDurationSeconds,
      chapterCount: chapters.length,
      videoLockReadiness: input.closeout.videoProofLock.readiness,
      externalGapCount,
      chapters: chapters.map((chapter) => ({
        id: chapter.id,
        timeRange: chapter.timeRange,
        screen: chapter.screen,
        status: chapter.status,
        evidenceUrl: chapter.evidenceUrl
      })),
      endpoints: {
        recordingScript: endpoint(baseUrl, "/recording-script"),
        recordingScriptJson: endpoint(baseUrl, "/api/recording-script"),
        submissionAssets: endpoint(baseUrl, "/submission-assets"),
        mvpReadiness: endpoint(baseUrl, "/mvp-readiness"),
        submissionCloseout: endpoint(baseUrl, "/api/submission-closeout"),
        demoRunway: endpoint(baseUrl, "/api/demo-run")
      }
    }
  };
}

function statusTone(status: string) {
  if (["recording-ready", "video-url-ready", "ready"].includes(status)) return "good";
  if (["recording-blocked", "blocked", "blocked-video-url"].includes(status)) return "bad";
  return "watch";
}

function renderLinkList(links: RecordingScriptLink[]) {
  return links
    .map(
      (link) => `
        <a class="link-row" href="${escapeHtml(link.url)}">
          <span>${escapeHtml(link.method)}</span>
          <strong>${escapeHtml(link.label)}</strong>
          <small>${escapeHtml(link.purpose)}</small>
        </a>`
    )
    .join("");
}

export function renderRecordingScriptHtml(page: RecordingScriptPage) {
  const chapters = page.chapters
    .map(
      (chapter) => `
        <article class="chapter ${statusTone(chapter.status)}">
          <div><span>${escapeHtml(chapter.timeRange)}</span><strong>${escapeHtml(chapter.screen)}</strong><b>${escapeHtml(chapter.status)}</b></div>
          <p>${escapeHtml(chapter.narration)}</p>
          <em>${escapeHtml(chapter.caption)}</em>
          <small>${escapeHtml(chapter.operatorCue)}</small>
          <a href="${escapeHtml(chapter.evidenceUrl)}">Open proof</a>
        </article>`
    )
    .join("");
  const checks = page.videoChecks
    .map(
      (check) => `
        <article class="check ${statusTone(check.status)}">
          <div><strong>${escapeHtml(check.label)}</strong><span>${escapeHtml(check.status)}</span></div>
          <p>${escapeHtml(check.proof)}</p>
          <small>${escapeHtml(check.acceptance)}</small>
          <a href="${escapeHtml(check.evidenceUrl)}">Open proof</a>
        </article>`
    )
    .join("");
  const proofLinks = page.proofLinks
    .map(
      (link) => `
        <a class="proof-link" href="${escapeHtml(link.url)}">
          <strong>${escapeHtml(link.label)}</strong>
          <small>${escapeHtml(link.proof)}</small>
        </a>`
    )
    .join("");
  const publishSteps = page.publishSteps
    .map(
      (step) => `
        <article class="publish-step ${statusTone(step.status)}">
          <div><strong>${escapeHtml(step.label)}</strong><span>${escapeHtml(step.status)}</span></div>
          <p>${escapeHtml(step.action)}</p>
          <small>${escapeHtml(step.proof)}</small>
          <a href="${escapeHtml(step.url)}">Open target</a>
        </article>`
    )
    .join("");
  const lowerThirds = page.lowerThirds.map((line) => `<span>${escapeHtml(line)}</span>`).join("");

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Recording Script</title>
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
        --coral: #b24735;
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
      header, main, footer { width: min(1160px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 40px 0 20px; }
      .eyebrow { color: var(--green); font-size: 0.78rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0; }
      h1 { margin: 8px 0 10px; font-size: clamp(2rem, 5vw, 4.45rem); line-height: 1; letter-spacing: 0; max-width: 940px; }
      header p { color: var(--muted); max-width: 820px; }
      .metric-grid, .links-grid, .chapter-grid, .check-grid, .proof-grid, .publish-grid {
        display: grid;
        gap: 12px;
      }
      .metric-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); margin-top: 22px; }
      .metric, .section, .chapter, .check, .proof-link, .publish-step {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 8px;
        box-shadow: 0 1px 0 rgba(23, 32, 29, 0.03);
      }
      .metric { padding: 14px; min-width: 0; }
      .metric span { display: block; color: var(--muted); font-size: 0.75rem; font-weight: 800; }
      .metric strong { display: block; margin-top: 4px; font-size: 1.35rem; line-height: 1.05; overflow-wrap: anywhere; }
      .metric.good, .chapter.good, .check.good, .publish-step.good { background: var(--mint); border-color: #b9dfd1; }
      .metric.watch, .chapter.watch, .check.watch, .publish-step.watch { background: var(--amber-bg); border-color: #ecd58c; }
      .metric.bad, .chapter.bad, .check.bad, .publish-step.bad { background: #ffe4de; border-color: #efb2a6; }
      .section { padding: 18px; margin: 14px 0; }
      .section h2 { margin: 0 0 12px; font-size: 1.05rem; }
      .links-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .link-row, .proof-link { display: grid; gap: 4px; padding: 12px; text-decoration: none; }
      .link-row span { color: var(--blue); font-size: 0.72rem; font-weight: 900; }
      .link-row small, .proof-link small { color: var(--muted); }
      .tag-row { display: flex; flex-wrap: wrap; gap: 8px; }
      .tag-row span { border: 1px solid #b9dfd1; background: var(--mint); border-radius: 999px; padding: 5px 10px; font-size: 0.82rem; font-weight: 800; }
      .chapter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .chapter, .check, .publish-step { padding: 12px; }
      .chapter div, .check div, .publish-step div { display: flex; gap: 10px; justify-content: space-between; align-items: center; }
      .chapter span, .chapter b, .check span, .publish-step span { color: var(--blue); font-size: 0.74rem; font-weight: 900; }
      .chapter p, .check p, .publish-step p { margin: 8px 0; color: var(--ink); }
      .chapter em { display: block; color: var(--green); font-style: normal; font-weight: 800; margin: 8px 0; }
      .chapter small, .check small, .publish-step small { display: block; color: var(--muted); overflow-wrap: anywhere; }
      .chapter a, .check a, .publish-step a { display: inline-block; margin-top: 8px; font-weight: 800; }
      .check-grid, .publish-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .proof-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      pre { white-space: pre-wrap; overflow-wrap: anywhere; margin: 0; padding: 12px; border-radius: 8px; background: #17201d; color: #eef8f4; font-size: 0.82rem; }
      footer { color: var(--muted); font-size: 0.84rem; padding: 10px 0 36px; }
      @media (max-width: 860px) {
        header { padding-top: 28px; }
        .metric-grid, .links-grid, .chapter-grid, .check-grid, .proof-grid, .publish-grid { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <header>
      <div class="eyebrow">Recording Script</div>
      <h1>${escapeHtml(page.headline)}</h1>
      <p>${escapeHtml(page.hardTruth)}</p>
      <div class="metric-grid">
        <div class="metric ${statusTone(page.readiness)}"><span>Readiness</span><strong>${escapeHtml(page.readiness)}</strong></div>
        <div class="metric good"><span>Duration</span><strong>${escapeHtml(page.summary.targetDurationSeconds)}s</strong></div>
        <div class="metric good"><span>Chapters</span><strong>${escapeHtml(page.summary.chapterCount)}</strong></div>
        <div class="metric ${statusTone(page.summary.videoLockReadiness)}"><span>Video Lock</span><strong>${escapeHtml(page.summary.videoLockReadiness)}</strong></div>
        <div class="metric ${page.summary.externalGapCount > 0 ? "watch" : "good"}"><span>External Gaps</span><strong>${escapeHtml(page.summary.externalGapCount)}</strong></div>
      </div>
    </header>
    <main>
      <section class="section">
        <h2>First-Click Links</h2>
        <div class="links-grid">${renderLinkList(page.links)}</div>
      </section>
      <section class="section">
        <h2>Lower Thirds</h2>
        <div class="tag-row">${lowerThirds}</div>
      </section>
      <section class="section">
        <h2>30-Second Chapters</h2>
        <div class="chapter-grid">${chapters}</div>
      </section>
      <section class="section">
        <h2>Voiceover Script</h2>
        <pre>${escapeHtml(page.voiceoverScript)}</pre>
      </section>
      <section class="section">
        <h2>Video Proof Lock</h2>
        <div class="check-grid">${checks}</div>
      </section>
      <section class="section">
        <h2>Publish Steps</h2>
        <div class="publish-grid">${publishSteps}</div>
      </section>
      <section class="section">
        <h2>Proof Links</h2>
        <div class="proof-grid">${proofLinks}</div>
      </section>
    </main>
    <footer>${escapeHtml(page.id)} / generated ${escapeHtml(page.generatedAt)}</footer>
  </body>
</html>`;
}
