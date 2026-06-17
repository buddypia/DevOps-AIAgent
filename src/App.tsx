import {
  BadgeCheck,
  Bot,
  CheckCircle2,
  Cloud,
  Coins,
  Download,
  ExternalLink,
  Gauge,
  GitBranch,
  Network,
  Play,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  TrendingUp
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { recommendSquad } from "./agentEngine";
import { CAPABILITY_LABELS, DEFAULT_PROJECT_BRIEF, MARKET_AGENTS } from "./market";
import type { CapabilityKey, GeminiRecommendation, MarketAgent, Recommendation } from "./types";
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

export default function App() {
  const [projectBrief, setProjectBrief] = useState(DEFAULT_PROJECT_BRIEF);
  const [selectedIds, setSelectedIds] = useState<string[]>(["market-broker", "gemini-strategist", "cloud-run-sre"]);
  const [stageFilter, setStageFilter] = useState("all");
  const [query, setQuery] = useState("");

  const recommendation = useMemo(() => recommendSquad(projectBrief, selectedIds, 140), [projectBrief, selectedIds]);
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
