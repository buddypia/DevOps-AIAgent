import { Download, FileCheck2, FileText, ShieldCheck } from "lucide-react";
import type { QuickWorkflowCommercialPilotOffer, QuickWorkflowInputReadiness, QuickWorkflowValueDiagnosis } from "./QuickWorkflowIntakePanel";
import { buildQuickWorkflowValueAcceptanceContract, type QuickWorkflowValueAcceptanceContract } from "./quickWorkflowValueAcceptanceContract";
import type { WorkflowIntakeDraft } from "./workflowIntakeDraft";

type QuickWorkflowValueAcceptanceContractPanelProps = {
  draft: WorkflowIntakeDraft;
  readiness: QuickWorkflowInputReadiness;
  valueDiagnosis: QuickWorkflowValueDiagnosis;
  commercialPilotOffer: QuickWorkflowCommercialPilotOffer;
  contract?: QuickWorkflowValueAcceptanceContract;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function QuickWorkflowValueAcceptanceContractPanel({
  draft,
  readiness,
  valueDiagnosis,
  commercialPilotOffer,
  contract: providedContract
}: QuickWorkflowValueAcceptanceContractPanelProps) {
  const contract =
    providedContract ??
    buildQuickWorkflowValueAcceptanceContract({
      draft,
      readiness,
      valueDiagnosis,
      commercialPilotOffer
    });

  return (
    <div className={cx("quick-workflow-value-contract", contract.status)} aria-label="Value acceptance contract">
      <div className="quick-workflow-value-contract-main">
        <span>
          <FileCheck2 size={13} />
          Value acceptance contract
        </span>
        <strong>{contract.headline}</strong>
        <p>{contract.summary}</p>
        <div className="quick-workflow-value-contract-actions" aria-label="Value acceptance contract actions">
          <a href={contract.exportHref} download="quick-workflow-value-acceptance-contract.md">
            <Download size={14} />
            Export contract
          </a>
          <a href={contract.receipt.payloadHref} download={`${contract.receipt.receiptId}.json`}>
            <FileText size={14} />
            Receipt payload
          </a>
          <a href={contract.receipt.verificationRequestHref} download={`${contract.receipt.receiptId}-verify.json`}>
            <FileText size={14} />
            Verifier request
          </a>
          <a href={contract.receipt.verifierHref}>
            <ShieldCheck size={14} />
            Verify contract
          </a>
        </div>
      </div>
      <aside className="quick-workflow-value-contract-verdict" aria-label="Value acceptance contract verdict">
        <span>{contract.decision}</span>
        <strong>{contract.suggestedPilotPriceYen > 0 ? commercialPilotOffer.priceLine : "No paid contract"}</strong>
        <small>{contract.acceptanceLine}</small>
        <small>{contract.creditLine}</small>
      </aside>
      <div className="quick-workflow-value-contract-receipt" aria-label="Value acceptance contract receipt">
        <span>
          <ShieldCheck size={13} />
          Contract receipt
        </span>
        <strong>{contract.receipt.receiptId}</strong>
        <small>
          {contract.receipt.checksumAlgorithm}:{contract.receipt.checksum}
        </small>
      </div>
      <div className="quick-workflow-value-contract-gates" aria-label="Value acceptance contract gates">
        {contract.gates.map((gate) => (
          <article key={gate.id} className={gate.status}>
            <span>{gate.label}</span>
            <strong>{gate.requirement}</strong>
            <small>{gate.evidence}</small>
            <em>
              {gate.owner}: {gate.action}
            </em>
          </article>
        ))}
      </div>
      <div className="quick-workflow-value-contract-owner-actions" aria-label="Value acceptance contract owner actions">
        <span>Open owner actions</span>
        {(contract.ownerActions.length > 0 ? contract.ownerActions : contract.gates.slice(0, 1)).map((gate) => (
          <article key={gate.id} className={gate.status}>
            <strong>{gate.owner}</strong>
            <small>{gate.action}</small>
          </article>
        ))}
      </div>
    </div>
  );
}
