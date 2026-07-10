import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { recommendSquad } from "./agentEngine.js";
import { MAX_CUSTOM_AGENTS, mergeAgentCatalog, type AgentCardImportResult } from "./customAgent.js";
import { DEFAULT_PROJECT_BRIEF } from "./market.js";
import { ONBOARDING_TEMPLATES } from "./onboardingTemplates.js";
import OpsAgentConsole from "./OpsAgentConsole.js";
import type { GeminiRecommendation, MarketAgent, SquadScore } from "./types.js";

function ScoreBar({ label, before, after }: { label: string; before: number; after: number }) {
  const delta = after - before;
  return (
    <div className="score-row">
      <span className="score-label">{label}</span>
      <div className="score-track">
        <span className="score-fill score-fill-before" style={{ width: `${before}%` }} />
        <span className="score-fill score-fill-after" style={{ width: `${after}%` }} />
      </div>
      <span className="score-delta">{delta >= 0 ? `+${delta}` : delta}</span>
    </div>
  );
}

const SCORE_ROWS: Array<{ key: keyof SquadScore; label: string }> = [
  { key: "planning", label: "企画設計" },
  { key: "delivery", label: "実装力" },
  { key: "reliability", label: "信頼性" },
  { key: "usability", label: "UX" },
  { key: "governance", label: "統治(A2A/MCP)" }
];

