import "./styles.css";

type ProjectPayload = {
  rank: number;
  ideaNo: string;
  name: string;
  tagline: string;
  packageName: string;
  overview: string;
  mvp: string;
  stack: string[];
  focusAreas: string[];
  metrics: string[];
  positive: string;
  caution: string;
  negative: string;
  accent: string;
  secondary: string;
  sampleTarget: string;
  sampleContext: string;
  sampleSignals: string;
  defaultModel: string;
};

type DecisionMode = "conservative" | "balanced" | "aggressive";

type AnalyzeInput = {
  target: string;
  context: string;
  signals: string;
  mode: DecisionMode;
  evidenceWindow: string;
  operatorNote: string;
};

type Analysis = {
  decision: string;
  confidence: number;
  executiveSummary: string;
  summary: string;
  risks: string[];
  actions: Array<{ title: string; owner: string; priority: string }>;
  evidence: Array<{ label: string; value: string; weight: number }>;
  verificationCommands: string[];
  handoffChecklist: string[];
  automationPlan: string[];
  runbookPatch: string;
  commentDraft: string;
  source: string;
  model: string;
  mode: DecisionMode;
};

type Scenario = AnalyzeInput & {
  id: string;
  label: string;
  description: string;
};

type HistoryRecord = {
  id: string;
  createdAt: string;
  input: AnalyzeInput;
  result: Analysis;
};

const app = document.querySelector<HTMLDivElement>("#app")!;

let currentProject: ProjectPayload | undefined;
let currentRecord: HistoryRecord | undefined;

function escapeHtml(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function list(items: string[]) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function storageKey(project: ProjectPayload) {
  return `mvp-history:${project.packageName}`;
}

function loadHistory(project: ProjectPayload): HistoryRecord[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey(project)) || "[]") as HistoryRecord[];
  } catch {
    return [];
  }
}

function saveHistory(project: ProjectPayload, records: HistoryRecord[]) {
  localStorage.setItem(storageKey(project), JSON.stringify(records.slice(0, 8)));
}

function scenarios(project: ProjectPayload): Scenario[] {
  return [
    {
      id: "baseline",
      label: "Baseline",
      description: "安定している時の判断を確認する",
      target: project.sampleTarget,
      context: project.sampleContext,
      signals: `${project.sampleSignals}\nHealthy baseline: no customer tickets, no new critical warnings, rollback path verified, owner is available.`,
      mode: "balanced",
      evidenceWindow: "Latest deploy or incident window",
      operatorNote: "Use this as the first demo path.",
    },
    {
      id: "watch",
      label: "Watch",
      description: "判断が割れそうな中間ケースを試す",
      target: `${project.sampleTarget} / watch scenario`,
      context: `${project.sampleContext}\nA stakeholder asks whether this can proceed before the next update window.`,
      signals: `${project.sampleSignals}\nWatch signals: intermittent warnings, one missing owner, p95 latency slightly above baseline, no confirmed customer impact yet.`,
      mode: "conservative",
      evidenceWindow: "15 minute observation window",
      operatorNote: "Prefer a cautious recommendation unless evidence is complete.",
    },
    {
      id: "critical",
      label: "Critical",
      description: "止める・戻す判断のデモに使う",
      target: `${project.sampleTarget} / critical scenario`,
      context: `${project.sampleContext}\nDecision must be made before the next public status update.`,
      signals: `${project.sampleSignals}\nCritical signals: 5xx spike, failed checks, missing rollback confirmation, customer-facing degradation, owner is not assigned.`,
      mode: "conservative",
      evidenceWindow: "Current production incident window",
      operatorNote: "Escalate if irreversible or customer-facing risk is present.",
    },
  ];
}

function readForm(): AnalyzeInput | undefined {
  const form = document.querySelector<HTMLFormElement>("#analysis-form");
  if (!form) return undefined;
  const data = new FormData(form);
  return {
    target: String(data.get("target") || ""),
    context: String(data.get("context") || ""),
    signals: String(data.get("signals") || ""),
    mode: String(data.get("mode") || "balanced") as DecisionMode,
    evidenceWindow: String(data.get("evidenceWindow") || ""),
    operatorNote: String(data.get("operatorNote") || ""),
  };
}

