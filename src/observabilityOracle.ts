import type { LiveEvidenceRun } from "./liveEvidence.js";
import type { OpsDrill, OpsSignalStatus } from "./ops.js";
import type { PilotEconomics } from "./pilotEconomics.js";
import type { WinningStrategy } from "./strategy.js";
import type { Recommendation } from "./types.js";

export type ObservabilityOracleReadiness = "operator-ready" | "watch" | "rollback-required";
export type ObservabilityOracleStatus = "clear" | "watch" | "blocked";

export type ObservabilityReceipt = {
  id: string;
  label: string;
  status: ObservabilityOracleStatus;
  metric: string;
  evidence: string;
  judgeLine: string;
};

export type ObservabilityDecision = {
  id: string;
  actor: string;
  status: ObservabilityOracleStatus;
  decision: string;
  confidence: number;
  evidence: string;
};

export type ObservabilityLoopStep = {
  id: string;
  phase: "observe" | "decide" | "monetize" | "rebuy" | "seal";
  owner: string;
  action: string;
  output: string;
  proofUrl: string;
  status: ObservabilityOracleStatus;
};

export type ObservabilityOracle = {
  id: string;
  oracleScore: number;
  readiness: ObservabilityOracleReadiness;
  headline: string;
  hardTruth: string;
  receipts: ObservabilityReceipt[];
  decisions: ObservabilityDecision[];
  loop: ObservabilityLoopStep[];
  runbook: string[];
  a2aPayload: Record<string, unknown>;
};

export const OBSERVABILITY_ORACLE_SKILL_ID = "observability.oracle";
export const OBSERVABILITY_ORACLE_LOCK_TAG = "observability-oracle-lock";
export const OBSERVABILITY_ORACLE_REQUIRED_SIGNAL = `${OBSERVABILITY_ORACLE_SKILL_ID}:tag:${OBSERVABILITY_ORACLE_LOCK_TAG}`;

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

function criterionScore(strategy: WinningStrategy, id: string) {
  return strategy.judgeCriteria.find((criterion) => criterion.id === id)?.score ?? strategy.judgeScore;
}

function statusFromOps(status: OpsSignalStatus): ObservabilityOracleStatus {
  if (status === "pass") return "clear";
  if (status === "watch") return "watch";
  return "blocked";
}

function statusFromScore(score: number): ObservabilityOracleStatus {
  if (score >= 88) return "clear";
  if (score >= 70) return "watch";
  return "blocked";
}

function receiptScore(status: ObservabilityOracleStatus) {
  if (status === "clear") return 100;
  if (status === "watch") return 82;
  return 30;
}

export function observabilityProofScore(oracle: ObservabilityOracle) {
  const publicProof = oracle.receipts.find((receipt) => receipt.id === "public-proof");
  const buyerSlo = oracle.receipts.find((receipt) => receipt.id === "buyer-slo");
  const receiptAverage = average(oracle.receipts.map((receipt) => receiptScore(receipt.status)));

  return Math.round(
    clamp(
      average([
        oracle.oracleScore,
        receiptAverage,
        publicProof ? receiptScore(publicProof.status) : 0,
        buyerSlo ? receiptScore(buyerSlo.status) : 0
      ])
    )
  );
}

function readinessFrom(input: { score: number; liveEvidence: LiveEvidenceRun; opsDrill: OpsDrill }): ObservabilityOracleReadiness {
  if (input.opsDrill.rollbackRecommended || input.liveEvidence.readiness === "blocked") return "rollback-required";
  if (input.score >= 88 && input.liveEvidence.readiness === "live-ready" && input.opsDrill.severity !== "degraded" && input.opsDrill.severity !== "critical") {
    return "operator-ready";
  }
  return "watch";
}

function yen(value: number) {
  return `${value.toLocaleString("ja-JP")}円`;
}

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function tone(status: string) {
  if (["operator-ready", "clear"].includes(status)) return "good";
  if (["rollback-required", "blocked"].includes(status)) return "bad";
  return "watch";
}

function mainDecision(readiness: ObservabilityOracleReadiness) {
  if (readiness === "operator-ready") return "Keep serving and seal the public proof";
  if (readiness === "rollback-required") return "Rollback or redeploy before the judge run";
  return "Keep serving with watch receipts";
}

