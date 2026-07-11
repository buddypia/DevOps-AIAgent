import { useState } from "react";
import { Braces, Clock3, ListChecks } from "lucide-react";

export type ResultLogEntry = {
  at: string;
  label: string;
  detail: string;
  tone?: "default" | "error" | "success" | "warning";
};

type ResultInspectorProps = {
  data: unknown;
  logs: ResultLogEntry[];
};

function formatJson(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2) ?? "データがありません。";
  } catch {
    return "この結果はJSONとして表示できません。";
  }
}

export default function ResultInspector({ data, logs }: ResultInspectorProps) {
  const [view, setView] = useState<"logs" | "json">("logs");

  return (
    <section className="result-inspector" aria-label="実行結果の詳細">
      <div className="result-inspector-head">
        <div>
          <p className="result-inspector-kicker">記録</p>
          <h3>調査の経過とデータ</h3>
          <p>まずは時系列で確認できます。必要な場合だけ、APIが返したJSONを開いてください。</p>
        </div>
        <div className="result-inspector-tabs" role="tablist" aria-label="結果の表示形式">
          <button
            type="button"
            role="tab"
            aria-selected={view === "logs"}
            className={view === "logs" ? "is-active" : ""}
            onClick={() => setView("logs")}
          >
            <ListChecks size={14} /> 実行ログ
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "json"}
            className={view === "json" ? "is-active" : ""}
            onClick={() => setView("json")}
          >
            <Braces size={14} /> JSON
          </button>
        </div>
      </div>

      {view === "logs" ? (
        <ol className="result-log-list">
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <li key={`${log.at}-${log.label}-${index}`} className={`result-log-row result-log-${log.tone ?? "default"}`}>
                <span className="result-log-marker" aria-hidden="true" />
                <time dateTime={log.at}>
                  <Clock3 size={12} /> {new Date(log.at).toLocaleTimeString("ja-JP")}
                </time>
                <div>
                  <strong>{log.label}</strong>
                  <p>{log.detail}</p>
                </div>
              </li>
            ))
          ) : (
            <li className="result-log-empty">まだ記録がありません。</li>
          )}
        </ol>
      ) : (
        <pre className="result-json"><code>{formatJson(data)}</code></pre>
      )}
    </section>
  );
}
