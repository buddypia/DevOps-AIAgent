import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Cloud,
  Coins,
  Crosshair,
  Download,
  ExternalLink,
  FileText,
  Film,
  Gauge,
  GitBranch,
  Lightbulb,
  Network,
  Play,
  Radar,
  Rocket,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Terminal,
  TrendingUp,
  Trophy,
  Workflow
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { recommendSquad } from "./agentEngine";
import type { AutonomyLedger } from "./autonomyLedger";
import type { WinningAutopilotRun } from "./autopilot";
import type { SquadContract } from "./contracts";
import type { DemoRunway } from "./demoRunway";
import type { FinalistSimulation } from "./finalist";
import type { ImpactCase } from "./impact";
import type { JudgeBrief } from "./judgeBrief";
import type { JudgeDrill } from "./judgeDrill";
import type { JudgeTour } from "./judgeTour";
import type { LiveEvidenceRun } from "./liveEvidence";
import { CAPABILITY_LABELS, DEFAULT_PROJECT_BRIEF, MARKET_AGENTS } from "./market";
import type { MarketIntelReport } from "./marketIntel";
import type { MissionRun } from "./mission";
import type { MoatStressTest } from "./moatStress";
import type { MvpAuditReport } from "./mvpAudit";
import type { OpsDrill } from "./ops";
import type { PitchRun } from "./pitch";
import type { JudgeProof } from "./proof";
import type { ProtoPediaPublisher } from "./publisher";
import type { SecurityReview } from "./security";
import type { OptimizedSquadCandidate, SquadOptimizerRun } from "./squadOptimizer";
import type { SubmissionDossier } from "./dossier";
import type { SubmissionLaunchGate } from "./submissionLaunch";
import { buildWinningStrategy } from "./strategy";
import type { SwotQuadrant, WinningStrategy } from "./strategy";
import type { CapabilityKey, GeminiRecommendation, MarketAgent, Recommendation } from "./types";
import type { UserPilotLab } from "./userPilot";
import "./styles.css";

const STAGE_LABELS: Record<string, string> = {
  all: "All",
  plan: "Plan",
  build: "Build",
  deploy: "Deploy",
  operate: "Operate",
  govern: "Govern"
};

const TOP_CAPABILITIES: CapabilityKey[] = ["a2a", "mcp", "cloudRun", "testing", "ux"];
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

function CapabilityBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="capability-bar">
      <div className="capability-row">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="meter" data-tone={scoreTone(value)}>
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function AgentCard({
  agent,
  selected,
  onToggle
}: {
  agent: MarketAgent;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  const totalSkill = Math.round(agent.skills.reduce((sum, skill) => sum + skill.score, 0) / agent.skills.length);
  const mcpMaturity = Math.round(agent.mcp.reduce((sum, item) => sum + item.maturity, 0) / agent.mcp.length);

  return (
    <article className={cx("agent-card", selected && "is-selected")} style={{ "--agent": agent.color, "--agent-accent": agent.accent } as React.CSSProperties}>
      <div className="agent-card-top">
        <div className="agent-avatar" aria-hidden="true">
          <Bot size={22} />
        </div>
        <div>
          <span className="agent-handle">{agent.handle}</span>
          <h3>{agent.name}</h3>
        </div>
        <span className={cx("rarity", agent.rarity)}>{agent.rarity}</span>
      </div>
      <p className="agent-headline">{agent.headline}</p>
      <div className="agent-metrics">
        <span>
          <Gauge size={16} />
          Skill {totalSkill}
        </span>
        <span>
          <Network size={16} />
          MCP {mcpMaturity}
        </span>
        <span>
          <Coins size={16} />
          {agent.price}
        </span>
      </div>
      <div className="capability-stack">
        {TOP_CAPABILITIES.map((key) => (
          <CapabilityBar key={key} label={CAPABILITY_LABELS[key]} value={agent.capabilities[key]} />
        ))}
      </div>
      <div className="skill-row">
        {agent.skills.slice(0, 3).map((skill) => (
          <span key={skill.id}>{skill.label}</span>
        ))}
      </div>
      <button className={cx("hire-button", selected && "hired")} onClick={() => onToggle(agent.id)} title={selected ? "編成から外す" : "市場から雇う"}>
        {selected ? <CheckCircle2 size={18} /> : <ShoppingCart size={18} />}
        {selected ? "Hired" : "Hire"}
      </button>
    </article>
  );
}

function ScoreBlock({ label, before, after }: { label: string; before: number; after: number }) {
  const diff = after - before;
  return (
    <div className="score-block">
      <div className="score-row">
        <span>{label}</span>
        <strong>{after}</strong>
      </div>
      <div className="score-track">
        <span className="before" style={{ width: `${before}%` }} />
        <span className="after" style={{ width: `${after}%` }} />
      </div>
      <small>+{diff}</small>
    </div>
  );
}

function A2APanel({ recommendation }: { recommendation: Recommendation }) {
  return (
    <section className="panel a2a-panel">
      <div className="panel-heading">
        <h2>
          <Network size={18} />
          A2A Delegation
        </h2>
        <span className="chip">JSON-RPC ready</span>
      </div>
      <ol className="timeline">
        {recommendation.a2aTimeline.map((item, index) => (
          <li key={`${item.actor}-${item.verb}-${index}`} className={item.status}>
            <span>{item.verb}</span>
            <strong>{item.actor}</strong>
            <p>{item.payload}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function SquadPanel({ recommendation }: { recommendation: Recommendation }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>
          <TrendingUp size={18} />
          Project Upgrade
        </h2>
        <span className="chip">Budget {recommendation.budgetUsed} / 140</span>
      </div>
      <div className="score-total">
        <span>総合改善</span>
        <strong>{recommendation.before.total} → {recommendation.after.total}</strong>
      </div>
      <ScoreBlock label="企画" before={recommendation.before.planning} after={recommendation.after.planning} />
      <ScoreBlock label="実装配送" before={recommendation.before.delivery} after={recommendation.after.delivery} />
      <ScoreBlock label="運用信頼性" before={recommendation.before.reliability} after={recommendation.after.reliability} />
      <ScoreBlock label="ユーザビリティ" before={recommendation.before.usability} after={recommendation.after.usability} />
      <ScoreBlock label="統制/A2A" before={recommendation.before.governance} after={recommendation.after.governance} />
      <div className="squad-list">
        {recommendation.selected.map((agent) => (
          <div key={agent.id} className="squad-item">
            <span style={{ background: agent.color }} />
            <div>
              <strong>{agent.name}</strong>
              <small>{agent.outcome}</small>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ContractDesk({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [contract, setContract] = useState<SquadContract | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function issueContracts() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setContract((await response.json()) as SquadContract);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="contract-desk">
      <div className="contract-heading">
        <div>
          <span className="eyebrow">Contract desk</span>
          <h2>
            <ShoppingCart size={20} />
            Agent contracts
          </h2>
        </div>
        <button className="icon-button" onClick={issueContracts} disabled={loading} title="AI契約を生成">
          <ClipboardCheck size={17} />
          {loading ? "Issuing" : "Issue contracts"}
        </button>
      </div>

      {error && <p className="error-text">Contract request failed: {error}</p>}

      {contract ? (
        <div className="contract-body">
          <div className="contract-summary">
            <div>
              <span className="event-pill">
                <Coins size={15} />
                {contract.totalPrice} used / {contract.remainingBudget} remaining
              </span>
              <h3>{contract.summary}</h3>
              <p>AIを雇った後に何を納品し、何をもって受け入れるかを固定します。</p>
            </div>
            <div className="contract-score">
              <strong>{contract.contractScore}</strong>
              <span>contract score</span>
            </div>
          </div>

          <div className="contract-list">
            {contract.contracts.map((item) => (
              <article key={item.id} className={item.risk}>
                <div className="contract-card-top">
                  <div>
                    <span>{item.handle}</span>
                    <strong>{item.agentName}</strong>
                  </div>
                  <small>{item.price}</small>
                </div>
                <p>{item.scope}</p>
                <div>
                  <h3>Acceptance</h3>
                  <ul>
                    {item.acceptanceCriteria.slice(0, 3).map((criterion) => (
                      <li key={criterion}>{criterion}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>SLA</h3>
                  <p>{item.sla.successMetric}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="contract-grid">
            <section>
              <h3>
                <Workflow size={15} />
                Ledger
              </h3>
              {contract.ledger.map((event) => (
                <div key={event.id} className="contract-ledger">
                  <strong>{event.actor}</strong>
                  <p>{event.event}</p>
                  <small>{event.proof}</small>
                </div>
              ))}
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                Acceptance runbook
              </h3>
              <ol>
                {contract.acceptanceRunbook.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
            <section>
              <h3>
                <ShieldCheck size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(contract.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="contract-empty">
          <ShoppingCart size={28} />
          <strong>Issue contractsで、選択済みAIの成果物、受入条件、SLA、検証コマンドを生成します。</strong>
          <p>「AIを雇う」体験を、実務の検収とDevOps証跡につなげます。</p>
        </div>
      )}
    </section>
  );
}

function GeminiPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [analysis, setAnalysis] = useState<GeminiRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runGemini() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as GeminiRecommendation;
      setAnalysis(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel gemini-panel">
      <div className="panel-heading">
        <h2>
          <Sparkles size={18} />
          Gemini 3.5 Flash
        </h2>
        <button className="icon-button" onClick={runGemini} disabled={loading} title="Gemini分析を実行">
          <Play size={17} />
          {loading ? "Running" : "Analyze"}
        </button>
      </div>
      {error && <p className="error-text">Gemini API request failed: {error}</p>}
      {analysis ? (
        <div className="analysis">
          <span className="chip">{analysis.source} / {analysis.model}</span>
          <strong>{analysis.executiveSummary}</strong>
          <p>{analysis.winningAngle}</p>
          <div className="analysis-grid">
            <div>
              <h3>Risks</h3>
              <ul>
                {analysis.risks.map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Next</h3>
              <ul>
                {analysis.nextActions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </div>
          </div>
          <pre>{analysis.pitchScript}</pre>
        </div>
      ) : (
        <div className="empty-analysis">
          <BadgeCheck size={28} />
          <strong>{recommendation.headline}</strong>
          <p>市場で選んだ編成をGeminiに渡すと、勝ち筋、残リスク、ピッチが更新されます。</p>
        </div>
      )}
    </section>
  );
}

function AgentCardJson() {
  const [card, setCard] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch("/.well-known/agent-card.json")
      .then((response) => response.json())
      .then((payload: Record<string, unknown>) => setCard(payload))
      .catch(() => setCard(null));
  }, []);

  return (
    <section className="panel agent-card-json">
      <div className="panel-heading">
        <h2>
          <ExternalLink size={18} />
          Agent Card
        </h2>
        <a href="/.well-known/agent-card.json" target="_blank" rel="noreferrer" className="icon-link">
          <Download size={16} />
          JSON
        </a>
      </div>
      <pre>{card ? JSON.stringify(card, null, 2) : "Loading agent card..."}</pre>
    </section>
  );
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

function JudgeTourPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [tour, setTour] = useState<JudgeTour | null>(null);
  const [protopediaUrl, setProtopediaUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildTour() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/judge-tour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id),
          protopediaUrl,
          videoUrl
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setTour((await response.json()) as JudgeTour);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="judge-tour">
      <div className="tour-heading">
        <div>
          <span className="eyebrow">Judge tour</span>
          <h2>
            <Play size={20} />
            90-second walkthrough
          </h2>
        </div>
        <button className="icon-button" onClick={buildTour} disabled={loading} title="審査員向け90秒導線を生成">
          <Trophy size={17} />
          {loading ? "Sequencing" : "Build judge tour"}
        </button>
      </div>

      <div className="tour-inputs">
        <label>
          <span>ProtoPedia work URL</span>
          <input value={protopediaUrl} onChange={(event) => setProtopediaUrl(event.target.value)} placeholder="https://protopedia.net/prototype/..." />
        </label>
        <label>
          <span>Video URL</span>
          <input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://youtu.be/... or https://drive.google.com/..." />
        </label>
      </div>

      {error && <p className="error-text">Judge tour request failed: {error}</p>}

      {tour ? (
        <div className="tour-body">
          <div className="tour-summary">
            <div>
              <span className={cx("risk-chip", tour.readiness === "walkthrough-ready" ? "low" : tour.readiness === "external-url-gaps" ? "medium" : "high")}>
                {tour.readiness}
              </span>
              <h3>{tour.headline}</h3>
              <p>{tour.openingScript}</p>
              <strong>{tour.hardTruth}</strong>
            </div>
            <div className="tour-score">
              <strong>{tour.tourScore}</strong>
              <span>{tour.totalSeconds}s tour</span>
            </div>
          </div>

          <div className="tour-claims">
            {tour.claims.map((claim) => (
              <article key={claim.id} className={scoreTone(claim.score)}>
                <span>{claim.label}</span>
                <strong>{claim.score}</strong>
                <p>{claim.claim}</p>
                <small>{claim.evidence}</small>
              </article>
            ))}
          </div>

          <div className="tour-steps">
            {tour.steps.map((step) => (
              <article key={step.id} className={step.status}>
                <div>
                  <span>{step.timeRange}</span>
                  <strong>{step.screen}</strong>
                  <b>{step.status}</b>
                </div>
                <p>{step.narratorLine}</p>
                <small>{step.action}</small>
                <a href={step.endpoint} target="_blank" rel="noreferrer">
                  Endpoint <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>

          <div className="tour-grid">
            <section>
              <h3>
                <AlertTriangle size={15} />
                Judge objections
              </h3>
              <div className="tour-objections">
                {tour.objections.map((objection) => (
                  <article key={objection.id}>
                    <strong>{objection.question}</strong>
                    <p>{objection.response}</p>
                    <small>{objection.proof}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Blockers and links
              </h3>
              <div className="tour-blockers">
                {tour.blockers.length > 0 ? (
                  tour.blockers.map((blocker) => (
                    <article key={blocker.id} className={blocker.severity}>
                      <div>
                        <strong>{blocker.label}</strong>
                        <span>{blocker.severity}</span>
                      </div>
                      <p>{blocker.action}</p>
                      <small>{blocker.proof}</small>
                    </article>
                  ))
                ) : (
                  <article className="clear">
                    <strong>No blockers</strong>
                    <p>外部URL、品質、運用のブロッカーはありません。</p>
                  </article>
                )}
              </div>
              <div className="tour-links">
                {tour.links.map((link) => (
                  <a key={link.id} href={link.url} target="_blank" rel="noreferrer">
                    {link.label}
                    <ExternalLink size={13} />
                  </a>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(tour.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="tour-empty">
          <Play size={28} />
          <strong>Build judge tourで、審査員が開く順番、話す台詞、反論、証拠リンク、残ブロッカーを90秒導線に束ねます。</strong>
          <p>Judge Brief、Market Intel、Impact Case、Security Review、Judge Proof、Submission Launch Gateを一つの審査ルートとして確認します。</p>
        </div>
      )}
    </section>
  );
}

function UserPilotPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [pilot, setPilot] = useState<UserPilotLab | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runPilot() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/user-pilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setPilot((await response.json()) as UserPilotLab);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="user-pilot">
      <div className="pilot-heading">
        <div>
          <span className="eyebrow">User pilot lab</span>
          <h2>
            <Crosshair size={20} />
            First-run usability pilot
          </h2>
        </div>
        <button className="icon-button" onClick={runPilot} disabled={loading} title="対象ユーザーの初回利用導線を検証">
          <Radar size={17} />
          {loading ? "Piloting" : "Run user pilot"}
        </button>
      </div>

      {error && <p className="error-text">User pilot request failed: {error}</p>}

      {pilot ? (
        <div className="pilot-body">
          <div className="pilot-summary">
            <div>
              <span className={cx("risk-chip", pilot.readiness === "pilot-ready" ? "low" : pilot.readiness === "needs-guidance" ? "medium" : "high")}>
                {pilot.readiness}
              </span>
              <h3>{pilot.headline}</h3>
              <p>{pilot.hardTruth}</p>
              <strong>{pilot.timeToValueSeconds}s max time-to-value / +{pilot.usabilityLift} usability lift to chase</strong>
            </div>
            <div className="pilot-score">
              <strong>{pilot.pilotScore}</strong>
              <span>pilot score</span>
            </div>
          </div>

          <div className="pilot-paths">
            {pilot.paths.map((path) => (
              <article key={path.id}>
                <div>
                  <span>{path.timeToValueSeconds}s</span>
                  <strong>{path.persona}</strong>
                </div>
                <h3>{path.goal}</h3>
                <p>{path.successMetric}</p>
                <small>{path.proof}</small>
                <ol>
                  {path.tasks.map((task) => (
                    <li key={task.id} className={task.status}>
                      <b>{task.screen}</b>
                      <span>{task.action}</span>
                      <small>{task.successSignal}</small>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>

          <div className="pilot-grid">
            <section>
              <h3>
                <AlertTriangle size={15} />
                Frictions
              </h3>
              <div className="pilot-frictions">
                {pilot.frictions.length > 0 ? (
                  pilot.frictions.map((friction) => (
                    <article key={friction.id} className={friction.severity}>
                      <div>
                        <strong>{friction.label}</strong>
                        <span>{friction.severity}</span>
                      </div>
                      <p>{friction.evidence}</p>
                      <small>{friction.owner}: {friction.fix}</small>
                    </article>
                  ))
                ) : (
                  <article className="clear">
                    <strong>No first-run friction</strong>
                    <p>3つの対象ユーザー導線に、重大な摩擦はありません。</p>
                  </article>
                )}
              </div>
            </section>
            <section>
              <h3>
                <Play size={15} />
                Next clicks
              </h3>
              <div className="pilot-clicks">
                {pilot.nextClicks.map((click) => (
                  <article key={click.id}>
                    <div>
                      <strong>{click.button}</strong>
                      <span>{click.screen}</span>
                    </div>
                    <p>{click.reason}</p>
                    <small>{click.expectedEvidence}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Validation
              </h3>
              <div className="pilot-checks">
                {pilot.validationChecklist.map((item) => (
                  <article key={item.id} className={item.status}>
                    <div>
                      <strong>{item.label}</strong>
                      <span>{item.status}</span>
                    </div>
                    <p>{item.proof}</p>
                  </article>
                ))}
              </div>
              <h3>
                <Terminal size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(pilot.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="pilot-empty">
          <Crosshair size={28} />
          <strong>Run user pilotで、開発リード、Platform/SRE、提出者が最初の3分で価値へ到達できるかを検証します。</strong>
          <p>ユーザビリティの弱点を、対象ユーザー別のクリック順、摩擦、成功条件、次アクションに変換します。</p>
        </div>
      )}
    </section>
  );
}

function OptimizerCandidateCard({
  title,
  candidate
}: {
  title: string;
  candidate: OptimizedSquadCandidate;
}) {
  return (
    <article className="optimizer-candidate">
      <div className="optimizer-candidate-top">
        <span>{title}</span>
        <strong>{candidate.totalScore}</strong>
      </div>
      <h3>{candidate.agents.map((agent) => agent.name).join(" / ")}</h3>
      <div className="optimizer-candidate-meta">
        <span>
          <Coins size={14} />
          {candidate.totalPrice}
        </span>
        <span>
          <Gauge size={14} />
          Judge {candidate.judgeScore}
        </span>
        <span>
          <BadgeCheck size={14} />
          Coverage {candidate.coverageScore}
        </span>
      </div>
      <div className="optimizer-coverage">
        {candidate.coverage.map((gate) => (
          <span key={gate.id} className={gate.met ? "met" : "missing"}>
            {gate.label}
          </span>
        ))}
      </div>
      <p>{candidate.weakestCriterion.label}: {candidate.weakestCriterion.nextAction}</p>
    </article>
  );
}

function SquadOptimizerPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [optimizer, setOptimizer] = useState<SquadOptimizerRun | null>(null);
  const [budget, setBudget] = useState(140);
  const [maxSquadSize, setMaxSquadSize] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function optimizeSquad() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/squad-optimizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id),
          budget,
          maxSquadSize
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setOptimizer((await response.json()) as SquadOptimizerRun);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="squad-optimizer">
      <div className="optimizer-heading">
        <div>
          <span className="eyebrow">Squad optimizer</span>
          <h2>
            <ShoppingCart size={20} />
            Budget-aware winning squad
          </h2>
        </div>
        <button className="icon-button" onClick={optimizeSquad} disabled={loading} title="予算内の最適編成を探索">
          <Workflow size={17} />
          {loading ? "Optimizing" : "Optimize squad"}
        </button>
      </div>

      <div className="optimizer-inputs">
        <label>
          <span>Budget</span>
          <input
            type="number"
            min={60}
            max={300}
            value={budget}
            onChange={(event) => setBudget(Number(event.target.value))}
          />
        </label>
        <label>
          <span>Max squad size</span>
          <input
            type="number"
            min={1}
            max={6}
            value={maxSquadSize}
            onChange={(event) => setMaxSquadSize(Number(event.target.value))}
          />
        </label>
      </div>

      {error && <p className="error-text">Squad optimizer request failed: {error}</p>}

      {optimizer ? (
        <div className="optimizer-body">
          <div className="optimizer-summary">
            <div>
              <span className={cx("risk-chip", optimizer.readiness === "optimized" ? "low" : optimizer.readiness === "needs-more-budget" ? "medium" : "high")}>
                {optimizer.readiness}
              </span>
              <h3>{optimizer.headline}</h3>
              <p>{optimizer.hardTruth}</p>
              <strong>{optimizer.recommended.totalPrice} used / {optimizer.recommended.remainingBudget} remaining / rank {optimizer.recommended.rank}</strong>
            </div>
            <div className="optimizer-score">
              <strong>{optimizer.optimizerScore}</strong>
              <span>optimizer score</span>
            </div>
          </div>

          <div className="optimizer-candidates">
            <OptimizerCandidateCard title="Current" candidate={optimizer.current} />
            <OptimizerCandidateCard title="Recommended" candidate={optimizer.recommended} />
            {optimizer.stretch && <OptimizerCandidateCard title={`Stretch +${optimizer.budgetGap}`} candidate={optimizer.stretch} />}
          </div>

          <div className="optimizer-deltas">
            <article>
              <span>Total</span>
              <strong>{optimizer.delta.totalScore >= 0 ? `+${optimizer.delta.totalScore}` : optimizer.delta.totalScore}</strong>
            </article>
            <article>
              <span>Judge</span>
              <strong>{optimizer.delta.judgeScore >= 0 ? `+${optimizer.delta.judgeScore}` : optimizer.delta.judgeScore}</strong>
            </article>
            <article>
              <span>Coverage</span>
              <strong>{optimizer.delta.coverageScore >= 0 ? `+${optimizer.delta.coverageScore}` : optimizer.delta.coverageScore}</strong>
            </article>
            <article>
              <span>Usability</span>
              <strong>{optimizer.delta.usability >= 0 ? `+${optimizer.delta.usability}` : optimizer.delta.usability}</strong>
            </article>
            <article>
              <span>Budget used</span>
              <strong>{optimizer.delta.budgetUsed >= 0 ? `+${optimizer.delta.budgetUsed}` : optimizer.delta.budgetUsed}</strong>
            </article>
          </div>

          <div className="optimizer-grid">
            <section>
              <h3>
                <Workflow size={15} />
                Swap plan
              </h3>
              <div className="optimizer-steps">
                {optimizer.swapPlan.map((step) => (
                  <article key={step.id} className={step.action}>
                    <div>
                      <strong>{step.label}</strong>
                      <span>{step.action}</span>
                    </div>
                    <p>{step.reason}</p>
                    <small>{step.scoreImpact}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Trophy size={15} />
                Alternatives
              </h3>
              <div className="optimizer-alternatives">
                {optimizer.alternatives.map((candidate) => (
                  <article key={candidate.id}>
                    <div>
                      <strong>{candidate.agents.map((agent) => agent.name).join(" / ")}</strong>
                      <span>{candidate.totalScore}</span>
                    </div>
                    <p>{candidate.totalPrice} budget / coverage {candidate.coverageScore} / judge {candidate.judgeScore}</p>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(optimizer.a2aPayload, null, 2)}</pre>
            </section>
          </div>

          <div className="optimizer-rules">
            {optimizer.decisionRules.map((rule) => (
              <article key={rule.id}>
                <span>{rule.weight}%</span>
                <strong>{rule.label}</strong>
                <p>{rule.evidence}</p>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div className="optimizer-empty">
          <ShoppingCart size={28} />
          <strong>Optimize squadで、予算内の最適編成、交換計画、追加予算ギャップを生成します。</strong>
          <p>単体の次候補ではなく、審査5項目と必須技術を同時に満たす組み合わせを探索します。</p>
        </div>
      )}
    </section>
  );
}

function LiveEvidencePanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [evidence, setEvidence] = useState<LiveEvidenceRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function monitorEvidence() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/live-evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id),
          budget: 140,
          maxSquadSize: 4
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setEvidence((await response.json()) as LiveEvidenceRun);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="live-evidence">
      <div className="evidence-heading">
        <div>
          <span className="eyebrow">Live evidence monitor</span>
          <h2>
            <Radar size={20} />
            Public proof probes
          </h2>
        </div>
        <button className="icon-button" onClick={monitorEvidence} disabled={loading} title="公開環境の証拠をライブ検証">
          <Activity size={17} />
          {loading ? "Probing" : "Monitor evidence"}
        </button>
      </div>

      {error && <p className="error-text">Live evidence request failed: {error}</p>}

      {evidence ? (
        <div className="evidence-body">
          <div className="evidence-summary">
            <div>
              <span className={cx("risk-chip", evidence.readiness === "live-ready" ? "low" : evidence.readiness === "watch" ? "medium" : "high")}>
                {evidence.readiness}
              </span>
              <h3>{evidence.summary}</h3>
              <p>{evidence.hardTruth}</p>
              <small>{new Date(evidence.generatedAt).toLocaleString()}</small>
            </div>
            <div className="evidence-score">
              <strong>{evidence.evidenceScore}</strong>
              <span>live proof</span>
            </div>
          </div>

          <div className="evidence-probes">
            {evidence.probes.map((probe) => (
              <article key={probe.id} className={probe.status}>
                <div>
                  <strong>{probe.label}</strong>
                  <span>{probe.status}</span>
                </div>
                <p>{probe.evidence}</p>
                <small>{probe.latencyMs ? `${probe.latencyMs}ms` : "live"} / score {probe.score}</small>
                <a href={probe.url} target="_blank" rel="noreferrer">
                  Evidence <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>

          <div className="evidence-grid">
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Next actions
              </h3>
              <div className="evidence-actions">
                {evidence.nextActions.length > 0 ? (
                  evidence.nextActions.map((action) => (
                    <article key={action.id} className={action.priority}>
                      <div>
                        <strong>{action.label}</strong>
                        <span>{action.priority}</span>
                      </div>
                      <p>{action.action}</p>
                      <small>{action.proof}</small>
                    </article>
                  ))
                ) : (
                  <article className="clear">
                    <strong>All public probes passed</strong>
                    <p>審査員に見せる公開証拠はライブで確認済みです。</p>
                  </article>
                )}
              </div>
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                Runbook
              </h3>
              <pre>{evidence.runbook.join("\n")}</pre>
            </section>
            <section>
              <h3>
                <ShieldCheck size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(evidence.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="evidence-empty">
          <Radar size={28} />
          <strong>Monitor evidenceで、Cloud Run、Agent Card、A2A、Squad Optimizer、CIを公開環境からライブ検証します。</strong>
          <p>「提出URLが動く」という主張を、審査員の前で再実行できる証拠に変えます。</p>
        </div>
      )}
    </section>
  );
}

function MoatStressPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [moat, setMoat] = useState<MoatStressTest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function stressMoat() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/moat-stress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setMoat((await response.json()) as MoatStressTest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="moat-stress">
      <div className="moat-heading">
        <div>
          <span className="eyebrow">Competitive moat</span>
          <h2>
            <Crosshair size={20} />
            Moat Stress Test
          </h2>
        </div>
        <button className="icon-button" onClick={stressMoat} disabled={loading} title="競合反論をストレステスト">
          <ShieldCheck size={17} />
          {loading ? "Testing" : "Stress-test moat"}
        </button>
      </div>

      {error && <p className="error-text">Moat stress request failed: {error}</p>}

      {moat ? (
        <div className="moat-body">
          <div className="moat-summary">
            <div>
              <span className={cx("risk-chip", moat.verdict === "defensible" ? "low" : moat.verdict === "needs-proof" ? "medium" : "high")}>
                {moat.verdict}
              </span>
              <h3>{moat.headline}</h3>
              <p>{moat.hardTruth}</p>
              <small>{new Date(moat.generatedAt).toLocaleString()}</small>
            </div>
            <div className="moat-score">
              <strong>{moat.stressScore}</strong>
              <span>moat score</span>
            </div>
          </div>

          <div className="moat-scenarios">
            {moat.scenarios.map((scenario) => (
              <article key={scenario.id} className={scenario.verdict}>
                <div>
                  <span>{scenario.threatLevel}</span>
                  <strong>{scenario.score}</strong>
                </div>
                <h3>{scenario.competitor}</h3>
                <b>{scenario.objection}</b>
                <p>{scenario.pressure}</p>
                <strong>{scenario.answer}</strong>
                <small>{scenario.proofToShow}</small>
                <em>{scenario.residualRisk}</em>
                <div className="moat-links">
                  {scenario.evidenceLinks.map((link) => (
                    <a key={`${scenario.id}-${link.label}`} href={link.url} target="_blank" rel="noreferrer">
                      {link.label}
                      <ExternalLink size={12} />
                    </a>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="moat-grid">
            <section>
              <h3>
                <Film size={15} />
                Recording order
              </h3>
              <ol className="moat-order">
                {moat.recordingOrder.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Actions
              </h3>
              <div className="moat-actions">
                {moat.actions.map((action) => (
                  <article key={action.id} className={action.priority}>
                    <div>
                      <strong>{action.owner}</strong>
                      <span>{action.priority}</span>
                    </div>
                    <p>{action.action}</p>
                    <small>{action.proof}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(moat.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="moat-empty">
          <Crosshair size={28} />
          <strong>Stress-test moatで、ADK/LangGraph/CrewAI/Dify/AgentOpsからの反論に証拠付きで答えます。</strong>
          <p>競合を否定せず、どの証拠をどの順番で見せるかまで審査導線に変換します。</p>
        </div>
      )}
    </section>
  );
}

function JudgeBriefPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [brief, setBrief] = useState<JudgeBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildBrief() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/judge-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setBrief((await response.json()) as JudgeBrief);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="judge-brief">
      <div className="brief-heading">
        <div>
          <span className="eyebrow">Judge brief</span>
          <h2>
            <FileText size={20} />
            One-page judge briefing
          </h2>
        </div>
        <button className="icon-button" onClick={buildBrief} disabled={loading} title="審査員向けブリーフを生成">
          <BadgeCheck size={17} />
          {loading ? "Briefing" : "Build judge brief"}
        </button>
      </div>

      {error && <p className="error-text">Judge brief request failed: {error}</p>}

      {brief ? (
        <div className="brief-body">
          <div className="brief-summary">
            <div>
              <span className={cx("risk-chip", brief.readiness === "demo-ready" ? "low" : brief.readiness === "external-gaps" ? "medium" : "high")}>
                {brief.readiness}
              </span>
              <h3>{brief.title}</h3>
              <p>{brief.openingClaim}</p>
              <strong>{brief.oneLineVerdict}</strong>
              <small>{brief.hardTruth}</small>
            </div>
            <div className="brief-score">
              <strong>{brief.briefScore}</strong>
              <span>brief score</span>
            </div>
          </div>

          <div className="brief-metrics">
            {brief.keyMetrics.map((metric) => (
              <article key={metric.id} className={metric.tone}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </article>
            ))}
          </div>

          <div className="brief-grid">
            <section>
              <h3>
                <ShieldCheck size={15} />
                Proof ladder
              </h3>
              <div className="brief-proof">
                {brief.proofLadder.map((proof) => (
                  <article key={proof.id} className={proof.tone}>
                    <div>
                      <strong>{proof.label}</strong>
                      <span>{proof.tone}</span>
                    </div>
                    <p>{proof.proof}</p>
                    <a href={proof.url} target="_blank" rel="noreferrer">
                      Evidence <ExternalLink size={13} />
                    </a>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Film size={15} />
                30-second route
              </h3>
              <ol className="brief-route">
                {brief.demoRoute.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <h3>
                <AlertTriangle size={15} />
                Risks
              </h3>
              <div className="brief-risks">
                {brief.riskRegister.map((risk) => (
                  <article key={risk.id} className={risk.tone}>
                    <div>
                      <strong>{risk.label}</strong>
                      <span>{risk.tone}</span>
                    </div>
                    <p>{risk.action}</p>
                    <small>{risk.owner}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Trophy size={15} />
                Judge answers
              </h3>
              <div className="brief-answers">
                {brief.judgeAnswers.map((answer) => (
                  <article key={answer.id}>
                    <strong>{answer.label}</strong>
                    <p>{answer.answer}</p>
                    <small>{answer.evidence}</small>
                  </article>
                ))}
              </div>
              <h3>
                <ExternalLink size={15} />
                Links
              </h3>
              <div className="brief-links">
                {brief.links.map((link) => (
                  <a key={link.id} href={link.url} target="_blank" rel="noreferrer">
                    {link.label}
                    <ExternalLink size={13} />
                  </a>
                ))}
              </div>
              <h3>
                <Terminal size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(brief.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="brief-empty">
          <FileText size={28} />
          <strong>Build judge briefで、競合差別化、MVP監査、証拠、30秒導線、残リスクを1枚に束ねます。</strong>
          <p>審査員が最初に読むビューとして、機能の多さを短い判断材料に圧縮します。</p>
        </div>
      )}
    </section>
  );
}

function AutonomyLedgerPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [ledger, setLedger] = useState<AutonomyLedger | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildLedger() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/autonomy-ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setLedger((await response.json()) as AutonomyLedger);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="autonomy-ledger">
      <div className="ledger-heading">
        <div>
          <span className="eyebrow">Agent centrality</span>
          <h2>
            <Network size={20} />
            Autonomy Ledger
          </h2>
        </div>
        <button className="icon-button" onClick={buildLedger} disabled={loading} title="自律性台帳を生成">
          <GitBranch size={17} />
          {loading ? "Building" : "Build autonomy ledger"}
        </button>
      </div>

      {error && <p className="error-text">Autonomy ledger request failed: {error}</p>}

      {ledger ? (
        <div className="ledger-body">
          <div className="ledger-summary">
            <div>
              <span className={cx("risk-chip", ledger.verdict === "agent-led" ? "low" : ledger.verdict === "agent-led-with-external-gaps" ? "medium" : "high")}>
                {ledger.verdict}
              </span>
              <h3>{ledger.autonomyClaim}</h3>
              <p>{ledger.summary}</p>
            </div>
            <div className="ledger-score">
              <strong>{ledger.ledgerScore}</strong>
              <span>ledger score</span>
            </div>
          </div>

          <div className="ledger-metrics">
            {ledger.metrics.map((metric) => (
              <article key={metric.id} className={metric.status}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </article>
            ))}
          </div>

          <div className="ledger-chain">
            {ledger.chain.map((event) => (
              <article key={event.id} className={event.status}>
                <div>
                  <span>{event.phase}</span>
                  <strong>{event.actor}</strong>
                </div>
                <p>{event.decision}</p>
                <small>{event.action}</small>
                <b>{event.verifier}</b>
                <a href={event.endpoint} target="_blank" rel="noreferrer">
                  Evidence <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>

          <div className="ledger-grid">
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Handoffs
              </h3>
              <div className="ledger-handoffs">
                {ledger.handoffs.map((handoff) => (
                  <article key={handoff.id} className={handoff.status}>
                    <div>
                      <strong>{handoff.agentName}</strong>
                      <span>{handoff.status}</span>
                    </div>
                    <p>{handoff.scope}</p>
                    <small>{handoff.acceptance}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <ShieldCheck size={15} />
                Judge challenges
              </h3>
              <div className="ledger-challenges">
                {ledger.challengeAnswers.map((challenge) => (
                  <article key={challenge.id}>
                    <strong>{challenge.challenge}</strong>
                    <p>{challenge.answer}</p>
                    <small>{challenge.proof}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                Receipt
              </h3>
              <pre>{JSON.stringify({ ...ledger.receipt, a2aPayload: ledger.a2aPayload }, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="ledger-empty">
          <Network size={28} />
          <strong>Build autonomy ledgerで、AIの判断、契約、A2A委任、検証、運用、提出を1本の台帳にします。</strong>
          <p>審査基準の「AIエージェントが価値の中心」を、主張ではなく検収可能なログとして見せます。</p>
        </div>
      )}
    </section>
  );
}

function SecurityReviewPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [review, setReview] = useState<SecurityReview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runSecurityReview() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/security-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setReview((await response.json()) as SecurityReview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="security-review">
      <div className="security-heading">
        <div>
          <span className="eyebrow">Trust boundary</span>
          <h2>
            <ShieldCheck size={20} />
            Security Sentinel Review
          </h2>
        </div>
        <button className="icon-button" onClick={runSecurityReview} disabled={loading} title="公開デモの安全境界を監査">
          <ShieldCheck size={17} />
          {loading ? "Reviewing" : "Run security review"}
        </button>
      </div>

      {error && <p className="error-text">Security review request failed: {error}</p>}

      {review ? (
        <div className="security-body">
          <div className="security-summary">
            <div>
              <span className={cx("risk-chip", review.posture === "guarded" ? "low" : review.posture === "watch" ? "medium" : "high")}>
                {review.posture}
              </span>
              <h3>{review.verdict}</h3>
              <p>{review.hardTruth}</p>
            </div>
            <div className="security-score">
              <strong>{review.securityScore}</strong>
              <span>security score</span>
            </div>
          </div>

          <div className="security-controls">
            {review.controls.map((control) => (
              <article key={control.id} className={control.status}>
                <div>
                  <strong>{control.label}</strong>
                  <span>{control.status}</span>
                </div>
                <p>{control.evidence}</p>
                <small>{control.action}</small>
              </article>
            ))}
          </div>

          <div className="security-grid">
            <section>
              <h3>
                <Network size={15} />
                Trust boundaries
              </h3>
              <div className="security-boundaries">
                {review.boundaries.map((boundary) => (
                  <article key={boundary.id}>
                    <span>
                      {boundary.from}
                      {" -> "}
                      {boundary.to}
                    </span>
                    <strong>{boundary.guardrail}</strong>
                    <p>{boundary.risk}</p>
                    <small>{boundary.evidence}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <AlertTriangle size={15} />
                Threats
              </h3>
              <div className="security-threats">
                {review.threats.map((threat) => (
                  <article key={threat.id} className={threat.severity}>
                    <div>
                      <strong>{threat.threat}</strong>
                      <span>{threat.severity}</span>
                    </div>
                    <p>{threat.mitigation}</p>
                    <small>{threat.proof}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                Judge answers
              </h3>
              <div className="security-answers">
                {review.judgeAnswers.map((answer) => (
                  <article key={answer.id}>
                    <strong>{answer.question}</strong>
                    <p>{answer.answer}</p>
                    <small>{answer.evidence}</small>
                  </article>
                ))}
              </div>
              {review.nextSecurityHire && (
                <div className="security-next">
                  <span>Next security hire</span>
                  <strong>{review.nextSecurityHire.name}</strong>
                  <p>{review.nextSecurityHire.reason}</p>
                </div>
              )}
              <pre>{JSON.stringify({ runbook: review.runbookCommands, a2aPayload: review.a2aPayload }, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="security-empty">
          <ShieldCheck size={28} />
          <strong>Run security reviewで、Secret、IP allowlist、入力制限、A2A信頼境界、CIを審査用の証拠にします。</strong>
          <p>公開デモの安全性を、口頭ではなくSecurity Sentinelの監査ログとして見せます。</p>
        </div>
      )}
    </section>
  );
}

function ImpactCasePanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [impact, setImpact] = useState<ImpactCase | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runImpactCase() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/impact-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setImpact((await response.json()) as ImpactCase);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="impact-case">
      <div className="impact-heading">
        <div>
          <span className="eyebrow">Practical value</span>
          <h2>
            <TrendingUp size={20} />
            Impact Case
          </h2>
        </div>
        <button className="icon-button" onClick={runImpactCase} disabled={loading} title="実用性と体験価値を定量化">
          <Activity size={17} />
          {loading ? "Quantifying" : "Run impact case"}
        </button>
      </div>

      {error && <p className="error-text">Impact case request failed: {error}</p>}

      {impact ? (
        <div className="impact-body">
          <div className="impact-summary">
            <div>
              <span className={cx("risk-chip", impact.posture === "pilot-ready" ? "low" : impact.posture === "needs-pilot-proof" ? "medium" : "high")}>
                {impact.posture}
              </span>
              <h3>{impact.verdict}</h3>
              <p>{impact.hardTruth}</p>
            </div>
            <div className="impact-score">
              <strong>{impact.impactScore}</strong>
              <span>impact score</span>
            </div>
          </div>

          <div className="impact-metrics">
            {impact.metrics.map((metric) => (
              <article key={metric.id} className={metric.direction}>
                <div>
                  <strong>{metric.label}</strong>
                  <span>{metric.delta > 0 ? "+" : ""}{metric.delta}</span>
                </div>
                <p>{metric.before} {"->"} {metric.after} {metric.unit}</p>
                <small>{metric.evidence}</small>
              </article>
            ))}
          </div>

          <div className="impact-grid">
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Users and KPIs
              </h3>
              <div className="impact-personas">
                {impact.personas.map((persona) => (
                  <article key={persona.id}>
                    <div>
                      <strong>{persona.persona}</strong>
                      <span>{persona.kpi}</span>
                    </div>
                    <p>{persona.pain}</p>
                    <small>{persona.workflowWin}</small>
                    <b>{persona.proof}</b>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Workflow size={15} />
                Before / After workflow
              </h3>
              <div className="impact-workflow">
                {impact.workflow.map((step) => (
                  <article key={step.id}>
                    <span>{step.phase}</span>
                    <strong>{step.owner}</strong>
                    <p>{step.before}</p>
                    <small>{step.after}</small>
                    <b>{step.evidence}</b>
                  </article>
                ))}
              </div>
              <h3>
                <Rocket size={15} />
                Adoption plan
              </h3>
              <div className="impact-adoption">
                {impact.adoptionPlan.map((step) => (
                  <article key={step.id}>
                    <strong>{step.horizon}</strong>
                    <p>{step.action}</p>
                    <small>{step.acceptance}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <AlertTriangle size={15} />
                Risks and judge answers
              </h3>
              <div className="impact-risks">
                {impact.risks.map((risk) => (
                  <article key={risk.id} className={risk.severity}>
                    <div>
                      <strong>{risk.label}</strong>
                      <span>{risk.severity}</span>
                    </div>
                    <p>{risk.mitigation}</p>
                  </article>
                ))}
              </div>
              <div className="impact-answers">
                {impact.judgeAnswers.map((answer) => (
                  <article key={answer.id}>
                    <strong>{answer.question}</strong>
                    <p>{answer.answer}</p>
                    <small>{answer.evidence}</small>
                  </article>
                ))}
              </div>
              {impact.nextImpactHire && (
                <div className="impact-next">
                  <span>Next impact hire</span>
                  <strong>{impact.nextImpactHire.name}</strong>
                  <p>{impact.nextImpactHire.reason}</p>
                </div>
              )}
              <pre>{JSON.stringify(impact.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="impact-empty">
          <TrendingUp size={28} />
          <strong>Run impact caseで、対象ユーザー、時間短縮、提出信頼度、運用リスク、導入計画を定量化します。</strong>
          <p>「面白い」から「現場で何がどれだけ良くなるか」へ、審査員の実用性質問に答える証拠へ変換します。</p>
        </div>
      )}
    </section>
  );
}

function MarketIntelPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [intel, setIntel] = useState<MarketIntelReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runMarketIntel() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/market-intel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setIntel((await response.json()) as MarketIntelReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="market-intel">
      <div className="intel-heading">
        <div>
          <span className="eyebrow">Market intel</span>
          <h2>
            <Radar size={20} />
            Source-backed competitive moat
          </h2>
        </div>
        <button className="icon-button" onClick={runMarketIntel} disabled={loading} title="公式ソース付き競合分析を生成">
          <Crosshair size={17} />
          {loading ? "Reading" : "Run market intel"}
        </button>
      </div>

      {error && <p className="error-text">Market intel request failed: {error}</p>}

      {intel ? (
        <div className="intel-body">
          <div className="intel-summary">
            <div>
              <span className={cx("risk-chip", intel.status === "lead" ? "low" : intel.status === "parity" ? "medium" : "high")}>
                {intel.status}
              </span>
              <h3>{intel.headline}</h3>
              <p>{intel.thesis}</p>
            </div>
            <div className="intel-score">
              <strong>{intel.marketScore}</strong>
              <span>market score</span>
            </div>
          </div>

          <div className="intel-source-strip">
            {intel.sourceChecklist.map((source) => (
              <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
                {source.label}
                <ExternalLink size={12} />
              </a>
            ))}
          </div>

          <div className="intel-grid">
            <section>
              <h3>
                <Crosshair size={15} />
                Competitor cuts
              </h3>
              <div className="intel-comparisons">
                {intel.comparisons.map((comparison) => (
                  <article key={comparison.id} className={comparison.threatLevel}>
                    <div>
                      <strong>{comparison.competitor}</strong>
                      <span>{comparison.threatLevel}</span>
                    </div>
                    <p>{comparison.theyWinAt}</p>
                    <small>{comparison.exposedGap}</small>
                    <em>{comparison.ourCounter}</em>
                    <b>{comparison.demoProof}</b>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Trophy size={15} />
                Judge answers
              </h3>
              <div className="intel-answers">
                {intel.judgeAnswers.map((answer) => (
                  <article key={answer.criterionId}>
                    <div>
                      <strong>{answer.label}</strong>
                      <span>{answer.score}</span>
                    </div>
                    <p>{answer.answer}</p>
                    <small>{answer.evidence}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Lightbulb size={15} />
                Moves
              </h3>
              <div className="intel-moves">
                {intel.moves.map((move) => (
                  <article key={move.id} className={move.priority}>
                    <div>
                      <strong>{move.owner}</strong>
                      <span>{move.priority}</span>
                    </div>
                    <p>{move.action}</p>
                    <small>{move.proof}</small>
                  </article>
                ))}
              </div>
              <h3>
                <ShieldCheck size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(intel.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="intel-empty">
          <Radar size={28} />
          <strong>Run market intelで、公式ソース付き競合比較、差別化仮説、審査回答を生成します。</strong>
          <p>ADKやLangGraphと正面衝突せず、AI能力を調達する体験として勝つ理由を1画面にします。</p>
        </div>
      )}
    </section>
  );
}

function MvpAuditPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [audit, setAudit] = useState<MvpAuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runAudit() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/mvp-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setAudit((await response.json()) as MvpAuditReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mvp-audit">
      <div className="mvp-heading">
        <div>
          <span className="eyebrow">MVP audit</span>
          <h2>
            <Gauge size={20} />
            Hard-gate readiness check
          </h2>
        </div>
        <button className="icon-button" onClick={runAudit} disabled={loading} title="MVP監査を実行">
          <BadgeCheck size={17} />
          {loading ? "Auditing" : "Run MVP audit"}
        </button>
      </div>

      {error && <p className="error-text">MVP audit request failed: {error}</p>}

      {audit ? (
        <div className="mvp-body">
          <div className="mvp-summary">
            <div>
              <span className={cx("risk-chip", audit.band === "submission-ready" ? "low" : audit.band === "mvp-with-external-gaps" ? "medium" : "high")}>
                {audit.band}
              </span>
              <h3>{audit.verdict}</h3>
              <p>{audit.hardTruth}</p>
            </div>
            <div className="mvp-score">
              <strong>{audit.mvpScore}</strong>
              <span>MVP score</span>
            </div>
          </div>

          <div className="mvp-gates">
            {audit.gates.map((gate) => (
              <article key={gate.id} className={gate.status}>
                <div>
                  <strong>{gate.label}</strong>
                  <span>{gate.status}</span>
                </div>
                <p>{gate.evidence}</p>
                <small>{gate.nextAction}</small>
                {gate.url && (
                  <a href={gate.url} target="_blank" rel="noreferrer">
                    Evidence <ExternalLink size={13} />
                  </a>
                )}
              </article>
            ))}
          </div>

          <div className="mvp-grid">
            <section>
              <h3>
                <Trophy size={15} />
                Judge lanes
              </h3>
              <div className="mvp-lanes">
                {audit.judgeLanes.map((lane) => (
                  <article key={lane.id} className={lane.status}>
                    <div>
                      <strong>{lane.label}</strong>
                      <span>{lane.score}</span>
                    </div>
                    <p>{lane.evidence}</p>
                    <small>{lane.nextAction}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <AlertTriangle size={15} />
                Blockers
              </h3>
              <div className="mvp-actions">
                {audit.blockers.length > 0 ? (
                  audit.blockers.map((action) => (
                    <article key={action.id} className={action.priority}>
                      <div>
                        <strong>{action.label}</strong>
                        <span>{action.priority}</span>
                      </div>
                      <p>{action.action}</p>
                      <small>{action.owner} / {action.proof}</small>
                    </article>
                  ))
                ) : (
                  <article className="later">
                    <div>
                      <strong>No blockers</strong>
                      <span>clear</span>
                    </div>
                    <p>ハードゲート上の未達はありません。</p>
                  </article>
                )}
              </div>
              <h3>
                <ExternalLink size={15} />
                Proof URLs
              </h3>
              <div className="mvp-links">
                {audit.proofUrls.map((url) => (
                  <a key={url.id} href={url.url} target="_blank" rel="noreferrer">
                    {url.label}
                    <ExternalLink size={13} />
                  </a>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <ShieldCheck size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(audit.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="mvp-empty">
          <Gauge size={28} />
          <strong>Run MVP auditで、必須技術、審査5項目、DevOps証拠、提出3点をハードゲート判定します。</strong>
          <p>未発行のProtoPedia作品URLと動画URLは、合格扱いにせずwatchとして残します。</p>
        </div>
      )}
    </section>
  );
}

function SubmissionLaunchPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [gate, setGate] = useState<SubmissionLaunchGate | null>(null);
  const [protopediaUrl, setProtopediaUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runLaunchGate() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/submission-launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id),
          protopediaUrl,
          videoUrl
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setGate((await response.json()) as SubmissionLaunchGate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="submission-launch">
      <div className="launch-heading">
        <div>
          <span className="eyebrow">Final launch gate</span>
          <h2>
            <ClipboardCheck size={20} />
            Submission Launch Gate
          </h2>
        </div>
        <button className="icon-button" onClick={runLaunchGate} disabled={loading} title="提出直前ゲートを検証">
          <BadgeCheck size={17} />
          {loading ? "Checking" : "Check launch gate"}
        </button>
      </div>

      <div className="launch-inputs">
        <label>
          <span>ProtoPedia work URL</span>
          <input value={protopediaUrl} onChange={(event) => setProtopediaUrl(event.target.value)} placeholder="https://protopedia.net/prototype/..." />
        </label>
        <label>
          <span>Video URL</span>
          <input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://youtu.be/... or https://vimeo.com/..." />
        </label>
      </div>

      {error && <p className="error-text">Submission launch request failed: {error}</p>}

      {gate ? (
        <div className="launch-body">
          <div className="launch-summary">
            <div>
              <span className={cx("risk-chip", gate.readiness === "submit-ready" ? "low" : gate.readiness === "needs-external-urls" ? "medium" : "high")}>
                {gate.readiness}
              </span>
              <h3>{gate.verdict}</h3>
              <p>{gate.hardTruth}</p>
            </div>
            <div className="launch-score">
              <strong>{gate.launchScore}</strong>
              <span>launch score</span>
            </div>
          </div>

          <div className="launch-url-grid">
            {gate.urlStatuses.map((item) => (
              <article key={item.id} className={item.status}>
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.status}</span>
                </div>
                <p>{item.proof}</p>
                <small>{item.action}</small>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noreferrer">
                    Open <ExternalLink size={13} />
                  </a>
                )}
              </article>
            ))}
          </div>

          <div className="launch-grid">
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Final checklist
              </h3>
              <div className="launch-checklist">
                {gate.checklist.map((item) => (
                  <article key={item.id} className={item.status}>
                    <div>
                      <strong>{item.label}</strong>
                      <span>{item.status}</span>
                    </div>
                    <p>{item.proof}</p>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <ExternalLink size={15} />
                Copy actions
              </h3>
              <div className="launch-actions">
                {gate.copyActions.map((action) => (
                  <article key={action.id} className={action.status}>
                    <strong>{action.label}</strong>
                    <p>{action.target}</p>
                    <small>{action.value || "needs external URL"}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                Submit packet
              </h3>
              <pre>{JSON.stringify({ submitPacket: gate.submitPacket, a2aPayload: gate.a2aPayload }, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="launch-empty">
          <ClipboardCheck size={28} />
          <strong>Check launch gateで、ProtoPedia作品URLと動画URLが揃った瞬間に提出可能かを判定します。</strong>
          <p>未入力や形式不正は提出完了扱いにせず、GitHub、Cloud Run、タグ、本文、CI、証拠receiptと一緒に最終確認します。</p>
        </div>
      )}
    </section>
  );
}

function WinAutopilotPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [run, setRun] = useState<WinningAutopilotRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runAutopilot() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/win-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setRun((await response.json()) as WinningAutopilotRun);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="win-autopilot">
      <div className="autopilot-heading">
        <div>
          <span className="eyebrow">Win autopilot</span>
          <h2>
            <Rocket size={20} />
            One-click winning run
          </h2>
        </div>
        <button className="icon-button" onClick={runAutopilot} disabled={loading} title="優勝判定を一括実行">
          <Play size={17} />
          {loading ? "Running" : "Run win autopilot"}
        </button>
      </div>

      {error && <p className="error-text">Win autopilot request failed: {error}</p>}

      {run ? (
        <div className="autopilot-body">
          <div className="autopilot-summary">
            <div>
              <span className={cx("risk-chip", run.readiness === "finalist-ready" ? "low" : run.readiness === "external-gaps" ? "medium" : "high")}>
                {run.readiness}
              </span>
              <h3>{run.headline}</h3>
              <p>{run.summary}</p>
            </div>
            <div className="autopilot-score">
              <strong>{run.winScore}</strong>
              <span>win score</span>
            </div>
          </div>

          <div className="autopilot-lanes">
            {run.lanes.map((lane) => (
              <article key={lane.id} className={lane.status}>
                <div>
                  <strong>{lane.label}</strong>
                  <span>{lane.score}</span>
                </div>
                <p>{lane.proof}</p>
                <small>{lane.action}</small>
                <a href={lane.evidenceUrl} target="_blank" rel="noreferrer">
                  Evidence <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>

          <div className="autopilot-grid">
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Next actions
              </h3>
              <div className="autopilot-actions">
                {run.nextActions.map((action) => (
                  <article key={action.id} className={action.priority}>
                    <div>
                      <strong>{action.label}</strong>
                      <span>{action.priority}</span>
                    </div>
                    <p>{action.command}</p>
                    <small>{action.owner} / {action.proof}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Workflow size={15} />
                Autonomy trace
              </h3>
              <ol className="autopilot-trace">
                {run.autonomyTrace.map((trace) => (
                  <li key={trace.phase}>
                    <span>{trace.phase}</span>
                    <strong>{trace.actor}</strong>
                    <p>{trace.decision}</p>
                    <small>{trace.proof}</small>
                  </li>
                ))}
              </ol>
            </section>
            <section>
              <h3>
                <ExternalLink size={15} />
                Evidence deck
              </h3>
              <div className="autopilot-links">
                {run.evidenceDeck.map((item) => (
                  <a key={item.id} href={item.url} target="_blank" rel="noreferrer" title={item.proof}>
                    {item.label}
                    <ExternalLink size={13} />
                  </a>
                ))}
              </div>
              <h3>
                <Terminal size={15} />
                Judge narrative
              </h3>
              <pre>{run.judgeNarrative}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="autopilot-empty">
          <Rocket size={28} />
          <strong>Run win autopilotで、競合/SWOT、証拠、最終候補判定、提出、運用を一括判定します。</strong>
          <p>審査員が見るべき順番と、提出前に残る外部作業を1回で出します。</p>
        </div>
      )}
    </section>
  );
}

function SubmissionDossierPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [dossier, setDossier] = useState<SubmissionDossier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildDossier() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/dossier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setDossier((await response.json()) as SubmissionDossier);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="submission-dossier">
      <div className="dossier-heading">
        <div>
          <span className="eyebrow">Submission dossier</span>
          <h2>
            <FileText size={20} />
            Final paste-and-record packet
          </h2>
        </div>
        <button className="icon-button" onClick={buildDossier} disabled={loading} title="提出ドシエを生成">
          <ClipboardCheck size={17} />
          {loading ? "Packaging" : "Run submission dossier"}
        </button>
      </div>

      {error && <p className="error-text">Submission dossier request failed: {error}</p>}

      {dossier ? (
        <div className="dossier-body">
          <div className="dossier-summary">
            <div>
              <span className={cx("risk-chip", dossier.readiness === "ready-to-submit" ? "low" : "medium")}>{dossier.readiness}</span>
              <h3>{dossier.title}</h3>
              <p>{dossier.executiveMemo}</p>
            </div>
            <div className="dossier-score">
              <strong>{dossier.dossierScore}</strong>
              <span>dossier score</span>
            </div>
          </div>

          <div className="dossier-copy">
            {dossier.copyBlocks.map((block) => (
              <article key={block.id} className={block.status}>
                <div>
                  <strong>{block.label}</strong>
                  <span>{block.target}</span>
                </div>
                <pre>{block.value}</pre>
              </article>
            ))}
          </div>

          <div className="dossier-grid">
            <section>
              <h3>
                <ExternalLink size={15} />
                Submission links
              </h3>
              <div className="dossier-links">
                {dossier.links.map((link) => (
                  <article key={link.id} className={link.status}>
                    <div>
                      <strong>{link.label}</strong>
                      <span>{link.status}</span>
                    </div>
                    <p>{link.proof}</p>
                    {link.url && (
                      <a href={link.url} target="_blank" rel="noreferrer">
                        Open <ExternalLink size={13} />
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Film size={15} />
                Recording plan
              </h3>
              <ol className="dossier-recording">
                {dossier.recordingPlan.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <h3>
                <ClipboardCheck size={15} />
                Final checks
              </h3>
              <div className="dossier-checks">
                {dossier.finalChecks.map((check) => (
                  <article key={check.id} className={check.status}>
                    <div>
                      <strong>{check.label}</strong>
                      <span>{check.status}</span>
                    </div>
                    <p>{check.action}</p>
                    <small>{check.proof}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                Markdown dossier
              </h3>
              <pre>{dossier.markdown}</pre>
              <h3>
                <ShieldCheck size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(dossier.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="dossier-empty">
          <FileText size={28} />
          <strong>Run submission dossierで、ProtoPedia本文、動画録画順、提出リンク、最終チェックを1つに束ねます。</strong>
          <p>外部提出URLが未発行でも、貼る本文と録る順番を固定できます。</p>
        </div>
      )}
    </section>
  );
}

function DemoRunwayPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [runway, setRunway] = useState<DemoRunway | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runDemo() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/demo-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setRunway((await response.json()) as DemoRunway);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="demo-runway">
      <div className="demo-heading">
        <div>
          <span className="eyebrow">Demo runway</span>
          <h2>
            <Workflow size={20} />
            30-second judge route
          </h2>
        </div>
        <button className="icon-button" onClick={runDemo} disabled={loading} title="30秒デモ導線を生成">
          <Play size={17} />
          {loading ? "Routing" : "Run demo runway"}
        </button>
      </div>

      {error && <p className="error-text">Demo runway request failed: {error}</p>}

      {runway ? (
        <div className="demo-body">
          <div className="demo-summary">
            <div>
              <span className={cx("risk-chip", runway.readiness === "recording-ready" ? "low" : "medium")}>{runway.readiness}</span>
              <h3>{runway.headline}</h3>
              <p>{runway.summary}</p>
            </div>
            <div className="demo-score">
              <strong>{runway.demoScore}</strong>
              <span>{runway.totalSeconds}s route</span>
            </div>
          </div>

          <div className="demo-steps">
            {runway.steps.map((step) => (
              <article key={step.id} className={step.status}>
                <div>
                  <span>{step.timeRange}</span>
                  <strong>{step.screen}</strong>
                </div>
                <p>{step.action}</p>
                <small>{step.narration}</small>
                <a href={step.evidenceUrl} target="_blank" rel="noreferrer">
                  Evidence <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>

          <div className="demo-grid">
            <section>
              <h3>
                <ExternalLink size={15} />
                Proof links
              </h3>
              <div className="demo-links">
                {runway.proofLinks.map((link) => (
                  <a key={link.id} href={link.url} target="_blank" rel="noreferrer" title={link.proof}>
                    {link.label}
                    <ExternalLink size={13} />
                  </a>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Film size={15} />
                Recording cues
              </h3>
              <ol className="demo-cues">
                {runway.recordingCues.map((cue) => (
                  <li key={cue}>{cue}</li>
                ))}
              </ol>
            </section>
            <section>
              <h3>
                <AlertTriangle size={15} />
                External risks
              </h3>
              <div className="demo-risks">
                {runway.risks.length > 0 ? (
                  runway.risks.map((risk) => (
                    <article key={risk.id} className={risk.severity}>
                      <div>
                        <strong>{risk.label}</strong>
                        <span>{risk.severity}</span>
                      </div>
                      <p>{risk.mitigation}</p>
                    </article>
                  ))
                ) : (
                  <article className="ready">
                    <div>
                      <strong>Ready to record</strong>
                      <span>ready</span>
                    </div>
                    <p>外部URLの残リスクはありません。</p>
                  </article>
                )}
              </div>
              <h3>
                <ShieldCheck size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(runway.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="demo-empty">
          <Workflow size={28} />
          <strong>Run demo runwayで、審査員が30秒で見る順番、証拠リンク、録画キューを生成します。</strong>
          <p>ばらばらの証拠を、提出動画と初見デモの一本道にします。</p>
        </div>
      )}
    </section>
  );
}

function JudgeProofBundle({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [proof, setProof] = useState<JudgeProof | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runProof() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setProof((await response.json()) as JudgeProof);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="proof-bundle">
      <div className="proof-heading">
        <div>
          <span className="eyebrow">Judge proof</span>
          <h2>
            <Trophy size={20} />
            One-click evidence bundle
          </h2>
        </div>
        <button className="icon-button" onClick={runProof} disabled={loading} title="審査証拠を生成">
          <Activity size={17} />
          {loading ? "Running" : "Run judge proof"}
        </button>
      </div>

      {error && <p className="error-text">Judge proof request failed: {error}</p>}

      {proof ? (
        <div className="proof-body">
          <div className="proof-summary">
            <div>
              <span className="event-pill">
                <Sparkles size={15} />
                {proof.gemini.source} / {proof.gemini.model}
              </span>
              <h3>{proof.summary}</h3>
              <p>{proof.gemini.executiveSummary}</p>
            </div>
            <div className="proof-score">
              <strong>{proof.overallScore}</strong>
              <span>overall proof</span>
            </div>
          </div>

          <div className="proof-score-grid">
            <StrategyMeter label="AI" value={proof.scores.ai} />
            <StrategyMeter label="Cloud Run" value={proof.scores.cloudRun} />
            <StrategyMeter label="A2A" value={proof.scores.a2a} />
            <StrategyMeter label="Strategy" value={proof.scores.strategy} />
            <StrategyMeter label="DevOps" value={proof.scores.devops} />
            <StrategyMeter label="CI" value={proof.scores.ci} />
            <StrategyMeter label="Submission" value={proof.scores.submission} />
          </div>

          <div className="proof-grid">
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Evidence
              </h3>
              <div className="proof-items">
                {proof.proofItems.map((item) => (
                  <article key={item.id} className={item.status}>
                    <div>
                      <strong>{item.label}</strong>
                      <span>{item.status}</span>
                    </div>
                    <p>{item.evidence}</p>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noreferrer">
                        Open <ExternalLink size={13} />
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <ExternalLink size={15} />
                Live Links
              </h3>
              <div className="proof-links">
                <a href={proof.links.app} target="_blank" rel="noreferrer">Cloud Run</a>
                <a href={proof.links.github} target="_blank" rel="noreferrer">GitHub</a>
                <a href={proof.links.ci} target="_blank" rel="noreferrer">GitHub Actions</a>
                <a href={proof.links.agentCard} target="_blank" rel="noreferrer">Agent Card</a>
                <a href={proof.links.architecture} target="_blank" rel="noreferrer">Architecture</a>
                <a href={proof.links.story} target="_blank" rel="noreferrer">Story Markdown</a>
              </div>
              <div className="proof-snapshot">
                <div>
                  <span>Weakest</span>
                  <strong>{proof.mission.weakestCriterion}</strong>
                </div>
                <div>
                  <span>Ops</span>
                  <strong>{proof.opsDrill.severity}</strong>
                </div>
                <div>
                  <span>CI</span>
                  <strong>{proof.ci.conclusion}</strong>
                </div>
                <div>
                  <span>Next</span>
                  <strong>{proof.strategy.nextBestAgent ?? proof.opsDrill.nextOpsAgent ?? "none"}</strong>
                </div>
              </div>
              <div className="proof-receipt">
                <span>{proof.receipt.algorithm}</span>
                <strong>{proof.receipt.digest}</strong>
                <p>{proof.receipt.verification}</p>
              </div>
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                Proof Runbook
              </h3>
              <pre>{proof.runbook.slice(0, 8).join("\n")}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="proof-empty">
          <Trophy size={28} />
          <strong>Run judge proofで、Gemini・Cloud Run・A2A・競合/SWOT・Mission・Ops・提出URLを一括検証します。</strong>
          <p>Win Autopilotの次に開く証拠束として、作品の価値と実装証拠を1つにまとめます。</p>
        </div>
      )}
    </section>
  );
}

function PitchDirector({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [pitch, setPitch] = useState<PitchRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runPitch() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setPitch((await response.json()) as PitchRun);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="pitch-director">
      <div className="pitch-heading">
        <div>
          <span className="eyebrow">Pitch director</span>
          <h2>
            <Film size={20} />
            30-second submission reel
          </h2>
        </div>
        <button className="icon-button" onClick={runPitch} disabled={loading} title="30秒ピッチ構成を生成">
          <Play size={17} />
          {loading ? "Building" : "Build pitch"}
        </button>
      </div>

      {error && <p className="error-text">Pitch request failed: {error}</p>}

      {pitch ? (
        <div className="pitch-body">
          <div className="pitch-summary">
            <div>
              <span className="event-pill">
                <Film size={15} />
                {pitch.totalSeconds}s / {pitch.scenes.length} scenes
              </span>
              <h3>{pitch.heroLine}</h3>
              <p>{pitch.thesis}</p>
            </div>
            <div className="pitch-score">
              <strong>{pitch.readinessScore}</strong>
              <span>recording ready</span>
            </div>
          </div>

          <div className="pitch-scene-rail">
            {pitch.scenes.map((scene) => (
              <article key={scene.id}>
                <div>
                  <span>{scene.timeRange}</span>
                  <strong>{scene.title}</strong>
                </div>
                <p>{scene.screen}</p>
                <small>{scene.caption}</small>
                <em>{scene.voiceover}</em>
                <a href={scene.evidenceUrl} target="_blank" rel="noreferrer">
                  Evidence <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>

          <div className="pitch-grid">
            <section>
              <h3>
                <Terminal size={15} />
                Voiceover
              </h3>
              <pre>{pitch.voiceoverScript}</pre>
            </section>
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Recording checklist
              </h3>
              <div className="pitch-checklist">
                {pitch.recordingChecklist.map((item) => (
                  <article key={item.id} className={item.status}>
                    <div>
                      <strong>{item.label}</strong>
                      <span>{item.status}</span>
                    </div>
                    <p>{item.proof}</p>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noreferrer">
                        Open <ExternalLink size={13} />
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <FileText size={15} />
                Lower thirds
              </h3>
              <div className="pitch-lower-thirds">
                {pitch.lowerThirds.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </div>
              <div className="pitch-warnings">
                {pitch.submissionWarnings.map((item) => (
                  <div key={item.id}>
                    <strong>{item.label}</strong>
                    <p>{item.proof}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      ) : (
        <div className="pitch-empty">
          <Film size={28} />
          <strong>Build pitchで、審査員に見せる30秒の録画順、字幕、証拠リンクを生成します。</strong>
          <p>ProtoPedia動画URLが未確定でも、今すぐ録画できる提出リールに変換します。</p>
        </div>
      )}
    </section>
  );
}

function JudgeDrillPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [drill, setDrill] = useState<JudgeDrill | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runDrill() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/judge-drill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setDrill((await response.json()) as JudgeDrill);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="judge-drill">
      <div className="judge-heading">
        <div>
          <span className="eyebrow">Judge drill</span>
          <h2>
            <Crosshair size={20} />
            Skeptical Q&A board
          </h2>
        </div>
        <button className="icon-button" onClick={runDrill} disabled={loading} title="審査員想定問答を生成">
          <Activity size={17} />
          {loading ? "Drilling" : "Run judge drill"}
        </button>
      </div>

      {error && <p className="error-text">Judge drill request failed: {error}</p>}

      {drill ? (
        <div className="judge-body">
          <div className="judge-summary">
            <div>
              <span className="event-pill">
                <AlertTriangle size={15} />
                hardest question
              </span>
              <h3>{drill.hardestQuestion}</h3>
              <p>{drill.openingRebuttal}</p>
            </div>
            <div className="judge-score">
              <strong>{drill.readinessScore}</strong>
              <span>rebuttal ready</span>
            </div>
          </div>

          <div className="judge-objections">
            {drill.objections.map((objection) => (
              <article key={objection.id} className={objection.risk}>
                <div>
                  <span>{objection.risk}</span>
                  <strong>{objection.criterion}</strong>
                </div>
                <h3>{objection.question}</h3>
                <p>{objection.answer}</p>
                <small>{objection.evidence}</small>
                <a href={objection.evidenceUrl} target="_blank" rel="noreferrer">
                  Evidence <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>

          <div className="judge-grid">
            <section>
              <h3>
                <Terminal size={15} />
                Cross-exam runbook
              </h3>
              <ol>
                {drill.crossExamRunbook.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
            <section>
              <h3>
                <ExternalLink size={15} />
                Evidence links
              </h3>
              <div className="judge-links">
                {drill.evidenceLinks.map((link) => (
                  <a key={link.id} href={link.url} target="_blank" rel="noreferrer" title={link.proof}>
                    {link.label}
                    <ExternalLink size={13} />
                  </a>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Lightbulb size={15} />
                Closing line
              </h3>
              <p>{drill.closingLine}</p>
            </section>
          </div>
        </div>
      ) : (
        <div className="judge-empty">
          <Crosshair size={28} />
          <strong>Run judge drillで、審査員の厳しい質問に対する回答と証拠リンクを生成します。</strong>
          <p>5つの審査基準ごとに、聞かれそうな疑問を先に潰します。</p>
        </div>
      )}
    </section>
  );
}

function FinalistSimulator({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [simulation, setSimulation] = useState<FinalistSimulation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runSimulation() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/finalist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setSimulation((await response.json()) as FinalistSimulation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="finalist-simulator">
      <div className="finalist-heading">
        <div>
          <span className="eyebrow">Finalist simulator</span>
          <h2>
            <Trophy size={20} />
            Judge panel verdict
          </h2>
        </div>
        <button className="icon-button" onClick={runSimulation} disabled={loading} title="最終候補判定を実行">
          <Activity size={17} />
          {loading ? "Simulating" : "Simulate finalist"}
        </button>
      </div>

      {error && <p className="error-text">Finalist simulation failed: {error}</p>}

      {simulation ? (
        <div className="finalist-body">
          <div className="finalist-summary">
            <div>
              <span className={cx("risk-chip", simulation.finalistBand === "finalist-ready" ? "low" : simulation.finalistBand === "borderline" ? "medium" : "high")}>
                {simulation.finalistBand}
              </span>
              <h3>{simulation.advanceDecision}</h3>
              <p>{simulation.winningMove}</p>
              <small>{simulation.judgeConsensus}</small>
            </div>
            <div className="finalist-score">
              <strong>{simulation.finalistScore}</strong>
              <span>finalist score</span>
            </div>
          </div>

          <div className="finalist-panels">
            {simulation.panels.map((panel) => (
              <article key={panel.id} className={panel.verdict}>
                <div>
                  <span>{panel.verdict}</span>
                  <strong>{panel.score}</strong>
                </div>
                <h3>{panel.judgeRole}</h3>
                <small>{panel.criterion}</small>
                <p>{panel.decisiveProof}</p>
                <em>{panel.concern}</em>
                <a href={panel.evidenceUrl} target="_blank" rel="noreferrer">
                  Evidence <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>

          <div className="finalist-grid">
            <section>
              <h3>
                <AlertTriangle size={15} />
                Remaining gaps
              </h3>
              <div className="finalist-gaps">
                {simulation.gaps.length > 0 ? (
                  simulation.gaps.map((gap) => (
                    <article key={gap.id} className={gap.severity}>
                      <div>
                        <strong>{gap.label}</strong>
                        <span>{gap.severity}</span>
                      </div>
                      <p>{gap.action}</p>
                      <small>{gap.proof}</small>
                    </article>
                  ))
                ) : (
                  <article className="clear">
                    <div>
                      <strong>No remaining gaps</strong>
                      <span>clear</span>
                    </div>
                    <p>提出URL、動画、証拠リンクが揃っています。</p>
                  </article>
                )}
              </div>
            </section>
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Top concern
              </h3>
              <p>{simulation.topConcern}</p>
              <h3>
                <Terminal size={15} />
                Runbook
              </h3>
              <pre>{simulation.runbook.join("\n")}</pre>
            </section>
            <section>
              <h3>
                <ShieldCheck size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(simulation.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="finalist-empty">
          <Trophy size={28} />
          <strong>Simulate finalistで、審査員5役の最終候補判定、落選理由、残ギャップ、次の一手を生成します。</strong>
          <p>機能が揃ったかではなく、審査で残れるかを判定します。</p>
        </div>
      )}
    </section>
  );
}

function SubmissionPublisher({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [publisher, setPublisher] = useState<ProtoPediaPublisher | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildPublisher() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/publisher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setPublisher((await response.json()) as ProtoPediaPublisher);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="submission-publisher">
      <div className="publisher-heading">
        <div>
          <span className="eyebrow">Submission publisher</span>
          <h2>
            <FileText size={20} />
            ProtoPedia paste kit
          </h2>
        </div>
        <button className="icon-button" onClick={buildPublisher} disabled={loading} title="提出本文を生成">
          <ClipboardCheck size={17} />
          {loading ? "Building" : "Build publisher"}
        </button>
      </div>

      {error && <p className="error-text">Publisher request failed: {error}</p>}

      {publisher ? (
        <div className="publisher-body">
          <div className="publisher-summary">
            <div>
              <span className={cx("risk-chip", publisher.readiness === "ready-to-register" ? "low" : "medium")}>{publisher.readiness}</span>
              <h3>{publisher.summary}</h3>
              <p>ProtoPediaに貼る本文、タグ、URL、動画台本、残ギャップを1つの提出パッケージにします。</p>
            </div>
            <div className="publisher-score">
              <strong>{publisher.publishScore}</strong>
              <span>publish score</span>
            </div>
          </div>

          <div className="publisher-fields">
            {publisher.pasteFields.map((field) => (
              <article key={field.id} className={field.status}>
                <div>
                  <strong>{field.label}</strong>
                  <span>{field.status}</span>
                </div>
                <small>{field.copyHint}</small>
                <pre>{field.value}</pre>
              </article>
            ))}
          </div>

          <div className="publisher-grid">
            <section>
              <h3>
                <ExternalLink size={15} />
                Assets
              </h3>
              <div className="publisher-assets">
                {publisher.assets.map((asset) => (
                  <article key={asset.id} className={asset.status}>
                    <div>
                      <strong>{asset.label}</strong>
                      <span>{asset.status}</span>
                    </div>
                    <p>{asset.proof}</p>
                    {asset.url && (
                      <a href={asset.url} target="_blank" rel="noreferrer">
                        Open <ExternalLink size={13} />
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Final checklist
              </h3>
              <div className="publisher-checklist">
                {publisher.finalChecklist.map((item) => (
                  <article key={item.id} className={item.status}>
                    <div>
                      <strong>{item.label}</strong>
                      <span>{item.status}</span>
                    </div>
                    <p>{item.action}</p>
                    <small>{item.proof}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Film size={15} />
                Recording script
              </h3>
              <pre>{publisher.recordingScript}</pre>
              <h3>
                <ShieldCheck size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(publisher.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="publisher-empty">
          <FileText size={28} />
          <strong>Build publisherで、ProtoPediaに貼る本文、タグ、URL、動画台本、未完了項目を生成します。</strong>
          <p>外部登録作業を、提出直前のチェックリストまで落とします。</p>
        </div>
      )}
    </section>
  );
}

function StrategyWarRoom({
  strategy,
  onHire
}: {
  strategy: WinningStrategy;
  onHire: (id: string) => void;
}) {
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

function MissionControl({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
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

  const visibleMission = mission;

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

      {visibleMission ? (
        <div className="mission-body">
          <div className="mission-summary">
            <strong>{visibleMission.summary}</strong>
            <p>{visibleMission.objective}</p>
            <div className="mission-kpis">
              <StrategyMeter label="Autonomy" value={visibleMission.autonomyScore} />
              <StrategyMeter label="Verification" value={visibleMission.verificationScore} />
              <StrategyMeter label="Submission" value={visibleMission.submissionScore} />
            </div>
          </div>

          <div className="mission-steps">
            {visibleMission.steps.map((step) => (
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
              {visibleMission.decisions.map((decision) => (
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
              <pre>{visibleMission.verificationCommands.join("\n")}</pre>
            </section>
            <section className="submission-pack">
              <h3>Submission Pack</h3>
              <strong>{visibleMission.submissionPack.protopediaTitle}</strong>
              <p>{visibleMission.submissionPack.demoScript}</p>
              <div className="mission-tags">
                {visibleMission.submissionPack.tags.map((tag) => (
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
                <a href={visibleMission.submissionPack.architectureDiagramUrl} target="_blank" rel="noreferrer" className="icon-link">
                  <ExternalLink size={14} />
                  Open
                </a>
              </div>
              <img src={visibleMission.submissionPack.architectureDiagramUrl} alt="Agent-To-Agent Marketplace architecture" />
            </section>

            <section className="submission-storyboard">
              <div className="submission-kit-heading">
                <h3>
                  <Film size={16} />
                  30s Storyboard
                </h3>
                <a href={visibleMission.submissionPack.storyMarkdownPath} target="_blank" rel="noreferrer" className="icon-link">
                  <FileText size={14} />
                  Markdown
                </a>
              </div>
              <ol>
                {visibleMission.submissionPack.videoStoryboard.map((shot) => (
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
                {visibleMission.submissionPack.requirements.map((item) => (
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

function OpsDrillPanel({
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

export default function App() {
  const [projectBrief, setProjectBrief] = useState(DEFAULT_PROJECT_BRIEF);
  const [selectedIds, setSelectedIds] = useState<string[]>(["market-broker", "gemini-strategist", "cloud-run-sre"]);
  const [stageFilter, setStageFilter] = useState("all");
  const [query, setQuery] = useState("");

  const recommendation = useMemo(() => recommendSquad(projectBrief, selectedIds, 140), [projectBrief, selectedIds]);
  const strategy = useMemo(() => buildWinningStrategy(recommendation), [recommendation]);
  const rankedIds = useMemo(() => new Map(recommendation.ranked.map((fit, index) => [fit.agent.id, index])), [recommendation]);

  const filteredAgents = MARKET_AGENTS.filter((agent) => {
    const matchesStage = stageFilter === "all" || agent.stage === stageFilter;
    const haystack = [agent.name, agent.handle, agent.headline, agent.synergyTags.join(" "), agent.skills.map((skill) => skill.label).join(" ")].join(" ").toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    return matchesStage && matchesQuery;
  }).sort((a, b) => (rankedIds.get(a.id) ?? 99) - (rankedIds.get(b.id) ?? 99));

  function toggleAgent(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <main className="app-shell">
      <section className="market-sky">
        <div className="market-identity">
          <span className="event-pill">
            <Cloud size={16} />
            DevOps x AI Agent Hackathon
          </span>
          <h1>Agent-To-Agent Marketplace</h1>
          <p>必要な能力を持つAIを探し、雇い、A2Aで連携する。能力値とMCP成熟度で、プロジェクト改善を購入できる市場。</p>
        </div>
        <div className="hero-stats">
          <div>
            <span>Agents</span>
            <strong>{MARKET_AGENTS.length}</strong>
          </div>
          <div>
            <span>A2A skills</span>
            <strong>{MARKET_AGENTS.reduce((sum, agent) => sum + agent.a2aSkillIds.length, 0)}</strong>
          </div>
          <div>
            <span>MCP tools</span>
            <strong>{MARKET_AGENTS.reduce((sum, agent) => sum + agent.mcp.reduce((inner, mcp) => inner + mcp.tools.length, 0), 0)}</strong>
          </div>
        </div>
      </section>

      <JudgeTourPanel recommendation={recommendation} projectBrief={projectBrief} />
      <SquadOptimizerPanel recommendation={recommendation} projectBrief={projectBrief} />
      <MoatStressPanel recommendation={recommendation} projectBrief={projectBrief} />
      <LiveEvidencePanel recommendation={recommendation} projectBrief={projectBrief} />
      <UserPilotPanel recommendation={recommendation} projectBrief={projectBrief} />
      <JudgeBriefPanel recommendation={recommendation} projectBrief={projectBrief} />
      <AutonomyLedgerPanel recommendation={recommendation} projectBrief={projectBrief} />
      <SecurityReviewPanel recommendation={recommendation} projectBrief={projectBrief} />
      <ImpactCasePanel recommendation={recommendation} projectBrief={projectBrief} />
      <MarketIntelPanel recommendation={recommendation} projectBrief={projectBrief} />
      <MvpAuditPanel recommendation={recommendation} projectBrief={projectBrief} />
      <SubmissionLaunchPanel recommendation={recommendation} projectBrief={projectBrief} />
      <WinAutopilotPanel recommendation={recommendation} projectBrief={projectBrief} />
      <SubmissionDossierPanel recommendation={recommendation} projectBrief={projectBrief} />
      <DemoRunwayPanel recommendation={recommendation} projectBrief={projectBrief} />
      <JudgeProofBundle recommendation={recommendation} projectBrief={projectBrief} />
      <PitchDirector recommendation={recommendation} projectBrief={projectBrief} />
      <JudgeDrillPanel recommendation={recommendation} projectBrief={projectBrief} />
      <FinalistSimulator recommendation={recommendation} projectBrief={projectBrief} />
      <SubmissionPublisher recommendation={recommendation} projectBrief={projectBrief} />

      <section className="workbench">
        <aside className="panel brief-panel">
          <div className="panel-heading">
            <h2>
              <GitBranch size={18} />
              Project Brief
            </h2>
            <span className="chip">brief2dev</span>
          </div>
          <textarea value={projectBrief} onChange={(event) => setProjectBrief(event.target.value)} aria-label="Project brief" />
          <div className="matched-terms">
            {recommendation.profile.matchedTerms.map((term) => (
              <span key={term}>{term}</span>
            ))}
          </div>
          <div className="filter-block">
            <label htmlFor="agent-search">
              <Search size={16} />
              Search
            </label>
            <input id="agent-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="A2A / Cloud Run / UX" />
          </div>
          <div className="stage-tabs" role="tablist" aria-label="Agent stage filter">
            {Object.entries(STAGE_LABELS).map(([id, label]) => (
              <button key={id} className={stageFilter === id ? "active" : ""} onClick={() => setStageFilter(id)}>
                {label}
              </button>
            ))}
          </div>
          <div className="requirement-stack">
            <div>
              <Cloud size={18} />
              <span>Cloud Run ready</span>
            </div>
            <div>
              <Sparkles size={18} />
              <span>Gemini 3.5 Flash</span>
            </div>
            <div>
              <Network size={18} />
              <span>A2A Agent Card</span>
            </div>
            <div>
              <ShieldCheck size={18} />
              <span>鍵なしfallback</span>
            </div>
          </div>
        </aside>

        <section className="market-panel">
          <div className="market-toolbar">
            <div>
              <span className="eyebrow">Marketplace</span>
              <h2>能力でAIを雇う</h2>
            </div>
            <div className="toolbar-badges">
              <span>Remaining {recommendation.remainingBudget}</span>
              <span>Selected {recommendation.selected.length}</span>
            </div>
          </div>
          <div className="agent-grid">
            {filteredAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} selected={selectedIds.includes(agent.id)} onToggle={toggleAgent} />
            ))}
          </div>
        </section>

        <aside className="side-stack">
          <SquadPanel recommendation={recommendation} />
          <A2APanel recommendation={recommendation} />
        </aside>
      </section>

      <ContractDesk recommendation={recommendation} projectBrief={projectBrief} />
      <StrategyWarRoom strategy={strategy} onHire={toggleAgent} />
      <MissionControl recommendation={recommendation} projectBrief={projectBrief} />
      <OpsDrillPanel recommendation={recommendation} projectBrief={projectBrief} />

      <section className="lower-grid">
        <GeminiPanel recommendation={recommendation} projectBrief={projectBrief} />
        <section className="panel mcp-panel">
          <div className="panel-heading">
            <h2>
              <Network size={18} />
              MCP Matrix
            </h2>
            <span className="chip">{recommendation.mcpMatrix.length} servers</span>
          </div>
          <div className="mcp-table">
            {recommendation.mcpMatrix.map((row) => (
              <div key={`${row.agent}-${row.mcp}`}>
                <strong>{row.mcp}</strong>
                <span>{row.agent}</span>
                <div className="meter" data-tone={scoreTone(row.maturity)}>
                  <span style={{ width: `${row.maturity}%` }} />
                </div>
                <small>{row.tools.join(" / ")}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="panel plan-panel">
          <div className="panel-heading">
            <h2>
              <CheckCircle2 size={18} />
              DevOps Loop
            </h2>
            <span className="chip">Cloud Run</span>
          </div>
          <ol>
            {recommendation.devopsPlan.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>
        <AgentCardJson />
      </section>
    </main>
  );
}
