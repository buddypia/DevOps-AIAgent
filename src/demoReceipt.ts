import { createHash } from "node:crypto";
import type { MoatStressTest } from "./moatStress.js";
import type { SquadOptimizerRun } from "./squadOptimizer.js";
import { hasSubmissionUrl, SUBMISSION_PROOF } from "./submission.js";
import type { WinningStrategy } from "./strategy.js";
import type { Recommendation } from "./types.js";

export type DemoReceiptVerdict = "sealed" | "needs-proof" | "needs-external-submit";
export type DemoReceiptStampStatus = "sealed" | "watch" | "missing";
export type DemoReceiptIntegrityReadiness = "integrity-sealed" | "integrity-external-watch" | "needs-integrity-fix";

export type DemoReceiptStamp = {
  id: string;
  label: string;
  status: DemoReceiptStampStatus;
  score: number;
  proof: string;
  url: string;
};

export type DemoReceiptAction = {
  id: string;
  priority: "now" | "next";
  action: string;
  proof: string;
};

export type DemoReceiptDigestPayload = {
  receiptId: string;
  selectedAgentIds: string[];
  receiptScore: number;
  verdict: DemoReceiptVerdict;
  stampStatuses: Array<{ id: string; status: DemoReceiptStampStatus; score: number }>;
  integrityCheckIds: string[];
  externalUrls: {
    protopediaUrl: string;
    videoUrl: string;
  };
};

export type DemoReceiptDigest = {
  algorithm: "sha256";
  digest: string;
  payload: DemoReceiptDigestPayload;
  verification: string;
};

export type DemoReceiptIntegrityCheck = {
  id: string;
  label: string;
  status: DemoReceiptStampStatus;
  score: number;
  proof: string;
  digestField: string;
  url: string;
};

export type DemoReceiptIntegrityLock = {
  id: string;
  integrityScore: number;
  readiness: DemoReceiptIntegrityReadiness;
  sealedCount: number;
  watchCount: number;
  missingCount: number;
  digestPreview: string;
  judgeLine: string;
  replayCommand: string;
  checks: DemoReceiptIntegrityCheck[];
};

export type JudgeDemoReceipt = {
  id: string;
  generatedAt: string;
  receiptScore: number;
  verdict: DemoReceiptVerdict;
  headline: string;
  hardTruth: string;
  stamps: DemoReceiptStamp[];
  recordingOrder: string[];
  actions: DemoReceiptAction[];
  digest: DemoReceiptDigest;
  integrityLock: DemoReceiptIntegrityLock;
  a2aPayload: Record<string, unknown>;
};

