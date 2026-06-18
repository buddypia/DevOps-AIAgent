import type { SubmissionDossier } from "./dossier.js";
import type { MvpAuditReport } from "./mvpAudit.js";
import type { JudgeProof } from "./proof.js";
import type { ProtoPediaPublisher } from "./publisher.js";
import { normalizeSubmissionUrl, SUBMISSION_PROOF, validProtoPediaUrl, validVideoUrl } from "./submission.js";

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
    submitPacket: {
      githubUrl: SUBMISSION_PROOF.publicGitHubUrl,
      deployedUrl: SUBMISSION_PROOF.deployedUrl,
      protopediaUrl,
      videoUrl,
      protoPediaTag: "findy_hackathon",
      protoPediaStatus: "完成",
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
      }
    }
  };
}
