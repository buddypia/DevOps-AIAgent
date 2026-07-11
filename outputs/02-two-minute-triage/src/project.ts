export const project = {
  "rank": 2,
  "ideaNo": "026",
  "name": "Two Minute Triage",
  "slug": "02-two-minute-triage",
  "packageName": "two-minute-triage",
  "role": "incident first-response agent",
  "tagline": "Finds the three things worth checking in the first two minutes.",
  "overview": "Compresses Cloud Logging, Monitoring, and recent PR hints into the smallest useful initial incident plan.",
  "mvp": "A triage console that ranks evidence, names the likely first owner, and produces a two-minute action script.",
  "stack": [
    "Cloud Run",
    "Gemini API",
    "GitHub Actions"
  ],
  "focusAreas": [
    "first signal selection",
    "owner routing",
    "noise reduction"
  ],
  "metrics": [
    "Urgency",
    "Signal clarity",
    "Owner confidence"
  ],
  "positive": "STABILIZE",
  "caution": "INVESTIGATE",
  "negative": "ESCALATE",
  "accent": "#1d4ed8",
  "secondary": "#dc2626",
  "sampleTarget": "checkout-api incident 2026-05-13T09:42:00+09:00",
  "sampleContext": "PagerDuty fired for checkout-api. Engineers have two minutes before customer support joins the bridge.",
  "sampleSignals": "Cloud Logging: 5xx jumped from 0.2% to 4.9% after revision checkout-api-00153. Monitoring: p99 latency 3.8s, CPU 42%, DB connections normal. Recent PRs: retry policy merged 17 minutes ago, feature flag checkout_retry_v2 enabled for 25%."
} as const;

export type ProjectConfig = typeof project;
