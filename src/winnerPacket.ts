import type { JudgeAcceptanceMatrix } from "./acceptanceMatrix.js";
import type { CompetitiveBattlecard } from "./competitiveBattlecard.js";
import type { JudgeRehearsalRoom, JudgeRehearsalStatus } from "./judgeRehearsal.js";
import type { PilotEconomics } from "./pilotEconomics.js";
import type { PrizeCriterion, PrizeStrategyBoard } from "./prizeStrategy.js";
import type { ReleaseDriftGuard, ReleaseDriftVerdict } from "./releaseDrift.js";
import type { SubmissionCloseoutWorkbench } from "./submissionCloseout.js";

export type WinnerPacketReadiness = "winner-packet-ready" | "external-gap-packet" | "needs-proof";
export type WinnerPacketStatus = "ready" | "watch" | "blocked";

export type WinnerCriterionPacket = {
  id: string;
  label: string;
  status: WinnerPacketStatus;
  score: number;
  target: number;
  judgeLine: string;
  proofUrl: string;
  show: string;
  objection: string;
  answer: string;
  recordingCue: string;
};

export type WinnerQuestionPacket = {
  id: string;
  question: string;
  answer: string;
  proofUrl: string;
  status: WinnerPacketStatus;
};

export type WinnerPacketSubmissionCopy = {
  oneLine: string;
  winnerThesis: string;
  proofOrder: string[];
  missingExternal: string[];
  tags: string[];
};

export type WinnerReleaseLockReadiness = "release-current" | "release-drift-watch" | "release-blocked" | "release-not-checked";

export type WinnerReleaseLock = {
  id: string;
  readiness: WinnerReleaseLockReadiness;
  status: WinnerPacketStatus;
  score: number;
  verdict: ReleaseDriftVerdict | "not-checked";
  targetBaseUrl: string;
  proof: string;
  nextAction: string;
  missingSkills: string[];
  missingAgentCardSignals: string[];
  evidenceUrl: string;
};

export type WinnerProofPacket = {
  id: string;
  packetScore: number;
  readiness: WinnerPacketReadiness;
  headline: string;
  hardTruth: string;
  nextAction: string;
  criteria: WinnerCriterionPacket[];
  judgeQuestions: WinnerQuestionPacket[];
  recordingOrder: Array<{ id: string; timeRange: string; screen: string; proofUrl: string; status: WinnerPacketStatus }>;
  releaseLock: WinnerReleaseLock;
  submissionCopy: WinnerPacketSubmissionCopy;
  a2aPayload: Record<string, unknown>;
};

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

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function statusFromScore(score: number): WinnerPacketStatus {
  if (score >= 86) return "ready";
  if (score >= 74) return "watch";
  return "blocked";
}

function statusFromRehearsal(status: JudgeRehearsalStatus): WinnerPacketStatus {
  return status;
}

function buildReleaseLock(baseUrl: string, releaseDrift?: ReleaseDriftGuard): WinnerReleaseLock {
  const evidenceUrl = absoluteUrl(baseUrl, "/api/release-drift");
  if (!releaseDrift) {
    return {
      id: "winner-release-lock-not-checked",
      readiness: "release-not-checked",
      status: "watch",
      score: 70,
      verdict: "not-checked",
      targetBaseUrl: "",
      proof: "Release Drift Guard was not checked for this winner packet.",
      nextAction: "Run Winner Packet with Release Drift enabled before recording or submitting.",
      missingSkills: [],
      missingAgentCardSignals: [],
      evidenceUrl
    };
  }

  const status: WinnerPacketStatus = releaseDrift.verdict === "release-current" ? "ready" : "blocked";
  const readiness: WinnerReleaseLockReadiness =
    releaseDrift.verdict === "release-current" ? "release-current" : releaseDrift.verdict === "deploy-drift" ? "release-drift-watch" : "release-blocked";
  return {
    id: `winner-release-lock-${releaseDrift.driftScore}-${readiness}`,
    readiness,
    status,
    score: releaseDrift.verdict === "release-current" ? 100 : releaseDrift.verdict === "deploy-drift" ? 35 : 20,
    verdict: releaseDrift.verdict,
    targetBaseUrl: releaseDrift.targetBaseUrl,
    proof: `${releaseDrift.verdict}; ${releaseDrift.observedSkillCount}/${releaseDrift.expectedSkillCount} skills; missing skills ${releaseDrift.missingSkills.join(", ") || "none"}; missing signals ${releaseDrift.missingAgentCardSignals.join(", ") || "none"}.`,
    nextAction:
      releaseDrift.verdict === "release-current"
        ? "Release Drift Guard is current; keep this proof in the recording."
        : releaseDrift.nextActions[0]?.action ?? "Redeploy latest main to Cloud Run and rerun Release Drift Guard.",
    missingSkills: releaseDrift.missingSkills,
    missingAgentCardSignals: releaseDrift.missingAgentCardSignals,
    evidenceUrl
  };
}

