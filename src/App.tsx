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
import type { JudgeAcceptanceMatrix } from "./acceptanceMatrix";
import { recommendSquad } from "./agentEngine";
import type { AutonomyLedger } from "./autonomyLedger";
import type { AgentTaskBoard } from "./taskBoard";
import type { WinningAutopilotRun } from "./autopilot";
import type { CompetitiveBattlecard } from "./competitiveBattlecard";
import type { SquadContract } from "./contracts";
import type { DeployRecoveryPlan } from "./deployRecovery";
import type { JudgeDemoReceipt } from "./demoReceipt";
import type { DemoConcierge } from "./demoConcierge";
import type { DemoRunway } from "./demoRunway";
import type { FinalistSimulation } from "./finalist";
import type { ImpactCase } from "./impact";
import type { JudgeBrief } from "./judgeBrief";
import type { JudgeCommandCenter } from "./judgeCommandCenter";
import type { JudgeDrill } from "./judgeDrill";
import type { JudgeRehearsalRoom } from "./judgeRehearsal";
import type { JudgeTour } from "./judgeTour";
import type { LiveEvidenceRun } from "./liveEvidence";
import { CAPABILITY_LABELS, DEFAULT_PROJECT_BRIEF, MARKET_AGENTS } from "./market";
import type { MarketIntelReport } from "./marketIntel";
import type { MissionRun } from "./mission";
import type { MoatStressTest } from "./moatStress";
import type { MvpAuditReport } from "./mvpAudit";
import type { OpsDrill } from "./ops";
import type { PilotEconomics } from "./pilotEconomics";
import type { PitchRun } from "./pitch";
import type { JudgeProof } from "./proof";
import type { PrizeStrategyBoard } from "./prizeStrategy";
import type { ProtoPediaPublisher } from "./publisher";
import type { ReleaseDriftGuard } from "./releaseDrift";
import type { SecurityReview } from "./security";
import { SUBMISSION_PROOF } from "./submission";
import type { OptimizedSquadCandidate, SquadOptimizerRun } from "./squadOptimizer";
import type { SubmissionDossier } from "./dossier";
import type { SubmissionCloseoutWorkbench } from "./submissionCloseout";
import type { SubmissionLaunchGate } from "./submissionLaunch";
import type { FinalSubmissionRunway } from "./submissionRunway";
import { buildWinningStrategy } from "./strategy";
import type { SwotQuadrant, WinningStrategy } from "./strategy";
import type { CapabilityKey, GeminiRecommendation, MarketAgent, Recommendation } from "./types";
import type { UserPilotLab } from "./userPilot";
import type { WinGapRadar } from "./winGapRadar";
import type { WinnerProofPacket } from "./winnerPacket";
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

