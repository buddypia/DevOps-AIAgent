import type { CompetitiveBattlecard } from "./competitiveBattlecard.js";
import type { JudgeProof, ProofStatus } from "./proof.js";
import type { ReleaseDriftGuard } from "./releaseDrift.js";
import { SUBMISSION_PROOF } from "./submission.js";

export type JudgeSnapshotReadiness = "first-click-ready" | "first-click-watch" | "submission-blocked";

export type JudgeSnapshotLink = {
  id: string;
  label: string;
  method: "GET" | "POST";
  url: string;
  purpose: string;
};

export type JudgeSnapshotPostApi = JudgeSnapshotLink & {
  curl: string;
};

export type JudgeSnapshot = {
  id: string;
  generatedAt: string;
  directOpen: true;
  readiness: JudgeSnapshotReadiness;
  headline: string;
  hardTruth: string;
  summary: {
    proofScore: number;
    battleScore: number;
    criteriaDuelScore: number;
    proofLockScore: number;
    ciStatus: ProofStatus;
    ciConclusion: string;
    agentCardSkillCount: number;
    releaseVerdict: ReleaseDriftGuard["verdict"] | "not-run";
    missingReleaseSignals: number;
  };
  links: JudgeSnapshotLink[];
  criteriaDuel: {
    judgeLine: string;
    rows: Array<{
      id: string;
      label: string;
      status: string;
      targetCompetitor: string;
      ourCounter: string;
      proofUrl: string;
      sourceCount: number;
      swotQuadrant: string;
      judgeLine: string;
    }>;
  };
  proofItems: Array<{
    id: string;
    label: string;
    status: ProofStatus;
    evidence: string;
    url?: string;
  }>;
  releaseLock: {
    verdict: ReleaseDriftGuard["verdict"] | "not-run";
    targetBaseUrl: string;
    missingSkills: string[];
    missingAgentCardSignals: string[];
    probes: Array<{ id: string; status: string; score: number; url: string }>;
  };
  postApis: JudgeSnapshotPostApi[];
  judgeScript: string[];
  a2aPayload: Record<string, unknown>;
};

function normalizeBase(url: string) {
  return url.replace(/\/$/, "");
}

function endpoint(baseUrl: string, path: string) {
  return `${normalizeBase(baseUrl)}${path}`;
}

function postCurl(url: string, projectBrief: string, selectedAgentIds: string[]) {
  const body = JSON.stringify({ projectBrief, selectedAgentIds });
  return `curl -s -X POST ${url} -H 'Content-Type: application/json' --data '${body}'`;
}

function readinessFor(input: { proof: JudgeProof; battlecard: CompetitiveBattlecard; releaseDrift?: ReleaseDriftGuard }): JudgeSnapshotReadiness {
  if (input.releaseDrift?.verdict === "release-blocked") return "submission-blocked";
  if (input.releaseDrift?.verdict === "deploy-drift") return "first-click-watch";
  if (input.proof.overallScore < 82 || input.battlecard.criteriaDuel.rows.length < 5) return "first-click-watch";
  return "first-click-ready";
}

