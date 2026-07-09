import type { WorkflowIntakeProofLinks } from "./workflowIntakeDraft.js";

export type BuyerPilotProofIntake = {
  targetUrl: string;
  protopediaUrl: string;
  videoUrl: string;
  pilotEvidenceUrl: string;
  workOrderEvidenceUrl: string;
};

export function mergeWorkflowProofIntake(current: BuyerPilotProofIntake, proofLinks: WorkflowIntakeProofLinks): BuyerPilotProofIntake {
  return {
    targetUrl: proofLinks.targetUrl?.trim() || current.targetUrl,
    protopediaUrl: proofLinks.protopediaUrl?.trim() || current.protopediaUrl,
    videoUrl: proofLinks.videoUrl?.trim() || current.videoUrl,
    pilotEvidenceUrl: proofLinks.pilotEvidenceUrl?.trim() || current.pilotEvidenceUrl,
    workOrderEvidenceUrl: proofLinks.workOrderEvidenceUrl?.trim() || current.workOrderEvidenceUrl
  };
}
