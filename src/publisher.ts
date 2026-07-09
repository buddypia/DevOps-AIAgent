import type { FinalistSimulation } from "./finalist.js";
import type { MissionRun } from "./mission.js";
import type { OpsDrill } from "./ops.js";
import type { PitchRun } from "./pitch.js";
import { SUBMISSION_PROOF, hasSubmissionUrl } from "./submission.js";
import type { WinningStrategy } from "./strategy.js";
import type { Recommendation } from "./types.js";
import type { BuyerShareGateProofVerificationSummary } from "./buyerShareGate.js";
import { PUBLIC_PROOF_INPUT_PLACEHOLDERS } from "./publicProofUrl.js";
import {
  buildWorkflowLiveProofAudit,
  type WorkflowLiveProofAudit
} from "./workflowLiveProofAudit.js";
import type { WorkflowIntakeProofSlot } from "./workflowIntakeShareGate.js";

export type PublisherStatus = "ready" | "watch";
export type PublisherReadiness = "ready-to-register" | "needs-external-urls";

export type PublisherField = {
  id: string;
  label: string;
  value: string;
  status: PublisherStatus;
  copyHint: string;
};

export type PublisherAsset = {
  id: string;
  label: string;
  status: PublisherStatus;
  url?: string;
  proof: string;
};

export type PublisherStep = {
  id: string;
  label: string;
  status: PublisherStatus;
  action: string;
  proof: string;
};

export type ProtoPediaSubmissionCopyTrayReadiness = "ready-to-submit" | "copy-ready-needs-external-urls" | "needs-copy-repair";

export type ProtoPediaSubmissionCopyItem = {
  id: string;
  label: string;
  value: string;
  status: PublisherStatus;
  copyHint: string;
  required: boolean;
  order: number;
};

export type ProtoPediaSubmissionCopyTray = {
  id: string;
  readiness: ProtoPediaSubmissionCopyTrayReadiness;
  readyCount: number;
  totalCount: number;
  requiredReadyCount: number;
  requiredTotalCount: number;
  requiredGaps: string[];
  pasteOrder: string[];
  items: ProtoPediaSubmissionCopyItem[];
  exportMarkdown: string;
};

type SubmissionProofSnapshot = {
  publicGitHubUrl: string;
  ciWorkflowUrl: string;
  deployedUrl: string;
  protopediaUrl: string;
  videoUrl: string;
};

export type ProtoPediaQualityLockReadiness = "submit-page-ready" | "copy-locked" | "needs-copy-repair";
export type ProtoPediaPolicyLockReadiness = "publication-ready" | "prototype-copy-locked" | "needs-prototype-repair";

export type ProtoPediaQualityLockCheck = {
  id: string;
  label: string;
  status: PublisherStatus;
  proof: string;
  acceptance: string;
  sourceFieldIds: string[];
};

export type ProtoPediaQualityLock = {
  id: string;
  qualityScore: number;
  readiness: ProtoPediaQualityLockReadiness;
  headline: string;
  checks: ProtoPediaQualityLockCheck[];
  pasteOrder: string[];
  requiredTag: string;
  externalUrlState: PublisherStatus;
};

export type ProtoPediaPolicyLockCheck = {
  id:
    | "original-prototype"
    | "built-by-team"
    | "not-info-only"
    | "not-promo-only"
    | "markdown-safe"
    | "embeddable-media";
  label: string;
  status: PublisherStatus;
  proof: string;
  acceptance: string;
  sourceUrl: string;
};

export type ProtoPediaPolicyLock = {
  id: string;
  policyScore: number;
  readiness: ProtoPediaPolicyLockReadiness;
  headline: string;
  operatorLine: string;
  sourceUrls: string[];
  checks: ProtoPediaPolicyLockCheck[];
  pasteOrder: string[];
};

export type ProtoPediaPublisher = {
  id: string;
  publishScore: number;
  readiness: PublisherReadiness;
  summary: string;
  pasteFields: PublisherField[];
  copyTray: ProtoPediaSubmissionCopyTray;
  qualityLock: ProtoPediaQualityLock;
  policyLock: ProtoPediaPolicyLock;
  assets: PublisherAsset[];
  finalChecklist: PublisherStep[];
  missingExternal: PublisherStep[];
  recordingScript: string;
  a2aPayload: Record<string, unknown>;
};

export type ProtoPediaPublisherLiveReadiness = "live-ready" | "needs-live-repair" | "not-run";

export type ProtoPediaPublisherLiveAudit = WorkflowLiveProofAudit & {
  source: "submission-publisher";
  publisherId: string;
  liveReadiness: ProtoPediaPublisherLiveReadiness;
  assetReadyCount: number;
  assetTotalCount: number;
  requiredCopyReadyCount: number;
  requiredCopyTotalCount: number;
  verificationDeskHref: string;
};

export type ProtoPediaPublisherHtmlOptions = {
  projectBrief?: string;
  selectedAgentIds?: string[];
  publisherApiPath?: string;
  liveAuditApiPath?: string;
};

const PROTOPEDIA_POLICY_SOURCE_URLS = [
  "https://protopedia.gitbook.io/helpcenter/info/2025.09.05",
  "https://protopedia.gitbook.io/helpcenter/markdown",
  "https://protopedia.gitbook.io/helpcenter/faq"
] as const;

export const SUBMISSION_PUBLISH_SKILL_ID = "submission.publish";
export const SUBMISSION_PUBLISH_LOCK_TAG = "submission-publish-lock";
export const SUBMISSION_PUBLISH_REQUIRED_SIGNAL = `${SUBMISSION_PUBLISH_SKILL_ID}:tag:${SUBMISSION_PUBLISH_LOCK_TAG}`;

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function readyPoints(status: PublisherStatus) {
  return status === "ready" ? 100 : 58;
}

function lockPoints(status: PublisherStatus) {
  return status === "ready" ? 100 : 72;
}

