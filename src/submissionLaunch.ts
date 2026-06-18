import type { SubmissionDossier } from "./dossier.js";
import type { MvpAuditReport } from "./mvpAudit.js";
import type { JudgeProof } from "./proof.js";
import type { ProtoPediaPublisher } from "./publisher.js";
import { HACKATHON_SUBMISSION_DEADLINE, normalizeSubmissionUrl, SUBMISSION_PROOF, validProtoPediaUrl, validVideoUrl } from "./submission.js";

export type LaunchReadiness = "submit-ready" | "needs-external-urls" | "invalid-urls";
export type LaunchItemStatus = "ready" | "missing" | "invalid";
export type FinalSubmitReadiness = "findy-form-sealed" | "external-url-watch" | "needs-form-fix";

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

export type LaunchComplianceItem = {
  id:
    | "work-status"
    | "title"
    | "summary"
    | "story-problem"
    | "story-users"
    | "story-features"
    | "architecture-diagram"
    | "video-embed"
    | "findy-tag";
  label: string;
  status: LaunchItemStatus;
  proof: string;
  source: "hackathon" | "protopedia";
  action: string;
};

export type LaunchCopyAction = {
  id: string;
  label: string;
  target: string;
  value: string;
  status: LaunchItemStatus;
};

export type FinalSubmitCheck = {
  id:
    | "github-url"
    | "deployed-url"
    | "protopedia-url"
    | "video-url"
    | "findy-tag"
    | "work-status"
    | "proof-receipt"
    | "deadline";
  label: string;
  target: string;
  status: LaunchItemStatus;
  value: string;
  proof: string;
  acceptance: string;
};

export type FinalSubmitLock = {
  id: string;
  lockScore: number;
  readiness: FinalSubmitReadiness;
  deadline: string;
  readyCount: number;
  missingCount: number;
  invalidCount: number;
  operatorLine: string;
  checks: FinalSubmitCheck[];
  pasteOrder: string[];
};

