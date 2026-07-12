import { useEffect, useState } from "react";

interface WorkflowDiagramProps {
  activeStep?: number | null; // null or 0 to 4
  statusText?: string;
}

export default function WorkflowDiagram({ activeStep = null, statusText }: WorkflowDiagramProps) {
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    if (activeStep !== undefined) {
      setStep(activeStep);
    }
  }, [activeStep]);

  // 各ノードのアクティブ/完了状態を判定するヘルパー
  const getNodeClass = (nodeId: string) => {
    if (step === null) return "svg-node";
    
    switch (nodeId) {
      case "node-alert":
        return step === 0 ? "svg-node is-danger" : "svg-node is-done";
      case "node-gemini":
        if (step === 1 || step === 3) return "svg-node is-active";
        return step > 3 ? "svg-node is-done" : (step > 1 ? "svg-node is-done" : "svg-node");
      case "node-obs":
        if (step === 2) return "svg-node is-active";
        return step > 2 ? "svg-node is-done" : "svg-node";
      case "node-test":
        if (step === 3) return "svg-node is-active";
        return step > 3 ? "svg-node is-done" : "svg-node";
      case "node-sre":
        if (step === 2) return "svg-node is-active";
        if (step === 4) return "svg-node is-active";
        return step > 4 ? "svg-node is-done" : (step > 2 ? "svg-node is-done" : "svg-node");
      case "node-run":
        if (step === 4) return "svg-node is-active";
        return step > 4 ? "svg-node is-done" : "svg-node";
      default:
        return "svg-node";
    }
  };

  const getLinkClass = (linkId: string) => {
    if (step === null) return "";
    
    switch (linkId) {
      case "link-alert-gemini":
        return step >= 1 ? "is-active" : "";
      case "link-gemini-obs":
        return step === 2 ? "is-active" : "";
      case "link-obs-gemini":
        return step === 3 ? "is-active" : "";
      case "link-gemini-test":
        return step === 3 ? "is-active" : "";
      case "link-test-gemini":
        return step === 4 ? "is-active" : "";
      case "link-gemini-sre":
        return step === 2 || step === 4 ? "is-active" : "";
      case "link-sre-run":
        return step >= 4 ? "is-active" : "";
      default:
        return "";
    }
  };

  return (
    <div className="diagram-container card-outlined" style={{ margin: "20px 0", padding: "20px", background: "var(--panel-2)", borderRadius: "var(--radius)", border: "1px solid var(--line-strong)", overflowX: "auto" }}>
      <h3 style={{ margin: "0 0 14px", fontSize: "14px", color: "var(--amber)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--mono)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>自律連携ワークフロー＆システム構成図</span>
        {statusText && <span style={{ fontSize: "12px", textTransform: "none", color: "var(--muted)", fontWeight: "normal" }}>{statusText}</span>}
      </h3>
      <svg id="workflow-svg" viewBox="0 0 760 170" style={{ width: "100%", minWidth: "700px", height: "auto", display: "block" }} role="img" aria-label="自律連携ワークフロー＆システム構成図">
        <defs>

          <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--line-strong)" />
          </marker>
          <marker id="arrow-active" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--accent)" />
          </marker>
        </defs>
        
        {/* コネクタ線 */}
        <path id="link-alert-gemini" className={getLinkClass("link-alert-gemini")} d="M 125 85 L 174 85" stroke="var(--line-strong)" strokeWidth="1.8" markerEnd="url(#arrow)" fill="none" />
        <path id="link-gemini-obs" className={getLinkClass("link-gemini-obs")} d="M 225 60 C 225 35, 260 35, 385 35" fill="none" stroke="var(--line-strong)" strokeWidth="1.8" markerEnd="url(#arrow)" />
        <path id="link-obs-gemini" className={getLinkClass("link-obs-gemini")} d="M 385 42 C 275 42, 245 42, 245 60" fill="none" stroke="var(--line-strong)" strokeWidth="1.8" markerEnd="url(#arrow)" />
        <path id="link-gemini-test" className={getLinkClass("link-gemini-test")} d="M 255 85 L 384 85" stroke="var(--line-strong)" stroke-width="1.8" markerEnd="url(#arrow)" fill="none" />
        <path id="link-test-gemini" className={getLinkClass("link-test-gemini")} d="M 384 90 L 255 90" stroke="var(--line-strong)" stroke-width="1.8" markerEnd="url(#arrow)" fill="none" />
        <path id="link-gemini-sre" className={getLinkClass("link-gemini-sre")} d="M 225 110 C 225 135, 260 135, 385 135" fill="none" stroke="var(--line-strong)" strokeWidth="1.8" markerEnd="url(#arrow)" />
        <path id="link-sre-run" className={getLinkClass("link-sre-run")} d="M 515 135 L 619 135" stroke="var(--line-strong)" stroke-width="1.8" markerEnd="url(#arrow)" fill="none" />
        
        {/* 監視 (Alert / Logs) */}
        <g id="node-alert" className={getNodeClass("node-alert")}>
          <rect x="10" y="60" width="115" height="50" rx="8" fill="var(--panel)" stroke="var(--line-strong)" strokeWidth="1.5" />
          <text x="67" y="82" fill="var(--ink)" fontSize="11" fontWeight="700" textAnchor="middle">Cloud Logging</text>
          <text x="67" y="97" fill="var(--red)" fontSize="9" fontWeight="600" textAnchor="middle">
            {step !== null && step === 0 ? "⚠️ 異常検知 (レイテンシ)" : "ログ・メトリクス監視"}
          </text>
        </g>
        
        {/* Gemini 審査参謀 (Strategist) */}
        <g id="node-gemini" className={getNodeClass("node-gemini")}>
          <rect x="175" y="60" width="80" height="50" rx="8" fill="var(--panel)" stroke="var(--line-strong)" strokeWidth="1.5" />
          <text x="215" y="82" fill="var(--ink)" fontSize="11" fontWeight="700" textAnchor="middle">審査参謀</text>
          <text x="215" y="97" fill="var(--muted)" fontSize="9" fontWeight="600" textAnchor="middle">@strategist</text>
        </g>
        
        {/* 運用観測役 (Observability) */}
        <g id="node-obs" className={getNodeClass("node-obs")}>
          <rect x="390" y="10" width="125" height="50" rx="8" fill="var(--panel)" stroke="var(--line-strong)" strokeWidth="1.5" />
          <text x="452" y="32" fill="var(--ink)" fontSize="11" fontWeight="700" textAnchor="middle">運用観測役</text>
          <text x="452" y="47" fill="var(--blue)" fontSize="9" fontWeight="600" textAnchor="middle">@observability</text>
        </g>
        
        {/* テスト検証役 (Test Forge) */}
        <g id="node-test" className={getNodeClass("node-test")}>
          <rect x="390" y="60" width="125" height="50" rx="8" fill="var(--panel)" stroke="var(--line-strong)" strokeWidth="1.5" />
          <text x="452" y="82" fill="var(--ink)" fontSize="11" fontWeight="700" textAnchor="middle">テスト検証役</text>
          <text x="452" y="97" fill="var(--green)" fontSize="9" fontWeight="600" textAnchor="middle">@test-forge</text>
        </g>
        
        {/* Cloud Run SRE (Deployer) */}
        <g id="node-sre" className={getNodeClass("node-sre")}>
          <rect x="390" y="110" width="125" height="50" rx="8" fill="var(--panel)" stroke="var(--line-strong)" strokeWidth="1.5" />
          <text x="452" y="132" fill="var(--ink)" fontSize="11" fontWeight="700" textAnchor="middle">Cloud Run SRE</text>
          <text x="452" y="147" fill="var(--amber)" fontSize="9" fontWeight="600" textAnchor="middle">@cloud-run-sre</text>
        </g>
        
        {/* Cloud Run (本番環境) */}
        <g id="node-run" className={getNodeClass("node-run")}>
          <rect x="620" y="110" width="115" height="50" rx="8" fill="var(--panel)" stroke="var(--line-strong)" strokeWidth="1.5" />
          <text x="677" y="132" fill="var(--ink)" fontSize="11" fontWeight="700" textAnchor="middle">Cloud Run</text>
          <text x="677" y="147" fill="var(--muted)" fontSize="9" fontWeight="600" textAnchor="middle" id="run-status">
            {step !== null && step >= 4 ? "Live ✓ v185" : "Traffic: Normal"}
          </text>
        </g>
      </svg>
    </div>
  );
}