function statusFromUrl(value: string): PublisherStatus {
  return value.startsWith("http://") || hasSubmissionUrl(value) ? "ready" : "watch";
}

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeScriptJson(value: string) {
  return value
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function tone(status: string) {
  if (["ready", "ready-to-register", "submit-page-ready", "publication-ready"].includes(status)) return "good";
  if (["needs-copy-repair", "needs-prototype-repair"].includes(status)) return "bad";
  return "watch";
}

function field(id: string, label: string, value: string, copyHint: string): PublisherField {
  return {
    id,
    label,
    value,
    status: value.trim().length > 0 ? "ready" : "watch",
    copyHint
  };
}

function asset(id: string, label: string, url: string, proof: string): PublisherAsset {
  const status = statusFromUrl(url);
  return {
    id,
    label,
    status,
    url: status === "ready" ? url : undefined,
    proof
  };
}

export function publisherProofLinks(publisher: ProtoPediaPublisher): WorkflowIntakeProofSlot[] {
  return publisher.assets.map((assetItem) => ({
    id: assetItem.id,
    label: assetItem.label,
    value: assetItem.url ?? "",
    href: assetItem.url ?? "#"
  }));
}

function publisherLiveReadinessFor(publisher: ProtoPediaPublisher, audit: WorkflowLiveProofAudit): ProtoPediaPublisherLiveReadiness {
  if (audit.status === "verified" && publisher.readiness === "ready-to-register") return "live-ready";
  if (audit.status === "not-run") return "not-run";
  return "needs-live-repair";
}

export function publisherLiveAuditVerificationDeskHref(verificationRequestJson: string) {
  const params = new URLSearchParams({
    request: verificationRequestJson,
    verify: "1"
  });
  return `/receipt-verifier?${params.toString()}`;
}

export function buildProtoPediaPublisherLiveAudit(input: {
  publisher: ProtoPediaPublisher;
  proofVerification?: BuyerShareGateProofVerificationSummary | null;
  proofVerifyError?: string;
}): ProtoPediaPublisherLiveAudit {
  const audit = buildWorkflowLiveProofAudit({
    proofLinks: publisherProofLinks(input.publisher),
    proofVerification: input.proofVerification,
    proofVerifyError: input.proofVerifyError
  });

  return {
    ...audit,
    source: "submission-publisher",
    publisherId: input.publisher.id,
    liveReadiness: publisherLiveReadinessFor(input.publisher, audit),
    assetReadyCount: input.publisher.assets.filter((assetItem) => assetItem.status === "ready").length,
    assetTotalCount: input.publisher.assets.length,
    requiredCopyReadyCount: input.publisher.copyTray.requiredReadyCount,
    requiredCopyTotalCount: input.publisher.copyTray.requiredTotalCount,
    verificationDeskHref: publisherLiveAuditVerificationDeskHref(audit.verificationRequestJson)
  };
}

function copyItem(input: Omit<ProtoPediaSubmissionCopyItem, "status"> & { status?: PublisherStatus }): ProtoPediaSubmissionCopyItem {
  return {
    ...input,
    status: input.status ?? (input.value.trim().length > 0 ? "ready" : "watch")
  };
}

function buildCopyTrayMarkdown(tray: Omit<ProtoPediaSubmissionCopyTray, "exportMarkdown">) {
  return [
    "# ProtoPedia submission copy tray",
    "",
    `Readiness: ${tray.readiness}`,
    `Ready: ${tray.readyCount}/${tray.totalCount}`,
    `Required ready: ${tray.requiredReadyCount}/${tray.requiredTotalCount}`,
    `Required gaps: ${tray.requiredGaps.join(", ") || "none"}`,
    "",
    "## Paste order",
    ...tray.items
      .slice()
      .sort((left, right) => left.order - right.order)
      .map((item) => [`### ${item.order}. ${item.label}`, `Status: ${item.status}`, `Hint: ${item.copyHint}`, "", item.value || "(pending)", ""].join("\n"))
  ].join("\n");
}

function buildSubmissionCopyTray(input: {
  pasteFields: PublisherField[];
  assets: PublisherAsset[];
  appUrl: string;
  submissionProof: SubmissionProofSnapshot;
}): ProtoPediaSubmissionCopyTray {
  const fieldById = new Map(input.pasteFields.map((fieldItem) => [fieldItem.id, fieldItem]));
  const assetById = new Map(input.assets.map((assetItem) => [assetItem.id, assetItem]));
  const architectureUrl = assetById.get("architecture")?.url ?? "";
  const storyUrl = assetById.get("story")?.url ?? "";
  const items: ProtoPediaSubmissionCopyItem[] = [
    copyItem({ id: "title", label: "作品タイトル", value: fieldById.get("title")?.value ?? "", copyHint: "ProtoPedia title field", required: true, order: 1 }),
    copyItem({ id: "one-liner", label: "一言説明", value: fieldById.get("one-liner")?.value ?? "", copyHint: "ProtoPedia summary field", required: true, order: 2 }),
    copyItem({ id: "problem", label: "課題", value: fieldById.get("problem")?.value ?? "", copyHint: "Problem/story field", required: true, order: 3 }),
    copyItem({ id: "users", label: "対象ユーザー", value: fieldById.get("users")?.value ?? "", copyHint: "Target users field", required: true, order: 4 }),
    copyItem({ id: "features", label: "特徴", value: fieldById.get("features")?.value ?? "", copyHint: "Feature bullets", required: true, order: 5 }),
    copyItem({ id: "technology", label: "技術構成", value: fieldById.get("technology")?.value ?? "", copyHint: "Technology stack field", required: true, order: 6 }),
    copyItem({ id: "demo-flow", label: "デモの見どころ", value: fieldById.get("demo-flow")?.value ?? "", copyHint: "Video description field", required: true, order: 7 }),
    copyItem({ id: "judge-proof", label: "審査向け証拠", value: fieldById.get("judge-proof")?.value ?? "", copyHint: "Appeal / judging proof field", required: true, order: 8 }),
    copyItem({ id: "tags", label: "タグ", value: fieldById.get("tags")?.value ?? "", copyHint: "Include findy_hackathon", required: true, order: 9 }),
    copyItem({ id: "github-url", label: "公開GitHub URL", value: input.submissionProof.publicGitHubUrl, copyHint: "Final submission form", required: true, order: 10 }),
    copyItem({ id: "deployed-url", label: "デプロイ済みURL", value: input.submissionProof.deployedUrl || input.appUrl, copyHint: "Final submission form", required: true, order: 11 }),
    copyItem({ id: "architecture-url", label: "構成図URL", value: architectureUrl, copyHint: "ProtoPedia architecture attachment", required: true, order: 12 }),
    copyItem({ id: "story-url", label: "提出ストーリーURL", value: storyUrl, copyHint: "Long-form story backup", required: true, order: 13 }),
    copyItem({ id: "video-url", label: "動画URL", value: input.submissionProof.videoUrl, copyHint: "ProtoPedia media field", required: true, order: 14 }),
    copyItem({ id: "protopedia-url", label: "ProtoPedia作品URL", value: input.submissionProof.protopediaUrl, copyHint: "Final submission form after publishing", required: true, order: 15 })
  ];
  const readyCount = items.filter((item) => item.status === "ready").length;
  const requiredItems = items.filter((item) => item.required);
  const requiredReadyCount = requiredItems.filter((item) => item.status === "ready").length;
  const requiredGaps = requiredItems.filter((item) => item.status !== "ready").map((item) => item.label);
  const externalOnlyGaps = requiredGaps.every((gap) => gap === "動画URL" || gap === "ProtoPedia作品URL");
  const partial: Omit<ProtoPediaSubmissionCopyTray, "exportMarkdown"> = {
    id: `protopedia-copy-tray-${requiredReadyCount}-${requiredItems.length}`,
    readiness:
      requiredReadyCount === requiredItems.length
        ? "ready-to-submit"
        : externalOnlyGaps
          ? "copy-ready-needs-external-urls"
          : "needs-copy-repair",
    readyCount,
    totalCount: items.length,
    requiredReadyCount,
    requiredTotalCount: requiredItems.length,
    requiredGaps,
    pasteOrder: items
      .slice()
      .sort((left, right) => left.order - right.order)
      .map((item) => item.id),
    items
  };

  return {
    ...partial,
    exportMarkdown: buildCopyTrayMarkdown(partial)
  };
}

function includesAll(value: string, terms: string[]) {
  return terms.every((term) => value.toLowerCase().includes(term.toLowerCase()));
}

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.toLowerCase().includes(term.toLowerCase()));
}

