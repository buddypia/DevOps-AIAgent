import type { SubmissionDossier } from "./dossier.js";
import type { MvpAuditReport } from "./mvpAudit.js";
import type { JudgeProof } from "./proof.js";
import type { ProtoPediaPublisher } from "./publisher.js";
import { SUBMISSION_PROOF } from "./submission.js";

export type LaunchReadiness = "submit-ready" | "needs-external-urls" | "invalid-urls";
export type LaunchItemStatus = "ready" | "missing" | "invalid";

export type LaunchUrlStatus = {
  id: "protopedia-url" | "video-url";
  label: string;
  url: string;
  status: LaunchItemStatus;
  proof: string;
  action: string;
};

export type LaunchChecklistItem = {
  id: string;
  label: string;
  status: LaunchItemStatus;
  proof: string;
};

export type LaunchCopyAction = {
  id: string;
  label: string;
  target: string;
  value: string;
  status: LaunchItemStatus;
};

export type SubmissionLaunchGate = {
  id: string;
  launchScore: number;
  readiness: LaunchReadiness;
  verdict: string;
  hardTruth: string;
  urlStatuses: LaunchUrlStatus[];
  checklist: LaunchChecklistItem[];
  copyActions: LaunchCopyAction[];
  submitPacket: {
    githubUrl: string;
    deployedUrl: string;
    protopediaUrl: string;
    videoUrl: string;
    protoPediaTag: "findy_hackathon";
    title: string;
    submitterMemo: string;
  };
  a2aPayload: Record<string, unknown>;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function trimUrl(value: string | undefined) {
  return value?.trim() ?? "";
}

function parsedHttpsUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" ? parsed : null;
  } catch {
    return null;
  }
}

function validProtoPediaUrl(value: string) {
  const parsed = parsedHttpsUrl(value);
  if (!parsed) return false;
  return parsed.hostname === "protopedia.net" || parsed.hostname.endsWith(".protopedia.net");
}

function validVideoUrl(value: string) {
  const parsed = parsedHttpsUrl(value);
  if (!parsed) return false;
  const host = parsed.hostname.replace(/^www\./, "");
  return host === "youtube.com" || host === "youtu.be" || host === "vimeo.com" || host === "drive.google.com";
}

function statusScore(status: LaunchItemStatus) {
  if (status === "ready") return 100;
  if (status === "missing") return 58;
  return 20;
}

function externalStatus(input: {
  id: "protopedia-url" | "video-url";
  label: string;
  url: string;
  valid: boolean;
  validProof: string;
  missingAction: string;
  invalidAction: string;
}): LaunchUrlStatus {
  if (!input.url) {
    return {
      id: input.id,
      label: input.label,
      url: "",
      status: "missing",
      proof: "外部URLがまだ入力されていません。",
      action: input.missingAction
    };
  }
  if (!input.valid) {
    return {
      id: input.id,
      label: input.label,
      url: input.url,
      status: "invalid",
      proof: "https URLとして受け付けられないか、想定サービスのURLではありません。",
      action: input.invalidAction
    };
  }
  return {
    id: input.id,
    label: input.label,
    url: input.url,
    status: "ready",
    proof: input.validProof,
    action: "提出フォームへ貼り付ける"
  };
}

