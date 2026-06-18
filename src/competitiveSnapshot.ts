import type { CompetitiveBattlecard, CompetitiveBattlecardCard } from "./competitiveBattlecard.js";
import type { MarketIntelReport, MarketSourceLedgerItem } from "./marketIntel.js";
import type { SwotItem, SwotQuadrant, WinningStrategy } from "./strategy.js";

export type CompetitiveSnapshotReadiness = "competitive-swot-ready" | "competitive-swot-watch" | "competitive-swot-exposed";

export type CompetitiveSnapshotLink = {
  id: string;
  label: string;
  method: "GET" | "POST";
  url: string;
  purpose: string;
};

export type CompetitiveSnapshotPostApi = CompetitiveSnapshotLink & {
  curl: string;
};

export type CompetitiveSnapshot = {
  id: string;
  generatedAt: string;
  readiness: CompetitiveSnapshotReadiness;
  headline: string;
  hardTruth: string;
  thesis: string;
  summary: {
    battleScore: number;
    moatScore: number;
    criteriaDuelScore: number;
    proofLockScore: number;
    competitorCount: number;
    highThreatCount: number;
    sourceUrlCount: number;
    swotReceiptCount: number;
    swotQuadrantCount: number;
    sourceLockReadiness: string;
  };
  links: CompetitiveSnapshotLink[];
  swotMatrix: Array<{
    quadrant: SwotQuadrant;
    items: SwotItem[];
  }>;
  competitors: Array<{
    id: string;
    competitor: string;
    category: string;
    threatLevel: string;
    status: string;
    score: number;
    judgeQuestion: string;
    shortAnswer: string;
    whereTheyWin: string;
    whereWeWin: string;
    proofRoute: string;
    sourceUrls: CompetitiveBattlecardCard["sourceUrls"];
    swotLinks: CompetitiveBattlecardCard["swotLinks"];
  }>;
  criteriaDuel: CompetitiveBattlecard["criteriaDuel"];
  proofLock: CompetitiveBattlecard["proofLock"];
  objectionReplay: CompetitiveBattlecard["objectionReplay"];
  sourceLedger: MarketSourceLedgerItem[];
  postApis: CompetitiveSnapshotPostApi[];
  judgeScript: string[];
  a2aPayload: Record<string, unknown>;
};

const SWOT_ORDER: SwotQuadrant[] = ["strengths", "weaknesses", "opportunities", "threats"];

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

function readinessFor(input: { battlecard: CompetitiveBattlecard; marketIntel: MarketIntelReport }): CompetitiveSnapshotReadiness {
  if (
    input.battlecard.readiness === "exposed" ||
    input.battlecard.proofLock.readiness === "needs-counterproof" ||
    input.battlecard.criteriaDuel.rows.some((row) => row.status === "exposed")
  ) {
    return "competitive-swot-exposed";
  }
  if (
    input.battlecard.readiness === "needs-proof" ||
    input.battlecard.proofLock.readiness === "proof-watch" ||
    input.marketIntel.sourceProofLock.readiness !== "source-lock-live"
  ) {
    return "competitive-swot-watch";
  }
  return "competitive-swot-ready";
}

function headlineFor(readiness: CompetitiveSnapshotReadiness) {
  if (readiness === "competitive-swot-ready") return "競合分析とSWOTは審査員が直接読める状態です。";
  if (readiness === "competitive-swot-watch") return "競合分析とSWOTは揃っています。録画前にライブソースを更新します。";
  return "競合分析かSWOT証拠に穴があります。提出前に反論証拠を補強します。";
}

function hardTruthFor(readiness: CompetitiveSnapshotReadiness) {
  if (readiness === "competitive-swot-ready") return "6競合、4象限SWOT、審査5項目別の反論、公式ソース、公開proof routeを1クリックで確認できます。";
  if (readiness === "competitive-swot-watch") return "分析構造は揃っていますが、GETページでは外部ソースをライブプローブしません。提出直前にPOST /api/market-intelでSource Freshness Lockを更新します。";
  return "競合の強みを否定するだけでは勝てません。公式ソース、SWOT signal、動く証拠routeを同じ画面で補強します。";
}