function bulletCount(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-")).length;
}

function buildQualityLock(input: {
  pasteFields: PublisherField[];
  assets: PublisherAsset[];
  finalChecklist: PublisherStep[];
  strategy: WinningStrategy;
  pitch: PitchRun;
  finalist: FinalistSimulation;
  topCompetitor: string;
}): ProtoPediaQualityLock {
  const { pasteFields, assets, finalChecklist, strategy, pitch, finalist, topCompetitor } = input;
  const fieldValue = (id: string) => pasteFields.find((field) => field.id === id)?.value ?? "";
  const publicAssetReady = ["github", "cloud-run", "ci", "architecture", "story"].every(
    (id) => assets.find((asset) => asset.id === id)?.status === "ready"
  );
  const externalUrlState: PublisherStatus = finalChecklist.every((item) => item.status === "ready") ? "ready" : "watch";
  const swotReady = Object.values(strategy.swot).every((items) => items.length > 0);
  const checks: ProtoPediaQualityLockCheck[] = [
    {
      id: "story-triad",
      label: "Problem, users, features are paste-ready",
      status:
        fieldValue("problem").length >= 80 &&
        fieldValue("users").length >= 24 &&
        bulletCount(fieldValue("features")) >= 4
          ? "ready"
          : "watch",
      proof: `${fieldValue("problem").length} problem chars / ${bulletCount(fieldValue("features"))} feature bullets`,
      acceptance: "課題、対象ユーザー、特徴が別欄に貼れる粒度で揃っている。",
      sourceFieldIds: ["problem", "users", "features"]
    },
    {
      id: "required-tech",
      label: "Required Cloud Run and Google AI story",
      status: includesAll(fieldValue("technology"), ["Cloud Run", "Gemini", "A2A", "GitHub Actions"]) ? "ready" : "watch",
      proof: "Cloud Run / Gemini / A2A / GitHub Actions in technology field",
      acceptance: "必須技術とDevOps証跡が技術構成欄で読める。",
      sourceFieldIds: ["technology"]
    },
    {
      id: "judge-criteria",
      label: "Five judging criteria are answered",
      status: strategy.judgeCriteria.length >= 5 && finalist.finalistScore >= 75 && fieldValue("judge-proof").length >= 120 ? "ready" : "watch",
      proof: `${strategy.judgeCriteria.length} criteria / finalist ${finalist.finalistScore}`,
      acceptance: "AI中心性、課題アプローチ、ユーザビリティ、実用性、実装力の説明が審査向け証拠に接続している。",
      sourceFieldIds: ["judge-proof"]
    },
    {
      id: "competitive-swot",
      label: "Competitive and SWOT proof is explicit",
      status: fieldValue("problem").includes(topCompetitor) && strategy.competitors.length >= 3 && swotReady ? "ready" : "watch",
      proof: `${strategy.competitors.length} competitors / SWOT ${swotReady ? "ready" : "missing"}`,
      acceptance: "既存ツールとの差分とSWOTが本文から読み取れる。",
      sourceFieldIds: ["problem", "judge-proof"]
    },
    {
      id: "demo-route",
      label: "30-second demo route is attached",
      status: pitch.totalSeconds === 30 && bulletCount(fieldValue("demo-flow")) >= 5 ? "ready" : "watch",
      proof: `${pitch.totalSeconds}s / ${bulletCount(fieldValue("demo-flow"))} demo bullets`,
      acceptance: "動画欄または説明欄に30秒の画面順と話す内容を貼れる。",
      sourceFieldIds: ["demo-flow"]
    },
    {
      id: "public-assets",
      label: "Public proof assets are ready",
      status: publicAssetReady && fieldValue("tags").includes("findy_hackathon") ? "ready" : "watch",
      proof: `${assets.filter((assetItem) => assetItem.status === "ready").length}/${assets.length} assets / tag ${fieldValue("tags")}`,
      acceptance: "GitHub、Cloud Run、CI、構成図、提出ストーリー、必須タグを確認できる。",
      sourceFieldIds: ["tags"]
    },
    {
      id: "external-url-closure",
      label: "External URL closure remains visible",
      status: externalUrlState,
      proof:
        externalUrlState === "ready"
          ? "ProtoPedia and video URLs are ready."
          : finalChecklist
              .filter((item) => item.status !== "ready")
              .map((item) => item.label)
              .join(" / "),
      acceptance: "ProtoPedia作品URLと動画URLは未発行ならwatchとして残し、提出完了扱いにしない。",
      sourceFieldIds: []
    }
  ];
  const nonExternalReady = checks.filter((check) => check.id !== "external-url-closure").every((check) => check.status === "ready");
  const readiness: ProtoPediaQualityLockReadiness =
    nonExternalReady && externalUrlState === "ready" ? "submit-page-ready" : nonExternalReady ? "copy-locked" : "needs-copy-repair";
  const checkAverage = average(checks.map((check) => lockPoints(check.status)));
  const qualityScore = Math.round(
    clamp(
      average([
        checkAverage,
        checkAverage,
        checkAverage,
        pitch.readinessScore,
        strategy.judgeScore,
        strategy.moatScore
      ])
    )
  );

  return {
    id: `protopedia-quality-lock-${qualityScore}-${readiness}`,
    qualityScore,
    readiness,
    headline:
      readiness === "submit-page-ready"
        ? "ProtoPedia本文、証拠、外部URLまで提出ページとしてロック済みです。"
        : readiness === "copy-locked"
          ? "ProtoPedia本文は審査観点までロック済みです。残りは外部URLの貼付です。"
          : "ProtoPedia本文の審査観点に不足があります。貼付前にcopy fieldsを補強します。",
    checks,
    pasteOrder: ["title", "one-liner", "problem", "users", "features", "technology", "demo-flow", "judge-proof", "tags"],
    requiredTag: "findy_hackathon",
    externalUrlState
  };
}

