import type { DemoRunway } from "./demoRunway.js";
import type { BattlecardStatus, CompetitiveBattlecard } from "./competitiveBattlecard.js";
import type { FinalistSimulation } from "./finalist.js";
import type { MissionRun } from "./mission.js";
import type { PitchRun } from "./pitch.js";
import type { JudgeProof } from "./proof.js";
import type { ProtoPediaPublisher, ProtoPediaQualityLock, PublisherStatus } from "./publisher.js";
import { SUBMISSION_PROOF } from "./submission.js";
import type { WinningAutopilotRun } from "./autopilot.js";
import { buildArchitecturePack, type ArchitecturePack } from "./architecturePack.js";
import type { WinningStrategy } from "./strategy.js";
import type { Recommendation } from "./types.js";
import type { ImpactCase } from "./impact.js";
import type { PilotEconomics, PilotEconomicsStatus } from "./pilotEconomics.js";

export const SUBMISSION_DOSSIER_SKILL_ID = "submission.dossier";
export const SUBMISSION_DOSSIER_LOCK_TAG = "submission-dossier-lock";
export const SUBMISSION_DOSSIER_REQUIRED_SIGNAL = `${SUBMISSION_DOSSIER_SKILL_ID}:tag:${SUBMISSION_DOSSIER_LOCK_TAG}`;

export type DossierReadiness = "ready-to-submit" | "needs-external-urls";

export type DossierCopyBlock = {
  id: string;
  label: string;
  target: string;
  value: string;
  status: PublisherStatus;
};

export type DossierLink = {
  id: string;
  label: string;
  url: string | null;
  status: PublisherStatus;
  proof: string;
};

export type DossierCheck = {
  id: string;
  label: string;
  status: PublisherStatus;
  action: string;
  proof: string;
};

export type DossierHandoffField = {
  id: string;
  label: string;
  target: string;
  value: string;
  status: PublisherStatus;
  proof: string;
};

export type DossierVideoChapter = {
  id: string;
  timeRange: string;
  screen: string;
  narration: string;
  evidenceUrl: string;
  status: PublisherStatus;
};

export type DossierCompetitiveReceipt = {
  id: string;
  competitor: string;
  status: PublisherStatus;
  objection: string;
  proofRoute: string;
  recordingCue: string;
  protopediaLine: string;
  acceptance: string;
};

export type DossierBuyerValueReceipt = {
  id: string;
  label: string;
  status: PublisherStatus;
  claim: string;
  metric: string;
  proof: string;
  protopediaLine: string;
};

export type DossierHandoffPacket = {
  submitFields: DossierHandoffField[];
  protopediaFields: DossierHandoffField[];
  qualityLock: ProtoPediaQualityLock;
  videoChapters: DossierVideoChapter[];
  competitiveReceipts: DossierCompetitiveReceipt[];
  buyerValueReceipts: DossierBuyerValueReceipt[];
  architecturePack: ArchitecturePack;
  proofLinks: DossierLink[];
  missingOnly: Array<{ id: string; label: string; target: string; action: string }>;
};