export type SubmissionLaunchGate = {
  id: string;
  launchScore: number;
  readiness: LaunchReadiness;
  verdict: string;
  hardTruth: string;
  urlStatuses: LaunchUrlStatus[];
  protopediaCompliance: LaunchComplianceItem[];
  checklist: LaunchChecklistItem[];
  copyActions: LaunchCopyAction[];
  finalSubmitLock: FinalSubmitLock;
  submitPacket: {
    githubUrl: string;
    deployedUrl: string;
    protopediaUrl: string;
    videoUrl: string;
    protoPediaTag: "findy_hackathon";
    protoPediaStatus: "完成";
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

function statusScore(status: LaunchItemStatus) {
  if (status === "ready") return 100;
  if (status === "missing") return 58;
  return 20;
}

function finalSubmitReadiness(input: { invalidCount: number; missingCount: number }): FinalSubmitReadiness {
  if (input.invalidCount > 0) return "needs-form-fix";
  if (input.missingCount > 0) return "external-url-watch";
  return "findy-form-sealed";
}

function textReady(value: string | undefined) {
  return (value ?? "").trim().length > 0;
}

function statusFromReady(ready: boolean): LaunchItemStatus {
  return ready ? "ready" : "missing";
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

function buildFinalSubmitLock(input: {
  urlStatuses: LaunchUrlStatus[];
  proof: JudgeProof;
  submitPacket: SubmissionLaunchGate["submitPacket"];
  tags: string;
}): FinalSubmitLock {
  const urlStatus = (id: "protopedia-url" | "video-url") => input.urlStatuses.find((status) => status.id === id);
  const protopedia = urlStatus("protopedia-url");
  const video = urlStatus("video-url");
  const githubReady = SUBMISSION_PROOF.publicGitHubUrl.startsWith("https://github.com/");
  const deployedReady = SUBMISSION_PROOF.deployedUrl.startsWith("https://");
  const tagReady = input.tags.includes("findy_hackathon");
  const receiptReady = Boolean(input.proof.receipt.digest);
  const checks: FinalSubmitCheck[] = [
    {
      id: "github-url",
      label: "Public GitHub repository URL",
      target: "Findy final submission form",
      status: githubReady ? "ready" : "missing",
      value: SUBMISSION_PROOF.publicGitHubUrl,
      proof: githubReady ? "Public GitHub URL is present." : "Public GitHub URL is missing.",
      acceptance: "公開GitHubリポジトリURLを提出フォームへ貼れる。"
    },
    {
      id: "deployed-url",
      label: "Deployed Cloud Run URL",
      target: "Findy final submission form",
      status: deployedReady ? "ready" : "missing",
      value: SUBMISSION_PROOF.deployedUrl,
      proof: deployedReady ? "Cloud Run https URL is present." : "Cloud Run URL is missing.",
      acceptance: "デプロイ済みURLを提出フォームへ貼れる。"
    },
    {
      id: "protopedia-url",
      label: "ProtoPedia work URL",
      target: "Findy final submission form",
      status: protopedia?.status ?? "missing",
      value: input.submitPacket.protopediaUrl,
      proof: protopedia?.proof ?? "ProtoPedia work URL is missing.",
      acceptance: "ProtoPedia作品URLを提出フォームへ貼れる。"
    },
    {
      id: "video-url",
      label: "Video URL",
      target: "ProtoPedia media field",
      status: video?.status ?? "missing",
      value: input.submitPacket.videoUrl,
      proof: video?.proof ?? "Video URL is missing.",
      acceptance: "動画URLをProtoPedia作品ページへ貼り、審査員が再生できる。"
    },
    {
      id: "findy-tag",
      label: "Required tag",
      target: "ProtoPedia tags",
      status: tagReady ? "ready" : "missing",
      value: "findy_hackathon",
      proof: input.tags || "findy_hackathon tag is missing.",
      acceptance: "ProtoPediaタグに findy_hackathon が含まれる。"
    },
    {
      id: "work-status",
      label: "ProtoPedia work status",
      target: "ProtoPedia work status",
      status: input.submitPacket.protoPediaStatus === "完成" ? "ready" : "missing",
      value: input.submitPacket.protoPediaStatus,
      proof: `Work status: ${input.submitPacket.protoPediaStatus}`,
      acceptance: "ProtoPedia作品ステータスを完成にして公開する。"
    },
    {
      id: "proof-receipt",
      label: "Judge Proof receipt",
      target: "Submission memo / video description",
      status: receiptReady ? "ready" : "missing",
      value: input.proof.receipt.digest,
      proof: receiptReady ? input.proof.receipt.digest : "Judge Proof receipt digest is missing.",
      acceptance: "質疑で再確認できるsha256 receiptを控える。"
    },
    {
      id: "deadline",
      label: "Submission deadline",
      target: "Operator checklist",
      status: "ready",
      value: HACKATHON_SUBMISSION_DEADLINE,
      proof: "Final submit must happen before 2026-07-10 23:59 JST.",
      acceptance: "締切をJSTの絶対時刻で確認し、相対日付の取り違えを避ける。"
    }
  ];
  const readyCount = checks.filter((check) => check.status === "ready").length;
  const missingCount = checks.filter((check) => check.status === "missing").length;
  const invalidCount = checks.filter((check) => check.status === "invalid").length;
  const lockScore = Math.round(clamp(average(checks.map((check) => statusScore(check.status)))));
  const readiness = finalSubmitReadiness({ invalidCount, missingCount });

  return {
    id: `final-submit-lock-${lockScore}-${readiness}`,
    lockScore,
    readiness,
    deadline: HACKATHON_SUBMISSION_DEADLINE,
    readyCount,
    missingCount,
    invalidCount,
    operatorLine:
      readiness === "findy-form-sealed"
        ? "Findy form URLs, ProtoPedia media, tag, status, receipt, and deadline are sealed for final submission."
        : readiness === "external-url-watch"
          ? "Findy form is internally ready; publish and paste the missing external ProtoPedia/video URLs before final submit."
          : "Final submit is blocked by malformed or missing required evidence; fix the URL fields before claiming submit-ready.",
    checks,
    pasteOrder: [
      "Paste public GitHub repository URL into the Findy form.",
      "Paste deployed Cloud Run URL into the Findy form.",
      "Paste ProtoPedia work URL into the Findy form.",
      "Paste video URL into ProtoPedia media.",
      "Confirm findy_hackathon tag and work status 完成.",
      "Keep the Judge Proof receipt digest in the submission memo or video description.",
      "Submit before 2026-07-10 23:59 JST."
    ]
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
  const protopediaUrl = normalizeSubmissionUrl(input.protopediaUrl);
  const videoUrl = normalizeSubmissionUrl(input.videoUrl);
  const copyBlock = (id: string) => input.dossier.copyBlocks.find((block) => block.id === id);
  const pasteField = (id: string) => input.publisher.pasteFields.find((field) => field.id === id);
  const tags = pasteField("tags")?.value ?? "";
  const videoStatus = externalStatus({
    id: "video-url",
    label: "動画URL",
    url: videoUrl,
    valid: validVideoUrl(videoUrl),
    validProof: "YouTube / Vimeo のhttps URLとして形式確認済み。",
    missingAction: "Demo RunwayまたはSubmission Dossierの録画順で30秒動画を公開する",
    invalidAction: "YouTubeまたはVimeoのhttps動画URLを入力する"
  });
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
    videoStatus
  ];
  const protopediaCompliance: LaunchComplianceItem[] = [
    {
      id: "work-status",
      label: "作品ステータス",
      status: "ready",
      proof: "ProtoPedia作品ステータスは「完成」を選択する。",
      source: "protopedia",
      action: "作品登録フォームで完成を選ぶ"
    },
    {
      id: "title",
      label: "作品タイトル",
      status: statusFromReady(textReady(input.dossier.title)),
      proof: input.dossier.title || "作品タイトルが空です。",
      source: "protopedia",
      action: "Submission Dossierの作品タイトルを貼る"
    },
    {
      id: "summary",
      label: "概要",
      status: statusFromReady(textReady(copyBlock("one-liner")?.value)),
      proof: copyBlock("one-liner")?.value || "概要が空です。",
      source: "hackathon",
      action: "一言説明をProtoPedia概要欄へ貼る"
    },
    {
      id: "story-problem",
      label: "ストーリー: 課題と背景",
      status: statusFromReady(textReady(copyBlock("problem")?.value)),
      proof: copyBlock("problem")?.value || "課題/背景が空です。",
      source: "hackathon",
      action: "課題と背景をストーリー欄へ貼る"
    },
    {
      id: "story-users",
      label: "ストーリー: 想定ユーザー",
      status: statusFromReady(textReady(copyBlock("users")?.value)),
      proof: copyBlock("users")?.value || "想定ユーザーが空です。",
      source: "hackathon",
      action: "対象ユーザーをストーリー欄へ貼る"
    },
    {
      id: "story-features",
      label: "ストーリー: 特徴",
      status: statusFromReady(textReady(copyBlock("features")?.value)),
      proof: copyBlock("features")?.value || "特徴が空です。",
      source: "hackathon",
      action: "特徴をストーリー欄へ貼る"
    },
    {
      id: "architecture-diagram",
      label: "システム構成図",
      status: statusFromReady(textReady(input.dossier.handoffPacket.architecturePack.diagramUrl)),
      proof: input.dossier.handoffPacket.architecturePack.diagramUrl || "構成図URLが空です。",
      source: "hackathon",
      action: "Architecture PackのSVGをProtoPediaのシステム構成へ添付する"
    },
    {
      id: "video-embed",
      label: "動画",
      status: videoStatus.status,
      proof: videoStatus.status === "ready" ? "YouTube / Vimeo URL ready." : videoStatus.proof,
      source: "hackathon",
      action: "YouTubeまたはVimeoの動画URLをProtoPedia動画欄へ貼る"
    },
    {
      id: "findy-tag",
      label: "必須タグ",
      status: statusFromReady(tags.includes("findy_hackathon")),
      proof: tags || "findy_hackathonタグが見つかりません。",
      source: "hackathon",
      action: "ProtoPediaタグにfindy_hackathonを追加する"
    }
  ];
  const complianceReadyCount = protopediaCompliance.filter((item) => item.status === "ready").length;
  const hasInvalid = [...urlStatuses, ...protopediaCompliance].some((item) => item.status === "invalid");
  const hasMissing = [...urlStatuses, ...protopediaCompliance].some((item) => item.status === "missing");
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
      status: protopediaCompliance.find((item) => item.id === "findy-tag")?.status ?? "missing",
      proof: tags || "findy_hackathon"
    },
    {
      id: "protopedia-compliance",
      label: "ProtoPedia必須項目",
      status:
        protopediaCompliance.some((item) => item.status === "invalid")
          ? "invalid"
          : protopediaCompliance.every((item) => item.status === "ready")
            ? "ready"
            : "missing",
      proof: `${complianceReadyCount}/${protopediaCompliance.length} items ready`
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
        average(protopediaCompliance.map((item) => statusScore(item.status))),
        average(checklist.map((item) => statusScore(item.status)))
      ])
    )
  );
  const title = input.dossier.title;
  const copyActions: LaunchCopyAction[] = [
    { id: "work-status", label: "Work status", target: "ProtoPedia work status", value: "完成", status: "ready" },
    { id: "github", label: "GitHub URL", target: "Findy submission form", value: SUBMISSION_PROOF.publicGitHubUrl, status: "ready" },
    { id: "deployed", label: "Deployed URL", target: "Findy submission form", value: SUBMISSION_PROOF.deployedUrl, status: "ready" },
    { id: "protopedia", label: "ProtoPedia work URL", target: "Findy submission form", value: protopediaUrl, status: urlStatuses[0].status },
    { id: "video", label: "Video URL", target: "ProtoPedia media / work page", value: videoUrl, status: urlStatuses[1].status },
    { id: "tag", label: "Required tag", target: "ProtoPedia tags", value: "findy_hackathon", status: "ready" }
  ];
  const submitPacket = {
    githubUrl: SUBMISSION_PROOF.publicGitHubUrl,
    deployedUrl: SUBMISSION_PROOF.deployedUrl,
    protopediaUrl,
    videoUrl,
    protoPediaTag: "findy_hackathon" as const,
    protoPediaStatus: "完成" as const,
    title,
    submitterMemo: `${title}: GitHub、Cloud Run、ProtoPedia作品URL、動画URL、findy_hackathonタグを最終提出に貼る。`
  };
  const finalSubmitLock = buildFinalSubmitLock({
    urlStatuses,
    proof: input.proof,
    submitPacket,
    tags
  });
  const verdict =
    readiness === "submit-ready"
      ? "Submit now"
      : readiness === "needs-external-urls"
        ? "External URLs still required"
        : "Fix invalid external URL evidence";
  const hardTruth =
    readiness === "submit-ready"
      ? "提出3点のURL形式、ProtoPedia必須項目、CI、Judge Proof receiptが揃っています。"
      : readiness === "needs-external-urls"
        ? "コードと提出本文は揃っていますが、ProtoPedia作品URL、YouTube/Vimeo動画URL、必須項目が揃うまで提出完了ではありません。"
        : "外部URL形式、YouTube/Vimeo動画URL、ProtoPedia必須項目、またはMVP hard gateに問題があります。形式を直すまで提出完了扱いにしません。";

  return {
    id: `submission-launch-${launchScore}-${readiness}`,
    launchScore,
    readiness,
    verdict,
    hardTruth,
    urlStatuses,
    protopediaCompliance,
    checklist,
    copyActions,
    finalSubmitLock,
    submitPacket,
    a2aPayload: {
      method: "message/send",
      skill: "submission.launch",
      launchScore,
      readiness,
      verdict,
      urls: urlStatuses.map((item) => ({ id: item.id, status: item.status, url: item.url || null })),
      protopediaCompliance: protopediaCompliance.map((item) => ({
        id: item.id,
        status: item.status,
        source: item.source,
        action: item.action
      })),
      checklist: checklist.map((item) => ({ id: item.id, status: item.status })),
      submitPacket: {
        githubUrl: SUBMISSION_PROOF.publicGitHubUrl,
        deployedUrl: SUBMISSION_PROOF.deployedUrl,
        protopediaUrl: protopediaUrl || null,
        videoUrl: videoUrl || null,
        status: "完成",
        tag: "findy_hackathon"
      },
      finalSubmitLock: {
        lockScore: finalSubmitLock.lockScore,
        readiness: finalSubmitLock.readiness,
        deadline: finalSubmitLock.deadline,
        readyCount: finalSubmitLock.readyCount,
        missingCount: finalSubmitLock.missingCount,
        invalidCount: finalSubmitLock.invalidCount,
        checks: finalSubmitLock.checks.map((check) => ({ id: check.id, status: check.status, target: check.target }))
      }
    }
  };
}