function buildPolicyLock(input: {
  pasteFields: PublisherField[];
  assets: PublisherAsset[];
  finalChecklist: PublisherStep[];
}): ProtoPediaPolicyLock {
  const { pasteFields, assets, finalChecklist } = input;
  const fieldValue = (id: string) => pasteFields.find((field) => field.id === id)?.value ?? "";
  const assetStatus = (id: string) => assets.find((assetItem) => assetItem.id === id)?.status ?? "watch";
  const checklistStatus = (id: string) => finalChecklist.find((item) => item.id === id)?.status ?? "watch";
  const combinedCopy = pasteFields.map((fieldItem) => fieldItem.value).join("\n");
  const forbiddenHtml = ["<script", "javascript:", "<iframe"].some((term) => combinedCopy.toLowerCase().includes(term));
  const promoSignals = ["広告掲載", "有償広告", "営業目的", "販売促進だけ", "事例紹介のみ"];
  const prototypeSignal =
    includesAll(combinedCopy, ["Cloud Run", "Gemini", "A2A"]) &&
    includesAny(`${fieldValue("one-liner")}\n${fieldValue("features")}`, ["ワークベンチ", "AI能力", "プロトタイプ"]);
  const checks: ProtoPediaPolicyLockCheck[] = [
    {
      id: "original-prototype",
      label: "Original prototype is the center",
      status: prototypeSignal ? "ready" : "watch",
      proof: prototypeSignal ? "Copy names the built A2A/Cloud Run/Gemini workbench." : "Prototype-centered wording is weak.",
      acceptance: "ProtoPedia本文の主語が、作ったプロトタイプ/創作物そのものになっている。",
      sourceUrl: PROTOPEDIA_POLICY_SOURCE_URLS[0]
    },
    {
      id: "built-by-team",
      label: "Built evidence is public",
      status: assetStatus("github") === "ready" && assetStatus("cloud-run") === "ready" && assetStatus("architecture") === "ready" ? "ready" : "watch",
      proof: `${assetStatus("github")} GitHub / ${assetStatus("cloud-run")} Cloud Run / ${assetStatus("architecture")} architecture`,
      acceptance: "自分たちが作った実装、公開デモ、構成図を作品ページから確認できる。",
      sourceUrl: PROTOPEDIA_POLICY_SOURCE_URLS[2]
    },
    {
      id: "not-info-only",
      label: "Not only a technical explanation",
      status: bulletCount(fieldValue("features")) >= 4 && bulletCount(fieldValue("demo-flow")) >= 5 && fieldValue("problem").length >= 80 ? "ready" : "watch",
      proof: `${bulletCount(fieldValue("features"))} feature bullets / ${bulletCount(fieldValue("demo-flow"))} demo bullets / ${fieldValue("problem").length} problem chars`,
      acceptance: "技術解説だけでなく、課題、対象ユーザー、触れる機能、デモ順が読める。",
      sourceUrl: PROTOPEDIA_POLICY_SOURCE_URLS[0]
    },
    {
      id: "not-promo-only",
      label: "Not a sales or promotion post",
      status: includesAny(combinedCopy, promoSignals) ? "watch" : "ready",
      proof: includesAny(combinedCopy, promoSignals) ? "Promotion-like wording found." : "No sales/ad-only policy signals found in generated copy.",
      acceptance: "成果アピールや広告ではなく、作品の目的、構成、操作体験を中心に記述する。",
      sourceUrl: PROTOPEDIA_POLICY_SOURCE_URLS[0]
    },
    {
      id: "markdown-safe",
      label: "Markdown and embed safe",
      status: forbiddenHtml ? "watch" : "ready",
      proof: forbiddenHtml ? "Generated copy contains risky script/embed HTML." : "Generated copy avoids script/iframe/javascript markup.",
      acceptance: "Markdownに貼っても危険なスクリプトや表示崩れを持ち込まない。",
      sourceUrl: PROTOPEDIA_POLICY_SOURCE_URLS[1]
    },
    {
      id: "embeddable-media",
      label: "Video media slot is ready",
      status: checklistStatus("record-video"),
      proof:
        checklistStatus("record-video") === "ready"
          ? "Published video URL is ready for the ProtoPedia media field."
          : "Record and publish the YouTube/Vimeo demo URL before final publication.",
      acceptance: "作品ページでプロトタイプの動きが伝わる動画または埋め込み可能なメディアを添える。",
      sourceUrl: PROTOPEDIA_POLICY_SOURCE_URLS[1]
    }
  ];
  const nonMediaReady = checks.filter((check) => check.id !== "embeddable-media").every((check) => check.status === "ready");
  const readiness: ProtoPediaPolicyLockReadiness =
    checks.every((check) => check.status === "ready") ? "publication-ready" : nonMediaReady ? "prototype-copy-locked" : "needs-prototype-repair";
  const policyScore = Math.round(clamp(average(checks.map((check) => lockPoints(check.status)))));

  return {
    id: `protopedia-policy-lock-${policyScore}-${readiness}`,
    policyScore,
    readiness,
    headline:
      readiness === "publication-ready"
        ? "ProtoPediaの作品性、本文、安全なMarkdown、動画メディアまで公開方針に沿っています。"
        : readiness === "prototype-copy-locked"
          ? "作品性と本文はProtoPedia方針に沿っています。残りは動画URLの公開だけです。"
          : "ProtoPedia本文が作品ページではなく説明・宣伝に見えるリスクがあります。貼付前に直します。",
    operatorLine:
      readiness === "needs-prototype-repair"
        ? "Rewrite the copy so the built prototype, user story, and working demo lead the page."
        : "Keep the prototype first, then use proof links as supporting evidence.",
    sourceUrls: [...PROTOPEDIA_POLICY_SOURCE_URLS],
    checks,
    pasteOrder: ["title", "one-liner", "problem", "features", "technology", "demo-flow", "judge-proof", "video-url"]
  };
}

