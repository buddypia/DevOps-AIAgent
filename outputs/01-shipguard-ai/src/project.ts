export const project = {
  "rank": 1,
  "ideaNo": "001",
  "name": "ShipGuard AI",
  "slug": "01-shipguard-ai",
  "packageName": "shipguard-ai",
  "role": "AI release captain",
  "tagline": "Decides Ship, Watch, or Block from PR, CI, and Cloud Run evidence.",
  "overview": "Reads PR, CI, deployment, and Cloud Run signal fragments to produce a release verdict and next actions.",
  "mvp": "A web app where a GitHub PR URL, CI summary, and Cloud Run logs become a Gemini-backed release report and PR comment draft.",
  "stack": [
    "Cloud Run",
    "Gemini API",
    "Cloud Logging",
    "GitHub Actions"
  ],
  "focusAreas": [
    "release verdict",
    "CI failure clustering",
    "Cloud Run regression signals"
  ],
  "metrics": [
    "Ship risk",
    "Log anomaly",
    "Rollback ease"
  ],
  "positive": "SHIP",
  "caution": "WATCH",
  "negative": "BLOCK",
  "accent": "#0f766e",
  "secondary": "#d97706",
  "sampleTarget": "https://github.com/example/checkout/pull/184",
  "sampleContext": "Checkout API PR changes payment retry handling. Cloud Run service checkout-api in asia-northeast1. Previous revision checkout-api-00152-pak is stable.",
  "sampleSignals": "CI: unit pass, integration pass, e2e flaky retry passed. Diff: payment/retry.ts +82 lines, checkout controller +31. Logs after preview: 3 timeout warnings, no 5xx, p95 latency +18ms. Rollback: previous revision has 100% traffic snapshot."
} as const;

export type ProjectConfig = typeof project;
