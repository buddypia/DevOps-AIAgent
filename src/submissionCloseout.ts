import type { DemoRunway } from "./demoRunway.js";
import type { SubmissionDossier } from "./dossier.js";
import type { JudgeProof } from "./proof.js";
import type { ProtoPediaPublisher, PublisherStatus } from "./publisher.js";
import type { LaunchItemStatus, SubmissionLaunchGate } from "./submissionLaunch.js";

export type CloseoutReadiness = "ready-to-submit" | "needs-closeout" | "invalid-evidence";
export type CloseoutStatus = "ready" | "watch" | "blocked";
export type CloseoutPriority = "now" | "next" | "later";

export type CloseoutWorkItem = {
  id: string;
  label: string;
  status: CloseoutStatus;
  priority: CloseoutPriority;
  owner: string;
  action: string;
  proof: string;
  endpoint: string;
};

export type CloseoutCopyField = {
  id: string;
  label: string;
  target: string;
  value: string;
  status: PublisherStatus;
};

export type CloseoutVideoStep = {
  id: string;
  timeRange: string;
  screen: string;
  narration: string;
  evidenceUrl: string;
  status: PublisherStatus;
};

export type SubmissionCloseoutWorkbench = {
  id: string;
  closeoutScore: number;
  readiness: CloseoutReadiness;
  headline: string;
  hardTruth: string;
  nextAction: CloseoutWorkItem;
  workItems: CloseoutWorkItem[];
  urlStatuses: SubmissionLaunchGate["urlStatuses"];
  copyFields: CloseoutCopyField[];
  videoSteps: CloseoutVideoStep[];
  submitPacket: SubmissionLaunchGate["submitPacket"];
  proofScript: string[];
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

function statusFromLaunch(status: LaunchItemStatus): CloseoutStatus {
  if (status === "ready") return "ready";
  if (status === "invalid") return "blocked";
  return "watch";
}

function priorityFromStatus(status: CloseoutStatus): CloseoutPriority {
  if (status === "blocked") return "now";
  if (status === "watch") return "now";
  return "later";
}

function item(input: {
  id: string;
  label: string;
  status: CloseoutStatus;
  owner?: string;
  action: string;
  proof: string;
  endpoint: string;
  priority?: CloseoutPriority;
}): CloseoutWorkItem {
  return {
    id: input.id,
    label: input.label,
    status: input.status,
    priority: input.priority ?? priorityFromStatus(input.status),
    owner: input.owner ?? "Submission owner",
    action: input.action,
    proof: input.proof,
    endpoint: input.endpoint
  };
}

function workScore(item: CloseoutWorkItem) {
  if (item.status === "ready") return 100;
  if (item.status === "watch") return 68;
  return 25;
}

export function buildSubmissionCloseoutWorkbench(input: {
  baseUrl: string;
  publisher: ProtoPediaPublisher;
  dossier: SubmissionDossier;
  demoRunway: DemoRunway;
  proof: JudgeProof;
  launchGate: SubmissionLaunchGate;
}): SubmissionCloseoutWorkbench {
  const base = input.baseUrl.replace(/\/$/, "");
  const protopedia = input.launchGate.urlStatuses.find((status) => status.id === "protopedia-url");
  const video = input.launchGate.urlStatuses.find((status) => status.id === "video-url");
  const protopediaStatus = statusFromLaunch(protopedia?.status ?? "missing");
  const videoStatus = statusFromLaunch(video?.status ?? "missing");
  const launchStatus: CloseoutStatus =
    input.launchGate.readiness === "submit-ready" ? "ready" : input.launchGate.readiness === "invalid-urls" ? "blocked" : "watch";
  const copyReady = input.dossier.copyBlocks.every((block) => block.status === "ready");
  const architectureReady = input.dossier.handoffPacket.architecturePack.diagramUrl.length > 0;
  const receiptReady = Boolean(input.proof.receipt.digest);
  const workItems: CloseoutWorkItem[] = [
    item({
      id: "paste-protopedia-fields",
      label: "Paste ProtoPedia fields",
      status: copyReady ? "ready" : "watch",
      action: "Submission Dossierのcopy fieldsをProtoPediaの作品タイトル、概要、課題、特徴、技術構成、タグへ貼る。",
      proof: `${input.dossier.copyBlocks.length} copy blocks / ${input.publisher.pasteFields.length} paste fields`,
      endpoint: absoluteUrl(base, "/api/dossier")
    }),
    item({
      id: "attach-architecture",
      label: "Attach architecture diagram",
      status: architectureReady ? "ready" : "watch",
      action: "Architecture Packの構成図URLをProtoPediaのシステム構成図へ添付する。",
      proof: input.dossier.handoffPacket.architecturePack.diagramUrl,
      endpoint: absoluteUrl(base, "/api/architecture-pack"),
      priority: architectureReady ? "later" : "next"
    }),
    item({
      id: "record-video",
      label: "Record and publish demo video",
      status: videoStatus,
      action: video?.action ?? "Demo Runwayの順番で30秒動画を公開する。",
      proof: video?.proof ?? "動画URLが未入力です。",
      endpoint: absoluteUrl(base, "/api/demo-run")
    }),
    item({
      id: "publish-protopedia",
      label: "Publish ProtoPedia work page",
      status: protopediaStatus,
      action: protopedia?.action ?? "findy_hackathonタグ付きでProtoPedia作品ページを公開する。",
      proof: protopedia?.proof ?? "ProtoPedia作品URLが未入力です。",
      endpoint: absoluteUrl(base, "/api/publisher")
    }),
    item({
      id: "seal-launch-gate",
      label: "Seal Submission Launch Gate",
      status: launchStatus,
      action: "ProtoPedia URLと動画URLを入れて、Submission Launch Gateがsubmit-readyになることを確認する。",
      proof: `${input.launchGate.launchScore} / ${input.launchGate.readiness}`,
      endpoint: absoluteUrl(base, "/api/submission-launch")
    }),
    item({
      id: "final-submit",
      label: "Submit final three URLs",
      status: launchStatus,
      action: "公開GitHub、Cloud Run、ProtoPedia作品URLをFindy提出フォームに貼り、動画URLをProtoPedia側に残す。",
      proof: input.launchGate.submitPacket.submitterMemo,
      endpoint: input.launchGate.submitPacket.protopediaUrl || absoluteUrl(base, "/api/submission-launch")
    }),
    item({
      id: "receipt-check",
      label: "Keep judge receipt hash",
      status: receiptReady ? "ready" : "watch",
      action: "Judge Proof receipt digestを動画説明または提出メモに控える。",
      proof: input.proof.receipt.digest || "receipt missing",
      endpoint: absoluteUrl(base, "/api/proof"),
      priority: receiptReady ? "later" : "next"
    })
  ];
  const blocked = workItems.some((entry) => entry.status === "blocked");
  const openItems = workItems.filter((entry) => entry.status !== "ready");
  const readiness: CloseoutReadiness = blocked ? "invalid-evidence" : openItems.length === 0 ? "ready-to-submit" : "needs-closeout";
  const closeoutScore = Math.round(
    clamp(
      average([
        input.launchGate.launchScore,
        input.dossier.dossierScore,
        input.publisher.publishScore,
        input.demoRunway.demoScore,
        input.proof.overallScore,
        average(workItems.map(workScore))
      ])
    )
  );
  const copyFields = input.dossier.handoffPacket.protopediaFields.slice(0, 9).map((field) => ({
    id: field.id,
    label: field.label,
    target: field.target,
    value: field.value,
    status: field.status
  }));
  const videoSteps = input.dossier.handoffPacket.videoChapters.slice(0, 8).map((chapter) => ({
    id: chapter.id,
    timeRange: chapter.timeRange,
    screen: chapter.screen,
    narration: chapter.narration,
    evidenceUrl: chapter.evidenceUrl,
    status: chapter.status
  }));
  const nextAction =
    workItems.find((entry) => entry.status === "blocked") ??
    workItems.find((entry) => entry.status === "watch") ??
    workItems[workItems.length - 1];

  return {
    id: `submission-closeout-${closeoutScore}-${readiness}`,
    closeoutScore,
    readiness,
    headline:
      readiness === "ready-to-submit"
        ? "提出3点と録画証拠が揃い、最終提出できます。"
        : readiness === "invalid-evidence"
          ? "外部URLの形式を直すまで、提出完了とは扱いません。"
          : "本体MVPは提出可能域です。残りはProtoPedia公開と動画URLのcloseoutです。",
    hardTruth:
      "ハッカソン審査では、コードが強くても提出URLと動画が欠けると評価対象に乗りません。外部作業を最後の一画面で閉じます。",
    nextAction,
    workItems,
    urlStatuses: input.launchGate.urlStatuses,
    copyFields,
    videoSteps,
    submitPacket: input.launchGate.submitPacket,
    proofScript: [
      "Submission Closeout Workbenchで残作業をnow/watch/readyに分ける。",
      "Copy fieldsをProtoPediaへ貼り、構成図を添付する。",
      "Video chaptersの順番で30秒動画を録画し、動画URLを入力する。",
      "ProtoPedia作品URLを入力し、Submission Launch Gateをsubmit-readyにする。",
      "公開GitHub、Cloud Run、ProtoPedia URLをFindy提出フォームへ貼る。"
    ],
    a2aPayload: {
      method: "message/send",
      skill: "submission.closeout",
      closeoutScore,
      readiness,
      nextAction: {
        id: nextAction.id,
        status: nextAction.status,
        action: nextAction.action,
        endpoint: nextAction.endpoint
      },
      workItems: workItems.map((entry) => ({
        id: entry.id,
        status: entry.status,
        priority: entry.priority
      })),
      urls: input.launchGate.urlStatuses.map((status) => ({
        id: status.id,
        status: status.status,
        url: status.url || null
      })),
      endpoints: {
        app: base,
        closeout: absoluteUrl(base, "/api/submission-closeout"),
        launchGate: absoluteUrl(base, "/api/submission-launch"),
        dossier: absoluteUrl(base, "/api/dossier"),
        publisher: absoluteUrl(base, "/api/publisher"),
        demoRunway: absoluteUrl(base, "/api/demo-run")
      }
    }
  };
}
