import { CircleAlert, ExternalLink, FilePlus2, GitPullRequest, LoaderCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";

import AgentAvatar from "./AgentAvatar.js";

type IssuePreview = { title: string; body: string; markerId: string };
type IssueResult = { created: boolean; duplicate: boolean; number: number; url: string };
type Evaluation = {
  repository: string;
  pullNumber: number;
  pullUrl: string;
  headSha: string;
  baseBranch: string;
  verdict: "ready" | "human_review" | "blocked";
  checks: { total: number; successful: number; pending: number; failed: number };
  approvals: number;
  mergeable: boolean | null;
  mergeState: string;
  highRiskFiles: string[];
  blockers: string[];
  evidence: string[];
  receipt: string;
};

type ErrorBody = { error?: { message?: string } };

async function postJson<T>(path: string, body: unknown, actionToken?: string): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json", ...(actionToken ? { "x-merge-steward-token": actionToken } : {}) },
    body: JSON.stringify(body)
  });
  const data = (await response.json()) as T & ErrorBody;
  if (!response.ok) throw new Error(data.error?.message ?? "処理に失敗しました。");
  return data;
}

function verdictLabel(verdict: Evaluation["verdict"]) {
  if (verdict === "ready") return "READY";
  if (verdict === "human_review") return "HUMAN REVIEW";
  return "BLOCKED";
}

