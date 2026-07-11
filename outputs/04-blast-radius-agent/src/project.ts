export const project = {
  "rank": 4,
  "ideaNo": "004",
  "name": "Blast Radius Agent",
  "slug": "04-blast-radius-agent",
  "packageName": "blast-radius-agent",
  "role": "change impact forecaster",
  "tagline": "Maps a PR to affected screens, APIs, data, and runbooks.",
  "overview": "Turns a PR diff and service notes into an operational impact forecast before release.",
  "mvp": "A PR impact analyzer that groups touched surfaces, test gaps, and watchpoints for reviewers.",
  "stack": [
    "Cloud Run",
    "Gemini API",
    "Cloud Logging",
    "GitHub Actions"
  ],
  "focusAreas": [
    "affected surfaces",
    "review routing",
    "test gap hints"
  ],
  "metrics": [
    "Surface count",
    "Contract risk",
    "Test coverage"
  ],
  "positive": "LOW RADIUS",
  "caution": "WATCH RADIUS",
  "negative": "HIGH RADIUS",
  "accent": "#be123c",
  "secondary": "#0f766e",
  "sampleTarget": "https://github.com/example/app/pull/211",
  "sampleContext": "PR touches subscription billing, invoice webhooks, and admin exports. Release owner needs an impact map.",
  "sampleSignals": "Diff: billing/plan.ts, webhooks/stripe.ts, admin/export.sql, invoice email copy. Tests: unit coverage added for plan upgrade only. Logs: webhook retries are already noisy. Runbook: billing rollback mentions old flag name."
} as const;

export type ProjectConfig = typeof project;
