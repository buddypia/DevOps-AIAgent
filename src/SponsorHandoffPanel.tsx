import { ClipboardCheck, ExternalLink, FileText, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { BuyerValueScenario } from "./buyerValueScenario";
import type { BuyerWorkOrderInput } from "./buyerWorkOrder";
import { buildBuyerJourney } from "./buyerJourney";
import { buildSponsorHandoffPacket } from "./sponsorHandoff";
import type { MarketAgent, Recommendation } from "./types";
import type { ValueBlueprint } from "./valueBlueprint";
import type { WorkspaceDraft } from "./workspaceDraft";

type SponsorHandoffPanelProps = {
  projectBrief: string;
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  buyerWorkOrder: BuyerWorkOrderInput;
  workspace: Pick<WorkspaceDraft, "targetUrl" | "protopediaUrl" | "videoUrl" | "agentTrialEvidence" | "pilotRun">;
  customAgents?: MarketAgent[];
  shareHref: string;
  onCopyText: (text: string) => Promise<boolean>;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function SponsorHandoffPanel({
  projectBrief,
  recommendation,
  valueBlueprint,
  buyerScenario,
  buyerWorkOrder,
  workspace,
  customAgents = [],
  shareHref,
  onCopyText
}: SponsorHandoffPanelProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const packet = useMemo(() => {
    const journey = buildBuyerJourney({
      projectBrief,
      recommendation,
      valueBlueprint,
      buyerScenario,
      buyerWorkOrder,
      workspace,
      customAgents
    });
    return buildSponsorHandoffPacket({ journey, shareHref, agentTrialEvidence: workspace.agentTrialEvidence });
  }, [buyerScenario, buyerWorkOrder, customAgents, projectBrief, recommendation, shareHref, valueBlueprint, workspace]);
  const copyLabel = copyStatus === "copied" ? "Copied note" : copyStatus === "failed" ? "Copy failed" : "Copy sponsor note";

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  async function copySponsorNote() {
    const copied = await onCopyText(packet.copyText);
    setCopyStatus(copied ? "copied" : "failed");
  }

  return (
    <section className={cx("sponsor-handoff", packet.tone)} aria-labelledby="sponsor-handoff-title">
      <div className="sponsor-handoff-main">
        <div>
          <span className="eyebrow">Sponsor Handoff</span>
          <h2 id="sponsor-handoff-title">
            <Send size={20} />
            {packet.headline}
          </h2>
          <p>{packet.summary}</p>
        </div>
        <div className="sponsor-handoff-copy">
          <strong>{packet.subject}</strong>
          <p>{packet.statusLine}</p>
          <button className={cx("icon-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copySponsorNote}>
            <ClipboardCheck size={16} />
            {copyLabel}
          </button>
        </div>
      </div>

      <div className="sponsor-handoff-body">
        <article>
          <span>Next action</span>
          <strong>{packet.nextActionLine}</strong>
        </article>
        <div className="sponsor-proof-ledger">
          {packet.proofHighlights.map((proof) => (
            <article key={proof.id} className={proof.tone}>
              <span>{proof.label}</span>
              <strong>{proof.value}</strong>
              <p>{proof.evidence}</p>
            </article>
          ))}
        </div>
        <div className="sponsor-handoff-links">
          {packet.links.map((link) => (
            <a key={link.id} className="icon-link" href={link.href} target={link.id === "workspace" ? undefined : "_blank"} rel={link.id === "workspace" ? undefined : "noreferrer"} title={link.purpose}>
              {link.id === "workspace" ? <FileText size={15} /> : <ExternalLink size={15} />}
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
