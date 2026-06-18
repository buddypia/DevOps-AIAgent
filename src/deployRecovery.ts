import type { ReleaseDriftGuard } from "./releaseDrift.js";

export type DeployRecoveryReadiness = "recovered" | "manual-auth-required" | "redeploy-required" | "blocked";
export type DeployRecoveryStatus = "ready" | "watch" | "blocked";

export type DeployRecoveryCheck = {
  id: string;
  label: string;
  status: DeployRecoveryStatus;
  evidence: string;
};

export type DeployRecoveryCommand = {
  id: string;
  label: string;
  command: string;
  why: string;
  copyGroup: "auth" | "deploy" | "verify";
  blocking: boolean;
};

export type DeployRecoveryStep = {
  id: string;
  window: string;
  owner: string;
  action: string;
  verify: string;
  status: DeployRecoveryStatus;
};

export type DeployRecoveryBlocker = {
  id: string;
  priority: "now" | "next";
  owner: string;
  action: string;
  proof: string;
};

export type DeployRecoveryPlan = {
  id: string;
  recoveryScore: number;
  readiness: DeployRecoveryReadiness;
  headline: string;
  hardTruth: string;
  primaryAction: string;
  checks: DeployRecoveryCheck[];
  commands: DeployRecoveryCommand[];
  steps: DeployRecoveryStep[];
  blockers: DeployRecoveryBlocker[];
  judgeScript: string[];
  a2aPayload: Record<string, unknown>;
};

function normalizeBase(url: string) {
  return url.replace(/\/$/, "");
}

function detectAuthBlocker(lastDeployError?: string) {
  const text = (lastDeployError ?? "").toLowerCase();
  return text.includes("reauthentication failed") || text.includes("gcloud auth login") || text.includes("cannot prompt") || text.includes("auth tokens");
}

function statusFromReadiness(readiness: DeployRecoveryReadiness): DeployRecoveryStatus {
  if (readiness === "recovered") return "ready";
  if (readiness === "blocked") return "blocked";
  return "watch";
}

function scoreFor(readiness: DeployRecoveryReadiness, releaseDrift: ReleaseDriftGuard) {
  if (readiness === "recovered") return 100;
  if (readiness === "manual-auth-required") return 73;
  if (readiness === "redeploy-required") return Math.max(70, Math.min(86, releaseDrift.driftScore + 10));
  return Math.min(54, releaseDrift.driftScore);
}

function blockerFromDrift(action: ReleaseDriftGuard["nextActions"][number]): DeployRecoveryBlocker {
  return {
    id: action.id,
    priority: action.priority,
    owner: action.owner,
    action: action.action,
    proof: action.proof
  };
}