export type SubmissionDossier = {
  id: string;
  dossierScore: number;
  readiness: DossierReadiness;
  title: string;
  executiveMemo: string;
  copyBlocks: DossierCopyBlock[];
  links: DossierLink[];
  recordingPlan: string[];
  finalChecks: DossierCheck[];
  handoffPacket: DossierHandoffPacket;
  markdown: string;
  a2aPayload: Record<string, unknown>;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function statusPoints(status: PublisherStatus) {
  return status === "ready" ? 100 : 58;
}

function block(id: string, label: string, target: string, value: string, status: PublisherStatus = "ready"): DossierCopyBlock {
  return { id, label, target, value, status };
}

function markdownList(values: string[]) {
  return values.map((value) => `- ${value}`).join("\n");
}

function markdownSection(title: string, body: string) {
  return [`## ${title}`, "", body.trim()].join("\n");
}

function baseUrlFromProof(proof: JudgeProof, mission: MissionRun) {
  const suffix = mission.submissionPack.architectureDiagramUrl;
  if (proof.links.architecture.endsWith(suffix)) return proof.links.architecture.slice(0, -suffix.length).replace(/\/$/, "");
  return proof.links.app.replace(/\/$/, "");
}

function statusFromBattlecard(status: BattlecardStatus): PublisherStatus {
  return status === "lead" ? "ready" : "watch";
}

function statusFromEconomics(status: PilotEconomicsStatus): PublisherStatus {
  return status === "clear" ? "ready" : "watch";
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
  if (["ready", "ready-to-submit", "copy-locked", "submit-page-ready"].includes(status)) return "good";
  if (["missing", "blocked"].includes(status)) return "bad";
  return "watch";
}

export function buildSubmissionDossier(input: {
  recommendation: Recommendation;
  strategy: WinningStrategy;
  mission: MissionRun;
  pitch: PitchRun;
  finalist: FinalistSimulation;
  publisher: ProtoPediaPublisher;
  demoRunway: DemoRunway;
  autopilot: WinningAutopilotRun;
  proof: JudgeProof;
  battlecard?: CompetitiveBattlecard;
  impactCase?: ImpactCase;
  pilotEconomics?: PilotEconomics;
}): SubmissionDossier {
  const { recommendation, strategy, mission, pitch, finalist, publisher, demoRunway, autopilot, proof, battlecard, impactCase, pilotEconomics } = input;
  const baseUrl = baseUrlFromProof(proof, mission);
  const selectedAgents = recommendation.selected.map((agent) => agent.name).join(" / ") || "A2A Market Broker";
  const pasteField = (id: string) => publisher.pasteFields.find((field) => field.id === id);
  const externalGapIds = new Set([...publisher.missingExternal.map((item) => item.id), ...autopilot.blockers.map((item) => item.id)]);
  const readiness: DossierReadiness = externalGapIds.size === 0 ? "ready-to-submit" : "needs-external-urls";
  const competitiveReceipts: DossierCompetitiveReceipt[] =
    battlecard?.objectionReceipts.slice(0, 4).map((receipt) => ({
      id: receipt.id,
      competitor: receipt.competitor,
      status: statusFromBattlecard(receipt.status),
      objection: receipt.objection,
      proofRoute: receipt.proofRoute,
      recordingCue: receipt.recordingCue,
      protopediaLine: receipt.protopediaLine,
      acceptance: receipt.acceptance
    })) ?? [];
  const savedHours =
    pilotEconomics?.unitEconomics.savedHoursPerCycle ??
    impactCase?.metrics.filter((metric) => metric.unit === "hours").reduce((sum, metric) => sum + Math.max(0, metric.delta), 0);
  const buyerValueReceipts: DossierBuyerValueReceipt[] =
    impactCase && pilotEconomics
      ? [
          {
            id: "practical-impact",
            label: "対象ユーザー別KPI",
            status: impactCase.posture === "pilot-ready" ? "ready" : "watch",
            claim: impactCase.hardTruth,
            metric: `${impactCase.impactScore} impact / ${impactCase.personas.length} personas`,
            proof: impactCase.personas.map((persona) => `${persona.persona}: ${persona.kpi}`).join(" / "),
            protopediaLine: `開発リード、Platform/SRE、提出者の3 personaに対し、${impactCase.metrics
              .slice(0, 3)
              .map((metric) => `${metric.label}${metric.delta}${metric.unit}`)
              .join("、")}を体験価値として提示します。`
          },
          {
            id: "pilot-economics",
            label: "導入実験の回収性",
            status: pilotEconomics.posture === "investment-ready" ? "ready" : "watch",
            claim: pilotEconomics.hardTruth,
            metric: `${pilotEconomics.unitEconomics.paybackDays}d payback / ${yen(pilotEconomics.unitEconomics.monthlyValueYen)} monthly value`,
            proof: `pilot ${yen(pilotEconomics.unitEconomics.pilotCostYen)} / saved ${savedHours ?? 0}h per cycle`,
            protopediaLine: `初期pilot ${yen(pilotEconomics.unitEconomics.pilotCostYen)}に対し、月次価値${yen(
              pilotEconomics.unitEconomics.monthlyValueYen
            )}、回収${pilotEconomics.unitEconomics.paybackDays}日として小さく導入判断できます。`
          },
          ...pilotEconomics.buyerObjections.slice(0, 2).map((objection) => ({
            id: `buyer-${objection.id}`,
            label: "買い手反論",
            status: statusFromEconomics(objection.status),
            claim: objection.objection,
            metric: objection.status,
            proof: objection.evidence,
            protopediaLine: `${objection.objection} には「${objection.answer}」と回答し、${objection.evidence}を証拠として開きます。`
          }))
        ]
      : [];
  const opening = `Win Autopilotの判定は${autopilot.winScore}点/${autopilot.readiness}。${selectedAgents} が、競合/SWOT、A2A委任、Cloud Run運用、提出証拠、30秒デモ導線を一括で束ねます。`;
  const judgeEvidence = [
    `Judge Proof overall ${proof.overallScore}、CI ${proof.ci.conclusion}`,
    `Finalist ${finalist.finalistScore} (${finalist.finalistBand}) / ${finalist.judgeConsensus}`,
    `Demo Runway ${demoRunway.totalSeconds}秒/${demoRunway.steps.length} steps`,
    `競合 ${strategy.competitors.length}件、SWOT、moat ${strategy.moatScore}`,
    ...(battlecard ? [`Competitive Battlecard ${battlecard.battleScore} (${battlecard.readiness}) / 反論レシート${competitiveReceipts.length}件`] : []),
    ...(impactCase && pilotEconomics
      ? [`Impact ${impactCase.impactScore} (${impactCase.posture}) / Pilot economics ${pilotEconomics.economicsScore} (${pilotEconomics.posture})`]
      : [])
  ];
  const competitiveCopy = competitiveReceipts
    .map((receipt) =>
      [
        `- ${receipt.competitor}: ${receipt.objection}`,
        `  - 提出文: ${receipt.protopediaLine}`,
        `  - 証拠: ${receipt.proofRoute}`,
        `  - 検収: ${receipt.acceptance}`
      ].join("\n")
    )
    .join("\n");
  const buyerValueCopy = buyerValueReceipts
    .map((receipt) =>
      [
        `- ${receipt.label}: ${receipt.claim}`,
        `  - 指標: ${receipt.metric}`,
        `  - 証拠: ${receipt.proof}`,
        `  - 提出文: ${receipt.protopediaLine}`
      ].join("\n")
    )
    .join("\n");
  const copyBlocks: DossierCopyBlock[] = [
    block("title", "作品タイトル", "ProtoPedia title", pasteField("title")?.value ?? mission.submissionPack.protopediaTitle),
    block("one-liner", "一言説明", "ProtoPedia summary", pasteField("one-liner")?.value ?? ""),
    block("problem", "課題", "ProtoPedia problem", pasteField("problem")?.value ?? ""),
    block("users", "対象ユーザー", "ProtoPedia users", pasteField("users")?.value ?? ""),
    block("features", "特徴", "ProtoPedia features", pasteField("features")?.value ?? ""),
    block("technology", "技術構成", "ProtoPedia technology", pasteField("technology")?.value ?? ""),
    block("demo-flow", "デモの見どころ", "ProtoPedia demo description", demoRunway.recordingCues.map((cue) => `- ${cue}`).join("\n")),
    ...(competitiveReceipts.length > 0
      ? [block("competitive-objections", "競合反論レシート", "ProtoPedia story / judge Q&A", competitiveCopy)]
      : []),
    ...(buyerValueReceipts.length > 0
      ? [block("buyer-value-proof", "実用性・買い手価値", "ProtoPedia practicality / business value", buyerValueCopy)]
      : []),
    block("judge-proof", "審査向け証拠", "ProtoPedia notes", [opening, markdownList(judgeEvidence)].join("\n")),
    block("tags", "タグ", "ProtoPedia tags", pasteField("tags")?.value ?? mission.submissionPack.tags.join(", "))
  ];
  const links: DossierLink[] = [
    ...publisher.assets.map((asset) => ({
      id: asset.id,
      label: asset.label,
      url: asset.url ?? null,
      status: asset.status,
      proof: asset.proof
    })),
    ...autopilot.evidenceDeck
      .filter((item) => !publisher.assets.some((asset) => asset.id === item.id))
      .map((item) => ({
        id: item.id,
        label: item.label,
        url: item.url,
        status: "ready" as const,
        proof: item.proof
      }))
  ];
  const finalChecks: DossierCheck[] = [
    ...publisher.finalChecklist,
    ...autopilot.nextActions
      .filter((action) => !publisher.finalChecklist.some((item) => item.id === action.id))
      .map((action) => ({
        id: action.id,
        label: action.label,
        status: action.priority === "now" ? ("watch" as const) : ("ready" as const),
        action: action.command,
        proof: action.proof
      }))
  ];
  const recordingPlan = [
    "0-4s: Market Intelで公式ソース付き競合比較とAI能力調達の勝ち筋を見せる",
    "4-8s: MVP Auditで必須技術、審査5項目、DevOps証拠、提出3点のwatch/failを見せる",
    "8-12s: Win Autopilotでwin score、残アクション、証拠デッキを見せる",
    ...competitiveReceipts
      .slice(0, 2)
      .map((receipt) => `16-21s: Competitive Battlecardで${receipt.competitor}への反論、SWOT、証拠routeを同時に見せる`),
    ...buyerValueReceipts
      .slice(0, 2)
      .map((receipt) => `21-25s: Pilot Economics/Impact Caseで${receipt.label}を見せる (${receipt.metric})`),
    ...demoRunway.recordingCues
  ];
  const submitFields: DossierHandoffField[] = [
    {
      id: "github-url",
      label: "公開GitHubリポジトリURL",
      target: "Findy submission form",
      value: SUBMISSION_PROOF.publicGitHubUrl,
      status: "ready",
      proof: "公開リポジトリURL"
    },
    {
      id: "deployed-url",
      label: "デプロイ済みURL",
      target: "Findy submission form",
      value: SUBMISSION_PROOF.deployedUrl,
      status: "ready",
      proof: "Cloud Run公開URL"
    },
    {
      id: "protopedia-url",
      label: "ProtoPedia作品URL",
      target: "Findy submission form",
      value: SUBMISSION_PROOF.protopediaUrl,
      status: SUBMISSION_PROOF.protopediaUrl ? "ready" : "watch",
      proof: SUBMISSION_PROOF.protopediaUrl || "外部公開後に貼る"
    },
    {
      id: "video-url",
      label: "動画URL",
      target: "ProtoPedia media",
      value: SUBMISSION_PROOF.videoUrl,
      status: SUBMISSION_PROOF.videoUrl ? "ready" : "watch",
      proof: SUBMISSION_PROOF.videoUrl || "Demo Runwayの順番で録画して貼る"
    },
    {
      id: "findy-tag",
      label: "必須タグ",
      target: "ProtoPedia tags",
      value: "findy_hackathon",
      status: "ready",
      proof: "Hackathon required tag"
    }
  ];
  const protopediaFields: DossierHandoffField[] = copyBlocks.map((item) =>
    ({
      id: item.id,
      label: item.label,
      target: item.target,
      value: item.value,
      status: item.status,
      proof: "copy-ready"
    })
  );
  const videoChapters: DossierVideoChapter[] = demoRunway.steps.map((step) => ({
    id: step.id,
    timeRange: step.timeRange,
    screen: step.screen,
    narration: step.narration,
    evidenceUrl: step.evidenceUrl,
    status: step.status
  }));
  const architecturePack = buildArchitecturePack({
    baseUrl,
    recommendation,
    strategy,
    mission
  });
  const missingOnly = [
    ...submitFields
      .filter((item) => item.status === "watch")
      .map((item) => ({ id: item.id, label: item.label, target: item.target, action: item.proof })),
    ...finalChecks
      .filter((item) => item.status === "watch")
      .map((item) => ({ id: item.id, label: item.label, target: "Submission checklist", action: item.action }))
  ];
  const handoffPacket: DossierHandoffPacket = {
    submitFields,
    protopediaFields,
    qualityLock: publisher.qualityLock,
    videoChapters,
    competitiveReceipts,
    buyerValueReceipts,
    architecturePack,
    proofLinks: links,
    missingOnly
  };
  const dossierScore = Math.round(
    clamp(
      average([
        autopilot.winScore,
        publisher.publishScore,
        proof.overallScore,
        finalist.finalistScore,
        demoRunway.demoScore,
        publisher.qualityLock.qualityScore,
        average(links.map((item) => statusPoints(item.status))),
        average(finalChecks.map((item) => statusPoints(item.status)))
      ])
    )
  );
  const markdown = [
    `# ${mission.submissionPack.protopediaTitle}`,
    "",
    opening,
    "",
    markdownSection("一言説明", pasteField("one-liner")?.value ?? ""),
    "",
    markdownSection("課題", pasteField("problem")?.value ?? ""),
    "",
    markdownSection("対象ユーザー", pasteField("users")?.value ?? ""),
    "",
    markdownSection("特徴", pasteField("features")?.value ?? ""),
    "",
    markdownSection("技術構成", pasteField("technology")?.value ?? ""),
    "",
    markdownSection(
      "ProtoPedia品質ロック",
      [
        `${publisher.qualityLock.qualityScore} quality / ${publisher.qualityLock.readiness}`,
        publisher.qualityLock.headline,
        ...publisher.qualityLock.checks.map((check) => `- ${check.label}: ${check.status} / ${check.acceptance}`)
      ].join("\n")
    ),
    "",
    markdownSection("審査向け証拠", markdownList(judgeEvidence)),
    "",
    ...(competitiveReceipts.length > 0
      ? [markdownSection("競合反論レシート", competitiveCopy), ""]
      : []),
    ...(buyerValueReceipts.length > 0
      ? [markdownSection("実用性・買い手価値レシート", buyerValueCopy), ""]
      : []),
    markdownSection("30秒動画録画順", markdownList(recordingPlan)),
    "",
    markdownSection(
      "提出フォームパケット",
      submitFields.map((field) => `- ${field.label}: ${field.value || "needs external URL"} (${field.target} / ${field.status})`).join("\n")
    ),
    "",
    markdownSection(
      "動画チャプター",
      videoChapters.map((chapter) => `- ${chapter.timeRange}: ${chapter.screen} / ${chapter.narration}`).join("\n")
    ),
    "",
    markdownSection(
      "システム構成図パケット",
      [
        `Diagram: ${architecturePack.diagramUrl}`,
        `Architecture score: ${architecturePack.architectureScore} (${architecturePack.readiness})`,
        "Mermaid:",
        "```mermaid",
        architecturePack.mermaid,
        "```",
        architecturePack.protopediaChecklist.map((item) => `- ${item}`).join("\n")
      ].join("\n")
    ),
    "",
    markdownSection(
      "提出リンク",
      links.map((link) => `- ${link.label}: ${link.url ?? "needs external URL"} (${link.status})`).join("\n")
    ),
    "",
    markdownSection("最終チェック", finalChecks.map((check) => `- [${check.status === "ready" ? "x" : " "}] ${check.label}: ${check.action}`).join("\n")),
    "",
    `Tags: ${mission.submissionPack.tags.join(", ")}`
  ].join("\n");

  return {
    id: `submission-dossier-${dossierScore}-${mission.id}`,
    dossierScore,
    readiness,
    title: mission.submissionPack.protopediaTitle,
    executiveMemo:
      readiness === "ready-to-submit"
        ? "提出本文、URL、動画、証拠リンクが揃っています。"
        : "本文、構成図、公開URL、CI証跡は揃っています。残りは動画URLとProtoPedia作品URLの外部登録です。",
    copyBlocks,
    links,
    recordingPlan,
    finalChecks,
    handoffPacket,
    markdown,
    a2aPayload: {
      method: "message/send",
      skill: SUBMISSION_DOSSIER_SKILL_ID,
      dossierScore,
      readiness,
      winScore: autopilot.winScore,
      selectedAgents: recommendation.selected.map((agent) => agent.id),
      endpoints: {
        dossier: `${baseUrl}/api/dossier`,
        dossierPage: `${baseUrl}/dossier`,
        publisherPage: `${baseUrl}/publisher`,
        architecturePackPage: `${baseUrl}/architecture-pack`,
        submissionLaunchPage: `${baseUrl}/submission-launch`
      },
      copyBlocks: copyBlocks.map((item) => ({ id: item.id, target: item.target, status: item.status })),
      missingLinks: links.filter((item) => item.status === "watch").map((item) => item.id),
      handoffPacket: {
        submitFields: submitFields.map((item) => ({ id: item.id, target: item.target, status: item.status })),
        protopediaFields: protopediaFields.map((item) => ({ id: item.id, target: item.target, status: item.status })),
        qualityLock: {
          qualityScore: publisher.qualityLock.qualityScore,
          readiness: publisher.qualityLock.readiness,
          checks: publisher.qualityLock.checks.map((item) => ({ id: item.id, status: item.status }))
        },
        videoChapters: videoChapters.map((item) => ({ id: item.id, timeRange: item.timeRange, screen: item.screen, status: item.status })),
        competitiveReceipts: competitiveReceipts.map((item) => ({
          id: item.id,
          competitor: item.competitor,
          status: item.status,
          proofRoute: item.proofRoute
        })),
        buyerValueReceipts: buyerValueReceipts.map((item) => ({
          id: item.id,
          status: item.status,
          metric: item.metric,
          proof: item.proof
        })),
        architecturePack: {
          score: architecturePack.architectureScore,
          readiness: architecturePack.readiness,
          diagramUrl: architecturePack.diagramUrl,
          requirements: architecturePack.requirements.map((item) => ({ id: item.id, status: item.status }))
        },
        missingOnly: missingOnly.map((item) => ({ id: item.id, target: item.target }))
      },
      finalChecks: finalChecks.map((item) => ({ id: item.id, status: item.status }))
    }
  };
}

export function renderSubmissionDossierHtml(dossier: SubmissionDossier) {
  const metrics = [
    { label: "Readiness", value: dossier.readiness, status: dossier.readiness },
    { label: "Dossier Score", value: dossier.dossierScore, status: dossier.dossierScore >= 86 ? "ready" : "watch" },
    { label: "Copy Blocks", value: dossier.copyBlocks.length, status: "ready" },
    { label: "Missing External", value: dossier.handoffPacket.missingOnly.length, status: dossier.handoffPacket.missingOnly.length === 0 ? "ready" : "watch" }
  ]
    .map(
      (metric) => `
        <article class="metric ${tone(String(metric.status))}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>`
    )
    .join("");
  const copyBlocks = dossier.copyBlocks
    .map(
      (blockItem) => `
        <article class="card ${tone(blockItem.status)}">
          <div><strong>${escapeHtml(blockItem.label)}</strong><span>${escapeHtml(blockItem.status)}</span></div>
          <small>${escapeHtml(blockItem.target)}</small>
          <pre>${escapeHtml(blockItem.value)}</pre>
        </article>`
    )
    .join("");
  const submitFields = dossier.handoffPacket.submitFields
    .map(
      (field) => `
        <li class="${tone(field.status)}">
          <strong>${escapeHtml(field.label)}</strong>
          <span>${escapeHtml(field.status)} / ${escapeHtml(field.target)}</span>
          <small>${escapeHtml(field.value || field.proof)}</small>
        </li>`
    )
    .join("");
  const protopediaFields = dossier.handoffPacket.protopediaFields
    .map(
      (field) => `
        <li class="${tone(field.status)}">
          <strong>${escapeHtml(field.label)}</strong>
          <span>${escapeHtml(field.status)} / ${escapeHtml(field.target)}</span>
          <small>${escapeHtml(field.proof)}</small>
        </li>`
    )
    .join("");
  const qualityChecks = dossier.handoffPacket.qualityLock.checks
    .map(
      (check) => `
        <li class="${tone(check.status)}">
          <strong>${escapeHtml(check.label)}</strong>
          <span>${escapeHtml(check.status)} / ${escapeHtml(check.proof)}</span>
          <small>${escapeHtml(check.acceptance)}</small>
        </li>`
    )
    .join("");
  const competitive = dossier.handoffPacket.competitiveReceipts
    .map(
      (receipt) => `
        <article class="card ${tone(receipt.status)}">
          <div><strong>${escapeHtml(receipt.competitor)}</strong><span>${escapeHtml(receipt.status)}</span></div>
          <p>${escapeHtml(receipt.objection)}</p>
          <small>${escapeHtml(receipt.proofRoute)}</small>
          <small>${escapeHtml(receipt.acceptance)}</small>
        </article>`
    )
    .join("");
  const buyerValue = dossier.handoffPacket.buyerValueReceipts
    .map(
      (receipt) => `
        <article class="card ${tone(receipt.status)}">
          <div><strong>${escapeHtml(receipt.label)}</strong><span>${escapeHtml(receipt.status)}</span></div>
          <p>${escapeHtml(receipt.claim)}</p>
          <small>${escapeHtml(receipt.metric)}</small>
          <small>${escapeHtml(receipt.proof)}</small>
        </article>`
    )
    .join("");
  const recordingPlan = dossier.recordingPlan.map((step) => `<li>${escapeHtml(step)}</li>`).join("");
  const videoChapters = dossier.handoffPacket.videoChapters
    .map(
      (chapter) => `
        <tr>
          <td><strong>${escapeHtml(chapter.timeRange)}</strong><span>${escapeHtml(chapter.status)}</span></td>
          <td>${escapeHtml(chapter.screen)}</td>
          <td>${escapeHtml(chapter.narration)}</td>
          <td><a href="${escapeHtml(chapter.evidenceUrl)}">${escapeHtml(chapter.evidenceUrl)}</a></td>
        </tr>`
    )
    .join("");
  const proofLinks = dossier.handoffPacket.proofLinks
    .map(
      (link) => `
        <article class="card ${tone(link.status)}">
          <div><strong>${escapeHtml(link.label)}</strong><span>${escapeHtml(link.status)}</span></div>
          <p>${escapeHtml(link.proof)}</p>
          ${link.url ? `<a href="${escapeHtml(link.url)}">${escapeHtml(link.url)}</a>` : `<small>External URL watch</small>`}
        </article>`
    )
    .join("");
  const finalChecks = dossier.finalChecks
    .map(
      (check) => `
        <li class="${tone(check.status)}">
          <strong>${escapeHtml(check.label)}</strong>
          <span>${escapeHtml(check.status)} / ${escapeHtml(check.proof)}</span>
          <small>${escapeHtml(check.action)}</small>
        </li>`
    )
    .join("");
  const missingOnly =
    dossier.handoffPacket.missingOnly.length === 0
      ? `<li>No external gaps remain.</li>`
      : dossier.handoffPacket.missingOnly
          .map((item) => `<li><strong>${escapeHtml(item.label)}</strong> ${escapeHtml(item.target)} <small>${escapeHtml(item.action)}</small></li>`)
          .join("");

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Submission Dossier Proof</title>
    <style>
      :root { color-scheme: light; --ink: #1d2220; --muted: #5e6c67; --line: #d9e4de; --paper: #fbfcfa; --panel: #fff; --green: #13715d; --mint: #e6f4ed; --amber-bg: #fff4d4; --coral-bg: #fff0ec; }
      * { box-sizing: border-box; }
      body { margin: 0; background: var(--paper); color: var(--ink); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 40px 0 20px; }
      .eyebrow { color: var(--green); font-size: .78rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0; }
      h1 { margin: 8px 0 10px; font-size: 3rem; line-height: 1; letter-spacing: 0; max-width: 980px; }
      h2 { margin: 28px 0 10px; font-size: 1.12rem; }
      p { color: var(--muted); }
      .metrics, .grid { display: grid; gap: 12px; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 22px; }
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .metric, .card, .panel { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); padding: 16px; box-shadow: 0 10px 24px rgba(29, 34, 32, .06); min-width: 0; }
      .metric span, .card span, li span, td span { color: var(--muted); font-size: .74rem; font-weight: 900; text-transform: uppercase; }
      .metric strong { display: block; margin-top: 6px; font-size: 1.35rem; overflow-wrap: anywhere; }
      .card div { display: flex; gap: 12px; justify-content: space-between; align-items: start; }
      pre { margin: 10px 0 0; padding: 12px; white-space: pre-wrap; overflow-wrap: anywhere; background: rgba(29, 34, 32, .04); border-radius: 8px; font: inherit; color: var(--ink); }
      ol { margin: 8px 0 0; padding-left: 20px; }
      li { margin-bottom: 10px; padding: 8px; border-radius: 8px; overflow-wrap: anywhere; }
      li span, li small, li a, td span { display: block; margin-top: 4px; overflow-wrap: anywhere; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; vertical-align: top; border-bottom: 1px solid var(--line); padding: 10px; overflow-wrap: anywhere; }
      th { color: var(--muted); font-size: .74rem; text-transform: uppercase; }
      .good { border-color: #a9d8c2; background: var(--mint); }
      .watch { border-color: #ead39a; background: var(--amber-bg); }
      .bad { border-color: #efb7aa; background: var(--coral-bg); }
      footer { padding: 20px 0 40px; color: var(--muted); }
      @media (max-width: 900px) { h1 { font-size: 2rem; } .metrics, .grid { grid-template-columns: 1fr; } .card div { display: block; } th, td { display: block; padding: 8px 0; } tr { display: block; border-bottom: 1px solid var(--line); padding: 8px 0; } }
    </style>
  </head>
  <body>
    <header>
      <div class="eyebrow">Submission Dossier Proof</div>
      <h1>${escapeHtml(dossier.title)}</h1>
      <p><strong>${escapeHtml(dossier.executiveMemo)}</strong></p>
      <p>${escapeHtml(dossier.handoffPacket.qualityLock.headline)}</p>
      <section class="metrics">${metrics}</section>
    </header>
    <main>
      <h2>Copy Blocks</h2>
      <section class="grid">${copyBlocks}</section>
      <h2>Handoff Packet</h2>
      <section class="grid">
        <article class="panel"><h3>Submit Fields</h3><ol>${submitFields}</ol></article>
        <article class="panel"><h3>ProtoPedia Fields</h3><ol>${protopediaFields}</ol></article>
      </section>
      <section class="panel"><h3>ProtoPedia Quality Lock</h3><ol>${qualityChecks}</ol></section>
      <section class="panel"><h3>Missing External Only</h3><ol>${missingOnly}</ol></section>
      <h2>Competitive Receipts</h2>
      <section class="grid">${competitive}</section>
      <h2>Buyer Value Receipts</h2>
      <section class="grid">${buyerValue}</section>
      <h2>Recording Plan</h2>
      <section class="panel"><ol>${recordingPlan}</ol></section>
      <section class="panel">
        <h3>Video Chapters</h3>
        <table><thead><tr><th>Time</th><th>Screen</th><th>Narration</th><th>Evidence</th></tr></thead><tbody>${videoChapters}</tbody></table>
      </section>
      <h2>Proof Links</h2>
      <section class="grid">${proofLinks}</section>
      <h2>Final Checks</h2>
      <section class="panel"><ol>${finalChecks}</ol></section>
      <h2>Markdown Dossier</h2>
      <section class="panel"><pre>${escapeHtml(dossier.markdown)}</pre></section>
    </main>
    <footer>${escapeHtml(dossier.id)} / A2A skill ${SUBMISSION_DOSSIER_SKILL_ID}</footer>
  </body>
</html>`;
}
