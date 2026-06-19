export type ReleaseDriftStatus = "passed" | "watch" | "missing";
export type ReleaseDriftVerdict = "release-current" | "deploy-drift" | "release-blocked";

export type ReleaseDriftProbe = {
  id: string;
  label: string;
  status: ReleaseDriftStatus;
  score: number;
  url: string;
  evidence: string;
  required: boolean;
  expected?: string;
  observed?: string;
  latencyMs?: number;
};

export type ReleaseDriftAction = {
  id: string;
  priority: "now" | "next";
  owner: string;
  action: string;
  proof: string;
};

export type ReleaseDriftGuard = {
  id: string;
  generatedAt: string;
  driftScore: number;
  verdict: ReleaseDriftVerdict;
  summary: string;
  hardTruth: string;
  currentBaseUrl: string;
  targetBaseUrl: string;
  expectedSkillCount: number;
  observedSkillCount: number;
  missingSkills: string[];
  missingAgentCardSignals: string[];
  probes: ReleaseDriftProbe[];
  nextActions: ReleaseDriftAction[];
  runbook: string[];
  a2aPayload: Record<string, unknown>;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeBase(url: string) {
  return url.replace(/\/$/, "");
}

function statusScore(status: ReleaseDriftStatus) {
  if (status === "passed") return 100;
  if (status === "watch") return 70;
  return 24;
}

function driftVerdict(probes: ReleaseDriftProbe[], missingSkills: string[], missingAgentCardSignals: string[]): ReleaseDriftVerdict {
  const health = probes.find((probe) => probe.id === "target-health");
  const ci = probes.find((probe) => probe.id === "ci-main");
  if (health?.status === "missing" || ci?.status === "missing") return "release-blocked";
  if (missingSkills.length > 0 || missingAgentCardSignals.length > 0) return "deploy-drift";
  if (probes.some((probe) => probe.required && probe.status !== "passed")) return "deploy-drift";
  return "release-current";
}

function actionFromProbe(probe: ReleaseDriftProbe): ReleaseDriftAction {
  const deployRelated =
    probe.id === "agent-card-skill-surface" ||
    probe.id === "acceptance-endpoint" ||
    probe.id === "mvp-readiness-endpoint" ||
    probe.id === "autonomy-snapshot-endpoint" ||
    probe.id === "recording-script-endpoint" ||
    probe.id === "architecture-pack-endpoint" ||
    probe.id === "submission-launch-endpoint" ||
    probe.id === "pilot-value-endpoint" ||
    probe.id === "objection-arena-endpoint" ||
    probe.id === "first-click-smoke-endpoint" ||
    probe.id === "a2a-artifact";
  return {
    id: probe.id,
    priority: probe.status === "missing" || deployRelated ? "now" : "next",
    owner: deployRelated ? "Cloud Run SRE" : probe.id === "ci-main" ? "GitHub Actions" : "Release owner",
    action: deployRelated
      ? "最新mainをCloud BuildでCloud Runへ再デプロイし、公開Agent CardとA2A artifactを再検証する"
      : probe.status === "missing"
        ? `${probe.label}を提出前に復旧する`
        : `${probe.label}のwatch証拠をJudge Proofに貼れる状態へ上げる`,
    proof: probe.evidence
  };
}

export function buildReleaseDriftGuard(input: {
  currentBaseUrl: string;
  targetBaseUrl: string;
  expectedSkillIds: string[];
  observedSkillIds: string[];
  requiredSkillIds: string[];
  requiredAgentCardSignals?: string[];
  observedAgentCardSignals?: string[];
  probes: ReleaseDriftProbe[];
  generatedAt?: string;
}): ReleaseDriftGuard {
  const currentBaseUrl = normalizeBase(input.currentBaseUrl);
  const targetBaseUrl = normalizeBase(input.targetBaseUrl);
  const expectedSkillIds = Array.from(new Set(input.expectedSkillIds)).sort();
  const observedSkillIds = Array.from(new Set(input.observedSkillIds)).sort();
  const requiredSkillIds = Array.from(new Set(input.requiredSkillIds)).sort();
  const requiredAgentCardSignals = Array.from(new Set(input.requiredAgentCardSignals ?? [])).sort();
  const observedAgentCardSignals = Array.from(new Set(input.observedAgentCardSignals ?? [])).sort();
  const missingSkills = requiredSkillIds.filter((skill) => !observedSkillIds.includes(skill));
  const missingAgentCardSignals = requiredAgentCardSignals.filter((signal) => !observedAgentCardSignals.includes(signal));
  const probes = input.probes.map((probe) => ({
    ...probe,
    score: Math.round(clamp(probe.score || statusScore(probe.status)))
  }));
  const driftScore = Math.round(
    clamp(
      average(probes.map((probe) => probe.score)) * 0.72 +
        clamp((observedSkillIds.length / Math.max(1, expectedSkillIds.length)) * 100, 0, 100) * 0.18 +
        clamp(100 - missingSkills.length * 12 - missingAgentCardSignals.length * 16, 0, 100) * 0.1
    )
  );
  const verdict = driftVerdict(probes, missingSkills, missingAgentCardSignals);
  const nextActions = probes.filter((probe) => probe.status !== "passed").map(actionFromProbe);
  const id = `release-drift-${driftScore}-${verdict}`;

  return {
    id,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    driftScore,
    verdict,
    summary:
      verdict === "release-current"
        ? `Public Cloud Run is current: ${observedSkillIds.length}/${expectedSkillIds.length} skills visible.`
        : verdict === "deploy-drift"
          ? `Public Cloud Run is stale: ${missingSkills.length} required skills and ${missingAgentCardSignals.length} required Agent Card signals are not visible on the deployed URL.`
          : "Public release is blocked: health or CI evidence is missing.",
    hardTruth:
      verdict === "release-current"
        ? "提出URLは最新のAgent Card、A2A artifact、Acceptance Matrixを公開できています。"
        : verdict === "deploy-drift"
          ? "GitHub/CIが緑でも、公開Cloud Runが古いrevisionなら審査員には未実装に見えます。提出前に再デプロイが必要です。"
          : "公開URLまたはCIが落ちているため、MVPの実装力を提出物として証明できません。",
    currentBaseUrl,
    targetBaseUrl,
    expectedSkillCount: expectedSkillIds.length,
    observedSkillCount: observedSkillIds.length,
    missingSkills,
    missingAgentCardSignals,
    probes,
    nextActions,
    runbook: [
      "DRY_RUN=1 PROJECT_ID=$(gcloud config get-value project) REPO=buddypia/DevOps-AIAgent ./scripts/bootstrap_github_actions_deploy.sh",
      "PROJECT_ID=$(gcloud config get-value project) REPO=buddypia/DevOps-AIAgent ./scripts/bootstrap_github_actions_deploy.sh",
      "gh workflow run deploy-cloud-run.yml --ref main -f region=asia-northeast1 -f service=a2a-agent-marketplace -f repository=cloud-run-source-deploy -f gemini_secret=gemini-api-key-a2a-marketplace -f target_url=https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app",
      "gcloud auth login",
      "gcloud builds submit --config cloudbuild.yaml --substitutions _REGION=asia-northeast1,_SERVICE=a2a-agent-marketplace,_REPOSITORY=cloud-run-source-deploy,_GEMINI_SECRET=gemini-api-key-a2a-marketplace",
      `curl -s ${targetBaseUrl}/.well-known/agent-card.json | jq '.skills | length'`,
      `curl -s ${targetBaseUrl}/.well-known/agent-card.json | jq '.skills[] | select(.id=="judge.command" or .id=="judge.rehearsal" or .id=="win.gap.radar" or .id=="winner.packet" or .id=="winner.sufficiency" or .id=="win.autopilot" or .id=="judge.objection-arena" or .id=="finalist.simulate" or .id=="competitive.battlecard" or .id=="competitive.snapshot" or .id=="judge.snapshot" or .id=="judge.first-click" or .id=="mvp.snapshot" or .id=="autonomy.snapshot" or .id=="external.evidence" or .id=="recording.script" or .id=="submission.launch" or .id=="submission.package" or .id=="pilot.value.snapshot" or .id=="deploy.recover") | {id, tags}'`,
      `curl -s ${targetBaseUrl}/ | rg 'Judge first click|Start with proof, not feature hunting'`,
      `curl -s ${targetBaseUrl}/win-autopilot | rg 'Win Autopilot Proof|Evidence Lanes'`,
      `curl -s ${targetBaseUrl}/winner-sufficiency | rg 'Winner Sufficiency Lock|Sufficiency Checks'`,
      `curl -s ${targetBaseUrl}/api/mvp-readiness | jq '{readiness, mvp: .summary.mvpScore, acceptance: .summary.acceptanceScore, release: .summary.releaseVerdict}'`,
      `curl -s ${targetBaseUrl}/api/autonomy-snapshot | jq '{readiness, ledger: .summary.ledgerScore, task: .summary.taskScore, chain: .summary.verifiedChainCount}'`,
      `curl -s ${targetBaseUrl}/observability-oracle | rg 'Observability Oracle Proof|Operate Loop'`,
      `curl -s ${targetBaseUrl}/judge-command-center | rg 'Judge Command Center Proof|90-Second Timeline'`,
      `curl -s ${targetBaseUrl}/api/judge-command-center | jq '{readiness, commandScore, buttons: (.proofButtons | length), blockers: (.blockers | length)}'`,
      `curl -s ${targetBaseUrl}/external-evidence | rg 'External Evidence Proof|Submission URL Probes'`,
      `curl -s ${targetBaseUrl}/api/external-evidence | jq '{readiness, evidenceScore, finalUrlsReady: .a2aPayload.finalUrlsReady}'`,
      `curl -s ${targetBaseUrl}/api/recording-script | jq '{readiness, chapters: .summary.chapterCount, videoLock: .summary.videoLockReadiness}'`,
      `curl -s ${targetBaseUrl}/api/architecture-pack | jq '{readiness, architectureScore, nodes: (.nodes | length), requirements: (.requirements | length)}'`,
      `curl -s ${targetBaseUrl}/api/submission-launch | jq '{readiness, launchScore, finalSubmitLock: .finalSubmitLock.readiness}'`,
      `curl -s ${targetBaseUrl}/api/pilot-value | jq '{readiness, payback: .summary.paybackDays, firstValue: .summary.timeToValueSeconds}'`,
      `curl -s ${targetBaseUrl}/api/objection-arena | jq '{readiness, arenaScore, answered: .lock.answeredCount, blocked: .lock.blockedCount}'`,
      `curl -s ${targetBaseUrl}/api/first-click-smoke | jq '{readiness, smokeScore, passedCount, missingCount}'`,
      `curl -s ${targetBaseUrl}/deploy-recovery | rg 'Deploy Recovery|Copy/Paste Commands'`,
      `curl -s -X POST ${targetBaseUrl}/api/acceptance-matrix -H 'Content-Type: application/json' --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}' | jq '{verdict, acceptanceScore, rows: (.rows | length)}'`,
      `curl -s -X POST ${targetBaseUrl}/a2a -H 'Content-Type: application/json' --data '{"method":"message/send","params":{"text":"A2A Cloud Run Gemini DevOps"}}' | jq '.result.artifacts[0].parts[0].data.releaseDriftEndpoint'`
    ],
    a2aPayload: {
      method: "message/send",
      skill: "release.drift",
      id,
      verdict,
      driftScore,
      targetBaseUrl,
      expectedSkillCount: expectedSkillIds.length,
      observedSkillCount: observedSkillIds.length,
      missingSkills,
      missingAgentCardSignals,
      probes: probes.map((probe) => ({ id: probe.id, status: probe.status, score: probe.score, url: probe.url })),
      nextActions: nextActions.map((action) => ({ id: action.id, priority: action.priority, action: action.action })),
      endpoints: {
        currentAgentCard: `${currentBaseUrl}/.well-known/agent-card.json`,
        targetAgentCard: `${targetBaseUrl}/.well-known/agent-card.json`,
        releaseDrift: `${currentBaseUrl}/api/release-drift`,
        targetAcceptanceMatrix: `${targetBaseUrl}/api/acceptance-matrix`,
        targetFirstClickRoot: `${targetBaseUrl}/`,
        targetMvpReadiness: `${targetBaseUrl}/api/mvp-readiness`,
        targetAutonomySnapshot: `${targetBaseUrl}/api/autonomy-snapshot`,
        targetObservabilityOraclePage: `${targetBaseUrl}/observability-oracle`,
        targetRecordingScript: `${targetBaseUrl}/api/recording-script`,
        targetArchitecturePack: `${targetBaseUrl}/api/architecture-pack`,
        targetSubmissionLaunch: `${targetBaseUrl}/api/submission-launch`,
        targetPilotValue: `${targetBaseUrl}/api/pilot-value`,
        targetObjectionArena: `${targetBaseUrl}/api/objection-arena`,
        targetFirstClickSmoke: `${targetBaseUrl}/api/first-click-smoke`,
        targetWinAutopilotPage: `${targetBaseUrl}/win-autopilot`,
        targetWinnerSufficiencyPage: `${targetBaseUrl}/winner-sufficiency`,
        targetDeployRecoveryPage: `${targetBaseUrl}/deploy-recovery`
      }
    }
  };
}
