import type { SquadContract } from "./contracts.js";
import type { ImpactCase, PersonaImpact } from "./impact.js";
import type { OpsDrill } from "./ops.js";
import type { SecurityReview } from "./security.js";
import type { WinningStrategy } from "./strategy.js";
import type { Recommendation } from "./types.js";

export type UserPilotReadiness = "pilot-ready" | "needs-guidance" | "needs-redesign";
export type UserPilotTaskStatus = "clear" | "watch" | "blocked";
export type UserPilotFrictionSeverity = "low" | "medium" | "high";

export type UserPilotTask = {
  id: string;
  order: number;
  label: string;
  screen: string;
  action: string;
  successSignal: string;
  seconds: number;
  status: UserPilotTaskStatus;
};

export type UserPilotPath = {
  id: string;
  persona: string;
  goal: string;
  timeToValueSeconds: number;
  successMetric: string;
  proof: string;
  tasks: UserPilotTask[];
};

export type UserPilotFriction = {
  id: string;
  label: string;
  severity: UserPilotFrictionSeverity;
  evidence: string;
  fix: string;
  owner: string;
};

export type UserPilotNextClick = {
  id: string;
  label: string;
  screen: string;
  button: string;
  reason: string;
  expectedEvidence: string;
};

export type UserPilotLab = {
  id: string;
  pilotScore: number;
  readiness: UserPilotReadiness;
  headline: string;
  hardTruth: string;
  timeToValueSeconds: number;
  usabilityLift: number;
  paths: UserPilotPath[];
  frictions: UserPilotFriction[];
  nextClicks: UserPilotNextClick[];
  validationChecklist: Array<{ id: string; label: string; status: UserPilotTaskStatus; proof: string }>;
  a2aPayload: Record<string, unknown>;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function criterionScore(strategy: WinningStrategy, id: string) {
  return strategy.judgeCriteria.find((criterion) => criterion.id === id)?.score ?? strategy.judgeScore;
}

function hasAgent(recommendation: Recommendation, id: string) {
  return recommendation.selected.some((agent) => agent.id === id);
}

function statusFromScore(score: number): UserPilotTaskStatus {
  if (score >= 82) return "clear";
  if (score >= 62) return "watch";
  return "blocked";
}

function readinessFrom(input: { pilotScore: number; frictions: UserPilotFriction[] }): UserPilotReadiness {
  if (input.frictions.some((friction) => friction.severity === "high") || input.pilotScore < 70) return "needs-redesign";
  if (
    input.frictions.some(
      (friction) => friction.severity === "medium" && (friction.id === "ux-capability-gap" || friction.id === "trust-explanation")
    ) ||
    input.pilotScore < 86
  ) {
    return "needs-guidance";
  }
  return "pilot-ready";
}

function personaById(impactCase: ImpactCase, id: string, fallback: PersonaImpact): PersonaImpact {
  return impactCase.personas.find((persona) => persona.id === id) ?? fallback;
}

function pathStatus(...scores: number[]) {
  return statusFromScore(average(scores));
}

export function buildUserPilotLab(input: {
  recommendation: Recommendation;
  strategy: WinningStrategy;
  impactCase: ImpactCase;
  opsDrill: OpsDrill;
  securityReview: SecurityReview;
  squadContract: SquadContract;
}): UserPilotLab {
  const { recommendation, strategy, impactCase, opsDrill, securityReview, squadContract } = input;
  const usability = criterionScore(strategy, "usability");
  const practicality = criterionScore(strategy, "practicality");
  const implementation = criterionScore(strategy, "implementation");
  const hasUx = hasAgent(recommendation, "ux-guildmaster");
  const nextBest = strategy.nextBestAgent;
  const devLead = personaById(impactCase, "engineering-manager", {
    id: "dev-lead",
    persona: "開発リード",
    pain: "どのAI能力を買うべきか判断に時間がかかる",
    workflowWin: "必要能力、価格、A2A skill、受入条件を同じ流れで確認する",
    kpi: "first decision within 3 minutes",
    proof: "Recommendation, Strategy, Contract"
  });
  const platformSre = personaById(impactCase, "platform-sre", {
    id: "platform-sre",
    persona: "Platform/SRE",
    pain: "公開デモの信頼性とrollback判断が曖昧",
    workflowWin: "Ops DrillとSecurity Reviewで公開継続判断を確認する",
    kpi: "runtime risk explained before recording",
    proof: "Ops Drill, Security Review"
  });
  const submitter = personaById(impactCase, "hackathon-submitter", {
    id: "hackathon-submitter",
    persona: "ハッカソン提出者",
    pain: "提出本文、動画、証拠リンクが散らばる",
    workflowWin: "Judge TourとSubmission Launch Gateで提出準備を確認する",
    kpi: "submission packet ready",
    proof: "Judge Tour, Launch Gate, Dossier"
  });

  const pathAverages = {
    devLead: average([recommendation.after.usability, usability, squadContract.contractScore, strategy.moatScore]),
    platformSre: average([opsDrill.readinessScore, securityReview.securityScore, practicality, implementation]),
    submitter: average([impactCase.impactScore, strategy.mvpScore, usability, opsDrill.readinessScore])
  };

  const paths: UserPilotPath[] = [
    {
      id: "dev-lead",
      persona: devLead.persona,
      goal: "プロジェクトブリーフから、最初に雇うAIチームと受入条件を決める。",
      timeToValueSeconds: hasUx ? 105 : 135,
      successMetric: devLead.kpi,
      proof: devLead.proof,
      tasks: [
        {
          id: "paste-brief",
          order: 1,
          label: "Brief to squad",
          screen: "Project Brief + Marketplace",
          action: "課題文を貼り、推薦された上位AIと現在スコアを確認する",
          successSignal: `${recommendation.selected.length} selected agents / total score ${recommendation.after.total}`,
          seconds: 35,
          status: statusFromScore(recommendation.after.total)
        },
        {
          id: "compare-capability",
          order: 2,
          label: "Compare capability",
          screen: "Winning Strategy",
          action: "競合/SWOT、judge score、next best agentを見て買い足し候補を判断する",
          successSignal: `weakest criterion ${[...strategy.judgeCriteria].sort((a, b) => a.score - b.score)[0]?.label ?? "none"}`,
          seconds: 45,
          status: statusFromScore(strategy.judgeScore)
        },
        {
          id: "acceptance-contract",
          order: 3,
          label: "Acceptance contract",
          screen: "Contract Desk",
          action: "選んだAIの成果物、受入条件、検証コマンド、支払い条件を確認する",
          successSignal: `${squadContract.contracts.length} contracts / score ${squadContract.contractScore}`,
          seconds: 55,
          status: statusFromScore(squadContract.contractScore)
        }
      ]
    },
    {
      id: "platform-sre",
      persona: platformSre.persona,
      goal: "公開デモを止めず、異常時の判断と安全境界を説明する。",
      timeToValueSeconds: 150,
      successMetric: platformSre.kpi,
      proof: platformSre.proof,
      tasks: [
        {
          id: "ops-signal",
          order: 1,
          label: "Read runtime signals",
          screen: "Cloud Run Ops Drill",
          action: "health、latency、error rate、fallback、外部URL状態を確認する",
          successSignal: `${opsDrill.severity} / readiness ${opsDrill.readinessScore}`,
          seconds: 50,
          status: statusFromScore(opsDrill.readinessScore)
        },
        {
          id: "trust-boundary",
          order: 2,
          label: "Check trust boundary",
          screen: "Security Sentinel Review",
          action: "Secret、IP allowlist、入力制限、A2A信頼境界、CIの状態を見る",
          successSignal: `${securityReview.controls.length} controls / score ${securityReview.securityScore}`,
          seconds: 55,
          status: statusFromScore(securityReview.securityScore)
        },
        {
          id: "judge-proof",
          order: 3,
          label: "Attach evidence",
          screen: "Judge Proof",
          action: "Cloud Run、A2A、CI、Gemini、receiptの証拠束を提出説明に使う",
          successSignal: "proof receipt available",
          seconds: 45,
          status: pathStatus(opsDrill.readinessScore, securityReview.securityScore, implementation)
        }
      ]
    },
    {
      id: "hackathon-submitter",
      persona: submitter.persona,
      goal: "審査員に見せる順番と提出物の残作業を迷わず閉じる。",
      timeToValueSeconds: hasUx ? 120 : 165,
      successMetric: submitter.kpi,
      proof: submitter.proof,
      tasks: [
        {
          id: "open-judge-tour",
          order: 1,
          label: "Open judge route",
          screen: "Judge Tour",
          action: "90秒導線、5 claims、反論、外部URL不足を確認する",
          successSignal: "six-step judge route",
          seconds: 40,
          status: statusFromScore(usability)
        },
        {
          id: "quantify-impact",
          order: 2,
          label: "Quantify impact",
          screen: "Impact Case",
          action: "対象ユーザー別KPIとbefore/afterを提出ストーリーに入れる",
          successSignal: `${impactCase.metrics.length} metrics / score ${impactCase.impactScore}`,
          seconds: 45,
          status: statusFromScore(impactCase.impactScore)
        },
        {
          id: "launch-gate",
          order: 3,
          label: "Check final URLs",
          screen: "Submission Launch Gate",
          action: "ProtoPedia作品URLと動画URLが揃うまで提出完了扱いしない",
          successSignal: "external URLs remain explicit blockers",
          seconds: 80,
          status: strategy.submissionItems.every((item) => item.done) ? "clear" : "watch"
        }
      ]
    }
  ];

  const uxSeverity: UserPilotFrictionSeverity = usability < 72 ? "high" : "medium";
  const runtimeSeverity: UserPilotFrictionSeverity = opsDrill.severity === "critical" || opsDrill.severity === "degraded" ? "high" : "low";
  const trustSeverity: UserPilotFrictionSeverity = securityReview.posture === "exposed" ? "high" : "medium";
  const frictions: UserPilotFriction[] = [
    ...(usability < 82 || !hasUx
      ? [
          {
            id: "ux-capability-gap",
            label: "初回利用の導線密度",
            severity: uxSeverity,
            evidence: `Usability criterion ${usability}; UX Guildmaster ${hasUx ? "selected" : "not selected"}.`,
            fix: "UX Guildmasterを雇い、Marketplace -> Strategy -> Contract -> Proofの初回導線をさらに短縮する",
            owner: "UX Guildmaster"
          }
        ]
      : []),
    ...(recommendation.after.delivery < 72
      ? [
          {
            id: "delivery-confidence",
            label: "実装配送スコア",
            severity: "medium" as const,
            evidence: `Delivery score ${recommendation.after.delivery}.`,
            fix: "Test Forgeを雇い、受入条件と回帰テストをUI導線へ接続する",
            owner: "Test Forge"
          }
        ]
      : []),
    ...(opsDrill.severity !== "healthy"
      ? [
          {
            id: "runtime-watch",
            label: "公開デモ運用watch",
            severity: runtimeSeverity,
            evidence: `${opsDrill.severity} / readiness ${opsDrill.readinessScore}.`,
            fix: "Ops Drillのwatch項目を動画台本に入れ、必要ならObservability Oracleを雇う",
            owner: "Cloud Run SRE"
          }
        ]
      : []),
    ...(securityReview.posture !== "guarded"
      ? [
          {
            id: "trust-explanation",
            label: "安全境界の説明コスト",
            severity: trustSeverity,
            evidence: `${securityReview.posture} / score ${securityReview.securityScore}.`,
            fix: "Security Sentinel ReviewをJudge Tourの前半で開く",
            owner: "Security Sentinel"
          }
        ]
      : [])
  ];

  const timeToValueSeconds = Math.max(...paths.map((path) => path.timeToValueSeconds));
  const pilotScore = Math.round(
    clamp(
      average([
        pathAverages.devLead,
        pathAverages.platformSre,
        pathAverages.submitter,
        impactCase.impactScore,
        squadContract.contractScore,
        100 - Math.max(0, timeToValueSeconds - 120) / 2
      ]) - frictions.filter((friction) => friction.severity === "high").length * 8
    )
  );
  const readiness = readinessFrom({ pilotScore, frictions });
  const usabilityLift = Math.round(clamp(100 - usability + (hasUx ? 6 : 0), 0, 40));

  const nextClicks: UserPilotNextClick[] = [
    {
      id: "build-tour",
      label: "審査順を先に固定",
      screen: "Judge Tour",
      button: "Build judge tour",
      reason: "機能数の多さを、審査員と提出者が同じ順番で見られるようにするため。",
      expectedEvidence: "90-second walkthrough, claims, blockers"
    },
    {
      id: "issue-contracts",
      label: "AI購入を検収条件へ変換",
      screen: "Contract Desk",
      button: "Issue contracts",
      reason: "AIを雇う体験を、成果物、SLA、検証コマンド、支払い条件へ落とすため。",
      expectedEvidence: `${squadContract.contracts.length} agent contracts`
    },
    {
      id: "run-impact",
      label: "実用性を数値化",
      screen: "Impact Case",
      button: "Run impact case",
      reason: "対象ユーザー別KPIとbefore/afterで、実用性を説明ではなく証拠にするため。",
      expectedEvidence: `${impactCase.metrics.length} metrics, ${impactCase.personas.length} personas`
    },
    ...(nextBest
      ? [
          {
            id: "hire-next",
            label: `次に ${nextBest.agent.name} を雇う`,
            screen: "Marketplace",
            button: nextBest.agent.name,
            reason: nextBest.reason,
            expectedEvidence: nextBest.expectedLift
          }
        ]
      : [])
  ];

  const validationChecklist = [
    {
      id: "three-personas",
      label: "3 target personas have a first-run path",
      status: paths.length >= 3 ? "clear" : ("blocked" as const),
      proof: paths.map((path) => path.persona).join(" / ")
    },
    {
      id: "under-three-minutes",
      label: "Each path reaches value within 3 minutes",
      status: timeToValueSeconds <= 180 ? "clear" : ("watch" as const),
      proof: `${timeToValueSeconds}s max time-to-value`
    },
    {
      id: "frictions-owned",
      label: "Every friction has an owner and fix",
      status: frictions.every((friction) => friction.owner && friction.fix) ? "clear" : ("watch" as const),
      proof: `${frictions.length} frictions`
    },
    {
      id: "next-clicks",
      label: "Next clicks are explicit",
      status: nextClicks.length >= 3 ? "clear" : ("watch" as const),
      proof: nextClicks.map((click) => click.button).join(" -> ")
    }
  ] satisfies UserPilotLab["validationChecklist"];

  const hardTruth =
    readiness === "pilot-ready"
      ? "初回利用者が3分以内に価値へ到達する導線と検証観点が揃っています。"
      : readiness === "needs-guidance"
        ? "初回利用は成立していますが、UX能力の買い足しや画面順のガイドがないと価値到達に迷いが残ります。"
        : "ユーザー導線の摩擦が強く、提出動画の前に初回利用体験を作り直す必要があります。";

  return {
    id: `user-pilot-${pilotScore}-${readiness}`,
    pilotScore,
    readiness,
    headline: "3人の対象ユーザーが、最初の3分でAI能力調達の価値へ到達できるかを検証する。",
    hardTruth,
    timeToValueSeconds,
    usabilityLift,
    paths,
    frictions,
    nextClicks,
    validationChecklist,
    a2aPayload: {
      method: "message/send",
      skill: "user.pilot",
      pilotScore,
      readiness,
      timeToValueSeconds,
      paths: paths.map((path) => ({ id: path.id, persona: path.persona, seconds: path.timeToValueSeconds })),
      frictions: frictions.map((friction) => ({ id: friction.id, severity: friction.severity, owner: friction.owner })),
      nextClicks: nextClicks.map((click) => ({ id: click.id, screen: click.screen, button: click.button }))
    }
  };
}
