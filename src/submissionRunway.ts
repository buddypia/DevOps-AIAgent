import type { SubmissionCloseoutWorkbench } from "./submissionCloseout.js";
import type { SubmissionLaunchGate } from "./submissionLaunch.js";
import { HACKATHON_SUBMISSION_DEADLINE } from "./submission.js";
import type { WinnerProofPacket, WinnerPacketStatus } from "./winnerPacket.js";

export { HACKATHON_SUBMISSION_DEADLINE } from "./submission.js";

export type SubmissionRunwayReadiness = "on-track" | "deadline-risk" | "blocked";
export type SubmissionRunwayStatus = "done" | "scheduled" | "due-now" | "blocked";

export type SubmissionRunwayMilestone = {
  id: string;
  label: string;
  dueDate: string;
  daysFromNow: number;
  status: SubmissionRunwayStatus;
  owner: string;
  action: string;
  acceptance: string;
  proofUrl: string;
};

export type SubmissionRunwayTrack = {
  id: string;
  label: string;
  score: number;
  status: SubmissionRunwayStatus;
  summary: string;
  milestones: SubmissionRunwayMilestone[];
};

export type SubmissionRunwayEvidenceLock = {
  id: string;
  label: string;
  url: string;
  proof: string;
  status: SubmissionRunwayStatus;
};

