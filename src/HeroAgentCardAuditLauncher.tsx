import { ClipboardCheck, Network, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { SAMPLE_AGENT_CARD_RELEASE_STEWARD_PATH, SAMPLE_AGENT_CARD_THIN_AGENT_PATH } from "./sampleWorkspace";
import { SUBMISSION_PROOF } from "./submission";
import { PUBLIC_PROOF_INPUT_PLACEHOLDERS } from "./publicProofUrl";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function runtimeProofSampleBaseUrl() {
  if (typeof window === "undefined") return SUBMISSION_PROOF.deployedUrl;
  return window.location.origin;
}

function agentCardRouteHref(path: string, urls: string[]) {
  if (typeof window === "undefined") return "#";
  const url = new URL(window.location.href);
  url.pathname = path;
  url.search = "";
  for (const source of urls.map((item) => item.trim()).filter(Boolean)) {
    url.searchParams.append("url", source);
  }
  url.hash = "";
  return url.toString();
}

function agentCardDiligenceHrefFor(sourceUrl: string) {
  return agentCardRouteHref("/agent-card-diligence", [sourceUrl]);
}

function agentCardTrialPlanHrefFor(sourceUrl: string) {
  return agentCardRouteHref("/agent-card-trial-plan", [sourceUrl]);
}

function agentCardShortlistHrefFor(sourceUrl: string) {
  const base = runtimeProofSampleBaseUrl();
  return agentCardRouteHref("/agent-card-shortlist", [sourceUrl, `${base}${SAMPLE_AGENT_CARD_RELEASE_STEWARD_PATH}`, `${base}${SAMPLE_AGENT_CARD_THIN_AGENT_PATH}`]);
}

export default function HeroAgentCardAuditLauncher({ defaultUrl }: { defaultUrl: string }) {
  const [sourceUrl, setSourceUrl] = useState(defaultUrl);
  const normalizedSourceUrl = sourceUrl.trim();
  const diligenceHref = useMemo(() => (normalizedSourceUrl ? agentCardDiligenceHrefFor(normalizedSourceUrl) : "#"), [normalizedSourceUrl]);
  const trialPlanHref = useMemo(() => (normalizedSourceUrl ? agentCardTrialPlanHrefFor(normalizedSourceUrl) : "#"), [normalizedSourceUrl]);
  const shortlistHref = useMemo(() => (normalizedSourceUrl ? agentCardShortlistHrefFor(normalizedSourceUrl) : "#"), [normalizedSourceUrl]);
  const canOpen = Boolean(normalizedSourceUrl);

  return (
    <section className="hero-agent-card-audit" aria-labelledby="hero-agent-card-audit-title">
      <div className="hero-agent-card-audit-head">
        <div>
          <span>Agent Card audit</span>
          <strong id="hero-agent-card-audit-title">Check an agent before the pilot</strong>
          <p>Paste a public Agent Card URL and open buyer diligence, trial planning, or shortlist review with the URL attached.</p>
        </div>
        <ShieldCheck size={18} aria-hidden="true" />
      </div>
      <label htmlFor="hero-agent-card-url">Public Agent Card URL</label>
      <div className="hero-agent-card-audit-controls">
        <input
          id="hero-agent-card-url"
          value={sourceUrl}
          onChange={(event) => setSourceUrl(event.target.value)}
          placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.agentCardUrl}
        />
        <a className={cx("hero-agent-card-audit-primary", !canOpen && "is-disabled")} href={diligenceHref} target="_blank" rel="noreferrer" aria-disabled={!canOpen}>
          <Search size={14} />
          Diligence
        </a>
      </div>
      <div className="hero-agent-card-audit-links" aria-label="Agent Card audit actions">
        <a className={cx(!canOpen && "is-disabled")} href={trialPlanHref} target="_blank" rel="noreferrer" aria-disabled={!canOpen}>
          <ClipboardCheck size={13} />
          Trial plan
        </a>
        <a className={cx(!canOpen && "is-disabled")} href={shortlistHref} target="_blank" rel="noreferrer" aria-disabled={!canOpen}>
          <Network size={13} />
          Shortlist
        </a>
      </div>
      <div className="hero-agent-card-audit-signals" aria-label="Agent Card audit checks">
        <span>Live fetch</span>
        <span>Risk flags</span>
        <span>Buyer proof task</span>
      </div>
    </section>
  );
}