function writeForm(input: AnalyzeInput) {
  const form = document.querySelector<HTMLFormElement>("#analysis-form");
  if (!form) return;
  (form.elements.namedItem("target") as HTMLInputElement).value = input.target;
  (form.elements.namedItem("context") as HTMLTextAreaElement).value = input.context;
  (form.elements.namedItem("signals") as HTMLTextAreaElement).value = input.signals;
  (form.elements.namedItem("mode") as HTMLSelectElement).value = input.mode;
  (form.elements.namedItem("evidenceWindow") as HTMLInputElement).value = input.evidenceWindow;
  (form.elements.namedItem("operatorNote") as HTMLTextAreaElement).value = input.operatorNote;
}

function evidenceBars(evidence: Analysis["evidence"]) {
  return evidence
    .map(
      (item) => `
        <div class="evidence">
          <div class="evidence-row">
            <span>${escapeHtml(item.label)}</span>
            <strong>${escapeHtml(item.value)}</strong>
          </div>
          <div class="bar" aria-label="${escapeHtml(item.label)} ${item.weight}%">
            <span style="width: ${Math.max(0, Math.min(100, item.weight))}%"></span>
          </div>
        </div>`,
    )
    .join("");
}

function actionRows(actions: Analysis["actions"]) {
  return actions
    .map(
      (action) => `
        <tr>
          <td><span class="priority">${escapeHtml(action.priority)}</span></td>
          <td>${escapeHtml(action.title)}</td>
          <td>${escapeHtml(action.owner)}</td>
        </tr>`,
    )
    .join("");
}

function resultMarkup(record?: HistoryRecord) {
  if (!record) {
    return `
      <div class="empty-state">
        <strong>Ready for operational evidence</strong>
        <p>サンプルを選ぶか、PR・ログ・メトリクスを貼って分析を実行してください。</p>
      </div>`;
  }

  const result = record.result;
  return `
    <div class="decision-strip">
      <div>
        <span class="eyebrow">Decision</span>
        <strong>${escapeHtml(result.decision)}</strong>
      </div>
      <div>
        <span class="eyebrow">Confidence</span>
        <strong>${result.confidence}%</strong>
      </div>
      <div>
        <span class="eyebrow">Mode / Source</span>
        <strong>${escapeHtml(result.mode)} / ${escapeHtml(result.source)}</strong>
      </div>
    </div>
    <p class="summary">${escapeHtml(result.executiveSummary || result.summary)}</p>
    <section class="result-section">
      <h2>Evidence Weights</h2>
      ${evidenceBars(result.evidence)}
    </section>
    <section class="result-section">
      <h2>Next Actions</h2>
      <table>
        <thead><tr><th>Priority</th><th>Action</th><th>Owner</th></tr></thead>
        <tbody>${actionRows(result.actions)}</tbody>
      </table>
    </section>
    <section class="result-grid">
      <div>
        <h2>Risks</h2>
        <ul>${list(result.risks)}</ul>
      </div>
      <div>
        <h2>Handoff Checklist</h2>
        <ul>${list(result.handoffChecklist)}</ul>
      </div>
    </section>
    <section class="result-grid">
      <div>
        <h2>Verification Commands</h2>
        <pre>${escapeHtml(result.verificationCommands.join("\n"))}</pre>
      </div>
      <div>
        <h2>Automation Plan</h2>
        <ol>${list(result.automationPlan)}</ol>
      </div>
    </section>
    <section class="result-section">
      <h2>Runbook Patch</h2>
      <pre>${escapeHtml(result.runbookPatch)}</pre>
    </section>
    <section class="result-section">
      <h2>Comment Draft</h2>
      <pre>${escapeHtml(result.commentDraft)}</pre>
    </section>`;
}