function yen(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
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

function JudgeCommandCenterPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [center, setCenter] = useState<JudgeCommandCenter | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildCommandCenter() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/judge-command-center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setCenter((await response.json()) as JudgeCommandCenter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="judge-command">
      <div className="command-heading">
        <div>
          <span className="eyebrow">Judge command center</span>
          <h2>
            <Trophy size={20} />
            First 90 seconds
          </h2>
        </div>
        <button className="icon-button" onClick={buildCommandCenter} disabled={loading} title="審査員の初回導線を構築">
          <Play size={17} />
          {loading ? "Building" : "Build command center"}
        </button>
      </div>

      {error && <p className="error-text">Judge command request failed: {error}</p>}

      {center ? (
        <div className="command-body">
          <div className="command-summary">
            <div>
              <span className={cx("risk-chip", center.readiness === "pitch-ready" ? "low" : center.readiness === "external-gaps" ? "medium" : "high")}>
                {center.readiness}
              </span>
              <h3>{center.headline}</h3>
              <p>{center.hardTruth}</p>
              <strong>{center.openingMove}</strong>
            </div>
            <div className="command-score">
              <strong>{center.commandScore}</strong>
              <span>command score</span>
            </div>
          </div>

          <div className="command-metrics">
            {center.metrics.map((metric) => (
              <article key={metric.id} className={metric.status}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <p>{metric.evidence}</p>
              </article>
            ))}
          </div>

          <div className="command-buttons">
            {center.proofButtons.map((button) => (
              <a key={button.id} href={`#${button.id}`} className={button.status} title={`${button.reason} API: ${button.endpoint}`}>
                <span>{button.status}</span>
                <strong>{button.buttonLabel}</strong>
                <p>{button.label} / {button.score}</p>
                <small>{button.reason}</small>
              </a>
            ))}
          </div>

          <div className="command-grid">
            <section>
              <h3>
                <Film size={15} />
                90-second timeline
              </h3>
              <div className="command-timeline">
                {center.timeline.map((step) => (
                  <article key={step.id} className={step.status}>
                    <div>
                      <strong>{step.timeRange}</strong>
                      <span>{step.status}</span>
                    </div>
                    <p>{step.screen}: {step.click}</p>
                    <small>{step.say}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <AlertTriangle size={15} />
                Blockers
              </h3>
              <div className="command-blockers">
                {center.blockers.length > 0 ? (
                  center.blockers.map((blocker) => (
                    <article key={blocker.id} className={blocker.priority}>
                      <div>
                        <strong>{blocker.owner}</strong>
                        <span>{blocker.priority}</span>
                      </div>
                      <p>{blocker.action}</p>
                      <small>{blocker.proof}</small>
                    </article>
                  ))
                ) : (
                  <article className="clear">
                    <strong>No blockers</strong>
                    <p>この順番で録画と提出確認へ進めます。</p>
                  </article>
                )}
              </div>
            </section>
            <section>
              <h3>
                <FileText size={15} />
                Judge script
              </h3>
              <ol className="command-script">
                {center.judgeScript.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
              <pre>{JSON.stringify(center.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="command-empty">
          <Trophy size={28} />
          <strong>Build command centerで、最初に押す証拠、90秒導線、残ブロッカーを1画面にまとめます。</strong>
          <p>機能一覧を説明するのではなく、審査員が最初に見る順番を固定します。</p>
        </div>
      )}
    </section>
  );
}

function DemoConciergePanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [concierge, setConcierge] = useState<DemoConcierge | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildConcierge() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/demo-concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setConcierge((await response.json()) as DemoConcierge);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="demo-concierge">
      <div className="concierge-heading">
        <div>
          <span className="eyebrow">Demo concierge</span>
          <h2>
            <Radar size={20} />
            First click, no wandering
          </h2>
        </div>
        <button className="icon-button" onClick={buildConcierge} disabled={loading} title="最初の1クリック導線を生成">
          <Play size={17} />
          {loading ? "Guiding" : "Build concierge"}
        </button>
      </div>

      {error && <p className="error-text">Demo concierge request failed: {error}</p>}

      {concierge ? (
        <div className="concierge-body">
          <div className="concierge-summary">
            <div>
              <span className={cx("risk-chip", concierge.readiness === "guided" ? "low" : concierge.readiness === "external-watch" ? "medium" : "high")}>
                {concierge.readiness}
              </span>
              <h3>{concierge.headline}</h3>
              <p>{concierge.hardTruth}</p>
              <strong>{concierge.singleNextClick}</strong>
            </div>
            <div className="concierge-score">
              <strong>{concierge.conciergeScore}</strong>
              <span>concierge score</span>
            </div>
          </div>

          <div className="concierge-lanes">
            {concierge.lanes.map((lane) => (
              <article key={lane.id}>
                <div>
                  <span>{lane.persona}</span>
                  <strong>+{lane.scoreLift}</strong>
                </div>
                <h3>{lane.entryQuestion}</h3>
                <p>{lane.valueMoment}</p>
                <b>{lane.firstClick}</b>
                <ol>
                  {lane.steps.map((step) => (
                    <li key={step.id} className={step.status}>
                      <strong>{step.timeRange}</strong>
                      <span>{step.screen}</span>
                      <small>{step.successSignal}</small>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>

          <div className="concierge-grid">
            <section>
              <h3>
                <BadgeCheck size={15} />
                Success criteria
              </h3>
              {concierge.successCriteria.map((item) => (
                <article key={item.id} className={item.status}>
                  <div>
                    <strong>{item.label}</strong>
                    <span>{item.status}</span>
                  </div>
                  <p>{item.proof}</p>
                </article>
              ))}
            </section>
            <section>
              <h3>
                <Lightbulb size={15} />
                Friction cuts
              </h3>
              {concierge.frictionCuts.map((item) => (
                <article key={item.id}>
                  <strong>{item.after}</strong>
                  <p>{item.before}</p>
                  <small>{item.proof}</small>
                </article>
              ))}
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(concierge.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="concierge-empty">
          <Radar size={28} />
          <strong>Build conciergeで、審査員・買い手・提出者の最初の1クリック、話す台詞、証拠URLを固定します。</strong>
          <p>機能一覧を見せる前に、誰が来ても迷わない入口を作ります。</p>
        </div>
      )}
    </section>
  );
}

function JudgeRehearsalPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [rehearsal, setRehearsal] = useState<JudgeRehearsalRoom | null>(null);
  const [protopediaUrl, setProtopediaUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildRehearsal() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/judge-rehearsal", {
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
      setRehearsal((await response.json()) as JudgeRehearsalRoom);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="judge-rehearsal">
      <div className="rehearsal-heading">
        <div>
          <span className="eyebrow">Judge rehearsal</span>
          <h2>
            <Play size={20} />
            90-second run room
          </h2>
        </div>
        <button className="icon-button" onClick={buildRehearsal} disabled={loading} title="90秒の審査員向けリハーサルを生成">
          <Trophy size={17} />
          {loading ? "Rehearsing" : "Build rehearsal"}
        </button>
      </div>

      <div className="rehearsal-inputs">
        <label>
          <span>ProtoPedia work URL</span>
          <input value={protopediaUrl} onChange={(event) => setProtopediaUrl(event.target.value)} placeholder="https://protopedia.net/prototype/..." />
        </label>
        <label>
          <span>Video URL</span>
          <input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://youtu.be/... or https://drive.google.com/..." />
        </label>
      </div>

      {error && <p className="error-text">Judge rehearsal request failed: {error}</p>}

      {rehearsal ? (
        <div className="rehearsal-body">
          <div className="rehearsal-summary">
            <div>
              <span className={cx("risk-chip", rehearsal.readiness === "rehearsal-ready" ? "low" : rehearsal.readiness === "external-gap-rehearsal" ? "medium" : "high")}>
                {rehearsal.readiness}
              </span>
              <h3>{rehearsal.headline}</h3>
              <p>{rehearsal.hardTruth}</p>
              <strong>Next run: {rehearsal.nextRun}</strong>
            </div>
            <div className="rehearsal-score">
              <strong>{rehearsal.rehearsalScore}</strong>
              <span>rehearsal score</span>
            </div>
          </div>

          <div className="rehearsal-segments">
            {rehearsal.segments.map((segment) => (
              <article key={segment.id} className={segment.status}>
                <div>
                  <strong>{segment.timeRange}</strong>
                  <span>{segment.status}</span>
                </div>
                <h3>{segment.screen}</h3>
                <b>{segment.open}</b>
                <p>{segment.say}</p>
                <small>{segment.successSignal}</small>
                <a href={segment.proofUrl} target="_blank" rel="noreferrer">
                  Proof <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>

          <div className="rehearsal-grid">
            <section>
              <h3>
                <Crosshair size={15} />
                Question deck
              </h3>
              {rehearsal.questionDeck.map((question) => (
                <article key={question.id} className={question.status}>
                  <strong>{question.question}</strong>
                  <p>{question.answer}</p>
                  <a href={question.proofUrl} target="_blank" rel="noreferrer">
                    Open proof <ExternalLink size={13} />
                  </a>
                </article>
              ))}
            </section>
            <section>
              <h3>
                <Gauge size={15} />
                Scorecard
              </h3>
              {rehearsal.scorecard.map((criterion) => (
                <article key={criterion.id} className={criterion.status}>
                  <div>
                    <strong>{criterion.label}</strong>
                    <span>
                      {criterion.currentScore}/{criterion.targetScore}
                    </span>
                  </div>
                  <p>{criterion.rehearse}</p>
                </article>
              ))}
            </section>
            <section>
              <h3>
                <Film size={15} />
                Capture checklist
              </h3>
              {rehearsal.captureChecklist.map((item) => (
                <article key={item.id} className={item.status}>
                  <div>
                    <strong>{item.timeRange}</strong>
                    <span>{item.screen}</span>
                  </div>
                  <p>{item.narration}</p>
                </article>
              ))}
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(rehearsal.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="rehearsal-empty">
          <Play size={28} />
          <strong>Build rehearsalで、最初の90秒に開く画面、話す台詞、想定質問、録画チェックを1つにまとめます。</strong>
          <p>審査員に機能一覧を浴びせず、価値、差別化、実用性、提出状態の順に見せます。</p>
        </div>
      )}
    </section>
  );
}

function WinnerPacketPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [packet, setPacket] = useState<WinnerProofPacket | null>(null);
  const [protopediaUrl, setProtopediaUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildPacket() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/winner-packet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id),
          skipReleaseDrift: true,
          protopediaUrl,
          videoUrl
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setPacket((await response.json()) as WinnerProofPacket);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="winner-packet">
      <div className="winner-heading">
        <div>
          <span className="eyebrow">Winner proof packet</span>
          <h2>
            <Trophy size={20} />
            Five criteria, one proof path
          </h2>
        </div>
        <button className="icon-button" onClick={buildPacket} disabled={loading} title="審査5項目の勝ち証拠を束ねる">
          <BadgeCheck size={17} />
          {loading ? "Packing" : "Build packet"}
        </button>
      </div>

      <div className="winner-inputs">
        <label>
          <span>ProtoPedia work URL</span>
          <input value={protopediaUrl} onChange={(event) => setProtopediaUrl(event.target.value)} placeholder="https://protopedia.net/prototype/..." />
        </label>
        <label>
          <span>Video URL</span>
          <input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://youtu.be/... or https://drive.google.com/..." />
        </label>
      </div>

      {error && <p className="error-text">Winner packet request failed: {error}</p>}

      {packet ? (
        <div className="winner-body">
          <div className="winner-summary">
            <div>
              <span className={cx("risk-chip", packet.readiness === "winner-packet-ready" ? "low" : packet.readiness === "external-gap-packet" ? "medium" : "high")}>
                {packet.readiness}
              </span>
              <h3>{packet.headline}</h3>
              <p>{packet.hardTruth}</p>
              <strong>Next: {packet.nextAction}</strong>
            </div>
            <div className="winner-score">
              <strong>{packet.packetScore}</strong>
              <span>packet score</span>
            </div>
          </div>

          <div className="winner-criteria">
            {packet.criteria.map((criterion) => (
              <article key={criterion.id} className={criterion.status}>
                <div>
                  <span>{criterion.status}</span>
                  <strong>
                    {criterion.score}/{criterion.target}
                  </strong>
                </div>
                <h3>{criterion.label}</h3>
                <p>{criterion.judgeLine}</p>
                <b>{criterion.show}</b>
                <small>{criterion.recordingCue}</small>
                <a href={criterion.proofUrl} target="_blank" rel="noreferrer">
                  Open proof <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>

          <div className="winner-grid">
            <section>
              <h3>
                <Crosshair size={15} />
                Objection answers
              </h3>
              {packet.judgeQuestions.map((question) => (
                <article key={question.id} className={question.status}>
                  <strong>{question.question}</strong>
                  <p>{question.answer}</p>
                  <a href={question.proofUrl} target="_blank" rel="noreferrer">
                    Proof <ExternalLink size={13} />
                  </a>
                </article>
              ))}
            </section>
            <section>
              <h3>
                <Film size={15} />
                Recording order
              </h3>
              {packet.recordingOrder.map((item) => (
                <article key={item.id} className={item.status}>
                  <div>
                    <strong>{item.timeRange}</strong>
                    <span>{item.status}</span>
                  </div>
                  <p>{item.screen}</p>
                  <a href={item.proofUrl} target="_blank" rel="noreferrer">
                    Open <ExternalLink size={13} />
                  </a>
                </article>
              ))}
            </section>
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Submission copy
              </h3>
              <article>
                <strong>{packet.submissionCopy.oneLine}</strong>
                <p>{packet.submissionCopy.winnerThesis}</p>
                <small>Missing: {packet.submissionCopy.missingExternal.join(", ") || "none"}</small>
              </article>
              <pre>{JSON.stringify(packet.submissionCopy.proofOrder, null, 2)}</pre>
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(packet.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="winner-empty">
          <Trophy size={28} />
          <strong>Build packetで、審査5項目ごとの主張、証拠URL、反論回答、録画cueを1つにまとめます。</strong>
          <p>競合/SWOT、初回UX、実用価値、実装証拠をバラバラに見せず、勝ち筋として提出に貼れる形へ圧縮します。</p>
        </div>
      )}
    </section>
  );
}

function SubmissionRunwayPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [runway, setRunway] = useState<FinalSubmissionRunway | null>(null);
  const [protopediaUrl, setProtopediaUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildRunway() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/submission-runway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id),
          skipReleaseDrift: true,
          protopediaUrl,
          videoUrl
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setRunway((await response.json()) as FinalSubmissionRunway);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="submission-runway">
      <div className="runway-heading">
        <div>
          <span className="eyebrow">Final submission runway</span>
          <h2>
            <Rocket size={20} />
            Deadline workback to 2026/7/10
          </h2>
        </div>
        <button className="icon-button" onClick={buildRunway} disabled={loading} title="提出締切から逆算して残作業を束ねる">
          <ClipboardCheck size={17} />
          {loading ? "Planning" : "Build runway"}
        </button>
      </div>

      <div className="runway-inputs">
        <label>
          <span>ProtoPedia work URL</span>
          <input value={protopediaUrl} onChange={(event) => setProtopediaUrl(event.target.value)} placeholder="https://protopedia.net/prototype/..." />
        </label>
        <label>
          <span>Video URL</span>
          <input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://youtu.be/... or https://drive.google.com/..." />
        </label>
      </div>

      {error && <p className="error-text">Submission runway request failed: {error}</p>}

      {runway ? (
        <div className="runway-body">
          <div className="runway-summary">
            <div>
              <span className={cx("risk-chip", runway.readiness === "on-track" ? "low" : runway.readiness === "deadline-risk" ? "medium" : "high")}>
                {runway.readiness}
              </span>
              <h3>{runway.headline}</h3>
              <p>{runway.hardTruth}</p>
              <strong>
                Next: {runway.nextAction.label} by {runway.nextAction.dueDate}
              </strong>
            </div>
            <div className="runway-score">
              <strong>{runway.runwayScore}</strong>
              <span>{runway.daysRemaining} days left</span>
            </div>
          </div>

          <div className="runway-tracks">
            {runway.tracks.map((track) => (
              <section key={track.id} className={track.status}>
                <div>
                  <span>{track.status}</span>
                  <strong>{track.score}</strong>
                </div>
                <h3>{track.label}</h3>
                <p>{track.summary}</p>
                {track.milestones.map((milestone) => (
                  <article key={milestone.id} className={milestone.status}>
                    <div>
                      <strong>{milestone.label}</strong>
                      <span>{milestone.dueDate}</span>
                    </div>
                    <p>{milestone.action}</p>
                    <small>{milestone.acceptance}</small>
                    <a href={milestone.proofUrl} target="_blank" rel="noreferrer">
                      Proof <ExternalLink size={13} />
                    </a>
                  </article>
                ))}
              </section>
            ))}
          </div>

          <div className="runway-grid">
            <section>
              <h3>
                <CheckCircle2 size={15} />
                Daily plan
              </h3>
              {runway.dailyPlan.map((item) => (
                <article key={item}>
                  <p>{item}</p>
                </article>
              ))}
            </section>
            <section>
              <h3>
                <BadgeCheck size={15} />
                Evidence locks
              </h3>
              {runway.evidenceLocks.map((lock) => (
                <article key={lock.id} className={lock.status}>
                  <div>
                    <strong>{lock.label}</strong>
                    <span>{lock.status}</span>
                  </div>
                  <p>{lock.proof}</p>
                  <a href={lock.url} target="_blank" rel="noreferrer">
                    Open <ExternalLink size={13} />
                  </a>
                </article>
              ))}
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(runway.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="runway-empty">
          <Rocket size={28} />
          <strong>Build runwayで、7/10 23:59 JSTから逆算した提出作業、証拠URL、検収条件を1つにまとめます。</strong>
          <p>Winner Packetの勝ち証拠を、動画、ProtoPedia、構成図、最終提出フォームへ落とし込みます。</p>
        </div>
      )}
    </section>
  );
}

function PrizeStrategyPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [board, setBoard] = useState<PrizeStrategyBoard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildPrizeStrategy() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/prize-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setBoard((await response.json()) as PrizeStrategyBoard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="prize-strategy" className="prize-strategy">
      <div className="prize-heading">
        <div>
          <span className="eyebrow">Prize strategy board</span>
          <h2>
            <Crosshair size={20} />
            Win the scorecard
          </h2>
        </div>
        <button className="icon-button" onClick={buildPrizeStrategy} disabled={loading} title="審査5項目の優勝作戦を生成">
          <Trophy size={17} />
          {loading ? "Scoring" : "Build prize strategy"}
        </button>
      </div>

      {error && <p className="error-text">Prize strategy request failed: {error}</p>}

      {board ? (
        <div className="prize-body">
          <div className="prize-summary">
            <div>
              <span className={cx("risk-chip", board.readiness === "winner-ready" ? "low" : board.readiness === "finalist-track" ? "medium" : "high")}>
                {board.readiness}
              </span>
              <h3>{board.headline}</h3>
              <p>{board.hardTruth}</p>
              <strong>{board.winHypothesis}</strong>
            </div>
            <div className="prize-score">
              <strong>{board.prizeScore}</strong>
              <span>prize score</span>
            </div>
          </div>

          <div className="prize-criteria">
            {board.criteria.map((criterion) => (
              <article key={criterion.id} className={criterion.status}>
                <div>
                  <span>{criterion.label}</span>
                  <strong>{criterion.currentScore}</strong>
                </div>
                <p>target {criterion.targetScore} / delta {criterion.delta}</p>
                <small>{criterion.decisiveProof}</small>
                <b>{criterion.demoMove}</b>
              </article>
            ))}
          </div>

          <div className="prize-grid">
            <section>
              <h3>
                <BadgeCheck size={15} />
                Proof moves
              </h3>
              <div className="prize-moves">
                {board.proofMoves.map((move) => (
                  <a key={move.id} href={move.endpoint} target="_blank" rel="noreferrer">
                    <span>{move.screen}</span>
                    <strong>{move.label}</strong>
                    <p>{move.proof}</p>
                    <small>{move.score}</small>
                  </a>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Film size={15} />
                Final pitch order
              </h3>
              <div className="prize-pitch">
                {board.pitchOrder.map((step) => (
                  <article key={step.id}>
                    <div>
                      <strong>{step.timeRange}</strong>
                      <span>{step.proofMoveId}</span>
                    </div>
                    <p>{step.screen}</p>
                    <small>{step.say}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <AlertTriangle size={15} />
                Risks to close
              </h3>
              <div className="prize-risks">
                {board.risks.length > 0 ? (
                  board.risks.slice(0, 6).map((risk) => (
                    <article key={risk.id} className={risk.priority}>
                      <div>
                        <strong>{risk.owner}</strong>
                        <span>{risk.priority}</span>
                      </div>
                      <p>{risk.risk}</p>
                      <small>{risk.action}</small>
                    </article>
                  ))
                ) : (
                  <article className="clear">
                    <strong>No prize risks</strong>
                    <p>{board.judgeClose}</p>
                  </article>
                )}
              </div>
              <h3>
                <Terminal size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(board.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="prize-empty">
          <Crosshair size={28} />
          <strong>Build prize strategyで、審査5項目の目標点、現在証拠、最終ピッチ順、残リスクを優勝作戦にします。</strong>
          <p>MVPが足りるかではなく、どの証拠で採点を取りに行くかを固定します。</p>
        </div>
      )}
    </section>
  );
}

function WinGapRadarPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [radar, setRadar] = useState<WinGapRadar | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildRadar() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/win-gap-radar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id),
          skipReleaseDrift: true
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setRadar((await response.json()) as WinGapRadar);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="win-gap-radar" className="win-gap-radar">
      <div className="gap-heading">
        <div>
          <span className="eyebrow">Win gap radar</span>
          <h2>
            <Radar size={20} />
            MVP gaps into feature bets
          </h2>
        </div>
        <button className="icon-button" onClick={buildRadar} disabled={loading} title="競合/SWOTから勝つためのMVPギャップを生成">
          <Crosshair size={17} />
          {loading ? "Mapping" : "Build gap radar"}
        </button>
      </div>

      {error && <p className="error-text">Win gap radar request failed: {error}</p>}

      {radar ? (
        <div className="gap-body">
          <div className="gap-summary">
            <div>
              <span className={cx("risk-chip", radar.readiness === "winner-track" ? "low" : radar.readiness === "mvp-gap-watch" ? "medium" : "high")}>
                {radar.readiness}
              </span>
              <h3>{radar.headline}</h3>
              <p>{radar.hardTruth}</p>
              <strong>{radar.mvpDecision}</strong>
            </div>
            <div className="gap-score">
              <strong>{radar.radarScore}</strong>
              <span>gap score</span>
            </div>
          </div>

          <div className="gap-lanes">
            {radar.lanes.map((lane) => (
              <article key={lane.id} className={lane.status}>
                <div>
                  <span>{lane.priority}</span>
                  <strong>{lane.score}</strong>
                </div>
                <h3>{lane.label}</h3>
                <p>{lane.competitorPressure}</p>
                <small>{lane.swotSignal.quadrant}: {lane.swotSignal.title}</small>
                <b>{lane.featureHypothesis}</b>
                <em>{lane.nextAction}</em>
                <a href={lane.proofUrl} target="_blank" rel="noreferrer">
                  Evidence <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>

          <div className="gap-grid">
            <section>
              <h3>
                <Lightbulb size={15} />
                Feature bets
              </h3>
              <div className="gap-bets">
                {radar.featureBets.map((bet) => (
                  <article key={bet.id} className={bet.status}>
                    <div>
                      <strong>{bet.label}</strong>
                      <span>{bet.priority}</span>
                    </div>
                    <p>{bet.why}</p>
                    <small>{bet.build}</small>
                    <b>{bet.acceptance}</b>
                    <a href={bet.proofUrl} target="_blank" rel="noreferrer">
                      Proof <ExternalLink size={13} />
                    </a>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <AlertTriangle size={15} />
                Cut list
              </h3>
              <div className="gap-cuts">
                {radar.cutList.map((item) => (
                  <article key={item.id}>
                    <strong>{item.label}</strong>
                    <p>{item.reason}</p>
                  </article>
                ))}
              </div>
              <h3>
                <ClipboardCheck size={15} />
                External gaps
              </h3>
              <div className="gap-external">
                {radar.externalGaps.length > 0 ? (
                  radar.externalGaps.map((gap) => (
                    <article key={gap.id}>
                      <strong>{gap.label}</strong>
                      <p>{gap.action}</p>
                      <small>{gap.proof}</small>
                    </article>
                  ))
                ) : (
                  <article className="banked">
                    <strong>No external gaps</strong>
                    <p>提出URLはすべて揃っています。</p>
                  </article>
                )}
              </div>
            </section>
            <section>
              <h3>
                <Film size={15} />
                Proof script
              </h3>
              <ol className="gap-script">
                {radar.proofScript.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
              <h3>
                <Terminal size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(radar.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="gap-empty">
          <Radar size={28} />
          <strong>Build gap radarで、競合分析、SWOT、MVP監査、最終候補判定を、次に閉じる機能仮説とcut listに変換します。</strong>
          <p>「機能が足りるか」を感覚で判断せず、勝つために閉じるギャップだけを優先します。</p>
        </div>
      )}
    </section>
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
    <section id="judge-tour" className="judge-tour">
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

          {pilot.guideRails.length > 0 && (
            <div className="pilot-guide-rails">
              {pilot.guideRails.map((rail) => (
                <article key={rail.id}>
                  <div>
                    <strong>{rail.label}</strong>
                    <span>-{rail.reducesSeconds}s</span>
                  </div>
                  <p>{rail.screen}</p>
                  <small>{rail.evidence}</small>
                </article>
              ))}
            </div>
          )}

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

function ReleaseDriftPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [drift, setDrift] = useState<ReleaseDriftGuard | null>(null);
  const [targetUrl, setTargetUrl] = useState<string>(SUBMISSION_PROOF.deployedUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function checkDrift() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/release-drift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id),
          targetUrl
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setDrift((await response.json()) as ReleaseDriftGuard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="release-drift" className="live-evidence release-drift">
      <div className="evidence-heading">
        <div>
          <span className="eyebrow">Release drift guard</span>
          <h2>
            <Rocket size={20} />
            Public revision check
          </h2>
        </div>
        <button className="icon-button" onClick={checkDrift} disabled={loading} title="公開Cloud Runのrevision driftを検査">
          <Activity size={17} />
          {loading ? "Checking" : "Check release drift"}
        </button>
      </div>

      <div className="drift-target-row">
        <label htmlFor="release-target-url">Target Cloud Run URL</label>
        <input id="release-target-url" value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} />
      </div>

      {error && <p className="error-text">Release drift request failed: {error}</p>}

      {drift ? (
        <div className="evidence-body">
          <div className="evidence-summary">
            <div>
              <span className={cx("risk-chip", drift.verdict === "release-current" ? "low" : drift.verdict === "deploy-drift" ? "medium" : "high")}>
                {drift.verdict}
              </span>
              <h3>{drift.summary}</h3>
              <p>{drift.hardTruth}</p>
              <small>
                {drift.targetBaseUrl} / {new Date(drift.generatedAt).toLocaleString()}
              </small>
            </div>
            <div className="evidence-score">
              <strong>{drift.driftScore}</strong>
              <span>release score</span>
            </div>
          </div>

          <div className="drift-targets">
            <article>
              <span>expected skills</span>
              <strong>{drift.expectedSkillCount}</strong>
              <p>current local Agent Card surface</p>
            </article>
            <article>
              <span>observed skills</span>
              <strong>{drift.observedSkillCount}</strong>
              <p>target Cloud Run Agent Card surface</p>
            </article>
            <article className={drift.missingSkills.length > 0 ? "watch" : "passed"}>
              <span>missing required skills</span>
              <strong>{drift.missingSkills.length}</strong>
              <p>{drift.missingSkills.length > 0 ? drift.missingSkills.join(", ") : "none"}</p>
            </article>
          </div>

          <div className="evidence-probes">
            {drift.probes.map((probe) => (
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
                {drift.nextActions.length > 0 ? (
                  drift.nextActions.map((action) => (
                    <article key={action.id} className={action.priority}>
                      <div>
                        <strong>{action.id}</strong>
                        <span>{action.priority}</span>
                      </div>
                      <p>{action.action}</p>
                      <small>{action.owner} / {action.proof}</small>
                    </article>
                  ))
                ) : (
                  <article className="clear">
                    <strong>Release is current</strong>
                    <p>公開Cloud Runは最新skill surfaceを返しています。</p>
                  </article>
                )}
              </div>
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                Redeploy runbook
              </h3>
              <pre>{drift.runbook.join("\n")}</pre>
            </section>
            <section>
              <h3>
                <ShieldCheck size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(drift.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="evidence-empty">
          <Rocket size={28} />
          <strong>Check release driftで、公開Cloud Runが最新Agent Card、Acceptance Matrix、A2A artifactを出しているか確認します。</strong>
          <p>CIが緑でも、提出URLが古いrevisionなら審査員には未実装に見えます。</p>
        </div>
      )}
    </section>
  );
}

function DeployRecoveryPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [plan, setPlan] = useState<DeployRecoveryPlan | null>(null);
  const [targetUrl, setTargetUrl] = useState<string>(SUBMISSION_PROOF.deployedUrl);
  const [lastDeployError, setLastDeployError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildRecoveryPlan() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/deploy-recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id),
          targetUrl,
          lastDeployError
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setPlan((await response.json()) as DeployRecoveryPlan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="deploy-recovery" className="deploy-recovery">
      <div className="recovery-heading">
        <div>
          <span className="eyebrow">Deploy recovery</span>
          <h2>
            <Terminal size={20} />
            Cloud Run recovery plan
          </h2>
        </div>
        <button className="icon-button" onClick={buildRecoveryPlan} disabled={loading} title="Cloud Run再デプロイ復旧計画を作成">
          <Rocket size={17} />
          {loading ? "Planning" : "Plan deploy recovery"}
        </button>
      </div>

      <div className="recovery-inputs">
        <label>
          Target Cloud Run URL
          <input value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} />
        </label>
        <label>
          Last deploy error
          <textarea
            value={lastDeployError}
            onChange={(event) => setLastDeployError(event.target.value)}
            placeholder="Paste gcloud auth / Cloud Build error output when available"
          />
        </label>
      </div>

      {error && <p className="error-text">Deploy recovery request failed: {error}</p>}

      {plan ? (
        <div className="recovery-body">
          <div className="recovery-summary">
            <div>
              <span className={cx("risk-chip", plan.readiness === "recovered" ? "low" : plan.readiness === "blocked" ? "high" : "medium")}>
                {plan.readiness}
              </span>
              <h3>{plan.headline}</h3>
              <p>{plan.hardTruth}</p>
              <strong>{plan.primaryAction}</strong>
            </div>
            <div className="recovery-score">
              <strong>{plan.recoveryScore}</strong>
              <span>recovery score</span>
            </div>
          </div>

          <div className="recovery-checks">
            {plan.checks.map((check) => (
              <article key={check.id} className={check.status}>
                <span>{check.status}</span>
                <strong>{check.label}</strong>
                <p>{check.evidence}</p>
              </article>
            ))}
          </div>

          <div className="recovery-grid">
            <section>
              <h3>
                <Terminal size={15} />
                Commands
              </h3>
              <div className="recovery-commands">
                {plan.commands.map((command) => (
                  <article key={command.id} className={command.blocking ? "blocked" : command.copyGroup}>
                    <div>
                      <strong>{command.label}</strong>
                      <span>{command.copyGroup}</span>
                    </div>
                    <pre>{command.command}</pre>
                    <p>{command.why}</p>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Recovery steps
              </h3>
              <div className="recovery-steps">
                {plan.steps.map((step) => (
                  <article key={step.id} className={step.status}>
                    <div>
                      <strong>{step.window}</strong>
                      <span>{step.status}</span>
                    </div>
                    <p>{step.owner}: {step.action}</p>
                    <small>{step.verify}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <AlertTriangle size={15} />
                Blockers
              </h3>
              <div className="recovery-blockers">
                {plan.blockers.length > 0 ? (
                  plan.blockers.map((blocker) => (
                    <article key={blocker.id} className={blocker.priority}>
                      <div>
                        <strong>{blocker.owner}</strong>
                        <span>{blocker.priority}</span>
                      </div>
                      <p>{blocker.action}</p>
                      <small>{blocker.proof}</small>
                    </article>
                  ))
                ) : (
                  <article className="ready">
                    <strong>No deploy blockers</strong>
                    <p>公開URLは最新です。Judge Command Centerへ戻って録画前確認に進めます。</p>
                  </article>
                )}
              </div>
              <ol className="recovery-script">
                {plan.judgeScript.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
              <pre>{JSON.stringify(plan.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="recovery-empty">
          <Terminal size={28} />
          <strong>Plan deploy recoveryで、公開Cloud Run driftを再デプロイ手順へ変換します。</strong>
          <p>gcloud認証エラーを貼ると、コード問題ではなく手動認証が必要な状態として判定します。</p>
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

function CompetitiveBattlecardPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [battlecard, setBattlecard] = useState<CompetitiveBattlecard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildBattlecard() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/competitive-battlecard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setBattlecard((await response.json()) as CompetitiveBattlecard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="competitive-battlecard" className="battlecard-panel">
      <div className="battle-heading">
        <div>
          <span className="eyebrow">Competitive battlecard</span>
          <h2>
            <Network size={20} />
            Judge-ready competitor answers
          </h2>
        </div>
        <button className="icon-button" onClick={buildBattlecard} disabled={loading} title="競合別の審査回答カードを生成">
          <ClipboardCheck size={17} />
          {loading ? "Building" : "Build battlecard"}
        </button>
      </div>

      {error && <p className="error-text">Competitive battlecard request failed: {error}</p>}

      {battlecard ? (
        <div className="battle-body">
          <div className="battle-summary">
            <div>
              <span className={cx("risk-chip", battlecard.readiness === "judge-ready" ? "low" : battlecard.readiness === "needs-proof" ? "medium" : "high")}>
                {battlecard.readiness}
              </span>
              <h3>{battlecard.headline}</h3>
              <p>{battlecard.hardTruth}</p>
              <small>{battlecard.thesis}</small>
            </div>
            <div className="battle-score">
              <strong>{battlecard.battleScore}</strong>
              <span>battle score</span>
            </div>
          </div>

          <div className="battle-cards">
            {battlecard.cards.map((card) => (
              <article key={card.id} className={card.status}>
                <div>
                  <span>{card.threatLevel}</span>
                  <strong>{card.score}</strong>
                </div>
                <h3>{card.competitor}</h3>
                <small>{card.category}</small>
                <b>{card.judgeQuestion}</b>
                <p>{card.whereTheyWin}</p>
                <strong>{card.shortAnswer}</strong>
                <em>{card.whereWeWin}</em>
                <small>{card.proofRoute}</small>
                <div className="battle-sources">
                  {card.sourceUrls.map((source) => (
                    <a key={`${card.id}-${source.url}`} href={source.url} target="_blank" rel="noreferrer">
                      {source.label}
                      <ExternalLink size={12} />
                    </a>
                  ))}
                </div>
                <div className="battle-swot-chips">
                  {card.swotLinks.map((link) => (
                    <span key={`${card.id}-${link.quadrant}-${link.title}`} className={link.signal}>
                      {link.quadrant}: {link.title}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="battle-grid">
            <section>
              <h3>
                <AlertTriangle size={15} />
                Top risks
              </h3>
              <div className="battle-risks">
                {battlecard.topRisks.map((risk) => (
                  <article key={risk.id} className={risk.severity}>
                    <div>
                      <strong>{risk.id}</strong>
                      <span>{risk.severity}</span>
                    </div>
                    <p>{risk.risk}</p>
                    <small>{risk.response}</small>
                    <b>{risk.proof}</b>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Trophy size={15} />
                SWOT receipts
              </h3>
              <div className="battle-receipts">
                {battlecard.swotReceipts.map((receipt) => (
                  <article key={`${receipt.quadrant}-${receipt.title}`} className={receipt.signal}>
                    <span>{receipt.quadrant}</span>
                    <strong>{receipt.title}</strong>
                    <p>{receipt.detail}</p>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Film size={15} />
                Judge script
              </h3>
              <ol className="battle-script">
                {battlecard.judgeScript.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
              <h3>
                <Terminal size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(battlecard.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="battle-empty">
          <Network size={28} />
          <strong>Build battlecardで、競合別の質問、短い回答、SWOT根拠、公式ソース、録画で見せる証拠を1枚に束ねます。</strong>
          <p>Moat Stressの反論を、審査員がそのまま質問しても返せるbattlecardに圧縮します。</p>
        </div>
      )}
    </section>
  );
}

function DemoReceiptPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [receipt, setReceipt] = useState<JudgeDemoReceipt | null>(null);
  const [protopediaUrl, setProtopediaUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sealReceipt() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/demo-receipt", {
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
      setReceipt((await response.json()) as JudgeDemoReceipt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="demo-receipt">
      <div className="receipt-heading">
        <div>
          <span className="eyebrow">Judge demo receipt</span>
          <h2>
            <BadgeCheck size={20} />
            Seal the demo
          </h2>
        </div>
        <button className="icon-button" onClick={sealReceipt} disabled={loading} title="審査デモreceiptを発行">
          <ClipboardCheck size={17} />
          {loading ? "Sealing" : "Seal receipt"}
        </button>
      </div>

      <div className="receipt-inputs">
        <label>
          <span>ProtoPedia URL</span>
          <input value={protopediaUrl} onChange={(event) => setProtopediaUrl(event.target.value)} placeholder="https://protopedia.net/prototype/..." />
        </label>
        <label>
          <span>Video URL</span>
          <input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://youtu.be/..." />
        </label>
      </div>

      {error && <p className="error-text">Demo receipt request failed: {error}</p>}

      {receipt ? (
        <div className="receipt-body">
          <div className="receipt-summary">
            <div>
              <span className={cx("risk-chip", receipt.verdict === "sealed" ? "low" : receipt.verdict === "needs-external-submit" ? "medium" : "high")}>
                {receipt.verdict}
              </span>
              <h3>{receipt.headline}</h3>
              <p>{receipt.hardTruth}</p>
              <small>{new Date(receipt.generatedAt).toLocaleString()}</small>
            </div>
            <div className="receipt-score">
              <strong>{receipt.receiptScore}</strong>
              <span>receipt score</span>
            </div>
          </div>

          <div className="receipt-stamps">
            {receipt.stamps.map((stamp) => (
              <article key={stamp.id} className={stamp.status}>
                <div>
                  <strong>{stamp.label}</strong>
                  <span>{stamp.status}</span>
                </div>
                <b>{stamp.score}</b>
                <p>{stamp.proof}</p>
                <a href={stamp.url} target="_blank" rel="noreferrer">
                  Evidence <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>

          <div className="receipt-grid">
            <section>
              <h3>
                <Film size={15} />
                Recording order
              </h3>
              <ol className="receipt-order">
                {receipt.recordingOrder.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Next actions
              </h3>
              <div className="receipt-actions">
                {receipt.actions.length > 0 ? (
                  receipt.actions.map((action) => (
                    <article key={action.id} className={action.priority}>
                      <div>
                        <strong>{action.priority}</strong>
                        <span>{action.id}</span>
                      </div>
                      <p>{action.action}</p>
                      <small>{action.proof}</small>
                    </article>
                  ))
                ) : (
                  <article className="clear">
                    <strong>Receipt sealed</strong>
                    <p>提出動画の検収票としてdigestを控えられます。</p>
                  </article>
                )}
              </div>
            </section>
            <section>
              <h3>
                <ShieldCheck size={15} />
                Digest
              </h3>
              <div className="receipt-digest">
                <span>{receipt.digest.algorithm}</span>
                <strong>{receipt.digest.digest}</strong>
                <p>{receipt.digest.verification}</p>
              </div>
              <h3>
                <Terminal size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(receipt.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="receipt-empty">
          <BadgeCheck size={28} />
          <strong>Seal receiptで、審査導線、競合反論、編成判断、公開証拠、外部URL状態をsha256 digest付きで固定します。</strong>
          <p>動画URLとProtoPedia URLが未入力ならwatchとして残し、提出完了扱いにしません。</p>
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

function AcceptanceMatrixPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [matrix, setMatrix] = useState<JudgeAcceptanceMatrix | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildMatrix() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/acceptance-matrix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setMatrix((await response.json()) as JudgeAcceptanceMatrix);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="acceptance-matrix" className="acceptance-matrix">
      <div className="acceptance-heading">
        <div>
          <span className="eyebrow">Judge acceptance matrix</span>
          <h2>
            <BadgeCheck size={20} />
            MVP acceptance table
          </h2>
        </div>
        <button className="icon-button" onClick={buildMatrix} disabled={loading} title="審査受入表を生成">
          <ClipboardCheck size={17} />
          {loading ? "Checking" : "Build acceptance matrix"}
        </button>
      </div>

      {error && <p className="error-text">Acceptance matrix request failed: {error}</p>}

      {matrix ? (
        <div className="acceptance-body">
          <div className="acceptance-summary">
            <div>
              <span className={cx("risk-chip", matrix.verdict === "ready-to-submit" ? "low" : matrix.verdict === "accepted-with-external-gaps" ? "medium" : "high")}>
                {matrix.verdict}
              </span>
              <h3>{matrix.headline}</h3>
              <p>{matrix.hardTruth}</p>
              <small>{new Date(matrix.generatedAt).toLocaleString()}</small>
            </div>
            <div className="acceptance-score">
              <strong>{matrix.acceptanceScore}</strong>
              <span>acceptance score</span>
            </div>
          </div>

          <div className="acceptance-proof">
            {matrix.decisiveProof.map((proof) => (
              <article key={proof.id}>
                <span>{proof.label}</span>
                <strong>{proof.value}</strong>
                <p>{proof.proof}</p>
              </article>
            ))}
          </div>

          <div className="acceptance-rows">
            {matrix.rows.map((row) => (
              <article key={row.id} className={row.status}>
                <div>
                  <span>{row.area}</span>
                  <strong>{row.label}</strong>
                  <b>{row.score}</b>
                </div>
                <p>{row.requirement}</p>
                <small>{row.evidence}</small>
                <a href={row.proofUrl} target="_blank" rel="noreferrer">
                  Evidence <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>

          <div className="acceptance-grid">
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Next actions
              </h3>
              <div className="acceptance-actions">
                {matrix.nextActions.length > 0 ? (
                  matrix.nextActions.map((action) => (
                    <article key={action.id} className={action.priority}>
                      <div>
                        <strong>{action.id}</strong>
                        <span>{action.priority}</span>
                      </div>
                      <p>{action.action}</p>
                      <small>{action.owner} / {action.proof}</small>
                    </article>
                  ))
                ) : (
                  <article className="clear">
                    <strong>All rows accepted</strong>
                    <p>提出前の受入表としてそのまま見せられます。</p>
                  </article>
                )}
              </div>
            </section>
            <section>
              <h3>
                <ShieldCheck size={15} />
                Digest
              </h3>
              <div className="acceptance-digest">
                <span>{matrix.digest.algorithm}</span>
                <strong>{matrix.digest.digest}</strong>
                <p>{matrix.digest.verification}</p>
              </div>
              <h3>
                <Terminal size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(matrix.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="acceptance-empty">
          <BadgeCheck size={28} />
          <strong>Build acceptance matrixで、必須技術、審査5項目、公開証拠、提出物をaccepted/watch/blockedの受入表にします。</strong>
          <p>機能一覧ではなく、審査員が検収できる合否表としてMVP状態を説明します。</p>
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

function AgentTaskBoardPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [board, setBoard] = useState<AgentTaskBoard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildTaskBoard() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/task-board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setBoard((await response.json()) as AgentTaskBoard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="task-board">
      <div className="task-heading">
        <div>
          <span className="eyebrow">A2A delegation</span>
          <h2>
            <Workflow size={20} />
            Agent Task Board
          </h2>
        </div>
        <button className="icon-button" onClick={buildTaskBoard} disabled={loading} title="A2A仕事票を生成">
          <ClipboardCheck size={17} />
          {loading ? "Building" : "Build task board"}
        </button>
      </div>

      {error && <p className="error-text">Task board request failed: {error}</p>}

      {board ? (
        <div className="task-body">
          <div className="task-summary">
            <div>
              <span className={cx("risk-chip", board.readiness === "delegation-ready" ? "low" : board.readiness === "watch-verification" ? "medium" : "high")}>
                {board.readiness}
              </span>
              <h3>{board.headline}</h3>
              <p>{board.hardTruth}</p>
            </div>
            <div className="task-score">
              <strong>{board.taskScore}</strong>
              <span>task score</span>
            </div>
          </div>

          <div className="task-orders">
            {board.workOrders.map((order) => (
              <article key={order.id} className={order.status}>
                <div className="task-order-top">
                  <span>{order.phase}</span>
                  <strong>{order.agentName}</strong>
                  <b>{order.status}</b>
                </div>
                <p>{order.objective}</p>
                <div className="task-acceptance">
                  {order.acceptance.slice(0, 3).map((item) => (
                    <small key={item}>{item}</small>
                  ))}
                </div>
                <div className="task-proof-row">
                  <code>{order.verifier}</code>
                  <a href={order.proofUrl} target="_blank" rel="noreferrer">
                    Proof <ExternalLink size={13} />
                  </a>
                </div>
                <em>{order.nextAction}</em>
              </article>
            ))}
          </div>

          <div className="task-grid">
            <section>
              <h3>
                <GitBranch size={15} />
                Execution order
              </h3>
              <ol className="task-list">
                {board.executionOrder.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </section>
            <section>
              <h3>
                <BadgeCheck size={15} />
                Verification queue
              </h3>
              <div className="task-verifications">
                {board.verifications.map((verification) => (
                  <article key={verification.id} className={verification.status}>
                    <div>
                      <strong>{verification.label}</strong>
                      <span>{verification.status}</span>
                    </div>
                    <code>{verification.command}</code>
                    <small>{verification.proof}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                A2A receipt
              </h3>
              <pre>{JSON.stringify({ receipt: board.receipt, a2aPayload: board.a2aPayload }, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="task-empty">
          <Workflow size={28} />
          <strong>Build task boardで、選んだAIへ渡す仕事票、受入条件、証拠URLをA2A形式に束ねます。</strong>
          <p>AIエージェント中心性を、分析結果ではなく委任と検収の実行面として見せます。</p>
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

function PilotEconomicsPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [economics, setEconomics] = useState<PilotEconomics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runPilotEconomics() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/pilot-economics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setEconomics((await response.json()) as PilotEconomics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="pilot-economics" className="pilot-economics">
      <div className="economics-heading">
        <div>
          <span className="eyebrow">Buyer proof</span>
          <h2>
            <Coins size={20} />
            Pilot Economics
          </h2>
        </div>
        <button className="icon-button" onClick={runPilotEconomics} disabled={loading} title="導入費用と回収仮説を検証">
          <Activity size={17} />
          {loading ? "Calculating" : "Build pilot economics"}
        </button>
      </div>

      {error && <p className="error-text">Pilot economics request failed: {error}</p>}

      {economics ? (
        <div className="economics-body">
          <div className="economics-summary">
            <div>
              <span
                className={cx(
                  "risk-chip",
                  economics.posture === "investment-ready" ? "low" : economics.posture === "needs-pilot-proof" ? "medium" : "high"
                )}
              >
                {economics.posture}
              </span>
              <h3>{economics.verdict}</h3>
              <p>{economics.hardTruth}</p>
            </div>
            <div className="economics-score">
              <strong>{economics.economicsScore}</strong>
              <span>economics score</span>
            </div>
          </div>

          <div className="economics-unit">
            <article>
              <span>Monthly value</span>
              <strong>{yen(economics.unitEconomics.monthlyValueYen)}</strong>
              <p>{economics.unitEconomics.savedHoursPerCycle}h saved per cycle at {yen(economics.unitEconomics.assumedHourlyCostYen)} / h</p>
            </article>
            <article>
              <span>Pilot cost</span>
              <strong>{yen(economics.unitEconomics.pilotCostYen)}</strong>
              <p>Contract Desk scope, selected AI budget, and acceptance overhead.</p>
            </article>
            <article>
              <span>Payback</span>
              <strong>{economics.unitEconomics.paybackDays} days</strong>
              <p>Conservative pilot model; not a guaranteed financial forecast.</p>
            </article>
            <article>
              <span>Confidence</span>
              <strong>{economics.unitEconomics.confidenceScore}</strong>
              <p>Impact, User Pilot, Contract, Ops, Security, and judge criteria.</p>
            </article>
          </div>

          <div className="economics-metrics">
            {economics.metrics.map((metric) => (
              <article key={metric.id} className={metric.status}>
                <span>{metric.status}</span>
                <strong>{metric.label}</strong>
                <p>
                  {metric.unit === "yen" ? yen(metric.value) : metric.value} {metric.unit !== "yen" ? metric.unit : ""}
                </p>
                <small>{metric.evidence}</small>
              </article>
            ))}
          </div>

          <div className="economics-grid">
            <section>
              <h3>
                <Coins size={15} />
                Pricing lanes
              </h3>
              <div className="economics-pricing">
                {economics.pricingLanes.map((lane) => (
                  <article key={lane.id} className={lane.status}>
                    <div>
                      <strong>{lane.label}</strong>
                      <span>{yen(lane.priceYen)}</span>
                    </div>
                    <p>{lane.targetBuyer}</p>
                    <small>{lane.acceptance}</small>
                    <b>{lane.includes.join(" / ")}</b>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Rocket size={15} />
                Pilot plan
              </h3>
              <div className="economics-plan">
                {economics.pilotPlan.map((step) => (
                  <article key={step.id} className={step.status}>
                    <div>
                      <strong>{step.horizon}</strong>
                      <span>{step.status}</span>
                    </div>
                    <p>{step.action}</p>
                    <small>{step.successMetric}</small>
                    <b>{step.proof}</b>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <AlertTriangle size={15} />
                Buyer objections
              </h3>
              <div className="economics-objections">
                {economics.buyerObjections.map((objection) => (
                  <article key={objection.id} className={objection.status}>
                    <div>
                      <strong>{objection.objection}</strong>
                      <span>{objection.status}</span>
                    </div>
                    <p>{objection.answer}</p>
                    <small>{objection.evidence}</small>
                  </article>
                ))}
              </div>
              <div className="economics-actions">
                {economics.nextActions.map((action) => (
                  <article key={action.id} className={action.priority}>
                    <span>{action.priority}</span>
                    <strong>{action.owner}</strong>
                    <p>{action.action}</p>
                    <small>{action.proof}</small>
                  </article>
                ))}
              </div>
              <pre>{JSON.stringify(economics.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="economics-empty">
          <Coins size={28} />
          <strong>Build pilot economicsで、導入費用、回収日数、価格レーン、買い手の反論を投資判断の証拠にします。</strong>
          <p>Impact CaseのKPIを、審査員が「これなら試す理由がある」と判断できるpilot investment caseへ変換します。</p>
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

function SubmissionCloseoutPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [workbench, setWorkbench] = useState<SubmissionCloseoutWorkbench | null>(null);
  const [protopediaUrl, setProtopediaUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildCloseout() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/submission-closeout", {
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
      setWorkbench((await response.json()) as SubmissionCloseoutWorkbench);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="submission-closeout">
      <div className="closeout-heading">
        <div>
          <span className="eyebrow">Submission closeout</span>
          <h2>
            <Rocket size={20} />
            Final external workbench
          </h2>
        </div>
        <button className="icon-button" onClick={buildCloseout} disabled={loading} title="外部提出作業を順番付きで閉じる">
          <BadgeCheck size={17} />
          {loading ? "Closing" : "Build closeout"}
        </button>
      </div>

      <div className="closeout-inputs">
        <label>
          <span>ProtoPedia work URL</span>
          <input value={protopediaUrl} onChange={(event) => setProtopediaUrl(event.target.value)} placeholder="https://protopedia.net/prototype/..." />
        </label>
        <label>
          <span>Video URL</span>
          <input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://youtu.be/... or https://drive.google.com/..." />
        </label>
      </div>

      {error && <p className="error-text">Submission closeout request failed: {error}</p>}

      {workbench ? (
        <div className="closeout-body">
          <div className="closeout-summary">
            <div>
              <span className={cx("risk-chip", workbench.readiness === "ready-to-submit" ? "low" : workbench.readiness === "needs-closeout" ? "medium" : "high")}>
                {workbench.readiness}
              </span>
              <h3>{workbench.headline}</h3>
              <p>{workbench.hardTruth}</p>
              <strong>
                Next: {workbench.nextAction.label} / {workbench.nextAction.status}
              </strong>
            </div>
            <div className="closeout-score">
              <strong>{workbench.closeoutScore}</strong>
              <span>closeout score</span>
            </div>
          </div>

          <div className="closeout-work">
            {workbench.workItems.map((item) => (
              <article key={item.id} className={item.status}>
                <div>
                  <span>{item.priority}</span>
                  <strong>{item.label}</strong>
                  <b>{item.status}</b>
                </div>
                <p>{item.action}</p>
                <small>{item.proof}</small>
                <a href={item.endpoint} target="_blank" rel="noreferrer">
                  Evidence <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>

          <div className="closeout-grid">
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Copy tray
              </h3>
              <div className="closeout-copy">
                {workbench.copyFields.slice(0, 5).map((field) => (
                  <article key={field.id} className={field.status}>
                    <div>
                      <strong>{field.label}</strong>
                      <span>{field.target}</span>
                    </div>
                    <pre>{field.value}</pre>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Film size={15} />
                Video run
              </h3>
              <div className="closeout-video">
                {workbench.videoSteps.map((step) => (
                  <article key={step.id} className={step.status}>
                    <div>
                      <strong>{step.timeRange}</strong>
                      <span>{step.screen}</span>
                    </div>
                    <p>{step.narration}</p>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                Submit packet
              </h3>
              <pre>{JSON.stringify({ submitPacket: workbench.submitPacket, a2aPayload: workbench.a2aPayload }, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="closeout-empty">
          <Rocket size={28} />
          <strong>Build closeoutで、ProtoPedia貼付、構成図、30秒動画、外部URL、最終提出フォームを順番付きの作業台にします。</strong>
          <p>URL未入力なら今やる作業として残し、URL形式が不正なら提出完了扱いにしません。</p>
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
    <section id="win-autopilot" className="win-autopilot">
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

          <div className="dossier-handoff">
            <section>
              <h3>
                <ExternalLink size={15} />
                Submit fields
              </h3>
              <div>
                {dossier.handoffPacket.submitFields.map((field) => (
                  <article key={field.id} className={field.status}>
                    <strong>{field.label}</strong>
                    <span>{field.status}</span>
                    <p>{field.target}</p>
                    <small>{field.value || field.proof}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Film size={15} />
                Video chapters
              </h3>
              <div>
                {dossier.handoffPacket.videoChapters.slice(0, 5).map((chapter) => (
                  <article key={chapter.id} className={chapter.status}>
                    <strong>{chapter.timeRange}</strong>
                    <span>{chapter.screen}</span>
                    <p>{chapter.narration}</p>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Workflow size={15} />
                Architecture pack
              </h3>
              <div>
                <article className={dossier.handoffPacket.architecturePack.readiness === "submission-ready" ? "ready" : "watch"}>
                  <strong>{dossier.handoffPacket.architecturePack.architectureScore} architecture score</strong>
                  <span>{dossier.handoffPacket.architecturePack.readiness}</span>
                  <p>{dossier.handoffPacket.architecturePack.headline}</p>
                  <small>{dossier.handoffPacket.architecturePack.diagramUrl}</small>
                </article>
                {dossier.handoffPacket.architecturePack.requirements.slice(0, 3).map((requirement) => (
                  <article key={requirement.id} className={requirement.status}>
                    <strong>{requirement.label}</strong>
                    <span>{requirement.status}</span>
                    <p>{requirement.evidence}</p>
                  </article>
                ))}
              </div>
            </section>
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

          <div className="judge-cross-exam">
            <section>
              <h3>
                <ShieldCheck size={15} />
                Cross-exam deck
              </h3>
              <div>
                {drill.crossExamDeck.map((card) => (
                  <article key={card.id} className={card.risk}>
                    <div>
                      <strong>{card.competitor}</strong>
                      <span>{card.risk}</span>
                    </div>
                    <h4>{card.triggerQuestion}</h4>
                    <p>{card.answerPattern}</p>
                    <small>{card.fallbackLine}</small>
                    <span>+{card.scoreLift} scoring lever</span>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Gauge size={15} />
                60s answer path
              </h3>
              <ol>
                {drill.timeboxedAnswer.map((step) => (
                  <li key={step.timeRange}>
                    <strong>{step.timeRange}</strong>
                    <span>{step.move}</span>
                    <small>{step.proof}</small>
                  </li>
                ))}
              </ol>
            </section>
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

      <JudgeCommandCenterPanel recommendation={recommendation} projectBrief={projectBrief} />
      <DemoConciergePanel recommendation={recommendation} projectBrief={projectBrief} />
      <JudgeRehearsalPanel recommendation={recommendation} projectBrief={projectBrief} />
      <WinnerPacketPanel recommendation={recommendation} projectBrief={projectBrief} />
      <SubmissionRunwayPanel recommendation={recommendation} projectBrief={projectBrief} />
      <PrizeStrategyPanel recommendation={recommendation} projectBrief={projectBrief} />
      <WinGapRadarPanel recommendation={recommendation} projectBrief={projectBrief} />
      <JudgeTourPanel recommendation={recommendation} projectBrief={projectBrief} />
      <SquadOptimizerPanel recommendation={recommendation} projectBrief={projectBrief} />
      <MoatStressPanel recommendation={recommendation} projectBrief={projectBrief} />
      <CompetitiveBattlecardPanel recommendation={recommendation} projectBrief={projectBrief} />
      <LiveEvidencePanel recommendation={recommendation} projectBrief={projectBrief} />
      <ReleaseDriftPanel recommendation={recommendation} projectBrief={projectBrief} />
      <DeployRecoveryPanel recommendation={recommendation} projectBrief={projectBrief} />
      <DemoReceiptPanel recommendation={recommendation} projectBrief={projectBrief} />
      <UserPilotPanel recommendation={recommendation} projectBrief={projectBrief} />
      <JudgeBriefPanel recommendation={recommendation} projectBrief={projectBrief} />
      <AcceptanceMatrixPanel recommendation={recommendation} projectBrief={projectBrief} />
      <AutonomyLedgerPanel recommendation={recommendation} projectBrief={projectBrief} />
      <AgentTaskBoardPanel recommendation={recommendation} projectBrief={projectBrief} />
      <SecurityReviewPanel recommendation={recommendation} projectBrief={projectBrief} />
      <ImpactCasePanel recommendation={recommendation} projectBrief={projectBrief} />
      <PilotEconomicsPanel recommendation={recommendation} projectBrief={projectBrief} />
      <MarketIntelPanel recommendation={recommendation} projectBrief={projectBrief} />
      <MvpAuditPanel recommendation={recommendation} projectBrief={projectBrief} />
      <SubmissionLaunchPanel recommendation={recommendation} projectBrief={projectBrief} />
      <SubmissionCloseoutPanel recommendation={recommendation} projectBrief={projectBrief} />
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
