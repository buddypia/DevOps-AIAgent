import type { JudgeAcceptanceMatrix } from "./acceptanceMatrix.js";
import type { CompetitiveBattlecard } from "./competitiveBattlecard.js";
import type { JudgeCommandCenter } from "./judgeCommandCenter.js";
import type { PilotEconomics } from "./pilotEconomics.js";
import type { WinningStrategy } from "./strategy.js";
import type { UserPilotLab } from "./userPilot.js";

export type DemoConciergeReadiness = "guided" | "external-watch" | "needs-focus";
export type DemoConciergeStatus = "ready" | "watch" | "blocked";
export type DemoRouteLockReadiness = "locked" | "locked-external-watch" | "needs-route-fix";
export type DemoFocusLockReadiness = "focus-locked" | "focus-external-watch" | "needs-focus-fix";
export type DemoFocusAction = "show" | "defer" | "keep-visible";

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

export type DemoRouteLockStep = {
  id: string;
  timeRange: string;
  screen: string;
  click: string;
  proofUrl: string;
  judgeSignal: string;
  status: DemoConciergeStatus;
};

export type DemoRouteLock = {
  id: string;
  lockScore: number;
  readiness: DemoRouteLockReadiness;
  routeStepScore: number;
  proofLinkScore: number;
  oneBreathScript: string;
  lockedSteps: DemoRouteLockStep[];
  bypassedDistractions: Array<{ id: string; cut: string; reason: string }>;
};

export type DemoFocusRule = {
  id: string;
  action: DemoFocusAction;
  target: string;
  timeRange: string;
  instruction: string;
  proof: string;
  status: DemoConciergeStatus;
};

export type DemoFocusLock = {
  id: string;
  focusScore: number;
  readiness: DemoFocusLockReadiness;
  visibleCount: number;
  deferredCount: number;
  watchCount: number;
  blockedCount: number;
  firstScreen: string;
  oneMinutePath: string[];
  rules: DemoFocusRule[];
  operatorScript: string;
};

