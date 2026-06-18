import type { WinnerPacketStatus, WinnerProofPacket } from "./winnerPacket.js";

export type ObjectionArenaReadiness = "qa-ready" | "qa-watch" | "needs-proof";

export type ObjectionArenaLane = {
  id: string;
  source: string;
  objection: string;
  answer: string;
  proofUrl: string;
  status: WinnerPacketStatus;
  score: number;
  judgeSignal: string;
  followUp: string;
};

export type ObjectionArenaLock = {
  id: string;
  answeredCount: number;
  totalCount: number;
  blockedCount: number;
  watchCount: number;
  releaseReady: boolean;
  firstProofUrl: string;
};

export type ObjectionArena = {
  id: string;
  arenaScore: number;
  readiness: ObjectionArenaReadiness;
  headline: string;
  hardTruth: string;
  lock: ObjectionArenaLock;
  lanes: ObjectionArenaLane[];
  closingLine: string;
  a2aPayload: Record<string, unknown>;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function statusScore(status: WinnerPacketStatus) {
  if (status === "ready") return 100;
  if (status === "watch") return 78;
  return 30;
}

function readinessFrom(input: { arenaScore: number; blockedCount: number; watchCount: number }): ObjectionArenaReadiness {
  if (input.blockedCount > 0) return "needs-proof";
  if (input.arenaScore >= 90 && input.watchCount === 0) return "qa-ready";
  return "qa-watch";
}

function laneFromCriterion(criterion: WinnerProofPacket["criteria"][number]): ObjectionArenaLane {
  return {
    id: `criterion-${criterion.id}`,
    source: criterion.label,
    objection: criterion.objection,
    answer: criterion.answer,
    proofUrl: criterion.proofUrl,
    status: criterion.status,
    score: criterion.score,
    judgeSignal: `${criterion.label}: ${criterion.judgeLine}`,
    followUp: criterion.recordingCue
  };
}

function laneFromQuestion(question: WinnerProofPacket["judgeQuestions"][number]): ObjectionArenaLane {
  return {
    id: `question-${question.id}`,
    source: "Judge Q&A",
    objection: question.question,
    answer: question.answer,
    proofUrl: question.proofUrl,
    status: question.status,
    score: statusScore(question.status),
    judgeSignal: "質疑応答で質問を受けたら、回答後すぐに証拠URLを開く。",
    followUp: "Winner PacketのRecording Orderへ戻し、次の審査基準に進める。"
  };
}

function releaseLane(packet: WinnerProofPacket): ObjectionArenaLane {
  return {
    id: "release-drift",
    source: "Release Drift",
    objection: "提出URLは本当に最新実装ですか？",
    answer: packet.releaseLock.proof,
    proofUrl: packet.releaseLock.evidenceUrl,
    status: packet.releaseLock.status,
    score: packet.releaseLock.score,
    judgeSignal: `${packet.releaseLock.verdict}: ${packet.releaseLock.targetBaseUrl || "not checked"}`,
    followUp: packet.releaseLock.nextAction
  };
}

export function buildObjectionArena(packet: WinnerProofPacket): ObjectionArena {
  const lanes = [
    ...packet.criteria.map(laneFromCriterion),
    ...packet.judgeQuestions.slice(0, 4).map(laneFromQuestion),
    releaseLane(packet)
  ];
  const blockedCount = lanes.filter((lane) => lane.status === "blocked").length;
  const watchCount = lanes.filter((lane) => lane.status === "watch").length;
  const answeredCount = lanes.filter((lane) => lane.status !== "blocked").length;
  const releaseReady = packet.releaseLock.status === "ready";
  const arenaScore = Math.round(
    clamp(
      average(lanes.map((lane) => lane.score)) * 0.82 +
        packet.packetScore * 0.12 +
        (releaseReady ? 6 : -12) -
        blockedCount * 6 -
        Math.min(4, watchCount)
    )
  );
  const readiness = readinessFrom({ arenaScore, blockedCount, watchCount });
  const lock: ObjectionArenaLock = {
    id: `objection-lock-${answeredCount}-${lanes.length}-${readiness}`,
    answeredCount,
    totalCount: lanes.length,
    blockedCount,
    watchCount,
    releaseReady,
    firstProofUrl: lanes[0]?.proofUrl ?? ""
  };

  return {
    id: `objection-arena-${arenaScore}-${readiness}`,
    arenaScore,
    readiness,
    headline:
      readiness === "qa-ready"
        ? "最終質疑の反論は証拠URL付きで即答できます。"
        : readiness === "qa-watch"
          ? "最終質疑の反論は揃っています。watch項目は録画前に証拠を先出しします。"
          : "最終質疑で刺される反論が残っています。勝ち証拠として扱う前に補強が必要です。",
    hardTruth:
      "優勝に必要なのは機能数ではなく、ADKや既存ツールで十分ではないか、AI中心性は本物か、公開URLは最新か、ROIはあるかを短く答えて証拠へ飛べることです。",
    lock,
    lanes,
    closingLine:
      readiness === "needs-proof"
        ? packet.nextAction
        : "質問を受けたらObjection Arenaで答え、Winner Packetのproof orderへ戻して審査5項目を閉じる。",
    a2aPayload: {
      method: "message/send",
      skill: "judge.objection-arena",
      id: `objection-arena-${arenaScore}-${readiness}`,
      arenaScore,
      readiness,
      lock,
      lanes: lanes.map((lane) => ({
        id: lane.id,
        status: lane.status,
        proofUrl: lane.proofUrl
      })),
      endpoints: {
        objectionArena: (packet.a2aPayload.endpoints as Record<string, unknown> | undefined)?.objectionArena,
        winnerPacket: (packet.a2aPayload.endpoints as Record<string, unknown> | undefined)?.winnerPacket
      }
    }
  };
}

function tone(status: string) {
  if (["qa-ready", "ready"].includes(status)) return "good";
  if (["needs-proof", "blocked"].includes(status)) return "bad";
  return "watch";
}

export function renderObjectionArenaHtml(arena: ObjectionArena) {
  const lanes = arena.lanes
    .map(
      (lane) => `
        <article class="lane ${tone(lane.status)}">
          <div><strong>${escapeHtml(lane.objection)}</strong><span>${escapeHtml(lane.status)} / ${escapeHtml(lane.source)}</span></div>
          <p>${escapeHtml(lane.answer)}</p>
          <dl>
            <dt>Judge signal</dt><dd>${escapeHtml(lane.judgeSignal)}</dd>
            <dt>Follow up</dt><dd>${escapeHtml(lane.followUp)}</dd>
          </dl>
          <a href="${escapeHtml(lane.proofUrl)}">Open proof</a>
        </article>`
    )
    .join("");

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Objection Arena</title>
    <style>
      :root { color-scheme: light; --ink: #17201d; --muted: #5f6965; --line: #dce5df; --paper: #fbfcfa; --panel: #fff; --green: #13715d; --mint: #e6f4ed; --amber: #8a620d; --amber-bg: #fff4d4; --coral: #b24735; }
      * { box-sizing: border-box; }
      body { margin: 0; background: var(--paper); color: var(--ink); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; }
      a { color: inherit; }
      header, main, footer { width: min(1120px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 40px 0 20px; }
      .eyebrow { color: var(--green); font-size: .78rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0; }
      h1 { margin: 8px 0 10px; font-size: clamp(2rem, 5vw, 4.2rem); line-height: 1; letter-spacing: 0; max-width: 980px; }
      header p { color: var(--muted); max-width: 860px; }
      .metrics, .lanes { display: grid; gap: 12px; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 22px; }
      .metric, .lane, .close { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); padding: 16px; box-shadow: 0 10px 24px rgba(23, 32, 29, .06); }
      .metric span, .lane span { color: var(--muted); font-size: .74rem; font-weight: 900; text-transform: uppercase; }
      .metric strong { display: block; margin-top: 6px; font-size: 1.45rem; }
      .lanes { grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 18px 0; }
      .lane div { display: flex; gap: 12px; justify-content: space-between; align-items: start; }
      .lane strong, .lane p, .lane dd { overflow-wrap: anywhere; }
      .lane dl { display: grid; grid-template-columns: 120px 1fr; gap: 6px 12px; color: var(--muted); }
      .lane dt { font-weight: 900; color: var(--ink); }
      .lane a { display: inline-flex; margin-top: 8px; font-weight: 900; color: var(--green); }
      .good { border-color: #a9d8c2; background: var(--mint); }
      .watch { border-color: #ead39a; background: var(--amber-bg); }
      .bad { border-color: #efb7aa; background: #fff0ec; }
      footer { padding: 20px 0 40px; color: var(--muted); }
      @media (max-width: 760px) { .metrics, .lanes { grid-template-columns: 1fr; } .lane div, .lane dl { display: block; } }
    </style>
  </head>
  <body>
    <header>
      <div class="eyebrow">Judge Objection Arena</div>
      <h1>${escapeHtml(arena.headline)}</h1>
      <p>${escapeHtml(arena.hardTruth)}</p>
      <section class="metrics">
        <div class="metric ${tone(arena.readiness)}"><span>Readiness</span><strong>${escapeHtml(arena.readiness)}</strong></div>
        <div class="metric"><span>Arena Score</span><strong>${escapeHtml(arena.arenaScore)}</strong></div>
        <div class="metric ${arena.lock.blockedCount > 0 ? "bad" : "good"}"><span>Answered</span><strong>${escapeHtml(arena.lock.answeredCount)} / ${escapeHtml(arena.lock.totalCount)}</strong></div>
        <div class="metric ${arena.lock.releaseReady ? "good" : "bad"}"><span>Release</span><strong>${escapeHtml(arena.lock.releaseReady ? "ready" : "not ready")}</strong></div>
      </section>
    </header>
    <main>
      <section class="lanes">${lanes}</section>
      <section class="close ${tone(arena.readiness)}"><strong>Close</strong><p>${escapeHtml(arena.closingLine)}</p></section>
    </main>
    <footer>Open this page before final Q&A. Every answer must end on a proof URL.</footer>
  </body>
</html>`;
}
