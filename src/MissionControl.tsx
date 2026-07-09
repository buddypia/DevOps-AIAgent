import { Activity, ClipboardCheck, ExternalLink, FileText, Film, Rocket, Terminal, Workflow } from "lucide-react";
import { useState } from "react";
import type { MissionRun } from "./mission";
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

export default function MissionControl({ recommendation, projectBrief }: { recommendation: Recommendation; projectBrief: string }) {
  const [mission, setMission] = useState<MissionRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runMission() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setMission((await response.json()) as MissionRun);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mission-control">
      <div className="mission-heading">
        <div>
          <span className="eyebrow">Autonomous proof</span>
          <h2>
            <Rocket size={20} />
            Mission Control
          </h2>
        </div>
        <button className="icon-button" onClick={runMission} disabled={loading} title="自律ミッションを実行">
          <Activity size={17} />
          {loading ? "Running" : "Run mission"}
        </button>
      </div>

      {error && <p className="error-text">Mission request failed: {error}</p>}

      {mission ? (
        <div className="mission-body">
          <div className="mission-summary">
            <strong>{mission.summary}</strong>
            <p>{mission.objective}</p>
            <div className="mission-kpis">
              <StrategyMeter label="Autonomy" value={mission.autonomyScore} />
              <StrategyMeter label="Verification" value={mission.verificationScore} />
              <StrategyMeter label="Submission" value={mission.submissionScore} />
            </div>
          </div>

          <div className="mission-steps">
            {mission.steps.map((step) => (
              <article key={step.id} className={cx("mission-step", step.phase)}>
                <span>{step.phase}</span>
                <strong>{step.actor}</strong>
                <p>{step.action}</p>
                <small>{step.output}</small>
              </article>
            ))}
          </div>

          <div className="mission-grid">
            <section>
              <h3>Decisions</h3>
              {mission.decisions.map((decision) => (
                <div key={decision.id} className="mission-decision">
                  <div>
                    <strong>{decision.target}</strong>
                    <span>{decision.confidence}</span>
                  </div>
                  <p>{decision.rationale}</p>
                  <small>{decision.evidence}</small>
                </div>
              ))}
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                Verification
              </h3>
              <pre>{mission.verificationCommands.join("\n")}</pre>
            </section>
            <section className="submission-pack">
              <div className="submission-kit-heading">
                <h3>Submission Pack</h3>
                <a href="/submission-assets" target="_blank" rel="noreferrer" className="icon-link">
                  <ExternalLink size={14} />
                  Assets Page
                </a>
                <a href="/recording-script" target="_blank" rel="noreferrer" className="icon-link">
                  <ExternalLink size={14} />
                  Recording
                </a>
              </div>
              <strong>{mission.submissionPack.protopediaTitle}</strong>
              <p>{mission.submissionPack.demoScript}</p>
              <div className="mission-tags">
                {mission.submissionPack.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </section>
          </div>

          <div className="submission-kit">
            <section className="submission-architecture">
              <div className="submission-kit-heading">
                <h3>
                  <Workflow size={16} />
                  Architecture Diagram
                </h3>
                <a href={mission.submissionPack.architectureDiagramUrl} target="_blank" rel="noreferrer" className="icon-link">
                  <ExternalLink size={14} />
                  Open
                </a>
              </div>
              <img src={mission.submissionPack.architectureDiagramUrl} alt="Agent-To-Agent Marketplace architecture" />
            </section>

            <section className="submission-storyboard">
              <div className="submission-kit-heading">
                <h3>
                  <Film size={16} />
                  30s Storyboard
                </h3>
                <a href={mission.submissionPack.storyMarkdownPath} target="_blank" rel="noreferrer" className="icon-link">
                  <FileText size={14} />
                  Markdown
                </a>
              </div>
              <ol>
                {mission.submissionPack.videoStoryboard.map((shot) => (
                  <li key={shot}>{shot}</li>
                ))}
              </ol>
            </section>

            <section className="submission-requirements">
              <h3>
                <ClipboardCheck size={16} />
                Required Assets
              </h3>
              <div>
                {mission.submissionPack.requirements.map((item) => (
                  <article key={item.id} className={item.status}>
                    <strong>{item.label}</strong>
                    <span>{item.status === "ready" ? "ready" : "needs URL"}</span>
                    <p>{item.proof}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      ) : (
        <div className="mission-empty">
          <Rocket size={28} />
          <strong>Run missionで、自律判断・A2A委任・検証runbook・提出パックを生成します。</strong>
          <p>審査員に見せるべき「AIが価値の中心である証拠」を、この画面で一気に作ります。</p>
        </div>
      )}
    </section>
  );
}