export function buildProtoPediaPublisher(input: {
  baseUrl: string;
  recommendation: Recommendation;
  strategy: WinningStrategy;
  mission: MissionRun;
  opsDrill: OpsDrill;
  pitch: PitchRun;
  finalist: FinalistSimulation;
  submissionUrls?: Partial<Pick<SubmissionProofSnapshot, "deployedUrl" | "protopediaUrl" | "videoUrl">>;
}): ProtoPediaPublisher {
  const { baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist } = input;
  const selectedAgents = recommendation.selected.map((agent) => agent.name).join(" / ") || "A2A Market Broker";
  const submissionProof: SubmissionProofSnapshot = {
    ...SUBMISSION_PROOF,
    deployedUrl: input.submissionUrls?.deployedUrl?.trim() || mission.submissionPack.deployedUrl || SUBMISSION_PROOF.deployedUrl,
    protopediaUrl: input.submissionUrls?.protopediaUrl?.trim() || SUBMISSION_PROOF.protopediaUrl,
    videoUrl: input.submissionUrls?.videoUrl?.trim() || SUBMISSION_PROOF.videoUrl
  };
  const appUrl = submissionProof.deployedUrl || baseUrl;
  const topCompetitor = strategy.competitors[0]?.name ?? "Google ADK";
  const tags = mission.submissionPack.tags.join(", ");
  const featureBullets = [
    "Project Briefから必要なAI能力を抽出し、能力値・価格・MCP成熟度で候補を推薦する",
    "Contract Deskで、選択したAIごとの成果物、受入条件、SLA、検証コマンドを発行する",
    "Winning Strategyで、競合分析、SWOT、審査5項目、次に雇うべきAIを可視化する",
    "Mission/Ops/Finalistで、A2A委任、Cloud Run運用、最終候補判定を証拠化する"
  ];
  const technologyBullets = [
    "Cloud RunでReact UI、Express API、Agent Card、A2A endpointを単一サービスとして公開",
    "Gemini 3.5 Flashで勝ち筋、リスク、30秒ピッチをJSON生成",
    "GitHub Actionsでtypecheck、test、build、architecture checkを公開実行",
    "A2A skillとしてmarket、contract、mission、ops、pitch、judge、finalist、demo、win autopilot、submission dossierを公開"
  ];
  const pasteFields: PublisherField[] = [
    field("title", "作品タイトル", mission.submissionPack.protopediaTitle, "ProtoPediaの作品タイトルへ貼る"),
    field(
      "one-liner",
      "一言説明",
      "必要なAI能力を市場から探し、雇い、A2Aで委任し、Cloud Run運用と提出証跡まで閉じるエージェント調達ワークベンチ。",
      "冒頭説明または概要欄へ貼る"
    ),
    field(
      "problem",
      "課題",
      `AIエージェント開発では、${topCompetitor} のような基盤が強くなる一方で、開発チームが審査基準、運用制約、A2A連携、検証証跡を見ながら「どのAI能力を雇うべきか」を判断する体験が弱い。`,
      "課題/背景欄へ貼る"
    ),
    field(
      "users",
      "対象ユーザー",
      "短期間でAIエージェントを企画、開発、デプロイするハッカソン参加者、新規事業チーム、AI活用の開発リード。",
      "対象ユーザー欄へ貼る"
    ),
    field("features", "特徴", featureBullets.map((item) => `- ${item}`).join("\n"), "特徴欄へ貼る"),
    field("technology", "技術構成", technologyBullets.map((item) => `- ${item}`).join("\n"), "使った技術欄へ貼る"),
    field(
      "demo-flow",
      "デモの見どころ",
      pitch.scenes.map((scene) => `- ${scene.timeRange}: ${scene.screen} / ${scene.voiceover}`).join("\n"),
      "動画説明またはデモ説明欄へ貼る"
    ),
    field(
      "judge-proof",
      "審査向け証拠",
      `Finalist score ${finalist.finalistScore} (${finalist.finalistBand})。Judge Proof、Finalist Simulator、GitHub Actions、Agent Card、Cloud Run URLを開けば、AI中心性、競合/SWOT、DevOps運用、実装証跡を確認できる。`,
      "工夫した点/審査向け補足へ貼る"
    ),
    field("tags", "タグ", tags, "タグ欄へ貼る")
  ];
  const assets: PublisherAsset[] = [
    asset("github", "公開GitHub", submissionProof.publicGitHubUrl, "README、実装、テスト、Cloud Run構成、提出資料を公開"),
    asset("cloud-run", "デプロイ済みURL", submissionProof.deployedUrl, "審査員が動作確認できるCloud Run URL"),
    asset("ci", "GitHub Actions CI", submissionProof.ciWorkflowUrl, "品質ゲートの公開証跡"),
    asset("architecture", "システム構成図", `${baseUrl.replace(/\/$/, "")}${mission.submissionPack.architectureDiagramUrl}`, "ProtoPediaに貼れる構成図"),
    asset("story", "提出ストーリーMarkdown", `${baseUrl.replace(/\/$/, "")}${mission.submissionPack.storyMarkdownPath}`, "ProtoPedia本文の下書き"),
    asset("protopedia", "ProtoPedia作品URL", submissionProof.protopediaUrl, "外部登録後に提出フォームへ貼る"),
    asset("video", "動画URL", submissionProof.videoUrl, "Demo Runwayの30秒構成を録画して貼る")
  ];
  const finalChecklist: PublisherStep[] = [
    {
      id: "copy-fields",
      label: "ProtoPedia本文を貼る",
      status: "ready",
      action: "pasteFieldsを作品タイトル、概要、課題、特徴、技術構成、タグへ貼る",
      proof: `${pasteFields.length} paste-ready fields generated`
    },
    {
      id: "attach-architecture",
      label: "構成図を添付する",
      status: "ready",
      action: "System Architecture画像として public/assets/a2a-marketplace-architecture.svg を貼る",
      proof: mission.submissionPack.architectureDiagramUrl
    },
    {
      id: "record-video",
      label: "30秒動画を録画する",
      status: statusFromUrl(submissionProof.videoUrl),
      action: "Demo Runwayの順番で Judge Proof -> Finalist Simulator -> Submission Publisher -> Marketplace -> Strategy -> Contract/Mission -> Ops を録画する",
      proof: pitch.voiceoverScript
    },
    {
      id: "publish-protopedia",
      label: "ProtoPedia作品URLを発行する",
      status: statusFromUrl(submissionProof.protopediaUrl),
      action: "作品ページを公開し、提出フォームへ作品URLを貼る",
      proof: "Required tag: findy_hackathon"
    },
    {
      id: "final-proof",
      label: "最終証拠を確認する",
      status: "ready",
      action: "Judge ProofとFinalist Simulatorを実行し、CIとCloud Runがreadyであることを確認する",
      proof: `Ops ${opsDrill.severity}, finalist ${finalist.finalistBand}, selected ${selectedAgents}`
    }
  ];
  const missingExternal = finalChecklist.filter((item) => item.status === "watch");
  const copyTray = buildSubmissionCopyTray({ pasteFields, assets, appUrl, submissionProof });
  const qualityLock = buildQualityLock({ pasteFields, assets, finalChecklist, strategy, pitch, finalist, topCompetitor });
  const policyLock = buildPolicyLock({ pasteFields, assets, finalChecklist });
  const publishScore = Math.round(
    clamp(
      average([
        average(pasteFields.map((item) => readyPoints(item.status))),
        average(assets.map((item) => readyPoints(item.status))),
        average(finalChecklist.map((item) => readyPoints(item.status))),
        qualityLock.qualityScore,
        policyLock.policyScore,
        finalist.finalistScore,
        pitch.readinessScore
      ])
    )
  );
  const readiness: PublisherReadiness = missingExternal.length === 0 ? "ready-to-register" : "needs-external-urls";

  return {
    id: `publisher-${publishScore}-${mission.id}`,
    publishScore,
    readiness,
    summary:
      readiness === "ready-to-register"
        ? "ProtoPedia登録に必要な本文、URL、動画、構成図が揃っています。"
        : "本文、構成図、公開URL、CI証跡は揃っています。残りはProtoPedia作品URLと動画URLの外部登録です。",
    pasteFields,
    copyTray,
    qualityLock,
    policyLock,
    assets,
    finalChecklist,
    missingExternal,
    recordingScript: pitch.voiceoverScript,
    a2aPayload: {
      method: "message/send",
      skill: SUBMISSION_PUBLISH_SKILL_ID,
      publishScore,
      readiness,
      selectedAgents: recommendation.selected.map((agent) => agent.id),
      qualityLock: {
        qualityScore: qualityLock.qualityScore,
        readiness: qualityLock.readiness,
        checks: qualityLock.checks.map((check) => ({ id: check.id, status: check.status }))
      },
      policyLock: {
        policyScore: policyLock.policyScore,
        readiness: policyLock.readiness,
        sourceUrls: policyLock.sourceUrls,
        checks: policyLock.checks.map((check) => ({ id: check.id, status: check.status, sourceUrl: check.sourceUrl }))
      },
      pasteFields: pasteFields.map((item) => ({ id: item.id, label: item.label, status: item.status })),
      copyTray: {
        readiness: copyTray.readiness,
        requiredReadyCount: copyTray.requiredReadyCount,
        requiredTotalCount: copyTray.requiredTotalCount,
        requiredGaps: copyTray.requiredGaps,
        pasteOrder: copyTray.pasteOrder
      },
      assets: assets.map((item) => ({ id: item.id, status: item.status, url: item.url ?? null })),
      missingExternal: missingExternal.map((item) => ({ id: item.id, action: item.action })),
      appUrl,
      endpoints: {
        publisher: `${baseUrl.replace(/\/$/, "")}/api/publisher`,
        publisherPage: `${baseUrl.replace(/\/$/, "")}/publisher`,
        submissionAssetsPage: `${baseUrl.replace(/\/$/, "")}/submission-assets`,
        architecturePackPage: `${baseUrl.replace(/\/$/, "")}/architecture-pack`,
        submissionLaunchPage: `${baseUrl.replace(/\/$/, "")}/submission-launch`
      }
    }
  };
}