function deepProofAnchor(id: string) {
  return `deep-proof-${id}`;
}

export function buildCompetitiveSnapshot(input: {
  baseUrl: string;
  projectBrief: string;
  selectedAgentIds: string[];
  strategy: WinningStrategy;
  marketIntel: MarketIntelReport;
  battlecard: CompetitiveBattlecard;
  generatedAt?: string;
}): CompetitiveSnapshot {
  const baseUrl = normalizeBase(input.baseUrl);
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const readiness = readinessFor({ battlecard: input.battlecard, marketIntel: input.marketIntel });
  const swotMatrix = SWOT_ORDER.map((quadrant) => ({ quadrant, items: input.strategy.swot[quadrant] }));
  const sourceUrlCount = input.battlecard.cards.reduce((sum, card) => sum + card.sourceUrls.length, 0);
  const swotQuadrantCount = new Set(input.battlecard.swotReceipts.map((receipt) => receipt.quadrant)).size;
  const competitiveSnapshotUrl = endpoint(baseUrl, "/competitive-swot");
  const competitiveSnapshotJsonUrl = endpoint(baseUrl, "/api/competitive-swot");
  const marketIntelUrl = endpoint(baseUrl, "/api/market-intel");
  const battlecardUrl = endpoint(baseUrl, "/api/competitive-battlecard");
  const moatStressUrl = endpoint(baseUrl, "/api/moat-stress");

  const postApis: CompetitiveSnapshotPostApi[] = [
    {
      id: "market-intel",
      label: "Market Intel",
      method: "POST",
      url: marketIntelUrl,
      purpose: "公式ソース付きの競合比較とSource Freshness Lockを再実行する。",
      curl: postCurl(marketIntelUrl, input.projectBrief, input.selectedAgentIds)
    },
    {
      id: "competitive-battlecard",
      label: "Competitive Battlecard",
      method: "POST",
      url: battlecardUrl,
      purpose: "競合別カード、Criteria Duel、Objection Replay、Proof Lockを再生成する。",
      curl: postCurl(battlecardUrl, input.projectBrief, input.selectedAgentIds)
    },
    {
      id: "moat-stress",
      label: "Moat Stress",
      method: "POST",
      url: moatStressUrl,
      purpose: "ADK、A2A Marketplace、LangGraph、CrewAI、Dify、AgentOpsからの反論を再評価する。",
      curl: postCurl(moatStressUrl, input.projectBrief, input.selectedAgentIds)
    }
  ];

  return {
    id: `competitive-swot-${input.battlecard.battleScore}-${readiness}`,
    generatedAt,
    readiness,
    headline: headlineFor(readiness),
    hardTruth: hardTruthFor(readiness),
    thesis: input.battlecard.thesis,
    summary: {
      battleScore: input.battlecard.battleScore,
      moatScore: input.strategy.moatScore,
      criteriaDuelScore: input.battlecard.criteriaDuel.duelScore,
      proofLockScore: input.battlecard.proofLock.proofScore,
      competitorCount: input.battlecard.cards.length,
      highThreatCount: input.battlecard.cards.filter((card) => card.threatLevel === "high").length,
      sourceUrlCount,
      swotReceiptCount: input.battlecard.swotReceipts.length,
      swotQuadrantCount,
      sourceLockReadiness: input.marketIntel.sourceProofLock.readiness
    },
    links: [
      {
        id: "competitive-swot",
        label: "Competitive SWOT Snapshot",
        method: "GET",
        url: competitiveSnapshotUrl,
        purpose: "審査員が直接読む競合/SWOTのHTML証拠ページ。"
      },
      {
        id: "competitive-swot-json",
        label: "Competitive SWOT JSON",
        method: "GET",
        url: competitiveSnapshotJsonUrl,
        purpose: "A2Aや自動検証で読む競合/SWOTの機械可読証拠。"
      },
      {
        id: "judge-snapshot",
        label: "Public Judge Snapshot",
        method: "GET",
        url: endpoint(baseUrl, "/judge-snapshot"),
        purpose: "審査全体の初回証拠ページへ戻る。"
      },
      {
        id: "agent-card",
        label: "A2A Agent Card",
        method: "GET",
        url: endpoint(baseUrl, "/.well-known/agent-card.json"),
        purpose: "競合/SWOT証拠をA2A skill surfaceとして確認する。"
      }
    ],
    swotMatrix,
    competitors: input.battlecard.cards.map((card) => ({
      id: card.id,
      competitor: card.competitor,
      category: card.category,
      threatLevel: card.threatLevel,
      status: card.status,
      score: card.score,
      judgeQuestion: card.judgeQuestion,
      shortAnswer: card.shortAnswer,
      whereTheyWin: card.whereTheyWin,
      whereWeWin: card.whereWeWin,
      proofRoute: card.proofRoute,
      sourceUrls: card.sourceUrls,
      swotLinks: card.swotLinks
    })),
    criteriaDuel: input.battlecard.criteriaDuel,
    proofLock: input.battlecard.proofLock,
    objectionReplay: input.battlecard.objectionReplay,
    sourceLedger: input.marketIntel.sourceLedger,
    postApis,
    judgeScript: [
      "最初に Competitive SWOT Snapshot を開き、6競合とSWOT 4象限が1画面にあることを見せる。",
      `Battle score ${input.battlecard.battleScore}、Criteria Duel ${input.battlecard.criteriaDuel.duelScore}、Proof Lock ${input.battlecard.proofLock.proofScore} を読み上げる。`,
      `最弱質問は ${input.battlecard.objectionReplay.weakestCompetitor}: ${input.battlecard.objectionReplay.openingObjection}`,
      "Source Ledgerで公式ソースを見せてから、SWOT signal、公開proof routeの順に進む。",
      "最後にJudge Snapshotへ戻り、競合/SWOTが審査5項目と実装証拠へ接続していることを示す。"
    ],
    a2aPayload: {
      method: "message/send",
      skill: "competitive.snapshot",
      readiness,
      battleScore: input.battlecard.battleScore,
      moatScore: input.strategy.moatScore,
      competitorCount: input.battlecard.cards.length,
      sourceUrlCount,
      swotQuadrantCount,
      sourceLockReadiness: input.marketIntel.sourceProofLock.readiness,
      endpoints: {
        competitiveSwotSnapshot: competitiveSnapshotUrl,
        competitiveSwotJson: competitiveSnapshotJsonUrl,
        judgeSnapshot: endpoint(baseUrl, "/judge-snapshot"),
        competitiveBattlecard: battlecardUrl,
        marketIntel: marketIntelUrl,
        moatStress: moatStressUrl
      }
    }
  };
}