export function buildObservabilityOracle(input: {
  baseUrl: string;
  recommendation: Recommendation;
  strategy: WinningStrategy;
  liveEvidence: LiveEvidenceRun;
  opsDrill: OpsDrill;
  pilotEconomics: PilotEconomics;
}): ObservabilityOracle {
  const { baseUrl, recommendation, strategy, liveEvidence, opsDrill, pilotEconomics } = input;
  const base = baseUrl.replace(/\/$/, "");
  const practicalScore = criterionScore(strategy, "practicality");
  const implementationScore = criterionScore(strategy, "implementation");
  const watchSignals = opsDrill.signals.filter((signal) => signal.status === "watch").length;
  const blockedSignals = opsDrill.signals.filter((signal) => signal.status === "fail").length;
  const clearSignals = opsDrill.signals.length - watchSignals - blockedSignals;
  const nextOpsHire = opsDrill.nextOpsAgent?.name ?? "current squad";
  const oracleScore = Math.round(
    clamp(
      average([
        liveEvidence.evidenceScore,
        opsDrill.readinessScore,
        pilotEconomics.economicsScore,
        pilotEconomics.unitEconomics.confidenceScore,
        practicalScore,
        implementationScore
      ])
    )
  );
  const readiness = readinessFrom({ score: oracleScore, liveEvidence, opsDrill });
  const decisiveDecision = mainDecision(readiness);

  const receipts: ObservabilityReceipt[] = [
    {
      id: "public-proof",
      label: "公開証拠SLO",
      status: liveEvidence.readiness === "live-ready" ? "clear" : liveEvidence.readiness === "watch" ? "watch" : "blocked",
      metric: `${liveEvidence.evidenceScore} live proof / ${liveEvidence.probes.filter((probe) => probe.status === "passed").length}/${liveEvidence.probes.length} probes`,
      evidence: liveEvidence.summary,
      judgeLine: "公開Cloud Run、Agent Card、A2A、CIを審査員の前で再実行できます。"
    },
    {
      id: "runtime-decision",
      label: "継続/ロールバック判断",
      status: opsDrill.rollbackRecommended ? "blocked" : opsDrill.severity === "watch" ? "watch" : "clear",
      metric: `${opsDrill.readinessScore} ops readiness / ${clearSignals} clear / ${watchSignals} watch / ${blockedSignals} blocked`,
      evidence: opsDrill.summary,
      judgeLine: opsDrill.rollbackRecommended
        ? "公開デモ前に戻す判断までAIが出せます。"
        : "watch項目を分離し、公開継続の判断理由まで説明できます。"
    },
    {
      id: "buyer-slo",
      label: "買い手価値SLO",
      status: statusFromScore(pilotEconomics.economicsScore),
      metric: `${pilotEconomics.unitEconomics.paybackDays}d payback / ${yen(pilotEconomics.unitEconomics.monthlyValueYen)} monthly value`,
      evidence: pilotEconomics.hardTruth,
      judgeLine: "運用観測を単なるログではなく、回収日数と導入判断へ接続します。"
    },
    {
      id: "rebuy-loop",
      label: "A2A買い足しループ",
      status: opsDrill.nextOpsAgent ? "watch" : "clear",
      metric: `${recommendation.selected.length} selected agents / next ${opsDrill.nextOpsAgent?.id ?? "none"}`,
      evidence: opsDrill.nextOpsAgent?.reason ?? "現在の編成で公開運用シグナルを説明できます。",
      judgeLine: `${nextOpsHire}を使い、観測結果を次のAI調達判断へ戻します。`
    },
    ...opsDrill.signals.slice(0, 3).map((signal) => ({
      id: `signal-${signal.id}`,
      label: signal.label,
      status: statusFromOps(signal.status),
      metric: `${signal.value} / ${signal.threshold}`,
      evidence: signal.evidence,
      judgeLine: `${signal.label}をAIが読み、公開継続判断の根拠にします。`
    }))
  ];

  const decisions: ObservabilityDecision[] = [
    {
      id: "serve-or-rollback",
      actor: opsDrill.decisions.find((decision) => decision.id === "release-gate")?.actor ?? "Cloud Run SRE",
      status: readiness === "rollback-required" ? "blocked" : readiness === "watch" ? "watch" : "clear",
      decision: decisiveDecision,
      confidence: Math.round(clamp(average([opsDrill.readinessScore, liveEvidence.evidenceScore]))),
      evidence: opsDrill.decisions.find((decision) => decision.id === "release-gate")?.rationale ?? opsDrill.summary
    },
    {
      id: "seal-proof",
      actor: "Observability Oracle",
      status: liveEvidence.readiness === "blocked" ? "blocked" : liveEvidence.readiness === "watch" ? "watch" : "clear",
      decision: "Turn live probes into judge receipts",
      confidence: liveEvidence.evidenceScore,
      evidence: liveEvidence.hardTruth
    },
    {
      id: "price-operations",
      actor: "A2A Market Broker",
      status: statusFromScore(pilotEconomics.economicsScore),
      decision: "Connect runtime proof to buyer ROI",
      confidence: pilotEconomics.economicsScore,
      evidence: `${pilotEconomics.unitEconomics.paybackDays}d payback and ${yen(pilotEconomics.unitEconomics.monthlyValueYen)} monthly value.`
    }
  ];

  const loop: ObservabilityLoopStep[] = [
    {
      id: "observe-public",
      phase: "observe",
      owner: "Live Evidence Monitor",
      action: "公開URL、Agent Card、A2A、CIをプローブする",
      output: liveEvidence.summary,
      proofUrl: absoluteUrl(base, "/api/live-evidence"),
      status: receipts[0].status
    },
    {
      id: "decide-release",
      phase: "decide",
      owner: "Cloud Run SRE",
      action: "継続公開かロールバックかを判断する",
      output: decisiveDecision,
      proofUrl: absoluteUrl(base, "/api/ops-drill"),
      status: receipts[1].status
    },
    {
      id: "monetize-risk",
      phase: "monetize",
      owner: "Pilot Economics",
      action: "運用リスク低下を月次価値と回収日数へ変換する",
      output: receipts[2].metric,
      proofUrl: absoluteUrl(base, "/api/pilot-economics"),
      status: receipts[2].status
    },
    {
      id: "rebuy-capability",
      phase: "rebuy",
      owner: "A2A Market Broker",
      action: "観測結果を次のAI能力購入へ戻す",
      output: opsDrill.nextOpsAgent ? `next hire ${opsDrill.nextOpsAgent.name}` : "no additional hire required",
      proofUrl: absoluteUrl(base, "/api/squad-optimizer"),
      status: receipts[3].status
    },
    {
      id: "seal-submission",
      phase: "seal",
      owner: "Submission Dossier",
      action: "審査動画とProtoPediaに貼る運用証拠を固定する",
      output: `${oracleScore} oracle score / ${readiness}`,
      proofUrl: absoluteUrl(base, "/api/dossier"),
      status: readiness === "rollback-required" ? "blocked" : readiness === "watch" ? "watch" : "clear"
    }
  ];

  const runbook = [
    `curl -s -X POST ${base}/api/observability-oracle -H 'Content-Type: application/json' --data '{"projectBrief":"A2A Cloud Run Gemini DevOps"}'`,
    `curl -s -X POST ${base}/api/live-evidence -H 'Content-Type: application/json' --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","budget":140,"maxSquadSize":4}'`,
    `curl -s -X POST ${base}/api/ops-drill -H 'Content-Type: application/json' --data '{"projectBrief":"A2A Cloud Run Gemini DevOps"}'`,
    `curl -s -X POST ${base}/api/pilot-economics -H 'Content-Type: application/json' --data '{"projectBrief":"A2A Cloud Run Gemini DevOps"}'`
  ];

  return {
    id: `observability-oracle-${oracleScore}-${readiness}`,
    oracleScore,
    readiness,
    headline:
      readiness === "operator-ready"
        ? "Operational proof is judge-ready"
        : readiness === "rollback-required"
          ? "Operational proof requires recovery before the pitch"
          : "Operational proof is usable, but watch receipts remain",
    hardTruth:
      readiness === "operator-ready"
        ? `公開証拠、運用判断、${pilotEconomics.unitEconomics.paybackDays}日paybackがつながり、DevOps運用価値を1画面で説明できます。`
        : readiness === "rollback-required"
          ? "公開証拠または運用シグナルに失敗があり、このまま録画すると実装力の証拠が弱くなります。"
          : "公開運用は説明できますが、watch項目を審査直前に再実行してreceiptへ固定する必要があります。",
    receipts,
    decisions,
    loop,
    runbook,
    a2aPayload: {
      method: "message/send",
      skill: OBSERVABILITY_ORACLE_SKILL_ID,
      oracleScore,
      readiness,
      decisiveDecision,
      receipts: receipts.map((receipt) => ({
        id: receipt.id,
        status: receipt.status,
        metric: receipt.metric
      })),
      loop: loop.map((step) => ({
        id: step.id,
        phase: step.phase,
        status: step.status,
        proofUrl: step.proofUrl
      })),
      endpoints: {
        observabilityOracle: absoluteUrl(base, "/api/observability-oracle"),
        observabilityOraclePage: absoluteUrl(base, "/observability-oracle"),
        liveEvidence: absoluteUrl(base, "/api/live-evidence"),
        opsDrill: absoluteUrl(base, "/api/ops-drill"),
        pilotEconomics: absoluteUrl(base, "/api/pilot-economics")
      }
    }
  };
}