export function renderProtoPediaPublisherHtml(publisher: ProtoPediaPublisher, options: ProtoPediaPublisherHtmlOptions = {}) {
  const publicUrlAssets = ["cloud-run", "protopedia", "video"]
    .map((id) => publisher.assets.find((assetItem) => assetItem.id === id))
    .filter((assetItem): assetItem is PublisherAsset => !!assetItem);
  const publicUrlReadyCount = publicUrlAssets.filter((assetItem) => assetItem.status === "ready").length;
  const publicUrlDesk = `
      <section class="panel url-desk" aria-label="Public submission URL desk">
        <div>
          <div class="eyebrow">Public URL desk</div>
          <h2>Live submission proof</h2>
          <p>Deployed product, ProtoPedia page, and demo media become an auditable package before the final handoff.</p>
          <strong>${escapeHtml(`${publicUrlReadyCount}/${publicUrlAssets.length}`)} URLs ready</strong>
        </div>
        <form class="url-form" method="get" action="/publisher">
          <label>
            <span>Deployed URL <em class="${tone(publisher.assets.find((assetItem) => assetItem.id === "cloud-run")?.status ?? "watch")}">${escapeHtml(publisher.assets.find((assetItem) => assetItem.id === "cloud-run")?.status ?? "watch")}</em></span>
            <input name="targetUrl" value="${escapeHtml(publisher.assets.find((assetItem) => assetItem.id === "cloud-run")?.url ?? "")}" placeholder="${escapeHtml(PUBLIC_PROOF_INPUT_PLACEHOLDERS.targetUrl)}" inputmode="url" autocapitalize="none" spellcheck="false" />
          </label>
          <label>
            <span>ProtoPedia URL <em class="${tone(publisher.assets.find((assetItem) => assetItem.id === "protopedia")?.status ?? "watch")}">${escapeHtml(publisher.assets.find((assetItem) => assetItem.id === "protopedia")?.status ?? "watch")}</em></span>
            <input name="protopediaUrl" value="${escapeHtml(publisher.assets.find((assetItem) => assetItem.id === "protopedia")?.url ?? "")}" placeholder="${escapeHtml(PUBLIC_PROOF_INPUT_PLACEHOLDERS.protopediaUrl)}" inputmode="url" autocapitalize="none" spellcheck="false" />
          </label>
          <label>
            <span>Walkthrough video URL <em class="${tone(publisher.assets.find((assetItem) => assetItem.id === "video")?.status ?? "watch")}">${escapeHtml(publisher.assets.find((assetItem) => assetItem.id === "video")?.status ?? "watch")}</em></span>
            <input name="videoUrl" value="${escapeHtml(publisher.assets.find((assetItem) => assetItem.id === "video")?.url ?? "")}" placeholder="${escapeHtml(PUBLIC_PROOF_INPUT_PLACEHOLDERS.videoUrl)}" inputmode="url" autocapitalize="none" spellcheck="false" />
          </label>
          <div class="url-actions">
            <button type="submit">Refresh package</button>
            <button type="button" class="secondary" id="publisher-live-audit-run">Run live audit</button>
          </div>
          <small id="publisher-live-audit-status">Live audit has not run on this page yet.</small>
        </form>
      </section>
      <section class="panel live-audit-panel" id="publisher-live-audit-result" data-open="false" aria-live="polite">
        <div>
          <div class="eyebrow" id="publisher-live-audit-kicker">Live audit</div>
          <h2 id="publisher-live-audit-title">Run live audit to verify public proof links</h2>
          <p id="publisher-live-audit-summary">The result will include a checksum receipt and a Receipt Verification Desk link.</p>
        </div>
        <aside>
          <strong id="publisher-live-audit-score">--</strong>
          <span id="publisher-live-audit-count">0/0 URLs verified</span>
        </aside>
        <div class="audit-actions" id="publisher-live-audit-actions"></div>
        <div class="audit-rows" id="publisher-live-audit-rows"></div>
      </section>`;
  const liveAuditPayload = JSON.stringify({
    projectBrief: options.projectBrief ?? "",
    selectedAgentIds: options.selectedAgentIds ?? [],
    targetUrl: publisher.assets.find((assetItem) => assetItem.id === "cloud-run")?.url ?? "",
    protopediaUrl: publisher.assets.find((assetItem) => assetItem.id === "protopedia")?.url ?? "",
    videoUrl: publisher.assets.find((assetItem) => assetItem.id === "video")?.url ?? ""
  });
  const publisherScript = `
    <script type="application/json" id="publisher-live-audit-payload">${escapeScriptJson(liveAuditPayload)}</script>
    <script>
      (() => {
        const apiPath = ${JSON.stringify(options.liveAuditApiPath ?? "/api/publisher/live-audit")};
        const payloadNode = document.getElementById("publisher-live-audit-payload");
        const form = document.querySelector(".url-form");
        const button = document.getElementById("publisher-live-audit-run");
        const status = document.getElementById("publisher-live-audit-status");
        const result = document.getElementById("publisher-live-audit-result");
        const kicker = document.getElementById("publisher-live-audit-kicker");
        const title = document.getElementById("publisher-live-audit-title");
        const summary = document.getElementById("publisher-live-audit-summary");
        const score = document.getElementById("publisher-live-audit-score");
        const count = document.getElementById("publisher-live-audit-count");
        const rows = document.getElementById("publisher-live-audit-rows");
        const actions = document.getElementById("publisher-live-audit-actions");
        if (!payloadNode || !form || !button || !status || !result || !kicker || !title || !summary || !score || !count || !rows || !actions) return;
        const basePayload = JSON.parse(payloadNode.textContent || "{}");

        function text(value) {
          return String(value ?? "");
        }

        function fieldValue(name) {
          const field = form.querySelector("[name='" + name + "']");
          return field && "value" in field ? String(field.value).trim() : "";
        }

        function addLink(label, href, download) {
          const link = document.createElement("a");
          link.textContent = label;
          link.href = href;
          if (download) link.download = download;
          if (!download) {
            link.target = "_blank";
            link.rel = "noreferrer";
          }
          actions.appendChild(link);
        }

        function renderAudit(audit) {
          result.dataset.open = "true";
          result.dataset.status = audit.liveReadiness || audit.status || "not-run";
          kicker.textContent = text(audit.liveReadiness || audit.status || "live-audit");
          title.textContent = text(audit.headline || "Live audit result");
          summary.textContent = text(audit.summary || "No summary returned.");
          score.textContent = text(audit.score ?? "--");
          count.textContent = text(audit.verifiedCount ?? 0) + "/" + text(audit.totalCount ?? 0) + " URLs verified";
          rows.textContent = "";
          actions.textContent = "";
          if (audit.verificationRequestHref) addLink("Download receipt", audit.verificationRequestHref, (audit.receiptId || "publisher-live-audit") + ".json");
          if (audit.verificationDeskHref) addLink("Verify audit", audit.verificationDeskHref);
          for (const row of audit.rows || []) {
            const article = document.createElement("article");
            article.className = text(row.status);
            const heading = document.createElement("strong");
            heading.textContent = text(row.label) + " / " + text(row.status);
            const evidence = document.createElement("p");
            evidence.textContent = text(row.evidence);
            const action = document.createElement("small");
            action.textContent = text(row.action);
            const url = document.createElement("code");
            url.textContent = text(row.url || "Missing public URL");
            article.append(heading, evidence, action, url);
            rows.appendChild(article);
          }
        }

        button.addEventListener("click", async () => {
          button.setAttribute("disabled", "true");
          status.textContent = "Running live audit...";
          try {
            const response = await fetch(apiPath, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                ...basePayload,
                targetUrl: fieldValue("targetUrl"),
                protopediaUrl: fieldValue("protopediaUrl"),
                videoUrl: fieldValue("videoUrl")
              })
            });
            const body = await response.json();
            if (!response.ok) throw new Error(body?.error || "HTTP " + response.status);
            renderAudit(body);
            status.textContent = "Live audit complete.";
          } catch (error) {
            result.dataset.open = "true";
            result.dataset.status = "failed";
            kicker.textContent = "Live audit failed";
            title.textContent = "Live audit could not run";
            summary.textContent = error instanceof Error ? error.message : "Unknown error";
            score.textContent = "--";
            count.textContent = "0/0 URLs verified";
            rows.textContent = "";
            actions.textContent = "";
            status.textContent = "Live audit failed.";
          } finally {
            button.removeAttribute("disabled");
          }
        });
      })();
    </script>`;
  const metrics = [
    { label: "Readiness", value: publisher.readiness, status: publisher.readiness },
    { label: "Publish Score", value: publisher.publishScore, status: publisher.readiness },
    { label: "Quality Lock", value: `${publisher.qualityLock.qualityScore} / ${publisher.qualityLock.readiness}`, status: publisher.qualityLock.readiness },
    { label: "Policy Lock", value: `${publisher.policyLock.policyScore} / ${publisher.policyLock.readiness}`, status: publisher.policyLock.readiness }
  ]
    .map(
      (metric) => `
        <article class="metric ${tone(String(metric.status))}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>`
    )
    .join("");
  const pasteFields = publisher.pasteFields
    .map(
      (fieldItem) => `
        <article class="card ${tone(fieldItem.status)}">
          <div><strong>${escapeHtml(fieldItem.label)}</strong><span>${escapeHtml(fieldItem.status)}</span></div>
          <small>${escapeHtml(fieldItem.copyHint)}</small>
          <pre>${escapeHtml(fieldItem.value)}</pre>
        </article>`
    )
    .join("");
  const copyTray = publisher.copyTray.items
    .slice()
    .sort((left, right) => left.order - right.order)
    .map(
      (item) => `
        <article class="card ${tone(item.status)}">
          <div><strong>${escapeHtml(item.order)}. ${escapeHtml(item.label)}</strong><span>${escapeHtml(item.status)}</span></div>
          <small>${escapeHtml(item.copyHint)}${item.required ? " / required" : ""}</small>
          <pre>${escapeHtml(item.value || "Pending external URL")}</pre>
        </article>`
    )
    .join("");
  const qualityChecks = publisher.qualityLock.checks
    .map(
      (check) => `
        <li class="${tone(check.status)}">
          <strong>${escapeHtml(check.label)}</strong>
          <span>${escapeHtml(check.status)} / ${escapeHtml(check.proof)}</span>
          <small>${escapeHtml(check.acceptance)}</small>
        </li>`
    )
    .join("");
  const policyChecks = publisher.policyLock.checks
    .map(
      (check) => `
        <li class="${tone(check.status)}">
          <strong>${escapeHtml(check.label)}</strong>
          <span>${escapeHtml(check.status)} / ${escapeHtml(check.proof)}</span>
          <small>${escapeHtml(check.acceptance)}</small>
          <a href="${escapeHtml(check.sourceUrl)}">${escapeHtml(check.sourceUrl)}</a>
        </li>`
    )
    .join("");
  const assets = publisher.assets
    .map(
      (assetItem) => `
        <article class="card ${tone(assetItem.status)}">
          <div><strong>${escapeHtml(assetItem.label)}</strong><span>${escapeHtml(assetItem.status)}</span></div>
          <p>${escapeHtml(assetItem.proof)}</p>
          ${assetItem.url ? `<a href="${escapeHtml(assetItem.url)}">${escapeHtml(assetItem.url)}</a>` : `<small>External URL watch</small>`}
        </article>`
    )
    .join("");
  const checklist = publisher.finalChecklist
    .map(
      (item) => `
        <li class="${tone(item.status)}">
          <strong>${escapeHtml(item.label)}</strong>
          <span>${escapeHtml(item.status)}</span>
          <small>${escapeHtml(item.action)}</small>
          <small>${escapeHtml(item.proof)}</small>
        </li>`
    )
    .join("");
  const external =
    publisher.missingExternal.length === 0
      ? `<li>No external URL gaps remain.</li>`
      : publisher.missingExternal.map((item) => `<li><strong>${escapeHtml(item.label)}</strong> ${escapeHtml(item.action)} <small>${escapeHtml(item.proof)}</small></li>`).join("");

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Submission Publisher Proof</title>
    <style>
      :root { color-scheme: light; --ink: #18201e; --muted: #5f6d68; --line: #d9e3dd; --paper: #fbfcfa; --panel: #fff; --green: #13715d; --mint: #e6f4ed; --amber-bg: #fff4d4; --coral-bg: #fff0ec; }
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
      .metric, .card, .panel { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); padding: 16px; box-shadow: 0 10px 24px rgba(24, 32, 30, .06); min-width: 0; }
      .url-desk, .live-audit-panel { display: grid; grid-template-columns: minmax(250px, .34fr) minmax(0, 1fr); gap: 14px; align-items: start; }
      .url-desk strong { display: inline-flex; width: fit-content; margin-top: 8px; border-radius: 999px; padding: 5px 10px; color: #0e4f41; background: #d7f1e2; font-size: .8rem; }
      .url-form, .url-form label { display: grid; gap: 8px; min-width: 0; }
      .url-form { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .url-form label span { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: var(--ink); font-size: .74rem; font-weight: 900; text-transform: uppercase; }
      .url-form label em { border-radius: 999px; padding: 3px 8px; font-style: normal; background: #d7f1e2; }
      .url-form label em.watch { background: var(--amber-bg); }
      .url-form input { width: 100%; min-height: 40px; border: 1px solid var(--line); border-radius: 8px; padding: 9px 10px; color: var(--ink); background: #fff; font: inherit; }
      .url-form input:focus-visible, button:focus-visible, .audit-actions a:focus-visible { outline: 2px solid var(--green); outline-offset: 2px; }
      .url-actions, .url-form small { grid-column: 1 / -1; }
      .url-actions, .audit-actions { display: flex; flex-wrap: wrap; gap: 8px; }
      button, .audit-actions a { min-height: 38px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid #0f5e4e; border-radius: 999px; padding: 8px 12px; color: #fff; background: var(--green); font: inherit; font-weight: 900; text-decoration: none; cursor: pointer; }
      button.secondary, .audit-actions a:nth-child(2) { color: var(--green); background: #fff; }
      button:disabled { cursor: wait; opacity: .65; }
      .live-audit-panel { display: none; border-left: 6px solid #ead39a; }
      .live-audit-panel[data-open="true"] { display: grid; }
      .live-audit-panel[data-status="live-ready"], .live-audit-panel[data-status="verified"] { border-left-color: var(--green); background: #f2fbf5; }
      .live-audit-panel[data-status="needs-live-repair"], .live-audit-panel[data-status="action-required"], .live-audit-panel[data-status="failed"] { border-left-color: #b55a38; background: #fff7f4; }
      .live-audit-panel aside { display: grid; place-items: center; gap: 4px; min-height: 120px; border-radius: 8px; color: #fff; background: #18352e; }
      .live-audit-panel aside strong { font-size: 3rem; line-height: 1; }
      .audit-actions, .audit-rows { grid-column: 1 / -1; }
      .audit-rows { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
      .audit-rows article { display: grid; gap: 6px; border: 1px solid var(--line); border-left: 4px solid var(--green); border-radius: 8px; padding: 10px; background: #fff; min-width: 0; }
      .audit-rows article.block, .audit-rows article.missing { border-left-color: #b55a38; background: #fff0ec; }
      .audit-rows article.watch { border-left-color: #c18a16; background: var(--amber-bg); }
      .audit-rows code { overflow-wrap: anywhere; color: var(--muted); }
      .copy-tray { border-color: #13715d; background: #f5fbf7; }
      .metric span, .card span, li span { color: var(--muted); font-size: .74rem; font-weight: 900; text-transform: uppercase; }
      .metric strong { display: block; margin-top: 6px; font-size: 1.35rem; overflow-wrap: anywhere; }
      .card div { display: flex; gap: 12px; justify-content: space-between; align-items: start; }
      pre { margin: 10px 0 0; padding: 12px; white-space: pre-wrap; overflow-wrap: anywhere; background: rgba(24, 32, 30, .04); border-radius: 8px; font: inherit; color: var(--ink); }
      ol { margin: 8px 0 0; padding-left: 20px; }
      li { margin-bottom: 10px; padding: 8px; border-radius: 8px; overflow-wrap: anywhere; }
      li span, li small, li a { display: block; margin-top: 4px; overflow-wrap: anywhere; }
      .good { border-color: #a9d8c2; background: var(--mint); }
      .watch { border-color: #ead39a; background: var(--amber-bg); }
      .bad { border-color: #efb7aa; background: var(--coral-bg); }
      footer { padding: 20px 0 40px; color: var(--muted); }
      @media (max-width: 900px) { h1 { font-size: 2rem; } .metrics, .grid, .url-desk, .url-form, .live-audit-panel, .audit-rows { grid-template-columns: 1fr; } .url-actions, .url-form small, .audit-actions, .audit-rows { grid-column: auto; } .card div { display: block; } }
    </style>
  </head>
  <body>
    <header>
      <div class="eyebrow">Submission Publisher Proof</div>
      <h1>${escapeHtml(publisher.summary)}</h1>
      <p><strong>${escapeHtml(publisher.qualityLock.headline)}</strong></p>
      <p>${escapeHtml(publisher.policyLock.operatorLine)}</p>
      <section class="metrics">${metrics}</section>
    </header>
    <main>
      ${publicUrlDesk}
      <h2>Submission Copy Tray</h2>
      <section class="panel copy-tray">
        <p>${escapeHtml(publisher.copyTray.readiness)} / ${escapeHtml(`${publisher.copyTray.requiredReadyCount}/${publisher.copyTray.requiredTotalCount}`)} required ready. Gaps: ${escapeHtml(publisher.copyTray.requiredGaps.join(", ") || "none")}.</p>
        <div class="grid">${copyTray}</div>
      </section>
      <h2>Paste Fields</h2>
      <section class="grid">${pasteFields}</section>
      <h2>ProtoPedia Quality Lock</h2>
      <section class="panel"><ol>${qualityChecks}</ol></section>
      <h2>Publication Policy Lock</h2>
      <section class="panel"><ol>${policyChecks}</ol></section>
      <h2>Assets</h2>
      <section class="grid">${assets}</section>
      <h2>Final Checklist</h2>
      <section class="panel"><ol>${checklist}</ol></section>
      <h2>External Gaps</h2>
      <section class="panel"><ol>${external}</ol></section>
      <h2>Recording Script</h2>
      <section class="panel"><pre>${escapeHtml(publisher.recordingScript)}</pre></section>
    </main>
    <footer>${escapeHtml(publisher.id)} / A2A skill ${SUBMISSION_PUBLISH_SKILL_ID}</footer>
    ${publisherScript}
  </body>
</html>`;
}