function criterionById(prize: PrizeStrategyBoard, id: string): PrizeCriterion | undefined {
  return prize.criteria.find((criterion) => criterion.id === id);
}

function criterionPacket(input: {
  baseUrl: string;
  prize: PrizeStrategyBoard;
  id: string;
  label: string;
  proofPath: string;
  show: string;
  objection: string;
  answer: string;
  recordingCue: string;
}): WinnerCriterionPacket {
  const criterion = criterionById(input.prize, input.id);
  const score = criterion?.currentScore ?? input.prize.prizeScore;
  const target = criterion?.targetScore ?? 92;
  return {
    id: input.id,
    label: input.label,
    status: statusFromScore(score),
    score,
    target,
    judgeLine: criterion?.decisiveProof ?? input.answer,
    proofUrl: absoluteUrl(input.baseUrl, input.proofPath),
    show: input.show,
    objection: input.objection,
    answer: input.answer,
    recordingCue: input.recordingCue
  };
}

function readinessFrom(input: {
  packetScore: number;
  acceptance: JudgeAcceptanceMatrix;
  closeout: SubmissionCloseoutWorkbench;
  criteria: WinnerCriterionPacket[];
  releaseLock: WinnerReleaseLock;
}): WinnerPacketReadiness {
  if (input.acceptance.verdict === "not-accepted" || input.criteria.some((criterion) => criterion.status === "blocked") || input.releaseLock.status === "blocked") {
    return "needs-proof";
  }
  if (input.closeout.readiness !== "ready-to-submit" || input.acceptance.verdict === "accepted-with-external-gaps" || input.releaseLock.status !== "ready") {
    return "external-gap-packet";
  }
  return input.packetScore >= 90 ? "winner-packet-ready" : "external-gap-packet";
}

