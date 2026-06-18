import type { DemoRunway } from "./demoRunway.js";
import type { SubmissionDossier } from "./dossier.js";
import type { JudgeProof } from "./proof.js";
import type { ProtoPediaPublisher, ProtoPediaQualityLock, PublisherStatus } from "./publisher.js";
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

export type CloseoutVideoLockReadiness = "video-url-ready" | "recording-locked" | "needs-recording-proof" | "blocked-video-url";
export type CloseoutDryRunReadiness = "submit-dry-run-sealed" | "submit-dry-run-ready" | "needs-dry-run-fix";

export type CloseoutVideoLockCheck = {
  id: string;
  label: string;
  status: CloseoutStatus;
  proof: string;
  evidenceUrl: string;
  acceptance: string;
};

export type CloseoutVideoCaption = {
  timeRange: string;
  text: string;
};

export type CloseoutVideoProofLock = {
  id: string;
  lockScore: number;
  readiness: CloseoutVideoLockReadiness;
  targetDurationSeconds: number;
  publishTarget: string;
  openingFrame: string;
  finalFrame: string;
  voiceoverHook: string;
  checks: CloseoutVideoLockCheck[];
  captions: CloseoutVideoCaption[];
};

export type CloseoutDryRunCheck = {
  id: string;
  label: string;
  status: CloseoutStatus;
  proof: string;
  evidenceUrl: string;
  acceptance: string;
};