function markdownReport(record: HistoryRecord, project: ProjectPayload) {
  const r = record.result;
  return [
    `# ${project.name} Decision Report`,
    "",
    `- Created: ${record.createdAt}`,
    `- Target: ${record.input.target}`,
    `- Decision: ${r.decision}`,
    `- Confidence: ${r.confidence}%`,
    `- Mode: ${r.mode}`,
    `- Source: ${r.source}`,
    "",
    "## Summary",
    r.summary,
    "",
    "## Evidence",
    ...r.evidence.map((item) => `- ${item.label}: ${item.value} (${item.weight}%)`),
    "",
    "## Risks",
    ...r.risks.map((item) => `- ${item}`),
    "",
    "## Actions",
    ...r.actions.map((item) => `- [${item.priority}] ${item.title} (${item.owner})`),
    "",
    "## Verification Commands",
    "```bash",
    ...r.verificationCommands,
    "```",
    "",
    "## Handoff Checklist",
    ...r.handoffChecklist.map((item) => `- [ ] ${item}`),
    "",
    "## Runbook Patch",
    r.runbookPatch,
    "",
    "## Comment Draft",
    r.commentDraft,
  ].join("\n");
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

function updateResult(project: ProjectPayload, record?: HistoryRecord) {
  currentRecord = record;
  const output = document.querySelector<HTMLElement>("#result");
  if (output) output.innerHTML = resultMarkup(record);
  renderHistory(project);
  document.querySelectorAll<HTMLButtonElement>("[data-result-action]").forEach((button) => {
    button.disabled = !record;
  });
}

function renderHistory(project: ProjectPayload) {
  const history = loadHistory(project);
  const node = document.querySelector<HTMLElement>("#history-list");
  const count = document.querySelector<HTMLElement>("#history-count");
  if (count) count.textContent = String(history.length);
  if (!node) return;
  node.innerHTML = history.length
    ? history
        .map(
          (record) => `
          <button class="history-item" type="button" data-history-id="${escapeHtml(record.id)}">
            <span>${escapeHtml(record.result.decision)}</span>
            <strong>${escapeHtml(record.input.target)}</strong>
            <small>${escapeHtml(new Date(record.createdAt).toLocaleString())}</small>
          </button>`,
        )
        .join("")
    : '<p class="muted">まだ履歴はありません。</p>';
}

async function postAnalysis(project: ProjectPayload) {
  const input = readForm();
  const output = document.querySelector<HTMLElement>("#result");
  const button = document.querySelector<HTMLButtonElement>("#run-button");
  if (!input || !output || !button) return;

  button.disabled = true;
  button.textContent = "Analyzing";
  output.innerHTML = '<div class="empty-state"><strong>Analyzing evidence</strong><p>Geminiまたはローカルフォールバックで判断中です。</p></div>';

  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.text();
    output.innerHTML = `<div class="empty-state error"><strong>Analysis failed</strong><p>${escapeHtml(error)}</p></div>`;
  } else {
    const result = (await response.json()) as Analysis;
    const record: HistoryRecord = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      input,
      result,
    };
    const history = [record, ...loadHistory(project)];
    saveHistory(project, history);
    updateResult(project, record);
  }

  button.disabled = false;
  button.textContent = `Run ${project.name}`;
}

