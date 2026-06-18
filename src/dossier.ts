import type { DemoRunway } from "./demoRunway.js";
import type { FinalistSimulation } from "./finalist.js";
import type { MissionRun } from "./mission.js";
import type { PitchRun } from "./pitch.js";
import type { JudgeProof } from "./proof.js";
import type { ProtoPediaPublisher, PublisherStatus } from "./publisher.js";
import { SUBMISSION_PROOF } from "./submission.js";
import type { WinningAutopilotRun } from "./autopilot.js";
import { buildArchitecturePack, type ArchitecturePack } from "./architecturePack.js";
import type { WinningStrategy } from "./strategy.js";
import type { Recommendation } from "./types.js";

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

export type DossierHandoffPacket = {
  submitFields: DossierHandoffField[];
  protopediaFields: DossierHandoffField[];
  videoChapters: DossierVideoChapter[];
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
}): SubmissionDossier {
  const { recommendation, strategy, mission, pitch, finalist, publisher, demoRunway, autopilot, proof } = input;
  const selectedAgents = recommendation.selected.map((agent) => agent.name).join(" / ") || "A2A Market Broker";
  const pasteField = (id: string) => publisher.pasteFields.find((field) => field.id === id);
  const externalGapIds = new Set([...publisher.missingExternal.map((item) => item.id), ...autopilot.blockers.map((item) => item.id)]);
  const readiness: DossierReadiness = externalGapIds.size === 0 ? "ready-to-submit" : "needs-external-urls";
  const opening = `Win Autopilotの判定は${autopilot.winScore}点/${autopilot.readiness}。${selectedAgents} が、競合/SWOT、A2A委任、Cloud Run運用、提出証拠、30秒デモ導線を一括で束ねます。`;
  const judgeEvidence = [
    `Judge Proof overall ${proof.overallScore}、CI ${proof.ci.conclusion}`,
    `Finalist ${finalist.finalistScore} (${finalist.finalistBand}) / ${finalist.judgeConsensus}`,
    `Demo Runway ${demoRunway.totalSeconds}秒/${demoRunway.steps.length} steps`,
    `競合 ${strategy.competitors.length}件、SWOT、moat ${strategy.moatScore}`
  ];
  const copyBlocks: DossierCopyBlock[] = [
    block("title", "作品タイトル", "ProtoPedia title", pasteField("title")?.value ?? mission.submissionPack.protopediaTitle),
    block("one-liner", "一言説明", "ProtoPedia summary", pasteField("one-liner")?.value ?? ""),
    block("problem", "課題", "ProtoPedia problem", pasteField("problem")?.value ?? ""),
    block("users", "対象ユーザー", "ProtoPedia users", pasteField("users")?.value ?? ""),
    block("features", "特徴", "ProtoPedia features", pasteField("features")?.value ?? ""),
    block("technology", "技術構成", "ProtoPedia technology", pasteField("technology")?.value ?? ""),
    block("demo-flow", "デモの見どころ", "ProtoPedia demo description", demoRunway.recordingCues.map((cue) => `- ${cue}`).join("\n")),
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
    baseUrl: baseUrlFromProof(proof, mission),
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
    videoChapters,
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
    markdownSection("審査向け証拠", markdownList(judgeEvidence)),
    "",
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
      skill: "submission.dossier",
      dossierScore,
      readiness,
      winScore: autopilot.winScore,
      selectedAgents: recommendation.selected.map((agent) => agent.id),
      copyBlocks: copyBlocks.map((item) => ({ id: item.id, target: item.target, status: item.status })),
      missingLinks: links.filter((item) => item.status === "watch").map((item) => item.id),
      handoffPacket: {
        submitFields: submitFields.map((item) => ({ id: item.id, target: item.target, status: item.status })),
        protopediaFields: protopediaFields.map((item) => ({ id: item.id, target: item.target, status: item.status })),
        videoChapters: videoChapters.map((item) => ({ id: item.id, timeRange: item.timeRange, screen: item.screen, status: item.status })),
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