export type FinalSubmissionRunway = {
  id: string;
  runwayScore: number;
  readiness: SubmissionRunwayReadiness;
  deadline: string;
  daysRemaining: number;
  headline: string;
  hardTruth: string;
  nextAction: SubmissionRunwayMilestone;
  tracks: SubmissionRunwayTrack[];
  dailyPlan: string[];
  evidenceLocks: SubmissionRunwayEvidenceLock[];
  a2aPayload: Record<string, unknown>;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const DEADLINE = new Date(HACKATHON_SUBMISSION_DEADLINE);

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

function formatJstDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function dueDate(daysBeforeDeadline: number) {
  return new Date(DEADLINE.getTime() - daysBeforeDeadline * DAY_MS);
}

function daysFrom(now: Date, target: Date) {
  return Math.floor((target.getTime() - now.getTime()) / DAY_MS);
}

function statusScore(status: SubmissionRunwayStatus) {
  if (status === "done") return 100;
  if (status === "scheduled") return 84;
  if (status === "due-now") return 66;
  return 20;
}

function milestoneStatus(input: { done: boolean; due: Date; now: Date; deadline: Date; blocked?: boolean }): SubmissionRunwayStatus {
  if (input.done) return "done";
  if (input.blocked || input.now.getTime() > input.deadline.getTime()) return "blocked";
  const days = daysFrom(input.now, input.due);
  return days <= 2 ? "due-now" : "scheduled";
}

function trackStatus(milestones: SubmissionRunwayMilestone[]): SubmissionRunwayStatus {
  if (milestones.some((milestone) => milestone.status === "blocked")) return "blocked";
  if (milestones.some((milestone) => milestone.status === "due-now")) return "due-now";
  if (milestones.every((milestone) => milestone.status === "done")) return "done";
  return "scheduled";
}

function launchUrlReady(launchGate: SubmissionLaunchGate, id: "protopedia-url" | "video-url") {
  return launchGate.urlStatuses.find((status) => status.id === id)?.status === "ready";
}

function closeoutItemReady(closeout: SubmissionCloseoutWorkbench, id: string) {
  return closeout.workItems.find((item) => item.id === id)?.status === "ready";
}

function winnerCriteriaReady(packet: WinnerProofPacket) {
  return packet.criteria.every((criterion) => criterion.status === "ready");
}

function pointFromWinnerStatus(status: WinnerPacketStatus) {
  if (status === "ready") return 100;
  if (status === "watch") return 70;
  return 20;
}

function milestone(input: {
  id: string;
  label: string;
  daysBeforeDeadline: number;
  done: boolean;
  now: Date;
  owner: string;
  action: string;
  acceptance: string;
  proofUrl: string;
  blocked?: boolean;
}): SubmissionRunwayMilestone {
  const due = dueDate(input.daysBeforeDeadline);
  return {
    id: input.id,
    label: input.label,
    dueDate: formatJstDate(due),
    daysFromNow: daysFrom(input.now, due),
    status: milestoneStatus({ done: input.done, due, now: input.now, deadline: DEADLINE, blocked: input.blocked }),
    owner: input.owner,
    action: input.action,
    acceptance: input.acceptance,
    proofUrl: input.proofUrl
  };
}

function track(input: { id: string; label: string; summary: string; milestones: SubmissionRunwayMilestone[] }): SubmissionRunwayTrack {
  const score = Math.round(clamp(average(input.milestones.map((item) => statusScore(item.status)))));
  return {
    id: input.id,
    label: input.label,
    score,
    status: trackStatus(input.milestones),
    summary: input.summary,
    milestones: input.milestones
  };
}

function statusPriority(status: SubmissionRunwayStatus) {
  if (status === "blocked") return 0;
  if (status === "due-now") return 1;
  if (status === "scheduled") return 2;
  return 3;
}

function byUrgency(left: SubmissionRunwayMilestone, right: SubmissionRunwayMilestone) {
  return statusPriority(left.status) - statusPriority(right.status) || left.daysFromNow - right.daysFromNow;
}

export function buildFinalSubmissionRunway(input: {
  baseUrl: string;
  currentDate?: string | Date;
  winnerPacket: WinnerProofPacket;
  closeout: SubmissionCloseoutWorkbench;
  launchGate: SubmissionLaunchGate;
}): FinalSubmissionRunway {
  const base = input.baseUrl.replace(/\/$/, "");
  const now = input.currentDate ? new Date(input.currentDate) : new Date();
  const deadline = DEADLINE;
  const daysRemaining = Math.max(0, daysFrom(now, deadline));
  const videoReady = launchUrlReady(input.launchGate, "video-url");
  const protopediaReady = launchUrlReady(input.launchGate, "protopedia-url");
  const launchReady = input.launchGate.readiness === "submit-ready";
  const invalidLaunch = input.launchGate.readiness === "invalid-urls";
  const proofReady = winnerCriteriaReady(input.winnerPacket);
  const pasteReady = closeoutItemReady(input.closeout, "paste-protopedia-fields");
  const architectureReady = closeoutItemReady(input.closeout, "attach-architecture");

  const proofTrack = track({
    id: "winner-proof",
    label: "Winner proof",
    summary: "審査5項目の主張、証拠URL、反論回答を締切前に固定する。",
    milestones: [
      milestone({
        id: "freeze-winner-packet",
        label: "Freeze five-criteria winner packet",
        daysBeforeDeadline: 18,
        done: proofReady,
        now,
        owner: "Gemini Strategist",
        action: "Winner Proof Packetの5 criteriaをreadyにし、録画で開く証拠URLを固定する。",
        acceptance: `${input.winnerPacket.criteria.filter((criterion) => criterion.status === "ready").length}/5 criteria ready`,
        proofUrl: absoluteUrl(base, "/api/winner-packet"),
        blocked: input.winnerPacket.readiness === "needs-proof"
      }),
      milestone({
        id: "lock-objection-answers",
        label: "Lock objection answers",
        daysBeforeDeadline: 15,
        done: input.winnerPacket.judgeQuestions.every((question) => question.status !== "blocked"),
        now,
        owner: "Judge Rehearsal",
        action: "想定質問と競合反論の回答をWinner Packetから動画台本へ転記する。",
        acceptance: `${input.winnerPacket.judgeQuestions.length} judge questions bundled`,
        proofUrl: absoluteUrl(base, "/api/winner-packet")
      })
    ]
  });

  const assetTrack = track({
    id: "protopedia-assets",
    label: "ProtoPedia assets",
    summary: "本文、構成図、必須タグを先に貼り、最後に作品URLを発行する。",
    milestones: [
      milestone({
        id: "paste-protopedia-fields",
        label: "Paste ProtoPedia fields",
        daysBeforeDeadline: 14,
        done: pasteReady,
        now,
        owner: "Submission owner",
        action: "Submission Dossier/Closeoutのcopy fieldsをProtoPedia本文へ貼る。",
        acceptance: `${input.closeout.copyFields.length} copy fields ready`,
        proofUrl: absoluteUrl(base, "/api/submission-closeout")
      }),
      milestone({
        id: "attach-architecture",
        label: "Attach architecture diagram",
        daysBeforeDeadline: 13,
        done: architectureReady,
        now,
        owner: "Submission owner",
        action: "Architecture Packの構成図URLとMermaidをProtoPediaに添付する。",
        acceptance: "Architecture diagram attached or ready to attach",
        proofUrl: absoluteUrl(base, "/api/architecture-pack")
      }),
      milestone({
        id: "publish-protopedia",
        label: "Publish ProtoPedia work page",
        daysBeforeDeadline: 8,
        done: protopediaReady,
        now,
        owner: "Submission owner",
        action: "findy_hackathonタグ付きで作品ページを公開し、作品URLをLaunch Gateへ入力する。",
        acceptance: input.launchGate.urlStatuses.find((status) => status.id === "protopedia-url")?.proof ?? "ProtoPedia URL pending",
        proofUrl: absoluteUrl(base, "/api/submission-launch"),
        blocked: invalidLaunch
      })
    ]
  });

  const videoTrack = track({
    id: "demo-video",
    label: "Demo video",
    summary: "録画順、証拠URL、想定質問を固定し、動画URLを発行する。",
    milestones: [
      milestone({
        id: "record-demo-video",
        label: "Record 90-second proof video",
        daysBeforeDeadline: 10,
        done: videoReady,
        now,
        owner: "Submission owner",
        action: "Judge RehearsalとWinner Packetのrecording orderを使い、90秒の証拠動画を録画する。",
        acceptance: `${input.winnerPacket.recordingOrder.length} recording segments available`,
        proofUrl: absoluteUrl(base, "/api/judge-rehearsal"),
        blocked: invalidLaunch
      }),
      milestone({
        id: "publish-video-url",
        label: "Publish video URL",
        daysBeforeDeadline: 9,
        done: videoReady,
        now,
        owner: "Submission owner",
        action: "YouTube/Vimeo/Google Driveへ動画を公開し、動画URLをLaunch Gateへ入力する。",
        acceptance: input.launchGate.urlStatuses.find((status) => status.id === "video-url")?.proof ?? "Video URL pending",
        proofUrl: absoluteUrl(base, "/api/submission-launch"),
        blocked: invalidLaunch
      })
    ]
  });

  const launchTrack = track({
    id: "final-launch",
    label: "Final launch",
    summary: "提出3点と動画URLを最後に再検収し、フォーム送信まで進める。",
    milestones: [
      milestone({
        id: "seal-launch-gate",
        label: "Seal Submission Launch Gate",
        daysBeforeDeadline: 5,
        done: launchReady,
        now,
        owner: "Submission owner",
        action: "ProtoPedia URLと動画URLを入力し、Submission Launch Gateをsubmit-readyにする。",
        acceptance: `${input.launchGate.launchScore} / ${input.launchGate.readiness}`,
        proofUrl: absoluteUrl(base, "/api/submission-launch"),
        blocked: invalidLaunch
      }),
      milestone({
        id: "final-rehearsal",
        label: "Run final judge rehearsal",
        daysBeforeDeadline: 3,
        done: launchReady && input.winnerPacket.readiness === "winner-packet-ready",
        now,
        owner: "Judge Rehearsal",
        action: "公開URL、Winner Packet、Release Drift、Launch Gateを通しで開き、質疑回答を1回録る。",
        acceptance: `${input.winnerPacket.readiness} / ${input.launchGate.readiness}`,
        proofUrl: absoluteUrl(base, "/api/winner-packet")
      }),
      milestone({
        id: "submit-three-urls",
        label: "Submit final three URLs",
        daysBeforeDeadline: 1,
        done: launchReady,
        now,
        owner: "Submission owner",
        action: "公開GitHub、Cloud Run、ProtoPedia作品URLをFindy提出フォームに貼る。",
        acceptance: input.launchGate.submitPacket.submitterMemo,
        proofUrl: input.launchGate.submitPacket.protopediaUrl || absoluteUrl(base, "/api/submission-launch"),
        blocked: invalidLaunch
      })
    ]
  });

  const tracks = [proofTrack, assetTrack, videoTrack, launchTrack];
  const milestones = tracks.flatMap((item) => item.milestones);
  const runwayScore = Math.round(
    clamp(
      average([
        input.winnerPacket.packetScore,
        input.closeout.closeoutScore,
        input.launchGate.launchScore,
        average(tracks.map((item) => item.score)),
        average(input.winnerPacket.criteria.map((criterion) => pointFromWinnerStatus(criterion.status)))
      ])
    )
  );
  const blocked = milestones.some((item) => item.status === "blocked") || input.winnerPacket.readiness === "needs-proof" || invalidLaunch;
  const hasExternalGap = !videoReady || !protopediaReady || !launchReady;
  const dueNow = milestones.some((item) => item.status === "due-now");
  const readiness: SubmissionRunwayReadiness = blocked ? "blocked" : hasExternalGap || dueNow ? "deadline-risk" : "on-track";
  const openMilestones = milestones.filter((item) => item.status !== "done").sort(byUrgency);
  const nextAction = openMilestones[0] ?? milestones[milestones.length - 1];

  return {
    id: `submission-runway-${runwayScore}-${readiness}`,
    runwayScore,
    readiness,
    deadline: HACKATHON_SUBMISSION_DEADLINE,
    daysRemaining,
    headline:
      readiness === "on-track"
        ? "提出締切までの証拠、動画、ProtoPedia、最終フォームが順番に閉じています。"
        : readiness === "deadline-risk"
          ? "勝ち筋証拠はあります。締切から逆算して動画URLとProtoPedia URLを閉じます。"
          : "締切またはURL形式で提出が止まっています。外部証拠を直すまで完了扱いにしません。",
    hardTruth:
      "優勝に必要なのは機能の追加だけではなく、7/10 23:59 JSTまでに審査員が開けるURL、動画、構成図、証拠APIが同じ物語で揃うことです。",
    nextAction,
    tracks,
    dailyPlan: openMilestones
      .slice(0, 7)
      .map((item) => `${item.dueDate}: ${item.label} - ${item.action}`),
    evidenceLocks: [
      {
        id: "winner-packet",
        label: "Winner Proof Packet",
        url: absoluteUrl(base, "/api/winner-packet"),
        proof: `${input.winnerPacket.packetScore} / ${input.winnerPacket.readiness}`,
        status: proofReady ? "done" : "due-now"
      },
      {
        id: "submission-closeout",
        label: "Submission Closeout",
        url: absoluteUrl(base, "/api/submission-closeout"),
        proof: `${input.closeout.closeoutScore} / ${input.closeout.readiness}`,
        status: input.closeout.readiness === "ready-to-submit" ? "done" : "scheduled"
      },
      {
        id: "submission-launch",
        label: "Submission Launch Gate",
        url: absoluteUrl(base, "/api/submission-launch"),
        proof: `${input.launchGate.launchScore} / ${input.launchGate.readiness}`,
        status: launchReady ? "done" : invalidLaunch ? "blocked" : "scheduled"
      },
      {
        id: "release-drift",
        label: "Release Drift Guard",
        url: absoluteUrl(base, "/api/release-drift"),
        proof: "Run after each deploy and before final submit",
        status: "scheduled"
      }
    ],
    a2aPayload: {
      method: "message/send",
      skill: "submission.runway",
      runwayScore,
      readiness,
      deadline: HACKATHON_SUBMISSION_DEADLINE,
      daysRemaining,
      nextAction: {
        id: nextAction.id,
        dueDate: nextAction.dueDate,
        status: nextAction.status,
        proofUrl: nextAction.proofUrl
      },
      tracks: tracks.map((item) => ({ id: item.id, status: item.status, score: item.score })),
      endpoints: {
        submissionRunway: absoluteUrl(base, "/api/submission-runway"),
        winnerPacket: absoluteUrl(base, "/api/winner-packet"),
        submissionCloseout: absoluteUrl(base, "/api/submission-closeout"),
        submissionLaunch: absoluteUrl(base, "/api/submission-launch"),
        releaseDrift: absoluteUrl(base, "/api/release-drift")
      }
    }
  };
}