const REQUIRED_STAMP_IDS = ["judge-route", "competitive-moat", "squad-choice", "runtime-proof", "a2a-surface", "external-submit"] as const;
const INTEGRITY_CHECK_IDS = [
  "digest-replay",
  "stamp-coverage",
  "runtime-proof-linked",
  "a2a-surface-linked",
  "competitive-proof-linked",
  "external-gap-honesty"
] as const;

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function statusScore(status: DemoReceiptStampStatus) {
  if (status === "sealed") return 100;
  if (status === "watch") return 72;
  return 30;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function digest(value: DemoReceiptDigestPayload) {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

function statusFromScore(score: number): DemoReceiptStampStatus {
  if (score >= 86) return "sealed";
  if (score >= 70) return "watch";
  return "missing";
}

function absoluteUrl(baseUrl: string, path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = baseUrl.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function externalStatus(protopediaUrl: string, videoUrl: string): DemoReceiptStampStatus {
  return hasSubmissionUrl(protopediaUrl) && hasSubmissionUrl(videoUrl) ? "sealed" : "watch";
}

function stamp(input: Omit<DemoReceiptStamp, "score"> & { score?: number }): DemoReceiptStamp {
  return {
    ...input,
    score: Math.round(clamp(input.score ?? statusScore(input.status)))
  };
}

function integrityCheck(input: Omit<DemoReceiptIntegrityCheck, "score"> & { score?: number }): DemoReceiptIntegrityCheck {
  return {
    ...input,
    score: Math.round(clamp(input.score ?? statusScore(input.status)))
  };
}

function verdictFrom(stamps: DemoReceiptStamp[], score: number): DemoReceiptVerdict {
  if (stamps.some((item) => item.id === "external-submit" && item.status !== "sealed")) return "needs-external-submit";
  if (stamps.some((item) => item.status === "missing") || score < 82) return "needs-proof";
  return "sealed";
}

function actionsFrom(stamps: DemoReceiptStamp[]): DemoReceiptAction[] {
  return stamps
    .filter((stampItem) => stampItem.status !== "sealed")
    .map((stampItem) => ({
      id: stampItem.id,
      priority: stampItem.status === "missing" ? ("now" as const) : ("next" as const),
      action:
        stampItem.id === "external-submit"
          ? "ProtoPedia作品URLと動画URLを入力し、Submission Launch Gateでsubmit-readyまで確認する"
          : `${stampItem.label} を再実行し、score ${stampItem.score} のwatch状態をsealedへ上げる`,
      proof: stampItem.proof
    }));
}

function buildIntegrityLock(input: {
  baseUrl: string;
  projectBrief: string;
  selectedAgentIds: string[];
  stamps: DemoReceiptStamp[];
  verdict: DemoReceiptVerdict;
  receiptDigest: DemoReceiptDigest;
}): DemoReceiptIntegrityLock {
  const stampById = new Map(input.stamps.map((item) => [item.id, item]));
  const stampStatusesMatchDigest =
    input.receiptDigest.payload.stampStatuses.length === input.stamps.length &&
    input.receiptDigest.payload.stampStatuses.every((item) => {
      const source = stampById.get(item.id);
      return source?.status === item.status && source.score === item.score;
    });
  const hasRequiredStamps = REQUIRED_STAMP_IDS.every((id) => stampById.has(id)) && input.stamps.length === REQUIRED_STAMP_IDS.length;
  const runtimeProof = stampById.get("runtime-proof");
  const a2aSurface = stampById.get("a2a-surface");
  const competitiveMoat = stampById.get("competitive-moat");
  const externalSubmit = stampById.get("external-submit");
  const replayBody = JSON.stringify({
    projectBrief: input.projectBrief,
    selectedAgentIds: input.selectedAgentIds,
    protopediaUrl: input.receiptDigest.payload.externalUrls.protopediaUrl,
    videoUrl: input.receiptDigest.payload.externalUrls.videoUrl
  });
  const checks = [
    integrityCheck({
      id: "digest-replay",
      label: "Digest replay",
      status:
        /^[a-f0-9]{64}$/.test(input.receiptDigest.digest) &&
        input.receiptDigest.payload.integrityCheckIds.join(",") === INTEGRITY_CHECK_IDS.join(",") &&
        stampStatusesMatchDigest
          ? "sealed"
          : "missing",
      proof: `Digest covers ${input.receiptDigest.payload.stampStatuses.length} stamp statuses and ${input.receiptDigest.payload.integrityCheckIds.length} integrity checks.`,
      digestField: "digest.payload.stampStatuses + digest.payload.integrityCheckIds",
      url: absoluteUrl(input.baseUrl, "/api/demo-receipt")
    }),
    integrityCheck({
      id: "stamp-coverage",
      label: "Stamp coverage",
      status: hasRequiredStamps ? "sealed" : "missing",
      proof: hasRequiredStamps
        ? "Required judge route, moat, squad, runtime, A2A, and external submission stamps are present."
        : "A required receipt stamp is missing from the digest payload.",
      digestField: "digest.payload.stampStatuses[].id",
      url: absoluteUrl(input.baseUrl, "/api/demo-receipt")
    }),
    integrityCheck({
      id: "runtime-proof-linked",
      label: "Runtime proof linked",
      status: runtimeProof?.status === "sealed" && runtimeProof.url.endsWith("/api/live-evidence") ? "sealed" : "missing",
      proof: runtimeProof ? `${runtimeProof.status}; ${runtimeProof.proof}` : "Runtime proof stamp missing.",
      digestField: "digest.payload.stampStatuses[runtime-proof]",
      url: runtimeProof?.url ?? absoluteUrl(input.baseUrl, "/api/live-evidence")
    }),
    integrityCheck({
      id: "a2a-surface-linked",
      label: "A2A surface linked",
      status: a2aSurface?.status === "sealed" && a2aSurface.url.endsWith("/.well-known/agent-card.json") ? "sealed" : "missing",
      proof: a2aSurface ? `${a2aSurface.status}; ${a2aSurface.proof}` : "A2A surface stamp missing.",
      digestField: "digest.payload.stampStatuses[a2a-surface]",
      url: a2aSurface?.url ?? absoluteUrl(input.baseUrl, "/.well-known/agent-card.json")
    }),
    integrityCheck({
      id: "competitive-proof-linked",
      label: "Competitive proof linked",
      status: competitiveMoat && competitiveMoat.status !== "missing" && competitiveMoat.url.endsWith("/api/moat-stress") ? competitiveMoat.status : "missing",
      proof: competitiveMoat ? `${competitiveMoat.status}; ${competitiveMoat.proof}` : "Competitive moat stamp missing.",
      digestField: "digest.payload.stampStatuses[competitive-moat]",
      url: competitiveMoat?.url ?? absoluteUrl(input.baseUrl, "/api/moat-stress")
    }),
    integrityCheck({
      id: "external-gap-honesty",
      label: "External gap honesty",
      status:
        externalSubmit?.status === "sealed"
          ? "sealed"
          : externalSubmit?.status === "watch" && input.verdict === "needs-external-submit"
            ? "watch"
            : "missing",
      proof:
        externalSubmit?.status === "sealed"
          ? "External ProtoPedia and video URLs are included in the digest payload."
          : externalSubmit?.status === "watch" && input.verdict === "needs-external-submit"
            ? "External URLs remain visible as watch, so the receipt does not overclaim submit-ready."
            : "External URL state is missing or inconsistent with the receipt verdict.",
      digestField: "digest.payload.externalUrls + verdict",
      url: externalSubmit?.url ?? absoluteUrl(input.baseUrl, "/api/submission-launch")
    })
  ];
  const integrityScore = Math.round(clamp(average(checks.map((item) => item.score))));
  const sealedCount = checks.filter((item) => item.status === "sealed").length;
  const watchCount = checks.filter((item) => item.status === "watch").length;
  const missingCount = checks.filter((item) => item.status === "missing").length;
  const readiness =
    missingCount > 0 ? "needs-integrity-fix" : input.verdict === "needs-external-submit" || watchCount > 0 ? "integrity-external-watch" : "integrity-sealed";

  return {
    id: `receipt-integrity-${integrityScore}-${readiness}`,
    integrityScore,
    readiness,
    sealedCount,
    watchCount,
    missingCount,
    digestPreview: input.receiptDigest.digest.slice(0, 16),
    judgeLine:
      readiness === "integrity-sealed"
        ? "Receipt digest, proof routes, A2A surface, competitive rebuttal, and external submission URLs replay cleanly."
        : readiness === "integrity-external-watch"
          ? "Receipt integrity checks replay cleanly; external submission URL gaps remain visible and receipt watch stamps are not overclaimed."
          : "Receipt integrity has a broken proof route or digest coverage gap; fix this before recording.",
    replayCommand: `curl -s -X POST ${absoluteUrl(input.baseUrl, "/api/demo-receipt")} -H 'Content-Type: application/json' --data '${replayBody}' | jq '.integrityLock'`,
    checks
  };
}

export function buildJudgeDemoReceipt(input: {
  baseUrl: string;
  recommendation: Recommendation;
  strategy: WinningStrategy;
  moatStress: MoatStressTest;
  squadOptimizer: SquadOptimizerRun;
  protopediaUrl?: string;
  videoUrl?: string;
  generatedAt?: string;
}): JudgeDemoReceipt {
  const base = input.baseUrl.replace(/\/$/, "");
  const protopediaUrl = input.protopediaUrl?.trim() ?? SUBMISSION_PROOF.protopediaUrl;
  const videoUrl = input.videoUrl?.trim() ?? SUBMISSION_PROOF.videoUrl;
  const external = externalStatus(protopediaUrl, videoUrl);
  const selectedAgentIds = input.recommendation.selected.map((agent) => agent.id);
  const stamps: DemoReceiptStamp[] = [
    stamp({
      id: "judge-route",
      label: "Judge Tour route",
      status: statusFromScore(input.strategy.judgeScore),
      score: input.strategy.judgeScore,
      proof: `Judge score ${input.strategy.judgeScore}; ${input.strategy.judgeCriteria.length} criteria covered.`,
      url: absoluteUrl(base, "/api/judge-tour")
    }),
    stamp({
      id: "competitive-moat",
      label: "Competitive moat",
      status: input.moatStress.verdict === "defensible" ? "sealed" : input.moatStress.verdict === "needs-proof" ? "watch" : "missing",
      score: input.moatStress.stressScore,
      proof: `${input.moatStress.scenarios.length} competitor objections; ${input.moatStress.verdict}.`,
      url: absoluteUrl(base, "/api/moat-stress")
    }),
    stamp({
      id: "squad-choice",
      label: "Squad decision",
      status: input.squadOptimizer.readiness === "optimized" || input.squadOptimizer.readiness === "worth-swapping" ? "sealed" : "watch",
      score: input.squadOptimizer.optimizerScore,
      proof: `${input.squadOptimizer.readiness}; budget gap ${input.squadOptimizer.budgetGap}.`,
      url: absoluteUrl(base, "/api/squad-optimizer")
    }),
    stamp({
      id: "runtime-proof",
      label: "Runtime proof",
      status: hasSubmissionUrl(SUBMISSION_PROOF.deployedUrl) && hasSubmissionUrl(SUBMISSION_PROOF.ciWorkflowUrl) ? "sealed" : "missing",
      score: hasSubmissionUrl(SUBMISSION_PROOF.deployedUrl) && hasSubmissionUrl(SUBMISSION_PROOF.ciWorkflowUrl) ? 100 : 30,
      proof: `Cloud Run ${SUBMISSION_PROOF.deployedUrl || "missing"} / CI ${SUBMISSION_PROOF.ciWorkflowUrl || "missing"}.`,
      url: absoluteUrl(base, "/api/live-evidence")
    }),
    stamp({
      id: "a2a-surface",
      label: "A2A surface",
      status: selectedAgentIds.includes("market-broker") ? "sealed" : "missing",
      score: selectedAgentIds.includes("market-broker") ? 100 : 30,
      proof: selectedAgentIds.includes("market-broker") ? "A2A Market Broker is in the squad." : "A2A Market Broker is not selected.",
      url: absoluteUrl(base, "/.well-known/agent-card.json")
    }),
    stamp({
      id: "external-submit",
      label: "External submission URLs",
      status: external,
      proof:
        external === "sealed"
          ? "ProtoPedia作品URLと動画URLが入力されています。"
          : "ProtoPedia作品URLまたは動画URLが未入力です。",
      url: absoluteUrl(base, "/api/submission-launch")
    })
  ];
  const receiptScore = Math.round(clamp(average(stamps.map((item) => item.score))));
  const verdict = verdictFrom(stamps, receiptScore);
  const receiptId = `judge-demo-receipt-${receiptScore}-${verdict}`;
  const actions = actionsFrom(stamps);
  const payload: DemoReceiptDigestPayload = {
    receiptId,
    selectedAgentIds,
    receiptScore,
    verdict,
    stampStatuses: stamps.map((item) => ({ id: item.id, status: item.status, score: item.score })),
    integrityCheckIds: [...INTEGRITY_CHECK_IDS],
    externalUrls: {
      protopediaUrl,
      videoUrl
    }
  };
  const receiptDigest: DemoReceiptDigest = {
    algorithm: "sha256",
    digest: digest(payload),
    payload,
    verification: "Recompute sha256 over the stable JSON of digest.payload and compare it with digest.digest."
  };
  const integrityLock = buildIntegrityLock({
    baseUrl: base,
    projectBrief: input.recommendation.profile.brief,
    selectedAgentIds,
    stamps,
    verdict,
    receiptDigest
  });

  return {
    id: receiptId,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    receiptScore,
    verdict,
    headline:
      verdict === "sealed"
        ? "審査デモの主張、競合反論、編成判断、公開証拠、提出URLが1枚のreceiptで封印されています。"
        : verdict === "needs-external-submit"
          ? "デモ証拠は揃っています。最後にProtoPedia作品URLと動画URLを入れればreceiptをsealedにできます。"
          : "デモ証拠の一部が弱いです。watchまたはmissingのstampを先に直してください。",
    hardTruth:
      "優勝を狙うなら、機能を見せるだけでなく、審査員が再検証できる順番とdigestを残す必要があります。このreceiptはデモ実行の検収票です。",
    stamps,
    recordingOrder: [
      "Judge Tourで審査導線を確認する",
      "Squad Optimizerで編成判断を確認する",
      "Moat Stress Testで競合反論を確認する",
      "Live Evidence Monitorで公開証拠を確認する",
      "Submission Launch Gateで外部URLを確認する",
      "Judge Demo Receiptでdigestを控える"
    ],
    actions,
    digest: receiptDigest,
    integrityLock,
    a2aPayload: {
      method: "message/send",
      skill: "demo.receipt",
      receiptScore,
      verdict,
      digest: receiptDigest.digest,
      integrityLock: {
        readiness: integrityLock.readiness,
        integrityScore: integrityLock.integrityScore,
        checks: integrityLock.checks.map((item) => ({ id: item.id, status: item.status, score: item.score, url: item.url }))
      },
      stamps: stamps.map((item) => ({ id: item.id, status: item.status, score: item.score, url: item.url })),
      nextActions: actions.map((action) => ({ id: action.id, priority: action.priority, action: action.action })),
      endpoints: {
        app: base,
        demoReceipt: absoluteUrl(base, "/api/demo-receipt"),
        moatStress: absoluteUrl(base, "/api/moat-stress"),
        liveEvidence: absoluteUrl(base, "/api/live-evidence"),
        submissionLaunch: absoluteUrl(base, "/api/submission-launch")
      }
    }
  };
}
