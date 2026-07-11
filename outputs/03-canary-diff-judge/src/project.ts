export const project = {
  "rank": 3,
  "ideaNo": "002",
  "name": "Canary Diff Judge",
  "slug": "03-canary-diff-judge",
  "packageName": "canary-diff-judge",
  "role": "canary promotion judge",
  "tagline": "Compares revisions and decides promote, hold, or rollback.",
  "overview": "Reads old/new Cloud Run revision data, log deltas, latency changes, and error rates to judge canary promotion.",
  "mvp": "A dashboard that receives canary evidence and returns a promotion verdict with traffic-shift instructions.",
  "stack": [
    "Cloud Run",
    "Gemini API",
    "Cloud Logging",
    "Cloud Monitoring"
  ],
  "focusAreas": [
    "revision comparison",
    "traffic split",
    "rollback threshold"
  ],
  "metrics": [
    "Canary health",
    "Latency delta",
    "Error delta"
  ],
  "positive": "PROMOTE",
  "caution": "HOLD",
  "negative": "ROLLBACK",
  "accent": "#7c3aed",
  "secondary": "#059669",
  "sampleTarget": "cloud-run://checkout-api/revisions/00152..00153",
  "sampleContext": "New revision is serving 10% traffic. Goal is to decide whether to move to 50% or roll back.",
  "sampleSignals": "Old revision: 0.3% 5xx, p95 280ms, 2 warning patterns. New revision: 0.7% 5xx, p95 318ms, new warning 'payment retry exhausted' 14 times, no customer tickets."
} as const;

export type ProjectConfig = typeof project;
