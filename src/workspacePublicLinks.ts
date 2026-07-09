import { encodeAgentTrialEvidenceParam } from "./agentTrialEvidence.js";
import { encodeCustomAgentsParam } from "./customAgent.js";
import { encodeWorkspaceShareParam, WORKSPACE_SHARE_PARAM, type WorkspaceDraft } from "./workspaceDraft.js";

function stableWorkspacePublicFingerprint(workspace: WorkspaceDraft) {
  return JSON.stringify({
    version: workspace.version,
    activeTemplateId: workspace.activeTemplateId,
    projectBrief: workspace.projectBrief,
    selectedAgentIds: workspace.selectedAgentIds,
    customAgents: workspace.customAgents,
    agentTrialEvidence: workspace.agentTrialEvidence.map(({ attachedAt: _attachedAt, ...record }) => record),
    buyerScenario: workspace.buyerScenario,
    pilotRun: workspace.pilotRun,
    buyerWorkOrder: workspace.buyerWorkOrder,
    targetUrl: workspace.targetUrl,
    protopediaUrl: workspace.protopediaUrl,
    videoUrl: workspace.videoUrl,
    proofVerification: workspace.proofVerification
      ? {
          ...workspace.proofVerification,
          checkedAt: "public-sample"
        }
      : null
  });
}

export function workspaceMatchesPublicSample(workspace: WorkspaceDraft, publicSampleWorkspace: WorkspaceDraft | null | undefined) {
  if (!publicSampleWorkspace) return false;
  return stableWorkspacePublicFingerprint(workspace) === stableWorkspacePublicFingerprint(publicSampleWorkspace);
}

export function workspaceArtifactSearchParams(workspace: WorkspaceDraft) {
  const params = new URLSearchParams();
  params.set("brief", workspace.projectBrief);
  if (workspace.selectedAgentIds.length > 0) params.set("agents", workspace.selectedAgentIds.join(","));
  if (workspace.targetUrl) params.set("targetUrl", workspace.targetUrl);
  if (workspace.protopediaUrl) params.set("protopediaUrl", workspace.protopediaUrl);
  if (workspace.videoUrl) params.set("videoUrl", workspace.videoUrl);
  if (workspace.customAgents.length > 0) params.set("customAgents", encodeCustomAgentsParam(workspace.customAgents));
  if (workspace.agentTrialEvidence.length > 0) params.set("trialEvidence", encodeAgentTrialEvidenceParam(workspace.agentTrialEvidence));

  params.set("teamSize", String(workspace.buyerScenario.teamSize));
  params.set("hourlyCostYen", String(workspace.buyerScenario.hourlyCostYen));
  params.set("cyclesPerMonth", String(workspace.buyerScenario.cyclesPerMonth));
  params.set("manualHoursPerCycle", String(workspace.buyerScenario.manualHoursPerCycle));
  params.set("adoptionRatePercent", String(workspace.buyerScenario.adoptionRatePercent));
  params.set("incidentRiskYenPerMonth", String(workspace.buyerScenario.incidentRiskYenPerMonth));

  params.set("pilotManualMinutes", String(workspace.pilotRun.observedManualMinutes));
  params.set("pilotAssistedMinutes", String(workspace.pilotRun.observedAssistedMinutes));
  params.set("pilotParticipants", String(workspace.pilotRun.participants));
  params.set("pilotAcceptedTasks", String(workspace.pilotRun.acceptedTasks));
  params.set("pilotTotalTasks", String(workspace.pilotRun.totalTasks));
  if (workspace.pilotRun.evidenceUrl) params.set("pilotEvidenceUrl", workspace.pilotRun.evidenceUrl);
  if (workspace.pilotRun.reviewerName) params.set("pilotReviewer", workspace.pilotRun.reviewerName);
  if (workspace.pilotRun.notes) params.set("pilotNotes", workspace.pilotRun.notes);

  params.set("workOrder", workspace.buyerWorkOrder.request);
  if (workspace.buyerWorkOrder.targetUser) params.set("workOrderTargetUser", workspace.buyerWorkOrder.targetUser);
  params.set("workOrderSuccessMetric", workspace.buyerWorkOrder.successMetric);
  params.set("workOrderBaseline", workspace.buyerWorkOrder.currentBaseline);
  params.set("workOrderDataSensitivity", workspace.buyerWorkOrder.dataSensitivity);
  if (workspace.buyerWorkOrder.evidenceUrl) params.set("workOrderEvidenceUrl", workspace.buyerWorkOrder.evidenceUrl);

  return params;
}

export function workspaceArtifactQuerySuffix(workspace: WorkspaceDraft) {
  const query = workspaceArtifactSearchParams(workspace).toString();
  return query ? `?${query}` : "";
}

export function workspacePublicArtifactHref(pathname: string, workspace: WorkspaceDraft, currentHref: string, publicSampleWorkspace?: WorkspaceDraft) {
  const url = new URL(currentHref);
  url.pathname = pathname;
  url.search = "";
  if (workspaceMatchesPublicSample(workspace, publicSampleWorkspace)) {
    url.hash = "";
    return url.toString();
  }
  url.searchParams.set(WORKSPACE_SHARE_PARAM, encodeWorkspaceShareParam(workspace));
  url.hash = "";
  return url.toString();
}
