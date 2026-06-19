import type { FinalistSimulation } from "./finalist.js";
import type { MissionRun } from "./mission.js";
import type { OpsDrill } from "./ops.js";
import type { PitchRun } from "./pitch.js";
import { SUBMISSION_PROOF, hasSubmissionUrl } from "./submission.js";
import type { WinningStrategy } from "./strategy.js";
import type { Recommendation } from "./types.js";

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
  qualityLock: ProtoPediaQualityLock;
  policyLock: ProtoPediaPolicyLock;
  assets: PublisherAsset[];
  finalChecklist: PublisherStep[];
  missingExternal: PublisherStep[];
  recordingScript: string;
  a2aPayload: Record<string, unknown>;
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
}): ProtoPediaPublisher {
  const { baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist } = input;
  const selectedAgents = recommendation.selected.map((agent) => agent.name).join(" / ") || "A2A Market Broker";
  const appUrl = mission.submissionPack.deployedUrl || baseUrl;
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
    asset("github", "公開GitHub", SUBMISSION_PROOF.publicGitHubUrl, "README、実装、テスト、Cloud Run構成、提出資料を公開"),
    asset("cloud-run", "デプロイ済みURL", SUBMISSION_PROOF.deployedUrl, "審査員が動作確認できるCloud Run URL"),
    asset("ci", "GitHub Actions CI", SUBMISSION_PROOF.ciWorkflowUrl, "品質ゲートの公開証跡"),
    asset("architecture", "システム構成図", `${baseUrl.replace(/\/$/, "")}${mission.submissionPack.architectureDiagramUrl}`, "ProtoPediaに貼れる構成図"),
    asset("story", "提出ストーリーMarkdown", `${baseUrl.replace(/\/$/, "")}${mission.submissionPack.storyMarkdownPath}`, "ProtoPedia本文の下書き"),
    asset("protopedia", "ProtoPedia作品URL", SUBMISSION_PROOF.protopediaUrl, "外部登録後に提出フォームへ貼る"),
    asset("video", "動画URL", SUBMISSION_PROOF.videoUrl, "Demo Runwayの30秒構成を録画して貼る")
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
      status: statusFromUrl(SUBMISSION_PROOF.videoUrl),
      action: "Demo Runwayの順番で Judge Proof -> Finalist Simulator -> Submission Publisher -> Marketplace -> Strategy -> Contract/Mission -> Ops を録画する",
      proof: pitch.voiceoverScript
    },
    {
      id: "publish-protopedia",
      label: "ProtoPedia作品URLを発行する",
      status: statusFromUrl(SUBMISSION_PROOF.protopediaUrl),
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

export function renderProtoPediaPublisherHtml(publisher: ProtoPediaPublisher) {
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
      @media (max-width: 900px) { h1 { font-size: 2rem; } .metrics, .grid { grid-template-columns: 1fr; } .card div { display: block; } }
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
  </body>
</html>`;
}
