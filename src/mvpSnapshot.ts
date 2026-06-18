import type { JudgeAcceptanceMatrix, AcceptanceRow } from "./acceptanceMatrix.js";
import type { DeployRecoveryPlan } from "./deployRecovery.js";
import type { MvpAuditGate, MvpAuditReport } from "./mvpAudit.js";
import type { ReleaseDriftGuard } from "./releaseDrift.js";

export type MvpSnapshotReadiness = "mvp-ready" | "mvp-ready-external-watch" | "mvp-release-drift" | "mvp-not-ready";

export type MvpSnapshotLink = {
  id: string;
  label: string;
  method: "GET" | "POST";
  url: string;
  purpose: string;
};

export type MvpSnapshotPostApi = MvpSnapshotLink & {
  curl: string;
};

export type MvpSnapshot = {
  id: string;
  generatedAt: string;
  readiness: MvpSnapshotReadiness;
  headline: string;
  hardTruth: string;
  summary: {
    mvpScore: number;
    mvpBand: MvpAuditReport["band"];
    acceptanceScore: number;
    acceptanceVerdict: JudgeAcceptanceMatrix["verdict"];
    acceptedRows: number;
    watchRows: number;
    blockedRows: number;
    externalGapCount: number;
    releaseVerdict: ReleaseDriftGuard["verdict"] | "not-run";
    deployRecoveryReadiness: DeployRecoveryPlan["readiness"] | "not-run";
  };
  links: MvpSnapshotLink[];
  gates: MvpAuditGate[];
  rows: AcceptanceRow[];
  releaseLock: {
    verdict: ReleaseDriftGuard["verdict"] | "not-run";
    targetBaseUrl: string;
    missingSkills: string[];
    missingAgentCardSignals: string[];
    probes: Array<{ id: string; status: string; score: number; url: string }>;
  };
  deployRecovery?: {
    readiness: DeployRecoveryPlan["readiness"];
    primaryAction: string;
    commands: DeployRecoveryPlan["commands"];
    blockers: DeployRecoveryPlan["blockers"];
  };
  postApis: MvpSnapshotPostApi[];
  judgeScript: string[];
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

function postCurl(url: string, projectBrief: string, selectedAgentIds: string[]) {
  const body = JSON.stringify({ projectBrief, selectedAgentIds });
  return `curl -s -X POST ${url} -H 'Content-Type: application/json' --data '${body}'`;
}

function externalGapCount(input: { mvpAudit: MvpAuditReport; acceptance: JudgeAcceptanceMatrix }) {
  const externalGateIds = new Set(["protopedia-url", "video-url"]);
  const externalRowIds = new Set(["submission-assets", "demo-receipt"]);
  const gateCount = input.mvpAudit.gates.filter((gate) => externalGateIds.has(gate.id) && gate.status !== "pass").length;
  const rowCount = input.acceptance.rows.filter((row) => externalRowIds.has(row.id) && row.status !== "accepted").length;
  return gateCount + rowCount;
}

function readinessFor(input: {
  mvpAudit: MvpAuditReport;
  acceptance: JudgeAcceptanceMatrix;
  releaseDrift?: ReleaseDriftGuard;
}): MvpSnapshotReadiness {
  const releaseRow = input.acceptance.rows.find((row) => row.id === "release-drift");
  const releaseBlocked = input.releaseDrift?.verdict === "deploy-drift" || input.releaseDrift?.verdict === "release-blocked" || releaseRow?.status === "blocked";
  if (releaseBlocked) return "mvp-release-drift";
  if (input.mvpAudit.band === "not-mvp") return "mvp-not-ready";

  const externalRowIds = new Set(["submission-assets", "demo-receipt"]);
  const blockedNonExternalRows = input.acceptance.rows.filter((row) => row.status === "blocked" && !externalRowIds.has(row.id));
  if (blockedNonExternalRows.length > 0) return "mvp-not-ready";

  const externalGaps = externalGapCount(input);
  if (externalGaps > 0 || input.acceptance.verdict === "accepted-with-external-gaps" || input.mvpAudit.band === "mvp-with-external-gaps") {
    return "mvp-ready-external-watch";
  }
  return "mvp-ready";
}

function headlineFor(readiness: MvpSnapshotReadiness) {
  if (readiness === "mvp-ready") return "MVP、提出、公開証拠はそのまま審査へ出せます。";
  if (readiness === "mvp-ready-external-watch") return "MVP本体は十分です。外部提出URLだけを最後に閉じます。";
  if (readiness === "mvp-release-drift") return "MVP実装はありますが、公開Cloud Runが古いrevisionを返しています。";
  return "MVPとして押し出すには、必須ゲートまたは受入行のblockedを直す必要があります。";
}

function hardTruthFor(readiness: MvpSnapshotReadiness) {
  if (readiness === "mvp-ready") return "審査5項目、必須技術、提出物、公開証拠が同じ受入表でacceptedです。";
  if (readiness === "mvp-ready-external-watch") return "コード、競合/SWOT、A2A、DevOps証拠はMVP水準です。ProtoPedia作品URLと動画URLは外部作業として残します。";
  if (readiness === "mvp-release-drift") return "ローカルやCIが緑でも、審査員が見るのは公開URLです。最新mainをCloud Runへ再デプロイするまで提出可否はblockedです。";
  return "機能数ではなく、必須技術、審査5項目、公開証拠、提出3点の受入がそろって初めてMVPです。";
}

export function buildMvpSnapshot(input: {
  baseUrl: string;
  projectBrief: string;
  selectedAgentIds: string[];
  mvpAudit: MvpAuditReport;
  acceptance: JudgeAcceptanceMatrix;
  releaseDrift?: ReleaseDriftGuard;
  deployRecovery?: DeployRecoveryPlan;
  generatedAt?: string;
}): MvpSnapshot {
  const baseUrl = normalizeBase(input.baseUrl);
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const readiness = readinessFor(input);
  const releaseVerdict = input.releaseDrift?.verdict ?? "not-run";
  const acceptedRows = input.acceptance.rows.filter((row) => row.status === "accepted").length;
  const watchRows = input.acceptance.rows.filter((row) => row.status === "watch").length;
  const blockedRows = input.acceptance.rows.filter((row) => row.status === "blocked").length;
  const gaps = externalGapCount(input);
  const mvpReadinessUrl = endpoint(baseUrl, "/mvp-readiness");
  const mvpReadinessJsonUrl = endpoint(baseUrl, "/api/mvp-readiness");
  const mvpAuditUrl = endpoint(baseUrl, "/api/mvp-audit");
  const acceptanceMatrixUrl = endpoint(baseUrl, "/api/acceptance-matrix");
  const releaseDriftUrl = endpoint(baseUrl, "/api/release-drift");
  const deployRecoveryUrl = endpoint(baseUrl, "/api/deploy-recovery");
  const winGapRadarUrl = endpoint(baseUrl, "/api/win-gap-radar");
  const judgeCommandUrl = endpoint(baseUrl, "/api/judge-command-center");
  const recordingScriptUrl = endpoint(baseUrl, "/recording-script");
  const targetBaseUrl = input.releaseDrift?.targetBaseUrl ?? baseUrl;
  const postApis: MvpSnapshotPostApi[] = [
    {
      id: "mvp-audit",
      label: "MVP Audit",
      method: "POST",
      url: mvpAuditUrl,
      purpose: "必須技術、AI中心性、競合/SWOT、CI、提出3点をハードゲートで再評価する。",
      curl: postCurl(mvpAuditUrl, input.projectBrief, input.selectedAgentIds)
    },
    {
      id: "acceptance-matrix",
      label: "Acceptance Matrix",
      method: "POST",
      url: acceptanceMatrixUrl,
      purpose: "審査5項目、公開証拠、提出物をaccepted/watch/blockedで再評価する。",
      curl: postCurl(acceptanceMatrixUrl, input.projectBrief, input.selectedAgentIds)
    },
    {
      id: "release-drift",
      label: "Release Drift Guard",
      method: "POST",
      url: releaseDriftUrl,
      purpose: "提出用Cloud Run URLが最新Agent Card、MVP snapshot、A2A artifactを返すか検証する。",
      curl: postCurl(releaseDriftUrl, input.projectBrief, input.selectedAgentIds)
    },
    {
      id: "deploy-recovery",
      label: "Deploy Recovery",
      method: "POST",
      url: deployRecoveryUrl,
      purpose: "release drift、gcloud認証、Cloud Build、公開再検証の復旧手順を確認する。",
      curl: postCurl(deployRecoveryUrl, input.projectBrief, input.selectedAgentIds)
    },
    {
      id: "win-gap-radar",
      label: "Win Gap Radar",
      method: "POST",
      url: winGapRadarUrl,
      purpose: "競合/SWOT、MVP監査、受賞ギャップから次の機能仮説を確認する。",
      curl: postCurl(winGapRadarUrl, input.projectBrief, input.selectedAgentIds)
    },
    {
      id: "judge-command",
      label: "Judge Command Center",
      method: "POST",
      url: judgeCommandUrl,
      purpose: "審査員が最初に見る証拠、残ブロッカー、次クリックを再構成する。",
      curl: postCurl(judgeCommandUrl, input.projectBrief, input.selectedAgentIds)
    }
  ];

  return {
    id: `mvp-snapshot-${input.mvpAudit.mvpScore}-${input.acceptance.acceptanceScore}-${readiness}`,
    generatedAt,
    readiness,
    headline: headlineFor(readiness),
    hardTruth: hardTruthFor(readiness),
    summary: {
      mvpScore: input.mvpAudit.mvpScore,
      mvpBand: input.mvpAudit.band,
      acceptanceScore: input.acceptance.acceptanceScore,
      acceptanceVerdict: input.acceptance.verdict,
      acceptedRows,
      watchRows,
      blockedRows,
      externalGapCount: gaps,
      releaseVerdict,
      deployRecoveryReadiness: input.deployRecovery?.readiness ?? "not-run"
    },
    links: [
      {
        id: "mvp-readiness",
        label: "MVP Readiness Snapshot",
        method: "GET",
        url: mvpReadinessUrl,
        purpose: "提出可否、外部gap、公開revisionを審査員が直接読むHTML証拠。"
      },
      {
        id: "mvp-readiness-json",
        label: "MVP Readiness JSON",
        method: "GET",
        url: mvpReadinessJsonUrl,
        purpose: "A2Aや自動検証で読む機械可読のMVP readiness証拠。"
      },
      {
        id: "judge-snapshot",
        label: "Public Judge Snapshot",
        method: "GET",
        url: endpoint(baseUrl, "/judge-snapshot"),
        purpose: "審査員のfirst click用証拠ページ。"
      },
      {
        id: "competitive-swot",
        label: "Competitive SWOT Snapshot",
        method: "GET",
        url: endpoint(baseUrl, "/competitive-swot"),
        purpose: "競合分析、SWOT、Criteria Duel、公式ソースの直接証拠。"
      },
      {
        id: "submission-assets",
        label: "Submission Assets",
        method: "GET",
        url: endpoint(baseUrl, "/submission-assets"),
        purpose: "ProtoPedia本文、動画台本、構成図、タグ、提出URLの作業面。"
      },
      {
        id: "recording-script",
        label: "Recording Script",
        method: "GET",
        url: recordingScriptUrl,
        purpose: "30秒動画の録画台本、字幕、証拠リンク、公開手順を直接開く。"
      },
      {
        id: "agent-card",
        label: "A2A Agent Card",
        method: "GET",
        url: endpoint(baseUrl, "/.well-known/agent-card.json"),
        purpose: "MVP readiness skillを含む公開skill surface。"
      }
    ],
    gates: input.mvpAudit.gates,
    rows: input.acceptance.rows,
    releaseLock: {
      verdict: releaseVerdict,
      targetBaseUrl,
      missingSkills: input.releaseDrift?.missingSkills ?? [],
      missingAgentCardSignals: input.releaseDrift?.missingAgentCardSignals ?? [],
      probes: input.releaseDrift?.probes.map((probe) => ({ id: probe.id, status: probe.status, score: probe.score, url: probe.url })) ?? []
    },
    deployRecovery: input.deployRecovery
      ? {
          readiness: input.deployRecovery.readiness,
          primaryAction: input.deployRecovery.primaryAction,
          commands: input.deployRecovery.commands,
          blockers: input.deployRecovery.blockers
        }
      : undefined,
    postApis,
    judgeScript: [
      "最初に /mvp-readiness をGETで開き、MVP本体、外部提出gap、公開revisionの3つを同時に見せる。",
      `MVP score ${input.mvpAudit.mvpScore} / ${input.mvpAudit.band}、Acceptance ${input.acceptance.acceptanceScore} / ${input.acceptance.verdict} を読み上げる。`,
      releaseVerdict === "not-run"
        ? "公開revision driftはPOST /api/release-drift、または /mvp-readiness?live=1 で最終確認する。"
        : `Release Drift verdict: ${releaseVerdict}; missing skills ${input.releaseDrift?.missingSkills.length ?? 0}; missing signals ${input.releaseDrift?.missingAgentCardSignals.length ?? 0}.`,
      gaps > 0 ? `外部提出gapは${gaps}件。Submission AssetsとRecording ScriptでProtoPedia作品URLと動画URLを閉じる。` : "外部提出gapはありません。",
      "深掘りはMVP Audit、Acceptance Matrix、Win Gap Radar、Judge Command CenterのPOST証拠を再実行する。"
    ],
    a2aPayload: {
      method: "message/send",
      skill: "mvp.snapshot",
      readiness,
      mvpScore: input.mvpAudit.mvpScore,
      mvpBand: input.mvpAudit.band,
      acceptanceScore: input.acceptance.acceptanceScore,
      acceptanceVerdict: input.acceptance.verdict,
      releaseVerdict,
      deployRecoveryReadiness: input.deployRecovery?.readiness ?? "not-run",
      externalGapCount: gaps,
      endpoints: {
        mvpReadiness: mvpReadinessUrl,
        mvpReadinessJson: mvpReadinessJsonUrl,
        mvpAudit: mvpAuditUrl,
        acceptanceMatrix: acceptanceMatrixUrl,
        releaseDrift: releaseDriftUrl,
        deployRecovery: deployRecoveryUrl,
        winGapRadar: winGapRadarUrl,
        judgeCommand: judgeCommandUrl,
        judgeSnapshot: endpoint(baseUrl, "/judge-snapshot"),
        competitiveSwotSnapshot: endpoint(baseUrl, "/competitive-swot"),
        submissionAssetsPage: endpoint(baseUrl, "/submission-assets"),
        recordingScript: recordingScriptUrl,
        recordingScriptJson: endpoint(baseUrl, "/api/recording-script"),
        agentCard: endpoint(baseUrl, "/.well-known/agent-card.json")
      }
    }
  };
}

function statusTone(status: string) {
  if (["mvp-ready", "submission-ready", "ready-to-submit", "accepted", "pass", "release-current", "recovered"].includes(status)) return "good";
  if (["mvp-not-ready", "not-mvp", "not-accepted", "blocked", "fail", "release-blocked"].includes(status)) return "bad";
  if (["mvp-release-drift", "deploy-drift", "manual-auth-required", "redeploy-required"].includes(status)) return "bad";
  return "watch";
}

function renderLinkList(links: MvpSnapshotLink[]) {
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

export function renderMvpSnapshotHtml(snapshot: MvpSnapshot) {
  const gates = snapshot.gates
    .map(
      (gate) => `
        <article class="gate-card ${statusTone(gate.status)}">
          <div><strong>${escapeHtml(gate.label)}</strong><span>${escapeHtml(gate.status)} / ${escapeHtml(gate.score)}</span></div>
          <p>${escapeHtml(gate.evidence)}</p>
          <small>${escapeHtml(gate.nextAction)}</small>
        </article>`
    )
    .join("");
  const rows = snapshot.rows
    .map(
      (row) => `
        <tr>
          <td><strong>${escapeHtml(row.label)}</strong><span>${escapeHtml(row.area)} / ${escapeHtml(row.status)} / ${escapeHtml(row.score)}</span></td>
          <td>${escapeHtml(row.requirement)}</td>
          <td>${escapeHtml(row.evidence)}</td>
          <td><a href="${escapeHtml(row.proofUrl)}">Open proof</a><small>${escapeHtml(row.nextAction)}</small></td>
        </tr>`
    )
    .join("");
  const releaseSignals = [...snapshot.releaseLock.missingSkills, ...snapshot.releaseLock.missingAgentCardSignals];
  const releaseList =
    releaseSignals.length === 0
      ? "<li>Missing release signals: none</li>"
      : releaseSignals.map((signal) => `<li>${escapeHtml(signal)}</li>`).join("");
  const commands =
    snapshot.deployRecovery?.commands
      .map(
        (command) => `
          <article class="command ${command.blocking ? "bad" : "watch"}">
            <div><strong>${escapeHtml(command.label)}</strong><span>${escapeHtml(command.copyGroup)}</span></div>
            <p>${escapeHtml(command.why)}</p>
            <code>${escapeHtml(command.command)}</code>
          </article>`
      )
      .join("") ?? "<p>Deploy Recovery has not been run. Use POST /api/deploy-recovery after Release Drift Guard.</p>";
  const postApis = snapshot.postApis
    .map(
      (api) => `
        <article class="api-row">
          <div><span>${escapeHtml(api.method)}</span><strong>${escapeHtml(api.label)}</strong><small>${escapeHtml(api.url)}</small></div>
          <p>${escapeHtml(api.purpose)}</p>
          <code>${escapeHtml(api.curl)}</code>
        </article>`
    )
    .join("");
  const scriptLines = snapshot.judgeScript.map((line) => `<li>${escapeHtml(line)}</li>`).join("");

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MVP Readiness Snapshot</title>
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
      h1 { margin: 8px 0 10px; font-size: clamp(2rem, 5vw, 4.55rem); line-height: 1; letter-spacing: 0; max-width: 940px; }
      header p { color: var(--muted); max-width: 820px; }
      .metric-grid, .links-grid, .gate-grid {
        display: grid;
        gap: 12px;
      }
      .metric-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); margin-top: 22px; }
      .metric, .section, .gate-card, .command, .api-row {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 8px;
        box-shadow: 0 1px 0 rgba(23, 32, 29, 0.03);
      }
      .metric { padding: 14px; min-width: 0; }
      .metric span { display: block; color: var(--muted); font-size: 0.75rem; font-weight: 800; }
      .metric strong { display: block; margin-top: 4px; font-size: 1.35rem; line-height: 1.05; overflow-wrap: anywhere; }
      .metric.good, .gate-card.good { background: var(--mint); border-color: #b9dfd1; }
      .metric.watch, .gate-card.watch, .command.watch { background: var(--amber-bg); border-color: #ecd58c; }
      .metric.bad, .gate-card.bad, .command.bad { background: #ffe4de; border-color: #efb2a6; }
      .section { padding: 18px; margin: 14px 0; }
      .section h2 { margin: 0 0 12px; font-size: 1.05rem; }
      .links-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .link-row { display: grid; grid-template-columns: auto 1fr; gap: 2px 10px; align-items: center; padding: 12px; border: 1px solid var(--line); border-radius: 8px; text-decoration: none; background: #fff; }
      .link-row span, .api-row span, .command span { color: var(--blue); font-size: 0.72rem; font-weight: 900; }
      .link-row small { grid-column: 2; color: var(--muted); }
      .gate-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .gate-card, .command { padding: 12px; }
      .gate-card div, .command div, .api-row div { display: flex; gap: 10px; justify-content: space-between; align-items: center; }
      .gate-card span { font-size: 0.75rem; font-weight: 900; }
      .gate-card p, .command p, .api-row p { color: var(--muted); margin: 8px 0; }
      .gate-card small, .api-row small { color: var(--muted); overflow-wrap: anywhere; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      th, td { padding: 12px 10px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; overflow-wrap: anywhere; }
      th { color: var(--muted); font-size: 0.75rem; }
      td span, td small { display: block; color: var(--muted); font-size: 0.76rem; margin-top: 3px; }
      ul, ol { margin: 0; padding-left: 22px; color: var(--muted); }
      li + li { margin-top: 8px; }
      .api-row { padding: 12px; margin: 10px 0; }
      code { display: block; white-space: pre-wrap; overflow-wrap: anywhere; padding: 10px; border-radius: 8px; background: #17201d; color: #eef8f4; font-size: 0.78rem; }
      footer { color: var(--muted); font-size: 0.84rem; padding: 10px 0 36px; }
      @media (max-width: 860px) {
        header { padding-top: 28px; }
        .metric-grid, .links-grid, .gate-grid { grid-template-columns: 1fr; }
        table, thead, tbody, tr, th, td { display: block; }
        thead { display: none; }
        tr { border-top: 1px solid var(--line); padding: 8px 0; }
        td { border-bottom: 0; padding: 8px 0; }
      }
    </style>
  </head>
  <body>
    <header>
      <div class="eyebrow">MVP Readiness Snapshot</div>
      <h1>${escapeHtml(snapshot.headline)}</h1>
      <p>${escapeHtml(snapshot.hardTruth)}</p>
      <div class="metric-grid">
        <div class="metric ${statusTone(snapshot.readiness)}"><span>Readiness</span><strong>${escapeHtml(snapshot.readiness)}</strong></div>
        <div class="metric ${statusTone(snapshot.summary.mvpBand)}"><span>MVP Score</span><strong>${escapeHtml(snapshot.summary.mvpScore)} / ${escapeHtml(snapshot.summary.mvpBand)}</strong></div>
        <div class="metric ${statusTone(snapshot.summary.acceptanceVerdict)}"><span>Acceptance</span><strong>${escapeHtml(snapshot.summary.acceptanceScore)} / ${escapeHtml(snapshot.summary.acceptanceVerdict)}</strong></div>
        <div class="metric ${statusTone(snapshot.summary.releaseVerdict)}"><span>Release</span><strong>${escapeHtml(snapshot.summary.releaseVerdict)}</strong></div>
        <div class="metric ${snapshot.summary.externalGapCount > 0 ? "watch" : "good"}"><span>External Gaps</span><strong>${escapeHtml(snapshot.summary.externalGapCount)}</strong></div>
      </div>
    </header>
    <main>
      <section class="section">
        <h2>First-Click Links</h2>
        <div class="links-grid">${renderLinkList(snapshot.links)}</div>
      </section>
      <section class="section">
        <h2>MVP Gates</h2>
        <div class="gate-grid">${gates}</div>
      </section>
      <section class="section">
        <h2>Acceptance Rows</h2>
        <table>
          <thead><tr><th>Row</th><th>Requirement</th><th>Evidence</th><th>Proof</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </section>
      <section class="section">
        <h2>Release Drift</h2>
        <p>Target: ${escapeHtml(snapshot.releaseLock.targetBaseUrl)} / verdict: ${escapeHtml(snapshot.releaseLock.verdict)}</p>
        <ul>${releaseList}</ul>
      </section>
      <section class="section">
        <h2>Deploy Recovery</h2>
        ${commands}
      </section>
      <section class="section">
        <h2>Judge Script</h2>
        <ol>${scriptLines}</ol>
      </section>
      <section class="section">
        <h2>Deep Proof APIs</h2>
        ${postApis}
      </section>
    </main>
    <footer>${escapeHtml(snapshot.id)} / generated ${escapeHtml(snapshot.generatedAt)}</footer>
  </body>
</html>`;
}
