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

export type ProtoPediaPublisher = {
  id: string;
  publishScore: number;
  readiness: PublisherReadiness;
  summary: string;
  pasteFields: PublisherField[];
  qualityLock: ProtoPediaQualityLock;
  assets: PublisherAsset[];
  finalChecklist: PublisherStep[];
  missingExternal: PublisherStep[];
  recordingScript: string;
  a2aPayload: Record<string, unknown>;
};

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
  const publishScore = Math.round(
    clamp(
      average([
        average(pasteFields.map((item) => readyPoints(item.status))),
        average(assets.map((item) => readyPoints(item.status))),
        average(finalChecklist.map((item) => readyPoints(item.status))),
        qualityLock.qualityScore,
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
    assets,
    finalChecklist,
    missingExternal,
    recordingScript: pitch.voiceoverScript,
    a2aPayload: {
      method: "message/send",
      skill: "submission.publish",
      publishScore,
      readiness,
      selectedAgents: recommendation.selected.map((agent) => agent.id),
      qualityLock: {
        qualityScore: qualityLock.qualityScore,
        readiness: qualityLock.readiness,
        checks: qualityLock.checks.map((check) => ({ id: check.id, status: check.status }))
      },
      pasteFields: pasteFields.map((item) => ({ id: item.id, label: item.label, status: item.status })),
      assets: assets.map((item) => ({ id: item.id, status: item.status, url: item.url ?? null })),
      missingExternal: missingExternal.map((item) => ({ id: item.id, action: item.action })),
      appUrl
    }
  };
}
