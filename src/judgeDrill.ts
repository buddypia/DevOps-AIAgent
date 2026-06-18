import { buildCompetitiveBattlecard } from "./competitiveBattlecard.js";
import { buildMarketIntelReport } from "./marketIntel.js";
import type { MissionRun } from "./mission.js";
import { buildMoatStressTest } from "./moatStress.js";
import type { OpsDrill } from "./ops.js";
import type { PitchRun } from "./pitch.js";
import { SUBMISSION_PROOF } from "./submission.js";
import type { JudgeCriterion, WinningStrategy } from "./strategy.js";
import type { Recommendation } from "./types.js";

export type JudgeRisk = "low" | "medium" | "high";

export type JudgeObjection = {
  id: string;
  criterionId: string;
  criterion: string;
  risk: JudgeRisk;
  question: string;
  answer: string;
  evidence: string;
  evidenceUrl: string;
  demoMove: string;
  nextMove: string;
};

export type JudgeEvidenceLink = {
  id: string;
  label: string;
  url: string;
  proof: string;
};

export type JudgeCrossExamProofStep = {
  id: string;
  screen: string;
  endpoint: string;
  say: string;
};

export type JudgeCrossExamCard = {
  id: string;
  competitor: string;
  risk: JudgeRisk;
  triggerQuestion: string;
  answerPattern: string;
  proofSteps: JudgeCrossExamProofStep[];
  fallbackLine: string;
  scoreLift: number;
};

export type JudgeTimebox = {
  timeRange: string;
  move: string;
  proof: string;
};

