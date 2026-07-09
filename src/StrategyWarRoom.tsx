import { AlertTriangle, CheckCircle2, ClipboardCheck, Crosshair, ExternalLink, Lightbulb, Radar, ShoppingCart, Trophy } from "lucide-react";
import type { SwotQuadrant, WinningStrategy } from "./strategy";

const SWOT_LABELS: Record<SwotQuadrant, string> = {
  strengths: "Strengths",
  weaknesses: "Weaknesses",
  opportunities: "Opportunities",
  threats: "Threats"
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function scoreTone(value: number) {
  if (value >= 88) return "elite";
  if (value >= 74) return "solid";
  return "quiet";
}

function StrategyMeter({ label, value }: { label: string; value: number }) {
  return (
    <div className="strategy-meter">
      <div className="strategy-meter-row">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="meter" data-tone={scoreTone(value)}>
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function StrategyWarRoom({ strategy, onHire }: { strategy: WinningStrategy; onHire: (id: string) => void }) {
  const nextBestAgent = strategy.nextBestAgent;

  return (
    <section className="strategy-war-room">
      <div className="strategy-briefing">
        <span className="event-pill">
          <Trophy size={16} />
          Winning Strategy
        </span>
        <h2>{strategy.strategicThesis}</h2>
        <div className="strategy-kpis">
          <StrategyMeter label="Judge fit" value={strategy.judgeScore} />
          <StrategyMeter label="Moat" value={strategy.moatScore} />
          <StrategyMeter label="MVP proof" value={strategy.mvpScore} />
        </div>
      </div>

      <div className="strategy-grid">
        <section className="strategy-card competition-card">
          <div className="panel-heading">
            <h2>
              <Radar size={18} />
              Competitive Arena
            </h2>
            <span className={cx("risk-chip", strategy.riskLevel)}>{strategy.riskLevel}</span>
          </div>
          <div className="competition-list">
            {strategy.competitors.slice(0, 4).map((competitor) => (
              <article key={competitor.id} className="competition-row">
                <div>
                  <strong>{competitor.name}</strong>
                  <span>{competitor.category}</span>
                </div>
                <p>{competitor.counterPosition}</p>
                <a href={competitor.sourceUrl} target="_blank" rel="noreferrer">
                  Source <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="strategy-card swot-card">
          <div className="panel-heading">
            <h2>
              <Crosshair size={18} />
              SWOT
            </h2>
            <span className="chip">live</span>
          </div>
          <div className="swot-grid">
            {(Object.entries(strategy.swot) as Array<[SwotQuadrant, WinningStrategy["swot"][SwotQuadrant]]>).map(([quadrant, items]) => (
              <div key={quadrant} className={cx("swot-quadrant", quadrant)}>
                <h3>{SWOT_LABELS[quadrant]}</h3>
                {items.slice(0, 2).map((item) => (
                  <div key={`${quadrant}-${item.title}`} className={cx("swot-item", item.signal)}>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="strategy-card judge-card">
          <div className="panel-heading">
            <h2>
              <ClipboardCheck size={18} />
              Judge Scorecard
            </h2>
            <span className="chip">{strategy.judgeCriteria.length} criteria</span>
          </div>
          <div className="judge-list">
            {strategy.judgeCriteria.map((criterion) => (
              <div key={criterion.id} className="judge-row">
                <div>
                  <strong>{criterion.label}</strong>
                  <span>{criterion.score}</span>
                </div>
                <div className="meter" data-tone={scoreTone(criterion.score)}>
                  <span style={{ width: `${criterion.score}%` }} />
                </div>
                <p>{criterion.evidence}</p>
                <small>{criterion.nextAction}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="strategy-card moves-card">
          <div className="panel-heading">
            <h2>
              <Lightbulb size={18} />
              Winning Moves
            </h2>
            <span className="chip">{strategy.hypotheses.length} bets</span>
          </div>
          <div className="hypothesis-list">
            {strategy.hypotheses.map((hypothesis) => (
              <article key={hypothesis.id} className="hypothesis-row">
                <div>
                  <strong>{hypothesis.claim}</strong>
                  <span>{hypothesis.confidence}</span>
                </div>
                <p>{hypothesis.proof}</p>
                <small>{hypothesis.experiment}</small>
              </article>
            ))}
          </div>
          {nextBestAgent && (
            <div className="next-agent">
              <div>
                <span>
                  <AlertTriangle size={15} />
                  Next hire
                </span>
                <strong>{nextBestAgent.agent.name}</strong>
                <p>{nextBestAgent.reason}</p>
                <small>{nextBestAgent.expectedLift}</small>
              </div>
              <button className="icon-button" onClick={() => onHire(nextBestAgent.agent.id)} title="推薦エージェントを雇う">
                <ShoppingCart size={17} />
                Hire
              </button>
            </div>
          )}
          <div className="submission-strip">
            {strategy.submissionItems.map((item) => (
              <div key={item.id} className={item.done ? "done" : "todo"} title={item.nextAction}>
                {item.done ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
