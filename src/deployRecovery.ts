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
        ? "非対話環境ではgcloudがログイン画面を出せないため、ローカルCloud Build submitは成功しません。GitHub Actionsの手動deploy laneか、人間のgcloud認証更新が必要です。"
        : readiness === "redeploy-required"
          ? "CIが緑でも、Cloud Runの公開revisionが古ければ審査員には新機能が存在しないように見えます。"
          : "healthまたはCIが欠けていると、再デプロイしても提出証拠として弱いままです。";
  const primaryAction =
    readiness === "recovered"
      ? "Release Drift Guardを録画前に再実行し、release-currentを検収票に残す"
      : readiness === "manual-auth-required"
        ? "GitHub ActionsのDeploy Cloud Run workflowを手動実行する。未設定ならローカルでgcloud auth loginを実行する"
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
      id: "verify-github-deploy-secrets",
      label: "Verify GitHub deploy secrets",
      command: "gh secret list | rg 'GCP_PROJECT_ID|GCP_WORKLOAD_IDENTITY_PROVIDER|GCP_DEPLOY_SERVICE_ACCOUNT'",
      why: "Deploy Cloud Run workflowが鍵ファイルなしでGoogle Cloudへ認証するために必要な3つのSecretsを確認します。",
      copyGroup: "auth",
      blocking: readiness === "manual-auth-required"
    },
    {
      id: "preview-github-actions-deploy-bootstrap",
      label: "Preview deploy auth bootstrap",
      command: "DRY_RUN=1 PROJECT_ID=$(gcloud config get-value project) REPO=buddypia/DevOps-AIAgent ./scripts/bootstrap_github_actions_deploy.sh",
      why: "Google Cloud IAMやGitHub Secretsを変更する前に、Workload Identity bootstrapが実行するコマンドを表示します。",
      copyGroup: "auth",
      blocking: false
    },
    {
      id: "bootstrap-github-actions-deploy",
      label: "Apply GitHub deploy auth bootstrap",
      command: "PROJECT_ID=$(gcloud config get-value project) REPO=buddypia/DevOps-AIAgent ./scripts/bootstrap_github_actions_deploy.sh",
      why: "Workload Identity Pool、OIDC Provider、deploy用Service Account、GitHub Secretsを1回で作成し、Deploy Cloud Run workflowを実行可能にします。",
      copyGroup: "auth",
      blocking: readiness === "manual-auth-required"
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
      id: "github-actions-deploy",
      label: "Deploy from GitHub Actions",
      command:
        "gh workflow run deploy-cloud-run.yml --ref main -f region=asia-northeast1 -f service=a2a-agent-marketplace -f repository=cloud-run-source-deploy -f gemini_secret=gemini-api-key-a2a-marketplace -f target_url=https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app",
      why: "ローカルgcloudの再認証に詰まった場合でも、Workload Identity設定済みのGitHub ActionsからCloud Buildを起動できます。",
      copyGroup: "deploy",
      blocking: readiness === "manual-auth-required"
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
      command: `curl -s ${targetBaseUrl}/.well-known/agent-card.json | jq '.skills[] | select(.id=="judge.rehearsal" or .id=="win.gap.radar" or .id=="winner.packet" or .id=="winner.sufficiency" or .id=="win.autopilot" or .id=="finalist.simulate" or .id=="competitive.battlecard" or .id=="competitive.snapshot" or .id=="judge.snapshot" or .id=="mvp.snapshot" or .id=="autonomy.snapshot" or .id=="observability.oracle" or .id=="acceptance.matrix" or .id=="recording.script" or .id=="pilot.value.snapshot" or .id=="deploy.recover") | {id, tags}'`,
      why: "Recording Lock、Feature Freeze Lock、Winner Release Lock、Finalist Release Drift、Criteria Duel、Competitive SWOT GET proof、Judge GET proof、MVP readiness GET proof、Acceptance Matrix GET proof、Autonomy Snapshot GET proof、Recording Script GET proof、Pilot Value GET proofが公開Agent Cardに載ったことを確認します。",
      copyGroup: "verify",
      blocking: input.releaseDrift.missingAgentCardSignals.length > 0
    },
    {
      id: "verify-mvp-readiness",
      label: "Verify MVP readiness endpoint",
      command: `curl -s ${targetBaseUrl}/api/mvp-readiness | jq '{readiness, mvp: .summary.mvpScore, acceptance: .summary.acceptanceScore, release: .summary.releaseVerdict}'`,
      why: "MVP Readiness Snapshotが公開revisionに載り、審査員がGETで提出可否を読めるか確認します。",
      copyGroup: "verify",
      blocking: false
    },
    {
      id: "verify-autonomy-snapshot",
      label: "Verify autonomy snapshot endpoint",
      command: `curl -s ${targetBaseUrl}/api/autonomy-snapshot | jq '{readiness, ledger: .summary.ledgerScore, task: .summary.taskScore, chain: .summary.verifiedChainCount}'`,
      why: "Autonomy Snapshotが公開revisionに載り、AIエージェント中心性をGETで直接読めるか確認します。",
      copyGroup: "verify",
      blocking: false
    },
    {
      id: "verify-recording-script",
      label: "Verify recording script endpoint",
      command: `curl -s ${targetBaseUrl}/api/recording-script | jq '{readiness, chapters: .summary.chapterCount, videoLock: .summary.videoLockReadiness}'`,
      why: "Recording Scriptが公開revisionに載り、録画担当者が30秒台本をGETで直接読めるか確認します。",
      copyGroup: "verify",
      blocking: false
    },
    {
      id: "verify-pilot-value",
      label: "Verify pilot value endpoint",
      command: `curl -s ${targetBaseUrl}/api/pilot-value | jq '{readiness, payback: .summary.paybackDays, firstValue: .summary.timeToValueSeconds}'`,
      why: "Pilot Value Snapshotが公開revisionに載り、実用性・体験価値・導入採算をGETで直接読めるか確認します。",
      copyGroup: "verify",
      blocking: false
    },
    {
      id: "verify-external-evidence-page",
      label: "Verify external evidence proof page",
      command: `curl -s ${targetBaseUrl}/external-evidence | rg 'External Evidence Proof|Submission URL Probes'`,
      why: "External EvidenceのGET証拠ページが公開revisionに載り、提出URL検証を審査員がPOSTなしで直接読めるか確認します。",
      copyGroup: "verify",
      blocking: false
    },
    {
      id: "verify-judge-command-page",
      label: "Verify judge command proof page",
      command: `curl -s ${targetBaseUrl}/judge-command-center | rg 'Judge Command Center Proof|90-Second Timeline'`,
      why: "Judge Command CenterのGET証拠ページが公開revisionに載り、審査員の最初の90秒導線をPOSTなしで直接読めるか確認します。",
      copyGroup: "verify",
      blocking: false
    },
    {
      id: "verify-acceptance-matrix-page",
      label: "Verify acceptance matrix proof page",
      command: `curl -s ${targetBaseUrl}/acceptance-matrix | rg 'Acceptance Matrix Proof|Acceptance Rows'`,
      why: "Acceptance MatrixのGET証拠ページが公開revisionに載り、MVP受入状態を審査員がPOSTなしで直接読めるか確認します。",
      copyGroup: "verify",
      blocking: false
    },
    {
      id: "verify-recovery-page",
      label: "Verify recovery proof page",
      command: `curl -s ${targetBaseUrl}/deploy-recovery | rg 'Deploy Recovery|Copy/Paste Commands'`,
      why: "Deploy Recoveryの審査員向けGET証拠ページが公開revisionに載ったことを確認します。",
      copyGroup: "verify",
      blocking: false
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
      command: `curl -s -X POST ${targetBaseUrl}/a2a -H 'Content-Type: application/json' --data '{"method":"message/send","params":{"text":"A2A Cloud Run Gemini DevOps"}}' | jq '.result.artifacts[0].parts[0].data | {deployRecoveryEndpoint, deployRecoveryPageEndpoint}'`,
      why: "A2A artifactがDeploy Recovery APIとGET証拠ページを公開しているかを確認します。",
      copyGroup: "verify",
      blocking: false
    }
  ];

  const steps: DeployRecoveryStep[] = [
    {
      id: "auth",
      window: "0-2m",
      owner: "Release owner",
      action: authBlocked ? "Deploy Cloud Run workflowのSecretsを確認し、未設定ならbootstrap scriptかgcloud auth loginで認証を更新する" : "gcloud account/projectまたはGitHub deploy workflowのSecretsを確認する",
      verify: authBlocked ? "gh secret list or ./scripts/bootstrap_github_actions_deploy.sh" : "gcloud config get-value project",
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
            action: "GitHub Actions Deploy Cloud Run workflowを実行する。Secrets未設定ならbootstrap scriptでWorkload Identityを作るか、gcloud auth loginで非対話Cloud Buildを再実行できる状態にする",
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
    `Auth: ${authBlocked ? "run GitHub Actions deploy workflow or refresh gcloud auth" : "no auth failure provided"}.`,
    `After deploy: verify Agent Card count, /win-autopilot, /winner-sufficiency, /observability-oracle, /api/mvp-readiness, /api/autonomy-snapshot, /api/recording-script, /api/pilot-value, /deploy-recovery, /api/deploy-recovery, and A2A autonomySnapshot/recordingScript/pilotValue/deployRecovery endpoints.`
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
      endpoint: `${baseUrl}/api/deploy-recovery`,
      pageEndpoint: `${baseUrl}/deploy-recovery`
    }
  };
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
  if (["recovered", "ready", "passed"].includes(status)) return "good";
  if (["blocked", "missing", "manual-auth-required"].includes(status)) return "bad";
  return "watch";
}

