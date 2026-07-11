export const project = {
  "rank": 11,
  "ideaNo": "126",
  "name": "Runbook Decay Detector",
  "slug": "11-runbook-decay-detector",
  "packageName": "runbook-decay-detector",
  "role": "runbook freshness agent",
  "tagline": "Finds stale commands, URLs, env vars, and ownership in runbooks.",
  "overview": "Compares runbook text with current repo and deployment evidence to generate a repair plan.",
  "mvp": "A runbook review app that marks decay points and drafts a documentation PR comment.",
  "stack": [
    "Cloud Run",
    "Gemini API",
    "GitHub Actions"
  ],
  "focusAreas": [
    "command freshness",
    "env var drift",
    "owner drift"
  ],
  "metrics": [
    "Freshness",
    "Command validity",
    "Ownership clarity"
  ],
  "positive": "FRESH",
  "caution": "PATCH DOCS",
  "negative": "STALE",
  "accent": "#0f766e",
  "secondary": "#7c2d12",
  "sampleTarget": "docs/runbooks/payment-timeout.md",
  "sampleContext": "Runbook has not been edited for four months. Service migrated from payment-api to checkout-api.",
  "sampleSignals": "Runbook command references gcloud run services update payment-api. Current service is checkout-api. Env var PAYMENT_TIMEOUT_MS renamed CHECKOUT_PAYMENT_TIMEOUT_MS. Pager rotation owner listed as old Slack channel #payments-ops."
} as const;

export type ProjectConfig = typeof project;
