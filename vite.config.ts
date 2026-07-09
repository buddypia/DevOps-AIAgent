import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const QUICK_WORKFLOW_RECEIPT_MODULES = [
  "/src/quickBuyerDecisionReplyRecordReceipt.ts",
  "/src/quickBuyerEvidenceCloseoutReceiptImport.ts",
  "/src/quickBuyerEvidenceResponseOwnerPacketReceipt.ts",
  "/src/quickBuyerValidationAnswerRecordReceipt.ts",
  "/src/quickExternalReviewDecisionReceipt.ts",
  "/src/quickExternalReviewOwnerPacketReceipt.ts",
  "/src/quickExternalReviewPacketShare.ts",
  "/src/quickPublicValueReleaseReceipt.ts",
  "/src/quickValueRealizationAcceptanceReceipt.ts",
  "/src/quickValueRealizationCloseoutReceipt.ts",
  "/src/quickValueRealizationCloseoutRepairReceipt.ts",
  "/src/quickValueReviewExecutionCloseoutReceipt.ts",
  "/src/quickValueReviewExecutionReceipt.ts",
  "/src/quickWorkflowConversionReceipt.ts"
];

const APP_VALUE_DOMAIN_MODULES = [
  "/src/buyerValueCommitment.ts",
  "/src/buyerValueScenario.ts",
  "/src/buyerValueSensitivity.ts",
  "/src/buyerWorkOrder.ts"
];

const APP_PILOT_DOMAIN_MODULES = [
  "/src/buyerPilotCommand.ts",
  "/src/buyerPilotMeasuredRun.ts",
  "/src/buyerPilotMeasurementPlan.ts",
  "/src/buyerPilotRunCalibration.ts",
  "/src/pilotRunReceipt.ts"
];

const APP_WORKSPACE_DOMAIN_MODULES = [
  "/src/sampleWorkspace.ts",
  "/src/workspacePublicLinks.ts"
];

const APP_CORE_DOMAIN_MODULES = [
  "/src/agentEngine.ts",
  "/src/blueprintTemplates.ts",
  "/src/homepageOutcomeArtifactReceipt.ts",
  "/src/publicProofUrl.ts",
  "/src/sampleProofPaths.ts",
  "/src/submission.ts",
  "/src/valueBlueprint.ts",
  "/src/workflowIntake.ts"
];

function isSourceModule(id: string, modules: string[]) {
  return modules.some((modulePath) => id.includes(modulePath));
}

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 512,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("lucide-react")) return "icons-vendor";
          if (id.includes("lz-string")) return "compression-vendor";
          if (id.includes("react")) return "react-vendor";
          if (id.includes("/src/MarketHeroUnlockBrief.tsx")) return "market-hero-unlock";
          if (id.includes("/src/buyerOutcomeBrief.ts")) return "buyer-outcome-brief-domain";
          if (id.includes("/src/buyerEvidenceBoard.ts")) return "buyer-evidence-board-domain";
          if (id.includes("/src/buyerShareGate.ts")) return "buyer-share-gate-domain";
          if (id.includes("/src/launchRoom.ts")) return "launch-room-domain";
          if (id.includes("/src/proofTransformation.ts")) return "proof-transformation-domain";
          if (id.includes("/src/globalLaunchAudit.ts")) return "global-launch-audit-domain";
          if (id.includes("/src/buyerProofMonitor.ts") || id.includes("/src/buyerProofRecoveryPlan.ts") || id.includes("/src/homepageRouteLock.ts")) {
            return "buyer-proof-readiness-domain";
          }
          if (isSourceModule(id, QUICK_WORKFLOW_RECEIPT_MODULES)) return "quick-workflow-receipts";
          if (isSourceModule(id, APP_VALUE_DOMAIN_MODULES)) return "app-value-domain";
          if (isSourceModule(id, APP_PILOT_DOMAIN_MODULES)) return "app-pilot-domain";
          if (isSourceModule(id, APP_WORKSPACE_DOMAIN_MODULES)) return "app-workspace-domain";
          if (isSourceModule(id, APP_CORE_DOMAIN_MODULES)) return "app-core-domain";
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8080",
      "/a2a": "http://localhost:8080",
      "/.well-known": "http://localhost:8080",
      "/healthz": "http://localhost:8080"
    }
  }
});