export function renderDeployRecoveryHtml(plan: DeployRecoveryPlan) {
  const metrics = [
    { label: "Readiness", value: plan.readiness, status: plan.readiness },
    { label: "Recovery Score", value: plan.recoveryScore, status: plan.readiness },
    { label: "Blocking Commands", value: plan.commands.filter((command) => command.blocking).length, status: plan.commands.some((command) => command.blocking) ? "blocked" : "ready" },
    { label: "Blockers", value: plan.blockers.length, status: plan.blockers.length > 0 ? "blocked" : "ready" }
  ]
    .map(
      (metric) => `
        <article class="metric ${tone(String(metric.status))}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>`
    )
    .join("");
  const checks = plan.checks
    .map(
      (check) => `
        <article class="card ${tone(check.status)}">
          <div><strong>${escapeHtml(check.label)}</strong><span>${escapeHtml(check.status)}</span></div>
          <p>${escapeHtml(check.evidence)}</p>
        </article>`
    )
    .join("");
  const commands = plan.commands
    .map(
      (command) => `
        <article class="command ${command.blocking ? "bad" : tone(command.copyGroup)}">
          <div><strong>${escapeHtml(command.label)}</strong><span>${escapeHtml(command.copyGroup)}${command.blocking ? " / blocking" : ""}</span></div>
          <p>${escapeHtml(command.why)}</p>
          <code>${escapeHtml(command.command)}</code>
        </article>`
    )
    .join("");
  const steps = plan.steps
    .map(
      (step) => `
        <tr>
          <td><strong>${escapeHtml(step.window)}</strong><span>${escapeHtml(step.status)}</span></td>
          <td>${escapeHtml(step.owner)}</td>
          <td>${escapeHtml(step.action)}</td>
          <td>${escapeHtml(step.verify)}</td>
        </tr>`
    )
    .join("");
  const blockers =
    plan.blockers.length === 0
      ? "<li>No active deploy blockers.</li>"
      : plan.blockers
          .map((blocker) => `<li><strong>${escapeHtml(blocker.id)}</strong> ${escapeHtml(blocker.action)} <small>${escapeHtml(blocker.proof)}</small></li>`)
          .join("");
  const script = plan.judgeScript.map((line) => `<li>${escapeHtml(line)}</li>`).join("");

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Deploy Recovery</title>
    <style>
      :root { color-scheme: light; --ink: #17201d; --muted: #5f6965; --line: #dce5df; --paper: #fbfcfa; --panel: #fff; --green: #13715d; --mint: #e6f4ed; --amber: #8a620d; --amber-bg: #fff4d4; --coral: #b24735; --coral-bg: #fff0ec; --blue: #245c99; }
      * { box-sizing: border-box; }
      body { margin: 0; background: var(--paper); color: var(--ink); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; }
      a { color: inherit; }
      header, main, footer { width: min(1120px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 40px 0 20px; }
      .eyebrow { color: var(--green); font-size: .78rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0; }
      h1 { margin: 8px 0 10px; font-size: clamp(2rem, 5vw, 4.2rem); line-height: 1; letter-spacing: 0; max-width: 980px; }
      h2 { margin: 28px 0 10px; font-size: 1.12rem; }
      p { color: var(--muted); }
      .metrics, .grid { display: grid; gap: 12px; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 22px; }
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .metric, .card, .command, .panel { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); padding: 16px; box-shadow: 0 10px 24px rgba(23, 32, 29, .06); min-width: 0; }
      .metric span, .card span, .command span { color: var(--muted); font-size: .74rem; font-weight: 900; text-transform: uppercase; }
      .metric strong { display: block; margin-top: 6px; font-size: 1.45rem; overflow-wrap: anywhere; }
      .card div, .command div { display: flex; gap: 12px; justify-content: space-between; align-items: start; }
      .card strong, .card p, .command strong, .command p, code, td, li { overflow-wrap: anywhere; }
      code { display: block; white-space: pre-wrap; padding: 10px; border-radius: 8px; background: #17201d; color: #eef8f4; font-size: .78rem; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      th, td { text-align: left; border-bottom: 1px solid var(--line); padding: 10px 8px; vertical-align: top; }
      th { font-size: .78rem; text-transform: uppercase; color: var(--muted); }
      td span, li small { display: block; color: var(--muted); font-size: .78rem; }
      .good { border-color: #a9d8c2; background: var(--mint); }
      .watch { border-color: #ead39a; background: var(--amber-bg); }
      .bad { border-color: #efb7aa; background: var(--coral-bg); }
      ol, ul { margin: 8px 0 0; padding-left: 20px; }
      footer { padding: 20px 0 40px; color: var(--muted); }
      @media (max-width: 860px) { .metrics, .grid { grid-template-columns: 1fr; } .card div, .command div { display: block; } table, thead, tbody, tr, th, td { display: block; } thead { display: none; } tr { border-top: 1px solid var(--line); padding: 8px 0; } td { border-bottom: 0; padding: 8px 0; } }
    </style>
  </head>
  <body>
    <header>
      <div class="eyebrow">Deploy Recovery</div>
      <h1>${escapeHtml(plan.headline)}</h1>
      <p>${escapeHtml(plan.hardTruth)}</p>
      <section class="metrics">${metrics}</section>
    </header>
    <main>
      <section class="panel ${tone(plan.readiness)}">
        <h2>Primary Action</h2>
        <p>${escapeHtml(plan.primaryAction)}</p>
      </section>
      <h2>Recovery Checks</h2>
      <section class="grid">${checks}</section>
      <h2>Copy/Paste Commands</h2>
      <section class="grid">${commands}</section>
      <h2>10-Minute Recovery Steps</h2>
      <section class="panel">
        <table>
          <thead><tr><th>Window</th><th>Owner</th><th>Action</th><th>Verify</th></tr></thead>
          <tbody>${steps}</tbody>
        </table>
      </section>
      <h2>Blockers</h2>
      <section class="panel bad"><ul>${blockers}</ul></section>
      <h2>Judge Script</h2>
      <section class="panel"><ol>${script}</ol></section>
    </main>
    <footer>${escapeHtml(plan.id)} / A2A skill deploy.recover</footer>
  </body>
</html>`;
}
