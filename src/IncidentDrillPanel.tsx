import { useState } from "react";
import { ArrowRight, Ban, CheckCircle2, Cloud, FlaskConical, ListChecks, ShieldAlert } from "lucide-react";

type DrillScenario = {
  id: string;
  label: string;
  severity: "ERROR" | "WARNING";
  summary: string;
  targetService: string;
  baseline: string;
  observableChange: string;
  expectedDetection: string;
  signals: Array<{ role: "primary" | "secondary"; severity: "ERROR" | "WARNING"; message: string }>;
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
            <FlaskConical size={20} /> 安全なインシデント演習
          </h2>
          <p className="drill-lede">
            本番データや決済APIには触れず、観測データだけを変化させます。変わった内容と、次に確認する場所まで追えます。
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

      <div className="drill-what-changes">
        <div className="drill-what-changes-head">
          <div>
            <p className="drill-eyebrow">何が変わるか</p>
            <strong>変わるのは、観測データだけ</strong>
          </div>
          <p>「ログが増えた」で終わらず、どの信号を作り、誰が何を確かめるかをつなげます。</p>
        </div>
        <div className="drill-change-flow" aria-label="模擬インシデントで変わるもの">
          <div className="drill-change-card">
            <span className="drill-change-tag is-stable"><Ban size={13} /> 変わらない</span>
            <strong>サービス本体</strong>
            <p>リクエスト処理、決済、DB、外部APIは操作しません。</p>
          </div>
          <ArrowRight className="drill-change-arrow" size={18} aria-hidden="true" />
          <div className="drill-change-card is-focus">
            <span className="drill-change-tag"><Cloud size={13} /> 追加される</span>
            <strong>Cloud Logging</strong>
            <p>選ばれた障害シナリオの合成イベントを2件記録します。</p>
          </div>
          <ArrowRight className="drill-change-arrow" size={18} aria-hidden="true" />
          <div className="drill-change-card">
            <span className="drill-change-tag is-next"><ListChecks size={13} /> 確認する</span>
            <strong>Cloud Run SRE</strong>
            <p>約15秒後に信号を拾い、原因候補と対応を確認します。</p>
          </div>
        </div>
      </div>

      <div className="drill-layout">
        <div className="drill-steps" aria-label="模擬デモの手順">
          <div className="drill-step">
            <span className="drill-step-index">01</span>
            <div>
              <strong>シナリオを選ぶ</strong>
              <p>レイテンシ、キュー、ログ配送から1つを自動選択します。</p>
            </div>
          </div>
          <div className="drill-step">
            <span className="drill-step-index">02</span>
            <div>
              <strong>2つの信号を記録</strong>
              <p>主原因の信号と、波及した信号をCloud Loggingへ追加します。</p>
            </div>
          </div>
          <div className="drill-step">
            <span className="drill-step-index">03</span>
            <div>
              <strong>変化を確認する</strong>
              <p>対象サービス、変化、SREが次に見る場所を結果で確認できます。</p>
            </div>
          </div>
        </div>

        <div className="drill-action">
          <div className="drill-action-icon" aria-hidden="true"><FlaskConical size={22} /></div>
          <p className="drill-action-label">演習のトリガー</p>
          <strong>障害シナリオを開始する</strong>
          <button type="button" className="btn-demo" onClick={runDrill} disabled={busy}>
            <Cloud size={16} /> {busy ? "演習を記録中..." : "障害演習を開始"}
          </button>
          <small>1分に1回まで。サービス停止、外部API呼び出し、決済データ変更はありません。</small>
        </div>
      </div>

      {result ? (
        <div className={`drill-result${result.error ? " is-error" : ""}`} role="status" aria-live="polite">
          {result.error ? (
            <>
              <ShieldAlert size={16} /> <span>{result.error}</span>
            </>
          ) : (
            <div className="drill-result-success">
              <div className="drill-result-head">
                <CheckCircle2 size={18} />
                <div>
                  <strong>演習を記録しました</strong>
                  <p>{result.scenario?.label ?? "演習ケース"} / 対象 {result.scenario?.targetService ?? "-"}</p>
                </div>
                {result.drillId ? <code>drill {result.drillId}</code> : null}
              </div>
              {result.scenario ? (
                <>
                  <div className="drill-result-grid">
                    <div className="drill-result-block">
                      <span className="drill-result-label">演習前の前提</span>
                      <p>{result.scenario.baseline}</p>
                    </div>
                    <div className="drill-result-block is-change">
                      <span className="drill-result-label">何が変わったか</span>
                      <p>{result.scenario.observableChange}</p>
                    </div>
                    <div className="drill-result-block is-next">
                      <span className="drill-result-label">次に確認すること</span>
                      <p>{result.scenario.expectedDetection}</p>
                    </div>
                  </div>
                  <div className="drill-signals">
                    <div className="drill-signals-head">
                      <span>Cloud Loggingに追加した信号</span>
                      <strong>{result.scenario.signals.length}件</strong>
                    </div>
                    {result.scenario.signals.map((signal) => (
                      <div className="drill-signal" key={`${signal.role}-${signal.message}`}>
                        <span className={`drill-signal-severity is-${signal.severity.toLowerCase()}`}>{signal.severity}</span>
                        <code>{signal.message}</code>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
              <p className="drill-result-note"><Cloud size={14} /> {result.note ?? result.scenario?.summary}</p>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
