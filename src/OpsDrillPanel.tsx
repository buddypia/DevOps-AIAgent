import { Activity, AlertTriangle, CheckCircle2, Cloud, Radar, Terminal, Workflow } from "lucide-react";
import { useState } from "react";
import type { OpsDrill } from "./ops";
import type { Recommendation } from "./types";

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

export default function OpsDrillPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [drill, setDrill] = useState<OpsDrill | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runOpsDrill() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ops-drill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setDrill((await response.json()) as OpsDrill);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="ops-drill">
      <div className="ops-heading">
        <div>
          <span className="eyebrow">Operate proof</span>
          <h2>
            <Cloud size={20} />
            Cloud Run Ops Drill
          </h2>
        </div>
        <button className="icon-button" onClick={runOpsDrill} disabled={loading} title="運用ドリルを実行">
          <Activity size={17} />
          {loading ? "Running" : "Run ops drill"}
        </button>
      </div>

      {error && <p className="error-text">Ops drill request failed: {error}</p>}

      {drill ? (
        <div className="ops-body">
          <div className="ops-summary">
            <div>
              <span className={cx("risk-chip", drill.severity)}>{drill.severity}</span>
              <h3>{drill.incidentTitle}</h3>
              <p>{drill.summary}</p>
            </div>
            <div className="ops-readiness">
              <StrategyMeter label="Readiness" value={drill.readinessScore} />
              <div className={cx("rollback-card", drill.rollbackRecommended && "is-risk")}>
                {drill.rollbackRecommended ? <AlertTriangle size={22} /> : <CheckCircle2 size={22} />}
                <strong>{drill.rollbackRecommended ? "Rollback" : "Continue"}</strong>
                <span>{drill.rollbackRecommended ? "restore previous revision" : "guarded release accepted"}</span>
              </div>
            </div>
          </div>

          <div className="ops-signal-grid">
            {drill.signals.map((signal) => (
              <article key={signal.id} className={cx("ops-signal", signal.status)}>
                <div>
                  <strong>{signal.label}</strong>
                  <span>{signal.status}</span>
                </div>
                <p>{signal.value}</p>
                <small>{signal.threshold}</small>
              </article>
            ))}
          </div>

          <div className="ops-grid">
            <section>
              <h3>
                <Radar size={15} />
                Decisions
              </h3>
              {drill.decisions.map((decision) => (
                <div key={decision.id} className="ops-decision">
                  <div>
                    <strong>{decision.decision}</strong>
                    <span>{decision.confidence}</span>
                  </div>
                  <p>{decision.rationale}</p>
                  <small>{decision.actor}</small>
                </div>
              ))}
            </section>
            <section>
              <h3>
                <Workflow size={15} />
                A2A Ops Timeline
              </h3>
              <div className="ops-steps">
                {drill.steps.map((step) => (
                  <article key={step.id} className={step.phase}>
                    <span>{step.phase}</span>
                    <strong>{step.actor}</strong>
                    <p>{step.action}</p>
                    <small>{step.output}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                Runbook
              </h3>
              <pre>{drill.runbookCommands.join("\n")}</pre>
              {drill.nextOpsAgent && (
                <div className="ops-next-agent">
                  <span>Next ops hire</span>
                  <strong>{drill.nextOpsAgent.name}</strong>
                  <p>{drill.nextOpsAgent.reason}</p>
                </div>
              )}
            </section>
          </div>
        </div>
      ) : (
        <div className="ops-empty">
          <Cloud size={28} />
          <strong>Run ops drillで、公開デモの異常検知、継続/ロールバック判断、追加雇用を生成します。</strong>
          <p>DevOpsハッカソンの「まわす」を、AIエージェントの判断ログとして見せます。</p>
        </div>
      )}
    </section>
  );
}