export default function MergeStewardPanel({ configured = false, repository = "-" }: { configured?: boolean; repository?: string }) {
  const [mode, setMode] = useState<"issue" | "pull">("issue");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [problem, setProblem] = useState("");
  const [evidence, setEvidence] = useState("");
  const [acceptance, setAcceptance] = useState("");
  const [preview, setPreview] = useState<IssuePreview | null>(null);
  const [issue, setIssue] = useState<IssueResult | null>(null);
  const [pullNumber, setPullNumber] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [confirming, setConfirming] = useState<"issue" | "merge" | null>(null);
  const [merged, setMerged] = useState<{ sha: string; pullUrl: string } | null>(null);
  const [actionToken, setActionToken] = useState("");

  const issuePayload = {
    title,
    problem,
    evidence: evidence.split("\n").map((item) => item.trim()).filter(Boolean),
    acceptanceCriteria: acceptance.split("\n").map((item) => item.trim()).filter(Boolean)
  };

  function resetFeedback() {
    setMessage("");
    setIssue(null);
    setMerged(null);
    setConfirming(null);
  }

  async function previewIssue() {
    resetFeedback();
    setBusy(true);
    try {
      const data = await postJson<{ preview: IssuePreview }>("/api/merge-steward/issues/preview", issuePayload);
      setPreview(data.preview);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Issue previewに失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  async function createIssue() {
    setBusy(true);
    try {
      const data = await postJson<{ issue: IssueResult }>("/api/merge-steward/issues", { ...issuePayload, confirm: true }, actionToken);
      setIssue(data.issue);
      setConfirming(null);
      setActionToken("");
      setMessage(data.issue.duplicate ? "同じ問題のopen Issueが見つかりました。" : "Issueを作成しました。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Issue作成に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  async function evaluatePull() {
    resetFeedback();
    setEvaluation(null);
    setBusy(true);
    try {
      const data = await postJson<{ evaluation: Evaluation }>("/api/merge-steward/pulls/evaluate", { pullNumber: Number(pullNumber) });
      setEvaluation(data.evaluation);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PR評価に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  async function mergePull() {
    if (!evaluation) return;
    setBusy(true);
    try {
      const data = await postJson<{ result: { sha: string; pullUrl: string } }>(
        "/api/merge-steward/pulls/merge",
        { pullNumber: evaluation.pullNumber, headSha: evaluation.headSha, baseBranch: evaluation.baseBranch, receipt: evaluation.receipt, confirm: true },
        actionToken
      );
      setMerged(data.result);
      setConfirming(null);
      setActionToken("");
      setMessage("squash mergeが完了しました。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "マージに失敗しました。再評価してください。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="merge-steward" className="merge-steward" aria-labelledby="merge-steward-title">
      <div className="merge-steward-head">
        <AgentAvatar agentId="merge-steward" name="マージ執事" color="#0f766e" size={58} />
        <div>
          <p className="section-kicker">GitHub lifecycle agent</p>
          <h2 id="merge-steward-title">Merge Steward</h2>
          <p>問題をIssueへ固定し、PRの証拠を確認。安全条件を満たす変更だけを明示確認後に届けます。</p>
        </div>
        <span className={`merge-connection ${configured ? "is-ready" : ""}`}>{configured ? "GitHub 接続済み" : "GitHub 読取のみ"}</span>
      </div>

      <div className="merge-policy"><ShieldCheck size={17} /> AIは保護ルールを迂回しません。deterministic gateが最終可否を決めます。</div>

      {configured ? (
        <label className="merge-action-token">
          <span>実行承認コード</span>
          <input
            type="password"
            autoComplete="off"
            value={actionToken}
            onChange={(event) => setActionToken(event.target.value)}
            placeholder="Issue作成・マージ時だけ使用"
            aria-describedby="merge-action-token-note"
          />
          <small id="merge-action-token-note">GitHub tokenとは別の操作コードです。サーバーは保存・表示しません。</small>
        </label>
      ) : null}

      <div className="merge-tabs" role="tablist" aria-label="Merge Steward操作">
        <button type="button" role="tab" aria-selected={mode === "issue"} className={mode === "issue" ? "is-active" : ""} onClick={() => setMode("issue")}>
          <FilePlus2 size={16} /> Issue化
        </button>
        <button type="button" role="tab" aria-selected={mode === "pull"} className={mode === "pull" ? "is-active" : ""} onClick={() => setMode("pull")}>
          <GitPullRequest size={16} /> PR評価
        </button>
      </div>

      {mode === "issue" ? (
        <div className="merge-grid" role="tabpanel">
          <div className="merge-form">
            <label>問題タイトル<input value={title} maxLength={160} onChange={(event) => { setTitle(event.target.value); setPreview(null); }} placeholder="例: デプロイ後にhealthzが503" /></label>
            <label>問題<textarea value={problem} maxLength={4000} onChange={(event) => { setProblem(event.target.value); setPreview(null); }} placeholder="何が起きているか" rows={4} /></label>
            <label>証拠（1行1件）<textarea value={evidence} onChange={(event) => { setEvidence(event.target.value); setPreview(null); }} placeholder="Cloud Run revision…" rows={3} /></label>
            <label>受入条件（1行1件）<textarea value={acceptance} onChange={(event) => { setAcceptance(event.target.value); setPreview(null); }} placeholder="healthzが200を返す" rows={3} /></label>
            <button className="btn-primary" type="button" onClick={previewIssue} disabled={busy}>{busy ? "確認中…" : "Issue本文をプレビュー"}</button>
          </div>
          <div className="merge-result" aria-live="polite">
            {preview ? (
              <>
                <span className="merge-verdict is-preview">PREVIEW</span>
                <h3>{preview.title}</h3>
                <pre>{preview.body}</pre>
                {confirming === "issue" ? (
                  <div className="merge-confirm"><p><strong>{repository}</strong> にIssueを作成します。</p><div><button className="btn-secondary" type="button" onClick={() => setConfirming(null)}>戻る</button><button className="btn-primary" type="button" onClick={createIssue} disabled={busy || !actionToken}>作成を確認</button></div></div>
                ) : <button className="btn-primary" type="button" onClick={() => setConfirming("issue")} disabled={!configured}>Issue作成へ</button>}
              </>
            ) : <div className="merge-empty"><FilePlus2 size={28} /><p>問題・証拠・受入条件を入力すると、書き込み前にIssue本文を確認できます。</p></div>}
          </div>
        </div>
      ) : (
        <div className="merge-grid" role="tabpanel">
          <div className="merge-form">
            <label>Pull Request番号<input type="number" min="1" value={pullNumber} onChange={(event) => setPullNumber(event.target.value)} placeholder="57" /></label>
            <button className="btn-primary" type="button" onClick={evaluatePull} disabled={busy || !pullNumber}>{busy ? "証拠を確認中…" : "変更を評価"}</button>
            <p className="merge-form-note">files → checks → reviews → mergeability → head SHAの順で確認します。</p>
          </div>
          <div className="merge-result" aria-live="polite">
            {busy ? <div className="merge-empty"><LoaderCircle className="spin" size={28} /><p>GitHubの変更・CI・レビューを確認中です。</p></div> : evaluation ? (
              <>
                <span className={`merge-verdict is-${evaluation.verdict}`}>{verdictLabel(evaluation.verdict)}</span>
                <div className="merge-metrics">
                  <span><strong>{evaluation.checks.successful}/{evaluation.checks.total}</strong> checks</span>
                  <span><strong>{evaluation.approvals}</strong> approvals</span>
                  <span><strong>{evaluation.highRiskFiles.length}</strong> risk files</span>
                  <span><strong>{evaluation.mergeable ? "yes" : "no"}</strong> mergeable</span>
                  <span><strong>{evaluation.mergeState}</strong> GitHub state</span>
                </div>
                <code className="merge-receipt">receipt {evaluation.receipt.slice(0, 16)}… / head {evaluation.headSha.slice(0, 12)}</code>
                {evaluation.blockers.length > 0 ? <ul className="merge-blockers">{evaluation.blockers.map((blocker) => <li key={blocker}><CircleAlert size={14} /> {blocker}</li>)}</ul> : null}
                {evaluation.verdict === "ready" && !merged ? confirming === "merge" ? (
                  <div className="merge-confirm"><p><strong>PR #{evaluation.pullNumber}</strong> を <strong>{evaluation.baseBranch}</strong> へhead SHA固定でsquash mergeします。</p><div><button className="btn-secondary" type="button" onClick={() => setConfirming(null)}>戻る</button><button className="btn-primary" type="button" onClick={mergePull} disabled={busy || !configured || !actionToken}>マージを確認</button></div></div>
                ) : <button className="btn-primary" type="button" onClick={() => setConfirming("merge")}>squash mergeへ</button> : null}
                <a className="merge-link" href={evaluation.pullUrl} target="_blank" rel="noreferrer">GitHubで確認 <ExternalLink size={13} /></a>
              </>
            ) : <div className="merge-empty"><GitPullRequest size={28} /><p>既存PRの番号を入力すると、マージ可否と阻害条件を証拠付きで確認できます。</p></div>}
          </div>
        </div>
      )}

      {message ? <p className={issue || merged ? "merge-message is-success" : "merge-message"}>{message}{issue ? <> <a href={issue.url} target="_blank" rel="noreferrer">Issue #{issue.number} <ExternalLink size={12} /></a></> : null}</p> : null}
    </section>
  );
}