export function buildDeployRecoveryPlan(input: {
  baseUrl: string;
  releaseDrift: ReleaseDriftGuard;
  lastDeployError?: string;
}): DeployRecoveryPlan {
  const baseUrl = normalizeBase(input.baseUrl);
  const targetBaseUrl = normalizeBase(input.releaseDrift.targetBaseUrl);
  const authBlocked = detectAuthBlocker(input.lastDeployError);
  const readiness: DeployRecoveryReadiness =
    input.releaseDrift.verdict === "release-current"
      ? "recovered"
      : authBlocked
        ? "manual-auth-required"
        : input.releaseDrift.verdict === "release-blocked"
          ? "blocked"
          : "redeploy-required";
  const recoveryScore = scoreFor(readiness, input.releaseDrift);
  const headline =
    readiness === "recovered"
      ? "公開Cloud Runは最新の審査証拠を返しています。"
      : readiness === "manual-auth-required"
        ? "コードではなくgcloud認証が再デプロイを止めています。"
        : readiness === "redeploy-required"
          ? "Cloud Buildで最新mainを公開Cloud Runへ出せばdriftを解消できます。"
          : "公開URLまたはCIの復旧が先です。";
  const hardTruth =
    readiness === "recovered"
      ? "Judge Command Center、Agent Card、A2A artifactを公開URLでそのまま見せられます。"
      : readiness === "manual-auth-required"
        ? "非対話環境ではgcloudがログイン画面を出せないため、Cloud Build submitは成功しません。人間が一度だけ認証を更新する必要があります。"
        : readiness === "redeploy-required"
          ? "CIが緑でも、Cloud Runの公開revisionが古ければ審査員には新機能が存在しないように見えます。"
          : "healthまたはCIが欠けていると、再デプロイしても提出証拠として弱いままです。";
  const primaryAction =
    readiness === "recovered"
      ? "Release Drift Guardを録画前に再実行し、release-currentを検収票に残す"
      : readiness === "manual-auth-required"
        ? "ローカルでgcloud auth loginを実行し、同じCloud Buildコマンドを再実行する"
        : readiness === "redeploy-required"
          ? "Cloud BuildでCloud Runへ最新mainを再デプロイする"
          : "target health、GitHub Actions CI、A2A artifactのmissing証拠を先に復旧する";

  const checks: DeployRecoveryCheck[] = [
    {
      id: "target-health",
      label: "Target health",
      status: input.releaseDrift.probes.find((probe) => probe.id === "target-health")?.status === "passed" ? "ready" : "blocked",
      evidence: input.releaseDrift.probes.find((probe) => probe.id === "target-health")?.evidence ?? "Target health was not probed."
    },
    {
      id: "skill-surface",
      label: "Skill surface",
      status: input.releaseDrift.missingSkills.length === 0 ? "ready" : "blocked",
      evidence: `${input.releaseDrift.observedSkillCount}/${input.releaseDrift.expectedSkillCount} skills; missing ${input.releaseDrift.missingSkills.join(", ") || "none"}.`
    },
    {
      id: "agent-card-signals",
      label: "Agent Card required signals",
      status: input.releaseDrift.missingAgentCardSignals.length === 0 ? "ready" : "blocked",
      evidence: `missing ${input.releaseDrift.missingAgentCardSignals.join(", ") || "none"}.`
    },
    {
      id: "cloud-build-auth",
      label: "Cloud Build auth",
      status: authBlocked ? "blocked" : "watch",
      evidence: authBlocked ? "Last deploy attempt reported gcloud reauthentication failure." : "No local gcloud auth failure was provided to this plan."
    },
    {
      id: "a2a-artifact",
      label: "A2A artifact",
      status: input.releaseDrift.probes.find((probe) => probe.id === "a2a-artifact")?.status === "passed" ? "ready" : "watch",
      evidence: input.releaseDrift.probes.find((probe) => probe.id === "a2a-artifact")?.evidence ?? "A2A artifact was not probed."
    },
    {
      id: "ci-main",
      label: "Latest main CI",
      status: input.releaseDrift.probes.find((probe) => probe.id === "ci-main")?.status === "passed" ? "ready" : "blocked",
      evidence: input.releaseDrift.probes.find((probe) => probe.id === "ci-main")?.evidence ?? "CI was not probed."
    }
  ];

  const commands: DeployRecoveryCommand[] = [
    {
      id: "auth-login",
      label: "Refresh gcloud auth",
      command: "gcloud auth login",
      why: "非対話実行でreauthentication failedになった場合に一度だけ必要です。",
      copyGroup: "auth",
      blocking: readiness === "manual-auth-required"
    },
    {
      id: "project-check",
      label: "Confirm active project",
      command: "gcloud config get-value project",
      why: "誤ったGoogle Cloud projectへデプロイしないための確認です。",
      copyGroup: "auth",
      blocking: false
    },
    {
      id: "cloud-build-submit",
      label: "Deploy latest main",
      command:
        "gcloud builds submit --config cloudbuild.yaml --substitutions _REGION=asia-northeast1,_SERVICE=a2a-agent-marketplace,_REPOSITORY=cloud-run-source-deploy,_GEMINI_SECRET=gemini-api-key-a2a-marketplace",
      why: "最新mainをCloud Build経由でCloud Runへ反映します。",
      copyGroup: "deploy",
      blocking: readiness !== "recovered"
    },
    {
      id: "verify-agent-card",
      label: "Verify Agent Card count",
      command: `curl -s ${targetBaseUrl}/.well-known/agent-card.json | jq '.skills | length'`,
      why: "公開URLが最新skill surfaceを返しているかを数で確認します。",
      copyGroup: "verify",
      blocking: false
    },
    {
      id: "verify-agent-card-signals",
      label: "Verify Agent Card signals",
      command: `curl -s ${targetBaseUrl}/.well-known/agent-card.json | jq '.skills[] | select(.id=="judge.rehearsal" or .id=="win.gap.radar") | {id, tags}'`,
      why: "Recording LockとFeature Freeze Lockが公開Agent Cardに載ったことを確認します。",
      copyGroup: "verify",
      blocking: input.releaseDrift.missingAgentCardSignals.length > 0
    },
    {
      id: "verify-recovery-endpoint",
      label: "Verify recovery endpoint",
      command: `curl -s -X POST ${targetBaseUrl}/api/deploy-recovery -H 'Content-Type: application/json' --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}' | jq '{readiness, recoveryScore}'`,
      why: "Deploy Recovery自体が公開revisionに載ったことを確認します。",
      copyGroup: "verify",
      blocking: false
    },
    {
      id: "verify-a2a-artifact",
      label: "Verify A2A endpoint",
      command: `curl -s -X POST ${targetBaseUrl}/a2a -H 'Content-Type: application/json' --data '{"method":"message/send","params":{"text":"A2A Cloud Run Gemini DevOps"}}' | jq '.result.artifacts[0].parts[0].data.deployRecoveryEndpoint'`,
      why: "A2A artifactがDeploy Recovery endpointを公開しているかを確認します。",
      copyGroup: "verify",
      blocking: false
    }
  ];

  const steps: DeployRecoveryStep[] = [
    {
      id: "auth",
      window: "0-2m",
      owner: "Release owner",
      action: authBlocked ? "gcloud auth loginで認証を更新する" : "gcloud account/projectを確認する",
      verify: "gcloud config get-value project",
      status: authBlocked ? "blocked" : "watch"
    },
    {
      id: "deploy",
      window: "2-8m",
      owner: "Cloud Run SRE",
      action: "Cloud Buildで最新mainをCloud Runへデプロイする",
      verify: "Cloud Build success and Cloud Run revision updated",
      status: readiness === "recovered" ? "ready" : "watch"
    },
    {
      id: "skill-surface",
      window: "8-9m",
      owner: "A2A Market Broker",
      action: "Agent Card skill count、deploy.recover skill、required signal tagsを確認する",
      verify: `${targetBaseUrl}/.well-known/agent-card.json`,
      status: input.releaseDrift.missingSkills.length === 0 && input.releaseDrift.missingAgentCardSignals.length === 0 ? "ready" : "blocked"
    },
    {
      id: "acceptance",
      window: "9-10m",
      owner: "Submission owner",
      action: "Acceptance MatrixとJudge Command Centerを再実行する",
      verify: `${baseUrl}/api/acceptance-matrix`,
      status: readiness === "recovered" ? "ready" : "watch"
    }
  ];

  const blockers: DeployRecoveryBlocker[] = [
    ...(authBlocked
      ? [
          {
            id: "gcloud-auth",
            priority: "now" as const,
            owner: "Release owner",
            action: "gcloud auth loginで非対話Cloud Buildを再実行できる状態にする",
            proof: input.lastDeployError ?? "gcloud reauthentication failed"
          }
        ]
      : []),
    ...(input.releaseDrift.missingAgentCardSignals.length > 0
      ? [
          {
            id: "agent-card-signals",
            priority: "now" as const,
            owner: "Cloud Run SRE",
            action: "最新mainをCloud Runへ反映し、Agent Cardのrequired signal tagsを再検証する",
            proof: `missing ${input.releaseDrift.missingAgentCardSignals.join(", ")}`
          }
        ]
      : []),
    ...input.releaseDrift.nextActions.map(blockerFromDrift)
  ];

  const judgeScript = [
    `Deploy recovery: ${headline}`,
    `Primary action: ${primaryAction}`,
    `Release drift: ${input.releaseDrift.observedSkillCount}/${input.releaseDrift.expectedSkillCount} skills, ${input.releaseDrift.verdict}.`,
    `Agent Card signals: missing ${input.releaseDrift.missingAgentCardSignals.join(", ") || "none"}.`,
    `Auth: ${authBlocked ? "manual gcloud auth login required" : "no auth failure provided"}.`,
    `After deploy: verify Agent Card count, /api/deploy-recovery, and A2A deployRecoveryEndpoint.`
  ];

  return {
    id: `deploy-recovery-${recoveryScore}-${readiness}`,
    recoveryScore,
    readiness,
    headline,
    hardTruth,
    primaryAction,
    checks,
    commands,
    steps,
    blockers,
    judgeScript,
    a2aPayload: {
      method: "message/send",
      skill: "deploy.recover",
      recoveryScore,
      readiness,
      primaryAction,
      releaseDrift: {
        verdict: input.releaseDrift.verdict,
        expectedSkillCount: input.releaseDrift.expectedSkillCount,
        observedSkillCount: input.releaseDrift.observedSkillCount,
        missingSkills: input.releaseDrift.missingSkills,
        missingAgentCardSignals: input.releaseDrift.missingAgentCardSignals
      },
      commands: commands.map((command) => ({ id: command.id, copyGroup: command.copyGroup, blocking: command.blocking })),
      blockers: blockers.map((blocker) => ({ id: blocker.id, priority: blocker.priority, action: blocker.action })),
      endpoint: `${baseUrl}/api/deploy-recovery`
    }
  };
}