export function buildSubmissionLaunchGate(input: {
  protopediaUrl?: string;
  videoUrl?: string;
  mvpAudit: MvpAuditReport;
  dossier: SubmissionDossier;
  proof: JudgeProof;
  publisher: ProtoPediaPublisher;
}): SubmissionLaunchGate {
  const protopediaUrl = trimUrl(input.protopediaUrl);
  const videoUrl = trimUrl(input.videoUrl);
  const urlStatuses: LaunchUrlStatus[] = [
    externalStatus({
      id: "protopedia-url",
      label: "ProtoPedia作品URL",
      url: protopediaUrl,
      valid: validProtoPediaUrl(protopediaUrl),
      validProof: "ProtoPediaドメインのhttps URLとして形式確認済み。",
      missingAction: "Submission Dossierのcopy blocksを貼り、findy_hackathonタグ付きで作品ページを公開する",
      invalidAction: "https://protopedia.net/prototype/... の形式で作品URLを入力する"
    }),
    externalStatus({
      id: "video-url",
      label: "動画URL",
      url: videoUrl,
      valid: validVideoUrl(videoUrl),
      validProof: "YouTube / Vimeo / Google Drive のhttps URLとして形式確認済み。",
      missingAction: "Demo RunwayまたはSubmission Dossierの録画順で30秒動画を公開する",
      invalidAction: "YouTube、Vimeo、Google Driveのhttps動画URLを入力する"
    })
  ];
  const hasInvalid = urlStatuses.some((item) => item.status === "invalid");
  const hasMissing = urlStatuses.some((item) => item.status === "missing");
  const hasFailGate = input.mvpAudit.gates.some((gate) => gate.status === "fail");
  const checklist: LaunchChecklistItem[] = [
    {
      id: "github-url",
      label: "公開GitHubリポジトリURL",
      status: SUBMISSION_PROOF.publicGitHubUrl.startsWith("https://") ? "ready" : "missing",
      proof: SUBMISSION_PROOF.publicGitHubUrl || "missing"
    },
    {
      id: "deployed-url",
      label: "デプロイ済みURL",
      status: SUBMISSION_PROOF.deployedUrl.startsWith("https://") ? "ready" : "missing",
      proof: SUBMISSION_PROOF.deployedUrl || "missing"
    },
    ...urlStatuses.map((item) => ({ id: item.id, label: item.label, status: item.status, proof: item.proof })),
    {
      id: "findy-tag",
      label: "ProtoPediaタグ",
      status: "ready" as const,
      proof: "findy_hackathon"
    },
    {
      id: "ci",
      label: "GitHub Actions CI",
      status: input.proof.ci.status === "passed" ? "ready" : "missing",
      proof: input.proof.ci.conclusion
    },
    {
      id: "mvp-audit",
      label: "MVP hard gates",
      status: hasFailGate ? "invalid" : "ready",
      proof: `${input.mvpAudit.mvpScore} / ${input.mvpAudit.band}`
    },
    {
      id: "copy-blocks",
      label: "ProtoPedia本文",
      status: input.dossier.copyBlocks.every((block) => block.status === "ready") ? "ready" : "missing",
      proof: `${input.dossier.copyBlocks.length} copy blocks`
    },
    {
      id: "proof-receipt",
      label: "Judge Proof receipt",
      status: input.proof.receipt.digest ? "ready" : "missing",
      proof: input.proof.receipt.digest
    }
  ];
  const readiness: LaunchReadiness = hasInvalid || hasFailGate ? "invalid-urls" : hasMissing ? "needs-external-urls" : "submit-ready";
  const launchScore = Math.round(
    clamp(
      average([
        input.mvpAudit.mvpScore,
        input.dossier.dossierScore,
        input.proof.overallScore,
        input.publisher.publishScore,
        average(urlStatuses.map((item) => statusScore(item.status))),
        average(checklist.map((item) => statusScore(item.status)))
      ])
    )
  );
  const title = input.dossier.title;
  const copyActions: LaunchCopyAction[] = [
    { id: "github", label: "GitHub URL", target: "Findy submission form", value: SUBMISSION_PROOF.publicGitHubUrl, status: "ready" },
    { id: "deployed", label: "Deployed URL", target: "Findy submission form", value: SUBMISSION_PROOF.deployedUrl, status: "ready" },
    { id: "protopedia", label: "ProtoPedia work URL", target: "Findy submission form", value: protopediaUrl, status: urlStatuses[0].status },
    { id: "video", label: "Video URL", target: "ProtoPedia media / work page", value: videoUrl, status: urlStatuses[1].status },
    { id: "tag", label: "Required tag", target: "ProtoPedia tags", value: "findy_hackathon", status: "ready" }
  ];
  const verdict =
    readiness === "submit-ready"
      ? "Submit now"
      : readiness === "needs-external-urls"
        ? "External URLs still required"
        : "Fix invalid external URL evidence";
  const hardTruth =
    readiness === "submit-ready"
      ? "提出3点のURL形式、本文、タグ、CI、Judge Proof receiptが揃っています。"
      : readiness === "needs-external-urls"
        ? "コードと提出本文は揃っていますが、ProtoPedia作品URLと動画URLを貼るまで提出完了ではありません。"
        : "外部URL形式またはMVP hard gateに問題があります。形式を直すまで提出完了扱いにしません。";

  return {
    id: `submission-launch-${launchScore}-${readiness}`,
    launchScore,
    readiness,
    verdict,
    hardTruth,
    urlStatuses,
    checklist,
    copyActions,
    submitPacket: {
      githubUrl: SUBMISSION_PROOF.publicGitHubUrl,
      deployedUrl: SUBMISSION_PROOF.deployedUrl,
      protopediaUrl,
      videoUrl,
      protoPediaTag: "findy_hackathon",
      title,
      submitterMemo: `${title}: GitHub、Cloud Run、ProtoPedia作品URL、動画URL、findy_hackathonタグを最終提出に貼る。`
    },
    a2aPayload: {
      method: "message/send",
      skill: "submission.launch",
      launchScore,
      readiness,
      verdict,
      urls: urlStatuses.map((item) => ({ id: item.id, status: item.status, url: item.url || null })),
      checklist: checklist.map((item) => ({ id: item.id, status: item.status })),
      submitPacket: {
        githubUrl: SUBMISSION_PROOF.publicGitHubUrl,
        deployedUrl: SUBMISSION_PROOF.deployedUrl,
        protopediaUrl: protopediaUrl || null,
        videoUrl: videoUrl || null,
        tag: "findy_hackathon"
      }
    }
  };
}