export function renderObservabilityOracleHtml(oracle: ObservabilityOracle) {
  const metrics = [
    { label: "Readiness", value: oracle.readiness, status: oracle.readiness },
    { label: "Oracle Score", value: oracle.oracleScore, status: oracle.readiness },
    { label: "Receipts", value: oracle.receipts.length, status: "clear" },
    { label: "Decisions", value: oracle.decisions.length, status: "clear" }
  ]
    .map(
      (metric) => `
        <article class="metric ${tone(String(metric.status))}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>`
    )
    .join("");
  const receipts = oracle.receipts
    .map(
      (receipt) => `
        <article class="card ${tone(receipt.status)}">
          <div><strong>${escapeHtml(receipt.label)}</strong><span>${escapeHtml(receipt.status)}</span></div>
          <p>${escapeHtml(receipt.metric)}</p>
          <p>${escapeHtml(receipt.evidence)}</p>
          <small>${escapeHtml(receipt.judgeLine)}</small>
        </article>`
    )
    .join("");
  const decisions = oracle.decisions
    .map(
      (decision) => `
        <article class="card ${tone(decision.status)}">
          <div><strong>${escapeHtml(decision.actor)}</strong><span>${escapeHtml(decision.confidence)}</span></div>
          <p>${escapeHtml(decision.decision)}</p>
          <small>${escapeHtml(decision.evidence)}</small>
        </article>`
    )
    .join("");
  const loop = oracle.loop
    .map(
      (step) => `
        <tr>
          <td><strong>${escapeHtml(step.phase)}</strong><span>${escapeHtml(step.status)}</span></td>
          <td>${escapeHtml(step.owner)}</td>
          <td>${escapeHtml(step.action)}</td>
          <td><a href="${escapeHtml(step.proofUrl)}">${escapeHtml(step.proofUrl)}</a></td>
        </tr>`
    )
    .join("");
  const runbook = oracle.runbook.map((command) => `<li><code>${escapeHtml(command)}</code></li>`).join("");

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Observability Oracle Proof</title>
    <style>
      :root { color-scheme: light; --ink: #17211f; --muted: #61706a; --line: #dbe6df; --paper: #fbfcfa; --panel: #fff; --green: #13715d; --mint: #e6f4ed; --amber: #8a620d; --amber-bg: #fff4d4; --coral: #b24735; --coral-bg: #fff0ec; }
      * { box-sizing: border-box; }
      body { margin: 0; background: var(--paper); color: var(--ink); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1120px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 40px 0 20px; }
      .eyebrow { color: var(--green); font-size: .78rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0; }
      h1 { margin: 8px 0 10px; font-size: clamp(2rem, 5vw, 4.1rem); line-height: 1; letter-spacing: 0; max-width: 980px; }
      h2 { margin: 28px 0 10px; font-size: 1.12rem; }
      p { color: var(--muted); }
      .metrics, .grid { display: grid; gap: 12px; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 22px; }
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .metric, .card, .panel { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); padding: 16px; box-shadow: 0 10px 24px rgba(23, 33, 31, .06); min-width: 0; }
      .metric span, .card span { color: var(--muted); font-size: .74rem; font-weight: 900; text-transform: uppercase; }
      .metric strong { display: block; margin-top: 6px; font-size: 1.45rem; overflow-wrap: anywhere; }
      .card div { display: flex; gap: 12px; justify-content: space-between; align-items: start; }
      .card strong, .card p, .card small, td, li, code { overflow-wrap: anywhere; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      th, td { text-align: left; border-bottom: 1px solid var(--line); padding: 10px 8px; vertical-align: top; }
      th { font-size: .78rem; text-transform: uppercase; color: var(--muted); }
      td span { display: block; color: var(--muted); font-size: .78rem; }
      .good { border-color: #a9d8c2; background: var(--mint); }
      .watch { border-color: #ead39a; background: var(--amber-bg); }
      .bad { border-color: #efb7aa; background: var(--coral-bg); }
      ol { margin: 8px 0 0; padding-left: 20px; }
      footer { padding: 20px 0 40px; color: var(--muted); }
      @media (max-width: 860px) { .metrics, .grid { grid-template-columns: 1fr; } .card div, table, thead, tbody, tr, th, td { display: block; } thead { display: none; } tr { border-top: 1px solid var(--line); padding: 8px 0; } td { border-bottom: 0; padding: 8px 0; } }
    </style>
  </head>
  <body>
    <header>
      <div class="eyebrow">Observability Oracle Proof</div>
      <h1>${escapeHtml(oracle.headline)}</h1>
      <p>${escapeHtml(oracle.hardTruth)}</p>
      <section class="metrics">${metrics}</section>
    </header>
    <main>
      <h2>Receipts</h2>
      <section class="grid">${receipts}</section>
      <h2>Decisions</h2>
      <section class="grid">${decisions}</section>
      <h2>Operate Loop</h2>
      <section class="panel">
        <table>
          <thead><tr><th>Phase</th><th>Owner</th><th>Action</th><th>Proof</th></tr></thead>
          <tbody>${loop}</tbody>
        </table>
      </section>
      <h2>Runbook</h2>
      <section class="panel"><ol>${runbook}</ol></section>
    </main>
    <footer>${escapeHtml(oracle.id)} / A2A skill ${OBSERVABILITY_ORACLE_SKILL_ID}</footer>
  </body>
</html>`;
}
