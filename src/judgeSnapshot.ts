import type { CompetitiveBattlecard } from "./competitiveBattlecard.js";
import type { JudgeProof, ProofStatus } from "./proof.js";
import type { ReleaseDriftGuard } from "./releaseDrift.js";
import { SUBMISSION_PROOF } from "./submission.js";

export type JudgeSnapshotReadiness = "first-click-ready" | "first-click-watch" | "submission-blocked";

export type JudgeSnapshotLink = {
  id: string;
  label: string;
  method: "GET" | "POST";
  url: string;
  purpose: string;
};

export type JudgeSnapshotPostApi = JudgeSnapshotLink & {
  curl: string;
};

export type JudgeSnapshot = {
  id: string;
  generatedAt: string;
  directOpen: true;
  readiness: JudgeSnapshotReadiness;
  headline: string;
  hardTruth: string;
  summary: {
    proofScore: number;
    battleScore: number;
    criteriaDuelScore: number;
    proofLockScore: number;
    ciStatus: ProofStatus;
    ciConclusion: string;
    agentCardSkillCount: number;
    releaseVerdict: ReleaseDriftGuard["verdict"] | "not-run";
    missingReleaseSignals: number;
  };
  links: JudgeSnapshotLink[];
  criteriaDuel: {
    judgeLine: string;
    rows: Array<{
      id: string;
      label: string;
      status: string;
      targetCompetitor: string;
      ourCounter: string;
      proofUrl: string;
      sourceCount: number;
      swotQuadrant: string;
      judgeLine: string;
    }>;
  };
  proofItems: Array<{
    id: string;
    label: string;
    status: ProofStatus;
    evidence: string;
    url?: string;
  }>;
  releaseLock: {
    verdict: ReleaseDriftGuard["verdict"] | "not-run";
    targetBaseUrl: string;
    missingSkills: string[];
    missingAgentCardSignals: string[];
    probes: Array<{ id: string; status: string; score: number; url: string }>;
  };
  postApis: JudgeSnapshotPostApi[];
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

function readinessFor(input: { proof: JudgeProof; battlecard: CompetitiveBattlecard; releaseDrift?: ReleaseDriftGuard }): JudgeSnapshotReadiness {
  if (input.releaseDrift?.verdict === "release-blocked") return "submission-blocked";
  if (input.releaseDrift?.verdict === "deploy-drift") return "first-click-watch";
  if (input.proof.overallScore < 82 || input.battlecard.criteriaDuel.rows.length < 5) return "first-click-watch";
  return "first-click-ready";
}

export function buildJudgeSnapshot(input: {
  baseUrl: string;
  projectBrief: string;
  selectedAgentIds: string[];
  proof: JudgeProof;
  battlecard: CompetitiveBattlecard;
  agentCardSkillIds: string[];
  releaseDrift?: ReleaseDriftGuard;
  generatedAt?: string;
}): JudgeSnapshot {
  const baseUrl = normalizeBase(input.baseUrl);
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const readiness = readinessFor(input);
  const missingReleaseSignals = (input.releaseDrift?.missingSkills.length ?? 0) + (input.releaseDrift?.missingAgentCardSignals.length ?? 0);
  const judgeSnapshotUrl = endpoint(baseUrl, "/api/judge-snapshot");
  const proofUrl = endpoint(baseUrl, "/api/proof");
  const battlecardUrl = endpoint(baseUrl, "/api/competitive-battlecard");
  const demoConciergeUrl = endpoint(baseUrl, "/api/demo-concierge");
  const pilotEconomicsUrl = endpoint(baseUrl, "/api/pilot-economics");
  const releaseDriftUrl = endpoint(baseUrl, "/api/release-drift");
  const winnerPacketUrl = endpoint(baseUrl, "/api/winner-packet");
  const judgeCommandUrl = endpoint(baseUrl, "/api/judge-command-center");
  const acceptanceMatrixUrl = endpoint(baseUrl, "/api/acceptance-matrix");
  const targetBaseUrl = input.releaseDrift?.targetBaseUrl ?? SUBMISSION_PROOF.deployedUrl;

  const postApis: JudgeSnapshotPostApi[] = [
    {
      id: "judge-proof",
      label: "Judge Proof",
      method: "POST",
      url: proofUrl,
      purpose: "Gemini/Cloud Run/A2A/CI/提出準備を詳細検証する。",
      curl: postCurl(proofUrl, input.projectBrief, input.selectedAgentIds)
    },
    {
      id: "competitive-battlecard",
      label: "Competitive Battlecard",
      method: "POST",
      url: battlecardUrl,
      purpose: "競合分析、SWOT、Criteria Duel、反論台本を詳細検証する。",
      curl: postCurl(battlecardUrl, input.projectBrief, input.selectedAgentIds)
    },
    {
      id: "demo-concierge",
      label: "Demo Concierge",
      method: "POST",
      url: demoConciergeUrl,
      purpose: "審査員、買い手、提出者ごとのfirst clickと90秒導線を詳細検証する。",
      curl: postCurl(demoConciergeUrl, input.projectBrief, input.selectedAgentIds)
    },
    {
      id: "pilot-economics",
      label: "Pilot Economics",
      method: "POST",
      url: pilotEconomicsUrl,
      purpose: "導入価値、回収日数、買い手反論、実用性の証拠を詳細検証する。",
      curl: postCurl(pilotEconomicsUrl, input.projectBrief, input.selectedAgentIds)
    },
    {
      id: "release-drift",
      label: "Release Drift Guard",
      method: "POST",
      url: releaseDriftUrl,
      purpose: "公開Cloud Runが最新Agent CardとA2A証拠を返すか検証する。",
      curl: postCurl(releaseDriftUrl, input.projectBrief, input.selectedAgentIds)
    },
    {
      id: "winner-packet",
      label: "Winner Packet",
      method: "POST",
      url: winnerPacketUrl,
      purpose: "審査5項目別の勝ち証拠packetを生成する。",
      curl: postCurl(winnerPacketUrl, input.projectBrief, input.selectedAgentIds)
    }
  ];

  const releaseVerdict = input.releaseDrift?.verdict ?? "not-run";
  const headline =
    readiness === "first-click-ready"
      ? "審査員がGETで直接開ける証拠スナップショットです。"
      : readiness === "first-click-watch"
        ? "直接開ける証拠はありますが、公開revisionまたは外部提出URLにwatchが残っています。"
        : "公開URLまたはCIの証拠が不足しており、提出前に復旧が必要です。";

  return {
    id: `judge-snapshot-${input.proof.overallScore}-${input.battlecard.criteriaDuel.duelScore}-${readiness}`,
    generatedAt,
    directOpen: true,
    readiness,
    headline,
    hardTruth:
      readiness === "first-click-ready"
        ? "POST専用APIの深い証拠を、初見審査員向けのGET入口に束ねています。"
        : "機能があっても、審査員が最初のクリックで読めない証拠はMVP体験として弱く見えます。",
    summary: {
      proofScore: input.proof.overallScore,
      battleScore: input.battlecard.battleScore,
      criteriaDuelScore: input.battlecard.criteriaDuel.duelScore,
      proofLockScore: input.battlecard.proofLock.proofScore,
      ciStatus: input.proof.ci.status,
      ciConclusion: input.proof.ci.conclusion,
      agentCardSkillCount: input.agentCardSkillIds.length,
      releaseVerdict,
      missingReleaseSignals
    },
    links: [
      {
        id: "judge-snapshot",
        label: "Public Judge Snapshot",
        method: "GET",
        url: endpoint(baseUrl, "/judge-snapshot"),
        purpose: "審査員がクリックで読む最初のHTML証拠ページ。"
      },
      {
        id: "judge-snapshot-json",
        label: "Public Judge Snapshot JSON",
        method: "GET",
        url: judgeSnapshotUrl,
        purpose: "自動検証やA2A連携で使う機械可読の証拠入口。"
      },
      {
        id: "mvp-readiness",
        label: "MVP Readiness Snapshot",
        method: "GET",
        url: endpoint(baseUrl, "/mvp-readiness"),
        purpose: "MVP本体、外部提出gap、公開revisionの提出可否を確認する。"
      },
      {
        id: "app",
        label: "Cloud Run App",
        method: "GET",
        url: input.proof.links.app,
        purpose: "実装済みUIを確認する。"
      },
      {
        id: "agent-card",
        label: "A2A Agent Card",
        method: "GET",
        url: input.proof.links.agentCard,
        purpose: "公開skill surfaceとタグを確認する。"
      },
      {
        id: "ci",
        label: "GitHub Actions CI",
        method: "GET",
        url: input.proof.links.ci,
        purpose: "品質ゲートの公開証跡を確認する。"
      },
      {
        id: "github",
        label: "Public GitHub",
        method: "GET",
        url: input.proof.links.github,
        purpose: "提出リポジトリを確認する。"
      }
    ],
    criteriaDuel: {
      judgeLine: input.battlecard.criteriaDuel.judgeLine,
      rows: input.battlecard.criteriaDuel.rows.map((row) => ({
        id: row.id,
        label: row.label,
        status: row.status,
        targetCompetitor: row.targetCompetitor,
        ourCounter: row.ourCounter,
        proofUrl: row.proofUrl,
        sourceCount: row.sourceCount,
        swotQuadrant: row.swotSignal.quadrant,
        judgeLine: row.judgeLine
      }))
    },
    proofItems: input.proof.proofItems.map((item) => ({
      id: item.id,
      label: item.label,
      status: item.status,
      evidence: item.evidence,
      url: item.url
    })),
    releaseLock: {
      verdict: releaseVerdict,
      targetBaseUrl,
      missingSkills: input.releaseDrift?.missingSkills ?? [],
      missingAgentCardSignals: input.releaseDrift?.missingAgentCardSignals ?? [],
      probes: input.releaseDrift?.probes.map((probe) => ({ id: probe.id, status: probe.status, score: probe.score, url: probe.url })) ?? []
    },
    postApis,
    judgeScript: [
      "最初に /api/judge-snapshot をGETで開き、directOpen と readiness を見せる。",
      `Judge Proof score ${input.proof.overallScore} と Criteria Duel score ${input.battlecard.criteriaDuel.duelScore} を1画面で確認する。`,
      `Agent Card exposes ${input.agentCardSkillIds.length} skills; judge.snapshot:get-proof が公開revisionに載っているかをRelease Driftで確認する。`,
      `深掘りはPOST APIをcurlで再実行する: ${postApis.map((api) => api.label).join(" / ")}。`,
      releaseVerdict === "not-run"
        ? "公開revision driftはPOST /api/release-driftで最終確認する。"
        : `Release Drift verdict: ${releaseVerdict}; missing release signals ${missingReleaseSignals}.`
    ],
    a2aPayload: {
      method: "message/send",
      skill: "judge.snapshot",
      id: `judge-snapshot-${readiness}`,
      directOpen: true,
      readiness,
      proofScore: input.proof.overallScore,
      criteriaDuelScore: input.battlecard.criteriaDuel.duelScore,
      agentCardSkillCount: input.agentCardSkillIds.length,
      releaseVerdict,
      endpoints: {
        judgeSnapshot: endpoint(baseUrl, "/judge-snapshot"),
        judgeSnapshotJson: judgeSnapshotUrl,
        mvpReadiness: endpoint(baseUrl, "/mvp-readiness"),
        mvpReadinessJson: endpoint(baseUrl, "/api/mvp-readiness"),
        judgeProof: proofUrl,
        competitiveBattlecard: battlecardUrl,
        demoConcierge: demoConciergeUrl,
        pilotEconomics: pilotEconomicsUrl,
        releaseDrift: releaseDriftUrl,
        winnerPacket: winnerPacketUrl,
        judgeCommand: judgeCommandUrl,
        acceptanceMatrix: acceptanceMatrixUrl,
        agentCard: input.proof.links.agentCard
      }
    }
  };
}

function statusTone(status: string) {
  if (["passed", "win", "sealed", "first-click-ready", "release-current"].includes(status)) return "good";
  if (["missing", "exposed", "submission-blocked", "release-blocked"].includes(status)) return "bad";
  return "watch";
}

function renderLinkList(links: JudgeSnapshotLink[]) {
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

function deepProofAnchor(id: string) {
  return `deep-proof-${id}`;
}

function proofTargetFor(url: string, postApis: JudgeSnapshotPostApi[]) {
  const postApi = postApis.find((api) => api.url === url);
  if (!postApi) return { href: url, label: "Open proof", detail: "GET proof" };
  return {
    href: `#${deepProofAnchor(postApi.id)}`,
    label: postApi.label,
    detail: "POST proof: use curl below"
  };
}

export function renderJudgeSnapshotHtml(snapshot: JudgeSnapshot) {
  const criteriaRows = snapshot.criteriaDuel.rows
    .map((row) => {
      const proofTarget = proofTargetFor(row.proofUrl, snapshot.postApis);
      return `
        <tr>
          <td><strong>${escapeHtml(row.label)}</strong><span>${escapeHtml(row.status)}</span></td>
          <td>${escapeHtml(row.targetCompetitor)}</td>
          <td>${escapeHtml(row.ourCounter)}</td>
          <td><a href="${escapeHtml(proofTarget.href)}">${escapeHtml(proofTarget.label)}</a><small>${escapeHtml(proofTarget.detail)} / ${escapeHtml(row.sourceCount)} sources / ${escapeHtml(row.swotQuadrant)}</small></td>
        </tr>`;
    })
    .join("");
  const proofItems = snapshot.proofItems
    .map(
      (item) => `
        <article class="proof-item ${statusTone(item.status)}">
          <div><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.status)}</span></div>
          <p>${escapeHtml(item.evidence)}</p>
          ${item.url ? `<a href="${escapeHtml(item.url)}">Open proof</a>` : ""}
        </article>`
    )
    .join("");
  const postApis = snapshot.postApis
    .map(
      (api) => `
        <article id="${escapeHtml(deepProofAnchor(api.id))}" class="api-row">
          <div><span>${escapeHtml(api.method)}</span><strong>${escapeHtml(api.label)}</strong><small>${escapeHtml(api.url)}</small></div>
          <p>${escapeHtml(api.purpose)}</p>
          <code>${escapeHtml(api.curl)}</code>
        </article>`
    )
    .join("");
  const releaseSignals = [...snapshot.releaseLock.missingSkills, ...snapshot.releaseLock.missingAgentCardSignals];
  const releaseList =
    releaseSignals.length === 0
      ? "<li>Missing release signals: none</li>"
      : releaseSignals.map((signal) => `<li>${escapeHtml(signal)}</li>`).join("");

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Public Judge Snapshot</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #18211f;
        --muted: #5d6864;
        --line: #dbe4df;
        --paper: #fbfcfa;
        --panel: #ffffff;
        --green: #14735f;
        --mint: #e5f5ee;
        --coral: #b24735;
        --amber: #8a620d;
        --amber-bg: #fff3cf;
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
      header, main { width: min(1120px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 40px 0 22px; }
      .eyebrow { color: var(--green); font-weight: 800; font-size: 0.78rem; letter-spacing: 0; text-transform: uppercase; }
      h1 { margin: 8px 0 10px; font-size: clamp(2rem, 5vw, 4.8rem); line-height: 0.98; letter-spacing: 0; max-width: 920px; }
      header p { max-width: 760px; color: var(--muted); font-size: 1.05rem; }
      .summary-grid, .links-grid, .proof-grid { display: grid; gap: 12px; }
      .summary-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 24px 0; }
      .metric, .section, .proof-item, .api-row {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 8px;
        box-shadow: 0 1px 0 rgba(24, 33, 31, 0.03);
      }
      .metric { padding: 16px; min-width: 0; }
      .metric span { display: block; color: var(--muted); font-size: 0.78rem; font-weight: 700; }
      .metric strong { display: block; margin-top: 4px; font-size: 1.7rem; line-height: 1; overflow-wrap: anywhere; }
      .metric.good { background: var(--mint); border-color: #b9dfd1; }
      .metric.watch { background: var(--amber-bg); border-color: #ecd58c; }
      .metric.bad { background: #ffe4de; border-color: #efb2a6; }
      .section { padding: 18px; margin: 14px 0; }
      .section h2 { margin: 0 0 12px; font-size: 1.05rem; letter-spacing: 0; }
      .links-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .link-row { display: grid; grid-template-columns: auto 1fr; gap: 2px 10px; align-items: center; padding: 12px; border: 1px solid var(--line); border-radius: 8px; text-decoration: none; background: #fff; }
      .link-row span, .api-row span { color: var(--blue); font-size: 0.72rem; font-weight: 900; }
      .link-row small { grid-column: 2; color: var(--muted); }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      th, td { padding: 12px 10px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; overflow-wrap: anywhere; }
      th { color: var(--muted); font-size: 0.75rem; }
      td span, td small { display: block; color: var(--muted); font-size: 0.76rem; margin-top: 3px; }
      .proof-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .proof-item { padding: 12px; }
      .proof-item div, .api-row div { display: flex; gap: 10px; justify-content: space-between; align-items: center; }
      .api-row small { color: var(--muted); overflow-wrap: anywhere; text-align: right; }
      .proof-item span { font-size: 0.75rem; font-weight: 900; }
      .proof-item p, .api-row p { color: var(--muted); margin: 8px 0; }
      .proof-item.good span { color: var(--green); }
      .proof-item.watch span { color: var(--amber); }
      .proof-item.bad span { color: var(--coral); }
      .api-row { padding: 12px; margin: 10px 0; }
      code { display: block; white-space: pre-wrap; overflow-wrap: anywhere; padding: 10px; border-radius: 8px; background: #17211f; color: #eef8f4; font-size: 0.78rem; }
      ul { margin: 8px 0 0; padding-left: 20px; color: var(--muted); }
      footer { width: min(1120px, calc(100% - 32px)); margin: 20px auto 40px; color: var(--muted); font-size: 0.85rem; }
      @media (max-width: 760px) {
        header { padding-top: 28px; }
        .summary-grid, .links-grid, .proof-grid { grid-template-columns: 1fr; }
        table, thead, tbody, tr, th, td { display: block; }
        thead { display: none; }
        tr { border-top: 1px solid var(--line); padding: 8px 0; }
        td { border-bottom: 0; padding: 8px 0; }
      }
    </style>
  </head>
  <body>
    <header>
      <div class="eyebrow">Public Judge Snapshot</div>
      <h1>${escapeHtml(snapshot.headline)}</h1>
      <p>${escapeHtml(snapshot.hardTruth)}</p>
      <div class="summary-grid">
        <div class="metric ${statusTone(snapshot.readiness)}"><span>Readiness</span><strong>${escapeHtml(snapshot.readiness)}</strong></div>
        <div class="metric good"><span>Judge Proof</span><strong>${escapeHtml(snapshot.summary.proofScore)}</strong></div>
        <div class="metric good"><span>Criteria Duel</span><strong>${escapeHtml(snapshot.summary.criteriaDuelScore)}</strong></div>
        <div class="metric ${statusTone(snapshot.summary.releaseVerdict)}"><span>Release</span><strong>${escapeHtml(snapshot.summary.releaseVerdict)}</strong></div>
      </div>
    </header>
    <main>
      <section class="section">
        <h2>First-Click Links</h2>
        <div class="links-grid">${renderLinkList(snapshot.links)}</div>
      </section>
      <section class="section">
        <h2>Criteria Duel</h2>
        <p>${escapeHtml(snapshot.criteriaDuel.judgeLine)}</p>
        <table>
          <thead><tr><th>Criterion</th><th>Competitor</th><th>Counter</th><th>Proof</th></tr></thead>
          <tbody>${criteriaRows}</tbody>
        </table>
      </section>
      <section class="section">
        <h2>Proof Items</h2>
        <div class="proof-grid">${proofItems}</div>
      </section>
      <section class="section">
        <h2>Release Lock</h2>
        <p>Target: ${escapeHtml(snapshot.releaseLock.targetBaseUrl)} / missing signals: ${escapeHtml(snapshot.summary.missingReleaseSignals)}</p>
        <ul>${releaseList}</ul>
      </section>
      <section class="section">
        <h2>Deep Proof APIs</h2>
        ${postApis}
      </section>
    </main>
    <footer>Generated at ${escapeHtml(snapshot.generatedAt)} / ${escapeHtml(snapshot.id)}</footer>
  </body>
</html>`;
}
