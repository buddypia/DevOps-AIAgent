import "./styles.css";

type ProjectPayload = {
  rank: number;
  ideaNo: string;
  name: string;
  tagline: string;
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

type Analysis = {
  decision: string;
  confidence: number;
  summary: string;
  risks: string[];
  actions: Array<{ title: string; owner: string; priority: string }>;
  evidence: Array<{ label: string; value: string; weight: number }>;
  automationPlan: string[];
  commentDraft: string;
  source: string;
  model: string;
};

const app = document.querySelector<HTMLDivElement>("#app")!;

if (!app) {
  throw new Error("Missing #app");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function list(items: string[]) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
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

function resultMarkup(result?: Analysis) {
  if (!result) {
    return `
      <div class="empty-state">
        <p>Awaiting evidence.</p>
      </div>`;
  }

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
        <span class="eyebrow">Source</span>
        <strong>${escapeHtml(result.source)}</strong>
      </div>
    </div>
    <p class="summary">${escapeHtml(result.summary)}</p>
    <section class="result-section">
      <h2>Evidence</h2>
      ${evidenceBars(result.evidence)}
    </section>
    <section class="result-section">
      <h2>Actions</h2>
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
        <h2>Automation</h2>
        <ol>${list(result.automationPlan)}</ol>
      </div>
    </section>
    <section class="result-section">
      <h2>Comment Draft</h2>
      <pre>${escapeHtml(result.commentDraft)}</pre>
    </section>
    <section class="result-section feedback-panel">
      <h2>Product Feedback</h2>
      <p>Record whether this decision was useful enough for a real operating moment.</p>
      <div class="feedback-row">
        <button type="button" class="tool-button" data-feedback-score="1">Useful</button>
        <button type="button" class="tool-button" data-feedback-score="0">Unclear</button>
        <button type="button" class="tool-button" data-feedback-score="-1">Wrong</button>
      </div>
      <textarea id="feedback-note" rows="3" placeholder="What would make this safer or more useful?"></textarea>
    </section>`;
}

async function postAnalysis(project: ProjectPayload) {
  const form = document.querySelector<HTMLFormElement>("#analysis-form");
  const output = document.querySelector<HTMLElement>("#result");
  const button = document.querySelector<HTMLButtonElement>("#run-button");
  if (!form || !output || !button) return;

  button.disabled = true;
  button.textContent = "Running";
  output.innerHTML = '<div class="empty-state"><p>Analyzing operational evidence.</p></div>';

  const data = new FormData(form);
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: apiHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      target: data.get("target"),
      context: data.get("context"),
      signals: data.get("signals"),
    }),
  });

  if (!response.ok) {
    output.innerHTML = '<div class="empty-state error"><p>Analysis failed. Check the API server and input.</p></div>';
  } else {
    const result = (await response.json()) as Analysis;
    output.innerHTML = resultMarkup(result);
  }

  button.disabled = false;
  button.textContent = `Run ${project.name}`;
}

function render(project: ProjectPayload) {
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
          <span>Gemini</span>
          <strong>${escapeHtml(project.defaultModel)}</strong>
        </div>
      </header>

      <main class="workspace">
        <section class="panel input-panel">
          <div class="panel-heading">
            <h2>Evidence Intake</h2>
            <button class="ghost" type="button" id="sample-button">Load Sample</button>
          </div>
          <form id="analysis-form">
            <label>
              <span>Target</span>
              <input name="target" value="${escapeHtml(project.sampleTarget)}" />
            </label>
            <label>
              <span>Context</span>
              <textarea name="context" rows="7">${escapeHtml(project.sampleContext)}</textarea>
            </label>
            <label>
              <span>Signals</span>
              <textarea name="signals" rows="11">${escapeHtml(project.sampleSignals)}</textarea>
            </label>
            <button id="run-button" type="submit">Run ${escapeHtml(project.name)}</button>
          </form>
        </section>

        <section class="panel result-panel">
          <div class="panel-heading">
            <h2>Agent Output</h2>
            <span class="status-chip">${escapeHtml(project.positive)} / ${escapeHtml(project.caution)} / ${escapeHtml(project.negative)}</span>
          </div>
          <div id="result">${resultMarkup()}</div>
        </section>

        <aside class="rail">
          <section>
            <h2>Focus</h2>
            <ul>${list(project.focusAreas)}</ul>
          </section>
          <section>
            <h2>Metrics</h2>
            <ul>${list(project.metrics)}</ul>
          </section>
          <section>
            <h2>Stack</h2>
            <ul>${list(project.stack)}</ul>
          </section>
        </aside>
      </main>
    </div>`;

  document.querySelector("#analysis-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    void postAnalysis(project);
  });

  document.querySelector("#sample-button")?.addEventListener("click", () => {
    const form = document.querySelector<HTMLFormElement>("#analysis-form");
    if (!form) return;
    (form.elements.namedItem("target") as HTMLInputElement).value = project.sampleTarget;
    (form.elements.namedItem("context") as HTMLTextAreaElement).value = project.sampleContext;
    (form.elements.namedItem("signals") as HTMLTextAreaElement).value = project.sampleSignals;
  });
}

async function boot() {
  const response = await fetch("/api/project");
  const project = (await response.json()) as ProjectPayload;
  render(project);
}

void boot().catch((error) => {
  app.innerHTML = `<main class="fatal"><h1>Startup failed</h1><p>${escapeHtml(String(error))}</p></main>`;
});
