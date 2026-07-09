import {
  AlertTriangle,
  BadgeCheck,
  ClipboardCheck,
  Crosshair,
  ExternalLink,
  FileText,
  Film,
  Gauge,
  TrendingUp,
  Trophy,
  Workflow
} from "lucide-react";
import { FIRST_CLICK_PROOF_LINKS, type FirstClickProofLink } from "./firstClick";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function FirstClickIcon({ link }: { link: FirstClickProofLink }) {
  if (link.id === "judge-snapshot") return <Trophy size={18} />;
  if (link.id === "winner-packet") return <BadgeCheck size={18} />;
  if (link.id === "objection-arena") return <AlertTriangle size={18} />;
  if (link.id === "competitive-swot") return <Crosshair size={18} />;
  if (link.id === "competitive-decision-matrix") return <Gauge size={18} />;
  if (link.id === "mvp-readiness") return <ClipboardCheck size={18} />;
  if (link.id === "autonomy-snapshot") return <Workflow size={18} />;
  if (link.id === "pilot-value") return <TrendingUp size={18} />;
  if (link.id === "recording-script") return <Film size={18} />;
  return <FileText size={18} />;
}

export default function ReviewerProofRouteBoard() {
  const primaryRoutes = FIRST_CLICK_PROOF_LINKS.filter((link) => link.tone === "primary");
  const readyRoutes = FIRST_CLICK_PROOF_LINKS.filter((link) => link.tone === "ready").length;
  const watchRoutes = FIRST_CLICK_PROOF_LINKS.filter((link) => link.tone === "watch").length;
  const firstRoute = primaryRoutes[0] ?? FIRST_CLICK_PROOF_LINKS[0];

  return (
    <section className="reviewer-proof-route-board" aria-label="Curated public proof route">
      <div className="reviewer-proof-route-board-head">
        <div>
          <span>Reviewer route map</span>
          <strong>Open the proof in the order an external reviewer needs.</strong>
          <p>Start with the autopilot, decision packet, and public evidence map before opening any build workbench tools.</p>
        </div>
        {firstRoute && (
          <a href={firstRoute.href} target="_blank" rel="noreferrer">
            <ExternalLink size={14} />
            Start route
          </a>
        )}
      </div>
      <div className="reviewer-proof-route-board-stats" aria-label="Reviewer route readiness">
        <article>
          <span>Direct routes</span>
          <strong>{FIRST_CLICK_PROOF_LINKS.length}</strong>
          <p>No POST or console knowledge required.</p>
        </article>
        <article>
          <span>Ready now</span>
          <strong>{readyRoutes + primaryRoutes.length}</strong>
          <p>Primary and ready links are safe first-click destinations.</p>
        </article>
        <article>
          <span>Watch list</span>
          <strong>{watchRoutes}</strong>
          <p>Publication and recovery links stay visible as proof work.</p>
        </article>
      </div>
      <div className="reviewer-proof-route-board-links" aria-label="Primary reviewer route links">
        {primaryRoutes.map((link) => (
          <a key={link.id} href={link.href} target="_blank" rel="noreferrer" className={cx("first-click-link", link.tone)}>
            <FirstClickIcon link={link} />
            <span>{link.signal}</span>
            <strong>{link.label}</strong>
            <p>{link.judgeValue}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