export type DemoConcierge = {
  id: string;
  conciergeScore: number;
  readiness: DemoConciergeReadiness;
  headline: string;
  hardTruth: string;
  singleNextClick: string;
  routeLock: DemoRouteLock;
  focusLock: DemoFocusLock;
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

function scoreFromStatus(status: DemoConciergeStatus) {
  if (status === "ready") return 100;
  if (status === "watch") return 88;
  return 0;
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

function routeLockReadiness(input: { score: number; blockedCount: number; externalWatchCount: number }): DemoRouteLockReadiness {
  if (input.blockedCount > 0) return "needs-route-fix";
  if (input.externalWatchCount > 0 || input.score < 92) return "locked-external-watch";
  return "locked";
}

function focusLockReadiness(input: { score: number; blockedCount: number; watchCount: number }): DemoFocusLockReadiness {
  if (input.blockedCount > 0) return "needs-focus-fix";
  if (input.watchCount > 0 || input.score < 92) return "focus-external-watch";
  return "focus-locked";
}

function shortText(value: string, max = 180) {
  return value.length <= max ? value : `${value.slice(0, max - 1)}...`;
}

function buildFocusLock(input: {
  routeLock: DemoRouteLock;
  externalWatchCount: number;
  command: JudgeCommandCenter;
  acceptance: JudgeAcceptanceMatrix;
  battlecard: CompetitiveBattlecard;
  pilotEconomics: PilotEconomics;
  successCriteria: DemoConcierge["successCriteria"];
}): DemoFocusLock {
  const routeStepById = new Map(input.routeLock.lockedSteps.map((step) => [step.id, step]));
  const statusFor = (id: string, fallback: DemoConciergeStatus = "ready") => routeStepById.get(id)?.status ?? fallback;
  const proofFor = (id: string, fallback: string) => routeStepById.get(id)?.proofUrl ?? fallback;
  const rules: DemoFocusRule[] = [
    {
      id: "show-command-first",
      action: "show",
      target: "Judge Command Center",
      timeRange: "0-18s",
      instruction: "Start on the command center and say the opening move before showing any feature list.",
      proof: proofFor("judge-command", input.command.proofButtons[0]?.endpoint ?? "/api/judge-command-center"),
      status: statusFor("judge-command")
    },
    {
      id: "show-acceptance-second",
      action: "show",
      target: "Acceptance Matrix",
      timeRange: "18-34s",
      instruction: "Show accepted/watch rows so MVP truth and external gaps are visible together.",
      proof: proofFor("judge-acceptance", "/api/acceptance-matrix"),
      status: statusFor("judge-acceptance")
    },
    {
      id: "show-objection-third",
      action: "show",
      target: "Competitive Battlecard",
      timeRange: "34-50s",
      instruction: "Answer the strongest competitor objection before opening marketplace browsing.",
      proof: proofFor("submitter-battlecard", "/api/competitive-battlecard"),
      status: statusFor("submitter-battlecard")
    },
    {
      id: "show-buyer-fourth",
      action: "show",
      target: "Pilot Economics",
      timeRange: "50-68s",
      instruction: "Translate the demo into buyer payback and practical value.",
      proof: proofFor("buyer-economics", "/api/pilot-economics"),
      status: statusFor("buyer-economics", statusFromScore(input.pilotEconomics.economicsScore))
    },
    {
      id: "show-prize-close",
      action: "show",
      target: "Prize Strategy Board",
      timeRange: "68-90s",
      instruction: "Close on the five judging criteria and the honest remaining external work.",
      proof: proofFor("submitter-prize", "/api/prize-strategy"),
      status: statusFor("submitter-prize")
    },
    {
      id: "defer-marketplace-browsing",
      action: "defer",
      target: "Marketplace browsing and agent cards",
      timeRange: "After 90s",
      instruction: "Do not browse every agent before the judge has seen acceptance, objection, and buyer proof.",
      proof: `${input.routeLock.lockedSteps.length} locked proof steps before free exploration.`,
      status: input.routeLock.lockedSteps.length >= 5 ? "ready" : "watch"
    },
    {
      id: "defer-raw-json",
      action: "defer",
      target: "Raw A2A payload JSON",
      timeRange: "Q&A only",
      instruction: "Keep JSON evidence available, but do not make it the first-run explanation.",
      proof: `${input.routeLock.proofLinkScore} proof-link score.`,
      status: input.routeLock.proofLinkScore >= 100 ? "ready" : "watch"
    },
    {
      id: "keep-external-gaps-visible",
      action: "keep-visible",
      target: "ProtoPedia and video URL watch rows",
      timeRange: "Entire run",
      instruction: "Never claim submit-ready until the external URLs are real.",
      proof:
        input.externalWatchCount > 0
          ? `${input.externalWatchCount} external submission rows remain watch.`
          : "External submission rows are closed.",
      status: input.externalWatchCount > 0 ? "watch" : "ready"
    }
  ];
  const visibleCount = rules.filter((rule) => rule.action === "show" || rule.action === "keep-visible").length;
  const deferredCount = rules.filter((rule) => rule.action === "defer").length;
  const watchCount = rules.filter((rule) => rule.status === "watch").length;
  const blockedCount = rules.filter((rule) => rule.status === "blocked").length;
  const ruleScore = average(rules.map((rule) => scoreFromStatus(rule.status)));
  const successScore = average(input.successCriteria.map((item) => scoreFromStatus(item.status)));
  const focusScore = Math.round(clamp(average([input.routeLock.lockScore, ruleScore, successScore, input.acceptance.acceptanceScore])));
  const readiness = focusLockReadiness({ score: focusScore, blockedCount, watchCount });

  return {
    id: `demo-focus-lock-${readiness}-${focusScore}`,
    focusScore,
    readiness,
    visibleCount,
    deferredCount,
    watchCount,
    blockedCount,
    firstScreen: "Judge Command Center",
    oneMinutePath: rules.filter((rule) => rule.action === "show").slice(0, 4).map((rule) => rule.target),
    rules,
    operatorScript: shortText(
      `Start with ${input.command.openingMove} Then show ${input.acceptance.verdict}, ${input.battlecard.objectionReplay.weakestCompetitor}, and ${input.pilotEconomics.unitEconomics.paybackDays}d payback.`
    )
  };
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

  const buyerLane = lanes.find((lane) => lane.id === "buyer");
  const routeLockSteps: DemoRouteLockStep[] = [
    ...(lanes.find((lane) => lane.id === "judge")?.steps.slice(0, 2) ?? []),
    ...(lanes.find((lane) => lane.id === "submitter")?.steps.slice(0, 1) ?? []),
    ...(lanes.find((lane) => lane.id === "buyer")?.steps.slice(0, 1) ?? []),
    ...(lanes.find((lane) => lane.id === "submitter")?.steps.slice(1, 2) ?? [])
  ].map((step) => ({
    id: step.id,
    timeRange: step.timeRange,
    screen: step.screen,
    click: step.click,
    proofUrl: step.endpoint,
    judgeSignal: step.successSignal,
    status: step.status
  }));
  const routeStepScore = Math.round(average(routeLockSteps.map((step) => scoreFromStatus(step.status))));
  const proofLinkScore = Math.round(
    (routeLockSteps.filter((step) => step.proofUrl.startsWith("http://") || step.proofUrl.startsWith("https://")).length / Math.max(1, routeLockSteps.length)) * 100
  );
  const routeLockScore = Math.round(
    clamp(
      average([routeStepScore, proofLinkScore, command.commandScore, userPilot.pilotScore, acceptance.acceptanceScore, pilotEconomics.economicsScore]) +
        (lanes.length >= 3 ? 2 : 0)
    )
  );
  const routeLock: DemoRouteLock = {
    id: `demo-route-lock-${routeLockScore}`,
    lockScore: routeLockScore,
    readiness: routeLockReadiness({
      score: routeLockScore,
      blockedCount: routeLockSteps.filter((step) => step.status === "blocked").length,
      externalWatchCount
    }),
    routeStepScore,
    proofLinkScore,
    oneBreathScript: shortText(`${command.openingMove} ${buyerLane?.valueMoment ?? pilotEconomics.verdict}`),
    lockedSteps: routeLockSteps,
    bypassedDistractions: [
      {
        id: "feature-tour",
        cut: "機能一覧を順番に説明しない",
        reason: "Judge Command Center、Acceptance Matrix、Battlecard、buyer proofだけを90秒に固定する。"
      },
      {
        id: "free-navigation",
        cut: "審査員に自由探索させない",
        reason: "各stepがproof URL、成功シグナル、話す台詞を持つため、迷いを発生させない。"
      },
      {
        id: "external-gap-hiding",
        cut: "ProtoPedia/動画URL不足を隠さない",
        reason: "外部URLはwatchとして見せ、コード側MVPと提出作業を分離する。"
      }
    ]
  };
  const focusLock = buildFocusLock({
    routeLock,
    externalWatchCount,
    command,
    acceptance,
    battlecard,
    pilotEconomics,
    successCriteria
  });

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
    routeLock,
    focusLock,
    lanes,
    successCriteria,
    frictionCuts,
    a2aPayload: {
      method: "message/send",
      skill: "demo.concierge",
      conciergeScore,
      readiness,
      singleNextClick,
      routeLock: {
        lockScore: routeLock.lockScore,
        readiness: routeLock.readiness,
        routeStepScore: routeLock.routeStepScore,
        proofLinkScore: routeLock.proofLinkScore,
        lockedSteps: routeLock.lockedSteps.map((step) => ({ id: step.id, status: step.status, proofUrl: step.proofUrl }))
      },
      focusLock: {
        focusScore: focusLock.focusScore,
        readiness: focusLock.readiness,
        firstScreen: focusLock.firstScreen,
        visibleCount: focusLock.visibleCount,
        deferredCount: focusLock.deferredCount,
        watchCount: focusLock.watchCount,
        rules: focusLock.rules.map((rule) => ({ id: rule.id, action: rule.action, status: rule.status }))
      },
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