export type CloseoutDryRunLock = {
  id: string;
  lockScore: number;
  readiness: CloseoutDryRunReadiness;
  readyCount: number;
  watchCount: number;
  blockedCount: number;
  operatorLine: string;
  runbook: string[];
  checks: CloseoutDryRunCheck[];
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
  protopediaQualityLock: ProtoPediaQualityLock;
  videoProofLock: CloseoutVideoProofLock;
  dryRunLock: CloseoutDryRunLock;
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

function lockScore(item: CloseoutVideoLockCheck) {
  if (item.status === "ready") return 100;
  if (item.status === "watch") return 70;
  return 20;
}

function dryRunCheckScore(item: CloseoutDryRunCheck) {
  if (item.status === "ready") return 100;
  if (item.status === "watch") return 70;
  return 20;
}

function videoLockReadiness(input: { videoStatus: CloseoutStatus; checks: CloseoutVideoLockCheck[] }): CloseoutVideoLockReadiness {
  if (input.videoStatus === "blocked" || input.checks.some((check) => check.status === "blocked")) return "blocked-video-url";
  const nonUrlChecks = input.checks.filter((check) => check.id !== "publish-url");
  const lockReady = nonUrlChecks.every((check) => check.status === "ready");
  if (input.videoStatus === "ready" && lockReady) return "video-url-ready";
  if (lockReady) return "recording-locked";
  return "needs-recording-proof";
}

function buildVideoProofLock(input: {
  base: string;
  demoRunway: DemoRunway;
  proof: JudgeProof;
  launchGate: SubmissionLaunchGate;
  copyFields: CloseoutCopyField[];
  videoSteps: CloseoutVideoStep[];
  videoStatus: CloseoutStatus;
}): CloseoutVideoProofLock {
  const proofLink = (id: string) => input.demoRunway.proofLinks.find((link) => link.id === id);
  const readyCopyCount = input.copyFields.filter((field) => field.status === "ready").length;
  const hasCompetitiveProof =
    input.demoRunway.competitiveProofReel.length > 0 || input.videoSteps.some((step) => step.screen.includes("Competitive Battlecard"));
  const appLink = proofLink("app");
  const battlecardLink = proofLink("battlecard") ?? { url: absoluteUrl(input.base, "/api/competitive-battlecard"), proof: "Competitive Battlecard endpoint" };
  const checks: CloseoutVideoLockCheck[] = [
    {
      id: "public-opening",
      label: "Open public Cloud Run first",
      status: appLink ? "ready" : "watch",
      proof: appLink?.proof ?? "Cloud Run app proof link is not in the runway.",
      evidenceUrl: appLink?.url ?? absoluteUrl(input.base, "/api/healthz"),
      acceptance: "0-4sで公開Cloud Run画面またはJudge Proofを開いて、ローカル録画ではないことを見せる。"
    },
    {
      id: "thirty-second-route",
      label: "Keep the proof reel to 30 seconds",
      status: input.demoRunway.totalSeconds === 30 && input.videoSteps.length >= 7 ? "ready" : "watch",
      proof: `${input.demoRunway.totalSeconds}s / ${input.videoSteps.length} chapters`,
      evidenceUrl: absoluteUrl(input.base, "/api/demo-run"),
      acceptance: "30秒リール内に7章以上の画面順、台詞、証拠URLがある。"
    },
    {
      id: "judge-proof-receipt",
      label: "Show judge proof receipt",
      status: input.proof.overallScore >= 85 && Boolean(input.proof.receipt.digest) ? "ready" : "watch",
      proof: `${input.proof.overallScore} proof / ${input.proof.receipt.digest || "receipt missing"}`,
      evidenceUrl: absoluteUrl(input.base, "/api/proof"),
      acceptance: "動画内または説明欄にJudge Proofのsha256 receiptを残せる。"
    },
    {
      id: "competitive-objection",
      label: "Answer the strongest competitor objection",
      status: hasCompetitiveProof ? "ready" : "watch",
      proof: hasCompetitiveProof
        ? `${input.demoRunway.competitiveProofReel.length} competitive proof receipts`
        : "Competitive Battlecardが録画順に入っていません。",
      evidenceUrl: battlecardLink.url,
      acceptance: "既存ツールでよくないか、という反論にsource/SWOT/proof routeで答える章を入れる。"
    },
    {
      id: "submission-handoff",
      label: "End on submission handoff",
      status: readyCopyCount >= 8 ? "ready" : "watch",
      proof: `${readyCopyCount}/${input.copyFields.length} ProtoPedia copy fields ready`,
      evidenceUrl: absoluteUrl(input.base, "/api/dossier"),
      acceptance: "最後にProtoPedia本文、構成図、GitHub、Cloud Run、タグの提出先を示す。"
    },
    {
      id: "publish-url",
      label: "Publish YouTube or Vimeo URL",
      status: input.videoStatus,
      proof: input.launchGate.urlStatuses.find((status) => status.id === "video-url")?.proof ?? "動画URLが未入力です。",
      evidenceUrl: absoluteUrl(input.base, "/api/submission-launch"),
      acceptance: "録画後にYouTubeまたはVimeoのhttps URLをSubmission Launch Gateへ入力する。"
    }
  ];
  const readiness = videoLockReadiness({ videoStatus: input.videoStatus, checks });
  const lockScoreValue = Math.round(
    clamp(
      average([
        input.demoRunway.demoScore,
        input.proof.overallScore,
        average(checks.map(lockScore)),
        input.demoRunway.totalSeconds === 30 ? 100 : 75
      ])
    )
  );

  return {
    id: `video-proof-lock-${lockScoreValue}-${readiness}`,
    lockScore: lockScoreValue,
    readiness,
    targetDurationSeconds: input.demoRunway.totalSeconds,
    publishTarget: "YouTube or Vimeo https URL",
    openingFrame: input.videoSteps[0]?.screen ?? "Judge Proof",
    finalFrame: input.videoSteps[input.videoSteps.length - 1]?.screen ?? "Submission links",
    voiceoverHook: input.videoSteps[0]?.narration ?? "最初に公開証拠を出します。",
    checks,
    captions: input.videoSteps.slice(0, 5).map((step) => ({
      timeRange: step.timeRange,
      text: `${step.screen}: ${step.narration}`
    }))
  };
}

function buildCloseoutQualityLock(input: { publisher: ProtoPediaPublisher; launchGate: SubmissionLaunchGate }): ProtoPediaQualityLock {
  const externalUrlState: PublisherStatus = input.launchGate.readiness === "submit-ready" ? "ready" : "watch";
  const launchProof =
    externalUrlState === "ready"
      ? "ProtoPedia and video URLs are ready in Submission Launch Gate."
      : `${input.launchGate.urlStatuses.filter((status) => status.status !== "ready").length} launch URL items still need closure.`;
  const checks = input.publisher.qualityLock.checks.map((check) =>
    check.id === "external-url-closure"
      ? {
          ...check,
          status: externalUrlState,
          proof: launchProof
        }
      : check
  );
  const nonExternalReady = checks.filter((check) => check.id !== "external-url-closure").every((check) => check.status === "ready");
  const readiness: ProtoPediaQualityLock["readiness"] =
    nonExternalReady && externalUrlState === "ready" ? "submit-page-ready" : nonExternalReady ? "copy-locked" : "needs-copy-repair";
  const qualityScore =
    externalUrlState === "ready" ? Math.round(clamp(average([input.publisher.qualityLock.qualityScore, 100]))) : input.publisher.qualityLock.qualityScore;

  return {
    ...input.publisher.qualityLock,
    id: `protopedia-quality-lock-${qualityScore}-${readiness}`,
    qualityScore,
    readiness,
    headline:
      readiness === "submit-page-ready"
        ? "ProtoPedia本文、証拠、外部URLまで提出ページとしてロック済みです。"
        : input.publisher.qualityLock.headline,
    checks,
    externalUrlState
  };
}

function buildDryRunLock(input: {
  base: string;
  workItems: CloseoutWorkItem[];
  copyFields: CloseoutCopyField[];
  videoSteps: CloseoutVideoStep[];
  protopediaQualityLock: ProtoPediaQualityLock;
  videoProofLock: CloseoutVideoProofLock;
  launchGate: SubmissionLaunchGate;
  proof: JudgeProof;
}): CloseoutDryRunLock {
  const workItem = (id: string) => input.workItems.find((item) => item.id === id);
  const copyReady = input.copyFields.length >= 8 && input.copyFields.every((field) => field.status === "ready");
  const videoRouteReady = input.videoSteps.length >= 7 && input.videoProofLock.readiness !== "needs-recording-proof";
  const submitPacketReady =
    input.launchGate.submitPacket.githubUrl.length > 0 &&
    input.launchGate.submitPacket.deployedUrl.length > 0 &&
    input.launchGate.submitPacket.title.length > 0 &&
    input.launchGate.submitPacket.protoPediaTag === "findy_hackathon" &&
    input.launchGate.submitPacket.protoPediaStatus === "完成" &&
    input.launchGate.submitPacket.submitterMemo.length > 0;
  const externalStatus: CloseoutStatus =
    input.launchGate.readiness === "submit-ready" ? "ready" : input.launchGate.readiness === "invalid-urls" ? "blocked" : "watch";
  const checks: CloseoutDryRunCheck[] = [
    {
      id: "copy-fields",
      label: "Copy fields ready",
      status: copyReady ? "ready" : "watch",
      proof: `${input.copyFields.filter((field) => field.status === "ready").length}/${input.copyFields.length} ProtoPedia fields ready.`,
      evidenceUrl: absoluteUrl(input.base, "/api/dossier"),
      acceptance: "ProtoPediaへ貼るタイトル、概要、課題、ユーザー、特徴、技術構成、タグ、URL欄が揃っている。"
    },
    {
      id: "architecture-asset",
      label: "Architecture asset ready",
      status: workItem("attach-architecture")?.status ?? "watch",
      proof: workItem("attach-architecture")?.proof ?? "Architecture diagram proof is missing.",
      evidenceUrl: absoluteUrl(input.base, "/api/architecture-pack"),
      acceptance: "構成図URLをProtoPediaへ添付できる。"
    },
    {
      id: "video-route",
      label: "Video route locked",
      status: input.videoProofLock.readiness === "blocked-video-url" ? "blocked" : videoRouteReady ? "ready" : "watch",
      proof: `${input.videoProofLock.lockScore} / ${input.videoProofLock.readiness}; ${input.videoSteps.length} chapters.`,
      evidenceUrl: absoluteUrl(input.base, "/api/demo-run"),
      acceptance: "公開Cloud Runから始まり、競合反論、Judge Proof、提出handoffまで30秒で辿れる。"
    },
    {
      id: "protopedia-copy-lock",
      label: "ProtoPedia copy locked",
      status:
        input.protopediaQualityLock.readiness === "submit-page-ready" || input.protopediaQualityLock.readiness === "copy-locked"
          ? "ready"
          : "watch",
      proof: `${input.protopediaQualityLock.qualityScore} / ${input.protopediaQualityLock.readiness}`,
      evidenceUrl: absoluteUrl(input.base, "/api/publisher"),
      acceptance: "本文が課題、対象ユーザー、特徴、必須技術、競合/SWOT、公開証拠を満たす。"
    },
    {
      id: "proof-receipt",
      label: "Judge proof receipt ready",
      status: input.proof.receipt.digest ? "ready" : "watch",
      proof: input.proof.receipt.digest || "Judge Proof receipt digest is missing.",
      evidenceUrl: absoluteUrl(input.base, "/api/proof"),
      acceptance: "動画説明または提出メモへsha256 receiptを残せる。"
    },
    {
      id: "submit-packet",
      label: "Submit packet handoff ready",
      status: submitPacketReady ? "ready" : "watch",
      proof: `${input.launchGate.submitPacket.title}; ${input.launchGate.submitPacket.protoPediaStatus}; ${input.launchGate.submitPacket.protoPediaTag}; ${externalStatus === "ready" ? "external URLs pasted" : "external URL slots reserved"}.`,
      evidenceUrl: absoluteUrl(input.base, "/api/submission-launch"),
      acceptance: "GitHub、Cloud Run、タイトル、完成ステータス、findy_hackathonタグ、提出メモ、外部URLの貼付枠が明確である。実URLの有無はexternal-url-handoffで判定する。"
    },
    {
      id: "external-url-handoff",
      label: "External URL handoff",
      status: externalStatus,
      proof:
        externalStatus === "ready"
          ? "ProtoPedia and video URLs are present and valid."
          : externalStatus === "blocked"
            ? "External URLs are malformed and must be corrected before submission."
            : "ProtoPedia work URL and video URL still need to be published and pasted.",
      evidenceUrl: absoluteUrl(input.base, "/api/submission-launch"),
      acceptance: "URL未入力はwatchとして残し、不正URLはblockedとして提出完了扱いにしない。"
    }
  ];
  const nonExternalChecks = checks.filter((check) => check.id !== "external-url-handoff");
  const readyCount = checks.filter((check) => check.status === "ready").length;
  const watchCount = checks.filter((check) => check.status === "watch").length;
  const blockedCount = checks.filter((check) => check.status === "blocked").length;
  const readiness: CloseoutDryRunReadiness =
    blockedCount > 0
      ? "needs-dry-run-fix"
      : checks.every((check) => check.status === "ready")
        ? "submit-dry-run-sealed"
        : nonExternalChecks.every((check) => check.status === "ready")
          ? "submit-dry-run-ready"
          : "needs-dry-run-fix";
  const lockScoreValue = Math.round(clamp(average(checks.map(dryRunCheckScore))));

  return {
    id: `submission-dry-run-lock-${lockScoreValue}-${readiness}`,
    lockScore: lockScoreValue,
    readiness,
    readyCount,
    watchCount,
    blockedCount,
    operatorLine:
      readiness === "submit-dry-run-sealed"
        ? "All submission assets, URLs, receipts, and final handoff fields are sealed for final submit."
        : readiness === "submit-dry-run-ready"
          ? "Submission dry run is ready: copy, architecture, video route, quality, receipt, and submit packet are locked; only external published URLs remain."
          : "Submission dry run still has an internal asset or malformed URL issue; fix it before recording.",
    runbook: [
      "Open Submission Closeout Workbench on the public Cloud Run URL.",
      "Paste the copy fields into ProtoPedia and attach the architecture diagram.",
      "Record the video route in order and publish it to YouTube or Vimeo.",
      "Paste the ProtoPedia and video URLs into Submission Launch Gate.",
      "Confirm Submission Launch Gate returns submit-ready.",
      "Paste GitHub, Cloud Run, and ProtoPedia URLs into the final Findy form."
    ],
    checks
  };
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
  const protopediaQualityLock = buildCloseoutQualityLock({ publisher: input.publisher, launchGate: input.launchGate });
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
  const videoProofLock = buildVideoProofLock({
    base,
    demoRunway: input.demoRunway,
    proof: input.proof,
    launchGate: input.launchGate,
    copyFields,
    videoSteps,
    videoStatus
  });
  const dryRunLock = buildDryRunLock({
    base,
    workItems,
    copyFields,
    videoSteps,
    protopediaQualityLock,
    videoProofLock,
    launchGate: input.launchGate,
    proof: input.proof
  });
  const blocked = workItems.some((entry) => entry.status === "blocked");
  const openItems = workItems.filter((entry) => entry.status !== "ready");
  const readiness: CloseoutReadiness = blocked ? "invalid-evidence" : openItems.length === 0 ? "ready-to-submit" : "needs-closeout";
  const closeoutScore = Math.round(
    clamp(
      average([
        input.launchGate.launchScore,
        input.dossier.dossierScore,
        input.publisher.publishScore,
        protopediaQualityLock.qualityScore,
        input.demoRunway.demoScore,
        input.proof.overallScore,
        dryRunLock.lockScore,
        average(workItems.map(workScore))
      ])
    )
  );
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
    protopediaQualityLock,
    videoProofLock,
    dryRunLock,
    submitPacket: input.launchGate.submitPacket,
    proofScript: [
      "Submission Closeout Workbenchで残作業をnow/watch/readyに分ける。",
      `ProtoPedia Quality Lockで${protopediaQualityLock.qualityScore}点の本文受入条件を固定する。`,
      `Video Proof Lockで${videoProofLock.lockScore}点の録画受入条件を固定する。`,
      `Submission Dry Run Lockで${dryRunLock.lockScore}点の外部URL以外の提出リハーサルを固定する。`,
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
      protopediaQualityLock: {
        qualityScore: protopediaQualityLock.qualityScore,
        readiness: protopediaQualityLock.readiness,
        checks: protopediaQualityLock.checks.map((check) => ({ id: check.id, status: check.status }))
      },
      videoProofLock: {
        lockScore: videoProofLock.lockScore,
        readiness: videoProofLock.readiness,
        targetDurationSeconds: videoProofLock.targetDurationSeconds,
        checks: videoProofLock.checks.map((check) => ({ id: check.id, status: check.status, evidenceUrl: check.evidenceUrl }))
      },
      dryRunLock: {
        lockScore: dryRunLock.lockScore,
        readiness: dryRunLock.readiness,
        readyCount: dryRunLock.readyCount,
        watchCount: dryRunLock.watchCount,
        blockedCount: dryRunLock.blockedCount,
        checks: dryRunLock.checks.map((check) => ({ id: check.id, status: check.status, evidenceUrl: check.evidenceUrl }))
      },
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
