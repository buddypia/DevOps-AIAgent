import type { JudgeAcceptanceMatrix } from "./acceptanceMatrix.js";
import type { CompetitiveBattlecard } from "./competitiveBattlecard.js";
import type { JudgeCommandCenter } from "./judgeCommandCenter.js";
import type { PilotEconomics } from "./pilotEconomics.js";
import type { WinningStrategy } from "./strategy.js";
import type { UserPilotLab } from "./userPilot.js";

export type DemoConciergeReadiness = "guided" | "external-watch" | "needs-focus";
export type DemoConciergeStatus = "ready" | "watch" | "blocked";

export type DemoConciergeStep = {
  id: string;
  timeRange: string;
  screen: string;
  click: string;
  say: string;
  endpoint: string;
  successSignal: string;
  status: DemoConciergeStatus;
};

export type DemoConciergeLane = {
  id: string;
  persona: string;
  entryQuestion: string;
  firstClick: string;
  valueMoment: string;
  scoreLift: number;
  steps: DemoConciergeStep[];
};

export type DemoConcierge = {
  id: string;
  conciergeScore: number;
  readiness: DemoConciergeReadiness;
  headline: string;
  hardTruth: string;
  singleNextClick: string;
  lanes: DemoConciergeLane[];
  successCriteria: Array<{ id: string; label: string; status: DemoConciergeStatus; proof: string }>;
  frictionCuts: Array<{ id: string; before: string; after: string; proof: string }>;
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

function statusFromScore(score: number): DemoConciergeStatus {
  if (score >= 88) return "ready";
  if (score >= 70) return "watch";
  return "blocked";
}

function criterionScore(strategy: WinningStrategy, id: string) {
  return strategy.judgeCriteria.find((criterion) => criterion.id === id)?.score ?? strategy.judgeScore;
}

function readinessFrom(input: {
  acceptance: JudgeAcceptanceMatrix;
  command: JudgeCommandCenter;
  score: number;
  successCriteria: DemoConcierge["successCriteria"];
}): DemoConciergeReadiness {
  if (input.command.readiness === "blocked" || input.acceptance.verdict === "not-accepted" || input.successCriteria.some((item) => item.status === "blocked")) {
    return "needs-focus";
  }
  if (input.acceptance.verdict === "accepted-with-external-gaps" || input.score < 92) return "external-watch";
  return "guided";
}

export function buildDemoConcierge(input: {
  baseUrl: string;
  strategy: WinningStrategy;
  acceptance: JudgeAcceptanceMatrix;
  command: JudgeCommandCenter;
  battlecard: CompetitiveBattlecard;
  userPilot: UserPilotLab;
  pilotEconomics: PilotEconomics;
}): DemoConcierge {
  const { baseUrl, strategy, acceptance, command, battlecard, userPilot, pilotEconomics } = input;
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const strongestBattlecard = [...battlecard.cards].sort((left, right) => right.score - left.score)[0];
  const firstUserClick = userPilot.nextClicks[0];
  const externalWatchCount = acceptance.rows.filter((row) => row.area === "submission" && row.status !== "accepted").length;
  const conciergeScore = Math.round(
    clamp(
      average([
        command.commandScore,
        userPilot.pilotScore,
        pilotEconomics.economicsScore,
        battlecard.battleScore,
        acceptance.acceptanceScore,
        criterionScore(strategy, "usability"),
        criterionScore(strategy, "practicality")
      ]) +
        (command.proofButtons.length >= 5 ? 2 : 0) -
        Math.min(4, externalWatchCount)
    )
  );

  const successCriteria: DemoConcierge["successCriteria"] = [
    {
      id: "single-next-click",
      label: "One first click is explicit",
      status: command.openingMove.length > 20 ? "ready" : "watch",
      proof: command.openingMove
    },
    {
      id: "three-persona-lanes",
      label: "Judge, buyer, and submitter lanes exist",
      status: userPilot.paths.length >= 3 ? "ready" : "blocked",
      proof: userPilot.paths.map((path) => path.persona).join(" / ")
    },
    {
      id: "business-value-proof",
      label: "Practical value proof is reachable",
      status: statusFromScore(pilotEconomics.economicsScore),
      proof: `${pilotEconomics.unitEconomics.paybackDays}d payback / ${pilotEconomics.posture}`
    },
    {
      id: "competitive-answer-proof",
      label: "Competitive answer proof is reachable",
      status: statusFromScore(battlecard.battleScore),
      proof: strongestBattlecard ? `${strongestBattlecard.competitor}: ${strongestBattlecard.judgeQuestion}` : battlecard.headline
    }
  ];
  const readiness = readinessFrom({ acceptance, command, score: conciergeScore, successCriteria });

  const lanes: DemoConciergeLane[] = [
    {
      id: "judge",
      persona: "初見審査員",
      entryQuestion: "この作品の価値を90秒でどう判断すればよいですか？",
      firstClick: "Build command center",
      valueMoment: "Acceptance MatrixとRelease Driftで、MVPの核と外部URL不足を同時に確認できる。",
      scoreLift: Math.max(1, 92 - criterionScore(strategy, "usability")),
      steps: [
        {
          id: "judge-command",
          timeRange: "0-30s",
          screen: "Judge Command Center",
          click: "Build command center",
          say: command.openingMove,
          endpoint: absoluteUrl(normalizedBase, "/api/judge-command-center"),
          successSignal: `${command.commandScore} command score / ${command.readiness}`,
          status: command.readiness === "blocked" ? "blocked" : command.readiness === "pitch-ready" ? "ready" : "watch"
        },
        {
          id: "judge-acceptance",
          timeRange: "30-60s",
          screen: "Acceptance Matrix",
          click: "Build acceptance matrix",
          say: acceptance.headline,
          endpoint: absoluteUrl(normalizedBase, "/api/acceptance-matrix"),
          successSignal: `${acceptance.acceptanceScore} acceptance score / ${acceptance.verdict}`,
          status: acceptance.verdict === "not-accepted" ? "blocked" : acceptance.verdict === "ready-to-submit" ? "ready" : "watch"
        }
      ]
    },
    {
      id: "buyer",
      persona: "Platform/SRE buyer",
      entryQuestion: "現場導入する理由と回収見込みはありますか？",
      firstClick: "Build pilot economics",
      valueMoment: "Payback days、価格レーン、買い手の反論が一画面で説明できる。",
      scoreLift: Math.max(1, 92 - criterionScore(strategy, "practicality")),
      steps: [
        {
          id: "buyer-economics",
          timeRange: "0-35s",
          screen: "Pilot Economics",
          click: "Build pilot economics",
          say: pilotEconomics.verdict,
          endpoint: absoluteUrl(normalizedBase, "/api/pilot-economics"),
          successSignal: `${pilotEconomics.unitEconomics.paybackDays}d payback / ${pilotEconomics.unitEconomics.monthlyValueYen} yen monthly value`,
          status: statusFromScore(pilotEconomics.economicsScore)
        },
        {
          id: "buyer-user-pilot",
          timeRange: "35-70s",
          screen: "User Pilot Lab",
          click: "Run user pilot",
          say: userPilot.hardTruth,
          endpoint: absoluteUrl(normalizedBase, "/api/user-pilot"),
          successSignal: `${userPilot.timeToValueSeconds}s max time-to-value / ${userPilot.readiness}`,
          status: userPilot.readiness === "pilot-ready" ? "ready" : userPilot.readiness === "needs-guidance" ? "watch" : "blocked"
        }
      ]
    },
    {
      id: "submitter",
      persona: "ハッカソン提出者",
      entryQuestion: "ProtoPediaと動画では何を見せればよいですか？",
      firstClick: firstUserClick?.button ?? "Build prize strategy",
      valueMoment: "競合反論、提出証拠、外部URL不足を録画順に変換できる。",
      scoreLift: Math.max(1, 92 - criterionScore(strategy, "approach")),
      steps: [
        {
          id: "submitter-battlecard",
          timeRange: "0-30s",
          screen: "Competitive Battlecard",
          click: "Build battlecard",
          say: strongestBattlecard?.shortAnswer ?? battlecard.judgeScript[1] ?? battlecard.headline,
          endpoint: absoluteUrl(normalizedBase, "/api/competitive-battlecard"),
          successSignal: `${battlecard.cards.length} competitors / ${battlecard.readiness}`,
          status: battlecard.readiness === "judge-ready" ? "ready" : battlecard.readiness === "needs-proof" ? "watch" : "blocked"
        },
        {
          id: "submitter-prize",
          timeRange: "30-75s",
          screen: "Prize Strategy Board",
          click: "Build prize strategy",
          say: "審査5項目の目標点、証拠、最終ピッチ順を固定する。",
          endpoint: absoluteUrl(normalizedBase, "/api/prize-strategy"),
          successSignal: "5 criteria, proof moves, final pitch order",
          status: "ready"
        }
      ]
    }
  ];

  const frictionCuts = [
    {
      id: "feature-overload",
      before: "機能一覧を上から説明し、初見審査員が価値判断の入口を失う。",
      after: "persona別のfirst clickを1つだけ提示し、次の証拠URLまで固定する。",
      proof: lanes.map((lane) => `${lane.persona}:${lane.firstClick}`).join(" / ")
    },
    {
      id: "business-proof-gap",
      before: "面白いが現場でいくら価値があるかが後回しになる。",
      after: "Pilot EconomicsとUser Pilotをbuyer laneへ入れ、実用性を先に見せる。",
      proof: `${pilotEconomics.unitEconomics.paybackDays}d payback; ${userPilot.timeToValueSeconds}s time-to-value`
    },
    {
      id: "competitor-drift",
      before: "ADK/LangGraphとの違いが質疑まで出てこない。",
      after: "submitter laneの最初にBattlecardを置き、競合反論を録画順へ固定する。",
      proof: strongestBattlecard ? strongestBattlecard.competitor : battlecard.headline
    }
  ];

  const singleNextClick =
    readiness === "needs-focus"
      ? successCriteria.find((item) => item.status === "blocked")?.label ?? "Fix blocked concierge criterion"
      : readiness === "external-watch"
        ? "Open Demo Concierge, then show external URL watch rows honestly"
        : "Open Demo Concierge and follow the judge lane";

  return {
    id: `demo-concierge-${conciergeScore}-${readiness}`,
    conciergeScore,
    readiness,
    headline:
      readiness === "guided"
        ? "最初の3分をpersona別の1クリック導線に固定できています。"
        : readiness === "external-watch"
          ? "価値導線は固定できています。外部提出URLだけwatchとして残します。"
          : "初回導線にblocked証拠があります。先に審査員の最初のクリックを絞ります。",
    hardTruth:
      "機能を増やすほど、審査員には迷いが増えます。勝つには、誰が来ても最初の1クリック、言う台詞、見る証拠URLを固定する必要があります。",
    singleNextClick,
    lanes,
    successCriteria,
    frictionCuts,
    a2aPayload: {
      method: "message/send",
      skill: "demo.concierge",
      conciergeScore,
      readiness,
      singleNextClick,
      lanes: lanes.map((lane) => ({
        id: lane.id,
        persona: lane.persona,
        firstClick: lane.firstClick,
        scoreLift: lane.scoreLift,
        firstEndpoint: lane.steps[0]?.endpoint
      })),
      successCriteria: successCriteria.map((item) => ({ id: item.id, status: item.status })),
      endpoints: {
        app: normalizedBase,
        demoConcierge: absoluteUrl(normalizedBase, "/api/demo-concierge"),
        judgeCommand: absoluteUrl(normalizedBase, "/api/judge-command-center"),
        userPilot: absoluteUrl(normalizedBase, "/api/user-pilot"),
        pilotEconomics: absoluteUrl(normalizedBase, "/api/pilot-economics"),
        competitiveBattlecard: absoluteUrl(normalizedBase, "/api/competitive-battlecard")
      }
    }
  };
}