export function buildJudgeSnapshot(input: {
  baseUrl: string;
  projectBrief: string;
  selectedAgentIds: string[];
  proof: JudgeProof;
  battlecard: CompetitiveBattlecard;
  agentCardSkillIds: string[];
  releaseDrift?: ReleaseDriftGuard;
  generatedAt?: string;
}): JudgeSnapshot {
  const baseUrl = normalizeBase(input.baseUrl);
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const readiness = readinessFor(input);
  const missingReleaseSignals = (input.releaseDrift?.missingSkills.length ?? 0) + (input.releaseDrift?.missingAgentCardSignals.length ?? 0);
  const judgeSnapshotUrl = endpoint(baseUrl, "/api/judge-snapshot");
  const proofUrl = endpoint(baseUrl, "/api/proof");
  const battlecardUrl = endpoint(baseUrl, "/api/competitive-battlecard");
  const releaseDriftUrl = endpoint(baseUrl, "/api/release-drift");
  const winnerPacketUrl = endpoint(baseUrl, "/api/winner-packet");
  const judgeCommandUrl = endpoint(baseUrl, "/api/judge-command-center");
  const acceptanceMatrixUrl = endpoint(baseUrl, "/api/acceptance-matrix");
  const targetBaseUrl = input.releaseDrift?.targetBaseUrl ?? SUBMISSION_PROOF.deployedUrl;

  const postApis: JudgeSnapshotPostApi[] = [
    {
      id: "judge-proof",
      label: "Judge Proof",
      method: "POST",
      url: proofUrl,
      purpose: "Gemini/Cloud Run/A2A/CI/提出準備を詳細検証する。",
      curl: postCurl(proofUrl, input.projectBrief, input.selectedAgentIds)
    },
    {
      id: "competitive-battlecard",
      label: "Competitive Battlecard",
      method: "POST",
      url: battlecardUrl,
      purpose: "競合分析、SWOT、Criteria Duel、反論台本を詳細検証する。",
      curl: postCurl(battlecardUrl, input.projectBrief, input.selectedAgentIds)
    },
    {
      id: "release-drift",
      label: "Release Drift Guard",
      method: "POST",
      url: releaseDriftUrl,
      purpose: "公開Cloud Runが最新Agent CardとA2A証拠を返すか検証する。",
      curl: postCurl(releaseDriftUrl, input.projectBrief, input.selectedAgentIds)
    },
    {
      id: "winner-packet",
      label: "Winner Packet",
      method: "POST",
      url: winnerPacketUrl,
      purpose: "審査5項目別の勝ち証拠packetを生成する。",
      curl: postCurl(winnerPacketUrl, input.projectBrief, input.selectedAgentIds)
    }
  ];

  const releaseVerdict = input.releaseDrift?.verdict ?? "not-run";
  const headline =
    readiness === "first-click-ready"
      ? "審査員がGETで直接開ける証拠スナップショットです。"
      : readiness === "first-click-watch"
        ? "直接開ける証拠はありますが、公開revisionまたは外部提出URLにwatchが残っています。"
        : "公開URLまたはCIの証拠が不足しており、提出前に復旧が必要です。";

  return {
    id: `judge-snapshot-${input.proof.overallScore}-${input.battlecard.criteriaDuel.duelScore}-${readiness}`,
    generatedAt,
    directOpen: true,
    readiness,
    headline,
    hardTruth:
      readiness === "first-click-ready"
        ? "POST専用APIの深い証拠を、初見審査員向けのGET入口に束ねています。"
        : "機能があっても、審査員が最初のクリックで読めない証拠はMVP体験として弱く見えます。",
    summary: {
      proofScore: input.proof.overallScore,
      battleScore: input.battlecard.battleScore,
      criteriaDuelScore: input.battlecard.criteriaDuel.duelScore,
      proofLockScore: input.battlecard.proofLock.proofScore,
      ciStatus: input.proof.ci.status,
      ciConclusion: input.proof.ci.conclusion,
      agentCardSkillCount: input.agentCardSkillIds.length,
      releaseVerdict,
      missingReleaseSignals
    },
    links: [
      {
        id: "judge-snapshot",
        label: "Public Judge Snapshot",
        method: "GET",
        url: judgeSnapshotUrl,
        purpose: "審査員がクリックで開く最初の証拠入口。"
      },
      {
        id: "app",
        label: "Cloud Run App",
        method: "GET",
        url: input.proof.links.app,
        purpose: "実装済みUIを確認する。"
      },
      {
        id: "agent-card",
        label: "A2A Agent Card",
        method: "GET",
        url: input.proof.links.agentCard,
        purpose: "公開skill surfaceとタグを確認する。"
      },
      {
        id: "ci",
        label: "GitHub Actions CI",
        method: "GET",
        url: input.proof.links.ci,
        purpose: "品質ゲートの公開証跡を確認する。"
      },
      {
        id: "github",
        label: "Public GitHub",
        method: "GET",
        url: input.proof.links.github,
        purpose: "提出リポジトリを確認する。"
      }
    ],
    criteriaDuel: {
      judgeLine: input.battlecard.criteriaDuel.judgeLine,
      rows: input.battlecard.criteriaDuel.rows.map((row) => ({
        id: row.id,
        label: row.label,
        status: row.status,
        targetCompetitor: row.targetCompetitor,
        ourCounter: row.ourCounter,
        proofUrl: row.proofUrl,
        sourceCount: row.sourceCount,
        swotQuadrant: row.swotSignal.quadrant,
        judgeLine: row.judgeLine
      }))
    },
    proofItems: input.proof.proofItems.map((item) => ({
      id: item.id,
      label: item.label,
      status: item.status,
      evidence: item.evidence,
      url: item.url
    })),
    releaseLock: {
      verdict: releaseVerdict,
      targetBaseUrl,
      missingSkills: input.releaseDrift?.missingSkills ?? [],
      missingAgentCardSignals: input.releaseDrift?.missingAgentCardSignals ?? [],
      probes: input.releaseDrift?.probes.map((probe) => ({ id: probe.id, status: probe.status, score: probe.score, url: probe.url })) ?? []
    },
    postApis,
    judgeScript: [
      "最初に /api/judge-snapshot をGETで開き、directOpen と readiness を見せる。",
      `Judge Proof score ${input.proof.overallScore} と Criteria Duel score ${input.battlecard.criteriaDuel.duelScore} を1画面で確認する。`,
      `Agent Card exposes ${input.agentCardSkillIds.length} skills; judge.snapshot:get-proof が公開revisionに載っているかをRelease Driftで確認する。`,
      `深掘りはPOST APIをcurlで再実行する: ${postApis.map((api) => api.label).join(" / ")}。`,
      releaseVerdict === "not-run"
        ? "公開revision driftはPOST /api/release-driftで最終確認する。"
        : `Release Drift verdict: ${releaseVerdict}; missing release signals ${missingReleaseSignals}.`
    ],
    a2aPayload: {
      method: "message/send",
      skill: "judge.snapshot",
      id: `judge-snapshot-${readiness}`,
      directOpen: true,
      readiness,
      proofScore: input.proof.overallScore,
      criteriaDuelScore: input.battlecard.criteriaDuel.duelScore,
      agentCardSkillCount: input.agentCardSkillIds.length,
      releaseVerdict,
      endpoints: {
        judgeSnapshot: judgeSnapshotUrl,
        judgeProof: proofUrl,
        competitiveBattlecard: battlecardUrl,
        releaseDrift: releaseDriftUrl,
        winnerPacket: winnerPacketUrl,
        judgeCommand: judgeCommandUrl,
        acceptanceMatrix: acceptanceMatrixUrl,
        agentCard: input.proof.links.agentCard
      }
    }
  };
}
