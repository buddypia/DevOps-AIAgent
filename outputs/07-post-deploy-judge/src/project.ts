export const project = {
  "rank": 7,
  "ideaNo": "024",
  "name": "Post Deploy Judge",
  "slug": "07-post-deploy-judge",
  "packageName": "post-deploy-judge",
  "role": "post-deployment decision agent",
  "tagline": "Judges the first 15 minutes after deploy.",
  "overview": "Analyzes post-deploy logs and metrics to call success, continued watch, or rollback.",
  "mvp": "A deployment observation board that explains the verdict and creates the next monitoring window.",
  "stack": [
    "Cloud Run",
    "Gemini API",
    "Cloud Logging",
    "Cloud Monitoring"
  ],
  "focusAreas": [
    "post-deploy window",
    "success criteria",
    "rollback trigger"
  ],
  "metrics": [
    "Success confidence",
    "Metric drift",
    "User impact"
  ],
  "positive": "SUCCESS",
  "caution": "WATCH",
  "negative": "ROLLBACK",
  "accent": "#15803d",
  "secondary": "#be123c",
  "sampleTarget": "checkout-api deploy 2026-05-13 10:00 JST",
  "sampleContext": "Revision checkout-api-00153 reached 100% traffic 15 minutes ago. Release owner needs a go/no-go call.",
  "sampleSignals": "First 15 minutes: requests 42k, 5xx 0.6% vs baseline 0.3%, p95 310ms vs baseline 285ms, warning pattern doubled for retry exhaustion. Support tickets: none. Business metric checkout_success down 0.8%."
} as const;

export type ProjectConfig = typeof project;