export type JudgeDrill = {
  id: string;
  readinessScore: number;
  hardestQuestion: string;
  openingRebuttal: string;
  closingLine: string;
  objections: JudgeObjection[];
  crossExamDeck: JudgeCrossExamCard[];
  timeboxedAnswer: JudgeTimebox[];
  evidenceLinks: JudgeEvidenceLink[];
  crossExamRunbook: string[];
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
  if (path.startsWith("https://")) return path;
  return `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function riskFromCriterion(criterion: JudgeCriterion, opsDrill: OpsDrill, pitch: PitchRun): JudgeRisk {
  if (criterion.score < 72) return "high";
  if (criterion.id === "practicality" && opsDrill.rollbackRecommended) return "high";
  if (criterion.id === "implementation" && pitch.submissionWarnings.length > 0) return "medium";
  if (criterion.score < 86) return "medium";
  return "low";
}

function questionForCriterion(criterion: JudgeCriterion) {
  const questions: Record<string, string> = {
    agentCentrality: "これはAIエージェントである必然性がありますか、普通のダッシュボードではないですか？",
    approach: "ADKやLangGraphのような既存基盤と比べて、どこが新しい課題設定ですか？",
    usability: "審査員が初見30秒で価値を理解し、操作できますか？",
    practicality: "ハッカソン後も実務で使える体験価値と運用導線がありますか？",
    implementation: "本当に動く実装ですか、CI/CDや公開デプロイの証拠はありますか？"
  };
  return questions[criterion.id] ?? `${criterion.label}の証拠を短時間で説明できますか？`;
}

function answerForCriterion(input: {
  criterion: JudgeCriterion;
  strategy: WinningStrategy;
  mission: MissionRun;
  opsDrill: OpsDrill;
  pitch: PitchRun;
  selectedAgents: string;
}) {
  const { criterion, strategy, mission, opsDrill, pitch, selectedAgents } = input;
  const answers: Record<string, string> = {
    agentCentrality: `価値の中心はUIではなく、${selectedAgents} が必要能力を判断し、A2Aで委任し、Mission/Ops/Pitchを生成する点です。`,
    approach: `ADKやLangGraphは作る基盤です。この作品はその前段の「どのAI能力を雇うべきか」を競合/SWOTと審査基準で決める市場体験に寄せています。`,
    usability: `Judge ProofとPitch Directorを先頭に置き、初見でも証拠、録画順、残リスクまで一画面で追えるようにしています。Pitch readinessは${pitch.readinessScore}です。`,
    practicality: `Cloud Run Ops Drillがhealth、latency、5xx、fallback、予算、提出URLを読み、継続かrollbackかを判断します。現在のreadinessは${opsDrill.readinessScore}です。`,
    implementation: `公開Cloud Run、A2A Agent Card、Gemini fallback、GitHub Actions CI、sha256 receiptを実装済みです。Mission verificationは${mission.verificationScore}です。`
  };
  return answers[criterion.id] ?? `${criterion.label}は${criterion.score}点で、次アクションは「${criterion.nextAction}」です。`;
}

function evidenceForCriterion(input: {
  criterion: JudgeCriterion;
  baseUrl: string;
  strategy: WinningStrategy;
  mission: MissionRun;
  opsDrill: OpsDrill;
  pitch: PitchRun;
}) {
  const { criterion, baseUrl, strategy, mission, opsDrill, pitch } = input;
  const appUrl = mission.submissionPack.deployedUrl || baseUrl;
  const urls: Record<string, string> = {
    agentCentrality: absoluteUrl(baseUrl, "/.well-known/agent-card.json"),
    approach: absoluteUrl(baseUrl, mission.submissionPack.storyMarkdownPath),
    usability: absoluteUrl(baseUrl, "/api/pitch"),
    practicality: absoluteUrl(baseUrl, "/api/ops-drill"),
    implementation: SUBMISSION_PROOF.ciWorkflowUrl
  };
  const evidence: Record<string, string> = {
    agentCentrality: "Agent Cardにmarket.discover、mission.run、ops.drill、pitch.director、judge.proofを公開。",
    approach: `${strategy.competitors.length}競合、SWOT、moat ${strategy.moatScore}、next hireをStrategyで算出。`,
    usability: `${pitch.totalSeconds}秒/${pitch.scenes.length}シーンの録画順、字幕、証拠リンクを生成。`,
    practicality: `Ops severity ${opsDrill.severity}、rollback ${opsDrill.rollbackRecommended ? "recommended" : "not recommended"}、next ops hireを提示。`,
    implementation: "GitHub Actionsがtypecheck/test/build/architecture checkを公開repo上で実行。"
  };
  return {
    evidenceUrl: urls[criterion.id] ?? appUrl,
    evidence: evidence[criterion.id] ?? criterion.evidence
  };
}

function crossExamRisk(threatLevel: string, score: number): JudgeRisk {
  if (threatLevel === "high") return "high";
  if (threatLevel === "medium" || score < 88) return "medium";
  return "low";
}

export function buildJudgeDrill(input: {
  baseUrl: string;
  recommendation: Recommendation;
  strategy: WinningStrategy;
  mission: MissionRun;
  opsDrill: OpsDrill;
  pitch: PitchRun;
}): JudgeDrill {
  const { baseUrl, recommendation, strategy, mission, opsDrill, pitch } = input;
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const selectedAgents = recommendation.selected.map((agent) => agent.name).join(" / ") || "A2A Market Broker";
  const marketIntel = buildMarketIntelReport({ baseUrl: normalizedBase, recommendation, strategy });
  const moatStress = buildMoatStressTest({ baseUrl: normalizedBase, recommendation, strategy, marketIntel });
  const battlecard = buildCompetitiveBattlecard({ baseUrl: normalizedBase, strategy, marketIntel, moatStress });
  const objections = strategy.judgeCriteria.map((criterion) => {
    const { evidence, evidenceUrl } = evidenceForCriterion({ criterion, baseUrl, strategy, mission, opsDrill, pitch });
    return {
      id: `objection-${criterion.id}`,
      criterionId: criterion.id,
      criterion: criterion.label,
      risk: riskFromCriterion(criterion, opsDrill, pitch),
      question: questionForCriterion(criterion),
      answer: answerForCriterion({ criterion, strategy, mission, opsDrill, pitch, selectedAgents }),
      evidence,
      evidenceUrl,
      demoMove:
        criterion.id === "implementation"
          ? "GitHub ActionsとJudge Proof receiptを開く"
          : criterion.id === "approach"
            ? "Winning Strategyの競合/SWOTを見せる"
            : criterion.id === "practicality"
              ? "Ops Drillのrollback判断を見せる"
              : criterion.id === "usability"
                ? "Pitch Directorの30秒リールを見せる"
                : "Agent CardとA2A timelineを見せる",
      nextMove: criterion.nextAction
    } satisfies JudgeObjection;
  });
  const hardest = [...objections].sort((left, right) => {
    const riskWeight: Record<JudgeRisk, number> = { high: 3, medium: 2, low: 1 };
    return riskWeight[right.risk] - riskWeight[left.risk];
  })[0];
  const crossExamDeck: JudgeCrossExamCard[] = [...battlecard.cards]
    .sort((left, right) => {
      const riskWeight: Record<string, number> = { risk: 3, parity: 2, lead: 1 };
      return riskWeight[right.status] - riskWeight[left.status] || right.score - left.score;
    })
    .slice(0, 3)
    .map((card) => ({
      id: card.id,
      competitor: card.competitor,
      risk: crossExamRisk(card.threatLevel, card.score),
      triggerQuestion: card.judgeQuestion,
      answerPattern: [
        `まず相手の強みを認めます: ${card.whereTheyWin}.`,
        `次に争点をずらします: ${card.whereWeWin}`,
        `最後にこの証拠を開きます: ${card.proofRoute}`
      ].join(" "),
      proofSteps: [
        {
          id: "battlecard",
          screen: "Competitive Battlecard",
          endpoint: `${normalizedBase}/api/competitive-battlecard`,
          say: card.shortAnswer
        },
        {
          id: "sources",
          screen: "Market Intel sources",
          endpoint: `${normalizedBase}/api/market-intel`,
          say: `${card.sourceUrls.length} source links and SWOT receipts support this answer.`
        },
        {
          id: "live-proof",
          screen: "Release Drift + Agent Card",
          endpoint: `${normalizedBase}/api/release-drift`,
          say: "公開Cloud Runが最新Agent CardとA2A artifactを返すことを確認します。"
        }
      ],
      fallbackLine: "それは置き換えではなく前段です。作る基盤ではなく、どのAI能力を雇い、A2Aで委任し、Cloud Run上で検収するかを判断する体験です。",
      scoreLift: Math.max(1, 92 - card.score)
    }));
  const primaryCrossExam = crossExamDeck[0];
  const timeboxedAnswer: JudgeTimebox[] = [
    {
      timeRange: "0-10s",
      move: "相手の強みを先に認める",
      proof: primaryCrossExam ? `${primaryCrossExam.competitor}: ${primaryCrossExam.triggerQuestion}` : hardest?.question ?? "競合質問を確認する"
    },
    {
      timeRange: "10-25s",
      move: "作る基盤から、AI能力調達とA2A検収へ争点をずらす",
      proof: battlecard.thesis
    },
    {
      timeRange: "25-45s",
      move: "Battlecard、Market Intel、Release Driftを順に開く",
      proof: primaryCrossExam?.proofSteps.map((step) => step.screen).join(" -> ") ?? "Judge Proof -> Agent Card"
    },
    {
      timeRange: "45-60s",
      move: "審査5項目のどれを証明したかで締める",
      proof: "AI中心性、課題アプローチ、実装力を同じ証拠で説明する"
    }
  ];
  const evidenceLinks: JudgeEvidenceLink[] = [
    {
      id: "app",
      label: "Cloud Run app",
      url: mission.submissionPack.deployedUrl || baseUrl,
      proof: "公開デモURL"
    },
    {
      id: "github",
      label: "Public GitHub",
      url: SUBMISSION_PROOF.publicGitHubUrl,
      proof: "実装、README、テスト、Cloud Run構成"
    },
    {
      id: "ci",
      label: "GitHub Actions",
      url: SUBMISSION_PROOF.ciWorkflowUrl,
      proof: "typecheck/test/build/architecture check"
    },
    {
      id: "proof",
      label: "Judge Proof API",
      url: absoluteUrl(baseUrl, "/api/proof"),
      proof: "Gemini、Cloud Run、A2A、CI、receipt"
    },
    {
      id: "pitch",
      label: "Pitch API",
      url: absoluteUrl(baseUrl, "/api/pitch"),
      proof: "30秒動画の録画順と提出残リスク"
    }
  ];
  const readinessScore = Math.round(
    clamp(
      average([
        strategy.judgeScore,
        strategy.moatScore,
        mission.autonomyScore,
        mission.verificationScore,
        opsDrill.readinessScore,
        pitch.readinessScore,
        100 - pitch.submissionWarnings.length * 8
      ])
    )
  );

  return {
    id: `judge-drill-${readinessScore}-${mission.id}`,
    readinessScore,
    hardestQuestion: hardest?.question ?? "審査員に最初に何を聞かれても証拠を開けますか？",
    openingRebuttal: "この作品はAIエージェントを作るだけでなく、必要能力の発見、購入判断、A2A委任、Cloud Run運用、提出証跡までをAIの判断ループとして閉じています。",
    closingLine: "審査では、最初にWin Autopilot、次にJudge Proof、最後にDemo RunwayとAgent Cardを開けば、価値と実装の両方を確認できます。",
    objections,
    crossExamDeck,
    timeboxedAnswer,
    evidenceLinks,
    crossExamRunbook: [
      "Cross-exam deckで最も強い競合質問を選び、相手の強みを先に認める",
      "Competitive Battlecardで短い回答、source、SWOT receiptsを同時に見せる",
      "Release Drift Guardで公開Cloud Runが最新skill surfaceを返すことを確認する",
      "Run win autopilotでwin score、残アクション、証拠デッキを見せる",
      "Run demo runwayで30秒の審査員導線、証拠リンク、外部残リスクを見せる",
      "Run judge proofでGemini/Cloud Run/A2A/CI receiptを見せる",
      "Build pitchで30秒録画順と残リスクを見せる",
      "Winning Strategyで競合/SWOTと差別化を説明する",
      "Ops Drillで公開後の継続/rollback判断を見せる",
      "GitHub Actionsでtypecheck/test/build/architecture checkのsuccessを開く"
    ],
    a2aPayload: {
      method: "message/send",
      skill: "judge.drill",
      readinessScore,
      hardestQuestion: hardest?.question ?? null,
      crossExamDeck: crossExamDeck.map((card) => ({
        id: card.id,
        competitor: card.competitor,
        risk: card.risk,
        scoreLift: card.scoreLift,
        firstProof: card.proofSteps[0]?.endpoint
      })),
      timeboxedAnswer,
      objections: objections.map((objection) => ({
        criterionId: objection.criterionId,
        risk: objection.risk,
        question: objection.question,
        evidenceUrl: objection.evidenceUrl
      }))
    }
  };
}