export default function AppHome() {
  const [brief, setBrief] = useState(DEFAULT_PROJECT_BRIEF);
  const [customAgents, setCustomAgents] = useState<MarketAgent[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [gemini, setGemini] = useState<GeminiRecommendation | null>(null);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [cardUrl, setCardUrl] = useState("");
  const [cardResult, setCardResult] = useState<AgentCardImportResult | null>(null);
  const [cardLoading, setCardLoading] = useState(false);

  const agentCatalog = useMemo(() => mergeAgentCatalog(customAgents), [customAgents]);
  const recommendation = useMemo(
    () => recommendSquad(brief, selectedIds, 140, agentCatalog),
    [brief, selectedIds, agentCatalog]
  );
  const hiredIds = useMemo(() => new Set(recommendation.selected.map((agent) => agent.id)), [recommendation]);

  function toggleAgent(id: string) {
    setSelectedIds((prev) => {
      const base = prev.length > 0 ? prev : recommendation.selected.map((agent) => agent.id);
      return base.includes(id) ? base.filter((item) => item !== id) : [...base, id];
    });
  }

  function applyTemplate(templateId: string) {
    const template = ONBOARDING_TEMPLATES.find((item) => item.id === templateId);
    if (!template) return;
    setBrief(template.brief);
    setSelectedIds(template.selectedAgentIds);
    setGemini(null);
  }

  async function runGeminiRecommend() {
    setGeminiLoading(true);
    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectBrief: brief, selectedAgentIds: recommendation.selected.map((agent) => agent.id) })
      });
      setGemini((await response.json()) as GeminiRecommendation);
    } catch {
      setGemini(null);
    } finally {
      setGeminiLoading(false);
    }
  }

  async function importAgentCard() {
    if (!cardUrl.trim()) return;
    setCardLoading(true);
    try {
      const response = await fetch("/api/agent-card/discover", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: cardUrl.trim() })
      });
      const result = (await response.json()) as AgentCardImportResult;
      setCardResult(result);
      if (result.status === "accepted" && customAgents.length < MAX_CUSTOM_AGENTS) {
        setCustomAgents((prev) => [...prev, result.agent]);
      }
    } catch {
      setCardResult({ status: "rejected", error: "Agent Cardの取得に失敗しました。", warnings: [], signals: [] });
    } finally {
      setCardLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="hero-header">
        <div className="brand">
          <span className="brand-mark">◆</span>
          <div>
            <p className="brand-name">Agent Market</p>
            <p className="brand-tag">必要なAIを、探して雇う。</p>
          </div>
        </div>
        <span className="live-badge">
          <CheckCircle2 size={14} /> A2A Agent Card ・ Cloud Run 稼働中
        </span>
      </header>

      <section className="onboarding">
        <p className="section-eyebrow">はじめる</p>
        <div className="template-row">
          {ONBOARDING_TEMPLATES.map((template) => (
            <button key={template.id} type="button" className="template-chip" onClick={() => applyTemplate(template.id)}>
              <span className="template-label">{template.label}</span>
              <span className="template-audience">{template.audience}</span>
            </button>
          ))}
        </div>
      </section>

      <ol className="flow">
        <li className="flow-step">
          <div className="flow-badge">1</div>
          <div className="flow-body">
            <h2>プロジェクトのブリーフを入力</h2>
            <p className="flow-desc">解きたい課題を書くだけ。</p>
            <textarea className="brief-input" value={brief} onChange={(event) => setBrief(event.target.value)} rows={4} />
          </div>
        </li>

        <li className="flow-step">
          <div className="flow-badge">2</div>
          <div className="flow-body">
            <h2>AIがブリーフを診断</h2>
            <p className="flow-desc">語句から必要な能力を抽出する。</p>
            <div className="chip-row">
              {recommendation.profile.matchedTerms.length === 0 ? (
                <span className="chip-empty">一致する語句なし（既定の重みで診断）</span>
              ) : (
                recommendation.profile.matchedTerms.map((term) => (
                  <span key={term} className="chip">
                    {term}
                  </span>
                ))
              )}
            </div>
          </div>
        </li>

        <li className="flow-step">
          <div className="flow-badge">3</div>
          <div className="flow-body">
            <h2>エージェント市場をランキング表示</h2>
            <p className="flow-desc">価値スコア順。「雇う」で編成に加える。</p>
            <div className="agent-grid">
              {recommendation.ranked.map(({ agent, valueScore }) => {
                const hired = hiredIds.has(agent.id);
                return (
                  <div key={agent.id} className="agent-card" style={{ borderColor: agent.color }}>
                    <div className="agent-card-head">
                      {agent.avatarUrl ? (
                        <img className="agent-avatar-img" src={agent.avatarUrl} alt={agent.name} style={{ borderColor: agent.color }} />
                      ) : (
                        <span className="agent-avatar" style={{ background: agent.color }}>
                          {agent.name.slice(0, 1)}
                        </span>
                      )}
                      <div>
                        <p className="agent-name">{agent.name}</p>
                        <p className="agent-headline">{agent.headline}</p>
                      </div>
                    </div>
                    <div className="agent-card-foot">
                      <span className="agent-value">value {valueScore}</span>
                      <span className="agent-price">¥{agent.price}</span>
                      <button type="button" className={`btn-hire${hired ? " is-active" : ""}`} onClick={() => toggleAgent(agent.id)}>
                        {hired ? "解雇" : "雇う"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </li>

        <li className="flow-step">
          <div className="flow-badge">4</div>
          <div className="flow-body">
            <h2>雇うと、プロジェクトのスコアが上がる</h2>
            <p className="flow-desc">購入前 → 購入後の改善量を可視化する。</p>
            <div className="score-panel">
              {SCORE_ROWS.map((row) => (
                <ScoreBar key={row.key} label={row.label} before={recommendation.before[row.key]} after={recommendation.after[row.key]} />
              ))}
            </div>
          </div>
        </li>

        <li className="flow-step">
          <div className="flow-badge">5</div>
          <div className="flow-body">
            <h2>雇ったエージェントが本物の仕事を実行 — 8体すべて実データで動く</h2>
            <p className="flow-desc">
              デモではなく実実行 — 実ログ/実CI/実脆弱性DB/実HTML/実A2A委任を証拠に、Geminiが自律判断し、独立checkerの検証を経てFirestoreへ記録する。
            </p>
            <OpsAgentConsole projectBrief={brief} />
          </div>
        </li>

        <li className="flow-step">
          <div className="flow-badge">6</div>
          <div className="flow-body">
            <h2>Gemini 3.5 Flash が戦略をまとめる</h2>
            <p className="flow-desc">APIキー未設定でもローカル推論でフォールバックする。</p>
            <button type="button" className="btn-primary" onClick={runGeminiRecommend} disabled={geminiLoading}>
              {geminiLoading ? "分析中…" : "Geminiで分析する"}
            </button>
            {gemini ? (
              <div className="gemini-panel">
                <span className="gemini-tag">
                  {gemini.model} ・ {gemini.source === "gemini" ? "live" : "fallback"}
                </span>
                <p>
                  <strong>要約</strong> — {gemini.executiveSummary}
                </p>
                <p>
                  <strong>勝ち筋</strong> — {gemini.winningAngle}
                </p>
                <p>
                  <strong>ピッチ</strong> — {gemini.pitchScript}
                </p>
              </div>
            ) : null}
          </div>
        </li>
      </ol>

      <section className="agent-card-import">
        <p className="section-eyebrow">Agent Cardを取り込む</p>
        <div className="import-row">
          <input
            className="import-input"
            placeholder="https://example.com/.well-known/agent-card.json"
            value={cardUrl}
            onChange={(event) => setCardUrl(event.target.value)}
          />
          <button type="button" className="btn-secondary" onClick={importAgentCard} disabled={cardLoading}>
            {cardLoading ? "取込中…" : "取り込む"}
          </button>
        </div>
        {cardResult ? (
          cardResult.status === "accepted" ? (
            <p className="import-ok">
              <CheckCircle2 size={14} /> {cardResult.agent.name} を市場に追加しました。
            </p>
          ) : (
            <p className="import-error">{cardResult.error}</p>
          )
        ) : null}
      </section>

    </main>
  );
}
