import { ClipboardCheck, Coins, ShieldCheck, ShoppingCart, Terminal, Workflow } from "lucide-react";
import { useState } from "react";
import type { SquadContract } from "./contracts";
import type { Recommendation } from "./types";

export default function ContractDesk({
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