export function buildWinnerProofPacket(input: {
  baseUrl: string;
  acceptance: JudgeAcceptanceMatrix;
  battlecard: CompetitiveBattlecard;
  pilotEconomics: PilotEconomics;
  prize: PrizeStrategyBoard;
  rehearsal: JudgeRehearsalRoom;
  closeout: SubmissionCloseoutWorkbench;
  releaseDrift?: ReleaseDriftGuard;
}): WinnerProofPacket {
  const { baseUrl, acceptance, battlecard, pilotEconomics, prize, rehearsal, closeout, releaseDrift } = input;
  const base = baseUrl.replace(/\/$/, "");
  const releaseLock = buildReleaseLock(base, releaseDrift);
  const strongestBattlecard = [...battlecard.cards].sort((left, right) => right.score - left.score)[0];
  const highestBuyerObjection = pilotEconomics.buyerObjections[0];
  const criteria: WinnerCriterionPacket[] = [
    criterionPacket({
      baseUrl: base,
      prize,
      id: "agent-centrality",
      label: "AI agent centrality",
      proofPath: "/.well-known/agent-card.json",
      show: "Agent CardとA2A artifactを開き、AI能力の探索、購入判断、委任、検収が主操作であることを見せる。",
      objection: "これは単なるダッシュボードでは？",
      answer: "市場探索、契約、A2A委任、検証、運用、提出までをAIの判断連鎖として返します。",
      recordingCue: "最初の10秒でAgent Cardのskill surfaceとA2A payloadを見せる。"
    }),
    criterionPacket({
      baseUrl: base,
      prize,
      id: "approach",
      label: "Problem approach",
      proofPath: "/api/competitive-battlecard",
      show: "Competitive Battlecardで公式ソース、SWOT receipt、競合反論を開く。",
      objection: strongestBattlecard?.judgeQuestion ?? "ADKやCrewAIで十分では？",
      answer: strongestBattlecard?.shortAnswer ?? battlecard.thesis,
      recordingCue: strongestBattlecard?.recordingCue ?? "Battlecardの最上位カードを30秒以内に開く。"
    }),
    criterionPacket({
      baseUrl: base,
      prize,
      id: "usability",
      label: "Usability",
      proofPath: "/api/judge-rehearsal",
      show: "Judge RehearsalのsegmentsとQuestion Deckで、審査員がどこを押せばよいかを固定する。",
      objection: "機能が多すぎて初見では迷うのでは？",
      answer: "最初の90秒をsegments、proof URL、想定質問に分解し、機能一覧ではなく証拠順に進めます。",
      recordingCue: "Judge Rehearsal Roomの0-90s segmentsをそのまま動画本編にする。"
    }),
    criterionPacket({
      baseUrl: base,
      prize,
      id: "practicality",
      label: "Practical value",
      proofPath: "/api/pilot-economics",
      show: "Pilot Economicsでpayback days、価格レーン、買い手反論を見せる。",
      objection: highestBuyerObjection?.objection ?? "現場価値はスコアだけでは？",
      answer: highestBuyerObjection?.answer ?? pilotEconomics.verdict,
      recordingCue: `${pilotEconomics.unitEconomics.paybackDays}d paybackをbuyer laneで読み上げる。`
    }),
    criterionPacket({
      baseUrl: base,
      prize,
      id: "implementation",
      label: "Implementation",
      proofPath: "/api/release-drift",
      show: "Release Drift Guard、GitHub Actions、Cloud Run revisionを見せる。",
      objection: "提出URLは本当に最新実装ですか？",
      answer: "Agent Card、A2A artifact、Acceptance Matrixを公開URLで再プローブし、古いrevisionなら提出前に止めます。",
      recordingCue: "Release Drift Guardのrelease-currentとskill countを最後に開く。"
    })
  ];

  const judgeQuestions: WinnerQuestionPacket[] = [
    ...rehearsal.questionDeck.slice(0, 4).map((question) => ({
      id: question.id,
      question: question.question,
      answer: question.answer,
      proofUrl: question.proofUrl,
      status: statusFromRehearsal(question.status)
    })),
    ...battlecard.topRisks.slice(0, 2).map((risk) => ({
      id: `battlecard-${risk.id}`,
      question: risk.risk,
      answer: risk.response,
      proofUrl: absoluteUrl(base, "/api/competitive-battlecard"),
      status: risk.severity === "high" ? ("watch" as const) : ("ready" as const)
    }))
  ];

  const externalGaps = closeout.urlStatuses.filter((item) => item.status !== "ready").map((item) => item.id);
  const packetScore = Math.round(
    clamp(
      average([
        acceptance.acceptanceScore,
        battlecard.battleScore,
        pilotEconomics.economicsScore,
        prize.prizeScore,
        rehearsal.rehearsalScore,
        closeout.closeoutScore,
        releaseLock.score
      ]) +
        (criteria.every((criterion) => criterion.status === "ready") ? 3 : 0) -
        Math.min(5, externalGaps.length * 2)
    )
  );
  const readiness = readinessFrom({ packetScore, acceptance, closeout, criteria, releaseLock });
  const nextAction =
    releaseLock.status !== "ready"
      ? releaseLock.nextAction
      : readiness === "needs-proof"
      ? (criteria.find((criterion) => criterion.status === "blocked")?.show ?? "Fix blocked winner proof")
      : readiness === "external-gap-packet"
        ? closeout.nextAction.label
        : "Record the winner packet and submit the three URLs";

  return {
    id: `winner-packet-${packetScore}-${readiness}`,
    packetScore,
    readiness,
    headline:
      readiness === "winner-packet-ready"
        ? "審査5項目の勝ち証拠を1枚で提示できます。"
        : readiness === "external-gap-packet"
          ? "勝ち証拠は揃っています。外部URLだけを正直にwatchとして残します。"
          : "勝ち証拠のどれかがblockedです。録画前に補強が必要です。",
    hardTruth:
      "優勝作戦は機能数ではなく、審査5項目それぞれに短い主張、開く証拠URL、反論への回答、録画cueが揃っているかで決まります。",
    nextAction,
    criteria,
    judgeQuestions,
    recordingOrder: rehearsal.segments.map((segment) => ({
      id: segment.id,
      timeRange: segment.timeRange,
      screen: segment.screen,
      proofUrl: segment.proofUrl,
      status: statusFromRehearsal(segment.status)
    })),
    releaseLock,
    submissionCopy: {
      oneLine: "AI能力を市場から選び、雇い、A2Aで委任し、Cloud Run運用と提出証拠まで閉じるDevOpsエージェント。",
      winnerThesis: prize.winHypothesis,
      proofOrder: criteria.map((criterion) => `${criterion.label}: ${criterion.proofUrl}`),
      missingExternal: externalGaps,
      tags: ["findy_hackathon", "Cloud Run", "Gemini", "A2A", "DevOps"]
    },
    a2aPayload: {
      method: "message/send",
      skill: "winner.packet",
      packetScore,
      readiness,
      nextAction,
      releaseLock: {
        readiness: releaseLock.readiness,
        status: releaseLock.status,
        verdict: releaseLock.verdict,
        score: releaseLock.score,
        targetBaseUrl: releaseLock.targetBaseUrl,
        missingSkills: releaseLock.missingSkills,
        missingAgentCardSignals: releaseLock.missingAgentCardSignals
      },
      criteria: criteria.map((criterion) => ({
        id: criterion.id,
        status: criterion.status,
        proofUrl: criterion.proofUrl
      })),
      endpoints: {
        winnerPacketPage: absoluteUrl(base, "/winner-packet"),
        winnerPacket: absoluteUrl(base, "/api/winner-packet"),
        judgeRehearsal: absoluteUrl(base, "/api/judge-rehearsal"),
        competitiveBattlecard: absoluteUrl(base, "/api/competitive-battlecard"),
        pilotEconomics: absoluteUrl(base, "/api/pilot-economics"),
        releaseDrift: absoluteUrl(base, "/api/release-drift"),
        submissionCloseout: absoluteUrl(base, "/api/submission-closeout")
      }
    }
  };
}