function render(project: ProjectPayload) {
  const projectScenarios = scenarios(project);
  document.documentElement.style.setProperty("--accent", project.accent);
  document.documentElement.style.setProperty("--secondary", project.secondary);
  document.title = project.name;

  app.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <div>
          <span class="eyebrow">Rank ${project.rank} / Idea ${escapeHtml(project.ideaNo)}</span>
          <h1>${escapeHtml(project.name)}</h1>
          <p>${escapeHtml(project.tagline)}</p>
        </div>
        <div class="model-pill">
          <span>Gemini model</span>
          <strong>${escapeHtml(project.defaultModel)}</strong>
          <small>History: <span id="history-count">0</span></small>
        </div>
      </header>

      <main class="workspace">
        <section class="panel input-panel">
          <div class="panel-heading">
            <h2>Evidence Intake</h2>
            <button class="ghost" type="button" id="clear-button">Clear</button>
          </div>
          <div class="scenario-row">
            ${projectScenarios
              .map(
                (scenario) => `
                  <button type="button" class="scenario-button" data-scenario="${escapeHtml(scenario.id)}">
                    <strong>${escapeHtml(scenario.label)}</strong>
                    <span>${escapeHtml(scenario.description)}</span>
                  </button>`,
              )
              .join("")}
          </div>
          <form id="analysis-form">
            <label>
              <span>Target</span>
              <input name="target" value="${escapeHtml(projectScenarios[0].target)}" />
            </label>
            <div class="form-grid">
              <label>
                <span>Decision Mode</span>
                <select name="mode">
                  <option value="conservative">Conservative</option>
                  <option value="balanced" selected>Balanced</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </label>
              <label>
                <span>Evidence Window</span>
                <input name="evidenceWindow" value="${escapeHtml(projectScenarios[0].evidenceWindow)}" />
              </label>
            </div>
            <label>
              <span>Context</span>
              <textarea name="context" rows="7">${escapeHtml(projectScenarios[0].context)}</textarea>
            </label>
            <label>
              <span>Signals</span>
              <textarea name="signals" rows="10">${escapeHtml(projectScenarios[0].signals)}</textarea>
            </label>
            <label>
              <span>Operator Note</span>
              <textarea name="operatorNote" rows="4">${escapeHtml(projectScenarios[0].operatorNote)}</textarea>
            </label>
            <button id="run-button" type="submit">Run ${escapeHtml(project.name)}</button>
          </form>
        </section>

        <section class="panel result-panel">
          <div class="panel-heading sticky-heading">
            <h2>Agent Output</h2>
            <div class="button-row">
              <button class="ghost" type="button" data-result-action id="copy-comment" disabled>Copy Comment</button>
              <button class="ghost" type="button" data-result-action id="copy-markdown" disabled>Copy Report</button>
              <button class="ghost" type="button" data-result-action id="download-json" disabled>JSON</button>
            </div>
          </div>
          <div id="result">${resultMarkup()}</div>
        </section>

        <aside class="rail">
          <section>
            <h2>Readiness Checklist</h2>
            <ul>${list([
              `Target evidence for ${project.focusAreas[0]}`,
              `Owner for ${project.focusAreas[1] || "next action"}`,
              `Stop condition for ${project.negative}`,
              "Stakeholder update channel",
            ])}</ul>
          </section>
          <section>
            <h2>Decision Labels</h2>
            <div class="label-stack">
              <span>${escapeHtml(project.positive)}</span>
              <span>${escapeHtml(project.caution)}</span>
              <span>${escapeHtml(project.negative)}</span>
            </div>
          </section>
          <section>
            <h2>Metrics</h2>
            <ul>${list(project.metrics)}</ul>
          </section>
          <section>
            <h2>Stack</h2>
            <ul>${list(project.stack)}</ul>
          </section>
          <section>
            <h2>History</h2>
            <div id="history-list"></div>
          </section>
        </aside>
      </main>
    </div>`;

  document.querySelector("#analysis-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    void postAnalysis(project);
  });

  document.querySelectorAll<HTMLButtonElement>("[data-scenario]").forEach((button) => {
    button.addEventListener("click", () => {
      const scenario = projectScenarios.find((item) => item.id === button.dataset.scenario);
      if (scenario) writeForm(scenario);
    });
  });

  document.querySelector("#clear-button")?.addEventListener("click", () => {
    writeForm({
      target: "",
      context: "",
      signals: "",
      mode: "balanced",
      evidenceWindow: "",
      operatorNote: "",
    });
  });

  document.querySelector("#history-list")?.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>("[data-history-id]");
    if (!button) return;
    const record = loadHistory(project).find((item) => item.id === button.dataset.historyId);
    if (!record) return;
    writeForm(record.input);
    updateResult(project, record);
  });

  document.querySelector("#copy-comment")?.addEventListener("click", () => {
    if (currentRecord) void copyText(currentRecord.result.commentDraft);
  });

  document.querySelector("#copy-markdown")?.addEventListener("click", () => {
    if (currentRecord) void copyText(markdownReport(currentRecord, project));
  });

  document.querySelector("#download-json")?.addEventListener("click", () => {
    if (!currentRecord) return;
    const blob = new Blob([JSON.stringify(currentRecord, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.packageName}-decision.json`;
    link.click();
    URL.revokeObjectURL(url);
  });

  renderHistory(project);
}

async function boot() {
  const response = await fetch("/api/project");
  currentProject = (await response.json()) as ProjectPayload;
  render(currentProject);
}

void boot().catch((error) => {
  app.innerHTML = `<main class="fatal"><h1>Startup failed</h1><p>${escapeHtml(String(error))}</p></main>`;
});
