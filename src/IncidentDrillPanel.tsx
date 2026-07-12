import { useState } from "react";
import { CheckCircle2, Cloud, FlaskConical, Shuffle, ShieldAlert } from "lucide-react";

type DrillScenario = {
  id: string;
  label: string;
  severity: "ERROR" | "WARNING";
  summary: string;
};

type DrillResponse = {
  ok?: boolean;
  drillId?: string;
  scenario?: DrillScenario;
  note?: string;
  error?: string;
};

export default function IncidentDrillPanel() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<DrillResponse | null>(null);

  async function runDrill() {
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch("/api/ops-agent/incident-drill", { method: "POST" });
      const body = (await response.json()) as DrillResponse;
      setResult(response.ok ? body : { error: body.error ?? "模擬デモを開始できませんでした。" });
    } catch {
      setResult({ error: "模擬デモAPIに接続できませんでした。" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="safe-demo" className="drill-panel" aria-labelledby="safe-demo-title">
      <div className="drill-panel-head">
        <div>
          <p className="section-kicker">変更なしで試す</p>
          <h2 id="safe-demo-title">
            <FlaskConical size={20} /> 模擬インシデント注入
          </h2>
          <p className="drill-lede">
            本番データや決済APIには触れず、合成した障害ログだけをCloud Loggingに追加します。
          </p>
        </div>
        <div className="drill-safety-note">
          <ShieldAlert size={18} />
          <span>
            <strong>デモ専用</strong>
            <small>実障害ではありません</small>
          </span>
        </div>
      </div>

      <div className="drill-layout">
        <div className="drill-steps" aria-label="模擬デモの手順">
          <div className="drill-step">
            <span className="drill-step-index">01</span>
            <div>
              <strong>障害ケースを選ぶ</strong>
              <p>レイテンシやリトライなど、毎回異なる演習ログを選びます。</p>
            </div>
          </div>
          <div className="drill-step">
            <span className="drill-step-index">02</span>
            <div>
              <strong>ログに記録する</strong>
              <p>約15秒後からCloud Run SREの実ログ監査で確認できます。</p>
            </div>
          </div>
          <div className="drill-step">
            <span className="drill-step-index">03</span>
            <div>
              <strong>結果を画面で確認</strong>
              <p>生成されたIDとシナリオを、この画面の結果で確認できます。</p>
            </div>
          </div>
        </div>

        <div className="drill-action">
          <div className="drill-action-icon" aria-hidden="true">
            <Shuffle size={24} />
          </div>
          <p>サービスを止めずに、ログ連携だけを試せます</p>
          <button type="button" className="btn-demo" onClick={runDrill} disabled={busy}>
            <Cloud size={16} /> {busy ? "ログを追加中..." : "合成ログを追加"}
          </button>
          <small>1分に1回まで。アプリの機能停止や外部API呼び出しはありません。</small>
        </div>
      </div>

      {result ? (
        <div className={`drill-result${result.error ? " is-error" : ""}`} role="status" aria-live="polite">
          {result.error ? (
            <>
              <ShieldAlert size={16} /> <span>{result.error}</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={16} />
              <span>
                <strong>{result.scenario?.label ?? "演習ケース"}</strong>
                {result.scenario?.summary ? `。${result.scenario.summary}` : ""}
                {result.drillId ? <code> drill {result.drillId}</code> : null}
              </span>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