function statusTone(status: string) {
  if (["competitive-swot-ready", "lead", "win", "sealed", "proof-locked", "duel-locked", "replay-ready"].includes(status)) return "good";
  if (["competitive-swot-exposed", "risk", "exposed", "missing", "needs-counterproof", "needs-duel-proof"].includes(status)) return "bad";
  return "watch";
}

function renderLinkList(links: CompetitiveSnapshotLink[]) {
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

export function renderCompetitiveSnapshotHtml(snapshot: CompetitiveSnapshot) {
  const swotCards = snapshot.swotMatrix
    .map(
      (group) => `
        <section class="swot-card">
          <h3>${escapeHtml(group.quadrant)}</h3>
          ${group.items
            .map(
              (item) => `
                <article class="${escapeHtml(item.signal)}">
                  <strong>${escapeHtml(item.title)}</strong>
                  <p>${escapeHtml(item.detail)}</p>
                </article>`
            )
            .join("")}
        </section>`
    )
    .join("");
  const competitorCards = snapshot.competitors
    .map(
      (card) => `
        <article class="competitor-card ${statusTone(card.status)}">
          <div><span>${escapeHtml(card.threatLevel)}</span><strong>${escapeHtml(card.score)}</strong></div>
          <h3>${escapeHtml(card.competitor)}</h3>
          <small>${escapeHtml(card.category)}</small>
          <b>${escapeHtml(card.judgeQuestion)}</b>
          <p>${escapeHtml(card.whereTheyWin)}</p>
          <strong>${escapeHtml(card.shortAnswer)}</strong>
          <em>${escapeHtml(card.whereWeWin)}</em>
          <small>${escapeHtml(card.proofRoute)}</small>
          <div class="source-row">
            ${card.sourceUrls.map((source) => `<a href="${escapeHtml(source.url)}">${escapeHtml(source.label)}</a>`).join("")}
          </div>
          <div class="chip-row">
            ${card.swotLinks.map((link) => `<span>${escapeHtml(link.quadrant)}: ${escapeHtml(link.title)}</span>`).join("")}
          </div>
        </article>`
    )
    .join("");
  const duelRows = snapshot.criteriaDuel.rows
    .map(
      (row) => `
        <tr>
          <td><strong>${escapeHtml(row.label)}</strong><span>${escapeHtml(row.status)} / ${escapeHtml(row.score)}</span></td>
          <td>${escapeHtml(row.targetCompetitor)}</td>
          <td>${escapeHtml(row.ourCounter)}</td>
          <td>${escapeHtml(row.swotSignal.quadrant)}: ${escapeHtml(row.swotSignal.title)}<small>${escapeHtml(row.sourceCount)} sources</small></td>
        </tr>`
    )
    .join("");
  const proofChecks = snapshot.proofLock.checks
    .map(
      (check) => `
        <article class="proof-check ${statusTone(check.status)}">
          <div><strong>${escapeHtml(check.label)}</strong><span>${escapeHtml(check.status)}</span></div>
          <p>${escapeHtml(check.proof)}</p>
        </article>`
    )
    .join("");
  const sourceRows = snapshot.sourceLedger
    .map(
      (source) => `
        <a class="source-ledger" href="${escapeHtml(source.url)}">
          <span>${escapeHtml(source.sourceType)}</span>
          <strong>${escapeHtml(source.label)}</strong>
          <small>${escapeHtml(source.currentSignal)}</small>
        </a>`
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
  const scriptLines = snapshot.judgeScript.map((line) => `<li>${escapeHtml(line)}</li>`).join("");

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Competitive SWOT Snapshot</title>
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
      h1 { margin: 8px 0 10px; font-size: clamp(2rem, 5vw, 4.6rem); line-height: 1; letter-spacing: 0; max-width: 920px; }
      header p { color: var(--muted); max-width: 820px; }
      .metric-grid, .links-grid, .swot-grid, .competitor-grid, .proof-grid, .source-grid {
        display: grid;
        gap: 12px;
      }
      .metric-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); margin-top: 22px; }
      .metric, .section, .swot-card, .competitor-card, .proof-check, .source-ledger, .api-row {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 8px;
        box-shadow: 0 1px 0 rgba(23, 32, 29, 0.03);
      }
      .metric { padding: 14px; min-width: 0; }
      .metric span { display: block; color: var(--muted); font-size: 0.75rem; font-weight: 800; }
      .metric strong { display: block; margin-top: 4px; font-size: 1.45rem; line-height: 1; overflow-wrap: anywhere; }
      .metric.good { background: var(--mint); border-color: #b9dfd1; }
      .metric.watch { background: var(--amber-bg); border-color: #ecd58c; }
      .metric.bad { background: #ffe4de; border-color: #efb2a6; }
      .section { padding: 18px; margin: 14px 0; }
      .section h2 { margin: 0 0 12px; font-size: 1.05rem; }
      .links-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .link-row, .source-ledger { display: grid; gap: 4px; padding: 12px; text-decoration: none; }
      .link-row span, .source-ledger span, .api-row span { color: var(--blue); font-size: 0.72rem; font-weight: 900; }
      .link-row small, .source-ledger small { color: var(--muted); }
      .swot-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .swot-card { padding: 12px; }
      .swot-card h3 { margin: 0 0 10px; color: var(--green); text-transform: uppercase; font-size: 0.82rem; }
      .swot-card article { padding: 10px 0; border-top: 1px solid var(--line); }
      .swot-card p, .competitor-card p, .proof-check p, .api-row p { color: var(--muted); margin: 6px 0 0; }
      .competitor-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .competitor-card { display: grid; align-content: start; gap: 8px; padding: 13px; }
      .competitor-card div:first-child, .proof-check div, .api-row div { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
      .competitor-card h3 { margin: 0; font-size: 1.02rem; }
      .competitor-card small, .competitor-card em { color: var(--muted); overflow-wrap: anywhere; }
      .competitor-card span, .proof-check span { font-size: 0.74rem; font-weight: 900; color: var(--green); }
      .competitor-card.watch span, .proof-check.watch span { color: var(--amber); }
      .competitor-card.bad span, .proof-check.bad span { color: var(--coral); }
      .source-row, .chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
      .source-row a, .chip-row span {
        border: 1px solid #cfe2d9;
        border-radius: 999px;
        padding: 4px 8px;
        color: #21423d;
        background: #eef8f4;
        font-size: 0.72rem;
        font-weight: 800;
        text-decoration: none;
      }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      th, td { padding: 12px 10px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; overflow-wrap: anywhere; }
      th { color: var(--muted); font-size: 0.75rem; }
      td span, td small { display: block; color: var(--muted); font-size: 0.76rem; margin-top: 3px; }
      .proof-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .proof-check { padding: 12px; }
      .source-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .api-row { padding: 12px; margin: 10px 0; }
      .api-row small { color: var(--muted); text-align: right; overflow-wrap: anywhere; }
      code { display: block; white-space: pre-wrap; overflow-wrap: anywhere; padding: 10px; border-radius: 8px; background: #17201d; color: #eef8f4; font-size: 0.78rem; }
      ol { margin: 0; padding-left: 22px; color: var(--muted); }
      li + li { margin-top: 8px; }
      footer { color: var(--muted); font-size: 0.84rem; padding: 10px 0 36px; }
      @media (max-width: 860px) {
        header { padding-top: 28px; }
        .metric-grid, .links-grid, .swot-grid, .competitor-grid, .proof-grid, .source-grid { grid-template-columns: 1fr; }
        table, thead, tbody, tr, th, td { display: block; }
        thead { display: none; }
        tr { border-top: 1px solid var(--line); padding: 8px 0; }
        td { border-bottom: 0; padding: 8px 0; }
      }
    </style>
  </head>
  <body>
    <header>
      <div class="eyebrow">Competitive SWOT Snapshot</div>
      <h1>${escapeHtml(snapshot.headline)}</h1>
      <p>${escapeHtml(snapshot.hardTruth)}</p>
      <div class="metric-grid">
        <div class="metric ${statusTone(snapshot.readiness)}"><span>Readiness</span><strong>${escapeHtml(snapshot.readiness)}</strong></div>
        <div class="metric good"><span>Battle</span><strong>${escapeHtml(snapshot.summary.battleScore)}</strong></div>
        <div class="metric good"><span>Criteria Duel</span><strong>${escapeHtml(snapshot.summary.criteriaDuelScore)}</strong></div>
        <div class="metric watch"><span>Source Lock</span><strong>${escapeHtml(snapshot.summary.sourceLockReadiness)}</strong></div>
        <div class="metric good"><span>SWOT</span><strong>${escapeHtml(snapshot.summary.swotQuadrantCount)}/4</strong></div>
      </div>
    </header>
    <main>
      <section class="section">
        <h2>First-Click Links</h2>
        <div class="links-grid">${renderLinkList(snapshot.links)}</div>
      </section>
      <section class="section">
        <h2>Strategic Thesis</h2>
        <p>${escapeHtml(snapshot.thesis)}</p>
      </section>
      <section class="section">
        <h2>SWOT Matrix</h2>
        <div class="swot-grid">${swotCards}</div>
      </section>
      <section class="section">
        <h2>Competitor Battlecards</h2>
        <div class="competitor-grid">${competitorCards}</div>
      </section>
      <section class="section">
        <h2>Criteria Duel</h2>
        <p>${escapeHtml(snapshot.criteriaDuel.judgeLine)}</p>
        <table>
          <thead><tr><th>Criterion</th><th>Competitor</th><th>Counter</th><th>SWOT</th></tr></thead>
          <tbody>${duelRows}</tbody>
        </table>
      </section>
      <section class="section">
        <h2>Competitive Proof Lock</h2>
        <p>${escapeHtml(snapshot.proofLock.judgeLine)}</p>
        <div class="proof-grid">${proofChecks}</div>
      </section>
      <section class="section">
        <h2>Source Ledger</h2>
        <div class="source-grid">${sourceRows}</div>
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