function tone(status: string) {
  if (["winner-packet-ready", "ready", "release-current"].includes(status)) return "good";
  if (["needs-proof", "blocked", "release-blocked"].includes(status)) return "bad";
  return "watch";
}

export function renderWinnerProofPacketHtml(packet: WinnerProofPacket) {
  const criteria = packet.criteria
    .map(
      (criterion) => `
        <article class="criterion ${tone(criterion.status)}">
          <div><strong>${escapeHtml(criterion.label)}</strong><span>${escapeHtml(criterion.status)} / ${escapeHtml(criterion.score)}→${escapeHtml(criterion.target)}</span></div>
          <p>${escapeHtml(criterion.judgeLine)}</p>
          <dl>
            <dt>Show</dt><dd>${escapeHtml(criterion.show)}</dd>
            <dt>Objection</dt><dd>${escapeHtml(criterion.objection)}</dd>
            <dt>Answer</dt><dd>${escapeHtml(criterion.answer)}</dd>
            <dt>Cue</dt><dd>${escapeHtml(criterion.recordingCue)}</dd>
          </dl>
          <a href="${escapeHtml(criterion.proofUrl)}">Open proof</a>
        </article>`
    )
    .join("");
  const questions = packet.judgeQuestions
    .map(
      (question) => `
        <article class="question ${tone(question.status)}">
          <div><strong>${escapeHtml(question.question)}</strong><span>${escapeHtml(question.status)}</span></div>
          <p>${escapeHtml(question.answer)}</p>
          <a href="${escapeHtml(question.proofUrl)}">Open proof</a>
        </article>`
    )
    .join("");
  const recording = packet.recordingOrder
    .map(
      (step) => `
        <tr>
          <td><strong>${escapeHtml(step.timeRange)}</strong><span>${escapeHtml(step.status)}</span></td>
          <td>${escapeHtml(step.screen)}</td>
          <td><a href="${escapeHtml(step.proofUrl)}">Open proof</a></td>
        </tr>`
    )
    .join("");
  const proofOrder = packet.submissionCopy.proofOrder.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const missingExternal =
    packet.submissionCopy.missingExternal.length === 0
      ? "<li>Missing external URLs: none</li>"
      : packet.submissionCopy.missingExternal.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const endpointEntries =
    typeof packet.a2aPayload.endpoints === "object" && packet.a2aPayload.endpoints
      ? Object.entries(packet.a2aPayload.endpoints as Record<string, unknown>).filter((entry): entry is [string, string] => typeof entry[1] === "string")
      : [];
  const endpoints =
    endpointEntries.length === 0
      ? "<li>A2A endpoints: none</li>"
      : endpointEntries.map(([label, url]) => `<li><strong>${escapeHtml(label)}</strong>: <a href="${escapeHtml(url)}">${escapeHtml(url)}</a></li>`).join("");

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Winner Proof Packet</title>
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
      h1 { margin: 8px 0 10px; font-size: clamp(2rem, 5vw, 4.45rem); line-height: 1; letter-spacing: 0; max-width: 980px; }
      header p { color: var(--muted); max-width: 860px; }
      .metric-grid, .criteria-grid, .question-grid {
        display: grid;
        gap: 12px;
      }
      .metric-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 22px; }
      .metric, .section, .criterion, .question {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 8px;
        box-shadow: 0 1px 0 rgba(23, 32, 29, 0.03);
      }
      .metric { padding: 14px; min-width: 0; }
      .metric span { display: block; color: var(--muted); font-size: 0.75rem; font-weight: 800; }
      .metric strong { display: block; margin-top: 4px; font-size: 1.35rem; line-height: 1.05; overflow-wrap: anywhere; }
      .good { background: var(--mint); border-color: #b9dfd1; }
      .watch { background: var(--amber-bg); border-color: #ecd58c; }
      .bad { background: #ffe4de; border-color: #efb2a6; }
      .section { padding: 18px; margin: 14px 0; }
      .section h2 { margin: 0 0 12px; font-size: 1.05rem; }
      .criteria-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .question-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .criterion, .question { padding: 12px; }
      .criterion div, .question div { display: flex; gap: 10px; justify-content: space-between; align-items: center; }
      .criterion span, .question span { color: var(--blue); font-size: 0.72rem; font-weight: 900; }
      .criterion p, .question p { margin: 8px 0; }
      dl { display: grid; grid-template-columns: minmax(80px, auto) 1fr; gap: 6px 10px; margin: 10px 0; }
      dt { color: var(--muted); font-size: 0.76rem; font-weight: 900; }
      dd { margin: 0; overflow-wrap: anywhere; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      th, td { padding: 12px 10px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; overflow-wrap: anywhere; }
      th { color: var(--muted); font-size: 0.75rem; }
      td span { display: block; color: var(--muted); font-size: 0.76rem; margin-top: 3px; }
      ul { margin: 0; padding-left: 22px; color: var(--muted); }
      li + li { margin-top: 8px; }
      footer { color: var(--muted); font-size: 0.84rem; padding: 10px 0 36px; }
      @media (max-width: 860px) {
        header { padding-top: 28px; }
        .metric-grid, .criteria-grid, .question-grid { grid-template-columns: 1fr; }
        table, thead, tbody, tr, th, td { display: block; }
        thead { display: none; }
        tr { border-top: 1px solid var(--line); padding: 8px 0; }
        td { border-bottom: 0; padding: 8px 0; }
      }
    </style>
  </head>
  <body>
    <header>
      <div class="eyebrow">Winner Proof Packet</div>
      <h1>${escapeHtml(packet.headline)}</h1>
      <p>${escapeHtml(packet.hardTruth)}</p>
      <div class="metric-grid">
        <div class="metric ${tone(packet.readiness)}"><span>Readiness</span><strong>${escapeHtml(packet.readiness)}</strong></div>
        <div class="metric ${tone(packet.releaseLock.readiness)}"><span>Release Lock</span><strong>${escapeHtml(packet.releaseLock.readiness)}</strong></div>
        <div class="metric good"><span>Packet Score</span><strong>${escapeHtml(packet.packetScore)}</strong></div>
        <div class="metric ${packet.submissionCopy.missingExternal.length > 0 ? "watch" : "good"}"><span>External Gaps</span><strong>${escapeHtml(packet.submissionCopy.missingExternal.length)}</strong></div>
      </div>
    </header>
    <main>
      <section class="section">
        <h2>Next Action</h2>
        <p>${escapeHtml(packet.nextAction)}</p>
      </section>
      <section class="section">
        <h2>Five Criteria Proof Cards</h2>
        <div class="criteria-grid">${criteria}</div>
      </section>
      <section class="section">
        <h2>Objection Answers</h2>
        <div class="question-grid">${questions}</div>
      </section>
      <section class="section">
        <h2>Recording Order</h2>
        <table>
          <thead><tr><th>Time</th><th>Screen</th><th>Proof</th></tr></thead>
          <tbody>${recording}</tbody>
        </table>
      </section>
      <section class="section">
        <h2>Winner Release Lock</h2>
        <p>${escapeHtml(packet.releaseLock.proof)}</p>
        <p>${escapeHtml(packet.releaseLock.nextAction)}</p>
        <a href="${escapeHtml(packet.releaseLock.evidenceUrl)}">Open release proof</a>
      </section>
      <section class="section">
        <h2>Submission Copy</h2>
        <p><strong>${escapeHtml(packet.submissionCopy.oneLine)}</strong></p>
        <p>${escapeHtml(packet.submissionCopy.winnerThesis)}</p>
        <ul>${proofOrder}</ul>
      </section>
      <section class="section">
        <h2>Missing External</h2>
        <ul>${missingExternal}</ul>
      </section>
      <section class="section">
        <h2>A2A Endpoints</h2>
        <ul>${endpoints}</ul>
      </section>
    </main>
    <footer>${escapeHtml(packet.id)}</footer>
  </body>
</html>`;
}
